"use client";

import { useState } from "react";
import Link from "next/link";

export default function HDesignSamplesPage() {
  const [playgroundHeight, setPlaygroundHeight] = useState(60);
  const [playgroundThickness, setPlaygroundThickness] = useState(3);
  const [playgroundHue, setPlaygroundHue] = useState(182);

  return (
    <main className="shell" style={{ marginTop: "140px", minHeight: "80vh" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/hdesign" style={{ color: "var(--text)", textDecoration: "none", opacity: 0.7 }}>HDesign</Link>
          <span style={{ opacity: 0.5 }}>/</span>
          <span style={{ fontWeight: "bold" }}>Փորձանմուշներ</span>
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "900", color: "var(--text)", margin: 0 }}>Փորձանմուշներ (Playground)</h1>
        <p style={{ color: "var(--text)", opacity: 0.8, fontSize: "1.05rem", margin: 0, maxWidth: "700px" }}>
          Փորձարկեք HDesign-ի կոմպոնենտները իրական ժամանակում՝ փոփոխելով չափսերը, գծերի հաստությունն ու գունային երանգները։
        </p>
      </div>

      <div className="playground-wrapper" style={{
        display: "grid",
        gridTemplateColumns: "0.8fr 1.2fr",
        gap: "40px",
        background: "var(--panel)",
        border: "1px solid var(--panel-border)",
        borderRadius: "24px",
        padding: "40px",
        boxShadow: "var(--shadow)",
        marginBottom: "48px"
      }}>
        {/* Left Controls column */}
        <div className="playground-controls" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: "bold", color: "var(--text)" }}>Կառավարում</h3>
          
          <label style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--text)", opacity: 0.8 }}>Բարձրություն (Չափս): {playgroundHeight}px</span>
            <hd-slider 
              min="40" 
              max="100" 
              value={playgroundHeight} 
              onInput={(e: any) => setPlaygroundHeight(Number(e.target.value))}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--text)", opacity: 0.8 }}>Եզրագծի հաստություն: {playgroundThickness}px</span>
            <hd-slider 
              min="1" 
              max="8" 
              value={playgroundThickness} 
              onInput={(e: any) => setPlaygroundThickness(Number(e.target.value))}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--text)", opacity: 0.8 }}>Թեմայի Գույն (Hue): {playgroundHue}°</span>
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.15)",
            border: "1px solid var(--panel-border)",
            borderRadius: "16px",
            padding: "40px",
            boxSizing: "border-box",
            minHeight: "350px",
            "--wrapper-height": `${playgroundHeight}px`,
            "--line-thickness": `${playgroundThickness}px`,
            "--hue": playgroundHue
          } as any}
        >
          <div style={{ width: "100%", maxWidth: "450px", display: "flex", flexDirection: "column", gap: "24px" }}>
            <hd-slider min="0" max="100" value="40" data-width="100%" />

            <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <hd-checkbox checked data-size="18px" />
                <hd-checkbox data-size="18px" />
              </div>
              <hd-input placeholder="placeholder..." data-width="260px" />
            </div>

            <hd-button data-width="100%">Հաստատել (Submit)</hd-button>
          </div>
        </div>
      </div>

      {/* Structured Forms Showcase Section */}
      <div>
        <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text)", marginBottom: "32px", textAlign: "center" }}>
          Կառուցվածքային Օրինակներ
        </h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }} className="samples-showcase-grid">
          
          {/* Card 1: Sample Form */}
          <div style={{ background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: "24px", padding: "32px", boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", gap: "24px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>Մուտքի Ձևանմուշ</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <hd-input placeholder="Էլ. հասցե կամ օգտանուն" data-width="100%" data-height="46px" data-thickness="2px" />
              <hd-input placeholder="Գաղտնաբառ" data-width="100%" data-height="46px" data-thickness="2px" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.85rem" }}>
                  <hd-checkbox data-size="14px" />
                  <span>Հիշել ինձ</span>
                </label>
                <a href="#" style={{ fontSize: "0.85rem", color: "var(--text)", opacity: 0.8, textDecoration: "none" }}>Մոռացե՞լ եք գաղտնաբառը</a>
              </div>
              <hd-button data-width="100%" data-height="48px" data-thickness="2px">Մուտք Գործել</hd-button>
            </div>
          </div>

          {/* Card 2: Interactive Settings panel preview */}
          <div style={{ background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: "24px", padding: "32px", boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", gap: "24px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>Անհատականացում</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>Ծանուցումներ</span>
                  <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>Ստանալ ծանուցումներ էլ. փոստով</span>
                </div>
                <hd-checkbox checked data-size="18px" />
              </div>
              <hr style={{ border: "none", borderTop: "1px solid var(--panel-border)", margin: 0 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>Անվտանգության մակարդակ</span>
                  <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>Բարձրացնել անձնական տվյալների պաշտպանությունը</span>
                </div>
                <hd-checkbox data-size="18px" />
              </div>
              <hr style={{ border: "none", borderTop: "1px solid var(--panel-border)", margin: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>Մոդերացիայի արագություն</span>
                <hd-slider min="1" max="5" value="3" data-width="100%" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
