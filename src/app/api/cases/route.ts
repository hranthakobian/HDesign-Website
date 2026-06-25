import { NextResponse } from 'next/server';
import { getCases, saveCase } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
  try {
    const cases = await getCases();
    return NextResponse.json(cases);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cases.' },
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
    const { id, title, subtitle, bg, image_url, details, category, client, year } = body;

    if (!id || !title || !subtitle || !bg) {
      return NextResponse.json(
        { error: 'id, title, subtitle, and bg (color/gradient) are required.' },
        { status: 400 }
      );
    }

    const saved = await saveCase({
      id,
      title,
      subtitle,
      bg,
      image_url,
      details,
      category,
      client,
      year
    });

    if (!saved) {
      return NextResponse.json(
        { error: 'Failed to save case in database.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, case: saved });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown server error.' },
      { status: 500 }
    );
  }
}
