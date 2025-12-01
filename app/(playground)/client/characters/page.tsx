'use client';

import MobileLayout from '@/components/mobile-layout';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import createClient from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCharacterStore, Character } from '@/store/character-store';

export default function CharacterSelectPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const { user, fetchCharacter, fetchUser } = useCharacterStore();

  useEffect(() => {
    const initData = async () => {
      let activeUser = user;

      if (!activeUser) {
        // Try to fetch user from Supabase if store is empty
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (sbUser) {
          activeUser = sbUser;
          // Sync store
          await fetchUser(); 
        } else {
          // Really not logged in
          router.push('/auth/login');
          return;
        }
      }

      // Now fetch characters for the confirmed user
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', activeUser.id)
        .limit(10);

      if (error) {
        console.error('Error fetching characters:', error);
      } else {
        setCharacters(data || []);
      }
      setLoading(false);
    };

    initData();
  }, [user, supabase, router, fetchUser]);

  const handleSelectCharacter = async (characterId: string) => {
    if (!user) {
       // Should be handled by useEffect, but safe guard
       const { data: { user: sbUser } } = await supabase.auth.getUser();
       if (sbUser) {
         await fetchCharacter(sbUser.id, characterId);
       }
    } else {
       await fetchCharacter(user.id, characterId);
    }
    router.push('/client');
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
