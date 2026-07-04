import { NextResponse } from 'next/server';
import { saveSubscriber, getSubscribers, deleteSubscriber } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const result = await saveSubscriber({ email });
    
    if (!result.success) {
      const isAlreadySubscribed = result.error === 'Email already subscribed.';
      return NextResponse.json(
        { error: result.error || 'Could not process subscription due to database error.' },
        { status: isAlreadySubscribed ? 400 : 500 }
      );
    }

    // Send mock welcome email with unsubscribe button
    await sendWelcomeEmail(email);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown server error.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    // Delete subscriber by email
    const subscribers = await getSubscribers();
    const subscriberToDelete = subscribers.find(s => s.email.toLowerCase() === email.toLowerCase());

    if (!subscriberToDelete || !subscriberToDelete.id) {
      return NextResponse.json(
        { error: 'Subscriber not found.' },
        { status: 404 }
      );
    }

    const success = await deleteSubscriber(subscriberToDelete.id);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to unsubscribe.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown server error.' },
      { status: 500 }
    );
  }
}
