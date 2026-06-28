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

function RichEditable({
  value, onChange, style = {}
}: {
  value: string; onChange: (v: string) => void;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (ref.current) {
      onChange(ref.current.innerHTML);
    }
  };

  const exec = (cmd: string, val: string = "") => {
    document.execCommand(cmd, false, val);
    handleInput();
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {editing && (
        <div
          style={{
            position: "absolute",
            top: -48,
            left: 0,
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            background: "var(--panel)",
            border: "1px solid var(--panel-border)",
            borderRadius: 8,
            padding: "4px 6px",
            zIndex: 100,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
          onMouseDown={e => e.preventDefault()} // prevent focus loss
        >
          {/* Headings */}
          <button onClick={() => exec("formatBlock", "<h2>")} style={toolbarBtnStyle} title="Heading 2">H2</button>
          <button onClick={() => exec("formatBlock", "<h3>")} style={toolbarBtnStyle} title="Heading 3">H3</button>
          <button onClick={() => exec("formatBlock", "<p>")} style={toolbarBtnStyle} title="Paragraph">P</button>
          <div style={{ width: 1, background: "var(--panel-border)", margin: "0 2px" }} />

          {/* Inline Styles */}
          <button onClick={() => exec("bold")} style={toolbarBtnStyle} title="Թավ (Bold)"><b>B</b></button>
          <button onClick={() => exec("italic")} style={toolbarBtnStyle} title="Շեղ (Italic)"><i>I</i></button>
          <button onClick={() => exec("underline")} style={toolbarBtnStyle} title="Ընդգծված (Underline)"><u>U</u></button>
          <button onClick={() => exec("strikeThrough")} style={toolbarBtnStyle} title="Ջնջված (Strikethrough)"><s>S</s></button>
          <div style={{ width: 1, background: "var(--panel-border)", margin: "0 2px" }} />

          {/* Alignment */}
          <button onClick={() => exec("justifyLeft")} style={toolbarBtnStyle} title="Ձախից">←</button>
          <button onClick={() => exec("justifyCenter")} style={toolbarBtnStyle} title="Կենտրոնից">↔</button>
          <button onClick={() => exec("justifyRight")} style={toolbarBtnStyle} title="Աջից">→</button>
          <button onClick={() => exec("justifyFull")} style={toolbarBtnStyle} title="Հավասարեցնել">═</button>
          <div style={{ width: 1, background: "var(--panel-border)", margin: "0 2px" }} />

          {/* Lists & Links */}
          <button onClick={() => exec("insertUnorderedList")} style={toolbarBtnStyle} title="Բուլետներ (Bullet List)">• List</button>
          <button onClick={() => {
            const url = prompt("Մուտքագրեք հղումը (URL):", "https://");
            if (url) exec("createLink", url);
          }} style={toolbarBtnStyle} title="Ավելացնել հղում">🔗</button>
          <div style={{ width: 1, background: "var(--panel-border)", margin: "0 2px" }} />

          {/* ForeColor Preset Presets */}
          <input 
            type="color" 
            onChange={e => exec("foreColor", e.target.value)} 
            style={{ width: 24, height: 24, padding: 0, border: "none", background: "none", cursor: "pointer", alignSelf: "center" }} 
            title="Տեքստի Գույն" 
          />

          <div style={{ width: 1, background: "var(--panel-border)", margin: "0 2px" }} />
          <button onClick={() => exec("removeFormat")} style={toolbarBtnStyle} title="Մաքրել ֆորմատավորումը">✕</button>
        </div>
      )}

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setEditing(true)}
        onBlur={() => setEditing(false)}
        onInput={handleInput}
        style={{
          ...style,
          outline: editing ? "2px solid rgba(0,255,204,0.6)" : "2px solid transparent",
          borderRadius: "6px",
          padding: "6px",
          minHeight: "40px",
          whiteSpace: "normal",
        }}
      />
    </div>
  );
}

const toolbarBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--text)",
  cursor: "pointer",
  padding: "4px 8px",
  fontSize: "0.8rem",
  borderRadius: 4,
  fontWeight: "bold",
};

function parseLangText(text: string, lang: 'am' | 'en') {
  if (!text) return "";
  const parts = text.split(" | ");
  if (parts.length > 1) {
    return lang === 'en' ? parts[1] : parts[0];
  }
  return text;
}

function updateLangText(text: string, newVal: string, lang: 'am' | 'en') {
  const parts = (text || "").split(" | ");
  let am = parts[0] || "";
  let en = parts[1] || "";
  if (lang === 'am') am = newVal;
  if (lang === 'en') en = newVal;
  return `${am} | ${en}`;
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
  const [editorLang, setEditorLang] = useState<'am' | 'en'>('am'); // editing language switcher

  const [form, setForm] = useState<Case>({
    id, title: "", subtitle: "", bg: GRADIENT_PRESETS[0].value,
    image_url: "", details: "[]", category: "Branding", client: "", year: new Date().getFullYear().toString()
  });
  const [blocks, setBlocks] = useState<CaseBlock[]>([]);

  /* ─ Drag & Drop ─ */
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below' | null>(null);

  /* ─ Collapsible Sidebar & Floating Windows ─ */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(true);

  const [propPos, setPropPos] = useState({ x: 200, y: 150 });
  const [draggingProp, setDraggingProp] = useState(false);
  const propStart = useRef({ x: 0, y: 0 });

  const [layersPos, setLayersPos] = useState({ x: 200, y: 480 });
  const [draggingLayers, setDraggingLayers] = useState(false);
  const layersStart = useRef({ x: 0, y: 0 });

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCollapsed = localStorage.getItem("case-editor-sidebar-collapsed");
      if (savedCollapsed) setSidebarCollapsed(savedCollapsed === "true");

      const savedShowLayers = localStorage.getItem("case-editor-show-layers");
      if (savedShowLayers) setShowLayersPanel(savedShowLayers === "true");

      const savedPropPos = localStorage.getItem("case-editor-prop-pos");
      if (savedPropPos) {
        try { setPropPos(JSON.parse(savedPropPos)); } catch {}
      }

      const savedLayersPos = localStorage.getItem("case-editor-layers-pos");
      if (savedLayersPos) {
        try { setLayersPos(JSON.parse(savedLayersPos)); } catch {}
      }
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("case-editor-sidebar-collapsed", String(sidebarCollapsed));
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("case-editor-show-layers", String(showLayersPanel));
    }
  }, [showLayersPanel]);

  useEffect(() => {
    if (typeof window !== "undefined" && !draggingProp) {
      localStorage.setItem("case-editor-prop-pos", JSON.stringify(propPos));
    }
  }, [propPos, draggingProp]);

  useEffect(() => {
    if (typeof window !== "undefined" && !draggingLayers) {
      localStorage.setItem("case-editor-layers-pos", JSON.stringify(layersPos));
    }
  }, [layersPos, draggingLayers]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingProp) {
        setPropPos({
          x: Math.max(0, e.clientX - propStart.current.x),
          y: Math.max(0, e.clientY - propStart.current.y),
        });
      }
      if (draggingLayers) {
        setLayersPos({
          x: Math.max(0, e.clientX - layersStart.current.x),
          y: Math.max(0, e.clientY - layersStart.current.y),
        });
      }
    };

    const handleMouseUp = () => {
      setDraggingProp(false);
      setDraggingLayers(false);
    };

    if (draggingProp || draggingLayers) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingProp, draggingLayers]);

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
    <div style={{ background: "var(--bg)", color: "var(--text)", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "HDesign, system-ui, sans-serif" }}>
      <span style={{ fontSize: "1.2rem", opacity: 0.7 }}>Բեռնվում է WYSIWYG խմբագրիչը...</span>
    </div>
  );

  /* ─── RENDER ─────────────────────────────────────────── */
  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", height: "100vh", display: "flex", flexDirection: "column", fontFamily: "HDesign, 'Inter', system-ui, sans-serif" }}>

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
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Language Switcher */}
          <div style={{ display: "flex", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 8, padding: 2, gap: 2 }}>
            <button
              onClick={() => setEditorLang("am")}
              style={{
                padding: "6px 12px",
                background: editorLang === "am" ? "var(--accent)" : "transparent",
                border: "none",
                borderRadius: 6,
                color: editorLang === "am" ? "var(--bg)" : "var(--muted)",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.78rem",
                transition: "all 0.2s",
              }}
            >
              AM (Հայ)
            </button>
            <button
              onClick={() => setEditorLang("en")}
              style={{
                padding: "6px 12px",
                background: editorLang === "en" ? "var(--accent)" : "transparent",
                border: "none",
                borderRadius: 6,
                color: editorLang === "en" ? "var(--bg)" : "var(--muted)",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.78rem",
                transition: "all 0.2s",
              }}
            >
              EN (Eng)
            </button>
          </div>

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
                  <Editable tag="span" value={parseLangText(form.category, editorLang) || (editorLang === "en" ? "Branding" : "Բրենդավորում")} onChange={v => setForm(p => ({ ...p, category: updateLangText(form.category, v, editorLang) }))}
                    style={{ fontSize: "0.9rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "3px", color: "#ffffff", opacity: 0.8 }} />
                  <Editable tag="h1" value={parseLangText(form.title, editorLang) || (editorLang === "en" ? "Title" : "Վերնագիր")} onChange={v => setForm(p => ({ ...p, title: updateLangText(form.title, v, editorLang) }))}
                    style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, color: "#ffffff", margin: 0, lineHeight: "1.1", width: "100%" }} />
                  <Editable tag="p" value={parseLangText(form.subtitle, editorLang) || (editorLang === "en" ? "Subtitle" : "Ենթավերնագիր")} onChange={v => setForm(p => ({ ...p, subtitle: updateLangText(form.subtitle, v, editorLang) }))}
                    style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", color: "#ffffff", opacity: 0.9, margin: 0, maxWidth: "700px", width: "100%" }} />
                </div>
              </div>
            );
          })()}

          {/* Horizontal Metadata Bar (Preview Mode) */}
          <div style={{ borderBottom: "1px solid var(--panel-border)", background: "var(--panel)", padding: "24px 0" }}>
            <div className="shell" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-around", gap: "24px", textAlign: "center" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{editorLang === "en" ? "Category" : "Կարգ"}</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{parseLangText(form.category, editorLang) || (editorLang === "en" ? "Branding" : "Բրենդավորում")}</span>
              </div>
              {form.client && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{editorLang === "en" ? "Client" : "Հաճախորդ"}</span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{parseLangText(form.client, editorLang)}</span>
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
                            <Editable tag="h2" value={editorLang === "am" ? block.title_am : block.title_en} onChange={v => upd(idx, { ...block, [editorLang === "am" ? "title_am" : "title_en"]: v })}
                              style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text)", margin: 0 }} />
                            <RichEditable value={editorLang === "am" ? block.content_am : block.content_en} onChange={v => upd(idx, { ...block, [editorLang === "am" ? "content_am" : "content_en"]: v })}
                              style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "var(--text)", opacity: 0.85, margin: 0 }} />
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
                          {((editorLang === "am" ? block.caption_am : block.caption_en) || isSel) && (
                            <div style={{ maxWidth: 800, width: "100%", margin: "12px auto 0", padding: "0 24px", boxSizing: "border-box", textAlign: "center" }}>
                              <Editable tag="span" value={(editorLang === "am" ? block.caption_am : block.caption_en) || "Ավելացնել նկարագրություն..."} onChange={v => upd(idx, { ...block, [editorLang === "am" ? "caption_am" : "caption_en"]: v })}
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
        <div style={{ background: "var(--panel)", borderLeft: "1px solid var(--panel-border)", overflowY: "auto", maxHeight: "calc(100vh - 58px)", display: sidebarCollapsed ? "none" : "flex", flexDirection: "column" }}>


          {/* ── Metadata ── */}
          <div style={{ padding: 18, borderBottom: "1px solid var(--panel-border)" }}>
            <SectionLabel>{editorLang === "en" ? "Metadata (EN)" : "Մետատվյալներ (AM)"}</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Field label={editorLang === "en" ? "Title*" : "Վերնագիր*"} value={parseLangText(form.title, editorLang)} onChange={v => setForm(p => ({ ...p, title: updateLangText(form.title, v, editorLang) }))} />
              <Field label={editorLang === "en" ? "Subtitle*" : "Ենթավերնագիր*"} value={parseLangText(form.subtitle, editorLang)} onChange={v => setForm(p => ({ ...p, subtitle: updateLangText(form.subtitle, v, editorLang) }))} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Field label={editorLang === "en" ? "Category" : "Կատեգորիա"} value={parseLangText(form.category, editorLang)} onChange={v => setForm(p => ({ ...p, category: updateLangText(form.category, v, editorLang) }))} />
                <Field label={editorLang === "en" ? "Year" : "Տարեթիվ"} value={form.year} onChange={v => setForm(p => ({ ...p, year: v }))} />
              </div>
              <Field label={editorLang === "en" ? "Client" : "Հաճախորդ"} value={parseLangText(form.client, editorLang)} onChange={v => setForm(p => ({ ...p, client: updateLangText(form.client, v, editorLang) }))} />
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

          {/* ── Windows Toggles ── */}
          <div style={{ padding: 18, borderTop: "1px solid var(--panel-border)" }}>
            <SectionLabel>Գործիքներ</SectionLabel>
            <hd-button onClick={() => setShowLayersPanel(true)} data-width="100%" data-height="34px" data-thickness="1px" style={{ background: "transparent" }}>
              🥞 Բացել Շերտերի պատուհանը
            </hd-button>
          </div>

        </div>
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            position: "absolute",
            top: 24,
            right: sidebarCollapsed ? 12 : "calc(25vw - 16px)", // sidebar occupies 1/4 (25vw) of width
            zIndex: 1000,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--panel)",
            border: "1px solid var(--panel-border)",
            color: "var(--text)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: "right 0.2s, background 0.2s",
          }}
          title={sidebarCollapsed ? "Բացել կողագոտին" : "Փակել կողագոտին"}
        >
          {sidebarCollapsed ? "❮" : "❯"}
        </button>

      </div>

      {/* ── Floating Block Properties Window ── */}
      {selected !== null && blocks[selected] && (() => {
        const block = blocks[selected];
        return (
          <div
            style={{
              position: "fixed",
              top: propPos.y,
              left: propPos.x,
              zIndex: 1010,
              width: 340,
              maxHeight: "70vh",
              overflowY: "auto",
              background: "var(--panel)",
              border: "1px solid var(--panel-border)",
              borderRadius: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Draggable Header */}
            <div
              onMouseDown={e => {
                setDraggingProp(true);
                propStart.current = {
                  x: e.clientX - propPos.x,
                  y: e.clientY - propPos.y,
                };
              }}
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--panel-border)",
                background: "rgba(255,255,255,0.02)",
                cursor: "move",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                userSelect: "none",
              }}
            >
              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px" }}>
                ⚙️ Բլոկ #{selected + 1} ({block.type})
              </span>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              {block.type === "text" && (<>
                {editorLang === "am" ? (
                  <>
                    <Field label="Վերնագիր" value={block.title_am} onChange={v => upd(selected, { ...block, title_am: v })} />
                    <FieldArea label="Տեքստ" value={block.content_am} onChange={v => upd(selected, { ...block, content_am: v })} />
                  </>
                ) : (
                  <>
                    <Field label="Title" value={block.title_en} onChange={v => upd(selected, { ...block, title_en: v })} />
                    <FieldArea label="Content" value={block.content_en} onChange={v => upd(selected, { ...block, content_en: v })} />
                  </>
                )}
              </>)}

              {block.type === "image" && (<>
                <Field label={editorLang === "am" ? "Նկարի URL" : "Image URL"} value={block.image_url} onChange={v => upd(selected, { ...block, image_url: v })} />
                <label style={uploadLabelStyle}>
                  {uploading ? (editorLang === "am" ? "Վերբեռնվում..." : "Uploading...") : (editorLang === "am" ? "📁 Վերբեռնել Նկար" : "📁 Upload Image")}
                  <input type="file" accept="image/*" style={{ display: "none" }}
                    onChange={async e => { const url = await upload(e.target.files![0]); if (url) upd(selected, { ...block, image_url: url }); }} />
                </label>
                <Field label={editorLang === "am" ? "Նկարագրություն (Caption)" : "Caption"} value={(editorLang === "am" ? block.caption_am : block.caption_en) || ""} onChange={v => upd(selected, { ...block, [editorLang === "am" ? "caption_am" : "caption_en"]: v })} />
                <Toggle label={editorLang === "am" ? "Ամբողջ լայնությամբ" : "Full Width"} checked={block.fullWidth} onChange={v => upd(selected, { ...block, fullWidth: v })} />
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

      {/* ── Floating Layers Manager Window ── */}
      {showLayersPanel && (
        <div
          style={{
            position: "fixed",
            top: layersPos.y,
            left: layersPos.x,
            zIndex: 1000,
            width: 280,
            maxHeight: "50vh",
            overflowY: "auto",
            background: "var(--panel)",
            border: "1px solid var(--panel-border)",
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Draggable Header */}
          <div
            onMouseDown={e => {
              setDraggingLayers(true);
              layersStart.current = {
                x: e.clientX - layersPos.x,
                y: e.clientY - layersPos.y,
              };
            }}
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--panel-border)",
              background: "rgba(255,255,255,0.02)",
              cursor: "move",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              userSelect: "none",
            }}
          >
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: "1px" }}>
              🥞 Շերտեր (Layers)
            </span>
            <button
              onClick={() => setShowLayersPanel(false)}
              style={{
                background: "none",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              ✕
            </button>
          </div>

          {/* List of Layers */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {blocks.length === 0 && (
              <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--muted)", fontSize: "0.8rem" }}>
                Դեռ բլոկներ չկան
              </div>
            )}
            {blocks.map((block, idx) => {
              const isSel = selected === idx;
              const showIndicatorAbove = draggedIdx !== null && dragOverIdx === idx && dragOverPosition === "above";
              const showIndicatorBelow = draggedIdx !== null && dragOverIdx === idx && dragOverPosition === "below";

              return (
                <div key={idx} style={{ display: "flex", flexDirection: "column" }}>
                  {showIndicatorAbove && (
                    <div style={{ height: "2px", background: "var(--accent)", margin: "0 8px" }} />
                  )}
                  <div
                    draggable={true}
                    onDragStart={e => handleDragStart(e, idx)}
                    onDragOver={e => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    onDrop={e => handleDrop(e, idx)}
                    onClick={() => setSelected(idx)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--panel-border)",
                      background: isSel ? "rgba(0,255,204,0.06)" : "transparent",
                      cursor: "grab",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>#{idx + 1}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: isSel ? "var(--accent)" : "var(--text)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {block.type === "text" && `📝 ${block.title_am || "Տեքստ"}`}
                        {block.type === "image" && `🖼 ${block.caption_am ? `Նկար (${block.caption_am})` : "Նկար"}`}
                        {block.type === "embed" && "🎬 Տեսանյութ"}
                        {block.type === "color_palette" && "🎨 Գունապնակ"}
                        {block.type === "typography_showcase" && "🔤 Տառատեսակներ"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => mov(idx, "up")}
                        disabled={idx === 0}
                        style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "0.75rem", padding: 2 }}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => mov(idx, "down")}
                        disabled={idx === blocks.length - 1}
                        style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "0.75rem", padding: 2 }}
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => del(idx)}
                        style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "0.75rem", padding: 2, marginLeft: 4 }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {showIndicatorBelow && (
                    <div style={{ height: "2px", background: "var(--accent)", margin: "0 8px" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
