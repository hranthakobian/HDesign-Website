import { NextResponse } from 'next/server';
import { getAppDownloads, saveAppDownload, getRealDownloadsCount, incrementAppDownloadsCount } from '@/lib/db';
import { checkIndividualSpam } from '@/lib/spamDetector';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { app_id, download_url, download_id } = body;

    if (!app_id) {
      return NextResponse.json({ error: 'app_id is required' }, { status: 400 });
    }

    // Extract client IP and User-Agent
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = (forwarded ? forwarded.split(',')[0].trim() : '') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    let isSpam = false;
    let spamReason: string | undefined = undefined;

    // 1. Static Bot / Crawler detection
    const staticCheck = checkIndividualSpam({
      session_id: ip,
      user_agent: userAgent,
      landing_page: `/apps/${app_id}`
    });

    if (staticCheck.isSpam) {
      isSpam = true;
      spamReason = staticCheck.reason || 'Bot/Crawler detected';
    }

    // 2. Cooldown & Rate Limiting analysis (if not already spam)
    if (!isSpam && ip !== '127.0.0.1' && ip !== '::1') {
      try {
        const recentDownloads = await getAppDownloads();
        const now = Date.now();
        const fifteenMinutesAgo = now - 15 * 60 * 1000;
        const oneMinuteAgo = now - 60 * 1000;

        // A: Duplicate download of the SAME app by the same IP within 15 minutes
        const duplicateRecent = recentDownloads.find(d =>
          d.app_id === app_id &&
          d.ip_address === ip &&
          d.created_at &&
          new Date(d.created_at).getTime() > fifteenMinutesAgo
        );

        if (duplicateRecent) {
          isSpam = true;
          spamReason = 'Duplicate download within 15-minute cooldown period';
        } else {
          // B: Rapid burst rate limit across apps (>5 downloads in 1 minute)
          const burstCount = recentDownloads.filter(d =>
            d.ip_address === ip &&
            d.created_at &&
            new Date(d.created_at).getTime() > oneMinuteAgo
          ).length;

          if (burstCount >= 5) {
            isSpam = true;
            spamReason = 'Rate limit exceeded: >5 download attempts in 1 minute';
          }
        }
      } catch (e) {
        console.warn('Error during rate-limit verification:', e);
      }
    }

    // Save download event
    await saveAppDownload({
      app_id,
      download_url: download_url || '',
      download_id: download_id || '',
      ip_address: ip,
      user_agent: userAgent,
      is_spam: isSpam,
      spam_reason: spamReason
    });

    let downloadsCount: number;
    if (!isSpam) {
      downloadsCount = await incrementAppDownloadsCount(app_id);
    } else {
      downloadsCount = await getRealDownloadsCount(app_id);
    }

    return NextResponse.json({
      success: true,
      is_spam: isSpam,
      reason: spamReason,
      downloads_count: downloadsCount
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process download event' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || undefined;

    const downloads = await getAppDownloads(appId);
    const realCount = appId ? await getRealDownloadsCount(appId) : undefined;

    return NextResponse.json({
      downloads,
      real_count: realCount
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch downloads' },
      { status: 500 }
    );
  }
}
