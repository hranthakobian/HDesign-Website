"use client";

import React, { useState, useEffect } from "react";

// Global cache for software icons configured in admin settings
let globalSoftwareIcons: Record<string, string> = {};
let isFetchingSoftwareIcons = false;
const listeners = new Set<(icons: Record<string, string>) => void>();

function notifyListeners() {
  listeners.forEach(fn => fn(globalSoftwareIcons));
}

function fetchGlobalSoftwareIcons() {
  if (isFetchingSoftwareIcons) return;
  isFetchingSoftwareIcons = true;
  fetch('/api/general-settings', { cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
      if (data && data.software_icons && typeof data.software_icons === 'object') {
        globalSoftwareIcons = { ...globalSoftwareIcons, ...data.software_icons };
        notifyListeners();
      }
    })
    .catch(() => {})
    .finally(() => {
      isFetchingSoftwareIcons = false;
    });
}

// Initial fetch if in browser
if (typeof window !== 'undefined') {
  fetchGlobalSoftwareIcons();
  window.addEventListener('software-icons-updated', (e: any) => {
    if (e.detail?.software_icons) {
      globalSoftwareIcons = { ...globalSoftwareIcons, ...e.detail.software_icons };
      notifyListeners();
    } else {
      fetchGlobalSoftwareIcons();
    }
  });
}

interface SoftwareIconProps {
  name: string;
  iconUrl?: string;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export default function SoftwareIcon({
  name,
  iconUrl,
  size = 20,
  className,
  style
}: SoftwareIconProps) {
  const [imgError, setImgError] = useState(false);
  const [customIcons, setCustomIcons] = useState<Record<string, string>>(globalSoftwareIcons);

  useEffect(() => {
    const handleUpdate = (icons: Record<string, string>) => {
      setCustomIcons(icons);
    };
    listeners.add(handleUpdate);
    if (Object.keys(globalSoftwareIcons).length === 0) {
      fetchGlobalSoftwareIcons();
    }
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const n = (name || "").toLowerCase().trim();
  const dimension = typeof size === "number" ? `${size}px` : size;

  // Check if a custom icon is configured in General Settings for this software name
  const configuredIconUrl = customIcons[name] ||
    Object.entries(customIcons).find(([key]) => {
      const k = key.toLowerCase().trim();
      return k === n || n.includes(k) || k.includes(n);
    })?.[1];

  // Resolve final effective iconUrl (priority: configured in settings > explicit iconUrl prop)
  const effectiveIconUrl = configuredIconUrl || iconUrl;

  // If valid iconUrl provided and hasn't errored, render img
  if (effectiveIconUrl && !imgError) {
    return (
      <img
        src={effectiveIconUrl}
        alt={name}
        onError={() => setImgError(true)}
        className={className}
        style={{
          width: dimension,
          height: dimension,
          objectFit: "contain",
          flexShrink: 0,
          ...style
        }}
      />
    );
  }

  // Figma
  if (n.includes("figma")) {
    return (
      <svg
        className={className}
        style={{ width: dimension, height: dimension, flexShrink: 0, ...style }}
        viewBox="0 0 38 57"
        fill="none"
      >
        <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE" />
        <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83" />
        <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262" />
        <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E" />
        <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF" />
      </svg>
    );
  }

  // Adobe Illustrator (Ai)
  if (n.includes("illustrator") || n === "ai") {
    return (
      <svg
        className={className}
        style={{ width: dimension, height: dimension, flexShrink: 0, borderRadius: "22%", ...style }}
        viewBox="0 0 64 64"
      >
        <rect width="64" height="64" rx="14" fill="#330000" />
        <text x="50%" y="62%" textAnchor="middle" fill="#FF9A00" fontSize="30" fontWeight="900" fontFamily="sans-serif">Ai</text>
      </svg>
    );
  }

  // Adobe Photoshop (Ps)
  if (n.includes("photoshop") || n === "ps") {
    return (
      <svg
        className={className}
        style={{ width: dimension, height: dimension, flexShrink: 0, borderRadius: "22%", ...style }}
        viewBox="0 0 64 64"
      >
        <rect width="64" height="64" rx="14" fill="#001E36" />
        <text x="50%" y="62%" textAnchor="middle" fill="#31A8FF" fontSize="30" fontWeight="900" fontFamily="sans-serif">Ps</text>
      </svg>
    );
  }

  // After Effects (Ae)
  if (n.includes("after effects") || n === "ae") {
    return (
      <svg
        className={className}
        style={{ width: dimension, height: dimension, flexShrink: 0, borderRadius: "22%", ...style }}
        viewBox="0 0 64 64"
      >
        <rect width="64" height="64" rx="14" fill="#00005B" />
        <text x="50%" y="62%" textAnchor="middle" fill="#9999FF" fontSize="30" fontWeight="900" fontFamily="sans-serif">Ae</text>
      </svg>
    );
  }

  // Adobe InDesign (Id)
  if (n.includes("indesign") || n === "id") {
    return (
      <svg
        className={className}
        style={{ width: dimension, height: dimension, flexShrink: 0, borderRadius: "22%", ...style }}
        viewBox="0 0 64 64"
      >
        <rect width="64" height="64" rx="14" fill="#49021F" />
        <text x="50%" y="62%" textAnchor="middle" fill="#FF3366" fontSize="30" fontWeight="900" fontFamily="sans-serif">Id</text>
      </svg>
    );
  }

  // Adobe Premiere Pro (Pr)
  if (n.includes("premiere") || n === "pr") {
    return (
      <svg
        className={className}
        style={{ width: dimension, height: dimension, flexShrink: 0, borderRadius: "22%", ...style }}
        viewBox="0 0 64 64"
      >
        <rect width="64" height="64" rx="14" fill="#00005B" />
        <text x="50%" y="62%" textAnchor="middle" fill="#EA77FF" fontSize="30" fontWeight="900" fontFamily="sans-serif">Pr</text>
      </svg>
    );
  }

  // Blender
  if (n.includes("blender")) {
    return (
      <svg
        className={className}
        style={{ width: dimension, height: dimension, flexShrink: 0, ...style }}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="13" r="5" fill="#E87D0D" />
        <circle cx="12" cy="13" r="2.5" fill="#236192" />
        <path d="M12 8V2M7 10L2 6M17 10L22 6" stroke="#E87D0D" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // Unity
  if (n.includes("unity")) {
    return (
      <svg
        className={className}
        style={{ width: dimension, height: dimension, flexShrink: 0, ...style }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.5l6.5 3.6-2.8 1.6L12 7.8l-3.7 1.9-2.8-1.6L12 4.5zm-7 5.2l5.7 3.2v5.8L5 15.6V9.7zm14 5.9l-5.7 3.1V12.9l5.7-3.2v5.9z" />
      </svg>
    );
  }

  // Unreal Engine
  if (n.includes("unreal")) {
    return (
      <svg
        className={className}
        style={{ width: dimension, height: dimension, flexShrink: 0, ...style }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
        <text x="50%" y="64%" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="900" fontFamily="sans-serif">U</text>
      </svg>
    );
  }

  // Windows
  if (n.includes("windows") || n.includes("win")) {
    return (
      <svg
        className={className}
        style={{ width: dimension, height: dimension, flexShrink: 0, ...style }}
        viewBox="0 0 24 24"
        fill="#00ADEF"
      >
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.551H10.949M0 12.6h9.75V22.05L0 20.7m10.949-8.1H24V24l-13.051-1.95" />
      </svg>
    );
  }

  // macOS / Apple / iOS
  if (n.includes("macos") || n.includes("mac") || n.includes("apple") || n.includes("ios")) {
    return (
      <svg
        className={className}
        style={{ width: dimension, height: dimension, flexShrink: 0, ...style }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.88c.64-.78 1.08-1.86.96-2.88-.93.04-2.05.62-2.71 1.4-.58.67-1.09 1.77-.95 2.81 1.04.08 2.06-.55 2.7-1.33z" />
      </svg>
    );
  }

  // Linux
  if (n.includes("linux") || n.includes("ubuntu")) {
    return (
      <svg
        className={className}
        style={{ width: dimension, height: dimension, flexShrink: 0, ...style }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a4 4 0 0 0-4 4v4a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z" fill="rgba(255,193,7,0.2)" stroke="#FFC107" />
        <path d="M8 14c-3 0-5 2-5 5v1h18v-1c0-3-2-5-5-5" stroke="#FFC107" />
      </svg>
    );
  }

  // Web / Browser
  if (n.includes("browser") || n.includes("web") || n.includes("chrome") || n.includes("firefox")) {
    return (
      <svg
        className={className}
        style={{ width: dimension, height: dimension, flexShrink: 0, ...style }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    );
  }

  // Default fallback icon
  return (
    <svg
      className={className}
      style={{ width: dimension, height: dimension, flexShrink: 0, color: "var(--accent)", ...style }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}
