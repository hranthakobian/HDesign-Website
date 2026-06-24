"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { brandingCases } from "@/lib/brandingData";

export default function BrandingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const work = brandingCases.find((item) => item.id === id);

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
          backgroundColor: work.color,
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden"
        }}
      >
        <img 
          src={work.image} 
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
            {work.tagline}
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
          {/* Left Column: Description & Concepts */}
          <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
            <div>
              <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text)", margin: "0 0 16px 0" }}>Նախագծի Մասին</h2>
              <p style={{ fontSize: "1.08rem", lineHeight: "1.75", opacity: 0.9, margin: 0 }}>
                {work.description}
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text)", margin: "0 0 16px 0" }}>Կոնցեպտուալ Լուծում</h2>
              <p style={{ fontSize: "1.08rem", lineHeight: "1.75", opacity: 0.9, margin: 0 }}>
                {work.concept}
              </p>
            </div>
            
            {/* Visual Grid Mockup Showcase */}
            <div style={{ marginTop: "20px" }}>
              <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text)", margin: "0 0 24px 0" }}>Ցուցադրում</h2>
              <div 
                style={{ 
                  width: "100%", 
                  borderRadius: "20px", 
                  overflow: "hidden", 
                  boxShadow: "var(--shadow)",
                  background: "var(--panel)",
                  border: "1px solid var(--panel-border)",
                  padding: "40px",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "350px"
                }}
              >
                {/* Clean CSS Showcase layout simulating stationery or products */}
                <div 
                  style={{ 
                    position: "relative", 
                    width: "100%", 
                    maxWidth: "500px", 
                    height: "280px", 
                    borderRadius: "16px", 
                    backgroundColor: work.color, 
                    boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "30px",
                    boxSizing: "border-box"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ color: "#ffffff", fontWeight: "bold", fontSize: "1.5rem", letterSpacing: "1px" }}>{work.title}</div>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
                  </div>
                  
                  {/* Decorative card stripes */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "70%" }}>
                    <div style={{ height: "4px", background: "rgba(255,255,255,0.2)", borderRadius: "2px" }} />
                    <div style={{ height: "4px", background: "rgba(255,255,255,0.2)", borderRadius: "2px", width: "85%" }} />
                    <div style={{ height: "4px", background: "rgba(255,255,255,0.2)", borderRadius: "2px", width: "50%" }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", color: "#ffffff", opacity: 0.7, fontSize: "0.75rem" }}>
                    <div>EST. {new Date().getFullYear()}</div>
                    <div>HDesign Studio</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Spec metadata card */}
          <div 
            style={{ 
              background: "var(--panel)", 
              border: "1px solid var(--panel-border)", 
              borderRadius: "20px", 
              padding: "32px", 
              boxShadow: "var(--shadow)",
              display: "flex", 
              flexDirection: "column", 
              gap: "28px",
              position: "sticky",
              top: "120px" 
            }}
            className="case-specs-panel"
          >
            <div>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px 0", opacity: 0.6 }}>Տիպ</h4>
              <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text)" }}>Բրենդավորում և ոճ</span>
            </div>

            <div>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px 0", opacity: 0.6 }}>Տառատեսակներ</h4>
              <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text)" }}>{work.typography}</span>
            </div>

            <div>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 12px 0", opacity: 0.6 }}>Գունապնակ</h4>
              <div style={{ display: "flex", gap: "10px" }}>
                {work.colors.map((colorVal, idx) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: colorVal, border: "1px solid rgba(255,255,255,0.15)" }} title={colorVal} />
                    <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{colorVal}</span>
                  </div>
                ))}
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--panel-border)", margin: "8px 0" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Link href="/works" style={{ textDecoration: "none" }}>
                <hd-button data-width="100%" data-height="48px" data-thickness="2px">
                  Հետ դեպի ցանկ
                </hd-button>
              </Link>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
