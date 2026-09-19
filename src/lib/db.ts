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
const APPS_FILE = isServer ? path.join(DATA_DIR, 'apps.json') : '';
const APP_REVIEWS_FILE = isServer ? path.join(DATA_DIR, 'app_reviews.json') : '';
const APP_BUG_REPORTS_FILE = isServer ? path.join(DATA_DIR, 'app_bug_reports.json') : '';

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

    // Check and create apps.json if missing
    try {
      await fs.access(APPS_FILE);
    } catch {
      await fs.writeFile(APPS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }

    // Check and create app_reviews.json if missing
    try {
      await fs.access(APP_REVIEWS_FILE);
    } catch {
      await fs.writeFile(APP_REVIEWS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }

    // Check and create app_bug_reports.json if missing
    try {
      await fs.access(APP_BUG_REPORTS_FILE);
    } catch {
      await fs.writeFile(APP_BUG_REPORTS_FILE, JSON.stringify([], null, 2), 'utf-8');
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
    subtitle: 'Բրենդինգ և Փաթեթավորում | Branding & Packaging',
    bg: '#d32f2f',
    image_url: '',
    category: 'Branding | Branding',
    client: 'Pasta House Co. | Pasta House Co.',
    year: '2025',
    details: 'Պաստայի նոր արտադրության համար ստեղծված բրենդավորում, որը ներառում է լոգոյի դիզայն, փաթեթավորման էսքիզներ և վիզուալ հաղորդակցության ռազմավարություն: Օգտագործվել են տաք գունային երանգներ և ավանդական իտալական շունչ: | Branding created for new pasta production, including logo design, packaging sketches, and visual communication strategy. Warm tones and traditional Italian spirit were utilized.'
  },
  {
    id: 'seed-2',
    title: '11...',
    subtitle: 'Ստեղծարար Պաստառներ | Creative Posters',
    bg: '#e65100',
    image_url: '',
    category: 'Poster Design | Poster Design',
    client: 'Creative Hub Yerevan | Creative Hub Yerevan',
    year: '2025',
    details: '11-րդ ամենամյա ստեղծարար ցուցահանդեսի համար մշակված պաստառներ: Դիզայնը հիմնված է կոնցեպտուալ տիպոգրաֆիկայի և մինիմալիստական երկրաչափական պատկերների համադրության վրա: | Posters developed for the 11th annual creative exhibition. The design is based on a combination of conceptual typography and minimalist geometric shapes.'
  },
  {
    id: 'seed-3',
    title: 'Posters',
    subtitle: 'Ցուցահանդեսի Բրենդավորում | Exhibition Branding',
    bg: '#880e4f',
    image_url: '',
    category: 'Identity | Identity',
    client: 'Art Gallery | Art Gallery',
    year: '2024',
    details: 'Ժամանակակից արվեստի ցուցասրահի համար մշակված կորպորատիվ ոճ: Նախագիծը ներառում է այցեքարտեր, պաստառներ, սոցիալական մեդիայի ձևավորումներ և կայքի ինտերֆեյսի վիզուալ ուղեցույցներ: | Corporate style developed for a contemporary art gallery. The project includes business cards, posters, social media designs, and visual guidelines for website interfaces.'
  },
  {
    id: 'seed-4',
    title: 'Teal Lines',
    subtitle: 'Մինիմալիստական Արտ | Minimalist Art',
    bg: '#004d40',
    image_url: '',
    category: 'Digital Art | Digital Art',
    client: 'Personal Project | Personal Project',
    year: '2026',
    details: 'Երկրաչափական գծերից և մուգ կապտականաչավուն երանգներից կազմված աբստրակտ արտ նախագիծ, որն ուսումնասիրում է տարածության և սիմետրիայի հարաբերությունները: | Abstract art project consisting of geometric lines and dark teal tones exploring relationships of space and symmetry.'
  },
  {
    id: 'seed-5',
    title: 'Mobile UI',
    subtitle: 'Մոբայլ Հավելվածի Ինտերֆեյս | Mobile App Interface',
    bg: '#311b92',
    image_url: '',
    category: 'UI/UX Design | UI/UX Design',
    client: 'FinTech Startup | FinTech Startup',
    year: '2025',
    details: 'Ֆինանսական տեխնոլոգիաների ոլորտի նոր ստարտափի համար ստեղծված մոբայլ հավելվածի ինտերֆեյս: Հիմնական շեշտը դրվել է օգտագործելիության (UX), մաքուր տեսքի և հարմարավետ անցումների (Animations) վրա: | Mobile application interface created for a financial tech startup. Primary emphasis was placed on usability (UX), clean aesthetic, and fluid transitions (Animations).'
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
    font_file_url: '/HDesign.ttf',
    download_url: '/HDesign.ttf',
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

// ══════════════════════════════════════════════════════════════════════════════
// APPS & PLUGINS
// ══════════════════════════════════════════════════════════════════════════════

export type AppItem = {
  id: string;
  title_am: string;
  title_en: string;
  short_desc_am?: string;
  short_desc_en?: string;
  description_md_am?: string;
  description_md_en?: string;
  host_app: string;
  host_app_icon?: string;
  app_type: 'plugin' | 'standalone';
  is_paid: boolean;
  price: number;
  currency?: string;
  download_url?: string;
  store_url?: string;
  repository_url?: string;
  repository_type?: string;
  cover_image?: string;
  gallery_images: string[];
  languages?: string[];
  version: string;
  release_date: string;
  downloads_count?: number;
  is_draft?: boolean;
  status?: 'published' | 'draft';
  created_at?: string;
  updated_at?: string;
};

export type AppReview = {
  id: string;
  app_id: string;
  user_name: string;
  user_email?: string;
  is_anonymous: boolean;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export type AppBugReport = {
  id: string;
  app_id: string;
  app_title?: string;
  user_name: string;
  user_email: string;
  subject: string;
  description: string;
  version?: string;
  os?: string;
  media_files?: string[];
  status: 'new' | 'investigating' | 'resolved' | 'closed';
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
};

export const defaultSeededApps: AppItem[] = [
  {
    id: 'vector-grid-master',
    title_am: 'Vector Grid Master',
    title_en: 'Vector Grid Master',
    short_desc_am: 'Պրոֆեսիոնալ ցանցային գեներատոր Adobe Illustrator-ի համար։ Արագացնում է իզոմետրիկ և մոդուլային ցանցերի ստեղծումը։',
    short_desc_en: 'Professional grid generator for Adobe Illustrator. Speeds up isometric and modular grid creation.',
    description_md_am: `## Vector Grid Master

**Vector Grid Master**-ը նախատեսված է Adobe Illustrator-ում բարդ երկրաչափական, իզոմետրիկ և մոդուլային ցանցեր արագ ստեղծելու համար։

### Հիմնական հնարավորությունները
* **Մեկ սեղմումով ցանցերի գեներացիա՝** իզոմետրիկ, աքսոնոմետրիկ, մոդուլային և ոսկե հատման ցանցեր։
* **Հեշտ ինտեգրացիա՝** աշխատում է Illustrator CC 2021+ տարբերակների հետ։
* **Ավտոմատ ուղեցույցներ (Smart Guides)՝** ստեղծված ցանցը կարող է վերածվել սովորական Guides շերտի։
* **Կարգավորելի քայլեր՝** կարգավորեք անկյունները, քայլի հեռավորությունները և գծերի գույնը։

### Տեղադրում
1. Ներբեռնեք ZIP ֆայլը։
2. Տեղադրեք \`Scripts\` թղթապանակում (Adobe Illustrator > Presets > Scripts):
3. Վերագործարկեք Illustrator-ը և ընտրեք File > Scripts > Vector Grid Master:`,
    description_md_en: `## Vector Grid Master

**Vector Grid Master** is designed for fast creation of complex geometric, isometric, and modular grids in Adobe Illustrator.

### Key Features
* **One-click grid generation:** Isometric, axonometric, modular, and Golden Ratio grids.
* **Seamless integration:** Works with Illustrator CC 2021+.
* **Automatic Guides:** Easily convert created grids into native Smart Guides.
* **Customizable steps:** Fine-tune angles, spacing, and stroke colors.

### Installation
1. Download the ZIP file.
2. Place into the \`Scripts\` folder (Adobe Illustrator > Presets > Scripts).
3. Restart Illustrator and run via File > Scripts > Vector Grid Master.`,
    host_app: 'Adobe Illustrator',
    host_app_icon: '/icons/illustrator.svg',
    app_type: 'plugin',
    is_paid: false,
    price: 0,
    currency: 'AMD',
    download_url: '/apps/vector-grid-master.zip',
    store_url: '',
    cover_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80'
    ],
    languages: ['Հայերեն', 'English'],
    version: 'v1.2.0',
    release_date: '2026-03-10',
    downloads_count: 142,
    is_draft: false,
    status: 'published',
    created_at: '2026-03-10T10:00:00.000Z',
    updated_at: '2026-03-10T10:00:00.000Z'
  },
  {
    id: 'motion-keyframer-pro',
    title_am: 'Motion Keyframer Pro',
    title_en: 'Motion Keyframer Pro',
    short_desc_am: 'After Effects-ի հզոր գործիք արագ և հարթ անիմացիոն կորեր (Easing Curves) ստանալու համար։',
    short_desc_en: 'Powerful After Effects tool for fast and smooth easing curves and spring physics.',
    description_md_am: `## Motion Keyframer Pro

**Motion Keyframer Pro**-ն ապահովում է անիմացիաների կատարյալ դինամիկա և հարթություն՝ խնայելով ժամեր After Effects Graph Editor-ում։

### Հնարավորություններ
* **30+ պատրաստի Easing Presets** (Elastic, Bounce, Cubic Bezier, Spring)։
* **Keyframe Staggering**՝ շերտերի ավտոմատ հաջորդական շեղում մեկ կտտոցով։
* **Custom Curve Editor**՝ ինտերակտիվ վիզուալ կորերի խմբագրիչ։
* **Expressions Baking**՝ ծանր արտահայտությունները վերածում է թեթև keyframe-ների։

### Համատեղելիություն
* After Effects CC 2022, 2023, 2024, 2025, 2026
* Windows & macOS (Apple Silicon native)`,
    description_md_en: `## Motion Keyframer Pro

**Motion Keyframer Pro** delivers buttery smooth animation curves and spring dynamics, saving hours in the After Effects Graph Editor.

### Features
* **30+ Curated Easing Presets** (Elastic, Bounce, Cubic Bezier, Spring).
* **Keyframe Staggering:** Automatic sequential layer offsets in one click.
* **Custom Curve Editor:** Interactive visual spline controller.
* **Expressions Baking:** Bake complex math expressions into lightweight keys.

### Compatibility
* After Effects CC 2022-2026
* Windows & macOS (Native Apple Silicon)`,
    host_app: 'After Effects',
    host_app_icon: '/icons/after-effects.svg',
    app_type: 'plugin',
    is_paid: true,
    price: 9500,
    currency: 'AMD',
    download_url: '',
    store_url: 'https://aescripts.com',
    cover_image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80'
    ],
    languages: ['English', 'Հայերեն'],
    version: 'v2.1.4',
    release_date: '2026-02-15',
    downloads_count: 89,
    is_draft: false,
    status: 'published',
    created_at: '2026-02-15T12:00:00.000Z',
    updated_at: '2026-02-15T12:00:00.000Z'
  },
  {
    id: 'cad-parametric-generator',
    title_am: 'Blender Parametric Generator',
    title_en: 'Blender Parametric Generator',
    short_desc_am: 'Blender-ի խրվակ՝ պարամետրիկ երկրաչափական նախշերի և 3D ֆասադների համար։',
    short_desc_en: 'Blender addon for parametric geometric patterns and 3D architectural facades.',
    description_md_am: `## Blender Parametric Generator

Blender-ում ճարտարապետական և արդյունաբերական դիզայնի համար նախատեսված պարամետրիկ գեներատոր։

### Առավելությունները
* Անվճար և բաց կոդով (Open Source)։
* Ինտերակտիվ պարամետրեր՝ հաստություն, շառավիղ, բարձրություն և բջիջների խտություն։
* Ուղիղ արտահանում STL և OBJ ֆորմատներով 3D տպագրության համար։`,
    description_md_en: `## Blender Parametric Generator

Parametric facade and pattern generator designed for Blender architectural and product design.

### Highlights
* 100% Free and Open Source.
* Interactive parameters: thickness, radius, height, cell density.
* Direct export to STL and OBJ for 3D printing and rendering.`,
    host_app: 'Blender',
    host_app_icon: '/icons/blender.svg',
    app_type: 'plugin',
    is_paid: false,
    price: 0,
    currency: 'AMD',
    download_url: '/apps/cad-parametric-generator.zip',
    store_url: '',
    cover_image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1200&auto=format&fit=crop&q=80'
    ],
    languages: ['English'],
    version: 'v1.0.1',
    release_date: '2026-01-20',
    downloads_count: 54,
    is_draft: false,
    status: 'published',
    created_at: '2026-01-20T08:00:00.000Z',
    updated_at: '2026-01-20T08:00:00.000Z'
  },
  {
    id: 'color-harmony-studio',
    title_am: 'Color Harmony Studio',
    title_en: 'Color Harmony Studio',
    short_desc_am: 'Առանձին ծրագիր (Standalone App) դիզայներների համար՝ գունային գամմաներ ստեղծելու և արտահանելու համար։',
    short_desc_en: 'Standalone desktop app for designers to generate, test contrast, and export color palettes.',
    description_md_am: `## Color Harmony Studio

**Color Harmony Studio**-ն ինքնուրույն աշխատող հավելված է (Windows & Mac), որը հնարավորություն է տալիս կառուցել գունային ներդաշնակություններ, ստուգել WCAG կոնտրաստը և արտահանել CSS, ASE, SVG և JSON ֆորմատներով։

### Ինչու՞ օգտագործել
* Չի պահանջում որևէ այլ ծրագրի առկայություն։
* Իրական ժամանակում WCAG AA / AAA կոնտրաստի ստուգիչ։
* Գույների ներմուծում նկարներից։`,
    description_md_en: `## Color Harmony Studio

**Color Harmony Studio** is a standalone desktop application (Windows & Mac) to build harmonious palettes, test accessibility contrast, and export in CSS, ASE, SVG, and JSON.

### Why use it
* Standalone - no external host software required.
* Real-time WCAG AA / AAA accessibility contrast checker.
* Extract vibrant palettes from reference images.`,
    host_app: 'Standalone',
    host_app_icon: '/icons/app-window.svg',
    app_type: 'standalone',
    is_paid: false,
    price: 0,
    currency: 'AMD',
    download_url: '/apps/color-harmony-studio.zip',
    store_url: '',
    cover_image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&auto=format&fit=crop&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1200&auto=format&fit=crop&q=80'
    ],
    languages: ['Հայերեն', 'English', 'Русский'],
    version: 'v1.4.0',
    release_date: '2026-02-28',
    downloads_count: 210,
    is_draft: false,
    status: 'published',
    created_at: '2026-02-28T14:00:00.000Z',
    updated_at: '2026-02-28T14:00:00.000Z'
  }
];

export const defaultSeededAppReviews: AppReview[] = [
  {
    id: 'rev-seed-1',
    app_id: 'vector-grid-master',
    user_name: 'Արամ Գասպարյան',
    user_email: 'aram@example.com',
    is_anonymous: false,
    rating: 5,
    comment: 'Հիանալի խրվակ է։ Իզոմետրիկ իլյուստրացիաների ժամանակ իսկական փրկություն է, ժամանակի 70%-ը խնայում է։',
    status: 'approved',
    created_at: '2026-03-11T14:20:00.000Z'
  },
  {
    id: 'rev-seed-2',
    app_id: 'vector-grid-master',
    user_name: 'Անանուն',
    is_anonymous: true,
    rating: 5,
    comment: 'Շատ արագ է աշխատում Illustrator 2025-ի վրա, ոչ մի խնդիր չի առաջացել։ Շնորհակալություն։',
    status: 'approved',
    created_at: '2026-03-12T09:15:00.000Z'
  },
  {
    id: 'rev-seed-3',
    app_id: 'motion-keyframer-pro',
    user_name: 'Տիգրան Սարգսյան',
    user_email: 'tigran.motion@example.com',
    is_anonymous: false,
    rating: 5,
    comment: 'AE-ում նման գործիք վաղուց էր պետք։ Easing preset-ները շատ բնական են։ Արժե ամեն մի դրամը։',
    status: 'approved',
    created_at: '2026-02-20T16:40:00.000Z'
  }
];

export async function getApps(): Promise<AppItem[]> {
  await ensureLocalDbFiles();

  let localApps: AppItem[] = [];
  if (isServer) {
    try {
      const fs = getFs();
      const content = await fs.readFile(APPS_FILE, 'utf-8');
      localApps = JSON.parse(content) as AppItem[];
    } catch (err) {
      console.warn('Failed to read local apps:', err);
    }
  }

  const readClient = supabaseAdmin || supabase;
  let dbApps: AppItem[] = [];
  let supabaseSuccess = false;

  if (readClient) {
    try {
      const { data, error } = await readClient
        .from('apps')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbApps = data.map((x: any): AppItem => {
          const isDraft = x.status === 'draft' || !!x.is_draft;
          return {
            ...x,
            repository_url: x.repository_url || '',
            repository_type: x.repository_type || 'github',
            gallery_images: Array.isArray(x.gallery_images)
              ? x.gallery_images
              : (typeof x.gallery_images === 'string' ? JSON.parse(x.gallery_images || '[]') : []),
            languages: Array.isArray(x.languages)
              ? x.languages
              : (typeof x.languages === 'string'
                  ? (x.languages.startsWith('[') ? JSON.parse(x.languages || '[]') : x.languages.split(',').map((s: string) => s.trim()).filter(Boolean))
                  : ['Հայերեն', 'English']),
            is_draft: isDraft,
            status: isDraft ? 'draft' : 'published'
          };
        });
        supabaseSuccess = true;
      } else if (error) {
        console.warn('Supabase getApps query error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase getApps failed, falling back to local storage:', err);
    }
  }

  const deletedSeeds = await getSiteSetting('deleted_seed_apps', []);
  const deletedSeedsSet = new Set(deletedSeeds || []);

  // Normalize localApps as well
  const normalizedLocalApps: AppItem[] = localApps.map(x => {
    const isDraft = x.status === 'draft' || !!x.is_draft;
    return {
      ...x,
      repository_url: x.repository_url || '',
      repository_type: x.repository_type || 'github',
      languages: Array.isArray(x.languages) ? x.languages : ['Հայերեն', 'English'],
      is_draft: isDraft,
      status: isDraft ? 'draft' : 'published'
    };
  });

  const currentDbApps = supabaseSuccess ? dbApps : [];
  const dynamicIds = new Set([...currentDbApps.map((x: any) => x.id), ...normalizedLocalApps.map(x => x.id)]);
  const filteredSeeds = defaultSeededApps.filter((x: AppItem) => !dynamicIds.has(x.id) && !deletedSeedsSet.has(x.id));

  if (supabaseSuccess) {
    const localMap = new Map(normalizedLocalApps.map(l => [l.id, l]));
    const mergedDbApps = dbApps.map(item => {
      const local = localMap.get(item.id);
      return {
        ...item,
        repository_url: item.repository_url || local?.repository_url || '',
        repository_type: item.repository_type || local?.repository_type || 'github'
      };
    });
    const localFiltered = normalizedLocalApps.filter(x => !new Set(dbApps.map(d => d.id)).has(x.id));
    return [...mergedDbApps, ...localFiltered, ...filteredSeeds];
  }

  return [...normalizedLocalApps, ...filteredSeeds];
}

export async function getAppById(id: string): Promise<AppItem | null> {
  const apps = await getApps();
  return apps.find(a => a.id === id) || null;
}

export async function saveApp(app: AppItem): Promise<AppItem | null> {
  await ensureLocalDbFiles();
  const now = new Date().toISOString();
  const isDraft = app.status === 'draft' || !!app.is_draft;
  const languagesList = Array.isArray(app.languages)
    ? app.languages
    : (typeof app.languages === 'string'
        ? (app.languages as string).split(',').map(s => s.trim()).filter(Boolean)
        : ['Հայերեն']);

  const newApp: AppItem = {
    ...app,
    repository_url: app.repository_url || '',
    repository_type: app.repository_type || 'github',
    languages: languagesList.length > 0 ? languagesList : ['Հայերեն'],
    is_draft: isDraft,
    status: isDraft ? 'draft' : 'published',
    gallery_images: Array.isArray(app.gallery_images) ? app.gallery_images : [],
    created_at: app.created_at || now,
    updated_at: now
  };

  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      let { data, error } = await adminClient
        .from('apps')
        .upsert(newApp)
        .select()
        .single();

      // If column does not exist yet on Supabase, retry without new columns
      if (error && error.message && (error.message.includes('languages') || error.message.includes('is_draft') || error.message.includes('status') || error.message.includes('repository_url') || error.message.includes('repository_type'))) {
        const { languages, is_draft, status, repository_url, repository_type, ...legacyApp } = newApp as any;
        const retry = await adminClient.from('apps').upsert(legacyApp).select().single();
        data = retry.data;
        error = retry.error;
      }

      if (!error && data) {
        // Also keep local file in sync
        if (isServer) {
          try {
            const fs = getFs();
            const content = await fs.readFile(APPS_FILE, 'utf-8');
            const apps = JSON.parse(content) as AppItem[];
            const index = apps.findIndex(x => x.id === app.id);
            if (index !== -1) apps[index] = newApp;
            else apps.unshift(newApp);
            await fs.writeFile(APPS_FILE, JSON.stringify(apps, null, 2), 'utf-8');
          } catch (e) { /* ignore */ }
        }

        return {
          ...newApp,
          ...data,
          repository_url: newApp.repository_url || data?.repository_url || '',
          repository_type: newApp.repository_type || data?.repository_type || 'github',
          languages: newApp.languages,
          is_draft: newApp.is_draft,
          status: newApp.status,
          gallery_images: Array.isArray(data.gallery_images)
            ? data.gallery_images
            : (typeof data.gallery_images === 'string' ? JSON.parse(data.gallery_images || '[]') : [])
        };
      }
      console.warn('Supabase saveApp error:', error?.message);
    } catch (err) {
      console.warn('Supabase saveApp failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(APPS_FILE, 'utf-8');
      const apps = JSON.parse(content) as AppItem[];

      const index = apps.findIndex(x => x.id === app.id);
      if (index !== -1) {
        apps[index] = newApp;
      } else {
        apps.unshift(newApp);
      }

      await fs.writeFile(APPS_FILE, JSON.stringify(apps, null, 2), 'utf-8');
      return newApp;
    } catch (err) {
      console.error('Error writing app locally:', err);
    }
  }

  return null;
}

export async function deleteApp(id: string): Promise<boolean> {
  await ensureLocalDbFiles();

  const isSeed = defaultSeededApps.some(s => s.id === id);
  let seedRegistered = false;

  if (isSeed) {
    try {
      const deletedSeeds = await getSiteSetting('deleted_seed_apps', []);
      if (!deletedSeeds.includes(id)) {
        deletedSeeds.push(id);
        await saveSiteSetting('deleted_seed_apps', deletedSeeds);
      }
      seedRegistered = true;
    } catch (err) {
      console.warn('Failed to register deleted seed app in settings:', err);
    }
  }

  let supabaseErrorMsg = '';
  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { error } = await adminClient
        .from('apps')
        .delete()
        .eq('id', id);

      if (!error) {
        if (isSeed) return true;
      } else {
        supabaseErrorMsg = error.message;
        console.warn('Supabase deleteApp query error:', error.message);
      }
    } catch (err: any) {
      supabaseErrorMsg = err.message || String(err);
      console.warn('Supabase deleteApp failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  let localErrorMsg = '';
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(APPS_FILE, 'utf-8');
      const apps = JSON.parse(content) as AppItem[];
      const filtered = apps.filter(x => x.id !== id);
      await fs.writeFile(APPS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    } catch (err: any) {
      localErrorMsg = err.message || String(err);
      console.error('Error deleting app locally:', err);
    }
  }

  if (isSeed && seedRegistered) {
    return true;
  }

  const errorParts = [];
  if (supabaseErrorMsg) errorParts.push(`Supabase error: ${supabaseErrorMsg}`);
  if (localErrorMsg) errorParts.push(`Local storage fallback error: ${localErrorMsg}`);

  throw new Error(errorParts.join(' | ') || 'Failed to delete app.');
}

// ══════════════════════════════════════════════════════════════════════════════
// APP REVIEWS
// ══════════════════════════════════════════════════════════════════════════════

export async function getAppReviews(appId?: string, onlyApproved = true): Promise<AppReview[]> {
  await ensureLocalDbFiles();

  let localReviews: AppReview[] = [];
  if (isServer) {
    try {
      const fs = getFs();
      const content = await fs.readFile(APP_REVIEWS_FILE, 'utf-8');
      localReviews = JSON.parse(content) as AppReview[];
    } catch (err) {
      console.warn('Failed to read local app reviews:', err);
    }
  }

  const readClient = supabaseAdmin || supabase;
  let dbReviews: AppReview[] = [];
  let supabaseSuccess = false;

  if (readClient) {
    try {
      let query = readClient
        .from('app_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (appId) {
        query = query.eq('app_id', appId);
      }
      if (onlyApproved) {
        query = query.eq('status', 'approved');
      }

      const { data, error } = await query;

      if (!error && data) {
        dbReviews = data;
        supabaseSuccess = true;
      } else if (error) {
        console.warn('Supabase getAppReviews query error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase getAppReviews failed, falling back to local storage:', err);
    }
  }

  const currentDbReviews = supabaseSuccess ? dbReviews : [];
  const dynamicIds = new Set([...currentDbReviews.map((x: any) => x.id), ...localReviews.map(x => x.id)]);
  const filteredSeeds = defaultSeededAppReviews.filter((x: AppReview) => !dynamicIds.has(x.id));

  let allReviews: AppReview[] = [];
  if (supabaseSuccess) {
    const localFiltered = localReviews.filter(x => !dynamicIds.has(x.id));
    allReviews = [...dbReviews, ...localFiltered, ...filteredSeeds];
  } else {
    allReviews = [...localReviews, ...filteredSeeds];
  }

  if (appId) {
    allReviews = allReviews.filter(r => r.app_id === appId);
  }
  if (onlyApproved) {
    allReviews = allReviews.filter(r => r.status === 'approved');
  }

  return allReviews;
}

export async function saveAppReview(review: Omit<AppReview, 'id' | 'created_at'> & { id?: string; created_at?: string }): Promise<AppReview | null> {
  await ensureLocalDbFiles();
  const id = review.id || ('rev_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36));
  const newReview: AppReview = {
    ...review,
    id,
    created_at: review.created_at || new Date().toISOString()
  };

  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from('app_reviews')
        .upsert(newReview)
        .select()
        .single();

      if (!error && data) return data;
      console.warn('Supabase saveAppReview error:', error?.message);
    } catch (err) {
      console.warn('Supabase saveAppReview failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(APP_REVIEWS_FILE, 'utf-8');
      const reviews = JSON.parse(content) as AppReview[];

      const index = reviews.findIndex(x => x.id === id);
      if (index !== -1) {
        reviews[index] = newReview;
      } else {
        reviews.unshift(newReview);
      }

      await fs.writeFile(APP_REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
      return newReview;
    } catch (err) {
      console.error('Error writing app review locally:', err);
    }
  }

  return newReview;
}

export async function updateAppReviewStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<boolean> {
  await ensureLocalDbFiles();

  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { error } = await adminClient
        .from('app_reviews')
        .update({ status })
        .eq('id', id);

      if (!error) return true;
    } catch (err) {
      console.warn('Supabase updateAppReviewStatus failed:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(APP_REVIEWS_FILE, 'utf-8');
      const reviews = JSON.parse(content) as AppReview[];
      const index = reviews.findIndex(x => x.id === id);
      if (index !== -1) {
        reviews[index].status = status;
        await fs.writeFile(APP_REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
        return true;
      }
    } catch (err) {
      console.error('Error updating review status locally:', err);
    }
  }

  return false;
}

export async function deleteAppReview(id: string): Promise<boolean> {
  await ensureLocalDbFiles();

  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { error } = await adminClient
        .from('app_reviews')
        .delete()
        .eq('id', id);

      if (!error) return true;
    } catch (err) {
      console.warn('Supabase deleteAppReview failed:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(APP_REVIEWS_FILE, 'utf-8');
      const reviews = JSON.parse(content) as AppReview[];
      const filtered = reviews.filter(x => x.id !== id);
      await fs.writeFile(APP_REVIEWS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Error deleting review locally:', err);
    }
  }

  return false;
}

// ══════════════════════════════════════════════════════════════════════════════
// APP BUG REPORTS (Վրեպների Զեկույցներ)
// ══════════════════════════════════════════════════════════════════════════════

export async function getAppBugReports(appId?: string): Promise<AppBugReport[]> {
  await ensureLocalDbFiles();

  let localReports: AppBugReport[] = [];
  if (isServer) {
    try {
      const fs = getFs();
      const content = await fs.readFile(APP_BUG_REPORTS_FILE, 'utf-8');
      localReports = JSON.parse(content) as AppBugReport[];
    } catch (err) {
      console.warn('Failed to read local app bug reports:', err);
    }
  }

  const readClient = supabaseAdmin || supabase;
  let dbReports: AppBugReport[] = [];
  let supabaseSuccess = false;

  if (readClient) {
    try {
      let query = readClient
        .from('app_bug_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (appId) {
        query = query.eq('app_id', appId);
      }

      const { data, error } = await query;

      if (!error && data) {
        dbReports = data.map((d: any) => ({
          ...d,
          media_files: Array.isArray(d.media_files)
            ? d.media_files
            : typeof d.media_files === 'string'
              ? JSON.parse(d.media_files || '[]')
              : []
        }));
        supabaseSuccess = true;
      } else if (error) {
        console.warn('Supabase getAppBugReports query error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase getAppBugReports failed, falling back to local storage:', err);
    }
  }

  const currentDbReports = supabaseSuccess ? dbReports : [];
  const dynamicIds = new Set([...currentDbReports.map((x: any) => x.id), ...localReports.map(x => x.id)]);

  let allReports: AppBugReport[] = [];
  if (supabaseSuccess) {
    const localFiltered = localReports.filter(x => !dynamicIds.has(x.id));
    allReports = [...dbReports, ...localFiltered];
  } else {
    allReports = [...localReports];
  }

  if (appId) {
    allReports = allReports.filter(r => r.app_id === appId);
  }

  return allReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function saveAppBugReport(report: Omit<AppBugReport, 'id' | 'created_at'> & { id?: string; created_at?: string }): Promise<AppBugReport | null> {
  await ensureLocalDbFiles();
  const id = report.id || ('bug_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36));
  const newReport: AppBugReport = {
    ...report,
    id,
    media_files: Array.isArray(report.media_files) ? report.media_files : [],
    status: report.status || 'new',
    created_at: report.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from('app_bug_reports')
        .upsert(newReport)
        .select()
        .single();

      if (!error && data) return data;
      console.warn('Supabase saveAppBugReport error:', error?.message);
    } catch (err) {
      console.warn('Supabase saveAppBugReport failed, using local storage:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(APP_BUG_REPORTS_FILE, 'utf-8');
      const reports = JSON.parse(content) as AppBugReport[];
      const index = reports.findIndex(x => x.id === id);
      if (index !== -1) {
        reports[index] = newReport;
      } else {
        reports.unshift(newReport);
      }
      await fs.writeFile(APP_BUG_REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf-8');
      return newReport;
    } catch (err) {
      console.error('Error saving bug report locally:', err);
    }
  }

  return newReport;
}

export async function updateAppBugReport(id: string, updates: Partial<AppBugReport>): Promise<boolean> {
  await ensureLocalDbFiles();

  const payload = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { error } = await adminClient
        .from('app_bug_reports')
        .update(payload)
        .eq('id', id);

      if (!error) return true;
      console.warn('Supabase updateAppBugReport error:', error?.message);
    } catch (err) {
      console.warn('Supabase updateAppBugReport failed:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(APP_BUG_REPORTS_FILE, 'utf-8');
      const reports = JSON.parse(content) as AppBugReport[];
      const index = reports.findIndex(x => x.id === id);
      if (index !== -1) {
        reports[index] = { ...reports[index], ...payload };
        await fs.writeFile(APP_BUG_REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf-8');
        return true;
      }
    } catch (err) {
      console.error('Error updating bug report locally:', err);
    }
  }

  return false;
}

export async function deleteAppBugReport(id: string): Promise<boolean> {
  await ensureLocalDbFiles();

  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { error } = await adminClient
        .from('app_bug_reports')
        .delete()
        .eq('id', id);

      if (!error) return true;
    } catch (err) {
      console.warn('Supabase deleteAppBugReport failed:', err);
    }
  }

  // Fallback to local JSON database
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(APP_BUG_REPORTS_FILE, 'utf-8');
      const reports = JSON.parse(content) as AppBugReport[];
      const filtered = reports.filter(x => x.id !== id);
      await fs.writeFile(APP_BUG_REPORTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Error deleting bug report locally:', err);
    }
  }

  return false;
}


