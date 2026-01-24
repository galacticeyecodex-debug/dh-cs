/**
 * MODIFIER COMPLETENESS TESTS
 * ----------------------------------------------------------------------------
 * Tests to ensure all modifier sources are properly handled by the unified
 * modifier-aggregator. These tests verify:
 *
 * 1. All MODIFIER_SOURCES have corresponding handlers
 * 2. No duplicate modifiers from ancestry features (the historical bug)
 * 3. Community, class, and subclass features are properly extracted
 * 4. Exhaustive switch catches any new sources without handlers
 *
 * @see lib/modifier-aggregator.ts
 * @see Issue #75: Unified Modifier System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies before imports
vi.mock('@/lib/enhancement-utils', () => ({
  getModifiers: vi.fn(() => []),
  isModifierActive: vi.fn(() => false),
}));

vi.mock('@/lib/card-parser', () => ({
  calculateDynamicValue: vi.fn((formula: string) => 0),
  parseCardPassiveModifiers: vi.fn(() => []),
  getBareBonesBonuses: vi.fn(() => []),
  parseStaticModifiers: vi.fn((text: string, source: string) => {
    // Simple mock that extracts "+N to stat" patterns
    const matches = Array.from(text.matchAll(/\+(\d+)\s+(?:bonus\s+)?to\s+(?:your\s+)?(\w+)/gi));
    return matches.map((match, index) => ({
      stat: match[2].toLowerCase(),
      value: parseInt(match[1]),
      source,
    }));
  }),
}));

import {
  initModifierAggregator,
  getStatModifiers,
  MODIFIER_SOURCES,
  type ModifierSource,
} from '@/lib/modifier-aggregator';

import type { Character } from '@/types/character';

// ============================================================================
// TEST FIXTURES
// ============================================================================

/**
 * Creates a character with modifiers from ALL possible sources.
 * Used to test that all sources are handled.
 */
const createCharacterWithAllModifierTypes = (): Character => ({
  id: 'test-char-1',
  user_id: 'test-user',
  name: 'Test Hero',
  level: 5,
  ancestry: 'Simiah',
  community: 'Highborne',
  stats: {
    agility: 2,
    strength: 1,
    finesse: 0,
    instinct: -1,
    presence: 3,
    knowledge: 0,
  },
  vitals: {
    hit_points_max: 10,
    hit_points_current: 10,
    stress_max: 6,
    stress_current: 0,
    armor_score: 2,
    armor_slots: 2,
  },
  damage_thresholds: { minor: 2, major: 4, severe: 6 },
  hope: 6,
  fear: 0,
  evasion: 12,
  proficiency: 2,
  experiences: [],
  gold: { handfuls: 5, bags: 1, chests: 0 },

  // Equipment source
  character_inventory: [
    {
      id: 'inv-1',
      character_id: 'test-char-1',
      name: 'Enchanted Boots',
      location: 'equipped_armor',
      quantity: 1,
      library_item: {
        id: 'lib-boots',
        type: 'armor',
        name: 'Enchanted Boots',
        data: {
          modifiers: [{ id: 'mod-1', target: 'evasion', value: 1 }],
        },
      },
    },
  ],

  // Domain card source
  character_cards: [
    {
      id: 'card-1',
      character_id: 'test-char-1',
      card_id: 'lib-card-1',
      location: 'loadout',
      state: {},
      library_item: {
        id: 'lib-card-1',
        type: 'ability',
        name: 'Test Ability',
        data: { domain: 'Grace' },
      },
    },
  ],

  // User-added modifiers source
  modifiers: {
    evasion: [{ id: 'user-1', name: 'Shield Spell', value: 2, source: 'user' }],
  },

  // Ancestry features source
  ancestry_features: [
    {
      name: 'Nimble',
      text: 'Gain +1 bonus to your Evasion.',
      stat_bonuses: { evasion: 1 },
    },
  ],

  // Community features source (added dynamically)
  // Class features source (via class_data)
  class_data: {
    id: 'class-1',
    type: 'class',
    name: 'Rogue',
    data: {
      class_features: [
        {
          name: 'Evasive',
          text: 'You gain +1 bonus to your Evasion.',
          stat_bonuses: { evasion: 1 },
        },
      ],
    },
  },

  // Subclass features source (via subclass_data)
  subclass_data: {
    id: 'subclass-1',
    type: 'subclass',
    name: 'Assassin',
    data: {
      foundation_features: [
        {
          name: 'Shadow Step',
          text: 'You gain +1 bonus to your Evasion while in shadows.',
          stat_bonuses: { evasion: 1 },
        },
      ],
      specialization_features: [],
      mastery_features: [],
    },
  },
  subclass_progression: {
    foundation_obtained: true,
    specialization_obtained: false,
    mastery_obtained: false,
  },
} as unknown as Character);

/**
 * Creates a Simiah character specifically to test ancestry duplication fix.
 * Simiah has a "Nimble" feature that grants +1 Evasion.
 * The bug was that both text parsing AND structured bonuses were applied.
 */
const createSimiahCharacter = (): Character => ({
  id: 'simiah-char',
  user_id: 'test-user',
  name: 'Simiah Test',
  level: 1,
  ancestry: 'Simiah',
  stats: {
    agility: 2,
    strength: 0,
    finesse: 1,
    instinct: 0,
    presence: 0,
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
  damage_thresholds: { minor: 1, major: 2, severe: 3 },
  hope: 6,
  fear: 0,
  evasion: 10,
  proficiency: 1,
  experiences: [],
  gold: { handfuls: 0, bags: 0, chests: 0 },
  character_inventory: [],
  character_cards: [],
  modifiers: {},

  // Simiah Nimble feature - has BOTH text and stat_bonuses
  // This is the exact scenario that caused the duplication bug
  ancestry_features: [
    {
      name: 'Nimble',
      text: 'Gain +1 bonus to your Evasion.',
      stat_bonuses: { evasion: 1 },
    },
    {
      name: 'Agile Climber',
      text: 'You can climb difficult surfaces without needing to make a check.',
      // No stat_bonuses - should not add modifiers
    },
  ],
} as unknown as Character);

// ============================================================================
// TESTS
// ============================================================================

describe('Modifier Source Completeness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initModifierAggregator([]);
  });

  describe('MODIFIER_SOURCES Registry', () => {
    it('should define all expected modifier sources', () => {
      expect(MODIFIER_SOURCES).toContain('equipment');
      expect(MODIFIER_SOURCES).toContain('domain_card');
      expect(MODIFIER_SOURCES).toContain('user');
      expect(MODIFIER_SOURCES).toContain('ancestry');
      expect(MODIFIER_SOURCES).toContain('community');
      expect(MODIFIER_SOURCES).toContain('class');
      expect(MODIFIER_SOURCES).toContain('subclass');
    });

    it('should have exactly 7 modifier sources', () => {
      expect(MODIFIER_SOURCES.length).toBe(7);
    });
  });

  describe('Handler Coverage', () => {
    it('should collect equipment modifiers', () => {
      const character = createCharacterWithAllModifierTypes();
      const modifiers = getStatModifiers(character, 'evasion');

      const equipmentMods = modifiers.filter(m => m.source === 'equipment');
      expect(equipmentMods.length).toBeGreaterThanOrEqual(1);
      expect(equipmentMods[0].name).toBe('Enchanted Boots');
      expect(equipmentMods[0].value).toBe(1);
    });

    it('should collect user-added modifiers', () => {
      const character = createCharacterWithAllModifierTypes();
      const modifiers = getStatModifiers(character, 'evasion');

      const userMods = modifiers.filter(m => m.source === 'user');
      expect(userMods.length).toBeGreaterThanOrEqual(1);
      expect(userMods[0].name).toBe('Shield Spell');
      expect(userMods[0].value).toBe(2);
    });

    it('should collect ancestry modifiers', () => {
      const character = createCharacterWithAllModifierTypes();
      const modifiers = getStatModifiers(character, 'evasion');

      const ancestryMods = modifiers.filter(m => m.source === 'ancestry');
      expect(ancestryMods.length).toBeGreaterThanOrEqual(1);
      expect(ancestryMods[0].name).toContain('Simiah');
      expect(ancestryMods[0].name).toContain('Nimble');
    });

    it('should collect class modifiers', () => {
      const character = createCharacterWithAllModifierTypes();
      const modifiers = getStatModifiers(character, 'evasion');

      const classMods = modifiers.filter(m => m.source === 'class');
      expect(classMods.length).toBeGreaterThanOrEqual(1);
      expect(classMods[0].name).toContain('Rogue');
    });

    it('should collect subclass modifiers when progression unlocked', () => {
      const character = createCharacterWithAllModifierTypes();
      const modifiers = getStatModifiers(character, 'evasion');

      const subclassMods = modifiers.filter(m => m.source === 'subclass');
      expect(subclassMods.length).toBeGreaterThanOrEqual(1);
      expect(subclassMods[0].name).toContain('Assassin');
    });

    it('should NOT collect subclass specialization features when not obtained', () => {
      const character = createCharacterWithAllModifierTypes();
      // Character has foundation_obtained: true, specialization_obtained: false
      const modifiers = getStatModifiers(character, 'evasion');

      const subclassMods = modifiers.filter(m => m.source === 'subclass');
      // Should only have foundation feature, not specialization
      const specializationMods = subclassMods.filter(m =>
        m.id.includes('specialization')
      );
      expect(specializationMods.length).toBe(0);
    });
  });

  describe('Ancestry Duplication Bug Fix', () => {
    it('should NOT duplicate ancestry modifiers when both text and stat_bonuses exist', () => {
      const character = createSimiahCharacter();
      const modifiers = getStatModifiers(character, 'evasion');

      // Should have exactly ONE +1 evasion from Nimble, not TWO
      const ancestryMods = modifiers.filter(m => m.source === 'ancestry');
      expect(ancestryMods.length).toBe(1);
      expect(ancestryMods[0].value).toBe(1);
    });

    it('should prefer structured stat_bonuses over text parsing', () => {
      const character = createSimiahCharacter();
      const modifiers = getStatModifiers(character, 'evasion');

      const ancestryMods = modifiers.filter(m => m.source === 'ancestry');
      // The ID should indicate it came from structured data, not text parsing
      expect(ancestryMods[0].id).not.toContain('text');
    });

    it('should use text parsing only when stat_bonuses does not exist for stat', () => {
      // Create a character with ancestry feature that only has text, no stat_bonuses
      const character: Character = {
        ...createSimiahCharacter(),
        ancestry_features: [
          {
            name: 'Text Only Feature',
            text: 'You gain +2 bonus to your Strength.',
            // No stat_bonuses
          },
        ],
      } as unknown as Character;

      const modifiers = getStatModifiers(character, 'strength');

      const ancestryMods = modifiers.filter(m => m.source === 'ancestry');
      expect(ancestryMods.length).toBe(1);
      expect(ancestryMods[0].value).toBe(2);
      // Should be from text parsing
      expect(ancestryMods[0].id).toContain('text');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null character gracefully', () => {
      const modifiers = getStatModifiers(null, 'evasion');
      expect(modifiers).toEqual([]);
    });

    it('should handle missing feature arrays gracefully', () => {
      const character: Character = {
        id: 'minimal',
        user_id: 'user',
        name: 'Minimal',
        level: 1,
        stats: { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 },
        vitals: { hit_points_max: 6, hit_points_current: 6, stress_max: 6, stress_current: 0, armor_score: 0, armor_slots: 0 },
        damage_thresholds: { minor: 1, major: 2, severe: 3 },
        hope: 6,
        fear: 0,
        evasion: 10,
        proficiency: 1,
        experiences: [],
        gold: { handfuls: 0, bags: 0, chests: 0 },
        // All optional arrays are undefined
      } as Character;

      const modifiers = getStatModifiers(character, 'evasion');
      // Should not throw, just return empty
      expect(modifiers).toEqual([]);
    });

    it('should handle stats with no modifiers', () => {
      const character = createSimiahCharacter();
      const modifiers = getStatModifiers(character, 'knowledge');

      // No sources have knowledge modifiers
      expect(modifiers).toEqual([]);
    });
  });

  describe('Modifier Source Type Correctness', () => {
    it('should assign correct source type to each modifier', () => {
      const character = createCharacterWithAllModifierTypes();
      const modifiers = getStatModifiers(character, 'evasion');

      // Check each modifier has a valid source type
      modifiers.forEach(mod => {
        expect(MODIFIER_SOURCES).toContain(mod.source);
      });
    });

    it('should create unique IDs for each modifier', () => {
      const character = createCharacterWithAllModifierTypes();
      const modifiers = getStatModifiers(character, 'evasion');

      const ids = modifiers.map(m => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
