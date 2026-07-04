import { NextResponse } from 'next/server';
import { getFonts, saveFont } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { notifySubscribers } from '@/lib/notifications';

export async function GET() {
  try {
    const fonts = await getFonts();
    return NextResponse.json(fonts);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch fonts.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Basic auth check
    const isAuthorized = await verifyAuth(request);
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      name_am,
      name_en,
      category,
      creator,
      year,
      description_am,
      description_en,
      downloadable,
      paid,
      price,
      font_file_url,
      download_url,
      purchase_url
    } = body;

    if (!id || !name_am || !name_en || !category || !font_file_url) {
      return NextResponse.json(
        { error: 'id, name_am, name_en, category, and font_file_url are required.' },
        { status: 400 }
      );
    }

    const saved = await saveFont({
      id,
      name_am,
      name_en,
      category,
      creator,
      year,
      description_am,
      description_en,
      downloadable: !!downloadable,
      paid: !!paid,
      price,
      font_file_url,
      download_url,
      purchase_url
    });

    if (!saved) {
      return NextResponse.json(
        { error: 'Failed to save font in database.' },
        { status: 500 }
      );
    }

    // Trigger subscriber notifications automatically
    await notifySubscribers('font', name_am);

    return NextResponse.json({ success: true, font: saved });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown server error.' },
      { status: 500 }
    );
  }
}
