/**
 * Pure game logic functions for calculating character stats
 * These are separated from the store to enable unit testing
 * All functions are pure (no side effects, deterministic)
 */

import { Character, CharacterInventoryItem } from '@/store/character-store';

export interface DerivedStats {
  vitals: {
    armor_score: number;
    armor_slots: number;
    hit_points_max: number;
    hit_points_current: number;
    stress_max: number;
    stress_current: number;
  };
  damage_thresholds: {
    minor: number;
    major: number;
    severe: number;
  };
}

export interface Modifier {
  id: string;
  name: string;
  value: number;
  source: 'system' | 'user';
}

// Minimal interface for equipped armor when passed to calculation functions
export interface EquippedArmorForCalculation {
  library_item?: {
    data?: {
      base_score?: string;
      base_thresholds?: string;
    };
  };
}

/**
 * Calculate armor score from equipped armor and modifiers
 *
 * Rules (per Armor.md):
 * - Base score from armor piece
 * - Add system modifiers from equipped items
 * - Add manual modifiers from character ledger
 * - Cap at 12 (maximum armor score)
 * - Unarmored: score = 0
 */
export function calculateArmorScore(
  equippedArmor: EquippedArmorForCalculation[],
  systemMods: Modifier[],
  userMods: Modifier[],
): number {
  let armorScore = 0;

  // 1. Base score from equipped armor
  armorScore += equippedArmor.reduce((acc, item) => {
    return acc + (parseInt(item.library_item?.data?.base_score || '0') || 0);
  }, 0);

  // 2. System modifiers from items
  const armorSystemMods = systemMods.filter(mod => mod.source === 'system');
  armorScore += armorSystemMods.reduce((acc, mod) => acc + mod.value, 0);

  // 3. Manual modifiers from ledger
  armorScore += userMods.reduce((acc, mod) => acc + mod.value, 0);

  // 4. Cap at 12 per SRD
  return Math.min(armorScore, 12);
}

/**
 * Calculate damage thresholds based on level and armor modifiers
 *
 * Rules (per Armor.md):
 * - Default: minor=1, major=level, severe=level*2
 * - Armor can override major/severe base values
 * - Modifiers add to thresholds
 */
export function calculateDamageThresholds(
  level: number,
  equippedArmors: EquippedArmorForCalculation[],
  thresholdMods: Modifier[],
): { minor: number; major: number; severe: number } {
  const minorThreshold = 1;
  let majorThreshold = level;
  let severeThreshold = level * 2;

  // Check if armor defines base thresholds
  // Check if any equipped armor defines base thresholds
  const armorWithThresholds = equippedArmors.find((item) => {
    if (item.library_item?.data?.base_thresholds) {
      const parts = item.library_item.data.base_thresholds.split('/');
      if (parts.length === 2) {
        const baseMajor = parseInt(parts[0].trim());
        const baseSevere = parseInt(parts[1].trim());
        return !isNaN(baseMajor) && !isNaN(baseSevere);
      }
    }
    return false;
  });

  if (armorWithThresholds?.library_item?.data?.base_thresholds) {
    const parts = armorWithThresholds.library_item.data.base_thresholds.split('/');
    const baseMajor = parseInt(parts[0].trim());
    const baseSevere = parseInt(parts[1].trim());
    majorThreshold = baseMajor + level;
    severeThreshold = baseSevere + level;
  }

  // Apply threshold modifiers
  const thresholdBonus = thresholdMods.reduce((acc, mod) => acc + mod.value, 0);
  majorThreshold += thresholdBonus;
  severeThreshold += thresholdBonus;

  return {
    minor: minorThreshold,
    major: majorThreshold,
    severe: severeThreshold,
  };
}

/**
 * Calculate max HP based on class and modifiers
 *
 * Rules (per Combat.md):
 * - Base HP from character class (typically 6)
 * - Add system modifiers from items
 * - Add manual modifiers from ledger
 * - No cap on HP
 */
export function calculateMaxHP(
  classBaseHP: number,
  systemMods: Modifier[],
  userMods: Modifier[],
): number {
  let maxHP = classBaseHP;

  // System modifiers
  const hpSystemMods = systemMods.filter(mod => mod.source === 'system');
  maxHP += hpSystemMods.reduce((acc, mod) => acc + mod.value, 0);

  // Manual modifiers
  maxHP += userMods.reduce((acc, mod) => acc + mod.value, 0);

  return Math.max(maxHP, 1); // Ensure at least 1 HP
}

/**
 * Calculate max Stress based on character and modifiers
 *
 * Rules (per Stress.md):
 * - Base stress = 6
 * - Add system modifiers from items
 * - Add manual modifiers from ledger
 * - No cap on stress
 */
export function calculateMaxStress(
  systemMods: Modifier[],
  userMods: Modifier[],
): number {
  let maxStress = 6; // Base stress is always 6

  // System modifiers
  const stressSystemMods = systemMods.filter(mod => mod.source === 'system');
  maxStress += stressSystemMods.reduce((acc, mod) => acc + mod.value, 0);

  // Manual modifiers
  maxStress += userMods.reduce((acc, mod) => acc + mod.value, 0);

  return Math.max(maxStress, 1); // Ensure at least 1 stress
}

/**
 * Calculate all derived stats for a character
 *
 * This is the main function that orchestrates all calculations
 * Returns new vitals and damage thresholds without modifying character
 */
export function calculateDerivedStats(
  character: any,
  armorMods: Modifier[],
  hpMods: Modifier[],
  stressMods: Modifier[],
  thresholdMods: Modifier[],
): DerivedStats {
  const inventory = character.character_inventory || [];
  const equippedArmors = inventory.filter((i: CharacterInventoryItem) => i.location === 'equipped_armor') as EquippedArmorForCalculation[];
  const currentVitals = character.vitals;

  // Get manual modifiers from character ledger
  const userArmorMods = character.modifiers?.['armor'] || [];
  const userHPMods = character.modifiers?.['hit_points'] || [];
  const userStressMods = character.modifiers?.['stress'] || [];

  // Calculate new values
  const newArmorScore = calculateArmorScore(equippedArmors, armorMods, userArmorMods);
  const newMaxHP = calculateMaxHP(character.class_data?.data?.starting_hp || 6, hpMods, userHPMods);
  const newMaxStress = calculateMaxStress(stressMods, userStressMods);
  const newThresholds = calculateDamageThresholds(character.level, equippedArmors, thresholdMods);

  // Create new vitals, clamping current values to new maxes
  const newVitals = {
    ...currentVitals,
    armor_score: newArmorScore,
    armor_slots: Math.min(currentVitals.armor_slots, newArmorScore),
    hit_points_max: newMaxHP,
    hit_points_current: Math.min(currentVitals.hit_points_current, newMaxHP),
    stress_max: newMaxStress,
    stress_current: Math.min(currentVitals.stress_current, newMaxStress),
  };

  return {
    vitals: newVitals,
    damage_thresholds: newThresholds,
  };
}

/**
 * Clamp a vital value to valid range
 *
 * For "mark bad" vitals (HP, Armor):
 * - current represents capacity remaining
 * - min = 0, max = max value
 *
 * For "fill up bad" vitals (Stress, Hope):
 * - current represents accumulated amount
 * - min = 0, max = max value
 */
export function clampVitalValue(
  type: 'hit_points_current' | 'armor_slots' | 'stress_current' | 'hope_current',
  value: number,
  vitalMax: number,
): number {
  // All vitals clamp between 0 and their max
  return Math.max(0, Math.min(value, vitalMax));
}

/**
 * Parse dice roll notation
 * Handles inputs like: "1d8+2", "d6", "2d8+1d4"
 */
export function parseDiceNotation(notation: string): { dice: string[]; modifier: number } {
  const cleanInput = notation
    .replace(/(phy|mag|physical|magic)/gi, '')
    .replace(/\s/g, '')
    .toLowerCase();

  const parts = cleanInput.split('+');
  const diceParts: string[] = [];
  let modifier = 0;

  for (const part of parts) {
    // Check for dice notation (e.g., "d8", "1d8", "2d6")
    if (/^(\d+)?d(\d+)$/.test(part)) {
      diceParts.push(part);
    } else {
      // Check for static number
      const num = parseInt(part);
      if (!isNaN(num)) {
        modifier += num;
      }
    }
  }

  return {
    dice: diceParts,
    modifier,
  };
}
