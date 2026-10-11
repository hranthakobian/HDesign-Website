import { NextResponse } from 'next/server';
import { getApps, getAppById, saveApp, deleteApp, renameAppId, getAppReviews, getAppDownloads, AppItem } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { notifySubscribers } from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const host = searchParams.get('host') || '';
    const type = searchParams.get('type') || '';
    const paid = searchParams.get('paid'); // 'all', 'true', 'false'
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;

    const isAuthorized = await verifyAuth(request);
    const statusParam = searchParams.get('status');

    let apps = await getApps();

    // Only users logged in as admin can see drafts.
    // For non-admin visitors, strictly filter out drafts from public view.
    if (!isAuthorized) {
      apps = apps.filter(a => !a.is_draft && a.status !== 'draft');
    } else if (statusParam && (statusParam === 'draft' || statusParam === 'published')) {
      apps = apps.filter(a => (a.status === statusParam) || (statusParam === 'draft' ? !!a.is_draft : !a.is_draft));
    }

    const [reviews, allDownloads] = await Promise.all([
      getAppReviews(undefined, true),
      getAppDownloads()
    ]);

    // Compute real non-spam downloads count map
    const realDownloadsMap: Record<string, number> = {};
    for (const d of allDownloads) {
      if (!d.is_spam) {
        realDownloadsMap[d.app_id] = (realDownloadsMap[d.app_id] || 0) + 1;
      }
    }

    // Compute reviews stats map
    const statsMap: Record<string, { count: number; sum: number }> = {};
    for (const r of reviews) {
      if (!statsMap[r.app_id]) {
        statsMap[r.app_id] = { count: 0, sum: 0 };
      }
      statsMap[r.app_id].count += 1;
      statsMap[r.app_id].sum += r.rating;
    }

    const appsWithStats = apps.map(a => {
      const stat = statsMap[a.id];
      const avg = stat && stat.count > 0 ? parseFloat((stat.sum / stat.count).toFixed(1)) : (a.avg_rating || 0);
      const count = stat ? stat.count : (a.reviews_count || 0);
      const verifiedDownloads = Math.max(Number(a.downloads_count) || 0, realDownloadsMap[a.id] || 0);

      return {
        ...a,
        avg_rating: avg,
        reviews_count: count,
        downloads_count: verifiedDownloads
      };
    });

    let filtered = appsWithStats;

    if (search) {
      filtered = filtered.filter(a =>
        a.title_am.toLowerCase().includes(search) ||
        a.title_en.toLowerCase().includes(search) ||
        (a.short_desc_am && a.short_desc_am.toLowerCase().includes(search)) ||
        (a.short_desc_en && a.short_desc_en.toLowerCase().includes(search)) ||
        a.host_app.toLowerCase().includes(search) ||
        (Array.isArray(a.languages) && a.languages.some(l => l.toLowerCase().includes(search)))
      );
    }

    if (host && host !== 'all') {
      filtered = filtered.filter(a => {
        if (a.app_type === 'standalone') return false;
        const hosts = (a.host_app || '').split(',').map(s => s.trim().toLowerCase());
        return hosts.includes(host.toLowerCase());
      });
    }

    if (type && type !== 'all') {
      filtered = filtered.filter(a => a.app_type.toLowerCase() === type.toLowerCase());
    }

    if (paid !== null && paid !== '' && paid !== 'all') {
      const isPaid = paid === 'true' || paid === '1';
      filtered = filtered.filter(a => a.is_paid === isPaid);
    }

    if (minPrice !== null && !isNaN(minPrice)) {
      filtered = filtered.filter(a => (a.price || 0) >= minPrice);
    }

    if (maxPrice !== null && !isNaN(maxPrice)) {
      filtered = filtered.filter(a => (a.price || 0) <= maxPrice);
    }

    return NextResponse.json(filtered);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch apps.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      title_am,
      title_en,
      short_desc_am,
      short_desc_en,
      description_md_am,
      description_md_en,
      host_app,
      host_app_icon,
      app_type,
      supported_os,
      is_paid,
      price,
      currency,
      download_url,
      downloads,
      store_url,
      repository_url,
      repository_type,
      repositories,
      cover_image,
      gallery_images,
      languages,
      version,
      release_date,
      downloads_count,
      is_draft,
      status,
      created_at,
      updated_at
    } = body;

    const draftFlag = status === 'draft' || !!is_draft;
    const finalAppType = app_type === 'standalone' ? 'standalone' : 'plugin';
    const finalHostApp = (host_app && host_app.trim()) || (finalAppType === 'standalone' ? 'Standalone' : 'Adobe Illustrator');

    // Only enforce mandatory fields if publishing
    if (!draftFlag) {
      if (!title_am?.trim() || !title_en?.trim()) {
        return NextResponse.json(
          { error: 'title_am and title_en are required for published apps.' },
          { status: 400 }
        );
      }
      if (finalAppType === 'plugin' && !finalHostApp?.trim()) {
        return NextResponse.json(
          { error: 'host_app is required for published plugins.' },
          { status: 400 }
        );
      }
    }

    const finalId = (id && id.trim()) || ('app-draft-' + Math.random().toString(36).substring(2, 9));
    const finalTitleAm = (title_am && title_am.trim()) || (title_en && title_en.trim()) || (draftFlag ? 'Անանուն սևագիր' : '');
    const finalTitleEn = (title_en && title_en.trim()) || (title_am && title_am.trim()) || (draftFlag ? 'Untitled Draft' : '');

    const languagesList = Array.isArray(languages)
      ? languages
      : (typeof languages === 'string'
          ? languages.split(',').map((s: string) => s.trim()).filter(Boolean)
          : ['Հայերեն']);

    const downloadsList = (Array.isArray(downloads) ? downloads : [])
      .filter(d => d && d.url && !d.url.includes('example.com'));
    const supportedOsList = Array.isArray(supported_os) ? supported_os : [];
    const repositoriesList = (Array.isArray(repositories) ? repositories : [])
      .filter(r => r && r.url && r.url.trim());

    const primaryRepo = repositoriesList[0];
    const finalRepoUrl = (repository_url && repository_url.trim()) || primaryRepo?.url || '';
    const finalRepoType = (repository_type && repository_type.trim()) || primaryRepo?.type || 'github';

    const now = new Date().toISOString();
    const finalDownloadUrl = (download_url && !download_url.includes('example.com'))
      ? download_url
      : (downloadsList[0]?.url || '');

    const appToSave: AppItem = {
      id: finalId,
      title_am: finalTitleAm,
      title_en: finalTitleEn,
      short_desc_am: short_desc_am || '',
      short_desc_en: short_desc_en || '',
      description_md_am: description_md_am || '',
      description_md_en: description_md_en || '',
      host_app: finalHostApp,
      host_app_icon: host_app_icon || '',
      app_type: finalAppType,
      supported_os: supportedOsList,
      is_paid: !!is_paid,
      price: Number(price) || 0,
      currency: currency || 'AMD',
      download_url: finalDownloadUrl,
      downloads: downloadsList,
      store_url: store_url || '',
      repository_url: finalRepoUrl,
      repository_type: finalRepoType,
      repositories: repositoriesList.length > 0 ? repositoriesList : (finalRepoUrl ? [{ type: finalRepoType, url: finalRepoUrl }] : []),
      cover_image: cover_image || (Array.isArray(gallery_images) && gallery_images[0] ? gallery_images[0] : ''),
      gallery_images: Array.isArray(gallery_images) ? gallery_images : [],
      languages: languagesList.length > 0 ? languagesList : ['Հայերեն'],
      version: version || 'v1.0.0',
      release_date: release_date || now.split('T')[0],
      downloads_count: Number(downloads_count) || 0,
      is_draft: draftFlag,
      status: draftFlag ? 'draft' : 'published',
      created_at: created_at || now,
      updated_at: updated_at || now
    };

    const originalId = body.original_id && typeof body.original_id === 'string' ? body.original_id.trim() : null;
    const existingApp = await getAppById(finalId) || (originalId ? await getAppById(originalId) : null);
    const wasDraft = !existingApp || existingApp.is_draft || existingApp.status === 'draft';
    const notifySubs = body.notify_subscribers !== false;

    const saved = await saveApp(appToSave);
    if (!saved) {
      return NextResponse.json(
        { error: 'Failed to save app in database.' },
        { status: 500 }
      );
    }

    // If ID was changed, migrate related data and delete old ID
    if (originalId && originalId !== finalId) {
      await renameAppId(originalId, finalId);
    }

    // Trigger subscriber notifications automatically (like cases)
    if (!draftFlag && notifySubs) {
      const appName = finalTitleAm || finalTitleEn;
      if (wasDraft) {
        await notifySubscribers('app_publish', appName, { appId: finalId, version: appToSave.version });
      } else {
        await notifySubscribers('app_update', appName, { appId: finalId, version: appToSave.version });
      }
    }

    return NextResponse.json({ success: true, app: saved });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown server error.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch (e) { /* ignore */ }
    }

    if (!id) {
      return NextResponse.json({ error: 'App ID is required.' }, { status: 400 });
    }

    const success = await deleteApp(id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete app.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown server error.' },
      { status: 500 }
    );
  }
}
