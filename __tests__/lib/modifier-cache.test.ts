/**
 * MODIFIER CACHE TESTS
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCachedTraitTotals,
  getCachedAllModifiers,
  clearModifierCaches,
  getCacheStats,
  resetCacheStats,
} from '@/lib/modifier-cache';
import type { Character } from '@/types/character';
import type { CardStates } from '@/types/cards';

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

describe('modifier-cache', () => {
  beforeEach(() => {
    clearModifierCaches();
    resetCacheStats();
  });

  describe('getCachedTraitTotals', () => {
    it('should calculate and cache trait totals', () => {
      const character = createMockCharacter();
      const calculateFn = vi.fn((char: Character) => ({
        strength: char.stats.strength + 1,
        agility: char.stats.agility + 2,
      }));

      const result1 = getCachedTraitTotals(character, calculateFn);
      const result2 = getCachedTraitTotals(character, calculateFn);

      // Both should have same result
      expect(result1).toEqual(result2);
      expect(result1.strength).toBe(2); // 1 + 1
      expect(result1.agility).toBe(4); // 2 + 2

      // Function should only be called once (second is cached)
      expect(calculateFn).toHaveBeenCalledTimes(1);
    });

    it('should return different results for different characters', () => {
      const char1 = createMockCharacter({ stats: { ...createMockCharacter().stats, strength: 5 } });
      const char2 = createMockCharacter({ stats: { ...createMockCharacter().stats, strength: 3 } });

      const calculateFn = vi.fn((char: Character) => ({
        strength: char.stats.strength,
      }));

      const result1 = getCachedTraitTotals(char1, calculateFn);
      const result2 = getCachedTraitTotals(char2, calculateFn);

      expect(result1.strength).toBe(5);
      expect(result2.strength).toBe(3);
      expect(calculateFn).toHaveBeenCalledTimes(2);
    });

    it('should use cached result on repeated calls', () => {
      const character = createMockCharacter();
      const calculateFn = vi.fn(() => ({ strength: 5 }));

      getCachedTraitTotals(character, calculateFn);
      getCachedTraitTotals(character, calculateFn);
      getCachedTraitTotals(character, calculateFn);

      // Function should only be called once
      expect(calculateFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCachedAllModifiers', () => {
    it('should calculate and cache all modifiers', () => {
      const character = createMockCharacter();
      const cardStates: CardStates = {};
      const calculateFn = vi.fn(() => [
        { stat: 'strength', value: 2, source: 'equipment' },
        { stat: 'agility', value: 1, source: 'user' },
      ]);

      const result1 = getCachedAllModifiers(character, cardStates, calculateFn);
      const result2 = getCachedAllModifiers(character, cardStates, calculateFn);

      expect(result1).toEqual(result2);
      expect(result1).toHaveLength(2);
      expect(calculateFn).toHaveBeenCalledTimes(1);
    });

    it('should recalculate when card states change', () => {
      const character = createMockCharacter();
      const cardStates1: CardStates = { 'card-1': { current_tokens: 0, used_this_rest: false, used_this_long_rest: false, used_this_session: false, is_active: false } };
      const cardStates2: CardStates = { 'card-1': { current_tokens: 1, used_this_rest: false, used_this_long_rest: false, used_this_session: false, is_active: true } };
      const calculateFn = vi.fn(() => [{ stat: 'strength', value: 2, source: 'equipment' }]);

      getCachedAllModifiers(character, cardStates1, calculateFn);
      getCachedAllModifiers(character, cardStates2, calculateFn);

      // Function should be called twice because card states changed
      expect(calculateFn).toHaveBeenCalledTimes(2);
    });

    it('should use cached result when card states are the same', () => {
      const character = createMockCharacter();
      const cardStates: CardStates = { 'card-1': { current_tokens: 0, used_this_rest: false, used_this_long_rest: false, used_this_session: false, is_active: false } };
      const calculateFn = vi.fn(() => [{ stat: 'strength', value: 2, source: 'equipment' }]);

      getCachedAllModifiers(character, cardStates, calculateFn);
      getCachedAllModifiers(character, cardStates, calculateFn);
      getCachedAllModifiers(character, cardStates, calculateFn);

      // Function should only be called once
      expect(calculateFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache invalidation', () => {
    it('should clear all caches', () => {
      const character = createMockCharacter();
      const calculateFn = vi.fn(() => ({ strength: 5 }));

      getCachedTraitTotals(character, calculateFn);
      expect(calculateFn).toHaveBeenCalledTimes(1);

      clearModifierCaches();

      getCachedTraitTotals(character, calculateFn);
      expect(calculateFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('cache statistics', () => {
    it('should track cache hits and misses in development mode', () => {
      // Only run this in development mode
      if (process.env.NODE_ENV !== 'development') {
        return;
      }

      resetCacheStats();
      const character = createMockCharacter();
      const calculateFn = vi.fn(() => ({ strength: 5 }));

      // First call: miss
      getCachedTraitTotals(character, calculateFn);
      let stats = getCacheStats();
      expect(stats?.traitTotals.misses).toBe(1);
      expect(stats?.traitTotals.hits).toBe(0);

      // Second call: hit
      getCachedTraitTotals(character, calculateFn);
      stats = getCacheStats();
      expect(stats?.traitTotals.misses).toBe(1);
      expect(stats?.traitTotals.hits).toBe(1);
    });

    it('should return null in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const stats = getCacheStats();
      expect(stats).toBeNull();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('performance scenarios', () => {
    it('should significantly reduce calculations for multiple stat queries', () => {
      const character = createMockCharacter();
      const cardStates: CardStates = {};
      const calculateFn = vi.fn(() => [
        { stat: 'strength', value: 1, source: 'equipment' },
        { stat: 'agility', value: 2, source: 'user' },
        { stat: 'finesse', value: 1, source: 'domain_card' },
      ]);

      // Query for each stat (6 traits)
      // Without cache: 6 full calculations
      // With cache: 1 full calculation, then extract from cache
      getCachedAllModifiers(character, cardStates, calculateFn);
      getCachedAllModifiers(character, cardStates, calculateFn);
      getCachedAllModifiers(character, cardStates, calculateFn);
      getCachedAllModifiers(character, cardStates, calculateFn);
      getCachedAllModifiers(character, cardStates, calculateFn);
      getCachedAllModifiers(character, cardStates, calculateFn);

      // All should use cached result
      expect(calculateFn).toHaveBeenCalledTimes(1);
    });

    it('should handle many characters without memory leaks', () => {
      const calculateFn = vi.fn(() => ({ strength: 5 }));

      // Create many characters
      for (let i = 0; i < 100; i++) {
        const character = createMockCharacter({ id: `char-${i}` });
        getCachedTraitTotals(character, calculateFn);
      }

      // Each character should be calculated once
      expect(calculateFn).toHaveBeenCalledTimes(100);

      // Create same characters again (with different object references)
      for (let i = 0; i < 100; i++) {
        const character = createMockCharacter({ id: `char-${i}` });
        getCachedTraitTotals(character, calculateFn);
      }

      // WeakMap should NOT have cached these (different object references)
      // So should calculate again
      expect(calculateFn).toHaveBeenCalledTimes(200);
    });
  });
});
