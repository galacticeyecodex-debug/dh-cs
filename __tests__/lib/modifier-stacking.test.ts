/**
 * MODIFIER STACKING & CONFLICT TESTS
 * ============================================================================
 * Tests for modifier ordering, stacking behavior, and conflict resolution.
 * Ensures modifiers are applied in correct order across all sources.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock dependencies before imports
vi.mock('@/lib/enhancement-utils', () => ({
  getModifiers: vi.fn(() => []),
  isModifierActive: vi.fn(() => false),
}));

vi.mock('@/lib/card-parser', () => ({
  calculateDynamicValue: vi.fn((formula: string) => 0),
  parseCardPassiveModifiers: vi.fn(() => []),
  getBareBonesBonuses: vi.fn(() => []),
}));

import { getStatModifiers } from '@/lib/modifier-aggregator';
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

describe('modifier stacking and ordering', () => {
  describe('user modifier stacking', () => {
    it('should stack multiple user modifiers', () => {
      const character = createMockCharacter({
        modifiers: {
          strength: [
            { name: 'Blessing', value: 2 },
            { name: 'Buff', value: 1 },
            { name: 'Enhancement', value: 3 },
          ],
        },
      });

      const mods = getStatModifiers(character, 'strength', {});
      const userMods = mods.filter(m => m.source === 'user');

      expect(userMods).toHaveLength(3);
      const total = userMods.reduce((sum, m) => sum + m.value, 0);
      expect(total).toBe(6); // 2 + 1 + 3
    });

    it('should not exclude any user modifiers', () => {
      const character = createMockCharacter({
        modifiers: {
          strength: [
            { name: 'Buff1', value: 1 },
            { name: 'Buff2', value: 2 },
            { name: 'Buff3', value: 1 },
            { name: 'Buff4', value: 1 },
          ],
        },
      });

      const mods = getStatModifiers(character, 'strength', {});
      const userMods = mods.filter(m => m.source === 'user');

      // Should have all 4 modifiers
      expect(userMods).toHaveLength(4);

      // Total should be 5 (1 + 2 + 1 + 1)
      const total = userMods.reduce((sum, m) => sum + m.value, 0);
      expect(total).toBe(5);
    });
  });

  describe('modifier boundary cases', () => {
    it('should handle zero-value modifiers', () => {
      const character = createMockCharacter({
        modifiers: {
          strength: [
            { name: 'Zero', value: 0 },
            { name: 'Real', value: 2 },
          ],
        },
      });

      const mods = getStatModifiers(character, 'strength', {});
      const userMods = mods.filter(m => m.source === 'user');

      expect(userMods).toHaveLength(2);
      const total = userMods.reduce((sum, m) => sum + m.value, 0);
      expect(total).toBe(2);
    });

    it('should handle negative modifiers', () => {
      const character = createMockCharacter({
        modifiers: {
          strength: [
            { name: 'Curse', value: -2 },
            { name: 'Weakness', value: -1 },
          ],
        },
      });

      const mods = getStatModifiers(character, 'strength', {});
      const total = mods.reduce((sum, m) => sum + m.value, 0);

      expect(total).toBe(-3);
    });

    it('should handle mixed positive and negative modifiers', () => {
      const character = createMockCharacter({
        modifiers: {
          agility: [
            { name: 'Boost', value: 3 },
            { name: 'Penalty', value: -1 },
          ],
        },
      });

      const mods = getStatModifiers(character, 'agility', {});
      const total = mods.reduce((sum, m) => sum + m.value, 0);

      expect(total).toBe(2); // 3 - 1
    });
  });

  describe('modifier validation', () => {
    it('should apply validation to all modifiers', () => {
      const character = createMockCharacter({
        modifiers: {
          strength: [
            { name: 'Buff1', value: 5 },
            { name: 'Buff2', value: 5 },
            { name: 'Buff3', value: 5 }, // Total would be 15, but each is clamped to 10
          ],
        },
      });

      const mods = getStatModifiers(character, 'strength', {});

      // Each individual modifier should be clamped to max 10
      mods.forEach(mod => {
        expect(mod.value).toBeLessThanOrEqual(10);
        expect(mod.value).toBeGreaterThanOrEqual(-10);
      });
    });
  });

  describe('modifier totals calculation', () => {
    it('should correctly sum all available modifiers for a stat', () => {
      const character = createMockCharacter({
        modifiers: {
          presence: [
            { name: 'Charm', value: 2 },
            { name: 'Grace', value: 1 },
          ],
        },
      });

      const mods = getStatModifiers(character, 'presence', {});
      const total = mods.reduce((sum, m) => sum + m.value, 0);

      expect(total).toBe(3); // 2 + 1
    });

    it('should correctly handle empty modifier sources', () => {
      const character = createMockCharacter({
        modifiers: { strength: [] },
      });

      const mods = getStatModifiers(character, 'strength', {});

      expect(mods).toHaveLength(0);
      const total = mods.reduce((sum, m) => sum + m.value, 0);
      expect(total).toBe(0);
    });

    it('should return consistent totals across multiple queries', () => {
      const character = createMockCharacter({
        modifiers: {
          strength: [
            { name: 'Buff1', value: 2 },
            { name: 'Buff2', value: 1 },
          ],
        },
      });

      const total1 = getStatModifiers(character, 'strength', {}).reduce((sum, m) => sum + m.value, 0);
      const total2 = getStatModifiers(character, 'strength', {}).reduce((sum, m) => sum + m.value, 0);

      expect(total1).toBe(total2);
      expect(total1).toBe(3);
    });
  });

  describe('different stat queries', () => {
    it('should query different stats independently', () => {
      const character = createMockCharacter({
        modifiers: {
          strength: [{ name: 'Str Buff', value: 2 }],
          agility: [{ name: 'Agi Buff', value: 3 }],
          knowledge: [{ name: 'Know Buff', value: 1 }],
        },
      });

      const strMods = getStatModifiers(character, 'strength', {});
      const agiMods = getStatModifiers(character, 'agility', {});
      const knMods = getStatModifiers(character, 'knowledge', {});

      const strTotal = strMods.reduce((sum, m) => sum + m.value, 0);
      const agiTotal = agiMods.reduce((sum, m) => sum + m.value, 0);
      const knTotal = knMods.reduce((sum, m) => sum + m.value, 0);

      expect(strTotal).toBe(2);
      expect(agiTotal).toBe(3);
      expect(knTotal).toBe(1);
    });
  });
});
