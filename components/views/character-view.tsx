import React, { useState } from 'react';
import { useCharacterStore } from '@/store/character-store';
import Image from 'next/image';
import { getClassBaseStat, getSystemModifiers } from '@/lib/utils';
import StatButton from '@/components/stat-button';
import CommonVitalsDisplay from '@/components/common-vitals-display';
import ExperienceSheet from '../experience-sheet';
import { Settings, Plus } from 'lucide-react';

export default function CharacterView() {
  const { character, updateModifiers, updateExperiences } = useCharacterStore();
  const [isExperienceSheetOpen, setIsExperienceSheetOpen] = useState(false);

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="animate-pulse">Loading Character...</div>
      </div>
    );
  }

  // Helper to calculate totals and combine modifiers for Traits
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

      {/* Vitals Grid */}
      <CommonVitalsDisplay character={character} />

      {/* Stats Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Traits</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(character.stats).map(([key, value]) => {
            const { total, allMods } = getStatDetails(key, value); 
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
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Experiences</h3>
          <button 
            onClick={() => setIsExperienceSheetOpen(true)}
            className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
          >
            <Settings size={12} /> Manage
          </button>
        </div>
        
        <div className="space-y-2">
          {character.experiences && character.experiences.length > 0 ? (
            character.experiences.map((exp, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm font-medium flex justify-between items-center">
                <span>{exp.name}</span>
                <span className="text-dagger-gold font-bold">+{exp.value}</span>
              </div>
            ))
          ) : (
            <div 
              onClick={() => setIsExperienceSheetOpen(true)}
              className="text-gray-500 text-sm italic p-4 border border-dashed border-white/10 rounded-lg text-center cursor-pointer hover:bg-white/5"
            >
              No experiences recorded. Tap to add.
            </div>
          )}
        </div>
      </div>

      <ExperienceSheet
        isOpen={isExperienceSheetOpen}
        onClose={() => setIsExperienceSheetOpen(false)}
        experiences={character.experiences || []}
        onUpdateExperiences={updateExperiences}
      />
    </div>
  );
}