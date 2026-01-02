/**
 * ABILITIES SCHEMA VALIDATION TESTS - BLADE DOMAIN
 */

import { describe, it, expect } from 'vitest';
import { enhanceAbilityCard } from '@/lib/card-parser';

function rawAbility(name: string, type: string, text: string) {
    return { name, level: '1', domain: 'Blade', type, recall: '0', text };
}

describe('Abilities Schema Validation - Blade Domain', () => {
    describe('Get Back Up', () => {
        const ability = rawAbility('Get Back Up', 'Ability',
            'When you take Severe damage, you can **mark a Stress** to reduce the severity by one threshold.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type passive (triggered condition)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should be timing free or reaction', () => {
            expect(['free', 'reaction']).toContain(enhanced.enhancement.timing);
        });
    });

    describe('Not Good Enough', () => {
        const ability = rawAbility('Not Good Enough', 'Ability',
            'When you roll your damage dice, you can reroll any 1s or 2s.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });

        it('should be frequency at_will', () => {
            expect(enhanced.enhancement.frequency).toBe('at_will');
        });
    });

    describe('Whirlwind', () => {
        const ability = rawAbility('Whirlwind', 'Ability',
            'When you make a successful attack against a target within Very Close range, you can **spend a Hope** to use the attack against all other targets within Very Close range. All additional adversaries you succeed against with this ability take half damage.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should be action_type attack (extends an attack)', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });
    });

    describe('A Soldier\'s Bond', () => {
        const ability = rawAbility('A Soldier\'s Bond', 'Ability',
            'Once per long rest, when you compliment someone or ask them about something they\'re good at, you can both gain 3 Hope.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should be action_type passive', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Reckless', () => {
        const ability = rawAbility('Reckless', 'Ability',
            '**Mark a Stress** to gain advantage on an attack.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type buff', () => {
            expect(enhanced.enhancement.action_type).toBe('buff');
        });
    });

    describe('Scramble', () => {
        const ability = rawAbility('Scramble', 'Ability',
            'Once per rest, when a creature within Melee range would deal damage to you, you can avoid the attack and safely move out of Melee range of the enemy.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should be action_type passive or reaction', () => {
            expect(['passive', 'reaction']).toContain(enhanced.enhancement.action_type);
        });
    });

    describe('Versatile Fighter', () => {
        const ability = rawAbility('Versatile Fighter', 'Ability',
            'You can use a different character trait for an equipped weapon, rather than the trait the weapon calls for.\n\nWhen you deal damage, you can **mark a Stress** to use the maximum result of one of your damage dice instead of rolling it.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type passive', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });
    });

    describe('Deadly Focus', () => {
        const ability = rawAbility('Deadly Focus', 'Ability',
            'Once per rest, you can apply all your focus toward a target of your choice. Until you attack another creature, you defeat the target, or the battle ends, gain a +1 bonus to your Proficiency.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should have modifier for proficiency +1', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'proficiency');
            expect(mod?.value).toBe(1);
        });
    });

    describe('Fortified Armor', () => {
        const ability = rawAbility('Fortified Armor', 'Ability',
            'While you are wearing armor, gain a +2 bonus to your damage thresholds.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have modifier for damage_threshold +2', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'damage_threshold');
            expect(mod?.value).toBe(2);
        });
    });

    describe('Champion\'s Edge', () => {
        const ability = rawAbility('Champion\'s Edge', 'Ability',
            'When you critically succeed on an attack, you can **spend up to 3 Hope** and choose one of the following options for each Hope spent:\n\n- You clear a Hit Point.\n- You clear an Armor Slot.\n- The target must mark an additional Hit Point.\n\nYou can\'t choose the same option more than once.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type buff', () => {
            expect(enhanced.enhancement.action_type).toBe('buff');
        });

        // Variable cost - could have costs or not depending on parser
        it('should be frequency at_will', () => {
            expect(enhanced.enhancement.frequency).toBe('at_will');
        });
    });

    describe('Vitality', () => {
        const ability = rawAbility('Vitality', 'Ability',
            'When you choose this card, permanently gain two of the following benefits:\n\n- One Stress slot\n- One Hit Point slot\n- +2 bonus to your damage thresholds\n\nThen place this card in your vault permanently.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });
    });

    describe('Battle-Hardened', () => {
        const ability = rawAbility('Battle-Hardened', 'Ability',
            'Once per long rest when you would make a Death Move, you can **spend a Hope** to clear a Hit Point instead.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });
    });

    describe('Rage Up', () => {
        const ability = rawAbility('Rage Up', 'Ability',
            'Before you make an attack, you can **mark a Stress** to gain a bonus to your damage roll equal to twice your Strength. You can Rage Up twice per attack.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should have modifier for damage', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'damage');
            expect(mod).toBeDefined();
        });
    });

    describe('Blade-Touched', () => {
        const ability = rawAbility('Blade-Touched', 'Ability',
            'When 4 or more of the domain cards in your loadout are from the Blade domain, gain the following benefits:\n\n- +2 bonus to your attack rolls\n- +4 bonus to your Severe damage threshold');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have modifier for attack +2 with loadout condition', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'attack');
            expect(mod?.value).toBe(2);
            expect(mod?.condition?.type).toBe('loadout_domain_count');
            expect(mod?.condition?.minCount).toBe(4);
        });

        it('should have modifier for damage_threshold_severe +4', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'damage_threshold_severe');
            expect(mod?.value).toBe(4);
        });
    });

    describe('Glancing Blow', () => {
        const ability = rawAbility('Glancing Blow', 'Ability',
            'When you fail an attack, you can **mark a Stress** to deal weapon damage using half your Proficiency.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type passive (triggered on failure)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });
    });

    describe('Battle Cry', () => {
        const ability = rawAbility('Battle Cry', 'Ability',
            'Once per long rest, while you\'re charging into danger, you can muster a rousing call that inspires your allies. All allies who can hear you each clear a Stress and gain a Hope. Additionally, your allies gain advantage on attack rolls until you or an ally rolls a failure with Fear.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should be action_type buff', () => {
            expect(enhanced.enhancement.action_type).toBe('buff');
        });
    });

    describe('Frenzy', () => {
        const ability = rawAbility('Frenzy', 'Ability',
            'Once per long rest, you can go into a Frenzy until there are no more adversaries within sight.\n\nWhile Frenzied, you can\'t use Armor Slots, and you gain a +10 bonus to your damage rolls and a +8 bonus to your Severe damage threshold.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should have modifier for damage +10', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'damage');
            expect(mod?.value).toBe(10);
        });
    });

    describe('Gore and Glory', () => {
        const ability = rawAbility('Gore and Glory', 'Ability',
            'When you critically succeed on a weapon attack, gain an additional Hope or clear an additional Stress.\n\nAdditionally, when you deal enough damage to defeat an enemy, gain a Hope or clear a Stress.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive or buff', () => {
            expect(['passive', 'buff']).toContain(enhanced.enhancement.action_type);
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Reaper\'s Strike', () => {
        const ability = rawAbility('Reaper\'s Strike', 'Ability',
            'Once per long rest, **spend a Hope** to make an attack roll. The GM tells you which targets within range it would succeed against. Choose one of these targets and force them to mark 5 Hit Points.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should be action_type attack', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });
    });

    describe('Battle Monster', () => {
        const ability = rawAbility('Battle Monster', 'Ability',
            'When you make a successful attack against an adversary, you can **mark 4 Stress** to force the target to mark a number of Hit Points equal to the number of Hit Points you currently have marked instead of rolling for damage.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 4', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(4);
        });

        it('should be action_type attack', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });
    });

    describe('Onslaught', () => {
        const ability = rawAbility('Onslaught', 'Ability',
            'When you successfully make an attack with your weapon, you never deal damage beneath a target\'s Major damage threshold (the target always marks a minimum of 2 Hit Points).\n\nAdditionally, when a creature within your weapon\'s range deals damage to an ally with an attack that doesn\'t include you, you can **mark a Stress** to force them to make a **Reaction Roll (15)**. On a failure, the target must mark a Hit Point.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type reaction (can respond to ally attack)', () => {
            expect(enhanced.enhancement.action_type).toBe('reaction');
        });
    });
});
