/**
 * Strict TypeScript interfaces for Theme metadata, Block schemas, and Page JSON data.
 */

export interface ThemeSettings {
  primary_color: string;
  accent_color: string;
  bg_color: string;
  text_color: string;
  logo_text?: string;
  logo_url?: string;
  header_sticky?: boolean;
  header_style?: 'glass' | 'solid' | 'transparent' | 'minimal';
  footer_text?: string;
  custom_css?: string;
  [key: string]: any;
}

export interface ThemeConfig {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  preview_image?: string;
  is_active: boolean;
  settings: ThemeSettings;
  cssVariables?: Record<string, string>;
  layout?: Record<string, any>;
  supported_blocks: string[];
  created_at?: string;
  updated_at?: string;
}

export type BlockType = 
  | 'hero' 
  | 'branding'
  | 'about'
  | 'works'
  | 'video'
  | 'playground'
  | 'icons'
  | 'glyphs'
  | 'features' 
  | 'text' 
  | 'gallery' 
  | 'contact'
  | 'cta' 
  | 'container'
  | 'footer' 
  | string;

export interface BlockItem {
  id: string;
  type: BlockType;
  hidden?: boolean;
  order?: number;
  settings: Record<string, any>;
  children?: BlockItem[];
}

export interface PageSchema {
  id?: string;
  slug: string;
  title: string;
  theme_id?: string;
  blocks: BlockItem[];
  is_published?: boolean;
  meta?: {
    meta_title?: string;
    meta_description?: string;
    og_image?: string;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

export interface RenderContext {
  page: PageSchema;
  theme: ThemeConfig;
  settings: ThemeSettings;
  site_url?: string;
  blocksHtml?: string[];
  [key: string]: any;
}

export interface BlockDefinition {
  type: string;
  name: string;
  description: string;
  icon: string;
  defaultSettings: Record<string, any>;
}
