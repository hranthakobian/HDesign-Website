import { NextResponse } from 'next/server';
import { getApps, saveApp, deleteApp, getAppReviews, AppItem } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const host = searchParams.get('host') || '';
    const type = searchParams.get('type') || '';
    const paid = searchParams.get('paid'); // 'all', 'true', 'false'
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;

    let apps = await getApps();
    const reviews = await getAppReviews(undefined, true);

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
      const avg = stat && stat.count > 0 ? parseFloat((stat.sum / stat.count).toFixed(1)) : 5.0;
      const count = stat ? stat.count : 0;
      return {
        ...a,
        avg_rating: avg,
        reviews_count: count
      };
    });

    let filtered = appsWithStats;

    if (search) {
      filtered = filtered.filter(a =>
        a.title_am.toLowerCase().includes(search) ||
        a.title_en.toLowerCase().includes(search) ||
        (a.short_desc_am && a.short_desc_am.toLowerCase().includes(search)) ||
        (a.short_desc_en && a.short_desc_en.toLowerCase().includes(search)) ||
        a.host_app.toLowerCase().includes(search)
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
      is_paid,
      price,
      currency,
      download_url,
      store_url,
      cover_image,
      gallery_images,
      version,
      release_date,
      downloads_count
    } = body;

    if (!id || !title_am || !title_en || !host_app || !app_type) {
      return NextResponse.json(
        { error: 'id, title_am, title_en, host_app, and app_type are required.' },
        { status: 400 }
      );
    }

    const appToSave: AppItem = {
      id: id.trim(),
      title_am: title_am.trim(),
      title_en: title_en.trim(),
      short_desc_am: short_desc_am || '',
      short_desc_en: short_desc_en || '',
      description_md_am: description_md_am || '',
      description_md_en: description_md_en || '',
      host_app: host_app.trim(),
      host_app_icon: host_app_icon || '',
      app_type: app_type === 'standalone' ? 'standalone' : 'plugin',
      is_paid: !!is_paid,
      price: Number(price) || 0,
      currency: currency || 'AMD',
      download_url: download_url || '',
      store_url: store_url || '',
      cover_image: cover_image || (Array.isArray(gallery_images) && gallery_images[0] ? gallery_images[0] : ''),
      gallery_images: Array.isArray(gallery_images) ? gallery_images : [],
      version: version || 'v1.0.0',
      release_date: release_date || new Date().toISOString().split('T')[0],
      downloads_count: Number(downloads_count) || 0
    };

    const saved = await saveApp(appToSave);
    if (!saved) {
      return NextResponse.json(
        { error: 'Failed to save app in database.' },
        { status: 500 }
      );
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
    const id = searchParams.get('id');

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
