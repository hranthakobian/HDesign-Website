import { NextResponse } from 'next/server';
import { deleteMessage } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Auth check
    const authHeader = request.headers.get('authorization');
    const correctPasscode = process.env.ADMIN_PASSCODE || 'admin123';
    
    if (authHeader !== correctPasscode) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const success = await deleteMessage(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete message.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
