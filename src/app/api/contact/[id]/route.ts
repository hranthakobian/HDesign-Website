import { NextResponse } from 'next/server';
import { deleteMessage, updateMessageMeta } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function DELETE(
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

export async function PATCH(
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

    const body = await request.json();
    const { read, starred, spam, trash } = body;

    const updates: Partial<{ read: boolean; starred: boolean; spam: boolean; trash: boolean }> = {};
    if (read !== undefined) updates.read = read;
    if (starred !== undefined) updates.starred = starred;
    if (spam !== undefined) updates.spam = spam;
    if (trash !== undefined) updates.trash = trash;

    const success = await updateMessageMeta(id, updates);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update message metadata.' },
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
