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
export const maxDuration = 300;

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
    return NextResponse.json({ error: error.message || 'Սխալ դարանը բեռնելիս' }, { status: 500 });
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
    const replaceFileId = (formData.get('replaceFileId') || '').toString().trim() || null;

    if (!file) {
      return NextResponse.json({ error: 'Նիշքը ընտրված չէ:' }, { status: 400 });
    }

    if (replaceFileId) {
      try {
        const { permanentlyDeleteMediaFile } = await import('@/lib/mediaScanner');
        await permanentlyDeleteMediaFile(replaceFileId);
      } catch (delErr) {
        console.warn('Failed to clean up replaced file:', delErr);
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const cleanFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}_${cleanFilename}`;

    // 1. Try Supabase storage upload
    let publicUrl = '';
    let targetBucket = 'gallery';
    const storageClient = supabaseAdmin || supabase;
    if (storageClient) {
      try {
        let uploadRes = await storageClient.storage
          .from(targetBucket)
          .upload(filename, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: true
          });

        if (uploadRes.error && uploadRes.error.message?.includes('Bucket not found')) {
          try {
            await storageClient.storage.createBucket(targetBucket, { public: true });
            uploadRes = await storageClient.storage
              .from(targetBucket)
              .upload(filename, buffer, {
                contentType: file.type || 'application/octet-stream',
                upsert: true
              });
          } catch (createErr) {
            targetBucket = 'uploads';
            uploadRes = await storageClient.storage
              .from(targetBucket)
              .upload(filename, buffer, {
                contentType: file.type || 'application/octet-stream',
                upsert: true
              });
          }
        }

        if (!uploadRes.error && uploadRes.data) {
          const { data: pubData } = storageClient.storage.from(targetBucket).getPublicUrl(filename);
          if (pubData?.publicUrl) {
            publicUrl = pubData.publicUrl;
          }
        } else if (uploadRes.error) {
          console.warn('Cloud storage upload notice:', uploadRes.error);
        }
      } catch (err) {
        console.warn('Cloud storage upload notice:', err);
      }
    }

    // 2. Local fallback if cloud upload failed or for local access
    let relPath = publicUrl ? `supabase/${targetBucket}/${filename}` : `uploads/${filename}`;
    if (!publicUrl) {
      publicUrl = `/uploads/${filename}`;
      try {
        const targetDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(targetDir, { recursive: true });
        const filePath = path.join(targetDir, filename);
        await fs.writeFile(filePath, buffer);
      } catch (fsErr) {
        console.warn('Local fs write failed:', fsErr);
      }
    }

    // Register into library data
    const libraryData = await getMediaLibraryData();
    libraryData.fileAssignments[relPath] = targetFolderId;
    if (publicUrl) {
      libraryData.fileAssignments[publicUrl] = targetFolderId;
    }
    // Also assign uploads/ variant so lookup always succeeds
    libraryData.fileAssignments[`uploads/${filename}`] = targetFolderId;
    libraryData.fileAssignments[`/uploads/${filename}`] = targetFolderId;
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
    const url = searchParams.get('url') || undefined;
    const isPermanent = searchParams.get('permanent') === 'true' || searchParams.get('deletePhysical') === 'true';

    if (!fileId) {
      return NextResponse.json({ error: 'Ֆայլի ID-ն բացակայում է:' }, { status: 400 });
    }

    if (isPermanent) {
      // Permanently remove from Supabase Cloud Storage and local disk
      const { permanentlyDeleteMediaFile } = await import('@/lib/mediaScanner');
      await permanentlyDeleteMediaFile(fileId, url);
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

