/**
 * AUTH SERVICE (WEB IMPLEMENTATION)
 * ----------------------------------------------------------------------------
 * Implements the AuthService interface using Supabase Authentication.
 * 
 * RESPONSIBILITIES:
 * - Session Management: Wraps Supabase's `onAuthStateChange` to provide reactive user state.
 * - Global Store Sync: Automatically clears the Zustand character store upon sign-out.
 * - Persistence: Handles token-based authentication for the web environment.
 * 
 * NOTE: This file is excluded from sync to dh-cs-native.
 */

'use client';

import { useEffect, useState } from "react";
import { AuthError, Session, User, AuthChangeEvent } from "@supabase/supabase-js";
import createClient from "@/lib/supabase/client";
import { useCharacterStore } from "@/store/character-store";
import { AuthService } from "@/types/services";
import { AppUser, AppSession, AppAuthError } from "@/types/auth";

export function useAuthService(): AuthService {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<AppSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppAuthError | null>(null);

  // We use the store to clear data on logout
  const { setCharacter, setUser: setStoreUser } = useCharacterStore();

  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    async function fetchUser() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          // It's okay if no user, but if it's a real error, set it
          // Typically 'AuthSessionMissingError' just means not logged in
          if (error.name !== 'AuthSessionMissingError') {
            setError({ message: error.message, status: error.status });
          }
        }

        if (user) {
          setUser(user as unknown as AppUser);
          setStoreUser(user as unknown as AppUser); // Sync to store for friendship data
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session as unknown as AppSession);
        }
      } catch (error) {
        const authError = error as AuthError;
        setError({ message: authError.message, status: authError.status });
      } finally {
        setLoading(false);
      }
    }

    fetchUser();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      setSession(session as unknown as AppSession);
      setUser((session?.user as unknown as AppUser) ?? null);
      setLoading(false);

      if (event === 'SIGNED_OUT') {
        // Clear local state and global store on sign out
        setUser(null);
        setSession(null);
        setCharacter(null);
        setStoreUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setCharacter, setStoreUser]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { loading, error, session, user, signOut };
}
