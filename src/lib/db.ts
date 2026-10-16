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
const APP_DOWNLOADS_FILE = isServer ? path.join(DATA_DIR, 'app_downloads.json') : '';

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

    // Check and create app_downloads.json if missing
    try {
      await fs.access(APP_DOWNLOADS_FILE);
    } catch {
      await fs.writeFile(APP_DOWNLOADS_FILE, JSON.stringify([], null, 2), 'utf-8');
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
        .maybeSingle();
      
      if (!error && data) {
        return data.value;
      }
      if (error && error.code !== 'PGRST116') {
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

export const setSiteSetting = saveSiteSetting;

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

export type AppDownloadOption = {
  id?: string;
  name: string;
  url: string;
  file_size?: string;
  version?: string;
  icon?: string;
  os?: 'windows' | 'macos' | 'linux' | 'other';
  host_app?: string;
};

export type AppRepository = {
  id?: string;
  type: 'github' | 'gitlab' | 'bitbucket' | 'gitea' | 'code' | string;
  url: string;
  label?: string;
};

export type AppItem = {
  id: string;
  title_am: string;
  title_en: string;
  short_desc_am?: string;
  short_desc_en?: string;
  description_md_am?: string;
  description_md_en?: string;
  host_app: string;
  host_apps?: string[];
  host_app_icon?: string;
  app_type: 'plugin' | 'standalone';
  supported_os?: ('windows' | 'macos' | 'linux')[];
  is_paid: boolean;
  price: number;
  currency?: string;
  download_url?: string;
  downloads?: AppDownloadOption[];
  store_url?: string;
  repository_url?: string;
  repository_type?: string;
  repositories?: AppRepository[];
  cover_image?: string;
  video_url?: string;
  gallery_images: string[];
  languages?: string[];
  design_system?: string;
  version: string;
  release_date: string;
  file_size?: string;
  downloads_count?: number;
  avg_rating?: number;
  reviews_count?: number;
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
    file_size: '4.8 MB',
    downloads_count: 0,
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
    downloads_count: 0,
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
    downloads_count: 0,
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
    downloads_count: 0,
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
          let parsedDownloads = [];
          if (Array.isArray(x.downloads)) {
            parsedDownloads = x.downloads.filter((d: any) => d && d.url && !d.url.includes('example.com'));
          } else if (typeof x.downloads === 'string' && x.downloads.trim()) {
            try {
              parsedDownloads = (JSON.parse(x.downloads) || []).filter((d: any) => d && d.url && !d.url.includes('example.com'));
            } catch (e) {
              parsedDownloads = [];
            }
          }
          let parsedRepositories = [];
          if (Array.isArray(x.repositories)) {
            parsedRepositories = x.repositories.filter((r: any) => r && r.url && r.url.trim());
          } else if (typeof x.repositories === 'string' && x.repositories.trim()) {
            try {
              parsedRepositories = (JSON.parse(x.repositories) || []).filter((r: any) => r && r.url && r.url.trim());
            } catch (e) {
              parsedRepositories = [];
            }
          }
          if (parsedRepositories.length === 0 && x.repository_url && x.repository_url.trim()) {
            parsedRepositories = [{
              type: x.repository_type || 'github',
              url: x.repository_url.trim(),
              label: x.repository_type === 'gitlab' ? 'GitLab' : (x.repository_type === 'bitbucket' ? 'Bitbucket' : (x.repository_type === 'code' ? 'Code' : 'GitHub'))
            }];
          }

          return {
            ...x,
            repository_url: x.repository_url || (parsedRepositories[0]?.url || ''),
            repository_type: x.repository_type || (parsedRepositories[0]?.type || 'github'),
            repositories: parsedRepositories,
            downloads: parsedDownloads,
            video_url: x.video_url || '',
            gallery_images: Array.isArray(x.gallery_images)
              ? x.gallery_images
              : (typeof x.gallery_images === 'string' ? JSON.parse(x.gallery_images || '[]') : []),
            languages: Array.isArray(x.languages)
              ? x.languages
              : (typeof x.languages === 'string'
                  ? (x.languages.startsWith('[') ? JSON.parse(x.languages || '[]') : x.languages.split(',').map((s: string) => s.trim()).filter(Boolean))
                  : ['Հայերեն', 'English']),
            design_system: x.design_system || 'HDesign',
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
  const extMeta = await getSiteSetting('apps_extended_metadata', {});
  const appsBackupStore = await getSiteSetting('apps_backup_store', {});

  // Normalize localApps as well
  const normalizedLocalApps: AppItem[] = localApps.map(x => {
    const isDraft = x.status === 'draft' || !!x.is_draft;
    let parsedDownloads = [];
    if (Array.isArray(x.downloads)) {
      parsedDownloads = x.downloads.filter((d: any) => d && d.url && !d.url.includes('example.com'));
    } else if (typeof x.downloads === 'string' && (x.downloads as string).trim()) {
      try {
        parsedDownloads = (JSON.parse(x.downloads as string) || []).filter((d: any) => d && d.url && !d.url.includes('example.com'));
      } catch (e) {
        parsedDownloads = [];
      }
    }

    let parsedRepositories = [];
    if (Array.isArray(x.repositories)) {
      parsedRepositories = x.repositories.filter((r: any) => r && r.url && r.url.trim());
    } else if (typeof x.repositories === 'string' && (x.repositories as string).trim()) {
      try {
        parsedRepositories = (JSON.parse(x.repositories as string) || []).filter((r: any) => r && r.url && r.url.trim());
      } catch (e) {
        parsedRepositories = [];
      }
    }
    if (parsedRepositories.length === 0 && x.repository_url && x.repository_url.trim()) {
      parsedRepositories = [{
        type: x.repository_type || 'github',
        url: x.repository_url.trim(),
        label: x.repository_type === 'gitlab' ? 'GitLab' : (x.repository_type === 'bitbucket' ? 'Bitbucket' : (x.repository_type === 'code' ? 'Code' : 'GitHub'))
      }];
    }

    return {
      ...x,
      repository_url: x.repository_url || (parsedRepositories[0]?.url || ''),
      repository_type: x.repository_type || (parsedRepositories[0]?.type || 'github'),
      repositories: parsedRepositories,
      downloads: parsedDownloads,
      video_url: x.video_url || '',
      supported_os: Array.isArray(x.supported_os) ? x.supported_os : [],
      languages: Array.isArray(x.languages) ? x.languages : ['Հայերեն', 'English'],
      design_system: x.design_system || 'HDesign',
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
      const meta = (extMeta && extMeta[item.id]) ? extMeta[item.id] : {};
      const rawDownloads = (item.downloads && item.downloads.length > 0)
        ? item.downloads
        : ((meta.downloads && meta.downloads.length > 0) ? meta.downloads : (local?.downloads || []));
      const cleanDownloads = (rawDownloads || []).filter((d: any) => d && d.url && !d.url.includes('example.com'));

      const rawRepositories = (item.repositories && item.repositories.length > 0)
        ? item.repositories
        : ((meta.repositories && meta.repositories.length > 0) ? meta.repositories : (local?.repositories || []));
      const cleanRepositories = (rawRepositories || []).filter((r: any) => r && r.url && r.url.trim());

      return {
        ...item,
        downloads_count: Math.max(Number(item.downloads_count) || 0, Number(local?.downloads_count) || 0),
        supported_os: (Array.isArray(item.supported_os) && item.supported_os.length > 0)
          ? item.supported_os
          : (Array.isArray(meta.supported_os) && meta.supported_os.length > 0
              ? meta.supported_os
              : (local?.supported_os || [])),
        repository_url: item.repository_url || meta.repository_url || local?.repository_url || cleanRepositories[0]?.url || '',
        repository_type: item.repository_type || meta.repository_type || local?.repository_type || cleanRepositories[0]?.type || 'github',
        repositories: cleanRepositories,
        downloads: cleanDownloads,
        video_url: item.video_url || meta.video_url || local?.video_url || ''
      };
    });
    const knownIds = new Set([...dbApps.map(d => d.id), ...normalizedLocalApps.map(x => x.id)]);
    const backupList = Object.values(appsBackupStore || {}).filter((b: any) => b && b.id && !knownIds.has(b.id) && !deletedSeedsSet.has(b.id)) as AppItem[];
    const localFiltered = normalizedLocalApps.filter(x => !new Set(dbApps.map(d => d.id)).has(x.id));
    return [...mergedDbApps, ...backupList, ...localFiltered, ...filteredSeeds];
  }

  const knownIds = new Set(normalizedLocalApps.map(x => x.id));
  const backupList = Object.values(appsBackupStore || {}).filter((b: any) => b && b.id && !knownIds.has(b.id) && !deletedSeedsSet.has(b.id)) as AppItem[];
  return [...normalizedLocalApps, ...backupList, ...filteredSeeds];
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

  const supportedOsList = Array.isArray(app.supported_os) ? app.supported_os : [];
  const downloadsList = (Array.isArray(app.downloads) ? app.downloads : [])
    .filter(d => d && d.url && !d.url.includes('example.com'))
    .filter(d => !d.os || supportedOsList.length === 0 || supportedOsList.includes(d.os as any));
  const repositoriesList = (Array.isArray(app.repositories) ? app.repositories : [])
    .filter(r => r && r.url && r.url.trim());

  const primaryRepo = repositoriesList[0];
  const finalRepoUrl = (app.repository_url && app.repository_url.trim()) || primaryRepo?.url || '';
  const finalRepoType = (app.repository_type && app.repository_type.trim()) || primaryRepo?.type || 'github';

  const newApp: AppItem = {
    ...app,
    repository_url: finalRepoUrl,
    repository_type: finalRepoType,
    repositories: repositoriesList.length > 0 ? repositoriesList : (finalRepoUrl ? [{ type: finalRepoType, url: finalRepoUrl }] : []),
    languages: languagesList.length > 0 ? languagesList : ['Հայերեն'],
    design_system: (app.design_system && typeof app.design_system === 'string' && app.design_system.trim()) ? app.design_system.trim() : 'HDesign',
    downloads: downloadsList,
    supported_os: supportedOsList,
    is_draft: isDraft,
    status: isDraft ? 'draft' : 'published',
    gallery_images: Array.isArray(app.gallery_images) ? app.gallery_images : [],
    created_at: app.created_at || now,
    updated_at: now
  };

  // If this app was a deleted seed, remove it from deleted seeds list
  try {
    const deletedSeeds = await getSiteSetting('deleted_seed_apps', []);
    if (Array.isArray(deletedSeeds) && deletedSeeds.includes(newApp.id)) {
      await saveSiteSetting('deleted_seed_apps', deletedSeeds.filter((s: string) => s !== newApp.id));
    }
  } catch (e) { /* ignore */ }

  // Save extended metadata and backup to site_settings (persists on Supabase across sessions)
  try {
    const currentMeta = await getSiteSetting('apps_extended_metadata', {});
    currentMeta[newApp.id] = {
      downloads: newApp.downloads,
      supported_os: newApp.supported_os,
      repository_url: newApp.repository_url,
      repository_type: newApp.repository_type,
      repositories: newApp.repositories,
      video_url: newApp.video_url || ''
    };
    await saveSiteSetting('apps_extended_metadata', currentMeta);

    const appsBackup = await getSiteSetting('apps_backup_store', {});
    appsBackup[newApp.id] = newApp;
    await saveSiteSetting('apps_backup_store', appsBackup);
  } catch (err) {
    console.warn('Failed to save apps_extended_metadata or apps_backup_store:', err);
  }

  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      // 1. Build sanitized payload containing valid database columns
      const supabasePayload: Record<string, any> = {
        id: newApp.id,
        title_am: newApp.title_am,
        title_en: newApp.title_en,
        short_desc_am: newApp.short_desc_am || '',
        short_desc_en: newApp.short_desc_en || '',
        description_md_am: newApp.description_md_am || '',
        description_md_en: newApp.description_md_en || '',
        host_app: newApp.host_app || '',
        host_app_icon: newApp.host_app_icon || '',
        app_type: newApp.app_type,
        is_paid: !!newApp.is_paid,
        price: Number(newApp.price) || 0,
        currency: newApp.currency || 'AMD',
        download_url: newApp.download_url || '',
        store_url: newApp.store_url || '',
        cover_image: newApp.cover_image || '',
        gallery_images: newApp.gallery_images,
        languages: newApp.languages,
        design_system: newApp.design_system || 'HDesign',
        version: newApp.version || 'v1.0.0',
        release_date: newApp.release_date || now.split('T')[0],
        downloads_count: Number(newApp.downloads_count) || 0,
        is_draft: isDraft,
        status: isDraft ? 'draft' : 'published',
        downloads: newApp.downloads,
        supported_os: newApp.supported_os,
        repository_url: newApp.repository_url,
        repository_type: newApp.repository_type,
        host_apps: Array.isArray((app as any).host_apps) ? (app as any).host_apps : (newApp.host_app ? [newApp.host_app] : []),
        repositories: newApp.repositories,
        file_size: newApp.file_size || '',
        created_at: newApp.created_at || now,
        updated_at: now
      };

      if (newApp.video_url) {
        supabasePayload.video_url = newApp.video_url;
      }

      let { data, error } = await adminClient
        .from('apps')
        .upsert(supabasePayload)
        .select()
        .single();

      // If missing column error (PGRST204), remove unknown columns and retry
      if (error && (error.code === 'PGRST204' || (error.message && error.message.includes('column')))) {
        console.warn('Supabase schema cache warning on saveApp, retrying with sanitized columns:', error.message);
        if (supabasePayload.video_url !== undefined) {
          delete supabasePayload.video_url;
        }

        const colMatch = error.message.match(/'([^']+)' column/) || error.message.match(/column '([^']+)'/);
        if (colMatch && colMatch[1] && supabasePayload[colMatch[1]] !== undefined) {
          delete supabasePayload[colMatch[1]];
        }

        const retry = await adminClient.from('apps').upsert(supabasePayload).select().single();
        data = retry.data;
        error = retry.error;

        // If another column fails, retry once more with absolute core columns
        if (error && error.code === 'PGRST204') {
          const minimalCore: Record<string, any> = {
            id: newApp.id,
            title_am: newApp.title_am,
            title_en: newApp.title_en,
            host_app: newApp.host_app || 'FontLab',
            app_type: newApp.app_type || 'plugin',
            is_paid: !!newApp.is_paid,
            price: Number(newApp.price) || 0,
            currency: newApp.currency || 'AMD',
            cover_image: newApp.cover_image || '',
            is_draft: isDraft,
            status: isDraft ? 'draft' : 'published',
            updated_at: now
          };
          const retryCore = await adminClient.from('apps').upsert(minimalCore).select().single();
          if (!retryCore.error) {
            data = retryCore.data;
            error = null;
          }
        }
      }

      if (!error && data) {
        // Also keep local file in sync if file system is writable
        if (isServer) {
          try {
            const fs = getFs();
            const content = await fs.readFile(APPS_FILE, 'utf-8');
            const apps = JSON.parse(content) as AppItem[];
            const index = apps.findIndex(x => x.id === app.id);
            if (index !== -1) apps[index] = newApp;
            else apps.unshift(newApp);
            await fs.writeFile(APPS_FILE, JSON.stringify(apps, null, 2), 'utf-8');
          } catch (e) { /* ignore write failure on read-only environments like Vercel */ }
        }

        return {
          ...newApp,
          ...data,
          downloads_count: Math.max(Number(newApp.downloads_count) || 0, Number(data.downloads_count) || 0),
          supported_os: newApp.supported_os,
          downloads: newApp.downloads,
          repository_url: newApp.repository_url,
          repository_type: newApp.repository_type,
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
      console.warn('Supabase saveApp failed, falling back to storage:', err);
    }
  }

  // Fallback to local JSON database if writable
  let localSaved = false;
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
      localSaved = true;
    } catch (err) {
      // Expected on read-only environments like Vercel
    }
  }

  // If saved locally or saved in site_settings apps_backup_store, return newApp
  try {
    const checkBackup = await getSiteSetting('apps_backup_store', {});
    if (checkBackup && checkBackup[newApp.id]) {
      return newApp;
    }
  } catch (e) {}

  if (localSaved) {
    return newApp;
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

  // Remove from extended metadata and backup store
  try {
    const extMeta = await getSiteSetting('apps_extended_metadata', {});
    if (extMeta && extMeta[id]) {
      delete extMeta[id];
      await saveSiteSetting('apps_extended_metadata', extMeta);
    }
    const appsBackup = await getSiteSetting('apps_backup_store', {});
    if (appsBackup && appsBackup[id]) {
      delete appsBackup[id];
      await saveSiteSetting('apps_backup_store', appsBackup);
    }
  } catch (e) { /* ignore */ }

  let supabaseDeleted = false;
  let supabaseErrorMsg = '';
  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      // 1. Delete associated reviews and bug reports first to prevent foreign key constraint violations
      try {
        await adminClient.from('app_reviews').delete().eq('app_id', id);
        await adminClient.from('app_bug_reports').delete().eq('app_id', id);
      } catch (childErr) {
        console.warn('Error deleting related app reviews/bug reports in Supabase:', childErr);
      }

      const { error } = await adminClient
        .from('apps')
        .delete()
        .eq('id', id);

      if (!error) {
        supabaseDeleted = true;
      } else {
        supabaseErrorMsg = error.message;
        console.warn('Supabase deleteApp query error:', error.message);
      }
    } catch (err: any) {
      supabaseErrorMsg = err.message || String(err);
      console.warn('Supabase deleteApp failed, using local storage:', err);
    }
  }

  // Fallback / sync to local JSON database
  let localDeleted = false;
  let localErrorMsg = '';
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(APPS_FILE, 'utf-8');
      const apps = JSON.parse(content) as AppItem[];
      const filtered = apps.filter(x => x.id !== id);
      await fs.writeFile(APPS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      localDeleted = true;
    } catch (err: any) {
      localErrorMsg = err.message || String(err);
      console.error('Error deleting app locally:', err);
    }

    // Also clean up local reviews and bug reports
    try {
      const revContent = await fs.readFile(APP_REVIEWS_FILE, 'utf-8');
      const revs = JSON.parse(revContent) as any[];
      const filteredRevs = revs.filter(x => x.app_id !== id);
      await fs.writeFile(APP_REVIEWS_FILE, JSON.stringify(filteredRevs, null, 2), 'utf-8');
    } catch (e) {}

    try {
      const bugContent = await fs.readFile(APP_BUG_REPORTS_FILE, 'utf-8');
      const bugs = JSON.parse(bugContent) as any[];
      const filteredBugs = bugs.filter(x => x.app_id !== id);
      await fs.writeFile(APP_BUG_REPORTS_FILE, JSON.stringify(filteredBugs, null, 2), 'utf-8');
    } catch (e) {}
  }

  if (isSeed && seedRegistered) {
    return true;
  }

  if (supabaseDeleted || localDeleted) {
    return true;
  }

  const errorParts = [];
  if (supabaseErrorMsg) errorParts.push(`Supabase error: ${supabaseErrorMsg}`);
  if (localErrorMsg) errorParts.push(`Local storage fallback error: ${localErrorMsg}`);

  throw new Error(errorParts.join(' | ') || 'Failed to delete app.');
}

export async function renameAppId(oldId: string, newId: string): Promise<boolean> {
  if (!oldId || !newId || oldId === newId) return true;
  await ensureLocalDbFiles();

  // 1. Supabase migration
  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      await adminClient.from('app_reviews').update({ app_id: newId }).eq('app_id', oldId);
      await adminClient.from('app_bug_reports').update({ app_id: newId }).eq('app_id', oldId);
      await adminClient.from('app_downloads').update({ app_id: newId }).eq('app_id', oldId);
      await adminClient.from('apps').delete().eq('id', oldId);
    } catch (err) {
      console.warn('Supabase renameAppId update error:', err);
    }
  }

  // 2. Local JSON files migration
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(APPS_FILE, 'utf-8');
      const apps = JSON.parse(content) as AppItem[];
      const filtered = apps.filter(x => x.id !== oldId);
      await fs.writeFile(APPS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    } catch (e) {}

    try {
      const revContent = await fs.readFile(APP_REVIEWS_FILE, 'utf-8');
      const revs = JSON.parse(revContent) as any[];
      let changed = false;
      revs.forEach(r => {
        if (r.app_id === oldId) {
          r.app_id = newId;
          changed = true;
        }
      });
      if (changed) {
        await fs.writeFile(APP_REVIEWS_FILE, JSON.stringify(revs, null, 2), 'utf-8');
      }
    } catch (e) {}

    try {
      const bugContent = await fs.readFile(APP_BUG_REPORTS_FILE, 'utf-8');
      const bugs = JSON.parse(bugContent) as any[];
      let changed = false;
      bugs.forEach(b => {
        if (b.app_id === oldId) {
          b.app_id = newId;
          changed = true;
        }
      });
      if (changed) {
        await fs.writeFile(APP_BUG_REPORTS_FILE, JSON.stringify(bugs, null, 2), 'utf-8');
      }
    } catch (e) {}

    try {
      const dlContent = await fs.readFile(APP_DOWNLOADS_FILE, 'utf-8');
      const dls = JSON.parse(dlContent) as any[];
      let changed = false;
      dls.forEach(d => {
        if (d.app_id === oldId) {
          d.app_id = newId;
          changed = true;
        }
      });
      if (changed) {
        await fs.writeFile(APP_DOWNLOADS_FILE, JSON.stringify(dls, null, 2), 'utf-8');
      }
    } catch (e) {}
  }

  // 3. Extended metadata migration
  try {
    const extMeta = await getSiteSetting('apps_extended_metadata', {});
    if (extMeta && extMeta[oldId]) {
      extMeta[newId] = extMeta[oldId];
      delete extMeta[oldId];
      await saveSiteSetting('apps_extended_metadata', extMeta);
    }
  } catch (e) {}

  return true;
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

  const deletedSeeds = await getSiteSetting('deleted_seed_reviews', []);
  const deletedSeedsSet = new Set(deletedSeeds || []);

  const currentDbReviews = supabaseSuccess ? dbReviews : [];
  const dbIds = new Set(currentDbReviews.map((x: any) => x.id));
  const nonDbLocalReviews = localReviews.filter(x => !dbIds.has(x.id));
  const dynamicIds = new Set([...currentDbReviews.map((x: any) => x.id), ...localReviews.map(x => x.id)]);
  const filteredSeeds = defaultSeededAppReviews.filter((x: AppReview) => !dynamicIds.has(x.id) && !deletedSeedsSet.has(x.id));

  let allReviews: AppReview[] = [];
  if (supabaseSuccess) {
    allReviews = [...dbReviews, ...nonDbLocalReviews, ...filteredSeeds];
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

      if (!error && data) {
        // Also sync locally
        if (isServer) {
          const fs = getFs();
          try {
            const content = await fs.readFile(APP_REVIEWS_FILE, 'utf-8');
            const reviews = JSON.parse(content) as AppReview[];
            const index = reviews.findIndex(x => x.id === id);
            if (index !== -1) reviews[index] = data;
            else reviews.unshift(data);
            await fs.writeFile(APP_REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
          } catch (e) {}
        }
        return data;
      }
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

  let updatedInDb = false;
  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { error } = await adminClient
        .from('app_reviews')
        .update({ status })
        .eq('id', id);

      if (!error) updatedInDb = true;
    } catch (err) {
      console.warn('Supabase updateAppReviewStatus failed:', err);
    }
  }

  // Always update in local JSON database as well
  let updatedLocally = false;
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(APP_REVIEWS_FILE, 'utf-8');
      const reviews = JSON.parse(content) as AppReview[];
      const index = reviews.findIndex(x => x.id === id);
      if (index !== -1) {
        reviews[index].status = status;
        await fs.writeFile(APP_REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
        updatedLocally = true;
      } else {
        // If it was a seed review, materialize it into local reviews
        const seed = defaultSeededAppReviews.find(x => x.id === id);
        if (seed) {
          reviews.unshift({ ...seed, status });
          await fs.writeFile(APP_REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
          updatedLocally = true;
        }
      }
    } catch (err) {
      console.error('Error updating review status locally:', err);
    }
  }

  return updatedInDb || updatedLocally;
}

export async function deleteAppReview(id: string): Promise<boolean> {
  await ensureLocalDbFiles();

  // Add to deleted_seed_reviews in site_settings so seeds never resurrect
  const deletedSeeds = await getSiteSetting('deleted_seed_reviews', []);
  if (!deletedSeeds.includes(id)) {
    deletedSeeds.push(id);
    await saveSiteSetting('deleted_seed_reviews', deletedSeeds);
  }

  let deletedInDb = false;
  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      const { error } = await adminClient
        .from('app_reviews')
        .delete()
        .eq('id', id);

      if (!error) deletedInDb = true;
    } catch (err) {
      console.warn('Supabase deleteAppReview failed:', err);
    }
  }

  // Always delete from local JSON database as well
  let deletedLocally = false;
  if (isServer) {
    const fs = getFs();
    try {
      const content = await fs.readFile(APP_REVIEWS_FILE, 'utf-8');
      const reviews = JSON.parse(content) as AppReview[];
      const filtered = reviews.filter(x => x.id !== id);
      await fs.writeFile(APP_REVIEWS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      deletedLocally = true;
    } catch (err) {
      console.error('Error deleting review locally:', err);
    }
  }

  return true;
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

// ══════════════════════════════════════════════════════════════════════════════
// APP DOWNLOADS & SPAM FILTERING
// ══════════════════════════════════════════════════════════════════════════════

export type AppDownload = {
  id: string;
  app_id: string;
  download_url?: string;
  download_id?: string;
  ip_address?: string;
  user_agent?: string;
  is_spam?: boolean;
  spam_reason?: string;
  created_at?: string;
};

export async function getAppDownloads(appId?: string): Promise<AppDownload[]> {
  await ensureLocalDbFiles();

  let downloads: AppDownload[] = [];

  const readClient = supabaseAdmin || supabase;
  if (readClient) {
    try {
      let query = readClient
        .from('app_downloads')
        .select('*')
        .order('created_at', { ascending: false });

      if (appId) {
        query = query.eq('app_id', appId);
      }

      const { data, error } = await query;
      if (!error && data) {
        downloads = data as AppDownload[];
      }
    } catch (err) {
      console.warn('Supabase getAppDownloads failed, fallback to local:', err);
    }
  }

  if (isServer) {
    try {
      const fs = getFs();
      const content = await fs.readFile(APP_DOWNLOADS_FILE, 'utf-8');
      const localDownloads = JSON.parse(content) as AppDownload[];
      const existingIds = new Set(downloads.map(d => d.id));
      const missingLocal = localDownloads.filter(d => !existingIds.has(d.id));
      const applicableLocal = appId ? missingLocal.filter(d => d.app_id === appId) : missingLocal;
      downloads = [...downloads, ...applicableLocal];
    } catch (e) { /* ignore */ }
  }

  return downloads;
}

export async function saveAppDownload(download: Omit<AppDownload, 'id' | 'created_at'> & { id?: string; created_at?: string }): Promise<AppDownload | null> {
  await ensureLocalDbFiles();
  const now = new Date().toISOString();
  const newDownload: AppDownload = {
    id: download.id || ('dl-' + Math.random().toString(36).substring(2, 11)),
    app_id: download.app_id,
    download_url: download.download_url || '',
    download_id: download.download_id || '',
    ip_address: download.ip_address || '',
    user_agent: download.user_agent || '',
    is_spam: !!download.is_spam,
    spam_reason: download.spam_reason || '',
    created_at: download.created_at || now
  };

  const adminClient = supabaseAdmin || supabase;
  if (adminClient) {
    try {
      let { data, error } = await adminClient
        .from('app_downloads')
        .insert([newDownload])
        .select()
        .single();

      // If foreign key constraint failed because the app is not in 'apps' table yet,
      // save the app to Supabase first and retry insertion
      if (error && (error.code === '23503' || error.message?.includes('foreign key'))) {
        try {
          const app = await getAppById(download.app_id);
          if (app) {
            await saveApp(app);
            const retry = await adminClient
              .from('app_downloads')
              .insert([newDownload])
              .select()
              .single();
            data = retry.data;
            error = retry.error;
          }
        } catch (e) {
          console.warn('Failed to auto-seed app for download FK:', e);
        }
      }

      if (!error && data) {
        // Also keep local file in sync
        if (isServer) {
          try {
            const fs = getFs();
            const content = await fs.readFile(APP_DOWNLOADS_FILE, 'utf-8');
            const list = JSON.parse(content) as AppDownload[];
            list.unshift(data);
            await fs.writeFile(APP_DOWNLOADS_FILE, JSON.stringify(list, null, 2), 'utf-8');
          } catch (e) { /* ignore */ }
        }
        return data as AppDownload;
      } else if (error) {
        console.warn('Supabase saveAppDownload error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase saveAppDownload failed, fallback to local:', err);
    }
  }

  // Local fallback
  if (isServer) {
    try {
      const fs = getFs();
      const content = await fs.readFile(APP_DOWNLOADS_FILE, 'utf-8');
      const list = JSON.parse(content) as AppDownload[];
      list.unshift(newDownload);
      await fs.writeFile(APP_DOWNLOADS_FILE, JSON.stringify(list, null, 2), 'utf-8');
      return newDownload;
    } catch (err) {
      console.error('Error saving app download locally:', err);
    }
  }

  return null;
}

export async function getRealDownloadsCount(appId: string): Promise<number> {
  const downloads = await getAppDownloads(appId);
  return downloads.filter(d => d.app_id === appId && !d.is_spam).length;
}

export async function incrementAppDownloadsCount(appId: string): Promise<number> {
  let finalCount = 1;

  // Persist updated downloads_count in app record
  try {
    const app = await getAppById(appId);
    const realCount = await getRealDownloadsCount(appId);
    const currentCount = Number(app?.downloads_count) || 0;
    finalCount = Math.max(currentCount + 1, realCount);

    const adminClient = supabaseAdmin || supabase;
    if (adminClient) {
      try {
        // Try atomic RPC function first
        const { data: rpcCount, error: rpcError } = await adminClient.rpc('increment_app_downloads', { p_app_id: appId });
        if (!rpcError && typeof rpcCount === 'number' && rpcCount > 0) {
          finalCount = Math.max(rpcCount, finalCount);
        } else {
          // If RPC not available yet, direct update on apps table
          await adminClient.from('apps').update({ downloads_count: finalCount }).eq('id', appId);
        }
      } catch (sqlErr) {
        console.warn('Supabase RPC / direct update failed:', sqlErr);
      }
    }

    if (app) {
      await saveApp({
        ...app,
        downloads_count: finalCount
      });
    }
  } catch (err) {
    console.warn('Failed to update app downloads_count:', err);
  }

  return finalCount;
}



