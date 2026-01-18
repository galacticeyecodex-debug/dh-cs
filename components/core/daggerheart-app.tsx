'use client';

/**
 * DAGGERHEART APP COMPONENT
 * ----------------------------------------------------------------------------
 * The primary application shell and state manager for the authenticated user experience.
 *
 * FUNCTIONALITY:
 * - Session Management: Detailed handling of user authentication, ensuring the correct `clientUser` 
 *   is synced with the global store.
 * - Data Initialization: Orchestrates the initial fetching of the user's profile and active character data.
 * - Route Protection: Manages different view states based on authentication status:
 *   - Loading: Shows a spinner/message while fetching data.
 *   - Unauthenticated: Displays a welcome screen with a login prompt.
 *   - No Character: Prompts the user to create their first character if none exists.
 *   - Active Session: Renders the main `MobileLayout` and switches between views based on the active tab.
 * 
 * VIEWS:
 * - Character: Core character sheet
 * - Combat: Combat-focused view with attacks and abilities
 * - Playmat: Domain card management (loadout/vault)
 * - Inventory: Equipment and item management (via More menu)
 * - Downtime: Rest and project management (via More menu)
 * - Journal: Relationships and reputation (via More menu)
 */

import MobileLayout from '@/components/core/mobile-layout';
import CharacterView from '@/components/views/character/character-view';
import PlaymatView from '@/components/views/playmat/playmat-view';
import InventoryView from '@/components/views/inventory/inventory-view';
import CombatView from '@/components/views/combat/combat-view';
import DowntimeView from '@/components/views/downtime/downtime-view';
import JournalView from '@/components/views/journal/journal-view';
import SettingsView from '@/components/views/settings/settings-view';
import ProfileView from '@/components/views/profile/profile-view';
import DevModifiersView from '@/components/views/dev/dev-modifiers-view';
import { useCharacterStore } from '@/store/character-store';
import AuthButton from '@/components/auth/auth-buttons';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppUser } from '@/types/auth';
import { ErrorBoundary } from '@/components/core/error-boundary';
import DevErrorTriggers from '@/components/core/dev-error-triggers';

export default function DaggerheartApp({ clientUser }: { clientUser: AppUser | null }) {
  const router = useRouter();
  const { activeTab, setCharacter, setUser, fetchUser, isLoading, character, user, selectedCharacterId } = useCharacterStore();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    // Only run this effect once on mount
    if (!initialLoad) return;

    const initApp = async () => {
      // If we have a clientUser from the server, set it immediately
      if (clientUser) {
        setUser(clientUser);

        // Check if we already have a character loaded (from character selection page)
        const currentCharacter = useCharacterStore.getState().character;
        const selectedId = useCharacterStore.getState().selectedCharacterId;

        if (currentCharacter && selectedId && currentCharacter.id === selectedId) {
          // Character was already loaded by the selection page - don't re-fetch
          setInitialLoad(false);
        } else {
          // No character loaded yet, or need to load a different one
          // fetchUser will respect selectedCharacterId if set
          await fetchUser();
          setInitialLoad(false);
        }
      } else {
        // If no user, just clear state
        setUser(null);
        setCharacter(null);
        setInitialLoad(false);
      }
    };

    initApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  if (isLoading || initialLoad) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-dagger-dark text-white">
        <p>Loading application...</p>
        {!user && <AuthButton />}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-dagger-dark text-white p-4 text-center">
        <h1 className="text-3xl font-serif font-bold mb-4">Welcome to Daggerheart Companion</h1>
        <p className="mb-6 text-gray-300">Please log in to manage your characters.</p>
        <AuthButton />
      </div>
    );
  }

  // User logged in, but no character found
  if (user && !character) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-dagger-dark text-white p-4 text-center">
        <h1 className="text-3xl font-serif font-bold mb-4">No Character Found</h1>
        <p className="mb-6 text-gray-300">It looks like you don&apos;t have a character yet. Would you like to create one?</p>
        <button
          onClick={() => router.push('/create-character')}
          className="px-6 py-3 bg-dagger-gold text-black font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          Create New Character
        </button>
        <div className="mt-8">
          <AuthButton />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <MobileLayout>
        {activeTab === 'character' && <CharacterView />}
        {activeTab === 'combat' && <CombatView />}
        {activeTab === 'playmat' && <PlaymatView />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'downtime' && <DowntimeView />}
        {activeTab === 'journal' && <JournalView />}
        {activeTab === 'settings' && <SettingsView />}
        {activeTab === 'profile' && <ProfileView />}
        {activeTab === 'dev' && <DevModifiersView />}
      </MobileLayout>
      <DevErrorTriggers />
    </ErrorBoundary>
  );
}