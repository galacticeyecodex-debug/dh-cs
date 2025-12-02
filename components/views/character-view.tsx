'use client';

import React from 'react';
import { useCharacterStore } from '@/store/character-store';
import { Heart, Zap, Shield, Eye } from 'lucide-react';
import Image from 'next/image';
import { calculateBaseEvasion, getClassBaseStat, getSystemModifiers } from '@/lib/utils';
import VitalCard from '@/components/vital-card'; // Import common VitalCard
import StatButton from '@/components/stat-button'; // Import common StatButton

export default function CharacterView() {
  const { character, updateVitals, updateHope, updateEvasion, updateModifiers } = useCharacterStore();

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="animate-pulse">Loading Character...</div>
      </div>
    );
  }

  // Helper to calculate totals and combine modifiers
  const getStatDetails = (stat: string, base: number) => {
    const systemMods = getSystemModifiers(character, stat);
    const userMods = character.modifiers?.[stat] || [];
    const allMods = [...systemMods, ...userMods];
    const total = base + allMods.reduce((acc, mod) => acc + mod.value, 0);
    return { total, allMods };
  };

  // --- EVASION ---
  const classBaseEvasion = getClassBaseStat(character, 'evasion');
  const { total: totalEvasion, allMods: evasionMods } = getStatDetails('evasion', classBaseEvasion);
  const isEvasionModified = totalEvasion !== classBaseEvasion; // Modified if not equal to class base

  // --- ARMOR ---
  const armorItem = character.character_inventory?.find(item => item.location === 'equipped_armor');
  let armorBaseScore = 0;
  let minorThreshold = 1;
  let majorThreshold = character.level;
  let severeThreshold = character.level * 2;

  if (armorItem?.library_item?.data) {
    armorBaseScore = (parseInt(armorItem.library_item.data.base_score) || 0); 
    // Base Score usually includes Level? No, Item Base Score is static. 
    // SRD: "Armor Score is equal to your equipped armor’s Base Score plus any permanent bonuses".
    // AND "Add your character’s level to your equipped armor’s Base Score".
    // So Base = Item Base + Level.
    armorBaseScore += character.level;

    if (armorItem.library_item.data.base_thresholds) {
      const [baseMajor, baseSevere] = armorItem.library_item.data.base_thresholds.split('/').map((s: string) => parseInt(s.trim()));
      majorThreshold = baseMajor;
      severeThreshold = baseSevere;
    }
  }
  
  const { total: totalArmorMax, allMods: armorMods } = getStatDetails('armor', armorBaseScore);


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
            current={totalEvasion} 
            color={isEvasionModified ? "text-yellow-400" : "text-cyan-400"}
            icon={Eye} 
            // Override manual update to use modifiers? 
            // For now, we disconnect the +/- buttons or make them add/remove simple modifiers?
            // Let's keep +/- disabled or mapped to something else if we strictly want Ledger.
            // Or we can just let them be shortcuts to add a "Manual Adjustment" +1/-1.
            // For simplicity in this iteration, I will disable the direct +/- buttons for Evasion 
            // and force users to use the Modifier Sheet (via clicking the card).
            // onIncrement={() => updateEvasion(character.evasion + 1)} 
            // onDecrement={() => updateEvasion(character.evasion - 1)}
            isModified={isEvasionModified}
            expectedValue={classBaseEvasion}
            modifiers={evasionMods}
            onUpdateModifiers={(mods) => updateModifiers('evasion', mods)}
          />
          <VitalCard 
            label="Armor" 
            current={character.vitals.armor_current} 
            max={totalArmorMax}
            color="text-blue-400"
            icon={Shield}
            onIncrement={() => updateVitals('armor_current', character.vitals.armor_current + 1)}
            onDecrement={() => updateVitals('armor_current', character.vitals.armor_current - 1)}
            isCriticalCondition={character.vitals.armor_current === 0 && totalArmorMax > 0}
            trackType="mark-bad"
            thresholds={{ minor: minorThreshold, major: majorThreshold, severe: severeThreshold }}
            disableCritColor={true}
            modifiers={armorMods}
            onUpdateModifiers={(mods) => updateModifiers('armor', mods)}
          />
        </div>

        {/* Row 2: Hit Points (Rectangle) */}
        <VitalCard 
          label="Hit Points" 
          current={character.vitals.hp_current} 
          max={character.vitals.hp_max} // HP Max is stored in DB. Should we allow modifiers to it? Yes.
          // But currently hp_max in DB is the source of truth.
          // Ideally: Base HP (Class) + Level Bonus? + Modifiers = Total Max.
          // For now, let's just pass user modifiers for display, but not affect the math unless we refactor HP logic fully.
          // Or: Total = DB HP Max + Modifiers?
          // Let's keep it simple: Ledger edits the 'modifiers' array. Total is displayed.
          // But VitalCard uses 'max' prop for the track length.
          // So we should pass `max={totalHP}` if we calculated it.
          // `character.vitals.hp_max` is likely the "Base" from creation + manual edits.
          // Let's treat `hp_max` as Base for now.
          color="text-red-400"
          icon={Heart}
          variant="rectangle"
          onIncrement={() => updateVitals('hp_current', character.vitals.hp_current + 1)}
          onDecrement={() => updateVitals('hp_current', character.vitals.hp_current - 1)}
          isCriticalCondition={character.vitals.hp_current === 0}
          trackType="mark-bad"
          modifiers={character.modifiers?.['hp']}
          onUpdateModifiers={(mods) => updateModifiers('hp', mods)}
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
          modifiers={character.modifiers?.['stress']}
          onUpdateModifiers={(mods) => updateModifiers('stress', mods)}
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
          modifiers={character.modifiers?.['hope']}
          onUpdateModifiers={(mods) => updateModifiers('hope', mods)}
        />
      </div>

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