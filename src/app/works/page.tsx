"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function WorksPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

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
            category: s.category,
            client: s.client,
            year: s.year
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
          category: s.category,
          client: s.client,
          year: s.year
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
                  overflow: "hidden",
                  aspectRatio: "1.5",
                  backgroundColor: work.bg,
                  boxShadow: "var(--shadow)",
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ 
                        fontSize: "0.85rem", 
                        fontWeight: 700, 
                        textTransform: "uppercase", 
                        letterSpacing: "2px", 
                        color: "#ffffff", 
                        opacity: 0.7 
                      }}>
                        {work.category || "Branding"}
                      </span>
                      <h2 style={{ 
                        fontSize: "1.6rem", 
                        fontWeight: "900", 
                        color: "#ffffff", 
                        margin: 0 
                      }}>
                        {work.title}
                      </h2>
                    </div>
                    
                    <span 
                      className="icon-Chevrolt-Arrow-Right" 
                      style={{ 
                        color: "#ffffff", 
                        fontSize: "1.2rem", 
                        background: "rgba(255,255,255,0.15)",
                        padding: "10px",
                        borderRadius: "50%",
                        transition: "all 0.3s"
                      }} 
                    />
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
