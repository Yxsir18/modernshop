import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/**
 * Upload an image to Cloudinary with optimization
 */
export async function uploadImage(
  fileBuffer: Buffer,
  folder: string,
  publicId?: string,
  transformation?: any
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `modernshop/${folder}`,
        public_id: publicId,
        transformation: transformation || {
          quality: 'auto',
          fetch_format: 'auto',
          crop: 'limit',
          width: 1200,
          height: 1200,
        },
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result?.secure_url || '',
            publicId: result?.public_id || '',
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Upload multiple images to Cloudinary
 */
export async function uploadMultipleImages(
  files: Buffer[],
  folder: string,
  transformation?: any
): Promise<Array<{ url: string; publicId: string }>> {
  const uploadPromises = files.map((file, index) =>
    uploadImage(file, folder, undefined, transformation)
  );
  return Promise.all(uploadPromises);
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`[CLOUDINARY] Failed to delete image ${publicId}:`, error);
  }
}

/**
 * Delete multiple images from Cloudinary
 */
export async function deleteMultipleImages(publicIds: string[]): Promise<void> {
  try {
    await cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    console.error('[CLOUDINARY] Failed to delete multiple images:', error);
  }
}

/**
 * Get optimized image URL
 */
export function getOptimizedUrl(publicId: string, transformations: any = {}): string {
  const defaultTransformations = {
    quality: 'auto',
    fetch_format: 'auto',
    ...transformations,
  };
  return cloudinary.url(publicId, defaultTransformations);
}
