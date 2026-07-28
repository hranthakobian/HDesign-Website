"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { brandingCases as staticCases } from "@/lib/brandingData";
import LoadingAnimation from "@/components/LoadingAnimation";

/* ─── Types ─────────────────────────────────────────── */
type BlockType = "text" | "image" | "embed" | "color_palette" | "typography_showcase";

interface BaseBlock {
  marginTop?: number;
  marginBottom?: number;
}

interface TextBlock extends BaseBlock       { type: "text";                title_am: string; title_en: string; content_am: string; content_en: string; }
interface ImageBlock extends BaseBlock      { type: "image";               image_url: string; caption_am: string; caption_en: string; fullWidth: boolean; }
interface EmbedBlock extends BaseBlock      { type: "embed";               embed_url: string; }
interface PaletteBlock extends BaseBlock    { type: "color_palette";       colors: string[]; }
interface TypoBlock extends BaseBlock       { type: "typography_showcase"; fonts: string[]; previewText: string; }

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
  value, onChange, tag = "p", style = {}, disabled = false
}: {
  value: string; onChange: (v: string) => void;
  tag?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [editing, setEditing] = useState(false);

  const Tag = tag as any;

  return (
    <Tag
      ref={ref}
      contentEditable={!disabled && editing}
      suppressContentEditableWarning
      onClick={() => {
        if (!disabled) {
          setEditing(true);
          ref.current?.focus();
        }
      }}
      onBlur={() => {
        setEditing(false);
        onChange(ref.current?.innerText ?? "");
      }}
      style={{
        ...style,
        outline: !disabled && editing ? "2px solid rgba(0,255,204,0.6)" : "2px solid transparent",
        borderRadius: "6px",
        padding: editing ? "4px 6px" : "0",
        cursor: disabled ? "inherit" : editing ? "text" : "pointer",
        transition: "outline 0.2s",
        minWidth: "30px",
      }}
    >
      {value}
    </Tag>
  );
}

function RichEditable({
  value, onChange, style = {}, onUpload, disabled = false
}: {
  value: string; onChange: (v: string) => void;
  style?: React.CSSProperties;
  onUpload?: (file: File, current: number, total: number) => Promise<string | null>;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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

  const setCaretFromPoint = (e: React.DragEvent) => {
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(e.clientX, e.clientY);
      const sel = window.getSelection();
      if (sel && range) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else if ((document as any).caretPositionFromPoint) {
      const position = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
      const range = document.createRange();
      if (position) {
        range.setStart(position.offsetNode, position.offset);
        range.collapse(true);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {!disabled && editing && (
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
          onMouseDown={e => e.preventDefault()}
        >
          <button onClick={() => exec("formatBlock", "<h2>")} style={toolbarBtnStyle} title="Heading 2">H2</button>
          <button onClick={() => exec("formatBlock", "<h3>")} style={toolbarBtnStyle} title="Heading 3">H3</button>
          <button onClick={() => exec("formatBlock", "<p>")} style={toolbarBtnStyle} title="Paragraph">P</button>
          <div style={{ width: 1, background: "var(--panel-border)", margin: "0 2px" }} />

          <button onClick={() => exec("bold")} style={toolbarBtnStyle} title="Թավ (Bold)"><b>B</b></button>
          <button onClick={() => exec("italic")} style={toolbarBtnStyle} title="Շեղ (Italic)"><i>I</i></button>
          <button onClick={() => exec("underline")} style={toolbarBtnStyle} title="Ընդգծված (Underline)"><u>U</u></button>
          <button onClick={() => exec("strikeThrough")} style={toolbarBtnStyle} title="Ջնջված (Strikethrough)"><s>S</s></button>
          <div style={{ width: 1, background: "var(--panel-border)", margin: "0 2px" }} />

          <button onClick={() => exec("justifyLeft")} style={toolbarBtnStyle} title="Ձախից">←</button>
          <button onClick={() => exec("justifyCenter")} style={toolbarBtnStyle} title="Կենտրոնից">↔</button>
          <button onClick={() => exec("justifyRight")} style={toolbarBtnStyle} title="Աջից">→</button>
          <button onClick={() => exec("justifyFull")} style={toolbarBtnStyle} title="Հավասարեցնել">═</button>
          <div style={{ width: 1, background: "var(--panel-border)", margin: "0 2px" }} />

          <button onClick={() => exec("insertUnorderedList")} style={toolbarBtnStyle} title="Բուլետներ (Bullet List)">• List</button>
          <button onClick={() => {
            const url = prompt("Մուտքագրեք հղումը (URL):", "https://");
            if (url) exec("createLink", url);
          }} style={toolbarBtnStyle} title="Ավելացնել հղում">🔗</button>
          <div style={{ width: 1, background: "var(--panel-border)", margin: "0 2px" }} />

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
        contentEditable={!disabled}
        suppressContentEditableWarning
        onFocus={() => { if (!disabled) setEditing(true); }}
        onBlur={() => setEditing(false)}
        onInput={handleInput}
        onDragEnter={(e) => {
          if (!disabled && e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setIsDragOver(true);
          }
        }}
        onDragOver={(e) => {
          if (!disabled && e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setIsDragOver(true);
          }
        }}
        onDragLeave={() => {
          setIsDragOver(false);
        }}
        onDrop={async (e) => {
          setIsDragOver(false);
          if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            e.preventDefault();
            setCaretFromPoint(e);
            const imageFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith("image/"));
            const total = imageFiles.length;
            for (let i = 0; i < total; i++) {
              const file = imageFiles[i];
              if (onUpload) {
                const url = await onUpload(file, i + 1, total);
                if (url) {
                  exec("insertHTML", `<img src="${url}" style="max-width: 100%; border-radius: 8px; margin: 10px 0; display: block;" alt="" />`);
                }
              }
            }
          }
        }}
        style={{
          ...style,
          outline: isDragOver 
            ? "2px dashed rgba(0,255,204,0.8)" 
            : !disabled && editing 
              ? "2px solid rgba(0,255,204,0.6)" 
              : "2px solid transparent",
          backgroundColor: isDragOver ? "rgba(0,255,204,0.05)" : "transparent",
          borderRadius: "6px",
          padding: "6px",
          minHeight: "40px",
          whiteSpace: "normal",
          transition: "outline 0.2s, background-color 0.2s",
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
  const [selected, setSelected] = useState<number | null>(null); 
  const [editorLang, setEditorLang] = useState<'am' | 'en'>('am'); 
  const [heroDragOver, setHeroDragOver] = useState(false);
  const [fileDragOverBlockIdx, setFileDragOverBlockIdx] = useState<number | null>(null);
  const [canvasDragOver, setCanvasDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [dynamicScale, setDynamicScale] = useState(1);

  const [form, setForm] = useState<Case>({
    id, title: "", subtitle: "", bg: GRADIENT_PRESETS[0].value,
    image_url: "", details: "[]", category: id.startsWith('port-') ? "Design" : "Branding", client: "", year: new Date().getFullYear().toString()
  });
  const [blocks, setBlocks] = useState<CaseBlock[]>([]);

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below' | null>(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(true);

  const [propPos, setPropPos] = useState({ x: 200, y: 150 });
  const [draggingProp, setDraggingProp] = useState(false);
  const propStart = useRef({ x: 0, y: 0 });

  const [layersPos, setLayersPos] = useState({ x: 200, y: 480 });
  const [draggingLayers, setDraggingLayers] = useState(false);
  const layersStart = useRef({ x: 0, y: 0 });

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

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("hdesign_admin_token") : null;
    if (!t) { router.push("/admin"); return; }
    setToken(t);
    load(t);
  }, [id]);

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

  const recalculateScale = () => {
    if (!reorderMode) {
      setDynamicScale(1);
      return;
    }
    const container = document.getElementById("live-preview-container");
    const inner = document.getElementById("live-preview-inner-wrapper");
    if (container && inner) {
      const containerHeight = container.clientHeight - 40;
      const innerHeight = inner.scrollHeight;
      if (innerHeight > 0) {
        const scale = Math.max(0.15, Math.min(0.9, containerHeight / innerHeight));
        setDynamicScale(scale);
      }
    }
  };

  useEffect(() => {
    recalculateScale();
    if (reorderMode) {
      window.addEventListener("resize", recalculateScale);
      const timer = setTimeout(recalculateScale, 150);
      return () => {
        window.removeEventListener("resize", recalculateScale);
        clearTimeout(timer);
      };
    }
  }, [reorderMode, blocks]);

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

  const upd = (i: number, b: CaseBlock) => setBlocks(p => p.map((x, j) => j === i ? b : x));
  const del = (i: number) => { setBlocks(p => p.filter((_, j) => j !== i)); if (selected === i) setSelected(null); };
  const mov = (i: number, d: "up" | "down") => setBlocks(p => {
    const a = [...p], j = d === "up" ? i - 1 : i + 1;
    if (j >= 0 && j < a.length) { const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  });
  const add = (type: BlockType) => { setBlocks(p => [...p, makeBlock(type)]); setSelected(blocks.length); };

  async function upload(file: File, current: number = 1, total: number = 1): Promise<string | null> {
    if (!token) return null;
    setUploading(true);
    setUploadProgress({ current, total });

    let fileToUpload = file;
    try {
      const { compressImage } = await import("@/lib/imageCompression");
      fileToUpload = await compressImage(file);
    } catch (compressErr) {
      console.warn("Failed to compress image, uploading original:", compressErr);
    }

    const isGallery = id.startsWith('port-') || form.category?.toLowerCase() === 'gallery' || form.category?.toLowerCase() === 'design';
    const targetBucket = isGallery ? 'gallery' : 'branding';

    const fd = new FormData();
    fd.append("file", fileToUpload);
    fd.append("bucket", targetBucket);
    try {
      const r = await fetch("/api/upload", { method: "POST", headers: { Authorization: token }, body: fd });
      const d = await r.json(); return r.ok ? d.url : null;
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

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
    <LoadingAnimation message="Բեռնվում է WYSIWYG խմբագրիչը..." />
  );

  return (
    <div style={{ 
      background: "var(--bg)", 
      color: "var(--text)", 
      height: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      fontFamily: "HDesign, sans-serif",
      ['--hue' as any]: '172',
      ['--saturation' as any]: '77%',
      ['--lightness' as any]: '14%',
      ['--text-lightness' as any]: '14%',
      ['--text-color-custom' as any]: '#083f39'
    }}>
      {uploadProgress && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}>
          <div style={{
            background: "var(--panel)",
            border: "1px solid var(--panel-border)",
            borderRadius: 20,
            padding: "32px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
            maxWidth: 380,
            width: "90%",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "2.5rem" }}>📤</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text)" }}>
                {editorLang === "am" ? "Պատկերների վերբեռնում" : "Uploading Images"}
              </span>
              <span style={{ fontSize: "0.88rem", color: "var(--muted)" }}>
                {editorLang === "am" 
                  ? `Բեռնվում է ${uploadProgress.current}-ը ${uploadProgress.total} պատկերից`
                  : `Uploading ${uploadProgress.current} of ${uploadProgress.total} images`}
              </span>
            </div>
            
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              <div style={{ width: "100%", height: 8, background: "var(--input-bg)", border: "1px solid var(--panel-border)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                  height: "100%",
                  background: "var(--accent)",
                  boxShadow: "0 0 8px var(--accent)",
                  borderRadius: 4,
                  transition: "width 0.3s ease-out"
                }} />
              </div>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent)" }}>
                {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 58, background: "var(--panel)", borderBottom: "1px solid var(--panel-border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", position: "sticky", top: 0, zIndex: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/admin?tab=cases" style={{ textDecoration: "none" }}>
            <button style={{ padding: "6px 14px", background: "var(--btn-bg)", border: "1px solid var(--panel-border)", borderRadius: 8, color: "var(--text)", cursor: "pointer", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 6 }}>
              ← Վարիչ
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
            <div style={{ background: "transparent", color: "var(--muted)" }}>
              <hd-button data-width="100px" data-height="34px" data-thickness="3px">
                Տեսնել →
              </hd-button>
            </div>
          </Link>
          <button
            onClick={() => {
              setReorderMode(!reorderMode);
              if (!reorderMode) {
                setShowLayersPanel(true);
              }
            }}
            style={{
              padding: "6px 14px",
              background: reorderMode ? "var(--accent)" : "var(--btn-bg)",
              border: "1px solid var(--panel-border)",
              borderRadius: 8,
              color: reorderMode ? "var(--bg)" : "var(--text)",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s"
            }}
          >
            🔄 {reorderMode ? (editorLang === "en" ? "Exit Reorder" : "Ավարտել դասավորումը") : (editorLang === "en" ? "Reorder Blocks" : "Վերադասավորել")}
          </button>
          <hd-button onClick={save} disabled={saving} data-width="120px" data-height="34px" data-thickness="3px">
            {saving ? "Պահպանվում..." : "Պահպանել"}
          </hd-button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", flex: 1, minHeight: "calc(100vh - 58px)", overflow: "hidden" }}>

        <div 
          onDragOver={e => {
            if (!reorderMode && draggedIdx === null && e.dataTransfer.types.includes("Files")) {
              e.preventDefault();
              setCanvasDragOver(true);
            }
          }}
          onDragLeave={() => setCanvasDragOver(false)}
          onDrop={async e => {
            setCanvasDragOver(false);
            if (!reorderMode && draggedIdx === null && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              e.preventDefault();
              const imageFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith("image/"));
              const total = imageFiles.length;
              for (let i = 0; i < total; i++) {
                const file = imageFiles[i];
                const url = await upload(file, i + 1, total);
                if (url) {
                  setBlocks(p => {
                    const newBlock: CaseBlock = { type: "image", image_url: url, caption_am: "", caption_en: "", fullWidth: true };
                    if (selected !== null && selected >= 0 && selected < p.length) {
                      const list = [...p];
                      list.splice(selected + 1, 0, newBlock);
                      return list;
                    } else {
                      return [...p, newBlock];
                    }
                  });
                  setSelected(prev => (prev !== null ? prev + 1 : blocks.length));
                }
              }
            }
          }}
          id="live-preview-container"
          style={{
            overflowY: reorderMode ? "hidden" : "auto",
            maxHeight: "calc(100vh - 58px)",
            background: "var(--bg)",
            position: "relative",
            display: reorderMode ? "flex" : "block",
            alignItems: reorderMode ? "center" : "normal",
            justifyContent: reorderMode ? "center" : "normal",
            padding: reorderMode ? "20px" : "0",
            boxSizing: "border-box"
          }}
        >
          {canvasDragOver && (
            <div style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0, 255, 204, 0.08)",
              backdropFilter: "blur(4px)",
              border: "3px dashed var(--accent)",
              borderRadius: 8,
              margin: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              pointerEvents: "none"
            }}>
              <div style={{
                background: "var(--panel)",
                border: "1px solid var(--panel-border)",
                padding: "20px 40px",
                borderRadius: 16,
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                color: "var(--accent)",
                fontSize: "1.2rem",
                fontWeight: "bold",
                textAlign: "center"
              }}>
                📥 Բաց թողեք նկարները նոր բլոկներ ստեղծելու համար
                <span style={{ display: "block", fontSize: "0.85rem", color: "var(--muted)", marginTop: 8 }}>
                  (Drop images to create new image blocks)
                </span>
              </div>
            </div>
          )}

          <div 
            id="live-preview-inner-wrapper"
            style={{
              transform: reorderMode ? `scale(${dynamicScale})` : "none",
              transformOrigin: "center center",
              width: "100%",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: reorderMode ? "0 20px 50px rgba(0,0,0,0.5)" : "none",
              borderRadius: reorderMode ? "20px" : "0",
              border: reorderMode ? "8px solid #1e293b" : "none",
              outline: reorderMode ? "2px solid var(--accent)" : "none",
              overflow: reorderMode ? "hidden" : "visible",
              background: "var(--bg)",
              flexShrink: 0
            }}
          >
            {reorderMode && (
              <div style={{
                height: 28,
                background: "#1e293b",
                borderBottom: "1px solid var(--panel-border)",
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                gap: 6,
                userSelect: "none"
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f56" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffbd2e" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#27c93f" }} />
                <div style={{
                  flex: 1,
                  margin: "0 20px",
                  height: 18,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.65rem",
                  color: "var(--muted)",
                  fontFamily: "monospace"
                }}>
                  hdesign.com/works/{id}
                </div>
              </div>
            )}

          {(() => {
            const hero = parseBg(form.bg);
            return (
              <div 
                onDragOver={e => {
                  if (!reorderMode && e.dataTransfer.types.includes("Files")) {
                    e.preventDefault();
                    setHeroDragOver(true);
                  }
                }}
                onDragLeave={() => setHeroDragOver(false)}
                onDrop={async e => {
                  setHeroDragOver(false);
                  if (!reorderMode && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    e.preventDefault();
                    const url = await upload(e.dataTransfer.files![0]);
                    if (url) setForm(p => ({ ...p, image_url: url }));
                  }
                }}
                style={{ position: "relative", width: "100%", height: `${hero.height}vh`, background: hero.bg, overflow: "hidden", display: "flex", alignItems: "flex-end" }}
              >
                {heroDragOver && (
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0, 255, 204, 0.15)",
                    backdropFilter: "blur(6px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "3px dashed var(--accent)",
                    zIndex: 100,
                    color: "#ffffff",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    textShadow: "0 2px 4px rgba(0,0,0,0.5)"
                  }}>
                    📥 Բաց թողեք շապիկի նկարը վերբեռնելու համար (Drop to upload cover)
                  </div>
                )}
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
                  <Editable tag="span" disabled={reorderMode} value={parseLangText(form.category, editorLang) || (editorLang === "en" ? "Branding" : "Բրենդավորում")} onChange={v => setForm(p => ({ ...p, category: updateLangText(form.category, v, editorLang) }))}
                    style={{ fontSize: "0.9rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "3px", color: "#ffffff", opacity: 0.8 }} />
                  <Editable tag="h1" disabled={reorderMode} value={parseLangText(form.title, editorLang) || (editorLang === "en" ? "Title" : "Վերնագիր")} onChange={v => setForm(p => ({ ...p, title: updateLangText(form.title, v, editorLang) }))}
                    style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, color: "#ffffff", margin: 0, lineHeight: "1.1", width: "100%" }} />
                  <Editable tag="p" disabled={reorderMode} value={parseLangText(form.subtitle, editorLang) || (editorLang === "en" ? "Subtitle" : "Ենթավերնագիր")} onChange={v => setForm(p => ({ ...p, subtitle: updateLangText(form.subtitle, v, editorLang) }))}
                    style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", color: "#ffffff", opacity: 0.9, margin: 0, maxWidth: "700px", width: "100%" }} />
                </div>
              </div>
            );
          })()}

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

          <div style={{ background: "rgba(0,255,204,0.04)", borderBottom: "1px solid rgba(0,255,204,0.08)", padding: "8px 48px", display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ffcc", flexShrink: 0 }} />
            <span style={{ fontSize: "0.75rem", color: "#66ddb5" }}>Սեղմեք ցանկացած տեքստի վրա՝ խմբագրելու համար: Քաշեք և գցեք բլոկները (Drag & Drop)՝ դասավորությունը փոխելու համար:</span>
          </div>

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
                    
                    {showIndicatorAbove && (
                      <div style={{ height: "4px", background: "var(--accent)", borderRadius: "2px", margin: "12px 24px" }} />
                    )}

                    <div
                      draggable={reorderMode}
                      onDragStart={reorderMode ? e => handleDragStart(e, idx) : undefined}
                      onDragEnd={reorderMode ? handleDragEnd : undefined}
                      onDragOver={e => handleDragOver(e, idx)}
                      onDrop={e => handleDrop(e, idx)}
                      onClick={() => !reorderMode && setSelected(idx)}
                      style={{
                        position: "relative",
                        outline: isSel && !reorderMode ? "2px solid rgba(0,255,204,0.5)" : "2px solid transparent",
                        border: reorderMode ? "2px dashed rgba(0,255,204,0.3)" : "2px solid transparent",
                        backgroundColor: reorderMode ? (isSel ? "rgba(0,255,204,0.04)" : "rgba(255,255,255,0.02)") : "transparent",
                        borderRadius: reorderMode ? "12px" : "0",
                        marginTop: reorderMode ? "8px" : `${(block as any).marginTop ?? 0}px`,
                        marginBottom: reorderMode ? "8px" : `${(block as any).marginBottom ?? 0}px`,
                        marginLeft: reorderMode ? "24px" : "0",
                        marginRight: reorderMode ? "24px" : "0",
                        transition: "all 0.2s ease",
                        width: reorderMode ? "calc(100% - 48px)" : "100%",
                        padding: reorderMode ? "12px" : "0",
                        cursor: reorderMode ? "grab" : "default",
                      }}
                    >
                      {isSel && !reorderMode && (
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

                      {block.type === "text" && (
                        <div style={{ maxWidth: 800, width: "100%", margin: "0 auto", padding: reorderMode ? "12px 24px" : "0 24px", boxSizing: "border-box" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <Editable tag="h2" disabled={reorderMode} value={editorLang === "am" ? block.title_am : block.title_en} onChange={v => upd(idx, { ...block, [editorLang === "am" ? "title_am" : "title_en"]: v })}
                              style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text)", margin: 0 }} />
                            <RichEditable disabled={reorderMode} value={editorLang === "am" ? block.content_am : block.content_en} onChange={v => upd(idx, { ...block, [editorLang === "am" ? "content_am" : "content_en"]: v })}
                              onUpload={upload}
                              style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "var(--text)", opacity: 0.85, margin: 0 }} />
                          </div>
                        </div>
                      )}

                      {block.type === "image" && (
                        <div 
                          onDragOver={e => {
                            if (!reorderMode && e.dataTransfer.types.includes("Files")) {
                              e.preventDefault();
                              setFileDragOverBlockIdx(idx);
                            }
                          }}
                          onDragLeave={() => setFileDragOverBlockIdx(null)}
                          onDrop={async e => {
                            setFileDragOverBlockIdx(null);
                            if (!reorderMode && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                              e.preventDefault();
                              const url = await upload(e.dataTransfer.files![0]);
                              if (url) upd(idx, { ...block, image_url: url });
                            }
                          }}
                          style={{ 
                            width: "100%", 
                            display: "flex", 
                            flexDirection: "column", 
                            alignItems: "center", 
                            margin: "0",
                            position: "relative",
                            minHeight: reorderMode ? 60 : 100
                          }}
                        >
                          {fileDragOverBlockIdx === idx && (
                            <div style={{
                              position: "absolute",
                              inset: 0,
                              background: "rgba(0, 255, 204, 0.12)",
                              backdropFilter: "blur(3px)",
                              border: "2px dashed var(--accent)",
                              borderRadius: 12,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              zIndex: 10,
                              color: "var(--accent)",
                              fontWeight: "bold",
                              fontSize: "1rem"
                            }}>
                              📥 Բաց թողեք նկարը այստեղ տեղադրելու համար (Drop image here)
                            </div>
                          )}
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
                              <Editable tag="span" disabled={reorderMode} value={(editorLang === "am" ? block.caption_am : block.caption_en) || "Ավելացնել նկարագրություն..."} onChange={v => upd(idx, { ...block, [editorLang === "am" ? "caption_am" : "caption_en"]: v })}
                                style={{ fontSize: "0.85rem", color: "var(--muted)", fontStyle: "italic" }} />
                            </div>
                          )}
                        </div>
                      )}

                      {block.type === "embed" && (
                        <div style={{ width: "100%", margin: "0" }}>
                          {block.embed_url ? (
                            <div style={{ width: "100%", aspectRatio: reorderMode ? "21/5" : "16/9", overflow: "hidden" }}>
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

                      {block.type === "color_palette" && (
                        <div style={{ maxWidth: 800, width: "100%", margin: "0 auto", padding: reorderMode ? "12px 24px" : "0 24px", boxSizing: "border-box" }}>
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

                      {block.type === "typography_showcase" && (
                        <div style={{ maxWidth: 800, width: "100%", margin: "0 auto", padding: reorderMode ? "12px 24px" : "0 24px", boxSizing: "border-box" }}>
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
                <div key={type} style={{ color, background: `${color}18`, border: `1px solid ${color}44`, borderRadius: "var(--border-radius, 12px)", overflow: "hidden" }}>
                  <hd-button onClick={() => add(type)} data-width="100%" data-height="36px" data-thickness="3px">
                    + {label}
                  </hd-button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Windows Toggles ── */}
          <div style={{ padding: 18, borderTop: "1px solid var(--panel-border)" }}>
            <SectionLabel>Գործիքներ</SectionLabel>
            <div style={{ background: "transparent" }}>
              <hd-button onClick={() => setShowLayersPanel(true)} data-width="100%" data-height="34px" data-thickness="3px">
                🥞 Բացել Շերտերի պատուհանը
              </hd-button>
            </div>
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
                  <div style={{ background: "transparent" }}>
                    <hd-button onClick={() => upd(selected, { ...block, colors: [...block.colors, "#ffffff"] })}
                      data-width="100%" data-height="34px" data-thickness="3px">
                      + Ավելացնել Գույն
                    </hd-button>
                  </div>
                </div>
              )}

              {block.type === "typography_showcase" && (<>
                <Field label="Տառատեսակ (Outfit, Inter)" value={block.fonts.join(", ")} onChange={v => upd(selected, { ...block, fonts: v.split(",").map(s => s.trim()) })} />
                <Field label="Ցուցադրման Տեքստ" value={block.previewText} onChange={v => upd(selected, { ...block, previewText: v })} />
              </>)}

              {/* Spacing Settings */}
              <div style={{ borderTop: "1px solid var(--panel-border)", paddingTop: 12, marginTop: 4, display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {editorLang === "am" ? "Տարածություններ (Margins)" : "Spacing (Margins)"}
                </span>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                      {editorLang === "am" ? "Վերևի տարածություն (Margin Top)" : "Margin Top"}
                    </span>
                    <span style={{ fontSize: "0.72rem", fontWeight: "bold", color: "var(--text)" }}>{(block as any).marginTop ?? 0}px</span>
                  </div>
                  <hd-slider 
                    min="0" 
                    max="200" 
                    value={((block as any).marginTop ?? 0).toString()} 
                    onInput={(e: any) => upd(selected, { ...block, marginTop: parseInt(e.target.value) || 0 })} 
                    data-width="100%" 
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                      {editorLang === "am" ? "Ներքևի տարածություն (Margin Bottom)" : "Margin Bottom"}
                    </span>
                    <span style={{ fontSize: "0.72rem", fontWeight: "bold", color: "var(--text)" }}>{(block as any).marginBottom ?? 0}px</span>
                  </div>
                  <hd-slider 
                    min="0" 
                    max="200" 
                    value={((block as any).marginBottom ?? 0).toString()} 
                    onInput={(e: any) => upd(selected, { ...block, marginBottom: parseInt(e.target.value) || 0 })} 
                    data-width="100%" 
                  />
                </div>
              </div>
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
      <hd-input value={value} onInput={(e: any) => onChange(e.target.value)} data-width="100%" data-height="34px" data-font-size="14pt" />
    </div>
  );
}

function FieldArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{label}</span>}
      <div style={{ minHeight: "100px", display: "flex", flexDirection: "column" }}>
        <hd-textarea value={value} onInput={(e: any) => onChange(e.target.value)} data-width="100%" data-font-size="14pt" data-height="200pt" />
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{label}</span>
      <hd-switch checked={checked} data-thickness="4px" onChange={(e: any) => onChange(e.target.checked)} />
    </div>
  );
}

const uploadLabelStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  height: 34, background: "rgba(255,255,255,0.04)", border: "1px solid var(--panel-border)",
  borderRadius: 8, color: "var(--muted)", cursor: "pointer", fontSize: "0.78rem", gap: 6,
};
