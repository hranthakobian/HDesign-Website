"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { brandingCases as staticCases, getPastelColor, getCasePastelColor } from "@/lib/brandingData";
import { useI18n } from "@/lib/i18n";

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

export default function WorksPage() {
  const { locale } = useI18n();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<Record<string, { sum: number; count: number }>>({});

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

        if (mappedDynamic.length > 0) {
          setCases(mappedDynamic);
        } else {
          // Fallback to static seed data
          setCases(staticCases.map(s => ({
            id: s.id,
            title: s.title,
            subtitle: s.tagline,
            bg: s.color,
            image_url: s.image,
            details: s.description,
            category: (s as any).category || "Branding",
            client: (s as any).client || "HDesign Studio",
            year: (s as any).year || "2026"
          })));
        }
      } catch (err) {
        console.warn("Using static branding cases fallback:", err);
        setCases(staticCases.map(s => ({
          id: s.id,
          title: s.title,
          subtitle: s.tagline,
          bg: s.color,
          image_url: s.image,
          details: s.description,
          category: (s as any).category || "Branding",
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
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
          <span>Բեռնվում է...</span>
        </div>
      )}

      {/* Two-Column Grid for Branding Cases */}
      {!loading && (
        <div className="branding-two-column-grid" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "40px",
          paddingBottom: "60px"
        }}>
          {cases.map((work) => (
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
      )}
    </main>
  );
}
