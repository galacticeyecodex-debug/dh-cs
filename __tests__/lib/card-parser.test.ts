/**
 * TESTS: Domain Card Parser
 * ----------------------------------------------------------------------------
 * Tests for parsing passive modifiers from domain card descriptions
 */

import { describe, it, expect } from 'vitest';
import {
  parseCardPassiveModifiers,
  evaluateModifierCondition,
  calculateTier,
  getBareBonesBonuses,
  type PassiveModifier,
  type ModifierCondition
} from '@/lib/card-parser';
import type { Character, CharacterCard } from '@/types/character';

// Helper to create mock cards
function createMockCard(name: string, description: string): CharacterCard {
  return {
    id: 'test-card-1',
    character_id: 'test-char',
    card_id: 'card-lib-1',
    location: 'loadout',
    state: {},
    library_item: {
      id: 'card-lib-1',
      name,
      type: 'ability',
      category: 'ability',
      data: {
        description,
        domain: 'Test',
        tier: 1,
        recall: '1'
      }
    }
  } as CharacterCard;
}

// Helper to create mock character
function createMockCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'test-char',
    user_id: 'test-user',
    name: 'Test Character',
    level: 1,
    stats: {
      agility: 2,
      strength: 1,
      finesse: 0,
      instinct: -1,
      presence: 1,
      knowledge: 0
    },
    character_inventory: [],
    character_cards: [],
    ...overrides
  } as Character;
}

describe('parseCardPassiveModifiers', () => {
  describe('static bonuses', () => {
    it('should parse simple +1 bonus to Agility', () => {
      const card = createMockCard('Graceful Movement', 'You gain a +1 bonus to your Agility.');
      const character = createMockCharacter();

      const mods = parseCardPassiveModifiers(card, character);

      expect(mods).toHaveLength(1);
      expect(mods[0]).toMatchObject({
        stat: 'agility',
        value: 1,
        isActive: true,
        source: 'Graceful Movement'
      });
    });

    it('should parse +2 bonus to Proficiency', () => {
      const card = createMockCard('Determined', '+2 to your Proficiency');
      const character = createMockCharacter();

      const mods = parseCardPassiveModifiers(card, character);

      expect(mods).toHaveLength(1);
      expect(mods[0]).toMatchObject({
        stat: 'proficiency',
        value: 2,
        isActive: true
      });
    });

    it('should parse +1 to Armor Score', () => {
      const card = createMockCard('Armorer', 'While wearing armor, you gain a +1 bonus to your Armor Score.');
      const character = createMockCharacter({
        character_inventory: [{ location: 'equipped_armor' } as any]
      });

      const mods = parseCardPassiveModifiers(card, character);

      expect(mods).toHaveLength(1);
      expect(mods[0]).toMatchObject({
        stat: 'armor_score',
        value: 1,
        isActive: true
      });
    });
  });

  describe('negative modifiers / penalties', () => {
    it('should parse -2 penalty to attack rolls', () => {
      const card = createMockCard('Words of Discord', 'You gain a -2 penalty to attack rolls.');
      const character = createMockCharacter();

      const mods = parseCardPassiveModifiers(card, character);

      expect(mods).toHaveLength(1);
      expect(mods[0]).toMatchObject({
        stat: 'attack',
        value: -2,
        isActive: true,
        source: 'Words of Discord'
      });
    });

    it('should parse -1 penalty to Spellcast', () => {
      const card = createMockCard('Cursed', 'You take a -1 penalty to Spellcast.');
      const character = createMockCharacter();

      const mods = parseCardPassiveModifiers(card, character);

      expect(mods).toHaveLength(1);
      expect(mods[0]).toMatchObject({
        stat: 'spellcast',
        value: -1,
        isActive: true
      });
    });

    it('should parse -3 penalty to Evasion', () => {
      const card = createMockCard('Heavy Burden', '-3 to your Evasion while carrying.');
      const character = createMockCharacter();

      const mods = parseCardPassiveModifiers(card, character);

      expect(mods).toHaveLength(1);
      expect(mods[0]).toMatchObject({
        stat: 'evasion',
        value: -3,
        isActive: true
      });
    });

    it('should handle mixed positive and negative modifiers', () => {
      const card = createMockCard(
        'Trade-off',
        'You gain +2 to Strength but take a -1 penalty to Agility.'
      );
      const character = createMockCharacter();

      const mods = parseCardPassiveModifiers(card, character);

      expect(mods).toHaveLength(2);
      expect(mods[0]).toMatchObject({
        stat: 'strength',
        value: 2
      });
      expect(mods[1]).toMatchObject({
        stat: 'agility',
        value: -1
      });
    });
  });

  describe('dynamic bonuses', () => {
    it('should parse "equal to half your Agility" bonus to Evasion', () => {
      const card = createMockCard(
        'Untouchable',
        'You gain a bonus to your Evasion equal to half your Agility.'
      );
      const character = createMockCharacter({ stats: { agility: 3 } } as any);

      const mods = parseCardPassiveModifiers(card, character);

      expect(mods).toHaveLength(1);
      expect(mods[0]).toMatchObject({
        stat: 'evasion',
        value: 1, // floor(3 / 2) = 1
        formula: 'half_agility',
        isActive: true
      });
    });

    it('should handle even Agility values', () => {
      const card = createMockCard(
        'Untouchable',
        'You gain a bonus to your Evasion equal to half your Agility.'
      );
      const character = createMockCharacter({ stats: { agility: 4 } } as any);

      const mods = parseCardPassiveModifiers(card, character);

      expect(mods[0].value).toBe(2); // floor(4 / 2) = 2
    });
  });

  describe('complex formulas', () => {
    it('should parse "3 + your Strength" formula', () => {
      const card = createMockCard(
        'Test Card',
        'You gain a bonus to your Armor Score equal to 3 + your Strength.'
      );
      const character = createMockCharacter({ stats: { strength: 2 } } as any);

      const mods = parseCardPassiveModifiers(card, character);

      expect(mods).toHaveLength(1);
      expect(mods[0]).toMatchObject({
        stat: 'armor_score',
        value: 5, // 3 + 2
        formula: '3_plus_strength',
        isActive: true
      });
    });
  });

  describe('conditional modifiers', () => {
    it('should detect when_armored condition', () => {
      const card = createMockCard('Armorer', 'While wearing armor, you gain +1 to your Armor Score.');
      const armoredChar = createMockCharacter({
        character_inventory: [{ location: 'equipped_armor' } as any]
      });

      const mods = parseCardPassiveModifiers(card, armoredChar);

      expect(mods[0].isActive).toBe(true);
      expect(mods[0].condition).toMatchObject({ type: 'when_armored' });
    });

    it('should mark modifier inactive when condition not met', () => {
      const card = createMockCard('Armorer', 'While wearing armor, you gain +1 to your Armor Score.');
      const unarmoredChar = createMockCharacter({ character_inventory: [] });

      const mods = parseCardPassiveModifiers(card, unarmoredChar);

      expect(mods[0].isActive).toBe(false);
    });

    it('should detect when_unarmored condition', () => {
      const card = createMockCard(
        'Bare Bones',
        'When you choose not to equip armor, you gain a +1 bonus to your Armor Score.'
      );
      const unarmoredChar = createMockCharacter({ character_inventory: [] });

      const mods = parseCardPassiveModifiers(card, unarmoredChar);

      expect(mods).toHaveLength(1);
      expect(mods[0].condition).toMatchObject({ type: 'when_unarmored' });
      expect(mods[0].isActive).toBe(true);
    });
  });
});

describe('evaluateModifierCondition', () => {
  it('should return true for always condition', () => {
    const condition: ModifierCondition = { type: 'always' };
    const character = createMockCharacter();

    expect(evaluateModifierCondition(condition, character)).toBe(true);
  });

  it('should detect armored state', () => {
    const condition: ModifierCondition = { type: 'when_armored' };
    const armoredChar = createMockCharacter({
      character_inventory: [{ location: 'equipped_armor' } as any]
    });

    expect(evaluateModifierCondition(condition, armoredChar)).toBe(true);
  });

  it('should detect unarmored state', () => {
    const condition: ModifierCondition = { type: 'when_unarmored' };
    const unarmoredChar = createMockCharacter({ character_inventory: [] });

    expect(evaluateModifierCondition(condition, unarmoredChar)).toBe(true);
  });

  it('should count domain cards in loadout', () => {
    const condition: ModifierCondition = {
      type: 'loadout_domain_count',
      domain: 'arcana', // Lowercase - normalized by parser
      minCount: 4
    };

    const character = createMockCharacter({
      character_cards: [
        { location: 'loadout', library_item: { data: { domain: 'Arcana' } } } as any,
        { location: 'loadout', library_item: { data: { domain: 'Arcana' } } } as any,
        { location: 'loadout', library_item: { data: { domain: 'Arcana' } } } as any,
        { location: 'loadout', library_item: { data: { domain: 'Arcana' } } } as any,
        { location: 'vault', library_item: { data: { domain: 'Arcana' } } } as any, // Not counted
      ]
    });

    expect(evaluateModifierCondition(condition, character)).toBe(true);
  });

  it('should fail when insufficient domain cards', () => {
    const condition: ModifierCondition = {
      type: 'loadout_domain_count',
      domain: 'arcana', // Lowercase - normalized by parser
      minCount: 4
    };

    const character = createMockCharacter({
      character_cards: [
        { location: 'loadout', library_item: { data: { domain: 'Arcana' } } } as any,
        { location: 'loadout', library_item: { data: { domain: 'Blade' } } } as any,
      ]
    });

    expect(evaluateModifierCondition(condition, character)).toBe(false);
  });

  it('should handle case-insensitive domain matching', () => {
    const condition: ModifierCondition = {
      type: 'loadout_domain_count',
      domain: 'arcana', // Lowercase from parser
      minCount: 4
    };

    const character = createMockCharacter({
      character_cards: [
        { location: 'loadout', library_item: { data: { domain: 'arcana' } } } as any,
        { location: 'loadout', library_item: { data: { domain: 'ARCANA' } } } as any,
        { location: 'loadout', library_item: { data: { domain: 'Arcana' } } } as any,
        { location: 'loadout', library_item: { data: { domain: 'ArCaNa' } } } as any,
      ]
    });

    // Should match all 4 cards despite different casing
    expect(evaluateModifierCondition(condition, character)).toBe(true);
  });
});

describe('calculateTier', () => {
  it('should return tier 1 for level 1', () => {
    expect(calculateTier(1)).toBe(1);
  });

  it('should return tier 2 for levels 2-4', () => {
    expect(calculateTier(2)).toBe(2);
    expect(calculateTier(3)).toBe(2);
    expect(calculateTier(4)).toBe(2);
  });

  it('should return tier 3 for levels 5-7', () => {
    expect(calculateTier(5)).toBe(3);
    expect(calculateTier(6)).toBe(3);
    expect(calculateTier(7)).toBe(3);
  });

  it('should return tier 4 for levels 8-10', () => {
    expect(calculateTier(8)).toBe(4);
    expect(calculateTier(9)).toBe(4);
    expect(calculateTier(10)).toBe(4);
  });
});

describe('getBareBonesBonuses', () => {
  it('should return empty array when armored', () => {
    const character = createMockCharacter({
      character_inventory: [{ location: 'equipped_armor' } as any]
    });

    const bonuses = getBareBonesBonuses(character);

    expect(bonuses).toHaveLength(0);
  });

  it('should calculate correct bonuses when unarmored at level 1', () => {
    const character = createMockCharacter({
      level: 1,
      stats: { strength: 2 } as any,
      character_inventory: []
    });

    const bonuses = getBareBonesBonuses(character);

    expect(bonuses).toHaveLength(4);

    // Armor Score: 3 + Strength
    expect(bonuses[0]).toMatchObject({
      stat: 'armor_score',
      value: 5, // 3 + 2
      formula: '3_plus_strength',
      isActive: true
    });

    // Tier 1 thresholds
    expect(bonuses[1]).toMatchObject({
      stat: 'damage_threshold_minor',
      value: 1
    });
    expect(bonuses[2]).toMatchObject({
      stat: 'damage_threshold_major',
      value: 2 // tier * 2
    });
    expect(bonuses[3]).toMatchObject({
      stat: 'damage_threshold_severe',
      value: 3 // tier * 3
    });
  });

  it('should scale thresholds with tier (level 5 = tier 3)', () => {
    const character = createMockCharacter({
      level: 5,
      stats: { strength: 3 } as any,
      character_inventory: []
    });

    const bonuses = getBareBonesBonuses(character);

    expect(bonuses[0].value).toBe(6); // Armor: 3 + 3
    expect(bonuses[1].value).toBe(3); // Minor: tier 3
    expect(bonuses[2].value).toBe(6); // Major: tier 3 * 2
    expect(bonuses[3].value).toBe(9); // Severe: tier 3 * 3
  });
});
