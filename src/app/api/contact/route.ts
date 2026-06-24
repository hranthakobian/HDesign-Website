import { NextResponse } from 'next/server';
import { saveMessage, getMessages } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const correctPasscode = process.env.ADMIN_PASSCODE || 'admin123';
    
    if (authHeader !== correctPasscode) {
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

    const saved = await saveMessage({ name, email, message });
    if (!saved) {
      return NextResponse.json(
        { error: 'Could not save message due to database error.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: saved });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown server error.' },
      { status: 500 }
    );
  }
}
