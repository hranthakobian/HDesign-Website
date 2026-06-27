"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { brandingCases as staticCases } from "@/lib/brandingData";

/* ─── Types ─────────────────────────────────────────── */
type BlockType = "text" | "image" | "embed" | "color_palette" | "typography_showcase";

interface TextBlock       { type: "text";                title_am: string; title_en: string; content_am: string; content_en: string; }
interface ImageBlock      { type: "image";               image_url: string; caption_am: string; caption_en: string; fullWidth: boolean; }
interface EmbedBlock      { type: "embed";               embed_url: string; }
interface PaletteBlock    { type: "color_palette";       colors: string[]; }
interface TypoBlock       { type: "typography_showcase"; fonts: string[]; previewText: string; }

type CaseBlock = TextBlock | ImageBlock | EmbedBlock | PaletteBlock | TypoBlock;

interface Case {
  id: string; title: string; subtitle: string; bg: string;
  image_url: string; details: string; category: string; client: string; year: string;
}

/* ─── Helpers ────────────────────────────────────────── */
const GRADIENT_PRESETS = [
  { name: "Ocean Dark",   value: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)" },
  { name: "Forest Night", value: "linear-gradient(135deg,#0a1f0f 0%,#1a3d24 100%)" },
  { name: "Rose Gold",    value: "linear-gradient(135deg,#3d0c1a 0%,#7a1e40 100%)" },
  { name: "Violet Dusk",  value: "linear-gradient(135deg,#1a0d2e 0%,#4a1a6e 100%)" },
  { name: "Ember",        value: "linear-gradient(135deg,#2d1000 0%,#7a3000 100%)" },
];

function parseBg(bgString: string) {
  const parts = (bgString || "").split(" | ");
  const bg = parts[0] || GRADIENT_PRESETS[0].value;
  let overlay = true;
  let positionY = 50;
  let height = 44;

  for (let i = 1; i < parts.length; i++) {
    const [k, v] = parts[i].split("=");
    if (k === "overlay") overlay = v === "true";
    if (k === "position_y") positionY = parseInt(v) || 50;
    if (k === "height") height = parseInt(v) || 44;
  }

  return { bg, overlay, positionY, height };
}

function serializeBg(bg: string, overlay: boolean, positionY: number, height: number) {
  return `${bg} | overlay=${overlay} | position_y=${positionY} | height=${height}`;
}

function makeBlock(type: BlockType): CaseBlock {
  if (type === "text")                return { type, title_am: "Նոր Բաժին", title_en: "New Section", content_am: "Բովանդակություն...", content_en: "Content here..." };
  if (type === "image")               return { type, image_url: "", caption_am: "", caption_en: "", fullWidth: true };
  if (type === "embed")               return { type, embed_url: "" };
  if (type === "color_palette")       return { type, colors: ["#0f172a", "#ffffff", "#00ffcc"] };
  if (type === "typography_showcase") return { type, fonts: ["Outfit"], previewText: "Հրանտ Հակոբյան Դիզայն 2026" };
  return { type: "text", title_am: "", title_en: "", content_am: "", content_en: "" };
}

/* ─── Editable Text Component ────────────────────────── */
function Editable({
  value, onChange, tag = "p", style = {}
}: {
  value: string; onChange: (v: string) => void;
  tag?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const [editing, setEditing] = useState(false);

  const Tag = tag as any;

  return (
    <Tag
      ref={ref}
      contentEditable={editing}
      suppressContentEditableWarning
      onClick={() => { setEditing(true); ref.current?.focus(); }}
      onBlur={() => {
        setEditing(false);
        onChange(ref.current?.innerText ?? "");
      }}
      style={{
        ...style,
        outline: editing ? "2px solid rgba(0,255,204,0.6)" : "2px solid transparent",
        borderRadius: "6px",
        padding: editing ? "4px 6px" : "0",
        cursor: editing ? "text" : "pointer",
        transition: "outline 0.2s",
        minWidth: "30px",
      }}
    >
      {value}
    </Tag>
  );
}

/* ─── Main Page ──────────────────────────────────────── */
export default function CaseEditor() {
  const params        = useParams();
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const id            = params?.id as string;
  const isNew         = searchParams?.get("new") === "true";

  const [token,    setToken]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [uploading,setUploading]= useState(false);
  const [selected, setSelected] = useState<number | null>(null); // selected block index

  const [form, setForm] = useState<Case>({
    id, title: "", subtitle: "", bg: GRADIENT_PRESETS[0].value,
    image_url: "", details: "[]", category: "Branding", client: "", year: new Date().getFullYear().toString()
  });
  const [blocks, setBlocks] = useState<CaseBlock[]>([]);

  /* ─ Drag & Drop ─ */
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below' | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const threshold = rect.height / 2;
    if (relativeY < relativeY) {} // check boundary
    if (relativeY < threshold) {
      setDragOverIdx(index);
      setDragOverPosition("above");
    } else {
      setDragOverIdx(index);
      setDragOverPosition("below");
    }
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
    setDragOverPosition(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    
    let targetIndex = index;
    if (dragOverPosition === "below") {
      targetIndex = index + 1;
    }

    const list = [...blocks];
    const [draggedItem] = list.splice(draggedIdx, 1);
    
    let insertAt = targetIndex;
    if (draggedIdx < targetIndex) {
      insertAt = targetIndex - 1;
    }
    
    list.splice(insertAt, 0, draggedItem);
    setBlocks(list);
    
    setDraggedIdx(null);
    setDragOverIdx(null);
    setDragOverPosition(null);
  };

  /* ─ Auth ─ */
  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("hdesign_admin_token") : null;
    if (!t) { router.push("/admin"); return; }
    setToken(t);
    load(t);
  }, [id]);

  /* ─ Theme ─ */
  useEffect(() => {
    const savedTheme = localStorage.getItem('hdesign-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      document.documentElement.setAttribute('data-color', savedTheme === 'light' ? '#083f39' : '#ffffff');
      document.documentElement.classList.remove('light', 'dark', 'green');
      document.documentElement.classList.add(savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.setAttribute('data-color', '#083f39');
      document.documentElement.classList.remove('light', 'dark', 'green');
      document.documentElement.classList.add('light');
    }
  }, []);

  /* ─ Load ─ */
  async function load(tok: string) {
    try {
      const data: any[] = await fetch("/api/cases").then(r => r.json());
      const found = data?.find(c => c.id === id);
      if (found) {
        setForm({ ...found });
        parseB(found.details || "[]");
      } else {
        const st = staticCases.find(c => c.id === id);
        if (st) {
          setForm({ id: st.id, title: st.title, subtitle: st.tagline, bg: st.color, image_url: st.image, details: "[]", category: "Branding", client: "HDesign Studio", year: "2026" });
          setBlocks([
            { type: "text",                title_am: "Նախագծի Մասին",    title_en: "About",      content_am: st.description, content_en: st.description },
            { type: "text",                title_am: "Կոնցեպտ",          title_en: "Concept",    content_am: st.concept,     content_en: st.concept },
            { type: "color_palette",       colors: st.colors },
            { type: "typography_showcase", fonts: [st.typography], previewText: "Հրանտ Հակոբյան Դիզայն" },
          ]);
        } else if (isNew) {
          setBlocks([{ type: "text", title_am: "Նախագծի Մասին", title_en: "About the Project", content_am: "Այստեղ գրեք նախագծի մանրամասն նկարագրությունը...", content_en: "Write the project description here..." }]);
        }
      }
    } catch {}
    setLoading(false);
  }

  function parseB(s: string) {
    try { if (s.startsWith("[")) { setBlocks(JSON.parse(s)); return; } } catch {}
    setBlocks([{ type: "text", title_am: "Նախագծի Մասին", title_en: "About", content_am: s, content_en: s }]);
  }

  /* ─ Block CRUD ─ */
  const upd = (i: number, b: CaseBlock) => setBlocks(p => p.map((x, j) => j === i ? b : x));
  const del = (i: number) => { setBlocks(p => p.filter((_, j) => j !== i)); if (selected === i) setSelected(null); };
  const mov = (i: number, d: "up" | "down") => setBlocks(p => {
    const a = [...p], j = d === "up" ? i - 1 : i + 1;
    if (j >= 0 && j < a.length) { const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  });
  const add = (type: BlockType) => { setBlocks(p => [...p, makeBlock(type)]); setSelected(blocks.length); };

  /* ─ Upload ─ */
  async function upload(file: File): Promise<string | null> {
    if (!token) return null;
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      const r = await fetch("/api/upload", { method: "POST", headers: { Authorization: token }, body: fd });
      const d = await r.json(); return r.ok ? d.url : null;
    } finally { setUploading(false); }
  }

  /* ─ Save ─ */
  async function save() {
    if (!token || !form.title || !form.subtitle) {
      alert("Խնդրում ենք լրացնել վերնագիրը և ենթավերնագիրը:");
      return;
    }
    setSaving(true);
    try {
      const url = isNew ? "/api/cases" : `/api/cases/${id}`;
      const r = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({ ...form, details: JSON.stringify(blocks) }),
      });
      
      let d;
      try {
        d = await r.json();
      } catch (jsonErr) {
        throw new Error(`Server returned status ${r.status}`);
      }

      if (r.ok) {
        alert("Պահպանվեց!");
        if (isNew) {
          router.replace(`/admin/editor/case/${form.id}`);
        }
      } else {
        alert("Սխալ՝ " + (d?.error || "Չհաջողվեց պահպանել"));
      }
    } catch (err: any) {
      alert("Կապի սխալ: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div style={{ background: "var(--bg)", color: "var(--text)", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
      <span style={{ fontSize: "1.2rem", opacity: 0.7 }}>Բեռնվում է WYSIWYG խմբագրիչը...</span>
    </div>
  );

  /* ─── RENDER ─────────────────────────────────────────── */
  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Topbar ── */}
      <div style={{ height: 58, background: "var(--panel)", borderBottom: "1px solid var(--panel-border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", position: "sticky", top: 0, zIndex: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/admin?tab=cases" style={{ textDecoration: "none" }}>
            <button style={{ padding: "6px 14px", background: "var(--btn-bg)", border: "1px solid var(--panel-border)", borderRadius: 8, color: "var(--text)", cursor: "pointer", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 6 }}>
              ← Ադմին
            </button>
          </Link>
          <div style={{ width: 1, height: 20, background: "var(--panel-border)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} />
            <span style={{ fontWeight: 700, fontSize: "0.92rem" }}>
              {isNew ? "Նոր Քեյս" : form.title || "Խմբագրել Քեյս"}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href={`/works/${id}`} target="_blank" style={{ textDecoration: "none" }}>
            <hd-button data-width="100px" data-height="34px" data-thickness="1px" style={{ background: "transparent", color: "var(--muted)" }}>
              Տեսնել →
            </hd-button>
          </Link>
          <hd-button onClick={save} disabled={saving} data-width="120px" data-height="34px" data-thickness="2px">
            {saving ? "Պահպանվում..." : "Պահպանել"}
          </hd-button>
        </div>
      </div>

      {/* ── Split Editor ── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", flex: 1, minHeight: "calc(100vh - 58px)", overflow: "hidden" }}>

        {/* ════════════════════════════════════════
            LEFT: LIVE PREVIEW  (3/4 width)
        ═══════════════════════════════════════ */}
        <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 58px)", background: "var(--bg)" }}>

          {/* Hero */}
          {(() => {
            const hero = parseBg(form.bg);
            return (
              <div style={{ position: "relative", width: "100%", height: `${hero.height}vh`, background: hero.bg, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                {form.image_url && <img src={form.image_url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `50% ${hero.positionY}%`, opacity: 0.75, pointerEvents: "none" }} />}
                {hero.overlay && (
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.15) 70%)", pointerEvents: "none" }} />
                )}
                <div 
                  className="shell" 
                  style={{ 
                    position: "relative", 
                    zIndex: 10, 
                    paddingBottom: "48px", 
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    alignItems: "flex-start",
                    textAlign: "left"
                  }}
                >
                  <Editable tag="span" value={form.category} onChange={v => setForm(p => ({ ...p, category: v }))}
                    style={{ fontSize: "0.9rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "3px", color: "#ffffff", opacity: 0.8 }} />
                  <Editable tag="h1" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))}
                    style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, color: "#ffffff", margin: 0, lineHeight: "1.1", width: "100%" }} />
                  <Editable tag="p" value={form.subtitle} onChange={v => setForm(p => ({ ...p, subtitle: v }))}
                    style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", color: "#ffffff", opacity: 0.9, margin: 0, maxWidth: "700px", width: "100%" }} />
                </div>
              </div>
            );
          })()}

          {/* Horizontal Metadata Bar (Preview Mode) */}
          <div style={{ borderBottom: "1px solid var(--panel-border)", background: "var(--panel)", padding: "24px 0" }}>
            <div className="shell" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-around", gap: "24px", textAlign: "center" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Կարգ</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{form.category || "Branding"}</span>
              </div>
              {form.client && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Հաճախորդ</span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{form.client}</span>
                </div>
              )}
              {form.year && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Տարեթիվ</span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{form.year}</span>
                </div>
              )}
            </div>
          </div>

          {/* Click-to-edit hint banner */}
          <div style={{ background: "rgba(0,255,204,0.04)", borderBottom: "1px solid rgba(0,255,204,0.08)", padding: "8px 48px", display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ffcc", flexShrink: 0 }} />
            <span style={{ fontSize: "0.75rem", color: "#66ddb5" }}>Սեղմեք ցանկացած տեքստի վրա՝ խմբագրելու համար: Քաշեք և գցեք բլոկները (Drag & Drop)՝ դասավորությունը փոխելու համար:</span>
          </div>

          {/* Single-Column Blocks Preview */}
          <div style={{ width: "100%", padding: "40px 0", display: "flex", flexDirection: "column" }}>
            
            {blocks.length === 0 && (
              <div style={{ maxWidth: 800, width: "100%", margin: "0 auto", padding: "0 24px", boxSizing: "border-box" }}>
                <div style={{ border: "2px dashed var(--panel-border)", borderRadius: 16, padding: 52, textAlign: "center" }}>
                  <div style={{ fontSize: "2rem", marginBottom: 12, opacity: 0.3, color: "var(--text)" }}>+</div>
                  <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.9rem" }}>Ավելացրեք բլոկ աջ վահանակից</p>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
              {blocks.map((block, idx) => {
                const isSel = selected === idx;
                const showIndicatorAbove = draggedIdx !== null && dragOverIdx === idx && dragOverPosition === "above";
                const showIndicatorBelow = draggedIdx !== null && dragOverIdx === idx && dragOverPosition === "below";

                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                    
                    {/* Drag and Drop Horizontal Indicator Above */}
                    {showIndicatorAbove && (
                      <div style={{ height: "4px", background: "var(--accent)", borderRadius: "2px", margin: "12px 24px" }} />
                    )}

                    <div
                      onDragOver={e => handleDragOver(e, idx)}
                      onDrop={e => handleDrop(e, idx)}
                      onClick={() => setSelected(idx)}
                      style={{
                        position: "relative",
                        outline: isSel ? "2px solid rgba(0,255,204,0.5)" : "2px solid transparent",
                        transition: "outline 0.15s",
                        width: "100%",
                        padding: isSel ? "12px 0" : "0",
                      }}
                    >
                      {/* Block toolbar (appears when selected) */}
                      {isSel && (
                        <div style={{ position: "absolute", top: 12, right: 24, display: "flex", gap: 4, background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: 8, padding: "4px 6px", zIndex: 100 }}>
                          <span
                            draggable={true}
                            onDragStart={e => handleDragStart(e, idx)}
                            onDragEnd={handleDragEnd}
                            style={{ cursor: "grab", padding: "2px 7px", color: "#00ffcc", fontWeight: "bold", fontSize: "0.85rem", userSelect: "none" }}
                            title="Քաշեք տեղափոխելու համար"
                          >
                            ⠿
                          </span>
                          <div style={{ width: 1, background: "var(--panel-border)", margin: "0 2px" }} />
                          <button onClick={e => { e.stopPropagation(); mov(idx, "up"); }} disabled={idx === 0} style={{ padding: "2px 7px", background: "transparent", border: "none", color: "var(--text)", cursor: "pointer", fontSize: "0.75rem" }}>↑</button>
                          <button onClick={e => { e.stopPropagation(); mov(idx, "down"); }} disabled={idx === blocks.length - 1} style={{ padding: "2px 7px", background: "transparent", border: "none", color: "var(--text)", cursor: "pointer", fontSize: "0.75rem" }}>↓</button>
                          <div style={{ width: 1, background: "var(--panel-border)", margin: "0 2px" }} />
                          <button onClick={e => { e.stopPropagation(); del(idx); }} style={{ padding: "2px 7px", background: "transparent", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "0.75rem" }}>✕</button>
                        </div>
                      )}

                      {/* ── TEXT block ── */}
                      {block.type === "text" && (
                        <div style={{ maxWidth: 800, width: "100%", margin: "0 auto", padding: "40px 24px", boxSizing: "border-box" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <Editable tag="h2" value={block.title_am} onChange={v => upd(idx, { ...block, title_am: v })}
                              style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text)", margin: 0 }} />
                            <Editable tag="p" value={block.content_am} onChange={v => upd(idx, { ...block, content_am: v })}
                              style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "var(--text)", opacity: 0.85, margin: 0, whiteSpace: "pre-wrap" }} />
                          </div>
                        </div>
                      )}

                      {/* ── IMAGE block ── */}
                      {block.type === "image" && (
                        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", margin: "20px 0" }}>
                          {block.image_url ? (
                            <div style={{ width: "100%", overflow: "hidden" }}>
                              <img src={block.image_url} alt="" style={{ width: "100%", display: "block" }} />
                            </div>
                          ) : (
                            <div style={{ maxWidth: 800, width: "100%", padding: "0 24px", boxSizing: "border-box" }}>
                              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 240, border: "2px dashed var(--panel-border)", borderRadius: 16, cursor: "pointer", gap: 8, background: "var(--panel)" }}>
                                <span style={{ fontSize: "2.5rem", opacity: 0.4 }}>🖼</span>
                                <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Սեղմեք նկար ավելացնելու համար</span>
                                <input type="file" accept="image/*" style={{ display: "none" }}
                                  onChange={async e => {
                                    const url = await upload(e.target.files![0]);
                                    if (url) upd(idx, { ...block, image_url: url });
                                  }} />
                              </label>
                            </div>
                          )}
                          {block.caption_am && (
                            <div style={{ maxWidth: 800, width: "100%", margin: "12px auto 0", padding: "0 24px", boxSizing: "border-box", textAlign: "center" }}>
                              <Editable tag="span" value={block.caption_am} onChange={v => upd(idx, { ...block, caption_am: v })}
                                style={{ fontSize: "0.85rem", color: "var(--muted)", fontStyle: "italic" }} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── EMBED block ── */}
                      {block.type === "embed" && (
                        <div style={{ width: "100%", margin: "20px 0" }}>
                          {block.embed_url ? (
                            <div style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden" }}>
                              <iframe src={block.embed_url.includes("youtu") ? `https://www.youtube.com/embed/${block.embed_url.split("v=")[1]?.split("&")[0] || block.embed_url.split("youtu.be/")[1]}` : block.embed_url}
                                style={{ width: "100%", height: "100%", border: "none" }} allowFullScreen />
                            </div>
                          ) : (
                            <div style={{ maxWidth: 800, width: "100%", padding: "0 24px", boxSizing: "border-box" }}>
                              <div style={{ padding: 48, background: "var(--panel)", borderRadius: 16, border: "1px dashed var(--panel-border)", textAlign: "center", color: "var(--muted)" }}>
                                🎬 Ավելացրեք YouTube/Vimeo հղում աջ վահանակից
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── COLOR PALETTE block ── */}
                      {block.type === "color_palette" && (
                        <div style={{ maxWidth: 800, width: "100%", margin: "0 auto", padding: "40px 24px", boxSizing: "border-box" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>Բրենդի Գունապնակ</h4>
                            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                              {block.colors.map((c, ci) => (
                                <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: c, border: "2px solid var(--panel-border)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }} />
                                  <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--muted)" }}>{c}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── TYPOGRAPHY SHOWCASE block ── */}
                      {block.type === "typography_showcase" && (
                        <div style={{ maxWidth: 800, width: "100%", margin: "0 auto", padding: "40px 24px", boxSizing: "border-box" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>Տառատեսակներ</h4>
                            {block.fonts.map((f, fi) => (
                              <div key={fi} style={{ padding: 24, background: "var(--panel)", borderRadius: 16, border: "1px solid var(--panel-border)" }}>
                                <span style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>{f}</span>
                                <div style={{ fontFamily: `${f}, sans-serif`, fontSize: "2rem", color: "var(--text)" }}>{block.previewText}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Drag and Drop Horizontal Indicator Below */}
                    {showIndicatorBelow && (
                      <div style={{ height: "4px", background: "var(--accent)", borderRadius: "2px", margin: "12px 24px" }} />
                    )}

                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            RIGHT: TOOLS SIDEBAR  (1/4 width)
        ═══════════════════════════════════════ */}
        <div style={{ background: "var(--panel)", borderLeft: "1px solid var(--panel-border)", overflowY: "auto", maxHeight: "calc(100vh - 58px)", display: "flex", flexDirection: "column" }}>

          {/* ── Selected block editor ── */}
          {selected !== null && blocks[selected] && (() => {
            const block = blocks[selected];
            return (
              <div style={{ padding: 18, borderBottom: "1px solid #1e1e26" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#00ffcc", textTransform: "uppercase" }}>
                    Բլոկ #{selected + 1} — {block.type}
                  </span>
                  <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "1rem" }}>✕</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                  {block.type === "text" && (<>
                    <Field label="Հայ. Վերնագիր" value={block.title_am} onChange={v => upd(selected, { ...block, title_am: v })} />
                    <Field label="Eng. Title" value={block.title_en} onChange={v => upd(selected, { ...block, title_en: v })} />
                    <FieldArea label="Հայ. Տեքստ" value={block.content_am} onChange={v => upd(selected, { ...block, content_am: v })} />
                    <FieldArea label="Eng. Content" value={block.content_en} onChange={v => upd(selected, { ...block, content_en: v })} />
                  </>)}

                  {block.type === "image" && (<>
                    <Field label="Նկարի URL" value={block.image_url} onChange={v => upd(selected, { ...block, image_url: v })} />
                    <label style={uploadLabelStyle}>
                      {uploading ? "Վերբեռնվում..." : "📁 Վերբեռնել Նկար"}
                      <input type="file" accept="image/*" style={{ display: "none" }}
                        onChange={async e => { const url = await upload(e.target.files![0]); if (url) upd(selected, { ...block, image_url: url }); }} />
                    </label>
                    <Field label="Հայ. Caption" value={block.caption_am || ""} onChange={v => upd(selected, { ...block, caption_am: v })} />
                    <Field label="Eng. Caption" value={block.caption_en || ""} onChange={v => upd(selected, { ...block, caption_en: v })} />
                    <Toggle label="Ամբողջ լայնությամբ" checked={block.fullWidth} onChange={v => upd(selected, { ...block, fullWidth: v })} />
                  </>)}

                  {block.type === "embed" && (
                    <Field label="YouTube / Vimeo URL" value={block.embed_url} onChange={v => upd(selected, { ...block, embed_url: v })} />
                  )}

                  {block.type === "color_palette" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {block.colors.map((c, ci) => (
                        <div key={ci} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input type="color" value={c} onChange={e => {
                            const nc = [...block.colors]; nc[ci] = e.target.value;
                            upd(selected, { ...block, colors: nc });
                          }} style={{ width: 32, height: 32, border: "none", background: "none", cursor: "pointer" }} />
                          <Field label="" value={c} onChange={v => { const nc = [...block.colors]; nc[ci] = v; upd(selected, { ...block, colors: nc }); }} />
                          <button onClick={() => { const nc = block.colors.filter((_: any, i: number) => i !== ci); upd(selected, { ...block, colors: nc }); }}
                            style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", flexShrink: 0 }}>✕</button>
                        </div>
                      ))}
                      <hd-button onClick={() => upd(selected, { ...block, colors: [...block.colors, "#ffffff"] })}
                        data-width="100%" data-height="34px" data-thickness="1px" style={{ background: "transparent" }}>
                        + Ավելացնել Գույն
                      </hd-button>
                    </div>
                  )}

                  {block.type === "typography_showcase" && (<>
                    <Field label="Տառատեսակ (Outfit, Inter)" value={block.fonts.join(", ")} onChange={v => upd(selected, { ...block, fonts: v.split(",").map(s => s.trim()) })} />
                    <Field label="Ցուցադրման Տեքստ" value={block.previewText} onChange={v => upd(selected, { ...block, previewText: v })} />
                  </>)}

                </div>
              </div>
            );
          })()}

          {/* ── Metadata ── */}
          <div style={{ padding: 18, borderBottom: "1px solid var(--panel-border)" }}>
            <SectionLabel>Metadata</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Field label="Վերնագիր*" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} />
              <Field label="Ենթավերնագիր*" value={form.subtitle} onChange={v => setForm(p => ({ ...p, subtitle: v }))} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Field label="Կատեգ." value={form.category} onChange={v => setForm(p => ({ ...p, category: v }))} />
                <Field label="Տարի" value={form.year} onChange={v => setForm(p => ({ ...p, year: v }))} />
              </div>
              <Field label="Հաճախ." value={form.client} onChange={v => setForm(p => ({ ...p, client: v }))} />
            </div>
          </div>

          {/* ── Hero Appearance ── */}
          <div style={{ padding: 18, borderBottom: "1px solid var(--panel-border)" }}>
            <SectionLabel>Hero</SectionLabel>
            {(() => {
              const hero = parseBg(form.bg);
              const setHero = (updates: Partial<{ bg: string; overlay: boolean; positionY: number; height: number }>) => {
                const merged = { ...hero, ...updates };
                setForm(p => ({ ...p, bg: serializeBg(merged.bg, merged.overlay, merged.positionY, merged.height) }));
              };

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Field label="Ֆոն (CSS gradient / hex)" value={hero.bg} onChange={v => setHero({ bg: v })} />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                    {GRADIENT_PRESETS.map(pr => (
                      <div key={pr.name} title={pr.name} onClick={() => setHero({ bg: pr.value })}
                        style={{ width: 24, height: 24, borderRadius: 6, background: pr.value, cursor: "pointer", border: hero.bg === pr.value ? "2px solid #00ffcc" : "2px solid transparent", transition: "transform 0.1s" }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"} />
                    ))}
                  </div>

                  <Toggle label="Մութ գրադիենտի շերտ (Overlay)" checked={hero.overlay} onChange={v => setHero({ overlay: v })} />
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Կազմի ուղղահայաց դիրք (Y-Position)</span>
                      <span style={{ fontSize: "0.72rem", color: "var(--text)" }}>{hero.positionY}%</span>
                    </div>
                    <hd-slider min="0" max="100" value={hero.positionY.toString()} onInput={(e: any) => setHero({ positionY: parseInt(e.target.value) })} data-width="100%" />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Բարձրություն (Hero Height)</span>
                      <span style={{ fontSize: "0.72rem", color: "var(--text)" }}>{hero.height}vh</span>
                    </div>
                    <hd-slider min="20" max="100" value={hero.height.toString()} onInput={(e: any) => setHero({ height: parseInt(e.target.value) })} data-width="100%" />
                  </div>

                  <Field label="Cover Նկար URL" value={form.image_url} onChange={v => setForm(p => ({ ...p, image_url: v }))} />
                  <label style={uploadLabelStyle}>
                    {uploading ? "Վերբեռնվում..." : "📁 Վերբեռնել Cover"}
                    <input type="file" accept="image/*" style={{ display: "none" }}
                      onChange={async e => { const url = await upload(e.target.files![0]); if (url) setForm(p => ({ ...p, image_url: url })); }} />
                  </label>
                </div>
              );
            })()}
          </div>

          {/* ── Add Blocks ── */}
          <div style={{ padding: 18 }}>
            <SectionLabel>Ավելացնել Բլոկ</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {([
                { type: "text",                label: "Տեքստ",       color: "#3b82f6" },
                { type: "image",               label: "Նկար",        color: "#10b981" },
                { type: "embed",               label: "Տեսանյութ",   color: "#f59e0b" },
                { type: "color_palette",       label: "Գույներ",     color: "#f97316" },
                { type: "typography_showcase", label: "Տառատեսակ",   color: "#8b5cf6" },
              ] as { type: BlockType; label: string; color: string }[]).map(({ type, label, color }) => (
                <hd-button key={type} onClick={() => add(type)} data-width="100%" data-height="36px" data-thickness="1px"
                  style={{ color, background: `${color}18`, borderColor: `${color}44` }}>
                  + {label}
                </hd-button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Mini Components ────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--text)", opacity: 0.8, marginBottom: 12 }}>{children}</div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{label}</span>}
      <hd-input value={value} onInput={(e: any) => onChange(e.target.value)} data-width="100%" data-height="34px" />
    </div>
  );
}

function FieldArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{label}</span>}
      <hd-textarea value={value} onInput={(e: any) => onChange(e.target.value)} data-width="100%" style={{ minHeight: "100px" }} />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{label}</span>
      <hd-switch checked={checked} onChange={(e: any) => onChange(e.target.checked)} />
    </div>
  );
}

const uploadLabelStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  height: 34, background: "rgba(255,255,255,0.04)", border: "1px solid var(--panel-border)",
  borderRadius: 8, color: "var(--muted)", cursor: "pointer", fontSize: "0.78rem", gap: 6,
};
