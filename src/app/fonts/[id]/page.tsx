"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import RatingSystem from "@/components/RatingSystem";
import LoadingAnimation from "@/components/LoadingAnimation";
import MediaLightbox, { MediaLightboxItem } from "@/components/MediaLightbox";

type Font = {
  id: string;
  name_am: string;
  name_en: string;
  category: string;
  creator?: string;
  year?: string;
  description_am?: string;
  description_en?: string;
  downloadable: boolean;
  paid: boolean;
  price?: string;
  font_file_url: string;
  download_url?: string;
  purchase_url?: string;
  created_at?: string;
};

// Character sets for map
const CHARS_AM = "ԱաԲբԳգԴդԵեԶզԷէԸըԹթԺժԻիԼլԽխԾծԿկՀհՁձՂղՃճՄմՅյՆնՇշՈոՉչՊպՋջՌռՍսՎվՏտՐրՑցՒւՓփՔքՕօՖֆև՛՜՝՞։֊՚՟ՙ֍֎֏ՠֈﬓﬔﬕﬖﬗ".split("");
const CHARS_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
const CHARS_NUM = "0123456789".split("");
const CHARS_SYM = "!@#$%^&*()_+-=[]{};:'\",./<>?".split("");

function getCharacterName(c: string): string {
  const code = c.charCodeAt(0);
  
  // English letters
  if (code >= 65 && code <= 90) return `Latin Capital Letter ${c}`;
  if (code >= 97 && code <= 122) return `Latin Small Letter ${c}`;
  
  // Numbers
  if (code >= 48 && code <= 57) return `Digit ${c}`;
  
  // Armenian letters
  const armenianNames: Record<number, string> = {
    0x0531: "Armenian Capital Letter Ayb (Ա)",
    0x0561: "Armenian Small Letter Ayb (ա)",
    0x0532: "Armenian Capital Letter Ben (Բ)",
    0x0562: "Armenian Small Letter Ben (բ)",
    0x0533: "Armenian Capital Letter Gim (Գ)",
    0x0563: "Armenian Small Letter Gim (գ)",
    0x0534: "Armenian Capital Letter Da (Դ)",
    0x0564: "Armenian Small Letter Da (դ)",
    0x0535: "Armenian Capital Letter Ech (Ե)",
    0x0565: "Armenian Small Letter Ech (ե)",
    0x0536: "Armenian Capital Letter Za (Զ)",
    0x0566: "Armenian Small Letter Za (զ)",
    0x0537: "Armenian Capital Letter Eh (Է)",
    0x0567: "Armenian Small Letter Eh (է)",
    0x0538: "Armenian Capital Letter Et (Ը)",
    0x0568: "Armenian Small Letter Et (ը)",
    0x0539: "Armenian Capital Letter To (Թ)",
    0x0569: "Armenian Small Letter To (թ)",
    0x053A: "Armenian Capital Letter Zhe (Ժ)",
    0x056A: "Armenian Small Letter Zhe (ժ)",
    0x053B: "Armenian Capital Letter Ini (Ի)",
    0x056B: "Armenian Small Letter Ini (ի)",
    0x053C: "Armenian Capital Letter Liun (Լ)",
    0x056C: "Armenian Small Letter Liun (լ)",
    0x053D: "Armenian Capital Letter Khe (Խ)",
    0x056D: "Armenian Small Letter Khe (խ)",
    0x053E: "Armenian Capital Letter Tsa (Ծ)",
    0x056E: "Armenian Small Letter Tsa (ծ)",
    0x053F: "Armenian Capital Letter Ken (Կ)",
    0x056F: "Armenian Small Letter Ken (կ)",
    0x0540: "Armenian Capital Letter Ho (Հ)",
    0x0570: "Armenian Small Letter Ho (հ)",
    0x0541: "Armenian Capital Letter Dzha (Ձ)",
    0x0571: "Armenian Small Letter Dzha (ձ)",
    0x0542: "Armenian Capital Letter Ghad (Ղ)",
    0x0572: "Armenian Small Letter Ghad (ղ)",
    0x0543: "Armenian Capital Letter Tche (Ճ)",
    0x0573: "Armenian Small Letter Tche (ճ)",
    0x0544: "Armenian Capital Letter Men (Մ)",
    0x0574: "Armenian Small Letter Men (մ)",
    0x0545: "Armenian Capital Letter Yi (Յ)",
    0x0575: "Armenian Small Letter Yi (յ)",
    0x0546: "Armenian Capital Letter Nu (Ն)",
    0x0576: "Armenian Small Letter Nu (ն)",
    0x0547: "Armenian Capital Letter Sha (Շ)",
    0x0577: "Armenian Small Letter Sha (շ)",
    0x0548: "Armenian Capital Letter Vo (Ո)",
    0x0578: "Armenian Small Letter Vo (ո)",
    0x0549: "Armenian Capital Letter Cha (Չ)",
    0x0579: "Armenian Small Letter Cha (չ)",
    0x054A: "Armenian Capital Letter Pe (Պ)",
    0x057A: "Armenian Small Letter Pe (պ)",
    0x054B: "Armenian Capital Letter Dzhe (Ջ)",
    0x057B: "Armenian Small Letter Dzhe (ջ)",
    0x054C: "Armenian Capital Letter Ra (Ռ)",
    0x057C: "Armenian Small Letter Ra (ռ)",
    0x054D: "Armenian Capital Letter Se (Ս)",
    0x057D: "Armenian Small Letter Se (ս)",
    0x054E: "Armenian Capital Letter Vev (Վ)",
    0x057E: "Armenian Small Letter Vev (վ)",
    0x054F: "Armenian Capital Letter Tiun (Տ)",
    0x057F: "Armenian Small Letter Tiun (տ)",
    0x0550: "Armenian Capital Letter Re (Ր)",
    0x0580: "Armenian Small Letter Re (ր)",
    0x0551: "Armenian Capital Letter Tso (Ց)",
    0x0581: "Armenian Small Letter Tso (ց)",
    0x0552: "Armenian Capital Letter Yiun (Ւ)",
    0x0582: "Armenian Small Letter Yiun (ւ)",
    0x0553: "Armenian Capital Letter Piur (Փ)",
    0x0583: "Armenian Small Letter Piur (փ)",
    0x0554: "Armenian Capital Letter Ke (Ք)",
    0x0584: "Armenian Small Letter Ke (ք)",
    0x0555: "Armenian Capital Letter Oh (Օ)",
    0x0585: "Armenian Small Letter Oh (օ)",
    0x0556: "Armenian Capital Letter Fe (Ֆ)",
    0x0586: "Armenian Small Letter Fe (ֆ)",
    0x0587: "Armenian Small Letter Ew (և)",
    0x0559: "Armenian Modifier (ՙ)",
    0x055A: "Armenian Apostrophe (՚)",
    0x055B: "Armenian Emphasis Mark (՛)",
    0x055C: "Armenian Exclamation Mark (՜)",
    0x055D: "Armenian Shesht (՝)",
    0x055E: "Armenian Question Mark (՞)",
    0x055F: "Armenian Abbreviation Mark (՟)",
    0x0589: "Armenian Full Stop (։)",
    0x058A: "Armenian Hyphen (֊)",
    0x058F: "Armenian Dram Sign (֏)",
    0x058D: "Armenian Right-Facing Eternity Sign (֍)",
    0x058E: "Armenian Left-Facing Eternity Sign (֎)",
    0x0530: "Armenian Modifier",
    0x0588: "Armenian Yiun Modifier",
    0x058C: "Armenian Semicolon",
  };
  
  if (armenianNames[code]) return armenianNames[code];

  // Ligatures
  if (c === "ﬓ") return "Armenian Ligature Men-Now (ﬓ)";
  if (c === "ﬔ") return "Armenian Ligature Men-Ech (ﬔ)";
  if (c === "ﬕ") return "Armenian Ligature Men-Ini (ﬕ)";
  if (c === "ﬖ") return "Armenian Ligature Men-Vev (ﬖ)";
  if (c === "ﬗ") return "Armenian Ligature Men-Tiun (ﬗ)";

  // Common symbols
  const symbolNames: Record<string, string> = {
    "!": "Exclamation Mark",
    "@": "At Sign",
    "#": "Number Sign / Hashtag",
    "$": "Dollar Sign",
    "%": "Percent Sign",
    "^": "Caret / Circumflex",
    "&": "Ampersand",
    "*": "Asterisk",
    "(": "Left Parenthesis",
    ")": "Right Parenthesis",
    "_": "Low Line / Underscore",
    "+": "Plus Sign",
    "-": "Hyphen-Minus",
    "=": "Equals Sign",
    "[": "Left Square Bracket",
    "]": "Right Square Bracket",
    "{": "Left Curly Bracket",
    "}": "Right Curly Bracket",
    ";": "Semicolon",
    ":": "Colon",
    "'": "Apostrophe / Single Quote",
    "\"": "Quotation Mark / Double Quote",
    ",": "Comma",
    ".": "Full Stop / Period",
    "/": "Solidus / Slash",
    "<": "Less-Than Sign",
    ">": "Greater-Than Sign",
    "?": "Question Mark",
    "~": "Tilde",
    "`": "Grave Accent",
    "|": "Vertical Line / Pipe",
    "\\": "Reverse Solidus / Backslash",
  };

  if (symbolNames[c]) return symbolNames[c];

  return `Unicode Character`;
}

export default function FontDetailPage() {
  const { locale, t } = useI18n();
  const params = useParams();
  const id = params?.id as string;

  const [font, setFont] = useState<Font | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpecimenIndex, setSelectedSpecimenIndex] = useState<number | null>(null);

  // Playground States
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(48); // px
  const [letterSpacing, setLetterSpacing] = useState(0); // px
  const [lineHeight, setLineHeight] = useState(1.4);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right" | "justify">("left");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [textCase, setTextCase] = useState<"none" | "uppercase" | "lowercase">("none");
  const [textColor, setTextColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#0b4a41"); // Matches default panel color
  const activePreviewText = t("fonts", "preview_text_default", "Հրանտ Հակոբյան Դիզայն 2026");

  // Variability & OpenType States
  const [wght, setWght] = useState(400);
  const [slnt, setSlnt] = useState(0);
  const [wdth, setWdth] = useState(100);
  const [ital, setItal] = useState(0);

  const [ligatures, setLigatures] = useState(true);
  const [kerning, setKerning] = useState(true);
  const [smallCaps, setSmallCaps] = useState(false);
  const [oldstyleNums, setOldstyleNums] = useState(false);

  useEffect(() => {
    async function loadFont() {
      try {
        const res = await fetch("/api/fonts");
        if (!res.ok) throw new Error("Failed to fetch fonts");
        const data = (await res.json()) as Font[];
        const found = data.find((f) => f.id === id);
        if (!found) throw new Error("Font not found");
        setFont(found);
        
        setText(t("fonts", "sandbox_default_text", "Հրանտ Հակոբյան Դիզայն Ստուդիա: Այստեղ կարող եք գրել ցանկացած տեքստ տառատեսակը փորձարկելու համար:"));
      } catch (err: any) {
        setError(err.message || "Failed to load font details");
      } finally {
        setLoading(false);
      }
    }
    loadFont();
  }, [id, locale]);

  // Handle Preset Colors
  const applyPresetTheme = (theme: "dark" | "light" | "green") => {
    if (theme === "dark") {
      setTextColor("#ffffff");
      setBgColor("#0f172a");
    } else if (theme === "light") {
      setTextColor("#0f172a");
      setBgColor("#ffffff");
    } else if (theme === "green") {
      setTextColor("#ffffff");
      setBgColor("#0b4a41");
    }
  };

  // Waterfall sizes helper
  const waterfallSizes = [72, 48, 36, 24, 18, 14, 12];

  // Filter valid specimen presentation blocks
  const specimenBlocks = useMemo(() => {
    if (!font?.description_am || !font.description_am.startsWith("[")) return [];
    try {
      const parsed = JSON.parse(font.description_am);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((block: any) => {
        if (!block || typeof block !== "object") return false;
        if (block.type === "text" && (block.content_am || block.content_en)) return true;
        if (block.type === "specimen_banner" && block.previewText) return true;
        if (block.type === "weights_comparison" && block.previewText) return true;
        if (block.type === "glyph_showcase" && block.letters) return true;
        if (block.type === "image" && block.image_url) return true;
        return false;
      });
    } catch (e) {
      return [];
    }
  }, [font]);



  // Loading indicator
  if (loading) {
    return (
      <main className="shell" style={{ paddingTop: "200px", minHeight: "75vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingAnimation fullPage={false} message={t("fonts", "loading_details", "Տվյալները բեռնվում են...")} />
      </main>
    );
  }

  // Error indicator
  if (error || !font) {
    return (
      <main className="shell" style={{ paddingTop: "200px", minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text)" }}>
          {t("fonts", "font_not_found", "Տառատեսակը չի գտնվել")}
        </h2>
        <Link href="/fonts" style={{ textDecoration: "none" }}>
          <hd-button data-width="180px" data-height="48px" data-thickness="3px">
            {t("fonts", "back_to_list", "Հետ դեպի ցուցակ")}
          </hd-button>
        </Link>
      </main>
    );
  }

  return (
    <main className="shell" style={{ paddingTop: "200px", minHeight: "85vh", paddingBottom: "100px" }}>
      {/* Load dynamically active Font Face */}
      <style
        key={`font-style-${font.id}`}
        dangerouslySetInnerHTML={{
          __html: `
            @font-face {
              font-family: 'playground-font-${font.id}';
              src: url('${font.font_file_url}') format('woff2'),
                   url('${font.font_file_url}') format('woff'),
                   url('${font.font_file_url}') format('opentype'),
                   url('${font.font_file_url}') format('truetype'),
                   url('${font.font_file_url}');
              font-display: swap;
            }
          `,
        }}
      />

      {/* Breadcrumb row */}
      <div style={{ marginBottom: "24px" }}>
        <Link href="/fonts" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--accent)", fontSize: "0.95rem", fontWeight: "bold" }}>
          <span className="icon-Chevrolt-Arrow-Left" />
          {t("fonts", "back_to_fonts", "Հետ դեպի տառատեսակներ")}
        </Link>
      </div>

      {/* Main Grid: Sandbox Playground (Left) vs Controls Sidebar (Right) */}
      <div 
        style={{ 
          width: "100%", 
          margin: "0", 
          display: "grid", 
          gridTemplateColumns: "3fr 1fr", 
          gap: "40px" 
        }} 
        className="font-playground-grid"
      >
        
        {/* Left Area: Canvas Testing Areas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "40px", minWidth: 0 }}>
          
          {/* Main Sandbox Canvas */}
          <div
            className="font-details-sandbox-canvas"
            style={{
              background: bgColor,
              border: "1px solid var(--panel-border)",
              borderRadius: "24px",
              padding: "40px",
              boxShadow: "var(--shadow)",
              position: "relative",
              minHeight: "350px",
              display: "flex",
              flexDirection: "column",
              transition: "background 0.3s ease",
            }}
          >
            {/* Color switcher presets in the canvas */}
            <div className="font-details-canvas-color-switcher" style={{ position: "absolute", top: "20px", right: "20px", display: "flex", gap: "8px", zIndex: 10 }}>
              <button onClick={() => applyPresetTheme("light")} style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.1)", width: "24px", height: "24px", borderRadius: "6px", cursor: "pointer" }} title="Light mode" />
              <button onClick={() => applyPresetTheme("dark")} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", width: "24px", height: "24px", borderRadius: "6px", cursor: "pointer" }} title="Dark mode" />
              <button onClick={() => applyPresetTheme("green")} style={{ background: "#0b4a41", border: "1px solid rgba(255,255,255,0.1)", width: "24px", height: "24px", borderRadius: "6px", cursor: "pointer" }} title="Green mode" />
            </div>

            {/* Canvas contenteditable area */}
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => setText(e.target.innerText)}
              className="preview-font-container"
              style={{
                fontFamily: `playground-font-${font.id}, sans-serif`,
                fontSize: `${fontSize}px`,
                letterSpacing: `${letterSpacing}px`,
                lineHeight: lineHeight,
                textAlign: textAlign,
                fontWeight: isBold ? "bold" : wght,
                fontStyle: isItalic ? "italic" : "normal",
                textTransform: textCase,
                color: textColor,
                outline: "none",
                flex: 1,
                border: "none",
                background: "transparent",
                wordBreak: "break-word",
                minHeight: "200px",
                fontVariationSettings: `'wght' ${wght}, 'slnt' ${slnt}, 'wdth' ${wdth}, 'ital' ${ital}`,
                fontVariantLigatures: ligatures ? "common-ligatures" : "none",
                fontKerning: kerning ? "normal" : "none",
                fontVariantCaps: smallCaps ? "small-caps" : "normal",
                fontVariantNumeric: oldstyleNums ? "oldstyle-nums" : "normal"
              }}
            >
              {text}
            </div>
          </div>

          {/* Waterfall Cascade Display */}
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid var(--panel-border)",
              borderRadius: "24px",
              padding: "32px",
              boxShadow: "var(--shadow)",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text)", margin: "0 0 24px 0" }}>
              {t("fonts", "waterfall", "Ջրվեժ (Waterfall)")}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {waterfallSizes.map((size) => (
                <div key={size} style={{ display: "flex", gap: "24px", borderBottom: "1px solid var(--panel-border)", paddingBottom: "16px", alignItems: "baseline" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)", width: "50px", flexShrink: 0 }}>
                    {size}px
                  </span>
                  <div
                    className="preview-font-container"
                    style={{
                      fontFamily: `playground-font-${font.id}, sans-serif`,
                      fontSize: `${size}px`,
                      letterSpacing: `${letterSpacing}px`,
                      lineHeight: lineHeight,
                      fontWeight: isBold ? "bold" : wght,
                      fontStyle: isItalic ? "italic" : "normal",
                      textTransform: textCase,
                      color: "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                      fontVariationSettings: `'wght' ${wght}, 'slnt' ${slnt}, 'wdth' ${wdth}, 'ital' ${ital}`,
                      fontVariantLigatures: ligatures ? "common-ligatures" : "none",
                      fontKerning: kerning ? "normal" : "none",
                      fontVariantCaps: smallCaps ? "small-caps" : "normal",
                      fontVariantNumeric: oldstyleNums ? "oldstyle-nums" : "normal"
                    }}
                  >
                    {text || activePreviewText}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Character Map Overview */}
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid var(--panel-border)",
              borderRadius: "24px",
              padding: "32px",
              boxShadow: "var(--shadow)",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text)", margin: "0 0 12px 0" }}>
              {t("fonts", "character_map", "Նիշերի քարտեզ")}
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--muted)", margin: "0 0 24px 0" }}>
              {t("fonts", "click_character", "Կտտացրեք նիշի վրա՝ այն տեքստային դաշտում ավելացնելու համար")}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Armenian Character Grid */}
              <div>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "12px" }}>Հայերեն (Armenian)</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(36px, 1fr))", gap: "8px" }}>
                  {CHARS_AM.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => setText((prev) => prev + c)}
                      className="character-cell preview-font-container"
                      style={{
                        fontFamily: `playground-font-${font.id}, sans-serif`,
                        height: "36px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid var(--panel-border)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.2rem",
                        cursor: "pointer",
                        userSelect: "none",
                        transition: "all 0.2s",
                        lineHeight: "1",
                        fontWeight: "normal",
                        fontVariationSettings: "normal",
                      }}
                    >
                      {c}
                      <div className="character-tooltip">
                        <div 
                          className="tooltip-large-char"
                          style={{
                            fontFamily: `playground-font-${font.id}, sans-serif`
                          }}
                        >
                          {c}
                        </div>
                        <div className="tooltip-name">
                          {getCharacterName(c)}
                        </div>
                        <div className="tooltip-code">
                          U+{c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* English Character Grid */}
              <div>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "12px" }}>Անգլերեն (English)</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(36px, 1fr))", gap: "8px" }}>
                  {CHARS_EN.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => setText((prev) => prev + c)}
                      className="character-cell preview-font-container"
                      style={{
                        fontFamily: `playground-font-${font.id}, sans-serif`,
                        height: "36px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid var(--panel-border)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.2rem",
                        cursor: "pointer",
                        userSelect: "none",
                        transition: "all 0.2s",
                        lineHeight: "1",
                        fontWeight: "normal",
                        fontVariationSettings: "normal",
                      }}
                    >
                      {c}
                      <div className="character-tooltip">
                        <div 
                          className="tooltip-large-char"
                          style={{
                            fontFamily: `playground-font-${font.id}, sans-serif`
                          }}
                        >
                          {c}
                        </div>
                        <div className="tooltip-name">
                          {getCharacterName(c)}
                        </div>
                        <div className="tooltip-code">
                          U+{c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Numbers Grid */}
              <div>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "12px" }}>{t("fonts", "numbers_symbols", "Թվեր և նշաններ")}</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(36px, 1fr))", gap: "8px" }}>
                  {[...CHARS_NUM, ...CHARS_SYM].map((c, i) => (
                    <div
                      key={i}
                      onClick={() => setText((prev) => prev + c)}
                      className="character-cell preview-font-container"
                      style={{
                        fontFamily: `playground-font-${font.id}, sans-serif`,
                        height: "36px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid var(--panel-border)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.2rem",
                        cursor: "pointer",
                        userSelect: "none",
                        transition: "all 0.2s",
                        lineHeight: "1",
                        fontWeight: "normal",
                        fontVariationSettings: "normal",
                      }}
                    >
                      {c}
                      <div className="character-tooltip">
                        <div 
                          className="tooltip-large-char"
                          style={{
                            fontFamily: `playground-font-${font.id}, sans-serif`
                          }}
                        >
                          {c}
                        </div>
                        <div className="tooltip-name">
                          {getCharacterName(c)}
                        </div>
                        <div className="tooltip-code">
                          U+{c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Area: Control Panel Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px", minWidth: 0 }}>
          
          <RatingSystem id={font.id} locale={locale === 'hy' ? 'hy' : 'en'} />

          {/* Main Controls Panel */}
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid var(--panel-border)",
              borderRadius: "24px",
              padding: "28px",
              boxShadow: "var(--shadow)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text)", margin: "0 0 10px 0" }}>
              {t("qr_creator", "controls_title", "Կառավարում")}
            </h3>

            {/* Slider: Font Size */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "0.85rem" }}>
                <span>{t("fonts", "size", "Չափս")}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <input
                    type="number"
                    min="12"
                    max="120"
                    value={fontSize}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val) && e.target.value !== "") setFontSize(val);
                    }}
                    onBlur={(e) => {
                      let val = parseInt(e.target.value, 10);
                      if (isNaN(val)) val = 48;
                      setFontSize(Math.min(120, Math.max(12, val)));
                    }}
                    style={{
                      width: "60px",
                      padding: "2px 6px",
                      fontSize: "0.82rem",
                      fontWeight: "bold",
                      color: "var(--primary-color)",
                      background: "var(--input-bg)",
                      border: "1px solid var(--input-border)",
                      borderRadius: "6px",
                      textAlign: "center",
                      outline: "none"
                    }}
                  />
                  <span style={{ fontWeight: "bold", fontSize: "0.8rem", color: "var(--muted)" }}>px</span>
                </div>
              </div>
              <hd-slider
                min="12"
                max="120"
                value={fontSize}
                onInput={(e: any) => setFontSize(Number(e.target.value))}
                data-width="100%"
              />
            </div>

            {/* Slider: Letter Spacing */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "0.85rem" }}>
                <span>{t("fonts", "letter_spacing", "Տառատարածություն")}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <input
                    type="number"
                    min="-4"
                    max="20"
                    value={letterSpacing}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val) && e.target.value !== "") setLetterSpacing(val);
                    }}
                    onBlur={(e) => {
                      let val = parseInt(e.target.value, 10);
                      if (isNaN(val)) val = 0;
                      setLetterSpacing(Math.min(20, Math.max(-4, val)));
                    }}
                    style={{
                      width: "60px",
                      padding: "2px 6px",
                      fontSize: "0.82rem",
                      fontWeight: "bold",
                      color: "var(--primary-color)",
                      background: "var(--input-bg)",
                      border: "1px solid var(--input-border)",
                      borderRadius: "6px",
                      textAlign: "center",
                      outline: "none"
                    }}
                  />
                  <span style={{ fontWeight: "bold", fontSize: "0.8rem", color: "var(--muted)" }}>px</span>
                </div>
              </div>
              <hd-slider
                min="-4"
                max="20"
                value={letterSpacing}
                onInput={(e: any) => setLetterSpacing(Number(e.target.value))}
                data-width="100%"
              />
            </div>

            {/* Slider: Line Height */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "0.85rem" }}>
                <span>{t("fonts", "line_height", "Տողի բարձրություն")}</span>
                <input
                  type="number"
                  min="0.8"
                  max="3.0"
                  step="0.1"
                  value={lineHeight}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val) && e.target.value !== "") setLineHeight(val);
                  }}
                  onBlur={(e) => {
                    let val = parseFloat(e.target.value);
                    if (isNaN(val)) val = 1.2;
                    setLineHeight(Number(Math.min(3.0, Math.max(0.8, val)).toFixed(1)));
                  }}
                  style={{
                    width: "60px",
                    padding: "2px 6px",
                    fontSize: "0.82rem",
                    fontWeight: "bold",
                    color: "var(--primary-color)",
                    background: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                    borderRadius: "6px",
                    textAlign: "center",
                    outline: "none"
                  }}
                />
              </div>
              <hd-slider
                min="0.8"
                max="3.0"
                step="0.1"
                value={lineHeight}
                onInput={(e: any) => setLineHeight(Number(e.target.value))}
                data-width="100%"
              />
            </div>

            {/* Row: Alignment */}
            <div>
              <span style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block", marginBottom: "8px" }}>
                {t("fonts", "alignment", "Հավասարեցում")}
              </span>
              <hd-segment
                value={textAlign}
                onChange={(e: any) => setTextAlign(e.target.value)}
                data-color="var(--accent)"
                data-width="100%"
                data-height="36px"
                data-thickness="3px"
              >
                <span value="left" {...(textAlign === "left" ? { selected: true } : {})}>Left</span>
                <span value="center" {...(textAlign === "center" ? { selected: true } : {})}>Center</span>
                <span value="right" {...(textAlign === "right" ? { selected: true } : {})}>Right</span>
                <span value="justify" {...(textAlign === "justify" ? { selected: true } : {})}>Justify</span>
              </hd-segment>
            </div>

            {/* Row: Case Transforms */}
            <div>
              <span style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block", marginBottom: "8px" }}>
                {t("fonts", "case_label", "Տեքստի ռեգիստր")}
              </span>
              <hd-segment
                value={textCase}
                onChange={(e: any) => setTextCase(e.target.value)}
                data-color="var(--accent)"
                data-width="100%"
                data-height="36px"
                data-thickness="3px"
              >
                <span value="none" {...(textCase === "none" ? { selected: true } : {})}>{t("fonts", "case_normal", "Լռելյայն")}</span>
                <span value="uppercase" {...(textCase === "uppercase" ? { selected: true } : {})}>AA</span>
                <span value="lowercase" {...(textCase === "lowercase" ? { selected: true } : {})}>aa</span>
              </hd-segment>
            </div>

            {/* Row: Bold / Italic Toggles */}
            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
              <div
                style={{
                  flex: 1,
                  background: isBold ? "var(--btn-hover-bg)" : "transparent",
                  color: "var(--text)",
                }}
              >
                <hd-button
                  onClick={() => setIsBold(!isBold)}
                  data-height="38px"
                  data-thickness="3px"
                  data-width="100%"
                >
                  <strong>Bold</strong>
                </hd-button>
              </div>
              <div
                style={{
                  flex: 1,
                  background: isItalic ? "var(--btn-hover-bg)" : "transparent",
                  color: "var(--text)",
                }}
              >
                <hd-button
                  onClick={() => setIsItalic(!isItalic)}
                  data-height="38px"
                  data-thickness="3px"
                  data-width="100%"
                >
                  <em>Italic</em>
                </hd-button>
              </div>
            </div>

            {/* Row: Text & BG Color Pickers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                  {t("fonts", "color", "Գույն")}
                </span>
                <hd-color-picker
                  data-color={textColor}
                  onChange={(e: any) => setTextColor(e.target.value)}
                  data-width="100%"
                  data-height="36px"
                />
              </div>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                  {t("fonts", "bg_color", "Ֆոնի գույն")}
                </span>
                <hd-color-picker
                  data-color={bgColor}
                  onChange={(e: any) => setBgColor(e.target.value)}
                  data-width="100%"
                  data-height="36px"
                />
              </div>
            </div>

            {/* Variability & OpenType Axes Section */}
            <div style={{ borderTop: "1px solid var(--panel-border)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, display: "block" }}>
                {t("fonts", "variability_axes", "Փոփոխականություն և Ոճեր (Variability & OpenType)")}
              </span>

              {/* Axis: Weight (wght) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "0.82rem" }}>
                  <span>{t("fonts", "weight", "Հաստություն (Weight)")}</span>
                  <input
                    type="number"
                    min="100"
                    max="900"
                    step="10"
                    value={wght}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val) && e.target.value !== "") setWght(val);
                    }}
                    onBlur={(e) => {
                      let val = parseInt(e.target.value, 10);
                      if (isNaN(val)) val = 400;
                      setWght(Math.min(900, Math.max(100, val)));
                    }}
                    style={{
                      width: "64px",
                      padding: "2px 6px",
                      fontSize: "0.82rem",
                      fontWeight: "bold",
                      color: "var(--primary-color)",
                      background: "var(--input-bg)",
                      border: "1px solid var(--input-border)",
                      borderRadius: "6px",
                      textAlign: "center",
                      outline: "none"
                    }}
                  />
                </div>
                <hd-slider
                  min="100"
                  max="900"
                  step="10"
                  value={wght}
                  onInput={(e: any) => setWght(Number(e.target.value))}
                  data-width="100%"
                />
              </div>

              {/* Axis: Slant (slnt) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "0.82rem" }}>
                  <span>{t("fonts", "slant", "Թեքություն (Slant)")}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                    <input
                      type="number"
                      min="-20"
                      max="0"
                      step="1"
                      value={slnt}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!isNaN(val) && e.target.value !== "") setSlnt(val);
                      }}
                      onBlur={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val)) val = 0;
                        setSlnt(Math.min(0, Math.max(-20, val)));
                      }}
                      style={{
                        width: "56px",
                        padding: "2px 6px",
                        fontSize: "0.82rem",
                        fontWeight: "bold",
                        color: "var(--primary-color)",
                        background: "var(--input-bg)",
                        border: "1px solid var(--input-border)",
                        borderRadius: "6px",
                        textAlign: "center",
                        outline: "none"
                      }}
                    />
                    <span style={{ fontWeight: "bold", fontSize: "0.8rem", color: "var(--muted)" }}>°</span>
                  </div>
                </div>
                <hd-slider
                  min="-20"
                  max="0"
                  step="1"
                  value={slnt}
                  onInput={(e: any) => setSlnt(Number(e.target.value))}
                  data-width="100%"
                />
              </div>

              {/* Axis: Width (wdth) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "0.82rem" }}>
                  <span>{t("fonts", "width", "Լայնություն (Width)")}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                    <input
                      type="number"
                      min="50"
                      max="150"
                      step="5"
                      value={wdth}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!isNaN(val) && e.target.value !== "") setWdth(val);
                      }}
                      onBlur={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val)) val = 100;
                        setWdth(Math.min(150, Math.max(50, val)));
                      }}
                      style={{
                        width: "58px",
                        padding: "2px 6px",
                        fontSize: "0.82rem",
                        fontWeight: "bold",
                        color: "var(--primary-color)",
                        background: "var(--input-bg)",
                        border: "1px solid var(--input-border)",
                        borderRadius: "6px",
                        textAlign: "center",
                        outline: "none"
                      }}
                    />
                    <span style={{ fontWeight: "bold", fontSize: "0.8rem", color: "var(--muted)" }}>%</span>
                  </div>
                </div>
                <hd-slider
                  min="50"
                  max="150"
                  step="5"
                  value={wdth}
                  onInput={(e: any) => setWdth(Number(e.target.value))}
                  data-width="100%"
                />
              </div>

              {/* Axis: Italic (ital) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "0.82rem" }}>
                  <span>{t("fonts", "italic", "Շղագիր (Italic Axis)")}</span>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={ital}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val) && e.target.value !== "") setItal(val);
                    }}
                    onBlur={(e) => {
                      let val = parseFloat(e.target.value);
                      if (isNaN(val)) val = 0;
                      setItal(Number(Math.min(1, Math.max(0, val)).toFixed(1)));
                    }}
                    style={{
                      width: "56px",
                      padding: "2px 6px",
                      fontSize: "0.82rem",
                      fontWeight: "bold",
                      color: "var(--primary-color)",
                      background: "var(--input-bg)",
                      border: "1px solid var(--input-border)",
                      borderRadius: "6px",
                      textAlign: "center",
                      outline: "none"
                    }}
                  />
                </div>
                <hd-slider
                  min="0"
                  max="1"
                  step="0.1"
                  value={ital}
                  onInput={(e: any) => setItal(Number(e.target.value))}
                  data-width="100%"
                />
              </div>

              {/* OpenType Features (Checkboxes/Switches) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px", background: "rgba(255,255,255,0.01)", padding: "12px", borderRadius: "8px", border: "1px solid var(--panel-border)" }}>
                
                {/* Ligatures */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "0.8rem" }}>{t("fonts", "ligatures", "Կապագիր (Ligatures)")}</span>
                  <hd-switch 
                    checked={ligatures} 
                    data-thickness="4px"
                    style={{ flexShrink: 0 }}
                    onChange={(e: any) => setLigatures(e.target.checked)} 
                  />
                </div>

                {/* Kerning */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "0.8rem" }}>{t("fonts", "kerning", "Միջտառային տարածություն (Kerning)")}</span>
                  <hd-switch 
                    checked={kerning} 
                    data-thickness="4px"
                    style={{ flexShrink: 0 }}
                    onChange={(e: any) => setKerning(e.target.checked)} 
                  />
                </div>

                {/* Small Caps */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "0.8rem" }}>{t("fonts", "small_caps", "Փոքրատառ գլխատառեր (Small Caps)")}</span>
                  <hd-switch 
                    checked={smallCaps} 
                    data-thickness="4px"
                    style={{ flexShrink: 0 }}
                    onChange={(e: any) => setSmallCaps(e.target.checked)} 
                  />
                </div>

                {/* Oldstyle Figures */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "0.8rem" }}>{t("fonts", "oldstyle_figures", "Հին ոճի թվեր (Oldstyle Figures)")}</span>
                  <hd-switch 
                    checked={oldstyleNums} 
                    data-thickness="4px"
                    style={{ flexShrink: 0 }}
                    onChange={(e: any) => setOldstyleNums(e.target.checked)} 
                  />
                </div>

              </div>
            </div>

            {/* Preset Pangrams */}
            <div style={{ borderTop: "1px solid var(--panel-border)", paddingTop: "16px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "10px" }}>
                {t("fonts", "pangrams", "Պանգրամներ")}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  onClick={() => setText("Ելակն ու ձմերուկը հաճելի հոգսեր են։")}
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--panel-border)", borderRadius: "8px", padding: "6px 10px", fontSize: "0.78rem", color: "var(--text)", textAlign: "left", cursor: "pointer" }}
                >
                  Հայերեն՝ Ելակն ու ձմերուկը...
                </button>
                <button
                  onClick={() => setText("The quick brown fox jumps over the lazy dog.")}
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--panel-border)", borderRadius: "8px", padding: "6px 10px", fontSize: "0.78rem", color: "var(--text)", textAlign: "left", cursor: "pointer" }}
                >
                  English: The quick brown fox...
                </button>
                <button
                  onClick={() => setText("Pack my box with five dozen liquor jugs.")}
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--panel-border)", borderRadius: "8px", padding: "6px 10px", fontSize: "0.78rem", color: "var(--text)", textAlign: "left", cursor: "pointer" }}
                >
                  English: Pack my box...
                </button>
              </div>
            </div>

            {/* Reset controls button */}
            <hd-button
              onClick={() => {
                setFontSize(48);
                setLetterSpacing(0);
                setLineHeight(1.4);
                setTextAlign("left");
                setIsBold(false);
                setIsItalic(false);
                setTextCase("none");
                setTextColor("#ffffff");
                setBgColor("#0b4a41");
                setWght(400);
                setSlnt(0);
                setWdth(100);
                setItal(0);
                setLigatures(true);
                setKerning(true);
                setSmallCaps(false);
                setOldstyleNums(false);
              }}
              data-width="100%"
              data-height="38px"
              data-thickness="3px"
            >
              {t("fonts", "reset", "Վերականգնել")}
            </hd-button>

          </div>

          {/* Download & Buy Panel */}
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid var(--panel-border)",
              borderRadius: "24px",
              padding: "28px",
              boxShadow: "var(--shadow)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text)", margin: "0 0 4px 0" }}>
                {locale === "hy" ? font.name_am : font.name_en}
              </h3>
              <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase" }}>
                {font.category}
              </span>
            </div>

            <div style={{ borderTop: "1px solid var(--panel-border)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem" }}>
              {font.creator && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)" }}>{t("fonts", "creator_label", "Հեղինակ")}</span>
                  <span style={{ fontWeight: 600 }}>{font.creator}</span>
                </div>
              )}
              {font.year && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)" }}>{t("fonts", "year", "Տարեթիվ")}</span>
                  <span style={{ fontWeight: 600 }}>{font.year}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>{t("fonts", "license_label", "Լիցենզիա")}</span>
                <span style={{ fontWeight: 600, color: font.paid ? "#ef5350" : "#66bb6a" }}>
                  {font.paid ? (font.price || t("fonts", "price_paid", "Վճարովի")) : t("fonts", "price_free", "Անվճար")}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
              {font.downloadable && (
                <a
                  href={font.download_url || font.font_file_url}
                  download={`${font.id}_font.ttf`}
                  style={{ textDecoration: "none", width: "100%" }}
                >
                  <hd-button data-width="100%" data-height="46px" data-thickness="3px">
                    <span className="icon-Download" style={{ marginRight: "8px" }} />
                    {t("fonts", "download", "Ներբեռնել")}
                  </hd-button>
                </a>
              )}
              
              {font.paid && font.purchase_url && (
                <a href={font.purchase_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", width: "100%" }}>
                  <hd-button data-width="100%" data-height="46px" data-thickness="3px">
                    {t("fonts", "purchase", "Գնել")}
                  </hd-button>
                </a>
              )}
            </div>
          </div>

      </div>

      {/* Behance-Style Font Specimen Presentation Blocks */}
      {specimenBlocks.length > 0 && (
        <div style={{ width: "100%", margin: "60px 0 0 0", display: "flex", flexDirection: "column", gap: "50px", borderTop: "1px solid var(--panel-border)", paddingTop: "60px" }}>
          <h3 style={{ fontSize: "1.6rem", fontWeight: "900", color: "var(--text)", margin: 0 }}>
            {t("fonts", "specimen_showcase", "Տառատեսակի Շնորհանդես (Font Specimen Showcase)")}
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
            {specimenBlocks.map((block: any, idx: number) => {
              if (block.type === "text") {
                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "800px" }}>
                    {(block.title_am || block.title_en) && (
                      <h4 style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--text)", margin: 0 }}>
                        {locale === "hy" ? block.title_am : block.title_en}
                      </h4>
                    )}
                    <p style={{ fontSize: "1.05rem", lineHeight: "1.7", opacity: 0.85, margin: 0, whiteSpace: "pre-line" }}>
                      {locale === "hy" ? block.content_am : block.content_en}
                    </p>
                  </div>
                );
              }

              if (block.type === "specimen_banner" && block.previewText) {
                return (
                  <div key={idx} style={{ padding: "40px", background: "var(--panel)", borderRadius: "20px", border: "1px solid var(--panel-border)", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", marginBottom: "16px", display: "block" }}>Specimen Banner ({block.size || 72}px)</span>
                    <div className="preview-font-container" style={{ fontFamily: `playground-font-${font.id}, sans-serif`, fontSize: `${block.size || 72}px`, color: "var(--text)", lineHeight: "1.2", wordBreak: "break-word" }}>
                      {block.previewText}
                    </div>
                  </div>
                );
              }

              if (block.type === "weights_comparison" && block.previewText) {
                const weightList = block.weights || [300, 400, 700];
                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <h4 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>
                      {locale === "hy" 
                        ? (block.title_am || t("fonts", "weights_showcase", "Հաստության ցուցադրում")) 
                        : (block.title_en || t("fonts", "weights_showcase", "Weights Comparison"))
                      }
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {weightList.map((w: number, wIdx: number) => (
                        <div key={wIdx} style={{ display: "flex", gap: "20px", alignItems: "baseline", borderBottom: "1px solid var(--panel-border)", paddingBottom: "12px" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--muted)", width: "60px", flexShrink: 0 }}>Weight {w}</span>
                          <div className="preview-font-container" style={{ fontFamily: `playground-font-${font.id}, sans-serif`, fontSize: "2rem", color: "var(--text)", fontWeight: w, flex: 1 }}>
                            {block.previewText}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (block.type === "glyph_showcase" && block.letters) {
                const lettersList = block.letters.split(" ").filter((s: string) => s.length > 0);
                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <h4 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>
                      {locale === "hy" 
                        ? (block.title_am || t("fonts", "glyphs_showcase", "Գլիֆների ցուցադրում")) 
                        : (block.title_en || t("fonts", "glyphs_showcase", "Key Glyphs Detail"))
                      }
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "16px" }}>
                      {lettersList.map((letter: string, lIdx: number) => (
                        <div key={lIdx} style={{ height: "140px", background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                          <div className="preview-font-container" style={{ fontFamily: `playground-font-${font.id}, sans-serif`, fontSize: "4.5rem", color: "var(--text)", lineHeight: 1 }}>
                            {letter}
                          </div>
                          <span style={{ fontSize: "0.7rem", color: "var(--muted)", position: "absolute", bottom: "8px" }}>char code: {letter.charCodeAt(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (block.type === "image" && block.image_url) {
                const specimenImageBlocks = specimenBlocks.filter((b: any) => b.type === "image" && b.image_url);
                const imgIndex = specimenImageBlocks.indexOf(block);

                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                    <div 
                      onClick={() => setSelectedSpecimenIndex(imgIndex >= 0 ? imgIndex : 0)}
                      title={t("works_page", "view_gallery", "Դիտել պատկերասրահը")}
                      style={{ 
                        borderRadius: "16px", 
                        overflow: "hidden", 
                        border: "1px solid var(--panel-border)", 
                        width: "100%", 
                        cursor: "pointer", 
                        transition: "transform 0.3s ease, box-shadow 0.3s ease" 
                      }}
                    >
                      <img src={block.image_url} alt="Specimen Graphic" style={{ width: "100%", display: "block" }} />
                    </div>
                    {(block.caption_am || block.caption_en) && (
                      <span style={{ fontSize: "0.82rem", color: "var(--muted)", fontStyle: "italic", textAlign: "center" }}>
                        {locale === "hy" ? block.caption_am : block.caption_en}
                      </span>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}

      {/* Unified Gallery Lightbox Slider for Font Specimens */}
      <MediaLightbox
        items={specimenBlocks
          .filter((b: any) => b.type === "image" && b.image_url)
          .map((b: any, bIdx: number) => ({
            id: `specimen-${bIdx}`,
            url: b.image_url,
            title: locale === "hy" ? (font?.name_am || font?.name_en) : (font?.name_en || font?.name_am),
            description: locale === "hy" ? (b.caption_am || b.caption_en) : (b.caption_en || b.caption_am),
            type: "image"
          }))}
        initialIndex={selectedSpecimenIndex !== null ? selectedSpecimenIndex : 0}
        isOpen={selectedSpecimenIndex !== null}
        onClose={() => setSelectedSpecimenIndex(null)}
        categoryLabel={locale === 'en' ? 'Font Specimen' : 'Տառատեսակի Նմուշ'}
      />

      </div>

      {/* Styled Hover Micro-Animations for character cell grid */}
      <style jsx global>{`
        .character-cell {
          position: relative;
        }
        .character-cell:hover {
          background: rgba(8, 63, 57, 0.1) !important;
          border-color: var(--accent) !important;
          transform: scale(1.3) !important;
          box-shadow: 0 8px 24px rgba(8, 63, 57, 0.25);
          z-index: 50;
        }
        
        .character-tooltip {
          position: absolute;
          bottom: 130%;
          left: 50%;
          transform: translateX(-50%) scale(0.7);
          transform-origin: bottom center;
          background: #083f39;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 140px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 100;
        }
        
        .character-cell:hover .character-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) scale(1);
        }

        .tooltip-large-char {
          font-size: 2.8rem;
          line-height: 1.1;
          color: #ffffff;
          margin-bottom: 2px;
          font-weight: normal !important;
          font-variation-settings: normal !important;
        }

        .tooltip-name {
          font-size: 0.68rem;
          font-weight: 500;
          color: #89b59a;
          text-align: center;
          word-break: break-word;
          max-width: 130px;
          line-height: 1.3;
          font-family: 'HDesign', sans-serif !important;
        }

        .tooltip-code {
          font-size: 0.65rem;
          font-family: monospace !important;
          color: rgba(255, 255, 255, 0.6);
          background: rgba(0, 0, 0, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
          margin-top: 2px;
        }

        @media (max-width: 992px) {
          .font-playground-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
        @media (max-width: 768px) {
          .font-details-sandbox-canvas {
            padding: 44px 16px 20px 16px !important;
            min-height: 250px !important;
            border-radius: 18px !important;
          }
          .font-details-canvas-color-switcher {
            top: 12px !important;
            right: 12px !important;
            gap: 6px !important;
          }
        }
        @media (max-width: 480px) {
          .font-playground-grid {
            gap: 16px !important;
          }
          .font-details-sandbox-canvas {
            padding: 48px 12px 16px 12px !important;
            border-radius: 14px !important;
          }
          .preview-font-container {
            font-size: clamp(24px, 8vw, 48px) !important;
          }
        }
      `}</style>
    </main>
  );
}
