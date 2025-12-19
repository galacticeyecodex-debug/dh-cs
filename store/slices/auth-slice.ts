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
import { User } from '@supabase/supabase-js';
import createClient from '@/lib/supabase/client';
import { dataService } from '@/lib/data-service';
import { CharacterStore } from '@/types/store';

export interface AuthSlice {
  user: User | null;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
}

export const createAuthSlice: StateCreator<CharacterStore, [], [], AuthSlice> = (set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  fetchUser: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      set({ user });

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

      // Then fetch character
      // Dependent on CharacterSlice
      const state = get() as any;
      if (state.fetchCharacter) {
        await state.fetchCharacter(user.id);
      }
    } else {
      const state = get() as any;
      set({ user: null });
      if (state.setCharacter) state.setCharacter(null);
      // We might want to set isLoading to false here too if it's managed elsewhere
      // set({ isLoading: false } as any); 
    }
  },
});
