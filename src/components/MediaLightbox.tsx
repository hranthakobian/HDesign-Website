"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useI18n, parseLangText } from "@/lib/i18n";
import HdVideoPlayer from "./HdVideoPlayer";

export interface MediaLightboxItem {
  id?: string;
  url?: string;
  type?: "image" | "video" | "svg";
  title?: string;
  subtitle?: string;
  description?: string;
  bg?: string;
  svgContent?: React.ReactNode;
}

export interface MediaLightboxProps {
  items: MediaLightboxItem[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  categoryLabel?: string;
}

export default function MediaLightbox({
  items,
  initialIndex = 0,
  isOpen,
  onClose,
  categoryLabel
}: MediaLightboxProps) {
  const { locale } = useI18n();
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, items.length - 1)));
      setIsSlideshowPlaying(false);
    }
  }, [isOpen, initialIndex, items.length]);

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const handleClose = useCallback(() => {
    setIsSlideshowPlaying(false);
    onClose();
  }, [onClose]);

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose, handleNext, handlePrev]);

  // Slideshow interval
  useEffect(() => {
    if (!isOpen || !isSlideshowPlaying || items.length <= 1) return;

    const interval = setInterval(() => {
      handleNext();
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, isSlideshowPlaying, items.length, handleNext]);

  // Prevent scroll when lightbox is open
  useEffect(() => {
    if (!isOpen) return;

    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    const handleKeyScroll = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", " ", "Home", "End"].includes(e.key)) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", preventDefault, { passive: false });
    window.addEventListener("touchmove", preventDefault, { passive: false });
    window.addEventListener("keydown", handleKeyScroll, { passive: false });

    return () => {
      window.removeEventListener("wheel", preventDefault);
      window.removeEventListener("touchmove", preventDefault);
      window.removeEventListener("keydown", handleKeyScroll);
    };
  }, [isOpen]);

  if (!isOpen || !mounted || items.length === 0 || typeof window === "undefined") {
    return null;
  }

  const activeItem = items[currentIndex] || items[0];
  const isVideo = activeItem.type === "video" || (activeItem.url && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(activeItem.url));
  const activeTitle = activeItem.title ? parseLangText(activeItem.title, locale) : "";
  const activeDesc = activeItem.description ? parseLangText(activeItem.description, locale) : "";
  const labelText = categoryLabel || (locale === "en" ? "Gallery Preview" : "Պատկերասրահ");

  return createPortal(
    <div
      className="lightbox-root"
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        height: "100vh",
        overflow: "hidden",
        zIndex: 999999,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "24px",
        animation: "fadeIn 0.3s ease-out"
      }}
    >
      {/* Top Bar / Header */}
      <div
        className="lightbox-top-bar"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#fff",
          width: "100%",
          height: "50px",
          zIndex: 10
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--muted, rgba(255,255,255,0.6))", textTransform: "uppercase", letterSpacing: "1px" }}>
            {labelText} ({currentIndex + 1} / {items.length})
          </span>
          {activeTitle && (
            <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              {activeTitle}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="lightbox-top-actions" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Slideshow Button (shown when >1 items) */}
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => setIsSlideshowPlaying((prev) => !prev)}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "20px",
                color: "#fff",
                padding: "6px 14px",
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
            >
              <span className={isSlideshowPlaying ? "hd-icon hd-icon-pause" : "hd-icon hd-icon-play"} style={{ fontSize: "0.85rem", display: "inline-block" }} />
              <span>{isSlideshowPlaying ? (locale === "en" ? "Pause" : "Դադար") : (locale === "en" ? "Autoplay" : "Ինքնաշխատ")}</span>
            </button>
          )}

          {/* Close Button */}
          <div
            onClick={handleClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
            title={locale === "en" ? "Close" : "Փակել"}
          >
            <span className="icon-Close" style={{ fontSize: "1rem", color: "#fff" }} />
          </div>
        </div>
      </div>

      {/* Main Stage (Image & Arrows) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          width: "100%",
          overflow: "hidden"
        }}
      >
        {/* Previous Arrow */}
        {items.length > 1 && (
          <div
            className="lightbox-arrow prev-arrow"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            style={{
              position: "absolute",
              left: "20px",
              zIndex: 20,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "50%",
              width: "54px",
              height: "54px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              fontSize: "1.2rem",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.transform = "scale(1)";
            }}
            title={locale === "en" ? "Previous" : "Նախորդ"}
          >
            <span className="hd-icon hd-icon-chevrolt-arrow-left" />
          </div>
        )}

        {/* Central Viewport */}
        <div
          className="lightbox-viewport"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "80%",
            maxHeight: "calc(100vh - 260px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 30px 90px rgba(0,0,0,0.8)",
            background: "transparent",
            padding: "24px",
            animation: "fadeIn 0.25s ease-out"
          }}
        >
          {isVideo && activeItem.url ? (
            <div style={{ width: "min(900px, 80vw)", maxHeight: "calc(100vh - 310px)", borderRadius: "12px", overflow: "hidden" }}>
              <HdVideoPlayer src={activeItem.url} radius="12px" autoplay={true} width="100%" />
            </div>
          ) : activeItem.svgContent ? (
            <div style={{ width: "min(400px, 80vw)", aspectRatio: "4/3", position: "relative", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              {activeItem.svgContent}
            </div>
          ) : activeItem.url ? (
            <img
              src={activeItem.url}
              alt={activeTitle || "Preview"}
              style={{
                maxWidth: "100%",
                maxHeight: "calc(100vh - 310px)",
                objectFit: "contain",
                display: "block",
                borderRadius: "8px"
              }}
            />
          ) : null}
        </div>

        {/* Next Arrow */}
        {items.length > 1 && (
          <div
            className="lightbox-arrow next-arrow"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            style={{
              position: "absolute",
              right: "20px",
              zIndex: 20,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "50%",
              width: "54px",
              height: "54px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              fontSize: "1.2rem",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.transform = "scale(1)";
            }}
            title={locale === "en" ? "Next" : "Հաջորդ"}
          >
            <span className="hd-icon hd-icon-chevrolt-arrow-right" />
          </div>
        )}
      </div>

      {/* Bottom Panel (Thumbnail strip & info) */}
      <div
        className="lightbox-bottom-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
          width: "100%",
          zIndex: 10
        }}
      >
        {/* Active description detail */}
        {activeDesc ? (
          <p
            style={{
              margin: 0,
              fontSize: "0.88rem",
              opacity: 0.75,
              color: "#fff",
              textAlign: "center",
              maxWidth: "600px",
              minHeight: "20px"
            }}
          >
            {activeDesc}
          </p>
        ) : null}

        {/* Thumbnails strip */}
        {items.length > 1 && (
          <div
            className="lightbox-thumbnails"
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              maxWidth: "100%",
              padding: "4px 0",
              scrollbarWidth: "none"
            }}
          >
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  width: "60px",
                  height: "45px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  cursor: "pointer",
                  border: idx === currentIndex ? "2px solid var(--accent, #14b8a6)" : "2px solid transparent",
                  opacity: idx === currentIndex ? 1 : 0.4,
                  transform: idx === currentIndex ? "scale(1.05)" : "scale(1)",
                  transition: "all 0.2s ease",
                  background: item.bg || "#111",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                {item.url ? (
                  <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : item.svgContent ? (
                  <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
                    {item.svgContent}
                  </div>
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "#222" }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
