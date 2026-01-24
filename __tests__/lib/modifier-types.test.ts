/**
 * MODIFIER TYPES TESTS
 */

import { vi, describe, it, expect } from 'vitest';
import {
  createModifierId,
  parseModifierId,
  createSourceId,
  createTypeSafeModifierSource,
  isTypeSafeModifierSource,
  asModifierId,
  asSourceId,
  MODIFIER_SOURCES_BRANDED,
  type ModifierId,
  type SourceId,
} from '@/lib/modifier-types';

describe('modifier-types', () => {
  describe('createModifierId', () => {
    it('should create a properly formatted modifier ID', () => {
      const id = createModifierId('equipment', 'sword-1', 'strength');
      expect(id).toBe('equipment-sword-1-strength');
    });

    it('should handle all modifier source types', () => {
      const sources = ['equipment', 'domain_card', 'user', 'ancestry', 'community', 'class', 'subclass'] as const;
      sources.forEach(source => {
        const id = createModifierId(source, 'test-id', 'stat');
        expect(id).toContain(source);
      });
    });

    it('should throw on invalid components', () => {
      expect(() => createModifierId('' as any, 'id', 'stat')).toThrow();
      expect(() => createModifierId('equipment', '', 'stat')).toThrow();
      expect(() => createModifierId('equipment', 'id', '')).toThrow();
    });

    it('should warn on unusual characters in development mode', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const id = createModifierId('equipment', 'sword@1', 'strength');
      if (process.env.NODE_ENV === 'development') {
        expect(warnSpy).toHaveBeenCalled();
      }
      warnSpy.mockRestore();
    });
  });

  describe('parseModifierId', () => {
    it('should parse a valid modifier ID', () => {
      const id = 'equipment-sword-1-strength' as ModifierId;
      const parsed = parseModifierId(id);
      expect(parsed).toEqual({
        source: 'equipment',
        sourceId: 'sword-1',
        stat: 'strength',
      });
    });

    it('should handle source IDs with hyphens', () => {
      const id = 'domain_card-arcane-ward-01-evasion' as ModifierId;
      const parsed = parseModifierId(id);
      expect(parsed).toEqual({
        source: 'domain_card',
        sourceId: 'arcane-ward-01',
        stat: 'evasion',
      });
    });

    it('should handle all modifier sources', () => {
      const sources = ['equipment', 'domain_card', 'user', 'ancestry', 'community', 'class', 'subclass'] as const;
      sources.forEach(source => {
        const id = `${source}-test-stat` as ModifierId;
        const parsed = parseModifierId(id);
        expect(parsed?.source).toBe(source);
      });
    });

    it('should return null for invalid modifier IDs', () => {
      expect(parseModifierId('invalid-id' as ModifierId)).toBeNull();
      expect(parseModifierId('stat-only' as ModifierId)).toBeNull();
    });
  });

  describe('createSourceId', () => {
    it('should create a valid source ID', () => {
      const id = createSourceId('sword-1');
      expect(id).toBe('sword-1');
    });

    it('should allow alphanumeric, hyphens, and underscores', () => {
      expect(createSourceId('sword_1')).toBe('sword_1');
      expect(createSourceId('weapon-primary-01')).toBe('weapon-primary-01');
      expect(createSourceId('custom_mod_1')).toBe('custom_mod_1');
    });

    it('should throw on invalid characters', () => {
      expect(() => createSourceId('sword@1')).toThrow();
      expect(() => createSourceId('sword 1')).toThrow();
      expect(() => createSourceId('sword.1')).toThrow();
    });

    it('should throw on empty string', () => {
      expect(() => createSourceId('')).toThrow();
    });
  });

  describe('createTypeSafeModifierSource', () => {
    it('should create a valid modifier source', () => {
      const source = createTypeSafeModifierSource({
        id: 'equipment-sword-1-strength' as ModifierId,
        name: 'Sword of Strength',
        value: 5,
        source: 'equipment',
        type: 'equipment',
      });

      expect(source.id).toBe('equipment-sword-1-strength');
      expect(source.value).toBe(5);
      expect(source.source).toBe('equipment');
    });

    it('should validate and clamp modifier values', () => {
      const source = createTypeSafeModifierSource({
        id: 'test' as ModifierId,
        name: 'Test',
        value: 100, // Out of bounds
        source: 'user',
        type: 'user',
      });

      expect(source.value).toBe(10); // Clamped to max
    });

    it('should handle invalid values', () => {
      const source = createTypeSafeModifierSource({
        id: 'test' as ModifierId,
        name: 'Test',
        value: NaN,
        source: 'user',
        type: 'user',
      });

      expect(source.value).toBe(0);
    });

    it('should preserve optional fields', () => {
      const source = createTypeSafeModifierSource({
        id: 'test' as ModifierId,
        name: 'Test',
        value: 2,
        source: 'domain_card',
        type: 'domain',
        formula: 'half_strength',
        condition: { type: 'always' },
      });

      expect(source.formula).toBe('half_strength');
      expect(source.condition).toEqual({ type: 'always' });
    });
  });

  describe('isTypeSafeModifierSource', () => {
    it('should validate a correct modifier source', () => {
      const source = {
        id: 'equipment-sword-1-strength',
        name: 'Sword',
        value: 5,
        source: 'equipment',
        type: 'equipment',
      };

      expect(isTypeSafeModifierSource(source)).toBe(true);
    });

    it('should reject invalid sources', () => {
      expect(isTypeSafeModifierSource(null)).toBe(false);
      expect(isTypeSafeModifierSource('not-an-object')).toBe(false);
      expect(isTypeSafeModifierSource({})).toBe(false);
    });

    it('should reject out-of-bounds values', () => {
      const source = {
        id: 'test',
        name: 'Test',
        value: 100, // Out of bounds
        source: 'user',
        type: 'user',
      };

      expect(isTypeSafeModifierSource(source)).toBe(false);
    });

    it('should reject non-finite values', () => {
      const source = {
        id: 'test',
        name: 'Test',
        value: NaN,
        source: 'user',
        type: 'user',
      };

      expect(isTypeSafeModifierSource(source)).toBe(false);
    });

    it('should reject invalid source types', () => {
      const source = {
        id: 'test',
        name: 'Test',
        value: 2,
        source: 'invalid_source',
        type: 'invalid',
      };

      expect(isTypeSafeModifierSource(source)).toBe(false);
    });
  });

  describe('asModifierId', () => {
    it('should brand a string as ModifierId', () => {
      const id = asModifierId('equipment-sword-1-strength');
      expect(id).toBe('equipment-sword-1-strength');
    });

    it('should throw on invalid input', () => {
      expect(() => asModifierId('')).toThrow();
      expect(() => asModifierId(null as any)).toThrow();
    });
  });

  describe('asSourceId', () => {
    it('should brand a string as SourceId', () => {
      const id = asSourceId('sword-1');
      expect(id).toBe('sword-1');
    });

    it('should throw on invalid input', () => {
      expect(() => asSourceId('')).toThrow();
      expect(() => asSourceId(null as any)).toThrow();
    });
  });

  describe('MODIFIER_SOURCES_BRANDED constant', () => {
    it('should contain all valid modifier sources', () => {
      expect(MODIFIER_SOURCES_BRANDED).toContain('equipment');
      expect(MODIFIER_SOURCES_BRANDED).toContain('domain_card');
      expect(MODIFIER_SOURCES_BRANDED).toContain('user');
      expect(MODIFIER_SOURCES_BRANDED).toContain('ancestry');
      expect(MODIFIER_SOURCES_BRANDED).toContain('community');
      expect(MODIFIER_SOURCES_BRANDED).toContain('class');
      expect(MODIFIER_SOURCES_BRANDED).toContain('subclass');
    });

    it('should have exactly 7 sources', () => {
      expect(MODIFIER_SOURCES_BRANDED).toHaveLength(7);
    });
  });

  describe('round-trip ID parsing', () => {
    it('should round-trip an ID without information loss', () => {
      const originalId = createModifierId('domain_card', 'arcane-ward-01', 'damage');
      const parsed = parseModifierId(originalId);

      expect(parsed).not.toBeNull();
      expect(parsed!.source).toBe('domain_card');
      expect(parsed!.sourceId).toBe('arcane-ward-01');
      expect(parsed!.stat).toBe('damage');

      const reconstructedId = createModifierId(
        parsed!.source,
        parsed!.sourceId as SourceId,
        parsed!.stat
      );
      expect(reconstructedId).toBe(originalId);
    });
  });
});
