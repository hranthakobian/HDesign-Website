import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';
import path from 'path';
import { classifyVisits } from './spamDetector';

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
const SUBSCRIBERS_FILE = isServer ? path.join(DATA_DIR, 'subscribers.json') : '';

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

    // Check and create subscribers.json if missing
    try {
      await fs.access(SUBSCRIBERS_FILE);
    } catch {
      await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify([], null, 2), 'utf-8');
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
    image_url: '',
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
    image_url: '',
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
    image_url: '',
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
    image_url: '',
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
    image_url: '',
    category: 'UI/UX Design',
    client: 'FinTech Startup',
    year: '2025',
    details: 'Ֆինանսական տեխնոլոգիաների ոլորտի նոր ստարտափի համար ստեղծված մոբայլ հավելվածի ինտերֆեյս: Հիմնական շեշտը դրվել է օգտագործելիության (UX), մաքուր տեսքի և հարմարավետ անցումների (Animations) վրա:'
  }
];

export async function getCases(): Promise<Case[]> {
  await ensureLocalDbFiles();
  
  let localCases: Case[] = [];
  if (isServer) {
    try {
      const fs = getFs();
      const content = await fs.readFile(CASES_FILE, 'utf-8');
      localCases = JSON.parse(content) as Case[];
    } catch (err) {
      console.warn('Failed to read local cases:', err);
    }
  }

  const readClient = supabaseAdmin || supabase;
  let dbCases: Case[] = [];
  let supabaseSuccess = false;

  if (readClient) {
    try {
      const { data, error } = await readClient
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbCases = data;
        supabaseSuccess = true;
      } else if (error) {
        console.warn('Supabase getCases query error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase getCases failed, falling back to local storage:', err);
    }
  }

  const deletedSeeds = await getSiteSetting('deleted_seed_cases', []);
  const deletedSeedsSet = new Set(deletedSeeds || []);

  const currentDbCases = supabaseSuccess ? dbCases : [];
  const dynamicIds = new Set([...currentDbCases.map((x: any) => x.id), ...localCases.map(x => x.id)]);
  const filteredSeeds = defaultSeededCases.filter((x: Case) => !dynamicIds.has(x.id) && !deletedSeedsSet.has(x.id));
  
  if (supabaseSuccess) {
    const localFiltered = localCases.filter(x => !dynamicIds.has(x.id));
    return [...dbCases, ...localFiltered, ...filteredSeeds];
  }

  return [...localCases, ...filteredSeeds];
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
  
  const isSeed = id.startsWith('seed-');
  let seedRegistered = false;

  if (isSeed) {
    try {
      const deletedSeeds = await getSiteSetting('deleted_seed_cases', []);
      if (!deletedSeeds.includes(id)) {
        deletedSeeds.push(id);
        await saveSiteSetting('deleted_seed_cases', deletedSeeds);
      }
      seedRegistered = true;
    } catch (err) {
      console.warn('Failed to register deleted seed case in settings:', err);
    }
  }

  let supabaseErrorMsg = '';
  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { error } = await adminClient
        .from('cases')
        .delete()
        .eq('id', id);
      
      if (!error) {
        if (isSeed) return true;
      } else {
        supabaseErrorMsg = error.message;
        console.warn('Supabase deleteCase query error:', error.message);
      }
    } catch (err: any) {
      supabaseErrorMsg = err.message || String(err);
      console.warn('Supabase deleteCase failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  let localErrorMsg = '';
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(CASES_FILE, 'utf-8');
      const cases = JSON.parse(content) as Case[];
      const filtered = cases.filter(x => x.id !== id);
      await fs.writeFile(CASES_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    } catch (err: any) {
      localErrorMsg = err.message || String(err);
      console.error('Error deleting case locally:', err);
    }
  }

  if (isSeed && seedRegistered) {
    return true;
  }

  const errorParts = [];
  if (supabaseErrorMsg) errorParts.push(`Supabase error: ${supabaseErrorMsg}`);
  if (localErrorMsg) errorParts.push(`Local storage fallback error: ${localErrorMsg}`);
  
  throw new Error(errorParts.join(' | ') || 'Failed to delete case.');
}

// ══════════════════════════════════════════════════════════════════════════════
// MESSAGES (Contact Form submissions)
// ══════════════════════════════════════════════════════════════════════════════

export type MessageReply = {
  id: string;
  messageId: string;
  subject: string;
  message: string;
  sent_at: string;
};

export type Message = {
  id?: string;
  name: string;
  email: string;
  message: string;
  created_at?: string;
  
  // Status flags
  read?: boolean;
  starred?: boolean;
  spam?: boolean;
  trash?: boolean;
  replied?: boolean;
  replies?: MessageReply[];
};

export async function getMessages(): Promise<Message[]> {
  await ensureLocalDbFiles();

  let rawMessages: Message[] = [];

  const readClient = supabaseAdmin || supabase;
  if (readClient) {
    try {
      const { data, error } = await readClient
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        rawMessages = data;
      }
    } catch (err) {
      console.warn('Supabase getMessages failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (rawMessages.length === 0 && isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(MESSAGES_FILE, 'utf-8');
      rawMessages = JSON.parse(content) as Message[];
    } catch (err) {
      console.error('Error reading local messages:', err);
    }
  }

  // Enrich with metadata and replies
  try {
    const meta = await getSiteSetting('messages_meta', {});
    const replies = await getSiteSetting('messages_replies', []);

    return rawMessages.map((msg: any) => {
      const id = msg.id || '';
      const msgMeta = meta[id] || {};
      return {
        ...msg,
        read: msgMeta.read ?? false,
        starred: msgMeta.starred ?? false,
        spam: msgMeta.spam ?? false,
        trash: msgMeta.trash ?? false,
        replied: msgMeta.replied ?? false,
        replies: (replies || []).filter((r: any) => r.messageId === id)
      };
    });
  } catch (err) {
    console.warn('Failed to merge messages metadata/replies:', err);
    return rawMessages;
  }
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
        .insert([{
          name: m.name,
          email: m.email,
          message: m.message
        }])
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

  let supabaseErrorMsg = '';
  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { error } = await adminClient
        .from('messages')
        .delete()
        .eq('id', id);
      
      if (!error) return true;
      supabaseErrorMsg = error.message;
      console.warn('Supabase deleteMessage query error:', error.message);
    } catch (err: any) {
      supabaseErrorMsg = err.message || String(err);
      console.warn('Supabase deleteMessage failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  let localErrorMsg = '';
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(MESSAGES_FILE, 'utf-8');
      const messages = JSON.parse(content) as Message[];
      const filtered = messages.filter(x => x.id !== id);
      await fs.writeFile(MESSAGES_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      
      // Clean up metadata and replies too
      try {
        const meta = await getSiteSetting('messages_meta', {});
        if (meta[id]) {
          delete meta[id];
          await saveSiteSetting('messages_meta', meta);
        }
        const replies = await getSiteSetting('messages_replies', []);
        const filteredReplies = replies.filter((r: any) => r.messageId !== id);
        if (replies.length !== filteredReplies.length) {
          await saveSiteSetting('messages_replies', filteredReplies);
        }
      } catch (cleanErr) {
        console.warn('Failed to clean up deleted message metadata:', cleanErr);
      }

      return true;
    } catch (err: any) {
      localErrorMsg = err.message || String(err);
      console.error('Error deleting message locally:', err);
    }
  }

  const errorParts = [];
  if (supabaseErrorMsg) errorParts.push(`Supabase error: ${supabaseErrorMsg}`);
  if (localErrorMsg) errorParts.push(`Local storage fallback error: ${localErrorMsg}`);
  
  throw new Error(errorParts.join(' | ') || 'Failed to delete message.');
}

export async function updateMessageMeta(
  id: string,
  updates: Partial<{ read: boolean; starred: boolean; spam: boolean; trash: boolean; replied: boolean }>
): Promise<boolean> {
  try {
    const meta = await getSiteSetting('messages_meta', {});
    const existing = meta[id] || { read: false, starred: false, spam: false, trash: false, replied: false };
    meta[id] = { ...existing, ...updates };
    
    const result = await saveSiteSetting('messages_meta', meta);
    return result.success;
  } catch (err) {
    console.error('Error updating message metadata:', err);
    return false;
  }
}

export async function addMessageReply(reply: {
  messageId: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; data?: MessageReply; error?: string }> {
  try {
    const newReply: MessageReply = {
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      messageId: reply.messageId,
      subject: reply.subject,
      message: reply.message,
      sent_at: new Date().toISOString()
    };

    const replies = await getSiteSetting('messages_replies', []);
    replies.unshift(newReply);
    
    const result = await saveSiteSetting('messages_replies', replies);
    if (!result.success) {
      return { success: false, error: result.error || 'Failed to save replies.' };
    }

    // Also mark original message as replied and read
    await updateMessageMeta(reply.messageId, { replied: true, read: true });

    return { success: true, data: newReply };
  } catch (err: any) {
    console.error('Error saving reply:', err);
    return { success: false, error: err.message || 'Error saving reply' };
  }
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
  is_spam?: boolean;
  spam_reason?: string;
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
      // Exclude string-based 'id' and spam classification fields from the Supabase payload 
      // to let the database generate a UUID primary key and prevent column-not-found errors
      const { id, is_spam, spam_reason, ...supabasePayload } = newVisit;
      const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      
      let payload;
      if (v.id && isUuid(v.id)) {
        const { is_spam: _, spam_reason: __, ...cleanedVisit } = newVisit;
        payload = cleanedVisit;
      } else {
        payload = supabasePayload;
      }

      const { data, error } = await adminClient
        .from('site_visits')
        .insert([payload])
        .select()
        .single();
      
      if (!error && data) return data;
      if (error) {
        console.warn('Supabase saveVisit query error:', error.message);
      }
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

  let visits: VisitSession[] = [];
  let success = false;

  const readClient = supabaseAdmin || supabase;
  if (readClient) {
    try {
      const { data, error } = await readClient
        .from('site_visits')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        visits = data;
        success = true;
      }
    } catch (err) {
      console.warn('Supabase getVisits failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (!success && isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(VISITS_FILE, 'utf-8');
      visits = JSON.parse(content) as VisitSession[];
    } catch (err) {
      console.error('Error reading local visits:', err);
    }
  }

  return classifyVisits(visits);
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
    font_file_url: 'https://api.hakobian.am/libs/v1/fonts/hdesign.ttf',
    download_url: 'https://api.hakobian.am/libs/v1/fonts/hdesign.ttf',
    created_at: '2026-06-27T00:00:00.000Z'
  }
];

export async function getFonts(): Promise<Font[]> {
  await ensureLocalDbFiles();
  
  let localFonts: Font[] = [];
  if (isServer) {
    try {
      const fs = getFs();
      const content = await fs.readFile(FONTS_FILE, 'utf-8');
      localFonts = JSON.parse(content) as Font[];
    } catch (err) {
      console.warn('Failed to read local fonts:', err);
    }
  }

  const readClient = supabaseAdmin || supabase;
  let dbFonts: Font[] = [];
  let supabaseSuccess = false;

  if (readClient) {
    try {
      const { data, error } = await readClient
        .from('fonts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbFonts = data;
        supabaseSuccess = true;
      } else if (error) {
        console.warn('Supabase getFonts query error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase getFonts failed, falling back to local storage:', err);
    }
  }

  const deletedSeeds = await getSiteSetting('deleted_seed_fonts', []);
  const deletedSeedsSet = new Set(deletedSeeds || []);

  const currentDbFonts = supabaseSuccess ? dbFonts : [];
  const dynamicIds = new Set([...currentDbFonts.map((x: any) => x.id), ...localFonts.map(x => x.id)]);
  const filteredSeeds = defaultSeededFonts.filter((x: Font) => !dynamicIds.has(x.id) && !deletedSeedsSet.has(x.id));
  
  if (supabaseSuccess) {
    const localFiltered = localFonts.filter(x => !dynamicIds.has(x.id));
    return [...dbFonts, ...localFiltered, ...filteredSeeds];
  }

  return [...localFonts, ...filteredSeeds];
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
  
  const isSeed = id.startsWith('hdesign-font') || id.startsWith('seed-');
  let seedRegistered = false;

  if (isSeed) {
    try {
      const deletedSeeds = await getSiteSetting('deleted_seed_fonts', []);
      if (!deletedSeeds.includes(id)) {
        deletedSeeds.push(id);
        await saveSiteSetting('deleted_seed_fonts', deletedSeeds);
      }
      seedRegistered = true;
    } catch (err) {
      console.warn('Failed to register deleted seed font in settings:', err);
    }
  }

  let supabaseErrorMsg = '';
  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { error } = await adminClient
        .from('fonts')
        .delete()
        .eq('id', id);
      
      if (!error) {
        if (isSeed) return true;
      } else {
        supabaseErrorMsg = error.message;
        console.warn('Supabase deleteFont query error:', error.message);
      }
    } catch (err: any) {
      supabaseErrorMsg = err.message || String(err);
      console.warn('Supabase deleteFont failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  let localErrorMsg = '';
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(FONTS_FILE, 'utf-8');
      const fonts = JSON.parse(content) as Font[];
      const filtered = fonts.filter(x => x.id !== id);
      await fs.writeFile(FONTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    } catch (err: any) {
      localErrorMsg = err.message || String(err);
      console.error('Error deleting font locally:', err);
    }
  }

  if (isSeed && seedRegistered) {
    return true;
  }

  const errorParts = [];
  if (supabaseErrorMsg) errorParts.push(`Supabase error: ${supabaseErrorMsg}`);
  if (localErrorMsg) errorParts.push(`Local storage fallback error: ${localErrorMsg}`);
  
  throw new Error(errorParts.join(' | ') || 'Failed to delete font.');
}

// ══════════════════════════════════════════════════════════════════════════════
// SUBSCRIBERS (Newsletter subscriptions)
// ══════════════════════════════════════════════════════════════════════════════

export type Subscriber = {
  id?: string;
  email: string;
  created_at?: string;
};

export async function getSubscribers(): Promise<Subscriber[]> {
  await ensureLocalDbFiles();

  const readClient = supabaseAdmin || supabase;
  if (readClient) {
    try {
      const { data, error } = await readClient
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase getSubscribers failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(SUBSCRIBERS_FILE, 'utf-8');
      return JSON.parse(content) as Subscriber[];
    } catch (err) {
      console.error('Error reading local subscribers:', err);
    }
  }

  return [];
}

export async function saveSubscriber(s: Subscriber): Promise<{ success: boolean; data?: Subscriber; error?: string }> {
  await ensureLocalDbFiles();
  const newSubscriber = {
    id: s.id || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    ...s,
    created_at: s.created_at || new Date().toISOString()
  };

  let supabaseErrorMsg = '';

  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      // Check if email already exists in Supabase
      const { data: existing } = await adminClient
        .from('subscribers')
        .select('id')
        .eq('email', s.email)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'Email already subscribed.' };
      }

      const { data, error } = await adminClient
        .from('subscribers')
        .insert([{ email: s.email }])
        .select()
        .single();
      
      if (!error && data) return { success: true, data };
      if (error) {
        supabaseErrorMsg = error.message;
        console.warn('Supabase saveSubscriber query error:', error.message);
      }
    } catch (err: any) {
      supabaseErrorMsg = err.message || String(err);
      console.warn('Supabase saveSubscriber failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(SUBSCRIBERS_FILE, 'utf-8');
      const subscribers = JSON.parse(content) as Subscriber[];
      
      if (subscribers.some(x => x.email.toLowerCase() === s.email.toLowerCase())) {
        return { success: false, error: 'Email already subscribed.' };
      }

      subscribers.unshift(newSubscriber);
      await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf-8');
      return { success: true, data: newSubscriber };
    } catch (err: any) {
      console.error('Error saving subscriber locally:', err);
      return { success: false, error: `Supabase error: ${supabaseErrorMsg}. Local storage fallback error: ${err.message}` };
    }
  }

  return { success: false, error: supabaseErrorMsg || 'No server/database connection' };
}

export async function deleteSubscriber(id: string): Promise<boolean> {
  await ensureLocalDbFiles();

  let supabaseErrorMsg = '';
  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { error } = await adminClient
        .from('subscribers')
        .delete()
        .eq('id', id);
      
      if (!error) return true;
      supabaseErrorMsg = error.message;
      console.warn('Supabase deleteSubscriber query error:', error.message);
    } catch (err: any) {
      supabaseErrorMsg = err.message || String(err);
      console.warn('Supabase deleteSubscriber failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  let localErrorMsg = '';
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(SUBSCRIBERS_FILE, 'utf-8');
      const subscribers = JSON.parse(content) as Subscriber[];
      const filtered = subscribers.filter(x => x.id !== id);
      await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    } catch (err: any) {
      localErrorMsg = err.message || String(err);
      console.error('Error deleting subscriber locally:', err);
    }
  }

  const errorParts = [];
  if (supabaseErrorMsg) errorParts.push(`Supabase error: ${supabaseErrorMsg}`);
  if (localErrorMsg) errorParts.push(`Local storage fallback error: ${localErrorMsg}`);
  
  throw new Error(errorParts.join(' | ') || 'Failed to delete subscriber.');
}

