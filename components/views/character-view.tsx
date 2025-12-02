'use client';

import React from 'react';
import { useCharacterStore } from '@/store/character-store';
import { Heart, Zap, Shield, Eye } from 'lucide-react';
import Image from 'next/image';
import { calculateBaseEvasion } from '@/lib/utils';
import VitalCard from '@/components/vital-card'; // Import common VitalCard
import StatButton from '@/components/stat-button'; // Import common StatButton

export default function CharacterView() {
  const { character, updateVitals, updateHope, updateEvasion } = useCharacterStore();
  // openDiceOverlay is used implicitly by StatButton component, so it's not an unused variable.

  // Fallback if loading
  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="animate-pulse">Loading Character...</div>
      </div>
    );
  }

  const expectedEvasion = calculateBaseEvasion(character);
  const isEvasionModified = character.evasion !== expectedEvasion;

  // Armor thresholds logic (duplicated from CombatView for consistency)
  const armorItem = character.character_inventory?.find(item => item.location === 'equipped_armor');
  let minorThreshold = 1;
  let majorThreshold = character.level;
  let severeThreshold = character.level * 2;

  if (armorItem?.library_item?.data?.base_thresholds) {
    const [baseMajor, baseSevere] = armorItem.library_item.data.base_thresholds.split('/').map((s: string) => parseInt(s.trim()));
    majorThreshold = baseMajor;
    severeThreshold = baseSevere;
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
            color={isEvasionModified ? "text-yellow-400" : "text-cyan-400"}
            icon={Eye} 
            onIncrement={() => updateEvasion(character.evasion + 1)}
            onDecrement={() => updateEvasion(character.evasion - 1)}
            isModified={isEvasionModified}
            expectedValue={expectedEvasion}
          />
          <VitalCard 
            label="Armor" 
            current={character.vitals.armor_current} 
            max={character.vitals.armor_max}
            color="text-blue-400"
            icon={Shield}
            onIncrement={() => updateVitals('armor_current', character.vitals.armor_current + 1)}
            onDecrement={() => updateVitals('armor_current', character.vitals.armor_current - 1)}
            isCriticalCondition={character.vitals.armor_current === 0 && character.vitals.armor_max > 0} // Only critical if we have armor slots and they are 0
            trackType="mark-bad"
            thresholds={{ minor: minorThreshold, major: majorThreshold, severe: severeThreshold }}
            disableCritColor={true}
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
          trackType="mark-bad"
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
          isCriticalCondition={character.vitals.stress_current === character.vitals.stress_max}
          trackType="fill-up-bad"
        />

        {/* Row 4: Hope (Rectangle) */}
        <VitalCard 
          label="Hope" 
          current={character.hope} 
          max={6} 
          color="text-dagger-gold"
          icon={Zap} 
          variant="rectangle"
          onIncrement={() => updateHope(character.hope + 1)}
          onDecrement={() => updateHope(character.hope - 1)}
          trackType="fill-up-good"
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