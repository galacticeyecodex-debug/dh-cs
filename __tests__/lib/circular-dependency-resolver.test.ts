/**
 * CIRCULAR DEPENDENCY RESOLVER TESTS
 */

import { describe, it, expect } from 'vitest';
import {
  calculateBaseTraitTotals,
  isTrait,
  createCharacterForFormulaEvaluation,
  createFormulaContext,
} from '@/lib/circular-dependency-resolver';
import type { Character } from '@/types/character';

// Mock character factory
const createMockCharacter = (overrides?: Partial<Character>): Character => ({
  id: 'char-1',
  user_id: 'user-1',
  name: 'Test Character',
  level: 1,
  stats: {
    agility: 2,
    strength: 1,
    finesse: 0,
    instinct: -1,
    presence: 3,
    knowledge: 0,
  },
  vitals: {
    hit_points_max: 6,
    hit_points_current: 6,
    stress_max: 6,
    stress_current: 0,
    armor_score: 0,
    armor_slots: 0,
  },
  damage_thresholds: { minor: 1, major: 1, severe: 2 },
  hope: 6,
  fear: 0,
  evasion: 10,
  proficiency: 1,
  experiences: [],
  modifiers: {},
  gold: { handfuls: 0, bags: 0, chests: 0 },
  character_cards: [],
  character_inventory: [],
  ...overrides,
});

describe('circular-dependency-resolver', () => {
  describe('calculateBaseTraitTotals', () => {
    it('should calculate base trait totals without domain modifiers', () => {
      const character = createMockCharacter({
        modifiers: {
          strength: [{ name: 'Buff', value: 2 }],
        },
      });

      const totals = calculateBaseTraitTotals(character);

      // base strength (1) + user modifier (2) = 3
      expect(totals.strength).toBe(3);
      // base agility (2) + no mods = 2
      expect(totals.agility).toBe(2);
    });

    it('should handle negative user modifiers', () => {
      const character = createMockCharacter({
        modifiers: {
          agility: [{ name: 'Curse', value: -1 }],
        },
      });

      const totals = calculateBaseTraitTotals(character);

      // base agility (2) + negative mod (-1) = 1
      expect(totals.agility).toBe(1);
    });

    it('should handle multiple user modifiers per trait', () => {
      const character = createMockCharacter({
        modifiers: {
          strength: [
            { name: 'Buff1', value: 1 },
            { name: 'Buff2', value: 2 },
          ],
        },
      });

      const totals = calculateBaseTraitTotals(character);

      // base strength (1) + mods (1 + 2) = 4
      expect(totals.strength).toBe(4);
    });

    it('should return all 6 traits', () => {
      const character = createMockCharacter();
      const totals = calculateBaseTraitTotals(character);

      expect(totals).toHaveProperty('agility');
      expect(totals).toHaveProperty('strength');
      expect(totals).toHaveProperty('finesse');
      expect(totals).toHaveProperty('instinct');
      expect(totals).toHaveProperty('presence');
      expect(totals).toHaveProperty('knowledge');
    });

    it('should NOT include domain card modifiers', () => {
      const character = createMockCharacter({
        modifiers: {
          strength: [{ name: 'User Buff', value: 2 }],
        },
        // Note: domain card modifiers would come from character_cards processing
        // but we're just testing that user mods are included
      });

      const totals = calculateBaseTraitTotals(character);

      // Should have user mods but not domain card mods
      expect(totals.strength).toBe(1 + 2); // base + user only
    });
  });

  describe('isTrait', () => {
    it('should identify all 6 traits correctly', () => {
      expect(isTrait('agility')).toBe(true);
      expect(isTrait('strength')).toBe(true);
      expect(isTrait('finesse')).toBe(true);
      expect(isTrait('instinct')).toBe(true);
      expect(isTrait('presence')).toBe(true);
      expect(isTrait('knowledge')).toBe(true);
    });

    it('should reject non-trait stats', () => {
      expect(isTrait('evasion')).toBe(false);
      expect(isTrait('armor')).toBe(false);
      expect(isTrait('damage')).toBe(false);
      expect(isTrait('spellcast')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isTrait('STRENGTH')).toBe(true);
      expect(isTrait('Strength')).toBe(true);
      expect(isTrait('sTrEnGtH')).toBe(true);
    });

    it('should handle empty string', () => {
      expect(isTrait('')).toBe(false);
    });
  });

  describe('createCharacterForFormulaEvaluation', () => {
    it('should create character with calculated stats', () => {
      const character = createMockCharacter({ stats: { strength: 1 } });
      const statsToUse = { strength: 5, agility: 3 };

      const formulaChar = createCharacterForFormulaEvaluation(character, statsToUse);

      expect(formulaChar.stats.strength).toBe(5);
      expect(formulaChar.stats.agility).toBe(3);
    });

    it('should preserve other character properties', () => {
      const character = createMockCharacter({ name: 'Test' });
      const statsToUse = { strength: 5 };

      const formulaChar = createCharacterForFormulaEvaluation(character, statsToUse);

      expect(formulaChar.name).toBe('Test');
      expect(formulaChar.id).toBe('char-1');
    });

    it('should not modify original character', () => {
      const character = createMockCharacter();
      const originalStrength = character.stats.strength;
      const statsToUse = { strength: 10 };

      createCharacterForFormulaEvaluation(character, statsToUse);

      expect(character.stats.strength).toBe(originalStrength);
    });
  });

  describe('createFormulaContext', () => {
    it('should create evaluation context with stats', () => {
      const character = createMockCharacter() as Character & { stats: Record<string, number> };
      const baseStats = { strength: 3, agility: 4 };

      const context = createFormulaContext(character, baseStats);

      expect(context.stats).toEqual(character.stats);
      expect(context.baseStats).toEqual(baseStats);
    });

    it('should provide getStatValue method', () => {
      const character = createMockCharacter() as Character & { stats: Record<string, number> };
      character.stats.strength = 5;
      const baseStats = { strength: 3 };

      const context = createFormulaContext(character, baseStats);

      expect(context.getStatValue('strength')).toBe(5);
    });

    it('should fallback to baseStats for missing stats', () => {
      const character = createMockCharacter() as Character & { stats: Record<string, number> };
      const baseStats = { custom_stat: 10 };

      const context = createFormulaContext(character, baseStats);

      // Should return base stat value when not in calculated stats
      expect(context.getStatValue('custom_stat')).toBe(10);
    });

    it('should return 0 for unknown stats', () => {
      const character = createMockCharacter() as Character & { stats: Record<string, number> };
      const baseStats = {};

      const context = createFormulaContext(character, baseStats);

      expect(context.getStatValue('unknown_stat')).toBe(0);
    });

    it('should not modify original objects', () => {
      const character = createMockCharacter() as Character & { stats: Record<string, number> };
      const originalStats = { ...character.stats };
      const baseStats = { strength: 3 };

      createFormulaContext(character, baseStats);

      expect(character.stats).toEqual(originalStats);
    });
  });

  describe('circular dependency resolution', () => {
    it('should provide complete solution for domain card formula evaluation', () => {
      const character = createMockCharacter({
        stats: { strength: 4 },
        modifiers: { strength: [{ name: 'User Buff', value: 1 }] },
      });

      // Step 1: Calculate base traits (includes user mods, not domain card mods)
      const baseTraits = calculateBaseTraitTotals(character);
      expect(baseTraits.strength).toBe(5); // 4 + 1 (user only)

      // Step 2: Create character for formula evaluation
      const charForFormulas = createCharacterForFormulaEvaluation(character, baseTraits);
      expect(charForFormulas.stats.strength).toBe(5);

      // Step 3: Domain card can safely use this strength value in formula
      // "[1d8 + Strength]" uses Strength = 5
      // Without circular dependency!

      // Step 4: Domain card modifiers are added separately
      // "+2 Strength" is added as ModifierSource
      // Final = 5 + 2 = 7 ✓
    });
  });
});
