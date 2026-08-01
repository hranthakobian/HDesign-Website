"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { brandingCases as staticCases } from "@/lib/brandingData";
import RatingSystem from "@/components/RatingSystem";
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

function parseBg(bgString: string) {
  const parts = (bgString || "").split(" | ");
  const bg = parts[0] || "linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)";
  let overlay = true;
  let positionY = 50;
  let height = 75; // default height for public view page is now 75vh

  for (let i = 1; i < parts.length; i++) {
    const [k, v] = parts[i].split("=");
    if (k === "overlay") overlay = v === "true";
    if (k === "position_y") positionY = parseInt(v) || 50;
    if (k === "height") height = parseInt(v) || 75;
  }

  return { bg, overlay, positionY, height };
}

function parseLangText(text: string, lang: 'hy' | 'en') {
  if (!text) return "";
  const parts = text.split(" | ");
  if (parts.length > 1) {
    return lang === 'en' ? parts[1] : parts[0];
  }
  return text;
}

function getAverageColor(bgString: string): string {
  if (!bgString) return "rgba(10, 10, 15, 0.5)";

  const hexRegex = /#[0-9a-fA-F]{3,8}\b/g;
  const rgbRegex = /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g;
  const rgbaRegex = /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d\.]+\s*\)/g;

  const hexMatches = bgString.match(hexRegex) || [];
  const rgbMatches = bgString.match(rgbRegex) || [];
  const rgbaMatches = bgString.match(rgbaRegex) || [];

  const colors: { r: number; g: number; b: number; a: number }[] = [];

  hexMatches.forEach(hex => {
    let h = hex.slice(1);
    if (h.length === 3) {
      h = h.split('').map(char => char + char).join('');
    }
    if (h.length === 6) {
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      colors.push({ r, g, b, a: 1 });
    } else if (h.length === 8) {
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      const a = parseInt(h.substring(6, 8), 16) / 255;
      colors.push({ r, g, b, a });
    }
  });

  rgbMatches.forEach(rgb => {
    const parts = rgb.match(/\d+/g);
    if (parts && parts.length >= 3) {
      colors.push({ r: parseInt(parts[0]), g: parseInt(parts[1]), b: parseInt(parts[2]), a: 1 });
    }
  });

  rgbaMatches.forEach(rgba => {
    const nums = rgba.match(/[\d\.]+/g);
    if (nums && nums.length >= 4) {
      colors.push({ r: parseInt(nums[0]), g: parseInt(nums[1]), b: parseInt(nums[2]), a: parseFloat(nums[3]) });
    }
  });

  if (colors.length === 0) {
    return "rgba(10, 10, 15, 0.5)";
  }

  const total = colors.length;
  const avgR = Math.round(colors.reduce((sum, c) => sum + c.r, 0) / total);
  const avgG = Math.round(colors.reduce((sum, c) => sum + c.g, 0) / total);
  const avgB = Math.round(colors.reduce((sum, c) => sum + c.b, 0) / total);

  return `rgba(${avgR}, ${avgG}, ${avgB}, 0.65)`;
}

export default function BrandingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [work, setWork] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [blocks, setBlocks] = useState<any[]>([]);
  const [lang, setLang] = useState<'hy' | 'en'>('hy');
  const [wideMedia, setWideMedia] = useState(false);
  const heroImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroImageRef.current) {
        const scrolled = window.scrollY;
        if (scrolled < window.innerHeight * 1.5) {
          heroImageRef.current.style.transform = `translate3d(0, ${scrolled * 0.35}px, 0)`;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as any).isContentEditable)) {
        return;
      }
      if (e.key === "~" || e.key === "`" || e.code === "Backquote") {
        setWideMedia(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem('hdesign_locale');
      if (savedLang === 'en') setLang('en');
    }
  }, []);

  useEffect(() => {
    function parseProjectBlocks(detailsString: string) {
      if (detailsString.startsWith("[")) {
        try {
          return JSON.parse(detailsString);
        } catch (e) {
          // fallback below
        }
      }
      // Standard string fallback
      return [
        { type: "text", title_am: "Նախագծի Մասին", title_en: "About the Project", content_am: detailsString, content_en: detailsString }
      ];
    }

    async function loadWork() {
      const currentLang = (typeof window !== "undefined" && localStorage.getItem('hdesign_locale') === 'en') ? 'en' : 'hy';
      setLoadingMessage(currentLang === "en" ? "Loading case details..." : "Բեռնվում են տվյալները...");

      let foundWork: Case | null = null;
      let parsedBlocks: any[] = [];

      try {
        const res = await fetch("/api/cases");
        if (!res.ok) throw new Error("Failed to fetch cases");
        const data = await res.json();
        const found = (data || []).find((c: any) => c.id === id);
        
        if (found) {
          foundWork = found;
          parsedBlocks = parseProjectBlocks(found.details || "");
        } else {
          // Check static data fallback
          const staticFound = staticCases.find((item) => item.id === id);
          if (staticFound) {
            foundWork = {
              id: staticFound.id,
              title: staticFound.title,
              subtitle: staticFound.tagline,
              bg: staticFound.color,
              image_url: staticFound.image,
              details: staticFound.description,
              category: (staticFound as any).category || "Branding",
              client: (staticFound as any).client || "HDesign Studio",
              year: (staticFound as any).year || "2026"
            };
            
            // Generate standard block list from static concept/typography
            parsedBlocks = [
              { type: "text", title_am: "Նախագծի Մասին", title_en: "About the Project", content_am: staticFound.description, content_en: staticFound.description },
              { type: "text", title_am: "Կոնցեպտուալ Լուծում", title_en: "Conceptual Solution", content_am: staticFound.concept, content_en: staticFound.concept },
              { type: "color_palette", colors: staticFound.colors || ["#d32f2f", "#f8fafc", "#0f172a"] },
              { type: "typography_showcase", fonts: [staticFound.typography || "Outfit"], previewText: "Հրանտ Հակոբյան Դիզայն Ստուդիա 2026" }
            ];
          }
        }
      } catch (err) {
        console.warn("Using static branding cases fallback details:", err);
        const staticFound = staticCases.find((item) => item.id === id);
        if (staticFound) {
          foundWork = {
            id: staticFound.id,
            title: staticFound.title,
            subtitle: staticFound.tagline,
            bg: staticFound.color,
            image_url: staticFound.image,
            details: staticFound.description,
            category: (staticFound as any).category || "Branding",
            client: (staticFound as any).client || "HDesign Studio",
            year: (staticFound as any).year || "2026"
          };
          parsedBlocks = [
            { type: "text", title_am: "Նախագծի Մասին", title_en: "About the Project", content_am: staticFound.description, content_en: staticFound.description },
            { type: "text", title_am: "Կոնցեպտուալ Լուծում", title_en: "Conceptual Solution", content_am: staticFound.concept, content_en: staticFound.concept },
            { type: "color_palette", colors: staticFound.colors || ["#d32f2f", "#f8fafc", "#0f172a"] },
            { type: "typography_showcase", fonts: [staticFound.typography || "Outfit"], previewText: "Հրանտ Հակոբյան Դիզայն Ստուդիա 2026" }
          ];
        }
      }

      if (foundWork) {
        setWork(foundWork);
        setBlocks(parsedBlocks);

        // Extract image URLs to preload
        const imageUrls: string[] = [];
        if (foundWork.image_url) {
          imageUrls.push(foundWork.image_url);
        }
        parsedBlocks.forEach((block: any) => {
          if (block.type === "image" && block.image_url) {
            imageUrls.push(block.image_url);
          }
        });

        if (imageUrls.length === 0) {
          setLoading(false);
        } else {
          let loadedCount = 0;
          const totalImages = imageUrls.length;
          
          setLoadingMessage(
            currentLang === "en"
              ? `Loading images (0/${totalImages})...`
              : `Բեռնվում են պատկերները (0/${totalImages})...`
          );

          const checkAllLoaded = () => {
            loadedCount++;
            setLoadingMessage(
              currentLang === "en"
                ? `Loading images (${loadedCount}/${totalImages})...`
                : `Բեռնվում են պատկերները (${loadedCount}/${totalImages})...`
            );
            if (loadedCount >= totalImages) {
              setLoading(false);
            }
          };

          // safety timeout (5 seconds) so we don't hang the page if an image is down
          const timeoutId = setTimeout(() => {
            setLoading(false);
          }, 5000);

          imageUrls.forEach((url) => {
            const img = new Image();
            img.src = url;
            img.onload = () => {
              checkAllLoaded();
            };
            img.onerror = () => {
              checkAllLoaded(); // count error as loaded to not block user
            };
          });
        }
      } else {
        setLoading(false);
      }
    }

    loadWork();
  }, [id]);

  if (loading) {
    return (
      <main className="shell" style={{ marginTop: "160px", minHeight: "75vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingAnimation fullPage={false} message={loadingMessage || (lang === "en" ? "Loading details..." : "Բեռնվում է...")} />
      </main>
    );
  }

  if (!work) {
    return (
      <main className="shell" style={{ marginTop: "160px", minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text)" }}>Աշխատանքը չի գտնվել</h2>
        <Link href="/works" style={{ textDecoration: "none" }}>
          <hd-button data-width="180px" data-height="48px" data-thickness="3px">
            Վերադառնալ
          </hd-button>
        </Link>
      </main>
    );
  }

  const hero = parseBg(work.bg);
  const avgBgColor = getAverageColor(hero.bg);

  // Find indices of first and last image blocks
  const imageBlockIndices = blocks
    .map((b, i) => (b.type === "image" && b.image_url ? i : -1))
    .filter(index => index !== -1);
  const firstImageIdx = imageBlockIndices.length > 0 ? imageBlockIndices[0] : -1;
  const lastImageIdx = imageBlockIndices.length > 0 ? imageBlockIndices[imageBlockIndices.length - 1] : -1;

  return (
    <main className="case-detail-main" style={{ marginTop: "0px", minHeight: "100vh" }}>

      {/* Huge Case Hero Header */}
      <div 
        className="works-detail-hero-header"
        style={{
          width: "100%",
          height: `${hero.height}vh`,
          position: "relative",
          backgroundColor: hero.bg,
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden"
        }}
      >
        {work.image_url && (
          <img 
            ref={heroImageRef}
            src={work.image_url} 
            alt={work.title} 
            style={{ 
              position: "absolute", 
              top: "-15%", 
              left: 0,
              width: "100%", 
              height: "130%", 
              objectFit: "cover", 
              objectPosition: `50% ${hero.positionY}%`,
              opacity: 0.8,
              willChange: "transform",
              transform: "translate3d(0, 0, 0)"
            }} 
          />
        )}
        
        {/* Shadow Overlay */}
        {hero.overlay && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.2) 50%, rgba(0, 0, 0, 0) 100%)",
            zIndex: 1
          }} />
        )}

        {/* Hero Title Container */}
        <div 
          className="shell works-detail-hero-title-container" 
          style={{ 
            position: "relative", 
            zIndex: 10, 
            paddingBottom: "48px", 
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "24px",
            flexWrap: "wrap"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: "1 1 320px", minWidth: 0 }}>
            <span style={{ 
              fontSize: "clamp(0.72rem, 1.5vw, 0.9rem)", 
              fontWeight: 800, 
              textTransform: "uppercase", 
              letterSpacing: "2px", 
              color: "#ffffff",
              opacity: 0.8
            }}>
              {lang === 'en' ? "Branding Case" : "Բրենդավորման Քեյս"}
            </span>
            <h1 style={{ 
              fontSize: "clamp(1.8rem, 5vw, 4rem)", 
              fontWeight: "900", 
              color: "#ffffff", 
              margin: 0,
              lineHeight: "1.1" 
            }}>
              {parseLangText(work.title, lang)}
            </h1>
            <p style={{ 
              fontSize: "clamp(0.88rem, 2vw, 1.25rem)", 
              color: "#ffffff", 
              opacity: 0.9, 
              margin: 0,
              maxWidth: "700px" 
            }}>
              {parseLangText(work.subtitle, lang)}
            </p>
          </div>
          <div style={{ flexShrink: 0, paddingBottom: 8 }}>
            <RatingSystem id={work.id} locale={lang === 'en' ? 'en' : 'hy'} bgColor={avgBgColor} noShadow={true} />
          </div>
        </div>
      </div>

      {/* Horizontal Metadata Bar */}
      <div className="works-detail-metadata-bar" style={{ borderBottom: "1px solid var(--panel-border)", background: "var(--panel)", padding: "24px 0" }}>
        <div className="shell" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-around", gap: "24px", textAlign: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{lang === 'en' ? "Category" : "Կարգ"}</span>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{parseLangText(work.category || "", lang) || (lang === 'en' ? "Branding" : "Բրենդավորում")}</span>
          </div>
          {work.client && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{lang === 'en' ? "Client" : "Հաճախորդ"}</span>
              <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{parseLangText(work.client, lang)}</span>
            </div>
          )}
          {work.year && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{lang === 'en' ? "Year" : "Տարեթիվ"}</span>
              <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{work.year}</span>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcut Hint directly under the info bar */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "16px", marginBottom: "-16px" }}>
        <div style={{ 
          fontSize: "0.78rem", 
          fontWeight: 700, 
          color: "var(--muted)", 
          padding: "4px 12px", 
          background: "var(--panel)", 
          border: "1px solid var(--panel-border)", 
          borderRadius: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span style={{ 
            fontFamily: "monospace", 
            fontSize: "0.9rem", 
            background: "var(--input-bg)", 
            padding: "1px 5px", 
            borderRadius: "4px", 
            color: "var(--accent)", 
            border: "1px solid var(--input-border)" 
          }}>~</span>
          <span>{lang === 'en' ? "Press to toggle focus mode" : "Սեղմեք տիլդան՝ մեդիան կենտրոնացնելու համար"}</span>
        </div>
      </div>

      {/* Single-Column stack (Images/Videos occupy 100% width, other specs centered) */}
      <div style={{ width: "100%", padding: "40px 0", display: "flex", flexDirection: "column" }}>
        {blocks.map((block, idx) => {
          const mt = (block as any).marginTop ?? 0;
          const mb = (block as any).marginBottom ?? 0;

          if (block.type === "text") {
            return (
              <div key={idx} style={{ width: "100%", marginTop: mt, marginBottom: mb, padding: "0 24px", boxSizing: "border-box" }}>
                <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {(lang === 'en' ? block.title_en : block.title_am) && (
                    <h2 style={{ fontSize: "2rem", fontWeight: "900", color: "var(--text)", margin: 0 }}>
                      {lang === 'en' ? block.title_en : block.title_am}
                    </h2>
                  )}
                  <div 
                    style={{ fontSize: "1.15rem", lineHeight: "1.8", color: "var(--text)", opacity: 0.85, margin: 0 }}
                    dangerouslySetInnerHTML={{ __html: lang === 'en' ? (block.content_en || block.content_am) : (block.content_am || block.content_en) }}
                  />
                </div>
              </div>
            );
          }

          if (block.type === "image" && block.image_url) {
            const isFirstImage = idx === firstImageIdx;
            const isLastImage = idx === lastImageIdx;

            return (
              <div key={idx} style={{ width: "100%", marginTop: mt, marginBottom: mb, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ 
                  width: "100%", 
                  maxWidth: wideMedia ? "1500px" : "100%", 
                  overflow: "hidden",
                  transition: "max-width 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                  margin: "0 auto",
                  borderTopLeftRadius: (wideMedia && isFirstImage) ? "32px" : "0px",
                  borderTopRightRadius: (wideMedia && isFirstImage) ? "32px" : "0px",
                  borderBottomLeftRadius: (wideMedia && isLastImage) ? "32px" : "0px",
                  borderBottomRightRadius: (wideMedia && isLastImage) ? "32px" : "0px",
                }}>
                  <img src={block.image_url} alt="Project spec" style={{ width: "100%", height: "auto", display: "block" }} />
                </div>
                {(lang === 'en' ? block.caption_en : block.caption_am) && (
                  <div style={{ maxWidth: "900px", margin: "12px auto 0", padding: "0 24px", textAlign: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontStyle: "italic" }}>
                      {lang === 'en' ? block.caption_en : block.caption_am}
                    </span>
                  </div>
                )}
              </div>
            );
          }

          if (block.type === "embed" && block.embed_url) {
            let src = block.embed_url;
            if (src.includes("youtube.com/watch?v=")) {
              src = `https://www.youtube.com/embed/${src.split("v=")[1].split("&")[0]}`;
            } else if (src.includes("youtu.be/")) {
              src = `https://www.youtube.com/embed/${src.split("youtu.be/")[1]}`;
            }
            return (
              <div key={idx} style={{ 
                width: "100%", 
                maxWidth: wideMedia ? "1500px" : "100%", 
                margin: "0 auto", 
                marginTop: mt, 
                marginBottom: mb, 
                aspectRatio: "16/9", 
                overflow: "hidden",
                transition: "max-width 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
              }}>
                <iframe src={src} style={{ width: "100%", height: "100%", border: "none" }} allowFullScreen />
              </div>
            );
          }

          if (block.type === "color_palette" && block.colors) {
            return (
              <div key={idx} style={{ width: "100%", marginTop: mt, marginBottom: mb, padding: "0 24px", boxSizing: "border-box" }}>
                <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--text)", margin: 0 }}>Բրենդի Գունապնակ</h3>
                  <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                    {block.colors.map((color: string, cIdx: number) => (
                      <div key={cIdx} style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
                        <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: color, border: "2px solid var(--panel-border)", boxShadow: "var(--shadow)" }} />
                        <span style={{ fontSize: "0.85rem", fontFamily: "monospace", color: "var(--muted)" }}>{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          if (block.type === "typography_showcase" && block.fonts) {
            return (
              <div key={idx} style={{ width: "100%", marginTop: mt, marginBottom: mb, padding: "0 24px", boxSizing: "border-box" }}>
                <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--text)", margin: 0 }}>Տառատեսակներ</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {block.fonts.map((fName: string, fIdx: number) => (
                      <div key={fIdx} style={{ padding: "24px", background: "var(--panel)", borderRadius: "16px", border: "1px solid var(--panel-border)" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{fName}</span>
                        <div style={{ fontFamily: `${fName}, sans-serif`, fontSize: "2rem", marginTop: "12px", color: "var(--text)" }}>
                          {block.previewText || "Հրանտ Հակոբյան Դիզայն"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Footer Rating System section */}
      <div className="shell" style={{ display: "flex", justifyContent: "center" }}>
        <RatingSystem id={work.id} locale={lang === 'en' ? 'en' : 'hy'} bgColor={avgBgColor} noShadow={true} />
      </div>

      {/* Back to works button */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "75px" }}>
        <Link href="/works" style={{ textDecoration: "none" }}>
          <hd-button data-width="220px" data-height="50px" data-thickness="3px">
            {lang === 'en' ? "← Other Works" : "← Դեպի Այլ Աշխատանքներ"}
          </hd-button>
        </Link>
      </div>
    </main>
  );
}
