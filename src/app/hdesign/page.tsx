"use client";

import Link from "next/link";

export default function HDesignGeneralPage() {
  return (
    <main className="shell" style={{ marginTop: "140px", minHeight: "80vh" }}>
      {/* Hero header */}
      <div 
        className="about-section-shell-width" 
        style={{ 
          background: "var(--panel)", 
          borderRadius: "24px", 
          overflow: "hidden", 
          position: "relative",
          padding: "60px 40px",
          border: "1px solid var(--panel-border)",
          boxShadow: "var(--shadow)",
          marginBottom: "48px"
        }}
      >
        
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", gap: "16px" }}>
          <h1 style={{ fontSize: "2.8rem", fontWeight: "900", color: "var(--text)", margin: 0 }}>HDesign Դիզայն Համակարգ</h1>
          <p style={{ color: "var(--text)", opacity: 0.8, fontSize: "1.15rem", maxWidth: "700px", lineHeight: "1.6", margin: 0 }}>
            HDesign-ը երկրաչափական, գծային և մինիմալիստական դիզայն-համակարգ է, որը ստեղծված է ճարտարապետական ճշգրտության և վեբ-ինտերֆեյսների ներդաշնակության սկզբունքներով։
          </p>
          
          <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
            <Link href="/hdesign/docs" style={{ textDecoration: "none" }}>
              <hd-button data-width="200px" data-height="50px" data-thickness="2px">
                Կարդալ Փաստաթղթերը
              </hd-button>
            </Link>
            <Link href="/hdesign/samples" style={{ textDecoration: "none" }}>
              <hd-button data-width="200px" data-height="50px" data-thickness="2px" style={{ color: "var(--text)", background: "transparent" }}>
                Փորձարկել Սեմփլները
              </hd-button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of Design Tokens */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "40px" }} className="hdesign-tokens-grid">
        
        {/* Left Column: Philosophies & Principles */}
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          
          <div>
            <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text)", margin: "0 0 16px 0" }}>Հիմնական Սկզբունքները</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <span className="icon-Info" style={{ fontSize: "1.5rem", color: "var(--text)", marginTop: "4px" }} />
                <div>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: "0 0 6px 0" }}>Երկրաչափական Կառուցվածք</h4>
                  <p style={{ margin: 0, opacity: 0.8, fontSize: "0.95rem", lineHeight: "1.6" }}>
                    Բոլոր տարրերը հիմնված են խիստ մոդուլային ցանցի վրա: Կլորացումների և եզրագծերի հաստության հարաբերակցությունները հետևում են կայուն համամասնությունների:
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <span className="icon-Cursor" style={{ fontSize: "1.5rem", color: "var(--text)", marginTop: "4px" }} />
                <div>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: "0 0 6px 0" }}>Գծային Ոճ</h4>
                  <p style={{ margin: 0, opacity: 0.8, fontSize: "0.95rem", lineHeight: "1.6" }}>
                    HDesign-ը խուսափում է ավելորդ ստվերներից և ծավալներից: Կոմպոնենտները սահմանազատվում են բարակ և հստակ գծերով, որոնք փոփոխում են իրենց ոճն ու գույնը ըստ իրավիճակի:
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <span className="icon-Settings" style={{ fontSize: "1.5rem", color: "var(--text)", marginTop: "4px" }} />
                <div>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: "0 0 6px 0" }}>Բարձր Թեմավորում</h4>
                  <p style={{ margin: 0, opacity: 0.8, fontSize: "0.95rem", lineHeight: "1.6" }}>
                    Համակարգն աջակցում է 3 հիմնական գունային թեմաների՝ Բաց (Light), Մութ (Dark) և Բրենդային Կանաչ (Green)՝ յուրաքանչյուրի համար հատուկ մշակված հակադրությամբ:
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text)", margin: "0 0 16px 0" }}>Տառատեսակային Համակարգ</h2>
            <div style={{ background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: "20px", padding: "32px", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>ՀԻՄՆԱԿԱՆ ՏԱՌԱՏԵՍԱԿ (BRAND FONT)</span>
                  <div style={{ fontSize: "2rem", fontWeight: "900", fontFamily: "Calibri, sans-serif" }}>Calibri</div>
                </div>
                <hr style={{ border: "none", borderTop: "1px solid var(--panel-border)", margin: "8px 0" }} />
                <div>
                  <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>ՏԵՔՍՏԵՐ ԵՒ ՊԻՏԱԿՆԵՐ (FALLBACK)</span>
                  <div style={{ fontSize: "1.2rem", fontWeight: "400", fontFamily: "Calibri, sans-serif" }}>Calibri, sans-serif</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Theme Swatch Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          <div style={{ background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: "20px", padding: "32px", boxShadow: "var(--shadow)" }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", margin: "0 0 20px 0" }}>Գունային Տոկեններ</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "600" }}>Ֆոն (--bg)</span>
                <div style={{ width: "24px", height: "24px", borderRadius: "6px", backgroundColor: "var(--bg)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "600" }}>Վահանակ (--panel)</span>
                <div style={{ width: "24px", height: "24px", borderRadius: "6px", backgroundColor: "var(--panel)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "600" }}>Տեքստ (--text)</span>
                <div style={{ width: "24px", height: "24px", borderRadius: "6px", backgroundColor: "var(--text)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "600" }}>Ակտիվ Շեշտ (--accent)</span>
                <div style={{ width: "24px", height: "24px", borderRadius: "6px", backgroundColor: "var(--accent)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
            </div>
          </div>

          <div style={{ background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: "20px", padding: "32px", boxShadow: "var(--shadow)" }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", margin: "0 0 20px 0" }}>Չափսային տոկեններ</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Եզրագծի հաստություն</span>
                <span style={{ fontWeight: "bold" }}>var(--line-thickness, 3px)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Կլորացման շառավիղ</span>
                <span style={{ fontWeight: "bold" }}>var(--border-radius, 12px)</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
