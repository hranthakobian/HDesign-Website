"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import LoadingAnimation from "@/components/LoadingAnimation";
import { searchVisualMatches, VisualSearchResult } from "@/lib/visualSearch";
import { calculateSemanticScore } from "@/lib/semanticSearch";

export type SearchTab = 'all' | 'apps' | 'cases' | 'images' | 'fonts' | 'pages';

interface SearchIndexItem {
  id: string;
  type: 'app' | 'case' | 'font' | 'image' | 'page' | 'doc';
  title_hy: string;
  title_en: string;
  subtitle_hy?: string;
  subtitle_en?: string;
  description_hy?: string;
  description_en?: string;
  url: string;
  image?: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { locale } = useI18n();
  const router = useRouter();

  // Search input & state
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [indexItems, setIndexItems] = useState<SearchIndexItem[]>([]);
  const [isLoadingIndex, setIsLoadingIndex] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Combined Multimodal Lens & OCR states
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analysisStatusText, setAnalysisStatusText] = useState("");
  const [lensMatchesMap, setLensMatchesMap] = useState<Map<string, number>>(new Map());
  const [ocrDetectedWords, setOcrDetectedWords] = useState<string[]>([]);
  const [ocrFullText, setOcrFullText] = useState<string>("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch search index on open
  useEffect(() => {
    if (!isOpen) return;

    if (indexItems.length === 0) {
      setIsLoadingIndex(true);
      fetch('/api/search')
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.items)) {
            setIndexItems(data.items);
          }
        })
        .catch(err => console.error('Failed to load search index:', err))
        .finally(() => setIsLoadingIndex(false));
    }

    // Auto-focus input
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    return () => clearTimeout(timer);
  }, [isOpen, indexItems.length]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle global keyboard navigation (ESC, Arrow keys, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (attachedImage) {
          // First press clears attached image
          setAttachedImage(null);
          setLensMatchesMap(new Map());
          setOcrDetectedWords([]);
          setOcrFullText("");
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, attachedImage, onClose]);

  // ══════════════════════════════════════════════════════════════════
  // COMBINED MULTIMODAL LENS & OCR PROCESSING
  // ══════════════════════════════════════════════════════════════════
  const processImageCombined = useCallback(async (imageDataUrl: string) => {
    setAttachedImage(imageDataUrl);
    setIsAnalyzingImage(true);
    setAnalysisStatusText(
      locale === 'hy'
        ? "Վերլուծում ենք պատկերը..."
        : "Analyzing image..."
    );

    // 1. Run Visual Similarity in parallel
    const runVisualSearch = async () => {
      try {
        const candidates = indexItems
          .filter(item => item.image && item.image.trim().length > 0)
          .map(item => ({
            id: item.id,
            title: locale === 'hy' ? item.title_hy : item.title_en,
            url: item.url,
            imageUrl: item.image!,
            category: item.category,
            type: item.type
          }));

        if (candidates.length > 0) {
          const matches = await searchVisualMatches(imageDataUrl, candidates);
          const map = new Map<string, number>();
          matches.forEach(m => {
            map.set(m.id, m.similarity);
          });
          setLensMatchesMap(map);
        }
      } catch (err) {
        console.warn('Lens visual matching error:', err);
      }
    };

    // 2. Run OCR in parallel
    const runOcr = async () => {
      try {
        const res = await fetch('/api/search/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageDataUrl, lang: 'eng+hye' })
        });
        const data = await res.json();
        if (data && data.text) {
          setOcrFullText(data.text);
          setOcrDetectedWords(Array.isArray(data.words) ? data.words : []);
        }
      } catch (err) {
        console.warn('OCR processing error:', err);
      }
    };

    try {
      await Promise.allSettled([runVisualSearch(), runOcr()]);
    } finally {
      setIsAnalyzingImage(false);
      setAnalysisStatusText("");
      inputRef.current?.focus();
    }
  }, [indexItems, locale]);

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      processImageCombined(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        processImageCombined(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Paste (Ctrl+V) anywhere in modal
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              processImageCombined(dataUrl);
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, processImageCombined]);

  // Remove attached image
  const removeAttachedImage = () => {
    setAttachedImage(null);
    setLensMatchesMap(new Map());
    setOcrDetectedWords([]);
    setOcrFullText("");
    inputRef.current?.focus();
  };

  // ══════════════════════════════════════════════════════════════════
  // SEMANTIC & MULTIMODAL FILTERING AND SCORING
  // ══════════════════════════════════════════════════════════════════
  const scoredResults = useMemo(() => {
    const q = query.trim();
    const hasImage = !!attachedImage;
    const hasQuery = q.length > 0;
    const hasOcr = ocrDetectedWords.length > 0;

    // Filter by active category tab first
    const tabFiltered = indexItems.filter(item => {
      if (activeTab === 'apps' && item.type !== 'app') return false;
      if (activeTab === 'cases' && item.type !== 'case') return false;
      if (activeTab === 'images' && item.type !== 'image') return false;
      if (activeTab === 'fonts' && item.type !== 'font') return false;
      if (activeTab === 'pages' && item.type !== 'page' && item.type !== 'doc') return false;
      return true;
    });

    if (!hasQuery && !hasImage && !hasOcr) {
      return tabFiltered.map(item => ({
        item,
        score: 1,
        matchedConcepts: [] as string[],
        isVisualMatch: false,
        visualSimilarity: 0
      }));
    }

    // Score each item semantically
    const scoredList = tabFiltered.map(item => {
      const visualSim = lensMatchesMap.get(item.id) || 0;
      const { score, matchedConcepts } = calculateSemanticScore(
        q,
        item,
        ocrDetectedWords,
        visualSim
      );

      return {
        item,
        score,
        matchedConcepts,
        isVisualMatch: visualSim >= 40,
        visualSimilarity: visualSim
      };
    });

    // Only include items with score > 0
    const filtered = scoredList.filter(s => s.score > 0);

    // Sort descending by relevance score
    filtered.sort((a, b) => b.score - a.score);

    return filtered;
  }, [indexItems, activeTab, query, attachedImage, lensMatchesMap, ocrDetectedWords]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeTab, attachedImage]);

  // Handle Arrow key navigation in search results
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (scoredResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % scoredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + scoredResults.length) % scoredResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = scoredResults[selectedIndex];
      if (selected) {
        onClose();
        router.push(selected.item.url);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (!resultsListRef.current) return;
    const activeEl = resultsListRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const q = query.trim();
    const hasQuery = q.length > 0;
    const hasImage = !!attachedImage;
    const hasOcr = ocrDetectedWords.length > 0;

    const counts = {
      all: 0,
      apps: 0,
      cases: 0,
      images: 0,
      fonts: 0,
      pages: 0
    };

    indexItems.forEach(item => {
      let isMatch = true;
      if (hasQuery || hasImage || hasOcr) {
        const visualSim = lensMatchesMap.get(item.id) || 0;
        const { score } = calculateSemanticScore(q, item, ocrDetectedWords, visualSim);
        isMatch = score > 0;
      }

      if (!isMatch) return;
      counts.all++;
      if (item.type === 'app') counts.apps++;
      else if (item.type === 'case') counts.cases++;
      else if (item.type === 'image') counts.images++;
      else if (item.type === 'font') counts.fonts++;
      else if (item.type === 'page' || item.type === 'doc') counts.pages++;
    });

    return counts;
  }, [indexItems, query, attachedImage, lensMatchesMap, ocrDetectedWords]);

  // Helper to get category icon class
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'app': return 'hd-icon-dashboard';
      case 'case': return 'hd-icon-pencil';
      case 'image': return 'hd-icon-image';
      case 'font': return 'hd-icon-text-cursor';
      case 'doc': return 'hd-icon-info';
      default: return 'hd-icon-home';
    }
  };

  // Helper to get category badge label
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'app': return locale === 'hy' ? 'Հավելված' : 'App';
      case 'case': return locale === 'hy' ? 'Քեյս' : 'Case';
      case 'image': return locale === 'hy' ? 'Պատկեր' : 'Image';
      case 'font': return locale === 'hy' ? 'Տառատեսակ' : 'Font';
      case 'doc': return locale === 'hy' ? 'Փաստաթուղթ' : 'Doc';
      default: return locale === 'hy' ? 'Էջ' : 'Page';
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`hd-search-modal-backdrop ${isDraggingOver ? 'dragging-over' : ''}`}
      onClick={onClose}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className="hd-search-modal-container"
        onClick={e => e.stopPropagation()}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {/* ══════ MODAL TOP SEARCH BAR (MULTIMODAL) ══════ */}
        <div className="hd-search-input-wrapper">
          <span className="hd-icon hd-icon-search search-input-icon" />

          {/* Attached Image Chip (Lens & OCR Combined) */}
          {attachedImage && (
            <div className="search-attached-image-chip" title="Google Lens & OCR Active">
              <img src={attachedImage} alt="Query thumb" className="chip-thumb" />
              <span className="chip-badge">Lens & OCR</span>
              <button
                type="button"
                className="chip-remove-btn"
                onClick={removeAttachedImage}
                title={locale === 'hy' ? 'Հեռացնել պատկերը' : 'Remove Image'}
              >
                ✕
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="text"
            className="hd-search-main-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={
              attachedImage
                ? (locale === 'hy'
                    ? 'Որոնել պատկերով + ավելացնել հարցում կամ տեքստ...'
                    : 'Search with image + add text or keywords...')
                : (locale === 'hy'
                    ? 'Իմաստային որոնում հրապարակվածներում (հավելվածներ, քեյսեր, տառատեսակներ)...'
                    : 'Semantic search in published works, apps, fonts, pages...')
            }
            autoComplete="off"
            spellCheck="false"
          />

          <div className="hd-search-actions-row">
            {/* Camera / Lens Trigger Button */}
            <button
              type="button"
              className={`hd-lens-toggle-btn ${attachedImage ? 'active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              title={
                locale === 'hy'
                  ? 'Որոնել պատկերով (Google Lens & OCR համակցված)'
                  : 'Search with image (Google Lens & OCR combined)'
              }
              aria-label="Upload image"
            >
              <span className="hd-icon hd-icon-camera" />
              <span className="lens-btn-label">Lens & OCR</span>
            </button>

            {/* Clear Query Button */}
            {(query.length > 0 || attachedImage) && (
              <button
                type="button"
                className="hd-search-clear-btn"
                onClick={() => {
                  setQuery('');
                  if (attachedImage) removeAttachedImage();
                  inputRef.current?.focus();
                }}
                title={locale === 'hy' ? 'Մաքրել' : 'Clear'}
              >
                <span className="hd-icon hd-icon-close" />
              </button>
            )}

            {/* ESC Badge */}
            <kbd className="hd-search-esc-badge" onClick={onClose}>ESC</kbd>
          </div>
        </div>

        {/* ══════ MULTIMODAL STATUS & OCR INFO BAR ══════ */}
        {ocrFullText && !isAnalyzingImage && (
          <div className="hd-ocr-detected-bar">
            <span className="hd-icon hd-icon-text-cursor" />
            <span className="ocr-title-label">{locale === 'hy' ? 'Ճանաչված տեքստ պատկերից՝' : 'OCR detected text:'}</span>
            <span className="ocr-text-preview" title={ocrFullText}>
              «{ocrFullText.length > 80 ? ocrFullText.slice(0, 80) + '...' : ocrFullText}»
            </span>
            <button
              type="button"
              className="ocr-use-query-btn"
              onClick={() => {
                setQuery(ocrFullText);
                inputRef.current?.focus();
              }}
            >
              {locale === 'hy' ? 'Կիրառել հարցման մեջ' : 'Set as Query'}
            </button>
          </div>
        )}

        {/* ══════ CATEGORY FILTER TABS ══════ */}
        <div className="hd-search-tabs-row">
          <button
            type="button"
            className={`hd-search-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            {locale === 'hy' ? 'Բոլորը' : 'All'}
            <span className="tab-count">{categoryCounts.all}</span>
          </button>

          <button
            type="button"
            className={`hd-search-tab ${activeTab === 'cases' ? 'active' : ''}`}
            onClick={() => setActiveTab('cases')}
          >
            <span className="hd-icon hd-icon-pencil" />
            {locale === 'hy' ? 'Աշխատանքներ' : 'Works'}
            <span className="tab-count">{categoryCounts.cases}</span>
          </button>

          <button
            type="button"
            className={`hd-search-tab ${activeTab === 'apps' ? 'active' : ''}`}
            onClick={() => setActiveTab('apps')}
          >
            <span className="hd-icon hd-icon-dashboard" />
            {locale === 'hy' ? 'Հավելվածներ' : 'Apps'}
            <span className="tab-count">{categoryCounts.apps}</span>
          </button>

          <button
            type="button"
            className={`hd-search-tab ${activeTab === 'fonts' ? 'active' : ''}`}
            onClick={() => setActiveTab('fonts')}
          >
            <span className="hd-icon hd-icon-text-cursor" />
            {locale === 'hy' ? 'Տառատեսակներ' : 'Fonts'}
            <span className="tab-count">{categoryCounts.fonts}</span>
          </button>

          <button
            type="button"
            className={`hd-search-tab ${activeTab === 'images' ? 'active' : ''}`}
            onClick={() => setActiveTab('images')}
          >
            <span className="hd-icon hd-icon-image" />
            {locale === 'hy' ? 'Պատկերներ' : 'Images'}
            <span className="tab-count">{categoryCounts.images}</span>
          </button>

          <button
            type="button"
            className={`hd-search-tab ${activeTab === 'pages' ? 'active' : ''}`}
            onClick={() => setActiveTab('pages')}
          >
            <span className="hd-icon hd-icon-home" />
            {locale === 'hy' ? 'Էջեր և Docs' : 'Pages & Docs'}
            <span className="tab-count">{categoryCounts.pages}</span>
          </button>
        </div>

        {/* ══════ RESULTS AREA (WITH USER'S LOADING ANIMATION) ══════ */}
        <div ref={resultsListRef} className="hd-search-results-list">
          {isLoadingIndex ? (
            /* User's Custom Loading Animation during index load */
            <div className="hd-custom-loader-container">
              <LoadingAnimation
                fullPage={false}
                message={locale === 'hy' ? 'Բեռնվում է որոնման ինդեքսը...' : 'Loading search index...'}
              />
            </div>
          ) : isAnalyzingImage ? (
            /* User's Custom Loading Animation during Lens & OCR analysis */
            <div className="hd-custom-loader-container">
              <LoadingAnimation
                fullPage={false}
                message={analysisStatusText || (locale === 'hy' ? 'Վերլուծում ենք պատկերը (Lens & OCR)...' : 'Analyzing image with Lens & OCR...')}
              />
            </div>
          ) : scoredResults.length === 0 ? (
            <div className="hd-search-empty-state">
              <span className="hd-icon hd-icon-search empty-icon" />
              <h3>{locale === 'hy' ? 'Հրապարակված արդյունքներ չեն գտնվել' : 'No published results found'}</h3>
              <p>
                {locale === 'hy'
                  ? `«${query || 'ընտրված հարցմամբ'}» համապատասխանող հրապարակված նախագիծ կամ էջ չկա: Փորձեք իմաստային այլ բառ (օր․՝ «լոգո», «պաստառ», «հավելված», «տառատեսակ») կամ ներբեռնեք պատկեր Lens-ով որոնելու համար:`
                  : `No published items match "${query}". Try another concept (e.g. "branding", "app", "poster", "font") or upload an image to search via Google Lens.`}
              </p>
              <button
                type="button"
                className="empty-lens-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="hd-icon hd-icon-camera" />
                {locale === 'hy' ? 'Որոնել պատկերով (Lens & OCR)' : 'Search with Image (Lens & OCR)'}
              </button>
            </div>
          ) : (
            scoredResults.map((result, index) => {
              const isSelected = index === selectedIndex;
              const item = result.item;
              const title = locale === 'hy' ? item.title_hy : item.title_en;
              const subtitle = locale === 'hy' ? item.subtitle_hy : item.subtitle_en;
              const desc = locale === 'hy' ? item.description_hy : item.description_en;
              const visualSim = result.visualSimilarity || 0;

              return (
                <Link
                  key={item.id}
                  href={item.url}
                  className={`hd-search-result-item ${isSelected ? 'active' : ''}`}
                  data-active={isSelected ? "true" : undefined}
                  onClick={onClose}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {/* Thumbnail / Icon */}
                  <div className="result-thumb-wrapper">
                    {item.image && item.type !== 'doc' ? (
                      <img
                        src={item.image}
                        alt={title}
                        className="result-thumb-img"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={`result-thumb-placeholder type-${item.type}`}>
                        <span className={`hd-icon ${getTypeIcon(item.type)}`} />
                      </div>
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="result-details">
                    <div className="result-header-row">
                      <span className="result-title">{title}</span>
                      
                      {/* Visual Match Badge if detected by Lens */}
                      {visualSim >= 40 && (
                        <span className="result-lens-match-badge">
                          <span className="hd-icon hd-icon-camera" style={{ fontSize: '0.75rem' }} />
                          Lens: {visualSim}% {locale === 'hy' ? 'նմանություն' : 'match'}
                        </span>
                      )}

                      <span className={`result-type-badge badge-${item.type}`}>
                        {getTypeBadge(item.type)}
                      </span>
                    </div>

                    {subtitle && (
                      <span className="result-subtitle">{subtitle}</span>
                    )}

                    {desc && (
                      <p className="result-desc">{desc}</p>
                    )}
                  </div>

                  {/* Arrow Action */}
                  <div className="result-arrow-wrap">
                    <span className="hd-icon hd-icon-arrow-right" />
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* ══════ MODAL FOOTER ══════ */}
        <div className="hd-search-modal-footer">
          <div className="footer-shortcuts">
            <span className="shortcut-item">
              <kbd>↑</kbd><kbd>↓</kbd> {locale === 'hy' ? 'ընտրել' : 'navigate'}
            </span>
            <span className="shortcut-item">
              <kbd>↵</kbd> {locale === 'hy' ? 'բացել' : 'open'}
            </span>
            <span className="shortcut-item">
              <kbd>ESC</kbd> {locale === 'hy' ? 'փակել' : 'close'}
            </span>
          </div>

          <div className="footer-credits">
            <span>
              {locale === 'hy' ? 'Հրապարակված արդյունքներ՝ ' : 'Published items: '}
              <strong>{scoredResults.length}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
