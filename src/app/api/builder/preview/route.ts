import { NextRequest, NextResponse } from 'next/server';
import { getActiveTheme, getPage } from '@/lib/themeEngine';
import { BlockItem } from '@/lib/themeTypes';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { block, blocks, themeId } = body;

    const activeTheme = await getActiveTheme();

    if (block) {
      return NextResponse.json({
        success: true,
        block,
        theme: activeTheme
      });
    }

    if (Array.isArray(blocks)) {
      return NextResponse.json({
        success: true,
        blocks,
        theme: activeTheme
      });
    }

    return NextResponse.json({ success: false, error: 'Neither block nor blocks array provided' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to render preview' },
      { status: 500 }
    );
  }
}
