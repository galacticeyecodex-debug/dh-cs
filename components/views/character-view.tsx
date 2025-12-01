'use client';

import React from 'react';
import { useCharacterStore } from '@/store/character-store';
import { Heart, Zap, Shield, Eye } from 'lucide-react';
import Image from 'next/image';
import VitalCard from '@/components/vital-card'; // Import common VitalCard
import StatButton from '@/components/stat-button'; // Import common StatButton

export default function CharacterView() {
  const { character, updateVitals, updateHope } = useCharacterStore();
  // openDiceOverlay is used implicitly by StatButton component, so it's not an unused variable.

  // Fallback if loading
  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="animate-pulse">Loading Character...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-700 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0">
          {character.image_url ? (
            <Image src={character.image_url} alt={character.name} width={64} height={64} className="w-full h-full object-cover" />
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

      {/* Vitals Grid - Reshaped for Mobile */}
      <div className="space-y-3">
        {/* Row 1: Evasion & Armor (Squares) */}
        <div className="grid grid-cols-2 gap-3">
          <VitalCard 
            label="Evasion" 
            current={character.evasion} 
            color="text-cyan-400"
            icon={Eye} // Imported implicitly or need to check imports. Evasion was missing icon in previous view? No, it used Shield in one view. Eye is good.
            // Evasion is read-only/derived usually, but VitalCard handles read-only if no onIncrement
          />
          <VitalCard 
            label="Armor" 
            current={character.vitals.armor_current} 
            max={character.vitals.armor_max}
            color="text-blue-400"
            icon={Shield}
            onIncrement={() => updateVitals('armor_current', character.vitals.armor_current + 1)}
            onDecrement={() => updateVitals('armor_current', character.vitals.armor_current - 1)}
            isCriticalCondition={character.vitals.armor_current === 0}
          />
        </div>

        {/* Row 2: Hit Points (Rectangle) */}
        <VitalCard 
          label="Hit Points" 
          current={character.vitals.hp_current} 
          max={character.vitals.hp_max}
          color="text-red-400"
          icon={Heart}
          variant="rectangle"
          onIncrement={() => updateVitals('hp_current', character.vitals.hp_current + 1)}
          onDecrement={() => updateVitals('hp_current', character.vitals.hp_current - 1)}
          isCriticalCondition={character.vitals.hp_current === 0}
        />

        {/* Row 3: Stress (Rectangle) */}
        <VitalCard 
          label="Stress" 
          current={character.vitals.stress_current} 
          max={character.vitals.stress_max}
          color="text-purple-400"
          icon={Zap}
          variant="rectangle"
          onIncrement={() => updateVitals('stress_current', character.vitals.stress_current + 1)}
          onDecrement={() => updateVitals('stress_current', character.vitals.stress_current - 1)}
          isCriticalCondition={character.vitals.stress_current === 0}
        />

        {/* Row 4: Hope (Rectangle) */}
        <VitalCard 
          label="Hope" 
          current={character.hope} 
          max={6} // Default max hope is usually small, often 5 or 6? Daggerheart usually max 5 or 6. Let's assume max 6 for UI or just show current.
          color="text-dagger-gold"
          icon={Zap} // Maybe a different icon for Hope? Zap is Stress. Maybe 'Star' or 'Sun'? Lucide has `Sparkle` or `Star`.
          variant="rectangle"
          onIncrement={() => updateHope(character.hope + 1)}
          onDecrement={() => updateHope(character.hope - 1)}
        />
      </div>

      {/* Stats Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Traits</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(character.stats).map(([key, value]) => (
            <StatButton key={key} label={key} value={value} />
          ))}
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