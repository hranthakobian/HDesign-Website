import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getMediaLibraryData, saveMediaLibraryData } from '@/lib/mediaScanner';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Չարտոնված մուտք:' }, { status: 401 });
    }

    const body = await request.json();
    const { fileId, newName } = body;

    if (!fileId || !newName || typeof newName !== 'string' || !newName.trim()) {
      return NextResponse.json({ error: 'Ֆայլի ID-ն և նոր անվանումը պարտադիր են:' }, { status: 400 });
    }

    const libraryData = await getMediaLibraryData();
    if (!libraryData.customNames) {
      libraryData.customNames = {};
    }

    libraryData.customNames[fileId] = newName.trim();
    await saveMediaLibraryData(libraryData);

    return NextResponse.json({ success: true, fileId, newName: newName.trim() });
  } catch (error: any) {
    console.error('Failed to rename file:', error);
    return NextResponse.json({ error: error.message || 'Ֆայլի անվանափոխումը ձախողվեց:' }, { status: 500 });
  }
}
