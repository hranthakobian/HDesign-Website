import { supabase } from './supabase';

const CLIENT_ID_KEY = 'hdesign-client-id';

// Retrieve or generate a unique Client ID for settings sync
export function getClientId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    // Generate a simple unique ID
    id = 'client-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

// Save settings to Supabase
export async function saveSettingsToSupabase(theme: string, language: string) {
  const clientId = getClientId();
  if (!clientId || !supabase) return;

  try {
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        client_id: clientId,
        theme,
        language,
        updated_at: new Date().toISOString()
      }, { onConflict: 'client_id' });
    
    if (error) {
      console.warn('Supabase settings sync warning:', error.message);
    }
  } catch (err) {
    console.warn('Network error syncing settings to Supabase:', err);
  }
}

// Fetch settings from Supabase
export async function fetchSettingsFromSupabase(): Promise<{ theme: string; language: string } | null> {
  const clientId = getClientId();
  if (!clientId || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('theme, language')
      .eq('client_id', clientId)
      .single();

    if (data && !error) {
      return { theme: data.theme, language: data.language };
    }
  } catch (err) {
    console.warn('Network error fetching settings from Supabase:', err);
  }
  return null;
}
