'use client';

import MobileLayout from '@/components/mobile-layout';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCharacterStore, Character } from '@/store/character-store';
import { dataService } from '@/lib/data-service';

export default function CharacterSelectPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, fetchCharacter, fetchUser } = useCharacterStore();

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // 1. Ensure User is Authenticated
      let activeUser = user;
      if (!activeUser) {
        await fetchUser();
        // Access store directly to get the fresh user state after fetch
        activeUser = useCharacterStore.getState().user;
      }

      if (!activeUser) {
        if (mounted) router.push('/auth/login');
        return;
      }

      // 2. Fetch Characters
      try {
        const data = await dataService.character.list(activeUser.id);
        if (mounted) {
          setCharacters(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching characters:', error);
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => { mounted = false; };
  }, [user, fetchUser, router]);

  const handleSelectCharacter = async (characterId: string) => {
    const activeUser = useCharacterStore.getState().user;
    if (activeUser) {
       await fetchCharacter(activeUser.id, characterId);
       router.push('/client');
    }
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-full text-white">
          <p>Loading characters...</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col items-center justify-start h-full px-4 pt-4 pb-24">
        <h1 className="text-3xl font-serif font-bold mb-6 text-center">Select Your Character</h1>
        <div className="mb-8 text-center">
          <Button
            onClick={() => router.push('/create-character')}
            className="px-6 py-3 bg-dagger-gold text-black font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
          >
            Create New Character
          </Button>
        </div>
        {characters.length === 0 ? (
          <p className="text-center text-gray-300">No characters found. Create one to get started!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-md">
            {characters.map((character) => (
              <Card key={character.id} className="cursor-pointer bg-dagger-panel text-white border-white/10 hover:bg-dagger-panel-hover" onClick={() => handleSelectCharacter(character.id)}>
                <CardHeader>
                  <CardTitle className="text-dagger-gold">{character.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Level {character.level}</p>
                  <p>Class: {character.class_id || 'Unknown'}</p>
                  <p>Ancestry: {character.ancestry || 'Unknown'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
