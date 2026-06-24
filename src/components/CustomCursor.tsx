"use client";

import { useEffect, useState } from "react";

type CursorDef = {
  svg: string;
  hotspot_x: number;
  hotspot_y: number;
};

type PersonalizationSettings = {
  theme_hue: string;
  cursor_colors: string[];
  cursors: {
    default: CursorDef;
    pointer: CursorDef;
    text: CursorDef;
  };
};

const DEFAULT_COLORS = [
  "#d4907e", // Soft Dusty Rose
  "#89b59a", // Soft Sage Green
  "#7aa4b8", // Soft Sky Blue
  "#b09dba", // Soft Lavender
  "#d4b884", // Soft Honey
  "#a07aa0", // Soft Mauve
  "#6fa8b3", // Soft Cyan
  "#a8ae7a", // Soft Lime
  "#7b90a8", // Soft Steel Blue
  "#c9a07a"  // Soft Caramel
];

const DEFAULT_CURSORS = {
  default: {
    svg: `<svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="8" height="20" rx="4" fill="currentColor"/>
  <rect x="12" y="6" width="8" height="46" rx="4" fill="currentColor"/>
  <rect x="24" y="12" width="8" height="66" rx="4" fill="currentColor"/>
  <rect x="36" y="18" width="8" height="82" rx="4" fill="currentColor"/>
  <rect x="48" y="24" width="8" height="72" rx="4" fill="currentColor"/>
  <rect x="60" y="30" width="8" height="56" rx="4" fill="currentColor"/>
  <rect x="72" y="36" width="8" height="20" rx="4" fill="currentColor"/>
  <rect x="72" y="66" width="8" height="12" rx="4" fill="currentColor"/>
  <rect x="84" y="42" width="8" height="10" rx="4" fill="currentColor"/>
  <rect x="84" y="76" width="8" height="16" rx="4" fill="currentColor"/>
</svg>`,
    hotspot_x: 0,
    hotspot_y: 0
  },
  pointer: {
    svg: `<svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="44" width="8" height="36" rx="4" fill="currentColor"/>
  <rect x="12" y="12" width="8" height="68" rx="4" fill="currentColor"/>
  <rect x="24" y="24" width="8" height="56" rx="4" fill="currentColor"/>
  <rect x="36" y="24" width="8" height="56" rx="4" fill="currentColor"/>
  <rect x="48" y="36" width="8" height="44" rx="4" fill="currentColor"/>
</svg>`,
    hotspot_x: 5,
    hotspot_y: 4
  },
  text: {
    svg: `<svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Top segments -->
  <rect x="0" y="12" width="8" height="16" rx="4" fill="currentColor"/>
  <rect x="12" y="12" width="8" height="16" rx="4" fill="currentColor"/>
  <rect x="48" y="12" width="8" height="16" rx="4" fill="currentColor"/>
  <rect x="60" y="12" width="8" height="16" rx="4" fill="currentColor"/>
  
  <!-- Middle continuous segments -->
  <rect x="24" y="12" width="8" height="76" rx="4" fill="currentColor"/>
  <rect x="36" y="12" width="8" height="76" rx="4" fill="currentColor"/>
  
  <!-- Bottom segments -->
  <rect x="0" y="72" width="8" height="16" rx="4" fill="currentColor"/>
  <rect x="12" y="72" width="8" height="16" rx="4" fill="currentColor"/>
  <rect x="48" y="72" width="8" height="16" rx="4" fill="currentColor"/>
  <rect x="60" y="72" width="8" height="16" rx="4" fill="currentColor"/>
</svg>`,
    hotspot_x: 11,
    hotspot_y: 16
  }
};

const getCursorValue = (svgContent: string, hotspotX: number, hotspotY: number, color: string, fallback: string) => {
  let styledSvg = svgContent;
  // Replace currentColor
  styledSvg = styledSvg.replaceAll("currentColor", color);
  // Replace hardcoded fill values (except none)
  styledSvg = styledSvg.replace(/fill=["'](?!none\b)[^"']+["']/gi, `fill="${color}"`);
  // Replace hardcoded stroke values (except none)
  styledSvg = styledSvg.replace(/stroke=["'](?!none\b)[^"']+["']/gi, `stroke="${color}"`);
  
  return `url("data:image/svg+xml,${encodeURIComponent(styledSvg)}") ${hotspotX} ${hotspotY}, ${fallback}`;
};

export default function CustomCursor() {
  const [colors, setColors] = useState<string[]>(DEFAULT_COLORS);
  const [cursors, setCursors] = useState<{ default: CursorDef; pointer: CursorDef; text: CursorDef }>(DEFAULT_CURSORS);
  const [currentColor, setCurrentColor] = useState(DEFAULT_COLORS[0]);

  // Load configuration from database api
  useEffect(() => {
    fetch("/api/personalization")
      .then((res) => res.json())
      .then((data: PersonalizationSettings) => {
        if (data.cursor_colors && data.cursor_colors.length > 0) {
          setColors(data.cursor_colors);
          setCurrentColor(data.cursor_colors[0]);
        }
        if (data.cursors) {
          setCursors({
            default: data.cursors.default || DEFAULT_CURSORS.default,
            pointer: data.cursors.pointer || DEFAULT_CURSORS.pointer,
            text: data.cursors.text || DEFAULT_CURSORS.text,
          });
        }
      })
      .catch((err) => console.error("Failed to load personalization settings for cursors:", err));
  }, []);

  useEffect(() => {
    const applyCursor = (color: string) => {
      const defaultCursor = getCursorValue(cursors.default.svg, cursors.default.hotspot_x, cursors.default.hotspot_y, color, "auto");
      const pointerCursor = getCursorValue(cursors.pointer.svg, cursors.pointer.hotspot_x, cursors.pointer.hotspot_y, color, "pointer");
      const textCursor = getCursorValue(cursors.text.svg, cursors.text.hotspot_x, cursors.text.hotspot_y, color, "text");
      
      document.documentElement.style.setProperty("--custom-cursor", defaultCursor);
      document.documentElement.style.setProperty("--custom-cursor-pointer", pointerCursor);
      document.documentElement.style.setProperty("--custom-cursor-text", textCursor);
    };

    // Apply cursor styles when color or cursor configurations change
    applyCursor(currentColor);

    const handleMouseDown = () => {
      setCurrentColor((prevColor) => {
        const availableColors = colors.filter((c) => c !== prevColor);
        if (availableColors.length === 0) return prevColor;
        const nextColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        applyCursor(nextColor);
        return nextColor;
      });
    };

    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [currentColor, colors, cursors]);

  return null;
}
