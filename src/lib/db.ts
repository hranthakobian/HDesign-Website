import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';
import path from 'path';

// Helper to determine if we are on the server side
const isServer = typeof window === 'undefined';

// Lazy load fs on the server to prevent bundler errors on client-side compilation
const getFs = () => {
  if (isServer) {
    return require('fs/promises');
  }
  return null;
};

// Paths for JSON fallback databases
const DATA_DIR = isServer ? path.join(process.cwd(), 'public', 'data') : '';
const CASES_FILE = isServer ? path.join(DATA_DIR, 'cases.json') : '';
const MESSAGES_FILE = isServer ? path.join(DATA_DIR, 'messages.json') : '';
const VISITS_FILE = isServer ? path.join(DATA_DIR, 'visits.json') : '';
const SETTINGS_FILE = isServer ? path.join(DATA_DIR, 'settings.json') : '';
const FONTS_FILE = isServer ? path.join(DATA_DIR, 'fonts.json') : '';

// Ensure database directory and files exist
async function ensureLocalDbFiles() {
  if (!isServer) return;
  const fs = getFs();
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Check and create cases.json if missing
    try {
      await fs.access(CASES_FILE);
    } catch {
      await fs.writeFile(CASES_FILE, JSON.stringify([], null, 2), 'utf-8');
    }

    // Check and create messages.json if missing
    try {
      await fs.access(MESSAGES_FILE);
    } catch {
      await fs.writeFile(MESSAGES_FILE, JSON.stringify([], null, 2), 'utf-8');
    }

    // Check and create visits.json if missing
    try {
      await fs.access(VISITS_FILE);
    } catch {
      await fs.writeFile(VISITS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }

    // Check and create settings.json if missing
    try {
      await fs.access(SETTINGS_FILE);
    } catch {
      await fs.writeFile(SETTINGS_FILE, JSON.stringify({}, null, 2), 'utf-8');
    }

    // Check and create fonts.json if missing
    try {
      await fs.access(FONTS_FILE);
    } catch {
      await fs.writeFile(FONTS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error initializing local JSON database files:', err);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CASES (Portfolio Projects)
// ══════════════════════════════════════════════════════════════════════════════

export type Case = {
  id: string;
  title: string;
  subtitle: string;
  bg: string;
  image_url?: string;
  details?: string;
  category?: string;
  client?: string;
  year?: string;
  created_at?: string;
};

// Default seed cases to display if Supabase table or JSON is empty
export const defaultSeededCases: Case[] = [
  {
    id: 'seed-1',
    title: 'Pasta',
    subtitle: 'Բրենդինգ և Փաթեթավորում',
    bg: '#d32f2f',
    image_url: '/branding/pasta.png',
    category: 'Branding',
    client: 'Pasta House Co.',
    year: '2025',
    details: 'Պաստայի նոր արտադրության համար ստեղծված բրենդավորում, որը ներառում է լոգոյի դիզայն, փաթեթավորման էսքիզներ և վիզուալ հաղորդակցության ռազմավարություն: Օգտագործվել են տաք գունային երանգներ և ավանդական իտալական շունչ:'
  },
  {
    id: 'seed-2',
    title: '11...',
    subtitle: 'Ստեղծարար Պաստառներ',
    bg: '#e65100',
    image_url: '/branding/eleven.png',
    category: 'Poster Design',
    client: 'Creative Hub Yerevan',
    year: '2025',
    details: '11-րդ ամենամյա ստեղծարար ցուցահանդեսի համար մշակված պաստառներ: Դիզայնը հիմնված է կոնցեպտուալ տիպոգրաֆիկայի և մինիմալիստական երկրաչափական պատկերների համադրության վրա:'
  },
  {
    id: 'seed-3',
    title: 'Posters',
    subtitle: 'Ցուցահանդեսի Բրենդավորում',
    bg: '#880e4f',
    image_url: '/branding/posters.png',
    category: 'Identity',
    client: 'Art Gallery',
    year: '2024',
    details: 'Ժամանակակից արվեստի ցուցասրահի համար մշակված կորպորատիվ ոճ: Նախագիծը ներառում է այցեքարտեր, պաստառներ, սոցիալական մեդիայի ձևավորումներ և կայքի ինտերֆեյսի վիզուալ ուղեցույցներ:'
  },
  {
    id: 'seed-4',
    title: 'Teal Lines',
    subtitle: 'Մինիմալիստական Արտ',
    bg: '#004d40',
    image_url: '/branding/teal.png',
    category: 'Digital Art',
    client: 'Personal Project',
    year: '2026',
    details: 'Երկրաչափական գծերից և մուգ կապտականաչավուն երանգներից կազմված աբստրակտ արտ նախագիծ, որն ուսումնասիրում է տարածության և սիմետրիայի հարաբերությունները:'
  },
  {
    id: 'seed-5',
    title: 'Mobile UI',
    subtitle: 'Մոբայլ Հավելվածի Ինտերֆեյս',
    bg: '#311b92',
    image_url: '/branding/mobile.png',
    category: 'UI/UX Design',
    client: 'FinTech Startup',
    year: '2025',
    details: 'Ֆինանսական տեխնոլոգիաների ոլորտի նոր ստարտափի համար ստեղծված մոբայլ հավելվածի ինտերֆեյս: Հիմնական շեշտը դրվել է օգտագործելիության (UX), մաքուր տեսքի և հարմարավետ անցումների (Animations) վրա:'
  }
];

export async function getCases(): Promise<Case[]> {
  await ensureLocalDbFiles();
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const dynamicIds = new Set((data as any[]).map((x: any) => x.id));
        const filteredSeeds = defaultSeededCases.filter((x: Case) => !dynamicIds.has(x.id));
        return [...data, ...filteredSeeds];
      }
    } catch (err) {
      console.warn('Supabase getCases failed, falling back to local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(CASES_FILE, 'utf-8');
      const localCases = JSON.parse(content) as Case[];
      const dynamicIds = new Set(localCases.map((x: Case) => x.id));
      const filteredSeeds = defaultSeededCases.filter((x: Case) => !dynamicIds.has(x.id));
      return [...localCases, ...filteredSeeds];
    } catch (err) {
      console.error('Error reading local cases:', err);
    }
  }

  return defaultSeededCases;
}

export async function saveCase(c: Case): Promise<Case | null> {
  await ensureLocalDbFiles();
  const newCase = {
    ...c,
    created_at: c.created_at || new Date().toISOString()
  };

  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from('cases')
        .upsert(newCase)
        .select()
        .single();
      
      if (!error && data) return data;
      console.warn('Supabase saveCase error:', error?.message);
    } catch (err) {
      console.warn('Supabase saveCase failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(CASES_FILE, 'utf-8');
      const cases = JSON.parse(content) as Case[];
      
      const index = cases.findIndex(x => x.id === c.id);
      if (index !== -1) {
        cases[index] = newCase;
      } else {
        cases.unshift(newCase);
      }

      await fs.writeFile(CASES_FILE, JSON.stringify(cases, null, 2), 'utf-8');
      return newCase;
    } catch (err) {
      console.error('Error writing case locally:', err);
    }
  }

  return null;
}

export async function deleteCase(id: string): Promise<boolean> {
  await ensureLocalDbFiles();
  
  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { error } = await adminClient
        .from('cases')
        .delete()
        .eq('id', id);
      
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase deleteCase failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(CASES_FILE, 'utf-8');
      const cases = JSON.parse(content) as Case[];
      const filtered = cases.filter(x => x.id !== id);
      await fs.writeFile(CASES_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Error deleting case locally:', err);
    }
  }

  return false;
}

// ══════════════════════════════════════════════════════════════════════════════
// MESSAGES (Contact Form submissions)
// ══════════════════════════════════════════════════════════════════════════════

export type Message = {
  id?: string;
  name: string;
  email: string;
  message: string;
  created_at?: string;
};

export async function getMessages(): Promise<Message[]> {
  await ensureLocalDbFiles();

  const readClient = supabaseAdmin || supabase;
  if (readClient) {
    try {
      const { data, error } = await readClient
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase getMessages failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(MESSAGES_FILE, 'utf-8');
      return JSON.parse(content) as Message[];
    } catch (err) {
      console.error('Error reading local messages:', err);
    }
  }

  return [];
}

export async function saveMessage(m: Message): Promise<{ success: boolean; data?: Message; error?: string }> {
  await ensureLocalDbFiles();
  const newMessage = {
    id: m.id || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    ...m,
    created_at: m.created_at || new Date().toISOString()
  };

  let supabaseErrorMsg = '';

  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from('messages')
        .insert([newMessage])
        .select()
        .single();
      
      if (!error && data) return { success: true, data };
      if (error) {
        supabaseErrorMsg = error.message;
        console.warn('Supabase saveMessage query error:', error.message);
      }
    } catch (err: any) {
      supabaseErrorMsg = err.message || String(err);
      console.warn('Supabase saveMessage failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(MESSAGES_FILE, 'utf-8');
      const messages = JSON.parse(content) as Message[];
      messages.unshift(newMessage);
      await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf-8');
      return { success: true, data: newMessage };
    } catch (err: any) {
      console.error('Error saving message locally:', err);
      return { success: false, error: `Supabase error: ${supabaseErrorMsg}. Local storage fallback error: ${err.message}` };
    }
  }

  return { success: false, error: supabaseErrorMsg || 'No server/database connection' };
}

export async function deleteMessage(id: string): Promise<boolean> {
  await ensureLocalDbFiles();

  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { error } = await adminClient
        .from('messages')
        .delete()
        .eq('id', id);
      
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase deleteMessage failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(MESSAGES_FILE, 'utf-8');
      const messages = JSON.parse(content) as Message[];
      const filtered = messages.filter(x => x.id !== id);
      await fs.writeFile(MESSAGES_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Error deleting message locally:', err);
    }
  }

  return false;
}

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS (Site Visits)
// ══════════════════════════════════════════════════════════════════════════════

export type VisitSession = {
  id?: string;
  session_id: string;
  ip_address?: string;
  user_agent?: string;
  browser?: string;
  os?: string;
  device?: string;
  country?: string;
  city?: string;
  referrer?: string;
  landing_page?: string;
  created_at?: string;
  updated_at?: string;
};

export async function saveVisit(v: VisitSession): Promise<VisitSession | null> {
  await ensureLocalDbFiles();
  const newVisit = {
    id: v.id || Math.random().toString(36).substring(2, 15),
    ...v,
    created_at: v.created_at || new Date().toISOString(),
    updated_at: v.updated_at || new Date().toISOString()
  };

  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from('site_visits')
        .insert([newVisit])
        .select()
        .single();
      
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase saveVisit failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(VISITS_FILE, 'utf-8');
      const visits = JSON.parse(content) as VisitSession[];
      
      // Prevent duplicates of the same session ID in json
      const index = visits.findIndex(x => x.session_id === v.session_id);
      if (index !== -1) {
        visits[index] = { ...visits[index], ...newVisit };
      } else {
        visits.unshift(newVisit);
      }

      await fs.writeFile(VISITS_FILE, JSON.stringify(visits, null, 2), 'utf-8');
      return newVisit;
    } catch (err) {
      console.error('Error saving visit locally:', err);
    }
  }

  return null;
}

export async function updateVisitHeartbeat(sessionId: string): Promise<boolean> {
  await ensureLocalDbFiles();
  const now = new Date().toISOString();

  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { error } = await adminClient
        .from('site_visits')
        .update({ updated_at: now })
        .eq('session_id', sessionId);
      
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase updateVisitHeartbeat failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(VISITS_FILE, 'utf-8');
      const visits = JSON.parse(content) as VisitSession[];
      
      const index = visits.findIndex(x => x.session_id === sessionId);
      if (index !== -1) {
        visits[index].updated_at = now;
        await fs.writeFile(VISITS_FILE, JSON.stringify(visits, null, 2), 'utf-8');
        return true;
      }
    } catch (err) {
      console.error('Error updating visit heartbeat locally:', err);
    }
  }

  return false;
}

export async function getVisits(): Promise<VisitSession[]> {
  await ensureLocalDbFiles();

  const readClient = supabaseAdmin || supabase;
  if (readClient) {
    try {
      const { data, error } = await readClient
        .from('site_visits')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase getVisits failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(VISITS_FILE, 'utf-8');
      return JSON.parse(content) as VisitSession[];
    } catch (err) {
      console.error('Error reading local visits:', err);
    }
  }

  return [];
}

// ══════════════════════════════════════════════════════════════════════════════
// SITE SETTINGS (Translations & API Keys)
// ══════════════════════════════════════════════════════════════════════════════

export async function getSiteSetting(key: string, defaultValue: any = null): Promise<any> {
  await ensureLocalDbFiles();

  const readClient = supabaseAdmin || supabase;
  if (readClient) {
    try {
      const { data, error } = await readClient
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .single();
      
      if (!error && data) {
        return data.value;
      }
      if (error) {
        console.warn(`Supabase getSiteSetting for ${key} failed: ${error.message}. Using local fallback.`);
      }
    } catch (err) {
      console.warn(`Supabase getSiteSetting for ${key} failed, using local fallback:`, err);
    }
  }

  // Fallback to local JSON file
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(SETTINGS_FILE, 'utf-8');
      const settings = JSON.parse(content);
      return settings[key] !== undefined ? settings[key] : defaultValue;
    } catch (err) {
      console.error(`Error reading settings key ${key} locally:`, err);
    }
  }

  return defaultValue;
}

export async function saveSiteSetting(key: string, value: any): Promise<{ success: boolean; error?: string }> {
  await ensureLocalDbFiles();

  let supabaseErrorMsg = '';

  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { error } = await adminClient
        .from('site_settings')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      
      if (!error) return { success: true };
      supabaseErrorMsg = error.message;
      console.warn(`Supabase saveSiteSetting for ${key} upsert error:`, error.message);
    } catch (err: any) {
      supabaseErrorMsg = err.message || String(err);
      console.warn(`Supabase saveSiteSetting for ${key} failed, using local storage:`, err);
    }
  }

  // Fallback to local JSON file
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(SETTINGS_FILE, 'utf-8');
      const settings = JSON.parse(content);
      settings[key] = value;
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
      return { success: true };
    } catch (err: any) {
      console.error(`Error writing setting key ${key} locally:`, err);
      return { success: false, error: `Supabase error: ${supabaseErrorMsg}. Local storage fallback error: ${err.message}` };
    }
  }

  return { success: false, error: supabaseErrorMsg || 'No server/database connection' };
}

// ══════════════════════════════════════════════════════════════════════════════
// FONTS (Custom fonts)
// ══════════════════════════════════════════════════════════════════════════════

export type Font = {
  id: string;
  name_am: string;
  name_en: string;
  category: string;
  creator?: string;
  year?: string;
  description_am?: string;
  description_en?: string;
  downloadable: boolean;
  paid: boolean;
  price?: string;
  font_file_url: string;
  download_url?: string;
  purchase_url?: string;
  created_at?: string;
};

// Default seed font
export const defaultSeededFonts: Font[] = [
  {
    id: 'hdesign-font',
    name_am: 'HDesign Տառատեսակ',
    name_en: 'HDesign Font',
    category: 'Display',
    creator: 'Հրանտ Հակոբյան',
    year: '2026',
    description_am: 'HDesign-ի սեփական երկրաչափական և մինիմալիստական տառատեսակը, որը նախագծված է հատուկ դիզայն համակարգի պահանջներին համապատասխան։',
    description_en: 'HDesign\'s proprietary geometric and minimalist font, designed specifically to match the design system requirements.',
    downloadable: true,
    paid: false,
    font_file_url: '/HDesign.ttf',
    download_url: '/HDesign.ttf',
    created_at: '2026-06-27T00:00:00.000Z'
  }
];

export async function getFonts(): Promise<Font[]> {
  await ensureLocalDbFiles();
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('fonts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // filter out dynamic duplicates of seed font if any
        const dynamicIds = new Set((data as any[]).map((x: any) => x.id));
        const filteredSeeds = defaultSeededFonts.filter((x: Font) => !dynamicIds.has(x.id));
        return [...data, ...filteredSeeds];
      }
    } catch (err) {
      console.warn('Supabase getFonts failed, falling back to local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(FONTS_FILE, 'utf-8');
      const localFonts = JSON.parse(content) as Font[];
      const dynamicIds = new Set(localFonts.map((x: Font) => x.id));
      const filteredSeeds = defaultSeededFonts.filter((x: Font) => !dynamicIds.has(x.id));
      return [...localFonts, ...filteredSeeds];
    } catch (err) {
      console.error('Error reading local fonts:', err);
    }
  }

  return defaultSeededFonts;
}

export async function saveFont(f: Font): Promise<Font | null> {
  await ensureLocalDbFiles();
  const newFont = {
    ...f,
    created_at: f.created_at || new Date().toISOString()
  };

  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from('fonts')
        .upsert(newFont)
        .select()
        .single();
      
      if (!error && data) return data;
      console.warn('Supabase saveFont error:', error?.message);
    } catch (err) {
      console.warn('Supabase saveFont failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(FONTS_FILE, 'utf-8');
      const fonts = JSON.parse(content) as Font[];
      
      const index = fonts.findIndex(x => x.id === f.id);
      if (index !== -1) {
        fonts[index] = newFont;
      } else {
        fonts.unshift(newFont);
      }

      await fs.writeFile(FONTS_FILE, JSON.stringify(fonts, null, 2), 'utf-8');
      return newFont;
    } catch (err) {
      console.error('Error writing font locally:', err);
    }
  }

  return null;
}

export async function deleteFont(id: string): Promise<boolean> {
  await ensureLocalDbFiles();
  
  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { error } = await adminClient
        .from('fonts')
        .delete()
        .eq('id', id);
      
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase deleteFont failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(FONTS_FILE, 'utf-8');
      const fonts = JSON.parse(content) as Font[];
      const filtered = fonts.filter(x => x.id !== id);
      await fs.writeFile(FONTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Error deleting font locally:', err);
    }
  }

  return false;
}
