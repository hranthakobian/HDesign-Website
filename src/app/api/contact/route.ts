import { NextResponse } from 'next/server';
import { saveMessage, getMessages } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { sendContactEmails } from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    // Auth check
    const isAuthorized = await verifyAuth(request);
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const messages = await getMessages();
    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email and message are required fields.' },
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

    const result = await saveMessage({ name, email, message });
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Could not save message due to database error.' },
        { status: 500 }
      );
    }

    // Send emails: Notification to admin and confirmation to user
    await sendContactEmails({ name, email, message });

    return NextResponse.json({ success: true, message: result.data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown server error.' },
      { status: 500 }
    );
  }
}
