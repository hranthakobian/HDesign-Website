import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Auth check
    const isAuthorized = await verifyAuth(request);
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const requestedBucket = (formData.get('bucket') || formData.get('folder') || formData.get('type') || '').toString().trim().toLowerCase();
    
    // Determine target bucket name for Supabase storage (and folder locally)
    let targetBucket = 'branding';
    if (requestedBucket === 'gallery' || requestedBucket.includes('gallery') || requestedBucket.includes('port')) {
      targetBucket = 'gallery';
    } else if (requestedBucket === 'font' || requestedBucket === 'fonts') {
      targetBucket = 'fonts';
    } else if (requestedBucket === 'video' || requestedBucket === 'videos') {
      targetBucket = 'videos';
    } else if (requestedBucket) {
      targetBucket = requestedBucket.replace(/[^a-z0-9_-]/g, '');
    } else if (file.name.toLowerCase().includes('gallery') || file.name.toLowerCase().startsWith('port_')) {
      targetBucket = 'gallery';
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const cleanFilename = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `${Date.now()}_${cleanFilename}`;

    // 1. Upload to Supabase Storage if configured
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

        // If bucket doesn't exist, try to create it and retry upload
        if (uploadResult.error && (
          uploadResult.error.message?.toLowerCase().includes('bucket not found') ||
          uploadResult.error.message?.toLowerCase().includes('does not exist')
        )) {
          console.warn(`Bucket '${targetBucket}' not found. Attempting to create it...`);
          try {
            const createRes = await storageClient.storage.createBucket(targetBucket, {
              public: true,
              fileSizeLimit: 52428800 // 50MB
            });

            if (!createRes.error) {
              console.log(`Bucket '${targetBucket}' created successfully. Retrying upload...`);
              uploadResult = await storageClient.storage
                .from(targetBucket)
                .upload(filename, buffer, {
                  contentType: file.type || 'application/octet-stream',
                  cacheControl: '3600',
                  upsert: false
                });
            } else {
              console.warn(`Failed to create bucket '${targetBucket}':`, createRes.error);
            }
          } catch (createErr) {
            console.error(`Exception during '${targetBucket}' bucket creation:`, createErr);
          }
        }

        if (!uploadResult.error && uploadResult.data) {
          const { data: publicUrlData } = storageClient.storage
            .from(targetBucket)
            .getPublicUrl(filename);
          
          if (publicUrlData?.publicUrl) {
            return NextResponse.json({ url: publicUrlData.publicUrl, bucket: targetBucket });
          }
        } else if (uploadResult.error) {
          console.warn('Supabase storage upload returned error:', uploadResult.error);
        }
      } catch (err) {
        console.warn('Supabase storage upload failed, using local upload fallback:', err);
      }
    }

    // 2. Local fallback - write to public/uploads/[targetBucket]/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', targetBucket);
    await fs.mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${targetBucket}/${filename}`;
    return NextResponse.json({ url: publicUrl, bucket: targetBucket });
  } catch (error: any) {
    console.error('File upload API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file.' },
      { status: 500 }
    );
  }
}

