import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Ֆայլը բացակայում է:' }, { status: 400 });
    }

    const targetBucket = 'bug-reports';
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const cleanFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}_${cleanFilename}`;

    // 1. Try Supabase Storage
    const storageClient = supabaseAdmin || supabase;
    if (storageClient) {
      try {
        let uploadResult = await storageClient.storage
          .from(targetBucket)
          .upload(filename, buffer, {
            contentType: file.type || 'application/octet-stream',
            cacheControl: '3600',
            upsert: false
          });

        if (uploadResult.error && (
          uploadResult.error.message?.toLowerCase().includes('bucket not found') ||
          uploadResult.error.message?.toLowerCase().includes('does not exist')
        )) {
          try {
            const createRes = await storageClient.storage.createBucket(targetBucket, {
              public: true
            });

            if (!createRes.error) {
              uploadResult = await storageClient.storage
                .from(targetBucket)
                .upload(filename, buffer, {
                  contentType: file.type || 'application/octet-stream',
                  cacheControl: '3600',
                  upsert: false
                });
            }
          } catch (createErr) {
            console.warn('Could not auto-create bug-reports bucket:', createErr);
          }
        }

        if (!uploadResult.error && uploadResult.data) {
          const { data: publicUrlData } = storageClient.storage
            .from(targetBucket)
            .getPublicUrl(filename);

          if (publicUrlData?.publicUrl) {
            return NextResponse.json({
              url: publicUrlData.publicUrl,
              filename: file.name,
              size: file.size
            });
          }
        }
      } catch (err) {
        console.warn('Supabase storage upload failed for bug report attachment, using local storage:', err);
      }
    }

    // 2. Local fallback - write to public/uploads/bug-reports/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', targetBucket);
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${targetBucket}/${filename}`;
    return NextResponse.json({
      url: publicUrl,
      filename: file.name,
      size: file.size
    });
  } catch (error: any) {
    console.error('Bug report attachment upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Սխալ ֆայլը վերբեռնելիս:' },
      { status: 500 }
    );
  }
}
