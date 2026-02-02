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
  calculateTierScaledValue,
  calculateDynamicValue,
  getBareBonesBonuses,
  parseCombatCategory,
  parseUsesProficiency,
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
      domain: 'Test',
      data: {
        description,
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

      const mods = parseCardPassiveModifiers(card, character, true);

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

      const mods = parseCardPassiveModifiers(card, character, true);

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

      const mods = parseCardPassiveModifiers(card, character, true);

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

      const mods = parseCardPassiveModifiers(card, character, true);

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

      const mods = parseCardPassiveModifiers(card, character, true);

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

      const mods = parseCardPassiveModifiers(card, character, true);

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

      const mods = parseCardPassiveModifiers(card, character, true);

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

      const mods = parseCardPassiveModifiers(card, character, true);

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

      const mods = parseCardPassiveModifiers(card, character, true);

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

      const mods = parseCardPassiveModifiers(card, character, true);

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

      const mods = parseCardPassiveModifiers(card, armoredChar, true);

      expect(mods[0].isActive).toBe(true);
      expect(mods[0].condition).toMatchObject({ type: 'when_armored' });
    });

    it('should mark modifier inactive when condition not met', () => {
      const card = createMockCard('Armorer', 'While wearing armor, you gain +1 to your Armor Score.');
      const unarmoredChar = createMockCharacter({ character_inventory: [] });

      const mods = parseCardPassiveModifiers(card, unarmoredChar, true);

      expect(mods[0].isActive).toBe(false);
    });

    it('should detect when_unarmored condition', () => {
      const card = createMockCard(
        'Bare Bones',
        'When you choose not to equip armor, you gain a +1 bonus to your Armor Score.'
      );
      const unarmoredChar = createMockCharacter({ character_inventory: [] });

      const mods = parseCardPassiveModifiers(card, unarmoredChar, true);

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
        { location: 'loadout', library_item: { domain: 'Arcana', data: {} } } as any,
        { location: 'loadout', library_item: { domain: 'Arcana', data: {} } } as any,
        { location: 'loadout', library_item: { domain: 'Arcana', data: {} } } as any,
        { location: 'loadout', library_item: { domain: 'Arcana', data: {} } } as any,
        { location: 'vault', library_item: { domain: 'Arcana', data: {} } } as any, // Not counted
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
        { location: 'loadout', library_item: { domain: 'Arcana', data: {} } } as any,
        { location: 'loadout', library_item: { domain: 'Blade', data: {} } } as any,
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
        { location: 'loadout', library_item: { domain: 'arcana', data: {} } } as any,
        { location: 'loadout', library_item: { domain: 'ARCANA', data: {} } } as any,
        { location: 'loadout', library_item: { domain: 'Arcana', data: {} } } as any,
        { location: 'loadout', library_item: { domain: 'ArCaNa', data: {} } } as any,
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

describe('calculateTierScaledValue', () => {
  it('should use tier_scaling when present (tier 1)', () => {
    const modifier = {
      value: 9,
      tier_scaling: { 1: 9, 2: 11, 3: 13, 4: 15 }
    };
    const character = createMockCharacter({ level: 1 });

    expect(calculateTierScaledValue(modifier, character)).toBe(9);
  });

  it('should use tier_scaling when present (tier 2)', () => {
    const modifier = {
      value: 9,
      tier_scaling: { 1: 9, 2: 11, 3: 13, 4: 15 }
    };
    const character = createMockCharacter({ level: 3 }); // level 3 = tier 2

    expect(calculateTierScaledValue(modifier, character)).toBe(11);
  });

  it('should use tier_scaling when present (tier 3)', () => {
    const modifier = {
      value: 19,
      tier_scaling: { 1: 19, 2: 24, 3: 31, 4: 35 }
    };
    const character = createMockCharacter({ level: 6 }); // level 6 = tier 3

    expect(calculateTierScaledValue(modifier, character)).toBe(31);
  });

  it('should use tier_scaling when present (tier 4)', () => {
    const modifier = {
      value: 19,
      tier_scaling: { 1: 19, 2: 24, 3: 31, 4: 35 }
    };
    const character = createMockCharacter({ level: 10 }); // level 10 = tier 4

    expect(calculateTierScaledValue(modifier, character)).toBe(35);
  });

  it('should fall back to formula when no tier_scaling', () => {
    const modifier = {
      value: 0,
      formula: '3_plus_strength'
    };
    const character = createMockCharacter({
      stats: { strength: 2, agility: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 }
    });

    expect(calculateTierScaledValue(modifier, character)).toBe(5); // 3 + 2
  });

  it('should fall back to value when no tier_scaling or formula', () => {
    const modifier = {
      value: 7
    };
    const character = createMockCharacter();

    expect(calculateTierScaledValue(modifier, character)).toBe(7);
  });
});

describe('calculateDynamicValue', () => {
  it('should calculate proficiency formula', () => {
    const character = createMockCharacter({ proficiency: 3 } as any);
    expect(calculateDynamicValue('proficiency', character)).toBe(3);
  });

  it('should calculate half_agility formula', () => {
    const character = createMockCharacter({
      stats: { agility: 4, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 }
    });
    expect(calculateDynamicValue('half_agility', character)).toBe(2);
  });

  it('should calculate 3_plus_strength formula', () => {
    const character = createMockCharacter({
      stats: { agility: 0, strength: 3, finesse: 0, instinct: 0, presence: 0, knowledge: 0 }
    });
    expect(calculateDynamicValue('3_plus_strength', character)).toBe(6);
  });

  it('should calculate direct trait reference', () => {
    const character = createMockCharacter({
      stats: { agility: 0, strength: 0, finesse: 4, instinct: 0, presence: 0, knowledge: 0 }
    });
    expect(calculateDynamicValue('finesse', character)).toBe(4);
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

describe('parseCombatCategory', () => {
  describe('standalone_attack', () => {
    it('should detect "Make a roll against" pattern', () => {
      const text = 'Make a **Spellcast Roll** against a target within Close range.';
      expect(parseCombatCategory(text)).toBe('standalone_attack');
    });

    it('should detect "Make an attack against" pattern', () => {
      const text = 'Make an attack against all enemies within Melee range.';
      expect(parseCombatCategory(text)).toBe('standalone_attack');
    });

    it('should detect "Make a Finesse roll against" for weapons', () => {
      const text = 'Make a **Finesse Roll** against all enemies within Melee range of you, dealing d10 physical damage to each target.';
      expect(parseCombatCategory(text)).toBe('standalone_attack');
    });
  });

  describe('damage_bonus', () => {
    it('should detect Rogue Sneak Attack pattern', () => {
      const text = 'When you succeed on an attack while **Cloaked** or while an ally is within **Melee** range of your target, add a number of d6s equal to your proficiency to your damage roll.';
      expect(parseCombatCategory(text)).toBe('damage_bonus');
    });

    it('should detect "on a success... add damage" pattern', () => {
      const text = 'On a success, add 1d8 to the damage roll.';
      expect(parseCombatCategory(text)).toBe('damage_bonus');
    });

    it('should detect "if you succeed... add to damage" pattern', () => {
      const text = 'If you succeed on your attack roll, add 2d6 to the damage.';
      expect(parseCombatCategory(text)).toBe('damage_bonus');
    });

    it('should detect "when you succeed... deal additional damage" pattern', () => {
      const text = 'When you succeed on an attack, deal an additional 1d4 damage.';
      expect(parseCombatCategory(text)).toBe('damage_bonus');
    });

    it('should detect Faun Kick pattern (on success + damage)', () => {
      const text = 'When you succeed on an attack against an adversary, you can **mark a Stress** to kick them as part of the attack, dealing an additional 2d6 physical damage and moving them from **Close** to **Far** away.';
      expect(parseCombatCategory(text)).toBe('damage_bonus');
    });
  });

  describe('roll_only', () => {
    it('should detect roll pattern without damage', () => {
      const text = 'Make a **Knowledge Roll** (DC 15) to identify the creature.';
      expect(parseCombatCategory(text)).toBe('roll_only');
    });

    it('should detect Presence roll for social checks', () => {
      const text = 'Make a **Presence Roll** against the target to persuade them.';
      // This has "against" so it would be standalone_attack
      expect(parseCombatCategory(text)).toBe('standalone_attack');
    });

    it('should detect skill check pattern', () => {
      const text = 'Make a **Spellcast Roll** to maintain concentration.';
      expect(parseCombatCategory(text)).toBe('roll_only');
    });
  });

  describe('passive_triggered', () => {
    it('should return passive_triggered for conditional effects', () => {
      const text = 'When an ally within Close range takes damage, you can mark a Stress to reduce that damage by your Armor Score.';
      expect(parseCombatCategory(text)).toBe('passive_triggered');
    });

    it('should return passive_triggered for passive bonuses', () => {
      const text = 'You gain a +1 bonus to your Evasion while wearing armor.';
      expect(parseCombatCategory(text)).toBe('passive_triggered');
    });

    it('should return passive_triggered for reaction abilities without attacks', () => {
      const text = 'As a reaction when you take damage, you may spend 2 Hope to halve the damage.';
      expect(parseCombatCategory(text)).toBe('passive_triggered');
    });

    it('should return passive_triggered for empty text', () => {
      expect(parseCombatCategory('')).toBe('passive_triggered');
    });
  });

  describe('attack_bonus (passive)', () => {
    it('should detect Deft Maneuvers as passive (grants attack bonus)', () => {
      const text = 'Once per rest, **mark a Stress** to sprint anywhere within Far range without making an **Agility Roll** to get there. If you end this movement within Melee range of an adversary and immediately make an attack against them, gain a +1 bonus to the attack roll.';
      expect(parseCombatCategory(text)).toBe('passive_triggered');
    });

    it('should detect "make an attack, gain bonus" pattern as passive', () => {
      const text = 'When you make an attack against an enemy, gain a +2 bonus to the attack roll.';
      expect(parseCombatCategory(text)).toBe('passive_triggered');
    });
  });

  describe('edge cases', () => {
    it('should handle markdown formatting in text', () => {
      const text = '**When you succeed on an attack**, add **1d8** to your damage roll.';
      expect(parseCombatCategory(text)).toBe('damage_bonus');
    });

    it('should be case-insensitive', () => {
      const text = 'MAKE A STRENGTH ROLL AGAINST the enemy.';
      expect(parseCombatCategory(text)).toBe('standalone_attack');
    });

    it('should prioritize damage_bonus over standalone_attack', () => {
      // This tests when both patterns could match - damage_bonus should take precedence
      const text = 'When you succeed on an attack against an enemy, add 2d6 to your damage roll.';
      expect(parseCombatCategory(text)).toBe('damage_bonus');
    });
  });

  // ===========================================================================
  // parseUsesProficiency Tests
  // ===========================================================================
  describe('parseUsesProficiency', () => {
    it('should return true when text contains "using your Proficiency"', () => {
      const text = 'Deal damage using your Proficiency as the die count.';
      expect(parseUsesProficiency(text)).toBe(true);
    });

    it('should return true when text contains "using Proficiency"', () => {
      const text = 'Roll damage using Proficiency.';
      expect(parseUsesProficiency(text)).toBe(true);
    });

    it('should return true when text contains "using your Proficiency Die"', () => {
      const text = 'Make an attack using your Proficiency Die.';
      expect(parseUsesProficiency(text)).toBe(true);
    });

    it('should return false when text does NOT mention proficiency scaling', () => {
      // Unleash Chaos - deals d10 magic damage but does NOT scale by proficiency
      const text = 'roll a number of d10s equal to the tokens you spent and deal that much magic damage';
      expect(parseUsesProficiency(text)).toBe(false);
    });

    it('should return false for standard damage with no proficiency mention', () => {
      const text = 'Deal 2d6 physical damage to the target.';
      expect(parseUsesProficiency(text)).toBe(false);
    });

    it('should be case-insensitive', () => {
      const text = 'Deal damage USING YOUR PROFICIENCY die.';
      expect(parseUsesProficiency(text)).toBe(true);
    });

    it('should return false for empty text', () => {
      expect(parseUsesProficiency('')).toBe(false);
    });
  });
});
