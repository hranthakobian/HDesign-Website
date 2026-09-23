/**
 * Visual Search Engine (Google Lens style)
 * Uses Perceptual Difference Hashing (dHash) and Color Histogram Cosine Similarity
 * to compare visual similarity of uploaded images against website portfolio & media assets.
 */

export interface ImageVisualFeatures {
  dHash: string; // 64-bit difference hash
  histogram: number[]; // 64-bin normalized color histogram (4x4x4 RGB)
  dominantColors: [number, number, number][]; // Top 3 dominant colors [r, g, b]
}

export interface VisualSearchResult {
  id: string;
  title: string;
  url: string;
  imageUrl: string;
  category?: string;
  similarity: number; // 0 to 100 (%)
  type: string;
}

/**
 * Creates an HTMLImageElement and loads the given URL/dataURL
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Extract visual features (dHash + Color Histogram) from an HTMLImageElement
 */
export function extractImageFeatures(img: HTMLImageElement): ImageVisualFeatures {
  // 1. Compute dHash (Difference Hash) using an 9x8 canvas
  const canvasHash = document.createElement('canvas');
  canvasHash.width = 9;
  canvasHash.height = 8;
  const ctxHash = canvasHash.getContext('2d', { willReadFrequently: true });
  
  let dHash = '';
  if (ctxHash) {
    ctxHash.drawImage(img, 0, 0, 9, 8);
    const imgData = ctxHash.getImageData(0, 0, 9, 8).data;
    
    // Convert to grayscale and compare adjacent pixels in each row
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const idxLeft = (y * 9 + x) * 4;
        const idxRight = (y * 9 + (x + 1)) * 4;

        const grayLeft = 0.299 * imgData[idxLeft] + 0.587 * imgData[idxLeft + 1] + 0.114 * imgData[idxLeft + 2];
        const grayRight = 0.299 * imgData[idxRight] + 0.587 * imgData[idxRight + 1] + 0.114 * imgData[idxRight + 2];

        dHash += grayLeft > grayRight ? '1' : '0';
      }
    }
  }

  // 2. Compute 64-bin Color Histogram & Dominant Colors on standard 32x32 canvas
  const canvasColor = document.createElement('canvas');
  canvasColor.width = 32;
  canvasColor.height = 32;
  const ctxColor = canvasColor.getContext('2d', { willReadFrequently: true });
  
  const histogram: number[] = new Array(64).fill(0);
  const colorBuckets: Record<string, { count: number; rgb: [number, number, number] }> = {};

  if (ctxColor) {
    ctxColor.drawImage(img, 0, 0, 32, 32);
    const colorData = ctxColor.getImageData(0, 0, 32, 32).data;
    const totalPixels = 32 * 32;

    for (let i = 0; i < colorData.length; i += 4) {
      const r = colorData[i];
      const g = colorData[i + 1];
      const b = colorData[i + 2];
      const a = colorData[i + 3];

      if (a < 30) continue; // Skip transparent pixels

      // Map 0-255 into 4 bins per channel (0, 1, 2, 3)
      const binR = Math.min(3, Math.floor(r / 64));
      const binG = Math.min(3, Math.floor(g / 64));
      const binB = Math.min(3, Math.floor(b / 64));

      const histIndex = binR * 16 + binG * 4 + binB;
      histogram[histIndex] = (histogram[histIndex] || 0) + 1;

      // Group into approximate color clusters for dominant colors
      const clusterKey = `${Math.floor(r / 32)},${Math.floor(g / 32)},${Math.floor(b / 32)}`;
      if (!colorBuckets[clusterKey]) {
        colorBuckets[clusterKey] = { count: 0, rgb: [r, g, b] };
      }
      colorBuckets[clusterKey].count++;
    }

    // Normalize histogram
    for (let i = 0; i < histogram.length; i++) {
      histogram[i] = histogram[i] / totalPixels;
    }
  }

  // Extract top dominant colors
  const dominantColors = Object.values(colorBuckets)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(c => c.rgb);

  return {
    dHash: dHash || '0'.repeat(64),
    histogram,
    dominantColors
  };
}

/**
 * Calculates Hamming distance between two binary hash strings
 */
export function hammingDistance(hash1: string, hash2: string): number {
  let dist = 0;
  const len = Math.min(hash1.length, hash2.length);
  for (let i = 0; i < len; i++) {
    if (hash1[i] !== hash2[i]) dist++;
  }
  return dist + Math.abs(hash1.length - hash2.length);
}

/**
 * Calculates Cosine Similarity between two numeric vectors (histograms)
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vec1.length; i++) {
    const a = vec1[i] || 0;
    const b = vec2[i] || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Compares two image feature sets and returns a similarity percentage (0-100)
 */
export function calculateImageSimilarity(f1: ImageVisualFeatures, f2: ImageVisualFeatures): number {
  // 1. Hash similarity: dHash is 64 bits. Distance 0 => 100%, Distance 64 => 0%
  const maxHashBits = 64;
  const hDist = hammingDistance(f1.dHash, f2.dHash);
  const hashSim = Math.max(0, 1 - hDist / maxHashBits);

  // 2. Color similarity: Cosine similarity of 64-bin color distribution (0.0 to 1.0)
  const colorSim = Math.max(0, cosineSimilarity(f1.histogram, f2.histogram));

  // 3. Combined score with weights (55% structural/hash similarity, 45% color distribution)
  const combined = hashSim * 0.55 + colorSim * 0.45;
  const percentage = Math.round(combined * 100);

  return Math.min(100, Math.max(0, percentage));
}

// In-memory cache for candidate image features to make comparison super fast
const featureCache = new Map<string, ImageVisualFeatures>();

/**
 * Computes features for an image URL with caching
 */
export async function getImageFeaturesWithCache(url: string): Promise<ImageVisualFeatures | null> {
  if (featureCache.has(url)) {
    return featureCache.get(url)!;
  }
  try {
    const img = await loadImage(url);
    const features = extractImageFeatures(img);
    featureCache.set(url, features);
    return features;
  } catch (err) {
    // If CORS or failed to load, return null
    return null;
  }
}

/**
 * Searches candidate images for visual similarity against a query image
 */
export async function searchVisualMatches(
  queryFileOrDataUrl: string | File | Blob,
  candidates: { id: string; title: string; url: string; imageUrl: string; category?: string; type?: string }[],
  onProgress?: (processed: number, total: number) => void
): Promise<VisualSearchResult[]> {
  // 1. Load query image
  let queryDataUrl = '';
  if (typeof queryFileOrDataUrl === 'string') {
    queryDataUrl = queryFileOrDataUrl;
  } else {
    queryDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(queryFileOrDataUrl);
    });
  }

  const queryImg = await loadImage(queryDataUrl);
  const queryFeatures = extractImageFeatures(queryImg);

  const results: VisualSearchResult[] = [];
  const validCandidates = candidates.filter(c => !!c.imageUrl);
  const total = validCandidates.length;

  for (let i = 0; i < total; i++) {
    const item = validCandidates[i];
    try {
      const candidateFeatures = await getImageFeaturesWithCache(item.imageUrl);
      if (candidateFeatures) {
        const similarity = calculateImageSimilarity(queryFeatures, candidateFeatures);
        // Only keep sensible matches (>= 25%)
        if (similarity >= 25) {
          results.push({
            id: item.id,
            title: item.title,
            url: item.url,
            imageUrl: item.imageUrl,
            category: item.category,
            similarity,
            type: item.type || 'image'
          });
        }
      }
    } catch {
      // Continue next candidate
    }
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  // Sort descending by similarity
  results.sort((a, b) => b.similarity - a.similarity);
  return results;
}
