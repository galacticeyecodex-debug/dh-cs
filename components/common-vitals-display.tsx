'use client';

import React from 'react';
import { useCharacterStore } from '@/store/character-store';
import { Shield, Zap, Heart, Eye } from 'lucide-react';
import { getClassBaseStat, getSystemModifiers } from '@/lib/utils';
import VitalCard from '@/components/vital-card';

// Define a type for the component props
interface CommonVitalsDisplayProps {
  character: any; // Ideally, a more specific Character type would be used here
}

export default function CommonVitalsDisplay({ character }: CommonVitalsDisplayProps) {
  const { updateVitals, updateHope, updateEvasion, updateModifiers } = useCharacterStore();

  // Helper to calculate totals and combine modifiers
  const getStatDetails = (stat: string, base: number) => {
    const systemMods = getSystemModifiers(character, stat);
    const userMods = character.modifiers?.[stat] || [];
    const allMods = [...systemMods, ...userMods];
    const uniqueMods = Array.from(new Map(allMods.map(mod => [mod.id, mod])).values()); // Deduplicate by ID
    const total = base + uniqueMods.reduce((acc, mod) => acc + mod.value, 0);
    return { total, allMods: uniqueMods };
  };

  // --- EVASION ---
  const classBaseEvasion = getClassBaseStat(character, 'evasion');
  const { total: totalEvasion, allMods: evasionMods } = getStatDetails('evasion', classBaseEvasion);
  const isEvasionModified = totalEvasion !== classBaseEvasion;

  // --- ARMOR ---
  const armorItem = character.character_inventory?.find(item => item.location === 'equipped_armor');
  let armorBaseScore = 0;
  const minorThreshold = 1;
  let majorThreshold = character.level;
  let severeThreshold = character.level * 2;

  if (armorItem?.library_item?.data) {
    armorBaseScore = (parseInt(armorItem.library_item.data.base_score) || 0);

    if (armorItem.library_item.data.base_thresholds) {
      const [baseMajor, baseSevere] = armorItem.library_item.data.base_thresholds.split('/').map((s: string) => parseInt(s.trim()));
      majorThreshold = baseMajor + character.level;
      severeThreshold = baseSevere + character.level;
    }
  }
  const { total: totalArmorMax, allMods: armorMods } = getStatDetails('armor', armorBaseScore);

  // --- HIT POINTS ---
  const classBaseHP = getClassBaseStat(character, 'hit_points');
  const { total: totalHPMax, allMods: hpMods } = getStatDetails('hit_points', classBaseHP);

  // --- STRESS ---
  const classBaseStress = getClassBaseStat(character, 'stress');
  const { total: totalStressMax, allMods: stressMods } = getStatDetails('stress', classBaseStress);

  // --- HOPE ---
  // Max Hope is generally a fixed value (6) and not directly modified by items in the SRD, 
  // but it can have user modifiers, so we calculate totalHopeMax for consistency with the Ledger.
  const baseHope = 6;
  const { total: totalHopeMax, allMods: hopeMods } = getStatDetails('hope', baseHope);


  return (
    <div className="space-y-3">
      {/* Row 1: Evasion & Armor (Squares) */}
      <div className="grid grid-cols-2 gap-3">
        <VitalCard
          label="Evasion"
          current={totalEvasion}
          color={isEvasionModified ? "text-yellow-400" : "text-cyan-400"}
          icon={Eye}
          isModified={isEvasionModified}
          expectedValue={classBaseEvasion}
          modifiers={evasionMods}
          onUpdateModifiers={(mods) => updateModifiers('evasion', mods)}
        />
        <VitalCard
          label="Armor"
          current={character.vitals.armor_slots}
          max={totalArmorMax}
          color="text-blue-400"
          icon={Shield}
          onIncrement={() => updateVitals('armor_slots', character.vitals.armor_slots + 1)}
          onDecrement={() => updateVitals('armor_slots', character.vitals.armor_slots - 1)}
          isCriticalCondition={character.vitals.armor_slots === 0 && totalArmorMax > 0}
          thresholds={character.damage_thresholds}
          trackType="mark-bad"
          disableCritColor={true}
          modifiers={armorMods}
          onUpdateModifiers={(mods) => updateModifiers('armor', mods)}
        />
      </div>

      {/* Row 2: Hit Points (Rectangle) */}
      <VitalCard
        label="Hit Points"
        current={character.vitals.hit_points_current}
        max={totalHPMax}
        color="text-red-400"
        icon={Heart}
        variant="rectangle"
        onIncrement={() => updateVitals('hit_points_current', character.vitals.hit_points_current + 1)}
        onDecrement={() => updateVitals('hit_points_current', character.vitals.hit_points_current - 1)}
        isCriticalCondition={character.vitals.hit_points_current === 0}
        trackType="mark-bad"
        modifiers={hpMods}
        onUpdateModifiers={(mods) => updateModifiers('hit_points', mods)}
      />

      {/* Row 3: Stress (Rectangle) */}
      <VitalCard
        label="Stress"
        current={character.vitals.stress_current}
        max={totalStressMax}
        color="text-purple-400"
        icon={Zap}
        variant="rectangle"
        onIncrement={() => updateVitals('stress_current', character.vitals.stress_current + 1)}
        onDecrement={() => updateVitals('stress_current', character.vitals.stress_current - 1)}
        isCriticalCondition={character.vitals.stress_current === 0}
        trackType="mark-bad" modifiers={stressMods}
        onUpdateModifiers={(mods) => updateModifiers('stress', mods)}
      />

      {/* Row 4: Hope (Rectangle) */}
      <VitalCard
        label="Hope"
        current={character.hope}
        max={totalHopeMax}
        color="text-dagger-gold"
        icon={Zap}
        variant="rectangle"
        onIncrement={() => updateHope(character.hope + 1)}
        onDecrement={() => updateHope(character.hope - 1)}
        trackType="fill-up-good"
        modifiers={hopeMods}
        onUpdateModifiers={(mods) => updateModifiers('hope', mods)}
      />
    </div>
  );
}
