import { NextResponse } from 'next/server';
import { getMessages, addMessageReply } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { sendReplyEmail } from '@/lib/notifications';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth check
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { subject, message } = await request.json();
    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required.' },
        { status: 400 }
      );
    }

    // Find original message to get recipient email
    const messages = await getMessages();
    const originalMessage = messages.find(m => m.id === id);

    if (!originalMessage) {
      return NextResponse.json(
        { error: 'Original message not found.' },
        { status: 404 }
      );
    }

    // Send reply email
    try {
      await sendReplyEmail({
        to: originalMessage.email,
        subject,
        message
      });
    } catch (emailError: any) {
      console.error('[REPLY EMAIL ERROR] Failed to send email:', emailError);
    }

    // Save reply to database metadata
    const result = await addMessageReply({
      messageId: id,
      subject,
      message
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save reply in database.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, reply: result.data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
