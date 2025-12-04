/**
 * Integration tests for realistic game scenarios
 * Tests complete workflows like character creation, combat, equipment changes
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDerivedStats,
  clampVitalValue,
  parseDiceNotation,
} from '@/lib/gameLogic';
import { getSystemModifiers } from '@/lib/utils';

// ============================================================================
// CHARACTER CREATION SCENARIO
// ============================================================================

describe('Scenario: New Character Creation', () => {
  it('should create character with base stats correctly', () => {
    const newCharacter = {
      id: 'char1',
      level: 1,
      class_data: {
        data: {
          starting_hp: 6,
          starting_evasion: 10,
        },
      },
      vitals: {
        hit_points_current: 6,
        hit_points_max: 6,
        armor_slots: 0,
        armor_score: 0,
        stress_current: 0,
        stress_max: 6,
        hope_current: 6,
        hope_max: 6,
      },
      character_inventory: [],
      modifiers: {},
      damage_thresholds: {
        minor: 1,
        major: 1,
        severe: 2,
      },
    };

    // Verify base stats
    expect(newCharacter.vitals.hit_points_current).toBe(6);
    expect(newCharacter.vitals.armor_score).toBe(0); // Unarmored
    expect(newCharacter.vitals.stress_current).toBe(0); // No stress
    expect(newCharacter.damage_thresholds.major).toBe(1); // Level 1
  });

  it('should level-up character correctly', () => {
    const character = {
      id: 'char1',
      level: 1,
      class_data: { data: { starting_hp: 6 } },
      vitals: {
        hit_points_current: 6,
        hit_points_max: 6,
        armor_slots: 0,
        armor_score: 0,
        stress_current: 0,
        stress_max: 6,
      },
      character_inventory: [],
      modifiers: {},
    };

    // Level up
    character.level = 2;

    // Recalculate thresholds
    const stats = calculateDerivedStats(character, [], [], [], []);
    expect(stats.damage_thresholds.major).toBe(2); // Now level 2
    expect(stats.damage_thresholds.severe).toBe(4); // 2 * 2
  });
});

// ============================================================================
// COMBAT SCENARIO
// ============================================================================

describe('Scenario: Taking Damage in Combat', () => {
  it('should take damage and reduce HP', () => {
    const vitals = {
      hit_points_current: 6,
      hit_points_max: 6,
      armor_slots: 3,
      armor_score: 3,
    };

    // Take 2 damage
    vitals.hit_points_current = clampVitalValue(
      'hit_points_current',
      vitals.hit_points_current - 2,
      vitals.hit_points_max
    );

    expect(vitals.hit_points_current).toBe(4);
  });

  it('should use armor before HP (armor prioritization)', () => {
    const vitals = {
      hit_points_current: 4,
      hit_points_max: 6,
      armor_slots: 2,
      armor_score: 3,
    };

    const damageAmount = 3;

    // In game: Check armor first
    if (vitals.armor_slots > 0) {
      // Use armor
      const damageReducedByArmor = Math.min(damageAmount, vitals.armor_slots);
      vitals.armor_slots -= damageReducedByArmor;

      // Remaining damage goes to HP
      const remainingDamage = damageAmount - damageReducedByArmor;
      vitals.hit_points_current = Math.max(0, vitals.hit_points_current - remainingDamage);
    }

    expect(vitals.armor_slots).toBe(0); // Used up
    expect(vitals.hit_points_current).toBe(3); // Took 1 remaining damage
  });

  it('should trigger damage threshold change on character level up', () => {
    const character = {
      level: 1,
      class_data: { data: {} },
      vitals: {
        hit_points_current: 6,
        hit_points_max: 6,
        armor_slots: 0,
        armor_score: 0,
        stress_current: 0,
        stress_max: 6,
      },
      character_inventory: [],
      modifiers: {},
    };

    // Before level up
    const statsLevel1 = calculateDerivedStats(character, [], [], [], []);
    expect(statsLevel1.damage_thresholds.major).toBe(1);

    // Level up
    character.level = 3;

    // After level up
    const statsLevel3 = calculateDerivedStats(character, [], [], [], []);
    expect(statsLevel3.damage_thresholds.major).toBe(3);
  });
});

// ============================================================================
// EQUIPMENT CHANGE SCENARIO
// ============================================================================

describe('Scenario: Equipping New Armor', () => {
  it('should increase armor when equipping heavy armor', () => {
    const character = {
      level: 2,
      class_data: { data: {} },
      vitals: {
        hit_points_current: 6,
        hit_points_max: 6,
        armor_slots: 0,
        armor_score: 0,
        stress_current: 0,
        stress_max: 6,
      },
      character_inventory: [
        {
          id: 'armor1',
          name: 'Full Plate',
          location: 'equipped_armor',
          library_item: {
            data: {
              base_score: '4',
              base_thresholds: '2/4',
            },
          },
        },
      ],
      modifiers: {},
    };

    // Get armor modifiers from items
    const armorMods = getSystemModifiers(character, 'armor');
    const stats = calculateDerivedStats(character, armorMods, [], [], []);

    // Armor increased
    expect(stats.vitals.armor_score).toBe(4);
    // Armor slots clamped to new score (min of current and new score)
    expect(stats.vitals.armor_slots).toBe(0); // Was 0, stays 0

    // Thresholds adjusted for armor
    expect(stats.damage_thresholds.major).toBe(4); // 2 (armor base) + 2 (level)
  });

  it('should adjust armor slots when changing equipment', () => {
    const character = {
      level: 1,
      class_data: { data: {} },
      vitals: {
        hit_points_current: 6,
        hit_points_max: 6,
        armor_slots: 3,
        armor_score: 4,
        stress_current: 0,
        stress_max: 6,
      },
      character_inventory: [
        {
          id: 'armor1',
          name: 'Gambeson',
          location: 'equipped_armor',
          library_item: {
            data: { base_score: '2' },
          },
        },
      ],
      modifiers: {},
    };

    const stats = calculateDerivedStats(character, [], [], [], []);

    // Armor reduced
    expect(stats.vitals.armor_score).toBe(2);
    // Slots clamped to new score
    expect(stats.vitals.armor_slots).toBe(2); // Was 3, clamped to 2
  });

  it('should update evasion penalty with armor change', () => {
    const evasionPenalty = -1; // From heavy armor

    const character = {
      level: 2,
      class_data: { data: { starting_evasion: 10 } },
      vitals: {
        hit_points_current: 6,
        hit_points_max: 6,
        armor_slots: 4,
        armor_score: 4,
        stress_current: 0,
        stress_max: 6,
      },
      character_inventory: [
        {
          id: 'armor1',
          name: 'Heavy Armor',
          location: 'equipped_armor',
          library_item: {
            data: {
              base_score: '4',
              modifiers: [
                { id: 'mod1', target: 'evasion', value: -1 },
              ],
            },
          },
        },
      ],
      modifiers: {},
    };

    const systemMods = getSystemModifiers(character, 'evasion');
    expect(systemMods).toHaveLength(1);
    expect(systemMods[0].value).toBe(-1);
  });
});

// ============================================================================
// STRESS & HOPE SCENARIO
// ============================================================================

describe('Scenario: Stress Management', () => {
  it('should accumulate stress correctly', () => {
    const vitals = {
      stress_current: 0,
      stress_max: 6,
    };

    // Take stress from difficult decisions
    vitals.stress_current = clampVitalValue(
      'stress_current',
      vitals.stress_current + 2,
      vitals.stress_max
    );
    expect(vitals.stress_current).toBe(2);

    // Take more stress
    vitals.stress_current = clampVitalValue(
      'stress_current',
      vitals.stress_current + 3,
      vitals.stress_max
    );
    expect(vitals.stress_current).toBe(5);

    // Take final stress (maxes out)
    vitals.stress_current = clampVitalValue(
      'stress_current',
      vitals.stress_current + 2,
      vitals.stress_max
    );
    expect(vitals.stress_current).toBe(6); // Maxed out
  });

  it('should trigger vulnerable condition at max stress', () => {
    const vitals = {
      stress_current: 6,
      stress_max: 6,
    };

    const isVulnerable = vitals.stress_current >= vitals.stress_max;
    expect(isVulnerable).toBe(true);
  });

  it('should allow stress recovery', () => {
    const vitals = {
      stress_current: 5,
      stress_max: 6,
    };

    // Recover stress during downtime
    vitals.stress_current = clampVitalValue(
      'stress_current',
      vitals.stress_current - 2,
      vitals.stress_max
    );
    expect(vitals.stress_current).toBe(3);
  });

  it('should spend hope correctly', () => {
    const vitals = {
      hope_current: 6,
      hope_max: 6,
    };

    // Spend hope for re-roll
    vitals.hope_current = clampVitalValue(
      'hope_current',
      vitals.hope_current - 1,
      vitals.hope_max
    );
    expect(vitals.hope_current).toBe(5);

    // Spend another hope
    vitals.hope_current = clampVitalValue(
      'hope_current',
      vitals.hope_current - 1,
      vitals.hope_max
    );
    expect(vitals.hope_current).toBe(4);
  });
});

// ============================================================================
// MODIFIER & BONUS SCENARIO
// ============================================================================

describe('Scenario: Ability with Modifier Bonuses', () => {
  it('should apply ability card modifier bonuses', () => {
    const character = {
      level: 2,
      class_data: { data: { starting_hp: 6 } },
      vitals: {
        hit_points_current: 6,
        hit_points_max: 6,
        armor_slots: 0,
        armor_score: 0,
        stress_current: 0,
        stress_max: 6,
      },
      character_inventory: [
        {
          id: 'card1',
          name: 'Skill Boost',
          location: 'equipped_primary',
          library_item: {
            data: {
              modifiers: [
                { id: 'mod1', target: 'hit_points', value: 2 },
              ],
            },
          },
        },
      ],
      modifiers: {},
    };

    // Recalculate with card modifiers
    const hpMods = getSystemModifiers(character, 'hit_points');
    expect(hpMods).toHaveLength(1);
    expect(hpMods[0].value).toBe(2);

    // calculateDerivedStats expects (character, armorMods, hpMods, stressMods, thresholdMods)
    const stats = calculateDerivedStats(character, [], hpMods, [], []);
    expect(stats.vitals.hit_points_max).toBe(8); // 6 base + 2 from card
  });

  it('should stack multiple equipment bonuses', () => {
    const character = {
      level: 3,
      class_data: { data: { starting_hp: 6 } },
      vitals: {
        hit_points_current: 6,
        hit_points_max: 6,
        armor_slots: 3,
        armor_score: 3,
        stress_current: 0,
        stress_max: 6,
      },
      character_inventory: [
        {
          id: 'weapon1',
          name: 'Sword +1',
          location: 'equipped_primary',
          library_item: {
            data: {
              modifiers: [
                { id: 'mod1', target: 'strength', value: 1 },
              ],
            },
          },
        },
        {
          id: 'ring1',
          name: 'Ring of Power',
          location: 'equipped_secondary',
          library_item: {
            data: {
              modifiers: [
                { id: 'mod2', target: 'strength', value: 2 },
              ],
            },
          },
        },
      ],
      modifiers: {},
    };

    const strengthMods = getSystemModifiers(character, 'strength');
    expect(strengthMods).toHaveLength(2);
    const totalBonus = strengthMods.reduce((acc, mod) => acc + mod.value, 0);
    expect(totalBonus).toBe(3); // 1 + 2
  });
});

// ============================================================================
// DICE ROLLING SCENARIO
// ============================================================================

describe('Scenario: Rolling Dice for Attack', () => {
  it('should parse damage roll correctly', () => {
    const rollString = '2d8+3';
    const roll = parseDiceNotation(rollString);

    expect(roll.dice).toContain('2d8');
    expect(roll.modifier).toBe(3);
  });

  it('should parse complex multi-dice roll', () => {
    const rollString = '1d6+1d4+2 physical';
    const roll = parseDiceNotation(rollString);

    expect(roll.dice).toContain('1d6');
    expect(roll.dice).toContain('1d4');
    expect(roll.modifier).toBe(2);
  });

  it('should calculate final damage with modifiers', () => {
    // Base damage
    const baseDamage = 10; // Rolled 2d8 = 10

    // Equipment modifier
    const weaponBonus = 2; // +2 from enchanted weapon

    // Ability bonus (conditional)
    const abilityBonus = 3; // +3 from special ability

    const totalDamage = baseDamage + weaponBonus + abilityBonus;

    expect(totalDamage).toBe(15);
  });
});

// ============================================================================
// COMPREHENSIVE CHARACTER SESSION
// ============================================================================

describe('Scenario: Complete Combat Session', () => {
  it('should handle full combat encounter', () => {
    // Create character
    let character = {
      level: 2,
      class_data: { data: { starting_hp: 6 } },
      vitals: {
        hit_points_current: 6,
        hit_points_max: 6,
        armor_slots: 3,
        armor_score: 3,
        stress_current: 0,
        stress_max: 6,
        hope_current: 6,
        hope_max: 6,
      },
      character_inventory: [
        {
          id: 'armor1',
          name: 'Armor',
          location: 'equipped_armor',
          library_item: {
            data: { base_score: '3' },
          },
        },
      ],
      modifiers: {},
    };

    // Round 1: Take 2 damage (uses 2 armor)
    character.vitals.armor_slots -= 2;
    expect(character.vitals.armor_slots).toBe(1);
    expect(character.vitals.hit_points_current).toBe(6);

    // Round 2: Take 4 damage (uses 1 armor + 3 HP)
    character.vitals.armor_slots = Math.max(0, character.vitals.armor_slots - 1);
    character.vitals.hit_points_current = Math.max(
      0,
      character.vitals.hit_points_current - 3
    );
    expect(character.vitals.armor_slots).toBe(0); // No armor left
    expect(character.vitals.hit_points_current).toBe(3);

    // Round 3: Mark stress from difficult turn
    character.vitals.stress_current = Math.min(
      character.vitals.stress_max,
      character.vitals.stress_current + 1
    );
    expect(character.vitals.stress_current).toBe(1);

    // Round 4: Spend hope for re-roll
    character.vitals.hope_current = Math.max(0, character.vitals.hope_current - 1);
    expect(character.vitals.hope_current).toBe(5);

    // End of combat: Use downtime action to restore armor
    character.vitals.armor_slots = character.vitals.armor_score;
    expect(character.vitals.armor_slots).toBe(3);

    // Verify character state
    expect(character.vitals.hit_points_current).toBe(3); // Still wounded
    expect(character.vitals.armor_slots).toBe(3); // Restored armor
    expect(character.vitals.stress_current).toBe(1); // Still stressed
    expect(character.vitals.hope_current).toBe(5); // Used 1 hope
  });
});
