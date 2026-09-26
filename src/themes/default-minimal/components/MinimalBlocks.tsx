"use client";

import React from "react";
import Link from "next/link";
import { BlockItem } from "@/lib/themeTypes";

interface MinimalBlockProps {
  block: BlockItem;
  instanceData?: Record<string, any>;
  isBuilderMode?: boolean;
}

/**
 * Helper to interpolate {{key}} placeholders with dynamic instance data
 */
function interpolate(text: any, data?: Record<string, any>): any {
  if (typeof text !== "string" || !data) return text;
  return text.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (_, key) => {
    return data[key] !== undefined ? String(data[key]) : "";
  });
}

function interpolateSettings(settings: Record<string, any>, data?: Record<string, any>): Record<string, any> {
  if (!data || !settings) return settings;
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(settings)) {
    if (typeof v === "string") {
      result[k] = interpolate(v, data);
    } else if (Array.isArray(v)) {
      result[k] = v.map((item) => (typeof item === "object" ? interpolateSettings(item, data) : interpolate(item, data)));
    } else if (typeof v === "object" && v !== null) {
      result[k] = interpolateSettings(v, data);
    } else {
      result[k] = v;
    }
  }
  return result;
}

export function MinimalBlockRenderer({ block, instanceData, isBuilderMode }: MinimalBlockProps) {
  if (block.hidden) return null;

  const rawSettings = block.settings || {};
  const settings = interpolateSettings(rawSettings, instanceData);
  const blockId = block.id || `block-${block.type}`;

  switch (block.type) {
    case "hero": {
      return (
        <section
          id={blockId}
          data-block-id={blockId}
          data-block-type="hero"
          className="hd-builder-editable-block minimal-section"
        >
          <div className="minimal-container" style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ display: "inline-block", marginBottom: "16px", padding: "4px 12px", background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: "20px", fontSize: "12px", fontWeight: 600, color: "var(--theme-text-muted)" }}>
              HDesign Minimal Edition
            </div>
            <h1
              data-editable-key="line1"
              className="minimal-section-title"
              style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 800, margin: "0 auto 12px", maxWidth: "900px", lineHeight: 1.1 }}
            >
              {settings.line1 || "ՍՏԵՂԾԱ"} {settings.line2 || "ԵՒ ԳՈՐԾՆԱԿԱՆ"}
            </h1>
            <p
              data-editable-key="quote"
              className="minimal-section-subtitle"
              style={{ margin: "20px auto 32px", fontStyle: "italic", fontSize: "1.2rem", maxWidth: "700px" }}
            >
              {settings.quote || "«Ամեն ոք չի կարող մեծ վարպետ դառնալ, բայց մեծ վարպետը կարող է գալ ամենուրից»"}
            </p>
            {settings.signature_url && (
              <div style={{ marginTop: "24px" }}>
                <img
                  src={settings.signature_url}
                  alt="Signature"
                  style={{ maxHeight: "60px", margin: "0 auto", opacity: 0.8 }}
                />
              </div>
            )}
          </div>
        </section>
      );
    }

    case "branding": {
      return (
        <section
          id={blockId}
          data-block-id={blockId}
          data-block-type="branding"
          className="hd-builder-editable-block minimal-section"
        >
          <div className="minimal-container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "32px", borderBottom: "1px solid var(--theme-border)", paddingBottom: "16px" }}>
              <h2 data-editable-key="title" className="minimal-section-title" style={{ margin: 0 }}>
                {settings.title || "ԲՐԵՆԴԻՆԳ"}
              </h2>
              <span data-editable-key="title_en" style={{ fontSize: "0.875rem", color: "var(--theme-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                {settings.title_en || "Branding Cases"}
              </span>
            </div>
            <div className="minimal-grid">
              <div className="minimal-card">
                <div style={{ height: "200px", background: "#f3f4f6", borderRadius: "4px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontWeight: 600 }}>
                  Pasta Branding Case
                </div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "1.2rem", fontWeight: 700 }}>Pasta House Identity</h3>
                <p style={{ margin: 0, color: "var(--theme-text-muted)", fontSize: "0.9rem" }}>Հայկական ռեստորանի բրենդային ոճ և փաթեթավորում:</p>
              </div>
              <div className="minimal-card">
                <div style={{ height: "200px", background: "#f3f4f6", borderRadius: "4px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontWeight: 600 }}>
                  11... Font System
                </div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "1.2rem", fontWeight: 700 }}>Project 11 Typography</h3>
                <p style={{ margin: 0, color: "var(--theme-text-muted)", fontSize: "0.9rem" }}>Յուրահատուկ հայերեն տառատեսակի ստեղծում և կիրառություն:</p>
              </div>
              <div className="minimal-card">
                <div style={{ height: "200px", background: "#f3f4f6", borderRadius: "4px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontWeight: 600 }}>
                  Brand Identity 2026
                </div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "1.2rem", fontWeight: 700 }}>Minimal Corporate Identity</h3>
                <p style={{ margin: 0, color: "var(--theme-text-muted)", fontSize: "0.9rem" }}>Բրենդավորման ամբողջական փաթեթ միջազգային ստանդարտներով:</p>
              </div>
            </div>
          </div>
        </section>
      );
    }

    case "about": {
      return (
        <section
          id={blockId}
          data-block-id={blockId}
          data-block-type="about"
          className="hd-builder-editable-block minimal-section"
        >
          <div className="minimal-container">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "48px", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--theme-text-muted)" }}>
                  {settings.title_en || "About Studio"}
                </span>
                <h2 data-editable-key="title" className="minimal-section-title" style={{ marginTop: "8px" }}>
                  {settings.title || "Ստուդիայի Մասին"}
                </h2>
                <h3 data-editable-key="author_name" style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--theme-text)", margin: "16px 0 4px" }}>
                  {settings.author_name || "Հրանտ Հակոբյան"}
                </h3>
                <div data-editable-key="author_role" style={{ fontSize: "0.9rem", color: "var(--theme-text-muted)", marginBottom: "20px" }}>
                  {settings.author_role || "Հիմնադիր & Lead Designer"}
                </div>
                <p data-editable-key="bio" style={{ lineHeight: 1.7, color: "var(--theme-text-muted)", fontSize: "1rem", marginBottom: "24px" }}>
                  {settings.bio || "Ողջույն, ես Հրանտ Հակոբյանն եմ և Ճարտարապետության և շինարարության Հայաստանի Ազգային Համալսարանի ուսանող եմ:"}
                </p>
                <Link href={settings.btn_url || "/about"} className="minimal-button">
                  <span data-editable-key="btn_text">{settings.btn_text || "Ավելին"}</span>
                </Link>
              </div>
              <div style={{ textAlign: "center" }}>
                <img
                  src={settings.image_url || "/profile_hrant.jpg"}
                  alt={settings.author_name || "About"}
                  style={{ width: "100%", maxWidth: "380px", borderRadius: "12px", border: "1px solid var(--theme-border)", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.05)" }}
                />
              </div>
            </div>
          </div>
        </section>
      );
    }

    case "works": {
      return (
        <section
          id={blockId}
          data-block-id={blockId}
          data-block-type="works"
          className="hd-builder-editable-block minimal-section"
        >
          <div className="minimal-container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "32px" }}>
              <h2 data-editable-key="title" className="minimal-section-title" style={{ margin: 0 }}>
                {settings.title || "Այլ Աշխատանքներ"}
              </h2>
              <Link href={settings.btn_url || "/works"} className="minimal-button minimal-button-outline">
                <span data-editable-key="btn_text">{settings.btn_text || "Դիտել Բոլորը"}</span>
              </Link>
            </div>
            <div className="minimal-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="minimal-card">
                  <div style={{ height: "160px", background: "#f1f5f9", borderRadius: "6px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                    Work Sample #{i}
                  </div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "1.1rem" }}>Portfolio Project {i}</h4>
                  <span style={{ fontSize: "0.8rem", color: "var(--theme-text-muted)" }}>UI/UX & Branding</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "video": {
      return (
        <section
          id={blockId}
          data-block-id={blockId}
          data-block-type="video"
          className="hd-builder-editable-block minimal-section"
        >
          <div className="minimal-container" style={{ textAlign: "center" }}>
            <h2 data-editable-key="title" className="minimal-section-title">
              {settings.title || "Պրոմո Տեսանյութ"}
            </h2>
            <p data-editable-key="subtitle" className="minimal-section-subtitle" style={{ margin: "0 auto 32px" }}>
              {settings.subtitle || "Ծանոթացեք HDesign ստուդիայի մինիմալիստական աշխատանքային գործընթացին:"}
            </p>
            <div style={{ maxWidth: "800px", margin: "0 auto", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--theme-border)", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.08)" }}>
              <video
                controls
                poster={settings.video_poster || "/brandings/pasta/pasta1.png"}
                style={{ width: "100%", display: "block" }}
              >
                <source src={settings.video_url || "https://api.hakobian.am/libs/v1/promo/promo.mp4"} type="video/mp4" />
                Ձեր բրաուզերը չի աջակցում տեսանյութերի նվագարկումը:
              </video>
            </div>
          </div>
        </section>
      );
    }

    case "playground": {
      return (
        <section
          id={blockId}
          data-block-id={blockId}
          data-block-type="playground"
          className="hd-builder-editable-block minimal-section"
        >
          <div className="minimal-container">
            <h2 data-editable-key="title" className="minimal-section-title">
              {settings.title || "Տառատեսակների Խաղահրապարակ"}
            </h2>
            <p data-editable-key="subtitle" className="minimal-section-subtitle">
              {settings.subtitle || "Փորձարկեք հայերեն տառատեսակները տարբեր չափսերով և ոճերով:"}
            </p>
            <div style={{ background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: "8px", padding: "24px" }}>
              <div
                contentEditable={true}
                suppressContentEditableWarning={true}
                style={{ fontSize: "2rem", minHeight: "100px", outline: "none", color: "var(--theme-text)" }}
              >
                Հայերեն Գեղեցիկ Տեքստ — 1234567890 (Փորձարկեք այստեղ)
              </div>
            </div>
          </div>
        </section>
      );
    }

    case "icons": {
      return (
        <section
          id={blockId}
          data-block-id={blockId}
          data-block-type="icons"
          className="hd-builder-editable-block minimal-section"
        >
          <div className="minimal-container">
            <h2 data-editable-key="title" className="minimal-section-title">
              {settings.title || "Պատկերակների Համակարգ"}
            </h2>
            <p data-editable-key="subtitle" className="minimal-section-subtitle">
              {settings.subtitle || "Հստակ երկրաչափական SVG պատկերակների հավաքածու:"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "16px" }}>
              {["✦", "❖", "▲", "◆", "●", "◈", "◉", "■"].map((icon, idx) => (
                <div key={idx} style={{ height: "80px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: "8px", fontSize: "1.5rem" }}>
                  {icon}
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "glyphs": {
      return (
        <section
          id={blockId}
          data-block-id={blockId}
          data-block-type="glyphs"
          className="hd-builder-editable-block minimal-section"
        >
          <div className="minimal-container">
            <h2 data-editable-key="title" className="minimal-section-title">
              {settings.title || "Հայերեն Գրանշաններ (Glyphs)"}
            </h2>
            <p data-editable-key="subtitle" className="minimal-section-subtitle">
              {settings.subtitle || "Հայկական կցագրեր և հատուկ նշաններ՝ ﬓ, ﬔ, ﬕ, ֏:"}
            </p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {["ﬓ", "ﬔ", "ﬕ", "֏", "՟", "«", "»", "—"].map((g, idx) => (
                <div key={idx} style={{ padding: "16px 28px", background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: "8px", fontSize: "1.8rem", fontWeight: 700 }}>
                  {g}
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "features": {
      const items = settings.items || [
        { title: "Մաքուր Կոդ", desc: "Ժամանակակից Next.js և React ճարտարապետություն:" },
        { title: "Արագագործություն", desc: "0ms delay-ով տեսողական խմբագրիչ և թեթև ոճեր:" },
        { title: "Supabase Սինխրոն", desc: "Ամպային բազայի հետ ուղիղ կապ և իրական ժամանակում թարմացում:" }
      ];
      return (
        <section
          id={blockId}
          data-block-id={blockId}
          data-block-type="features"
          className="hd-builder-editable-block minimal-section"
        >
          <div className="minimal-container">
            <h2 data-editable-key="title" className="minimal-section-title">
              {settings.title || "Հնարավորություններ"}
            </h2>
            <p data-editable-key="subtitle" className="minimal-section-subtitle">
              {settings.subtitle || "Ինչու է մեր հարթակը առաջատար տեսողական էջերի կառուցման մեջ:"}
            </p>
            <div className="minimal-grid">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="minimal-card">
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "1.2rem", fontWeight: 700 }}>{item.title}</h3>
                  <p style={{ margin: 0, color: "var(--theme-text-muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "text": {
      return (
        <section
          id={blockId}
          data-block-id={blockId}
          data-block-type="text"
          className="hd-builder-editable-block minimal-section"
        >
          <div className="minimal-container" style={{ maxWidth: "800px" }}>
            {settings.title && (
              <h2 data-editable-key="title" className="minimal-section-title">
                {settings.title}
              </h2>
            )}
            <div
              data-editable-key="content"
              style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "var(--theme-text)" }}
            >
              {settings.content || "Տեքստային բլոկի բովանդակություն:"}
            </div>
          </div>
        </section>
      );
    }

    case "contact": {
      return (
        <section
          id={blockId}
          data-block-id={blockId}
          data-block-type="contact"
          className="hd-builder-editable-block minimal-section"
        >
          <div className="minimal-container" style={{ maxWidth: "700px" }}>
            <h2 data-editable-key="title" className="minimal-section-title" style={{ textAlign: "center" }}>
              {settings.title || "Կապվեք Մեզ Հետ"}
            </h2>
            <p data-editable-key="subtitle" className="minimal-section-subtitle" style={{ textAlign: "center", margin: "0 auto 32px" }}>
              {settings.subtitle || "Գրեք մեզ Ձեր հարցերի կամ նախագծերի վերաբերյալ:"}
            </p>
            <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input
                type="text"
                placeholder="Ձեր Անունը"
                style={{ padding: "12px 16px", borderRadius: "var(--theme-radius)", border: "1px solid var(--theme-border)", background: "var(--theme-surface)", fontSize: "1rem" }}
              />
              <input
                type="email"
                placeholder="Էլ. Հասցե"
                style={{ padding: "12px 16px", borderRadius: "var(--theme-radius)", border: "1px solid var(--theme-border)", background: "var(--theme-surface)", fontSize: "1rem" }}
              />
              <textarea
                rows={4}
                placeholder="Հաղորդագրություն"
                style={{ padding: "12px 16px", borderRadius: "var(--theme-radius)", border: "1px solid var(--theme-border)", background: "var(--theme-surface)", fontSize: "1rem" }}
              />
              <button type="submit" className="minimal-button" style={{ alignSelf: "flex-start" }}>
                Ուղարկել Հաղորդագրությունը
              </button>
            </form>
          </div>
        </section>
      );
    }

    case "system_status": {
      const statusCode = settings.status_code || "404";
      const is500 = statusCode === "500";
      return (
        <section
          id={blockId}
          data-block-id={blockId}
          data-block-type="system_status"
          className="hd-builder-editable-block minimal-section"
        >
          <div className="minimal-container" style={{ textAlign: "center", padding: "100px 24px" }}>
            <div
              data-editable-key="status_code"
              style={{ fontSize: "7rem", fontWeight: 900, letterSpacing: "-0.05em", color: is500 ? "#ef4444" : "var(--theme-accent)", lineHeight: 1, marginBottom: "16px" }}
            >
              {statusCode}
            </div>
            <h1 data-editable-key="title" className="minimal-section-title" style={{ margin: "0 auto 12px" }}>
              {settings.title || (is500 ? "Սերվերի Սխալ (500)" : "Էջը Չի Գտնվել (404)")}
            </h1>
            <p data-editable-key="subtitle" className="minimal-section-subtitle" style={{ margin: "0 auto 32px" }}>
              {settings.subtitle || "Հայցվող էջը գոյություն չունի կամ տեղափոխվել է:"}
            </p>
            <Link href={settings.btn_url || "/"} className="minimal-button">
              <span data-editable-key="btn_text">{settings.btn_text || "Վերադառնալ Գլխավոր Էջ"}</span>
            </Link>
          </div>
        </section>
      );
    }

    case "container": {
      const columns = settings.columns || 2;
      return (
        <section
          id={blockId}
          data-block-id={blockId}
          data-block-type="container"
          className="hd-builder-editable-block minimal-section"
        >
          <div className="minimal-container">
            {settings.title && (
              <h2 data-editable-key="title" className="minimal-section-title">
                {settings.title}
              </h2>
            )}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: settings.gap || "24px" }}>
              {block.children && block.children.length > 0 ? (
                block.children.map((child) => (
                  <MinimalBlockRenderer key={child.id} block={child} instanceData={instanceData} isBuilderMode={isBuilderMode} />
                ))
              ) : (
                <>
                  <div className="minimal-card">Սյուն 1 (Container Column)</div>
                  <div className="minimal-card">Սյուն 2 (Container Column)</div>
                </>
              )}
            </div>
          </div>
        </section>
      );
    }

    case "blog_post":
    case "product_details": {
      return (
        <section
          id={blockId}
          data-block-id={blockId}
          data-block-type={block.type}
          className="hd-builder-editable-block minimal-section"
        >
          <div className="minimal-container" style={{ maxWidth: "800px" }}>
            <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--theme-text-muted)" }}>
              {settings.category || "Դինամիկ Էջ (Master Template)"}
            </span>
            <h1 data-editable-key="title" className="minimal-section-title" style={{ marginTop: "8px" }}>
              {settings.title || "Վերնագիր (Placeholder)"}
            </h1>
            <div style={{ display: "flex", gap: "16px", color: "var(--theme-text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
              <span>Հեղինակ՝ {settings.author || "HDesign"}</span>
              <span>•</span>
              <span>Ամսաթիվ՝ {settings.date || "2026-09-26"}</span>
            </div>
            {settings.cover_image && (
              <div style={{ marginBottom: "32px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--theme-border)" }}>
                <img src={settings.cover_image} alt={settings.title} style={{ width: "100%", height: "auto" }} />
              </div>
            )}
            <div data-editable-key="content" style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "var(--theme-text)" }}>
              {settings.content || "Դինամիկ էջի հիմնական բովանդակություն:"}
            </div>
          </div>
        </section>
      );
    }

    default: {
      return (
        <div
          id={blockId}
          data-block-id={blockId}
          data-block-type={block.type}
          className="hd-builder-editable-block minimal-section"
        >
          <div className="minimal-container">
            <div className="minimal-card">
              <span style={{ fontSize: "0.8rem", color: "var(--theme-text-muted)", textTransform: "uppercase" }}>Բլոկ՝ {block.type}</span>
              <h3 style={{ margin: "8px 0" }}>{settings.title || `Block #${blockId}`}</h3>
              <p style={{ margin: 0, color: "var(--theme-text-muted)" }}>{settings.description || "Մինիմալիստական բլոկի ընդհանուր տեսք:"}</p>
            </div>
          </div>
        </div>
      );
    }
  }
}
