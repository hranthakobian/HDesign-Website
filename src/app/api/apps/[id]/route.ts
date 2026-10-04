import { NextResponse } from 'next/server';
import { getAppById, getAppReviews, deleteApp, getRealDownloadsCount } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'App ID is required' }, { status: 400 });
    }

    const app = await getAppById(id);
    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    if (app.is_draft || app.status === 'draft') {
      const isAuthorized = await verifyAuth(request);
      if (!isAuthorized) {
        return NextResponse.json({ error: 'App not found' }, { status: 404 });
      }
    }

    const [reviews, realDownloads] = await Promise.all([
      getAppReviews(id, true),
      getRealDownloadsCount(id)
    ]);

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = reviews.length > 0
      ? parseFloat((sum / reviews.length).toFixed(1))
      : (app.avg_rating || 0);
    const reviewsCount = reviews.length > 0 ? reviews.length : (app.reviews_count || 0);
    const effectiveDownloads = Math.max(Number(app.downloads_count) || 0, realDownloads || 0);

    return NextResponse.json({
      ...app,
      avg_rating: avg,
      reviews_count: reviewsCount,
      downloads_count: effectiveDownloads,
      reviews: reviews
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const { id } = await context.params;
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

