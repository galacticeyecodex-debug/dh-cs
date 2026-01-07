'use client';

/**
 * COMMON VITALS DISPLAY COMPONENT
 * ----------------------------------------------------------------------------
 * A centralized dashboard for displaying the character's core vitals: Evasion, Armor,
 * Hit Points, Stress, and Hope.
 *
 * FUNCTIONALITY:
 * - Aggregates Data: Calculates final stat values by combining Base Stats (from Class/Level),
 *   System Modifiers (from Equipment), and User Modifiers (Manual adjustments).
 * - Visual Feedback: Displays vitals in uniform cards with color coding (Health = Red, Armor = Blue, etc.).
 * - Interactivity: Provides direct controls to increment/decrement current values (e.g., taking damage).
 * - Threshold Tracking: Shows specialized data like Damage Thresholds for Armor.
 * - Modifier Management: Integrates with `VitalCard` to allow users to view and edit active modifiers for each stat.
 *
 * PERFORMANCE:
 * - Memoized with React.memo to prevent cascade re-renders
 * - All stat calculations wrapped in useMemo to avoid recalculation
 * - Callbacks wrapped in useCallback for child component stability
 * - Only re-renders when character vitals or modifiers actually change
 */

import React, { useMemo, useCallback } from 'react';
import { useCharacterStore, Character, CharacterInventoryItem } from '@/store/character-store';
import { Shield, Zap, Heart, Eye } from 'lucide-react';
import { getClassBaseStat, getSystemModifiers } from '@/lib/utils';
import VitalCard from '@/components/vitals/vital-card';

// Define a type for the component props
interface CommonVitalsDisplayProps {
  character: Character;
}

const CommonVitalsDisplay = React.memo(function CommonVitalsDisplay({ character }: CommonVitalsDisplayProps) {
  const { updateVitals, updateHope, updateEvasion, updateModifiers } = useCharacterStore();

  // Helper to calculate totals and combine modifiers (memoized)
  const getStatDetails = useCallback((stat: string, base: number) => {
    const systemMods = getSystemModifiers(character, stat);
    const userMods = character.modifiers?.[stat] || [];
    const allMods = [...systemMods, ...userMods];
    const uniqueMods = Array.from(new Map(allMods.map(mod => [mod.id, mod])).values()); // Deduplicate by ID
    const total = base + uniqueMods.reduce((acc, mod) => acc + mod.value, 0);
    return { total, allMods: uniqueMods };
  }, [character]);

  // --- EVASION --- (memoized)
  const evasionDetails = useMemo(() => {
    const classBaseEvasion = getClassBaseStat(character, 'evasion');
    const { total, allMods } = getStatDetails('evasion', classBaseEvasion);
    return {
      total,
      allMods,
      isModified: total !== classBaseEvasion,
      baseValue: classBaseEvasion,
    };
  }, [character, getStatDetails]);

  // --- ARMOR --- (memoized)
  const armorDetails = useMemo(() => {
    const armorItem = character.character_inventory?.find((item: CharacterInventoryItem) => item.location === 'equipped_armor');
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
    const { total, allMods } = getStatDetails('armor', armorBaseScore);

    // Calculate details for thresholds to enable editing
    const genericStats = getStatDetails('damage_thresholds', 0);
    const minorStats = getStatDetails('damage_threshold_minor', 1);
    const majorStats = getStatDetails('damage_threshold_major', majorThreshold);
    const severeStats = getStatDetails('damage_threshold_severe', severeThreshold);

    // Sub-stats for ModifierSheet tabs
    // Note: We include "Generic" mods in Major/Severe base values for display context,
    // but the Generic tab allows editing the shared modifiers separately.
    const genericBonus = genericStats.total;

    const subStats = [
      {
        id: 'armor',
        label: 'Armor',
        baseValue: armorBaseScore,
        currentModifiers: allMods,
        onUpdateModifiers: (mods: any[]) => updateModifiers('armor', mods)
      },
      {
        id: 'generic',
        label: 'Thresholds (All)',
        baseValue: 0,
        currentModifiers: genericStats.allMods,
        onUpdateModifiers: (mods: any[]) => updateModifiers('damage_thresholds', mods)
      },
      {
        id: 'minor',
        label: 'Minor',
        baseValue: 1,
        currentModifiers: minorStats.allMods,
        onUpdateModifiers: (mods: any[]) => updateModifiers('damage_threshold_minor', mods)
      },
      {
        id: 'major',
        label: 'Major',
        // Base value includes generic bonus so "Total" looks correct relative to sheet
        baseValue: majorThreshold + genericBonus,
        currentModifiers: majorStats.allMods,
        onUpdateModifiers: (mods: any[]) => updateModifiers('damage_threshold_major', mods)
      },
      {
        id: 'severe',
        label: 'Severe',
        // Base value includes generic bonus so "Total" looks correct relative to sheet
        baseValue: severeThreshold + genericBonus,
        currentModifiers: severeStats.allMods,
        onUpdateModifiers: (mods: any[]) => updateModifiers('damage_threshold_severe', mods)
      }
    ];

    return { total, allMods, subStats };
  }, [character.level, character.character_inventory, getStatDetails, updateModifiers]);

  // --- HIT POINTS --- (memoized)
  const hpDetails = useMemo(() => {
    const classBaseHP = getClassBaseStat(character, 'hit_points');
    const { total, allMods } = getStatDetails('hit_points', classBaseHP);
    return { total, allMods, baseValue: classBaseHP };
  }, [character, getStatDetails]);

  // --- STRESS --- (memoized)
  const stressDetails = useMemo(() => {
    const classBaseStress = getClassBaseStat(character, 'stress');
    const { total, allMods } = getStatDetails('stress', classBaseStress);
    return { total, allMods, baseValue: classBaseStress };
  }, [character, getStatDetails]);

  // --- HOPE --- (memoized)
  const hopeDetails = useMemo(() => {
    const baseHope = 6;
    const { total, allMods } = getStatDetails('hope', baseHope);
    return { total, allMods, baseValue: baseHope };
  }, [getStatDetails]);

  // Memoize callbacks to prevent VitalCard re-renders
  const handleArmorIncrement = useCallback(() => {
    updateVitals('armor_slots', character.vitals.armor_slots + 1);
  }, [updateVitals, character.vitals.armor_slots]);

  const handleArmorDecrement = useCallback(() => {
    updateVitals('armor_slots', character.vitals.armor_slots - 1);
  }, [updateVitals, character.vitals.armor_slots]);

  const handleHPIncrement = useCallback(() => {
    updateVitals('hit_points_current', character.vitals.hit_points_current + 1);
  }, [updateVitals, character.vitals.hit_points_current]);

  const handleHPDecrement = useCallback(() => {
    updateVitals('hit_points_current', character.vitals.hit_points_current - 1);
  }, [updateVitals, character.vitals.hit_points_current]);

  const handleStressIncrement = useCallback(() => {
    updateVitals('stress_current', character.vitals.stress_current + 1);
  }, [updateVitals, character.vitals.stress_current]);

  const handleStressDecrement = useCallback(() => {
    updateVitals('stress_current', character.vitals.stress_current - 1);
  }, [updateVitals, character.vitals.stress_current]);

  const handleHopeIncrement = useCallback(() => {
    updateHope(character.hope + 1);
  }, [updateHope, character.hope]);

  const handleHopeDecrement = useCallback(() => {
    updateHope(character.hope - 1);
  }, [updateHope, character.hope]);

  const handleUpdateEvasionMods = useCallback((mods: any) => {
    updateModifiers('evasion', mods);
  }, [updateModifiers]);

  const handleUpdateArmorMods = useCallback((mods: any) => {
    updateModifiers('armor', mods);
  }, [updateModifiers]);

  const handleUpdateHPMods = useCallback((mods: any) => {
    updateModifiers('hit_points', mods);
  }, [updateModifiers]);

  const handleUpdateStressMods = useCallback((mods: any) => {
    updateModifiers('stress', mods);
  }, [updateModifiers]);

  const handleUpdateHopeMods = useCallback((mods: any) => {
    updateModifiers('hope', mods);
  }, [updateModifiers]);


  return (
    <div className="space-y-3">
      {/* Evasion */}
      <VitalCard
        label="Evasion"
        current={evasionDetails.total}
        color="text-cyan-400"
        icon={Eye}
        variant="rectangle"
        isModified={evasionDetails.isModified}
        expectedValue={evasionDetails.baseValue}
        modifiers={evasionDetails.allMods}
        onUpdateModifiers={handleUpdateEvasionMods}
      />

      {/* Armor */}
      <VitalCard
        label="Armor"
        current={character.vitals.armor_slots}
        max={armorDetails.total}
        color="text-blue-400"
        icon={Shield}
        variant="rectangle"
        onIncrement={handleArmorIncrement}
        onDecrement={handleArmorDecrement}
        isCriticalCondition={character.vitals.armor_slots === 0 && armorDetails.total > 0}
        thresholds={character.damage_thresholds}
        trackType="mark-bad"
        disableCritColor={true}
        modifiers={armorDetails.allMods}
        onUpdateModifiers={handleUpdateArmorMods}
        subStats={armorDetails.subStats}
      />

      {/* Row 2: Hit Points (Rectangle) */}
      <VitalCard
        label="Hit Points"
        current={character.vitals.hit_points_current}
        max={hpDetails.total}
        color="text-red-400"
        icon={Heart}
        variant="rectangle"
        onIncrement={handleHPIncrement}
        onDecrement={handleHPDecrement}
        isCriticalCondition={character.vitals.hit_points_current === 0}
        trackType="mark-bad"
        modifiers={hpDetails.allMods}
        onUpdateModifiers={handleUpdateHPMods}
        expectedValue={hpDetails.baseValue}
      />

      {/* Row 3: Stress (Rectangle) */}
      <VitalCard
        label="Stress"
        current={character.vitals.stress_current}
        max={stressDetails.total}
        color="text-purple-400"
        icon={Zap}
        variant="rectangle"
        onIncrement={handleStressIncrement}
        onDecrement={handleStressDecrement}
        isCriticalCondition={character.vitals.stress_current >= stressDetails.total && stressDetails.total > 0}
        trackType="fill-up-bad"
        modifiers={stressDetails.allMods}
        onUpdateModifiers={handleUpdateStressMods}
        expectedValue={stressDetails.baseValue}
      />

      {/* Row 4: Hope (Rectangle) */}
      <VitalCard
        label="Hope"
        current={character.hope}
        max={hopeDetails.total}
        color="text-dagger-gold"
        icon={Zap}
        variant="rectangle"
        onIncrement={handleHopeIncrement}
        onDecrement={handleHopeDecrement}
        trackType="fill-up-good"
        modifiers={hopeDetails.allMods}
        onUpdateModifiers={handleUpdateHopeMods}
        expectedValue={hopeDetails.baseValue}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  // Return false if props are different (re-render needed)

  // Check if character ID changed (different character loaded)
  if (prevProps.character.id !== nextProps.character.id) return false;

  // Check vitals
  if (JSON.stringify(prevProps.character.vitals) !== JSON.stringify(nextProps.character.vitals)) return false;

  // Check hope
  if (prevProps.character.hope !== nextProps.character.hope) return false;

  // Check level (affects base stats)
  if (prevProps.character.level !== nextProps.character.level) return false;

  // Check class and subclass (affects base stats)
  if (prevProps.character.class_id !== nextProps.character.class_id) return false;
  if (prevProps.character.subclass_id !== nextProps.character.subclass_id) return false;

  // Check modifiers
  if (JSON.stringify(prevProps.character.modifiers) !== JSON.stringify(nextProps.character.modifiers)) return false;

  // Check inventory (affects armor and system modifiers)
  if (JSON.stringify(prevProps.character.character_inventory) !== JSON.stringify(nextProps.character.character_inventory)) return false;

  // Check damage thresholds
  if (JSON.stringify(prevProps.character.damage_thresholds) !== JSON.stringify(nextProps.character.damage_thresholds)) return false;

  // All relevant props are equal, skip re-render
  return true;
});

export default CommonVitalsDisplay;
