"use client";

import React, { useState, useEffect } from "react";
import { FileSizeUnit, FILE_SIZE_UNITS, parseFileSize } from "@/lib/fileSizeUtils";

interface FileSizePickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  locale?: string;
}

export default function FileSizePicker({
  value = "",
  onChange,
  label = "Նիշքի Քաշ (File Size)",
  locale = "hy"
}: FileSizePickerProps) {
  const parsed = parseFileSize(value);
  const [num, setNum] = useState<string>(parsed.number);
  const [unit, setUnit] = useState<FileSizeUnit>(parsed.unit);

  // Sync internal state when external value changes
  useEffect(() => {
    const p = parseFileSize(value);
    setNum(p.number);
    setUnit(p.unit);
  }, [value]);

  const handleNumChange = (newNum: string) => {
    setNum(newNum);
    const trimmed = newNum.trim();
    if (!trimmed) {
      onChange("");
    } else {
      onChange(`${trimmed} ${unit}`);
    }
  };

  const handleUnitChange = (newUnit: FileSizeUnit) => {
    setUnit(newUnit);
    const trimmed = num.trim();
    if (trimmed) {
      onChange(`${trimmed} ${newUnit}`);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
            {label}
          </label>
          {num.trim() && (
            <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
              {locale === "hy" ? "Պահպանվում է՝ " : "Saved as: "}
              <strong style={{ color: "#0f172a" }}>{`${num.trim()} ${unit}`}</strong>
            </span>
          )}
        </div>
      )}

      {/* Main Input Group: Number + Dropdown */}
      <div style={{ display: "flex", alignItems: "stretch", gap: "6px" }}>
        <input
          type="number"
          step="any"
          min="0"
          value={num}
          onChange={(e) => handleNumChange(e.target.value)}
          placeholder="օր. 149"
          style={{
            flex: 1,
            minWidth: 0,
            padding: "10px 14px",
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            color: "#0f172a",
            fontSize: "0.88rem",
            fontWeight: 600,
            outline: "none"
          }}
        />

        <select
          value={unit}
          onChange={(e) => handleUnitChange(e.target.value as FileSizeUnit)}
          style={{
            padding: "10px 14px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            color: "#0f172a",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
            outline: "none"
          }}
        >
          {FILE_SIZE_UNITS.map((u) => (
            <option key={u.value} value={u.value}>
              {locale === "hy" ? `${u.labelAm} (${u.labelEn})` : `${u.labelEn} (${u.labelAm})`}
            </option>
          ))}
        </select>
      </div>

      {/* Quick Unit Pills (ՄԲ / ԿԲ / ԳԲ) */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
        <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>Միավոր՝</span>
        {(['MB', 'KB', 'GB', 'B'] as FileSizeUnit[]).map((u) => {
          const isSelected = unit === u;
          const labelAm = u === 'MB' ? 'ՄԲ' : (u === 'KB' ? 'ԿԲ' : (u === 'GB' ? 'ԳԲ' : 'Բ'));
          return (
            <button
              key={u}
              type="button"
              onClick={() => handleUnitChange(u)}
              style={{
                padding: "3px 10px",
                borderRadius: "6px",
                border: `1px solid ${isSelected ? "#0f172a" : "#cbd5e1"}`,
                background: isSelected ? "#0f172a" : "#f8fafc",
                color: isSelected ? "#ffffff" : "#475569",
                fontSize: "0.76rem",
                fontWeight: isSelected ? 800 : 600,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {labelAm}
            </button>
          );
        })}

        {num.trim() && (
          <button
            type="button"
            onClick={() => handleNumChange("")}
            title={locale === "hy" ? "Մաքրել" : "Clear"}
            style={{
              marginLeft: "auto",
              padding: "2px 8px",
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "0.74rem",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            ✕ {locale === "hy" ? "Մաքրել" : "Clear"}
          </button>
        )}
      </div>
    </div>
  );
}
