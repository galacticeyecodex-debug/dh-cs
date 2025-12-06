/**
 * Tests for game logic calculations
 * These tests verify that character stats are calculated correctly
 * per the Daggerheart SRD rules
 */

import { describe, it, expect } from 'vitest';
import {
  calculateArmorScore,
  calculateDamageThresholds,
  calculateMaxHP,
  calculateMaxStress,
  calculateDerivedStats,
  clampVitalValue,
  parseDiceNotation,
  Modifier,
} from '@/lib/gameLogic';

// ============================================================================
// ARMOR SCORE TESTS
// ============================================================================

describe('calculateArmorScore', () => {
  it('should return 0 for unarmored character', () => {
    const score = calculateArmorScore([], [], []);
    expect(score).toBe(0);
  });

  it('should calculate base armor score from equipped armor', () => {
    const armor = {
      library_item: {
        data: { base_score: '5' },
      },
    };
    const score = calculateArmorScore([armor], [], []);
    expect(score).toBe(5);
  });

  it('should add system modifiers to armor score', () => {
    const armor = {
      library_item: {
        data: { base_score: '4' },
      },
    };
    const systemMods: Modifier[] = [
      { id: '1', name: 'Enchantment', value: 1, source: 'system' },
      { id: '2', name: 'Blessing', value: 2, source: 'system' },
    ];
    const score = calculateArmorScore([armor], systemMods, []);
    expect(score).toBe(7); // 4 + 1 + 2
  });

  it('should add user modifiers to armor score', () => {
    const armor = {
      library_item: {
        data: { base_score: '3' },
      },
    };
    const userMods: Modifier[] = [
      { id: '1', name: 'Manual Buff', value: 2, source: 'user' },
    ];
    const score = calculateArmorScore([armor], [], userMods);
    expect(score).toBe(5); // 3 + 2
  });

  it('should stack both system and user modifiers', () => {
    const armor = {
      library_item: {
        data: { base_score: '2' },
      },
    };
    const systemMods: Modifier[] = [
      { id: '1', name: 'Item Bonus', value: 3, source: 'system' },
    ];
    const userMods: Modifier[] = [
      { id: '2', name: 'Manual Buff', value: 1, source: 'user' },
    ];
    const score = calculateArmorScore([armor], systemMods, userMods);
    expect(score).toBe(6); // 2 + 3 + 1
  });

  it('should cap armor at 12 (SRD maximum)', () => {
    const armor = {
      library_item: {
        data: { base_score: '8' },
      },
    };
    const systemMods: Modifier[] = [
      { id: '1', name: 'Bonus 1', value: 2, source: 'system' },
      { id: '2', name: 'Bonus 2', value: 3, source: 'system' },
    ];
    const userMods: Modifier[] = [
      { id: '3', name: 'Bonus 3', value: 2, source: 'user' },
    ];
    const score = calculateArmorScore([armor], systemMods, userMods);
    // Would be 8 + 2 + 3 + 2 = 15, but capped at 12
    expect(score).toBe(12);
  });

  it('should handle negative modifiers', () => {
    const armor = {
      library_item: {
        data: { base_score: '5' },
      },
    };
    const systemMods: Modifier[] = [
      { id: '1', name: 'Penalty', value: -2, source: 'system' },
    ];
    const score = calculateArmorScore([armor], systemMods, []);
    expect(score).toBe(3); // 5 - 2
  });

  it('should handle armor with no base_score data', () => {
    const armor = {
      library_item: {
        data: { /* no base_score */ },
      },
    };
    const score = calculateArmorScore([armor], [], []);
    expect(score).toBe(0);
  });

  it('should handle invalid base_score (non-numeric)', () => {
    const armor = {
      library_item: {
        data: { base_score: 'invalid' },
      },
    };
    const score = calculateArmorScore([armor], [], []);
    expect(score).toBe(0); // NaN becomes 0
  });
});

// ============================================================================
// DAMAGE THRESHOLDS TESTS
// ============================================================================

describe('calculateDamageThresholds', () => {
  it('should calculate default thresholds for unarmored character', () => {
    const thresholds = calculateDamageThresholds(5, [], []);
    expect(thresholds.minor).toBe(1);
    expect(thresholds.major).toBe(5); // level
    expect(thresholds.severe).toBe(10); // level * 2
  });

  it('should scale thresholds with character level', () => {
    const thresholds = calculateDamageThresholds(3, [], []);
    expect(thresholds.minor).toBe(1);
    expect(thresholds.major).toBe(3);
    expect(thresholds.severe).toBe(6);
  });

  it('should apply armor base thresholds', () => {
    const armor = {
      library_item: {
        data: { base_thresholds: '2/4' }, // major_base=2, severe_base=4
      },
    };
    const thresholds = calculateDamageThresholds(3, [armor], []);
    expect(thresholds.minor).toBe(1);
    expect(thresholds.major).toBe(5); // 2 + 3
    expect(thresholds.severe).toBe(7); // 4 + 3
  });

  it('should add threshold modifiers', () => {
    const mods: Modifier[] = [
      { id: '1', name: 'Bonus', value: 1, source: 'system' },
    ];
    const thresholds = calculateDamageThresholds(4, [], mods);
    expect(thresholds.major).toBe(5); // 4 + 1
    expect(thresholds.severe).toBe(9); // 8 + 1
  });

  it('should handle armor thresholds with modifiers combined', () => {
    const armor = {
      library_item: {
        data: { base_thresholds: '3/5' },
      },
    };
    const mods: Modifier[] = [
      { id: '1', name: 'Bonus', value: 2, source: 'system' },
    ];
    const thresholds = calculateDamageThresholds(2, [armor], mods);
    expect(thresholds.major).toBe(7); // 3 + 2 + 2
    expect(thresholds.severe).toBe(9); // 5 + 2 + 2
  });

  it('should handle invalid base_thresholds format', () => {
    const armor = {
      library_item: {
        data: { base_thresholds: 'invalid' },
      },
    };
    const thresholds = calculateDamageThresholds(4, [armor], []);
    // Falls back to defaults
    expect(thresholds.major).toBe(4);
    expect(thresholds.severe).toBe(8);
  });

  it('should handle armor with only one threshold value', () => {
    const armor = {
      library_item: {
        data: { base_thresholds: '2' }, // Only one value
      },
    };
    const thresholds = calculateDamageThresholds(3, [armor], []);
    // Falls back to defaults
    expect(thresholds.major).toBe(3);
    expect(thresholds.severe).toBe(6);
  });

  it('should apply negative threshold modifiers', () => {
    const mods: Modifier[] = [
      { id: '1', name: 'Weakness', value: -1, source: 'system' },
    ];
    const thresholds = calculateDamageThresholds(5, [], mods);
    expect(thresholds.major).toBe(4); // 5 - 1
    expect(thresholds.severe).toBe(9); // 10 - 1
  });
});

// ============================================================================
// HIT POINTS TESTS
// ============================================================================

describe('calculateMaxHP', () => {
  it('should return class base HP for no modifiers', () => {
    const maxHP = calculateMaxHP(6, [], []);
    expect(maxHP).toBe(6);
  });

  it('should add system modifiers to HP', () => {
    const systemMods: Modifier[] = [
      { id: '1', name: 'Stamina Bonus', value: 2, source: 'system' },
    ];
    const maxHP = calculateMaxHP(6, systemMods, []);
    expect(maxHP).toBe(8);
  });

  it('should add user modifiers to HP', () => {
    const userMods: Modifier[] = [
      { id: '1', name: 'Training', value: 1, source: 'user' },
    ];
    const maxHP = calculateMaxHP(6, [], userMods);
    expect(maxHP).toBe(7);
  });

  it('should stack system and user modifiers', () => {
    const systemMods: Modifier[] = [
      { id: '1', name: 'Item Bonus', value: 2, source: 'system' },
    ];
    const userMods: Modifier[] = [
      { id: '2', name: 'Training', value: 1, source: 'user' },
    ];
    const maxHP = calculateMaxHP(6, systemMods, userMods);
    expect(maxHP).toBe(9); // 6 + 2 + 1
  });

  it('should handle negative HP modifiers', () => {
    const systemMods: Modifier[] = [
      { id: '1', name: 'Curse', value: -2, source: 'system' },
    ];
    const maxHP = calculateMaxHP(6, systemMods, []);
    expect(maxHP).toBe(4);
  });

  it('should ensure minimum 1 HP', () => {
    const systemMods: Modifier[] = [
      { id: '1', name: 'Severe Curse', value: -10, source: 'system' },
    ];
    const maxHP = calculateMaxHP(6, systemMods, []);
    expect(maxHP).toBe(1);
  });

  it('should handle large HP values', () => {
    const systemMods: Modifier[] = [
      { id: '1', name: 'Bonus 1', value: 5, source: 'system' },
      { id: '2', name: 'Bonus 2', value: 3, source: 'system' },
    ];
    const userMods: Modifier[] = [
      { id: '3', name: 'Bonus 3', value: 2, source: 'user' },
    ];
    const maxHP = calculateMaxHP(6, systemMods, userMods);
    expect(maxHP).toBe(16); // 6 + 5 + 3 + 2
  });
});

// ============================================================================
// STRESS TESTS
// ============================================================================

describe('calculateMaxStress', () => {
  it('should return base 6 stress for no modifiers', () => {
    const maxStress = calculateMaxStress([], []);
    expect(maxStress).toBe(6);
  });

  it('should add system modifiers to stress', () => {
    const systemMods: Modifier[] = [
      { id: '1', name: 'Resilience', value: 1, source: 'system' },
    ];
    const maxStress = calculateMaxStress(systemMods, []);
    expect(maxStress).toBe(7);
  });

  it('should add user modifiers to stress', () => {
    const userMods: Modifier[] = [
      { id: '1', name: 'Training', value: 2, source: 'user' },
    ];
    const maxStress = calculateMaxStress([], userMods);
    expect(maxStress).toBe(8);
  });

  it('should stack system and user modifiers', () => {
    const systemMods: Modifier[] = [
      { id: '1', name: 'Item', value: 1, source: 'system' },
    ];
    const userMods: Modifier[] = [
      { id: '2', name: 'Training', value: 1, source: 'user' },
    ];
    const maxStress = calculateMaxStress(systemMods, userMods);
    expect(maxStress).toBe(8); // 6 + 1 + 1
  });

  it('should handle negative stress modifiers (vulnerability)', () => {
    const systemMods: Modifier[] = [
      { id: '1', name: 'Weakness', value: -2, source: 'system' },
    ];
    const maxStress = calculateMaxStress(systemMods, []);
    expect(maxStress).toBe(4);
  });

  it('should ensure minimum 1 stress', () => {
    const systemMods: Modifier[] = [
      { id: '1', name: 'Severe Weakness', value: -10, source: 'system' },
    ];
    const maxStress = calculateMaxStress(systemMods, []);
    expect(maxStress).toBe(1);
  });
});

// ============================================================================
// VITAL CLAMPING TESTS
// ============================================================================

describe('clampVitalValue', () => {
  it('should clamp HP within valid range (0 to max)', () => {
    expect(clampVitalValue('hit_points_current', 5, 10)).toBe(5);
    expect(clampVitalValue('hit_points_current', -5, 10)).toBe(0);
    expect(clampVitalValue('hit_points_current', 15, 10)).toBe(10);
  });

  it('should clamp Armor within valid range (0 to max)', () => {
    expect(clampVitalValue('armor_slots', 4, 8)).toBe(4);
    expect(clampVitalValue('armor_slots', -2, 8)).toBe(0);
    expect(clampVitalValue('armor_slots', 12, 8)).toBe(8);
  });

  it('should clamp Stress within valid range (0 to max)', () => {
    expect(clampVitalValue('stress_current', 3, 6)).toBe(3);
    expect(clampVitalValue('stress_current', -1, 6)).toBe(0);
    expect(clampVitalValue('stress_current', 10, 6)).toBe(6);
  });

  it('should clamp Hope within valid range (0 to max)', () => {
    expect(clampVitalValue('hope_current', 2, 6)).toBe(2);
    expect(clampVitalValue('hope_current', -1, 6)).toBe(0);
    expect(clampVitalValue('hope_current', 8, 6)).toBe(6);
  });

  it('should handle edge case of 0 max', () => {
    expect(clampVitalValue('hit_points_current', 5, 0)).toBe(0);
  });

  it('should handle exact boundary values', () => {
    expect(clampVitalValue('hit_points_current', 0, 10)).toBe(0);
    expect(clampVitalValue('hit_points_current', 10, 10)).toBe(10);
  });
});

// ============================================================================
// DICE NOTATION PARSING TESTS
// ============================================================================

describe('parseDiceNotation', () => {
  it('should parse simple d notation', () => {
    const result = parseDiceNotation('d6');
    expect(result.dice).toContain('d6');
    expect(result.modifier).toBe(0);
  });

  it('should parse dice with multiplier', () => {
    const result = parseDiceNotation('2d8');
    expect(result.dice).toContain('2d8');
    expect(result.modifier).toBe(0);
  });

  it('should parse dice with modifier', () => {
    const result = parseDiceNotation('1d6+2');
    expect(result.dice).toContain('1d6');
    expect(result.modifier).toBe(2);
  });

  it('should parse multiple dice', () => {
    const result = parseDiceNotation('2d6+1d4');
    expect(result.dice).toContain('2d6');
    expect(result.dice).toContain('1d4');
    expect(result.modifier).toBe(0);
  });

  it('should parse multiple dice with modifier', () => {
    const result = parseDiceNotation('2d6+1d4+3');
    expect(result.dice).toContain('2d6');
    expect(result.dice).toContain('1d4');
    expect(result.modifier).toBe(3);
  });

  it('should ignore damage type indicators (phy, mag)', () => {
    const result = parseDiceNotation('2d6+3 physical');
    expect(result.dice).toContain('2d6');
    expect(result.modifier).toBe(3);
  });

  it('should handle lowercase input', () => {
    const result = parseDiceNotation('2d8+1');
    expect(result.dice).toContain('2d8');
    expect(result.modifier).toBe(1);
  });

  it('should handle whitespace', () => {
    const result = parseDiceNotation('2d6 + 1d4 + 2');
    expect(result.dice).toContain('2d6');
    expect(result.dice).toContain('1d4');
    expect(result.modifier).toBe(2);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('calculateDerivedStats (integration)', () => {
  const baseCharacter = {
    level: 3,
    class_data: { data: { starting_hp: 6 } },
    vitals: {
      hit_points_current: 6,
      hit_points_max: 6,
      armor_slots: 4,
      armor_score: 4,
      stress_current: 2,
      stress_max: 6,
    },
    character_inventory: [],
    modifiers: {},
  };

  it('should calculate all derived stats correctly for unarmored character', () => {
    const stats = calculateDerivedStats(baseCharacter, [], [], [], []);

    expect(stats.vitals.armor_score).toBe(0);
    expect(stats.vitals.hit_points_max).toBe(6);
    expect(stats.vitals.stress_max).toBe(6);
    expect(stats.damage_thresholds.minor).toBe(1);
    expect(stats.damage_thresholds.major).toBe(3);
    expect(stats.damage_thresholds.severe).toBe(6);
  });

  it('should clamp current vitals to new maxes', () => {
    const character = {
      ...baseCharacter,
      vitals: {
        ...baseCharacter.vitals,
        hit_points_current: 8, // Currently higher than base
      },
    };

    const stats = calculateDerivedStats(character, [], [], [], []);

    // Current HP should be clamped to new max
    expect(stats.vitals.hit_points_current).toBe(6);
  });

  it('should apply modifiers across all stats', () => {
    const armorMods: Modifier[] = [
      { id: '1', name: 'Armor Bonus', value: 2, source: 'system' },
    ];
    const hpMods: Modifier[] = [
      { id: '2', name: 'HP Bonus', value: 1, source: 'system' },
    ];
    const stressMods: Modifier[] = [
      { id: '3', name: 'Stress Bonus', value: 1, source: 'system' },
    ];

    const stats = calculateDerivedStats(baseCharacter, armorMods, hpMods, stressMods, []);

    expect(stats.vitals.armor_score).toBe(2);
    expect(stats.vitals.hit_points_max).toBe(7); // 6 + 1
    expect(stats.vitals.stress_max).toBe(7); // 6 + 1
  });

  it('should handle user modifiers from character.modifiers', () => {
    const character = {
      ...baseCharacter,
      modifiers: {
        armor: [{ id: '1', name: 'Manual Bonus', value: 1, source: 'user' }],
        hit_points: [{ id: '2', name: 'Manual Bonus', value: 2, source: 'user' }],
      },
    };

    const stats = calculateDerivedStats(character, [], [], [], []);

    expect(stats.vitals.armor_score).toBe(1);
    expect(stats.vitals.hit_points_max).toBe(8); // 6 + 2
  });
});
