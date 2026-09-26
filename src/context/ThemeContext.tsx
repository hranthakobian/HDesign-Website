"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import defaultThemes from "@/config/themes.json";
import defaultPageData from "@/config/page-data.json";

export interface ThemeConfig {
  id: string;
  name: string;
  version?: string;
  description?: string;
  author?: string;
  preview_image?: string;
  is_active?: boolean;
  cssVariables: Record<string, string>;
  layout?: {
    headerStyle?: string;
    headerSticky?: boolean;
    borderRadius?: string;
    containerWidth?: string;
    [key: string]: any;
  };
  settings?: Record<string, any>;
  supported_blocks?: string[];
}

export interface BlockItem {
  id: string;
  type: string;
  hidden?: boolean;
  order?: number;
  settings: Record<string, any>;
  children?: BlockItem[];
}

export interface PageSchema {
  id?: string;
  slug: string;
  title: string;
  is_published?: boolean;
  meta?: Record<string, any>;
  blocks: BlockItem[];
}

export interface PageDataSchema {
  activeThemeId: string;
  siteTitle: { hy: string; en: string };
  navigation: {
    headerLinks: Array<{ id: string; labelHy: string; labelEn: string; href: string }>;
    footerLinks: Array<{ id: string; labelHy: string; labelEn: string; href: string }>;
  };
  pages: PageSchema[];
}

interface ThemeContextType {
  themes: ThemeConfig[];
  currentThemeId: string;
  currentTheme: ThemeConfig;
  setThemeId: (id: string) => void;
  updateThemeCustomVariables: (customVars: Record<string, string>) => void;
  pageData: PageDataSchema;
  currentPage: PageSchema | null;
  activeSlug: string;
  setActiveSlug: (slug: string) => void;
  updateBlockSettings: (blockId: string, newSettings: Record<string, any>) => void;
  updateInlineText: (blockId: string, textContent: string, fieldKey?: string) => void;
  isBuilderMode: boolean;
  reloadPageData: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

/**
 * Apply theme CSS variables to document.documentElement synchronously (0ms delay)
 */
export function applyThemeVariables(theme: ThemeConfig, customOverrides?: Record<string, string>) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.setAttribute("data-theme", theme.id);

  // Apply all defined CSS variables
  const variablesToApply = { ...theme.cssVariables, ...(customOverrides || {}) };

  Object.entries(variablesToApply).forEach(([prop, val]) => {
    if (val !== undefined && val !== null) {
      root.style.setProperty(prop, String(val));
    }
  });

  // Ensure compatibility with existing globals.scss CSS variables
  if (variablesToApply["--hue"]) {
    root.style.setProperty("--hue", String(variablesToApply["--hue"]));
  }
  if (variablesToApply["--saturation"]) {
    root.style.setProperty("--saturation", String(variablesToApply["--saturation"]));
  }
  if (variablesToApply["--lightness"]) {
    root.style.setProperty("--lightness", String(variablesToApply["--lightness"]));
  }
  if (variablesToApply["--bg-main"]) {
    root.style.setProperty("--bg", String(variablesToApply["--bg-main"]));
  }
  if (variablesToApply["--accent-color"]) {
    root.style.setProperty("--accent", String(variablesToApply["--accent-color"]));
    root.style.setProperty("accent-color", String(variablesToApply["--accent-color"]));
  }
  if (variablesToApply["--text-main"]) {
    root.style.setProperty("--text", String(variablesToApply["--text-main"]));
  }
  if (variablesToApply["--theme-color"]) {
    root.style.setProperty("--theme-color", String(variablesToApply["--theme-color"]));
    root.style.setProperty("--primary-color", String(variablesToApply["--theme-color"]));
    root.setAttribute("data-color", String(variablesToApply["--theme-color"]));
  }
  if (variablesToApply["--footer-bg"]) {
    root.style.setProperty("--footer-bg", String(variablesToApply["--footer-bg"]));
  }
}

export function ThemeProvider({
  children,
  initialThemeId = "default"
}: {
  children: React.ReactNode;
  initialThemeId?: string;
}) {
  const [themes] = useState<ThemeConfig[]>(defaultThemes as unknown as ThemeConfig[]);
  const [currentThemeId, setCurrentThemeId] = useState<string>(initialThemeId);
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [pageData, setPageData] = useState<PageDataSchema>(defaultPageData as unknown as PageDataSchema);
  const [activeSlug, setActiveSlug] = useState<string>("index");
  const [isBuilderMode, setIsBuilderMode] = useState<boolean>(false);

  // Detect Builder / iframe mode
  useEffect(() => {
    if (typeof window === "undefined") return;
    const inIframe = window.self !== window.top;
    const hasQuery = window.location.search.includes("builder=true");
    setIsBuilderMode(inIframe || hasQuery);
  }, []);

  // Compute active theme object
  const currentTheme = useMemo(() => {
    return themes.find((t) => t.id === currentThemeId) || themes[0] || {
      id: "default",
      name: "Default",
      cssVariables: {}
    };
  }, [themes, currentThemeId]);

  // Synchronously apply theme variables whenever currentTheme or custom overrides change
  useEffect(() => {
    const pageVars = (pageData as any)?.themeVariables || {};
    applyThemeVariables(currentTheme, { ...pageVars, ...customVariables });
  }, [currentTheme, customVariables, pageData]);

  // Read saved theme from localStorage on initial client mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedTheme = localStorage.getItem("hd_active_theme_id");
      if (savedTheme && themes.some((t) => t.id === savedTheme)) {
        setCurrentThemeId(savedTheme);
      }
    } catch {}
  }, [themes]);

  const setThemeId = useCallback((id: string) => {
    setCurrentThemeId(id);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("hd_active_theme_id", id);
      } catch {}
    }
  }, []);

  const updateThemeCustomVariables = useCallback((customVars: Record<string, string>) => {
    setCustomVariables((prev) => {
      const updated = { ...prev, ...customVars };
      if (currentTheme) {
        applyThemeVariables(currentTheme, updated);
      }
      return updated;
    });
  }, [currentTheme]);

  const currentPage = useMemo(() => {
    return pageData.pages.find((p) => p.slug === activeSlug) || pageData.pages[0] || null;
  }, [pageData, activeSlug]);

  const updateBlockSettings = useCallback((blockId: string, newSettings: Record<string, any>) => {
    setPageData((prev) => {
      const updatedPages = prev.pages.map((p) => {
        if (p.slug !== activeSlug) return p;
        return {
          ...p,
          blocks: p.blocks.map((b) => {
            if (b.id !== blockId) return b;
            return {
              ...b,
              settings: {
                ...b.settings,
                ...newSettings
              }
            };
          })
        };
      });
      return { ...prev, pages: updatedPages };
    });
  }, [activeSlug]);

  const updateInlineText = useCallback((blockId: string, textContent: string, fieldKey = "title") => {
    setPageData((prev) => {
      const updatedPages = prev.pages.map((p) => {
        if (p.slug !== activeSlug) return p;
        return {
          ...p,
          blocks: p.blocks.map((b) => {
            if (b.id !== blockId) return b;
            return {
              ...b,
              settings: {
                ...b.settings,
                [fieldKey]: textContent
              }
            };
          })
        };
      });
      return { ...prev, pages: updatedPages };
    });
  }, [activeSlug]);

  const reloadPageData = useCallback(async () => {
    try {
      const res = await fetch("/api/builder/pages");
      if (res.ok) {
        const data = await res.json();
        if (data?.pages) {
          setPageData((prev) => ({ ...prev, pages: data.pages }));
        }
      }
    } catch (err) {
      console.warn("Failed to reload page data from API:", err);
    }
  }, []);

  // Listen to postMessage API from Live Visual Builder
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleWindowMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      const { type, themeId, customVars, blockId, settings, textContent, fieldKey, pageDataOverride, slug } = event.data;

      switch (type) {
        case "UPDATE_THEME":
          if (themeId) {
            setThemeId(themeId);
          }
          break;

        case "UPDATE_THEME_VARIABLES":
          if (customVars) {
            updateThemeCustomVariables(customVars);
          }
          break;

        case "UPDATE_BLOCK_SETTINGS":
          if (blockId && settings) {
            updateBlockSettings(blockId, settings);
          }
          break;

        case "INLINE_TEXT_UPDATED":
          if (blockId && textContent !== undefined) {
            updateInlineText(blockId, textContent, fieldKey || "title");
          }
          break;

        case "UPDATE_PAGE_DATA":
          if (pageDataOverride) {
            setPageData(pageDataOverride);
          }
          break;

        case "NAVIGATE_PAGE":
          if (slug) {
            setActiveSlug(slug);
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener("message", handleWindowMessage);
    return () => window.removeEventListener("message", handleWindowMessage);
  }, [setThemeId, updateThemeCustomVariables, updateBlockSettings, updateInlineText]);

  return (
    <ThemeContext.Provider
      value={{
        themes,
        currentThemeId,
        currentTheme,
        setThemeId,
        updateThemeCustomVariables,
        pageData,
        currentPage,
        activeSlug,
        setActiveSlug,
        updateBlockSettings,
        updateInlineText,
        isBuilderMode,
        reloadPageData
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
