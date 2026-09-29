import { NextResponse } from 'next/server';
import { getSiteSetting, saveSiteSetting } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { parseUserAgent, extractClientIp } from '@/lib/sessionHelper';

export const dynamic = 'force-dynamic';

export interface AdminSession {
  id: string;
  token?: string;
  ip: string;
  userAgent: string;
  browser: string;
  os: string;
  device: string;
  deviceType: string;
  icon: string;
  createdAt: string;
  lastActive: string;
  isCurrent?: boolean;
}

export async function GET(request: Request) {
  try {
    const isAuthed = await verifyAuth(request);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = (await getSiteSetting('admin_sessions', [])) as AdminSession[];
    
    // Determine current session id from header or cookie
    let currentSessionId = request.headers.get('x-admin-session-id') || '';
    if (!currentSessionId) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/hdesign_admin_session_id=([^;]+)/);
      if (match) {
        currentSessionId = decodeURIComponent(match[1]);
      }
    }

    const userAgent = request.headers.get('user-agent') || '';
    const ip = extractClientIp(request);
    const parsed = parseUserAgent(userAgent);
    const nowIso = new Date().toISOString();

    let createdNewSessionId: string | null = null;
    let found = false;

    // Filter out sessions older than 30 days
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    
    let validSessions = (Array.isArray(sessions) ? sessions : []).filter(s => {
      if (!s || !s.id) return false;
      const last = new Date(s.lastActive || s.createdAt || nowIso).getTime();
      return (now - last) < thirtyDaysMs;
    });

    // Update existing or add current device
    validSessions = validSessions.map(s => {
      if (currentSessionId && s.id === currentSessionId) {
        found = true;
        return {
          ...s,
          lastActive: nowIso,
          ip: ip || s.ip,
          browser: parsed.browser || s.browser,
          os: parsed.os || s.os,
          device: parsed.device || s.device,
          deviceType: parsed.deviceType || s.deviceType,
          icon: parsed.icon || s.icon
        };
      }
      return s;
    });

    if (!found) {
      const newId = currentSessionId || ('sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9));
      if (!currentSessionId) {
        currentSessionId = newId;
        createdNewSessionId = newId;
      }
      const newSession: AdminSession = {
        id: newId,
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
      validSessions.unshift(newSession);
    }

    // Persist updated list
    await saveSiteSetting('admin_sessions', validSessions);

    const enriched = validSessions.map(s => ({
      ...s,
      isCurrent: Boolean(currentSessionId && s.id === currentSessionId)
    }));

    const response = NextResponse.json({
      success: true,
      sessions: enriched,
      currentSessionId
    });

    if (createdNewSessionId) {
      response.cookies.set('hdesign_admin_session_id', createdNewSessionId, {
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
        sameSite: 'lax',
        httpOnly: false
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAuthed = await verifyAuth(request);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const queryId = url.searchParams.get('id');
    const queryRevokeAllOthers = url.searchParams.get('revokeAllOthers') === 'true';

    const body = await request.json().catch(() => ({}));
    const sessionId = queryId || body.sessionId;
    const action = queryRevokeAllOthers ? 'revoke_all_others' : body.action;

    let currentSessionId = request.headers.get('x-admin-session-id') || '';
    if (!currentSessionId) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/hdesign_admin_session_id=([^;]+)/);
      if (match) {
        currentSessionId = decodeURIComponent(match[1]);
      }
    }

    const sessions = (await getSiteSetting('admin_sessions', [])) as AdminSession[];
    const validSessions = Array.isArray(sessions) ? sessions : [];

    if (action === 'revoke_all_others') {
      const updated = validSessions.filter(s => s.id === currentSessionId);
      await saveSiteSetting('admin_sessions', updated);
      return NextResponse.json({
        success: true,
        message: 'Մյուս բոլոր սարքերից մուտքը հաջողությամբ չեղարկվեց։',
        sessions: updated.map(s => ({ ...s, isCurrent: true }))
      });
    }

    if (sessionId) {
      const isRevokingCurrent = Boolean(currentSessionId && sessionId === currentSessionId);
      const updated = validSessions.filter(s => s.id !== sessionId);
      await saveSiteSetting('admin_sessions', updated);
      return NextResponse.json({
        success: true,
        revokedCurrent: isRevokingCurrent,
        message: 'Սարքը հաջողությամբ հեռացվեց։',
        sessions: updated.map(s => ({ ...s, isCurrent: s.id === currentSessionId }))
      });
    }

    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
