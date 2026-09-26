"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import initialSiteData from "@/config/site-data.json";
import themesList from "@/config/themes.json";
import { ThemeConfig } from "@/lib/themeTypes";

export interface SiteDataSchema {
  activeThemeId: string;
  staticPages: Record<string, any>;
  systemPages: Record<string, any>;
  templates: Record<string, any>;
  instances: {
    blog: Record<string, any>;
    products: Record<string, any>;
    [key: string]: Record<string, any>;
  };
}

interface SiteContextType {
  siteData: SiteDataSchema;
  currentTheme: ThemeConfig | null;
  setTheme: (themeId: string) => void;
  getPageData: (slug: string) => any;
  getSystemPageData: (code: "404" | "500") => any;
  getTemplateData: (type: "work" | "blog" | "product") => any;
  getInstanceData: (type: "works" | "blog" | "products", key: string) => any;
  updateBlockField: (pageType: "static" | "system" | "template", pageKey: string, blockId: string, key: string, value: any) => void;
}

const SiteContext = createContext<SiteContextType | null>(null);

/**
 * 0ms CSS variables injection directly into the DOM
 */
function injectThemeCssVariables(cssVariables: Record<string, string> = {}) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [prop, val] of Object.entries(cssVariables)) {
    root.style.setProperty(prop, val);
  }

  // Also maintain or update a dedicated style tag for high specificity
  let styleEl = document.getElementById("hd-active-theme-styles") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "hd-active-theme-styles";
    document.head.appendChild(styleEl);
  }

  const cssString = Object.entries(cssVariables)
    .map(([k, v]) => `  ${k}: ${v} !important;`)
    .join("\n");

  styleEl.textContent = `:root {\n${cssString}\n}`;
}

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [siteData, setSiteData] = useState<SiteDataSchema>(initialSiteData as SiteDataSchema);
  const [activeThemeId, setActiveThemeId] = useState<string>(initialSiteData.activeThemeId || "default");

  const currentTheme = useMemo(() => {
    return (themesList as ThemeConfig[]).find((t) => t.id === activeThemeId) || (themesList[0] as ThemeConfig);
  }, [activeThemeId]);

  // Inject CSS variables whenever theme changes
  useEffect(() => {
    if (currentTheme?.cssVariables) {
      injectThemeCssVariables(currentTheme.cssVariables);
    }
  }, [currentTheme]);

  const setTheme = useCallback((themeId: string) => {
    const found = (themesList as ThemeConfig[]).find((t) => t.id === themeId);
    if (found) {
      setActiveThemeId(themeId);
      if (found.cssVariables) {
        injectThemeCssVariables(found.cssVariables);
      }
    }
  }, []);

  const getPageData = useCallback(
    (slug: string) => {
      const clean = slug === "" || slug === "index" ? "home" : slug.replace(/^\//, "");
      return siteData.staticPages[clean] || null;
    },
    [siteData]
  );

  const getSystemPageData = useCallback(
    (code: "404" | "500") => {
      return siteData.systemPages[code] || null;
    },
    [siteData]
  );

  const getTemplateData = useCallback(
    (type: "work" | "blog" | "product") => {
      return siteData.templates[type] || null;
    },
    [siteData]
  );

  const getInstanceData = useCallback(
    (type: "works" | "blog" | "products", key: string) => {
      return siteData.instances?.[type]?.[key] || null;
    },
    [siteData]
  );

  const updateBlockField = useCallback(
    (pageType: "static" | "system" | "template", pageKey: string, blockId: string, key: string, value: any) => {
      setSiteData((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as SiteDataSchema;

        let targetPage: any = null;
        if (pageType === "static") targetPage = next.staticPages[pageKey];
        else if (pageType === "system") targetPage = next.systemPages[pageKey];
        else if (pageType === "template") targetPage = next.templates[pageKey];

        if (targetPage && Array.isArray(targetPage.blocks)) {
          const block = targetPage.blocks.find((b: any) => b.id === blockId);
          if (block) {
            block.settings = block.settings || {};
            block.settings[key] = value;
          }
        }

        return next;
      });
    },
    []
  );

  // 0ms Real-time postMessage listener inside iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "UPDATE_THEME" && data.themeId) {
        setTheme(data.themeId);
      }

      if (data.type === "UPDATE_BLOCK_FIELD" && data.blockId && data.key) {
        // Direct in-place DOM mutation for zero lag
        const el = document.querySelector(`[data-block-id="${data.blockId}"]`);
        if (el) {
          const target = el.querySelector(`[data-editable-key="${data.key}"]`);
          if (target) {
            target.textContent = data.value;
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setTheme]);

  return (
    <SiteContext.Provider
      value={{
        siteData,
        currentTheme,
        setTheme,
        getPageData,
        getSystemPageData,
        getTemplateData,
        getInstanceData,
        updateBlockField
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error("useSite must be used within a SiteProvider");
  }
  return context;
}
