/**
 * PLATFORM-AGNOSTIC AUTH TYPES
 * ----------------------------------------------------------------------------
 * Defines generic user and session interfaces to decouple the application
 * from specific authentication providers (e.g., Supabase, Firebase, Mock).
 * 
 * KEY RESPONSIBILITIES:
 * - Type Safety: Provides consistent user and session models across all platforms.
 * - Decoupling: Removes dependency on @supabase/supabase-js in the shared codebase.
 * 
 * NOTE: This file is the source of truth and is synced to the native app.
 */

export interface AppUser {
  id: string;
  email?: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
  aud?: string;
  created_at?: string;
  app_metadata?: {
    provider?: string;
    [key: string]: any;
  };
}

export interface AppSession {
  user: AppUser;
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user_id?: string;
}

export interface AppAuthError {
  message: string;
  status?: number;
}
