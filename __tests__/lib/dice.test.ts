/**
 * DICE UTILITIES TESTS
 * ----------------------------------------------------------------------------
 * Comprehensive tests for the dice rolling pure functions.
 * These tests ensure dice logic works correctly regardless of 3D rendering.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  rollDice,
  parseDiceNotation,
  rollDiceSet,
  calculateDamageResult,
  calculateDualityResult,
  rollDuality,
  rollDamage,
  DieConfig,
  DieResult,
} from '@/lib/dice';

describe('Dice Utilities', () => {
  describe('rollDice', () => {
    it('should return a value between 1 and sides (inclusive)', () => {
      // Roll many times to check bounds
      for (let i = 0; i < 100; i++) {
        const result = rollDice(6);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
      }
    });

    it('should work with different die sizes', () => {
      const dieSizes = [4, 6, 8, 10, 12, 20, 100];
      for (const sides of dieSizes) {
        for (let i = 0; i < 20; i++) {
          const result = rollDice(sides);
          expect(result).toBeGreaterThanOrEqual(1);
          expect(result).toBeLessThanOrEqual(sides);
        }
      }
    });

    it('should return 1 for a d1', () => {
      const result = rollDice(1);
      expect(result).toBe(1);
    });
  });

  describe('parseDiceNotation', () => {
    it('should parse a simple die notation like "d8"', () => {
      const result = parseDiceNotation('d8');
      expect(result.diceConfig).toHaveLength(1);
      expect(result.diceConfig[0].sides).toBe(8);
      expect(result.stringModifier).toBe(0);
    });

    it('should parse multiple dice like "2d6"', () => {
      const result = parseDiceNotation('2d6');
      expect(result.diceConfig).toHaveLength(2);
      expect(result.diceConfig[0].sides).toBe(6);
      expect(result.diceConfig[1].sides).toBe(6);
      expect(result.stringModifier).toBe(0);
    });

    it('should parse dice with modifier like "1d8+3"', () => {
      const result = parseDiceNotation('1d8+3');
      expect(result.diceConfig).toHaveLength(1);
      expect(result.diceConfig[0].sides).toBe(8);
      expect(result.stringModifier).toBe(3);
    });

    it('should parse multiple dice with modifier like "2d8+4"', () => {
      const result = parseDiceNotation('2d8+4');
      expect(result.diceConfig).toHaveLength(2);
      expect(result.stringModifier).toBe(4);
    });

    it('should parse complex notation like "1d12+2d6+5"', () => {
      const result = parseDiceNotation('1d12+2d6+5');
      expect(result.diceConfig).toHaveLength(3);
      expect(result.diceConfig[0].sides).toBe(12);
      expect(result.diceConfig[1].sides).toBe(6);
      expect(result.diceConfig[2].sides).toBe(6);
      expect(result.stringModifier).toBe(5);
    });

    it('should strip damage type annotations like "phy" and "mag"', () => {
      const result = parseDiceNotation('2d8 phy+3');
      expect(result.diceConfig).toHaveLength(2);
      expect(result.stringModifier).toBe(3);
    });

    it('should handle whitespace in notation', () => {
      const result = parseDiceNotation('2d6 + 3');
      expect(result.diceConfig).toHaveLength(2);
      expect(result.stringModifier).toBe(3);
    });

    it('should use custom theme color when provided', () => {
      const result = parseDiceNotation('d6', '#ff0000');
      expect(result.diceConfig[0].themeColor).toBe('#ff0000');
    });

    it('should return empty config for invalid notation', () => {
      const result = parseDiceNotation('invalid');
      expect(result.diceConfig).toHaveLength(0);
      expect(result.stringModifier).toBe(0);
    });

    it('should handle just a modifier like "+5"', () => {
      const result = parseDiceNotation('+5');
      expect(result.diceConfig).toHaveLength(0);
      expect(result.stringModifier).toBe(5);
    });
  });

  describe('rollDiceSet', () => {
    it('should return results for all dice in config', () => {
      const config = [{ sides: 6 }, { sides: 8 }, { sides: 12 }];
      const results = rollDiceSet(config);
      expect(results).toHaveLength(3);
      expect(results[0].sides).toBe(6);
      expect(results[1].sides).toBe(8);
      expect(results[2].sides).toBe(12);
    });

    it('should return values within valid ranges', () => {
      const config = [{ sides: 20 }, { sides: 4 }];
      const results = rollDiceSet(config);
      expect(results[0].value).toBeGreaterThanOrEqual(1);
      expect(results[0].value).toBeLessThanOrEqual(20);
      expect(results[1].value).toBeGreaterThanOrEqual(1);
      expect(results[1].value).toBeLessThanOrEqual(4);
    });

    it('should set role to damage for all dice', () => {
      const config = [{ sides: 6 }, { sides: 8 }];
      const results = rollDiceSet(config);
      expect(results[0].role).toBe('damage');
      expect(results[1].role).toBe('damage');
    });
  });

  describe('calculateDamageResult', () => {
    it('should calculate total from dice values and modifier', () => {
      const diceResults: DieResult[] = [
        { role: 'damage', value: 5, sides: 8 },
        { role: 'damage', value: 3, sides: 8 },
      ];
      const result = calculateDamageResult(diceResults, 4);
      expect(result.total).toBe(12); // 5 + 3 + 4
      expect(result.modifier).toBe(4);
      expect(result.dice).toEqual(diceResults);
    });

    it('should handle zero modifier', () => {
      const diceResults: DieResult[] = [{ role: 'damage', value: 6, sides: 6 }];
      const result = calculateDamageResult(diceResults, 0);
      expect(result.total).toBe(6);
    });

    it('should handle empty dice array', () => {
      const result = calculateDamageResult([], 5);
      expect(result.total).toBe(5);
    });
  });

  describe('calculateDualityResult', () => {
    it('should identify Hope type when hope > fear', () => {
      const dicePool: DieConfig[] = [
        { id: '1', sides: 12, role: 'hope' },
        { id: '2', sides: 12, role: 'fear' },
      ];
      const rollValues = [10, 5]; // hope=10, fear=5
      const result = calculateDualityResult(dicePool, rollValues, 0);
      expect(result.type).toBe('Hope');
      expect(result.hope).toBe(10);
      expect(result.fear).toBe(5);
      expect(result.total).toBe(15);
    });

    it('should identify Fear type when fear > hope', () => {
      const dicePool: DieConfig[] = [
        { id: '1', sides: 12, role: 'hope' },
        { id: '2', sides: 12, role: 'fear' },
      ];
      const rollValues = [3, 8]; // hope=3, fear=8
      const result = calculateDualityResult(dicePool, rollValues, 0);
      expect(result.type).toBe('Fear');
      expect(result.hope).toBe(3);
      expect(result.fear).toBe(8);
    });

    it('should identify Critical when hope equals fear (and both non-zero)', () => {
      const dicePool: DieConfig[] = [
        { id: '1', sides: 12, role: 'hope' },
        { id: '2', sides: 12, role: 'fear' },
      ];
      const rollValues = [7, 7]; // hope=7, fear=7
      const result = calculateDualityResult(dicePool, rollValues, 0);
      expect(result.type).toBe('Critical');
    });

    it('should not be Critical when both are zero', () => {
      // Edge case - should default to Fear since 0 is not > 0
      const dicePool: DieConfig[] = [
        { id: '1', sides: 12, role: 'plus' }, // Not hope/fear
        { id: '2', sides: 12, role: 'plus' },
      ];
      const rollValues = [5, 3];
      const result = calculateDualityResult(dicePool, rollValues, 0);
      expect(result.type).toBe('Fear'); // 0 is not > 0, so Fear
      expect(result.hope).toBe(0);
      expect(result.fear).toBe(0);
    });

    it('should add plus dice to total', () => {
      const dicePool: DieConfig[] = [
        { id: '1', sides: 12, role: 'hope' },
        { id: '2', sides: 12, role: 'fear' },
        { id: '3', sides: 6, role: 'plus' },
      ];
      const rollValues = [10, 5, 4]; // hope=10, fear=5, plus=4
      const result = calculateDualityResult(dicePool, rollValues, 0);
      expect(result.plusTotal).toBe(4);
      expect(result.total).toBe(19); // 10 + 5 + 4
    });

    it('should subtract minus dice from total', () => {
      const dicePool: DieConfig[] = [
        { id: '1', sides: 12, role: 'hope' },
        { id: '2', sides: 12, role: 'fear' },
        { id: '3', sides: 6, role: 'minus' },
      ];
      const rollValues = [10, 5, 3]; // hope=10, fear=5, minus=3
      const result = calculateDualityResult(dicePool, rollValues, 0);
      expect(result.minusTotal).toBe(3);
      expect(result.total).toBe(12); // 10 + 5 - 3
    });

    it('should apply modifier to total', () => {
      const dicePool: DieConfig[] = [
        { id: '1', sides: 12, role: 'hope' },
        { id: '2', sides: 12, role: 'fear' },
      ];
      const rollValues = [10, 5];
      const result = calculateDualityResult(dicePool, rollValues, 3);
      expect(result.modifier).toBe(3);
      expect(result.total).toBe(18); // 10 + 5 + 3
    });

    it('should handle complex pool with all dice types', () => {
      const dicePool: DieConfig[] = [
        { id: '1', sides: 12, role: 'hope' },
        { id: '2', sides: 12, role: 'fear' },
        { id: '3', sides: 6, role: 'plus' },
        { id: '4', sides: 6, role: 'plus' },
        { id: '5', sides: 4, role: 'minus' },
      ];
      const rollValues = [8, 6, 4, 3, 2]; // hope=8, fear=6, plus=4+3=7, minus=2
      const result = calculateDualityResult(dicePool, rollValues, 2);
      expect(result.hope).toBe(8);
      expect(result.fear).toBe(6);
      expect(result.plusTotal).toBe(7);
      expect(result.minusTotal).toBe(2);
      expect(result.modifier).toBe(2);
      expect(result.total).toBe(21); // 8 + 6 + 2 + 7 - 2 = 21
      expect(result.type).toBe('Hope'); // 8 > 6
    });

    it('should only use first hope die for primary hope value', () => {
      const dicePool: DieConfig[] = [
        { id: '1', sides: 12, role: 'hope' },
        { id: '2', sides: 12, role: 'hope' }, // Second hope die
        { id: '3', sides: 12, role: 'fear' },
      ];
      const rollValues = [10, 12, 5]; // First hope=10, second hope=12, fear=5
      const result = calculateDualityResult(dicePool, rollValues, 0);
      expect(result.hope).toBe(10); // Uses first hope die
    });
  });

  describe('rollDuality', () => {
    it('should return a valid duality result', () => {
      const dicePool: DieConfig[] = [
        { id: '1', sides: 12, role: 'hope' },
        { id: '2', sides: 12, role: 'fear' },
      ];
      const result = rollDuality(dicePool, 0);
      expect(result.hope).toBeGreaterThanOrEqual(1);
      expect(result.hope).toBeLessThanOrEqual(12);
      expect(result.fear).toBeGreaterThanOrEqual(1);
      expect(result.fear).toBeLessThanOrEqual(12);
      expect(['Critical', 'Hope', 'Fear']).toContain(result.type);
    });

    it('should apply modifier correctly', () => {
      const dicePool: DieConfig[] = [
        { id: '1', sides: 12, role: 'hope' },
        { id: '2', sides: 12, role: 'fear' },
      ];
      const result = rollDuality(dicePool, 5);
      expect(result.modifier).toBe(5);
      // Total should be hope + fear + modifier
      expect(result.total).toBe(result.hope + result.fear + 5);
    });
  });

  describe('rollDamage', () => {
    it('should roll damage with simple notation', () => {
      const result = rollDamage('2d6', 0);
      expect(result.dice).toHaveLength(2);
      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.total).toBeLessThanOrEqual(12);
    });

    it('should include string modifier in total', () => {
      const result = rollDamage('1d1+5', 0); // d1 always = 1
      expect(result.total).toBe(6); // 1 + 5
    });

    it('should include additional modifier in total', () => {
      const result = rollDamage('1d1+3', 2); // d1 always = 1
      expect(result.total).toBe(6); // 1 + 3 + 2
      expect(result.modifier).toBe(5); // stringModifier(3) + additionalModifier(2)
    });

    it('should handle complex notation', () => {
      const result = rollDamage('2d8+1d6+4', 1);
      expect(result.dice).toHaveLength(3);
      expect(result.modifier).toBe(5); // 4 + 1
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty dice pool gracefully', () => {
      const result = calculateDualityResult([], [], 5);
      expect(result.hope).toBe(0);
      expect(result.fear).toBe(0);
      expect(result.total).toBe(5); // Just the modifier
      expect(result.type).toBe('Fear'); // 0 is not > 0
    });

    it('should handle negative modifiers', () => {
      const dicePool: DieConfig[] = [
        { id: '1', sides: 12, role: 'hope' },
        { id: '2', sides: 12, role: 'fear' },
      ];
      const rollValues = [10, 5];
      const result = calculateDualityResult(dicePool, rollValues, -3);
      expect(result.total).toBe(12); // 10 + 5 - 3
    });

    it('should parse notation with just modifiers', () => {
      const { diceConfig, stringModifier } = parseDiceNotation('3');
      expect(diceConfig).toHaveLength(0);
      expect(stringModifier).toBe(3);
    });
  });
});
