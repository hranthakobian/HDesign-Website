import { NextResponse } from 'next/server';
import { getCorrectPasscode } from '@/lib/auth';
import { getSiteSetting, saveSiteSetting } from '@/lib/db';
import { parseUserAgent, extractClientIp } from '@/lib/sessionHelper';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { passcode } = await request.json();

    const correctPasscode = await getCorrectPasscode();

    if (passcode === correctPasscode) {
      const userAgent = request.headers.get('user-agent') || '';
      const ip = extractClientIp(request);
      const parsed = parseUserAgent(userAgent);
      const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      const nowIso = new Date().toISOString();

      const newSession = {
        id: sessionId,
        token: passcode,
        ip,
        userAgent,
        browser: parsed.browser,
        os: parsed.os,
        device: parsed.device,
        deviceType: parsed.deviceType,
        icon: parsed.icon,
        createdAt: nowIso,
        lastActive: nowIso
      };

      try {
        const existingSessions = await getSiteSetting('admin_sessions', []) as any[];
        // Keep up to 50 recent sessions
        const updatedSessions = [newSession, ...existingSessions.slice(0, 49)];
        await saveSiteSetting('admin_sessions', updatedSessions);
      } catch (e) {
        console.error('Failed to persist session:', e);
      }

      const response = NextResponse.json({ 
        success: true, 
        token: passcode,
        sessionId,
        session: newSession
      });

      // Set cookie for session ID
      response.cookies.set('hdesign_admin_session_id', sessionId, {
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        sameSite: 'lax',
        httpOnly: false
      });

      response.cookies.set('hdesign_admin_token', passcode, {
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        sameSite: 'lax',
        httpOnly: false
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Սխալ գաղտնաբառ։ Խնդրում ենք փորձել կրկին։' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
