/**
 * ABILITIES SCHEMA VALIDATION TESTS - BONE DOMAIN
 */

import { describe, it, expect } from 'vitest';
import { enhanceAbilityCard } from '@/lib/card-parser';

function rawAbility(name: string, type: string, text: string) {
    return { name, level: '1', domain: 'Bone', type, recall: '0', text };
}

describe('Abilities Schema Validation - Bone Domain', () => {
    describe('Deft Maneuvers', () => {
        const ability = rawAbility('Deft Maneuvers', 'Ability',
            'Once per rest, **mark a Stress** to sprint anywhere within Far range without making an **Agility Roll** to get there.\n\nIf you end this movement within Melee range of an adversary and immediately make an attack against them, gain a +1 bonus to the attack roll.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.frequency).toBe('once_per_rest');
        });

        it('should have costs.stress = 1', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });

        it('should have modifier for attack +1', () => {
            const mod = enhanced.modifiers?.find(m => m.stat === 'attack');
            expect(mod?.value).toBe(1);
        });

        it('should NOT have a roll (says "without making an Agility Roll")', () => {
            expect(enhanced.roll).toBeUndefined();
        });
    });

    describe('I See It Coming', () => {
        const ability = rawAbility('I See It Coming', 'Ability',
            'When you\'re targeted by an attack made from beyond Melee range, you can **mark a Stress** to roll a **d4** and gain a bonus to your Evasion equal to the result against the attack.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });

        it('should be timing reaction (when targeted)', () => {
            expect(enhanced.timing).toBe('reaction');
        });

        it('should have modifier for evasion', () => {
            const mod = enhanced.modifiers?.find(m => m.stat === 'evasion');
            expect(mod).toBeDefined();
        });
    });

    describe('Untouchable', () => {
        const ability = rawAbility('Untouchable', 'Ability',
            'Gain a bonus to your Evasion equal to half your Agility.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive', () => {
            expect(enhanced.action_type).toBe('passive');
        });

        it('should have modifier for evasion with formula half_agility', () => {
            const mod = enhanced.modifiers?.find(m => m.stat === 'evasion');
            expect(mod?.formula).toBe('half_agility');
        });
    });

    describe('Ferocity', () => {
        const ability = rawAbility('Ferocity', 'Ability',
            'When you cause an adversary to mark 1 or more Hit Points, you can **spend 2 Hope** to increase your Evasion by the number of Hit Points they marked. This bonus lasts until after the next attack made against you.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 2', () => {
            expect(enhanced.costs?.hope).toBe(2);
        });

        it('should be action_type passive', () => {
            expect(enhanced.action_type).toBe('passive');
        });
    });

    describe('Strategic Approach', () => {
        const ability = rawAbility('Strategic Approach', 'Ability',
            'After a long rest, place a number of tokens equal to your Knowledge on this card (minimum 1). The first time you move within Close range of an adversary and make an attack against them, you can spend one token to choose one of the following options:\n\n- You make the attack with advantage.\n- You clear a Stress on an ally within Melee range of the adversary.\n- You add a **d8** to your damage roll.\n\nWhen you take a long rest, clear all unspent tokens.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have has_tokens = true', () => {
            expect(enhanced.has_tokens).toBe(true);
        });

        it('should have token_source = knowledge', () => {
            expect(enhanced.token_source).toBe('knowledge');
        });
    });

    describe('Brace', () => {
        const ability = rawAbility('Brace', 'Ability',
            'When you mark an Armor Slot to reduce incoming damage, you can **mark a Stress** to mark an additional Armor Slot.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });

        it('should be action_type passive (triggered condition)', () => {
            expect(enhanced.action_type).toBe('passive');
        });

        it('should be timing reaction', () => {
            expect(enhanced.timing).toBe('reaction');
        });
    });

    describe('Tactician', () => {
        const ability = rawAbility('Tactician', 'Ability',
            'When you Help an Ally, they can **spend a Hope** to add one of your Experiences to their roll alongside your advantage die.\n\nWhen making a Tag Team Roll, you can roll a **d20** as your Hope Die.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1 (for ally spending)', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should be action_type buff (helps ally)', () => {
            expect(enhanced.action_type).toBe('buff');
        });
    });

    describe('Boost', () => {
        const ability = rawAbility('Boost', 'Ability',
            '**Mark a Stress** to boost off a willing ally within Close range, fling yourself into the air, and perform an aerial attack against a target within Far range. You have advantage on the attack, add a **d10** to the damage roll, and end your move within Melee range of the target.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });

        it('should be action_type attack (performs attack)', () => {
            expect(enhanced.action_type).toBe('attack');
        });
    });

    describe('Redirect', () => {
        const ability = rawAbility('Redirect', 'Ability',
            'When an attack made against you from beyond Melee range fails, roll a number of **d6s** equal to your Proficiency. If any roll a 6, you can **mark a Stress** to redirect the attack to damage an adversary within Very Close range instead.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });

        it('should be timing reaction', () => {
            expect(enhanced.timing).toBe('reaction');
        });
    });

    describe('Know Thy Enemy', () => {
        const ability = rawAbility('Know Thy Enemy', 'Ability',
            'When observing a creature, you can make an **Instinct Roll** against them. On a success, **spend a Hope** and ask the GM for one set of information about the target from the following options:\n\n- Their unmarked Hit Points and Stress.\n- Their Difficulty and damage thresholds.\n- Their attacks and standard attack damage dice.\n- Their features and Experiences.\n\nAdditionally on a success, you can **mark a Stress** to remove a Stress from the GM\'s Fear Pool.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should have roll.trait = Instinct', () => {
            expect(enhanced.roll?.trait).toBe('Instinct');
        });
    });

    describe('Signature Move', () => {
        const ability = rawAbility('Signature Move', 'Ability',
            'Name and describe your signature combat move. Once per rest, when you perform this signature move as part of an action you\'re taking, you can roll a **d20** as your Hope Die. On a success, clear a Stress.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.frequency).toBe('once_per_rest');
        });
    });

    describe('Rapid Riposte', () => {
        const ability = rawAbility('Rapid Riposte', 'Ability',
            'When an attack made against you from within Melee range fails, you can **mark a Stress** and seize the opportunity to deal the weapon damage of one of your active weapons to the attacker.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });

        it('should be action_type reaction', () => {
            expect(enhanced.action_type).toBe('reaction');
        });

        it('should be timing reaction', () => {
            expect(enhanced.timing).toBe('reaction');
        });
    });

    describe('Recovery', () => {
        const ability = rawAbility('Recovery', 'Ability',
            'During a short rest, you can choose a long rest downtime move instead. You can **spend a Hope** to let an ally do the same.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should be action_type downtime', () => {
            expect(enhanced.action_type).toBe('downtime');
        });

        it('should be timing downtime', () => {
            expect(enhanced.timing).toBe('downtime');
        });
    });

    describe('Bone-Touched', () => {
        const ability = rawAbility('Bone-Touched', 'Ability',
            'When 4 or more of the domain cards in your loadout are from the Bone domain, gain the following benefits:\n\n- +1 bonus to Agility\n- Once per rest, you can **spend 3 Hope** to cause an attack that succeeded against you to fail instead.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 3', () => {
            expect(enhanced.costs?.hope).toBe(3);
        });

        it('should be frequency once_per_rest', () => {
            expect(enhanced.frequency).toBe('once_per_rest');
        });

        it('should have modifier for agility +1 with loadout condition', () => {
            const mod = enhanced.modifiers?.find(m => m.stat === 'agility');
            expect(mod?.value).toBe(1);
            expect(mod?.condition?.type).toBe('loadout_domain_count');
            expect(mod?.condition?.minCount).toBe(4);
        });
    });

    describe('Cruel Precision', () => {
        const ability = rawAbility('Cruel Precision', 'Ability',
            'When you make a successful attack with a weapon, gain a bonus to your damage roll equal to either your Finesse or Agility.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive', () => {
            expect(enhanced.action_type).toBe('passive');
        });

        it('should have modifier for damage', () => {
            const mod = enhanced.modifiers?.find(m => m.stat === 'damage');
            expect(mod).toBeDefined();
        });
    });

    describe('Breaking Blow', () => {
        const ability = rawAbility('Breaking Blow', 'Ability',
            'When you make a successful attack, you can **mark a Stress** to make the next successful attack against that same target deal an extra **2d12** damage.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });
    });

    describe('Wrangle', () => {
        const ability = rawAbility('Wrangle', 'Ability',
            'Make an **Agility Roll** against all targets within Close range. **Spend a Hope** to move targets you succeed against, and any willing allies within Close range, to another point within Close range.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should have attack.trait = Agility', () => {
            expect(enhanced.attack?.trait).toBe('Agility');
        });

        it('should have attack.targets = all_in_range', () => {
            expect(enhanced.attack?.targets).toBe('all_in_range');
        });
    });

    describe('On the Brink', () => {
        const ability = rawAbility('On the Brink', 'Ability',
            'When you have 2 or fewer Hit Points unmarked, you don\'t take Minor damage.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive', () => {
            expect(enhanced.action_type).toBe('passive');
        });

        it('should have no costs', () => {
            expect(enhanced.costs).toBeUndefined();
        });
    });

    describe('Splintering Strike', () => {
        const ability = rawAbility('Splintering Strike', 'Ability',
            '**Spend a Hope** and make an attack against all adversaries within your weapon\'s range. Once per long rest, on a success against any targets, roll your weapon\'s damage and distribute that damage however you wish between the targets you succeeded against. Before you deal damage to each target, roll an additional damage die and add its result to the damage you deal to them.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.frequency).toBe('once_per_long_rest');
        });

        it('should be action_type attack', () => {
            expect(enhanced.action_type).toBe('attack');
        });
    });

    describe('Deathrun', () => {
        const ability = rawAbility('Deathrun', 'Ability',
            '**Spend 3 Hope** to run a straight path through the battlefield to a point within Far range, making an attack against all adversaries within your weapon\'s range along that path. Choose the order in which you deal damage to the targets you succeeded against. For the first, roll your weapon damage with a +1 bonus to your Proficiency. Then remove a die from your damage roll and deal the remaining damage to the next target. Continue to remove a die for each subsequent target until you have no more damage dice or adversaries.\n\nYou can\'t target the same adversary more than once per attack.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 3', () => {
            expect(enhanced.costs?.hope).toBe(3);
        });

        it('should have modifier for proficiency +1', () => {
            const mod = enhanced.modifiers?.find(m => m.stat === 'proficiency');
            expect(mod?.value).toBe(1);
        });
    });

    describe('Swift Step', () => {
        const ability = rawAbility('Swift Step', 'Ability',
            'When an attack made against you fails, clear a Stress. If you can\'t clear a Stress, gain a Hope.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type reaction', () => {
            expect(enhanced.action_type).toBe('reaction');
        });

        it('should be timing reaction', () => {
            expect(enhanced.timing).toBe('reaction');
        });

        it('should have no costs', () => {
            expect(enhanced.costs).toBeUndefined();
        });
    });
});
