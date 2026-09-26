import { NextRequest, NextResponse } from 'next/server';
import { getAvailableThemes, getActiveTheme, setActiveTheme, saveThemeSettings } from '@/lib/themeEngine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [themes, activeTheme] = await Promise.all([
      getAvailableThemes(),
      getActiveTheme()
    ]);

    return NextResponse.json({
      success: true,
      themes,
      activeTheme
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch themes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, themeId, settings } = body;

    if (action === 'activate') {
      if (!themeId) {
        return NextResponse.json({ success: false, error: 'themeId is required' }, { status: 400 });
      }
      const success = await setActiveTheme(themeId);
      const activeTheme = await getActiveTheme();
      return NextResponse.json({ success, activeTheme });
    }

    if (action === 'update_settings') {
      if (!themeId || !settings) {
        return NextResponse.json({ success: false, error: 'themeId and settings are required' }, { status: 400 });
      }
      const success = await saveThemeSettings(themeId, settings);
      const activeTheme = await getActiveTheme();
      return NextResponse.json({ success, activeTheme });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process theme action' },
      { status: 500 }
    );
  }
}
