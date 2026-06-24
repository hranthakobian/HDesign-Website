import { NextResponse } from 'next/server';
import { saveVisit } from '@/lib/db';
import { UAParser } from 'ua-parser-js';

export async function POST(request: Request) {
  try {
    const { sessionId, referrer, landingPage } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Parse request headers
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    let country = request.headers.get('x-vercel-ip-country') || 'Unknown';
    const rawCity = request.headers.get('x-vercel-ip-city');
    let city = rawCity ? decodeURIComponent(rawCity) : 'Unknown';

    // Fallback to IP geolocation API if headers are missing (e.g. local development)
    if ((country === 'Unknown' || city === 'Unknown') && ip !== 'Unknown' && ip !== '::1' && ip !== '127.0.0.1') {
      try {
        const cleanIp = ip.split(',')[0].trim();
        // Skip private network IPs
        if (!cleanIp.startsWith('192.168.') && !cleanIp.startsWith('10.') && !cleanIp.startsWith('172.16.')) {
          const res = await fetch(`http://ip-api.com/json/${cleanIp}`);
          if (res.ok) {
            const geo = await res.json();
            if (geo.status === 'success') {
              country = geo.country || 'Unknown';
              city = geo.city || 'Unknown';
            }
          }
        }
      } catch (err: any) {
        console.error('IP Geolocation lookup failed in analytics:', err.message || err);
      }
    }

    // Parse User Agent
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser().name || 'Unknown';
    const os = parser.getOS().name || 'Unknown';
    const device = parser.getDevice().type || 'desktop';

    const cleanReferrer = referrer && referrer !== '' ? referrer : 'Direct';

    const saved = await saveVisit({
      session_id: sessionId,
      ip_address: ip,
      user_agent: userAgent,
      browser,
      os,
      device,
      country,
      city,
      referrer: cleanReferrer,
      landing_page: landingPage || '/'
    });

    if (!saved) {
      return NextResponse.json({ error: 'Failed to record visit' }, { status: 500 });
    }

    return NextResponse.json({ success: true, visit: saved });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown server error' },
      { status: 500 }
    );
  }
}
