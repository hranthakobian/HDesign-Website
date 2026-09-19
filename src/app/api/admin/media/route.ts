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

    // 1. Try Supabase storage upload
    let publicUrl = '';
    const storageClient = supabaseAdmin || supabase;
    if (storageClient) {
      try {
        const { data: upData, error: upErr } = await storageClient.storage
          .from('gallery')
          .upload(filename, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: true
          });
        if (!upErr && upData) {
          const { data: pubData } = storageClient.storage.from('gallery').getPublicUrl(filename);
          if (pubData?.publicUrl) {
            publicUrl = pubData.publicUrl;
          }
        }
      } catch (err) {
        console.warn('Cloud storage upload notice:', err);
      }
    }

    // 2. Local fallback if public folder writable
    const relPath = `uploads/${filename}`;
    if (!publicUrl) {
      publicUrl = `/uploads/${filename}`;
    }

    try {
      const targetDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(targetDir, { recursive: true });
      const filePath = path.join(targetDir, filename);
      await fs.writeFile(filePath, buffer);
    } catch (fsErr) {
      console.warn('Local fs write skipped or read-only:', fsErr);
    }

    // Register into library data
    const libraryData = await getMediaLibraryData();
    libraryData.fileAssignments[relPath] = targetFolderId;
    if (publicUrl) {
      libraryData.fileAssignments[publicUrl] = targetFolderId;
    }
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
    const isPermanent = searchParams.get('permanent') === 'true' || searchParams.get('deletePhysical') === 'true';

    if (!fileId) {
      return NextResponse.json({ error: 'Ֆայլի ID-ն բացակայում է:' }, { status: 400 });
    }

    if (isPermanent) {
      // Permanently remove from Supabase Cloud Storage and local disk
      const { permanentlyDeleteMediaFile } = await import('@/lib/mediaScanner');
      await permanentlyDeleteMediaFile(fileId);
      return NextResponse.json({ success: true, message: 'Նիշքը ընդմիշտ հեռացված է:' });
    } else {
      // Move to Trash
      const { moveFilesToTrash } = await import('@/lib/mediaScanner');
      await moveFilesToTrash([fileId]);
      return NextResponse.json({ success: true, message: 'Նիշքը տեղափոխվեց աղբարկղ:' });
    }
  } catch (error: any) {
    console.error('Failed to delete file:', error);
    return NextResponse.json({ error: error.message || 'Ֆայլի հեռացումը ձախողվեց:' }, { status: 500 });
  }
}

