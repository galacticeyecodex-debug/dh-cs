/**
 * TESTS: Domain Card Parser - SRD Validation
 * ----------------------------------------------------------------------------
 * Tests the parser against ACTUAL card descriptions from the SRD to ensure
 * real-world compatibility.
 */

import { describe, it, expect } from 'vitest';
import {
  parseCardPassiveModifiers,
  getBareBonesBonuses,
  type PassiveModifier,
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

describe('Domain Card Parser - SRD Validation', () => {
  describe('Untouchable (Bone Domain, Level 1)', () => {
    const cardDescription = 'Gain a bonus to your Evasion equal to half your Agility.';

    it('should parse dynamic "half your Agility" bonus to Evasion', () => {
      const card = createMockCard('Untouchable', cardDescription);
      const character = createMockCharacter({ stats: { agility: 3 } } as any);

      const mods = parseCardPassiveModifiers(card, character);

      expect(mods).toHaveLength(1);
      expect(mods[0]).toMatchObject({
        stat: 'evasion',
        value: 1, // floor(3 / 2)
        formula: 'half_agility',
        isActive: true,
        source: 'Untouchable'
      });
    });

    it('should scale with different Agility values', () => {
      const card = createMockCard('Untouchable', cardDescription);

      // Agility 0 -> +0
      const char0 = createMockCharacter({ stats: { agility: 0 } } as any);
      expect(parseCardPassiveModifiers(card, char0)[0].value).toBe(0);

      // Agility 4 -> +2
      const char4 = createMockCharacter({ stats: { agility: 4 } } as any);
      expect(parseCardPassiveModifiers(card, char4)[0].value).toBe(2);

      // Agility 7 -> +3
      const char7 = createMockCharacter({ stats: { agility: 7 } } as any);
      expect(parseCardPassiveModifiers(card, char7)[0].value).toBe(3);
    });
  });

  describe('Armorer (Valor Domain, Level 5)', () => {
    const cardDescription = "While you're wearing armor, gain a +1 bonus to your Armor Score.\n\nDuring a rest, when you choose to repair your armor as a downtime move, your allies also clear an Armor Slot.";

    it('should parse conditional +1 bonus to Armor Score when armored', () => {
      const card = createMockCard('Armorer', cardDescription);
      const armoredChar = createMockCharacter({
        character_inventory: [{ location: 'equipped_armor' } as any]
      });

      const mods = parseCardPassiveModifiers(card, armoredChar);

      expect(mods).toHaveLength(1);
      expect(mods[0]).toMatchObject({
        stat: 'armor_score',
        value: 1,
        condition: { type: 'when_armored' },
        isActive: true,
        source: 'Armorer'
      });
    });

    it('should mark modifier inactive when unarmored', () => {
      const card = createMockCard('Armorer', cardDescription);
      const unarmoredChar = createMockCharacter({ character_inventory: [] });

      const mods = parseCardPassiveModifiers(card, unarmoredChar);

      expect(mods).toHaveLength(1);
      expect(mods[0].isActive).toBe(false);
      expect(mods[0].condition).toMatchObject({ type: 'when_armored' });
    });
  });

  describe('Bare Bones (Valor Domain, Level 1)', () => {
    const cardDescription = "When you choose not to equip armor, you have a base Armor Score of 3 + your Strength and use the following as your base damage thresholds:\n\n- **Tier 1:** 9/19\n- **Tier 2:** 11/24\n- **Tier 3:** 13/31\n- **Tier 4:** 15/35";

    it('should use special handler for complex tier-based bonuses', () => {
      const character = createMockCharacter({
        level: 1,
        stats: { strength: 2 } as any,
        character_inventory: [] // Unarmored
      });

      const bonuses = getBareBonesBonuses(character);

      expect(bonuses).toHaveLength(4);

      // Armor Score: 3 + Strength
      expect(bonuses[0]).toMatchObject({
        stat: 'armor_score',
        value: 5, // 3 + 2
        formula: '3_plus_strength',
        isActive: true,
        source: 'Bare Bones'
      });

      // Tier 1 thresholds
      expect(bonuses[1]).toMatchObject({
        stat: 'damage_threshold_minor',
        value: 1
      });
      expect(bonuses[2]).toMatchObject({
        stat: 'damage_threshold_major',
        value: 2
      });
      expect(bonuses[3]).toMatchObject({
        stat: 'damage_threshold_severe',
        value: 3
      });
    });

    it('should scale thresholds with character tier (level 5 = tier 3)', () => {
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

    it('should return empty array when armored', () => {
      const character = createMockCharacter({
        character_inventory: [{ location: 'equipped_armor' } as any]
      });

      const bonuses = getBareBonesBonuses(character);
      expect(bonuses).toHaveLength(0);
    });
  });

  describe('Arcana-Touched (Level 7 Arcana Ability)', () => {
    const cardDescription = "When 4 or more of the domain cards in your loadout are from the Arcana domain, gain the following benefits:\n\n- +1 bonus to your Spellcast Rolls\n- Once per rest, you can switch the results of your Hope and Fear Dice.";

    it('should parse conditional +1 to Spellcast when 4+ Arcana cards in loadout', () => {
      const card = createMockCard('Arcana-Touched', cardDescription);
      const character = createMockCharacter({
        character_cards: [
          { location: 'loadout', library_item: { data: { domain: 'Arcana' } } } as any,
          { location: 'loadout', library_item: { data: { domain: 'Arcana' } } } as any,
          { location: 'loadout', library_item: { data: { domain: 'Arcana' } } } as any,
          { location: 'loadout', library_item: { data: { domain: 'Arcana' } } } as any,
        ]
      });

      const mods = parseCardPassiveModifiers(card, character);

      expect(mods).toHaveLength(1);
      expect(mods[0]).toMatchObject({
        stat: 'spellcast',
        value: 1,
        condition: {
          type: 'loadout_domain_count',
          domain: 'Arcana',
          minCount: 4
        },
        isActive: true,
        source: 'Arcana-Touched'
      });
    });

    it('should mark modifier inactive when insufficient Arcana cards', () => {
      const card = createMockCard('Arcana-Touched', cardDescription);
      const character = createMockCharacter({
        character_cards: [
          { location: 'loadout', library_item: { data: { domain: 'Arcana' } } } as any,
          { location: 'loadout', library_item: { data: { domain: 'Blade' } } } as any,
          { location: 'loadout', library_item: { data: { domain: 'Bone' } } } as any,
        ]
      });

      const mods = parseCardPassiveModifiers(card, character);

      expect(mods).toHaveLength(1);
      expect(mods[0].isActive).toBe(false);
      expect(mods[0].condition).toMatchObject({
        type: 'loadout_domain_count',
        domain: 'Arcana',
        minCount: 4
      });
    });

    it('should not count cards in vault', () => {
      const card = createMockCard('Arcana-Touched', cardDescription);
      const character = createMockCharacter({
        character_cards: [
          { location: 'loadout', library_item: { data: { domain: 'Arcana' } } } as any,
          { location: 'loadout', library_item: { data: { domain: 'Arcana' } } } as any,
          { location: 'vault', library_item: { data: { domain: 'Arcana' } } } as any, // Not counted
          { location: 'vault', library_item: { data: { domain: 'Arcana' } } } as any, // Not counted
        ]
      });

      const mods = parseCardPassiveModifiers(card, character);

      expect(mods).toHaveLength(1);
      expect(mods[0].isActive).toBe(false); // Only 2 in loadout, need 4
    });
  });
});
