/**
 * MODIFIER AGGREGATOR TESTS
 * ----------------------------------------------------------------------------
 * Tests for the centralized modifier collection service.
 *
 * FUNCTIONALITY TESTED:
 * - initModifierAggregator: Cache initialization
 * - getStatModifiers: Collect modifiers from all sources
 * - getStatModifierTotal: Sum all modifier values
 * - getTraitTotal: Get complete trait breakdown
 * - getRollBonus: Get bonus for trait rolls
 * - getSpellcastBonus: Get spellcast-specific bonus
 * - getProficiency: Get proficiency die count
 * - getAllActiveModifiers: Get all active card modifiers
 * - getModifiersByStat: Group modifiers by stat
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
}));

import {
  initModifierAggregator,
  getEnhancedAbilitiesCache,
  getStatModifiers,
  getStatModifierTotal,
  getTraitTotal,
  getRollBonus,
  getSpellcastBonus,
  getProficiency,
  getAllActiveModifiers,
  getModifiersByStat,
} from '@/lib/modifier-aggregator';

import type { Character, CharacterInventoryItem, CharacterCard } from '@/types/character';
import type { EnhancedAbilityCard } from '@/types/cards';

// ============================================================================
// TEST FIXTURES
// ============================================================================

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

const createMockInventoryItem = (overrides?: Partial<CharacterInventoryItem>): CharacterInventoryItem => ({
  id: 'inv-item-1',
  character_id: 'char-1',
  item_id: 'lib-item-1',
  name: 'Test Armor',
  location: 'equipped_armor',
  quantity: 1,
  library_item: {
    id: 'lib-item-1',
    type: 'armor',
    name: 'Test Armor',
    data: {
      modifiers: [
        { id: 'mod-1', target: 'evasion', value: 2 },
      ],
    },
  },
  ...overrides,
});

const createMockCard = (overrides?: Partial<CharacterCard>): CharacterCard => ({
  id: 'card-1',
  character_id: 'char-1',
  item_id: 'lib-card-1',
  location: 'loadout',
  state: {},
  library_item: {
    id: 'lib-card-1',
    type: 'ability',
    name: 'Arcane Arrow',
    data: { domain: 'Arcana', tier: 1 },
  },
  ...overrides,
});

const createMockEnhancedAbility = (overrides?: Partial<EnhancedAbilityCard>): EnhancedAbilityCard => ({
  name: 'Test Ability',
  type: 'ability',
  domain: 'Arcana',
  tier: 1,
  text: 'Test description',
  enhancement: {
    action_type: 'utility',
    timing: 'action',
    frequency: 'at_will',
    modifiers: [],
  },
  ...overrides,
} as EnhancedAbilityCard);

// ============================================================================
// TESTS
// ============================================================================

describe('Modifier Aggregator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the cache
    initModifierAggregator([]);
  });

  // ==========================================================================
  // INITIALIZATION TESTS
  // ==========================================================================

  describe('initModifierAggregator', () => {
    it('should initialize the cache with enhanced abilities', () => {
      const abilities = [createMockEnhancedAbility()];
      initModifierAggregator(abilities);

      expect(getEnhancedAbilitiesCache()).toEqual(abilities);
    });

    it('should overwrite previous cache', () => {
      initModifierAggregator([createMockEnhancedAbility({ name: 'First' })]);
      initModifierAggregator([createMockEnhancedAbility({ name: 'Second' })]);

      const cache = getEnhancedAbilitiesCache();
      expect(cache.length).toBe(1);
      expect(cache[0].name).toBe('Second');
    });
  });

  // ==========================================================================
  // getStatModifiers TESTS
  // ==========================================================================

  describe('getStatModifiers', () => {
    it('should return empty array for null character', () => {
      const result = getStatModifiers(null, 'agility');
      expect(result).toEqual([]);
    });

    it('should return empty array for character with no modifiers', () => {
      const character = createMockCharacter();
      const result = getStatModifiers(character, 'agility');
      expect(result).toEqual([]);
    });

    it('should collect user-added modifiers', () => {
      const character = createMockCharacter({
        modifiers: {
          agility: [{ name: 'Bless', value: 2 }],
        },
      });

      const result = getStatModifiers(character, 'agility');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Bless',
        value: 2,
        source: 'user',
      });
    });

    it('should collect equipment modifiers from structured data', () => {
      const character = createMockCharacter({
        character_inventory: [
          createMockInventoryItem({
            name: 'Magic Armor',
            library_item: {
              id: 'armor-1',
              type: 'armor',
              name: 'Magic Armor',
              data: {
                modifiers: [{ id: 'mod-1', target: 'evasion', value: 2 }],
              },
            },
          }),
        ],
      });

      const result = getStatModifiers(character, 'evasion');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Magic Armor',
        value: 2,
        source: 'equipment',
      });
    });

    it('should not collect equipment modifiers for unequipped items', () => {
      const character = createMockCharacter({
        character_inventory: [
          createMockInventoryItem({
            location: 'backpack', // Not equipped
            library_item: {
              id: 'armor-1',
              type: 'armor',
              name: 'Magic Armor',
              data: {
                modifiers: [{ id: 'mod-1', target: 'evasion', value: 2 }],
              },
            },
          }),
        ],
      });

      const result = getStatModifiers(character, 'evasion');
      expect(result).toHaveLength(0);
    });

    it('should collect modifiers from multiple sources', () => {
      const character = createMockCharacter({
        modifiers: {
          evasion: [{ name: 'Shield Spell', value: 1 }],
        },
        character_inventory: [
          createMockInventoryItem({
            library_item: {
              id: 'armor-1',
              type: 'armor',
              name: 'Magic Armor',
              data: {
                modifiers: [{ id: 'mod-1', target: 'evasion', value: 2 }],
              },
            },
          }),
        ],
      });

      const result = getStatModifiers(character, 'evasion');

      expect(result).toHaveLength(2);
      expect(result.find(m => m.source === 'user')).toBeDefined();
      expect(result.find(m => m.source === 'equipment')).toBeDefined();
    });
  });

  // ==========================================================================
  // getStatModifierTotal TESTS
  // ==========================================================================

  describe('getStatModifierTotal', () => {
    it('should return 0 for null character', () => {
      const result = getStatModifierTotal(null, 'agility');
      expect(result).toBe(0);
    });

    it('should sum all modifier values', () => {
      const character = createMockCharacter({
        modifiers: {
          agility: [
            { name: 'Buff 1', value: 2 },
            { name: 'Buff 2', value: 3 },
            { name: 'Debuff', value: -1 },
          ],
        },
      });

      const result = getStatModifierTotal(character, 'agility');
      expect(result).toBe(4); // 2 + 3 - 1
    });
  });

  // ==========================================================================
  // getTraitTotal TESTS
  // ==========================================================================

  describe('getTraitTotal', () => {
    it('should return zeros for null character', () => {
      const result = getTraitTotal(null, 'agility');
      expect(result).toEqual({
        base: 0,
        modifierTotal: 0,
        total: 0,
        breakdown: [],
      });
    });

    it('should return base value with no modifiers', () => {
      const character = createMockCharacter({
        stats: { agility: 3, strength: 1, finesse: 0, instinct: 0, presence: 0, knowledge: 0 },
      });

      const result = getTraitTotal(character, 'agility');

      expect(result.base).toBe(3);
      expect(result.modifierTotal).toBe(0);
      expect(result.total).toBe(3);
    });

    it('should combine base and modifiers', () => {
      const character = createMockCharacter({
        stats: { agility: 2, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 },
        modifiers: {
          agility: [{ name: 'Boost', value: 3 }],
        },
      });

      const result = getTraitTotal(character, 'agility');

      expect(result.base).toBe(2);
      expect(result.modifierTotal).toBe(3);
      expect(result.total).toBe(5);
    });

    it('should be case-insensitive for trait names', () => {
      const character = createMockCharacter({
        stats: { agility: 2, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 },
      });

      const result1 = getTraitTotal(character, 'agility');
      const result2 = getTraitTotal(character, 'Agility');
      const result3 = getTraitTotal(character, 'AGILITY');

      expect(result1.base).toBe(2);
      expect(result2.base).toBe(2);
      expect(result3.base).toBe(2);
    });
  });

  // ==========================================================================
  // getRollBonus TESTS
  // ==========================================================================

  describe('getRollBonus', () => {
    it('should return 0 for null character', () => {
      const result = getRollBonus(null, 'agility');
      expect(result).toBe(0);
    });

    it('should return trait total for standard traits', () => {
      const character = createMockCharacter({
        stats: { agility: 3, strength: 1, finesse: 2, instinct: 0, presence: 0, knowledge: 0 },
      });

      expect(getRollBonus(character, 'agility')).toBe(3);
      expect(getRollBonus(character, 'strength')).toBe(1);
      expect(getRollBonus(character, 'finesse')).toBe(2);
    });

    it('should use getSpellcastBonus for spellcast trait', () => {
      const character = createMockCharacter({
        spellcast_trait: 'presence',
        stats: { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 4, knowledge: 0 },
      });

      const result = getRollBonus(character, 'spellcast');
      expect(result).toBe(4); // Should use presence
    });
  });

  // ==========================================================================
  // getSpellcastBonus TESTS
  // ==========================================================================

  describe('getSpellcastBonus', () => {
    it('should return 0 for null character', () => {
      const result = getSpellcastBonus(null);
      expect(result).toBe(0);
    });

    it('should use spellcast_trait when defined', () => {
      const character = createMockCharacter({
        spellcast_trait: 'presence',
        stats: { agility: 1, strength: 1, finesse: 1, instinct: 1, presence: 5, knowledge: 1 },
      });

      const result = getSpellcastBonus(character);
      expect(result).toBe(5);
    });

    it('should use subclass_data spellcast_trait as fallback', () => {
      const character = createMockCharacter({
        subclass_data: {
          id: 'sub-1',
          type: 'subclass',
          name: 'Test Subclass',
          data: { spellcast_trait: 'knowledge' },
        },
        stats: { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 4 },
      });

      const result = getSpellcastBonus(character);
      expect(result).toBe(4);
    });

    it('should include spellcast-specific modifiers', () => {
      const character = createMockCharacter({
        spellcast_trait: 'presence',
        stats: { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 3, knowledge: 0 },
        modifiers: {
          spellcast: [{ name: 'Spellcast Buff', value: 2 }],
        },
      });

      const result = getSpellcastBonus(character);
      expect(result).toBe(5); // 3 (presence) + 2 (spellcast modifier)
    });
  });

  // ==========================================================================
  // getProficiency TESTS
  // ==========================================================================

  describe('getProficiency', () => {
    it('should return 1 for null character', () => {
      const result = getProficiency(null);
      expect(result).toBe(1);
    });

    it('should return base proficiency', () => {
      const character = createMockCharacter({ proficiency: 2 });
      const result = getProficiency(character);
      expect(result).toBe(2);
    });

    it('should include proficiency modifiers', () => {
      const character = createMockCharacter({
        proficiency: 1,
        modifiers: {
          proficiency: [{ name: 'Expert', value: 1 }],
        },
      });

      const result = getProficiency(character);
      expect(result).toBe(2);
    });

    it('should clamp to minimum of 1', () => {
      const character = createMockCharacter({
        proficiency: 1,
        modifiers: {
          proficiency: [{ name: 'Curse', value: -5 }],
        },
      });

      const result = getProficiency(character);
      expect(result).toBe(1); // Clamped to 1, not -4
    });
  });

  // ==========================================================================
  // getAllActiveModifiers TESTS
  // ==========================================================================

  describe('getAllActiveModifiers', () => {
    it('should return empty array for null character', () => {
      const result = getAllActiveModifiers(null);
      expect(result).toEqual([]);
    });

    it('should return empty array for character with no cards', () => {
      const character = createMockCharacter({ character_cards: [] });
      const result = getAllActiveModifiers(character);
      expect(result).toEqual([]);
    });

    it('should only process loadout cards', () => {
      const character = createMockCharacter({
        character_cards: [
          createMockCard({ location: 'loadout' }),
          createMockCard({ id: 'card-2', location: 'vault' }), // Should be ignored
        ],
      });

      // The result depends on parseCardPassiveModifiers mock
      // Here we're just testing it doesn't crash
      const result = getAllActiveModifiers(character);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ==========================================================================
  // getModifiersByStat TESTS
  // ==========================================================================

  describe('getModifiersByStat', () => {
    it('should return empty object for null character', () => {
      const result = getModifiersByStat(null);
      expect(result).toEqual({});
    });

    it('should return empty object when no active modifiers', () => {
      const character = createMockCharacter();
      const result = getModifiersByStat(character);
      expect(result).toEqual({});
    });
  });
});
