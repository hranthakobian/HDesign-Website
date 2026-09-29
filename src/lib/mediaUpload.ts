import { MediaFile } from './mediaTypes';

export interface UploadProgressState {
  fileIndex: number;
  totalFiles: number;
  fileName: string;
  fileSize: number;
  percent: number;
  loadedBytes: number;
  totalBytes: number;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Upload a single file with native XHR progress tracking (0% -> 100%).
 */
export function uploadFileWithProgress(
  file: File,
  folderId: string | null | undefined,
  authToken: string,
  onProgress?: (progress: UploadProgressState) => void,
  fileIndex = 0,
  totalFiles = 1
): Promise<{ success: boolean; file?: MediaFile; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    if (folderId && folderId !== 'trash' && folderId !== 'gallery') {
      formData.append('folderId', folderId);
    }

    if (xhr.upload && onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && e.total > 0) {
          const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
          onProgress({
            fileIndex,
            totalFiles,
            fileName: file.name,
            fileSize: file.size,
            percent,
            loadedBytes: e.loaded,
            totalBytes: e.total
          });
        }
      });
    }

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.success) {
          if (onProgress) {
            onProgress({
              fileIndex,
              totalFiles,
              fileName: file.name,
              fileSize: file.size,
              percent: 100,
              loadedBytes: file.size,
              totalBytes: file.size
            });
          }
          resolve({ success: true, file: data.file });
        } else {
          resolve({ success: false, error: data.error || `Սխալ (${xhr.status})` });
        }
      } catch (err: any) {
        resolve({ success: false, error: `Անվավեր պատասխան սերվերից (${xhr.status})` });
      }
    });

    xhr.addEventListener('error', () => {
      resolve({ success: false, error: 'Ցանցային խնդիր վերբեռնելիս' });
    });

    xhr.addEventListener('abort', () => {
      resolve({ success: false, error: 'Վերբեռնումը ընդհատվել է' });
    });

    xhr.open('POST', '/api/admin/media');
    if (authToken && authToken.trim()) {
      xhr.setRequestHeader('Authorization', authToken.trim());
    }
    xhr.send(formData);
  });
}
