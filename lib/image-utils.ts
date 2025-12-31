/**
 * IMAGE UTILITIES
 * ----------------------------------------------------------------------------
 * Utilities for client-side image processing, including downsampling and compression.
 * 
 * Key Responsibilities:
 * - MAX_IMAGE_FILE_SIZE: Single source of truth for maximum upload size.
 * - downsampleImage: Resizes and compresses images using the Canvas API.
 */

/**
 * Maximum allowed file size for image uploads (in bytes).
 * Images are downsampled before upload, so this can be generous to accommodate
 * high-resolution photos from modern smartphones.
 */
export const MAX_IMAGE_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Human-readable version of the max file size for error messages.
 */
export const MAX_IMAGE_FILE_SIZE_MB = '20MB';

export interface DownsampleOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/webp';
}

/**
 * Resizes and compresses an image file using the browser's Canvas API.
 * 
 * @param file - The original image File object
 * @param options - Configuration for resizing and compression
 * @returns A promise that resolves to a new Blob containing the processed image
 */
export async function downsampleImage(
  file: File,
  options: DownsampleOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions keeping aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          format,
          quality
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
  });
}
