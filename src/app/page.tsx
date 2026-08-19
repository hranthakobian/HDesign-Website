"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useI18n, parseLangText } from "@/lib/i18n";
import { getPastelColor, getCasePastelColor } from "@/lib/brandingData";
import InteractiveWaveText from "@/components/InteractiveWaveText";
import HdVideoPlayer from "@/components/HdVideoPlayer";

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
  "icon-Pin", "icon-Trash", "icon-Close", "icon-Plus", "icon-Pencil",
  "icon-Arrow-Up", "icon-Chevrolt-Arrow-Left", "icon-Chevrolt-Arrow-Right",
  "icon-Image", "icon-Camera", "icon-Download", "icon-Attech", "icon-Bell", "icon-Notifications",
  "icon-Chat-Bubble", "icon-Two-Chat-Bubble", "icon-Earth", "icon-Cursor",
  // New icons
  "icon-Arrow-Left-Up", "icon-Arrow-Right-Up", "icon-Arrow-Right", "icon-Arrow-Right-Bottom",
  "icon-Arrow-Bottom", "icon-Arrow-Left-Bottom", "icon-Arrow-Left", "icon-Chevrolt-Arrow-Top",
  "icon-Chevrolt-Arrow-Bottom", "icon-Star", "icon-API", "icon-Decline", "icon-Play",
  "icon-Stop", "icon-Pause", "icon-Text-Cursor", "icon-Pointer-Cursor",
  "icon-Undo-Arrow", "icon-Redo-Arrow", "icon-Share-Arrow-Left", "icon-Share-Arrow-Right",
  "icon-Copy", "icon-Paste", "icon-Cut",
  "icon-HD-Logo", "icon-HD-Logo-Horizontal", "icon-Send",
  "icon-Three-Dots-Vertical", "icon-Three-Dots-Horizontal",
  "icon-Volume-Mute", "icon-Low-Volume", "icon-Medium-Volume", "icon-High-Volume", "icon-Full-Screen", "icon-Expand"
];

const iconCategories = [
  {
    titleHy: "Լոգո և Մենյու",
    titleEn: "Logo & Menu",
    icons: [
      "icon-HD-Logo", "icon-HD-Logo-Horizontal"
    ]
  },
  {
    titleHy: "Սլաքներ",
    titleEn: "Arrows",
    icons: [
      "icon-Arrow-Up", "icon-Chevrolt-Arrow-Left", "icon-Chevrolt-Arrow-Right",
      "icon-Arrow-Left-Up", "icon-Arrow-Right-Up", "icon-Arrow-Right", "icon-Arrow-Right-Bottom",
      "icon-Arrow-Bottom", "icon-Arrow-Left-Bottom", "icon-Arrow-Left", "icon-Chevrolt-Arrow-Top",
      "icon-Chevrolt-Arrow-Bottom", "icon-Undo-Arrow", "icon-Redo-Arrow", "icon-Share-Arrow-Left",
      "icon-Share-Arrow-Right"
    ]
  },
  {
    titleHy: "Փականներ և Անվտանգություն",
    titleEn: "Locks & Security",
    icons: [
      "icon-Locked", "icon-Unlocked", "icon-Close-Eye", "icon-Eye"
    ]
  },
  {
    titleHy: "Հաղորդակցություն",
    titleEn: "Communication",
    icons: [
      "icon-Call", "icon-Mail", "icon-Chat-Bubble", "icon-Two-Chat-Bubble", "icon-Bell", "icon-Notifications",
      "icon-Send"
    ]
  },
  {
    titleHy: "Մեդիա",
    titleEn: "Media",
    icons: [
      "icon-Image", "icon-Camera", "icon-Play", "icon-Stop", "icon-Pause",
      "icon-Volume-Mute", "icon-Low-Volume", "icon-Medium-Volume", "icon-High-Volume", "icon-Full-Screen", "icon-Expand"
    ]
  },
  {
    titleHy: "Հիմնական և Գործիքներ",
    titleEn: "General & Tools",
    icons: [
      "icon-QR-Code", "icon-Pattern", "icon-Dashboard", "icon-Settings", "icon-Search",
      "icon-Check", "icon-Home", "icon-Profile", "icon-Monitor", "icon-Warning", "icon-Info",
      "icon-Map-Pin", "icon-Clock", "icon-Calendar", "icon-Pin", "icon-Trash", "icon-Close",
      "icon-Plus", "icon-Pencil", "icon-Copy", "icon-Paste", "icon-Cut", "icon-Download",
      "icon-Attech", "icon-Star", "icon-API", "icon-Decline", "icon-Cursor", "icon-Text-Cursor",
      "icon-Pointer-Cursor", "icon-Earth", "icon-Three-Dots-Vertical", "icon-Three-Dots-Horizontal"
    ]
  }
];

// Character sets for HDesign glyph map
const CHARS_AM = "ԱաԲբԳգԴդԵեԶզԷէԸըԹթԺժԻիԼլԽխԾծԿկՀհՁձՂղՃճՄմՅյՆնՇշՈոՉչՊպՋջՌռՍսՎվՏտՐրՑցՒւՓփՔքՕօՖֆև՛՜՝՞։֊՚՟ՙ֍֎֏ՠֈﬓﬔﬕﬖﬗ".split("");
const CHARS_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
const CHARS_NUM = "0123456789".split("");
const CHARS_SYM = "!@#$%^&*()_+-=[]{};:'\",./<>?".split("");

function getCharacterName(c: string): string {
  const code = c.charCodeAt(0);
  
  // English letters
  if (code >= 65 && code <= 90) return `Latin Capital Letter ${c}`;
  if (code >= 97 && code <= 122) return `Latin Small Letter ${c}`;
  
  // Numbers
  if (code >= 48 && code <= 57) return `Digit ${c}`;
  
  // Armenian letters
  const armenianNames: Record<number, string> = {
    0x0531: "Armenian Capital Letter Ayb (Ա)",
    0x0561: "Armenian Small Letter Ayb (ա)",
    0x0532: "Armenian Capital Letter Ben (Բ)",
    0x0562: "Armenian Small Letter Ben (բ)",
    0x0533: "Armenian Capital Letter Gim (Գ)",
    0x0563: "Armenian Small Letter Gim (գ)",
    0x0534: "Armenian Capital Letter Da (Դ)",
    0x0564: "Armenian Small Letter Da (դ)",
    0x0535: "Armenian Capital Letter Ech (Ե)",
    0x0565: "Armenian Small Letter Ech (ե)",
    0x0536: "Armenian Capital Letter Za (Զ)",
    0x0566: "Armenian Small Letter Za (զ)",
    0x0537: "Armenian Capital Letter Eh (Է)",
    0x0567: "Armenian Small Letter Eh (է)",
    0x0538: "Armenian Capital Letter Et (Ը)",
    0x0568: "Armenian Small Letter Et (ը)",
    0x0539: "Armenian Capital Letter To (Թ)",
    0x0569: "Armenian Small Letter To (թ)",
    0x053A: "Armenian Capital Letter Zhe (Ժ)",
    0x056A: "Armenian Small Letter Zhe (ժ)",
    0x053B: "Armenian Capital Letter Ini (Ի)",
    0x056B: "Armenian Small Letter Ini (ի)",
    0x053C: "Armenian Capital Letter Liun (Լ)",
    0x056C: "Armenian Small Letter Liun (լ)",
    0x053D: "Armenian Capital Letter Khe (Խ)",
    0x056D: "Armenian Small Letter Khe (խ)",
    0x053E: "Armenian Capital Letter Tsa (Ծ)",
    0x056E: "Armenian Small Letter Tsa (ծ)",
    0x053F: "Armenian Capital Letter Ken (Կ)",
    0x056F: "Armenian Small Letter Ken (կ)",
    0x0540: "Armenian Capital Letter Ho (Հ)",
    0x0570: "Armenian Small Letter Ho (հ)",
    0x0541: "Armenian Capital Letter Dzha (Ձ)",
    0x0571: "Armenian Small Letter Dzha (ձ)",
    0x0542: "Armenian Capital Letter Ghad (Ղ)",
    0x0572: "Armenian Small Letter Ghad (ղ)",
    0x0543: "Armenian Capital Letter Tche (Ճ)",
    0x0573: "Armenian Small Letter Tche (ճ)",
    0x0544: "Armenian Capital Letter Men (Մ)",
    0x0574: "Armenian Small Letter Men (մ)",
    0x0545: "Armenian Capital Letter Yi (Յ)",
    0x0575: "Armenian Small Letter Yi (յ)",
    0x0546: "Armenian Capital Letter Nu (Ն)",
    0x0576: "Armenian Small Letter Nu (ն)",
    0x0547: "Armenian Capital Letter Sha (Շ)",
    0x0577: "Armenian Small Letter Sha (շ)",
    0x0548: "Armenian Capital Letter Vo (Ո)",
    0x0578: "Armenian Small Letter Vo (ո)",
    0x0549: "Armenian Capital Letter Cha (Չ)",
    0x0579: "Armenian Small Letter Cha (չ)",
    0x054A: "Armenian Capital Letter Pe (Պ)",
    0x057A: "Armenian Small Letter Pe (պ)",
    0x054B: "Armenian Capital Letter Dzhe (Ջ)",
    0x057B: "Armenian Small Letter Dzhe (ջ)",
    0x054C: "Armenian Capital Letter Ra (Ռ)",
    0x057C: "Armenian Small Letter Ra (ռ)",
    0x054D: "Armenian Capital Letter Se (Ս)",
    0x057D: "Armenian Small Letter Se (ս)",
    0x054E: "Armenian Capital Letter Vev (Վ)",
    0x057E: "Armenian Small Letter Vev (վ)",
    0x054F: "Armenian Capital Letter Tiun (Տ)",
    0x057F: "Armenian Small Letter Tiun (տ)",
    0x0550: "Armenian Capital Letter Re (Ր)",
    0x0580: "Armenian Small Letter Re (ր)",
    0x0551: "Armenian Capital Letter Tso (Ց)",
    0x0581: "Armenian Small Letter Tso (ց)",
    0x0552: "Armenian Capital Letter Yiun (Ւ)",
    0x0582: "Armenian Small Letter Yiun (ւ)",
    0x0553: "Armenian Capital Letter Piur (Փ)",
    0x0583: "Armenian Small Letter Piur (փ)",
    0x0554: "Armenian Capital Letter Ke (Ք)",
    0x0584: "Armenian Small Letter Ke (ք)",
    0x0555: "Armenian Capital Letter Oh (Օ)",
    0x0585: "Armenian Small Letter Oh (օ)",
    0x0556: "Armenian Capital Letter Fe (Ֆ)",
    0x0586: "Armenian Small Letter Fe (ֆ)",
    0x0587: "Armenian Small Letter Ew (և)",
    0x0559: "Armenian Modifier (ՙ)",
    0x055A: "Armenian Apostrophe (՚)",
    0x055B: "Armenian Emphasis Mark (՛)",
    0x055C: "Armenian Exclamation Mark (՜)",
    0x055D: "Armenian Shesht (՝)",
    0x055E: "Armenian Question Mark (՞)",
    0x055F: "Armenian Abbreviation Mark (՟)",
    0x0589: "Armenian Full Stop (։)",
    0x058A: "Armenian Hyphen (֊)",
    0x058F: "Armenian Dram Sign (֏)",
    0x058D: "Armenian Right-Facing Eternity Sign (֍)",
    0x058E: "Armenian Left-Facing Eternity Sign (֎)",
    0x0530: "Armenian Modifier",
    0x0588: "Armenian Yiun Modifier",
    0x058C: "Armenian Semicolon",
  };
  
  if (armenianNames[code]) return armenianNames[code];

  // Ligatures
  if (c === "ﬓ") return "Armenian Ligature Men-Now (ﬓ)";
  if (c === "ﬔ") return "Armenian Ligature Men-Ech (ﬔ)";
  if (c === "ﬕ") return "Armenian Ligature Men-Ini (ﬕ)";
  if (c === "ﬖ") return "Armenian Ligature Men-Vev (ﬖ)";
  if (c === "ﬗ") return "Armenian Ligature Men-Tiun (ﬗ)";

  // Common symbols
  const symbolNames: Record<string, string> = {
    "!": "Exclamation Mark",
    "@": "At Sign",
    "#": "Number Sign / Hashtag",
    "$": "Dollar Sign",
    "%": "Percent Sign",
    "^": "Caret / Circumflex",
    "&": "Ampersand",
    "*": "Asterisk",
    "(": "Left Parenthesis",
    ")": "Right Parenthesis",
    "_": "Low Line / Underscore",
    "+": "Plus Sign",
    "-": "Hyphen-Minus",
    "=": "Equals Sign",
    "[": "Left Square Bracket",
    "]": "Right Square Bracket",
    "{": "Left Curly Bracket",
    "}": "Right Curly Bracket",
    ";": "Semicolon",
    ":": "Colon",
    "'": "Apostrophe / Single Quote",
    "\"": "Quotation Mark / Double Quote",
    ",": "Comma",
    ".": "Full Stop / Period",
    "/": "Solidus / Slash",
    "<": "Less-Than Sign",
    ">": "Greater-Than Sign",
    "?": "Question Mark",
    "~": "Tilde",
    "`": "Grave Accent",
    "|": "Vertical Line / Pipe",
    "\\": "Reverse Solidus / Backslash",
  };

  if (symbolNames[c]) return symbolNames[c];

  return `Unicode Character`;
}

// Branding Cases Data
const brandingCases = [
  {
    id: 1,
    title: "Pasta",
    color: "#d32f2f", // Red
    image: ""
  },
  {
    id: 2,
    title: "11...",
    color: "#e65100", // Orange
    image: ""
  },
  {
    id: 3,
    title: "Posters",
    color: "#880e4f", // Dark Pink / Crimson
    image: ""
  },
  {
    id: 4,
    title: "Teal Lines",
    color: "#004d40", // Dark Teal
    image: ""
  },
  {
    id: 5,
    title: "Mobile UI",
    color: "#311b92", // Deep Indigo
    image: ""
  }
];

// Gallery Works Data
const galleryWorks = [
  {
    id: 1,
    title: "Պատմական Գրքի Կազմ | Historical Book Cover",
    subtitle: "Գրքի ձևավորում | Book Design",
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
    title: "Bauns Fest | Bauns Fest",
    subtitle: "Փառատոնի պաստառ | Festival Poster",
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
    title: "Կենսագրական Պաստառ | Biographical Poster",
    subtitle: "1722-1785 Դիզայն | 1722-1785 Design",
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
    title: "#Artsakh | #Artsakh",
    subtitle: "Բրենդավորում | Branding",
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
    title: "Առեղծվածային կերպար | Mysterious Character",
    subtitle: "Գրաֆիկական նկարազարդում | Graphic Illustration",
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
    title: "lb Մոնոգրամ | lb Monogram",
    subtitle: "Լոգոյի դիզայն | Logo Design",
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
    title: "Մութ անտառի պատուհան | Window to Dark Forest",
    subtitle: "Իլյուստրացիա | Illustration",
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
    title: "Երկրաչափական գծագիր | Geometric Drawing",
    subtitle: "Աբստրակտ արտ | Abstract Art",
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

const selectionJson: any = null;

// Helper to get SVG string for an icon from selection.json
const getSvgString = (iconName: string): string => {
  if (!selectionJson?.icons) return "";
  const nameToMatch = iconName.replace("icon-", "").replace(/-/g, "").toLowerCase();
  
  const iconData = selectionJson.icons.find((i: any) => {
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
  const iconData = selectionJson?.icons?.find((i: any) => {
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
  const [customIcons, setCustomIcons] = useState<any[]>([]);
  const [dsVideoSettings, setDsVideoSettings] = useState<{
    video_hy: string;
    video_en: string;
    poster_hy: string;
    poster_en: string;
  }>({
    video_hy: "https://api.hakobian.am/libs/v1/promo/promo.mp4",
    video_en: "https://api.hakobian.am/libs/v1/promo/promo.mp4",
    poster_hy: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    poster_en: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
  });

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
        title={locale === 'en' ? "View gallery" : "Դիտել պատկերասրահը"}
      >
        <div className="gallery-img-container" style={{ background: work.bg, width: "100%", height: "100%" }}>
          {work.image_url ? (
            <img 
              src={work.image_url} 
              alt={parseLangText(work.title, locale)} 
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
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: "0 0 6px" }}>{parseLangText(work.title, locale)}</h3>
            <p style={{ fontSize: "0.85rem", opacity: 0.8, margin: 0 }}>{parseLangText(work.subtitle, locale)}</p>
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
  const [iconSortOrder, setIconSortOrder] = useState<"default" | "alphabetical">("default");
  const [iconWeight, setIconWeight] = useState<number>(400);
  
  const lowercaseIconName = selectedIconDetail ? selectedIconDetail.replace("icon-", "").toLowerCase() : "";
  const isLogoHorizontal = selectedIconDetail === "icon-HD-Logo-Horizontal";

  const weightClassNames: Record<number, string> = {
    100: "thin",
    200: "extralight",
    300: "light",
    400: "regular",
    500: "medium",
    600: "semibold",
    700: "bold",
    800: "extrabold",
    900: "black"
  };
  const weightName = weightClassNames[iconWeight] || "regular";
  const weightClassStr = iconWeight !== 400 ? ` hd-icon-${weightName}` : "";
  const weightCssBlock = iconWeight !== 400 ? `.hd-icon-${weightName}, ` : "";

  const htmlLogo1 = `<i class="hd-icon${weightClassStr} hd-icon-hd-logo-horizontal"></i>`;
  const htmlLogo2 = `<i class="hd-icon${weightClassStr} hd-icon-hamburger-menu"></i>`;
  const reactLogo1 = `<i className="hd-icon${weightClassStr} hd-icon-hd-logo-horizontal" />`;
  const reactLogo2 = `<i className="hd-icon${weightClassStr} hd-icon-hamburger-menu" />`;
  const cssLogo1 = `${weightCssBlock}.hd-icon-hd-logo-horizontal`;
  const cssLogo2 = `${weightCssBlock}.hd-icon-hamburger-menu`;
  
  const htmlSnippet = isLogoHorizontal 
    ? `${htmlLogo1}\n<!-- կամ (or) -->\n${htmlLogo2}`
    : `<i class="hd-icon${weightClassStr} hd-icon-${lowercaseIconName}"></i>`;

  const reactSnippet = isLogoHorizontal
    ? `${reactLogo1}\n{/* կամ (or) */}\n${reactLogo2}`
    : `<i className="hd-icon${weightClassStr} hd-icon-${lowercaseIconName}" />`;

  const cssSnippet = isLogoHorizontal
    ? `${cssLogo1}\n/* կամ (or) */\n${cssLogo2}`
    : `${weightCssBlock}.hd-icon-${lowercaseIconName}`;

  const [hdesignFontWeight, setHdesignFontWeight] = useState<number>(400);
  const [hdesignFontSlant, setHdesignFontSlant] = useState<number>(0);
  const [hdesignControlMode, setHdesignControlMode] = useState<"sliders" | "matrix">("sliders");
  const [showMatrixGrid, setShowMatrixGrid] = useState<boolean>(true);
  const [showMatrixWatermark, setShowMatrixWatermark] = useState<boolean>(true);
  const [matrixWatermarkChar, setMatrixWatermarkChar] = useState<string>("Ա");
  const [isDraggingMatrix, setIsDraggingMatrix] = useState<boolean>(false);
  const [copiedChar, setCopiedChar] = useState<string | null>(null);

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
  const [playgroundVideoAutoplay, setPlaygroundVideoAutoplay] = useState<boolean>(false);
  const [playgroundVideoLoop, setPlaygroundVideoLoop] = useState<boolean>(true);
  const [playgroundVideoMuted, setPlaygroundVideoMuted] = useState<boolean>(false);
  const [playgroundVideoControls, setPlaygroundVideoControls] = useState<boolean>(true);
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

  const playgroundComponentKey = `${playgroundActiveTab}-${playgroundWidth}-${playgroundHeight}-${playgroundThickness}-${playgroundColor}-${playgroundTextColor}-${playgroundRadius}-${playgroundVideoAutoplay}-${playgroundVideoLoop}-${playgroundVideoMuted}-${playgroundVideoControls}-${playgroundBtnText}-${playgroundIsDisabled}-${playgroundInputPlaceholder}-${playgroundInputValue}-${playgroundInputType}-${playgroundTextareaPlaceholder}-${playgroundTextareaDisableResize}-${playgroundSliderMin}-${playgroundSliderMax}-${playgroundSliderVal}-${playgroundSliderStep}-${playgroundCheckedState}-${playgroundCheckboxSize}-${playgroundRadioState}-${playgroundRadioSize}-${playgroundSwitchState}-${playgroundSwitchSize}-${playgroundSelectPlaceholder}-${playgroundSelectVal}-${playgroundSelectOptions}-${playgroundSegmentVal}-${playgroundSegmentOptions}-${playgroundColorPickerVal}-${playgroundColorPanelVal}-${playgroundScrollContentHeight}`;

  const generatePlaygroundCode = (): string => {
    const thicknessAttr = playgroundThickness ? ` data-thickness="${playgroundThickness}"` : "";
    const colorAttr = playgroundColor ? ` data-color="${playgroundColor}"` : "";
    const textColorAttr = playgroundTextColor ? ` data-text-color="${playgroundTextColor}"` : "";
    const radiusAttr = playgroundRadius ? ` data-radius="${playgroundRadius}"` : "";
    const widthAttr = playgroundWidth && playgroundWidth !== "auto" ? ` data-width="${playgroundWidth}"` : "";
    const heightAttr = playgroundHeight && playgroundHeight !== "auto" ? ` data-height="${playgroundHeight}"` : "";
    
    const commonData = `${widthAttr}${heightAttr}${thicknessAttr}${colorAttr}${textColorAttr}${radiusAttr}`;
    
    switch(playgroundActiveTab) {
      case "hd-video":
        const vAuto = playgroundVideoAutoplay ? " autoplay" : "";
        const vLoop = playgroundVideoLoop ? " loop" : "";
        const vMute = playgroundVideoMuted ? " muted" : "";
        const vCtrl = !playgroundVideoControls ? " no-controls" : "";
        return `<hd-video\n  src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"\n  poster="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"\n  ${commonData}${vAuto}${vLoop}${vMute}${vCtrl}\n></hd-video>`;
      case "hd-button":
        return `<hd-button${playgroundIsDisabled ? " disabled" : ""}${commonData}>\n  ${playgroundBtnText}\n</hd-button>`;
      case "hd-input":
        return `<hd-input\n  type="${playgroundInputType}"\n  placeholder="${playgroundInputPlaceholder}"\n  value="${playgroundInputValue}"\n  ${playgroundIsDisabled ? "disabled " : ""}${commonData}\n data-font-size="14pt" />`;
      case "hd-textarea":
        return `<hd-textarea\n  placeholder="${playgroundTextareaPlaceholder}"\n  value="${playgroundInputValue}"\n  data-disable-horizontal-resize="${playgroundTextareaDisableResize}"\n  ${commonData}\n data-font-size="14pt" data-height="200pt" />`;
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
        return `<hd-switch\n  ${playgroundSwitchState ? "checked " : ""}${playgroundIsDisabled ? "disabled " : ""}${swSizeAttr}${colorAttr} data-thickness="4px"\n/>`;
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
    if (id === "hd-video") {
      setPlaygroundWidth("100%");
      setPlaygroundHeight("260px");
    } else if (id === "hd-checkbox" || id === "hd-radio" || id === "hd-switch" || id === "hd-color-picker") {
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
      "data-width": playgroundWidth,
      "data-height": playgroundHeight,
      "data-thickness": playgroundThickness,
      "data-color": playgroundColor,
      "data-text-color": playgroundTextColor,
      "data-radius": playgroundRadius,
    } as any;

    switch(playgroundActiveTab) {
      case "hd-video":
        return (
          <HdVideoPlayer
            key={playgroundComponentKey}
            width={playgroundWidth}
            height={playgroundHeight}
            thickness={playgroundThickness}
            color={playgroundColor}
            textColor={playgroundTextColor}
            radius={playgroundRadius}
            autoplay={playgroundVideoAutoplay}
            loop={playgroundVideoLoop}
            muted={playgroundVideoMuted}
            showControls={playgroundVideoControls}
          />
        );
      case "hd-button":
        return (
          <hd-button key={playgroundComponentKey} suppressHydrationWarning {...commonProps} disabled={playgroundIsDisabled} onClick={() => alert("Սեղմված է")}>
            {playgroundBtnText}
          </hd-button>
        );
      case "hd-input":
        return (
          <hd-input
            key={playgroundComponentKey}
            suppressHydrationWarning
            {...commonProps}
            type={playgroundInputType}
            placeholder={playgroundInputPlaceholder}
            value={playgroundInputValue}
            disabled={playgroundIsDisabled}
            onChange={(e: any) => setPlaygroundInputValue(e.target.value)}
          data-font-size="14pt" />
        );
      case "hd-textarea":
        return (
          <hd-textarea
            key={playgroundComponentKey}
            suppressHydrationWarning
            {...commonProps}
            placeholder={playgroundTextareaPlaceholder}
            value={playgroundInputValue}
            data-disable-horizontal-resize={playgroundTextareaDisableResize ? "true" : undefined}
            onChange={(e: any) => setPlaygroundInputValue(e.target.value)}
          data-font-size="14pt" data-height="200pt" />
        );
      case "hd-slider":
        return (
          <hd-slider
            key={playgroundComponentKey}
            suppressHydrationWarning
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
            suppressHydrationWarning
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
            suppressHydrationWarning
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
            suppressHydrationWarning
            checked={playgroundSwitchState}
            disabled={playgroundIsDisabled}
            data-size={playgroundSwitchSize}
            data-color={playgroundColor}
            data-thickness="4px"
            onChange={(e: any) => setPlaygroundSwitchState(e.target.checked)}
          />
        );
      case "hd-select":
        return (
          <hd-select
            key={playgroundComponentKey}
            suppressHydrationWarning
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
            key={playgroundComponentKey}
            suppressHydrationWarning
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
            key={playgroundComponentKey}
            suppressHydrationWarning
            {...commonProps}
            data-color={playgroundColorPickerVal}
            onChange={(e: any) => setPlaygroundColorPickerVal(e.target.value)}
          />
        );
      case "hd-color-panel":
        return (
          <hd-color-panel
            key={playgroundComponentKey}
            suppressHydrationWarning
            value={playgroundColorPanelVal}
            data-width={playgroundWidth}
            data-height={playgroundHeight}
            onChange={(e: any) => setPlaygroundColorPanelVal(e.target.value)}
          />
        );
      case "hd-scrollbar":
        return (
          <hd-scrollbar key={playgroundComponentKey} suppressHydrationWarning style={{ width: playgroundWidth || "100%", height: playgroundHeight || "150px", overflow: "auto", border: "1px solid var(--panel-border)", borderRadius: "8px", background: "rgba(0,0,0,0.1)" }}>
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
    const cleanId = String(caseId).toLowerCase();
    if (cleanId.startsWith('local-g-')) {
      const idNum = parseInt(cleanId.replace('local-g-', ''));
      const original = galleryWorks.find(x => x.id === idNum);
      return original?.svg || null;
    }
    
    // Custom SVGs for branding cases
    if (cleanId === 'pasta' || cleanId === 'local-b-1' || cleanId === 'seed-1') {
      return (
        <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <rect width="200" height="150" fill="var(--panel)" />
          {/* Spaghetti / Pasta strands */}
          <path d="M 35,120 C 50,40 150,40 165,120" stroke="var(--primary-color)" strokeWidth="6" strokeLinecap="round" />
          <path d="M 55,120 C 70,60 130,60 145,120" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
          <path d="M 75,120 C 85,85 115,85 125,120" stroke="#fbc02d" strokeWidth="2" strokeLinecap="round" />
          {/* Fork/Pasta fork */}
          <path d="M 100,15 L 100,75 M 85,25 L 115,25 M 85,15 L 85,25 M 115,15 L 115,25 M 100,15 L 100,25" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round" />
          <text x="100" y="112" fill="var(--text)" fontSize="13" fontWeight="bold" textAnchor="middle" letterSpacing="1" fontFamily="HDesign">PASTA</text>
        </svg>
      );
    }
    if (cleanId === 'eleven' || cleanId === 'local-b-2' || cleanId === 'seed-2') {
      return (
        <svg viewBox="0 0 200 150" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <rect width="200" height="150" fill="var(--panel)" />
          {/* Two minimalist vertical lines representing 11 */}
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
          {/* Experimental typographic posters look */}
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
          {/* Abstract teal lines overlapping */}
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
          {/* Smartphone device shell */}
          <rect x="70" y="15" width="60" height="120" rx="8" stroke="var(--text)" strokeWidth="3" fill="var(--input-bg)" />
          {/* Speaker / Notch */}
          <rect x="92" y="20" width="16" height="3" rx="1.5" fill="var(--text)" />
          {/* Interface elements inside */}
          <circle cx="85" cy="45" r="7" fill="var(--primary-color)" />
          <rect x="96" y="40" width="22" height="4" rx="2" fill="var(--text)" opacity="0.6" />
          <rect x="96" y="47" width="14" height="3" rx="1.5" fill="var(--text)" opacity="0.4" />
          <rect x="80" y="65" width="40" height="24" rx="4" fill="var(--panel-border)" stroke="var(--text)" strokeWidth="1" />
          <rect x="80" y="97" width="18" height="18" rx="3" fill="var(--primary-color)" />
          <rect x="102" y="97" width="18" height="18" rx="3" fill="var(--accent)" />
          {/* Home indicator bar */}
          <rect x="90" y="130" width="20" height="2" rx="1" fill="var(--text)" opacity="0.5" />
        </svg>
      );
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

    fetch("/api/general-settings")
      .then(res => res.json())
      .then(data => {
        if (data) {
          const sanitizeVideoUrl = (url?: string) => {
            if (!url || url.includes('/uploads/') || url.includes('1784817997323')) {
              return "https://api.hakobian.am/libs/v1/promo/promo.mp4";
            }
            return url;
          };
          setDsVideoSettings({
            video_hy: sanitizeVideoUrl(data.design_system_video_hy),
            video_en: sanitizeVideoUrl(data.design_system_video_en),
            poster_hy: data.design_system_poster_hy || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
            poster_en: data.design_system_poster_en || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
          });
        }
      })
      .catch(err => console.warn("Failed to load design system video settings:", err));

    fetch("/api/icons-settings")
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.custom_icons)) {
          setCustomIcons(data.custom_icons);
        }
      })
      .catch(err => console.warn("Failed to load dynamic custom icons:", err));
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

  const categoriesWithFilteredIcons = iconCategories.map(cat => {
    let filtered = cat.icons.filter(icon => 
      icon.toLowerCase().includes(iconSearch.toLowerCase())
    );

    if (iconSortOrder === "alphabetical") {
      filtered = [...filtered].sort((a, b) => {
        const cleanA = a.replace("icon-", "").toLowerCase();
        const cleanB = b.replace("icon-", "").toLowerCase();
        return cleanA.localeCompare(cleanB);
      });
    }

    return {
      ...cat,
      filteredIcons: filtered
    };
  }).filter(cat => cat.filteredIcons.length > 0);

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
          <hd-reveal data-direction="up" data-duration="1000">
            <InteractiveWaveText 
              lines={[t('home', 'hero_line1', 'ՍՏԵՂԾԱ'), t('home', 'hero_line2', 'ԵՒ ԳՈՐԾՆԱԿԱՆ')]}
            />
          </hd-reveal>
          <hd-reveal data-direction="up" data-duration="1000" data-delay="300">
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
                {t('home', 'hero_quote', 'Ամեն ոք չի կարող մեծ վարպետ դառնալ, բայց մեծ վարպետը կարող է գալ ամենուրից')}
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
          </hd-reveal>
        </section>

        {/* ══ SECTION 2: BRANDING CASES (Բրենդինգի Քեյսեր) ══ */}
        <section>
          <hd-reveal data-direction="up" data-duration="800">
            <h2 style={{ fontSize: "32pt", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "-20px", paddingLeft: "20px", color: "var(--text)" }}>
              {locale === "en" ? "Branding" : "Բրենդինգ"}
            </h2>
          </hd-reveal>
          <hd-reveal data-direction="up" data-duration="1000" data-delay="150">
            <div className="marquee-container">
            <div className="marquee-track">
              {/* Loop twice to make it seamless */}
              {getRepeatedMarqueeItems().map((card, idx) => (
                <Link 
                  key={idx} 
                  href={getBrandingLink(card)}
                  className="marquee-card" 
                  style={{ textDecoration: "none" }}
                  title={t('home', 'click_details', 'Սեղմեք մանրամասների համար')}
                >
                  {/* Unified Media Wrapper */}
                  <div className="card-media-wrapper">
                    {card.image_url || card.image ? (
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
                          zIndex: 1,
                          opacity: 1
                        }} 
                      />
                    ) : (
                      <div className="card-bg-design" style={{ position: "absolute", inset: 0, zIndex: 1, overflow: "hidden" }}>
                        {getSvgForCase(card.id)}
                      </div>
                    )}
                    
                    {/* Black gradient overlay */}
                    <div 
                      className="card-gradient-overlay" 
                      style={{ 
                        position: "absolute", 
                        inset: 0, 
                        zIndex: 2, 
                        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)", 
                        pointerEvents: "none" 
                      }} 
                    />
                  </div>
                  
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
                    <span>{parseLangText(card.title, locale)}</span>
                    {renderCardRating(card.id)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
          </hd-reveal>
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

          <div className="landing-about-grid" style={{ maxWidth: "1500px", margin: "0 auto", padding: "80px 100px 40px", boxSizing: "border-box", display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "48px", alignItems: "center", position: "relative", zIndex: 5 }}>
            {/* Profile Image container */}
            <hd-reveal data-direction="right" data-duration="1000">
              <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", aspectRatio: "1" }}>
                <img 
                  src="/profile_hrant.jpg" 
                  alt="Hrant Hakobyan" 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </hd-reveal>

            {/* Bio Details */}
            <hd-reveal data-direction="left" data-duration="1000" data-delay="150">
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "#ffffff", margin: 0 }}>
                  {t('home', 'about_title', 'Մասին')}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.7em", color: "#ffffff", opacity: 0.9, fontSize: "1.05rem", lineHeight: "1.7" }}>
                  <p style={{ margin: 0 }}>
                    {t('about', 'bio_p1', t('home', 'about_p1', 'Ողջույն, ես Հրանտ Հակոբյանն եմ և Ճարտարապետության և շինարարության Հայաստանի Ազգային Համալսարանի ճարտարապետության ֆակուլտետի 4-րդ կուրսի ուսանող եմ։'))}
                  </p>
                </div>
                <div>
                  <Link href="/about">
                    <hd-button 
                      suppressHydrationWarning
                      data-width="160px"
                      data-height="52px"
                      data-thickness="3px"
                      data-color="#083F39"
                      data-text-color="#fff"
                    >{t('home', 'more_about_btn', 'Ավելին')}</hd-button>
                  </Link>
                </div>
              </div>
            </hd-reveal>
          </div>
        </section>

        {/* Reopen shell container for remaining contents */}
        <div className="shell">

        {/* ══ SECTION 4: GALLERY (Այլ աշխատանքներ) ══ */}
        <section id="works">
          <hd-reveal data-direction="up" data-duration="800">
            <h2 style={{ fontSize: "2.2rem", fontWeight: "900", textAlign: "center", color: "var(--text)", marginBottom: "16px" }}>
              {t('home', 'other_works', 'Այլ աշխատանքներ')}
            </h2>
          </hd-reveal>
          
          <hd-reveal data-direction="up" data-duration="1000" data-delay="150">
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
                  suppressHydrationWarning
                  data-width="160px"
                  data-height="52px"
                  data-thickness="3px"
                >{t('home', 'more_btn', 'Ավելի')}</hd-button>
              </Link>
            </div>
          </hd-reveal>
        </section>

        {/* ══ SECTION 5: PLAYGROUND (Դիզայնի Համակարգը) ══ */}
        <section id="playground" style={{ padding: "40px 0" }}>
          <style>{`
            .homepage-playground-container {
              display: grid;
              grid-template-columns: 260px 1fr 300px;
              gap: 24px;
              max-width: 1500px;
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
            .playground-sidebar-wrapper {
              display: block;
            }
            .playground-preview-wrapper {
              display: block;
              min-width: 0;
            }
            .playground-controls-wrapper {
              display: block;
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
              height: 500px !important;
              max-height: 500px !important;
              min-height: 500px !important;
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
              .playground-controls-wrapper {
                grid-column: span 2;
              }
              .playground-controls-column {
                max-height: 400px;
                height: 400px;
              }
            }
            @media (max-width: 768px) {
              .homepage-playground-container {
                grid-template-columns: 1fr;
                gap: 16px;
              }
              .playground-sidebar-wrapper {
                width: 100%;
              }
              .playground-controls-wrapper {
                grid-column: span 1;
              }
              .playground-sidebar-column {
                max-height: none;
                height: auto;
                padding: 12px 14px;
                border-radius: 16px;
              }
              .playground-sidebar-column hd-scrollbar {
                height: auto !important;
                max-height: none !important;
              }
              .playground-components-list {
                flex-direction: row !important;
                overflow-x: auto !important;
                padding-right: 0 !important;
                padding-bottom: 6px !important;
                gap: 8px !important;
                -webkit-overflow-scrolling: touch;
              }
              .playground-tab-btn {
                width: auto !important;
                flex-shrink: 0 !important;
                flex-direction: row !important;
                align-items: center !important;
                padding: 8px 14px !important;
                border-radius: 20px !important;
              }
              .playground-tab-desc {
                display: none !important;
              }
              .playground-preview-column {
                height: 500px !important;
                max-height: 500px !important;
                min-height: 500px !important;
                gap: 16px;
              }
              .playground-controls-column {
                max-height: 480px;
                height: auto;
                padding: 16px;
                border-radius: 16px;
              }
              .playground-controls-column hd-scrollbar {
                height: auto !important;
                max-height: 380px !important;
              }
            }
            @media (max-width: 480px) {
              .homepage-playground-container {
                gap: 12px;
              }
              .playground-sidebar-column {
                padding: 10px 12px;
              }
              .playground-tab-btn {
                padding: 6px 12px !important;
              }
              .playground-tab-btn span {
                font-size: 0.8rem !important;
              }
              .playground-controls-column {
                padding: 12px;
                max-height: 420px;
              }
              .playground-controls-column hd-scrollbar {
                max-height: 340px !important;
              }
            }
          `}</style>
          
          <hd-reveal data-direction="up" data-duration="800">
            <h2 style={{
              fontSize: "2.2rem",
              fontWeight: "900",
              textAlign: "center",
              color: "var(--text)",
              marginBottom: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px"
            }}>
              {t('home', 'design_system', 'Դիզայնի Համակարգը')}
              <sup style={{ fontSize: "0.9rem", color: "var(--primary-color)", fontWeight: "bold", marginLeft: "4px" }}>ԲԵՏԱ</sup>
            </h2>
          </hd-reveal>

          {/* ══ DEDICATED VIDEO PLAYER SECTION ══ */}
          <hd-reveal suppressHydrationWarning data-direction="up" data-duration="900" data-delay="100">
            <div style={{
              width: "100%",
              maxWidth: "1500px",
              margin: "0 auto 60px auto",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              alignItems: "center"
            }}>

              <div style={{ width: "100%", maxWidth: "1500px", aspectRatio: "16 / 9", height: "auto", borderRadius: "24px", overflow: "hidden", boxShadow: "0 0 30px rgba(0, 0, 0, 0.08)" }}>
                <HdVideoPlayer
                  src={locale === 'en' ? (dsVideoSettings.video_en || dsVideoSettings.video_hy) : (dsVideoSettings.video_hy || dsVideoSettings.video_en)}
                  poster={locale === 'en' ? (dsVideoSettings.poster_en || dsVideoSettings.poster_hy) : (dsVideoSettings.poster_hy || dsVideoSettings.poster_en)}
                  width="100%"
                  height="auto"
                  thickness="0px"
                  color="var(--primary-color)"
                  radius="24px"
                  autoplay={false}
                  loop={true}
                  showControls={true}
                />
              </div>
            </div>
          </hd-reveal>
          
          <hd-reveal suppressHydrationWarning data-direction="up" data-duration="800">
            <h3 style={{
              fontSize: "1.4rem",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "1px",
              textAlign: "center",
              color: "var(--text)",
              marginBottom: "40px"
            }}>
              {t('home', 'components_title', 'Բաղադրիչներ')}
            </h3>
          </hd-reveal>
          
          <div className="homepage-playground-container">
            {/* Sidebar List of 12 components */}
            <hd-reveal suppressHydrationWarning className="playground-sidebar-wrapper" data-direction="up" data-duration="900" data-delay="0">
              <div className="playground-sidebar-column">
              <span style={{ fontSize: "0.75rem", fontWeight: "800", opacity: 0.5, letterSpacing: "1px", padding: "6px 8px 12px 8px" }}>
                {t('home', 'components_label', 'ԿՈՄՊՈՆԵՆՏՆԵՐ')}
              </span>
              <hd-scrollbar suppressHydrationWarning style={{ height: "420px", overflow: "auto", overscrollBehavior: "contain" }}>
                <div className="playground-components-list" style={{ display: "flex", flexDirection: "column", gap: "6px", paddingRight: "10px" }}>
                  {playgroundComponentsList.map((comp) => {
                    const isActive = playgroundActiveTab === comp.id;
                    return (
                      <button
                        key={comp.id}
                        onClick={() => handlePlaygroundTabChange(comp.id)}
                        className={`playground-tab-btn ${isActive ? 'active' : ''}`}
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
                        <span className="playground-tab-desc" style={{ fontSize: "0.7rem", opacity: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>{comp.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </hd-scrollbar>
            </div>
            </hd-reveal>

            {/* Central Canvas Preview & Code */}
            <hd-reveal suppressHydrationWarning className="playground-preview-wrapper" data-direction="up" data-duration="900" data-delay="150">
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
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "0.68rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      padding: "0 16px 0 0",
                      outline: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "color 0.2s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#b0b0b0")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}
                  >
                    <span className={playgroundCopied ? "icon-Check" : "icon-Copy"} style={{ fontSize: "0.85rem" }} />
                    <span>{playgroundCopied ? "ՊԱՏՃԵՆՎԱԾ Է!" : "ՊԱՏՃԵՆԵԼ"}</span>
                  </button>
                </div>
                <hd-scrollbar suppressHydrationWarning style={{ flex: 1, overflow: "auto", overscrollBehavior: "contain", background: "#121817" }}>
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "2px" }}>
                    {highlightPlaygroundHTML(generatePlaygroundCode()).split("\n").map((line, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "start", fontFamily: "Consolas, monospace !important", fontSize: "0.82rem", lineHeight: "1.5" }}>
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
                            fontFamily: "Consolas, monospace !important",
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
            </hd-reveal>

            {/* Right configuration controls */}
            <hd-reveal suppressHydrationWarning className="playground-controls-wrapper" data-direction="up" data-duration="900" data-delay="300">
              <div className="playground-controls-column">
              <span style={{ fontSize: "0.75rem", fontWeight: "800", opacity: 0.5, letterSpacing: "1px", paddingBottom: "8px" }}>
                ԿԱՐԳԱՎՈՐՈՒՄՆԵՐ
              </span>
              <hd-scrollbar suppressHydrationWarning style={{ height: "420px", overflow: "auto", overscrollBehavior: "contain" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingRight: "10px" }}>
                  {/* Stylistic attributes */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    
                    {playgroundWidth !== "auto" && (
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Լայնություն (Width)</span>
                        <hd-select suppressHydrationWarning value={playgroundWidth} onChange={(e: any) => setPlaygroundWidth(e.target.value)} data-height="34px" data-thickness="2px">
                          <span value="100%">100%</span>
                          <span value="240px">240px</span>
                          <span value="180px">180px</span>
                        </hd-select>
                      </label>
                    )}

                    {playgroundHeight !== "auto" && playgroundActiveTab !== "hd-scrollbar" && (
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Բարձրություն (Height)</span>
                        <hd-select suppressHydrationWarning value={playgroundHeight} onChange={(e: any) => setPlaygroundHeight(e.target.value)} data-height="34px" data-thickness="2px">
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

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>Եզրագիծ</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={playgroundThickness.replace("px", "")}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (!isNaN(val) && e.target.value !== "") setPlaygroundThickness(`${val}px`);
                            }}
                            onBlur={(e) => {
                              let val = parseInt(e.target.value, 10);
                              if (isNaN(val)) val = 1;
                              val = Math.min(5, Math.max(1, val));
                              setPlaygroundThickness(`${val}px`);
                            }}
                            style={{
                              width: "48px",
                              padding: "2px 4px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              color: "var(--text)",
                              background: "rgba(0,0,0,0.2)",
                              border: "1px solid var(--panel-border)",
                              borderRadius: "4px",
                              textAlign: "center",
                              outline: "none"
                            }}
                          />
                          <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>px</span>
                        </div>
                      </div>
                      <hd-slider min="1" max="5" value={playgroundThickness.replace("px", "")} onInput={(e: any) => setPlaygroundThickness(`${e.target.value}px`)} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>Կլորացում</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                          <input
                            type="number"
                            min="0"
                            max="24"
                            value={playgroundRadius.replace("px", "")}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (!isNaN(val) && e.target.value !== "") setPlaygroundRadius(`${val}px`);
                            }}
                            onBlur={(e) => {
                              let val = parseInt(e.target.value, 10);
                              if (isNaN(val)) val = 0;
                              val = Math.min(24, Math.max(0, val));
                              setPlaygroundRadius(`${val}px`);
                            }}
                            style={{
                              width: "48px",
                              padding: "2px 4px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              color: "var(--text)",
                              background: "rgba(0,0,0,0.2)",
                              border: "1px solid var(--panel-border)",
                              borderRadius: "4px",
                              textAlign: "center",
                              outline: "none"
                            }}
                          />
                          <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>px</span>
                        </div>
                      </div>
                      <hd-slider min="0" max="24" value={playgroundRadius.replace("px", "")} onInput={(e: any) => setPlaygroundRadius(`${e.target.value}px`)} />
                    </div>

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
                    
                    {playgroundActiveTab === "hd-video" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", opacity: 0.85, cursor: "pointer" }}>
                          <span>Ավտոնվագարկում (Autoplay)</span>
                          <hd-switch suppressHydrationWarning checked={playgroundVideoAutoplay} onChange={(e: any) => setPlaygroundVideoAutoplay(e.target.checked)} data-size="18px" />
                        </label>
                        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", opacity: 0.85, cursor: "pointer" }}>
                          <span>Կրկնել (Loop)</span>
                          <hd-switch suppressHydrationWarning checked={playgroundVideoLoop} onChange={(e: any) => setPlaygroundVideoLoop(e.target.checked)} data-size="18px" />
                        </label>
                        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", opacity: 0.85, cursor: "pointer" }}>
                          <span>Առանց ձայնի (Muted)</span>
                          <hd-switch suppressHydrationWarning checked={playgroundVideoMuted} onChange={(e: any) => setPlaygroundVideoMuted(e.target.checked)} data-size="18px" />
                        </label>
                        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", opacity: 0.85, cursor: "pointer" }}>
                          <span>Ղեկավարում (Controls)</span>
                          <hd-switch suppressHydrationWarning checked={playgroundVideoControls} onChange={(e: any) => setPlaygroundVideoControls(e.target.checked)} data-size="18px" />
                        </label>
                      </div>
                    )}

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
                          <hd-checkbox suppressHydrationWarning checked={playgroundIsDisabled} onChange={(e: any) => setPlaygroundIsDisabled(e.target.checked)} />
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
                          <hd-checkbox suppressHydrationWarning checked={playgroundIsDisabled} onChange={(e: any) => setPlaygroundIsDisabled(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>Պասիվ (Disabled)</span>
                        </label>
                      </>
                    )}

                    {playgroundActiveTab === "hd-textarea" && (
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <hd-checkbox suppressHydrationWarning checked={playgroundTextareaDisableResize} onChange={(e: any) => setPlaygroundTextareaDisableResize(e.target.checked)} />
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
                          <hd-checkbox suppressHydrationWarning checked={playgroundIsDisabled} onChange={(e: any) => setPlaygroundIsDisabled(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>{t('home', 'disabled_label', 'Պասիվ')}</span>
                        </label>
                      </>
                    )}

                    {playgroundActiveTab === "hd-checkbox" && (
                      <>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox suppressHydrationWarning checked={playgroundCheckedState} onChange={(e: any) => setPlaygroundCheckedState(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>{t('home', 'checked_state', 'Ընտրված (Checked)')}</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox suppressHydrationWarning checked={playgroundIsDisabled} onChange={(e: any) => setPlaygroundIsDisabled(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>{t('home', 'disabled_label', 'Պասիվ')}</span>
                        </label>
                      </>
                    )}

                    {playgroundActiveTab === "hd-radio" && (
                      <>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox suppressHydrationWarning checked={playgroundRadioState} onChange={(e: any) => setPlaygroundRadioState(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>{t('home', 'checked_state', 'Ընտրված (Checked)')}</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox suppressHydrationWarning checked={playgroundIsDisabled} onChange={(e: any) => setPlaygroundIsDisabled(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>{t('home', 'disabled_label', 'Պասիվ')}</span>
                        </label>
                      </>
                    )}

                    {playgroundActiveTab === "hd-switch" && (
                      <>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox suppressHydrationWarning checked={playgroundSwitchState} onChange={(e: any) => setPlaygroundSwitchState(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>{t('home', 'active_label', 'Միացված (Active)')}</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox suppressHydrationWarning checked={playgroundIsDisabled} onChange={(e: any) => setPlaygroundIsDisabled(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>{t('home', 'disabled_label', 'Պասիվ')}</span>
                        </label>
                      </>
                    )}

                    {playgroundActiveTab === "hd-select" && (
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>{t('home', 'value_label', 'Արժեք')}</span>
                        <hd-select value={playgroundSelectVal} onChange={(e: any) => setPlaygroundSelectVal(e.target.value)} data-height="34px" data-thickness="2px">
                          {playgroundSelectOptions.split(",").map((opt, i) => (
                            <span key={i} value={`option${i+1}`}>{opt.trim()}</span>
                          ))}
                        </hd-select>
                      </label>
                    )}

                    {playgroundActiveTab === "hd-segment" && (
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>{t('home', 'active_tab', 'Ակտիվ տաբ')}</span>
                        <hd-select value={playgroundSegmentVal} onChange={(e: any) => setPlaygroundSegmentVal(e.target.value)} data-height="34px" data-thickness="2px">
                          {playgroundSegmentOptions.split(",").map((opt, i) => (
                            <span key={i} value={`tab${i+1}`}>{opt.trim()}</span>
                          ))}
                        </hd-select>
                      </label>
                    )}

                    {playgroundActiveTab === "hd-color-picker" && (
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>{t('home', 'color_hex', 'Գույնը (Hex)')}</span>
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
                        <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>{t('home', 'color_hex', 'Գույնը (Hex)')}</span>
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
                        <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>{t('home', 'content_height', 'Պարունակության բարձրություն:')} {playgroundScrollContentHeight}px</span>
                        <hd-slider suppressHydrationWarning min="150" max="500" value={playgroundScrollContentHeight} onInput={(e: any) => setPlaygroundScrollContentHeight(Number(e.target.value))} />
                      </label>
                    )}

                  </div>
                </div>
              </hd-scrollbar>
            </div>
            </hd-reveal>
          </div>
        </section>
        {/* ══ SECTION 6: ICONS (Պատկերակներ) ══ */}
        <section id="icons" style={{ maxWidth: "1500px", margin: "0 auto", width: "100%" }}>
          <hd-reveal data-direction="up" data-duration="800">
            <h2 style={{ fontSize: "1.4rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px", textAlign: "center", color: "var(--text)" }}>
              {t('home', 'icons_title', 'Պատկերներ')} ({iconsList.length})
            </h2>
          </hd-reveal>
          {/* Two-column layout: Left (Grid) & Right (Details) */}
          <hd-reveal data-direction="up" data-duration="1000" data-delay="150">
            <div 
              ref={sectionRef}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "32px",
                width: "100%",
                alignItems: "flex-start",
                marginTop: "24px"
              }}
            >
            {/* Left Column: Icons Grid */}
            <div style={{ flex: "1 1 500px", minWidth: "0" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
                {categoriesWithFilteredIcons.map((category, catIdx) => (
                  <div key={catIdx}>
                    <h3 style={{ 
                      fontSize: "0.85rem", 
                      fontWeight: "750", 
                      textTransform: "uppercase", 
                      letterSpacing: "1px", 
                      color: "var(--text)", 
                      opacity: 0.6, 
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      {locale === 'en' ? category.titleEn : category.titleHy}
                      <span style={{ fontSize: "0.75rem", opacity: 0.5, fontWeight: "normal" }}>
                        ({category.filteredIcons.length})
                      </span>
                    </h3>
                    <div className="icon-explorer-grid" style={{ marginTop: 0 }}>
                      {category.filteredIcons.map((icon, idx) => (
                        <div 
                          key={idx} 
                          className={`icon-explorer-card ${selectedIconDetail === icon ? "active" : ""}`}
                          onClick={() => setSelectedIconDetail(icon)}
                          title={t('home', 'click_usage', 'Սեղմեք՝ տեսնելու օգտագործման ձևը')}
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
                            {t('home', 'details_label', 'Մանրամասներ')}
                          </div>
                        </div>
                      ))}
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
                boxShadow: "var(--shadow)",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}>
                <hd-input 
                  placeholder={t('home', 'search_icon', 'Որոնել պատկերակ...')} 
                  value={iconSearch}
                  onInput={(e: any) => setIconSearch(e.target.value)}
                  data-width="100%"
                  data-height="46px"
                  data-thickness="3px"
                data-font-size="14pt" />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.82rem", color: "var(--muted)", fontWeight: "600" }}>
                    {t('home', 'sort_by', 'Դասավորել')}
                  </span>
                  <hd-segment
                    value={iconSortOrder}
                    onChange={(e: any) => setIconSortOrder(e.target.value)}
                    data-height="34px"
                    data-thickness="2px"
                  >
                    <span value="default" {...(iconSortOrder === "default" ? { selected: true } : {})}>
                      {t('home', 'sort_default', 'Խմբավորված')}
                    </span>
                    <span value="alphabetical" {...(iconSortOrder === "alphabetical" ? { selected: true } : {})}>
                      A-Z
                    </span>
                  </hd-segment>
                </div>
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
                    {t('home', 'thickness', 'Հաստություն (Thickness)')}
                  </span>
                  <input
                    type="number"
                    min="100"
                    max="900"
                    step="100"
                    value={iconWeight}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val) && e.target.value !== "") setIconWeight(val);
                    }}
                    onBlur={(e) => {
                      let val = parseInt(e.target.value, 10);
                      if (isNaN(val)) val = 400;
                      setIconWeight(Math.min(900, Math.max(100, val)));
                    }}
                    style={{
                      width: "64px",
                      padding: "2px 6px",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      color: "var(--primary-color)",
                      background: "var(--input-bg)",
                      border: "1px solid var(--input-border)",
                      borderRadius: "6px",
                      textAlign: "center",
                      outline: "none"
                    }}
                  />
                </div>
                <hd-slider 
                  suppressHydrationWarning
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
                    {selectedIconDetail === "icon-HD-Logo-Horizontal"
                      ? "HD Logo Horizontal / Hamburger Menu"
                      : selectedIconDetail.replace("icon-", "").replace(/-/g, " ")}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0", fontFamily: "monospace" }}>
                    Class: {selectedIconDetail === "icon-HD-Logo-Horizontal"
                      ? "icon-HD-Logo-Horizontal / icon-Hamburger-Menu"
                      : selectedIconDetail}
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
                    {t('home', 'sizes_showcase', 'Չափսերի Տարբերակներ (16px - 64px)')}
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
                    suppressHydrationWarning
                    onClick={() => downloadSvg(selectedIconDetail)}
                    data-width="50%"
                    data-height="40px"
                    data-thickness="3px"
                    data-color="transparent"
                    data-text-color="var(--text)"
                    title={t('home', 'download_svg', 'Ներբեռնել SVG')}
                    style={{ flex: 1 }}
                  >
                    <span className="icon-Download" style={{ fontSize: "0.85rem", marginRight: "6px" }} />
                    SVG
                  </hd-button>
                  <hd-button
                    suppressHydrationWarning
                    onClick={() => downloadPng(selectedIconDetail)}
                    data-width="50%"
                    data-height="40px"
                    data-thickness="3px"
                    data-color="var(--primary-color)"
                    data-text-color="#ffffff"
                    title={t('home', 'download_png', 'Ներբեռնել PNG')}
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
                    <div style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase", marginBottom: "4px" }}>HTML</div>
                    
                    {selectedIconDetail === "icon-HD-Logo-Horizontal" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                            <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>HD Logo Horizontal</span>
                            <span 
                              onClick={() => handleCopySnippet(htmlLogo1, "html1")}
                              style={{ background: "transparent", border: "none", color: copiedSnippet === "html1" ? "var(--primary-color)" : "var(--muted)", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                            >
                              <span className={copiedSnippet === "html1" ? "icon-Check" : "icon-Copy"} style={{ fontSize: "0.8rem" }} />
                              {copiedSnippet === "html1" ? t('home', 'copied', 'Պատճենված է') : t('home', 'copy', 'Պատճենել')}
                            </span>
                          </div>
                          <div style={{ background: "var(--input-bg)", border: "1px solid var(--panel-border)", borderRadius: "6px", padding: "6px 10px", fontSize: "0.75rem", color: "var(--text)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                            {htmlLogo1}
                          </div>
                        </div>

                        <div style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--primary-color)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", margin: "2px 0" }}>
                          {t('home', 'or', 'Կամ')}
                        </div>

                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                            <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>Hamburger Menu</span>
                            <span 
                              onClick={() => handleCopySnippet(htmlLogo2, "html2")}
                              style={{ background: "transparent", border: "none", color: copiedSnippet === "html2" ? "var(--primary-color)" : "var(--muted)", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                            >
                              <span className={copiedSnippet === "html2" ? "icon-Check" : "icon-Copy"} style={{ fontSize: "0.8rem" }} />
                              {copiedSnippet === "html2" ? t('home', 'copied', 'Պատճենված է') : t('home', 'copy', 'Պատճենել')}
                            </span>
                          </div>
                          <div style={{ background: "var(--input-bg)", border: "1px solid var(--panel-border)", borderRadius: "6px", padding: "6px 10px", fontSize: "0.75rem", color: "var(--text)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                            {htmlLogo2}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase" }}>HTML</span>
                          <span 
                            onClick={() => handleCopySnippet(htmlSnippet, "html")}
                            style={{ background: "transparent", border: "none", color: copiedSnippet === "html" ? "var(--primary-color)" : "var(--muted)", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                          >
                            <span className={copiedSnippet === "html" ? "icon-Check" : "icon-Copy"} style={{ fontSize: "0.8rem" }} />
                            {copiedSnippet === "html" ? t('home', 'copied', 'Պատճենված է') : t('home', 'copy', 'Պատճենել')}
                          </span>
                        </div>
                        <div style={{ background: "var(--input-bg)", border: "1px solid var(--panel-border)", borderRadius: "6px", padding: "6px 10px", fontSize: "0.75rem", color: "var(--text)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                          {htmlSnippet}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* React / JSX Usage */}
                  <div style={{ marginTop: "10px" }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase", marginBottom: "4px" }}>React / JSX</div>
                    
                    {selectedIconDetail === "icon-HD-Logo-Horizontal" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                            <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>HD Logo Horizontal</span>
                            <span 
                              onClick={() => handleCopySnippet(reactLogo1, "react1")}
                              style={{ background: "transparent", border: "none", color: copiedSnippet === "react1" ? "var(--primary-color)" : "var(--muted)", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                            >
                              <span className={copiedSnippet === "react1" ? "icon-Check" : "icon-Copy"} style={{ fontSize: "0.8rem" }} />
                              {copiedSnippet === "react1" ? t('home', 'copied', 'Պատճենված է') : t('home', 'copy', 'Պատճենել')}
                            </span>
                          </div>
                          <div style={{ background: "var(--input-bg)", border: "1px solid var(--panel-border)", borderRadius: "6px", padding: "6px 10px", fontSize: "0.75rem", color: "var(--text)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                            {reactLogo1}
                          </div>
                        </div>

                        <div style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--primary-color)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", margin: "2px 0" }}>
                          {t('home', 'or', 'Կամ')}
                        </div>

                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                            <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>Hamburger Menu</span>
                            <span 
                              onClick={() => handleCopySnippet(reactLogo2, "react2")}
                              style={{ background: "transparent", border: "none", color: copiedSnippet === "react2" ? "var(--primary-color)" : "var(--muted)", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                            >
                              <span className={copiedSnippet === "react2" ? "icon-Check" : "icon-Copy"} style={{ fontSize: "0.8rem" }} />
                              {copiedSnippet === "react2" ? t('home', 'copied', 'Պատճենված է') : t('home', 'copy', 'Պատճենել')}
                            </span>
                          </div>
                          <div style={{ background: "var(--input-bg)", border: "1px solid var(--panel-border)", borderRadius: "6px", padding: "6px 10px", fontSize: "0.75rem", color: "var(--text)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                            {reactLogo2}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase" }}>React / JSX</span>
                          <span 
                            onClick={() => handleCopySnippet(reactSnippet, "react")}
                            style={{ background: "transparent", border: "none", color: copiedSnippet === "react" ? "var(--primary-color)" : "var(--muted)", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                          >
                            <span className={copiedSnippet === "react" ? "icon-Check" : "icon-Copy"} style={{ fontSize: "0.8rem" }} />
                            {copiedSnippet === "react" ? t('home', 'copied', 'Պատճենված է') : t('home', 'copy', 'Պատճենել')}
                          </span>
                        </div>
                        <div style={{ background: "var(--input-bg)", border: "1px solid var(--panel-border)", borderRadius: "6px", padding: "6px 10px", fontSize: "0.75rem", color: "var(--text)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                          {reactSnippet}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CSS Class */}
                  <div style={{ marginTop: "10px" }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase", marginBottom: "4px" }}>CSS Class</div>
                    
                    {selectedIconDetail === "icon-HD-Logo-Horizontal" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                            <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>HD Logo Horizontal</span>
                            <span 
                              onClick={() => handleCopySnippet(cssLogo1, "css1")}
                              style={{ background: "transparent", border: "none", color: copiedSnippet === "css1" ? "var(--primary-color)" : "var(--muted)", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                            >
                              <span className={copiedSnippet === "css1" ? "icon-Check" : "icon-Copy"} style={{ fontSize: "0.8rem" }} />
                              {copiedSnippet === "css1" ? t('home', 'copied', 'Պատճենված է') : t('home', 'copy', 'Պատճենել')}
                            </span>
                          </div>
                          <div style={{ background: "var(--input-bg)", border: "1px solid var(--panel-border)", borderRadius: "6px", padding: "6px 10px", fontSize: "0.75rem", color: "var(--text)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                            {cssLogo1}
                          </div>
                        </div>

-                       <div style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--primary-color)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", margin: "2px 0" }}>
                          {t('home', 'or', 'Կամ')}
                        </div>

                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                            <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>Hamburger Menu</span>
                            <span 
                              onClick={() => handleCopySnippet(cssLogo2, "css2")}
                              style={{ background: "transparent", border: "none", color: copiedSnippet === "css2" ? "var(--primary-color)" : "var(--muted)", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                            >
                              <span className={copiedSnippet === "css2" ? "icon-Check" : "icon-Copy"} style={{ fontSize: "0.8rem" }} />
                              {copiedSnippet === "css2" ? t('home', 'copied', 'Պատճենված է') : t('home', 'copy', 'Պատճենել')}
                            </span>
                          </div>
                          <div style={{ background: "var(--input-bg)", border: "1px solid var(--panel-border)", borderRadius: "6px", padding: "6px 10px", fontSize: "0.75rem", color: "var(--text)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                            {cssLogo2}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase" }}>CSS Class</span>
                          <span 
                            onClick={() => handleCopySnippet(cssSnippet, "css")}
                            style={{ background: "transparent", border: "none", color: copiedSnippet === "css" ? "var(--primary-color)" : "var(--muted)", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                          >
                            <span className={copiedSnippet === "css" ? "icon-Check" : "icon-Copy"} style={{ fontSize: "0.8rem" }} />
                            {copiedSnippet === "css" ? t('home', 'copied', 'Պատճենված է') : t('home', 'copy', 'Պատճենել')}
                          </span>
                        </div>
                        <div style={{ background: "var(--input-bg)", border: "1px solid var(--panel-border)", borderRadius: "6px", padding: "6px 10px", fontSize: "0.75rem", color: "var(--text)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                          {cssSnippet}
                        </div>
                      </div>
                    )}
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
                        <span className={copiedSnippet === "libcss" ? "icon-Check" : "icon-Copy"} style={{ fontSize: "0.75rem" }} />
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
        </hd-reveal>

        {/* HDesign Font Glyphs Map & Variability Slider */}
        <hd-reveal data-direction="up" data-duration="1000">
          <h2 style={{ fontSize: "1.4rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginTop: "60px", marginBottom: "20px", textAlign: "center", color: "var(--text)" }}>
          {t('home', 'font_title', 'Տառատեսակ')}
        </h2>
          {/* 2-Column Flex Layout: Left Glyphs Panel + Right Controls Sidebar (Պատկերակների նման) */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "28px",
            width: "100%",
            alignItems: "flex-start"
          }}>
            {/* Left Column: Glyph Grids Card (Հետևի ետնաշերտը պատկանում է միայն գլիֆներին) */}
            <div style={{
              flex: "1 1 500px",
              minWidth: "300px",
              background: "var(--panel)",
              border: "1px solid var(--panel-border)",
              borderRadius: "24px",
              padding: "32px",
              boxShadow: "var(--shadow)",
              display: "flex",
              flexDirection: "column",
              gap: "28px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text)", margin: "0 0 6px 0" }}>
                    {t('home', 'font_glyphs', 'HDesign Տառատեսակի Գլիֆներ')}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0, minHeight: "20px" }}>
                    {copiedChar ? (
                      <span style={{ color: "var(--primary-color)", fontWeight: "bold" }}>
                        {t('home', 'char_copied', '«{char}» նիշը պատճենվեց:').replace('{char}', copiedChar)}
                      </span>
                    ) : (
                      t('home', 'click_copy_char', 'Կտտացրեք նիշի վրա՝ այն պատճենելու համար')
                    )}
                  </p>
                </div>
              </div>

              {/* Glyph Grids */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Armenian Character Grid */}
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Հայերեն (Armenian)</span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))", gap: "8px" }}>
                    {CHARS_AM.map((c, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          navigator.clipboard.writeText(c);
                          setCopiedChar(c);
                          setMatrixWatermarkChar(c);
                          setTimeout(() => setCopiedChar(null), 1500);
                        }}
                        className="character-cell"
                        style={{
                          fontFamily: "'HDesign', sans-serif",
                          fontWeight: 400,
                          height: "40px",
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid var(--panel-border)",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.3rem",
                          lineHeight: 1,
                          cursor: "pointer",
                          userSelect: "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                          fontFamily: "'HDesign', sans-serif",
                          fontWeight: 400,
                          fontStyle: "normal",
                          fontVariationSettings: `'wght' ${hdesignFontWeight}, 'ital' ${hdesignFontSlant}`
                        }}>
                          {c}
                        </span>
                        <div className="character-tooltip">
                          <div 
                            className="tooltip-large-char"
                            style={{
                              fontFamily: "'HDesign', sans-serif",
                              fontWeight: 400,
                              fontStyle: "normal",
                              lineHeight: 1,
                              fontVariationSettings: `'wght' ${hdesignFontWeight}, 'ital' ${hdesignFontSlant}`
                            }}
                          >
                            {c}
                          </div>
                          <div className="tooltip-name">
                            {getCharacterName(c)}
                          </div>
                          <div className="tooltip-code">
                            U+{c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* English Character Grid */}
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Անգլերեն (English)</span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))", gap: "8px" }}>
                    {CHARS_EN.map((c, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          navigator.clipboard.writeText(c);
                          setCopiedChar(c);
                          setMatrixWatermarkChar(c);
                          setTimeout(() => setCopiedChar(null), 1500);
                        }}
                        className="character-cell"
                        style={{
                          fontFamily: "'HDesign', sans-serif",
                          fontWeight: 400,
                          height: "40px",
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid var(--panel-border)",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.3rem",
                          lineHeight: 1,
                          cursor: "pointer",
                          userSelect: "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                          fontFamily: "'HDesign', sans-serif",
                          fontWeight: 400,
                          fontStyle: "normal",
                          fontVariationSettings: `'wght' ${hdesignFontWeight}, 'ital' ${hdesignFontSlant}`
                        }}>
                          {c}
                        </span>
                        <div className="character-tooltip">
                          <div 
                            className="tooltip-large-char"
                            style={{
                              fontFamily: "'HDesign', sans-serif",
                              fontWeight: 400,
                              fontStyle: "normal",
                              lineHeight: 1,
                              fontVariationSettings: `'wght' ${hdesignFontWeight}, 'ital' ${hdesignFontSlant}`
                            }}
                          >
                            {c}
                          </div>
                          <div className="tooltip-name">
                            {getCharacterName(c)}
                          </div>
                          <div className="tooltip-code">
                            U+{c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Numbers & Symbols Grid */}
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Թվեր և Նշաններ (Numbers & Symbols)</span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))", gap: "8px" }}>
                    {[...CHARS_NUM, ...CHARS_SYM].map((c, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          navigator.clipboard.writeText(c);
                          setCopiedChar(c);
                          setMatrixWatermarkChar(c);
                          setTimeout(() => setCopiedChar(null), 1500);
                        }}
                        className="character-cell"
                        style={{
                          fontFamily: "'HDesign', sans-serif",
                          fontWeight: 400,
                          height: "40px",
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid var(--panel-border)",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.3rem",
                          lineHeight: 1,
                          cursor: "pointer",
                          userSelect: "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                          fontFamily: "'HDesign', sans-serif",
                          fontWeight: 400,
                          fontStyle: "normal",
                          fontVariationSettings: `'wght' ${hdesignFontWeight}, 'ital' ${hdesignFontSlant}`
                        }}>
                          {c}
                        </span>
                        <div className="character-tooltip">
                          <div 
                            className="tooltip-large-char"
                            style={{
                              fontFamily: "'HDesign', sans-serif",
                              fontWeight: 400,
                              fontStyle: "normal",
                              lineHeight: 1,
                              fontVariationSettings: `'wght' ${hdesignFontWeight}, 'ital' ${hdesignFontSlant}`
                            }}
                          >
                            {c}
                          </div>
                          <div className="tooltip-name">
                            {getCharacterName(c)}
                          </div>
                          <div className="tooltip-code">
                            U+{c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Controls Sidebar (Առանձին Փեղկ) */}
            <div style={{
              flex: "1 1 350px",
              maxWidth: "420px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              position: "sticky",
              top: "100px"
            }}>
              {/* Variability Controls Card matching Icons section */}
              <div style={{
                backgroundColor: "var(--panel)",
                border: "1px solid var(--panel-border)",
                borderRadius: "24px",
                padding: "24px",
                boxShadow: "var(--shadow)",
                display: "flex",
                flexDirection: "column",
                gap: "20px"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--panel-border)", paddingBottom: "14px" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text)" }}>
                    {t('home', 'font_variability_panel', 'Տառատեսակի Փոփոխականություն')}
                  </span>
                  <button
                    onClick={() => { setHdesignFontWeight(400); setHdesignFontSlant(0); }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--muted)",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    {t('home', 'reset_btn', 'Վերականգնել')}
                  </button>
                </div>

                {/* Mode Switcher Segment using <hd-segment> */}
                <div style={{ width: "100%" }}>
                  <hd-segment
                    suppressHydrationWarning
                    value={hdesignControlMode}
                    onChange={(e: any) => setHdesignControlMode(e.target.value)}
                    data-height="36px"
                    data-thickness="2px"
                    data-width="100%"
                  >
                    <span value="sliders" {...(hdesignControlMode === "sliders" ? { selected: true } : {})}>
                      {t('home', 'mode_sliders', 'Սահիչներ')}
                    </span>
                    <span value="matrix" {...(hdesignControlMode === "matrix" ? { selected: true } : {})}>
                      {t('home', 'mode_matrix', '2D Տիրույթ (Masters)')}
                    </span>
                  </hd-segment>
                </div>

                {hdesignControlMode === "sliders" ? (
                  <>
                    {/* Weight Slider */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text)" }}>
                          {t('home', 'font_weight_label', 'Հաստություն (Font Weight)')}
                        </span>
                        <input
                          type="number"
                          min="100"
                          max="900"
                          step="10"
                          value={hdesignFontWeight}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && e.target.value !== "") {
                              setHdesignFontWeight(val);
                            }
                          }}
                          onBlur={(e) => {
                            let val = parseInt(e.target.value, 10);
                            if (isNaN(val)) val = 400;
                            val = Math.min(900, Math.max(100, val));
                            setHdesignFontWeight(val);
                          }}
                          style={{
                            width: "72px",
                            padding: "3px 8px",
                            fontSize: "0.85rem",
                            fontWeight: "700",
                            color: "var(--primary-color)",
                            background: "var(--input-bg)",
                            border: "1px solid var(--input-border)",
                            borderRadius: "6px",
                            textAlign: "center",
                            outline: "none",
                            boxSizing: "border-box"
                          }}
                        />
                      </div>
                      <hd-slider 
                        suppressHydrationWarning
                        min="100" 
                        max="900" 
                        step="10" 
                        value={hdesignFontWeight}
                        onInput={(e: any) => setHdesignFontWeight(Number(e.target.value))}
                        data-width="100%"
                      />
                    </div>

                    {/* Slant / Italic Slider */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text)" }}>
                          {t('home', 'font_slant_label', 'Թեքություն (Font Slant / Italic)')}
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={hdesignFontSlant}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && e.target.value !== "") {
                              setHdesignFontSlant(val);
                            }
                          }}
                          onBlur={(e) => {
                            let val = parseFloat(e.target.value);
                            if (isNaN(val)) val = 0;
                            val = Math.min(1, Math.max(0, val));
                            setHdesignFontSlant(Number(val.toFixed(2)));
                          }}
                          style={{
                            width: "72px",
                            padding: "3px 8px",
                            fontSize: "0.85rem",
                            fontWeight: "700",
                            color: "var(--primary-color)",
                            background: "var(--input-bg)",
                            border: "1px solid var(--input-border)",
                            borderRadius: "6px",
                            textAlign: "center",
                            outline: "none",
                            boxSizing: "border-box"
                          }}
                        />
                      </div>
                      <hd-slider 
                        suppressHydrationWarning
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={hdesignFontSlant}
                        onInput={(e: any) => setHdesignFontSlant(Number(e.target.value))}
                        data-width="100%"
                      />
                    </div>
                  </>
                ) : (
                  /* 2D Master Space Matrix Graph (Near-White Light Background Canvas) */
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div 
                      onMouseDown={(e) => {
                        setIsDraggingMatrix(false);
                        const rect = e.currentTarget.getBoundingClientRect();
                        const update = (me: MouseEvent, isMove: boolean = false) => {
                          if (isMove) setIsDraggingMatrix(true);
                          const px = Math.max(0, Math.min(1, (me.clientX - rect.left) / rect.width));
                          const py = Math.max(0, Math.min(1, (me.clientY - rect.top) / rect.height));
                          const normX = Math.max(0, Math.min(1, (px - 0.12) / 0.76));
                          const normY = Math.max(0, Math.min(1, (0.85 - py) / 0.70));
                          const w = Math.round(100 + normX * 800);
                          const s = Number(normY.toFixed(2));
                          setHdesignFontWeight(Math.min(900, Math.max(100, w)));
                          setHdesignFontSlant(Math.min(1, Math.max(0, s)));
                        };
                        update(e.nativeEvent, false);
                        const onMove = (me: MouseEvent) => update(me, true);
                        const onUp = () => {
                          setIsDraggingMatrix(false);
                          window.removeEventListener("mousemove", onMove);
                          window.removeEventListener("mouseup", onUp);
                        };
                        window.addEventListener("mousemove", onMove);
                        window.addEventListener("mouseup", onUp);
                      }}
                      onTouchStart={(e) => {
                        setIsDraggingMatrix(false);
                        const rect = e.currentTarget.getBoundingClientRect();
                        const touch = e.touches[0];
                        const px = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                        const py = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));
                        const normX = Math.max(0, Math.min(1, (px - 0.12) / 0.76));
                        const normY = Math.max(0, Math.min(1, (0.85 - py) / 0.70));
                        const w = Math.round(100 + normX * 800);
                        const s = Number(normY.toFixed(2));
                        setHdesignFontWeight(Math.min(900, Math.max(100, w)));
                        setHdesignFontSlant(Math.min(1, Math.max(0, s)));
                      }}
                      onTouchMove={(e) => {
                        setIsDraggingMatrix(true);
                        const rect = e.currentTarget.getBoundingClientRect();
                        const touch = e.touches[0];
                        const px = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                        const py = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));
                        const normX = Math.max(0, Math.min(1, (px - 0.12) / 0.76));
                        const normY = Math.max(0, Math.min(1, (0.85 - py) / 0.70));
                        const w = Math.round(100 + normX * 800);
                        const s = Number(normY.toFixed(2));
                        setHdesignFontWeight(Math.min(900, Math.max(100, w)));
                        setHdesignFontSlant(Math.min(1, Math.max(0, s)));
                      }}
                      onTouchEnd={() => setIsDraggingMatrix(false)}
                      style={{
                        position: "relative",
                        height: "260px",
                        width: "100%",
                        borderRadius: "16px",
                        background: "#fafafa",
                        border: "1px solid rgba(0, 0, 0, 0.12)",
                        boxShadow: "inset 0 2px 6px rgba(0, 0, 0, 0.04)",
                        userSelect: "none",
                        cursor: "crosshair",
                        overflow: "hidden"
                      }}
                    >
                      {/* Dashed Grid Lines & Diagonal Arrow Line */}
                      {showMatrixGrid && (
                        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                          <line x1="12%" y1="15%" x2="12%" y2="85%" stroke="rgba(0, 0, 0, 0.18)" strokeDasharray="3 3" />
                          <line x1="88%" y1="15%" x2="88%" y2="85%" stroke="rgba(0, 0, 0, 0.18)" strokeDasharray="3 3" />
                          <line x1="12%" y1="15%" x2="88%" y2="15%" stroke="rgba(0, 0, 0, 0.18)" strokeDasharray="3 3" />
                          <line x1="12%" y1="85%" x2="88%" y2="85%" stroke="rgba(0, 0, 0, 0.18)" strokeDasharray="3 3" />
                          <line x1="12%" y1="85%" x2="88%" y2="15%" stroke="#083f39" strokeDasharray="4 4" opacity="0.4" />
                        </svg>
                      )}

                      {/* Background Watermark Glyph */}
                      {showMatrixWatermark && (
                        <div style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "7.5rem",
                          lineHeight: 1,
                          color: "#000",
                          opacity: 0.07,
                          fontFamily: "'HDesign', sans-serif",
                          fontWeight: 400,
                          fontStyle: "normal",
                          fontVariationSettings: `'wght' ${hdesignFontWeight}, 'ital' ${hdesignFontSlant}`,
                          pointerEvents: "none"
                        }}>
                          {matrixWatermarkChar}
                        </div>
                      )}

                      {/* Axis Labels */}
                      <div style={{ position: "absolute", bottom: "4px", left: "50%", transform: "translateX(-50%)", fontSize: "0.7rem", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "1px", pointerEvents: "none" }}>
                        Weight
                      </div>
                      <div style={{ position: "absolute", left: "6px", top: "50%", transform: "translateY(-50%) rotate(-90deg)", fontSize: "0.7rem", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "1px", pointerEvents: "none" }}>
                        Italic
                      </div>

                      {/* 4 Master Corner Nodes (wt100,it0 / wt900,it0 / wt100,it1 / wt900,it1) */}
                      {/* Bottom Left: wt100,it0 */}
                      <div 
                        onClick={(e) => { e.stopPropagation(); setIsDraggingMatrix(false); setHdesignFontWeight(100); setHdesignFontSlant(0); }}
                        style={{ position: "absolute", left: "12%", top: "85%", transform: "translate(-50%, -50%)", cursor: "pointer", textAlign: "center", zIndex: 10 }}
                        title="Master: Thin (wt100, it0)"
                      >
                        <span style={{ color: "#d97706", fontSize: "0.85rem" }}>◆</span>
                        <div style={{ fontSize: "0.62rem", color: "#475569", fontFamily: "monospace", marginTop: "-2px", fontWeight: "600" }}>wt100,it0</div>
                        <div style={{ fontSize: "0.8rem", fontFamily: "'HDesign', sans-serif", fontWeight: 100, color: "#0f172a" }}>A</div>
                      </div>

                      {/* Bottom Right: wt900,it0 */}
                      <div 
                        onClick={(e) => { e.stopPropagation(); setIsDraggingMatrix(false); setHdesignFontWeight(900); setHdesignFontSlant(0); }}
                        style={{ position: "absolute", left: "88%", top: "85%", transform: "translate(-50%, -50%)", cursor: "pointer", textAlign: "center", zIndex: 10 }}
                        title="Master: Black (wt900, it0)"
                      >
                        <span style={{ color: "#d97706", fontSize: "0.85rem" }}>◆</span>
                        <div style={{ fontSize: "0.62rem", color: "#475569", fontFamily: "monospace", marginTop: "-2px", fontWeight: "600" }}>wt900,it0</div>
                        <div style={{ fontSize: "0.8rem", fontFamily: "'HDesign', sans-serif", fontWeight: 900, color: "#0f172a" }}>A</div>
                      </div>

                      {/* Top Left: wt100,it1 */}
                      <div 
                        onClick={(e) => { e.stopPropagation(); setIsDraggingMatrix(false); setHdesignFontWeight(100); setHdesignFontSlant(1); }}
                        style={{ position: "absolute", left: "12%", top: "15%", transform: "translate(-50%, -50%)", cursor: "pointer", textAlign: "center", zIndex: 10 }}
                        title="Master: ThinItalic (wt100, it1)"
                      >
                        <div style={{ fontSize: "0.8rem", fontFamily: "'HDesign', sans-serif", fontWeight: 100, fontStyle: "normal", fontVariationSettings: "'wght' 100, 'ital' 1", color: "#0f172a" }}>A</div>
                        <span style={{ color: "#d97706", fontSize: "0.85rem" }}>◆</span>
                        <div style={{ fontSize: "0.62rem", color: "#475569", fontFamily: "monospace", marginTop: "-2px", fontWeight: "600" }}>wt100,it1</div>
                      </div>

                      {/* Top Right: wt900,it1 */}
                      <div 
                        onClick={(e) => { e.stopPropagation(); setIsDraggingMatrix(false); setHdesignFontWeight(900); setHdesignFontSlant(1); }}
                        style={{ position: "absolute", left: "88%", top: "15%", transform: "translate(-50%, -50%)", cursor: "pointer", textAlign: "center", zIndex: 10 }}
                        title="Master: BlackItalic (wt900, it1)"
                      >
                        <div style={{ fontSize: "0.8rem", fontFamily: "'HDesign', sans-serif", fontWeight: 900, fontStyle: "normal", fontVariationSettings: "'wght' 900, 'ital' 1", color: "#0f172a" }}>A</div>
                        <span style={{ color: "#d97706", fontSize: "0.85rem" }}>◆</span>
                        <div style={{ fontSize: "0.62rem", color: "#475569", fontFamily: "monospace", marginTop: "-2px", fontWeight: "600" }}>wt900,it1</div>
                      </div>

                      {/* Draggable Active Handle Target (Crosshair Plus Icon) */}
                      <div style={{
                        position: "absolute",
                        left: `${12 + ((hdesignFontWeight - 100) / 800) * 76}%`,
                        top: `${85 - hdesignFontSlant * 70}%`,
                        transform: "translate(-50%, -50%)",
                        transition: isDraggingMatrix ? "none" : "left 0.35s cubic-bezier(0.16, 1, 0.3, 1), top 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                        pointerEvents: "none",
                        zIndex: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <div style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          border: "2px solid #083f39",
                          background: "rgba(8, 63, 57, 0.85)",
                          boxShadow: "0 2px 8px rgba(8, 63, 57, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "15px",
                          fontWeight: "bold"
                        }}>
                          +
                        </div>
                      </div>
                    </div>

                    {/* Live Coordinates Readout */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", fontWeight: "600", color: "var(--muted)", background: "rgba(255, 255, 255, 0.02)", padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--panel-border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>wght:</span>
                        <input
                          type="number"
                          min="100"
                          max="900"
                          step="10"
                          value={hdesignFontWeight}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && e.target.value !== "") setHdesignFontWeight(val);
                          }}
                          onBlur={(e) => {
                            let val = parseInt(e.target.value, 10);
                            if (isNaN(val)) val = 400;
                            setHdesignFontWeight(Math.min(900, Math.max(100, val)));
                          }}
                          style={{
                            width: "60px",
                            padding: "2px 4px",
                            fontSize: "0.78rem",
                            fontWeight: "700",
                            color: "var(--primary-color)",
                            background: "var(--input-bg)",
                            border: "1px solid var(--input-border)",
                            borderRadius: "4px",
                            textAlign: "center",
                            outline: "none"
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>ital / slnt:</span>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={hdesignFontSlant}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && e.target.value !== "") setHdesignFontSlant(val);
                          }}
                          onBlur={(e) => {
                            let val = parseFloat(e.target.value);
                            if (isNaN(val)) val = 0;
                            setHdesignFontSlant(Number(Math.min(1, Math.max(0, val)).toFixed(2)));
                          }}
                          style={{
                            width: "60px",
                            padding: "2px 4px",
                            fontSize: "0.78rem",
                            fontWeight: "700",
                            color: "var(--primary-color)",
                            background: "var(--input-bg)",
                            border: "1px solid var(--input-border)",
                            borderRadius: "4px",
                            textAlign: "center",
                            outline: "none"
                          }}
                        />
                      </div>
                    </div>

                    {/* Options Toggles using <hd-checkbox> */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "8px", borderTop: "1px dashed var(--panel-border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => setShowMatrixGrid(!showMatrixGrid)}>
                        <hd-checkbox 
                          suppressHydrationWarning 
                          checked={showMatrixGrid} 
                          onChange={(e: any) => setShowMatrixGrid(e.target.checked)} 
                        />
                        <span style={{ fontSize: "0.8rem", color: "var(--text)", fontWeight: "600" }}>
                          {t('home', 'show_grid_lines', 'Ցուցադրել ցանցի կետագծերը')}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => setShowMatrixWatermark(!showMatrixWatermark)}>
                        <hd-checkbox 
                          suppressHydrationWarning 
                          checked={showMatrixWatermark} 
                          onChange={(e: any) => setShowMatrixWatermark(e.target.checked)} 
                        />
                        <span style={{ fontSize: "0.8rem", color: "var(--text)", fontWeight: "600" }}>
                          {t('home', 'show_watermark', 'Ցուցադրել ֆոնային տառը (Watermark)')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Presets */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "14px", borderTop: "1px dashed var(--panel-border)" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {t('home', 'font_presets', 'Արագ Ոճեր (Presets)')}
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <button
                      onClick={() => { setHdesignFontWeight(400); setHdesignFontSlant(0); }}
                      style={{
                        background: hdesignFontWeight === 400 && hdesignFontSlant === 0 ? "var(--primary-color)" : "var(--input-bg)",
                        color: hdesignFontWeight === 400 && hdesignFontSlant === 0 ? "#fff" : "var(--text)",
                        border: "1px solid var(--panel-border)",
                        borderRadius: "12px",
                        padding: "8px 12px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      Regular
                    </button>
                    <button
                      onClick={() => { setHdesignFontWeight(100); setHdesignFontSlant(1); }}
                      style={{
                        background: hdesignFontWeight === 100 && hdesignFontSlant === 1 ? "var(--primary-color)" : "var(--input-bg)",
                        color: hdesignFontWeight === 100 && hdesignFontSlant === 1 ? "#fff" : "var(--text)",
                        border: "1px solid var(--panel-border)",
                        borderRadius: "12px",
                        padding: "8px 12px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      ThinItalic
                    </button>
                    <button
                      onClick={() => { setHdesignFontWeight(900); setHdesignFontSlant(0); }}
                      style={{
                        background: hdesignFontWeight === 900 && hdesignFontSlant === 0 ? "var(--primary-color)" : "var(--input-bg)",
                        color: hdesignFontWeight === 900 && hdesignFontSlant === 0 ? "#fff" : "var(--text)",
                        border: "1px solid var(--panel-border)",
                        borderRadius: "12px",
                        padding: "8px 12px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      Black
                    </button>
                    <button
                      onClick={() => { setHdesignFontWeight(900); setHdesignFontSlant(1); }}
                      style={{
                        background: hdesignFontWeight === 900 && hdesignFontSlant === 1 ? "var(--primary-color)" : "var(--input-bg)",
                        color: hdesignFontWeight === 900 && hdesignFontSlant === 1 ? "#fff" : "var(--text)",
                        border: "1px solid var(--panel-border)",
                        borderRadius: "12px",
                        padding: "8px 12px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      BlackItalic
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <style>{`
            .character-cell {
              position: relative;
            }
            .character-cell:hover {
              background: rgba(8, 63, 57, 0.1) !important;
              border-color: var(--primary-color) !important;
              transform: scale(1.3) !important;
              box-shadow: 0 8px 24px rgba(8, 63, 57, 0.25);
              z-index: 50;
            }
            
            .character-tooltip {
              position: absolute;
              bottom: 130%;
              left: 50%;
              transform: translateX(-50%) scale(0.7);
              transform-origin: bottom center;
              background: #083f39;
              color: #ffffff;
              border: 1px solid rgba(255, 255, 255, 0.15);
              border-radius: 12px;
              padding: 12px;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 4px;
              min-width: 140px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.3);
              opacity: 0;
              visibility: hidden;
              pointer-events: none;
              transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
              z-index: 100;
            }
            
            .character-cell:hover .character-tooltip {
              opacity: 1;
              visibility: visible;
              transform: translateX(-50%) scale(1);
            }

            .tooltip-large-char {
              font-size: 2.8rem;
              line-height: 1.1;
              color: #ffffff;
              margin-bottom: 2px;
            }

            .tooltip-name {
              font-size: 0.68rem;
              font-weight: 500;
              color: #89b59a;
              text-align: center;
              word-break: break-word;
              max-width: 130px;
              line-height: 1.3;
              font-family: 'HDesign', sans-serif !important;
            }

            .tooltip-code {
              font-size: 0.65rem;
              font-family: monospace !important;
              color: rgba(255, 255, 255, 0.6);
              background: rgba(0, 0, 0, 0.2);
              padding: 2px 6px;
              border-radius: 4px;
              margin-top: 2px;
            }
          `}</style>
        </hd-reveal>
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
                      {parseLangText(selectedCase.category || selectedCase.subtitle || "", locale) || (locale === "en" ? "Case Study" : "Քեյս")}
                    </span>
                    <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "#fff", margin: "6px 0 0" }}>
                      {parseLangText(selectedCase.title, locale)}
                    </h2>
                  </div>

                  <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "20px" }}>
                    {selectedCase.client && (
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase" }}>{locale === "en" ? "Client" : "Հաճախորդ"}</div>
                        <div style={{ fontSize: "0.95rem", color: "#fff", fontWeight: 500 }}>{parseLangText(selectedCase.client, locale)}</div>
                      </div>
                    )}
                    {selectedCase.year && (
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase" }}>{locale === "en" ? "Year" : "Տարեթիվ"}</div>
                        <div style={{ fontSize: "0.95rem", color: "#fff", fontWeight: 500 }}>{selectedCase.year}</div>
                      </div>
                    )}
                  </div>

                  <div style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "0.95rem", lineHeight: "1.7" }}>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                      {parseLangText(selectedCase.details || "", locale) || (locale === "en" ? "No details available." : "Այս նախագծի համար մանրամասն նկարագրություն դեռևս ավելացված չէ:")}
                    </p>
                  </div>

                  <div style={{ marginTop: "auto", paddingTop: "12px", display: "flex", gap: "12px" }}>
                    <Link href={`/works/${selectedCase.id.includes('local-b-') ? ['pasta', 'eleven', 'posters', 'teal-lines', 'mobile-ui'][parseInt(selectedCase.id.replace('local-b-', '')) - 1] || selectedCase.id : selectedCase.id}`} style={{ textDecoration: "none" }}>
                      <hd-button suppressHydrationWarning data-height="40px" data-thickness="3px" style={{ background: "var(--accent)", color: "#000", fontWeight: "bold" }}>
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
                  {parseLangText(galleryCases[selectedGalleryIndex]?.title || "", locale)}
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
                  <span className={isSlideshowPlaying ? "hd-icon hd-icon-pause" : "hd-icon hd-icon-play"} style={{ fontSize: "0.85rem", display: "inline-block" }} />
                  <span>{isSlideshowPlaying ? (locale === "en" ? "Pause" : "Դադար") : (locale === "en" ? "Autoplay" : "Ինքնաշխատ")}</span>
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
                <span className="hd-icon hd-icon-chevrolt-arrow-left" />
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
                <span className="hd-icon hd-icon-chevrolt-arrow-right" />
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
                {parseLangText(galleryCases[selectedGalleryIndex]?.details || "", locale) || (locale === "en" ? "No details available." : "Այս նախագծի համար մանրամասն նկարագրություն դեռևս ավելացված չէ:")}
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
