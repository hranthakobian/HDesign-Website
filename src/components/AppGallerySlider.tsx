"use client";

import React, { useState, useEffect, useCallback } from 'react';
import MediaLightbox, { MediaLightboxItem } from '@/components/MediaLightbox';

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

  // Keyboard navigation for inline slider
  useEffect(() => {
    if (isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, isLightboxOpen]);

  const lightboxItems: MediaLightboxItem[] = displayImages.map((img, idx) => ({
    id: `app-img-${idx}`,
    url: img,
    title: `${title} (${idx + 1} / ${displayImages.length})`,
    type: 'image'
  }));

  return (
    <div className="app-gallery-slider">
      {/* Main Image Container */}
      <div 
        className="gallery-main-frame" 
        onClick={() => setIsLightboxOpen(true)}
        style={{ cursor: "pointer", position: "relative", overflow: "hidden" }}
        title="Դիտել պատկերասրահը / View Gallery"
      >
        <div
          className="gallery-slides-track"
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            transform: `translateX(-${activeIndex * 100}%)`,
            transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'transform'
          }}
        >
          {displayImages.map((img, idx) => (
            <div
              key={idx}
              style={{
                width: '100%',
                height: '100%',
                flexShrink: 0,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0d1117'
              }}
            >
              <img
                src={img}
                alt={`${title} - screenshot ${idx + 1}`}
                className="gallery-main-img"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>
          ))}
        </div>

        {displayImages.length > 1 && (
          <>
            <div
              role="button"
              tabIndex={0}
              className="gallery-nav-btn prev-btn"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  handlePrev();
                }
              }}
              aria-label="Նախորդ նկարը"
              style={{
                position: 'absolute',
                top: '50%',
                left: '16px',
                transform: 'translateY(-50%)',
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px',
                maxWidth: '44px',
                maxHeight: '44px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 20,
                padding: 0,
                margin: 0,
                boxSizing: 'border-box',
                flexShrink: 0,
                aspectRatio: '1 / 1',
                lineHeight: 1,
                overflow: 'hidden',
                userSelect: 'none'
              }}
            >
              <i className="hd-icon hd-icon-chevrolt-arrow-left" style={{ fontSize: '1.2rem', color: '#ffffff', lineHeight: 1, display: 'inline-block' }} />
            </div>

            <div
              role="button"
              tabIndex={0}
              className="gallery-nav-btn next-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  handleNext();
                }
              }}
              aria-label="Հաջորդ նկարը"
              style={{
                position: 'absolute',
                top: '50%',
                right: '16px',
                transform: 'translateY(-50%)',
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px',
                maxWidth: '44px',
                maxHeight: '44px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 20,
                padding: 0,
                margin: 0,
                boxSizing: 'border-box',
                flexShrink: 0,
                aspectRatio: '1 / 1',
                lineHeight: 1,
                overflow: 'hidden',
                userSelect: 'none'
              }}
            >
              <i className="hd-icon hd-icon-chevrolt-arrow-right" style={{ fontSize: '1.2rem', color: '#ffffff', lineHeight: 1, display: 'inline-block' }} />
            </div>
          </>
        )}

        <div className="gallery-counter-badge">
          {activeIndex + 1} / {displayImages.length}
        </div>

        <div 
          className="gallery-zoom-hint" 
          title="Մեծացնել"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '36px',
            height: '36px',
            minWidth: '36px',
            minHeight: '36px',
            maxWidth: '36px',
            maxHeight: '36px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 20,
            padding: 0,
            boxSizing: 'border-box'
          }}
        >
          <i className="hd-icon hd-icon-expand" style={{ fontSize: '1rem', color: '#ffffff', lineHeight: 1 }} />
        </div>
      </div>

      {/* Thumbnails strip */}
      {displayImages.length > 0 && (
        <div 
          className="gallery-thumbnails-strip"
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '16px',
            overflowX: 'auto',
            padding: '4px 2px',
            scrollbarWidth: 'thin',
            width: '100%',
            alignItems: 'center'
          }}
        >
          {displayImages.map((img, idx) => (
            <div
              key={idx}
              role="button"
              tabIndex={0}
              className={`gallery-thumb-btn ${idx === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveIndex(idx);
                }
              }}
              aria-label={`Անցնել նկար ${idx + 1}-ին`}
              style={{
                width: '84px',
                height: '56px',
                minWidth: '84px',
                minHeight: '56px',
                maxWidth: '84px',
                maxHeight: '56px',
                flexShrink: 0,
                borderRadius: '12px',
                overflow: 'hidden',
                border: idx === activeIndex ? '2px solid var(--accent, #4a897c)' : '1.5px solid var(--panel-border, rgba(255, 255, 255, 0.15))',
                padding: 0,
                backgroundColor: '#0d1117',
                cursor: 'pointer',
                opacity: idx === activeIndex ? 1 : 0.7,
                transition: 'all 0.2s ease',
                outline: 'none',
                boxShadow: idx === activeIndex ? '0 4px 14px rgba(74, 137, 124, 0.35)' : 'none',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img 
                src={img} 
                alt={`Thumbnail ${idx + 1}`} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }} 
              />
            </div>
          ))}
        </div>
      )}

      {/* Unified Gallery Lightbox Slider */}
      <MediaLightbox
        items={lightboxItems}
        initialIndex={activeIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
}
