import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { MediaFolder, MediaFile, MediaLibraryData, MediaFileType, StorageStats } from './mediaTypes';
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

export async function getMediaLibraryData(): Promise<MediaLibraryData> {
  // 1. Try fetching from Supabase or persistent settings
  try {
    const cloudData = await getSiteSetting('media_library_data', null);
    if (cloudData && Array.isArray(cloudData.folders) && cloudData.folders.length > 0) {
      return {
        folders: cloudData.folders,
        fileAssignments: cloudData.fileAssignments || {},
        customNames: cloudData.customNames || {}
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
            customNames: parsed.customNames || {}
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
    customNames: {}
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

export async function saveMediaLibraryData(data: MediaLibraryData): Promise<void> {
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
 * Reads usage references across databases safely
 */
async function getMediaUsageMap(): Promise<Map<string, string[]>> {
  const usageMap = new Map<string, string[]>();

  const addUsage = (fileRef: string | undefined | null, label: string) => {
    if (!fileRef || typeof fileRef !== 'string') return;
    const clean = fileRef.trim().toLowerCase();
    const existing = usageMap.get(clean) || [];
    if (!existing.includes(label)) {
      existing.push(label);
      usageMap.set(clean, existing);
    }
  };

  // 1. Check apps
  try {
    const appsFile = path.join(DATA_DIR, 'apps.json');
    if (fsSync.existsSync(appsFile)) {
      const content = await fs.readFile(appsFile, 'utf-8');
      if (content && content.trim()) {
        const apps = JSON.parse(content);
        if (Array.isArray(apps)) {
          for (const app of apps) {
            const appName = app.title_am || app.title_en || 'Հավելված';
            addUsage(app.cover_image, `Հավելված՝ ${appName} (Շապիկ)`);
            addUsage(app.host_app_icon, `Հավելված՝ ${appName} (Պատկերակ)`);
            if (Array.isArray(app.gallery_images)) {
              app.gallery_images.forEach((img: string) => addUsage(img, `Հավելված՝ ${appName} (Պատկերասրահ)`));
            }
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // 2. Check cases
  try {
    const casesFile = path.join(DATA_DIR, 'cases.json');
    if (fsSync.existsSync(casesFile)) {
      const content = await fs.readFile(casesFile, 'utf-8');
      if (content && content.trim()) {
        const cases = JSON.parse(content);
        if (Array.isArray(cases)) {
          for (const c of cases) {
            const title = c.title || 'Քեյս';
            addUsage(c.image_url, `Քեյս՝ ${title}`);
            addUsage(c.bg, `Քեյս՝ ${title} (Ֆոն)`);
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // 3. Check settings
  try {
    const generalSettings = await getSiteSetting('general_settings', null);
    if (generalSettings) {
      addUsage(generalSettings.design_system_video_hy, 'Գլխավոր տեսանյութ (Հայերեն)');
      addUsage(generalSettings.design_system_video_en, 'Գլխավոր տեսանյութ (Անգլերեն)');
      addUsage(generalSettings.logo_url, 'Կայքի Գլխավոր Լոգո');
    }
  } catch (e) {
    // ignore
  }

  // 4. Default site common usages
  addUsage('/logo.png', 'Կայքի Գլխավոր Լոգո (PNG)');
  addUsage('/logo.svg', 'Կայքի Գլխավոր Լոգո (SVG)');
  addUsage('/profile_hrant.png', '«Մեր մասին» էջ (Պրոֆիլի նկար)');
  addUsage('/profile_hrant.jpg', '«Մեր մասին» էջ (Պրոֆիլի նկար)');
  addUsage('/signature.png', 'Կայքի ստորագրություն');
  addUsage('/favicon.ico', 'Կայքի Favicon');
  addUsage('/HDesign.ttf', 'Կայքի Հիմնական Տառատեսակ');

  return usageMap;
}

/**
 * Scans public directory and Supabase storage safely for media files
 */
export async function scanAllMediaFiles(): Promise<{
  files: MediaFile[];
  folders: MediaFolder[];
  stats: StorageStats;
}> {
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

    let totalSize = 0;
    let imagesCount = 0;
    let videosCount = 0;
    let fontsCount = 0;
    let vectorsCount = 0;
    let othersCount = 0;
    let imagesSize = 0;
    let videosSize = 0;
    let fontsSize = 0;

    const files: MediaFile[] = [];

    for (const item of rawFiles) {
      const url = item.url;
      const ext = path.extname(item.relPath || item.url).toLowerCase().replace('.', '');
      const type = detectFileType(ext);
      const size = item.size || 0;
      totalSize += size;

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
        usedIn: matchedUsage.length > 0 ? matchedUsage : undefined
      });
    }

    // Also include external promo video if registered in settings
    const remotePromo = 'https://api.hakobian.am/libs/v1/promo/promo.mp4';
    if (!seenUrls.has(remotePromo)) {
      const remoteId = 'external_promo_mp4';
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
        usedIn: ['Գլխավոր տեսանյութ (Կարգավորումներ)']
      });
    }

    // Supabase Free Tier Storage Limit: 1 GB (1,073,741,824 Bytes)
    const storageLimit = 1024 * 1024 * 1024;
    const storageRemaining = Math.max(0, storageLimit - totalSize);
    const storagePercent = Math.min(100, Math.round((totalSize / storageLimit) * 1000) / 10);

    return {
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
        fontsSizeFormatted: formatBytes(fontsSize)
      }
    };
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
        fontsSizeFormatted: '0 B'
      }
    };
  }
}

