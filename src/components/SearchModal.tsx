"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { SearchSkeleton } from "@/components/Skeleton";
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

  // Smooth entry & exit animation states
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const isClosingRef = useRef(false);

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
  const [ocrBlocks, setOcrBlocks] = useState<Array<{ text: string; box: [number, number, number, number] }>>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLensExpanded, setIsLensExpanded] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize open/close with exit animation
  useEffect(() => {
    if (isOpen) {
      isClosingRef.current = false;
      setShouldRender(true);
      setIsClosing(false);
    } else {
      if (shouldRender && !isClosingRef.current) {
        isClosingRef.current = true;
        setIsClosing(true);
        const timer = setTimeout(() => {
          setShouldRender(false);
          setIsClosing(false);
          isClosingRef.current = false;
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, shouldRender]);

  // Smooth animated close trigger
  const handleAnimatedClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setShouldRender(false);
      setIsClosing(false);
      isClosingRef.current = false;
    }, 200);
  }, [onClose]);

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
    if (!shouldRender) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [shouldRender]);

  // Handle global keyboard navigation (ESC, Arrow keys, Enter)
  useEffect(() => {
    if (!isOpen || isClosing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (attachedImage) {
          // First press clears attached image
          setAttachedImage(null);
          setLensMatchesMap(new Map());
          setOcrDetectedWords([]);
          setOcrFullText("");
          setOcrBlocks([]);
        } else {
          handleAnimatedClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isClosing, attachedImage, handleAnimatedClose]);

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
          setOcrBlocks(Array.isArray(data.blocks) ? data.blocks : []);
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
    setOcrBlocks([]);
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
        handleAnimatedClose();
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

  if (!shouldRender) return null;

  return createPortal(
    <div
      className={`hd-search-modal-backdrop ${isClosing ? 'closing' : ''} ${isDraggingOver ? 'dragging-over' : ''}`}
      onClick={handleAnimatedClose}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`hd-search-modal-container ${isClosing ? 'closing' : ''}`}
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

          {/* Attached Image Chip */}
          {attachedImage && (
            <div className="search-attached-image-chip" title={locale === 'hy' ? 'Կցված պատկեր' : 'Attached image'}>
              <img src={attachedImage} alt="Query thumb" className="chip-thumb" />
              <span className="chip-badge">{locale === 'hy' ? 'Պատկեր' : 'Image'}</span>
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
            {/* Camera / Image Trigger Button */}
            <button
              type="button"
              className={`hd-lens-toggle-btn ${attachedImage ? 'active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              title={
                locale === 'hy'
                  ? 'Որոնել պատկերով'
                  : 'Search with image'
              }
              aria-label="Upload image"
            >
              <span className="hd-icon hd-icon-camera" />
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
            <kbd className="hd-search-esc-badge" onClick={handleAnimatedClose}>ESC</kbd>
          </div>
        </div>

        {/* ══════ MULTIMODAL INTERACTIVE TEXT & LENS SELECTOR ══════ */}
        {attachedImage && (
          <div className={`hd-lens-interactive-panel ${isLensExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="lens-panel-header">
              <div className="lens-panel-title-area" onClick={() => setIsLensExpanded(!isLensExpanded)}>
                <span className="hd-icon hd-icon-text-cursor" />
                <span className="lens-panel-title">
                  {locale === 'hy' ? 'Պատկերի տեքստային ընտրիչ' : 'Visual Text Selector'}
                </span>
                {isAnalyzingImage && (
                  <span className="lens-analyzing-badge">
                    <span className="lens-mini-spinner" />
                    {analysisStatusText || (locale === 'hy' ? 'Վերլուծվում է...' : 'Analyzing...')}
                  </span>
                )}
                {ocrDetectedWords.length > 0 && !isAnalyzingImage && (
                  <span className="lens-words-count-badge">
                    {ocrDetectedWords.length} {locale === 'hy' ? 'բառ' : 'words'}
                  </span>
                )}
              </div>

              <div className="lens-panel-actions">
                {ocrFullText && (
                  <>
                    <button
                      type="button"
                      className="lens-action-btn"
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(ocrFullText);
                          setIsCopied(true);
                          setTimeout(() => setIsCopied(false), 2000);
                        }
                      }}
                      title={locale === 'hy' ? 'Պատճենել տեքստը' : 'Copy Text'}
                    >
                      {isCopied
                        ? (locale === 'hy' ? '✓ Պատճենվեց' : '✓ Copied')
                        : (locale === 'hy' ? '📋 Պատճենել' : '📋 Copy')}
                    </button>

                    <button
                      type="button"
                      className="lens-action-btn primary"
                      onClick={() => {
                        setQuery(ocrFullText);
                        inputRef.current?.focus();
                      }}
                      title={locale === 'hy' ? 'Կիրառել ամբողջ տեքստը հարցման մեջ' : 'Use full text in query'}
                    >
                      {locale === 'hy' ? 'Որոնել ամբողջը' : 'Search All'}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="lens-toggle-collapse-btn"
                  onClick={() => setIsLensExpanded(!isLensExpanded)}
                  title={isLensExpanded ? (locale === 'hy' ? 'Փակել' : 'Collapse') : (locale === 'hy' ? 'Բացել' : 'Expand')}
                >
                  <span className={`hd-icon hd-icon-arrow-${isLensExpanded ? 'up' : 'down'}`} />
                </button>
              </div>
            </div>

            {/* Expanded Body: 2-Column Split View (Left: Image with Live Text Overlay, Right: Full Text & Words) */}
            {isLensExpanded && (
              <div className="lens-panel-body">
                {isAnalyzingImage ? (
                  <div className="lens-loading-placeholder">
                    <div className="lens-scanning-line" />
                    <span>{locale === 'hy' ? 'Կարդում ենք պատկերի տեքստը...' : 'Extracting text from image...'}</span>
                  </div>
                ) : ocrFullText ? (
                  <div className="lens-split-container">
                    {/* ════ LEFT COLUMN: IMAGE WITH DETECTION BOUNDING BOXES (Google Lens Style) ════ */}
                    <div className="lens-split-left">
                      <div className="lens-image-wrapper">
                        <img src={attachedImage} alt="Uploaded query" className="lens-target-image" />
                        
                        {/* Interactive Bounding Box Highlights directly on detected text regions */}
                        <div className="lens-image-boxes-layer">
                          {ocrBlocks && ocrBlocks.length > 0 ? (
                            ocrBlocks.map((block, bIdx) => {
                              const ymin = block.box[0];
                              const xmin = block.box[1];
                              const ymax = block.box[2];
                              const xmax = block.box[3];

                              const top = Math.max(0, Math.min(96, (ymin / 1000) * 100));
                              const left = Math.max(0, Math.min(96, (xmin / 1000) * 100));
                              const width = Math.max(5, Math.min(100 - left, ((xmax - xmin) / 1000) * 100));
                              const height = Math.max(5, Math.min(100 - top, ((ymax - ymin) / 1000) * 100));

                              const isSelected = query.toLowerCase().includes(block.text.toLowerCase());

                              return (
                                <div
                                  key={`block-${bIdx}`}
                                  className={`lens-detection-box ${isSelected ? 'selected' : ''}`}
                                  style={{
                                    top: `${top}%`,
                                    left: `${left}%`,
                                    width: `${width}%`,
                                    height: `${height}%`
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSelected) {
                                      const regex = new RegExp(`(^|\\s)${block.text.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}(\\s|$)`, 'gi');
                                      const newQ = query.replace(regex, ' ').replace(/\s+/g, ' ').trim();
                                      setQuery(newQ);
                                    } else {
                                      if (!query.trim()) {
                                        setQuery(block.text);
                                      } else {
                                        setQuery(`${query.trim()} ${block.text}`);
                                      }
                                    }
                                    inputRef.current?.focus();
                                  }}
                                  title={locale === 'hy' ? `Հայտնաբերված հատված՝ «${block.text}» (Սեղմեք ընտրելու համար)` : `Detected region: "${block.text}" (Click to select)`}
                                >
                                  {/* Corner pins & Tooltip */}
                                  <div className="lens-box-corner tl" />
                                  <div className="lens-box-corner tr" />
                                  <div className="lens-box-corner bl" />
                                  <div className="lens-box-corner br" />
                                  <span className="lens-box-tooltip">{block.text}</span>
                                </div>
                              );
                            })
                          ) : (
                            /* Fallback detection box if single full block */
                            <div className="lens-detection-box single-full-box selected">
                              <div className="lens-box-corner tl" />
                              <div className="lens-box-corner tr" />
                              <div className="lens-box-corner bl" />
                              <div className="lens-box-corner br" />
                              <span className="lens-box-tooltip">{ocrFullText}</span>
                            </div>
                          )}
                        </div>

                        {/* Interactive Hint on Image */}
                        <div className="lens-image-tag">
                          <span className="hd-icon hd-icon-camera" />
                          <span>{locale === 'hy' ? 'Ճանաչված հատվածներ' : 'Detected text areas'}</span>
                        </div>
                      </div>
                    </div>

                    {/* ════ RIGHT COLUMN: FULL EXTRACTED TEXT & CLICKABLE WORDS ════ */}
                    <div className="lens-split-right">
                      <div className="lens-words-content">
                        <div className="lens-instructions-hint">
                          {locale === 'hy'
                            ? 'Ճանաչված բառեր (սեղմեք՝ որոնելու համար)․'
                            : 'Detected words (click to search):'}
                        </div>

                        {/* Clickable Word Chips */}
                        <div className="lens-chips-cloud">
                          {ocrDetectedWords.map((word, idx) => {
                            const isSelected = query.toLowerCase().includes(word.toLowerCase());
                            return (
                              <button
                                key={`${word}-${idx}`}
                                type="button"
                                className={`lens-word-chip ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  if (isSelected) {
                                    const regex = new RegExp(`(^|\\s)${word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}(\\s|$)`, 'gi');
                                    const newQ = query.replace(regex, ' ').replace(/\s+/g, ' ').trim();
                                    setQuery(newQ);
                                  } else {
                                    if (!query.trim()) {
                                      setQuery(word);
                                    } else {
                                      setQuery(`${query.trim()} ${word}`);
                                    }
                                  }
                                  inputRef.current?.focus();
                                }}
                                title={locale === 'hy' ? `Ընտրել «${word}»` : `Select "${word}"`}
                              >
                                <span className="chip-label">{word}</span>
                                {isSelected && <span className="chip-status-check">✓</span>}
                              </button>
                            );
                          })}
                        </div>

                        {/* Selectable Raw Text Display */}
                        <div className="lens-selectable-box">
                          <div className="lens-selectable-label">
                            {locale === 'hy' ? 'Ամբողջական ընթերցված տեքստ․' : 'Full detected text:'}
                          </div>
                          <div
                            className="lens-selectable-content"
                            tabIndex={0}
                            title={locale === 'hy' ? 'Կարող եք նշել կամ պատճենել ցանկացած հատված' : 'Select any text fragment'}
                          >
                            {ocrFullText}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="lens-no-text-notice">
                    {locale === 'hy' ? 'Պատկերի վրա տեքստ չի հայտնաբերվել' : 'No text detected in this image'}
                  </div>
                )}
              </div>
            )}
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

        {/* ══════ RESULTS AREA (WITH SHIMMER SKELETON) ══════ */}
        <div ref={resultsListRef} className="hd-search-results-list">
          {isLoadingIndex || isAnalyzingImage ? (
            <div>
              {isAnalyzingImage && (
                <div style={{ padding: "12px 16px 0 16px", fontSize: "0.85rem", color: "var(--muted)" }}>
                  {analysisStatusText || (locale === 'hy' ? 'Վերլուծում ենք պատկերը...' : 'Analyzing image...')}
                </div>
              )}
              <SearchSkeleton />
            </div>
          ) : scoredResults.length === 0 ? (
            <div className="hd-search-empty-state">
              <span className="hd-icon hd-icon-search empty-icon" />
              <h3>{locale === 'hy' ? 'Հրապարակված արդյունքներ չեն գտնվել' : 'No published results found'}</h3>
              <p>
                {locale === 'hy'
                  ? `«${query || 'ընտրված հարցմամբ'}» համապատասխանող հրապարակված նախագիծ կամ էջ չկա: Փորձեք իմաստային այլ բառ (օր․՝ «լոգո», «պաստառ», «հավելված», «տառատեսակ») կամ ներբեռնեք պատկեր որոնելու համար:`
                  : `No published items match "${query}". Try another concept (e.g. "branding", "app", "poster", "font") or upload an image to search.`}
              </p>
              <button
                type="button"
                className="empty-lens-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="hd-icon hd-icon-camera" />
                {locale === 'hy' ? 'Որոնել պատկերով' : 'Search with image'}
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
                  onClick={handleAnimatedClose}
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
                      
                      {/* Visual Match Badge */}
                      {visualSim >= 40 && (
                        <span className="result-lens-match-badge">
                          <span className="hd-icon hd-icon-camera" style={{ fontSize: '0.75rem' }} />
                          {visualSim}% {locale === 'hy' ? 'նմանություն' : 'match'}
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
