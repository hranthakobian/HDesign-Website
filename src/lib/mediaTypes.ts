export interface MediaFolder {
  id: string;
  name: string;
  color: string; // Hex color e.g. '#3B82F6'
  parentId: string | null; // null for top-level folders, or folder ID for nested subfolders
  createdAt: string;
  updatedAt?: string;
}

export type MediaFileType = 'image' | 'video' | 'audio' | 'font' | 'vector' | 'document' | 'other';

export interface MediaFile {
  id: string;             // unique identifier
  name: string;           // file name e.g. "eleven.png"
  url: string;            // public URL e.g. "/branding/eleven.png"
  relPath: string;        // relative path inside public e.g. "branding/eleven.png"
  folderId: string | null;// folder ID or null for root
  size: number;           // file size in bytes
  sizeFormatted: string;  // e.g. "482 KB", "1.2 MB"
  type: MediaFileType;
  extension: string;      // e.g. "png", "svg", "ttf"
  dimensions?: { width: number; height: number };
  modifiedAt: string;     // ISO date
  usedIn?: string[];      // e.g. ["Բրենդինգ (Branding)", "Կարգավորումներ (Settings)"]
  tags?: string[];
  isTrashed?: boolean;    // true if file is in trash
  trashedAt?: string;     // ISO date when trashed
  originalFolderId?: string | null; // folder where it belonged before trash
  daysRemaining?: number; // days until auto-deletion
  isPinned?: boolean;     // true if pinned to top
}

export interface TrashItemMeta {
  trashedAt: string;
  originalFolderId: string | null;
}

export interface TrashSettings {
  autoDeleteEnabled: boolean; // default true
  retentionDays: number;      // default 30 days
}

export interface MediaLibraryData {
  folders: MediaFolder[];
  fileAssignments: Record<string, string | null>; // file id/path -> folderId
  customNames?: Record<string, string>; // file id/path -> custom display name
  trash?: Record<string, TrashItemMeta>; // fileId -> trash metadata
  trashSettings?: TrashSettings;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  totalSizeFormatted: string;
  storageLimit: number;
  storageLimitFormatted: string;
  storageRemaining: number;
  storageRemainingFormatted: string;
  storagePercent: number;
  isSupabaseConnected: boolean;
  imagesCount: number;
  videosCount: number;
  fontsCount: number;
  vectorsCount: number;
  othersCount: number;
  imagesSizeFormatted: string;
  videosSizeFormatted: string;
  fontsSizeFormatted: string;
  trashCount?: number;
  trashSize?: number;
  trashSizeFormatted?: string;
}

export type ViewMode = 'large-icons' | 'medium-icons' | 'list' | 'details' | 'tiles';

export type SortField = 'name' | 'size' | 'modifiedAt' | 'type' | 'folder';
export type SortOrder = 'asc' | 'desc';

export interface SortCriterion {
  field: SortField;
  order: SortOrder;
}

export interface FolderStats {
  count: number;
  size: number;
  sizeFormatted: string;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

