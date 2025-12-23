/**
 * SERVICE INTERFACES
 * ----------------------------------------------------------------------------
 * Defines the strict contracts for core application services (Auth, Storage).
 * 
 * PURPOSE:
 * - Enables "Dependency Injection" between Web and Native apps.
 * - Ensures both Supabase (Web) and Zustand/SQLite (Native) implementations
 *   return identical data structures to shared UI components.
 */

/**
 * SERVICE INTERFACES
 * ----------------------------------------------------------------------------
 * Defines the strict contracts for core application services (Auth, Storage).
 * 
 * PURPOSE:
 * - Enables "Dependency Injection" between Web and Native apps.
 * - Ensures both Supabase (Web) and Zustand/SQLite (Native) implementations
 *   return identical data structures to shared UI components.
 */

import { AppUser, AppSession, AppAuthError } from './auth';

export interface AuthService {
  user: AppUser | null;
  session: AppSession | null;
  loading: boolean;
  error: AppAuthError | null;
  signOut: () => Promise<void>;
}

export interface StorageService {
  uploadCharacterAvatar: (userId: string, file: File) => Promise<{ url: string | null; error: string | null }>;
  uploadCharacterImage: (userId: string, file: File, characterId: string) => Promise<{ url: string | null; error: string | null }>;
}
