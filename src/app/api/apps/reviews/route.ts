import { NextResponse } from 'next/server';
import { getAppReviews, saveAppReview, updateAppReviewStatus, deleteAppReview } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || undefined;
    const showAll = searchParams.get('all') === 'true';

    let onlyApproved = true;
    if (showAll) {
      const isAuthorized = await verifyAuth(request);
      if (isAuthorized) {
        onlyApproved = false;
      }
    }

    const reviews = await getAppReviews(appId, onlyApproved);
    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { app_id, user_name, user_email, is_anonymous, rating, comment } = body;

    if (!app_id || !comment) {
      return NextResponse.json(
        { error: 'app_id and comment are required.' },
        { status: 400 }
      );
    }

    const numericRating = Math.max(1, Math.min(5, Number(rating) || 5));
    const displayName = is_anonymous
      ? 'Անանուն'
      : ((user_name && user_name.trim()) || 'Այցելու');

    const newReview = await saveAppReview({
      app_id,
      user_name: displayName,
      user_email: user_email ? String(user_email).trim() : undefined,
      is_anonymous: !!is_anonymous,
      rating: numericRating,
      comment: String(comment).trim(),
      status: 'pending' // requires admin moderation
    });

    if (!newReview) {
      return NextResponse.json(
        { error: 'Failed to submit review.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      review: newReview,
      message: 'Շնորհակալություն։ Ձեր մեկնաբանությունը կհրապարակվի մոդերացիայից հետո։'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'id and valid status (pending, approved, rejected) are required.' },
        { status: 400 }
      );
    }

    const success = await updateAppReviewStatus(id, status);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update review status.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
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
      return NextResponse.json({ error: 'Review ID is required.' }, { status: 400 });
    }

    const success = await deleteAppReview(id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete review.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
