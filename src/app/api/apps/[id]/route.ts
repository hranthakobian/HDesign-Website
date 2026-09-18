import { NextResponse } from 'next/server';
import { getAppById, getAppReviews } from '@/lib/db';
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

    const reviews = await getAppReviews(id, true);
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = reviews.length > 0 ? parseFloat((sum / reviews.length).toFixed(1)) : 5.0;

    return NextResponse.json({
      ...app,
      avg_rating: avg,
      reviews_count: reviews.length,
      reviews: reviews
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

