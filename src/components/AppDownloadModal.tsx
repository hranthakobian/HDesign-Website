"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";

import SoftwareIcon from "./SoftwareIcon";

export type AppDownloadOption = {
  id?: string;
  name: string;
  url: string;
  file_size?: string;
  version?: string;
  icon?: string;
  os?: 'windows' | 'macos' | 'linux' | 'other';
  host_app?: string;
};

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  appTitle: string;
  appVersion?: string;
  appId?: string;
  downloads: AppDownloadOption[];
  locale: string;
  onDownloaded?: (newCount?: number) => void;
}

export default function AppDownloadModal({
  isOpen,
  onClose,
  appTitle,
  appVersion,
  appId,
  downloads,
  locale,
  onDownloaded
}: AppDownloadModalProps) {
  const [isRendered, setIsRendered] = React.useState(isOpen);
  const [isClosing, setIsClosing] = React.useState(false);

  const handleDownload = async (item: AppDownloadOption) => {
    if (appId) {
      try {
        const res = await fetch('/api/apps/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            app_id: appId,
            download_url: item.url,
            download_id: item.id || ''
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.downloads_count !== undefined && onDownloaded) {
            onDownloaded(data.downloads_count);
          }
        }
      } catch (err) {
        console.warn('Failed to record download event:', err);
      }
    }
    setTimeout(() => {
      onClose();
    }, 500);
  };

  React.useEffect(() => {
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

  const validDownloads = React.useMemo(() => {
    return (downloads || []).filter(d => !!d.url?.trim());
  }, [downloads]);

  // Group downloads by OS
  const groupedDownloads = React.useMemo(() => {
    if (!isRendered) return [];
    const groups: { osKey: string; title: string; icon: string; items: AppDownloadOption[] }[] = [];

    const getOsKey = (item: AppDownloadOption): 'windows' | 'macos' | 'linux' | 'other' => {
      if (item.os === 'windows') return 'windows';
      if (item.os === 'macos') return 'macos';
      if (item.os === 'linux') return 'linux';
      const str = (item.name + ' ' + (item.icon || '') + ' ' + (item.host_app || '')).toLowerCase();
      if (str.includes('win') || str.includes('windows') || str.includes('.exe') || str.includes('.msi')) return 'windows';
      if (str.includes('mac') || str.includes('apple') || str.includes('darwin') || str.includes('.dmg') || str.includes('.pkg')) return 'macos';
      if (str.includes('linux') || str.includes('ubuntu') || str.includes('.appimage') || str.includes('.deb') || str.includes('.tar.gz') || str.includes('.rpm')) return 'linux';
      return 'other';
    };

    const winItems = validDownloads.filter(d => getOsKey(d) === 'windows');
    const macItems = validDownloads.filter(d => getOsKey(d) === 'macos');
    const linuxItems = validDownloads.filter(d => getOsKey(d) === 'linux');
    const otherItems = validDownloads.filter(d => getOsKey(d) === 'other');

    if (winItems.length > 0) {
      groups.push({
        osKey: 'windows',
        title: 'Windows',
        icon: '/icons/windows.svg',
        items: winItems
      });
    }

    if (macItems.length > 0) {
      groups.push({
        osKey: 'macos',
        title: 'macOS',
        icon: '/icons/apple.svg',
        items: macItems
      });
    }

    if (linuxItems.length > 0) {
      groups.push({
        osKey: 'linux',
        title: 'Linux',
        icon: '/icons/linux.svg',
        items: linuxItems
      });
    }

    if (otherItems.length > 0) {
      groups.push({
        osKey: 'other',
        title: locale === 'hy' ? 'Այլ տարբերակներ' : 'Other Platforms',
        icon: '/icons/browser.svg',
        items: otherItems
      });
    }

    return groups;
  }, [isRendered, validDownloads, locale]);

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
          maxHeight: "90vh",
          willChange: "transform, opacity"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px 18px",
            borderBottom: "1px solid var(--panel-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            background: "var(--bg)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "rgba(74, 137, 124, 0.15)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--text)", lineHeight: 1.2 }}>
                {locale === "hy" ? "Ընտրեք ներբեռնման նիշքը" : "Select Download File"}
              </h3>
              <p style={{ margin: "3px 0 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
                {appTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "var(--panel)",
              border: "1px solid var(--panel-border)",
              borderRadius: "50%",
              width: "34px",
              height: "34px",
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

        {/* Modal Body / Downloads List */}
        <div
          style={{
            padding: "20px 24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            maxHeight: "calc(90vh - 110px)"
          }}
        >
          {groupedDownloads.length > 0 ? (
            groupedDownloads.map((group) => (
              <div key={group.osKey} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* OS Section Title Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--panel-border)", paddingBottom: "6px" }}>
                  <SoftwareIcon name={group.title} iconUrl={group.icon} size={18} />
                  <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text)", letterSpacing: "0.02em" }}>
                    {group.title}
                  </span>
                  <span style={{ fontSize: "0.74rem", color: "var(--muted)", marginLeft: "auto", background: "var(--bg)", padding: "2px 8px", borderRadius: "10px", border: "1px solid var(--panel-border)" }}>
                    {group.items.length} {locale === "hy" ? "տարբերակ" : "options"}
                  </span>
                </div>

                {/* Items under OS */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {group.items.map((item, idx) => {
                    // Extract host program / software name cleanly
                    const softwareName = item.host_app || item.name || group.title;
                    const cleanSoftware = softwareName.replace(/\s*\([^)]*\)/g, '').trim() || softwareName;

                    return (
                      <div
                        key={item.id || idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "14px",
                          padding: "12px 16px",
                          borderRadius: "14px",
                          background: "var(--bg)",
                          border: "1px solid var(--panel-border)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {/* Target info: ONLY which software/program it is for + file size */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "10px",
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid var(--panel-border)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0
                            }}
                          >
                            <SoftwareIcon name={cleanSoftware} iconUrl={item.icon || group.icon} size={20} />
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                            <span style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text)", lineHeight: 1.3 }}>
                              {cleanSoftware}
                            </span>
                            {item.file_size ? (
                              <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, marginTop: "2px" }}>
                                {item.file_size}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Download CTA button */}
                        <a
                          href={item.url}
                          download
                          style={{ textDecoration: "none", flexShrink: 0 }}
                          onClick={() => handleDownload(item)}
                        >
                          <hd-button
                            suppressHydrationWarning
                            data-height="36px"
                            data-thickness="2px"
                            data-font-size="0.8rem"
                            data-color="var(--accent)"
                            data-text-color="#ffffff"
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0 12px", fontWeight: 700 }}>
                              <i className="hd-icon hd-icon-download" style={{ fontSize: "0.95rem" }} />
                              <span>{locale === "hy" ? "Ներբեռնել" : "Download"}</span>
                            </span>
                          </hd-button>
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--muted)", fontSize: "0.9rem" }}>
              {locale === "hy" ? "Ներբեռնման նիշքեր հասանելի չեն:" : "No download files available."}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
