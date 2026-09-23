"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { searchVisualMatches, VisualSearchResult } from "@/lib/visualSearch";

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

  // Lens / Visual search & OCR states
  const [isLensOpen, setIsLensOpen] = useState(false);
  const [lensMode, setLensMode] = useState<'visual' | 'ocr'>('visual');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState("");
  const [visualMatches, setVisualMatches] = useState<VisualSearchResult[]>([]);
  const [ocrText, setOcrText] = useState("");
  const [ocrConfidence, setOcrConfidence] = useState(0);
  const [ocrLang, setOcrLang] = useState<'eng+hye' | 'hye' | 'eng'>('eng+hye');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

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
        if (isLensOpen) {
          setIsLensOpen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLensOpen, onClose]);

  // Filter items by active tab and search query
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    return indexItems.filter(item => {
      // Tab category filter
      if (activeTab === 'apps' && item.type !== 'app') return false;
      if (activeTab === 'cases' && item.type !== 'case') return false;
      if (activeTab === 'images' && item.type !== 'image') return false;
      if (activeTab === 'fonts' && item.type !== 'font') return false;
      if (activeTab === 'pages' && item.type !== 'page' && item.type !== 'doc') return false;

      if (!q) return true; // Show all if query is empty

      // Multi-field search match
      const titleHy = (item.title_hy || '').toLowerCase();
      const titleEn = (item.title_en || '').toLowerCase();
      const subtitleHy = (item.subtitle_hy || '').toLowerCase();
      const subtitleEn = (item.subtitle_en || '').toLowerCase();
      const descHy = (item.description_hy || '').toLowerCase();
      const descEn = (item.description_en || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      const tags = (item.tags || []).map(t => t.toLowerCase()).join(' ');

      return (
        titleHy.includes(q) ||
        titleEn.includes(q) ||
        subtitleHy.includes(q) ||
        subtitleEn.includes(q) ||
        descHy.includes(q) ||
        descEn.includes(q) ||
        category.includes(q) ||
        tags.includes(q)
      );
    });
  }, [indexItems, activeTab, query]);

  // Reset selected index when query or tab changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeTab]);

  // Handle Arrow key navigation in search results
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredResults[selectedIndex];
      if (selected) {
        onClose();
        router.push(selected.url);
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
    const q = query.trim().toLowerCase();
    const matchesQuery = (item: SearchIndexItem) => {
      if (!q) return true;
      const text = [
        item.title_hy, item.title_en,
        item.subtitle_hy, item.subtitle_en,
        item.description_hy, item.description_en,
        item.category, ...(item.tags || [])
      ].join(' ').toLowerCase();
      return text.includes(q);
    };

    const counts = {
      all: 0,
      apps: 0,
      cases: 0,
      images: 0,
      fonts: 0,
      pages: 0
    };

    indexItems.forEach(item => {
      if (!matchesQuery(item)) return;
      counts.all++;
      if (item.type === 'app') counts.apps++;
      else if (item.type === 'case') counts.cases++;
      else if (item.type === 'image') counts.images++;
      else if (item.type === 'font') counts.fonts++;
      else if (item.type === 'page' || item.type === 'doc') counts.pages++;
    });

    return counts;
  }, [indexItems, query]);

  // ══════════════════════════════════════════════════════════════════
  // GOOGLE LENS & OCR PROCESSING
  // ══════════════════════════════════════════════════════════════════

  // Process uploaded image for visual search & OCR
  const processImage = useCallback(async (imageDataUrl: string, targetMode = lensMode) => {
    setUploadedImage(imageDataUrl);
    setIsLensOpen(true);
    setIsAnalyzing(true);

    if (targetMode === 'visual') {
      setAnalysisProgress(locale === 'hy' ? "Համեմատում ենք պատկերների հետ..." : "Analyzing visual similarity...");
      try {
        // Collect candidate images from the index
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

        const matches = await searchVisualMatches(
          imageDataUrl,
          candidates,
          (processed, total) => {
            setAnalysisProgress(
              locale === 'hy'
                ? `Վերլուծվում է (${processed}/${total})...`
                : `Scanning candidates (${processed}/${total})...`
            );
          }
        );
        setVisualMatches(matches);
      } catch (err) {
        console.error('Visual match error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      // OCR Mode
      setAnalysisProgress(locale === 'hy' ? "Ճանաչում ենք տեքստը պատկերից..." : "Extracting text with OCR...");
      try {
        const res = await fetch('/api/search/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageDataUrl, lang: ocrLang })
        });
        const data = await res.json();
        if (data && data.text) {
          setOcrText(data.text);
          setOcrConfidence(Math.round(data.confidence || 0));
        } else {
          setOcrText("");
        }
      } catch (err) {
        console.error('OCR error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [lensMode, locale, indexItems, ocrLang]);

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      processImage(dataUrl, lensMode);
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
        processImage(dataUrl, lensMode);
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
              processImage(dataUrl, 'visual');
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, processImage]);

  // Apply OCR text to main query
  const applyOcrToSearch = () => {
    if (!ocrText) return;
    setQuery(ocrText);
    setIsLensOpen(false);
    inputRef.current?.focus();
  };

  // Copy OCR text
  const copyOcrText = () => {
    if (!ocrText) return;
    navigator.clipboard.writeText(ocrText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

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

        {/* ══════ MODAL TOP SEARCH BAR ══════ */}
        <div className="hd-search-input-wrapper">
          <span className="hd-icon hd-icon-search search-input-icon" />

          <input
            ref={inputRef}
            type="text"
            className="hd-search-main-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={
              locale === 'hy'
                ? 'Որոնել կայքում (հավելվածներ, քեյսեր, պատկերներ, տառատեսակներ)...'
                : 'Search everything (apps, cases, images, fonts, docs)...'
            }
            autoComplete="off"
            spellCheck="false"
          />

          <div className="hd-search-actions-row">
            {/* Google Lens & OCR Trigger Button */}
            <button
              type="button"
              className={`hd-lens-toggle-btn ${isLensOpen ? 'active' : ''}`}
              onClick={() => {
                if (isLensOpen) {
                  setIsLensOpen(false);
                } else if (uploadedImage) {
                  setIsLensOpen(true);
                } else {
                  fileInputRef.current?.click();
                }
              }}
              title={locale === 'hy' ? 'Որոնել պատկերով (Google Lens & OCR)' : 'Search by image (Google Lens & OCR)'}
              aria-label="Search by image"
            >
              <span className="hd-icon hd-icon-camera" />
              <span className="lens-btn-label">Lens & OCR</span>
            </button>

            {/* Clear Query Button */}
            {query.length > 0 && (
              <button
                type="button"
                className="hd-search-clear-btn"
                onClick={() => {
                  setQuery('');
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

        {/* ══════ LENS / VISUAL SEARCH & OCR PANEL ══════ */}
        {isLensOpen && (
          <div className="hd-lens-panel">
            <div className="hd-lens-header">
              <div className="hd-lens-tabs">
                <button
                  type="button"
                  className={`hd-lens-tab ${lensMode === 'visual' ? 'active' : ''}`}
                  onClick={() => {
                    setLensMode('visual');
                    if (uploadedImage) processImage(uploadedImage, 'visual');
                  }}
                >
                  <span className="hd-icon hd-icon-image" />
                  {locale === 'hy' ? 'Google Lens (Համեմատություն)' : 'Google Lens (Visual Match)'}
                </button>
                <button
                  type="button"
                  className={`hd-lens-tab ${lensMode === 'ocr' ? 'active' : ''}`}
                  onClick={() => {
                    setLensMode('ocr');
                    if (uploadedImage) processImage(uploadedImage, 'ocr');
                  }}
                >
                  <span className="hd-icon hd-icon-text-cursor" />
                  {locale === 'hy' ? 'OCR (Տեքստի ճանաչում)' : 'OCR (Text Extract)'}
                </button>
              </div>

              <div className="hd-lens-header-actions">
                <button
                  type="button"
                  className="hd-lens-new-image-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="hd-icon hd-icon-camera" />
                  {locale === 'hy' ? 'Փոխել պատկերը' : 'Change Image'}
                </button>
                <button
                  type="button"
                  className="hd-lens-close-btn"
                  onClick={() => setIsLensOpen(false)}
                >
                  <span className="hd-icon hd-icon-close" />
                </button>
              </div>
            </div>

            {/* Upload Area / Image Preview */}
            <div className="hd-lens-content-area">
              {uploadedImage ? (
                <div className="hd-lens-preview-container">
                  <div className="hd-lens-source-card">
                    <img src={uploadedImage} alt="Uploaded query" className="hd-lens-source-img" />
                    <span className="hd-lens-source-badge">
                      {locale === 'hy' ? 'Վերբեռնված պատկեր' : 'Query Image'}
                    </span>
                  </div>

                  <div className="hd-lens-results-side">
                    {isAnalyzing ? (
                      <div className="hd-lens-loading-state">
                        <div className="hd-lens-scanner-beam" />
                        <span className="hd-lens-spinner" />
                        <span className="hd-lens-loading-text">{analysisProgress}</span>
                      </div>
                    ) : lensMode === 'visual' ? (
                      /* Visual Matches List */
                      <div className="hd-lens-matches-list">
                        <div className="hd-lens-results-title">
                          <span>{locale === 'hy' ? 'Համընկնող պատկերներ' : 'Visually Similar Matches'}</span>
                          <span className="count-pill">{visualMatches.length}</span>
                        </div>

                        {visualMatches.length === 0 ? (
                          <div className="hd-lens-empty">
                            <p>{locale === 'hy' ? 'Նմանատիպ պատկերներ չեն գտնվել:' : 'No visually similar matches found.'}</p>
                            <small>{locale === 'hy' ? 'Փորձեք վերբեռնել մեկ այլ նկար կամ օգտվել OCR ռեժիմից:' : 'Try another image or switch to OCR mode.'}</small>
                          </div>
                        ) : (
                          <div className="hd-lens-cards-grid">
                            {visualMatches.map(match => (
                              <Link
                                key={match.id}
                                href={match.url}
                                className="hd-lens-match-card"
                                onClick={onClose}
                              >
                                <div className="match-thumb-wrap">
                                  <img src={match.imageUrl} alt={match.title} className="match-thumb" />
                                  <span className={`similarity-badge ${match.similarity >= 70 ? 'high' : match.similarity >= 45 ? 'med' : 'low'}`}>
                                    {match.similarity}% {locale === 'hy' ? 'համընկնում' : 'match'}
                                  </span>
                                </div>
                                <div className="match-info">
                                  <span className="match-title">{match.title}</span>
                                  {match.category && <span className="match-cat">{match.category}</span>}
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* OCR Result Box */
                      <div className="hd-lens-ocr-container">
                        <div className="ocr-controls-row">
                          <span className="ocr-status-badge">
                            {ocrConfidence > 0 ? `${ocrConfidence}% ${locale === 'hy' ? 'վստահություն' : 'confidence'}` : ''}
                          </span>
                          <div className="ocr-lang-selector">
                            <button
                              type="button"
                              className={`lang-chip ${ocrLang === 'eng+hye' ? 'active' : ''}`}
                              onClick={() => {
                                setOcrLang('eng+hye');
                                if (uploadedImage) processImage(uploadedImage, 'ocr');
                              }}
                            >
                              Հայ + Eng
                            </button>
                            <button
                              type="button"
                              className={`lang-chip ${ocrLang === 'hye' ? 'active' : ''}`}
                              onClick={() => {
                                setOcrLang('hye');
                                if (uploadedImage) processImage(uploadedImage, 'ocr');
                              }}
                            >
                              Հայերեն
                            </button>
                            <button
                              type="button"
                              className={`lang-chip ${ocrLang === 'eng' ? 'active' : ''}`}
                              onClick={() => {
                                setOcrLang('eng');
                                if (uploadedImage) processImage(uploadedImage, 'ocr');
                              }}
                            >
                              English
                            </button>
                          </div>
                        </div>

                        {ocrText ? (
                          <div className="ocr-result-wrapper">
                            <pre className="ocr-text-box">{ocrText}</pre>
                            <div className="ocr-buttons-row">
                              <button
                                type="button"
                                className="ocr-search-btn"
                                onClick={applyOcrToSearch}
                              >
                                <span className="hd-icon hd-icon-search" />
                                {locale === 'hy' ? 'Որոնել կայքում այս տեքստով' : 'Search Website with this Text'}
                              </button>
                              <button
                                type="button"
                                className="ocr-copy-btn"
                                onClick={copyOcrText}
                              >
                                <span className="hd-icon hd-icon-copy" />
                                {copiedText ? (locale === 'hy' ? 'Պատճենված է' : 'Copied!') : (locale === 'hy' ? 'Պատճենել' : 'Copy')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="hd-lens-empty">
                            <p>{locale === 'hy' ? 'Պատկերում ընթեռնելի տեքստ չի հայտնաբերվել:' : 'No readable text detected in image.'}</p>
                            <small>{locale === 'hy' ? 'Համոզվեք, որ պատկերը պարունակում է հստակ տեքստ:' : 'Ensure the image has clear text and good contrast.'}</small>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Dropzone when no image is loaded yet */
                <div
                  className="hd-lens-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="dropzone-icon-ring">
                    <span className="hd-icon hd-icon-camera dropzone-camera-icon" />
                  </div>
                  <h4 className="dropzone-title">
                    {locale === 'hy' ? 'Քաշեք և թողեք պատկերը այստեղ' : 'Drag & drop image here or paste (Ctrl+V)'}
                  </h4>
                  <p className="dropzone-subtitle">
                    {locale === 'hy'
                      ? 'Որոնեք կայքում պատկերների նմանությամբ (Google Lens) կամ ճանաչեք տեքստը (OCR)'
                      : 'Search by visual similarity (Google Lens) or recognize text via OCR'}
                  </p>
                  <button type="button" className="dropzone-btn">
                    <span className="hd-icon hd-icon-download" style={{ transform: 'rotate(180deg)' }} />
                    {locale === 'hy' ? 'Ընտրել համակարգչից' : 'Browse File'}
                  </button>
                </div>
              )}
            </div>
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
            className={`hd-search-tab ${activeTab === 'apps' ? 'active' : ''}`}
            onClick={() => setActiveTab('apps')}
          >
            <span className="hd-icon hd-icon-dashboard" />
            {locale === 'hy' ? 'Հավելվածներ' : 'Apps'}
            <span className="tab-count">{categoryCounts.apps}</span>
          </button>

          <button
            type="button"
            className={`hd-search-tab ${activeTab === 'cases' ? 'active' : ''}`}
            onClick={() => setActiveTab('cases')}
          >
            <span className="hd-icon hd-icon-pencil" />
            {locale === 'hy' ? 'Քեյսեր' : 'Cases'}
            <span className="tab-count">{categoryCounts.cases}</span>
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
            className={`hd-search-tab ${activeTab === 'fonts' ? 'active' : ''}`}
            onClick={() => setActiveTab('fonts')}
          >
            <span className="hd-icon hd-icon-text-cursor" />
            {locale === 'hy' ? 'Տառատեսակներ' : 'Fonts'}
            <span className="tab-count">{categoryCounts.fonts}</span>
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

        {/* ══════ RESULTS LIST ══════ */}
        <div ref={resultsListRef} className="hd-search-results-list">
          {isLoadingIndex ? (
            <div className="hd-search-loading">
              <span className="search-spinner" />
              <span>{locale === 'hy' ? 'Բեռնվում է որոնման ինդեքսը...' : 'Loading search index...'}</span>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="hd-search-empty-state">
              <span className="hd-icon hd-icon-search empty-icon" />
              <h3>{locale === 'hy' ? 'Արդյունքներ չեն գտնվել' : 'No results found'}</h3>
              <p>
                {locale === 'hy'
                  ? `«${query}» հարցմամբ համապատասխանող բաժիններ չկան: Փորձեք այլ բառ կամ օգտագործեք Google Lens պատկերով որոնումը:`
                  : `No matches found for "${query}". Try another keyword or search by image using Google Lens.`}
              </p>
              <button
                type="button"
                className="empty-lens-btn"
                onClick={() => {
                  setIsLensOpen(true);
                  fileInputRef.current?.click();
                }}
              >
                <span className="hd-icon hd-icon-camera" />
                {locale === 'hy' ? 'Որոնել պատկերով (Lens & OCR)' : 'Search by Image (Lens & OCR)'}
              </button>
            </div>
          ) : (
            filteredResults.map((item, index) => {
              const isSelected = index === selectedIndex;
              const title = locale === 'hy' ? item.title_hy : item.title_en;
              const subtitle = locale === 'hy' ? item.subtitle_hy : item.subtitle_en;
              const desc = locale === 'hy' ? item.description_hy : item.description_en;

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
                          // Fallback to type icon if image load fails
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
            <span>HDesign Search • {filteredResults.length} {locale === 'hy' ? 'արդյունք' : 'items'}</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
