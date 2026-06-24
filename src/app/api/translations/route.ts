import { NextResponse } from 'next/server';
import { getSiteSetting, saveSiteSetting } from '@/lib/db';

export async function GET() {
  try {
    const translations = await getSiteSetting('translations', { hy: {}, en: {} });
    return NextResponse.json(translations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    const correctPasscode = process.env.ADMIN_PASSCODE || 'admin123';
    
    if (authHeader !== correctPasscode) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const success = await saveSiteSetting('translations', body);

    if (!success) {
      return NextResponse.json({ error: 'Failed to save translations.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
