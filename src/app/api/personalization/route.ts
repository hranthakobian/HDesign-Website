import { NextResponse } from 'next/server';
import { getSiteSetting, saveSiteSetting } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

const DEFAULT_PERSONALIZATION = {
  site_title_hy: "HDesign",
  site_title_en: "HDesign",
  site_desc_hy: "Դիզայնի և Բրենդավորման Ստուդիա",
  site_desc_en: "Design & Branding Studio",
  theme_hue: "172",
  theme_saturation: "77",
  theme_lightness: "14",
  cursor_colors: [
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
  ],
  cursors: {
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
  }
};

export async function GET() {
  try {
    const settings = await getSiteSetting('personalization_settings', DEFAULT_PERSONALIZATION);
    // Deep merge defaults to prevent errors on missing keys
    const merged = {
      ...DEFAULT_PERSONALIZATION,
      ...settings,
      cursor_colors: settings.cursor_colors || DEFAULT_PERSONALIZATION.cursor_colors,
      cursors: {
        ...DEFAULT_PERSONALIZATION.cursors,
        ...(settings.cursors || {})
      }
    };
    return NextResponse.json(merged);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Auth check
    const isAuthorized = await verifyAuth(request);
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const result = await saveSiteSetting('personalization_settings', body);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to save personalization settings.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
