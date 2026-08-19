"use client";

import { useEffect, useState, Suspense } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { brandingCases as staticCases, getPastelColor, getCasePastelColor } from "@/lib/brandingData";
import { useI18n, parseLangText } from "@/lib/i18n";
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
  const { locale, t } = useI18n();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<Record<string, { sum: number; count: number }>>({});
  
  // Lightbox slider states
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState<number | null>(null);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState<boolean>(false);
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});
  const [hoverColors, setHoverColors] = useState<Record<string, { overlay: string; line: string }>>({});

  const getSvgForCase = (caseId: string) => {
    const cleanId = String(caseId).toLowerCase();
    
    // Gallery Works SVGs
    if (cleanId === 'local-g-1') {
      return (
        <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <rect x="40" y="20" width="120" height="110" fill="rgba(255,255,255,0.03)" stroke="rgba(212,175,55,0.4)" strokeWidth="3" />
          <circle cx="100" cy="75" r="25" stroke="rgba(212,175,55,0.5)" strokeWidth="2" />
          <path d="M85 75 L115 75 M100 60 L100 90" stroke="rgba(212,175,55,0.5)" strokeWidth="2" />
          <text x="100" y="120" fill="rgba(212,175,55,0.6)" fontSize="8" textAnchor="middle" fontWeight="bold" fontFamily="HDesign">ՀԱՅԱՍՏԱՆ</text>
        </svg>
      );
    }
    if (cleanId === 'local-g-2') {
      return (
        <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <circle cx="70" cy="60" r="30" fill="#ffeb3b" />
          <circle cx="130" cy="90" r="35" fill="#26a69a" />
          <text x="100" y="80" fill="#ffffff" fontSize="22" fontWeight="900" textAnchor="middle" letterSpacing="2">BAUNS</text>
          <text x="100" y="105" fill="#ffeb3b" fontSize="12" fontWeight="bold" textAnchor="middle">FESTIVAL</text>
        </svg>
      );
    }
    if (cleanId === 'local-g-3') {
      return (
        <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <rect x="20" y="20" width="160" height="110" fill="rgba(0,0,0,0.2)" stroke="#ffc107" strokeWidth="1" />
          <line x1="100" y1="20" x2="100" y2="130" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
          <text x="60" y="50" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">ՍԱՅԱԹ-ՆՈՎԱ</text>
          <text x="60" y="70" fill="#ffc107" fontSize="8" textAnchor="middle">1722 - 1785</text>
          <rect x="120" y="40" width="40" height="60" rx="2" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" />
        </svg>
      );
    }
    if (cleanId === 'local-g-4') {
      return (
        <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <path d="M70 100 L100 40 L130 100 Z" fill="rgba(255,255,255,0.05)" stroke="#ffffff" strokeWidth="3" />
          <path d="M85 70 L100 40 L115 70" fill="none" stroke="#d84315" strokeWidth="3" />
          <line x1="100" y1="40" x2="100" y2="100" stroke="#ff8f00" strokeWidth="2" />
          <text x="100" y="125" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle" letterSpacing="1">#ARTSAKH</text>
        </svg>
      );
    }
    if (cleanId === 'local-g-5') {
      return (
        <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <circle cx="100" cy="75" r="40" stroke="#00b0ff" strokeWidth="2" strokeDasharray="3 3" />
          <path d="M80 85 C 80 50, 120 50, 120 85" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="55" r="10" fill="#ffffff" />
          <line x1="100" y1="95" x2="100" y2="125" stroke="#00b0ff" strokeWidth="2" />
        </svg>
      );
    }
    if (cleanId === 'local-g-6') {
      return (
        <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <path d="M70 40 L70 110 A 20 20 0 0 0 90 90 L90 70 A 20 20 0 0 1 110 50 L110 110" stroke="#81c784" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="110" cy="110" r="4" fill="#ffffff" />
        </svg>
      );
    }
    if (cleanId === 'local-g-7') {
      return (
        <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <rect x="60" y="30" width="80" height="90" rx="8" fill="rgba(255,255,255,0.02)" stroke="#d7ccc8" strokeWidth="4" />
          <line x1="100" y1="30" x2="100" y2="120" stroke="#d7ccc8" strokeWidth="2" />
          <line x1="60" y1="75" x2="140" y2="75" stroke="#d7ccc8" strokeWidth="2" />
          <circle cx="100" cy="75" r="3" fill="#ffeb3b" />
        </svg>
      );
    }
    if (cleanId === 'local-g-8') {
      return (
        <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <circle cx="100" cy="75" r="45" stroke="#ffeb3b" strokeWidth="1" />
          <rect x="65" y="40" width="70" height="70" stroke="#2196f3" strokeWidth="1" transform="rotate(45 100 75)" />
          <line x1="50" y1="25" x2="150" y2="125" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
          <line x1="150" y1="25" x2="50" y2="125" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        </svg>
      );
    }

    // Branding Cases SVGs
    if (cleanId === 'pasta' || cleanId === 'local-b-1' || cleanId === 'seed-1') {
      return (
        <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <rect width="200" height="150" fill="var(--panel)" />
          <path d="M 35,120 C 50,40 150,40 165,120" stroke="var(--primary-color)" strokeWidth="6" strokeLinecap="round" />
          <path d="M 55,120 C 70,60 130,60 145,120" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
          <path d="M 75,120 C 85,85 115,85 125,120" stroke="#fbc02d" strokeWidth="2" strokeLinecap="round" />
          <path d="M 100,15 L 100,75 M 85,25 L 115,25 M 85,15 L 85,25 M 115,15 L 115,25 M 100,15 L 100,25" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round" />
          <text x="100" y="112" fill="var(--text)" fontSize="13" fontWeight="bold" textAnchor="middle" letterSpacing="1" fontFamily="HDesign">PASTA</text>
        </svg>
      );
    }
    if (cleanId === 'eleven' || cleanId === 'local-b-2' || cleanId === 'seed-2') {
      return (
        <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <rect width="200" height="150" fill="var(--panel)" />
          <line x1="88" y1="35" x2="88" y2="105" stroke="var(--primary-color)" strokeWidth="10" strokeLinecap="round" />
          <line x1="112" y1="35" x2="112" y2="105" stroke="var(--primary-color)" strokeWidth="10" strokeLinecap="round" />
          <circle cx="100" cy="70" r="45" stroke="var(--text)" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x="100" y="128" fill="var(--text)" fontSize="10" fontWeight="700" textAnchor="middle" letterSpacing="3">ELEVEN</text>
        </svg>
      );
    }
    if (cleanId === 'posters' || cleanId === 'local-b-3' || cleanId === 'seed-3') {
      return (
        <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <rect width="200" height="150" fill="var(--panel)" />
          <rect x="35" y="20" width="130" height="110" stroke="var(--text)" strokeWidth="2" />
          <line x1="35" y1="75" x2="165" y2="75" stroke="var(--panel-border)" strokeWidth="1" />
          <line x1="100" y1="20" x2="100" y2="130" stroke="var(--panel-border)" strokeWidth="1" />
          <text x="67" y="55" fill="var(--text)" fontSize="18" fontWeight="900" textAnchor="middle" fontFamily="HDesign">P</text>
          <text x="133" y="55" fill="var(--primary-color)" fontSize="18" fontWeight="900" textAnchor="middle" fontFamily="HDesign">S</text>
          <text x="67" y="110" fill="var(--primary-color)" fontSize="18" fontWeight="900" textAnchor="middle" fontFamily="HDesign">T</text>
          <text x="133" y="110" fill="var(--text)" fontSize="18" fontWeight="900" textAnchor="middle" fontFamily="HDesign">R</text>
        </svg>
      );
    }
    if (cleanId === 'teal-lines' || cleanId === 'teal' || cleanId === 'local-b-4' || cleanId === 'seed-4') {
      return (
        <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <rect width="200" height="150" fill="var(--panel)" />
          <path d="M 20,40 L 180,40 M 20,75 L 180,75 M 20,110 L 180,110" stroke="var(--panel-border)" strokeWidth="1" />
          <path d="M 40,20 L 40,130 M 100,20 L 100,130 M 160,20 L 160,130" stroke="var(--panel-border)" strokeWidth="1" />
          <path d="M 30,30 L 170,120" stroke="var(--primary-color)" strokeWidth="4" strokeLinecap="round" />
          <path d="M 30,120 L 170,30" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="100" cy="75" r="12" fill="var(--panel)" stroke="var(--primary-color)" strokeWidth="2.5" />
          <text x="100" y="78" fill="var(--text)" fontSize="8" fontWeight="900" textAnchor="middle">TEAL</text>
        </svg>
      );
    }
    if (cleanId === 'mobile-ui' || cleanId === 'mobile' || cleanId === 'local-b-5' || cleanId === 'seed-5') {
      return (
        <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <rect width="200" height="150" fill="var(--panel)" />
          <rect x="70" y="15" width="60" height="120" rx="8" stroke="var(--text)" strokeWidth="3" fill="var(--input-bg)" />
          <rect x="92" y="20" width="16" height="3" rx="1.5" fill="var(--text)" />
          <circle cx="85" cy="45" r="7" fill="var(--primary-color)" />
          <rect x="96" y="40" width="22" height="4" rx="2" fill="var(--text)" opacity="0.6" />
          <rect x="96" y="47" width="14" height="3" rx="1.5" fill="var(--text)" opacity="0.4" />
          <rect x="80" y="65" width="40" height="24" rx="4" fill="var(--panel-border)" stroke="var(--text)" strokeWidth="1" />
          <rect x="80" y="97" width="18" height="18" rx="3" fill="var(--primary-color)" />
          <rect x="102" y="97" width="18" height="18" rx="3" fill="var(--accent)" />
          <rect x="90" y="130" width="20" height="2" rx="1" fill="var(--text)" opacity="0.5" />
        </svg>
      );
    }
    return null;
  };

  const searchParams = useSearchParams();
  const activeCategory = searchParams ? searchParams.get("category") : null;

  const filteredCases = activeCategory
    ? cases.filter(c => {
        const cat = c.category?.toLowerCase();
        const actCat = activeCategory.toLowerCase();
        
        if (actCat === 'branding') {
          return !c.id.startsWith('port-') && !c.id.startsWith('local-g-') && cat !== 'design';
        }
        
        if (actCat === 'design' || actCat === 'gallery') {
          return c.id.startsWith('port-') || c.id.startsWith('local-g-') || cat === 'design';
        }
        
        return cat === actCat;
      })
    : cases.filter(c => !c.id.startsWith('port-') && !c.id.startsWith('local-g-') && c.category?.toLowerCase() !== 'design');

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
        <h1 style={{ fontSize: "2.8rem", fontWeight: "900", color: "var(--text)", margin: "0" }}>
          {activeCategory?.toLowerCase() === 'design' || activeCategory?.toLowerCase() === 'gallery'
            ? (locale === 'en' ? 'Gallery' : 'Պատկերասրահ')
            : t('works_page', 'title', 'Աշխատանքներ')}
        </h1>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <LoadingAnimation fullPage={false} message={t('works_page', 'loading', 'Բեռնվում է...')} />
        </div>
      )}

      {/* Two-Column Grid for Branding Cases vs Gallery Grid */}
      {!loading && (
        (activeCategory?.toLowerCase() === 'design' || activeCategory?.toLowerCase() === 'gallery') ? (
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
                  title={t('works_page', 'view_gallery', 'Դիտել պատկերասրահը')}
                >
                  <div className="gallery-img-container" style={{ background: work.bg, width: "100%", height: "100%" }}>
                    {work.image_url ? (
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
                    ) : (
                      getSvgForCase(work.id)
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

                  {/* Unified Media Wrapper */}
                  <div className="card-media-wrapper">
                    {work.image_url ? (
                      <img 
                        src={work.image_url} 
                        alt={work.title} 
                        className="branding-card-img"
                        style={{ 
                          width: "100%", 
                          height: "100%", 
                          objectFit: "cover", 
                          opacity: 1
                        }} 
                      />
                    ) : (
                      <div className="branding-card-img" style={{ width: "100%", height: "100%", overflow: "hidden", position: "absolute", inset: 0, borderRadius: "24px" }}>
                        {getSvgForCase(work.id)}
                      </div>
                    )}

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
                        className="icon-Chevrolt-Arrow-Right" 
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
                              {parseLangText(work.category || "", locale === 'en' ? 'en' : 'hy') || t('works_page', 'cat_branding', 'Բրենդավորում')}
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
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {/* ══ DYNAMIC GALLERY LIGHTBOX SLIDER ══ */}
      {selectedGalleryIndex !== null && typeof window !== "undefined" && createPortal(
        <div 
          className="lightbox-root"
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
              <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                {t('works_page', 'gallery_preview', 'Պատկերասրահ')} ({selectedGalleryIndex + 1} / {filteredCases.length})
              </span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                {parseLangText(filteredCases[selectedGalleryIndex]?.title || "", locale === 'en' ? 'en' : 'hy')}
              </span>
            </div>

            {/* Actions */}
            <div className="lightbox-top-actions" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
                <span className={isSlideshowPlaying ? "hd-icon hd-icon-pause" : "hd-icon hd-icon-play"} style={{ fontSize: "0.85rem", display: "inline-block" }} />
                <span>{isSlideshowPlaying ? t('works_page', 'pause', 'Դադար') : t('works_page', 'autoplay', 'Ինքնաշխատ')}</span>
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
            <div 
              className="lightbox-arrow prev-arrow"
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
              <span className="hd-icon hd-icon-chevrolt-arrow-left" />
            </div>

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
                <div style={{ width: "min(400px, 80vw)", aspectRatio: "4/3", position: "relative", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                  {getSvgForCase(filteredCases[selectedGalleryIndex]?.id)}
                </div>
              )}
            </div>

            <div 
              className="lightbox-arrow next-arrow"
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
              <span className="hd-icon hd-icon-chevrolt-arrow-right" />
            </div>
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
            <p style={{ margin: 0, fontSize: "0.88rem", opacity: 0.75, color: "#fff", textAlign: "center", maxWidth: "600px", minHeight: "20px" }}>
              {parseLangText(filteredCases[selectedGalleryIndex]?.details || "", locale === 'en' ? 'en' : 'hy') || (locale === "en" ? "No details available." : "Այս նախագծի համար մանրամասն նկարագրություն դեռևս ավելացված չէ:")}
            </p>

            {/* Thumbnails strip */}
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
                    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
                      {getSvgForCase(work.id)}
                    </div>
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
