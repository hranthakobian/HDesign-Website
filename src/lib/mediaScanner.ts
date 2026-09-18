import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { MediaFolder, MediaFile, MediaLibraryData, MediaFileType } from './mediaTypes';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const MEDIA_LIBRARY_FILE = path.join(DATA_DIR, 'media_library.json');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function detectFileType(ext: string): MediaFileType {
  const e = ext.toLowerCase().replace('.', '');
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
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    if (fsSync.existsSync(MEDIA_LIBRARY_FILE)) {
      const content = await fs.readFile(MEDIA_LIBRARY_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.folders)) {
        return {
          folders: parsed.folders,
          fileAssignments: parsed.fileAssignments || {},
          customNames: parsed.customNames || {}
        };
      }
    }
  } catch (err) {
    console.error('Error reading media_library.json:', err);
  }

  // Initial default structure
  const initialData: MediaLibraryData = {
    folders: DEFAULT_FOLDERS,
    fileAssignments: {},
    customNames: {}
  };

  try {
    await fs.writeFile(MEDIA_LIBRARY_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing initial media_library.json:', err);
  }

  return initialData;
}

export async function saveMediaLibraryData(data: MediaLibraryData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(MEDIA_LIBRARY_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Reads usage references across JSON databases
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

  // 1. Check apps.json
  try {
    const appsFile = path.join(DATA_DIR, 'apps.json');
    if (fsSync.existsSync(appsFile)) {
      const content = await fs.readFile(appsFile, 'utf-8');
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
  } catch (e) {
    console.warn('Could not read apps.json for media usage:', e);
  }

  // 2. Check cases.json
  try {
    const casesFile = path.join(DATA_DIR, 'cases.json');
    if (fsSync.existsSync(casesFile)) {
      const content = await fs.readFile(casesFile, 'utf-8');
      const cases = JSON.parse(content);
      if (Array.isArray(cases)) {
        for (const c of cases) {
          const title = c.title || 'Քեյս';
          addUsage(c.image_url, `Քեյս՝ ${title}`);
          addUsage(c.bg, `Քեյս՝ ${title} (Ֆոն)`);
        }
      }
    }
  } catch (e) {
    console.warn('Could not read cases.json for media usage:', e);
  }

  // 3. Check settings.json
  try {
    const settingsFile = path.join(DATA_DIR, 'settings.json');
    if (fsSync.existsSync(settingsFile)) {
      const content = await fs.readFile(settingsFile, 'utf-8');
      const settings = JSON.parse(content);
      if (settings?.general_settings) {
        addUsage(settings.general_settings.design_system_video_hy, 'Գլխավոր տեսանյութ (Հայերեն)');
        addUsage(settings.general_settings.design_system_video_en, 'Գլխավոր տեսանյութ (Անգլերեն)');
      }
    }
  } catch (e) {
    console.warn('Could not read settings.json for media usage:', e);
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
 * Scans public directory recursively for media files
 */
export async function scanAllMediaFiles(): Promise<{
  files: MediaFile[];
  folders: MediaFolder[];
  stats: {
    totalFiles: number;
    totalSize: number;
    totalSizeFormatted: string;
    imagesCount: number;
    videosCount: number;
    fontsCount: number;
    vectorsCount: number;
    othersCount: number;
  };
}> {
  const libraryData = await getMediaLibraryData();
  const usageMap = await getMediaUsageMap();

  const supportedExtensions = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svg',
    'mp4', 'webm', 'mov', 'avi',
    'mp3', 'wav', 'ogg',
    'ttf', 'otf', 'woff', 'woff2', 'eot',
    'pdf', 'zip'
  ]);

  const rawFiles: Array<{ fullPath: string; relPath: string; stat: fsSync.Stats }> = [];

  async function walk(currentDir: string) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          // Skip data directory (JSONs) and node_modules or system folders
          if (entry.name === 'data' || entry.name === 'demo-files') continue;
          await walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase().replace('.', '');
          if (supportedExtensions.has(ext)) {
            try {
              const stat = await fs.stat(fullPath);
              const relPath = path.relative(PUBLIC_DIR, fullPath).replace(/\\/g, '/');
              rawFiles.push({ fullPath, relPath, stat });
            } catch (err) {
              // ignore stat error
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error reading directory:', currentDir, err);
    }
  }

  await walk(PUBLIC_DIR);

  // Also check if any external or remote files referenced in usageMap exist
  // e.g. promo.mp4
  const existingUrls = new Set(rawFiles.map(f => '/' + f.relPath.replace(/^\/+/, '')));

  let totalSize = 0;
  let imagesCount = 0;
  let videosCount = 0;
  let fontsCount = 0;
  let vectorsCount = 0;
  let othersCount = 0;

  const files: MediaFile[] = [];

  for (const item of rawFiles) {
    const url = '/' + item.relPath;
    const ext = path.extname(item.relPath).toLowerCase().replace('.', '');
    const type = detectFileType(ext);
    const size = item.stat.size;
    totalSize += size;

    if (type === 'image') imagesCount++;
    else if (type === 'video') videosCount++;
    else if (type === 'font') fontsCount++;
    else if (type === 'vector') vectorsCount++;
    else othersCount++;

    // Determine folder ID:
    // 1. Explicit assignment in library data
    // 2. Fallback heuristic based on path location
    let folderId = libraryData.fileAssignments[item.relPath] ?? libraryData.fileAssignments[url];

    if (folderId === undefined) {
      // Default heuristic for initial discovery
      if (item.relPath.startsWith('uploads/')) {
        folderId = 'folder-uploads';
      } else if (item.relPath.startsWith('branding/')) {
        folderId = 'folder-branding';
      } else if (item.relPath.startsWith('icons/varFonts') || item.relPath.startsWith('icons/fonts') || ext === 'ttf' || ext === 'otf') {
        folderId = 'folder-fonts';
      } else if (item.relPath.startsWith('icons/')) {
        folderId = 'folder-icons';
      } else {
        folderId = 'folder-site-assets';
      }
      // Save heuristic to libraryData so assignments persist
      libraryData.fileAssignments[item.relPath] = folderId;
    }

    // Check usage
    const matchedUsage: string[] = [];
    const directUsage = usageMap.get(url.toLowerCase()) || usageMap.get(item.relPath.toLowerCase());
    if (directUsage) matchedUsage.push(...directUsage);

    // Also match by filename in case relative paths differ
    const fileNameOnly = path.basename(item.relPath).toLowerCase();
    for (const [key, labels] of usageMap.entries()) {
      if (key.endsWith('/' + fileNameOnly) || key === fileNameOnly) {
        for (const l of labels) {
          if (!matchedUsage.includes(l)) matchedUsage.push(l);
        }
      }
    }

    const customName = libraryData.customNames?.[item.relPath] || path.basename(item.relPath);

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
      modifiedAt: item.stat.mtime.toISOString(),
      usedIn: matchedUsage.length > 0 ? matchedUsage : undefined
    });
  }

  // Also include any remote media registered in settings e.g. promo.mp4 if not in public
  const remotePromo = 'https://api.hakobian.am/libs/v1/promo/promo.mp4';
  if (!existingUrls.has(remotePromo)) {
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

  // Persist any auto-assigned folders back to media_library.json
  await saveMediaLibraryData(libraryData);

  return {
    files,
    folders: libraryData.folders,
    stats: {
      totalFiles: files.length,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      imagesCount,
      videosCount,
      fontsCount,
      vectorsCount,
      othersCount
    }
  };
}
