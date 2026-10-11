"use client";

import React, { useState } from "react";

interface AppDesignSystemPickerProps {
  value?: string;
  onChange: (value: string) => void;
  locale?: string;
}

const DEFAULT_PRESETS = [
  "HDesign",
  "M3 Expressive",
  "Liquid Glass",
  "Fluent 2"
];

export default function AppDesignSystemPicker({
  value = "",
  onChange,
  locale = "hy"
}: AppDesignSystemPickerProps) {
  const [customInput, setCustomInput] = useState("");
  const [customList, setCustomList] = useState<string[]>([]);

  // If value is set but not in presets or customList, add it so it renders as a chip
  const allOptions = Array.from(new Set([...DEFAULT_PRESETS, ...customList, ...(value ? [value] : [])]));

  const handleSelect = (name: string) => {
    if (value === name) {
      onChange(""); // Toggle off
    } else {
      onChange(name);
    }
  };

  const handleAddCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;

    if (!customList.includes(trimmed)) {
      setCustomList(prev => [...prev, trimmed]);
    }
    onChange(trimmed);
    setCustomInput("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        background: "rgba(15, 23, 42, 0.03)",
        border: "1px solid rgba(203, 213, 225, 0.8)",
        borderRadius: "14px",
        padding: "16px"
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>
            {locale === "hy" ? "Դիզայնի Համակարգ (Design System)" : "Design System"}
          </label>
          {value && (
            <span
              style={{
                fontSize: "0.74rem",
                fontWeight: 700,
                background: "rgba(74, 137, 124, 0.15)",
                color: "#2e7d32",
                padding: "2px 8px",
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              🎨 {value}
            </span>
          )}
        </div>

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            style={{
              background: "transparent",
              color: "#94a3b8",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "3px 8px",
              fontSize: "0.72rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {locale === "hy" ? "Մաքրել" : "Clear"}
          </button>
        )}
      </div>

      {/* Preset Chips */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", paddingTop: "2px" }}>
        {allOptions.map((opt) => {
          const isSelected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(opt)}
              style={{
                padding: "5px 12px",
                background: isSelected ? "#0f172a" : "#ffffff",
                color: isSelected ? "#ffffff" : "#1e293b",
                border: `1px solid ${isSelected ? "#0f172a" : "#cbd5e1"}`,
                borderRadius: "20px",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <span>{isSelected ? "✓" : "🎨"}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Add New Custom Design System Input ("նոր անուններ ավելացնելու տեղ") */}
      <form onSubmit={handleAddCustom} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder={locale === "hy" ? "Գրեք նոր դիզայնի համակարգ (օր.՝ Apple HIG, Material You)..." : "Enter new design system name..."}
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
          {locale === "hy" ? "+ Ավելացնել" : "+ Add"}
        </button>
      </form>

      {/* Explanatory Note */}
      <div style={{ fontSize: "0.72rem", color: "#64748b", lineHeight: 1.4, borderTop: "1px dashed rgba(203, 213, 225, 0.7)", paddingTop: "6px" }}>
        💡 <strong>Նշում.</strong> Ընտրված դիզայնի համակարգը կցուցադրվի հավելվածի էջի վերնագրի վերևում (լեզուների կողքին) եւ «Տեխնիկական Տվյալներ» բաժնում։
      </div>
    </div>
  );
}
