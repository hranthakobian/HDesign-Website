/**
 * Server-only Supabase admin client.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS for write operations.
 * NEVER import this file in client components.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oivflzgmhauajxqisuuh.supabase.co';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;
