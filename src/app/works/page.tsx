"use client";

import { useEffect, useState, Suspense } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { brandingCases as staticCases, getPastelColor, getCasePastelColor } from "@/lib/brandingData";
import { useI18n } from "@/lib/i18n";
import LoadingAnimation from "@/components/LoadingAnimation";

type Case = {
  id: string;
  title: string;
  subtitle: string;
  bg: string;
  image_url?: string;
  details?: string;
  category?: string;
  client?: string;
  year?: string;
  created_at?: string;
};

function parseLangText(text: string, lang: 'hy' | 'en') {
  if (!text) return "";
  const parts = text.split(" | ");
  if (parts.length > 1) {
    return lang === 'en' ? parts[1] : parts[0];
  }
  return text;
}
// Helper to convert dynamic RGB to dark overlay background and bright pastel line color
const getColorsFromRgb = (r: number, g: number, b: number) => {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    h /= 6;
  }

  const hue = Math.round(h * 360);
  const saturation = Math.round(s * 100);

  // Overlay background: dark, semi-transparent HSL
  const overlayBg = `hsla(${hue}, ${Math.min(saturation, 35)}%, 10%, 0.88)`;

  // Line color: bright, pastel HSL (80% lightness, max 55% saturation)
  const lineColor = `hsl(${hue}, ${Math.min(saturation, 55)}%, 80%)`;

  return { overlayBg, lineColor };
};
function WorksContent() {
  const { locale } = useI18n();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<Record<string, { sum: number; count: number }>>({});
  
  // Lightbox slider states
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState<number | null>(null);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState<boolean>(false);
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});
  const [hoverColors, setHoverColors] = useState<Record<string, { overlay: string; line: string }>>({});

  const searchParams = useSearchParams();
  const activeCategory = searchParams ? searchParams.get("category") : null;

  const filteredCases = activeCategory
    ? cases.filter(c => {
        const cat = c.category?.toLowerCase();
        const actCat = activeCategory.toLowerCase();
        
        if (actCat === 'branding') {
          return !c.id.startsWith('port-') && !c.id.startsWith('local-g-');
        }
        
        if (actCat === 'design') {
          return c.id.startsWith('port-') || c.id.startsWith('local-g-');
        }
        
        return cat === actCat;
      })
    : cases;

  // Keyboard navigation & Slideshow for Gallery Lightbox
  useEffect(() => {
    if (selectedGalleryIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedGalleryIndex(null);
        setIsSlideshowPlaying(false);
      } else if (e.key === "ArrowRight") {
        setSelectedGalleryIndex(prev => (prev !== null ? (prev + 1) % filteredCases.length : null));
      } else if (e.key === "ArrowLeft") {
        setSelectedGalleryIndex(prev => (prev !== null ? (prev - 1 + filteredCases.length) % filteredCases.length : null));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedGalleryIndex, filteredCases.length]);

  useEffect(() => {
    if (!isSlideshowPlaying || selectedGalleryIndex === null) return;

    const interval = setInterval(() => {
      setSelectedGalleryIndex(prev => (prev !== null ? (prev + 1) % filteredCases.length : null));
    }, 3000);

    return () => clearInterval(interval);
  }, [isSlideshowPlaying, selectedGalleryIndex, filteredCases.length]);
  useEffect(() => {
    if (selectedGalleryIndex === null) return;

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
  }, [selectedGalleryIndex]);
  const renderCardRating = (workId: string) => {
    const item = ratings[workId];
    if (!item || item.count === 0) return null;
    const avg = (item.sum / item.count).toFixed(1);
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(255,255,0,0.12)", border: "1px solid rgba(255,204,0,0.3)", padding: "4px 8px", borderRadius: "8px", fontSize: "0.8rem", color: "#ffcc00", fontWeight: 700 }}>
        ★ {avg}
      </div>
    );
  };

  useEffect(() => {
    fetch("/api/ratings")
      .then(res => res.json())
      .then(data => setRatings(data || {}))
      .catch(err => console.warn("Failed to load ratings:", err));
  }, []);

  useEffect(() => {
    async function loadCases() {
      try {
        const res = await fetch("/api/cases");
        if (!res.ok) throw new Error("Failed to fetch cases");
        const data = await res.json();
        
        // Map dynamic schema to static fields if necessary
        const mappedDynamic = (data || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          subtitle: c.subtitle,
          bg: c.bg,
          image_url: c.image_url,
          details: c.details,
          category: c.category,
          client: c.client,
          year: c.year,
        }));

        setCases(mappedDynamic);
      } catch (err) {
        console.warn("Using static branding cases fallback:", err);
        setCases(staticCases.map(s => ({
          id: s.id,
          title: s.title,
          subtitle: s.tagline,
          bg: s.color,
          image_url: s.image,
          details: s.description,
          category: s.id === "mobile-ui" || s.id === "posters" ? "Design" : "Branding",
          client: (s as any).client || "HDesign Studio",
          year: (s as any).year || "2026"
        })));
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, []);

  return (
    <main className="shell" style={{ marginTop: "140px", minHeight: "80vh" }}>
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h1 style={{ fontSize: "2.8rem", fontWeight: "900", color: "var(--text)", margin: "0 0 12px 0" }}>
          Աշխատանքներ
        </h1>
        <p style={{ color: "var(--text)", opacity: 0.8, fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
          Յուրաքանչյուր նախագիծ յուրահատուկ պատմություն է՝ ստեղծված մաթեմատիկական ճշգրտությամբ և գեղարվեստական կրքով։
        </p>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <LoadingAnimation fullPage={false} message={locale === "en" ? "Loading works..." : "Բեռնվում է..."} />
        </div>
      )}

      {/* Two-Column Grid for Branding Cases */}
      {!loading && (
        activeCategory?.toLowerCase() === 'design' ? (
          <div className="gallery-grid" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px", paddingBottom: "60px" }}>
            {filteredCases.map((work, index) => {
              const aspectRatio = aspectRatios[work.id] || (work.image_url ? 1.5 : 4/3);
              const colors = hoverColors[work.id];
              const overlayBg = colors?.overlay || "rgba(8, 63, 57, 0.9)";
              const lineColor = colors?.line || getCasePastelColor(work);

              return (
                <div 
                  key={work.id} 
                  className={`gallery-card ${!work.image_url ? 'has-svg' : ''}`}
                  onClick={() => setSelectedGalleryIndex(index)}
                  style={{
                    cursor: "pointer",
                    flexGrow: aspectRatio,
                    flexShrink: aspectRatio,
                    flexBasis: `${aspectRatio * 150}px`,
                    height: "220px"
                  }}
                  title="Դիտել պատկերասրահը"
                >
                  <div className="gallery-img-container" style={{ background: work.bg, width: "100%", height: "100%" }}>
                    {work.image_url && (
                      <img 
                        src={work.image_url} 
                        alt={work.title} 
                        crossOrigin="anonymous"
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          const { naturalWidth, naturalHeight } = img;
                          if (naturalWidth && naturalHeight) {
                            setAspectRatios(prev => ({
                              ...prev,
                              [work.id]: naturalWidth / naturalHeight
                            }));
                          }

                          // Extract average color using canvas
                          try {
                            const canvas = document.createElement("canvas");
                            canvas.width = 1;
                            canvas.height = 1;
                            const ctx = canvas.getContext("2d");
                            if (ctx) {
                              ctx.drawImage(img, 0, 0, 1, 1);
                              const pixel = ctx.getImageData(0, 0, 1, 1).data;
                              const r = pixel[0];
                              const g = pixel[1];
                              const b = pixel[2];
                              
                              const extracted = getColorsFromRgb(r, g, b);
                              setHoverColors(prev => ({
                                ...prev,
                                [work.id]: { overlay: extracted.overlayBg, line: extracted.lineColor }
                              }));
                            }
                          } catch (err) {
                            console.warn("Color extraction failed for", work.id, err);
                          }
                        }}
                        style={{ height: "100%", width: "100%", objectFit: "cover", opacity: 0.9, display: "block" }} 
                      />
                    )}
                  </div>
                  <div className="gallery-overlay" style={{ background: overlayBg }}>
                    {/* Decorative Hover SVGs */}
                    <div className="card-hover-decor top-left">
                      <svg width="32" height="140" viewBox="0 0 32 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect className="svg-pill pill-1" x="0" y="0" width="12" height="90" rx="6" fill={lineColor}></rect>
                        <rect className="svg-pill pill-2" x="20" y="40" width="12" height="90" rx="6" fill={lineColor}></rect>
                      </svg>
                    </div>
                    <div className="card-hover-decor bottom-right">
                      <svg width="32" height="140" viewBox="0 0 32 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect className="svg-pill pill-1" x="0" y="0" width="12" height="90" rx="6" fill={lineColor}></rect>
                        <rect className="svg-pill pill-2" x="20" y="40" width="12" height="90" rx="6" fill={lineColor}></rect>
                      </svg>
                    </div>

                    <div style={{ position: "relative", zIndex: 3 }}>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: "0 0 6px" }}>
                        {parseLangText(work.title, locale === 'en' ? 'en' : 'hy')}
                      </h3>
                      <p style={{ fontSize: "0.85rem", opacity: 0.8, margin: 0 }}>
                        {parseLangText(work.subtitle || "", locale === 'en' ? 'en' : 'hy')}
                      </p>
                    </div>
                  </div>
              </div>
            );
          })}
          </div>
        ) : (
          <div className="branding-two-column-grid" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
            paddingBottom: "60px"
          }}>
            {filteredCases.map((work) => (
              <Link 
                key={work.id} 
                href={`/works/${work.id}`}
                style={{ textDecoration: "none" }}
              >
                <div 
                  className="branding-case-card"
                  style={{
                    position: "relative",
                    borderRadius: "24px",
                    overflow: "visible",
                    aspectRatio: "1.5",
                    backgroundColor: work.bg,
                    boxShadow: "none",
                    cursor: "pointer",
                    transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    border: "1px solid var(--panel-border)"
                  }}
                >
                  {/* Branding Image */}
                  {work.image_url && (
                    <img 
                      src={work.image_url} 
                      alt={work.title} 
                      className="branding-card-img"
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "cover", 
                        opacity: 0.9,
                        transition: "transform 0.5s ease, opacity 0.5s ease"
                      }} 
                    />
                  )}
                  
                  {/* Decorative Hover SVGs */}
                  <div className="card-hover-decor top-left">
                    <svg width="64" height="260" viewBox="0 0 64 260" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect className="svg-pill pill-1" x="0" y="0" width="24" height="180" rx="12" fill={getCasePastelColor(work)}></rect>
                      <rect className="svg-pill pill-2" x="40" y="80" width="24" height="180" rx="12" fill={getCasePastelColor(work)}></rect>
                    </svg>
                  </div>
                  <div className="card-hover-decor bottom-right">
                    <svg width="64" height="260" viewBox="0 0 64 260" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect className="svg-pill pill-1" x="0" y="0" width="24" height="180" rx="12" fill={getCasePastelColor(work)}></rect>
                      <rect className="svg-pill pill-2" x="40" y="80" width="24" height="180" rx="12" fill={getCasePastelColor(work)}></rect>
                    </svg>
                  </div>

                  {/* Hover overlay with detail */}
                  <div 
                    className="branding-card-overlay"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      padding: "40px",
                      boxSizing: "border-box"
                    }}
                  >
                    <span 
                      className="icon-Chevrolt-Arrow-Left" 
                      style={{ 
                        position: "absolute",
                        top: "40px",
                        right: "40px",
                        color: "#ffffff", 
                        fontSize: "1.2rem", 
                        background: "rgba(255,255,255,0.15)",
                        padding: "10px",
                        borderRadius: "50%",
                        transition: "all 0.3s"
                      }} 
                    />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", width: "100%" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ 
                            fontSize: "0.85rem", 
                            fontWeight: 700, 
                            textTransform: "uppercase", 
                            letterSpacing: "2px", 
                            color: "#ffffff", 
                            opacity: 0.7 
                          }}>
                            {parseLangText(work.category || "", locale === 'en' ? 'en' : 'hy') || (locale === 'en' ? "Branding" : "Բրենդավորում")}
                          </span>
                          {renderCardRating(work.id)}
                        </div>
                        <h2 style={{ 
                          fontSize: "1.6rem", 
                          fontWeight: "900", 
                          color: "#ffffff", 
                          margin: 0 
                        }}>
                          {parseLangText(work.title, locale === 'en' ? 'en' : 'hy')}
                        </h2>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {/* ══ DYNAMIC GALLERY LIGHTBOX SLIDER ══ */}
      {selectedGalleryIndex !== null && typeof window !== "undefined" && createPortal(
        <div 
          onClick={() => { setSelectedGalleryIndex(null); setIsSlideshowPlaying(false); }}
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
              <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                {locale === "en" ? "Gallery Preview" : "Պատկերասրահ"} ({selectedGalleryIndex + 1} / {filteredCases.length})
              </span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                {filteredCases[selectedGalleryIndex]?.title}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Slideshow Button */}
              <button
                onClick={() => setIsSlideshowPlaying(prev => !prev)}
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
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"}
              >
                <span>{isSlideshowPlaying ? "⏸" : "▶"}</span>
                <span>{isSlideshowPlaying ? (locale === "en" ? "Pause" : "Դադար") : (locale === "en" ? "Autoplay" : "Ավտոմատ")}</span>
              </button>

              {/* Close Button */}
              <div 
                onClick={() => { setSelectedGalleryIndex(null); setIsSlideshowPlaying(false); }}
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
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"}
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
            {/* Prev Arrow */}
            <div 
              onClick={(e) => { 
                e.stopPropagation(); 
                setSelectedGalleryIndex(prev => (prev !== null ? (prev - 1 + filteredCases.length) % filteredCases.length : null)); 
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
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"; e.currentTarget.style.transform = "scale(1.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              ←
            </div>

            {/* Central Viewport */}
            <div 
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
              {filteredCases[selectedGalleryIndex]?.image_url ? (
                <img 
                  src={filteredCases[selectedGalleryIndex].image_url} 
                  alt={filteredCases[selectedGalleryIndex].title} 
                  style={{
                    maxWidth: "100%",
                    maxHeight: "calc(100vh - 310px)",
                    objectFit: "contain",
                    display: "block",
                    borderRadius: "8px"
                  }}
                />
              ) : (
                <div style={{ color: "#fff" }}>Placeholder</div>
              )}
            </div>

            {/* Next Arrow */}
            <div 
              onClick={(e) => { 
                e.stopPropagation(); 
                setSelectedGalleryIndex(prev => (prev !== null ? (prev + 1) % filteredCases.length : null)); 
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
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"; e.currentTarget.style.transform = "scale(1.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              →
            </div>
          </div>

          {/* Bottom Panel (Thumbnail strip & info) */}
          <div 
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
            <p style={{ margin: 0, fontSize: "0.88rem", opacity: 0.75, color: "#fff", textAlign: "center", maxWidth: "600px", minHeight: "20px" }}>
              {filteredCases[selectedGalleryIndex]?.details || (locale === "en" ? "No details available." : "Այս նախագծի համար մանրամասն նկարագրություն դեռևս ավելացված չէ:")}
            </p>

            {/* Thumbnails strip */}
            <div 
              style={{
                display: "flex",
                gap: "10px",
                overflowX: "auto",
                maxWidth: "100%",
                padding: "4px 0",
                scrollbarWidth: "none"
              }}
            >
              {filteredCases.map((work, idx) => (
                <div
                  key={work.id}
                  onClick={() => setSelectedGalleryIndex(idx)}
                  style={{
                    width: "60px",
                    height: "45px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    cursor: "pointer",
                    border: idx === selectedGalleryIndex ? "2px solid var(--accent)" : "2px solid transparent",
                    opacity: idx === selectedGalleryIndex ? 1 : 0.4,
                    transform: idx === selectedGalleryIndex ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.2s ease",
                    background: work.bg || "#111",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  {work.image_url ? (
                    <img src={work.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ color: "#fff", fontSize: "10px" }}>SVG</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}

export default function WorksPage() {
  return (
    <Suspense fallback={
      <main className="shell" style={{ marginTop: "140px", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingAnimation fullPage={false} />
      </main>
    }>
      <WorksContent />
    </Suspense>
  );
}
