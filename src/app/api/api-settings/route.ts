import { NextResponse } from 'next/server';
import { getSiteSetting, saveSiteSetting } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
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
      SUPABASE_URL: supabaseUrl,
      SUPABASE_ANON_KEY: supabaseKey,
      SUPABASE_PUBLISHABLE_KEY: supabaseKey
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
      supabase_url: process.env.SUPABASE_URL || '',
      supabase_key: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '',
      smtp_host: process.env.SMTP_HOST || '',
      smtp_port: process.env.SMTP_PORT || '587',
      smtp_secure: process.env.SMTP_SECURE === 'true',
      smtp_user: process.env.SMTP_USER || '',
      smtp_pass: process.env.SMTP_PASS || '',
      smtp_from: process.env.SMTP_FROM || ''
    };
    const settings = await getSiteSetting('api_settings', defaultSettings);
    if (!settings.supabase_url) settings.supabase_url = process.env.SUPABASE_URL || '';
    if (!settings.supabase_key) settings.supabase_key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';
    if (settings.smtp_host === undefined) settings.smtp_host = process.env.SMTP_HOST || '';
    if (settings.smtp_port === undefined) settings.smtp_port = process.env.SMTP_PORT || '587';
    if (settings.smtp_secure === undefined) settings.smtp_secure = process.env.SMTP_SECURE === 'true';
    if (settings.smtp_user === undefined) settings.smtp_user = process.env.SMTP_USER || '';
    if (settings.smtp_pass === undefined) settings.smtp_pass = process.env.SMTP_PASS || '';
    if (settings.smtp_from === undefined) settings.smtp_from = process.env.SMTP_FROM || '';
    if (settings.google_analytics_id) {
      settings.google_analytics_id = extractGoogleAnalyticsId(settings.google_analytics_id);
    }
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function extractGoogleAnalyticsId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/G-[A-Za-z0-9]+/i);
  if (match && match[0]) {
    return match[0].toUpperCase();
  }
  return trimmed;
}

function extractTidioWidgetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  
  // Try to match standard Tidio code URL pattern: code.tidio.co/{id}(.js)
  const match = trimmed.match(/code\.tidio\.co\/([a-zA-Z0-9]+)/);
  if (match && match[1]) {
    return match[1];
  }
  
  // If it's a raw alphanumeric ID
  if (/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return trimmed;
  }
  
  // Try to match any alphanumeric string of typical Tidio ID length (usually 32 chars)
  const fallbackMatch = trimmed.match(/[a-zA-Z0-9]{20,40}/);
  if (fallbackMatch) {
    return fallbackMatch[0];
  }
  
  return trimmed;
}

export async function POST(request: Request) {
  try {
    // Auth check
    const isAuthorized = await verifyAuth(request);
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    
    // Clean Tidio Widget ID
    if (body.tildo_widget_id !== undefined) {
      body.tildo_widget_id = extractTidioWidgetId(body.tildo_widget_id);
    }
    
    // Clean Google Analytics ID
    if (body.google_analytics_id !== undefined) {
      body.google_analytics_id = extractGoogleAnalyticsId(body.google_analytics_id);
    }

    // Sync to .env if provided
    if (body.supabase_url !== undefined && body.supabase_key !== undefined) {
      await updateEnvFile(body.supabase_url, body.supabase_key);
    }

    const result = await saveSiteSetting('api_settings', body);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to save API settings.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
