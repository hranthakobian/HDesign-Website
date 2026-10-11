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

// 4MB per chunk: safely below Vercel's 4.5MB serverless limit and Next.js 10MB proxy limit
const CHUNK_SIZE = 4 * 1024 * 1024;

interface XhrResponse {
  status: number;
  ok: boolean;
  data: any;
  text: string;
}

function sendXHR(
  formData: FormData,
  authToken: string,
  onChunkProgress?: (loaded: number, total: number) => void
): Promise<XhrResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (xhr.upload && onChunkProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && e.total > 0) {
          onChunkProgress(e.loaded, e.total);
        }
      });
    }

    xhr.addEventListener('load', () => {
      let data: any = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch (e) {}

      resolve({
        status: xhr.status,
        ok: xhr.status >= 200 && xhr.status < 300,
        data,
        text: xhr.responseText
      });
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Ցանցային խնդիր վերբեռնելիս'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Վերբեռնումը ընդհատվել է'));
    });

    xhr.open('POST', '/api/admin/media');
    if (authToken && authToken.trim()) {
      xhr.setRequestHeader('Authorization', authToken.trim());
    }
    xhr.send(formData);
  });
}

/**
 * Upload large files chunk-by-chunk (4MB slices) with retries and progress tracking.
 */
async function uploadWithChunks(
  file: File,
  folderId: string | null | undefined,
  authToken: string,
  onProgress?: (progress: UploadProgressState) => void,
  fileIndex = 0,
  totalFiles = 1,
  replaceFileId?: string | null
): Promise<{ success: boolean; file?: MediaFile; error?: string }> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = `up_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  let finalFile: MediaFile | undefined;

  for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
    const start = chunkIdx * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    const chunkBlob = file.slice(start, end);

    const formData = new FormData();
    formData.append('file', chunkBlob, file.name);
    formData.append('isChunk', 'true');
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', String(chunkIdx));
    formData.append('totalChunks', String(totalChunks));
    formData.append('fileName', file.name);
    if (folderId && folderId !== 'trash' && folderId !== 'gallery') {
      formData.append('folderId', folderId);
    }
    if (replaceFileId) {
      formData.append('replaceFileId', replaceFileId);
    }

    // Retry up to 3 times per chunk for network resiliency
    let attempt = 0;
    let chunkSuccess = false;
    let lastError = '';

    while (attempt < 3 && !chunkSuccess) {
      attempt++;
      try {
        const res = await sendXHR(formData, authToken, (loaded) => {
          if (onProgress) {
            const overallLoaded = Math.min(file.size, start + loaded);
            const percent = Math.min(99, Math.round((overallLoaded / file.size) * 100));
            onProgress({
              fileIndex,
              totalFiles,
              fileName: file.name,
              fileSize: file.size,
              percent,
              loadedBytes: overallLoaded,
              totalBytes: file.size
            });
          }
        });

        if (res.ok && res.data && res.data.success) {
          chunkSuccess = true;
          if (res.data.file) {
            finalFile = res.data.file;
          }
        } else {
          if (res.status === 413) {
            return {
              success: false,
              error: 'Նիշքի ծավալը չափազանց մեծ է սերվերի համար (413 Payload Too Large):'
            };
          }
          lastError = (res.data && res.data.error) || (res.status ? `Սխալ (${res.status})` : 'Սխալ կտորը վերբեռնելիս');
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, attempt * 1000));
          }
        }
      } catch (err: any) {
        lastError = err.message || 'Ցանցային խնդիր վերբեռնելիս';
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, attempt * 1000));
        }
      }
    }

    if (!chunkSuccess) {
      return {
        success: false,
        error: `${file.name}: ${lastError || 'Չհաջողվեց վերբեռնել բոլոր կտորները'}`
      };
    }
  }

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

  return { success: true, file: finalFile };
}

/**
 * Upload single small file (<= 4MB) in a single request.
 */
async function uploadSingleFile(
  file: File,
  folderId: string | null | undefined,
  authToken: string,
  onProgress?: (progress: UploadProgressState) => void,
  fileIndex = 0,
  totalFiles = 1,
  replaceFileId?: string | null
): Promise<{ success: boolean; file?: MediaFile; error?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId && folderId !== 'trash' && folderId !== 'gallery') {
    formData.append('folderId', folderId);
  }
  if (replaceFileId) {
    formData.append('replaceFileId', replaceFileId);
  }

  try {
    const res = await sendXHR(formData, authToken, (loaded, total) => {
      if (onProgress && total > 0) {
        const percent = Math.min(99, Math.round((loaded / total) * 100));
        onProgress({
          fileIndex,
          totalFiles,
          fileName: file.name,
          fileSize: file.size,
          percent,
          loadedBytes: loaded,
          totalBytes: total
        });
      }
    });

    if (res.ok && res.data && res.data.success) {
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
      return { success: true, file: res.data.file };
    } else {
      if (res.status === 413) {
        return {
          success: false,
          error: 'Նիշքի ծավալը չափազանց մեծ է սերվերի համար (413 Payload Too Large):'
        };
      }
      return {
        success: false,
        error: (res.data && res.data.error) || (res.status ? `Սխալ (${res.status})` : 'Անվավեր պատասխան սերվերից')
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Ցանցային խնդիր վերբեռնելիս'
    };
  }
}

/**
 * Upload a file with progress tracking (0% -> 100%).
 * Automatically chunks files larger than 4MB to prevent HTTP 413 errors.
 */
export function uploadFileWithProgress(
  file: File,
  folderId: string | null | undefined,
  authToken: string,
  onProgress?: (progress: UploadProgressState) => void,
  fileIndex = 0,
  totalFiles = 1,
  replaceFileId?: string | null
): Promise<{ success: boolean; file?: MediaFile; error?: string }> {
  if (file.size > CHUNK_SIZE) {
    return uploadWithChunks(file, folderId, authToken, onProgress, fileIndex, totalFiles, replaceFileId);
  }
  return uploadSingleFile(file, folderId, authToken, onProgress, fileIndex, totalFiles, replaceFileId);
}
