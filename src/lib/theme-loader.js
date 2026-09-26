/**
 * Dynamic Multi-Theme Loader & Engine (Next.js App Router & Supabase)
 * lib/theme-loader.js
 */

const path = require('path');
const fs = require('fs');

const THEMES_PHYSICAL_DIR = path.join(process.cwd(), 'src', 'themes');
const SETTINGS_LOCAL_FILE = path.join(process.cwd(), 'public', 'data', 'settings.json');
const DEFAULT_THEME_ID = 'default-minimal';

/**
 * Scan physical filesystem (src/themes/) for valid unpacked themes.
 * STRICT RULE: ZIP archives (e.g. main-theme.zip) are completely excluded from live site themes.
 */
function scanPhysicalThemes() {
  const result = [];
  try {
    if (!fs.existsSync(THEMES_PHYSICAL_DIR)) {
      return [getDefaultThemeConfig()];
    }

    const entries = fs.readdirSync(THEMES_PHYSICAL_DIR, { withFileTypes: true });

    for (const entry of entries) {
      // Must be a physical directory (ignore .zip files and regular files)
      if (entry.isDirectory()) {
        const themeDir = path.join(THEMES_PHYSICAL_DIR, entry.name);
        const configPath = path.join(themeDir, 'theme.config.json');

        if (fs.existsSync(configPath)) {
          try {
            const raw = fs.readFileSync(configPath, 'utf-8');
            const parsed = JSON.parse(raw);
            result.push({
              id: parsed.id || entry.name,
              name: parsed.name || entry.name,
              version: parsed.version || '1.0.0',
              description: parsed.description || '',
              author: parsed.author || 'HDesign',
              is_active: false,
              cssVariables: parsed.cssVariables || {},
              layout: parsed.layout || {},
              settings: parsed.settings || {},
              supported_blocks: parsed.supported_blocks || [],
              folderPath: themeDir
            });
          } catch (e) {
            console.error(`[ThemeLoader] Error parsing config in theme "${entry.name}":`, e);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[ThemeLoader] Failed to read physical themes directory:', err);
  }

  // Ensure default-minimal is always available in the list
  if (!result.some((t) => t.id === DEFAULT_THEME_ID)) {
    result.unshift(getDefaultThemeConfig());
  }

  return result;
}

/**
 * Fallback config for default-minimal theme
 */
function getDefaultThemeConfig() {
  const localConfigPath = path.join(THEMES_PHYSICAL_DIR, DEFAULT_THEME_ID, 'theme.config.json');
  if (fs.existsSync(localConfigPath)) {
    try {
      return JSON.parse(fs.readFileSync(localConfigPath, 'utf-8'));
    } catch {}
  }

  return {
    id: DEFAULT_THEME_ID,
    name: 'Default Minimal (Մաքուր Լռելյայն)',
    version: '1.0.0',
    description: 'Շատ պարզ, մինիմալիստական և մաքուր HTML/CSS թեմա, որը 100%-ով ցուցադրում է կայքի ողջ բովանդակությունը:',
    author: 'HDesign Studio',
    is_active: true,
    is_default: true,
    cssVariables: {
      '--theme-bg': '#ffffff',
      '--theme-surface': '#f9fafb',
      '--theme-text': '#111827',
      '--theme-text-muted': '#6b7280',
      '--theme-accent': '#111827',
      '--theme-accent-hover': '#374151',
      '--theme-border': '#e5e7eb',
      '--theme-font': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    layout: {
      headerStyle: 'minimal',
      headerSticky: true,
      borderRadius: '8px',
      containerWidth: '1200px'
    },
    settings: {
      primary_color: '#111827',
      accent_color: '#111827',
      bg_color: '#ffffff',
      text_color: '#111827'
    },
    supported_blocks: [
      'hero', 'branding', 'about', 'works', 'video', 'playground',
      'icons', 'glyphs', 'features', 'text', 'container', 'contact',
      'cta', 'system_status', 'product_details', 'blog_post'
    ]
  };
}

/**
 * Reads the active theme ID from Supabase site_settings table.
 * Falls back to local settings.json or DEFAULT_THEME_ID.
 */
async function getActiveThemeId() {
  try {
    const { getSupabaseClient } = require('./supabase');
    const client = getSupabaseClient();

    if (client) {
      const { data, error } = await client
        .from('site_settings')
        .select('active_theme_id')
        .eq('id', 'global')
        .maybeSingle();

      if (!error && data?.active_theme_id) {
        return data.active_theme_id;
      }
    }
  } catch (err) {
    // Supabase query error - fallback gracefully
  }

  // Local file fallback
  try {
    if (fs.existsSync(SETTINGS_LOCAL_FILE)) {
      const content = fs.readFileSync(SETTINGS_LOCAL_FILE, 'utf-8');
      const settings = JSON.parse(content);
      if (settings.active_theme_id) {
        return settings.active_theme_id;
      }
    }
  } catch {}

  return DEFAULT_THEME_ID;
}

/**
 * Validates whether a theme exists as an UNPACKED physical folder.
 * Returns false if it is a ZIP or doesn't exist.
 */
function isPhysicalThemeValid(themeId) {
  if (!themeId || typeof themeId !== 'string') return false;
  if (themeId.endsWith('.zip')) return false;

  const targetDir = path.join(THEMES_PHYSICAL_DIR, themeId);
  if (!fs.existsSync(targetDir)) return false;

  const stat = fs.statSync(targetDir);
  if (!stat.isDirectory()) return false;

  const configPath = path.join(targetDir, 'theme.config.json');
  return fs.existsSync(configPath);
}

/**
 * Main theme loader:
 * 1. Fetches active_theme_id from Supabase
 * 2. Checks if physical folder exists in src/themes/
 * 3. If ZIP or non-existent, falls back to 'default-minimal'
 * 4. Returns theme configuration, CSS variables, and layout specs
 */
async function loadActiveTheme() {
  const rawThemeId = await getActiveThemeId();
  let activeThemeId = rawThemeId;
  let isFallback = false;

  // Verify physical folder existence and non-zip status
  if (!isPhysicalThemeValid(activeThemeId)) {
    console.warn(`[ThemeLoader] Requested theme "${activeThemeId}" is invalid or a ZIP archive. Falling back to "${DEFAULT_THEME_ID}".`);
    activeThemeId = DEFAULT_THEME_ID;
    isFallback = true;
  }

  // Load theme config
  const themeDir = path.join(THEMES_PHYSICAL_DIR, activeThemeId);
  const configPath = path.join(themeDir, 'theme.config.json');

  let themeConfig;
  if (fs.existsSync(configPath)) {
    try {
      themeConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {
      themeConfig = getDefaultThemeConfig();
    }
  } else {
    themeConfig = getDefaultThemeConfig();
  }

  themeConfig.is_active = true;
  themeConfig.is_fallback = isFallback;

  return {
    themeId: activeThemeId,
    themeClass: `theme-${activeThemeId}`,
    themeConfig,
    cssVariables: themeConfig.cssVariables || {},
    layout: themeConfig.layout || {},
    settings: themeConfig.settings || {},
    isFallback
  };
}

/**
 * Updates the active theme ID in Supabase and synchronizes locally.
 */
async function setActiveThemeId(newThemeId) {
  if (!newThemeId) throw new Error('Theme ID is required');

  // Verify it exists as an unpacked folder and is not a ZIP
  if (!isPhysicalThemeValid(newThemeId) && newThemeId !== DEFAULT_THEME_ID) {
    throw new Error(`Theme "${newThemeId}" does not exist as an unpacked physical folder or is a ZIP archive.`);
  }

  let dbUpdated = false;

  // 1. Update Supabase
  try {
    const { getSupabaseClient } = require('./supabase');
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client
        .from('site_settings')
        .upsert({
          id: 'global',
          active_theme_id: newThemeId,
          updated_at: new Date().toISOString()
        });

      if (!error) {
        dbUpdated = true;
      } else {
        console.warn('[ThemeLoader] Supabase update warning:', error);
      }
    }
  } catch (err) {
    console.warn('[ThemeLoader] Could not update Supabase:', err);
  }

  // 2. Update local fallback settings.json
  try {
    let settings = {};
    if (fs.existsSync(SETTINGS_LOCAL_FILE)) {
      settings = JSON.parse(fs.readFileSync(SETTINGS_LOCAL_FILE, 'utf-8'));
    }
    settings.active_theme_id = newThemeId;
    settings.updated_at = new Date().toISOString();
    fs.writeFileSync(SETTINGS_LOCAL_FILE, JSON.stringify(settings, null, 2));
  } catch (err) {
    console.warn('[ThemeLoader] Could not write local settings file:', err);
  }

  return {
    success: true,
    themeId: newThemeId,
    dbUpdated
  };
}

module.exports = {
  DEFAULT_THEME_ID,
  scanPhysicalThemes,
  getDefaultThemeConfig,
  getActiveThemeId,
  isPhysicalThemeValid,
  loadActiveTheme,
  setActiveThemeId
};
