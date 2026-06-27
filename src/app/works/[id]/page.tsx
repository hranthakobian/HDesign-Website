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

  return (
    <main style={{ marginTop: "80px", minHeight: "100vh" }}>
      {/* Huge Case Hero Header */}
      <div 
        style={{
          width: "100%",
          height: "55vh",
          position: "relative",
          backgroundColor: work.bg,
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
              opacity: 0.8 
            }} 
          />
        )}
        
        {/* Shadow Overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%)",
          zIndex: 1
        }} />

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

      {/* Main Content Details */}
      <div className="shell" style={{ padding: "60px 24px" }}>
        
        {/* Details Grid */}
        <div 
          style={{ 
            display: "grid", 
            gridTemplateColumns: "1.4fr 0.8fr", 
            gap: "56px",
            alignItems: "start" 
          }} 
          className="case-grid"
        >
          {/* Left Column: Dynamic Behance Blocks list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "48px", minWidth: 0 }}>
            {blocks.map((block, idx) => {
              if (block.type === "text") {
                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {(block.title_am || block.title_en) && (
                      <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text)", margin: 0 }}>
                        {block.title_am || block.title_en}
                      </h2>
                    )}
                    <p style={{ fontSize: "1.08rem", lineHeight: "1.75", opacity: 0.9, margin: 0, whiteSpace: "pre-line" }}>
                      {block.content_am || block.content_en}
                    </p>
                  </div>
                );
              }

              if (block.type === "image" && block.image_url) {
                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                    <div style={{
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: "1px solid var(--panel-border)",
                      width: "100%",
                      maxWidth: block.fullWidth ? "100%" : "680px"
                    }}>
                      <img src={block.image_url} alt="Project spec" style={{ width: "100%", display: "block" }} />
                    </div>
                    {(block.caption_am || block.caption_en) && (
                      <span style={{ fontSize: "0.82rem", color: "var(--muted)", fontStyle: "italic", textAlign: "center" }}>
                        {block.caption_am || block.caption_en}
                      </span>
                    )}
                  </div>
                );
              }

              if (block.type === "embed" && block.embed_url) {
                // simple parser for youtube/vimeo embed
                let src = block.embed_url;
                if (src.includes("youtube.com/watch?v=")) {
                  src = `https://www.youtube.com/embed/${src.split("v=")[1].split("&")[0]}`;
                } else if (src.includes("youtu.be/")) {
                  src = `https://www.youtube.com/embed/${src.split("youtu.be/")[1]}`;
                }
                return (
                  <div key={idx} style={{ width: "100%", aspectRatio: "16/9", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--panel-border)" }}>
                    <iframe src={src} style={{ width: "100%", height: "100%", border: "none" }} allowFullScreen />
                  </div>
                );
              }

              if (block.type === "color_palette" && block.colors) {
                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0 }}>Բրենդի Գունապնակ (Brand Palette)</h3>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                      {block.colors.map((color: string, cIdx: number) => (
                        <div key={cIdx} style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: color, border: "2px solid var(--panel-border)", boxShadow: "var(--shadow)" }} />
                          <span style={{ fontSize: "0.78rem", fontFamily: "monospace", color: "var(--muted)" }}>{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (block.type === "typography_showcase" && block.fonts) {
                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0 }}>Տառատեսակներ (Typography Showcase)</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {block.fonts.map((fName: string, fIdx: number) => (
                        <div key={fIdx} style={{ padding: "16px", background: "var(--panel)", borderRadius: "12px", border: "1px solid var(--panel-border)" }}>
                          <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase" }}>{fName}</span>
                          <div style={{ fontFamily: `${fName}, sans-serif`, fontSize: "1.8rem", marginTop: "8px", color: "var(--text)" }}>
                            {block.previewText || "Հրանտ Հակոբյան Դիզայն"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>

          {/* Right Column: Project Sidebar Details */}
          <div 
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "28px",
              background: "var(--panel)",
              border: "1px solid var(--panel-border)",
              borderRadius: "24px",
              padding: "36px",
              boxShadow: "var(--shadow)",
              position: "sticky",
              top: "140px"
            }}
            className="case-sidebar"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                Կարգ
              </span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>
                {work.category || "Branding"}
              </span>
            </div>

            {work.client && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Հաճախորդ
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>
                  {work.client}
                </span>
              </div>
            )}

            {work.year && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Տարեթիվ
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>
                  {work.year}
                </span>
              </div>
            )}

            <div style={{ borderTop: "1px solid var(--panel-border)", paddingTop: "24px", marginTop: "12px" }}>
              <Link href="/works" style={{ textDecoration: "none", width: "100%" }}>
                <hd-button data-width="100%" data-height="44px" data-thickness="1px" style={{ background: "transparent", color: "var(--text)" }}>
                  Հետ դեպի ցուցակ
                </hd-button>
              </Link>
            </div>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @media (max-width: 992px) {
          .case-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .case-sidebar {
            position: relative !important;
            top: 0 !important;
          }
        }
      `}</style>
    </main>
  );
}
