"use client";

import React, { useState, useEffect } from "react";

interface PersonalizationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateVariables?: (vars: Record<string, string>) => void;
}

export default function PersonalizationDrawer({
  isOpen,
  onClose,
  onUpdateVariables
}: PersonalizationDrawerProps) {
  const [activeTab, setActiveTab] = useState<"colors" | "identity" | "fonts">("colors");
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Settings state
  const [siteTitleHy, setSiteTitleHy] = useState("HDesign");
  const [siteTitleEn, setSiteTitleEn] = useState("HDesign");
  const [siteDescHy, setSiteDescHy] = useState("Դիզայնի և Բրենդավորման Ստուդիա");
  const [siteDescEn, setSiteDescEn] = useState("Design & Branding Studio");

  const [themeColor, setThemeColor] = useState("#083f39");
  const [footerBg, setFooterBg] = useState("#051f1c");
  const [accentColor, setAccentColor] = useState("#14b8a6");
  const [bgMain, setBgMain] = useState("#ffffff");
  const [textMain, setTextMain] = useState("#0f172a");

  const [hue, setHue] = useState("172");
  const [saturation, setSaturation] = useState("77");
  const [lightness, setLightness] = useState("14");

  const [siteFontName, setSiteFontName] = useState("HDesign");
  const [siteFontUrl, setSiteFontUrl] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Load current personalization settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/personalization");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (data.site_title_hy) setSiteTitleHy(data.site_title_hy);
            if (data.site_title_en) setSiteTitleEn(data.site_title_en);
            if (data.site_desc_hy) setSiteDescHy(data.site_desc_hy);
            if (data.site_desc_en) setSiteDescEn(data.site_desc_en);
            if (data.theme_hue) setHue(String(data.theme_hue));
            if (data.theme_saturation) setSaturation(String(data.theme_saturation));
            if (data.theme_lightness) setLightness(String(data.theme_lightness));
            if (data.primary_color) setThemeColor(data.primary_color);
            if (data.footer_bg) setFooterBg(data.footer_bg);
            if (data.accent_color) setAccentColor(data.accent_color);
            if (data.site_font_name) setSiteFontName(data.site_font_name);
            if (data.site_font_url) setSiteFontUrl(data.site_font_url);
          }
        }
      } catch (err) {
        console.warn("Failed to load personalization settings:", err);
      }
    }
    loadSettings();
  }, []);

  // Live CSS variable synchronization (0ms delay)
  const syncLiveVariables = (newVars: Record<string, string>) => {
    onUpdateVariables?.(newVars);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      Object.entries(newVars).forEach(([k, v]) => {
        root.style.setProperty(k, v);
      });
      if (newVars["--theme-color"]) {
        root.style.setProperty("--primary-color", newVars["--theme-color"]);
        root.setAttribute("data-color", newVars["--theme-color"]);
      }
    }
  };

  const handleColorChange = (key: string, val: string) => {
    if (key === "--theme-color") setThemeColor(val);
    if (key === "--footer-bg") setFooterBg(val);
    if (key === "--accent-color") setAccentColor(val);
    if (key === "--bg-main") setBgMain(val);
    if (key === "--text-main") setTextMain(val);

    syncLiveVariables({ [key]: val });
  };

  const handleHueChange = (newHue: string) => {
    setHue(newHue);
    syncLiveVariables({
      "--hue": newHue,
      "--saturation": `${saturation}%`,
      "--lightness": `${lightness}%`
    });
  };

  const handleSaturationChange = (newSat: string) => {
    setSaturation(newSat);
    syncLiveVariables({
      "--hue": hue,
      "--saturation": `${newSat}%`,
      "--lightness": `${lightness}%`
    });
  };

  const handleLightnessChange = (newLight: string) => {
    setLightness(newLight);
    syncLiveVariables({
      "--hue": hue,
      "--saturation": `${saturation}%`,
      "--lightness": `${newLight}%`
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("hd_admin_token") || "" : "";
      const payload = {
        site_title_hy: siteTitleHy,
        site_title_en: siteTitleEn,
        site_desc_hy: siteDescHy,
        site_desc_en: siteDescEn,
        theme_hue: hue,
        theme_saturation: saturation,
        theme_lightness: lightness,
        primary_color: themeColor,
        footer_bg: footerBg,
        accent_color: accentColor,
        site_font_name: siteFontName,
        site_font_url: siteFontUrl
      };

      const res = await fetch("/api/personalization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast("✓ Անհատականացումը հաջողությամբ պահպանվեց");
      } else {
        showToast("⚠️ Սխալ պահպանման ընթացքում");
      }
    } catch {
      showToast("⚠️ Կապի խնդիր");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "70px",
        right: "20px",
        width: "440px",
        maxWidth: "calc(100vw - 40px)",
        maxHeight: "calc(100vh - 90px)",
        background: "rgba(15, 23, 42, 0.94)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(20, 184, 166, 0.35)",
        borderRadius: "20px",
        boxShadow: "0 25px 65px rgba(0, 0, 0, 0.65), 0 0 25px rgba(20, 184, 166, 0.12)",
        zIndex: 10001,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "fadeInSlide 0.22s cubic-bezier(0.16, 1, 0.3, 1)"
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255, 255, 255, 0.02)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.4rem" }}>🎨</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "#f8fafc" }}>
              Կայքի Անհատականացում
            </div>
            <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
              Լողացող փեղկ • 0ms Live Sync
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: "rgba(255, 255, 255, 0.06)",
            border: "none",
            borderRadius: "8px",
            color: "#94a3b8",
            width: "30px",
            height: "30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: 700,
            transition: "all 0.15s"
          }}
          title="Փակել փեղկը"
        >
          ✕
        </button>
      </div>

      {/* ── SUBTABS ── */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(0, 0, 0, 0.2)"
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("colors")}
          style={{
            flex: 1,
            padding: "10px 0",
            background: activeTab === "colors" ? "rgba(20, 184, 166, 0.12)" : "transparent",
            color: activeTab === "colors" ? "#14b8a6" : "#94a3b8",
            border: "none",
            borderBottom: activeTab === "colors" ? "2px solid #14b8a6" : "2px solid transparent",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          🌈 Գույներ & CSS
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("identity")}
          style={{
            flex: 1,
            padding: "10px 0",
            background: activeTab === "identity" ? "rgba(20, 184, 166, 0.12)" : "transparent",
            color: activeTab === "identity" ? "#14b8a6" : "#94a3b8",
            border: "none",
            borderBottom: activeTab === "identity" ? "2px solid #14b8a6" : "2px solid transparent",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          🌐 Ինքնություն & SEO
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("fonts")}
          style={{
            flex: 1,
            padding: "10px 0",
            background: activeTab === "fonts" ? "rgba(20, 184, 166, 0.12)" : "transparent",
            color: activeTab === "fonts" ? "#14b8a6" : "#94a3b8",
            border: "none",
            borderBottom: activeTab === "fonts" ? "2px solid #14b8a6" : "2px solid transparent",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          🔤 Տառատեսակ
        </button>
      </div>

      {/* ── DRAWER CONTENT ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px", display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* TAB 1: COLORS & CSS */}
        {activeTab === "colors" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Quick Presets */}
            <div>
              <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: "8px" }}>
                Գունային Պատրաստի Թեմաներ
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { name: "Emerald", color: "#083f39", footer: "#051f1c", accent: "#14b8a6" },
                  { name: "Ocean", color: "#0c4a6e", footer: "#082f49", accent: "#38bdf8" },
                  { name: "Purple", color: "#4c1d95", footer: "#2e1065", accent: "#c084fc" },
                  { name: "Wine", color: "#701a75", footer: "#4a044e", accent: "#f472b6" },
                  { name: "Midnight", color: "#18181b", footer: "#09090b", accent: "#a1a1aa" }
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      handleColorChange("--theme-color", preset.color);
                      handleColorChange("--footer-bg", preset.footer);
                      handleColorChange("--accent-color", preset.accent);
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 4px",
                      background: preset.color,
                      border: themeColor === preset.color ? "2px solid #fff" : "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Theme Color */}
            <div>
              <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Theme Color (--theme-color / --primary-color)
              </label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="color"
                  value={themeColor.startsWith("#") ? themeColor : "#083f39"}
                  onChange={(e) => handleColorChange("--theme-color", e.target.value)}
                  style={{ width: "44px", height: "38px", border: "none", borderRadius: "8px", cursor: "pointer", background: "none" }}
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={(e) => handleColorChange("--theme-color", e.target.value)}
                  style={{ flex: 1, background: "#1e293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", padding: "8px 12px", borderRadius: "8px", fontSize: "0.88rem", outline: "none" }}
                />
              </div>
            </div>

            {/* Footer Background Color */}
            <div>
              <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Footer Background (--footer-bg)
              </label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="color"
                  value={footerBg.startsWith("#") ? footerBg : "#051f1c"}
                  onChange={(e) => handleColorChange("--footer-bg", e.target.value)}
                  style={{ width: "44px", height: "38px", border: "none", borderRadius: "8px", cursor: "pointer", background: "none" }}
                />
                <input
                  type="text"
                  value={footerBg}
                  onChange={(e) => handleColorChange("--footer-bg", e.target.value)}
                  style={{ flex: 1, background: "#1e293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", padding: "8px 12px", borderRadius: "8px", fontSize: "0.88rem", outline: "none" }}
                />
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Accent Color (--accent-color)
              </label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="color"
                  value={accentColor.startsWith("#") ? accentColor : "#14b8a6"}
                  onChange={(e) => handleColorChange("--accent-color", e.target.value)}
                  style={{ width: "44px", height: "38px", border: "none", borderRadius: "8px", cursor: "pointer", background: "none" }}
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => handleColorChange("--accent-color", e.target.value)}
                  style={{ flex: 1, background: "#1e293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", padding: "8px 12px", borderRadius: "8px", fontSize: "0.88rem", outline: "none" }}
                />
              </div>
            </div>

            {/* HSL Palette Sliders */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#cbd5e1" }}>HSL Երանգային Սահիչներ</div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8" }}>
                  <span>Երանգ (Hue)</span>
                  <span>{hue}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hue}
                  onChange={(e) => handleHueChange(e.target.value)}
                  style={{ width: "100%", accentColor: "#14b8a6" }}
                />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8" }}>
                  <span>Հագեցվածություն (Saturation)</span>
                  <span>{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={saturation}
                  onChange={(e) => handleSaturationChange(e.target.value)}
                  style={{ width: "100%", accentColor: "#14b8a6" }}
                />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8" }}>
                  <span>Պայծառություն (Lightness)</span>
                  <span>{lightness}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={lightness}
                  onChange={(e) => handleLightnessChange(e.target.value)}
                  style={{ width: "100%", accentColor: "#14b8a6" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: IDENTITY & SEO */}
        {activeTab === "identity" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Կայքի Անվանում (Հայերեն)
              </label>
              <input
                type="text"
                value={siteTitleHy}
                onChange={(e) => setSiteTitleHy(e.target.value)}
                style={{ width: "100%", background: "#1e293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", padding: "8px 12px", borderRadius: "8px", fontSize: "0.88rem", outline: "none" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Site Title (English)
              </label>
              <input
                type="text"
                value={siteTitleEn}
                onChange={(e) => setSiteTitleEn(e.target.value)}
                style={{ width: "100%", background: "#1e293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", padding: "8px 12px", borderRadius: "8px", fontSize: "0.88rem", outline: "none" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Կայքի Նկարագրություն (Հայերեն)
              </label>
              <textarea
                rows={3}
                value={siteDescHy}
                onChange={(e) => setSiteDescHy(e.target.value)}
                style={{ width: "100%", background: "#1e293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", padding: "8px 12px", borderRadius: "8px", fontSize: "0.88rem", outline: "none", resize: "vertical" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Site Description (English)
              </label>
              <textarea
                rows={3}
                value={siteDescEn}
                onChange={(e) => setSiteDescEn(e.target.value)}
                style={{ width: "100%", background: "#1e293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", padding: "8px 12px", borderRadius: "8px", fontSize: "0.88rem", outline: "none", resize: "vertical" }}
              />
            </div>
          </div>
        )}

        {/* TAB 3: FONTS */}
        {activeTab === "fonts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Հիմնական Տառատեսակ (Font Family)
              </label>
              <select
                value={siteFontName}
                onChange={(e) => {
                  setSiteFontName(e.target.value);
                  if (e.target.value === "HDesign") {
                    setSiteFontUrl("");
                  }
                }}
                style={{ width: "100%", background: "#1e293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", padding: "8px 12px", borderRadius: "8px", fontSize: "0.88rem", outline: "none" }}
              >
                <option value="HDesign">HDesign Armenian Variable (Default)</option>
                <option value="Inter">Inter (Sans-serif)</option>
                <option value="Roboto">Roboto (Google Font)</option>
                <option value="Noto Sans Armenian">Noto Sans Armenian</option>
                <option value="Custom">Արտաքին URL (Custom Font)</option>
              </select>
            </div>

            {siteFontName === "Custom" && (
              <div>
                <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  Տառատեսակի CSS URL (.woff2 կամ Google Fonts)
                </label>
                <input
                  type="url"
                  placeholder="https://fonts.googleapis.com/css2?..."
                  value={siteFontUrl}
                  onChange={(e) => setSiteFontUrl(e.target.value)}
                  style={{ width: "100%", background: "#1e293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", padding: "8px 12px", borderRadius: "8px", fontSize: "0.88rem", outline: "none" }}
                />
              </div>
            )}

            <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "10px", border: "1px dashed rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "4px" }}>Տառատեսակի Նախադիտում՝</div>
              <div style={{ fontSize: "1.1rem", fontFamily: siteFontName, color: "#fff", lineHeight: "1.5" }}>
                Հայկական գեղեցիկ տառատեսակ: The quick brown fox jumps over the lazy dog. 0123456789
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER & ACTIONS ── */}
      <div
        style={{
          padding: "14px 20px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(0, 0, 0, 0.25)"
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "transparent",
            color: "#94a3b8",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          Փակել
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            background: "#14b8a6",
            color: "#042f2e",
            border: "none",
            padding: "8px 20px",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: 800,
            cursor: saving ? "wait" : "pointer",
            boxShadow: "0 2px 10px rgba(20, 184, 166, 0.3)"
          }}
        >
          {saving ? "Պահպանվում է..." : "💾 Պահպանել Փոփոխությունները"}
        </button>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#14b8a6",
            color: "#042f2e",
            padding: "8px 16px",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "0.82rem",
            boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
            zIndex: 10
          }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
