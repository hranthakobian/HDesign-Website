/**
 * Server-only Supabase admin client.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS for write operations.
 * NEVER import this file in client components.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const isServer = typeof window === 'undefined';

let cachedAdminClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseAdminClient(): SupabaseClient | null {
  let url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (isServer) {
    try {
      const fs = require('fs');
      const path = require('path');
      const settingsPath = path.join(process.cwd(), 'public', 'data', 'settings.json');
      if (fs.existsSync(settingsPath)) {
        const content = fs.readFileSync(settingsPath, 'utf-8');
        const settings = JSON.parse(content);
        if (settings.api_settings) {
          if (!url && settings.api_settings.supabase_url) url = settings.api_settings.supabase_url;
          if (!serviceRoleKey && !anonKey && settings.api_settings.supabase_key) {
            anonKey = settings.api_settings.supabase_key;
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load Supabase admin credentials from settings.json:', err);
    }
  }

  url = url || 'https://oivflzgmhauajxqisuuh.supabase.co';
  const key = serviceRoleKey || anonKey || 'sb_publishable_40yQReXot3MjbPTwviNdnA_kbdJ1IOU';

  if (!url || !key) return null;

  if (!cachedAdminClient || cachedUrl !== url || cachedKey !== key) {
    cachedUrl = url;
    cachedKey = key;
    cachedAdminClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return cachedAdminClient;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabaseAdminClient();
    if (!client) return undefined;
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
}) as any;

