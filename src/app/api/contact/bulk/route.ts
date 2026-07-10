import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { updateMessageMeta, deleteMessage } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // Auth check
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { ids, action } = await request.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !action) {
      return NextResponse.json(
        { error: 'Parameters ids (array) and action are required.' },
        { status: 400 }
      );
    }

    if (action === 'delete') {
      await Promise.all(ids.map(id => deleteMessage(id)));
    } else {
      const updates: any = {};
      if (action === 'read') updates.read = true;
      if (action === 'unread') updates.read = false;
      if (action === 'star') updates.starred = true;
      if (action === 'unstar') updates.starred = false;
      if (action === 'trash') updates.trash = true;
      if (action === 'restore') updates.trash = false;

      await Promise.all(ids.map(id => updateMessageMeta(id, updates)));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
