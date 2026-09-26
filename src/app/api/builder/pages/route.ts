import { NextRequest, NextResponse } from 'next/server';
import { getPage, savePage, getAllPages, deletePage } from '@/lib/themeEngine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'list') {
      const pages = await getAllPages();
      return NextResponse.json({
        success: true,
        pages
      });
    }

    const slug = searchParams.get('slug') || 'index';
    const page = await getPage(slug);
    return NextResponse.json({
      success: true,
      page
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch page data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { page } = body;

    if (!page || !page.slug) {
      return NextResponse.json({ success: false, error: 'Valid page object with slug is required' }, { status: 400 });
    }

    const success = await savePage(page);
    const updatedPage = await getPage(page.slug);

    return NextResponse.json({
      success,
      page: updatedPage
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save page data' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Page slug is required for deletion' }, { status: 400 });
    }

    const success = await deletePage(slug);
    return NextResponse.json({
      success,
      message: `Page ${slug} deleted successfully.`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete page' },
      { status: 500 }
    );
  }
}
