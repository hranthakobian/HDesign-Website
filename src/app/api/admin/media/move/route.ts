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
    const { fileIds, targetFolderId } = body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: 'Ֆայլերը նշված չեն:' }, { status: 400 });
    }

    const libraryData = await getMediaLibraryData();

    // Verify target folder exists if not null
    if (targetFolderId && !libraryData.folders.some(f => f.id === targetFolderId)) {
      return NextResponse.json({ error: 'Թիրախային պանակը գոյություն չունի:' }, { status: 400 });
    }

    for (const fileId of fileIds) {
      if (typeof fileId === 'string' && fileId.trim()) {
        const cleanId = fileId.trim();
        libraryData.fileAssignments[cleanId] = targetFolderId || null;
        // Also map clean url if needed
        const urlKey = '/' + cleanId.replace(/^\/+/, '');
        libraryData.fileAssignments[urlKey] = targetFolderId || null;

        // Auto-restore from trash if file was in trash
        if (libraryData.trash) {
          delete libraryData.trash[cleanId];
          delete libraryData.trash[urlKey];
        }
      }
    }

    await saveMediaLibraryData(libraryData);

    return NextResponse.json({ 
      success: true, 
      movedCount: fileIds.length,
      targetFolderId: targetFolderId || null
    });
  } catch (error: any) {
    console.error('Failed to move files:', error);
    return NextResponse.json({ error: error.message || 'Ֆայլերի տեղափոխումը ձախողվեց:' }, { status: 500 });
  }
}
