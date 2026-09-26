export interface ThemeConfig {
  id: string;
  name: string;
  version?: string;
  description?: string;
  author?: string;
  preview_image?: string;
  is_active?: boolean;
  is_default?: boolean;
  is_fallback?: boolean;
  cssVariables: Record<string, string>;
  layout?: Record<string, any>;
  settings?: Record<string, any>;
  supported_blocks?: string[];
  folderPath?: string;
}

export interface ActiveThemeResult {
  themeId: string;
  themeClass: string;
  themeConfig: ThemeConfig;
  cssVariables: Record<string, string>;
  layout: Record<string, any>;
  settings: Record<string, any>;
  isFallback: boolean;
}

export const DEFAULT_THEME_ID: string;
export function scanPhysicalThemes(): ThemeConfig[];
export function getDefaultThemeConfig(): ThemeConfig;
export function getActiveThemeId(): Promise<string>;
export function isPhysicalThemeValid(themeId: string): boolean;
export function loadActiveTheme(): Promise<ActiveThemeResult>;
export function setActiveThemeId(newThemeId: string): Promise<{ success: boolean; themeId: string; dbUpdated: boolean }>;
