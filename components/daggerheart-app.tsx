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
 *   - Active Session: Renders the main `MobileLayout` and switches between views (Character, Combat, Playmat, Inventory) based on the active tab.
 */

import MobileLayout from '@/components/mobile-layout';
import CharacterView from '@/components/views/character-view';
import PlaymatView from '@/components/views/playmat-view';
import InventoryView from '@/components/views/inventory-view';
import CombatView from '@/components/views/combat-view';
import { useCharacterStore } from '@/store/character-store';
import AuthButton from '@/components/auth-buttons';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { ErrorBoundary } from '@/components/error-boundary';
import DevErrorTriggers from '@/components/dev-error-triggers';

export default function DaggerheartApp({ clientUser }: { clientUser: User | null }) {
  const router = useRouter();
  const { activeTab, setCharacter, setUser, fetchUser, fetchCharacter, isLoading, character } = useCharacterStore();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    // If we have a clientUser from the server, set it immediately
    if (clientUser) {
      setUser(clientUser);
      // Only fetch user/character if we don't already have a character loaded
      // This prevents overwriting a character that was just selected
      if (!character) {
        // Then trigger the full fetchUser flow which checks/creates the profile and fetches the character
        fetchUser().then(() => {
          setInitialLoad(false);
        });
      } else {
        setInitialLoad(false);
      }
    } else {
      // If no user, just clear state
      setUser(null);
      setCharacter(null);
      setInitialLoad(false);
    }
  }, [clientUser, setUser, setCharacter, fetchUser, character]); // Added character to dependency array

  if (isLoading || initialLoad) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-dagger-dark text-white">
        <p>Loading application...</p>
        {!clientUser && <AuthButton />}
      </div>
    );
  }

  if (!clientUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-dagger-dark text-white p-4 text-center">
        <h1 className="text-3xl font-serif font-bold mb-4">Welcome to Daggerheart Companion</h1>
        <p className="mb-6 text-gray-300">Please log in to manage your characters.</p>
        <AuthButton />
      </div>
    );
  }

  // User logged in, but no character found
  if (clientUser && !character) {
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
      </MobileLayout>
      <DevErrorTriggers />
    </ErrorBoundary>
  );
}