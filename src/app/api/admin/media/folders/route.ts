import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getMediaLibraryData, saveMediaLibraryData } from '@/lib/mediaScanner';
import { MediaFolder } from '@/lib/mediaTypes';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Չարտոնված մուտք:' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color = '#3B82F6', parentId = null } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Պանակի անունը պարտադիր է:' }, { status: 400 });
    }

    const libraryData = await getMediaLibraryData();

    // Check parent exists if provided
    if (parentId && !libraryData.folders.some(f => f.id === parentId)) {
      return NextResponse.json({ error: 'Ծնող պանակը գոյություն չունի:' }, { status: 400 });
    }

    const newFolder: MediaFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      color: color.trim() || '#3B82F6',
      parentId: parentId || null,
      createdAt: new Date().toISOString()
    };

    libraryData.folders.push(newFolder);
    await saveMediaLibraryData(libraryData);

    return NextResponse.json({ success: true, folder: newFolder });
  } catch (error: any) {
    console.error('Failed to create folder:', error);
    return NextResponse.json({ error: error.message || 'Պանակի ստեղծումը ձախողվեց:' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Չարտոնված մուտք:' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, color, parentId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Պանակի ID-ն պարտադիր է:' }, { status: 400 });
    }

    const libraryData = await getMediaLibraryData();
    const folderIndex = libraryData.folders.findIndex(f => f.id === id);

    if (folderIndex === -1) {
      return NextResponse.json({ error: 'Պանակը չի գտնվել:' }, { status: 404 });
    }

    // Prevent making folder its own parent or circular dependency
    if (parentId === id) {
      return NextResponse.json({ error: 'Պանակը չի կարող լինել իր սեփական ծնողը:' }, { status: 400 });
    }

    if (name && typeof name === 'string' && name.trim()) {
      libraryData.folders[folderIndex].name = name.trim();
    }
    if (color && typeof color === 'string' && color.trim()) {
      libraryData.folders[folderIndex].color = color.trim();
    }
    if (parentId !== undefined) {
      libraryData.folders[folderIndex].parentId = parentId || null;
    }
    libraryData.folders[folderIndex].updatedAt = new Date().toISOString();

    await saveMediaLibraryData(libraryData);

    return NextResponse.json({ success: true, folder: libraryData.folders[folderIndex] });
  } catch (error: any) {
    console.error('Failed to update folder:', error);
    return NextResponse.json({ error: error.message || 'Պանակի փոփոխումը ձախողվեց:' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Չարտոնված մուտք:' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('id') || '';

    if (!folderId) {
      return NextResponse.json({ error: 'Պանակի ID-ն պարտադիր է:' }, { status: 400 });
    }

    const libraryData = await getMediaLibraryData();
    const folderToDelete = libraryData.folders.find(f => f.id === folderId);

    if (!folderToDelete) {
      return NextResponse.json({ error: 'Պանակը չի գտնվել:' }, { status: 404 });
    }

    const parentId = folderToDelete.parentId || null;

    // Reparent subfolders to deleted folder's parent
    for (const folder of libraryData.folders) {
      if (folder.parentId === folderId) {
        folder.parentId = parentId;
      }
    }

    // Reparent files in this folder to parentId
    for (const [filePath, fId] of Object.entries(libraryData.fileAssignments)) {
      if (fId === folderId) {
        libraryData.fileAssignments[filePath] = parentId;
      }
    }

    // Remove folder from array
    libraryData.folders = libraryData.folders.filter(f => f.id !== folderId);

    await saveMediaLibraryData(libraryData);

    return NextResponse.json({ success: true, message: 'Պանակը ջնջված է:' });
  } catch (error: any) {
    console.error('Failed to delete folder:', error);
    return NextResponse.json({ error: error.message || 'Պանակի ջնջումը ձախողվեց:' }, { status: 500 });
  }
}
