import createClient from './client';
import { downsampleImage, MAX_IMAGE_FILE_SIZE, MAX_IMAGE_FILE_SIZE_MB } from '@/lib/image-utils';

/**
 * Uploads a character avatar image to Supabase Storage
 * @param userId - The user's ID (for organizing files by user)
 * @param file - The image file to upload
 * @param characterId - Optional character ID to use in filename
 * @returns The public URL of the uploaded image, or null if upload failed
 */
export async function uploadCharacterAvatar(
  userId: string,
  file: File,
  characterId?: string
): Promise<{ url: string | null; error: string | null }> {
  return uploadFile('character-avatars', userId, file, characterId);
}

export async function uploadCharacterImage(
  userId: string,
  file: File,
  characterId?: string
): Promise<{ url: string | null; error: string | null }> {
  return uploadFile('character-gallery', userId, file, characterId);
}

async function uploadFile(
  bucket: string,
  userId: string,
  file: File,
  characterId?: string
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return { url: null, error: 'File must be an image' };
  }

  // Validate file size
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    return { url: null, error: `File size must be less than ${MAX_IMAGE_FILE_SIZE_MB}` };
  }

  // Downsample image before upload
  let uploadData: File | Blob = file;
  let fileExt = file.name.split('.').pop();

  try {
    uploadData = await downsampleImage(file, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.8,
      format: 'image/jpeg'
    });
    fileExt = 'jpg';
  } catch (err) {
    console.warn('Image downsampling failed, uploading original:', err);
    // Fallback to original file if downsampling fails
  }

  // Create a unique filename
  const timestamp = Date.now();
  const fileName = characterId
    ? `${userId}/${characterId}_${timestamp}.${fileExt}`
    : `${userId}/${timestamp}.${fileExt}`;

  // Upload the file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, uploadData, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/jpeg'
    });

  if (error) {
    console.error('Error uploading file:', error);
    // Provide more specific error messages based on Supabase error
    if (error.message.includes('Bucket not found')) {
      return { url: null, error: 'Storage bucket not found. Please run the storage setup SQL.' };
    }
    return { url: null, error: error.message || 'Upload failed' };
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return { url: publicUrl, error: null };
}


/**
 * Deletes a character avatar from Supabase Storage
 * @param imageUrl - The full URL of the image to delete
 * @returns True if deletion was successful
 */
export async function deleteCharacterAvatar(imageUrl: string): Promise<boolean> {
  const supabase = createClient();

  try {
    // Extract the file path from the URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/character-avatars\/(.+)$/);

    if (!pathMatch) {
      console.error('Invalid image URL format');
      return false;
    }

    const filePath = pathMatch[1];

    const { error } = await supabase.storage
      .from('character-avatars')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error parsing image URL:', err);
    return false;
  }
}
