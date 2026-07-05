import { NextResponse } from 'next/server';
import { updateVisitHeartbeat } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const success = await updateVisitHeartbeat(sessionId);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      try {
        const body = await request.json();
        sessionId = body?.sessionId;
      } catch {
        // Ignore body parsing failures (e.g. for empty payloads or navigator.sendBeacon)
      }
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const success = await updateVisitHeartbeat(sessionId);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
