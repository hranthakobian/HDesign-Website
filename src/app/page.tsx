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
  const [playgroundActiveTab, setPlaygroundActiveTab] = useState<string>("hd-button");
  const [playgroundWidth, setPlaygroundWidth] = useState<string>("240px");
  const [playgroundHeight, setPlaygroundHeight] = useState<string>("50px");
  const [playgroundThickness, setPlaygroundThickness] = useState<string>("3px");
  const [playgroundColor, setPlaygroundColor] = useState<string>("#083f39");
  const [playgroundTextColor, setPlaygroundTextColor] = useState<string>("#ffffff");
  const [playgroundRadius, setPlaygroundRadius] = useState<string>("12px");
  const [playgroundBtnText, setPlaygroundBtnText] = useState<string>("Սեղմել այստեղ");
  const [playgroundIsDisabled, setPlaygroundIsDisabled] = useState<boolean>(false);
  const [playgroundInputPlaceholder, setPlaygroundInputPlaceholder] = useState<string>("Մուտքագրեք տեքստ...");
  const [playgroundInputValue, setPlaygroundInputValue] = useState<string>("");
  const [playgroundInputType, setPlaygroundInputType] = useState<string>("text");
  const [playgroundTextareaPlaceholder, setPlaygroundTextareaPlaceholder] = useState<string>("Ձեր հաղորդագրությունը...");
  const [playgroundTextareaDisableResize, setPlaygroundTextareaDisableResize] = useState<boolean>(true);
  const [playgroundSliderMin, setPlaygroundSliderMin] = useState<number>(0);
  const [playgroundSliderMax, setPlaygroundSliderMax] = useState<number>(100);
  const [playgroundSliderVal, setPlaygroundSliderVal] = useState<number>(50);
  const [playgroundSliderStep, setPlaygroundSliderStep] = useState<number>(1);
  const [playgroundCheckedState, setPlaygroundCheckedState] = useState<boolean>(true);
  const [playgroundCheckboxSize, setPlaygroundCheckboxSize] = useState<string>("18px");
  const [playgroundRadioState, setPlaygroundRadioState] = useState<boolean>(true);
  const [playgroundRadioSize, setPlaygroundRadioSize] = useState<string>("18px");
  const [playgroundSwitchState, setPlaygroundSwitchState] = useState<boolean>(true);
  const [playgroundSwitchSize, setPlaygroundSwitchSize] = useState<string>("20px");
  const [playgroundSelectPlaceholder, setPlaygroundSelectPlaceholder] = useState<string>("Ընտրել տարբերակ...");
  const [playgroundSelectVal, setPlaygroundSelectVal] = useState<string>("option1");
  const [playgroundSelectOptions, setPlaygroundSelectOptions] = useState<string>("Տարբերակ 1, Տարբերակ 2, Տարբերակ 3");
  const [playgroundSegmentVal, setPlaygroundSegmentVal] = useState<string>("tab1");
  const [playgroundSegmentOptions, setPlaygroundSegmentOptions] = useState<string>("Առաջին, Երկրորդ, Երրորդ");
  const [playgroundColorPickerVal, setPlaygroundColorPickerVal] = useState<string>("#083f39");
  const [playgroundColorPanelVal, setPlaygroundColorPanelVal] = useState<string>("#083f39");
  const [playgroundScrollContentHeight, setPlaygroundScrollContentHeight] = useState<number>(300);
  const [playgroundCopied, setPlaygroundCopied] = useState<boolean>(false);

  const playgroundComponentsList = [
    { id: "hd-button", name: "Button (Կոճակ)", desc: "Կոճակ անիմացիոն եզրագծերի էֆեկտներով" },
    { id: "hd-input", name: "Input (Մուտքի դաշտ)", desc: "Տեքստի դաշտ caret-ի անիմացիայով" },
    { id: "hd-textarea", name: "Textarea (Տեքստային տարածք)", desc: "Բազմատող տեքստի դաշտ" },
    { id: "hd-slider", name: "Slider (Սահիկ)", desc: "Արժեքների ընտրության գծային սահիկ" },
    { id: "hd-checkbox", name: "Checkbox (Հաստատման վանդակ)", desc: "Նշման վանդակ կլորացված անկյուններով" },
    { id: "hd-radio", name: "Radio (Ռադիո կոճակ)", desc: "Մեկ տարբերակի ընտրություն խմբից" },
    { id: "hd-switch", name: "Switch (Փոխանջատիչ)", desc: "Միացման-անջատման անիմացիոն տոգլ" },
    { id: "hd-select", name: "Select (Ընտրացանկ)", desc: "Գծային դրոփդաուն ընտրացանկ" },
    { id: "hd-segment", name: "Segment (Սեգմենտավորում)", desc: "Տաբերի սեգմենտավորված փոխանջատիչ" },
    { id: "hd-color-picker", name: "Color Picker (Գույնի ընտրիչ)", desc: "Կոմպակտ գույնի ընտրության կոճակ" },
    { id: "hd-color-panel", name: "Color Panel (Գունային վահանակ)", desc: "Ներդրված գունային ընտրության վահանակ" },
    { id: "hd-scrollbar", name: "Scrollbar (Կոմպակտ սահնակ)", desc: "Մինիմալիստական սքրոլբարի տարա" }
  ];

  const playgroundComponentKey = `${playgroundActiveTab}-${playgroundWidth}-${playgroundHeight}-${playgroundThickness}-${playgroundColor}-${playgroundTextColor}-${playgroundRadius}-${playgroundBtnText}-${playgroundIsDisabled}-${playgroundInputPlaceholder}-${playgroundInputValue}-${playgroundInputType}-${playgroundTextareaPlaceholder}-${playgroundTextareaDisableResize}-${playgroundSliderMin}-${playgroundSliderMax}-${playgroundSliderVal}-${playgroundSliderStep}-${playgroundCheckedState}-${playgroundCheckboxSize}-${playgroundRadioState}-${playgroundRadioSize}-${playgroundSwitchState}-${playgroundSwitchSize}-${playgroundSelectPlaceholder}-${playgroundSelectVal}-${playgroundSelectOptions}-${playgroundSegmentVal}-${playgroundSegmentOptions}-${playgroundColorPickerVal}-${playgroundColorPanelVal}-${playgroundScrollContentHeight}`;

  const generatePlaygroundCode = (): string => {
    const thicknessAttr = playgroundThickness ? ` data-thickness="${playgroundThickness}"` : "";
    const colorAttr = playgroundColor ? ` data-color="${playgroundColor}"` : "";
    const textColorAttr = playgroundTextColor ? ` data-text-color="${playgroundTextColor}"` : "";
    const radiusAttr = playgroundRadius ? ` data-radius="${playgroundRadius}"` : "";
    const widthAttr = playgroundWidth && playgroundWidth !== "auto" ? ` data-width="${playgroundWidth}"` : "";
    const heightAttr = playgroundHeight && playgroundHeight !== "auto" ? ` data-height="${playgroundHeight}"` : "";
    
    const commonData = `${widthAttr}${heightAttr}${thicknessAttr}${colorAttr}${textColorAttr}${radiusAttr}`;
    
    switch(playgroundActiveTab) {
      case "hd-button":
        return `<hd-button${playgroundIsDisabled ? " disabled" : ""}${commonData}>\n  ${playgroundBtnText}\n</hd-button>`;
      case "hd-input":
        return `<hd-input\n  type="${playgroundInputType}"\n  placeholder="${playgroundInputPlaceholder}"\n  value="${playgroundInputValue}"\n  ${playgroundIsDisabled ? "disabled " : ""}${commonData}\n/>`;
      case "hd-textarea":
        return `<hd-textarea\n  placeholder="${playgroundTextareaPlaceholder}"\n  value="${playgroundInputValue}"\n  data-disable-horizontal-resize="${playgroundTextareaDisableResize}"\n  ${commonData}\n/>`;
      case "hd-slider":
        return `<hd-slider\n  min="${playgroundSliderMin}"\n  max="${playgroundSliderMax}"\n  value="${playgroundSliderVal}"\n  step="${playgroundSliderStep}"\n  ${playgroundIsDisabled ? "disabled " : ""}${commonData}\n/>`;
      case "hd-checkbox":
        const checkSizeAttr = playgroundCheckboxSize ? ` data-size="${playgroundCheckboxSize}"` : "";
        return `<hd-checkbox\n  ${playgroundCheckedState ? "checked " : ""}${playgroundIsDisabled ? "disabled " : ""}${checkSizeAttr}${colorAttr}${radiusAttr}\n/>`;
      case "hd-radio":
        const radSizeAttr = playgroundRadioSize ? ` data-size="${playgroundRadioSize}"` : "";
        return `<hd-radio\n  name="group"\n  ${playgroundRadioState ? "checked " : ""}${playgroundIsDisabled ? "disabled " : ""}${radSizeAttr}${colorAttr}\n/>`;
      case "hd-switch":
        const swSizeAttr = playgroundSwitchSize ? ` data-size="${playgroundSwitchSize}"` : "";
        return `<hd-switch\n  ${playgroundSwitchState ? "checked " : ""}${playgroundIsDisabled ? "disabled " : ""}${swSizeAttr}${colorAttr}\n/>`;
      case "hd-select":
        const selectSpans = playgroundSelectOptions.split(",").map((opt, i) => {
          const val = `option${i+1}`;
          const sel = val === playgroundSelectVal ? " selected" : "";
          return `  <span value="${val}"${sel}>${opt.trim()}</span>`;
        }).join("\n");
        return `<hd-select\n  placeholder="${playgroundSelectPlaceholder}"\n  value="${playgroundSelectVal}"\n  ${commonData}\n>\n${selectSpans}\n</hd-select>`;
      case "hd-segment":
        const segmentSpans = playgroundSegmentOptions.split(",").map((opt, i) => {
          const val = `tab${i+1}`;
          const sel = val === playgroundSegmentVal ? " selected" : "";
          return `  <span value="${val}"${sel}>${opt.trim()}</span>`;
        }).join("\n");
        return `<hd-segment\n  value="${playgroundSegmentVal}"\n  ${commonData}\n>\n${segmentSpans}\n</hd-segment>`;
      case "hd-color-picker":
        return `<hd-color-picker\n  data-color="${playgroundColorPickerVal}"\n  ${commonData}\n/>`;
      case "hd-color-panel":
        return `<hd-color-panel\n  value="${playgroundColorPanelVal}"\n  data-width="${playgroundWidth}"\n  data-height="${playgroundHeight}"\n/>`;
      case "hd-scrollbar":
        return `<hd-scrollbar style="width: ${playgroundWidth}; height: ${playgroundHeight}; overflow: auto;">\n  <div style="padding: 20px; height: ${playgroundScrollContentHeight}px;">\n    Երկար պարունակություն...\n  </div>\n</hd-scrollbar>`;
      default:
        return "";
    }
  };

  const handlePlaygroundCopyCode = () => {
    navigator.clipboard.writeText(generatePlaygroundCode());
    setPlaygroundCopied(true);
    setTimeout(() => setPlaygroundCopied(false), 2000);
  };

  const handlePlaygroundTabChange = (id: string) => {
    setPlaygroundActiveTab(id);
    if (id === "hd-checkbox" || id === "hd-radio" || id === "hd-switch" || id === "hd-color-picker") {
      setPlaygroundWidth("auto");
      setPlaygroundHeight("auto");
    } else {
      setPlaygroundWidth("240px");
      setPlaygroundHeight(id === "hd-textarea" ? "120px" : id === "hd-scrollbar" ? "150px" : id === "hd-color-panel" ? "200px" : "50px");
    }
  };

  const highlightPlaygroundHTML = (code: string): string => {
    if (!code) return "";
    let escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    const values: string[] = [];
    const tags: string[] = [];
    const gts: string[] = [];
    const attrs: string[] = [];
    const bools: string[] = [];

    // 1. Strings/Values (in double quotes)
    escaped = escaped.replace(/"([^"]*)"/g, (match, p1) => {
      const idx = values.length;
      values.push(`<span style="color: #ce9178;">"${p1}"</span>`);
      return `__VAL__${idx}__`;
    });

    // 2. Tag names
    escaped = escaped.replace(/&lt;(\/?[a-zA-Z0-9\-]+)/g, (match, p1) => {
      const idx = tags.length;
      tags.push(`<span style="color: #569cd6; font-weight: 600;">${p1}</span>`);
      return `&lt;__TAG__${idx}__`;
    });

    // 3. Angle brackets
    escaped = escaped.replace(/\/&gt;/g, () => {
      const idx = gts.length;
      gts.push(`<span style="color: #569cd6; font-weight: 600;">/&gt;</span>`);
      return `__GT__${idx}__`;
    });
    escaped = escaped.replace(/&gt;/g, () => {
      const idx = gts.length;
      gts.push(`<span style="color: #569cd6; font-weight: 600;">&gt;</span>`);
      return `__GT__${idx}__`;
    });

    // 4. Attributes
    escaped = escaped.replace(/([a-zA-Z0-9\-]+)(?==)/g, (match, p1) => {
      const idx = attrs.length;
      attrs.push(`<span style="color: #9cdcfe;">${p1}</span>`);
      return `__ATTR__${idx}__`;
    });

    // 5. Booleans
    escaped = escaped.replace(/\b(checked|disabled)\b/g, (match, p1) => {
      const idx = bools.length;
      bools.push(`<span style="color: #9cdcfe;">${p1}</span>`);
      return `__BOOL__${idx}__`;
    });

    // Restore tokens in safe order
    escaped = escaped.replace(/__VAL__(\d+)__/g, (match, p1) => values[parseInt(p1, 10)]);
    escaped = escaped.replace(/__TAG__(\d+)__/g, (match, p1) => tags[parseInt(p1, 10)]);
    escaped = escaped.replace(/__ATTR__(\d+)__/g, (match, p1) => attrs[parseInt(p1, 10)]);
    escaped = escaped.replace(/__BOOL__(\d+)__/g, (match, p1) => bools[parseInt(p1, 10)]);
    escaped = escaped.replace(/__GT__(\d+)__/g, (match, p1) => gts[parseInt(p1, 10)]);

    return escaped;
  };

  function renderPlaygroundActiveComponent() {
    const commonProps = {
      key: playgroundComponentKey,
      "data-width": playgroundWidth,
      "data-height": playgroundHeight,
      "data-thickness": playgroundThickness,
      "data-color": playgroundColor,
      "data-text-color": playgroundTextColor,
      "data-radius": playgroundRadius,
    } as any;

    switch(playgroundActiveTab) {
      case "hd-button":
        return (
          <hd-button {...commonProps} disabled={playgroundIsDisabled} onClick={() => alert("Սեղմված է")}>
            {playgroundBtnText}
          </hd-button>
        );
      case "hd-input":
        return (
          <hd-input
            {...commonProps}
            type={playgroundInputType}
            placeholder={playgroundInputPlaceholder}
            value={playgroundInputValue}
            disabled={playgroundIsDisabled}
            onChange={(e: any) => setPlaygroundInputValue(e.target.value)}
          />
        );
      case "hd-textarea":
        return (
          <hd-textarea
            {...commonProps}
            placeholder={playgroundTextareaPlaceholder}
            value={playgroundInputValue}
            data-disable-horizontal-resize={playgroundTextareaDisableResize ? "true" : undefined}
            onChange={(e: any) => setPlaygroundInputValue(e.target.value)}
          />
        );
      case "hd-slider":
        return (
          <hd-slider
            {...commonProps}
            min={playgroundSliderMin}
            max={playgroundSliderMax}
            value={playgroundSliderVal}
            step={playgroundSliderStep}
            disabled={playgroundIsDisabled}
            onInput={(e: any) => setPlaygroundSliderVal(Number(e.target.value))}
          />
        );
      case "hd-checkbox":
        return (
          <hd-checkbox
            key={playgroundComponentKey}
            checked={playgroundCheckedState}
            disabled={playgroundIsDisabled}
            data-size={playgroundCheckboxSize}
            data-color={playgroundColor}
            data-radius={playgroundRadius}
            onChange={(e: any) => setPlaygroundCheckedState(e.target.checked)}
          />
        );
      case "hd-radio":
        return (
          <hd-radio
            key={playgroundComponentKey}
            checked={playgroundRadioState}
            disabled={playgroundIsDisabled}
            data-size={playgroundRadioSize}
            data-color={playgroundColor}
            onChange={(e: any) => setPlaygroundRadioState(e.target.checked)}
          />
        );
      case "hd-switch":
        return (
          <hd-switch
            key={playgroundComponentKey}
            checked={playgroundSwitchState}
            disabled={playgroundIsDisabled}
            data-size={playgroundSwitchSize}
            data-color={playgroundColor}
            onChange={(e: any) => setPlaygroundSwitchState(e.target.checked)}
          />
        );
      case "hd-select":
        return (
          <hd-select
            {...commonProps}
            placeholder={playgroundSelectPlaceholder}
            value={playgroundSelectVal}
            onChange={(e: any) => setPlaygroundSelectVal(e.target.value)}
          >
            {playgroundSelectOptions.split(",").map((opt, i) => (
              <span key={i} value={`option${i+1}`} {...(playgroundSelectVal === `option${i+1}` ? { selected: true } : {})}>
                {opt.trim()}
              </span>
            ))}
          </hd-select>
        );
      case "hd-segment":
        return (
          <hd-segment
            {...commonProps}
            value={playgroundSegmentVal}
            onChange={(e: any) => setPlaygroundSegmentVal(e.target.value)}
          >
            {playgroundSegmentOptions.split(",").map((opt, i) => (
              <span key={i} value={`tab${i+1}`} {...(playgroundSegmentVal === `tab${i+1}` ? { selected: true } : {})}>
                {opt.trim()}
              </span>
            ))}
          </hd-segment>
        );
      case "hd-color-picker":
        return (
          <hd-color-picker
            {...commonProps}
            data-color={playgroundColorPickerVal}
            onChange={(e: any) => setPlaygroundColorPickerVal(e.target.value)}
          />
        );
      case "hd-color-panel":
        return (
          <hd-color-panel
            key={playgroundComponentKey}
            value={playgroundColorPanelVal}
            data-width={playgroundWidth}
            data-height={playgroundHeight}
            onChange={(e: any) => setPlaygroundColorPanelVal(e.target.value)}
          />
        );
      case "hd-scrollbar":
        return (
          <hd-scrollbar key={playgroundComponentKey} style={{ width: playgroundWidth || "100%", height: playgroundHeight || "150px", overflow: "auto", border: "1px solid var(--panel-border)", borderRadius: "8px", background: "rgba(0,0,0,0.1)" }}>
            <div style={{ padding: "16px", height: `${playgroundScrollContentHeight}px`, color: "inherit", boxSizing: "border-box" }}>
              <p style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: "bold" }}>HDesign Կոմպակտ Սքրոլբար</p>
              <p style={{ margin: "0 0 12px 0", fontSize: "0.8rem", opacity: 0.7, lineHeight: "1.4" }}>Սքրոլ արեք ներքև՝ շարունակությունը կարդալու համար:</p>
              <div style={{ marginTop: "40px", border: "1px dashed var(--panel-border)", padding: "8px", borderRadius: "6px", textAlign: "center", fontSize: "0.75rem", opacity: 0.5 }}>
                Վերջ (Բարձրություն՝ {playgroundScrollContentHeight}px)
              </div>
            </div>
          </hd-scrollbar>
        );
      default:
        return null;
    }
  }


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
          if (data) {
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

  // Filter cases to show all branding cases (maximum 10 items) for marquee
  const marqueeItems = casesList
    .filter(c => !String(c.id).startsWith('port-') && !String(c.id).startsWith('local-g-'))
    .slice(0, 10);

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
          <h2 style={{ fontSize: "32pt", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "-20px", paddingLeft: "20px", color: "var(--text)" }}>
            {locale === "en" ? "Branding" : "Բրենդինգ"}
          </h2>
          <div className="marquee-container">
            <div className="marquee-track">
              {/* Loop twice to make it seamless */}
              {getRepeatedMarqueeItems().map((card, idx) => (
                <Link 
                  key={idx} 
                  href={getBrandingLink(card)}
                  className="marquee-card" 
                  style={{ textDecoration: "none" }}
                  title="Սեղմեք մանրամասների համար"
                >
                  <img 
                    src={card.image_url || card.image} 
                    alt={card.title} 
                    className="card-bg-design" 
                    crossOrigin="anonymous"
                    onLoad={(e) => {
                      const img = e.currentTarget;
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
                            [card.id]: { overlay: extracted.overlayBg, line: extracted.lineColor }
                          }));
                        }
                      } catch (err) {
                        console.warn("Color extraction failed for marquee card", card.id, err);
                      }
                    }}
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      objectFit: "cover", 
                      position: "absolute", 
                      inset: 0, 
                      zIndex: 1
                    }} 
                  />
                  
                  {/* Decorative Hover SVGs */}
                  <div className="card-hover-decor top-left">
                    <svg width="32" height="140" viewBox="0 0 32 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect className="svg-pill pill-1" x="0" y="0" width="12" height="90" rx="6" fill={hoverColors[card.id]?.line || getCasePastelColor({ title: card.title, bg: card.bg || card.color })}></rect>
                      <rect className="svg-pill pill-2" x="20" y="40" width="12" height="90" rx="6" fill={hoverColors[card.id]?.line || getCasePastelColor({ title: card.title, bg: card.bg || card.color })}></rect>
                    </svg>
                  </div>
                  <div className="card-hover-decor bottom-right">
                    <svg width="32" height="140" viewBox="0 0 32 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect className="svg-pill pill-1" x="0" y="0" width="12" height="90" rx="6" fill={hoverColors[card.id]?.line || getCasePastelColor({ title: card.title, bg: card.bg || card.color })}></rect>
                      <rect className="svg-pill pill-2" x="20" y="40" width="12" height="90" rx="6" fill={hoverColors[card.id]?.line || getCasePastelColor({ title: card.title, bg: card.bg || card.color })}></rect>
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
          <style>{`
            .homepage-playground-container {
              display: grid;
              grid-template-columns: 260px 1fr 300px;
              gap: 24px;
              max-width: 1400px;
              margin: 0 auto;
              width: 100%;
              align-items: start;
              background: transparent;
              border: none;
              border-radius: 0;
              padding: 0;
              box-shadow: none;
              backdrop-filter: none;
            }
            .playground-sidebar-column {
              display: flex;
              flex-direction: column;
              gap: 12px;
              background: #ffffff;
              border: 1px solid var(--panel-border);
              border-radius: 20px;
              padding: 20px;
              box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
              max-height: 500px;
              height: 500px;
              overflow: hidden;
              color: #1a1a1a;
            }
            .playground-preview-column {
              display: flex;
              flex-direction: column;
              gap: 24px;
              min-width: 0;
              height: 500px;
              max-height: 500px;
            }
            .playground-controls-column {
              display: flex;
              flex-direction: column;
              gap: 12px;
              background: #ffffff;
              border: 1px solid var(--panel-border);
              border-radius: 20px;
              padding: 20px;
              box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
              max-height: 500px;
              height: 500px;
              overflow: hidden;
              color: #1a1a1a;
            }
            @media (max-width: 1100px) {
              .homepage-playground-container {
                grid-template-columns: 220px 1fr;
              }
              .playground-controls-column {
                grid-column: span 2;
                max-height: 400px;
                height: 400px;
              }
            }
            @media (max-width: 768px) {
              .homepage-playground-container {
                grid-template-columns: 1fr;
              }
              .playground-sidebar-column {
                max-height: 300px;
                height: 300px;
              }
              .playground-preview-column {
                height: auto;
                max-height: none;
              }
              .playground-controls-column {
                grid-column: span 1;
                max-height: 400px;
                height: 400px;
              }
            }
            .playground-copy-btn {
              color: #ffffff;
              transition: color 0.2s ease;
            }
            .playground-copy-btn:hover {
              color: #b0b0b0 !important;
            }
          `}</style>
          
          <h2 style={{
            fontSize: "2.2rem",
            fontWeight: "900",
            textAlign: "center",
            color: "var(--text)",
            marginBottom: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}>
            Դիզայնի Համակարգը
            <sup style={{ top: "-0.5em", display: "inline-flex" }}>
              <svg width="60" height="20" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="30" rx="15" fill="currentColor" fillOpacity="0.1"/>
                <text x="50%" y="65%" dominantBaseline="middle" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="800" style={{ letterSpacing: "0.5px" }}>BETA</text>
              </svg>
            </sup>
          </h2>
          
          <div className="homepage-playground-container">
            {/* Sidebar List of 12 components */}
            <div className="playground-sidebar-column">
              <span style={{ fontSize: "0.75rem", fontWeight: "800", opacity: 0.5, letterSpacing: "1px", padding: "6px 8px 12px 8px" }}>
                ԿՈՄՊՈՆԵՆՏՆԵՐ
              </span>
              <hd-scrollbar style={{ height: "420px", overflow: "auto", overscrollBehavior: "contain" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingRight: "10px" }}>
                  {playgroundComponentsList.map((comp) => {
                    const isActive = playgroundActiveTab === comp.id;
                    return (
                      <button
                        key={comp.id}
                        onClick={() => handlePlaygroundTabChange(comp.id)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          width: "100%",
                          padding: "8px 12px",
                          background: isActive ? "var(--btn-bg)" : "transparent",
                          border: isActive ? "1px solid var(--panel-border)" : "1px solid transparent",
                          borderRadius: "10px",
                          color: "var(--text)",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <span style={{ fontWeight: "bold", fontSize: "0.85rem" }}>{comp.name}</span>
                        <span style={{ fontSize: "0.7rem", opacity: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>{comp.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </hd-scrollbar>
            </div>

            {/* Central Canvas Preview & Code */}
            <div className="playground-preview-column">
              {/* Checkered preview box */}
              <div style={{
                border: "1px solid var(--panel-border)",
                borderRadius: "20px",
                backgroundImage: "radial-gradient(rgba(0,0,0,0.15) 1.5px, transparent 0)",
                backgroundSize: "20px 20px",
                backgroundPosition: "center",
                backgroundColor: "#f5f5f5",
                color: "#1a1a1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                flex: 1,
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.25)"
              }}>
                <div style={{ width: "100%", maxWidth: "320px", display: "flex", justifyContent: "center", color: "#1a1a1a" }}>
                  {renderPlaygroundActiveComponent()}
                </div>
              </div>

              {/* Code viewer card */}
              <div style={{
                background: "rgba(0,0,0,0.25)",
                border: "1px solid var(--panel-border)",
                borderRadius: "20px",
                overflow: "hidden",
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.25)",
                height: "180px",
                display: "flex",
                flexDirection: "column"
              }}>
                <div style={{
                  padding: "8px 0px 8px 16px",
                  borderBottom: "1px solid var(--panel-border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#000000",
                  color: "#ffffff",
                  height: "38px"
                }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: "bold", color: "#ffffff", opacity: 0.8 }}>ՍՏԱՑՎԱԾ ԿՈԴԸ</span>
                  <button
                    onClick={handlePlaygroundCopyCode}
                    className="playground-copy-btn"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: playgroundCopied ? "#27c93f" : "#ffffff",
                      fontSize: "0.68rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      paddingRight: "16px",
                      outline: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "24px"
                    }}
                  >
                    <span className={playgroundCopied ? "icon-Check" : "icon-Attech"} style={{ marginRight: "6px", fontSize: "0.85rem" }} />
                    <span>{playgroundCopied ? "ՊԱՏՃԵՆՎԱԾ Է!" : "ՊԱՏՃԵՆԵԼ"}</span>
                  </button>
                </div>
                <hd-scrollbar style={{ flex: 1, overflow: "auto", overscrollBehavior: "contain", background: "#121817" }}>
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "2px" }}>
                    {highlightPlaygroundHTML(generatePlaygroundCode()).split("\n").map((line, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "start", fontFamily: "Consolas, monospace", fontSize: "0.82rem", lineHeight: "1.5" }}>
                        <span style={{
                          width: "24px",
                          textAlign: "right",
                          marginRight: "16px",
                          color: "rgba(255, 255, 255, 0.25)",
                          userSelect: "none",
                          flexShrink: 0
                        }}>
                          {idx + 1}
                        </span>
                        <code
                          style={{
                            flex: 1,
                            minWidth: 0,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            fontFamily: "Consolas, monospace",
                            color: "#e6edf3"
                          }}
                          dangerouslySetInnerHTML={{ __html: line || " " }}
                        />
                      </div>
                    ))}
                  </div>
                </hd-scrollbar>
              </div>
            </div>

            {/* Right configuration controls */}
            <div className="playground-controls-column">
              <span style={{ fontSize: "0.75rem", fontWeight: "800", opacity: 0.5, letterSpacing: "1px", paddingBottom: "8px" }}>
                ԿԱՐԳԱՎՈՐՈՒՄՆԵՐ
              </span>
              <hd-scrollbar style={{ height: "420px", overflow: "auto", overscrollBehavior: "contain" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingRight: "10px" }}>
                  {/* Stylistic attributes */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    
                    {playgroundWidth !== "auto" && (
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Լայնություն (Width)</span>
                        <hd-select value={playgroundWidth} onChange={(e: any) => setPlaygroundWidth(e.target.value)} data-height="34px" data-thickness="2px">
                          <span value="100%">100%</span>
                          <span value="240px">240px</span>
                          <span value="180px">180px</span>
                        </hd-select>
                      </label>
                    )}

                    {playgroundHeight !== "auto" && playgroundActiveTab !== "hd-scrollbar" && (
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Բարձրություն (Height)</span>
                        <hd-select value={playgroundHeight} onChange={(e: any) => setPlaygroundHeight(e.target.value)} data-height="34px" data-thickness="2px">
                          <span value="38px">38px</span>
                          <span value="50px">50px</span>
                          <span value="62px">62px</span>
                          {playgroundActiveTab === "hd-textarea" || playgroundActiveTab === "hd-color-panel" ? (
                            <>
                              <span value="120px">120px</span>
                              <span value="180px">180px</span>
                            </>
                          ) : null}
                        </hd-select>
                      </label>
                    )}

                    <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>Եզրագիծ: {playgroundThickness}</span>
                      <hd-slider min="1" max="5" value={playgroundThickness.replace("px", "")} onInput={(e: any) => setPlaygroundThickness(`${e.target.value}px`)} />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>Կլորացում: {playgroundRadius}</span>
                      <hd-slider min="0" max="24" value={playgroundRadius.replace("px", "")} onInput={(e: any) => setPlaygroundRadius(`${e.target.value}px`)} />
                    </label>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>Գույն (Theme Color)</span>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {["#083f39", "#e74c3c", "#3498db"].map((c) => (
                          <button
                            key={c}
                            onClick={() => setPlaygroundColor(c)}
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              background: c,
                              border: playgroundColor === c ? "2px solid #fff" : "1px solid rgba(255,255,255,0.2)",
                              cursor: "pointer",
                              padding: 0
                            }}
                          />
                        ))}
                        <input
                          type="color"
                          value={playgroundColor.startsWith("#") ? playgroundColor : "#083f39"}
                          onChange={(e) => setPlaygroundColor(e.target.value)}
                          style={{ width: "22px", height: "22px", border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
                        />
                      </div>
                    </div>

                  </div>

                  {/* Component Specific Settings */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--panel-border)", paddingTop: "12px" }}>
                    
                    {playgroundActiveTab === "hd-button" && (
                      <>
                        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>Կոճակի տեքստը</span>
                          <input
                            type="text"
                            value={playgroundBtnText}
                            onChange={(e) => setPlaygroundBtnText(e.target.value)}
                            style={{
                              background: "rgba(0,0,0,0.2)",
                              border: "1px solid var(--panel-border)",
                              borderRadius: "6px",
                              color: "var(--text)",
                              padding: "6px 10px",
                              fontSize: "0.8rem",
                              fontFamily: "inherit"
                            }}
                          />
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox checked={playgroundIsDisabled} onChange={(e: any) => setPlaygroundIsDisabled(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>Պասիվ (Disabled)</span>
                        </label>
                      </>
                    )}

                    {playgroundActiveTab === "hd-input" && (
                      <>
                        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>Placeholder</span>
                          <input
                            type="text"
                            value={playgroundInputPlaceholder}
                            onChange={(e) => setPlaygroundInputPlaceholder(e.target.value)}
                            style={{
                              background: "rgba(0,0,0,0.2)",
                              border: "1px solid var(--panel-border)",
                              borderRadius: "6px",
                              color: "var(--text)",
                              padding: "6px 10px",
                              fontSize: "0.8rem",
                              fontFamily: "inherit"
                            }}
                          />
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox checked={playgroundIsDisabled} onChange={(e: any) => setPlaygroundIsDisabled(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>Պասիվ (Disabled)</span>
                        </label>
                      </>
                    )}

                    {playgroundActiveTab === "hd-textarea" && (
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <hd-checkbox checked={playgroundTextareaDisableResize} onChange={(e: any) => setPlaygroundTextareaDisableResize(e.target.checked)} />
                        <span style={{ fontSize: "0.8rem" }}>Արգելել չափափոխումը</span>
                      </label>
                    )}

                    {playgroundActiveTab === "hd-slider" && (
                      <>
                        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>Արժեք: {playgroundSliderVal}</span>
                          <input
                            type="range"
                            min={playgroundSliderMin}
                            max={playgroundSliderMax}
                            value={playgroundSliderVal}
                            onChange={(e) => setPlaygroundSliderVal(Number(e.target.value))}
                            style={{ width: "100%", accentColor: "var(--accent)" }}
                          />
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox checked={playgroundIsDisabled} onChange={(e: any) => setPlaygroundIsDisabled(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>Պասիվ</span>
                        </label>
                      </>
                    )}

                    {playgroundActiveTab === "hd-checkbox" && (
                      <>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox checked={playgroundCheckedState} onChange={(e: any) => setPlaygroundCheckedState(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>Ընտրված (Checked)</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox checked={playgroundIsDisabled} onChange={(e: any) => setPlaygroundIsDisabled(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>Պասիվ</span>
                        </label>
                      </>
                    )}

                    {playgroundActiveTab === "hd-radio" && (
                      <>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox checked={playgroundRadioState} onChange={(e: any) => setPlaygroundRadioState(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>Ընտրված (Checked)</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox checked={playgroundIsDisabled} onChange={(e: any) => setPlaygroundIsDisabled(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>Պասիվ</span>
                        </label>
                      </>
                    )}

                    {playgroundActiveTab === "hd-switch" && (
                      <>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox checked={playgroundSwitchState} onChange={(e: any) => setPlaygroundSwitchState(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>Միացված (Active)</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox checked={playgroundIsDisabled} onChange={(e: any) => setPlaygroundIsDisabled(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>Պասիվ</span>
                        </label>
                      </>
                    )}

                    {playgroundActiveTab === "hd-select" && (
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>Արժեք</span>
                        <hd-select value={playgroundSelectVal} onChange={(e: any) => setPlaygroundSelectVal(e.target.value)} data-height="34px" data-thickness="2px">
                          {playgroundSelectOptions.split(",").map((opt, i) => (
                            <span key={i} value={`option${i+1}`}>{opt.trim()}</span>
                          ))}
                        </hd-select>
                      </label>
                    )}

                    {playgroundActiveTab === "hd-segment" && (
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>Ակտիվ տաբ</span>
                        <hd-select value={playgroundSegmentVal} onChange={(e: any) => setPlaygroundSegmentVal(e.target.value)} data-height="34px" data-thickness="2px">
                          {playgroundSegmentOptions.split(",").map((opt, i) => (
                            <span key={i} value={`tab${i+1}`}>{opt.trim()}</span>
                          ))}
                        </hd-select>
                      </label>
                    )}

                    {playgroundActiveTab === "hd-color-picker" && (
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>Գույնը (Hex)</span>
                        <input
                          type="color"
                          value={playgroundColorPickerVal}
                          onChange={(e) => setPlaygroundColorPickerVal(e.target.value)}
                          style={{ width: "100%", height: "30px", border: "1px solid var(--panel-border)", borderRadius: "6px", background: "transparent", cursor: "pointer" }}
                        />
                      </label>
                    )}

                    {playgroundActiveTab === "hd-color-panel" && (
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>Գույնը (Hex)</span>
                        <input
                          type="color"
                          value={playgroundColorPanelVal}
                          onChange={(e) => setPlaygroundColorPanelVal(e.target.value)}
                          style={{ width: "100%", height: "30px", border: "1px solid var(--panel-border)", borderRadius: "6px", background: "transparent", cursor: "pointer" }}
                        />
                      </label>
                    )}

                    {playgroundActiveTab === "hd-scrollbar" && (
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>Պարունակության բարձրություն: {playgroundScrollContentHeight}px</span>
                        <hd-slider min="150" max="500" value={playgroundScrollContentHeight} onInput={(e: any) => setPlaygroundScrollContentHeight(Number(e.target.value))} />
                      </label>
                    )}

                  </div>
                </div>
              </hd-scrollbar>
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
                  data-thickness="3px"
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
                    data-thickness="3px"
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
                    data-thickness="3px"
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
                      <hd-button data-height="40px" data-thickness="3px" style={{ background: "var(--accent)", color: "#000", fontWeight: "bold" }}>
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
