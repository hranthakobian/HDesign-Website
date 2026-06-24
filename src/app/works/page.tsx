"use client";

import Link from "next/link";
import { brandingCases } from "@/lib/brandingData";

export default function WorksPage() {
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

      {/* Two-Column Grid for Branding Cases */}
      <div className="branding-two-column-grid" style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "40px",
        paddingBottom: "60px"
      }}>
        {brandingCases.map((work) => (
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
                backgroundColor: work.color,
                boxShadow: "var(--shadow)",
                cursor: "pointer",
                transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
                border: "1px solid var(--panel-border)"
              }}
            >
              {/* Branding Image */}
              <img 
                src={work.image} 
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
                      Բրենդավորում
                    </span>
                    <h3 style={{ 
                      fontSize: "2rem", 
                      fontWeight: "800", 
                      color: "#ffffff", 
                      margin: 0,
                      letterSpacing: "0.5px"
                    }}>
                      {work.title}
                    </h3>
                  </div>
                  
                  {/* Arrow Indicator */}
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    border: "2px solid rgba(255, 255, 255, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    transition: "all 0.3s ease"
                  }} className="card-arrow-circle">
                    <span className="icon-North-West-Arrow" style={{ fontSize: "1.2rem", transform: "rotate(90deg)", display: "inline-block" }} />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
