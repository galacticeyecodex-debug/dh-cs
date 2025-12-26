/**
 * Authentication Slice
 * ----------------------------------------------------------------------------
 * This slice manages the user authentication state within the global character store.
 * It handles fetching the current user session from Supabase, creating user profiles
 * if they don't exist, and linking the authenticated user to their character data.
 * This separation allows the authentication logic to remain distinct from character
 * mechanics while still being accessible to the unified store.
 */

import { StateCreator } from 'zustand';
import { AppUser } from '@/types/auth';
import createClient from '@/lib/supabase/client';
import { dataService } from '@/lib/data-service';
import { CharacterStore } from '@/types/store';

export interface AuthSlice {
  user: AppUser | null;
  selectedCharacterId: string | null;
  setUser: (user: AppUser | null) => void;
  setSelectedCharacterId: (id: string | null) => void;
  fetchUser: (options?: { skipCharacterFetch?: boolean }) => Promise<void>;
}

export const createAuthSlice: StateCreator<CharacterStore, [], [], AuthSlice> = (set, get) => ({
  user: null,
  selectedCharacterId: null,
  setUser: (user) => set({ user }),
  setSelectedCharacterId: (id) => set({ selectedCharacterId: id }),
  fetchUser: async (options?: { skipCharacterFetch?: boolean }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Cast Supabase user to AppUser since structures are compatible
      const appUser = user as unknown as AppUser;
      set({ user: appUser });

      // Ensure profile exists
      try {
        const profile = await dataService.profile.get(user.id);

        if (!profile) {
          console.log("Profile missing, creating for user:", user.id);
          await dataService.profile.create(user.id, {
            username: user.user_metadata.full_name || user.email?.split('@')[0] || 'Traveler',
            avatar_url: user.user_metadata.avatar_url
          });
          console.log("Profile created successfully.");
        }
      } catch (error) {
        console.error("Error managing profile:", error);
      }

      // Only fetch character if not explicitly skipped
      // This prevents race conditions when user is selecting a specific character
      if (!options?.skipCharacterFetch) {
        const state = get() as any;
        if (state.fetchCharacter) {
          // If a character was explicitly selected, load that one
          // Otherwise, load the default (first) character
          const selectedId = state.selectedCharacterId;
          await state.fetchCharacter(user.id, selectedId || undefined);
        }
      }
    } else {
      const state = get() as any;
      set({ user: null, selectedCharacterId: null });
      if (state.setCharacter) state.setCharacter(null);
    }
  },
});
