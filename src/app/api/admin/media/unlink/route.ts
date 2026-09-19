import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { unlinkMediaUsage } from '@/lib/mediaScanner';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Չարտոնված մուտք:' }, { status: 401 });
    }

    const body = await request.json();
    const { fileId, url, targetUsage } = body;

    if (!fileId && !url) {
      return NextResponse.json({ error: 'Նիշքի ID-ն կամ URL-ը բացակայում է:' }, { status: 400 });
    }

    const result = await unlinkMediaUsage(fileId || url, url, targetUsage);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to unlink media:', error);
    return NextResponse.json({ error: error.message || 'Ապակապումը ձախողվեց:' }, { status: 500 });
  }
}
