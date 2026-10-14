"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MediaLightbox, { MediaLightboxItem } from '@/components/MediaLightbox';
import HdVideoPlayer from '@/components/HdVideoPlayer';

export interface GalleryMediaItem {
  id?: string;
  type: 'image' | 'video';
  url: string;
  poster?: string;
  title?: string;
}

export interface AppGallerySliderProps {
  images?: string[];
  videoUrl?: string;
  coverImage?: string;
  media?: GalleryMediaItem[];
  title: string;
}

export const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.includes("youtube.com") ||
    trimmed.includes("youtu.be") ||
    trimmed.includes("vimeo.com") ||
    trimmed.includes("loom.com") ||
    /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed)
  ) {
    return true;
  }
  return false;
};

export const getYoutubeThumbnail = (url?: string): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  let id = "";
  if (trimmed.includes("youtube.com/watch")) {
    id = trimmed.split("v=")[1]?.split("&")[0] || "";
  } else if (trimmed.includes("youtu.be/")) {
    id = trimmed.split("youtu.be/")[1]?.split("?")[0] || "";
  } else if (trimmed.includes("youtube.com/shorts/")) {
    id = trimmed.split("youtube.com/shorts/")[1]?.split("?")[0] || "";
  } else if (trimmed.includes("youtube.com/embed/")) {
    id = trimmed.split("youtube.com/embed/")[1]?.split("?")[0] || "";
  }
  if (id) {
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }
  return null;
};

export default function AppGallerySlider({
  images = [],
  videoUrl,
  coverImage,
  media,
  title
}: AppGallerySliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Normalize media items: place main promo video first if provided, followed by images/videos
  const displayMedia: GalleryMediaItem[] = useMemo(() => {
    if (media && media.length > 0) return media;

    const items: GalleryMediaItem[] = [];
    const addedUrls = new Set<string>();

    if (videoUrl && videoUrl.trim()) {
      const vUrl = videoUrl.trim();
      items.push({
        id: 'app-video-main',
        type: 'video',
        url: vUrl,
        poster: coverImage?.trim() || undefined,
        title: `${title} - Video`
      });
      addedUrls.add(vUrl);
    }

    if (Array.isArray(images)) {
      images.forEach((img, idx) => {
        if (!img || !img.trim()) return;
        const trimmed = img.trim();
        if (addedUrls.has(trimmed)) return;
        addedUrls.add(trimmed);

        const isVideo = isVideoUrl(trimmed);
        items.push({
          id: `app-media-${idx}`,
          type: isVideo ? 'video' : 'image',
          url: trimmed,
          poster: isVideo ? (coverImage?.trim() || undefined) : undefined,
          title: `${title} (${idx + 1})`
        });
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'fallback',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
        title: title
      });
    }

    return items;
  }, [media, videoUrl, images, coverImage, title]);

  useEffect(() => {
    if (activeIndex >= displayMedia.length) {
      setActiveIndex(0);
    }
  }, [displayMedia.length, activeIndex]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? displayMedia.length - 1 : prev - 1));
  }, [displayMedia.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev === displayMedia.length - 1 ? 0 : prev + 1));
  }, [displayMedia.length]);

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

  const lightboxItems: MediaLightboxItem[] = useMemo(() => {
    return displayMedia.map((item, idx) => ({
      id: item.id || `app-media-${idx}`,
      url: item.url,
      title: `${title} (${idx + 1} / ${displayMedia.length})`,
      type: item.type
    }));
  }, [displayMedia, title]);

  const currentItem = displayMedia[activeIndex] || displayMedia[0];
  const isCurrentVideo = currentItem?.type === 'video';

  return (
    <div className="app-gallery-slider">
      {/* Main Container */}
      <div 
        className="gallery-main-frame" 
        onClick={() => {
          if (!isCurrentVideo) {
            setIsLightboxOpen(true);
          }
        }}
        style={{
          cursor: isCurrentVideo ? "default" : "pointer",
          position: "relative",
          overflow: "hidden"
        }}
        title={isCurrentVideo ? "Տեսանյութ / Video" : "Դիտել պատկերասրահը / View Gallery"}
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
          {displayMedia.map((item, idx) => {
            const isVideo = item.type === 'video';
            const isActive = activeIndex === idx;

            return (
              <div
                key={item.id || idx}
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
                {isVideo ? (
                  isActive ? (
                    <div
                      className="gallery-video-container"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#060909'
                      }}
                    >
                      <HdVideoPlayer
                        key={`video-active-${item.url}`}
                        src={item.url}
                        poster={item.poster || getYoutubeThumbnail(item.url) || coverImage}
                        autoplay={false}
                        width="100%"
                        height="100%"
                        radius="0px"
                        style={{
                          maxHeight: '100%',
                          width: '100%'
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveIndex(idx);
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#060909',
                        cursor: 'pointer'
                      }}
                      title="Նվագարկել տեսանյութը"
                    >
                      {(item.poster || getYoutubeThumbnail(item.url) || coverImage) ? (
                        <img
                          src={item.poster || getYoutubeThumbnail(item.url) || coverImage}
                          alt={title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 0.75
                          }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#0a1012' }} />
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          background: 'rgba(8, 63, 57, 0.9)',
                          border: '2px solid rgba(255, 255, 255, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
                          backdropFilter: 'blur(8px)',
                          color: '#ffffff'
                        }}
                      >
                        <span className="hd-icon icon-Play" style={{ fontSize: '26px', marginLeft: '3px' }} />
                      </div>
                    </div>
                  )
                ) : (
                  <img
                    src={item.url}
                    alt={`${title} - screenshot ${idx + 1}`}
                    className="gallery-main-img"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {displayMedia.length > 1 && (
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
              aria-label="Նախորդը"
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
              aria-label="Հաջորդը"
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
          {activeIndex + 1} / {displayMedia.length}
        </div>

        <div 
          className="gallery-zoom-hint" 
          title="Մեծացնել / Expand"
          onClick={(e) => {
            e.stopPropagation();
            setIsLightboxOpen(true);
          }}
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
      {displayMedia.length > 0 && (
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
          {displayMedia.map((item, idx) => {
            const isVideo = item.type === 'video';
            const thumbSrc = isVideo
              ? (item.poster || getYoutubeThumbnail(item.url) || coverImage)
              : item.url;

            return (
              <div
                key={item.id || idx}
                role="button"
                tabIndex={0}
                className={`gallery-thumb-btn ${idx === activeIndex ? 'active' : ''}`}
                onClick={() => setActiveIndex(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveIndex(idx);
                  }
                }}
                aria-label={`Անցնել մեդիա ${idx + 1}-ին`}
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
                {thumbSrc ? (
                  <img 
                    src={thumbSrc} 
                    alt={`Thumbnail ${idx + 1}`} 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }} 
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#0a1715', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="hd-icon icon-Play" style={{ fontSize: '18px', color: 'var(--accent, #4a897c)' }} />
                  </div>
                )}

                {isVideo && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0, 0, 0, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none'
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--accent, #4a897c)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                        color: '#ffffff'
                      }}
                    >
                      <span className="hd-icon icon-Play" style={{ fontSize: '11px', marginLeft: '1.5px', color: '#ffffff' }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
