import { getSupabaseClient } from '../src/lib/supabase';

async function check() {
  const client = getSupabaseClient();
  console.log('Checking Supabase connection...');
  
  const { data: themesData, error: themesError } = await client.from('themes').select('*').limit(5);
  console.log('themes table:', { themesData, error: themesError?.message });

  const { data: pagesData, error: pagesError } = await client.from('pages').select('*').limit(5);
  console.log('pages table:', { pagesData, error: pagesError?.message });
}

check().catch(console.error);
