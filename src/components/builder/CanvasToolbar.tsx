"use client";

import React from "react";
import Link from "next/link";
import pagesSchema from "@/config/pages-schema.json";

export type WorldMode = "static_and_system" | "dynamic_templates";

interface CanvasToolbarProps {
  currentWorld: WorldMode;
  onWorldChange: (world: WorldMode) => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onResetZoom: () => void;
  onZoomFit: () => void;
  activeThemeId: string;
  availableThemes: Array<{ id: string; name: string }>;
  onThemeChange: (themeId: string) => void;
  selectedMockIds: Record<string, string>;
  onMockDataChange: (pageId: string, mockId: string) => void;
  dynamicPages: typeof pagesSchema.pages;
}

export default function CanvasToolbar({
  currentWorld,
  onWorldChange,
  zoom,
  onZoomChange,
  onResetZoom,
  onZoomFit,
  activeThemeId,
  availableThemes,
  onThemeChange,
  selectedMockIds,
  onMockDataChange,
  dynamicPages
}: CanvasToolbarProps) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <header className="hd-canvas-toolbar" style={{
      position: "fixed",
      top: 12,
      left: 12,
      right: 12,
      height: 52,
      backgroundColor: "rgba(15, 23, 42, 0.92)",
      backdropFilter: "blur(16px)",
      borderRadius: 12,
      border: "1px solid rgba(255, 255, 255, 0.12)",
      boxShadow: "0 12px 30px rgba(0, 0, 0, 0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 16px",
      zIndex: 1000,
      color: "#f8fafc",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Left: Branding & World Switcher */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/" style={{ textDecoration: "none", color: "#ffffff", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "14px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#14b8a6", boxShadow: "0 0 8px #14b8a6" }}></span>
          <span>HDesign Canvas</span>
        </Link>

        <div style={{ height: 20, width: 1, backgroundColor: "rgba(255, 255, 255, 0.15)" }} />

        {/* Mode / World Switcher */}
        <div style={{
          display: "flex",
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          padding: 3,
          borderRadius: 8,
          border: "1px solid rgba(255, 255, 255, 0.08)"
        }}>
          <button
            onClick={() => onWorldChange("static_and_system")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 6,
              fontSize: "12px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              backgroundColor: currentWorld === "static_and_system" ? "#14b8a6" : "transparent",
              color: currentWorld === "static_and_system" ? "#ffffff" : "#94a3b8"
            }}
          >
            <span>📄</span>
            <span>Static & System Pages (404/500)</span>
          </button>

          <button
            onClick={() => onWorldChange("dynamic_templates")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 6,
              fontSize: "12px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              backgroundColor: currentWorld === "dynamic_templates" ? "#14b8a6" : "transparent",
              color: currentWorld === "dynamic_templates" ? "#ffffff" : "#94a3b8"
            }}
          >
            <span>⚡</span>
            <span>Dynamic Master Templates</span>
          </button>
        </div>
      </div>

      {/* Middle: Mock Data Selector (Active ONLY in Dynamic Mode) */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {currentWorld === "dynamic_templates" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(20, 184, 166, 0.12)", border: "1px solid rgba(20, 184, 166, 0.3)", borderRadius: 8, padding: "3px 10px" }}>
            <span style={{ fontSize: "11px", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase" }}>Mock Data:</span>
            {dynamicPages.map((page) => (
              <select
                key={page.id}
                value={selectedMockIds[page.id] || page.defaultMockId}
                onChange={(e) => onMockDataChange(page.id, e.target.value)}
                style={{
                  background: "#1e293b",
                  color: "#f8fafc",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: 6,
                  padding: "3px 8px",
                  fontSize: "11px",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                {page.mockDatasets?.map((dataset: any) => (
                  <option key={dataset.id} value={dataset.id}>
                    {page.title.split(" ")[0]}: {dataset.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}
      </div>

      {/* Right: Active Theme & Zoom Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Physical Theme Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>Theme:</span>
          <select
            value={activeThemeId}
            onChange={(e) => onThemeChange(e.target.value)}
            style={{
              background: "#1e293b",
              color: "#f8fafc",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              outline: "none"
            }}
          >
            {availableThemes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ height: 20, width: 1, backgroundColor: "rgba(255, 255, 255, 0.15)" }} />

        {/* Zoom Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, backgroundColor: "rgba(255, 255, 255, 0.08)", padding: "2px 6px", borderRadius: 8 }}>
          <button
            onClick={() => onZoomChange(Math.max(0.2, zoom - 0.1))}
            title="Zoom Out"
            style={{ background: "none", border: "none", color: "#f8fafc", cursor: "pointer", padding: "4px 8px", fontSize: "14px", fontWeight: 700 }}
          >
            −
          </button>
          <button
            onClick={onResetZoom}
            title="Reset to 100%"
            style={{ background: "none", border: "none", color: "#f8fafc", cursor: "pointer", padding: "4px 6px", fontSize: "12px", minWidth: 42, textAlign: "center", fontWeight: 600 }}
          >
            {zoomPercent}%
          </button>
          <button
            onClick={() => onZoomChange(Math.min(2.0, zoom + 0.1))}
            title="Zoom In"
            style={{ background: "none", border: "none", color: "#f8fafc", cursor: "pointer", padding: "4px 8px", fontSize: "14px", fontWeight: 700 }}
          >
            +
          </button>
          <button
            onClick={onZoomFit}
            title="Fit All Frames in View"
            style={{ background: "none", border: "none", color: "#14b8a6", cursor: "pointer", padding: "4px 8px", fontSize: "11px", fontWeight: 600 }}
          >
            Fit All
          </button>
        </div>
      </div>
    </header>
  );
}
