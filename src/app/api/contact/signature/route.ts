import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getSiteSetting, saveSiteSetting } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const signature = await getSiteSetting('mail_signature', '');
    return NextResponse.json({ signature });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { signature } = await request.json();
    const result = await saveSiteSetting('mail_signature', signature || '');
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to save signature.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
