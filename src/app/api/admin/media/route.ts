import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { verifyAuth } from '@/lib/auth';
import { 
  scanAllMediaFiles, 
  getMediaLibraryData, 
  saveMediaLibraryData, 
  formatBytes, 
  detectFileType 
} from '@/lib/mediaScanner';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Չարտոնված մուտք:' }, { status: 401 });
    }

    const data = await scanAllMediaFiles();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to get media library:', error);
    return NextResponse.json({ error: error.message || 'Սխալ մեդիա գրադարանը բեռնելիս' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Չարտոնված մուտք:' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const targetFolderId = (formData.get('folderId') || '').toString().trim() || null;

    if (!file) {
      return NextResponse.json({ error: 'Նիշքը ընտրված չէ:' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const cleanFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}_${cleanFilename}`;

    // Upload to public/uploads
    const targetDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(targetDir, { recursive: true });
    const filePath = path.join(targetDir, filename);
    await fs.writeFile(filePath, buffer);

    const relPath = `uploads/${filename}`;
    const publicUrl = `/uploads/${filename}`;

    // Optional Supabase backup
    const storageClient = supabaseAdmin || supabase;
    if (storageClient) {
      try {
        await storageClient.storage
          .from('gallery')
          .upload(filename, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: false
          });
      } catch (err) {
        // ignore fallback
      }
    }

    // Register into media_library.json
    const libraryData = await getMediaLibraryData();
    libraryData.fileAssignments[relPath] = targetFolderId;
    libraryData.fileAssignments[publicUrl] = targetFolderId;
    await saveMediaLibraryData(libraryData);

    const ext = path.extname(cleanFilename).toLowerCase().replace('.', '');
    const newMediaFile = {
      id: relPath,
      name: file.name,
      url: publicUrl,
      relPath,
      folderId: targetFolderId,
      size: buffer.length,
      sizeFormatted: formatBytes(buffer.length),
      type: detectFileType(ext),
      extension: ext,
      modifiedAt: new Date().toISOString()
    };

    return NextResponse.json({ success: true, file: newMediaFile });
  } catch (error: any) {
    console.error('Failed to upload media file:', error);
    return NextResponse.json({ error: error.message || 'Նիշքի վերբեռնումը ձախողվեց:' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Չարտոնված մուտք:' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId') || '';
    const deletePhysical = searchParams.get('deletePhysical') === 'true';

    if (!fileId) {
      return NextResponse.json({ error: 'Ֆայլի ID-ն բացակայում է:' }, { status: 400 });
    }

    const libraryData = await getMediaLibraryData();

    // Clean up assignments
    delete libraryData.fileAssignments[fileId];
    delete libraryData.fileAssignments['/' + fileId.replace(/^\/+/, '')];
    if (libraryData.customNames) {
      delete libraryData.customNames[fileId];
    }

    await saveMediaLibraryData(libraryData);

    // If requested to delete from disk and in uploads folder
    if (deletePhysical && fileId.startsWith('uploads/')) {
      const fullPath = path.join(process.cwd(), 'public', fileId);
      try {
        await fs.unlink(fullPath);
      } catch (err) {
        console.warn('Could not unlink physical file:', fullPath, err);
      }
    }

    return NextResponse.json({ success: true, message: 'Նիշքը հեռացված է:' });
  } catch (error: any) {
    console.error('Failed to delete file:', error);
    return NextResponse.json({ error: error.message || 'Ֆայլի հեռացումը ձախողվեց:' }, { status: 500 });
  }
}
