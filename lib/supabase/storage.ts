import createClient from './client';

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
): Promise<string | null> {
  const supabase = createClient();

  // Validate file type
  if (!file.type.startsWith('image/')) {
    console.error('File must be an image');
    return null;
  }

  // Validate file size (max 2MB)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    console.error('File size must be less than 2MB');
    return null;
  }

  // Create a unique filename
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const fileName = characterId
    ? `${userId}/${characterId}_${timestamp}.${fileExt}`
    : `${userId}/${timestamp}.${fileExt}`;

  // Upload the file
  const { data, error } = await supabase.storage
    .from('character-avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading file:', error);
    return null;
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('character-avatars')
    .getPublicUrl(data.path);

  return publicUrl;
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
