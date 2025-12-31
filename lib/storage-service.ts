/**
 * STORAGE SERVICE (WEB IMPLEMENTATION)
 * ----------------------------------------------------------------------------
 * Implements the StorageService interface using Supabase Storage buckets.
 * 
 * CAPABILITIES:
 * - Avatar Uploads: Handles character portrait storage in 'character-avatars'.
 * - Gallery Uploads: Handles auxiliary character images in 'character-gallery'.
 * - Validation: Includes file type and size checks (see MAX_IMAGE_FILE_SIZE in image-utils).
 * 
 * NOTE: This file is excluded from sync to dh-cs-native.
 */

import { uploadCharacterAvatar as sbUploadAvatar, uploadCharacterImage as sbUploadImage } from '@/lib/supabase/storage';

// Re-export Supabase storage functions
// This file exists to provide a uniform interface for both Web (Supabase) and Native (Local/Capacitor) apps.
// The Native app will implement these functions differently (or mock them).

export const uploadCharacterAvatar = sbUploadAvatar;
export const uploadCharacterImage = sbUploadImage;
