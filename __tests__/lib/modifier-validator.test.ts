/**
 * MODIFIER VALIDATOR TESTS
 */

import { validateModifierValue, validateModifier, MODIFIER_BOUNDS } from '@/lib/modifier-validator';

describe('modifier-validator', () => {
  describe('validateModifierValue', () => {
    describe('valid numbers', () => {
      it('should return the value as-is if within bounds', () => {
        expect(validateModifierValue(0)).toBe(0);
        expect(validateModifierValue(1)).toBe(1);
        expect(validateModifierValue(-1)).toBe(-1);
        expect(validateModifierValue(5)).toBe(5);
        expect(validateModifierValue(-5)).toBe(-5);
      });

      it('should handle min and max bounds exactly', () => {
        expect(validateModifierValue(MODIFIER_BOUNDS.min)).toBe(MODIFIER_BOUNDS.min);
        expect(validateModifierValue(MODIFIER_BOUNDS.max)).toBe(MODIFIER_BOUNDS.max);
      });

      it('should handle decimal values', () => {
        expect(validateModifierValue(1.5)).toBe(1.5);
        expect(validateModifierValue(-2.5)).toBe(-2.5);
      });
    });

    describe('out of bounds values', () => {
      it('should clamp values below minimum', () => {
        expect(validateModifierValue(-11)).toBe(MODIFIER_BOUNDS.min);
        expect(validateModifierValue(-100)).toBe(MODIFIER_BOUNDS.min);
      });

      it('should clamp values above maximum', () => {
        expect(validateModifierValue(11)).toBe(MODIFIER_BOUNDS.max);
        expect(validateModifierValue(100)).toBe(MODIFIER_BOUNDS.max);
      });
    });

    describe('invalid values', () => {
      it('should return 0 for NaN', () => {
        expect(validateModifierValue(NaN)).toBe(0);
      });

      it('should return 0 for Infinity', () => {
        expect(validateModifierValue(Infinity)).toBe(0);
      });

      it('should return 0 for -Infinity', () => {
        expect(validateModifierValue(-Infinity)).toBe(0);
      });

      it('should return 0 for non-number types', () => {
        expect(validateModifierValue(null)).toBe(0);
        expect(validateModifierValue(undefined)).toBe(0);
        expect(validateModifierValue('5' as any)).toBe(0);
        expect(validateModifierValue({} as any)).toBe(0);
        expect(validateModifierValue([] as any)).toBe(0);
        expect(validateModifierValue(true as any)).toBe(0);
      });
    });
  });

  describe('validateModifier', () => {
    it('should validate the value field of a modifier object', () => {
      const modifier = { id: '1', value: 5, source: 'test' };
      expect(validateModifier(modifier)).toEqual(modifier);
    });

    it('should clamp out-of-bounds values in modifier objects', () => {
      const modifier = { id: '1', value: 20, source: 'test' };
      const result = validateModifier(modifier);
      expect(result.value).toBe(MODIFIER_BOUNDS.max);
    });

    it('should return 0 for invalid values in modifier objects', () => {
      const modifier = { id: '1', value: NaN as any, source: 'test' };
      const result = validateModifier(modifier);
      expect(result.value).toBe(0);
    });

    it('should preserve other fields in modifier object', () => {
      const modifier = { id: '1', value: 5, source: 'test', name: 'Test Mod' };
      const result = validateModifier(modifier);
      expect(result.id).toBe('1');
      expect(result.source).toBe('test');
      expect(result.name).toBe('Test Mod');
    });
  });

  describe('edge cases', () => {
    it('should handle zero correctly', () => {
      expect(validateModifierValue(0)).toBe(0);
    });

    it('should handle very small decimal values', () => {
      expect(validateModifierValue(0.0001)).toBe(0.0001);
      expect(validateModifierValue(-0.0001)).toBe(-0.0001);
    });

    it('should handle exact boundary values', () => {
      expect(validateModifierValue(MODIFIER_BOUNDS.min)).toBe(MODIFIER_BOUNDS.min);
      expect(validateModifierValue(MODIFIER_BOUNDS.max)).toBe(MODIFIER_BOUNDS.max);
      expect(validateModifierValue(MODIFIER_BOUNDS.min - 0.001)).toBe(MODIFIER_BOUNDS.min);
      expect(validateModifierValue(MODIFIER_BOUNDS.max + 0.001)).toBe(MODIFIER_BOUNDS.max);
    });
  });
});
