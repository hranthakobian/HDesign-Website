"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";

import SoftwareIcon from "./SoftwareIcon";
import { formatDisplayFileSize } from "@/lib/fileSizeUtils";

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
  appType?: 'plugin' | 'standalone';
  downloads: AppDownloadOption[];
  locale: string;
  microsoftStoreEnabled?: boolean;
  microsoftStoreUrl?: string;
  appStoreEnabled?: boolean;
  appStoreUrl?: string;
  supportedOs?: ('windows' | 'macos' | 'linux')[];
  onDownloaded?: (newCount?: number) => void;
}

export default function AppDownloadModal({
  isOpen,
  onClose,
  appTitle,
  appVersion,
  appId,
  appType = 'plugin',
  downloads,
  locale,
  microsoftStoreEnabled,
  microsoftStoreUrl,
  appStoreEnabled,
  appStoreUrl,
  supportedOs,
  onDownloaded
}: AppDownloadModalProps) {
  const [isRendered, setIsRendered] = React.useState(isOpen);
  const [isClosing, setIsClosing] = React.useState(false);

  const handleStoreClick = async (storeType: 'microsoft' | 'apple') => {
    if (onDownloaded) {
      onDownloaded();
    }
    if (appId) {
      try {
        const targetUrl = storeType === 'microsoft'
          ? (microsoftStoreUrl?.trim() || 'https://apps.microsoft.com/')
          : (appStoreUrl?.trim() || 'https://apps.apple.com/');
        const res = await fetch('/api/apps/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            app_id: appId,
            download_url: targetUrl,
            download_id: `store-${storeType}`
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.downloads_count !== undefined && onDownloaded) {
            onDownloaded(data.downloads_count);
          }
        }
      } catch (err) {
        console.warn('Failed to record store download event:', err);
      }
    }
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleDownload = async (item: AppDownloadOption) => {
    // 1. Optimistically trigger download counter in UI immediately
    if (onDownloaded) {
      onDownloaded();
    }

    if (appId) {
      try {
        const res = await fetch('/api/apps/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
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
    const groups: { osKey: string; title: string; icon: string; items: AppDownloadOption[]; hasStore?: boolean }[] = [];

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

    if (winItems.length > 0 || microsoftStoreEnabled) {
      groups.push({
        osKey: 'windows',
        title: 'Windows',
        icon: '/icons/windows.svg',
        items: winItems,
        hasStore: !!microsoftStoreEnabled
      });
    }

    if (macItems.length > 0 || appStoreEnabled) {
      groups.push({
        osKey: 'macos',
        title: 'macOS',
        icon: '/icons/apple.svg',
        items: macItems,
        hasStore: !!appStoreEnabled
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
  }, [isRendered, validDownloads, locale, microsoftStoreEnabled, appStoreEnabled]);

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
            groupedDownloads.map((group) => {
              const isStandalone = appType === 'standalone';

              return (
                <div key={group.osKey} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {/* OS Section Title Header */}
                  {(!isStandalone || groupedDownloads.length > 1 || group.hasStore) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--panel-border)", paddingBottom: "6px" }}>
                      <SoftwareIcon name={group.title} iconUrl={group.icon} size={18} />
                      <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text)", letterSpacing: "0.02em" }}>
                        {group.title}
                      </span>
                      <span style={{ fontSize: "0.74rem", color: "var(--muted)", marginLeft: "auto", background: "var(--bg)", padding: "2px 8px", borderRadius: "10px", border: "1px solid var(--panel-border)" }}>
                        {group.items.length + (group.hasStore ? 1 : 0)} {locale === "hy" ? "տարբերակ" : "options"}
                      </span>
                    </div>
                  )}

                  {/* Items under OS */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {group.items.map((item, idx) => {
                      // Extract host program / software name cleanly for plugins; for standalone apps, strictly use OS logo and name
                      const softwareName = item.host_app || item.name || group.title;
                      const cleanSoftware = softwareName.replace(/\s*\([^)]*\)/g, '').trim() || softwareName;
                      const displayName = isStandalone ? group.title : cleanSoftware;
                      const displayIcon = isStandalone ? group.icon : (item.icon || group.icon);

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
                          {/* Target info: For standalone apps, ONLY OS logo and OS name + optional file size */}
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
                              <SoftwareIcon name={displayName} iconUrl={displayIcon} size={20} />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                              <span style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text)", lineHeight: 1.3 }}>
                                {displayName}
                              </span>
                              {item.file_size ? (
                                <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, marginTop: "2px" }}>
                                  {formatDisplayFileSize(item.file_size, locale)}
                                </span>
                              ) : null}
                            </div>
                          </div>

                        {/* Download CTA button */}
                        <a
                          href={item.url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
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
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0 20px", fontWeight: 700 }}>
                              <i className="hd-icon hd-icon-download" style={{ fontSize: "0.95rem" }} />
                              <span>{locale === "hy" ? "Ներբեռնել" : "Download"}</span>
                            </span>
                          </hd-button>
                        </a>
                      </div>
                    );
                  })}

                  {/* Microsoft Store Option (under Windows) */}
                  {group.osKey === 'windows' && microsoftStoreEnabled && (
                    <div
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
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: "rgba(0, 164, 239, 0.08)",
                            border: "1px solid var(--panel-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <rect x="2" y="2" width="9.5" height="9.5" rx="1.5" fill="#F25022" />
                            <rect x="12.5" y="2" width="9.5" height="9.5" rx="1.5" fill="#7FBA00" />
                            <rect x="2" y="12.5" width="9.5" height="9.5" rx="1.5" fill="#00A4EF" />
                            <rect x="12.5" y="12.5" width="9.5" height="9.5" rx="1.5" fill="#FFB900" />
                          </svg>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                          <span style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text)", lineHeight: 1.3 }}>
                            Microsoft Store
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, marginTop: "2px" }}>
                            {locale === "hy" ? "Պաշտոնական խանութ" : "Official Store"}
                          </span>
                        </div>
                      </div>

                      <a
                        href={microsoftStoreUrl?.trim() || "https://apps.microsoft.com/"}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: "none", flexShrink: 0 }}
                        onClick={() => handleStoreClick('microsoft')}
                      >
                        <hd-button
                          suppressHydrationWarning
                          data-height="36px"
                          data-thickness="2px"
                          data-font-size="0.8rem"
                          data-color="var(--accent)"
                          data-text-color="#ffffff"
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0 18px", fontWeight: 700 }}>
                            <span>{locale === "hy" ? "Ստանալ" : "Get"}</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                            </svg>
                          </span>
                        </hd-button>
                      </a>
                    </div>
                  )}

                  {/* App Store Option (under macOS) */}
                  {group.osKey === 'macos' && appStoreEnabled && (
                    <div
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
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: "rgba(13, 150, 246, 0.08)",
                            border: "1px solid var(--panel-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}
                        >
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                            <rect width="24" height="24" rx="6" fill="#0D96F6" />
                            <path d="M12 4.5L13.8 7.8M10.2 8L6.8 14.2M17.2 14.2L14.5 9.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M5.5 17.5L10 16.5M14 16.5L18.5 17.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M10 16.2L12 12.5L14 16.2H10Z" fill="#ffffff" />
                          </svg>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                          <span style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text)", lineHeight: 1.3 }}>
                            Mac App Store
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, marginTop: "2px" }}>
                            {locale === "hy" ? "Պաշտոնական խանութ" : "Official Store"}
                          </span>
                        </div>
                      </div>

                      <a
                        href={appStoreUrl?.trim() || "https://apps.apple.com/"}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: "none", flexShrink: 0 }}
                        onClick={() => handleStoreClick('apple')}
                      >
                        <hd-button
                          suppressHydrationWarning
                          data-height="36px"
                          data-thickness="2px"
                          data-font-size="0.8rem"
                          data-color="var(--accent)"
                          data-text-color="#ffffff"
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0 18px", fontWeight: 700 }}>
                            <span>{locale === "hy" ? "Ստանալ" : "Get"}</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                            </svg>
                          </span>
                        </hd-button>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })
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
