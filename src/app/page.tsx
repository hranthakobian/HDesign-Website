"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { getPastelColor, getCasePastelColor } from "@/lib/brandingData";
import InteractiveWaveText from "@/components/InteractiveWaveText";
import selectionJson from "../../icons/selection.json";

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

// Custom icons list for the explorer section
const iconsList = [
  "icon-QR-Code", "icon-Pattern", "icon-Dashboard", "icon-Settings", "icon-Search",
  "icon-Check", "icon-Home", "icon-Profile", "icon-Monitor", "icon-Eye",
  "icon-Locked", "icon-Unlocked", "icon-Close-Eye", "icon-Warning", "icon-Info",
  "icon-Call", "icon-Mail", "icon-Map-Pin", "icon-Clock", "icon-Calendar",
  "icon-Pin", "icon-Trash", "icon-Close", "icon-Plus",
  "icon-Arrow-Up", "icon-North-West-Arrow", "icon-Chevrolt-Arrow-Left", "icon-Chevrolt-Arrow-Right",
  "icon-Image", "icon-Camera", "icon-Download", "icon-Attech", "icon-Bell", "icon-Notifications",
  "icon-Chat-Bubble", "icon-Two-Chat-Bubble", "icon-Earth", "icon-Cursor"
];

// Branding Cases Data
const brandingCases = [
  {
    id: 1,
    title: "Pasta",
    color: "#d32f2f", // Red
    image: "/branding/pasta.png"
  },
  {
    id: 2,
    title: "11...",
    color: "#e65100", // Orange
    image: "/branding/eleven.png"
  },
  {
    id: 3,
    title: "Posters",
    color: "#880e4f", // Dark Pink / Crimson
    image: "/branding/posters.png"
  },
  {
    id: 4,
    title: "Teal Lines",
    color: "#004d40", // Dark Teal
    image: "/branding/teal.png"
  },
  {
    id: 5,
    title: "Mobile UI",
    color: "#311b92", // Deep Indigo
    image: "/branding/mobile.png"
  }
];

// Gallery Works Data
const galleryWorks = [
  {
    id: 1,
    title: "Պատմական Գրքի Կազմ",
    subtitle: "Գրքի ձևավորում",
    bg: "linear-gradient(135deg, #2b1f1d 0%, #171110 100%)",
    svg: (
      <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <rect x="40" y="20" width="120" height="110" fill="rgba(255,255,255,0.03)" stroke="rgba(212,175,55,0.4)" strokeWidth="3" />
        <circle cx="100" cy="75" r="25" stroke="rgba(212,175,55,0.5)" strokeWidth="2" />
        <path d="M85 75 L115 75 M100 60 L100 90" stroke="rgba(212,175,55,0.5)" strokeWidth="2" />
        <text x="100" y="120" fill="rgba(212,175,55,0.6)" fontSize="8" textAnchor="middle" fontWeight="bold" fontFamily="HDesign">ՀԱՅԱՍՏԱՆ</text>
      </svg>
    )
  },
  {
    id: 2,
    title: "Bauns Fest",
    subtitle: "Փառատոնի պաստառ",
    bg: "linear-gradient(135deg, #ec407a 0%, #ab47bc 100%)",
    svg: (
      <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <circle cx="70" cy="60" r="30" fill="#ffeb3b" />
        <circle cx="130" cy="90" r="35" fill="#26a69a" />
        <text x="100" y="80" fill="#ffffff" fontSize="22" fontWeight="900" textAnchor="middle" letterSpacing="2">BAUNS</text>
        <text x="100" y="105" fill="#ffeb3b" fontSize="12" fontWeight="bold" textAnchor="middle">FESTIVAL</text>
      </svg>
    )
  },
  {
    id: 3,
    title: "Կենսագրական Պաստառ",
    subtitle: "1722-1785 Դիզայն",
    bg: "linear-gradient(135deg, #b71c1c 0%, #5f0909 100%)",
    svg: (
      <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <rect x="20" y="20" width="160" height="110" fill="rgba(0,0,0,0.2)" stroke="#ffc107" strokeWidth="1" />
        <line x1="100" y1="20" x2="100" y2="130" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        <text x="60" y="50" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">ՍԱՅԱԹ-ՆՈՎԱ</text>
        <text x="60" y="70" fill="#ffc107" fontSize="8" textAnchor="middle">1722 - 1785</text>
        <rect x="120" y="40" width="40" height="60" rx="2" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" />
      </svg>
    )
  },
  {
    id: 4,
    title: "#Artsakh",
    subtitle: "Բրենդավորում",
    bg: "linear-gradient(135deg, #263238 0%, #0f172a 100%)",
    svg: (
      <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <path d="M70 100 L100 40 L130 100 Z" fill="rgba(255,255,255,0.05)" stroke="#ffffff" strokeWidth="3" />
        <path d="M85 70 L100 40 L115 70" fill="none" stroke="#d84315" strokeWidth="3" />
        <line x1="100" y1="40" x2="100" y2="100" stroke="#ff8f00" strokeWidth="2" />
        <text x="100" y="125" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle" letterSpacing="1">#ARTSAKH</text>
      </svg>
    )
  },
  {
    id: 5,
    title: "Առեղծվածային կերպար",
    subtitle: "Գրաֆիկական նկարազարդում",
    bg: "linear-gradient(135deg, #0d47a1 0%, #00103a 100%)",
    svg: (
      <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <circle cx="100" cy="75" r="40" stroke="#00b0ff" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M80 85 C 80 50, 120 50, 120 85" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        <circle cx="100" cy="55" r="10" fill="#ffffff" />
        <line x1="100" y1="95" x2="100" y2="125" stroke="#00b0ff" strokeWidth="2" />
      </svg>
    )
  },
  {
    id: 6,
    title: "lb Մոնոգրամ",
    subtitle: "Լոգոյի դիզայն",
    bg: "linear-gradient(135deg, #1b5e20 0%, #002706 100%)",
    svg: (
      <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <path d="M70 40 L70 110 A 20 20 0 0 0 90 90 L90 70 A 20 20 0 0 1 110 50 L110 110" stroke="#81c784" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="110" cy="110" r="4" fill="#ffffff" />
      </svg>
    )
  },
  {
    id: 7,
    title: "Մութ անտառի պատուհան",
    subtitle: "Իլյուստրացիա",
    bg: "linear-gradient(135deg, #3e2723 0%, #1b0000 100%)",
    svg: (
      <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <rect x="60" y="30" width="80" height="90" rx="8" fill="rgba(255,255,255,0.02)" stroke="#d7ccc8" strokeWidth="4" />
        <line x1="100" y1="30" x2="100" y2="120" stroke="#d7ccc8" strokeWidth="2" />
        <line x1="60" y1="75" x2="140" y2="75" stroke="#d7ccc8" strokeWidth="2" />
        <circle cx="100" cy="75" r="3" fill="#ffeb3b" />
      </svg>
    )
  },
  {
    id: 8,
    title: "Երկրաչափական գծագիր",
    subtitle: "Աբստրակտ արտ",
    bg: "linear-gradient(135deg, #424242 0%, #151515 100%)",
    svg: (
      <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <circle cx="100" cy="75" r="45" stroke="#ffeb3b" strokeWidth="1" />
        <rect x="65" y="40" width="70" height="70" stroke="#2196f3" strokeWidth="1" transform="rotate(45 100 75)" />
        <line x1="50" y1="25" x2="150" y2="125" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <line x1="150" y1="25" x2="50" y2="125" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
      </svg>
    )
  }
];

const SectionBackground = ({ color, className, type }: { color: string; className: string; type: "about" | "footer" }) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !ref.current) return;
    
    // Set initial size
    setSize({
      width: ref.current.clientWidth,
      height: ref.current.clientHeight
    });

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setSize({
          width: entry.target.clientWidth,
          height: entry.target.clientHeight
        });
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const { width, height } = size;

  // Generate path only when size is measured
  let pathData = "";
  if (width > 0 && height > 0) {
    if (type === "about") {
      pathData = `M 78 72 
                  L ${width - 88} 72 
                  A 80 80 0 0 0 ${width} 0 
                  L ${width + 1} ${height - 80} 
                  A 80 80 0 0 1 ${width - 79} ${height} 
                  L 80 ${height} 
                  A 80 80 0 0 1 0 ${height - 80} 
                  L 0 0 
                  A 80 80 0 0 0 78 72 
                  Z`;
    } else {
      // Footer exact Figma path coordinates, parameterized with flat bottom
      pathData = `M 78 72 
                  L ${width - 88} 72 
                  A 80 80 0 0 0 ${width} 0 
                  L ${width + 2} ${height} 
                  L 0 ${height} 
                  L 0 0 
                  A 80 80 0 0 0 78 72 
                  Z`;
    }
  }

  return (
    <div ref={ref} className={className}>
      {width > 0 && height > 0 && (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", top: 0, left: 0 }}>
          <path d={pathData} fill={color} />
        </svg>
      )}
    </div>
  );
};

// Helper to get SVG string for an icon from selection.json
const getSvgString = (iconName: string): string => {
  const nameToMatch = iconName.replace("icon-", "").replace(/-/g, "").toLowerCase();
  
  const iconData = (selectionJson as any).icons.find((i: any) => {
    const candidate = i.properties.name.replace(/[\s-_]+/g, "").toLowerCase();
    return candidate === nameToMatch;
  });
  
  if (!iconData) return "";
  
  const width = iconData.icon.width || 1024;
  const paths = iconData.icon.paths;
  const pathElements = paths.map((p: string) => `<path d="${p}" fill="#000000" />`).join("");
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 1024" width="${width}" height="1024">${pathElements}</svg>`;
};

// Helper to trigger SVG download
const downloadSvg = (iconName: string) => {
  const svgStr = getSvgString(iconName);
  if (!svgStr) return;
  
  const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${iconName}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Helper to trigger PNG download
const downloadPng = (iconName: string) => {
  const svgStr = getSvgString(iconName);
  if (!svgStr) return;
  
  const image = new Image();
  const size = 512;
  
  const nameToMatch = iconName.replace("icon-", "").replace(/-/g, "").toLowerCase();
  const iconData = (selectionJson as any).icons.find((i: any) => {
    const candidate = i.properties.name.replace(/[\s-_]+/g, "").toLowerCase();
    return candidate === nameToMatch;
  });
  const originalWidth = iconData?.icon.width || 1024;
  const ratio = size / 1024;
  const canvasWidth = originalWidth * ratio;
  
  const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(image, 0, 0, canvasWidth, size);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `${iconName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(url);
  };
  
  image.src = url;
};

export default function Home() {
  const { t, locale } = useI18n();
  const sectionRef = useRef<HTMLDivElement>(null);
  const stickyPanelRef = useRef<HTMLDivElement>(null);
  
  // Dynamic cases and details modal states
  const [casesList, setCasesList] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [ratings, setRatings] = useState<Record<string, { sum: number; count: number }>>({});
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});
  const [hoverColors, setHoverColors] = useState<Record<string, { overlay: string; line: string }>>({});

  const renderCardRating = (workId: string) => {
    const item = ratings[workId];
    if (!item || item.count === 0) return null;
    const avg = (item.sum / item.count).toFixed(1);
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(255,255,0,0.15)", border: "1px solid rgba(255,204,0,0.3)", padding: "2px 6px", borderRadius: "6px", fontSize: "0.72rem", color: "#ffcc00", fontWeight: 700, marginTop: "4px" }}>
        ★ {avg}
      </div>
    );
  };

  const renderGalleryCard = (work: any, index: number) => {
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

                // Extract average color using a 1x1 canvas
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
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: "0 0 6px" }}>{work.title}</h3>
            <p style={{ fontSize: "0.85rem", opacity: 0.8, margin: 0 }}>{work.subtitle}</p>
          </div>
        </div>
      </div>
    );
  };


  // Icon explorer states
  const [iconSearch, setIconSearch] = useState("");
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);
  const [selectedIconDetail, setSelectedIconDetail] = useState<string | null>("icon-QR-Code");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [iconWeight, setIconWeight] = useState<number>(400);

  // Gallery states
  const [showAllGallery, setShowAllGallery] = useState(false);

  // Playground states
  const [playgroundHeight, setPlaygroundHeight] = useState(60);
  const [playgroundThickness, setPlaygroundThickness] = useState(3);
  const [playgroundHue, setPlaygroundHue] = useState(180);


  // Helper to retrieve custom SVG for hardcoded seed cases
  const getSvgForCase = (caseId: string) => {
    if (caseId.startsWith('local-g-')) {
      const idNum = parseInt(caseId.replace('local-g-', ''));
      const original = galleryWorks.find(x => x.id === idNum);
      return original?.svg || null;
    }
    return null;
  };

  // Load dynamic cases combined with fallbacks
  useEffect(() => {
    fetch("/api/ratings")
      .then(res => res.json())
      .then(data => setRatings(data || {}))
      .catch(err => console.warn("Failed to load ratings:", err));

    async function loadCases() {
      try {
        const res = await fetch("/api/cases");
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setCasesList(data);
            return;
          }
        }
      } catch (err) {
        console.error("Error loading dynamic cases:", err);
      }
      
      // Fallback local list mapped from default values
      const fallbackList = [
        ...brandingCases.map(c => ({
          id: `local-b-${c.id}`,
          title: c.title,
          subtitle: "Բրենդավորում",
          bg: c.color,
          image_url: c.image,
          details: "Pasta House-ի նոր ոճը, որը ներառում է լոգոյի դիզայն և փաթեթավորում:"
        })),
        ...galleryWorks.map(w => ({
          id: `local-g-${w.id}`,
          title: w.title,
          subtitle: w.subtitle,
          bg: w.bg,
          details: "Աշխատանքի մանրամասն նկարագրություն և կոնցեպտուալ ձևավորում:"
        }))
      ];
      setCasesList(fallbackList);
    }
    loadCases();
  }, []);



  // JS-based sticky scroll listener for the details panel
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || !stickyPanelRef.current) return;

      const sectionRect = sectionRef.current.getBoundingClientRect();
      const panelRect = stickyPanelRef.current.getBoundingClientRect();

      // Disable JS sticky on mobile/tablet screens
      if (window.innerWidth <= 768) {
        stickyPanelRef.current.style.transform = "translateY(0px)";
        return;
      }

      // Desired distance from the top of the viewport
      const targetTop = 100;

      // How much the section has scrolled past the targetTop threshold
      const sectionTopOffset = -sectionRect.top + targetTop;

      // Cap the translation to stay within the bounds of the section container
      // 40px subtraction for bottom padding spacing
      const maxTranslateY = sectionRect.height - panelRect.height - 40;

      let translateY = 0;
      if (sectionTopOffset > 0) {
        translateY = Math.min(sectionTopOffset, maxTranslateY);
      }

      stickyPanelRef.current.style.transform = `translateY(${translateY}px)`;
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    
    // Run once on mount / render phase
    handleScroll();

    // Set a small delay timeout in case other elements shift heights during load
    const timeoutId = setTimeout(handleScroll, 200);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [selectedIconDetail, iconSearch]);

  // Filter cases that have a preview image and are brandings for the marquee/slider display
  const marqueeItems = casesList.filter(c => {
    if (!c.image_url) return false;
    const cardId = String(c.id);
    if (cardId.startsWith('port-')) return false; // exclude uploaded portfolio design items
    if (cardId.startsWith('local-b-')) return true;
    if (c.category?.toLowerCase() === 'branding') return true;
    if (c.subtitle?.includes('Բրենդավորում') || c.subtitle?.includes('Բրենդինգ')) return true;
    return false;
  });

  // Filter cases to show only vector/design gallery items (not branding)
  const portCases = casesList.filter(c => String(c.id).startsWith('port-'));
  const galleryCases = (portCases.length > 0 
    ? portCases 
    : casesList.filter(c => String(c.id).startsWith('local-g-'))).slice(0, 15);

  // Gallery slider states
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState<number | null>(null);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState<boolean>(false);

  // Keyboard navigation & Slideshow for Gallery Lightbox
  useEffect(() => {
    if (selectedGalleryIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedGalleryIndex(null);
        setIsSlideshowPlaying(false);
      } else if (e.key === "ArrowRight") {
        setSelectedGalleryIndex(prev => (prev !== null ? (prev + 1) % galleryCases.length : null));
      } else if (e.key === "ArrowLeft") {
        setSelectedGalleryIndex(prev => (prev !== null ? (prev - 1 + galleryCases.length) % galleryCases.length : null));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedGalleryIndex, galleryCases.length]);

  useEffect(() => {
    if (!isSlideshowPlaying || selectedGalleryIndex === null) return;

    const interval = setInterval(() => {
      setSelectedGalleryIndex(prev => (prev !== null ? (prev + 1) % galleryCases.length : null));
    }, 3000);

    return () => clearInterval(interval);
  }, [isSlideshowPlaying, selectedGalleryIndex, galleryCases.length]);
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
  // Helper to retrieve the correct branding details link
  const getBrandingLink = (card: any) => {
    const cardId = String(card.id);
    if (cardId.includes('local-b-')) {
      const idx = parseInt(cardId.replace('local-b-', '')) - 1;
      const staticIds = ['pasta', 'eleven', 'posters', 'teal-lines', 'mobile-ui'];
      return `/works/${staticIds[idx] || cardId}`;
    }
    return `/works/${cardId}`;
  };

  // Helper to duplicate marquee items so the track width is always large enough for seamless infinite scrolling
  const getRepeatedMarqueeItems = () => {
    const baseItems = marqueeItems.length > 0 ? marqueeItems : brandingCases.map(c => ({
      id: `local-b-${c.id}`,
      title: c.title,
      bg: c.color,
      image: c.image,
      image_url: c.image
    }));
    
    if (baseItems.length === 0) return [];
    
    let repeated = [...baseItems];
    while (repeated.length < 12) {
      repeated = [...repeated, ...baseItems];
    }
    return [...repeated, ...repeated];
  };

  const handleCopyIcon = (className: string) => {
    navigator.clipboard.writeText(className).then(() => {
      setCopiedIcon(className);
      setTimeout(() => setCopiedIcon(null), 1500);
    });
  };

  const handleCopySnippet = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSnippet(type);
      setTimeout(() => setCopiedSnippet(null), 1500);
    });
  };

  const filteredIcons = iconsList.filter(icon => 
    icon.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const visibleIcons = filteredIcons;

  return (
    <>
      {/* Invisible elements using the icon font at all weights to force immediate background download by the browser */}
      <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <span className="icon-Mail" style={{ fontWeight: 100 }} />
        <span className="icon-Mail" style={{ fontWeight: 200 }} />
        <span className="icon-Mail" style={{ fontWeight: 300 }} />
        <span className="icon-Mail" style={{ fontWeight: 400 }} />
        <span className="icon-Mail" style={{ fontWeight: 500 }} />
        <span className="icon-Mail" style={{ fontWeight: 600 }} />
        <span className="icon-Mail" style={{ fontWeight: 700 }} />
        <span className="icon-Mail" style={{ fontWeight: 800 }} />
        <span className="icon-Mail" style={{ fontWeight: 900 }} />
      </div>

      <main style={{ position: "relative", zIndex: 0, overflow: "hidden" }}>
      

      {/* Main Content Area */}
      <div className="shell" style={{ marginTop: "180px" }}>
        
        {/* ══ SECTION 1: HERO (Ստեղծա և Գործնական) ══ */}
        <section id="home" style={{ 
          minHeight: "60vh", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center", 
          alignItems: "stretch", 
          padding: "60px 20px 40px",
          width: "100%",
          boxSizing: "border-box"
        }}>
          <InteractiveWaveText 
            lines={["ՍՏԵՂԾԱ", "ԵՒ ԳՈՐԾՆԱԿԱՆ"]}
          />
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "flex-end", 
            textAlign: "right",
            marginTop: "20px"
          }}>
            <p style={{ 
              fontSize: "clamp(1.05rem, 2.2vw, 1.25rem)", 
              maxWidth: "600px", 
              color: "var(--text)", 
              margin: "0 0 14px 0", 
              lineHeight: "1.6",
              fontWeight: "400"
            }}>
              Յուրաքանչյուրը չի կարող դառնալ մեծ վարպետ, բայց մեծ վարպետը կարող է գալ յուրաքանչյուր տեղից։
            </p>
            <div style={{ 
              width: "180px", 
              height: "auto",
              display: "flex",
              justifyContent: "flex-end"
            }}>
              <img 
                src="/signature.png" 
                alt="Signature" 
                className="hero-signature"
                style={{ 
                  width: "100%", 
                  height: "auto", 
                  objectFit: "contain"
                }} 
              />
            </div>
          </div>
        </section>

        {/* ══ SECTION 2: BRANDING CASES (Բրենդինգի Քեյսեր) ══ */}
        <section>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "24px", paddingLeft: "20px", color: "var(--text)" }}>
            Բրենդինգներ
          </h2>
          <div className="marquee-container">
            <div className="marquee-track">
              {/* Loop twice to make it seamless */}
              {getRepeatedMarqueeItems().map((card, idx) => (
                <Link 
                  key={idx} 
                  href={getBrandingLink(card)}
                  className="marquee-card" 
                  style={{ backgroundColor: card.bg || card.color, textDecoration: "none" }}
                  title="Սեղմեք մանրամասների համար"
                >
                  <img 
                    src={card.image_url || card.image} 
                    alt={card.title} 
                    className="card-bg-design" 
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      objectFit: "cover", 
                      position: "absolute", 
                      inset: 0, 
                      zIndex: 1,
                      opacity: 0.85 
                    }} 
                  />
                  
                  {/* Decorative Hover SVGs */}
                  <div className="card-hover-decor top-left">
                    <svg width="32" height="140" viewBox="0 0 32 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect className="svg-pill pill-1" x="0" y="0" width="12" height="90" rx="6" fill={getCasePastelColor({ title: card.title, bg: card.bg || card.color })}></rect>
                      <rect className="svg-pill pill-2" x="20" y="40" width="12" height="90" rx="6" fill={getCasePastelColor({ title: card.title, bg: card.bg || card.color })}></rect>
                    </svg>
                  </div>
                  <div className="card-hover-decor bottom-right">
                    <svg width="32" height="140" viewBox="0 0 32 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect className="svg-pill pill-1" x="0" y="0" width="12" height="90" rx="6" fill={getCasePastelColor({ title: card.title, bg: card.bg || card.color })}></rect>
                      <rect className="svg-pill pill-2" x="20" y="40" width="12" height="90" rx="6" fill={getCasePastelColor({ title: card.title, bg: card.bg || card.color })}></rect>
                    </svg>
                  </div>

                  <div className="card-content" style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start", position: "relative", zIndex: 3 }}>
                    <span>{card.title}</span>
                    {renderCardRating(card.id)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Close shell container to let About section go full-width */}
        </div>

        {/* ══ SECTION 3: ABOUT (Մասին - Full Width) ══ */}
        <section id="about" className="about-section-fullwidth" style={{ background: "transparent", borderRadius: "0", border: "none" }}>
          {/* Dynamic SVG Background */}
          <SectionBackground color="#3b6e68" className="about-svg-bg" type="about" />
          
          {/* Vertical Lines SVG */}
          <div className="about-vertical-lines top-left">
            <svg width="64" height="260" viewBox="0 0 64 260" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="24" height="180" rx="12" fill="#B7DAD4"/>
              <rect x="40" y="80" width="24" height="180" rx="12" fill="#B7DAD4"/>
            </svg>
          </div>
          <div className="about-vertical-lines bottom-right">
            <svg width="64" height="260" viewBox="0 0 64 260" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="80" width="24" height="180" rx="12" fill="#B7DAD4"/>
              <rect x="40" y="0" width="24" height="180" rx="12" fill="#B7DAD4"/>
            </svg>
          </div>

          <div className="landing-about-grid" style={{ maxWidth: "1400px", margin: "0 auto", padding: "80px 0 40px", display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "48px", alignItems: "center", position: "relative", zIndex: 5 }}>
            {/* Profile Image container */}
            <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", aspectRatio: "1" }}>
              <img 
                src="/profile_hrant.jpg" 
                alt="Hrant Hakobyan" 
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {/* Bio Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "#ffffff", margin: 0 }}>
                Մասին
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", color: "#ffffff", opacity: 0.9, fontSize: "1.05rem", lineHeight: "1.7" }}>
                <p>
                  Ողջույն, ես Հրանտ Հակոբյանն եմ և Ճարտարապետության և շինարարության Հայաստանի Ազգային Համալսարանի ճարտարապետության ֆակուլտետի 4-րդ կուրսի ուսանող եմ։
                </p>
                <p style={{ fontWeight: 700 }}>
                  Ես մասնագիտանում եմ տառաստեղծության և բրենդինգի մեջ։
                </p>
              </div>
              <div>
                <hd-button 
                  onClick={() => {
                    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  data-width="160px"
                  data-height="52px"
                  data-thickness="3px"
                  data-color="#083F39"
                  data-text-color="#fff"
                >
                  Կապնվել
                </hd-button>
              </div>
            </div>
          </div>
        </section>

        {/* Reopen shell container for remaining contents */}
        <div className="shell">

        {/* ══ SECTION 4: GALLERY (Այլ աշխատանքներ) ══ */}
        <section id="works">
          <h2 style={{ fontSize: "2.2rem", fontWeight: "900", textAlign: "center", color: "var(--text)", marginBottom: "16px" }}>
            Այլ աշխատանքներ
          </h2>
          
          <div className="gallery-grid" style={{ display: "flex", flexDirection: "column", gap: "24px", alignItems: "center" }}>
            {/* Row 1 (first 5 cases) */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px", width: "100%" }}>
              {galleryCases.slice(0, 5).map((work, idx) => renderGalleryCard(work, idx))}
            </div>

            {/* Row 2 (next 5 cases) */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px", width: "100%" }}>
              {galleryCases.slice(5, 10).map((work, idx) => renderGalleryCard(work, 5 + idx))}
            </div>

            {/* Row 3 (last 5 cases) */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px", width: "100%" }}>
              {galleryCases.slice(10, 15).map((work, idx) => renderGalleryCard(work, 10 + idx))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: "36px" }}>
            <Link href="/works?category=design">
              <hd-button 
                data-width="160px"
                data-height="52px"
                data-thickness="3px"
              >
                Ավելի
              </hd-button>
            </Link>
          </div>
        </section>

        {/* ══ SECTION 5: PLAYGROUND (Դիզայնի Համակարգը) ══ */}
        <section id="playground" style={{ padding: "80px 0" }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: "900", textAlign: "center", color: "var(--text)", marginBottom: "40px" }}>
            Դիզայնի Համակարգը
          </h2>
          
          <div className="playground-wrapper">
            {/* Left Controls column */}
            <div className="playground-controls">
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "bold", color: "var(--text)" }}>Կառավարում</h3>
              
              <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text)", opacity: 0.8 }}>Բարձրություն (Չափս): {playgroundHeight}px</span>
                <hd-slider 
                  min="40" 
                  max="100" 
                  value={playgroundHeight} 
                  onInput={(e: any) => setPlaygroundHeight(Number(e.target.value))}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text)", opacity: 0.8 }}>Եզրագծի հաստություն: {playgroundThickness}px</span>
                <hd-slider 
                  min="1" 
                  max="8" 
                  value={playgroundThickness} 
                  onInput={(e: any) => setPlaygroundThickness(Number(e.target.value))}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text)", opacity: 0.8 }}>Թեմայի Գույն (Hue): {playgroundHue}°</span>
                <hd-slider 
                  min="0" 
                  max="360" 
                  value={playgroundHue} 
                  onInput={(e: any) => setPlaygroundHue(Number(e.target.value))}
                />
              </label>
            </div>

            {/* Right Live Components column */}
            <div 
              className="playground-preview"
              style={{
                "--wrapper-height": `${playgroundHeight}px`,
                "--line-thickness": `${playgroundThickness}px`,
                "--hue": playgroundHue
              } as any}
            >
              <div style={{ width: "100%", maxWidth: "450px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <hd-slider min="0" max="100" value="40" data-width="100%" />

                <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <hd-checkbox checked data-size="16px" />
                    <hd-checkbox data-size="16px" />
                  </div>
                  <hd-input placeholder="placeholder..." data-width="260px" />
                </div>

                <hd-button data-width="100%">Submit</hd-button>
              </div>
            </div>
          </div>
        </section>

        {/* ══ SECTION 6: ICONS (Պատկերակներ) ══ */}
        <section ref={sectionRef}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px", textAlign: "center", color: "var(--text)" }}>
            Պատկերներ
          </h2>

          {/* Two-column layout: Left (Grid) & Right (Details) */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "32px",
            width: "100%",
            alignItems: "flex-start",
            marginTop: "24px"
          }}>
            {/* Left Column: Icons Grid */}
            <div style={{ flex: "1 1 500px", minWidth: "0" }}>
              <div className="icon-explorer-grid" style={{ marginTop: 0 }}>
                {visibleIcons.map((icon, idx) => (
                  <div 
                    key={idx} 
                    className={`icon-explorer-card ${selectedIconDetail === icon ? "active" : ""}`}
                    onClick={() => setSelectedIconDetail(icon)}
                    title="Սեղմեք՝ տեսնելու օգտագործման ձևը"
                  >
                    <span 
                      className={`icon-symbol ${icon}`} 
                      style={{ 
                        fontWeight: iconWeight,
                        fontVariationSettings: `'wght' ${iconWeight}`,
                        transition: "font-weight 0.15s ease, font-variation-settings 0.15s ease"
                      }} 
                    />
                    <span className="icon-name">{icon.replace("icon-", "").replace(/-/g, " ")}</span>
                    
                    <div className="icon-tooltip">
                      Մանրամասներ
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Sticky Sidebar Container */}
            <div 
              ref={stickyPanelRef}
              style={{
                flex: "1 1 350px",
                maxWidth: "420px",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                willChange: "transform",
                transition: "transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)"
              }}
            >
              {/* Sticky Search Input Card inside Sidebar */}
              <div style={{
                backgroundColor: "var(--panel)",
                border: "1px solid var(--panel-border)",
                borderRadius: "24px",
                padding: "24px",
                boxShadow: "var(--shadow)"
              }}>
                <hd-input 
                  placeholder="Որոնել պատկերակ..." 
                  value={iconSearch}
                  onInput={(e: any) => setIconSearch(e.target.value)}
                  data-width="100%"
                  data-height="46px"
                  data-thickness="2px"
                />
              </div>

              {/* Sticky Thickness Slider Card inside Sidebar */}
              <div style={{
                backgroundColor: "var(--panel)",
                border: "1px solid var(--panel-border)",
                borderRadius: "24px",
                padding: "24px",
                boxShadow: "var(--shadow)",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text)" }}>
                    Հաստություն (Thickness)
                  </span>
                  <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--primary-color)" }}>
                    {iconWeight}
                  </span>
                </div>
                <hd-slider 
                  min="100" 
                  max="900" 
                  step="100" 
                  value={iconWeight}
                  onInput={(e: any) => setIconWeight(Number(e.target.value))}
                  data-width="100%"
                />
              </div>

              {/* Icon Details Card */}
              {selectedIconDetail && (
                <div style={{
                  backgroundColor: "var(--panel)",
                  border: "1px solid var(--panel-border)",
                  borderRadius: "24px",
                  padding: "28px",
                  boxShadow: "var(--shadow)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  color: "var(--text)"
                }}>
                {/* Header Info */}
                <div style={{ textAlign: "left" }}>
                  <h3 style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--text)", margin: "0 0 4px 0" }}>
                    {selectedIconDetail.replace("icon-", "").replace(/-/g, " ")}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0", fontFamily: "monospace" }}>
                    Class: {selectedIconDetail}
                  </p>
                </div>

                {/* Large Icon Preview */}
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  padding: "10px 0"
                }}>
                  <div style={{
                    width: "100%",
                    maxWidth: "200px",
                    height: "180px",
                    borderRadius: "20px",
                    background: "linear-gradient(135deg, rgba(8, 63, 57, 0.05) 0%, rgba(8, 63, 57, 0.02) 100%)",
                    border: "1px solid var(--panel-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <span 
                      key={selectedIconDetail}
                      className={selectedIconDetail} 
                      style={{ 
                        fontSize: "6.5rem", 
                        color: "var(--primary-color)",
                        fontWeight: iconWeight,
                        fontVariationSettings: `'wght' ${iconWeight}`,
                        transition: "font-weight 0.15s ease, font-variation-settings 0.15s ease",
                        animation: "iconSwap 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
                      }} 
                    />
                  </div>
                </div>

                {/* 5 Sizes Showcase */}
                <div style={{ width: "100%", textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                    Չափսերի Տարբերակներ (16px - 64px)
                  </span>
                  <div style={{
                    display: "flex",
                    gap: "14px",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--input-bg)",
                    padding: "12px 10px",
                    borderRadius: "14px",
                    border: "1px solid var(--panel-border)"
                  }}>
                    <span key={`${selectedIconDetail}-16`} className={selectedIconDetail} style={{ fontSize: "16px", color: "var(--primary-color)", fontWeight: iconWeight, fontVariationSettings: `'wght' ${iconWeight}`, transition: "font-weight 0.15s ease, font-variation-settings 0.15s ease", animation: "iconSwap 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }} title="16px" />
                    <span key={`${selectedIconDetail}-24`} className={selectedIconDetail} style={{ fontSize: "24px", color: "var(--primary-color)", fontWeight: iconWeight, fontVariationSettings: `'wght' ${iconWeight}`, transition: "font-weight 0.15s ease, font-variation-settings 0.15s ease", animation: "iconSwap 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }} title="24px" />
                    <span key={`${selectedIconDetail}-32`} className={selectedIconDetail} style={{ fontSize: "32px", color: "var(--primary-color)", fontWeight: iconWeight, fontVariationSettings: `'wght' ${iconWeight}`, transition: "font-weight 0.15s ease, font-variation-settings 0.15s ease", animation: "iconSwap 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }} title="32px" />
                    <span key={`${selectedIconDetail}-48`} className={selectedIconDetail} style={{ fontSize: "48px", color: "var(--primary-color)", fontWeight: iconWeight, fontVariationSettings: `'wght' ${iconWeight}`, transition: "font-weight 0.15s ease, font-variation-settings 0.15s ease", animation: "iconSwap 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }} title="48px" />
                    <span key={`${selectedIconDetail}-64`} className={selectedIconDetail} style={{ fontSize: "64px", color: "var(--primary-color)", fontWeight: iconWeight, fontVariationSettings: `'wght' ${iconWeight}`, transition: "font-weight 0.15s ease, font-variation-settings 0.15s ease", animation: "iconSwap 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }} title="64px" />
                  </div>
                </div>

                {/* Download Buttons Container */}
                <div style={{
                  display: "flex",
                  gap: "10px",
                  width: "100%",
                  justifyContent: "center"
                }}>
                  <hd-button
                    onClick={() => downloadSvg(selectedIconDetail)}
                    data-width="50%"
                    data-height="40px"
                    data-thickness="1px"
                    data-color="transparent"
                    data-text-color="var(--text)"
                    title="Ներբեռնել SVG"
                    style={{ flex: 1 }}
                  >
                    <span className="icon-Download" style={{ fontSize: "0.85rem", marginRight: "6px" }} />
                    SVG
                  </hd-button>
                  <hd-button
                    onClick={() => downloadPng(selectedIconDetail)}
                    data-width="50%"
                    data-height="40px"
                    data-thickness="1px"
                    data-color="var(--primary-color)"
                    data-text-color="#ffffff"
                    title="Ներբեռնել PNG"
                    style={{ flex: 1 }}
                  >
                    <span className="icon-Download" style={{ fontSize: "0.85rem", marginRight: "6px" }} />
                    PNG
                  </hd-button>
                </div>

                {/* Code Snippets Section */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  
                  {/* HTML Usage */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase" }}>HTML</span>
                      <span 
                        onClick={() => handleCopySnippet(`<span class="${selectedIconDetail}"></span>`, "html")}
                        style={{ background: "transparent", border: "none", color: copiedSnippet === "html" ? "var(--primary-color)" : "var(--muted)", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                      >
                        <span className={copiedSnippet === "html" ? "icon-Check" : "icon-Pattern"} style={{ fontSize: "0.8rem" }} />
                        {copiedSnippet === "html" ? "Պատճենված է" : "Պատճենել"}
                      </span>
                    </div>
                    <div style={{
                      background: "var(--input-bg)",
                      border: "1px solid var(--panel-border)",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      fontSize: "0.75rem",
                      color: "var(--text)",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all"
                    }}>
                      {`<span class="${selectedIconDetail}"></span>`}
                    </div>
                  </div>

                  {/* React / JSX Usage */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase" }}>React / JSX</span>
                      <span 
                        onClick={() => handleCopySnippet(`<span className="${selectedIconDetail}" />`, "react")}
                        style={{ background: "transparent", border: "none", color: copiedSnippet === "react" ? "var(--primary-color)" : "var(--muted)", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                      >
                        <span className={copiedSnippet === "react" ? "icon-Check" : "icon-Pattern"} style={{ fontSize: "0.8rem" }} />
                        {copiedSnippet === "react" ? "Պատճենված է" : "Պատճենել"}
                      </span>
                    </div>
                    <div style={{
                      background: "var(--input-bg)",
                      border: "1px solid var(--panel-border)",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      fontSize: "0.75rem",
                      color: "var(--text)",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all"
                    }}>
                      {`<span className="${selectedIconDetail}" />`}
                    </div>
                  </div>

                  {/* CSS Class */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase" }}>CSS Class</span>
                      <span 
                        onClick={() => handleCopySnippet(selectedIconDetail, "css")}
                        style={{ background: "transparent", border: "none", color: copiedSnippet === "css" ? "var(--primary-color)" : "var(--muted)", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                      >
                        <span className={copiedSnippet === "css" ? "icon-Check" : "icon-Pattern"} style={{ fontSize: "0.8rem" }} />
                        {copiedSnippet === "css" ? "Պատճենված է" : "Պատճենել"}
                      </span>
                    </div>
                    <div style={{
                      background: "var(--input-bg)",
                      border: "1px solid var(--panel-border)",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      fontSize: "0.75rem",
                      color: "var(--text)",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all"
                    }}>
                      {`.${selectedIconDetail}`}
                    </div>
                  </div>

                </div>

                {/* api.hakobian.am CDN Integration Section */}
                <div style={{ borderTop: "1px solid var(--panel-border)", paddingTop: "14px", width: "100%" }}>
                  <h4 style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text)", margin: "0 0 4px 0" }}>
                    Ինչպե՞ս միացնել Ձեր կայքին
                  </h4>
                  
                  {/* CSS CDN Link */}
                  <div style={{ marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                      <span style={{ fontSize: "0.65rem", color: "var(--muted)" }}>CSS Font</span>
                      <span 
                        onClick={() => handleCopySnippet(`<link rel="stylesheet" href="https://api.hakobian.am/libs/v1/icons/style.css" />`, "libcss")}
                        style={{ background: "transparent", border: "none", color: copiedSnippet === "libcss" ? "var(--primary-color)" : "var(--muted)", fontSize: "0.65rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                      >
                        <span className={copiedSnippet === "libcss" ? "icon-Check" : "icon-Pattern"} style={{ fontSize: "0.75rem" }} />
                        {copiedSnippet === "libcss" ? "Պատճենված է" : "Պատճենել"}
                      </span>
                    </div>
                    <div style={{
                      background: "var(--input-bg)",
                      border: "1px solid var(--panel-border)",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "0.7rem",
                      color: "var(--text)",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all"
                    }}>
                      {`<link rel="stylesheet" href="https://api.hakobian.am/libs/v1/icons/style.css" />`}
                    </div>
                  </div>

                </div>

              </div>
            )}
          </div>
        </div>
      </section>
        {/* Close shell container */}
        </div>
      </main>

      {/* Case Details Glassmorphic Modal */}
        {selectedCase && (
          <div 
            className="case-modal-overlay" 
            onClick={() => setSelectedCase(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(20px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              animation: "fadeIn 0.3s ease-out"
            }}
          >
            <div 
              className="case-modal-content" 
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "24px",
                width: "100%",
                maxWidth: "850px",
                maxHeight: "90vh",
                overflowY: "auto",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 24px 80px rgba(0, 0, 0, 0.5)",
                animation: "scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}
            >
              {/* Close Button */}
              <div 
                onClick={() => setSelectedCase(null)}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  cursor: "pointer",
                  zIndex: 10,
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"}
              >
                <span className="icon-Close" style={{ fontSize: "1.1rem" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", height: "100%" }}>
                {/* Left Side: Image/Art */}
                <div 
                  style={{ 
                    background: selectedCase.bg || selectedCase.color, 
                    minHeight: "350px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                    borderTopLeftRadius: "24px",
                    borderBottomLeftRadius: "24px"
                  }}
                >
                  {selectedCase.image_url || selectedCase.image ? (
                    <img 
                      src={selectedCase.image_url || selectedCase.image} 
                      alt={selectedCase.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                  ) : (
                    <div style={{ width: "80%", height: "80%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {getSvgForCase(selectedCase.id)}
                    </div>
                  )}
                </div>

                {/* Right Side: Details */}
                <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div>
                    <span style={{ 
                      fontSize: "0.85rem", 
                      color: "rgba(255, 255, 255, 0.5)", 
                      textTransform: "uppercase", 
                      letterSpacing: "1.5px", 
                      fontWeight: 600 
                    }}>
                      {selectedCase.category || selectedCase.subtitle || "Case Study"}
                    </span>
                    <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "#fff", margin: "6px 0 0" }}>
                      {selectedCase.title}
                    </h2>
                  </div>

                  <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "20px" }}>
                    {selectedCase.client && (
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase" }}>Հաճախորդ</div>
                        <div style={{ fontSize: "0.95rem", color: "#fff", fontWeight: 500 }}>{selectedCase.client}</div>
                      </div>
                    )}
                    {selectedCase.year && (
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase" }}>Տարեթիվ</div>
                        <div style={{ fontSize: "0.95rem", color: "#fff", fontWeight: 500 }}>{selectedCase.year}</div>
                      </div>
                    )}
                  </div>

                  <div style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "0.95rem", lineHeight: "1.7" }}>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                      {selectedCase.details || "Այս նախագծի համար մանրամասն նկարագրություն դեռևս ավելացված չէ:"}
                    </p>
                  </div>

                  <div style={{ marginTop: "auto", paddingTop: "12px", display: "flex", gap: "12px" }}>
                    <Link href={`/works/${selectedCase.id.includes('local-b-') ? ['pasta', 'eleven', 'posters', 'teal-lines', 'mobile-ui'][parseInt(selectedCase.id.replace('local-b-', '')) - 1] || selectedCase.id : selectedCase.id}`} style={{ textDecoration: "none" }}>
                      <hd-button data-height="40px" data-thickness="1px" style={{ background: "var(--accent)", color: "#000", fontWeight: "bold" }}>
                        {locale === "en" ? "View Full Case Study" : "Տեսնել Ամբողջական Քեյսը"}
                      </hd-button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                  {locale === "en" ? "Gallery Preview" : "Պատկերասրահ"} ({selectedGalleryIndex + 1} / {galleryCases.length})
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                  {galleryCases[selectedGalleryIndex]?.title}
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
                  setSelectedGalleryIndex(prev => (prev !== null ? (prev - 1 + galleryCases.length) % galleryCases.length : null)); 
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
                {galleryCases[selectedGalleryIndex]?.image_url ? (
                  <img 
                    src={galleryCases[selectedGalleryIndex].image_url} 
                    alt={galleryCases[selectedGalleryIndex].title} 
                    style={{
                      maxWidth: "100%",
                      maxHeight: "calc(100vh - 310px)",
                      objectFit: "contain",
                      display: "block",
                      borderRadius: "8px"
                    }}
                  />
                ) : (
                  <div style={{ width: "240px", height: "240px", display: "flex", alignItems: "center", justifyItems: "center", color: "#fff" }}>
                    {getSvgForCase(galleryCases[selectedGalleryIndex]?.id)}
                  </div>
                )}
              </div>

              {/* Next Arrow */}
              <div 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setSelectedGalleryIndex(prev => (prev !== null ? (prev + 1) % galleryCases.length : null)); 
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
                {galleryCases[selectedGalleryIndex]?.details || (locale === "en" ? "No details available." : "Այս նախագծի համար մանրամասն նկարագրություն դեռևս ավելացված չէ:")}
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
                {galleryCases.map((work, idx) => (
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
                      <div style={{ transform: "scale(0.35)", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center" }}>
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

      </>
    );
}
