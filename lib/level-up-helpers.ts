/**
 * Level-Up Helper Functions
 *
 * Calculates automatic changes that occur during leveling based on Daggerheart SRD.
 * Reference: srd/markdown/contents/Leveling Up.md
 */

import { Experience } from '@/types/modifiers';

/**
 * Determines the tier of a character based on their level.
 *
 * - Tier 1: Level 1
 * - Tier 2: Levels 2-4
 * - Tier 3: Levels 5-7
 * - Tier 4: Levels 8-10
 */
export function getTier(level: number): 1 | 2 | 3 | 4 {
  if (level === 1) return 1;
  if (level >= 2 && level <= 4) return 2;
  if (level >= 5 && level <= 7) return 3;
  if (level >= 8 && level <= 10) return 4;
  throw new Error(`Invalid level: ${level}`);
}

/**
 * Checks if a level-up triggers tier achievements.
 *
 * Tier achievements occur at levels 2, 5, and 8.
 */
export function hasTierAchievements(newLevel: number): boolean {
  return newLevel === 2 || newLevel === 5 || newLevel === 8;
}

/**
 * Calculates changes from tier achievements.
 *
 * At levels 2, 5, and 8:
 * - New Experience at +2
 * - Proficiency +1
 *
 * At levels 5 and 8:
 * - Clear marked traits (return flag)
 */
export function calculateTierAchievements(newLevel: number): {
  newExperienceValue: number | null;
  proficiencyIncrease: number;
  shouldClearMarkedTraits: boolean;
} {
  if (!hasTierAchievements(newLevel)) {
    return {
      newExperienceValue: null,
      proficiencyIncrease: 0,
      shouldClearMarkedTraits: false,
    };
  }

  return {
    newExperienceValue: 2,
    proficiencyIncrease: 1,
    shouldClearMarkedTraits: newLevel === 5 || newLevel === 8,
  };
}

/**
 * Creates a new Experience object.
 *
 * Used for the automatic +2 experience gained at levels 2, 5, and 8.
 */
export function createNewExperience(level: number, value: number = 2): Experience {
  return {
    name: `Experience (Level ${level})`,
    value,
  };
}

/**
 * Adds a new experience to the character's experiences array.
 */
export function addExperienceAtLevelUp(
  experiences: Experience[],
  level: number,
  value: number = 2
): Experience[] {
  const newExp = createNewExperience(level, value);
  return [...experiences, newExp];
}

/**
 * Calculates the new damage thresholds after leveling.
 *
 * All thresholds (minor, major, severe) increase by +1.
 */
export function calculateNewDamageThresholds(
  current: { minor: number; major: number; severe: number }
): { minor: number; major: number; severe: number } {
  return {
    minor: current.minor + 1,
    major: current.major + 1,
    severe: current.severe + 1,
  };
}

/**
 * Gets the available advancements for a given tier.
 *
 * The SRD defines different advancement options based on tier.
 * This function returns the advancement IDs available for a tier.
 */
export function getAdvancementsForTier(tier: 1 | 2 | 3 | 4): string[] {
  // Advancement names/IDs that become available at each tier
  // This is a reference list - actual advancement data should come from the database
  const advancementsByTier: Record<1 | 2 | 3 | 4, string[]> = {
    1: [
      'increase_traits',
      'add_hp',
      'add_stress',
      'increase_experience',
      'domain_card',
      'increase_evasion',
      'subclass_card',
      'increase_proficiency',
    ],
    2: [
      'increase_traits',
      'add_hp',
      'add_stress',
      'increase_experience',
      'domain_card',
      'increase_evasion',
      'subclass_card',
      'increase_proficiency',
      'multiclass',
    ],
    3: [
      'increase_traits',
      'add_hp',
      'add_stress',
      'increase_experience',
      'domain_card',
      'increase_evasion',
      'subclass_card',
      'increase_proficiency',
      'multiclass',
    ],
    4: [
      'increase_traits',
      'add_hp',
      'add_stress',
      'increase_experience',
      'domain_card',
      'increase_evasion',
      'subclass_card',
      'increase_proficiency',
      'multiclass',
    ],
  };

  return advancementsByTier[tier] || [];
}

/**
 * Validates that an advancement is available for the character's tier and below.
 */
export function isAdvancementAvailable(
  characterTier: 1 | 2 | 3 | 4,
  advancementTier: 1 | 2 | 3 | 4
): boolean {
  return advancementTier <= characterTier;
}

/**
 * Calculates the cost (in advancement slots) for a specific advancement.
 *
 * Most advancements cost 1 slot.
 * "Increase Proficiency" and "Multiclass" cost 2 slots.
 */
export function getAdvancementSlotCost(advancementId: string): number {
  if (advancementId === 'increase_proficiency' || advancementId === 'multiclass') {
    return 2;
  }
  return 1;
}

/**
 * Validates that the selected advancements use exactly 2 slots.
 */
export function validateAdvancementSlots(selectedAdvancements: string[]): {
  valid: boolean;
  totalSlots: number;
} {
  const totalSlots = selectedAdvancements.reduce(
    (sum, id) => sum + getAdvancementSlotCost(id),
    0
  );

  return {
    valid: totalSlots === 2,
    totalSlots,
  };
}

/**
 * Determines if a character can select domain cards at their new level.
 *
 * A character gets access to all domain cards at or below their level.
 */
export function getMaxDomainCardLevel(characterLevel: number): number {
  return characterLevel;
}

/**
 * Validates damage thresholds after leveling.
 *
 * Ensures thresholds are positive and follow game rules.
 */
export function validateDamageThresholds(thresholds: {
  minor: number;
  major: number;
  severe: number;
}): boolean {
  return (
    thresholds.minor > 0 &&
    thresholds.major > thresholds.minor &&
    thresholds.severe > thresholds.major
  );
}

/**
 * Calculates proficiency advancement.
 *
 * Proficiency can be increased through:
 * 1. Tier achievements (automatic, at levels 2, 5, 8)
 * 2. Advancement choice (costs 2 slots)
 */
export function calculateProficiencyIncrease(newLevel: number, selectedAdvancements: string[]): number {
  let increase = 0;

  // Tier achievement increase
  if (hasTierAchievements(newLevel)) {
    increase += 1;
  }

  // Advancement choice increase
  if (selectedAdvancements.includes('increase_proficiency')) {
    increase += 1;
  }

  return increase;
}

/**
 * Gets the level-up configuration for a given level.
 *
 * Returns all automatic changes that occur when leveling to that level.
 */
export function getLevelUpConfig(newLevel: number): {
  tier: 1 | 2 | 3 | 4;
  tierAchievements: ReturnType<typeof calculateTierAchievements>;
  maxDomainCardLevel: number;
} {
  const tier = getTier(newLevel);
  const tierAchievements = calculateTierAchievements(newLevel);
  const maxDomainCardLevel = getMaxDomainCardLevel(newLevel);

  return {
    tier,
    tierAchievements,
    maxDomainCardLevel,
  };
}
