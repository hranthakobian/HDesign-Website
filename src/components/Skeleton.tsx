"use client";

import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  width = "100%",
  height = "20px",
  borderRadius = "12px",
  className = "",
  style = {},
}: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer ${className}`.trim()}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius,
        ...style,
      }}
    />
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 1. HOME PAGE SKELETON (Used in src/app/loading.tsx for root `/`)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function HomePageSkeleton() {
  return (
    <main
      className="shell"
      style={{
        paddingTop: "200px",
        minHeight: "85vh",
        paddingBottom: "80px",
        display: "flex",
        flexDirection: "column",
        gap: "48px",
      }}
    >
      {/* Hero Headline & Intro */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "18px",
        }}
      >
        <Skeleton width="340px" height="52px" borderRadius="16px" />
        <Skeleton width="480px" height="22px" borderRadius="10px" />
        <Skeleton width="320px" height="18px" borderRadius="8px" />

        <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
          <Skeleton width="160px" height="46px" borderRadius="12px" />
          <Skeleton width="160px" height="46px" borderRadius="12px" />
        </div>
      </div>

      {/* Featured Poster Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "28px",
          marginTop: "20px",
        }}
      >
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="skeleton-card"
            style={{
              padding: "24px",
              gap: "20px",
            }}
          >
            <Skeleton width="100%" height="240px" borderRadius="16px" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Skeleton width="55%" height="26px" borderRadius="8px" />
              <Skeleton width="20%" height="18px" borderRadius="6px" />
            </div>
            <Skeleton width="80%" height="16px" borderRadius="6px" />
          </div>
        ))}
      </div>
    </main>
  );
}

// Default export for root loading fallback
export const PageSkeleton = HomePageSkeleton;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 2. GALLERY PAGE SKELETON (Used for Պատկերասրահ - Image 1)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function GalleryGridSkeleton() {
  // Proportions matching real artwork cards in the gallery grid
  const galleryAspects = [
    0.72, 0.72, 0.85, 0.85, 0.85, 0.85, 0.7, 0.85, 1.45,
    1.1, 0.72, 2.4, 0.8, 1.4, 0.75,
    1.1, 1.7, 1.3
  ];

  return (
    <div
      className="gallery-grid"
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "24px",
        paddingBottom: "60px",
        width: "100%",
      }}
    >
      {galleryAspects.map((aspect, i) => (
        <div
          key={i}
          className="skeleton-shimmer"
          style={{
            flexGrow: aspect,
            flexShrink: aspect,
            flexBasis: `${aspect * 150}px`,
            height: "220px",
            borderRadius: "24px",
          }}
        />
      ))}
    </div>
  );
}

export function GalleryPageSkeleton() {
  return (
    <main className="shell" style={{ paddingTop: "200px", minHeight: "80vh" }}>
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h1 style={{ fontSize: "2.8rem", fontWeight: "900", color: "var(--text)", margin: 0 }}>
          Պատկերասրահ
        </h1>
      </div>
      <GalleryGridSkeleton />
    </main>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 2B. BRANDING / WORKS PAGE SKELETON (Used for Բրենդինգներ / Աշխատանքներ - Image 2)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function BrandingTwoColumnSkeleton() {
  return (
    <div
      className="branding-two-column-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "40px",
        paddingBottom: "60px",
        width: "100%",
      }}
    >
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="skeleton-shimmer"
          style={{
            position: "relative",
            borderRadius: "24px",
            aspectRatio: "1.5",
            padding: "28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            overflow: "hidden",
            boxSizing: "border-box",
            border: "1px solid var(--panel-border)",
          }}
        >
          {/* Bottom metadata simulation (Badge, Title and Arrow button) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Category pill placeholder: ԲՐԵՆԴԻՆԳ ★ 5.0 */}
              <div
                style={{
                  width: "110px",
                  height: "22px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.22)",
                }}
              />
              {/* Title placeholder */}
              <div
                style={{
                  width: "140px",
                  height: "32px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.32)",
                }}
              />
            </div>

            {/* Right circular arrow button */}
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.25)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BrandingPageSkeleton() {
  return (
    <main className="shell" style={{ paddingTop: "200px", minHeight: "80vh" }}>
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h1 style={{ fontSize: "2.8rem", fontWeight: "900", color: "var(--text)", margin: 0 }}>
          Աշխատանքներ
        </h1>
      </div>
      <BrandingTwoColumnSkeleton />
    </main>
  );
}

// Backward compatible aliases
export const WorksGridSkeleton = BrandingTwoColumnSkeleton;
export const WorksPageSkeleton = BrandingPageSkeleton;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 3. FONTS PAGE SKELETON (Used in src/app/fonts/loading.tsx)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function FontsPageSkeleton() {
  return (
    <main className="shell" style={{ paddingTop: "200px", minHeight: "80vh", paddingBottom: "60px" }}>
      {/* Header Panel */}
      <div
        className="about-section-shell-width"
        style={{
          background: "var(--panel)",
          borderRadius: "24px",
          padding: "50px 40px",
          border: "1px solid var(--panel-border)",
          boxShadow: "var(--shadow)",
          marginBottom: "40px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <Skeleton width="340px" height="46px" borderRadius="14px" />
        <Skeleton width="560px" height="20px" borderRadius="8px" />
      </div>

      {/* Sandbox Search & Filters Card */}
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--panel-border)",
          borderRadius: "20px",
          padding: "24px",
          marginBottom: "32px",
          boxShadow: "var(--shadow)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "280px" }}>
            <Skeleton width="100%" height="46px" borderRadius="12px" />
          </div>
          <Skeleton width="180px" height="46px" borderRadius="12px" />
        </div>
        <div style={{ borderTop: "1px solid var(--panel-border)", paddingTop: "20px" }}>
          <Skeleton width="100%" height="44px" borderRadius="12px" />
        </div>
      </div>

      {/* Grid of Fonts */}
      <FontsListSkeleton />
    </main>
  );
}

export function FontsListSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", paddingBottom: "60px" }}>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="skeleton-card"
          style={{
            padding: "30px",
            display: "grid",
            gridTemplateColumns: "1.2fr 2fr",
            gap: "30px",
          }}
        >
          {/* Left Side: Meta */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              borderRight: "1px solid var(--panel-border)",
              paddingRight: "30px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "70%" }}>
                <Skeleton width="160px" height="26px" borderRadius="8px" />
                <Skeleton width="90px" height="14px" borderRadius="6px" />
              </div>
              <Skeleton width="60px" height="24px" borderRadius="6px" />
            </div>
            <Skeleton width="100%" height="45px" borderRadius="10px" />
            <Skeleton width="110px" height="34px" borderRadius="10px" style={{ marginTop: "auto" }} />
          </div>

          {/* Right Side: Specimen lines */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "16px" }}>
            <Skeleton width="90%" height="32px" borderRadius="8px" />
            <Skeleton width="75%" height="22px" borderRadius="8px" />
            <Skeleton width="60%" height="18px" borderRadius="8px" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 4. FONT DETAIL PAGE SKELETON (Used in src/app/fonts/[id]/loading.tsx)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function FontDetailPageSkeleton() {
  return (
    <main className="shell" style={{ paddingTop: "200px", minHeight: "80vh", paddingBottom: "60px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {/* Header Breadcrumb & Title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Skeleton width="120px" height="18px" borderRadius="6px" />
            <Skeleton width="280px" height="42px" borderRadius="12px" />
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Skeleton width="120px" height="42px" borderRadius="10px" />
            <Skeleton width="140px" height="42px" borderRadius="10px" />
          </div>
        </div>

        {/* Big Preview Area */}
        <div className="skeleton-card" style={{ padding: "40px", gap: "24px" }}>
          <Skeleton width="100%" height="120px" borderRadius="14px" />
          <div style={{ display: "flex", gap: "16px" }}>
            <Skeleton width="40%" height="24px" borderRadius="8px" />
            <Skeleton width="30%" height="24px" borderRadius="8px" />
          </div>
        </div>

        {/* Character Grid */}
        <div className="skeleton-card" style={{ padding: "30px", gap: "20px" }}>
          <Skeleton width="200px" height="24px" borderRadius="8px" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))", gap: "8px" }}>
            {[...Array(28)].map((_, i) => (
              <Skeleton key={i} width="100%" height="44px" borderRadius="8px" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export const FontDetailSkeleton = FontDetailPageSkeleton;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 5. APPS PAGE SKELETON (Used in src/app/apps/loading.tsx)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function AppsPageSkeleton() {
  return (
    <main className="shell" style={{ paddingTop: "200px", minHeight: "80vh", paddingBottom: "60px" }}>
      {/* Header Panel */}
      <div
        className="about-section-shell-width"
        style={{
          background: "var(--panel)",
          borderRadius: "24px",
          padding: "40px",
          border: "1px solid var(--panel-border)",
          boxShadow: "var(--shadow)",
          marginBottom: "36px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <Skeleton width="340px" height="46px" borderRadius="14px" />
        <Skeleton width="620px" height="20px" borderRadius="8px" />
      </div>

      {/* Filter Sandbox & Search Bar */}
      <div
        className="skeleton-card"
        style={{
          borderRadius: "20px",
          padding: "20px 24px",
          marginBottom: "36px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 240px", minWidth: "220px" }}>
            <Skeleton width="100%" height="38px" borderRadius="10px" />
          </div>
          <Skeleton width="260px" height="38px" borderRadius="10px" />
          <Skeleton width="200px" height="38px" borderRadius="10px" />
          <Skeleton width="100px" height="38px" borderRadius="10px" />
        </div>
      </div>

      {/* Grid of Apps */}
      <AppsGridSkeleton />
    </main>
  );
}

export function AppsGridSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "28px",
        paddingBottom: "60px",
      }}
    >
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="skeleton-card"
          style={{
            borderRadius: "20px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Card Media Preview */}
          <Skeleton width="100%" height="190px" borderRadius="0px" />

          {/* Card Body */}
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
              <Skeleton width="48px" height="48px" borderRadius="14px" />
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                <Skeleton width="70%" height="20px" borderRadius="6px" />
                <Skeleton width="40%" height="14px" borderRadius="6px" />
              </div>
            </div>

            <Skeleton width="100%" height="14px" borderRadius="6px" />
            <Skeleton width="80%" height="14px" borderRadius="6px" />

            {/* Bottom Meta */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "auto",
                paddingTop: "14px",
                borderTop: "1px solid var(--panel-border)",
              }}
            >
              <Skeleton width="80px" height="18px" borderRadius="6px" />
              <Skeleton width="100px" height="34px" borderRadius="10px" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 6. APP DETAIL PAGE SKELETON (Used in src/app/apps/[id]/loading.tsx)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function AppDetailPageSkeleton() {
  return (
    <main className="shell" style={{ paddingTop: "150px", minHeight: "80vh", paddingBottom: "60px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {/* App Hero */}
        <div
          className="skeleton-card"
          style={{
            padding: "36px",
            display: "flex",
            gap: "28px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Skeleton width="100px" height="100px" borderRadius="24px" />
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
            <Skeleton width="260px" height="34px" borderRadius="10px" />
            <Skeleton width="180px" height="18px" borderRadius="8px" />
            <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
              <Skeleton width="75px" height="24px" borderRadius="6px" />
              <Skeleton width="90px" height="24px" borderRadius="6px" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Skeleton width="150px" height="46px" borderRadius="12px" />
          </div>
        </div>

        {/* Content Preview & Details */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "28px" }}>
          <div className="skeleton-card" style={{ padding: "30px", gap: "20px" }}>
            <Skeleton width="100%" height="320px" borderRadius="16px" />
            <Skeleton width="100%" height="16px" borderRadius="6px" />
            <Skeleton width="90%" height="16px" borderRadius="6px" />
            <Skeleton width="70%" height="16px" borderRadius="6px" />
          </div>
          <div className="skeleton-card" style={{ padding: "26px", gap: "18px" }}>
            <Skeleton width="120px" height="22px" borderRadius="8px" />
            <Skeleton width="100%" height="40px" borderRadius="10px" />
            <Skeleton width="100%" height="40px" borderRadius="10px" />
            <Skeleton width="100%" height="40px" borderRadius="10px" />
          </div>
        </div>
      </div>
    </main>
  );
}

export const AppDetailSkeleton = AppDetailPageSkeleton;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 7. ABOUT PAGE SKELETON (Used in src/app/about/loading.tsx)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function AboutPageSkeleton() {
  return (
    <main className="shell" style={{ paddingTop: "200px", minHeight: "80vh", paddingBottom: "60px" }}>
      <div
        className="about-section-shell-width skeleton-card"
        style={{
          borderRadius: "24px",
          padding: "80px 40px",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "56px" }} className="about-grid">
          {/* Left Column: Profile Photo */}
          <Skeleton width="100%" height="420px" borderRadius="20px" />

          {/* Right Column: Bio Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <Skeleton width="280px" height="46px" borderRadius="12px" />
            <div style={{ display: "flex", gap: "10px" }}>
              <Skeleton width="90px" height="26px" borderRadius="6px" />
              <Skeleton width="120px" height="26px" borderRadius="6px" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
              <Skeleton width="100%" height="16px" borderRadius="6px" />
              <Skeleton width="95%" height="16px" borderRadius="6px" />
              <Skeleton width="90%" height="16px" borderRadius="6px" />
              <Skeleton width="80%" height="16px" borderRadius="6px" />
              <Skeleton width="85%" height="16px" borderRadius="6px" />
            </div>
            <div style={{ display: "flex", gap: "14px", marginTop: "16px" }}>
              <Skeleton width="42px" height="42px" borderRadius="50%" />
              <Skeleton width="42px" height="42px" borderRadius="50%" />
              <Skeleton width="42px" height="42px" borderRadius="50%" />
              <Skeleton width="42px" height="42px" borderRadius="50%" />
            </div>
            <Skeleton width="180px" height="48px" borderRadius="12px" style={{ marginTop: "12px" }} />
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 8. CONTACT PAGE SKELETON (Used in src/app/contact/loading.tsx)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function ContactPageSkeleton() {
  return (
    <main className="shell" style={{ paddingTop: "200px", minHeight: "80vh", paddingBottom: "60px" }}>
      <div
        className="about-section-shell-width skeleton-card"
        style={{
          borderRadius: "24px",
          padding: "60px 40px",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "48px" }} className="contact-grid">
          {/* Left: Contact Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <Skeleton width="160px" height="44px" borderRadius="12px" />
            <Skeleton width="80%" height="18px" borderRadius="6px" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "10px" }}>
              <Skeleton width="100%" height="48px" borderRadius="12px" />
              <Skeleton width="100%" height="48px" borderRadius="12px" />
            </div>
            <Skeleton width="100%" height="48px" borderRadius="12px" />
            <Skeleton width="100%" height="120px" borderRadius="12px" />
            <Skeleton width="180px" height="48px" borderRadius="12px" style={{ marginTop: "8px" }} />
          </div>

          {/* Right: Direct Contacts */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              padding: "32px",
              borderRadius: "20px",
              background: "var(--bg)",
              border: "1px solid var(--panel-border)",
            }}
          >
            <Skeleton width="180px" height="26px" borderRadius="8px" />
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                <Skeleton width="40px" height="40px" borderRadius="10px" />
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <Skeleton width="60px" height="12px" borderRadius="4px" />
                  <Skeleton width="160px" height="18px" borderRadius="6px" />
                </div>
              </div>
              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                <Skeleton width="40px" height="40px" borderRadius="10px" />
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <Skeleton width="60px" height="12px" borderRadius="4px" />
                  <Skeleton width="140px" height="18px" borderRadius="6px" />
                </div>
              </div>
              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                <Skeleton width="40px" height="40px" borderRadius="10px" />
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <Skeleton width="60px" height="12px" borderRadius="4px" />
                  <Skeleton width="180px" height="18px" borderRadius="6px" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 9. OCR PAGE SKELETON (Used in src/app/ocr/loading.tsx)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function OcrPageSkeleton() {
  return (
    <main className="shell" style={{ paddingTop: "200px", minHeight: "85vh", paddingBottom: "60px" }}>
      {/* Header Bar */}
      <div
        className="skeleton-card"
        style={{
          borderRadius: "20px",
          padding: "20px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Skeleton width="36px" height="36px" borderRadius="10px" />
          <Skeleton width="180px" height="26px" borderRadius="8px" />
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Skeleton width="100px" height="36px" borderRadius="10px" />
          <Skeleton width="100px" height="36px" borderRadius="10px" />
        </div>
      </div>

      {/* 2-Column OCR Workspace */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div className="skeleton-card" style={{ padding: "30px", height: "460px", gap: "20px" }}>
          <Skeleton width="100%" height="100%" borderRadius="16px" />
        </div>
        <div className="skeleton-card" style={{ padding: "24px", height: "460px", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Skeleton width="140px" height="32px" borderRadius="8px" />
            <Skeleton width="100px" height="32px" borderRadius="8px" />
          </div>
          <Skeleton width="100%" height="100%" borderRadius="14px" />
        </div>
      </div>
    </main>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 10. HDESIGN PAGE SKELETON (Used in src/app/hdesign/loading.tsx)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function HDesignPageSkeleton() {
  return (
    <main className="shell" style={{ paddingTop: "200px", minHeight: "80vh", paddingBottom: "60px" }}>
      {/* Hero Header */}
      <div
        className="about-section-shell-width skeleton-card"
        style={{
          borderRadius: "24px",
          padding: "60px 40px",
          marginBottom: "48px",
          gap: "18px",
        }}
      >
        <Skeleton width="360px" height="46px" borderRadius="14px" />
        <Skeleton width="650px" height="20px" borderRadius="8px" />
        <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
          <Skeleton width="180px" height="48px" borderRadius="12px" />
          <Skeleton width="180px" height="48px" borderRadius="12px" />
        </div>
      </div>

      {/* 2-Column Tokens Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "40px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <Skeleton width="240px" height="32px" borderRadius="10px" />
          <div className="skeleton-card" style={{ padding: "24px", gap: "12px" }}>
            <Skeleton width="50%" height="22px" borderRadius="6px" />
            <Skeleton width="90%" height="15px" borderRadius="6px" />
            <Skeleton width="85%" height="15px" borderRadius="6px" />
          </div>
          <div className="skeleton-card" style={{ padding: "24px", gap: "12px" }}>
            <Skeleton width="50%" height="22px" borderRadius="6px" />
            <Skeleton width="90%" height="15px" borderRadius="6px" />
            <Skeleton width="85%" height="15px" borderRadius="6px" />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Skeleton width="200px" height="32px" borderRadius="10px" />
          <div className="skeleton-card" style={{ padding: "24px", gap: "16px" }}>
            <Skeleton width="100%" height="48px" borderRadius="10px" />
            <Skeleton width="100%" height="48px" borderRadius="10px" />
            <Skeleton width="100%" height="48px" borderRadius="10px" />
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 11. SEARCH RESULTS SKELETON (Used in SearchModal)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function SearchSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "12px 14px",
            background: "var(--panel)",
            borderRadius: "14px",
            border: "1px solid var(--panel-border)",
          }}
        >
          <Skeleton width="40px" height="40px" borderRadius="10px" />
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
            <Skeleton width="50%" height="18px" borderRadius="6px" />
            <Skeleton width="75%" height="13px" borderRadius="6px" />
          </div>
          <Skeleton width="60px" height="20px" borderRadius="6px" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
