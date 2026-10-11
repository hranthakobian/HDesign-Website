"use client";

import React, { useState } from "react";
import { UN_LANGUAGES, ADDITIONAL_POPULAR_LANGUAGES, formatLanguageName, LanguageItem } from "@/lib/languages";

interface AppLanguagesPickerProps {
  languages: string[];
  onChange: (languages: string[]) => void;
  locale?: string;
}

export default function AppLanguagesPicker({
  languages = [],
  onChange,
  locale = "hy"
}: AppLanguagesPickerProps) {
  const [customInput, setCustomInput] = useState("");
  const [showMore, setShowMore] = useState(false);

  // Normalize selected array checking by code, id or label
  const isSelected = (item: LanguageItem) => {
    return languages.some(
      (l) =>
        l.toLowerCase() === item.id.toLowerCase() ||
        l.toLowerCase() === item.code.toLowerCase() ||
        l.toLowerCase() === item.label.toLowerCase() ||
        l.toLowerCase() === item.amLabel.toLowerCase() ||
        l.toLowerCase() === item.enLabel.toLowerCase()
    );
  };

  const handleToggle = (item: LanguageItem) => {
    if (isSelected(item)) {
      // Remove matching
      const next = languages.filter(
        (l) =>
          l.toLowerCase() !== item.id.toLowerCase() &&
          l.toLowerCase() !== item.code.toLowerCase() &&
          l.toLowerCase() !== item.label.toLowerCase() &&
          l.toLowerCase() !== item.amLabel.toLowerCase() &&
          l.toLowerCase() !== item.enLabel.toLowerCase()
      );
      onChange(next);
    } else {
      // Add standard label
      onChange([...languages, item.label]);
    }
  };

  const handleRemove = (rawLang: string) => {
    onChange(languages.filter((l) => l !== rawLang));
  };

  const handleAddCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;

    // Check if not already in list
    const alreadyExists = languages.some((l) => l.toLowerCase() === trimmed.toLowerCase());
    if (!alreadyExists) {
      onChange([...languages, trimmed]);
    }
    setCustomInput("");
  };

  const handleSelectAllUN = () => {
    const unLabels = UN_LANGUAGES.map((u) => u.label);
    const set = new Set([...languages, ...unLabels]);
    onChange(Array.from(set));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        background: "rgba(15, 23, 42, 0.03)",
        border: "1px solid rgba(203, 213, 225, 0.8)",
        borderRadius: "14px",
        padding: "16px"
      }}
    >
      {/* Top Header & Actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1e293b" }}>
            Աջակցվող Լեզուներ
          </span>
          <span
            style={{
              fontSize: "0.74rem",
              fontWeight: 700,
              background: languages.length > 1 ? "rgba(74, 137, 124, 0.15)" : "#e2e8f0",
              color: languages.length > 1 ? "#2e7d32" : "#64748b",
              padding: "2px 8px",
              borderRadius: "12px"
            }}
          >
            {languages.length > 1 ? `🌐 Բազմալեզու (${languages.length})` : `${languages.length} ընտրված`}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={handleSelectAllUN}
            style={{
              background: "#0f172a",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "0.74rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px"
            }}
            title="Միավորված Ազգերի Կազմակերպության (ՄԱԿ) բոլոր պաշտոնական լեզուները"
          >
            🇺🇳 Ընտրել ՄԱԿ-ի լեզուները
          </button>

          {languages.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                background: "transparent",
                color: "#94a3b8",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "4px 8px",
                fontSize: "0.74rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Մաքրել
            </button>
          )}
        </div>
      </div>

      {/* Selected Chips */}
      {languages.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", paddingTop: "2px", paddingBottom: "2px" }}>
          {languages.map((lang, idx) => (
            <span
              key={idx}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#0f172a",
                color: "#ffffff",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "0.78rem",
                fontWeight: 700,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}
            >
              <span>{formatLanguageName(lang, locale)}</span>
              <button
                type="button"
                onClick={() => handleRemove(lang)}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: 0
                }}
                title="Հեռացնել"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* UN Languages Section */}
      <div>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
          <span>🇺🇳 ՄԱԿ-ի (Միավորված ազգերի կազմակերպություն) լեզուներ՝</span>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {UN_LANGUAGES.map((item) => {
            const active = isSelected(item);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleToggle(item)}
                style={{
                  padding: "5px 12px",
                  background: active ? "#2563eb" : "#ffffff",
                  color: active ? "#ffffff" : "#1e293b",
                  border: `1px solid ${active ? "#2563eb" : "#cbd5e1"}`,
                  borderRadius: "20px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <span>{active ? "✓" : "+"}</span>
                <span>{item.label}</span>
                <span style={{ fontSize: "0.7rem", opacity: active ? 0.9 : 0.6 }}>
                  ({item.amLabel})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Custom Language Input ("նոր լեզու ավելացնելու տեղ") */}
      <form onSubmit={handleAddCustom} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Գրեք նոր լեզու (օր.՝ Գերմաներեն, Վրացերեն, Իտալերեն)..."
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            fontSize: "0.82rem",
            color: "#0f172a"
          }}
        />
        <button
          type="submit"
          disabled={!customInput.trim()}
          style={{
            padding: "8px 16px",
            background: customInput.trim() ? "var(--accent, #4A897C)" : "#cbd5e1",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: customInput.trim() ? "pointer" : "not-allowed",
            whiteSpace: "nowrap"
          }}
        >
          + Ավելացնել
        </button>
      </form>

      {/* Toggle popular additional languages */}
      <div>
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          style={{
            background: "none",
            border: "none",
            color: "#3b82f6",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
            padding: 0
          }}
        >
          {showMore ? "▲ Փակել այլ լեզուները" : "▼ Տեսնել այլ հաճախ հանդիպող լեզուներ (Deutsch, Italiano, 日本語...)"}
        </button>

        {showMore && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
            {ADDITIONAL_POPULAR_LANGUAGES.map((item) => {
              const active = isSelected(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggle(item)}
                  style={{
                    padding: "4px 10px",
                    background: active ? "#0f172a" : "#ffffff",
                    color: active ? "#ffffff" : "#334155",
                    border: `1px solid ${active ? "#0f172a" : "#cbd5e1"}`,
                    borderRadius: "16px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <span>{active ? "✓" : "+"}</span>
                  <span>{item.label}</span>
                  <span style={{ fontSize: "0.68rem", opacity: active ? 0.85 : 0.6 }}>
                    ({item.amLabel})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Explanatory Note */}
      <div style={{ fontSize: "0.72rem", color: "#64748b", lineHeight: 1.4, borderTop: "1px dashed rgba(203, 213, 225, 0.7)", paddingTop: "8px" }}>
        💡 <strong>Նշում.</strong> Եթե ընտրված է մեկից ավելի լեզու, հավելվածի էջի վերնագրի վերևում կգրվի <strong>«Բազմալեզու»</strong>, իսկ «Տեխնիկական Տվյալներ» բաժնում կնշվեն բոլոր լեզուների ամբողջական անունները։
      </div>
    </div>
  );
}
