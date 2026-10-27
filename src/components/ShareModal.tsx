"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  url?: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  title,
  description,
  url: customUrl
}: ShareModalProps) {
  const { locale } = useI18n();
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(customUrl || window.location.href);
    }
  }, [customUrl, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
      setCopied(false);
    } else if (isRendered) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, 240);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered]);

  useEffect(() => {
    if (!isRendered || isClosing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRendered, isClosing, onClose]);

  if (!isRendered) return null;

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        const input = document.createElement("input");
        input.value = currentUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2600);
    } catch (err) {
      console.warn("Failed to copy link:", err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator?.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: currentUrl
        });
        onClose();
      } catch {
        // User dismissed native share sheet
      }
    }
  };

  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(`${title}${description ? ` — ${description}` : ''}`);

  const platforms = [
    {
      name: "Telegram",
      color: "#229ED9",
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
        </svg>
      )
    },
    {
      name: "WhatsApp",
      color: "#25D366",
      url: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.41a8.164 8.164 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.31 3.8.6.26 1.07.42 1.44.54.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29z"/>
        </svg>
      )
    },
    {
      name: "Facebook",
      color: "#1877F2",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    {
      name: "X / Twitter",
      color: "#1DA1F2",
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      name: "LinkedIn",
      color: "#0A66C2",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
        </svg>
      )
    },
    {
      name: "Viber",
      color: "#7360F2",
      url: `viber://forward?text=${encodedTitle}%20${encodedUrl}`,
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M20.47 16.48c-.68-.53-1.61-.43-2.19.22l-.77.87c-2.48-1.43-4.22-3.17-5.65-5.65l.87-.77c.65-.58.75-1.51.22-2.19L11.5 7.15c-.53-.68-1.49-.8-2.17-.28L7.6 8.21c-.65.51-.97 1.37-.8 2.18 1.05 4.96 4.97 8.88 9.93 9.93.81.17 1.67-.15 2.18-.8l1.34-1.73c.52-.68.4-1.64-.28-2.17l-1.5-1.14zM16.5 2.5C18.98 3.03 20.97 5.02 21.5 7.5c.12.55-.24 1.09-.79 1.21-.55.12-1.09-.24-1.21-.79-.41-1.89-1.82-3.3-3.71-3.71-.55-.12-.91-.66-.79-1.21.12-.55.66-.91 1.21-.79zm-1 3.5c1.42.36 2.64 1.58 3 3 .12.55-.24 1.09-.79 1.21-.55.12-1.09-.24-1.21-.79-.22-.98-1.02-1.78-2-2-.55-.12-.91-.66-.79-1.21.12-.55.66-.91 1.21-.79z"/>
        </svg>
      )
    }
  ];

  const modalContent = (
    <div
      className={`hd-modal-backdrop ${isClosing ? "closing" : ""}`}
      data-modal-backdrop="true"
      data-closing={isClosing ? "true" : undefined}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        className={`hd-modal-container ${isClosing ? "closing" : ""}`}
        data-modal-container="true"
        data-closing={isClosing ? "true" : undefined}
        style={{
          background: "var(--panel)",
          borderRadius: "24px",
          border: "1px solid var(--panel-border)",
          boxShadow: "0 24px 70px rgba(0, 0, 0, 0.5)",
          width: "100%",
          maxWidth: "480px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "92vh",
          willChange: "transform, opacity"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--panel-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "rgba(var(--hue, 172), 77%, 14%, 0.12)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <i className="hd-icon hd-icon-share-arrow-right" style={{ fontSize: "1.3rem" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>
                {locale === "hy" ? "Կիսվել" : "Share"}
              </h2>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--muted)",
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "280px"
                }}
              >
                {title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              transition: "all 0.2s"
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "22px",
            overflowY: "auto"
          }}
        >
          {/* Copy Link Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              {locale === "hy" ? "Էջի Հղումը" : "Page Link"}
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "var(--bg)",
                border: "1px solid var(--panel-border)",
                borderRadius: "14px",
                padding: "6px 8px 6px 14px",
                gap: "10px",
                transition: "border-color 0.2s"
              }}
            >
              <input
                type="text"
                readOnly
                value={currentUrl}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--text)",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />

              <button
                type="button"
                onClick={handleCopy}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: copied ? "var(--accent)" : "var(--panel)",
                  color: copied ? "#ffffff" : "var(--text)",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: copied ? "0 4px 12px rgba(8, 63, 57, 0.3)" : "none",
                  flexShrink: 0
                }}
              >
                <i
                  className={copied ? "hd-icon hd-icon-check" : "hd-icon hd-icon-copy"}
                  style={{ fontSize: "1.05rem", lineHeight: 1 }}
                />
                <span>{copied ? (locale === "hy" ? "Պատճենված է" : "Copied!") : (locale === "hy" ? "Պատճենել" : "Copy")}</span>
              </button>
            </div>
          </div>

          {/* Social Networks Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              {locale === "hy" ? "Կիսվել սոցցանցերով" : "Share via Social Networks"}
            </span>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "10px"
              }}
            >
              {platforms.map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "16px 12px",
                    borderRadius: "16px",
                    background: "var(--bg)",
                    border: "1px solid var(--panel-border)",
                    textDecoration: "none",
                    color: "var(--text)",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = p.color;
                    e.currentTarget.style.boxShadow = `0 6px 18px ${p.color}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "var(--panel-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: `${p.color}18`,
                      color: p.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {p.icon}
                  </div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, textAlign: "center" }}>
                    {p.name}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Native Web Share Button (if supported) */}
          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <button
              type="button"
              onClick={handleNativeShare}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                width: "100%",
                padding: "12px",
                borderRadius: "14px",
                border: "1px dashed var(--panel-border)",
                background: "transparent",
                color: "var(--text)",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.9rem",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.background = "var(--bg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--panel-border)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <i className="hd-icon hd-icon-share-arrow-right" style={{ fontSize: "1.1rem" }} />
              <span>{locale === "hy" ? "Բացել համակարգային կիսվելու ընտրացանկը" : "More sharing options..."}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}
