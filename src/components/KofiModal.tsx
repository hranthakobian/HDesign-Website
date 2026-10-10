"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n";

interface KofiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KofiModal({ isOpen, onClose }: KofiModalProps) {
  const { locale } = useI18n();
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
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
          maxWidth: "520px",
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
            padding: "18px 24px",
            borderBottom: "1px solid var(--panel-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            background: "var(--bg)"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--text)", lineHeight: 1.2 }}>
              {locale === "hy" ? "Տուր մի բաժակ սուրճ" : "Buy me a coffee"}
            </h3>
            <p style={{ margin: "3px 0 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
              {locale === "hy" ? "Հրանտ Հակոբյան" : "Hrant Hakobyan"}
            </p>
          </div>

          <button
            type="button"
            className="no-default-btn-style"
            onClick={onClose}
            style={{
              background: "var(--panel)",
              border: "1px solid var(--panel-border)",
              borderRadius: "50%",
              width: "34px",
              height: "34px",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text)",
              fontSize: "18px",
              lineHeight: 1,
              transition: "transform 0.15s ease"
            }}
            title={locale === "hy" ? "Փակել" : "Close"}
          >
            &times;
          </button>
        </div>

        {/* Modal Body with Ko-fi Iframe */}
        <div
          style={{
            padding: "12px",
            background: "var(--bg)",
            overflowY: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <iframe
            id="kofiframe"
            src="https://ko-fi.com/hranthakobian/?hidefeed=true&widget=true&embed=true&preview=true"
            style={{
              border: "none",
              width: "100%",
              padding: "4px",
              background: "#f9f9f9",
              borderRadius: "14px",
              display: "block"
            }}
            height="712"
            title="hranthakobian"
          />
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
