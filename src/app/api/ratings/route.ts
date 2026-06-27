import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { promises as fs } from 'fs';
import path from 'path';

const isServer = typeof window === 'undefined';
const DATA_DIR = isServer ? path.join(process.cwd(), 'public', 'data') : '';
const SETTINGS_FILE = isServer ? path.join(DATA_DIR, 'settings.json') : '';

// Helper to ensure settings file exists
async function ensureSettingsFile() {
  if (!isServer) return;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(SETTINGS_FILE);
  } catch {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify({}, null, 2), 'utf-8');
  }
}

// Helper to get all ratings
async function getRatingsMap(): Promise<Record<string, { sum: number; count: number; users: any }>> {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'ratings')
        .maybeSingle();
      if (data?.value) {
        return data.value;
      }
    }
  } catch (e) {
    console.warn("Supabase ratings read failed, falling back to local file:", e);
  }

  // Fallback to local settings.json
  try {
    await ensureSettingsFile();
    const raw = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const json = JSON.parse(raw);
    return json.ratings || {};
  } catch {
    return {};
  }
}

// Helper to save all ratings
async function saveRatingsMap(map: Record<string, any>) {
  try {
    if (supabase) {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'ratings', value: map, updated_at: new Date().toISOString() });
      if (!error) return;
    }
  } catch (e) {
    console.warn("Supabase ratings write failed, falling back to local file:", e);
  }

  // Fallback to local settings.json
  try {
    await ensureSettingsFile();
    let json: any = {};
    try {
      const raw = await fs.readFile(SETTINGS_FILE, 'utf-8');
      json = JSON.parse(raw);
    } catch {}
    json.ratings = map;
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(json, null, 2), 'utf-8');
  } catch (e) {
    console.error("Local file ratings write failed:", e);
  }
}

export async function GET(request: Request) {
  const ratings = await getRatingsMap();
  return NextResponse.json(ratings);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, rating, userId } = body;
    
    if (!id || !rating || rating < 1 || rating > 5 || !userId) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const ratings = await getRatingsMap();
    const item = ratings[id] || { sum: 0, count: 0, users: {} };

    // Convert old array format to object map if necessary for backward compatibility
    if (Array.isArray(item.users)) {
      const oldUsers = item.users;
      item.users = {};
      const assumedRating = item.count > 0 ? parseFloat((item.sum / item.count).toFixed(2)) : 5;
      for (const u of oldUsers) {
        item.users[u] = assumedRating;
      }
    } else if (!item.users || typeof item.users !== 'object') {
      item.users = {};
    }

    const oldRating = item.users[userId];

    if (oldRating !== undefined) {
      // User is updating their rating!
      item.sum = parseFloat((item.sum - oldRating + rating).toFixed(2));
      item.users[userId] = rating;
    } else {
      // New rating!
      item.sum = parseFloat((item.sum + rating).toFixed(2));
      item.count += 1;
      item.users[userId] = rating;
    }

    ratings[id] = item;

    await saveRatingsMap(ratings);
    return NextResponse.json({ success: true, sum: item.sum, count: item.count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    
    if (!id || !userId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const ratings = await getRatingsMap();
    const item = ratings[id];
    
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Convert old array format to object map if necessary
    if (Array.isArray(item.users)) {
      const oldUsers = item.users;
      item.users = {};
      const assumedRating = item.count > 0 ? parseFloat((item.sum / item.count).toFixed(2)) : 5;
      for (const u of oldUsers) {
        item.users[u] = assumedRating;
      }
    } else if (!item.users || typeof item.users !== 'object') {
      item.users = {};
    }

    const oldRating = item.users[userId];
    if (oldRating !== undefined) {
      item.sum = parseFloat((item.sum - oldRating).toFixed(2));
      item.count = Math.max(0, item.count - 1);
      delete item.users[userId];
      
      if (item.count === 0) {
        item.sum = 0;
      }
      
      ratings[id] = item;
      await saveRatingsMap(ratings);
      return NextResponse.json({ success: true, sum: item.sum, count: item.count });
    } else {
      return NextResponse.json({ error: "User rating not found" }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
