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
  "icon-HD-Logo", "icon-HD-Logo-Horizontal", "icon-Hamburger-Menu", "icon-Send",
  "icon-Three-Dots-Vertical", "icon-Three-Dots-Horizontal"
];

const iconCategories = [
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
      "icon-Image", "icon-Camera", "icon-Play", "icon-Stop", "icon-Pause"
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
      "icon-Pointer-Cursor", "icon-Earth", "icon-HD-Logo", "icon-HD-Logo-Horizontal",
      "icon-Hamburger-Menu", "icon-Three-Dots-Vertical", "icon-Three-Dots-Horizontal"
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
  
  const lowercaseIconName = selectedIconDetail ? selectedIconDetail.replace("icon-", "").toLowerCase() : "";
  const htmlSnippet = `<i class="hd-icon hd-icon-${lowercaseIconName}"></i>`;
  const reactSnippet = `<i className="hd-icon hd-icon-${lowercaseIconName}" />`;
  const cssSnippet = `.hd-icon-${lowercaseIconName}`;

  const [iconWeight, setIconWeight] = useState<number>(400);
  const [hdesignFontWeight, setHdesignFontWeight] = useState<number>(400);
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
          <hd-button key={playgroundComponentKey} {...commonProps} disabled={playgroundIsDisabled} onClick={() => alert("Սեղմված է")}>
            {playgroundBtnText}
          </hd-button>
        );
      case "hd-input":
        return (
          <hd-input
            key={playgroundComponentKey}
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
            data-thickness="4px"
            onChange={(e: any) => setPlaygroundSwitchState(e.target.checked)}
          />
        );
      case "hd-select":
        return (
          <hd-select
            key={playgroundComponentKey}
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

  const categoriesWithFilteredIcons = iconCategories.map(cat => {
    const filtered = cat.icons.filter(icon => 
      icon.toLowerCase().includes(iconSearch.toLowerCase())
    );
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
          <hd-reveal data-direction="up" data-delay="250" data-duration="1000" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
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
          <hd-reveal data-direction="left" data-duration="900">
            <h2 style={{ fontSize: "32pt", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "-20px", paddingLeft: "20px", color: "var(--text)" }}>
              {locale === "en" ? "Branding" : "Բրենդինգ"}
            </h2>
          </hd-reveal>
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

          <div className="landing-about-grid" style={{ maxWidth: "1500px", margin: "0 auto", padding: "80px 0 40px", display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "48px", alignItems: "center", position: "relative", zIndex: 5 }}>
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
                {t('home', 'about_title', 'Մասին')}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", color: "#ffffff", opacity: 0.9, fontSize: "1.05rem", lineHeight: "1.7" }}>
                <p>
                  {t('home', 'about_p1', 'Ողջույն, ես Հրանտ Հակոբյանն եմ և Ճարտարապետության և շինարարության Հայաստանի Ազգային Համալսարանի ճարտարապետության ֆակուլտետի 4-րդ կուրսի ուսանող եմ։')}
                </p>
                <p style={{ fontWeight: 700 }}>
                  {t('home', 'about_p2', 'Ես մասնագիտանում եմ տառաստեղծության և բրենդինգի մեջ։')}
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
                  {t('home', 'contact_btn', 'Կապնվել')}
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
            {t('home', 'other_works', 'Այլ աշխատանքներ')}
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
                {t('home', 'more_btn', 'Ավելի')}
              </hd-button>
            </Link>
          </div>
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
          `}</style>
          
          <h2 style={{
            fontSize: "2.2rem",
            fontWeight: "900",
            textAlign: "center",
            color: "var(--text)",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px"
          }}>
            {t('home', 'design_system', 'Դիզայնի Համակարգը')}
            <svg 
              viewBox="0 0 3976 1364" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ height: "32px", width: "auto", flexShrink: 0 }}
            >
              <rect x="37.5" y="37.5" width="3901" height="1289" rx="336.5" stroke="currentColor" strokeWidth="75"/>
              <path d="M798.759 957.395C798.759 969.896 793.979 980.926 784.42 990.485C775.596 999.309 764.934 1003.72 752.433 1003.72C739.932 1003.72 728.902 999.309 719.343 990.485C710.519 980.926 706.107 969.896 706.107 957.395H798.759ZM798.759 773.194H1184.81C1198.05 773.194 1209.08 777.238 1217.9 785.327C1226.72 793.416 1231.14 803.71 1231.14 816.211C1231.14 828.712 1226.72 839.374 1217.9 848.198C1209.08 856.287 1198.05 860.331 1184.81 860.331H798.759V957.395H706.107V606.641C706.107 563.256 711.99 524.651 723.755 490.826C736.256 456.265 753.536 427.22 775.596 403.689C797.656 380.158 824.128 362.143 855.012 349.642C885.896 336.406 920.089 329.788 957.591 329.788C1042.89 329.788 1107.97 354.422 1152.82 403.689C1197.68 452.221 1220.11 519.872 1220.11 606.641V633.113H1127.45V618.774C1127.45 554.065 1114.95 504.43 1089.95 469.869C1065.69 434.573 1024.87 416.925 967.518 416.925C910.162 416.925 867.513 434.573 839.57 469.869C812.363 504.43 798.759 554.065 798.759 618.774V773.194ZM1220.11 633.113C1220.11 645.614 1215.33 656.644 1205.77 666.203C1196.94 675.027 1186.28 679.439 1173.78 679.439C1161.28 679.439 1150.25 675.027 1140.69 666.203C1131.87 656.644 1127.45 645.614 1127.45 633.113H1220.11ZM1358.5 372.805C1358.5 360.304 1362.91 349.642 1371.73 340.818C1381.29 331.259 1392.32 326.479 1404.82 326.479C1417.32 326.479 1427.99 331.259 1436.81 340.818C1446.37 349.642 1451.15 360.304 1451.15 372.805V505.165H1830.58C1843.82 505.165 1854.85 509.577 1863.67 518.401C1872.5 526.49 1876.91 536.784 1876.91 549.285C1876.91 561.786 1872.5 572.08 1863.67 580.169C1854.85 588.258 1843.82 592.302 1830.58 592.302H1451.15V711.426C1451.15 776.135 1464.75 826.138 1491.96 861.434C1519.9 895.995 1562.55 913.275 1619.91 913.275C1677.26 913.275 1718.08 895.995 1742.34 861.434C1767.34 826.138 1779.84 776.135 1779.84 711.426V697.087C1779.84 684.586 1784.26 673.924 1793.08 665.1C1802.64 655.541 1813.67 650.761 1826.17 650.761C1838.67 650.761 1849.33 655.541 1858.16 665.1C1867.72 673.924 1872.5 684.586 1872.5 697.087V723.559C1872.5 810.328 1850.07 878.347 1805.21 927.614C1760.36 976.146 1695.28 1000.41 1609.98 1000.41C1572.48 1000.41 1538.29 994.162 1507.4 981.661C1476.52 968.425 1450.05 950.042 1427.99 926.511C1405.93 902.98 1388.65 873.935 1376.15 839.374C1364.38 804.813 1358.5 766.208 1358.5 723.559V372.805ZM2002.79 810.696C2002.79 798.195 2007.2 787.533 2016.02 778.709C2025.58 769.15 2036.98 764.37 2050.22 764.37C2062.72 764.37 2073.38 769.15 2082.2 778.709C2091.76 787.533 2096.54 798.195 2096.54 810.696H2097.64C2097.64 842.315 2110.88 869.155 2137.35 891.215C2163.82 912.54 2198.39 923.202 2241.03 923.202C2268.24 923.202 2291.04 919.525 2309.42 912.172C2328.54 904.819 2343.98 895.627 2355.75 884.597C2368.25 873.567 2377.07 861.434 2382.22 848.198C2388.1 834.962 2391.04 822.461 2391.04 810.696C2391.04 791.577 2386.63 775.4 2377.81 762.164C2368.98 748.928 2356.85 737.898 2341.41 729.074C2326.7 720.25 2309.42 712.897 2289.57 707.014C2270.45 700.396 2249.86 694.146 2227.8 688.263C2203.53 681.645 2179.63 674.659 2156.1 667.306C2132.57 659.953 2111.25 649.658 2092.13 636.422C2073.75 623.186 2058.67 606.641 2046.91 586.787C2035.88 566.198 2030.36 540.093 2030.36 508.474C2030.36 482.002 2035.51 457.736 2045.8 435.676C2056.83 412.881 2071.91 393.762 2091.03 378.32C2110.15 362.143 2132.57 349.642 2158.31 340.818C2184.05 331.994 2211.62 327.582 2241.03 327.582C2275.6 327.582 2306.11 332.729 2332.58 343.024C2359.79 352.583 2382.59 365.819 2400.97 382.732C2420.09 398.909 2434.43 417.66 2443.99 438.985C2454.28 460.31 2459.43 482.002 2459.43 504.062H2460.53C2460.53 516.563 2455.75 527.593 2446.19 537.152C2437.37 545.976 2426.71 550.388 2414.21 550.388C2400.97 550.388 2389.57 545.976 2380.01 537.152C2371.19 527.593 2366.78 516.563 2366.78 504.062H2367.88C2367.88 490.091 2364.2 477.222 2356.85 465.457C2350.23 453.692 2341.04 443.765 2329.27 435.676C2318.24 426.852 2305.01 420.234 2289.57 415.822C2274.12 410.675 2257.95 408.101 2241.03 408.101C2221.92 408.101 2204.64 411.042 2189.19 416.925C2174.49 422.808 2161.62 430.529 2150.59 440.088C2140.29 448.912 2132.21 459.207 2126.32 470.972C2120.44 482.737 2117.5 494.503 2117.5 506.268C2117.5 523.181 2121.18 537.152 2128.53 548.182C2136.62 559.212 2147.28 568.771 2160.52 576.86C2173.75 584.213 2189.19 590.831 2206.84 596.714C2224.49 601.861 2243.24 607.376 2263.09 613.259C2288.83 620.612 2314.57 628.333 2340.3 636.422C2366.04 643.775 2389.2 654.438 2409.79 668.409C2430.38 682.38 2446.93 700.396 2459.43 722.456C2472.66 743.781 2479.28 771.723 2479.28 806.284C2479.28 834.962 2473.4 861.802 2461.63 886.803C2450.6 911.069 2434.8 932.026 2414.21 949.674C2393.62 967.322 2368.62 981.293 2339.2 991.588C2309.79 1001.15 2277.07 1005.93 2241.03 1005.93C2202.8 1005.93 2168.6 1000.78 2138.46 990.485C2109.04 980.19 2084.04 966.219 2063.45 948.571C2043.6 930.188 2028.52 909.231 2018.23 885.7C2007.93 862.169 2002.79 837.168 2002.79 810.696ZM3041.52 383.835C3041.52 371.334 3045.93 360.672 3054.76 351.848C3064.32 342.289 3075.35 337.509 3087.85 337.509C3100.35 337.509 3111.01 342.289 3119.83 351.848C3129.39 360.672 3134.17 371.334 3134.17 383.835V726.868C3134.17 760.693 3131.6 791.945 3126.45 820.623C3121.3 848.566 3112.11 872.464 3098.88 892.318L3215.79 971.734C3226.09 977.617 3232.34 986.073 3234.54 997.103C3237.49 1008.13 3236.02 1018.8 3230.13 1029.09C3222.04 1043.06 3209.91 1050.05 3193.73 1050.05C3186.38 1050.05 3179.39 1047.84 3172.78 1043.43L3039.31 948.571C3021.67 966.219 2997.4 979.823 2966.52 989.382C2936.37 998.941 2904.75 1003.72 2871.66 1003.72C2834.16 1003.72 2799.96 997.838 2769.08 986.073C2738.19 974.308 2711.72 957.027 2689.66 934.232C2667.6 910.701 2650.32 882.391 2637.82 849.301C2626.06 815.476 2620.17 777.238 2620.17 734.589V383.835C2620.17 371.334 2624.59 360.672 2633.41 351.848C2642.97 342.289 2654 337.509 2666.5 337.509C2679 337.509 2689.66 342.289 2698.49 351.848C2708.05 360.672 2712.83 383.835V722.456C2712.83 787.165 2726.43 837.168 2753.64 872.464C2781.58 907.025 2824.23 924.305 2881.58 924.305C2937.47 924.305 2980.12 907.025 3009.53 872.464C3038.95 837.168 3049.61 789.004 3041.52 727.971V383.835Z" fill="currentColor"/>
            </svg>
          </h2>
          <h3 style={{
            fontSize: "1.2rem",
            fontWeight: "600",
            color: "var(--muted)",
            textAlign: "center",
            marginTop: "-30px",
            marginBottom: "40px"
          }}>
            {t('home', 'components_title', 'Բաղադրիչներ')}
          </h3>
          
          <div className="homepage-playground-container">
            {/* Sidebar List of 12 components */}
            <div className="playground-sidebar-column">
              <span style={{ fontSize: "0.75rem", fontWeight: "800", opacity: 0.5, letterSpacing: "1px", padding: "6px 8px 12px 8px" }}>
                {t('home', 'components_label', 'ԿՈՄՊՈՆԵՆՏՆԵՐ')}
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
                    <span className="icon-Attech" style={{ fontSize: "0.85rem" }} />
                    <span>{playgroundCopied ? "ՊԱՏՃԵՆՎԱԾ Է!" : "ՊԱՏՃԵՆԵԼ"}</span>
                  </button>
                </div>
                <hd-scrollbar style={{ flex: 1, overflow: "auto", overscrollBehavior: "contain", background: "#121817" }}>
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
                          <span style={{ fontSize: "0.8rem" }}>{t('home', 'disabled_label', 'Պասիվ')}</span>
                        </label>
                      </>
                    )}

                    {playgroundActiveTab === "hd-checkbox" && (
                      <>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox checked={playgroundCheckedState} onChange={(e: any) => setPlaygroundCheckedState(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>{t('home', 'checked_state', 'Ընտրված (Checked)')}</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox checked={playgroundIsDisabled} onChange={(e: any) => setPlaygroundIsDisabled(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>{t('home', 'disabled_label', 'Պասիվ')}</span>
                        </label>
                      </>
                    )}

                    {playgroundActiveTab === "hd-radio" && (
                      <>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox checked={playgroundRadioState} onChange={(e: any) => setPlaygroundRadioState(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>{t('home', 'checked_state', 'Ընտրված (Checked)')}</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox checked={playgroundIsDisabled} onChange={(e: any) => setPlaygroundIsDisabled(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>{t('home', 'disabled_label', 'Պասիվ')}</span>
                        </label>
                      </>
                    )}

                    {playgroundActiveTab === "hd-switch" && (
                      <>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox checked={playgroundSwitchState} onChange={(e: any) => setPlaygroundSwitchState(e.target.checked)} />
                          <span style={{ fontSize: "0.8rem" }}>{t('home', 'active_label', 'Միացված (Active)')}</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <hd-checkbox checked={playgroundIsDisabled} onChange={(e: any) => setPlaygroundIsDisabled(e.target.checked)} />
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
        <section>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px", textAlign: "center", color: "var(--text)" }}>
            {t('home', 'icons_title', 'Պատկերներ')}
          </h2>
          {/* Two-column layout: Left (Grid) & Right (Details) */}
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
                boxShadow: "var(--shadow)"
              }}>
                <hd-input 
                  placeholder={t('home', 'search_icon', 'Որոնել պատկերակ...')} 
                  value={iconSearch}
                  onInput={(e: any) => setIconSearch(e.target.value)}
                  data-width="100%"
                  data-height="46px"
                  data-thickness="3px"
                data-font-size="14pt" />
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
                    onClick={() => downloadSvg(selectedIconDetail)}
                    data-width="50%"
                    data-height="40px"
                    data-thickness="3px"
                    data-color="transparent"
                    data-text-color="var(--text)"
                    title={t('home', 'download_svg', 'Ներբեռնել SVG')}
                    style={{ flex: 1, opacity: getSvgString(selectedIconDetail) ? 1 : 0.5, pointerEvents: getSvgString(selectedIconDetail) ? "auto" : "none" }}
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
                    title={t('home', 'download_png', 'Ներբեռնել PNG')}
                    style={{ flex: 1, opacity: getSvgString(selectedIconDetail) ? 1 : 0.5, pointerEvents: getSvgString(selectedIconDetail) ? "auto" : "none" }}
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
                        onClick={() => handleCopySnippet(htmlSnippet, "html")}
                        style={{ background: "transparent", border: "none", color: copiedSnippet === "html" ? "var(--primary-color)" : "var(--muted)", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                      >
                        <span className={copiedSnippet === "html" ? "icon-Check" : "icon-Pattern"} style={{ fontSize: "0.8rem" }} />
                        {copiedSnippet === "html" ? t('home', 'copied', 'Պատճենված է') : t('home', 'copy', 'Պատճենել')}
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
                      {htmlSnippet}
                    </div>
                  </div>

                  {/* React / JSX Usage */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase" }}>React / JSX</span>
                      <span 
                        onClick={() => handleCopySnippet(reactSnippet, "react")}
                        style={{ background: "transparent", border: "none", color: copiedSnippet === "react" ? "var(--primary-color)" : "var(--muted)", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                      >
                        <span className={copiedSnippet === "react" ? "icon-Check" : "icon-Pattern"} style={{ fontSize: "0.8rem" }} />
                        {copiedSnippet === "react" ? t('home', 'copied', 'Պատճենված է') : t('home', 'copy', 'Պատճենել')}
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
                      {reactSnippet}
                    </div>
                  </div>

                  {/* CSS Class */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase" }}>CSS Class</span>
                      <span 
                        onClick={() => handleCopySnippet(cssSnippet, "css")}
                        style={{ background: "transparent", border: "none", color: copiedSnippet === "css" ? "var(--primary-color)" : "var(--muted)", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                      >
                        <span className={copiedSnippet === "css" ? "icon-Check" : "icon-Pattern"} style={{ fontSize: "0.8rem" }} />
                        {copiedSnippet === "css" ? t('home', 'copied', 'Պատճենված է') : t('home', 'copy', 'Պատճենել')}
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
                      {cssSnippet}
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

        {/* HDesign Font Glyphs Map & Variability Slider */}
        <h2 style={{ fontSize: "1.4rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginTop: "60px", marginBottom: "20px", textAlign: "center", color: "var(--text)" }}>
          {t('home', 'font_title', 'Տառատեսակ')}
        </h2>
        <div style={{
          background: "var(--panel)",
          border: "1px solid var(--panel-border)",
          borderRadius: "24px",
          padding: "32px",
          boxShadow: "var(--shadow)",
          display: "flex",
          flexDirection: "column",
          gap: "28px"
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
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

            {/* Variability Slider Card */}
            <div style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--panel-border)",
              borderRadius: "16px",
              padding: "16px 20px",
              minWidth: "280px",
              flex: "0 1 360px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--muted)" }}>
                  {t('home', 'font_weight_label', 'Հաստություն (Font Weight)')}
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--primary-color)" }}>
                  {hdesignFontWeight}
                </span>
              </div>
              <hd-slider 
                min="100" 
                max="900" 
                step="10" 
                value={hdesignFontWeight}
                onInput={(e: any) => setHdesignFontWeight(Number(e.target.value))}
                data-width="100%"
              />
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
                      setTimeout(() => setCopiedChar(null), 1500);
                    }}
                    className="character-cell"
                    style={{
                      fontFamily: "'HDesign', sans-serif",
                      fontWeight: hdesignFontWeight,
                      fontVariationSettings: `'wght' ${hdesignFontWeight}`,
                      height: "40px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid var(--panel-border)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.3rem",
                      cursor: "pointer",
                      userSelect: "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {c}
                    <div className="character-tooltip">
                      <div 
                        className="tooltip-large-char"
                        style={{
                          fontFamily: "'HDesign', sans-serif",
                          fontWeight: hdesignFontWeight,
                          fontVariationSettings: `'wght' ${hdesignFontWeight}`
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
                      setTimeout(() => setCopiedChar(null), 1500);
                    }}
                    className="character-cell"
                    style={{
                      fontFamily: "'HDesign', sans-serif",
                      fontWeight: hdesignFontWeight,
                      fontVariationSettings: `'wght' ${hdesignFontWeight}`,
                      height: "40px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid var(--panel-border)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.3rem",
                      cursor: "pointer",
                      userSelect: "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {c}
                    <div className="character-tooltip">
                      <div 
                        className="tooltip-large-char"
                        style={{
                          fontFamily: "'HDesign', sans-serif",
                          fontWeight: hdesignFontWeight,
                          fontVariationSettings: `'wght' ${hdesignFontWeight}`
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
                      setTimeout(() => setCopiedChar(null), 1500);
                    }}
                    className="character-cell"
                    style={{
                      fontFamily: "'HDesign', sans-serif",
                      fontWeight: hdesignFontWeight,
                      fontVariationSettings: `'wght' ${hdesignFontWeight}`,
                      height: "40px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid var(--panel-border)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.3rem",
                      cursor: "pointer",
                      userSelect: "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {c}
                    <div className="character-tooltip">
                      <div 
                        className="tooltip-large-char"
                        style={{
                          fontFamily: "'HDesign', sans-serif",
                          fontWeight: hdesignFontWeight,
                          fontVariationSettings: `'wght' ${hdesignFontWeight}`
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
