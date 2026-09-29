import { NextResponse } from 'next/server';
import { getCorrectPasscode } from '@/lib/auth';
import { getSiteSetting, saveSiteSetting } from '@/lib/db';
import { parseUserAgent, extractClientIp } from '@/lib/sessionHelper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    let token = request.headers.get('authorization') || request.headers.get('x-admin-token');
    if (token) {
      token = token.trim().replace(/^Bearer\s+/i, '');
    }
    
    let sessionId = request.headers.get('x-admin-session-id') || '';

    if (!token || !sessionId) {
      const cookieHeader = request.headers.get('cookie') || '';
      if (!token) {
        const match = cookieHeader.match(/hdesign_admin_token=([^;]+)/);
        if (match) {
          token = decodeURIComponent(match[1]).trim().replace(/^Bearer\s+/i, '');
        }
      }
      if (!sessionId) {
        const matchSess = cookieHeader.match(/hdesign_admin_session_id=([^;]+)/);
        if (matchSess) {
          sessionId = decodeURIComponent(matchSess[1]).trim();
        }
      }
    }

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const correct = await getCorrectPasscode();
    if (token === correct) {
      const nowIso = new Date().toISOString();
      const userAgent = request.headers.get('user-agent') || '';
      const ip = extractClientIp(request);
      const parsed = parseUserAgent(userAgent);

      let createdNewSessionId: string | null = null;

      try {
        const sessions = await getSiteSetting('admin_sessions', []) as any[];
        let found = false;
        const updated = sessions.map(s => {
          if (sessionId && s.id === sessionId) {
            found = true;
            return { ...s, lastActive: nowIso, ip, browser: parsed.browser, os: parsed.os, device: parsed.device };
          }
          return s;
        });

        if (!found) {
          const newId = sessionId || ('sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9));
          createdNewSessionId = newId;
          const newSession = {
            id: newId,
            token,
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
          updated.unshift(newSession);
        }

        await saveSiteSetting('admin_sessions', updated.slice(0, 50));
      } catch (e) {
        console.error('Failed to touch session:', e);
      }

      const res = NextResponse.json({ authenticated: true, sessionId: sessionId || createdNewSessionId });
      if (createdNewSessionId) {
        res.cookies.set('hdesign_admin_session_id', createdNewSessionId, {
          path: '/',
          maxAge: 30 * 24 * 60 * 60,
          sameSite: 'lax',
          httpOnly: false
        });
      }
      return res;
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
