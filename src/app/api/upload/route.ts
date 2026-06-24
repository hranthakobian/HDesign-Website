import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    const correctPasscode = process.env.ADMIN_PASSCODE || 'admin123';
    
    if (authHeader !== correctPasscode) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const cleanFilename = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `${Date.now()}_${cleanFilename}`;

    // 1. Upload to Supabase Storage if configured and a portfolio bucket is available
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from('branding') // or fall back to 'qr-presets' if 'branding' bucket does not exist
          .upload(filename, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('branding')
            .getPublicUrl(filename);
          
          if (publicUrlData?.publicUrl) {
            return NextResponse.json({ url: publicUrlData.publicUrl });
          }
        }
      } catch (err) {
        console.warn('Supabase storage upload failed, using local upload fallback:', err);
      }
    }

    // 2. Local fallback - write to public/uploads/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;
    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to upload file.' },
      { status: 500 }
    );
  }
}
