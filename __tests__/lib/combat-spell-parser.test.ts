/**
 * TESTS: Combat Spell Parser (Unified in card-parser.ts)
 * ----------------------------------------------------------------------------
 * Tests for parsing combat abilities from domain card descriptions.
 * These tests validate the parseCombatAbility functionality that was
 * unified from combat-spell-parser.ts into card-parser.ts.
 */

import { describe, it, expect } from 'vitest';
import {
  parseCombatAbility,
  getLoadoutCombatAbilities,
  type CombatAbility
} from '@/lib/card-parser';
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
          'Make a Spellcast Roll against a target within Melee range. On a success, the target instantly bursts into flames, takes 1d20+3 magic damage, and is temporarily lit On Fire.'
        );

        const ability = parseCombatAbility(card);

        expect(ability).not.toBeNull();
        expect(ability).toMatchObject({
          name: 'Cinder Grasp',
          rollType: 'spellcast',
          trait: 'Spellcast',
          range: 'Melee',
          damage: '1d20+3',
          damageType: 'magic',
          damageScaling: 'none', // Fixed notation (1d20+3) never scales
          recallCost: 1
        });
        expect(ability?.effects).toContain('On Fire');
      });

      it('should parse Bolt Beacon (spellcast with proficiency and Hope cost)', () => {
        const card = createMockCard(
          'Bolt Beacon',
          'Make a Spellcast Roll against a target within Far range. On a success, spend a Hope to send a bolt of shimmering light toward them, dealing d8+2 magic damage using your Proficiency. The target becomes temporarily Vulnerable and glows brightly until this condition is cleared.'
        );

        const ability = parseCombatAbility(card);

        expect(ability).not.toBeNull();
        expect(ability).toMatchObject({
          name: 'Bolt Beacon',
          rollType: 'spellcast',
          trait: 'Spellcast',
          range: 'Far',
          damage: 'd8+2',
          damageType: 'magic',
          damageScaling: 'proficiency' // "using your Proficiency" with variable notation
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
        expect(ability?.range).toBe('Very Far');
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
        createMockCard('Cinder Grasp', 'Make a Spellcast Roll against a target within Melee range. On a success, deal 1d20+3 magic damage.', 'loadout'),
        createMockCard('Graceful Movement', 'You gain a +1 bonus to your Agility.', 'loadout'), // Non-combat
        createMockCard('Bolt Beacon', 'Make a Spellcast Roll. On a success, deal d8+2 magic damage.', 'vault'), // In vault
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

describe('Combat Filter - False Positive Prevention', () => {
  it('should NOT identify defensive abilities as combat', () => {
    const card = createMockCard(
      'Rune Ward',
      'Spend a Hope to reduce incoming damage by 1d8.'
    );

    const ability = parseCombatAbility(card);
    expect(ability).toBeNull();
  });

  it('should NOT identify damage reduction as combat', () => {
    const card = createMockCard(
      'Get Back Up',
      'When you take damage, you may reduce the severity by one threshold.'
    );

    const ability = parseCombatAbility(card);
    expect(ability).toBeNull();
  });

  it('should NOT identify utility rolls as combat', () => {
    const card = createMockCard(
      'Know Thy Enemy',
      'Make an Instinct Roll to detect hidden adversaries.'
    );

    const ability = parseCombatAbility(card);
    expect(ability).toBeNull();
  });

  it('should NOT identify ally-targeting buffs as combat', () => {
    const card = createMockCard(
      'Inspire Courage',
      'Target an ally within Close range. They gain +1 to their next roll.'
    );

    const ability = parseCombatAbility(card);
    expect(ability).toBeNull();
  });

  it('should NOT identify general roll bonuses as combat', () => {
    const card = createMockCard(
      'Lucky',
      'You may reroll any roll once per session.'
    );

    const ability = parseCombatAbility(card);
    expect(ability).toBeNull();
  });

  it('should NOT identify damage text in context as combat', () => {
    const card = createMockCard(
      'Shrug It Off',
      'When an ally takes damage, you may mark Stress to reduce their damage.'
    );

    const ability = parseCombatAbility(card);
    expect(ability).toBeNull();
  });

  it('SHOULD identify actual combat spells', () => {
    const card = createMockCard(
      'Fireball',
      'Make a Spellcast Roll against all adversaries within Close range. Deal 3d8 magic damage.'
    );

    const ability = parseCombatAbility(card);
    expect(ability).not.toBeNull();
    expect(ability?.rollType).toBe('spellcast');
  });

  it('SHOULD identify actual weapon attacks', () => {
    const card = createMockCard(
      'Power Strike',
      'Make a weapon attack against a target. Deal 2d10 physical damage.'
    );

    const ability = parseCombatAbility(card);
    expect(ability).not.toBeNull();
    expect(ability?.rollType).toBe('attack');
  });
});

describe('Missing Pattern Fixes (Issue #40)', () => {
  it('should parse "Very Close" range', () => {
    const card = createMockCard(
      'Whirlwind',
      'Make an attack against all targets within Very Close range. Deal 2d8 damage.'
    );

    const ability = parseCombatAbility(card);
    expect(ability).not.toBeNull();
    expect(ability?.range).toBe('Very Close');
  });

  it('should parse "Very Far" range', () => {
    const card = createMockCard(
      'Long Shot',
      'Make a Spellcast Roll against a target within Very Far range. Deal 1d12 damage.'
    );

    const ability = parseCombatAbility(card);
    expect(ability).not.toBeNull();
    expect(ability?.range).toBe('Very Far');
  });

  it('should parse damage without multiplier (d8 instead of 1d8)', () => {
    const card = createMockCard(
      'Towering Stalk',
      'Make a Spellcast Roll dealing d8 physical damage using your Proficiency.'
    );

    const ability = parseCombatAbility(card);
    expect(ability).not.toBeNull();
    expect(ability?.damage).toBe('d8');
    expect(ability?.damageType).toBe('physical');
    expect(ability?.damageScaling).toBe('proficiency');
  });

  it('should parse damage with single die (d6, d10, d12)', () => {
    const card1 = createMockCard('Spell1', 'Deal d6 magic damage.');
    expect(parseCombatAbility(card1)?.damage).toBe('d6');

    const card2 = createMockCard('Spell2', 'Deal d10 physical damage.');
    expect(parseCombatAbility(card2)?.damage).toBe('d10');

    const card3 = createMockCard('Spell3', 'Deal d12 magic damage.');
    expect(parseCombatAbility(card3)?.damage).toBe('d12');
  });

  it('should NOT scale fixed dice notation even with "using your Proficiency Die"', () => {
    // CRITICAL: "12d4" has explicit dice count → NO proficiency scaling
    // "using your Proficiency" with fixed notation means something else (not auto-scaling)
    const card = createMockCard(
      'Corrosive Projectile',
      'Deal 12d4 physical damage to the target using your Proficiency Die.'
    );

    const ability = parseCombatAbility(card);
    expect(ability).not.toBeNull();
    expect(ability?.damageScaling).toBe('none'); // Fixed notation never scales
    expect(ability?.damage).toBe('12d4');
  });

  it('should detect proficiency scaling with VARIABLE notation', () => {
    // Variable notation (no leading number) + "using your Proficiency" → scales
    const card1 = createMockCard('Spell1', 'Deal d8 damage using your Proficiency.');
    expect(parseCombatAbility(card1)?.damageScaling).toBe('proficiency');

    const card2 = createMockCard('Spell2', 'Deal d8 damage using your Proficiency Die.');
    expect(parseCombatAbility(card2)?.damageScaling).toBe('proficiency');

    const card3 = createMockCard('Spell3', 'Deal d8+2 damage using Proficiency Die.');
    expect(parseCombatAbility(card3)?.damageScaling).toBe('proficiency');
  });

  it('should NOT scale fixed notation even with proficiency text', () => {
    // Fixed notation (e.g., "3d8") NEVER scales, even with proficiency text
    // This matches SRD patterns like "4d20+5 magic damage using your Proficiency"
    const card1 = createMockCard('Spell1', 'Deal 3d8 damage using your Proficiency.');
    expect(parseCombatAbility(card1)?.damageScaling).toBe('none');

    const card2 = createMockCard('Spell2', 'Deal 1d8+2 damage using your Proficiency Die.');
    expect(parseCombatAbility(card2)?.damageScaling).toBe('none');

    const card3 = createMockCard('Spell3', 'Deal 4d20+5 magic damage using your Proficiency.');
    expect(parseCombatAbility(card3)?.damageScaling).toBe('none');
  });

  it('should detect spellcast scaling', () => {
    // Matches pattern: "Roll a number of d10s equal to your Spellcast trait"
    const card = createMockCard(
      'Midnight Spirit',
      'Make a Spellcast Roll against a target. On a success, roll a number of d10s equal to your Spellcast trait. Deal d10 magic damage.'
    );
    const ability = parseCombatAbility(card);
    expect(ability?.damageScaling).toBe('spellcast');
  });

  it('should detect resource-based scaling (tokens)', () => {
    // Matches pattern: "roll a number of d10s equal to the tokens"
    const card = createMockCard(
      'Unleash Chaos',
      'Make a Spellcast Roll. On a success, roll a number of d10s equal to the tokens you spent and deal d10 magic damage.'
    );
    const ability = parseCombatAbility(card);
    expect(ability?.damageScaling).toBe('resource');
    expect(ability?.resourceType).toBe('tokens');
  });

  it('should detect resource-based scaling (hope)', () => {
    // Matches pattern: "Roll a number of d6s equal to the Hope spent"
    const card = createMockCard(
      'Arcane Barrage',
      'Spend any number of Hope. Roll a number of d6s equal to the Hope spent and deal d6 magic damage.'
    );
    const ability = parseCombatAbility(card);
    expect(ability?.damageScaling).toBe('resource');
    expect(ability?.resourceType).toBe('hope');
  });
});
