import { createClient, SupabaseClient } from '@supabase/supabase-js'

const isServer = typeof window === 'undefined';

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseClient(): SupabaseClient {
  let url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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
          if (!key && settings.api_settings.supabase_key) key = settings.api_settings.supabase_key;
        }
      }
    } catch (err) {
      console.warn('Failed to load Supabase credentials from settings.json:', err);
    }
  }

  url = url || 'https://oivflzgmhauajxqisuuh.supabase.co';
  key = key || 'sb_publishable_40yQReXot3MjbPTwviNdnA_kbdJ1IOU';

  if (!cachedClient || cachedUrl !== url || cachedKey !== key) {
    cachedUrl = url;
    cachedKey = key;
    cachedClient = createClient(url, key, {
      global: {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        }
      }
    });
  }

  return cachedClient;
}

// Client-side dynamic background settings fetching
if (!isServer) {
  fetch('/data/settings.json')
    .then(res => res.json())
    .then(settings => {
      if (settings?.api_settings?.supabase_url && settings?.api_settings?.supabase_key) {
        cachedUrl = settings.api_settings.supabase_url;
        cachedKey = settings.api_settings.supabase_key;
        cachedClient = createClient(cachedUrl, cachedKey, {
          global: {
            headers: {
              apikey: cachedKey,
              Authorization: `Bearer ${cachedKey}`
            }
          }
        });
      }
    })
    .catch(err => {
      console.warn('Failed to dynamically fetch Supabase settings on client:', err);
    });
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

