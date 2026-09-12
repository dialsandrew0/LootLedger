/**
 * Client-side image optimization and validation utility.
 * Downscales large camera photos to an optimal resolution (max 1600px dimension)
 * and compresses them to clean, lightweight JPEG base64 strings.
 */

export interface OptimizedImageResult {
  dataUrl: string;
  originalSizeBytes: number;
  optimizedSizeBytes: number;
  width: number;
  height: number;
  mimeType: string;
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
];

export async function optimizeImageFile(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<OptimizedImageResult> {
  // 1. MIME type validation
  const lowerType = file.type.toLowerCase();
  const isValidType = ALLOWED_MIME_TYPES.some(t => lowerType.includes(t.replace('image/', ''))) || lowerType.startsWith('image/');
  if (!isValidType) {
    throw new Error(`Unsupported file type: ${file.type || 'unknown'}. Please upload a JPEG, PNG, or WebP photo.`);
  }

  // 2. File size ceiling check (e.g. Reject files larger than 25MB before reading into memory)
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('Image file is too large (over 25MB). Please upload a smaller image.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image file from disk.'));
    };

    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        reject(new Error('Corrupted or unreadable image file.'));
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down if either dimension exceeds maxDimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback to original if 2D context unavailable
            return resolve({
              dataUrl: event.target?.result as string,
              originalSizeBytes: file.size,
              optimizedSizeBytes: file.size,
              width: img.width,
              height: img.height,
              mimeType: file.type || 'image/jpeg',
            });
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG with standard quality
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
          // Estimate byte size of base64
          const optimizedSizeBytes = Math.round((optimizedDataUrl.length * 3) / 4);

          resolve({
            dataUrl: optimizedDataUrl,
            originalSizeBytes: file.size,
            optimizedSizeBytes,
            width,
            height,
            mimeType: 'image/jpeg'
          });
        } catch (err: any) {
          reject(new Error(`Failed to optimize image: ${err.message || 'Canvas processing error'}`));
        }
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
