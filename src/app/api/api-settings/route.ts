import { NextResponse } from 'next/server';
import { getSiteSetting, saveSiteSetting } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

async function updateEnvFile(supabaseUrl: string, supabaseKey: string) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    let content = '';
    try {
      content = await fs.readFile(envPath, 'utf-8');
    } catch {
      // file doesn't exist
    }

    const lines = content.split(/\r?\n/);
    const updatedLines = [];
    const keysToUpdate = {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabaseKey
    };

    const processed = new Set<string>();

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        const key = parts[0].trim();
        if (key in keysToUpdate) {
          updatedLines.push(`${key}="${keysToUpdate[key as keyof typeof keysToUpdate]}"`);
          processed.add(key);
          continue;
        }
      }
      updatedLines.push(line);
    }

    for (const key in keysToUpdate) {
      if (!processed.has(key)) {
        updatedLines.push(`${key}="${keysToUpdate[key as keyof typeof keysToUpdate]}"`);
      }
    }

    await fs.writeFile(envPath, updatedLines.join('\n'), 'utf-8');
  } catch (err) {
    console.error('Failed to update .env file:', err);
  }
}

export async function GET() {
  try {
    const defaultSettings = {
      tildo_enabled: false,
      tildo_widget_id: '',
      google_analytics_enabled: false,
      google_analytics_id: '',
      custom_head_script: '',
      custom_footer_script: '',
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
    };
    const settings = await getSiteSetting('api_settings', defaultSettings);
    if (!settings.supabase_url) settings.supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (!settings.supabase_key) settings.supabase_key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    const correctPasscode = process.env.ADMIN_PASSCODE || 'admin123';
    
    if (authHeader !== correctPasscode) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    
    // Sync to .env if provided
    if (body.supabase_url !== undefined && body.supabase_key !== undefined) {
      await updateEnvFile(body.supabase_url, body.supabase_key);
    }

    const success = await saveSiteSetting('api_settings', body);

    if (!success) {
      return NextResponse.json({ error: 'Failed to save API settings.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
