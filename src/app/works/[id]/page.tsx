"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { brandingCases as staticCases } from "@/lib/brandingData";

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
  let height = 55; // default height for public view page

  for (let i = 1; i < parts.length; i++) {
    const [k, v] = parts[i].split("=");
    if (k === "overlay") overlay = v === "true";
    if (k === "position_y") positionY = parseInt(v) || 50;
    if (k === "height") height = parseInt(v) || 55;
  }

  return { bg, overlay, positionY, height };
}

export default function BrandingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [work, setWork] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<any[]>([]);

  useEffect(() => {
    async function loadWork() {
      try {
        const res = await fetch("/api/cases");
        if (!res.ok) throw new Error("Failed to fetch cases");
        const data = await res.json();
        const found = (data || []).find((c: any) => c.id === id);
        
        if (found) {
          setWork(found);
          parseProjectBlocks(found.details || "");
        } else {
          // Check static data fallback
          const staticFound = staticCases.find((item) => item.id === id);
          if (staticFound) {
            const mappedStatic: Case = {
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
            setWork(mappedStatic);
            
            // Generate standard block list from static concept/typography
            setBlocks([
              { type: "text", title_am: "Նախագծի Մասին", title_en: "About the Project", content_am: staticFound.description, content_en: staticFound.description },
              { type: "text", title_am: "Կոնցեպտուալ Լուծում", title_en: "Conceptual Solution", content_am: staticFound.concept, content_en: staticFound.concept },
              { type: "color_palette", colors: staticFound.colors || ["#d32f2f", "#f8fafc", "#0f172a"] },
              { type: "typography_showcase", fonts: [staticFound.typography || "Outfit"], previewText: "Հրանտ Հակոբյան Դիզայն Ստուդիա 2026" }
            ]);
          } else {
            setWork(null);
          }
        }
      } catch (err) {
        console.warn("Using static branding cases fallback details:", err);
        const staticFound = staticCases.find((item) => item.id === id);
        if (staticFound) {
          const mappedStatic: Case = {
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
          setWork(mappedStatic);
          setBlocks([
            { type: "text", title_am: "Նախագծի Մասին", title_en: "About the Project", content_am: staticFound.description, content_en: staticFound.description },
            { type: "text", title_am: "Կոնցեպտուալ Լուծում", title_en: "Conceptual Solution", content_am: staticFound.concept, content_en: staticFound.concept },
            { type: "color_palette", colors: staticFound.colors || ["#d32f2f", "#f8fafc", "#0f172a"] },
            { type: "typography_showcase", fonts: [staticFound.typography || "Outfit"], previewText: "Հրանտ Հակոբյան Դիզայն Ստուդիա 2026" }
          ]);
        }
      } finally {
        setLoading(false);
      }
    }

    function parseProjectBlocks(detailsString: string) {
      if (detailsString.startsWith("[")) {
        try {
          setBlocks(JSON.parse(detailsString));
          return;
        } catch (e) {
          // fallback below
        }
      }
      // Standard string fallback
      setBlocks([
        { type: "text", title_am: "Նախագծի Մասին", title_en: "About the Project", content_am: detailsString, content_en: detailsString }
      ]);
    }

    loadWork();
  }, [id]);

  if (loading) {
    return (
      <main className="shell" style={{ marginTop: "160px", minHeight: "75vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--muted)", fontSize: "1.2rem" }}>Բեռնվում է...</span>
      </main>
    );
  }

  if (!work) {
    return (
      <main className="shell" style={{ marginTop: "160px", minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text)" }}>Աշխատանքը չի գտնվել</h2>
        <Link href="/works" style={{ textDecoration: "none" }}>
          <hd-button data-width="180px" data-height="48px" data-thickness="2px">
            Վերադառնալ
          </hd-button>
        </Link>
      </main>
    );
  }

  const hero = parseBg(work.bg);

  return (
    <main style={{ marginTop: "80px", minHeight: "100vh" }}>
      {/* Huge Case Hero Header */}
      <div 
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
            src={work.image_url} 
            alt={work.title} 
            style={{ 
              position: "absolute", 
              inset: 0, 
              width: "100%", 
              height: "100%", 
              objectFit: "cover", 
              objectPosition: `50% ${hero.positionY}%`,
              opacity: 0.8 
            }} 
          />
        )}
        
        {/* Shadow Overlay */}
        {hero.overlay && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%)",
            zIndex: 1
          }} />
        )}

        {/* Hero Title Container */}
        <div 
          className="shell" 
          style={{ 
            position: "relative", 
            zIndex: 10, 
            paddingBottom: "48px", 
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}
        >
          <span style={{ 
            fontSize: "0.9rem", 
            fontWeight: 800, 
            textTransform: "uppercase", 
            letterSpacing: "3px", 
            color: "#ffffff",
            opacity: 0.8
          }}>
            Բրենդավորման Քեյս
          </span>
          <h1 style={{ 
            fontSize: "clamp(2.5rem, 6vw, 4rem)", 
            fontWeight: "900", 
            color: "#ffffff", 
            margin: 0,
            lineHeight: "1.1" 
          }}>
            {work.title}
          </h1>
          <p style={{ 
            fontSize: "clamp(1rem, 2vw, 1.25rem)", 
            color: "#ffffff", 
            opacity: 0.9, 
            margin: 0,
            maxWidth: "700px" 
          }}>
            {work.subtitle}
          </p>
        </div>
      </div>

      {/* Horizontal Metadata Bar */}
      <div style={{ borderBottom: "1px solid var(--panel-border)", background: "var(--panel)", padding: "24px 0" }}>
        <div className="shell" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-around", gap: "24px", textAlign: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Կարգ</span>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{work.category || "Branding"}</span>
          </div>
          {work.client && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Հաճախորդ</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{work.client}</span>
            </div>
          )}
          {work.year && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Տարեթիվ</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{work.year}</span>
            </div>
          )}
        </div>
      </div>

      {/* Single-Column stack (Images/Videos occupy 100% width, other specs centered) */}
      <div style={{ width: "100%", padding: "40px 0", display: "flex", flexDirection: "column" }}>
        {blocks.map((block, idx) => {
          if (block.type === "text") {
            return (
              <div key={idx} style={{ width: "100%", padding: "48px 24px", boxSizing: "border-box" }}>
                <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {(block.title_am || block.title_en) && (
                    <h2 style={{ fontSize: "2rem", fontWeight: "900", color: "var(--text)", margin: 0 }}>
                      {block.title_am || block.title_en}
                    </h2>
                  )}
                  <p style={{ fontSize: "1.15rem", lineHeight: "1.8", color: "var(--text)", opacity: 0.85, margin: 0, whiteSpace: "pre-line" }}>
                    {block.content_am || block.content_en}
                  </p>
                </div>
              </div>
            );
          }

          if (block.type === "image" && block.image_url) {
            return (
              <div key={idx} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", margin: "20px 0" }}>
                <div style={{ width: "100%", overflow: "hidden" }}>
                  <img src={block.image_url} alt="Project spec" style={{ width: "100%", height: "auto", display: "block" }} />
                </div>
                {(block.caption_am || block.caption_en) && (
                  <div style={{ maxWidth: "900px", margin: "12px auto 0", padding: "0 24px", textAlign: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontStyle: "italic" }}>
                      {block.caption_am || block.caption_en}
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
              <div key={idx} style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", margin: "20px 0" }}>
                <iframe src={src} style={{ width: "100%", height: "100%", border: "none" }} allowFullScreen />
              </div>
            );
          }

          if (block.type === "color_palette" && block.colors) {
            return (
              <div key={idx} style={{ width: "100%", padding: "48px 24px", boxSizing: "border-box" }}>
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
              <div key={idx} style={{ width: "100%", padding: "48px 24px", boxSizing: "border-box" }}>
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

      {/* Back to works button */}
      <div style={{ padding: "40px 24px 80px", display: "flex", justifyContent: "center" }}>
        <Link href="/works" style={{ textDecoration: "none" }}>
          <hd-button data-width="220px" data-height="50px" data-thickness="2px">
            ← Հետ դեպի ցուցակ
          </hd-button>
        </Link>
      </div>
    </main>
  );
}
