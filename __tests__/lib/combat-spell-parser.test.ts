/**
 * TESTS: Combat Spell Parser
 * ----------------------------------------------------------------------------
 * Tests for parsing combat abilities from domain card descriptions
 */

import { describe, it, expect } from 'vitest';
import {
  parseCombatAbility,
  getLoadoutCombatAbilities,
  type CombatAbility
} from '@/lib/combat-spell-parser';
import type { CharacterCard } from '@/types/character';

// Helper to create mock cards
function createMockCard(name: string, description: string, location: 'loadout' | 'vault' = 'loadout', recall: string = '1'): CharacterCard {
  return {
    id: `test-card-${name.toLowerCase().replace(/\s+/g, '-')}`,
    character_id: 'test-char',
    card_id: `card-lib-${name.toLowerCase()}`,
    location,
    state: {},
    library_item: {
      id: `card-lib-${name.toLowerCase()}`,
      name,
      type: 'ability',
      category: 'spell',
      data: {
        description,
        domain: 'Arcana',
        tier: 1,
        recall
      }
    }
  } as CharacterCard;
}

describe('Combat Spell Parser', () => {
  describe('parseCombatAbility', () => {
    describe('Spellcast rolls with damage', () => {
      it('should parse Cinder Grasp (basic spellcast attack)', () => {
        const card = createMockCard(
          'Cinder Grasp',
          'Make a Spellcast Roll against a target within Melee range. On a success, the target instantly bursts into flames, takes 12d20+3 magic damage, and is temporarily lit On Fire.'
        );

        const ability = parseCombatAbility(card);

        expect(ability).not.toBeNull();
        expect(ability).toMatchObject({
          name: 'Cinder Grasp',
          rollType: 'spellcast',
          trait: 'Spellcast',
          range: 'Melee',
          damage: '12d20+3',
          damageType: 'magic',
          usesProficiency: false,
          recallCost: 1
        });
        expect(ability?.effects).toContain('On Fire');
      });

      it('should parse Bolt Beacon (spellcast with proficiency and Hope cost)', () => {
        const card = createMockCard(
          'Bolt Beacon',
          'Make a Spellcast Roll against a target within Far range. On a success, spend a Hope to send a bolt of shimmering light toward them, dealing 6d8+2 magic damage using your Proficiency. The target becomes temporarily Vulnerable and glows brightly until this condition is cleared.'
        );

        const ability = parseCombatAbility(card);

        expect(ability).not.toBeNull();
        expect(ability).toMatchObject({
          name: 'Bolt Beacon',
          rollType: 'spellcast',
          trait: 'Spellcast',
          range: 'Far',
          damage: '6d8+2',
          damageType: 'magic',
          usesProficiency: true
        });
        expect(ability?.costs).toEqual({ hope: 1 });
        expect(ability?.effects).toContain('Vulnerable');
      });

      it('should parse Chain Lightning (spellcast with Stress cost)', () => {
        const card = createMockCard(
          'Chain Lightning',
          'Mark 2 Stress to make a Spellcast Roll, unleashing lightning on all targets within Close range. Targets you succeed against must make a reaction roll with a Difficulty equal to the result of your Spellcast Roll. Targets who fail take 2d8+4 magic damage.'
        );

        const ability = parseCombatAbility(card);

        expect(ability).not.toBeNull();
        expect(ability).toMatchObject({
          name: 'Chain Lightning',
          rollType: 'spellcast',
          trait: 'Spellcast',
          range: 'Close',
          damage: '2d8+4',
          damageType: 'magic'
        });
        expect(ability?.costs).toEqual({ stress: 2 });
      });
    });

    describe('Weapon attack modifications', () => {
      it('should parse Smite (weapon damage modifier)', () => {
        const card = createMockCard(
          'Smite',
          'Once per rest, spend 3 Hope to charge your powerful smite. When you next successfully attack with a weapon, double the result of your damage roll. This attack deals magic damage regardless of the weapon\'s damage type.',
          'loadout',
          '2'
        );

        const ability = parseCombatAbility(card);

        expect(ability).not.toBeNull();
        expect(ability).toMatchObject({
          name: 'Smite',
          rollType: 'none',
          recallCost: 2
        });
        expect(ability?.costs).toEqual({ hope: 3 });
        expect(ability?.effects).toContain('Doubles damage');
        expect(ability?.effects).toContain('Once per rest');
      });
    });

    describe('Non-combat cards', () => {
      it('should return null for passive modifier cards', () => {
        const card = createMockCard(
          'Graceful Movement',
          'You gain a +1 bonus to your Agility.'
        );

        const ability = parseCombatAbility(card);
        expect(ability).toBeNull();
      });

      it('should return null for utility cards without combat mechanics', () => {
        const card = createMockCard(
          'Wall Walk',
          'You can walk on walls and ceilings as if they were the ground.'
        );

        const ability = parseCombatAbility(card);
        expect(ability).toBeNull();
      });
    });

    describe('Range extraction', () => {
      it('should parse Melee range', () => {
        const card = createMockCard(
          'Test Melee',
          'Make a Spellcast Roll against a target within Melee range. On a success, deal 1d8 damage.'
        );

        const ability = parseCombatAbility(card);
        expect(ability?.range).toBe('Melee');
      });

      it('should parse Close range', () => {
        const card = createMockCard(
          'Test Close',
          'Make a Spellcast Roll against a target within Close range. On a success, deal 1d8 damage.'
        );

        const ability = parseCombatAbility(card);
        expect(ability?.range).toBe('Close');
      });

      it('should parse Far range', () => {
        const card = createMockCard(
          'Test Far',
          'Make a Spellcast Roll against a target within Far range. On a success, deal 1d8 damage.'
        );

        const ability = parseCombatAbility(card);
        expect(ability?.range).toBe('Far');
      });

      it('should parse Very Far range', () => {
        const card = createMockCard(
          'Test Very Far',
          'Make a Spellcast Roll against a target within Very Far range. On a success, deal 1d8 damage.'
        );

        const ability = parseCombatAbility(card);
        expect(ability?.range).toBe('Very far');
      });
    });

    describe('Damage type extraction', () => {
      it('should detect magic damage', () => {
        const card = createMockCard(
          'Test Magic',
          'Make a Spellcast Roll. On a success, deal 3d6 magic damage.'
        );

        const ability = parseCombatAbility(card);
        expect(ability?.damageType).toBe('magic');
      });

      it('should detect physical damage', () => {
        const card = createMockCard(
          'Test Physical',
          'Make a Spellcast Roll. On a success, deal 2d8 physical damage.'
        );

        const ability = parseCombatAbility(card);
        expect(ability?.damageType).toBe('physical');
      });

      it('should handle unspecified damage type', () => {
        const card = createMockCard(
          'Test Unspecified',
          'Make a Spellcast Roll. On a success, deal 1d10 damage.'
        );

        const ability = parseCombatAbility(card);
        expect(ability?.damageType).toBeUndefined();
      });
    });

    describe('Cost extraction', () => {
      it('should parse Hope cost (specific number)', () => {
        const card = createMockCard(
          'Test Hope',
          'Spend 3 Hope to make a Spellcast Roll. On a success, deal 5d8 damage.'
        );

        const ability = parseCombatAbility(card);
        expect(ability?.costs).toEqual({ hope: 3 });
      });

      it('should parse Hope cost (single)', () => {
        const card = createMockCard(
          'Test Hope Single',
          'Spend a Hope to make a Spellcast Roll. On a success, deal 2d6 damage.'
        );

        const ability = parseCombatAbility(card);
        expect(ability?.costs).toEqual({ hope: 1 });
      });

      it('should parse Stress cost', () => {
        const card = createMockCard(
          'Test Stress',
          'Mark 2 Stress to make a Spellcast Roll. On a success, deal 4d10 damage.'
        );

        const ability = parseCombatAbility(card);
        expect(ability?.costs).toEqual({ stress: 2 });
      });

      it('should parse multiple costs', () => {
        const card = createMockCard(
          'Test Multi Cost',
          'Mark 1 Stress and spend 2 Hope to make a Spellcast Roll. On a success, deal 6d12 damage.'
        );

        const ability = parseCombatAbility(card);
        expect(ability?.costs).toEqual({ stress: 1, hope: 2 });
      });
    });

    describe('Effect extraction', () => {
      it('should detect On Fire status', () => {
        const card = createMockCard(
          'Test Fire',
          'Make a Spellcast Roll. On a success, the target is lit On Fire.'
        );

        const ability = parseCombatAbility(card);
        expect(ability?.effects).toContain('On Fire');
      });

      it('should detect Vulnerable status', () => {
        const card = createMockCard(
          'Test Vulnerable',
          'Make a Spellcast Roll. On a success, the target becomes Vulnerable.'
        );

        const ability = parseCombatAbility(card);
        expect(ability?.effects).toContain('Vulnerable');
      });

      it('should detect multiple status effects', () => {
        const card = createMockCard(
          'Test Multi Status',
          'Make a Spellcast Roll. On a success, the target is Stunned and Blinded.'
        );

        const ability = parseCombatAbility(card);
        expect(ability?.effects).toContain('Stunned');
        expect(ability?.effects).toContain('Blinded');
      });

      it('should detect "once per rest" limitation', () => {
        const card = createMockCard(
          'Test Once Per Rest',
          'Once per rest, make a Spellcast Roll to deal 10d20 damage.'
        );

        const ability = parseCombatAbility(card);
        expect(ability?.effects).toContain('Once per rest');
      });
    });
  });

  describe('getLoadoutCombatAbilities', () => {
    it('should return only combat abilities from loadout', () => {
      const cards: CharacterCard[] = [
        createMockCard('Cinder Grasp', 'Make a Spellcast Roll against a target within Melee range. On a success, deal 12d20+3 magic damage.', 'loadout'),
        createMockCard('Graceful Movement', 'You gain a +1 bonus to your Agility.', 'loadout'), // Non-combat
        createMockCard('Bolt Beacon', 'Make a Spellcast Roll. On a success, deal 6d8+2 magic damage.', 'vault'), // In vault
        createMockCard('Chain Lightning', 'Make a Spellcast Roll. On a success, deal 2d8+4 magic damage.', 'loadout'),
      ];

      const abilities = getLoadoutCombatAbilities(cards);

      expect(abilities).toHaveLength(2);
      expect(abilities.map(a => a.name)).toEqual(['Cinder Grasp', 'Chain Lightning']);
    });

    it('should return empty array when no combat abilities in loadout', () => {
      const cards: CharacterCard[] = [
        createMockCard('Graceful Movement', 'You gain a +1 bonus to your Agility.', 'loadout'),
        createMockCard('Wall Walk', 'You can walk on walls.', 'loadout'),
      ];

      const abilities = getLoadoutCombatAbilities(cards);
      expect(abilities).toHaveLength(0);
    });

    it('should handle empty card array', () => {
      const abilities = getLoadoutCombatAbilities([]);
      expect(abilities).toHaveLength(0);
    });
  });
});
