'use client';

import UserMenu from '@/components/core/user-menu';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCharacterStore, Character } from '@/store/character-store';
import { dataService } from '@/lib/data-service';
import { Trash2, Sword } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function CharacterSelectPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  // Use refs to prevent stale closure issues and track intended selection
  const intendedCharacterRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  const {
    user,
    fetchCharacter,
    fetchUser,
    setSelectedCharacterId,
    character
  } = useCharacterStore();

  // Memoize the init function to prevent unnecessary re-renders
  const initPage = useCallback(async () => {
    // Get current user from store
    let activeUser = useCharacterStore.getState().user;

    // If no user in store, fetch user but skip auto-loading character
    if (!activeUser) {
      await fetchUser({ skipCharacterFetch: true });
      activeUser = useCharacterStore.getState().user;
    }

    if (!activeUser) {
      if (isMountedRef.current) router.push('/auth/login');
      return;
    }

    // Fetch the list of characters
    try {
      const data = await dataService.character.list(activeUser.id);
      if (isMountedRef.current) {
        setCharacters(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
      if (isMountedRef.current) setLoading(false);
    }
  }, [fetchUser, router]);

  useEffect(() => {
    isMountedRef.current = true;
    initPage();

    return () => {
      isMountedRef.current = false;
    };
  }, [initPage]);

  const handleSelectCharacter = async (characterId: string) => {
    // Prevent double-clicks and concurrent selections
    if (selectingId !== null) {
      return;
    }

    const activeUser = useCharacterStore.getState().user;
    if (!activeUser) {
      return;
    }

    // Set the selecting state to show visual feedback and prevent double-clicks
    setSelectingId(characterId);

    // Track the intended character to handle race conditions
    intendedCharacterRef.current = characterId;

    // Store the selected character ID so other parts of the app can respect it
    setSelectedCharacterId(characterId);

    try {
      // Fetch the selected character
      await fetchCharacter(activeUser.id, characterId);

      // Verify we're still trying to load this character (not cancelled by another selection)
      if (intendedCharacterRef.current !== characterId) {
        return;
      }

      // Verify the character was actually loaded correctly
      const loadedCharacter = useCharacterStore.getState().character;
      if (loadedCharacter?.id === characterId) {
        // Success - navigate to the client
        router.push('/client');
      } else {
        // Something went wrong - try again or show error
        console.error('Character ID mismatch after fetch:', {
          expected: characterId,
          got: loadedCharacter?.id
        });
        // Reset and allow retry
        setSelectingId(null);
        intendedCharacterRef.current = null;
      }
    } catch (error) {
      console.error('Error selecting character:', error);
      // Reset on error to allow retry
      if (isMountedRef.current) {
        setSelectingId(null);
        intendedCharacterRef.current = null;
      }
    }
  };

  const handleDeleteCharacter = async (e: React.MouseEvent, characterId: string, characterName: string) => {
    e.stopPropagation();
    if (selectingId !== null || deletingId !== null) return;

    if (confirm(`Are you sure you want to delete ${characterName}? This action cannot be undone.`)) {
      setDeletingId(characterId);
      try {
        await dataService.character.delete(characterId);
        setCharacters(prev => prev.filter(c => c.id !== characterId));
      } catch (error) {
        console.error('Error deleting character:', error);
        alert('Failed to delete character.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[100dvh] bg-dagger-dark text-white overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-dagger-panel">
          <div className="flex items-center gap-2 text-lg font-serif font-bold text-dagger-gold">
            <Sword size={20} />
            <span>Daggerheart</span>
          </div>
          <UserMenu />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center">
          <p>Loading characters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-dagger-dark text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-dagger-panel">
        <div className="flex items-center gap-2 text-lg font-serif font-bold text-dagger-gold">
          <Sword size={20} />
          <span>Daggerheart</span>
        </div>
        <UserMenu />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center justify-start px-4 pt-8 pb-8">
          <h1 className="text-3xl font-serif font-bold mb-6 text-center">Select Your Character</h1>
          <div className="mb-8 text-center">
            <Button
              onClick={() => router.push('/create-character')}
              disabled={selectingId !== null}
              className="px-6 py-3 bg-dagger-gold text-black font-bold rounded-full shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create New Character
            </Button>
          </div>
          {characters.length === 0 ? (
            <p className="text-center text-gray-300">No characters found. Create one to get started!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full max-w-7xl">
              {characters.map((char) => {
                const isSelecting = selectingId === char.id;
                const isDisabled = selectingId !== null;

                return (
                  <Card
                    key={char.id}
                    className={`
                    relative touch-manipulation bg-dagger-panel text-white border-white/10
                    transition-all duration-200 overflow-hidden min-h-[160px] flex flex-col justify-end
                    ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-dagger-panel-hover active:bg-dagger-panel-hover hover:scale-[1.02]'}
                    ${isSelecting ? 'ring-2 ring-dagger-gold scale-[0.98] opacity-80' : ''}
                    ${isDisabled && !isSelecting ? 'opacity-50' : ''}
                  `}
                    onClick={() => !isDisabled && handleSelectCharacter(char.id)}
                  >
                    {/* Background Image Overlay */}
                    {char.image_url && (
                      <div className="absolute inset-0 z-0">
                        <img
                          src={char.image_url}
                          alt={char.name}
                          className="w-full h-full object-cover opacity-40 transition-opacity duration-500 group-hover:opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-dagger-panel via-dagger-panel/60 to-transparent" />
                      </div>
                    )}

                    <CardHeader className="relative z-10 flex-row items-center gap-4 space-y-0 pb-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-dagger-gold flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate min-w-0 drop-shadow-lg">
                            <span className="truncate text-xl font-serif">{char.name}</span>
                            {isSelecting && (
                              <span className="inline-block w-4 h-4 border-2 border-dagger-gold border-t-transparent rounded-full animate-spin flex-shrink-0" />
                            )}
                          </div>
                          <button
                            onClick={(e) => handleDeleteCharacter(e, char.id, char.name)}
                            disabled={isDisabled || deletingId !== null}
                            className="text-red-400 hover:text-red-300 transition-colors p-1 disabled:opacity-50 flex-shrink-0 bg-black/20 rounded-full"
                            title="Delete character"
                          >
                            {deletingId === char.id ? (
                              <span className="inline-block w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-0 pb-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-black/30 border-white/10 text-white backdrop-blur-sm">Level {char.level}</Badge>
                        {(char.class_id || char.ancestry) && (
                          <div className="flex flex-wrap gap-1">
                            {char.class_id && <Badge variant="secondary" className="bg-dagger-gold/20 border-dagger-gold/20 text-dagger-gold backdrop-blur-sm">{char.class_id}</Badge>}
                            {char.ancestry && <Badge variant="secondary" className="bg-white/5 border-white/5 text-gray-300 backdrop-blur-sm">{char.ancestry}</Badge>}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
