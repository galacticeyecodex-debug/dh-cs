'use client';

import React from 'react';
import { useCharacterStore } from '@/store/character-store';
import Image from 'next/image';
import { getClassBaseStat, getSystemModifiers } from '@/lib/utils';
import StatButton from '@/components/stat-button';
import CommonVitalsDisplay from '@/components/common-vitals-display'; // Import the new common component

export default function CharacterView() {
  const { character, updateModifiers } = useCharacterStore();

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="animate-pulse">Loading Character...</div>
      </div>
    );
  }

  // Helper to calculate totals and combine modifiers for Traits (still needed here)
  const getStatDetails = (stat: string, base: number) => {
    const systemMods = getSystemModifiers(character, stat);
    const userMods = character.modifiers?.[stat] || [];
    const allMods = [...systemMods, ...userMods];
    const uniqueMods = Array.from(new Map(allMods.map(mod => [mod.id, mod])).values());
    const total = base + uniqueMods.reduce((acc, mod) => acc + mod.value, 0);
    return { total, allMods: uniqueMods };
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-700 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0">
          {character.image_url ? (
            <Image 
              src={character.image_url} 
              alt={character.name} 
              width={64} 
              height={64} 
              className="w-full h-full object-cover"
              priority 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-dagger-gold to-orange-600 text-black">
              {character.name[0]}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-white">{character.name}</h1>
          <p className="text-sm text-gray-400">Level {character.level} {character.class_id} • {character.subclass_id}</p>
        </div>
      </div>

      {/* Vitals Grid - Now handled by CommonVitalsDisplay */}
      <CommonVitalsDisplay character={character} />

      {/* Stats Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Traits</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(character.stats).map(([key, value]) => {
            const { total, allMods } = getStatDetails(key, value); // Base is the assigned stat value
            return (
              <StatButton 
                key={key} 
                label={key} 
                value={total} 
                baseValue={value}
                modifiers={allMods}
                onUpdateModifiers={(mods) => updateModifiers(key, mods)}
              />
            );
          })}
        </div>
      </div>

      {/* Experiences Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Experiences</h3>
        <div className="space-y-2">
          {character.experiences && character.experiences.length > 0 ? (
            character.experiences.map((exp, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm font-medium">
                {exp}
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm italic">No experiences recorded.</div>
          )}
        </div>
      </div>
    </div>
  );
}