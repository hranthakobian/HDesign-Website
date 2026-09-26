import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';
import { ThemeConfig, ThemeSettings, BlockItem, PageSchema, RenderContext } from './themeTypes';
import defaultThemes from '@/config/themes.json';
import defaultPageData from '@/config/page-data.json';
import defaultSiteData from '@/config/site-data.json';

const THEMES_DIR = path.join(process.cwd(), 'themes');
const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const LOCAL_THEMES_FILE = path.join(DATA_DIR, 'themes.json');
const LOCAL_PAGES_FILE = path.join(DATA_DIR, 'pages.json');
const CONFIG_THEMES_FILE = path.join(process.cwd(), 'src', 'config', 'themes.json');
const CONFIG_PAGE_DATA_FILE = path.join(process.cwd(), 'src', 'config', 'page-data.json');
const CONFIG_SITE_DATA_FILE = path.join(process.cwd(), 'src', 'config', 'site-data.json');

/**
 * Scan filesystem for themes in /themes/ directory
 */
export async function scanThemesFromFs(): Promise<ThemeConfig[]> {
  try {
    if (!fsSync.existsSync(THEMES_DIR)) return [];
    const entries = await fs.readdir(THEMES_DIR, { withFileTypes: true });
    const themes: ThemeConfig[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const themeJsonPath = path.join(THEMES_DIR, entry.name, 'theme.json');
        if (fsSync.existsSync(themeJsonPath)) {
          try {
            const raw = await fs.readFile(themeJsonPath, 'utf-8');
            const data = JSON.parse(raw);
            themes.push({
              id: data.id || entry.name,
              name: data.name || entry.name,
              version: data.version || '1.0.0',
              description: data.description || '',
              author: data.author || 'HDesign',
              preview_image: data.preview_image || '',
              is_active: !!data.is_active,
              cssVariables: data.cssVariables || {},
              layout: data.layout || {},
              settings: data.settings || {
                primary_color: '#083f39',
                accent_color: '#14b8a6',
                bg_color: '#ffffff',
                text_color: '#0f172a'
              },
              supported_blocks: data.supported_blocks || [
                'hero', 'branding', 'about', 'works', 'video', 'playground',
                'icons', 'glyphs', 'features', 'text', 'container', 'contact', 'cta'
              ]
            });
          } catch (e) {
            console.error(`Error reading theme.json in ${entry.name}:`, e);
          }
        }
      }
    }

    return themes;
  } catch (err) {
    console.warn('Failed to read /themes/ directory:', err);
    return [];
  }
}

/**
 * Get all available themes (combines config/themes.json + filesystem + Supabase)
 */
export async function getAvailableThemes(): Promise<ThemeConfig[]> {
  // 1. Try reading from src/config/themes.json
  let configThemesList: ThemeConfig[] = [];
  try {
    if (fsSync.existsSync(CONFIG_THEMES_FILE)) {
      const content = await fs.readFile(CONFIG_THEMES_FILE, 'utf-8');
      configThemesList = JSON.parse(content);
    } else {
      configThemesList = defaultThemes as unknown as ThemeConfig[];
    }
  } catch {
    configThemesList = defaultThemes as unknown as ThemeConfig[];
  }

  // 2. Scan /themes/ folder on filesystem
  const fsThemes = await scanThemesFromFs();

  const map = new Map<string, ThemeConfig>();

  // 3. Try Supabase
  const client = supabaseAdmin || supabase;
  if (client) {
    try {
      const { data, error } = await client
        .from('themes')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        data.forEach((t: any) => {
          map.set(t.id, {
            id: t.id,
            name: t.name,
            version: t.version || '1.0.0',
            description: t.description || '',
            author: t.author || 'HDesign',
            preview_image: t.preview_image || '',
            is_active: !!t.is_active,
            cssVariables: t.css_variables || t.cssVariables || {},
            layout: t.layout || {},
            settings: t.settings || {},
            supported_blocks: t.supported_blocks || [
              'hero', 'branding', 'about', 'works', 'video', 'playground',
              'icons', 'glyphs', 'features', 'text', 'container', 'contact', 'cta'
            ]
          });
        });
      }
    } catch (err) {
      console.warn('Supabase getAvailableThemes failed:', err);
    }
  }

  // Merge themes by ID: config presets, filesystem discoveries, and Supabase
  configThemesList.forEach((t) => {
    if (!map.has(t.id)) {
      map.set(t.id, t);
    } else {
      map.set(t.id, { ...t, ...map.get(t.id) });
    }
  });

  fsThemes.forEach((t) => {
    if (!map.has(t.id)) {
      map.set(t.id, t);
    } else {
      map.set(t.id, { ...map.get(t.id), ...t });
    }
  });

  return Array.from(map.values());
}

/**
 * Get the currently active theme
 */
export async function getActiveTheme(): Promise<ThemeConfig> {
  const themes = await getAvailableThemes();
  const active = themes.find((t) => t.is_active);
  return active || themes[0];
}

/**
 * Set the active theme
 */
export async function setActiveTheme(themeId: string): Promise<boolean> {
  let supabaseSuccess = false;
  const client = supabaseAdmin || supabase;

  if (client) {
    try {
      await client.from('themes').update({ is_active: false }).neq('id', themeId);
      const { error } = await client.from('themes').update({ is_active: true }).eq('id', themeId);
      if (!error) supabaseSuccess = true;
    } catch (err) {
      console.warn('Supabase setActiveTheme failed:', err);
    }
  }

  // Update in src/config/themes.json
  try {
    const themes = await getAvailableThemes();
    const updated = themes.map((t) => ({
      ...t,
      is_active: t.id === themeId
    }));

    if (fsSync.existsSync(CONFIG_THEMES_FILE)) {
      await fs.writeFile(CONFIG_THEMES_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    }
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(LOCAL_THEMES_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to update themes file:', err);
    return supabaseSuccess;
  }
}

/**
 * Save custom settings for a theme
 */
export async function saveThemeSettings(themeId: string, settings: Partial<ThemeSettings>): Promise<boolean> {
  let supabaseSuccess = false;
  const client = supabaseAdmin || supabase;

  if (client) {
    try {
      const { error } = await client
        .from('themes')
        .update({ settings, updated_at: new Date().toISOString() })
        .eq('id', themeId);
      if (!error) supabaseSuccess = true;
    } catch (err) {
      console.warn('Supabase saveThemeSettings failed:', err);
    }
  }

  try {
    const themes = await getAvailableThemes();
    const updated = themes.map((t) => {
      if (t.id === themeId) {
        return {
          ...t,
          settings: { ...t.settings, ...settings },
          updated_at: new Date().toISOString()
        };
      }
      return t;
    });

    if (fsSync.existsSync(CONFIG_THEMES_FILE)) {
      await fs.writeFile(CONFIG_THEMES_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    }
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(LOCAL_THEMES_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to update themes settings:', err);
    return supabaseSuccess;
  }
}

/**
 * Get all registered pages
 */
import { brandingCases } from './brandingData';

/**
 * Generate built-in page schemas for all static and dynamic routes
 */
export function getBuiltinPageForSlug(cleanSlug: string): PageSchema | null {
  // 1. Master Dynamic Templates: Work, Blog, Product
  if (cleanSlug === 'templates/work' || cleanSlug === 'works/template' || cleanSlug === 'template:work') {
    return {
      id: 'template-work',
      slug: 'templates/work',
      title: '🎨 Work Master Template',
      is_published: true,
      meta: { meta_title: 'Work Master Template | HDesign', category: 'template' },
      blocks: (defaultSiteData as any).templates?.work?.blocks || []
    };
  }

  if (cleanSlug === 'templates/blog' || cleanSlug === 'blog/template' || cleanSlug === 'template:blog') {
    return {
      id: 'template-blog',
      slug: 'templates/blog',
      title: '📑 Blog Master Template',
      is_published: true,
      meta: { meta_title: 'Blog Master Template | HDesign', category: 'template' },
      blocks: (defaultSiteData as any).templates?.blog?.blocks || []
    };
  }

  if (cleanSlug === 'templates/product' || cleanSlug === 'products/template' || cleanSlug === 'template:product') {
    return {
      id: 'template-product',
      slug: 'templates/product',
      title: '🏷️ Product Master Template',
      is_published: true,
      meta: { meta_title: 'Product Master Template | HDesign', category: 'template' },
      blocks: (defaultSiteData as any).templates?.product?.blocks || []
    };
  }

  // 2. Dynamic Layout Generator for works/[id] (using Master Template)
  if (cleanSlug.startsWith('works/') && cleanSlug !== 'works') {
    const caseId = cleanSlug.replace(/^works\//, '');
    const foundCase = (defaultSiteData as any).instances?.works?.[caseId] || brandingCases.find((c) => c.id === caseId);
    const masterBlocks = (defaultSiteData as any).templates?.work?.blocks || [];
    if (foundCase) {
      const caseData: Record<string, string> = {
        title: foundCase.title || caseId,
        tagline: foundCase.tagline || '',
        description: foundCase.description || '',
        concept: foundCase.concept || '',
        typography: foundCase.typography || '',
        colors: Array.isArray(foundCase.colors) ? foundCase.colors.join(', ') : (foundCase.colors || ''),
        color: foundCase.color || '#083f39'
      };
      const interpolatedBlocks = JSON.parse(JSON.stringify(masterBlocks), (_, val) => {
        if (typeof val === 'string') {
          return val.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (match, key) => (caseData[key] !== undefined ? caseData[key] : match));
        }
        return val;
      });
      return {
        id: `page-work-${caseId}`,
        slug: cleanSlug,
        title: `${foundCase.title} (Work Instance)`,
        is_published: true,
        meta: {
          meta_title: `${foundCase.title} | HDesign Works`,
          meta_description: foundCase.tagline || '',
          category: 'works'
        },
        blocks: interpolatedBlocks
      };
    }
  }

  // 2. Static Contact Page
  if (cleanSlug === 'contact') {
    return {
      id: 'page-contact',
      slug: 'contact',
      title: 'Կապ (Contact)',
      is_published: true,
      meta: { meta_title: 'Կապ | HDesign Studio', meta_description: 'Կապ հաստատեք HDesign Studio-ի հետ', category: 'main' },
      blocks: [
        {
          id: 'block-hero',
          type: 'hero',
          hidden: false,
          order: 0,
          settings: {
            title: 'Կապ Հաստատեք Մեզ Հետ',
            subtitle: 'Մենք միշտ բաց ենք նոր առաջարկների, բրենդինգի և UI/UX նախագծերի համար:',
            padding: '120px 0 60px'
          }
        },
        {
          id: 'block-contact',
          type: 'contact',
          hidden: false,
          order: 1,
          settings: {
            title: 'Ուղարկեք Ձեր Հարցումը',
            email: 'hrant@hakobian.am',
            tel: '+374 98 000 000',
            btn_text: 'Ուղարկել Նամակ',
            btn_url: 'mailto:hrant@hakobian.am'
          }
        }
      ]
    };
  }

  // 3. Static Works Listing Page
  if (cleanSlug === 'works') {
    return {
      id: 'page-works',
      slug: 'works',
      title: 'Բոլոր Քեյսերը (Works)',
      is_published: true,
      meta: { meta_title: 'Քեյսեր | HDesign Studio', meta_description: 'Ստուդիայի ընտրված պորտֆոլիո նախագծերը', category: 'main' },
      blocks: [
        {
          id: 'block-hero',
          type: 'hero',
          hidden: false,
          order: 0,
          settings: {
            title: 'Մեր Ընտրված Քեյսերը',
            subtitle: 'Բրենդինգ, թվային պրոդուկտներ, տիպոգրաֆիկա և վիզուալ ինքնություն:',
            padding: '120px 0 60px'
          }
        },
        {
          id: 'block-works',
          type: 'works',
          hidden: false,
          order: 1,
          settings: {
            title: 'Պատկերասրահ',
            subtitle: 'Pasta, 11..., Posters, Teal Lines և այլն'
          }
        }
      ]
    };
  }

  // 4. Static Apps Listing Page
  if (cleanSlug === 'apps') {
    return {
      id: 'page-apps',
      slug: 'apps',
      title: 'Հավելվածներ (Apps)',
      is_published: true,
      meta: { meta_title: 'Հավելվածներ | HDesign', meta_description: 'Թվային գործիքներ և հավելվածներ', category: 'main' },
      blocks: [
        {
          id: 'block-hero',
          type: 'hero',
          hidden: false,
          order: 0,
          settings: {
            title: 'Հավելվածներ և Փլագիններ',
            subtitle: 'Օգտակար թվային գործիքներ դիզայներների և ծրագրավորողների համար'
          }
        },
        {
          id: 'block-features',
          type: 'features',
          hidden: false,
          order: 1,
          settings: {
            title: 'Մեր Գործիքները',
            subtitle: 'Հեղինակային լուծումներ HDesign-ից',
            items: [
              { icon: 'icon-QR-Code', title: 'Custom QR Designer', desc: 'Հեղինակային QR կոդերի գեներատոր' },
              { icon: 'icon-Text-Cursor', title: 'Armenian OCR Scanner', desc: 'Հայերեն տեքստի ճանաչում նկարներից' },
              { icon: 'icon-Star', title: 'HDesign Typeface Arena', desc: 'Տառատեսակների ինտերակտիվ թեստավորում' }
            ]
          }
        }
      ]
    };
  }

  // 5. Dynamic App: apps/custom-qr
  if (cleanSlug === 'apps/custom-qr' || cleanSlug === 'apps/qr-designer') {
    return {
      id: 'page-app-custom-qr',
      slug: cleanSlug,
      title: 'Custom QR Designer',
      is_published: true,
      meta: { meta_title: 'Custom QR Designer | HDesign Apps', category: 'apps' },
      blocks: [
        {
          id: 'block-hero',
          type: 'hero',
          hidden: false,
          order: 0,
          settings: {
            title: 'Custom QR Designer',
            subtitle: 'Ստեղծեք պրոֆեսիոնալ, բրենդավորված QR կոդեր Ձեր լոգոյով և ֆիրմային գույներով',
            btn_text: 'Սկսել Կառուցումը',
            btn_url: '/apps/custom-qr'
          }
        },
        {
          id: 'block-features',
          type: 'features',
          hidden: false,
          order: 1,
          settings: {
            title: 'Հնարավորություններ',
            items: [
              { icon: 'icon-Pattern', title: 'Եզակի Մոտիվներ', desc: 'Տարբեր երկրաչափական կետեր և անկյուններ' },
              { icon: 'icon-Image', title: 'Լոգոյի Ինտեգրում', desc: 'Տեղադրեք Ձեր լոգոն QR կոդի կենտրոնում' },
              { icon: 'icon-Download', title: 'Բարձր Որակ', desc: 'Արտահանում SVG և PNG ֆորմատներով' }
            ]
          }
        }
      ]
    };
  }

  // 6. HDesign Font Arena Page
  if (cleanSlug === 'hdesign') {
    return {
      id: 'page-hdesign',
      slug: 'hdesign',
      title: 'HDesign Տառատեսակ',
      is_published: true,
      meta: { meta_title: 'HDesign Variable Font | HDesign Studio', category: 'apps' },
      blocks: [
        {
          id: 'block-hero',
          type: 'hero',
          hidden: false,
          order: 0,
          settings: {
            title: 'HDesign Variable Font',
            subtitle: 'Հայերեն ժամանակակից տառատեսակ՝ փորձարկեք իրական ժամանակում'
          }
        },
        {
          id: 'block-playground',
          type: 'playground',
          hidden: false,
          order: 1,
          settings: {
            title: 'Տառատեսակի Փորձադաշտ',
            subtitle: 'Մուտքագրեք Ձեր տեքստը և փորձարկեք տարբեր քաշեր ու ոճեր'
          }
        }
      ]
    };
  }

  // 7. Armenian OCR Scanner Page
  if (cleanSlug === 'ocr') {
    return {
      id: 'page-ocr',
      slug: 'ocr',
      title: 'Հայերեն OCR Scanner',
      is_published: true,
      meta: { meta_title: 'Armenian OCR Scanner | HDesign', category: 'apps' },
      blocks: [
        {
          id: 'block-hero',
          type: 'hero',
          hidden: false,
          order: 0,
          settings: {
            title: 'Armenian OCR Scanner',
            subtitle: 'Արագ և ճշգրիտ ճանաչեք հայերեն տեքստը նկարներից ու PDF փաստաթղթերից'
          }
        }
      ]
    };
  }

  // 8. System Pages: 404 & 500
  if (cleanSlug === '404') {
    return {
      id: 'page-system-404',
      slug: '404',
      title: '404 - Էջը Չի Գտնվել',
      is_published: true,
      meta: { meta_title: '404 | HDesign', category: 'system' },
      blocks: (defaultSiteData as any).systemPages?.['404']?.blocks || [
        {
          id: 'block-system-status',
          type: 'system_status',
          hidden: false,
          order: 0,
          settings: {
            status_code: '404',
            title: 'Էջը Գոյություն Չունի',
            subtitle: 'Ներողություն, բայց Ձեր փնտրած էջը չի գտնվել կամ տեղափոխվել է այլ հասցեով:',
            btn_text: 'Վերադառնալ Գլխավոր Էջ',
            btn_url: '/'
          }
        }
      ]
    };
  }

  if (cleanSlug === '500') {
    return {
      id: 'page-system-500',
      slug: '500',
      title: '500 - Սերվերի Սխալ',
      is_published: true,
      meta: { meta_title: '500 | HDesign', category: 'system' },
      blocks: (defaultSiteData as any).systemPages?.['500']?.blocks || [
        {
          id: 'block-system-status',
          type: 'system_status',
          hidden: false,
          order: 0,
          settings: {
            status_code: '500',
            title: 'Սերվերի Սխալ (500)',
            subtitle: 'Ինչ-որ բան սխալ գնաց համակարգում: Խնդրում ենք փորձել կրկին կամ վերադառնալ գլխավոր էջ:',
            btn_text: 'Փորձել Կրկին',
            btn_url: '/'
          }
        }
      ]
    };
  }

  // 9. Universal Dynamic Templates: blog & product
  if (cleanSlug === 'blog/template' || cleanSlug === 'templates/blog') {
    return {
      id: 'template-blog',
      slug: 'blog/template',
      title: 'Բլոգի Template (Universal)',
      is_published: true,
      meta: { meta_title: 'Blog Template | HDesign', category: 'template' },
      blocks: (defaultSiteData as any).templates?.blog?.blocks || []
    };
  }

  if (cleanSlug === 'products/template' || cleanSlug === 'templates/product') {
    return {
      id: 'template-product',
      slug: 'products/template',
      title: 'Պրոդուկտի Template (Universal)',
      is_published: true,
      meta: { meta_title: 'Product Template | HDesign', category: 'template' },
      blocks: (defaultSiteData as any).templates?.product?.blocks || []
    };
  }

  // 10. Dynamic Blog Posts
  if (cleanSlug.startsWith('blog/') && cleanSlug !== 'blog' && cleanSlug !== 'blog/template') {
    const postSlug = cleanSlug.replace(/^blog\//, '');
    const instance = (defaultSiteData as any).instances?.blog?.[postSlug];
    const masterBlocks = (defaultSiteData as any).templates?.blog?.blocks || [];
    if (instance) {
      const interpolatedBlocks = JSON.parse(JSON.stringify(masterBlocks), (_, val) => {
        if (typeof val === 'string') {
          return val.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (match, key) => (instance[key] !== undefined ? instance[key] : match));
        }
        return val;
      });
      return {
        id: `page-blog-${postSlug}`,
        slug: cleanSlug,
        title: instance.title || `Բլոգ: ${postSlug}`,
        is_published: true,
        meta: { meta_title: `${instance.title || postSlug} | HDesign Blog`, category: 'instances' },
        blocks: interpolatedBlocks
      };
    }
  }

  // 11. Dynamic Products
  if (cleanSlug.startsWith('products/') && cleanSlug !== 'products' && cleanSlug !== 'products/template') {
    const prodId = cleanSlug.replace(/^products\//, '');
    const instance = (defaultSiteData as any).instances?.products?.[prodId];
    const masterBlocks = (defaultSiteData as any).templates?.product?.blocks || [];
    if (instance) {
      const interpolatedBlocks = JSON.parse(JSON.stringify(masterBlocks), (_, val) => {
        if (typeof val === 'string') {
          return val.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (match, key) => (instance[key] !== undefined ? instance[key] : match));
        }
        return val;
      });
      return {
        id: `page-product-${prodId}`,
        slug: cleanSlug,
        title: instance.title || `Ապրանք: ${prodId}`,
        is_published: true,
        meta: { meta_title: `${instance.title || prodId} | HDesign Store`, category: 'instances' },
        blocks: interpolatedBlocks
      };
    }
  }

  return null;
}

/**
 * Get all registered pages (Combines Custom Saved + Built-in Static & Dynamic Routes)
 */
export async function getAllPages(): Promise<PageSchema[]> {
  const pageMap = new Map<string, PageSchema>();

  // 1. Preload ONLY static, system, and Master Dynamic Templates (Dropdown Cleaning)
  const builtInSlugs = [
    'index',
    'about',
    'contact',
    'works',
    'apps',
    'hdesign',
    'ocr',
    'apps/custom-qr',
    '404',
    '500',
    'templates/work',
    'templates/blog',
    'templates/product'
  ];

  builtInSlugs.forEach((slug) => {
    const builtin = getBuiltinPageForSlug(slug);
    if (builtin) {
      pageMap.set(slug, builtin);
    }
  });

  // 2. Load from defaultPageData.pages fallback
  if (Array.isArray(defaultPageData.pages)) {
    (defaultPageData.pages as unknown as PageSchema[]).forEach((p) => {
      const cleanSlug = p.slug === 'index' || p.slug === '' ? 'index' : p.slug.replace(/^\/|\/$/g, '');
      pageMap.set(cleanSlug, { ...pageMap.get(cleanSlug), ...p, slug: cleanSlug });
    });
  }

  // 3. Check public/data/pages.json
  try {
    if (fsSync.existsSync(LOCAL_PAGES_FILE)) {
      const content = await fs.readFile(LOCAL_PAGES_FILE, 'utf-8');
      const pages: PageSchema[] = JSON.parse(content);
      if (Array.isArray(pages)) {
        pages.forEach((p) => {
          const cleanSlug = p.slug === 'index' || p.slug === '' ? 'index' : p.slug.replace(/^\/|\/$/g, '');
          pageMap.set(cleanSlug, { ...pageMap.get(cleanSlug), ...p, slug: cleanSlug });
        });
      }
    }
  } catch (err) {
    console.warn('Error reading local pages.json:', err);
  }

  // 4. Check src/config/page-data.json (Highest priority on filesystem)
  try {
    if (fsSync.existsSync(CONFIG_PAGE_DATA_FILE)) {
      const content = await fs.readFile(CONFIG_PAGE_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed?.pages)) {
        parsed.pages.forEach((p: PageSchema) => {
          const cleanSlug = p.slug === 'index' || p.slug === '' ? 'index' : p.slug.replace(/^\/|\/$/g, '');
          pageMap.set(cleanSlug, { ...pageMap.get(cleanSlug), ...p, slug: cleanSlug });
        });
      }
    }
  } catch (err) {
    console.warn('Failed to read config/page-data.json:', err);
  }

  // 5. Try Supabase
  const client = supabaseAdmin || supabase;
  if (client) {
    try {
      const { data, error } = await client
        .from('pages')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        data.forEach((d: any) => {
          const cleanSlug = d.slug === 'index' || d.slug === '' ? 'index' : d.slug.replace(/^\/|\/$/g, '');
          pageMap.set(cleanSlug, {
            id: d.id,
            slug: cleanSlug,
            title: d.title,
            theme_id: d.theme_id || 'default',
            blocks: Array.isArray(d.blocks) ? d.blocks : [],
            is_published: d.is_published ?? true,
            meta: d.meta || {},
            updated_at: d.updated_at
          });
        });
      }
    } catch (err) {
      console.warn('Supabase getAllPages failed:', err);
    }
  }

  // Dropdown Cleaning: Exclude all individual dynamic instances, preserve ONLY Master Templates and Static/System Pages
  return Array.from(pageMap.values()).filter((p) => {
    if (p.slug.startsWith('works/') && p.slug !== 'works' && p.slug !== 'templates/work') return false;
    if (p.slug.startsWith('blog/') && p.slug !== 'blog' && p.slug !== 'templates/blog') return false;
    if (p.slug.startsWith('products/') && p.slug !== 'products' && p.slug !== 'templates/product') return false;
    return true;
  });
}

/**
 * Get a specific page by slug (Guaranteed to return an editable schema)
 */
export async function getPage(slug: string): Promise<PageSchema | null> {
  const cleanSlug = slug === 'index' || slug === '' ? 'index' : slug.replace(/^\/|\/$/g, '');
  const pages = await getAllPages();
  const page = pages.find((p) => p.slug === cleanSlug);
  if (page) return page;

  // On-the-fly generated schema if not found anywhere else
  const builtin = getBuiltinPageForSlug(cleanSlug);
  if (builtin) return builtin;

  // Generic fallback schema for any custom dynamic slug
  const pageTitle = cleanSlug.split('/').pop() || cleanSlug;
  return {
    id: `page-${cleanSlug.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
    slug: cleanSlug,
    title: pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1),
    is_published: true,
    meta: {
      meta_title: `${pageTitle} | HDesign`,
      meta_description: `Dynamic page for ${cleanSlug}`
    },
    blocks: [
      {
        id: 'block-hero',
        type: 'hero',
        hidden: false,
        order: 0,
        settings: {
          title: pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1),
          subtitle: `Խմբագրեք այս դինամիկ էջը (${cleanSlug}) Visual Builder-ից`,
          padding: '100px 0 50px'
        }
      },
      {
        id: 'block-text',
        type: 'text',
        hidden: false,
        order: 1,
        settings: {
          title: 'Նախնական Բովանդակություն',
          content: 'Այստեղ կարող եք ավելացնել տեքստ, նկարներ կամ նոր բլոկներ ձախ վահանակից:'
        }
      }
    ]
  };
}

/**
 * Save page data schema (blocks, titles, meta)
 */
export async function savePage(
  slugOrPage: string | Partial<PageSchema>,
  pageData?: Partial<PageSchema>
): Promise<boolean> {
  const actualSlug = typeof slugOrPage === 'string' ? slugOrPage : slugOrPage.slug || 'index';
  const actualData = typeof slugOrPage === 'string' ? (pageData || {}) : slugOrPage;
  const cleanSlug = actualSlug === 'index' || actualSlug === '' ? 'index' : actualSlug.replace(/^\/|\/$/g, '');
  const client = supabaseAdmin || supabase;
  let supabaseSuccess = false;

  const payload = {
    slug: cleanSlug,
    title: actualData.title || (cleanSlug === 'index' ? 'Գլխավոր Էջ' : cleanSlug),
    blocks: actualData.blocks || [],
    is_published: actualData.is_published ?? true,
    meta: actualData.meta || {},
    updated_at: new Date().toISOString()
  };

  if (client) {
    try {
      const { data: existing } = await client.from('pages').select('id').eq('slug', cleanSlug).maybeSingle();
      if (existing) {
        const { error } = await client.from('pages').update(payload).eq('slug', cleanSlug);
        if (!error) supabaseSuccess = true;
      } else {
        const { error } = await client.from('pages').insert([payload]);
        if (!error) supabaseSuccess = true;
      }
    } catch (err) {
      console.warn('Supabase savePage failed:', err);
    }
  }

  // Update src/config/page-data.json
  try {
    let fullData: any = defaultPageData;
    if (fsSync.existsSync(CONFIG_PAGE_DATA_FILE)) {
      const raw = await fs.readFile(CONFIG_PAGE_DATA_FILE, 'utf-8');
      fullData = JSON.parse(raw);
    }

    const pages: PageSchema[] = Array.isArray(fullData.pages) ? fullData.pages : [];
    const index = pages.findIndex((p) => p.slug === cleanSlug);

    if (index >= 0) {
      pages[index] = { ...pages[index], ...payload };
    } else {
      pages.push({ id: `page-${cleanSlug}`, ...payload });
    }

    fullData.pages = pages;
    await fs.writeFile(CONFIG_PAGE_DATA_FILE, JSON.stringify(fullData, null, 2), 'utf-8');

    // Also sync src/config/site-data.json
    try {
      if (fsSync.existsSync(CONFIG_SITE_DATA_FILE)) {
        const rawSite = await fs.readFile(CONFIG_SITE_DATA_FILE, 'utf-8');
        const siteData = JSON.parse(rawSite);

        if (cleanSlug === '404' || cleanSlug === '500') {
          siteData.systemPages = siteData.systemPages || {};
          siteData.systemPages[cleanSlug] = {
            ...(siteData.systemPages[cleanSlug] || {}),
            ...payload
          };
        } else if (cleanSlug === 'templates/work' || cleanSlug === 'works/template' || cleanSlug === 'template:work') {
          siteData.templates = siteData.templates || {};
          siteData.templates.work = {
            ...(siteData.templates.work || {}),
            ...payload,
            slug: 'templates/work'
          };
        } else if (cleanSlug === 'templates/blog' || cleanSlug === 'blog/template' || cleanSlug === 'template:blog') {
          siteData.templates = siteData.templates || {};
          siteData.templates.blog = {
            ...(siteData.templates.blog || {}),
            ...payload,
            slug: 'templates/blog'
          };
        } else if (cleanSlug === 'templates/product' || cleanSlug === 'products/template' || cleanSlug === 'template:product') {
          siteData.templates = siteData.templates || {};
          siteData.templates.product = {
            ...(siteData.templates.product || {}),
            ...payload,
            slug: 'templates/product'
          };
        } else {
          siteData.staticPages = siteData.staticPages || {};
          siteData.staticPages[cleanSlug] = {
            ...(siteData.staticPages[cleanSlug] || {}),
            ...payload
          };
        }

        await fs.writeFile(CONFIG_SITE_DATA_FILE, JSON.stringify(siteData, null, 2), 'utf-8');
      }
    } catch (siteErr) {
      console.warn('Failed to sync site-data.json in savePage:', siteErr);
    }

    // Also sync public/data/pages.json
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(LOCAL_PAGES_FILE, JSON.stringify(pages, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to update config page-data.json:', err);
    return supabaseSuccess;
  }
}

/**
 * Delete a page by slug (protects 'index')
 */
export async function deletePage(slug: string): Promise<boolean> {
  if (slug === 'index' || slug === '') {
    throw new Error('Գլխավոր էջը (index) չի կարող ջնջվել:');
  }

  const client = supabaseAdmin || supabase;
  if (client) {
    try {
      await client.from('pages').delete().eq('slug', slug);
    } catch (err) {
      console.warn('Supabase deletePage failed:', err);
    }
  }

  try {
    if (fsSync.existsSync(CONFIG_PAGE_DATA_FILE)) {
      const raw = await fs.readFile(CONFIG_PAGE_DATA_FILE, 'utf-8');
      const fullData = JSON.parse(raw);
      fullData.pages = (fullData.pages || []).filter((p: any) => p.slug !== slug);
      await fs.writeFile(CONFIG_PAGE_DATA_FILE, JSON.stringify(fullData, null, 2), 'utf-8');
    }
    return true;
  } catch (err) {
    console.error('Failed to delete page from config:', err);
    return false;
  }
}
