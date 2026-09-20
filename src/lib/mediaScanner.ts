import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { MediaFolder, MediaFile, MediaLibraryData, MediaFileType, StorageStats, TrashSettings, TrashItemMeta } from './mediaTypes';
import { getSiteSetting, saveSiteSetting } from './db';
import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const MEDIA_LIBRARY_FILE = path.join(DATA_DIR, 'media_library.json');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function detectFileType(ext: string): MediaFileType {
  const e = (ext || '').toLowerCase().replace('.', '').trim();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp', 'tiff', 'avif'].includes(e)) {
    return 'image';
  }
  if (['svg'].includes(e)) {
    return 'vector';
  }
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(e)) {
    return 'video';
  }
  if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(e)) {
    return 'audio';
  }
  if (['ttf', 'otf', 'woff', 'woff2', 'eot'].includes(e)) {
    return 'font';
  }
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(e)) {
    return 'document';
  }
  return 'other';
}

const DEFAULT_FOLDERS: MediaFolder[] = [
  {
    id: 'folder-uploads',
    name: 'Վերբեռնումներ',
    color: '#3B82F6', // Blue
    parentId: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 'folder-branding',
    name: 'Բրենդինգ և Շապիկներ',
    color: '#EC4899', // Pink
    parentId: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 'folder-icons',
    name: 'Պատկերակներ',
    color: '#8B5CF6', // Purple
    parentId: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 'folder-fonts',
    name: 'Տառատեսակներ',
    color: '#10B981', // Emerald
    parentId: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 'folder-site-assets',
    name: 'Կայքի Գլխավոր Մեդիա',
    color: '#F59E0B', // Amber
    parentId: null,
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_TRASH_SETTINGS: TrashSettings = {
  autoDeleteEnabled: true,
  retentionDays: 30
};

export async function getMediaLibraryData(): Promise<MediaLibraryData> {
  // 1. Try fetching from Supabase or persistent settings
  try {
    const cloudData = await getSiteSetting('media_library_data', null);
    if (cloudData && Array.isArray(cloudData.folders) && cloudData.folders.length > 0) {
      return {
        folders: cloudData.folders,
        fileAssignments: cloudData.fileAssignments || {},
        customNames: cloudData.customNames || {},
        trash: cloudData.trash || {},
        trashSettings: {
          autoDeleteEnabled: cloudData.trashSettings?.autoDeleteEnabled ?? DEFAULT_TRASH_SETTINGS.autoDeleteEnabled,
          retentionDays: cloudData.trashSettings?.retentionDays ?? DEFAULT_TRASH_SETTINGS.retentionDays
        }
      };
    }
  } catch (err) {
    console.warn('Error reading media_library_data from site_settings:', err);
  }

  // 2. Fallback to local JSON file
  try {
    if (fsSync.existsSync(MEDIA_LIBRARY_FILE)) {
      const content = await fs.readFile(MEDIA_LIBRARY_FILE, 'utf-8');
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.folders)) {
          return {
            folders: parsed.folders,
            fileAssignments: parsed.fileAssignments || {},
            customNames: parsed.customNames || {},
            trash: parsed.trash || {},
            trashSettings: {
              autoDeleteEnabled: parsed.trashSettings?.autoDeleteEnabled ?? DEFAULT_TRASH_SETTINGS.autoDeleteEnabled,
              retentionDays: parsed.trashSettings?.retentionDays ?? DEFAULT_TRASH_SETTINGS.retentionDays
            }
          };
        }
      }
    }
  } catch (err) {
    console.warn('Error reading media_library.json:', err);
  }

  // 3. Initial default structure
  const initialData: MediaLibraryData = {
    folders: DEFAULT_FOLDERS,
    fileAssignments: {},
    customNames: {},
    trash: {},
    trashSettings: DEFAULT_TRASH_SETTINGS
  };

  // Safely attempt local write
  try {
    if (!fsSync.existsSync(DATA_DIR)) {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }
    await fs.writeFile(MEDIA_LIBRARY_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  } catch (err) {
    // Non-fatal on read-only environments
  }

  return initialData;
}

let mediaScanCache: {
  data: {
    files: MediaFile[];
    folders: MediaFolder[];
    stats: StorageStats;
  };
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 60 * 1000; // 60 seconds server-side cache

export function invalidateMediaCache(): void {
  mediaScanCache = null;
}

export async function saveMediaLibraryData(data: MediaLibraryData): Promise<void> {
  invalidateMediaCache();

  // 1. Save to site_settings (Supabase)
  try {
    await saveSiteSetting('media_library_data', data);
  } catch (err) {
    console.warn('Error saving media_library_data to Supabase:', err);
  }

  // 2. Save locally if writable
  try {
    if (!fsSync.existsSync(DATA_DIR)) {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }
    await fs.writeFile(MEDIA_LIBRARY_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Non-fatal on read-only environments
  }
}

/**
 * Permanently deletes a media file from Supabase Cloud Storage and local disk
 */
export async function permanentlyDeleteMediaFile(fileId: string, url?: string): Promise<{ success: boolean; error?: string }> {
  const storageClient = supabaseAdmin || supabase;
  const cloudBuckets = ['gallery', 'branding', 'fonts', 'apps', 'videos', 'uploads'];
  
  let targetBucket: string | null = null;
  let targetFileName: string | null = null;

  // Pattern A: supabase/bucket/filename
  if (fileId.startsWith('supabase/')) {
    const parts = fileId.split('/');
    if (parts.length >= 3) {
      targetBucket = parts[1];
      targetFileName = parts.slice(2).join('/');
    }
  }

  // Pattern B: Supabase URL (e.g. .../storage/v1/object/public/bucket/filename)
  const fullUrl = url || (fileId.startsWith('http') ? fileId : '');
  if (fullUrl && fullUrl.includes('/storage/v1/object/public/')) {
    const after = fullUrl.split('/storage/v1/object/public/')[1];
    if (after) {
      const parts = after.split('/');
      targetBucket = parts[0];
      targetFileName = decodeURIComponent(parts.slice(1).join('/'));
    }
  }

  // Pattern C: uploads/bucket/filename or uploads/filename
  if (!targetBucket && fileId.startsWith('uploads/')) {
    const parts = fileId.replace(/^uploads\//, '').split('/');
    if (parts.length > 1 && cloudBuckets.includes(parts[0])) {
      targetBucket = parts[0];
      targetFileName = parts.slice(1).join('/');
    } else {
      targetFileName = parts.join('/');
    }
  }

  // 1. Delete from Supabase Storage
  if (storageClient) {
    try {
      if (targetBucket && targetFileName) {
        await storageClient.storage.from(targetBucket).remove([targetFileName]);
      } else {
        const baseName = path.basename(fileId);
        for (const b of cloudBuckets) {
          try {
            await storageClient.storage.from(b).remove([baseName, fileId]);
          } catch (bErr) {
            // ignore
          }
        }
      }
    } catch (sErr) {
      console.warn('Error during Supabase storage remove:', sErr);
    }
  }

  // 2. Physical local file removal if exists on disk
  try {
    const cleanRelPath = fileId.replace(/^supabase\/[^/]+\//, '').replace(/^\/+/, '');
    const localCandidates = [
      path.join(PUBLIC_DIR, fileId),
      path.join(PUBLIC_DIR, cleanRelPath),
      path.join(PUBLIC_DIR, 'uploads', path.basename(fileId)),
      path.join(PUBLIC_DIR, 'uploads', cleanRelPath)
    ];
    for (const candidate of localCandidates) {
      if (fsSync.existsSync(candidate)) {
        try {
          await fs.unlink(candidate);
        } catch (e) {
          // ignore
        }
      }
    }
  } catch (fsErr) {
    // ignore
  }

  // 3. Clean from media library metadata
  try {
    const libraryData = await getMediaLibraryData();
    delete libraryData.fileAssignments[fileId];
    delete libraryData.fileAssignments['/' + fileId.replace(/^\/+/, '')];
    if (url) {
      delete libraryData.fileAssignments[url];
    }
    if (libraryData.customNames) {
      delete libraryData.customNames[fileId];
      if (url) delete libraryData.customNames[url];
    }
    if (libraryData.trash) {
      delete libraryData.trash[fileId];
      if (url) delete libraryData.trash[url];
      delete libraryData.trash['/' + fileId.replace(/^\/+/, '')];
    }
    await saveMediaLibraryData(libraryData);
  } catch (dataErr) {
    console.warn('Error updating library data on permanent deletion:', dataErr);
  }

  return { success: true };
}

/**
 * Moves specified files to Trash
 */
export async function moveFilesToTrash(fileIds: string[]): Promise<void> {
  const libraryData = await getMediaLibraryData();
  if (!libraryData.trash) libraryData.trash = {};
  const now = new Date().toISOString();

  for (const id of fileIds) {
    if (!id || typeof id !== 'string') continue;
    const cleanId = id.trim();
    const originalFolderId = libraryData.fileAssignments[cleanId] ?? null;
    libraryData.trash[cleanId] = {
      trashedAt: now,
      originalFolderId
    };
  }

  await saveMediaLibraryData(libraryData);
}

/**
 * Restores specified files from Trash
 */
export async function restoreFilesFromTrash(fileIds: string[]): Promise<void> {
  const libraryData = await getMediaLibraryData();
  if (!libraryData.trash) return;

  for (const id of fileIds) {
    if (!id || typeof id !== 'string') continue;
    const cleanId = id.trim();
    const meta = libraryData.trash[cleanId];
    if (meta) {
      libraryData.fileAssignments[cleanId] = meta.originalFolderId;
      delete libraryData.trash[cleanId];
    }
    // Also clean url variant
    const urlKey = '/' + cleanId.replace(/^\/+/, '');
    if (libraryData.trash[urlKey]) {
      delete libraryData.trash[urlKey];
    }
  }

  await saveMediaLibraryData(libraryData);
}

/**
 * Permanently deletes all files in Trash
 */
export async function emptyTrash(): Promise<void> {
  const libraryData = await getMediaLibraryData();
  if (!libraryData.trash) return;

  const trashedIds = Object.keys(libraryData.trash);
  for (const id of trashedIds) {
    await permanentlyDeleteMediaFile(id);
  }

  libraryData.trash = {};
  await saveMediaLibraryData(libraryData);
}

/**
 * Reads usage references across all databases, Supabase tables, JSON files, and source code
 */
async function getMediaUsageMap(): Promise<Map<string, string[]>> {
  const usageMap = new Map<string, string[]>();

  const registerKey = (rawKey: string, label: string) => {
    if (!rawKey || typeof rawKey !== 'string') return;
    const clean = rawKey.trim();
    if (!clean) return;

    const variations = new Set<string>();
    variations.add(clean.toLowerCase());
    try {
      variations.add(decodeURIComponent(clean).toLowerCase());
      variations.add(encodeURI(clean).toLowerCase());
    } catch (e) {}

    // If it's a URL, extract path
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      try {
        const u = new URL(clean);
        variations.add(u.pathname.toLowerCase());
        variations.add(u.pathname.replace(/^\/+/, '').toLowerCase());
        const afterPub = clean.split('/storage/v1/object/public/')[1];
        if (afterPub) {
          variations.add(afterPub.toLowerCase());
          variations.add(decodeURIComponent(afterPub).toLowerCase());
          variations.add(`supabase/${afterPub}`.toLowerCase());
        }
      } catch (e) {}
    } else {
      variations.add('/' + clean.replace(/^\/+/, '').toLowerCase());
      variations.add(clean.replace(/^\/+/, '').toLowerCase());
    }

    // Basename
    const bName = path.basename(clean).toLowerCase();
    if (bName && bName.length > 3) {
      variations.add(bName);
    }

    for (const v of variations) {
      const existing = usageMap.get(v) || [];
      if (!existing.includes(label)) {
        existing.push(label);
        usageMap.set(v, existing);
      }
    }
  };

  // Helper to deep scan any object for media URLs / paths
  const mediaExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico', '.avif', '.bmp', '.mp4', '.webm', '.mov', '.mp3', '.wav', '.ttf', '.otf', '.woff', '.woff2', '.pdf'];
  const deepScanObj = (obj: any, label: string) => {
    if (!obj) return;
    if (typeof obj === 'string') {
      const lower = obj.toLowerCase();
      if (mediaExtensions.some(ext => lower.includes(ext)) || lower.startsWith('/uploads/') || lower.startsWith('/branding/') || lower.includes('/storage/v1/object/public/')) {
        registerKey(obj, label);
      }
      return;
    }
    if (Array.isArray(obj)) {
      for (const item of obj) deepScanObj(item, label);
      return;
    }
    if (typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) {
        deepScanObj(v, label);
      }
    }
  };

  // 1. Scan all JSON databases in public/data
  try {
    if (fsSync.existsSync(DATA_DIR)) {
      const files = await fs.readdir(DATA_DIR);
      for (const file of files) {
        if (!file.endsWith('.json') || file === 'media_library.json') continue;
        try {
          const filePath = path.join(DATA_DIR, file);
          const raw = await fs.readFile(filePath, 'utf-8');
          if (!raw.trim()) continue;
          const parsed = JSON.parse(raw);

          let domainLabel = `Տվյալներ՝ ${file.replace('.json', '')}`;
          if (file === 'cases.json') {
            if (Array.isArray(parsed)) {
              for (const c of parsed) {
                const title = c.title || c.title_am || c.title_en || 'Քեյս';
                deepScanObj(c, `Քեյս՝ ${title}`);
              }
            }
          } else if (file === 'apps.json') {
            if (Array.isArray(parsed)) {
              for (const app of parsed) {
                const title = app.title_am || app.title_en || 'Հավելված';
                deepScanObj(app, `Հավելված՝ ${title}`);
              }
            }
          } else if (file === 'fonts.json') {
            if (Array.isArray(parsed)) {
              for (const f of parsed) {
                const name = f.name_am || f.name_en || 'Տառատեսակ';
                deepScanObj(f, `Տառատեսակ՝ ${name}`);
              }
            }
          } else if (file === 'settings.json' || file === 'general_settings.json') {
            deepScanObj(parsed, 'Կայքի Կարգավորումներ');
          } else if (file === 'icons_settings.json') {
            deepScanObj(parsed, 'Կայքի Պատկերակներ (Icons)');
          } else {
            deepScanObj(parsed, domainLabel);
          }
        } catch (e) {
          // ignore single file parse error
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // 2. Scan Supabase Live Tables (cases, fonts, apps, site_settings)
  const storageClient = supabaseAdmin || supabase;
  if (storageClient) {
    try {
      // Cases
      const { data: dbCases } = await storageClient.from('cases').select('*').limit(500);
      if (Array.isArray(dbCases)) {
        for (const c of dbCases) {
          const title = c.title || c.title_am || c.title_en || 'Քեյս';
          deepScanObj(c, `Քեյս՝ ${title}`);
        }
      }
    } catch (e) {}

    try {
      // Fonts
      const { data: dbFonts } = await storageClient.from('fonts').select('*').limit(500);
      if (Array.isArray(dbFonts)) {
        for (const f of dbFonts) {
          const name = f.name_am || f.name_en || 'Տառատեսակ';
          deepScanObj(f, `Տառատեսակ՝ ${name}`);
        }
      }
    } catch (e) {}

    try {
      // Apps
      const { data: dbApps } = await storageClient.from('apps').select('*').limit(500);
      if (Array.isArray(dbApps)) {
        for (const a of dbApps) {
          const name = a.title_am || a.title_en || 'Հավելված';
          deepScanObj(a, `Հավելված՝ ${name}`);
        }
      }
    } catch (e) {}

    try {
      // Site settings
      const { data: dbSettings } = await storageClient.from('site_settings').select('*').limit(200);
      if (Array.isArray(dbSettings)) {
        for (const s of dbSettings) {
          deepScanObj(s.value, `Կարգավորումներ՝ ${s.key || 'site'}`);
        }
      }
    } catch (e) {}
  }

  // 3. Scan Source Code files (src/ directory) for static assets used in JSX/TSX/CSS
  try {
    const SRC_DIR = path.join(process.cwd(), 'src');
    async function scanSrcDir(dir: string, depth = 0) {
      if (depth > 4 || !fsSync.existsSync(dir)) return;
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== '.next') {
            await scanSrcDir(full, depth + 1);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (['.tsx', '.ts', '.jsx', '.js', '.css', '.scss'].includes(ext)) {
            try {
              const code = await fs.readFile(full, 'utf-8');
              const compName = path.basename(entry.name);
              // Regex match for static asset strings e.g. "/images/...", "/logo...", etc.
              const matches = code.match(/["'`](\/[a-zA-Z0-9_\-\/.]+\.(png|jpg|jpeg|webp|svg|gif|ico|avif|mp4|webm|ttf|otf|woff2?))["'`]/g);
              if (matches) {
                for (const m of matches) {
                  const cleaned = m.slice(1, -1);
                  registerKey(cleaned, `Կոդում՝ ${compName}`);
                }
              }
            } catch (err) {}
          }
        }
      }
    }
    await scanSrcDir(SRC_DIR);
  } catch (e) {
    // ignore
  }

  // 4. Default site common usages
  registerKey('/logo.png', 'Կայքի Գլխավոր Լոգո (PNG)');
  registerKey('/logo.svg', 'Կայքի Գլխավոր Լոգո (SVG)');
  registerKey('/profile_hrant.png', '«Մեր մասին» էջ (Պրոֆիլի նկար)');
  registerKey('/profile_hrant.jpg', '«Մեր մասին» էջ (Պրոֆիլի նկար)');
  registerKey('/signature.png', 'Կայքի ստորագրություն');
  registerKey('/favicon.ico', 'Կայքի Favicon');
  registerKey('/HDesign.ttf', 'Կայքի Հիմնական Տառատեսակ');

  return usageMap;
}

/**
 * Scans public directory and Supabase storage safely for media files
 */
export async function scanAllMediaFiles(forceRefresh = false): Promise<{
  files: MediaFile[];
  folders: MediaFolder[];
  stats: StorageStats;
}> {
  if (!forceRefresh && mediaScanCache && Date.now() - mediaScanCache.timestamp < CACHE_TTL_MS) {
    return mediaScanCache.data;
  }

  try {
    const libraryData = await getMediaLibraryData();
    const usageMap = await getMediaUsageMap();

    const supportedExtensions = new Set([
      'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svg', 'avif', 'bmp',
      'mp4', 'webm', 'mov', 'avi', 'mkv',
      'mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a',
      'ttf', 'otf', 'woff', 'woff2', 'eot',
      'pdf', 'zip', 'doc', 'docx'
    ]);

    const rawFiles: Array<{ fullPath?: string; relPath: string; url: string; size: number; mtime: string }> = [];
    const seenUrls = new Set<string>();

    // 1. Scan local public folder if exists
    async function walk(currentDir: string) {
      try {
        if (!fsSync.existsSync(currentDir)) return;
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === 'data' || entry.name === 'demo-files' || entry.name === 'node_modules' || entry.name === '.next') continue;
            await walk(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase().replace('.', '');
            if (supportedExtensions.has(ext)) {
              try {
                const stat = await fs.stat(fullPath);
                const relPath = path.relative(PUBLIC_DIR, fullPath).replace(/\\/g, '/');
                const url = '/' + relPath.replace(/^\/+/, '');
                if (!seenUrls.has(url)) {
                  seenUrls.add(url);
                  rawFiles.push({
                    fullPath,
                    relPath,
                    url,
                    size: stat.size,
                    mtime: stat.mtime.toISOString()
                  });
                }
              } catch (err) {
                // ignore stat error
              }
            }
          }
        }
      } catch (err) {
        console.warn('Directory scan notice for:', currentDir, err);
      }
    }

    try {
      await walk(PUBLIC_DIR);
    } catch (e) {
      console.warn('Public dir scan skipped:', e);
    }

    // 2. Scan Supabase Cloud Storage buckets if configured
    const storageClient = supabaseAdmin || supabase;
    if (storageClient?.storage) {
      const cloudBuckets = ['gallery', 'branding', 'fonts', 'apps', 'videos', 'uploads'];
      for (const bucket of cloudBuckets) {
        try {
          const { data: cloudList, error: listErr } = await storageClient.storage.from(bucket).list('', {
            limit: 200,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' }
          });
          if (!listErr && Array.isArray(cloudList)) {
            for (const item of cloudList) {
              if (!item.name || item.name === '.emptyFolderPlaceholder') continue;
              const { data: pubData } = storageClient.storage.from(bucket).getPublicUrl(item.name);
              const fileUrl = pubData?.publicUrl;
              if (fileUrl && !seenUrls.has(fileUrl)) {
                seenUrls.add(fileUrl);
                const relPath = `supabase/${bucket}/${item.name}`;
                rawFiles.push({
                  relPath,
                  url: fileUrl,
                  size: item.metadata?.size || 102400,
                  mtime: item.updated_at || item.created_at || new Date().toISOString()
                });
              }
            }
          }
        } catch (storageErr) {
          // ignore bucket error
        }
      }
    }

    // 3. Auto-cleanup expired trash files
    const autoDelete = libraryData.trashSettings?.autoDeleteEnabled ?? DEFAULT_TRASH_SETTINGS.autoDeleteEnabled;
    const retentionDays = libraryData.trashSettings?.retentionDays ?? DEFAULT_TRASH_SETTINGS.retentionDays;
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
    const nowMs = Date.now();

    if (libraryData.trash && autoDelete) {
      const expiredFileIds: string[] = [];
      for (const [tId, meta] of Object.entries(libraryData.trash)) {
        if (meta && meta.trashedAt) {
          const trashedTime = new Date(meta.trashedAt).getTime();
          if (!isNaN(trashedTime) && (nowMs - trashedTime > retentionMs)) {
            expiredFileIds.push(tId);
          }
        }
      }
      if (expiredFileIds.length > 0) {
        for (const expId of expiredFileIds) {
          try {
            await permanentlyDeleteMediaFile(expId);
          } catch (e) {
            // ignore
          }
        }
      }
    }

    let totalSize = 0;
    let imagesCount = 0;
    let videosCount = 0;
    let fontsCount = 0;
    let vectorsCount = 0;
    let othersCount = 0;
    let imagesSize = 0;
    let videosSize = 0;
    let fontsSize = 0;
    let trashCount = 0;
    let trashSize = 0;

    const files: MediaFile[] = [];

    for (const item of rawFiles) {
      const url = item.url;
      const ext = path.extname(item.relPath || item.url).toLowerCase().replace('.', '');
      const type = detectFileType(ext);
      const size = item.size || 0;
      totalSize += size;

      // Trash status check
      const trashMeta = libraryData.trash?.[item.relPath] || libraryData.trash?.[url] || libraryData.trash?.['/' + item.relPath.replace(/^\/+/, '')];
      const isTrashed = !!trashMeta;

      let daysRemaining: number | undefined = undefined;
      if (isTrashed && trashMeta?.trashedAt) {
        const trashedTime = new Date(trashMeta.trashedAt).getTime();
        const elapsedDays = (nowMs - trashedTime) / (24 * 60 * 60 * 1000);
        daysRemaining = Math.max(0, Math.ceil(retentionDays - elapsedDays));
        trashCount++;
        trashSize += size;
      }

      if (!isTrashed) {
        if (type === 'image' || type === 'vector') {
          if (type === 'image') imagesCount++;
          else vectorsCount++;
          imagesSize += size;
        } else if (type === 'video') {
          videosCount++;
          videosSize += size;
        } else if (type === 'font') {
          fontsCount++;
          fontsSize += size;
        } else {
          othersCount++;
        }
      }

      // Determine folder ID:
      let folderId = libraryData.fileAssignments[item.relPath] ?? libraryData.fileAssignments[url];

      if (folderId === undefined) {
        if (item.relPath.includes('uploads') || url.includes('/uploads/')) {
          folderId = 'folder-uploads';
        } else if (item.relPath.includes('branding') || url.includes('/branding/')) {
          folderId = 'folder-branding';
        } else if (item.relPath.includes('fonts') || item.relPath.includes('varFonts') || ext === 'ttf' || ext === 'otf' || ext === 'woff' || ext === 'woff2') {
          folderId = 'folder-fonts';
        } else if (item.relPath.includes('icons') || url.includes('/icons/')) {
          folderId = 'folder-icons';
        } else {
          folderId = 'folder-site-assets';
        }
        libraryData.fileAssignments[item.relPath] = folderId;
      }

      // Check usage
      const matchedUsage: string[] = [];
      const directUsage = usageMap.get(url.toLowerCase()) || usageMap.get(item.relPath.toLowerCase());
      if (directUsage) matchedUsage.push(...directUsage);

      const fileNameOnly = path.basename(item.relPath).toLowerCase();
      for (const [key, labels] of usageMap.entries()) {
        if (key.endsWith('/' + fileNameOnly) || key === fileNameOnly) {
          for (const l of labels) {
            if (!matchedUsage.includes(l)) matchedUsage.push(l);
          }
        }
      }

      const customName = libraryData.customNames?.[item.relPath] || libraryData.customNames?.[url] || path.basename(item.relPath);

      files.push({
        id: item.relPath,
        name: customName,
        url,
        relPath: item.relPath,
        folderId,
        size,
        sizeFormatted: formatBytes(size),
        type,
        extension: ext,
        modifiedAt: item.mtime,
        usedIn: matchedUsage.length > 0 ? matchedUsage : undefined,
        isTrashed,
        trashedAt: trashMeta?.trashedAt,
        originalFolderId: trashMeta?.originalFolderId,
        daysRemaining
      });
    }

    // Also include external promo video if registered in settings
    const remotePromo = 'https://api.hakobian.am/libs/v1/promo/promo.mp4';
    if (!seenUrls.has(remotePromo)) {
      const remoteId = 'external_promo_mp4';
      const trashMeta = libraryData.trash?.[remoteId];
      const isTrashed = !!trashMeta;

      let daysRemaining: number | undefined = undefined;
      if (isTrashed && trashMeta?.trashedAt) {
        const trashedTime = new Date(trashMeta.trashedAt).getTime();
        const elapsedDays = (nowMs - trashedTime) / (24 * 60 * 60 * 1000);
        daysRemaining = Math.max(0, Math.ceil(retentionDays - elapsedDays));
        trashCount++;
        trashSize += 15400000;
      }

      const folderId = libraryData.fileAssignments[remoteId] !== undefined
        ? libraryData.fileAssignments[remoteId]
        : 'folder-branding';

      files.push({
        id: remoteId,
        name: 'promo.mp4 (Արտաքին գլխավոր հոլովակ)',
        url: remotePromo,
        relPath: 'external/promo.mp4',
        folderId,
        size: 15400000,
        sizeFormatted: '~15.4 MB',
        type: 'video',
        extension: 'mp4',
        modifiedAt: new Date().toISOString(),
        usedIn: ['Գլխավոր տեսանյութ (Կարգավորումներ)'],
        isTrashed,
        trashedAt: trashMeta?.trashedAt,
        originalFolderId: trashMeta?.originalFolderId,
        daysRemaining
      });
    }

    // Supabase Free Tier Storage Limit: 1 GB (1,073,741,824 Bytes)
    const storageLimit = 1024 * 1024 * 1024;
    const storageRemaining = Math.max(0, storageLimit - totalSize);
    const storagePercent = Math.min(100, Math.round((totalSize / storageLimit) * 1000) / 10);

    const result = {
      files,
      folders: libraryData.folders || DEFAULT_FOLDERS,
      stats: {
        totalFiles: files.length,
        totalSize,
        totalSizeFormatted: formatBytes(totalSize),
        storageLimit,
        storageLimitFormatted: formatBytes(storageLimit),
        storageRemaining,
        storageRemainingFormatted: formatBytes(storageRemaining),
        storagePercent,
        isSupabaseConnected: true,
        imagesCount,
        videosCount,
        fontsCount,
        vectorsCount,
        othersCount,
        imagesSizeFormatted: formatBytes(imagesSize),
        videosSizeFormatted: formatBytes(videosSize),
        fontsSizeFormatted: formatBytes(fontsSize),
        trashCount,
        trashSize,
        trashSizeFormatted: formatBytes(trashSize)
      }
    };

    mediaScanCache = {
      data: result,
      timestamp: Date.now()
    };

    return result;
  } catch (criticalError: any) {
    console.error('Critical fallback in scanAllMediaFiles:', criticalError);
    return {
      files: [],
      folders: DEFAULT_FOLDERS,
      stats: {
        totalFiles: 0,
        totalSize: 0,
        totalSizeFormatted: '0 B',
        storageLimit: 1024 * 1024 * 1024,
        storageLimitFormatted: '1.0 GB',
        storageRemaining: 1024 * 1024 * 1024,
        storageRemainingFormatted: '1.0 GB',
        storagePercent: 0,
        isSupabaseConnected: true,
        imagesCount: 0,
        videosCount: 0,
        fontsCount: 0,
        vectorsCount: 0,
        othersCount: 0,
        imagesSizeFormatted: '0 B',
        videosSizeFormatted: '0 B',
        fontsSizeFormatted: '0 B',
        trashCount: 0,
        trashSize: 0,
        trashSizeFormatted: '0 B'
      }
    };
  }
}

/**
 * Unlinks / disconnects media references from cases, apps, fonts, site settings, and JSON databases.
 */
export async function unlinkMediaUsage(
  fileId: string,
  url?: string,
  targetUsage?: string
): Promise<{ success: boolean; unlinkedCount: number; message: string }> {
  let unlinkedCount = 0;
  const storageClient = supabaseAdmin || supabase;

  const matchChecker = (val: string): boolean => {
    if (!val || typeof val !== 'string') return false;
    const cleanVal = val.trim().toLowerCase();
    if (!cleanVal) return false;

    const targets = new Set<string>();
    const addVariants = (s: string) => {
      if (!s) return;
      const clean = s.trim().toLowerCase();
      targets.add(clean);
      targets.add('/' + clean.replace(/^\/+/, ''));
      targets.add(clean.replace(/^\/+/, ''));
      try {
        targets.add(decodeURIComponent(clean));
        targets.add(encodeURI(clean));
      } catch (e) {}
      if (clean.includes('/storage/v1/object/public/')) {
        const after = clean.split('/storage/v1/object/public/')[1];
        if (after) {
          targets.add(after);
          targets.add(`supabase/${after}`);
        }
      }
    };

    addVariants(fileId);
    if (url) addVariants(url);

    if (targets.has(cleanVal) || targets.has(cleanVal.replace(/^\/+/, '')) || targets.has('/' + cleanVal.replace(/^\/+/, ''))) {
      return true;
    }

    // Basename match
    const b1 = path.basename(fileId).toLowerCase();
    const b2 = url ? path.basename(url).toLowerCase() : '';
    const bVal = path.basename(cleanVal).toLowerCase();
    if (b1 && b1.length > 3 && bVal === b1) return true;
    if (b2 && b2.length > 3 && bVal === b2) return true;

    return false;
  };

  const cleanDeep = (value: any, entityLabel?: string): { cleaned: any; changed: boolean } => {
    if (targetUsage && entityLabel) {
      const cleanTarget = targetUsage.toLowerCase().trim();
      const cleanLabel = entityLabel.toLowerCase().trim();
      if (!cleanLabel.includes(cleanTarget) && !cleanTarget.includes(cleanLabel)) {
        return { cleaned: value, changed: false };
      }
    }

    if (typeof value === 'string') {
      if (matchChecker(value)) {
        return { cleaned: '', changed: true };
      }
      return { cleaned: value, changed: false };
    }

    if (Array.isArray(value)) {
      let changed = false;
      const cleaned = value.map(item => {
        const res = cleanDeep(item, entityLabel);
        if (res.changed) changed = true;
        return res.cleaned;
      }).filter(item => {
        if (typeof item === 'string' && item === '' && value.some(old => typeof old === 'string' && matchChecker(old))) {
          return false;
        }
        return true;
      });
      return { cleaned, changed };
    }

    if (value && typeof value === 'object') {
      let changed = false;
      const cleaned: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        const res = cleanDeep(v, entityLabel);
        if (res.changed) changed = true;
        cleaned[k] = res.cleaned;
      }
      return { cleaned, changed };
    }

    return { cleaned: value, changed: false };
  };

  // 1. Unlink from Cases
  try {
    const { getCases, saveCase } = await import('./db');
    const cases = await getCases();
    for (const c of cases) {
      const label = `Քեյս՝ ${c.title || (c as any).title_am || (c as any).title_en || 'Քեյս'}`;
      let changed = false;
      if (!targetUsage || label.toLowerCase().includes(targetUsage.toLowerCase()) || targetUsage.toLowerCase().includes(label.toLowerCase())) {
        if (c.image_url && matchChecker(c.image_url)) {
          c.image_url = '';
          changed = true;
        }
        if (c.bg && matchChecker(c.bg)) {
          c.bg = '#111827';
          changed = true;
        }
        if (c.details) {
          const res = cleanDeep(c.details, label);
          if (res.changed) {
            c.details = res.cleaned;
            changed = true;
          }
        }
        if (changed) {
          await saveCase(c);
          unlinkedCount++;
        }
      }
    }
  } catch (err) {
    console.warn('Error unlinking from cases:', err);
  }

  // 2. Unlink from Apps
  try {
    const { getApps, saveApp } = await import('./db');
    const apps = await getApps();
    for (const a of apps) {
      const label = `Հավելված՝ ${a.title_am || a.title_en || 'Հավելված'}`;
      if (!targetUsage || label.toLowerCase().includes(targetUsage.toLowerCase()) || targetUsage.toLowerCase().includes(label.toLowerCase())) {
        const res = cleanDeep(a, label);
        if (res.changed) {
          await saveApp(res.cleaned);
          unlinkedCount++;
        }
      }
    }
  } catch (err) {
    console.warn('Error unlinking from apps:', err);
  }

  // 3. Unlink from Fonts
  try {
    const { getFonts, saveFont } = await import('./db');
    const fonts = await getFonts();
    for (const f of fonts) {
      const label = `Տառատեսակ՝ ${f.name_am || f.name_en || 'Տառատեսակ'}`;
      if (!targetUsage || label.toLowerCase().includes(targetUsage.toLowerCase()) || targetUsage.toLowerCase().includes(label.toLowerCase())) {
        const res = cleanDeep(f, label);
        if (res.changed) {
          await saveFont(res.cleaned);
          unlinkedCount++;
        }
      }
    }
  } catch (err) {
    console.warn('Error unlinking from fonts:', err);
  }

  // 4. Unlink from Site Settings (Supabase)
  if (storageClient) {
    try {
      const { data: dbSettings } = await storageClient.from('site_settings').select('*').limit(200);
      if (Array.isArray(dbSettings)) {
        for (const s of dbSettings) {
          const label = `Կարգավորումներ՝ ${s.key || 'site'}`;
          if (!targetUsage || label.toLowerCase().includes(targetUsage.toLowerCase()) || targetUsage.toLowerCase().includes(label.toLowerCase())) {
            const res = cleanDeep(s.value, label);
            if (res.changed) {
              await saveSiteSetting(s.key, res.cleaned);
              unlinkedCount++;
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error unlinking from site_settings (cloud):', err);
    }
  }

  // 5. Unlink from Local JSON Data files
  try {
    if (fsSync.existsSync(DATA_DIR)) {
      const files = await fs.readdir(DATA_DIR);
      for (const file of files) {
        if (!file.endsWith('.json') || file === 'media_library.json') continue;
        try {
          const filePath = path.join(DATA_DIR, file);
          const raw = await fs.readFile(filePath, 'utf-8');
          if (!raw.trim()) continue;
          const parsed = JSON.parse(raw);
          const label = `Տվյալներ՝ ${file.replace('.json', '')}`;
          const res = cleanDeep(parsed, label);
          if (res.changed) {
            await fs.writeFile(filePath, JSON.stringify(res.cleaned, null, 2), 'utf-8');
            unlinkedCount++;
          }
        } catch (e) {}
      }
    }
  } catch (err) {
    console.warn('Error unlinking from local data JSON files:', err);
  }

  if (unlinkedCount > 0) {
    invalidateMediaCache();
  }

  return {
    success: true,
    unlinkedCount,
    message: unlinkedCount > 0
      ? `Հաջողությամբ ապակապվեց կայքի ${unlinkedCount} հատված(ներ)ից:`
      : 'Համապատասխանող ակտիվ կապ չգտնվեց:'
  };
}
