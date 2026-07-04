import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { sendCampaignEmail } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    // Auth check
    const isAuthorized = await verifyAuth(request);
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { subject, message, cc, bcc } = await request.json();

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required.' },
        { status: 400 }
      );
    }

    // Dispatch the email campaign (via SMTP or Mock fallback)
    const result = await sendCampaignEmail({ subject, message, cc, bcc });

    return NextResponse.json({ 
      success: result.success, 
      recipients_count: result.recipients_count, 
      recipients: result.recipients 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
