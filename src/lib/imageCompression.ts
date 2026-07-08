/**
 * Compresses an image file client-side using HTML Canvas.
 * Resizes large images to a maximum dimension of 2560px (preserving aspect ratio)
 * and exports as WebP with 0.85 quality for optimal compression without visual quality loss.
 */
export async function compressImage(file: File): Promise<File> {
  // Return as-is if not a compressible image (e.g. SVG, GIF, non-image)
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Maximum dimensions for high-quality portfolio images
      const MAX_WIDTH = 2560;
      const MAX_HEIGHT = 2560;
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions preserving aspect ratio
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        if (width > height) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        } else {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file);
        return;
      }

      // Draw image onto canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Export as webp (which supports transparency and has superior compression)
      const targetMimeType = 'image/webp';
      const quality = 0.85;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // Generate file name with webp extension
          let newName = file.name;
          const lastDotIndex = file.name.lastIndexOf('.');
          if (lastDotIndex !== -1) {
            newName = file.name.substring(0, lastDotIndex) + '.webp';
          } else {
            newName = file.name + '.webp';
          }

          const compressedFile = new File([blob], newName, {
            type: targetMimeType,
            lastModified: Date.now(),
          });

          // Only return the compressed file if it actually reduces size
          if (compressedFile.size < file.size) {
            console.log(
              `Compressed: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) -> ${newName} (${(compressedFile.size / 1024 / 1024).toFixed(2)} MB) - Saved: ${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`
            );
            resolve(compressedFile);
          } else {
            console.log(`Original file is smaller, skipping compression: ${file.name}`);
            resolve(file);
          }
        },
        targetMimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
  });
}
