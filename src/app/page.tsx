"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

// Custom icons list for the explorer section
const iconsList = [
  "icon-QR-Code", "icon-Pattern", "icon-Dashboard", "icon-Settings", "icon-Search",
  "icon-Check", "icon-Home", "icon-Profile", "icon-Monitor", "icon-Eye",
  "icon-Locked", "icon-Unlocked", "icon-Close-Eye", "icon-Warning", "icon-Info",
  "icon-Call", "icon-Mail", "icon-Map-Pin", "icon-Clock", "icon-Calendar",
  "icon-Pin", "icon-Pencil", "icon-Trash", "icon-Close", "icon-Plus",
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
        <text x="100" y="120" fill="rgba(212,175,55,0.6)" fontSize="8" textAnchor="middle" fontWeight="bold" fontFamily="Calibri">ՀԱՅԱՍՏԱՆ</text>
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

export default function Home() {
  const { t } = useI18n();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  
  // Dynamic cases and details modal states
  const [casesList, setCasesList] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);

  // Contact form states
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus, setContactStatus] = useState<{ type: "success" | "error" | null; text: string }>({ type: null, text: "" });
  const [submittingContact, setSubmittingContact] = useState(false);

  // Icon explorer states
  const [iconSearch, setIconSearch] = useState("");
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);

  // Gallery states
  const [showAllGallery, setShowAllGallery] = useState(false);

  // Playground states
  const [playgroundHeight, setPlaygroundHeight] = useState(60);
  const [playgroundThickness, setPlaygroundThickness] = useState(3);
  const [playgroundHue, setPlaygroundHue] = useState(180);

  // Parallax layers refs
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);
  const layer3Ref = useRef<HTMLDivElement>(null);
  const layer4Ref = useRef<HTMLDivElement>(null);

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

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      setContactStatus({ type: "error", text: t('contact', 'error_fields', 'Խնդրում ենք լրացնել բոլոր դաշտերը:') });
      return;
    }
    
    setSubmittingContact(true);
    setContactStatus({ type: null, text: "" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          message: contactMessage
        })
      });

      const data = await res.json();
      if (res.ok) {
        setContactStatus({ type: "success", text: t('contact', 'success_msg', 'Շնորհակալություն! Ձեր հաղորդագրությունը հաջողությամբ ուղարկվեց:') });
        setContactName("");
        setContactEmail("");
        setContactMessage("");
      } else {
        setContactStatus({ type: "error", text: data.error || "Error occurred" });
      }
    } catch (err) {
      setContactStatus({ type: "error", text: t('contact', 'error_conn', 'Կապի սխալ. Խնդրում ենք փորձել կրկին:') });
    } finally {
      setSubmittingContact(false);
    }
  };

  // Filter cases that have a preview image for marquee display
  const marqueeItems = casesList.filter(c => c.image_url);

  // Parallax scrolling calculation
  useEffect(() => {
    const handleScroll = () => {
      const sy = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      
      // Update header sticky state
      setIsScrolled(sy > 50);

      // Parallax effect calculations (positive values translate stripes downward to resist scroll)
      if (layer1Ref.current) layer1Ref.current.style.transform = `translateY(${sy * 1.2}px)`;
      if (layer2Ref.current) layer2Ref.current.style.transform = `translateY(${sy * 1}px)`;
      if (layer3Ref.current) layer3Ref.current.style.transform = `translateY(${sy * 0.9}px)`;
      if (layer4Ref.current) layer4Ref.current.style.transform = `translateY(${sy * 0.5}px)`;

      // Active section detection
      const sections = ["home", "about", "works", "playground", "contact"];
      const scrollPos = sy + 250;
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once at load
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCopyIcon = (className: string) => {
    navigator.clipboard.writeText(className).then(() => {
      setCopiedIcon(className);
      setTimeout(() => setCopiedIcon(null), 1500);
    });
  };

  const filteredIcons = iconsList.filter(icon => 
    icon.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const visibleIcons = showAllIcons ? filteredIcons : filteredIcons.slice(0, 39); // Default show all or slice if very long

  // Helper function to render active navigation item styling
  const renderNavLinkText = (id: string, text: string) => {
    const active = activeSection === id;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Left double lines */}
        <div style={{ display: "flex", gap: "2px", opacity: active ? 1 : 0, transition: "opacity 0.25s ease", width: "8px" }}>
          <span style={{ width: "2px", height: "18px", background: "var(--primary-color)", borderRadius: "99px" }} />
          <span style={{ width: "2px", height: "12px", background: "var(--primary-color)", borderRadius: "99px", alignSelf: "center" }} />
        </div>
        <span>{text}</span>
        {/* Right double lines */}
        <div style={{ display: "flex", gap: "2px", opacity: active ? 1 : 0, transition: "opacity 0.25s ease", width: "8px" }}>
          <span style={{ width: "2px", height: "12px", background: "var(--primary-color)", borderRadius: "99px", alignSelf: "center" }} />
          <span style={{ width: "2px", height: "18px", background: "var(--primary-color)", borderRadius: "99px" }} />
        </div>
      </div>
    );
  };

  return (
    <main style={{ zIndex: '-1000' }}>
      
      {/* 4-Layer Dynamic Parallax Background with Abundant Vertical Stripes */}
      <div className="parallax-bg">
        {/* Layer 1: Slowest Scroll / Greatest Lag (translateY multiplier +0.38) */}
        <div ref={layer1Ref} className="parallax-layer">
          {/* Thick Stripes */}
          <div className="parallax-stripe pastel-green" style={{ width: "60px", height: "800px", top: "500px", left: "3%" }} />
          <div className="parallax-stripe pastel-purple" style={{ width: "45px", height: "600px", top: "950px", left: "12%" }} />
          <div className="parallax-stripe pastel-teal" style={{ width: "80px", height: "900px", top: "1750px", left: "8%" }} />
          <div className="parallax-stripe pastel-beige" style={{ width: "50px", height: "750px", top: "2850px", left: "15%" }} />
          <div className="parallax-stripe pastel-pink" style={{ width: "70px", height: "700px", top: "400px", right: "4%" }} />
          <div className="parallax-stripe pastel-blue" style={{ width: "50px", height: "650px", top: "1200px", right: "14%" }} />
          <div className="parallax-stripe pastel-purple" style={{ width: "85px", height: "900px", top: "2100px", right: "7%" }} />
          <div className="parallax-stripe pastel-green" style={{ width: "55px", height: "800px", top: "3100px", right: "12%" }} />
          <div className="parallax-stripe pastel-teal" style={{ width: "75px", height: "850px", top: "3900px", left: "6%" }} />
          <div className="parallax-stripe pastel-beige" style={{ width: "60px", height: "700px", top: "4400px", right: "8%" }} />
          {/* Extra Top-Section Stripes (Layer 1) */}
          <div className="parallax-stripe pastel-pink" style={{ width: "35px", height: "600px", top: "-60px", left: "19%" }} />
          <div className="parallax-stripe pastel-blue" style={{ width: "50px", height: "700px", top: "-30px", left: "36%" }} />
        </div>

        {/* Layer 2: Medium-Slow Scroll / Medium-High Lag (translateY multiplier +0.26) */}
        <div ref={layer2Ref} className="parallax-layer">
          {/* Thick Stripes */}
          <div className="parallax-stripe pastel-purple" style={{ width: "50px", height: "700px", top: "300px", left: "22%" }} />
          <div className="parallax-stripe pastel-beige" style={{ width: "75px", height: "800px", top: "1100px", left: "28%" }} />
          <div className="parallax-stripe pastel-pink" style={{ width: "60px", height: "650px", top: "2000px", left: "20%" }} />
          <div className="parallax-stripe pastel-green" style={{ width: "70px", height: "750px", top: "2900px", left: "26%" }} />
          <div className="parallax-stripe pastel-blue" style={{ width: "65px", height: "600px", top: "200px", right: "24%" }} />
          <div className="parallax-stripe pastel-teal" style={{ width: "55px", height: "700px", top: "900px", right: "18%" }} />
          <div className="parallax-stripe pastel-purple" style={{ width: "80px", height: "850px", top: "1800px", right: "22%" }} />
          <div className="parallax-stripe pastel-beige" style={{ width: "45px", height: "650px", top: "2750px", right: "26%" }} />
          <div className="parallax-stripe pastel-pink" style={{ width: "70px", height: "750px", top: "3700px", right: "20%" }} />
          <div className="parallax-stripe pastel-blue" style={{ width: "55px", height: "650px", top: "4300px", left: "25%" }} />
          {/* Extra Top-Section Stripes (Layer 2) */}
          <div className="parallax-stripe pastel-teal" style={{ width: "42px", height: "580px", top: "-70px", left: "6%" }} />
          <div className="parallax-stripe pastel-beige" style={{ width: "34px", height: "490px", top: "-55px", left: "80%" }} />
        </div>

        {/* Layer 3: Medium-Fast Scroll / Medium-Low Lag (translateY multiplier +0.14) */}
        <div ref={layer3Ref} className="parallax-layer">
          {/* Thick Stripes */}
          <div className="parallax-stripe pastel-teal" style={{ width: "40px", height: "500px", top: "100px", left: "45%" }} />
          <div className="parallax-stripe pastel-blue" style={{ width: "55px", height: "650px", top: "850px", left: "48%" }} />
          <div className="parallax-stripe pastel-pink" style={{ width: "60px", height: "600px", top: "1600px", left: "42%" }} />
          <div className="parallax-stripe pastel-purple" style={{ width: "75px", height: "800px", top: "2400px", left: "46%" }} />
          <div className="parallax-stripe pastel-green" style={{ width: "50px", height: "700px", top: "3200px", left: "52%" }} />
          <div className="parallax-stripe pastel-beige" style={{ width: "65px", height: "550px", top: "500px", right: "45%" }} />
          <div className="parallax-stripe pastel-teal" style={{ width: "50px", height: "650px", top: "1300px", right: "48%" }} />
          <div className="parallax-stripe pastel-blue" style={{ width: "70px", height: "700px", top: "2100px", right: "42%" }} />
          <div className="parallax-stripe pastel-pink" style={{ width: "55px", height: "600px", top: "2900px", right: "46%" }} />
          <div className="parallax-stripe pastel-purple" style={{ width: "65px", height: "800px", top: "3800px", left: "45%" }} />
          <div className="parallax-stripe pastel-green" style={{ width: "50px", height: "700px", top: "4500px", right: "43%" }} />
          {/* Extra Top-Section Stripes (Layer 3) */}
          <div className="parallax-stripe pastel-green" style={{ width: "38px", height: "560px", top: "-80px", left: "1%" }} />
          <div className="parallax-stripe pastel-teal" style={{ width: "54px", height: "670px", top: "-60px", left: "68%" }} />
        </div>

        {/* Layer 4: Fastest Scroll / Slowest Lag (translateY multiplier +0.05) */}
        <div ref={layer4Ref} className="parallax-layer">
          {/* Thick Stripes */}
          <div className="parallax-stripe pastel-beige" style={{ width: "50px", height: "650px", top: "400px", left: "33%" }} />
          <div className="parallax-stripe pastel-pink" style={{ width: "45px", height: "700px", top: "1450px", left: "35%" }} />
          <div className="parallax-stripe pastel-teal" style={{ width: "50px", height: "600px", top: "2700px", left: "32%" }} />
          <div className="parallax-stripe pastel-green" style={{ width: "55px", height: "700px", top: "650px", right: "32%" }} />
          <div className="parallax-stripe pastel-purple" style={{ width: "45px", height: "650px", top: "1850px", right: "35%" }} />
          <div className="parallax-stripe pastel-blue" style={{ width: "50px", height: "750px", top: "3300px", right: "33%" }} />
          {/* Extra Top-Section Stripes (Layer 4) */}
          <div className="parallax-stripe pastel-blue" style={{ width: "37px", height: "530px", top: "-30px", left: "23%" }} />
          <div className="parallax-stripe pastel-beige" style={{ width: "47px", height: "610px", top: "-15px", right: "9%" }} />
        </div>
      </div>
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
          <h1 style={{ 
            fontSize: "clamp(3.5rem, 8.5vw, 6rem)", 
            fontWeight: "900", 
            color: "var(--text)", 
            margin: "0 0 40px 0", 
            letterSpacing: "-2px",
            lineHeight: "1.05",
            textAlign: "left"
          }}>
            ՍՏԵՂԾԱ<br />ԵՒ ԳՈՐԾՆԱԿԱՆ
          </h1>
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
              {(marqueeItems.length > 0 ? [...marqueeItems, ...marqueeItems] : [...brandingCases, ...brandingCases]).map((card, idx) => (
                <div 
                  key={idx} 
                  className="marquee-card" 
                  style={{ backgroundColor: card.bg || card.color }}
                  onClick={() => setSelectedCase(card)}
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
                  <div className="card-content">{card.title}</div>
                </div>
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

          <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "80px 0 40px", display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "48px", alignItems: "center", position: "relative", zIndex: 5 }}>
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
                  data-color="#ffffff"
                  data-text-color="#ffffff"
                  style={{ color: "#ffffff" }}
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
          
          <div className="gallery-grid">
            {(showAllGallery ? casesList : casesList.slice(0, 8)).map((work) => (
              <div 
                key={work.id} 
                className="gallery-card"
                onClick={() => setSelectedCase(work)}
                style={{ cursor: "pointer" }}
                title="Սեղմեք մանրամասների համար"
              >
                <div className="gallery-img-container" style={{ background: work.bg }}>
                  {work.image_url ? (
                    <img 
                      src={work.image_url} 
                      alt={work.title} 
                      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} 
                    />
                  ) : (
                    getSvgForCase(work.id)
                  )}
                </div>
                <div className="gallery-overlay">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: "0 0 6px" }}>{work.title}</h3>
                  <p style={{ fontSize: "0.85rem", opacity: 0.8, margin: 0 }}>{work.subtitle}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: "36px" }}>
            <hd-button 
              onClick={() => setShowAllGallery(!showAllGallery)}
              data-width="160px"
              data-height="52px"
              data-thickness="3px"
            >
              {showAllGallery ? "Փակել" : "Ավելի"}
            </hd-button>
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
        <section>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px", textAlign: "center", color: "var(--text)" }}>
            Պատկերներ
          </h2>
          
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <div style={{ width: "100%", maxWidth: "400px" }}>
              <hd-input 
                placeholder="Որոնել պատկերակ..." 
                value={iconSearch}
                onInput={(e: any) => setIconSearch(e.target.value)}
                data-width="100%"
                data-height="46px"
                data-thickness="2px"
              />
            </div>
          </div>

          <div className="icon-explorer-grid">
            {visibleIcons.map((icon, idx) => (
              <div 
                key={idx} 
                className="icon-explorer-card"
                onClick={() => handleCopyIcon(icon)}
                title="Սեղմեք պատճենելու համար"
              >
                <span className={`icon-symbol ${icon}`} />
                <span className="icon-name">{icon.replace("icon-", "")}</span>
                
                <div className="icon-tooltip">
                  {copiedIcon === icon ? "Պատճենված է!" : "Պատճենել"}
                </div>
              </div>
            ))}
          </div>

          {filteredIcons.length > 16 && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "32px" }}>
              <hd-button 
                onClick={() => setShowAllIcons(!showAllIcons)}
                data-width="150px"
                data-height="46px"
                data-thickness="2px"
              >
                {showAllIcons ? "Փակել" : "Ավելի"}
              </hd-button>
            </div>
          )}
        </section>

        {/* Close shell container to let Footer go full-width */}
        </div>

        {/* ══ SECTION 7: FOOTER (Կապ - Full Width) ══ */}
        <footer id="contact" className="footer-section-fullwidth" style={{ background: "transparent", borderRadius: "0", border: "none" }}>
          {/* Dynamic SVG Background */}
          <SectionBackground color="#6A3E73" className="footer-svg-bg" type="footer" />

          <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "80px 0 40px", position: "relative", zIndex: 5, display: "flex", flexDirection: "column", gap: "40px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "60px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <img src="/logo.png" alt="Logo" style={{ height: "30px", objectFit: "contain" }} />
                    <span style={{ fontSize: "1.4rem", fontWeight: "800", color: "#ffffff" }}>HDesign</span>
                  </div>
                  <p style={{ color: "#ffffff", opacity: 0.8, fontSize: "0.9rem", lineHeight: "1.6", margin: 0 }}>
                    Ստեղծարար և Գործնական դիզայն լուծումներ: Յուրաքանչյուր ինտերֆեյս ստեղծված է սիրով և մաթեմատիկական ճշգրտությամբ:
                  </p>
                </div>
                
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#ffffff", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 12px" }}>Հղումներ</h4>
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    <a href="#home" style={{ color: "#ffffff", opacity: 0.8, textDecoration: "none", fontSize: "0.9rem" }}>Տուն</a>
                    <a href="#about" style={{ color: "#ffffff", opacity: 0.8, textDecoration: "none", fontSize: "0.9rem" }}>Մասին</a>
                    <a href="#works" style={{ color: "#ffffff", opacity: 0.8, textDecoration: "none", fontSize: "0.9rem" }}>Աշխատանքներ</a>
                    <a href="#playground" style={{ color: "#ffffff", opacity: 0.8, textDecoration: "none", fontSize: "0.9rem" }}>Փաստաթղթեր</a>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#ffffff", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 12px" }}>Կոնտակտներ</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", color: "#ffffff", opacity: 0.8, fontSize: "0.9rem" }}>
                    <div>Էլ. հասցե՝ info@hakobian.am</div>
                    <div>Հեռախոս՝ +374 00 000000</div>
                    <div>Երևան, Հայաստան</div>
                  </div>
                </div>
              </div>

              {/* Glassmorphic Contact Form */}
              <div style={{ 
                background: "rgba(255, 255, 255, 0.05)", 
                backdropFilter: "blur(20px)", 
                border: "1px solid rgba(255, 255, 255, 0.1)", 
                padding: "30px", 
                borderRadius: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "20px"
              }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#ffffff", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>
                  {t('contact', 'form_title', 'Հետադարձ Կապ')}
                </h4>
                <form onSubmit={handleContactSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <hd-input 
                      placeholder={t('contact', 'name_placeholder', 'Ձեր անունը...')}
                      value={contactName}
                      onInput={(e: any) => setContactName(e.target.value)}
                      data-width="100%"
                      data-height="42px"
                      data-thickness="1px"
                    />
                  </div>
                  <div>
                    <hd-input 
                      type="email"
                      placeholder={t('contact', 'email_placeholder', 'Էլ. հասցե...')}
                      value={contactEmail}
                      onInput={(e: any) => setContactEmail(e.target.value)}
                      data-width="100%"
                      data-height="42px"
                      data-thickness="1px"
                    />
                  </div>
                  <div>
                    <textarea 
                      placeholder={t('contact', 'message_placeholder', 'Ձեր հաղորդագրությունը...')}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      style={{ 
                        width: "100%", 
                        minHeight: "100px", 
                        background: "rgba(255, 255, 255, 0.04)", 
                        border: "1px solid rgba(255, 255, 255, 0.08)", 
                        borderRadius: "12px", 
                        padding: "12px 16px", 
                        color: "#fff", 
                        fontSize: "0.9rem",
                        fontFamily: "inherit",
                        resize: "vertical",
                        outline: "none",
                        transition: "border-color 0.2s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "rgba(255,255,255,0.2)"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                    />
                  </div>

                  {contactStatus.text && (
                    <div style={{ 
                      fontSize: "0.85rem", 
                      color: contactStatus.type === "success" ? "#81c784" : "#e57373",
                      background: contactStatus.type === "success" ? "rgba(129, 199, 132, 0.1)" : "rgba(229, 115, 115, 0.1)",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: contactStatus.type === "success" ? "1px solid rgba(129, 199, 132, 0.2)" : "1px solid rgba(229, 115, 115, 0.2)"
                    }}>
                      {contactStatus.text}
                    </div>
                  )}

                  <hd-button 
                    type="submit"
                    data-width="100%" 
                    data-height="44px"
                    data-thickness="2px"
                    disabled={submittingContact}
                    style={{ opacity: submittingContact ? 0.7 : 1 }}
                  >
                    {submittingContact ? t('contact', 'submitting_btn', 'Ուղարկվում է...') : t('contact', 'submit_btn', 'Ուղարկել')}
                  </hd-button>
                </form>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.15)", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#ffffff", opacity: 0.7, fontSize: "0.85rem" }}>
              <div>© {new Date().getFullYear()} HDesign. Բոլոր իրավունքները պաշտպանված են։</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>Դիզայնը՝ Հրանտ Հակոբյանի</span>
              </div>
            </div>
          </div>
        </footer>

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
              <button 
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
              </button>

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
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    );
}
