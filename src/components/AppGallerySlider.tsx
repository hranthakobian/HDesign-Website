"use client";

import React, { useState, useEffect, useCallback } from 'react';

interface AppGallerySliderProps {
  images: string[];
  title: string;
}

export default function AppGallerySlider({ images, title }: AppGallerySliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Fallback if no images
  const displayImages = images && images.length > 0
    ? images
    : ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'];

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  }, [displayImages.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  }, [displayImages.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  return (
    <div className="app-gallery-slider">
      {/* Main Image Container */}
      <div className="gallery-main-frame" onClick={() => setIsLightboxOpen(true)}>
        <img
          src={displayImages[activeIndex]}
          alt={`${title} - screenshot ${activeIndex + 1}`}
          className="gallery-main-img"
        />

        {displayImages.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-nav-btn prev-btn"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Նախորդ նկարը"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              type="button"
              className="gallery-nav-btn next-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Հաջորդ նկարը"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        <div className="gallery-counter-badge">
          {activeIndex + 1} / {displayImages.length}
        </div>

        <div className="gallery-zoom-hint" title="Մեծացնել">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </div>
      </div>

      {/* Thumbnails strip */}
      {displayImages.length > 1 && (
        <div className="gallery-thumbnails-strip">
          {displayImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              className={`gallery-thumb-btn ${idx === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Անցնել նկար ${idx + 1}-ին`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div className="gallery-lightbox" onClick={() => setIsLightboxOpen(false)}>
          <button
            type="button"
            className="lightbox-close-btn"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Փակել"
          >
            &times;
          </button>

          <img
            src={displayImages[activeIndex]}
            alt={`${title} - full preview`}
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />

          {displayImages.length > 1 && (
            <>
              <button
                type="button"
                className="gallery-nav-btn prev-btn lightbox-nav"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <button
                type="button"
                className="gallery-nav-btn next-btn lightbox-nav"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
