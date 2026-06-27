"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import RatingSystem from "@/components/RatingSystem";

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
const CHARS_AM = "ԱԲԳԴԵԶԷԸԹԺԻԼԽԾԿՀՁՂՃՄՅՆՇՈՉՊՋՌՍՎՏՐՑՈՒՓՔԵՎՕՖաբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցուփքևօֆ".split("");
const CHARS_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
const CHARS_NUM = "0123456789".split("");
const CHARS_SYM = "!@#$%^&*()_+-=[]{};:'\",./<>?".split("");

export default function FontDetailPage() {
  const { locale, t } = useI18n();
  const params = useParams();
  const id = params?.id as string;

  const [font, setFont] = useState<Font | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const activePreviewText = locale === "hy" ? "Հրանտ Հակոբյան Դիզայն 2026" : "Hrant Hakobyan Design 2026";

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
        
        setText(
          locale === "hy"
            ? "Հրանտ Հակոբյան Դիզայն Ստուդիա: Այստեղ կարող եք գրել ցանկացած տեքստ տառատեսակը փորձարկելու համար:"
            : "Hrant Hakobyan Design Studio: You can write any text here to test and play with this font configuration."
        );
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

  // Generated CSS font face and rules
  const cssFontFace = useMemo(() => {
    if (!font) return "";
    let format = "truetype";
    if (font.font_file_url.endsWith(".otf")) format = "opentype";
    else if (font.font_file_url.endsWith(".woff")) format = "woff";
    else if (font.font_file_url.endsWith(".woff2")) format = "woff2";
    return `@font-face {\n  font-family: '${font.name_en}';\n  src: url('${font.font_file_url}') format('${format}');\n  font-weight: normal;\n  font-style: normal;\n}`;
  }, [font]);

  const cssRules = useMemo(() => {
    if (!font) return "";
    return `font-family: '${font.name_en}', sans-serif;\nfont-size: ${fontSize}px;\nletter-spacing: ${letterSpacing}px;\nline-height: ${lineHeight};\nfont-variation-settings: 'wght' ${wght}, 'slnt' ${slnt}, 'wdth' ${wdth}, 'ital' ${ital};\nfont-variant-ligatures: ${ligatures ? "common-ligatures" : "none"};\nfont-kerning: ${kerning ? "normal" : "none"};\nfont-variant-caps: ${smallCaps ? "small-caps" : "normal"};\nfont-variant-numeric: ${oldstyleNums ? "oldstyle-nums" : "normal"};`;
  }, [font, fontSize, letterSpacing, lineHeight, wght, slnt, wdth, ital, ligatures, kerning, smallCaps, oldstyleNums]);


  // Loading indicator
  if (loading) {
    return (
      <main className="shell" style={{ marginTop: "160px", minHeight: "75vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--muted)", fontSize: "1.2rem" }}>
          {locale === "hy" ? "Տվյալները բեռնվում են..." : "Loading playground details..."}
        </span>
      </main>
    );
  }

  // Error indicator
  if (error || !font) {
    return (
      <main className="shell" style={{ marginTop: "160px", minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text)" }}>
          {locale === "hy" ? "Տառատեսակը չի գտնվել" : "Font Not Found"}
        </h2>
        <Link href="/fonts" style={{ textDecoration: "none" }}>
          <hd-button data-width="180px" data-height="48px" data-thickness="2px">
            {locale === "hy" ? "Հետ դեպի ցուցակ" : "Back to Listing"}
          </hd-button>
        </Link>
      </main>
    );
  }

  return (
    <main className="shell" style={{ marginTop: "140px", minHeight: "85vh", paddingBottom: "100px" }}>
      {/* Load dynamically active Font Face */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @font-face {
              font-family: 'playground-font-${font.id}';
              src: url('${font.font_file_url}') format('${
            font.font_file_url.endsWith(".otf")
              ? "opentype"
              : font.font_file_url.endsWith(".woff")
              ? "woff"
              : font.font_file_url.endsWith(".woff2")
              ? "woff2"
              : "truetype"
          }');
              font-weight: normal;
              font-style: normal;
            }
          `,
        }}
      />

      {/* Breadcrumb row */}
      <div style={{ marginBottom: "24px" }}>
        <Link href="/fonts" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--accent)", fontSize: "0.95rem", fontWeight: "bold" }}>
          <span className="icon-Chevrolt-Arrow-Left" />
          {locale === "hy" ? "Հետ դեպի տառատեսակներ" : "Back to Fonts"}
        </Link>
      </div>

      {/* Main Grid: Sandbox Playground (Left) vs Controls Sidebar (Right) */}
      <div 
        style={{ 
          maxWidth: "1400px", 
          width: "100%", 
          margin: "0 auto", 
          display: "grid", 
          gridTemplateColumns: "2fr 1fr", 
          gap: "40px" 
        }} 
        className="font-playground-grid"
      >
        
        {/* Left Area: Canvas Testing Areas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "40px", minWidth: 0 }}>
          
          {/* Main Sandbox Canvas */}
          <div
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
            <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", gap: "8px", zIndex: 10 }}>
              <button onClick={() => applyPresetTheme("light")} style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.1)", width: "24px", height: "24px", borderRadius: "6px", cursor: "pointer" }} title="Light mode" />
              <button onClick={() => applyPresetTheme("dark")} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", width: "24px", height: "24px", borderRadius: "6px", cursor: "pointer" }} title="Dark mode" />
              <button onClick={() => applyPresetTheme("green")} style={{ background: "#0b4a41", border: "1px solid rgba(255,255,255,0.1)", width: "24px", height: "24px", borderRadius: "6px", cursor: "pointer" }} title="Green mode" />
            </div>

            {/* Canvas contenteditable area */}
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => setText(e.target.innerText)}
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
              {locale === "hy" ? "Կտտացրեք նիշի վրա՝ այն տեքստային դաշտում ավելացնելու համար" : "Click on a character to insert it into your sandbox text"}
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
                      className="character-cell"
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
                      }}
                    >
                      {c}
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
                      className="character-cell"
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
                      }}
                    >
                      {c}
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
                      className="character-cell"
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
                      }}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Area: Control Panel Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px", minWidth: 0 }}>
          
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
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.85rem" }}>
                <span>{t("fonts", "size", "Չափս")}</span>
                <span style={{ fontWeight: "bold" }}>{fontSize}px</span>
              </div>
              <hd-slider
                min="12"
                max="120"
                value={fontSize}
                onChange={(e: any) => setFontSize(Number(e.target.value))}
                data-width="100%"
              />
            </div>

            {/* Slider: Letter Spacing */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.85rem" }}>
                <span>{t("fonts", "letter_spacing", "Տառատարածություն")}</span>
                <span style={{ fontWeight: "bold" }}>{letterSpacing}px</span>
              </div>
              <hd-slider
                min="-4"
                max="20"
                value={letterSpacing}
                onChange={(e: any) => setLetterSpacing(Number(e.target.value))}
                data-width="100%"
              />
            </div>

            {/* Slider: Line Height */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.85rem" }}>
                <span>{t("fonts", "line_height", "Տողի բարձրություն")}</span>
                <span style={{ fontWeight: "bold" }}>{lineHeight}</span>
              </div>
              <hd-slider
                min="0.8"
                max="3.0"
                step="0.1"
                value={lineHeight}
                onChange={(e: any) => setLineHeight(Number(e.target.value))}
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
                data-thickness="1px"
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
                data-thickness="1px"
              >
                <span value="none" {...(textCase === "none" ? { selected: true } : {})}>{t("fonts", "case_normal", "Լռելյայն")}</span>
                <span value="uppercase" {...(textCase === "uppercase" ? { selected: true } : {})}>AA</span>
                <span value="lowercase" {...(textCase === "lowercase" ? { selected: true } : {})}>aa</span>
              </hd-segment>
            </div>

            {/* Row: Bold / Italic Toggles */}
            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
              <hd-button
                onClick={() => setIsBold(!isBold)}
                data-height="38px"
                data-thickness="1px"
                style={{
                  flex: 1,
                  background: isBold ? "var(--btn-hover-bg)" : "transparent",
                  color: "var(--text)",
                }}
              >
                <strong>Bold</strong>
              </hd-button>
              <hd-button
                onClick={() => setIsItalic(!isItalic)}
                data-height="38px"
                data-thickness="1px"
                style={{
                  flex: 1,
                  background: isItalic ? "var(--btn-hover-bg)" : "transparent",
                  color: "var(--text)",
                }}
              >
                <em>Italic</em>
              </hd-button>
            </div>

            {/* Row: Text & BG Color Pickers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                  {t("fonts", "color", "Գույն")}
                </span>
                <hd-color-picker
                  value={textColor}
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
                  value={bgColor}
                  onChange={(e: any) => setBgColor(e.target.value)}
                  data-width="100%"
                  data-height="36px"
                />
              </div>
            </div>

            {/* Variability & OpenType Axes Section */}
            <div style={{ borderTop: "1px solid var(--panel-border)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, display: "block" }}>
                {locale === "hy" ? "Փոփոխականություն և Ոճեր (Variability & OpenType)" : "Variability & OpenType Axes"}
              </span>

              {/* Axis: Weight (wght) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.82rem" }}>
                  <span>{locale === "hy" ? "Հաստություն (Weight)" : "Font Weight (wght)"}</span>
                  <span style={{ fontWeight: "bold" }}>{wght}</span>
                </div>
                <hd-slider
                  min="100"
                  max="900"
                  step="10"
                  value={wght}
                  onChange={(e: any) => setWght(Number(e.target.value))}
                  data-width="100%"
                />
              </div>

              {/* Axis: Slant (slnt) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.82rem" }}>
                  <span>{locale === "hy" ? "Թեքություն (Slant)" : "Slant Axis (slnt)"}</span>
                  <span style={{ fontWeight: "bold" }}>{slnt}°</span>
                </div>
                <hd-slider
                  min="-20"
                  max="0"
                  step="1"
                  value={slnt}
                  onChange={(e: any) => setSlnt(Number(e.target.value))}
                  data-width="100%"
                />
              </div>

              {/* Axis: Width (wdth) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.82rem" }}>
                  <span>{locale === "hy" ? "Լայնություն (Width)" : "Width Axis (wdth)"}</span>
                  <span style={{ fontWeight: "bold" }}>{wdth}%</span>
                </div>
                <hd-slider
                  min="50"
                  max="150"
                  step="5"
                  value={wdth}
                  onChange={(e: any) => setWdth(Number(e.target.value))}
                  data-width="100%"
                />
              </div>

              {/* Axis: Italic (ital) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.82rem" }}>
                  <span>{locale === "hy" ? "Շղագիր (Italic Axis)" : "Italic Axis (ital)"}</span>
                  <span style={{ fontWeight: "bold" }}>{ital}</span>
                </div>
                <hd-slider
                  min="0"
                  max="1"
                  step="0.1"
                  value={ital}
                  onChange={(e: any) => setItal(Number(e.target.value))}
                  data-width="100%"
                />
              </div>

              {/* OpenType Features (Checkboxes/Switches) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px", background: "rgba(255,255,255,0.01)", padding: "12px", borderRadius: "8px", border: "1px solid var(--panel-border)" }}>
                
                {/* Ligatures */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem" }}>{locale === "hy" ? "Կապագիր (Ligatures)" : "Common Ligatures"}</span>
                  <hd-switch 
                    checked={ligatures} 
                    onChange={(e: any) => setLigatures(e.target.checked)} 
                  />
                </div>

                {/* Kerning */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem" }}>{locale === "hy" ? "Միջտառային տարածություն (Kerning)" : "Font Kerning"}</span>
                  <hd-switch 
                    checked={kerning} 
                    onChange={(e: any) => setKerning(e.target.checked)} 
                  />
                </div>

                {/* Small Caps */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem" }}>{locale === "hy" ? "Փոքրատառ գլխատառեր (Small Caps)" : "Small Caps"}</span>
                  <hd-switch 
                    checked={smallCaps} 
                    onChange={(e: any) => setSmallCaps(e.target.checked)} 
                  />
                </div>

                {/* Oldstyle Figures */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem" }}>{locale === "hy" ? "Հին ոճի թվեր (Oldstyle Figures)" : "Oldstyle Figures"}</span>
                  <hd-switch 
                    checked={oldstyleNums} 
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
              data-thickness="1px"
              style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--panel-border)" }}
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
                  <hd-button data-width="100%" data-height="46px" data-thickness="2px">
                    <span className="icon-Download" style={{ marginRight: "8px" }} />
                    {t("fonts", "download", "Ներբեռնել")}
                  </hd-button>
                </a>
              )}
              
              {font.paid && font.purchase_url && (
                <a href={font.purchase_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", width: "100%" }}>
                  <hd-button data-width="100%" data-height="46px" data-thickness="2px" style={{ background: "transparent", color: "var(--text)" }}>
                    {t("fonts", "purchase", "Գնել")}
                  </hd-button>
                </a>
              )}
            </div>
          </div>

          <RatingSystem id={font.id} locale={locale === 'hy' ? 'hy' : 'en'} />

          {/* CSS Usage Code Panel */}
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid var(--panel-border)",
              borderRadius: "24px",
              padding: "28px",
              boxShadow: "var(--shadow)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <h4 style={{ fontSize: "1rem", fontWeight: "700", margin: 0 }}>
              {t("fonts", "css_use", "Օգտագործումը CSS-ում")}
            </h4>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>@font-face definition</span>
              <pre
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid var(--panel-border)",
                  borderRadius: "10px",
                  padding: "12px",
                  fontSize: "0.75rem",
                  color: "#a7f3d0",
                  fontFamily: "monospace",
                  overflowX: "auto",
                  margin: 0,
                }}
              >
                {cssFontFace}
              </pre>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Font rules styling</span>
              <pre
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid var(--panel-border)",
                  borderRadius: "10px",
                  padding: "12px",
                  fontSize: "0.75rem",
                  color: "#93c5fd",
                  fontFamily: "monospace",
                  overflowX: "auto",
                  margin: 0,
                }}
              >
                {cssRules}
              </pre>
            </div>
          </div>

      </div>

      {/* Behance-Style Font Specimen Presentation Blocks */}
      {font.description_am && font.description_am.startsWith('[') && (
        <div style={{ maxWidth: "1400px", margin: "60px auto 0 auto", display: "flex", flexDirection: "column", gap: "50px", borderTop: "1px solid var(--panel-border)", paddingTop: "60px" }}>
          <h3 style={{ fontSize: "1.6rem", fontWeight: "900", color: "var(--text)", margin: 0 }}>
            {locale === "hy" ? "Տառատեսակի Շնորհանդես (Font Specimen Showcase)" : "Font Specimen Showcase"}
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
            {(() => {
              try {
                const parsedBlocks = JSON.parse(font.description_am);
                return parsedBlocks.map((block: any, idx: number) => {
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
                        <div style={{ fontFamily: `playground-font-${font.id}, sans-serif`, fontSize: `${block.size || 72}px`, color: "var(--text)", lineHeight: "1.2", wordBreak: "break-word" }}>
                          {block.previewText}
                        </div>
                      </div>
                    );
                  }

                  if (block.type === "weights_comparison" && block.previewText) {
                    const weightList = block.weights || [300, 400, 700];
                    return (
                      <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>{locale === "hy" ? (block.title_am || "Հաստության ցուցադրում") : (block.title_en || "Weights Comparison")}</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                          {weightList.map((w: number, wIdx: number) => (
                            <div key={wIdx} style={{ display: "flex", gap: "20px", alignItems: "baseline", borderBottom: "1px solid var(--panel-border)", paddingBottom: "12px" }}>
                              <span style={{ fontSize: "0.75rem", color: "var(--muted)", width: "60px", flexShrink: 0 }}>Weight {w}</span>
                              <div style={{ fontFamily: `playground-font-${font.id}, sans-serif`, fontSize: "2rem", color: "var(--text)", fontWeight: w, flex: 1 }}>
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
                        <h4 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>{locale === "hy" ? (block.title_am || "Գլիֆների ցուցադրում") : (block.title_en || "Key Glyphs Detail")}</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "16px" }}>
                          {lettersList.map((letter: string, lIdx: number) => (
                            <div key={lIdx} style={{ height: "140px", background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                              <div style={{ fontFamily: `playground-font-${font.id}, sans-serif`, fontSize: "4.5rem", color: "var(--text)", lineHeight: 1 }}>
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
                    return (
                      <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                        <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid var(--panel-border)", width: "100%" }}>
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
                });
              } catch (e) {
                return null;
              }
            })()}
          </div>
        </div>
      )}

      </div>

      {/* Styled Hover Micro-Animations for character cell grid */}
      <style jsx global>{`
        .character-cell:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: var(--accent) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        @media (max-width: 992px) {
          .font-playground-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
