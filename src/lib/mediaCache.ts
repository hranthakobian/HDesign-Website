import { MediaFile, MediaFolder, StorageStats } from './mediaTypes';

export interface MediaCacheData {
  files: MediaFile[];
  folders: MediaFolder[];
  stats?: StorageStats;
  timestamp: number;
}

let memoryCache: MediaCacheData | null = null;
let activeFetchPromise: Promise<MediaCacheData> | null = null;
const listeners = new Set<(data: MediaCacheData) => void>();

/**
 * Returns current in-memory cached media library data, or null if not yet loaded.
 */
export function getCachedMedia(): MediaCacheData | null {
  return memoryCache;
}

/**
 * Subscribe to cache updates across all media pickers and manager components.
 */
export function subscribeToMediaCache(listener: (data: MediaCacheData) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Updates memory cache and notifies all active subscribers.
 */
export function notifyMediaCache(data: MediaCacheData): void {
  memoryCache = data;
  listeners.forEach(fn => {
    try {
      fn(data);
    } catch (e) {
      console.error('Media cache listener notification error:', e);
    }
  });
}

/**
 * Optimistically update the cache (e.g. after uploading or modifying a file).
 */
export function updateMediaCacheOptimistic(updater: (prev: MediaCacheData) => MediaCacheData): void {
  if (memoryCache) {
    const updated = updater(memoryCache);
    notifyMediaCache(updated);
  }
}

/**
 * Fetches media library with deduplication and caching.
 * If cached data is available (< 60s old) and forceRefresh is false, returns cached data immediately.
 */
export async function fetchMediaLibraryCached(
  token: string | null,
  forceRefresh = false
): Promise<MediaCacheData> {
  // If memory cache is fresh (< 60s) and forceRefresh is false, return it immediately
  if (!forceRefresh && memoryCache && Date.now() - memoryCache.timestamp < 60000) {
    return memoryCache;
  }

  // Deduplicate active inflight network requests
  if (activeFetchPromise) {
    return activeFetchPromise;
  }

  activeFetchPromise = (async () => {
    try {
      const res = await fetch('/api/admin/media', {
        headers: {
          Authorization: token || ''
        }
      });
      if (!res.ok) {
        throw new Error(`Չհաջողվեց բեռնել մեդիան: ${res.status}`);
      }
      const data = await res.json();
      const cacheData: MediaCacheData = {
        files: data.files || [],
        folders: data.folders || [],
        stats: data.stats,
        timestamp: Date.now()
      };
      notifyMediaCache(cacheData);
      return cacheData;
    } finally {
      activeFetchPromise = null;
    }
  })();

  return activeFetchPromise;
}

/**
 * Non-blocking background prefetch to pre-warm the cache before picker is opened.
 */
export function prefetchMediaLibrary(token: string | null): void {
  if (!token) return;
  fetchMediaLibraryCached(token, false).catch(err => {
    // Non-fatal prefetch failure
    console.warn('Background media prefetch notice:', err);
  });
}
