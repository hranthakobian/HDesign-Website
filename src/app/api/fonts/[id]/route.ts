import { NextResponse } from 'next/server';
import { saveFont, deleteFont } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

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
    const updated = await saveFont({
      ...body,
      id // force id to match url
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update font.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, font: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error occurred.' },
      { status: 500 }
    );
  }
}

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

    const success = await deleteFont(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete font.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error occurred.' },
      { status: 500 }
    );
  }
}
