/**
 * ABILITIES SCHEMA VALIDATION TESTS - VALOR DOMAIN
 */

import { describe, it, expect } from 'vitest';
import { enhanceAbilityCard } from '@/lib/card-parser';

function rawAbility(name: string, type: string, text: string) {
    return { name, level: '1', domain: 'Valor', type, recall: '0', text };
}

describe('Abilities Schema Validation - Valor Domain', () => {
    describe('Bare Bones', () => {
        const ability = rawAbility('Bare Bones', 'Ability',
            'When you choose not to equip armor, you have a base Armor Score of 3 + your Strength and use the following as your base damage thresholds:\n\n- **Tier 1:** 9/19\n- **Tier 2:** 11/24\n- **Tier 3:** 13/31\n- **Tier 4:** 15/35');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive', () => {
            expect(enhanced.action_type).toBe('passive');
        });

        it('should have no costs', () => {
            expect(enhanced.costs).toBeUndefined();
        });
    });

    describe('Forceful Push', () => {
        const ability = rawAbility('Forceful Push', 'Ability',
            'Make an attack with your primary weapon against a target within Melee range. On a success, you deal damage and knock them back to Close range. On a success with Hope, add a **d6** to your damage roll.\n\nAdditionally, you can **spend a Hope** to make them temporarily Vulnerable.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should be action_type attack', () => {
            expect(enhanced.action_type).toBe('attack');
        });
    });

    describe('I Am Your Shield', () => {
        const ability = rawAbility('I Am Your Shield', 'Ability',
            'When an ally within Very Close range would take damage, you can **mark a Stress** to stand in the way and make yourself the target of the attack instead. When you take damage from this attack, you can mark any number of Armor Slots.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });

        it('should be timing reaction (when ally would take damage)', () => {
            expect(enhanced.timing).toBe('reaction');
        });

        it('should be action_type passive or reaction', () => {
            expect(['passive', 'reaction']).toContain(enhanced.action_type);
        });
    });

    describe('Body Basher', () => {
        const ability = rawAbility('Body Basher', 'Ability',
            'You use the full force of your body in a fight. On a successful attack using a weapon with a Melee range, gain a bonus to your damage roll equal to your Strength.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive or buff', () => {
            expect(['passive', 'buff']).toContain(enhanced.action_type);
        });

        it('should have modifier for damage with formula strength', () => {
            const mod = enhanced.modifiers?.find(m => m.stat === 'damage');
            expect(mod?.formula).toBe('strength');
        });
    });

    describe('Bold Presence', () => {
        const ability = rawAbility('Bold Presence', 'Ability',
            'When you make a **Presence Roll**, you can **spend a Hope** to add your Strength to the roll.\n\nAdditionally, once per rest when you would gain a condition, you can describe how your bold presence aids you in the situation and avoid gaining the condition.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should be frequency once_per_rest', () => {
            expect(enhanced.frequency).toBe('once_per_rest');
        });
    });

    describe('Critical Inspiration', () => {
        const ability = rawAbility('Critical Inspiration', 'Ability',
            'Once per rest, when you critically succeed on an attack, all allies within Very Close range can clear a Stress or gain a Hope.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.frequency).toBe('once_per_rest');
        });

        it('should be action_type passive or buff', () => {
            expect(['passive', 'buff']).toContain(enhanced.action_type);
        });
    });

    describe('Lean on Me', () => {
        const ability = rawAbility('Lean on Me', 'Ability',
            'Once per long rest, when you console or inspire an ally who failed an **action roll**, you can both clear 2 Stress.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.frequency).toBe('once_per_long_rest');
        });

        it('should be action_type passive', () => {
            expect(enhanced.action_type).toBe('passive');
        });
    });

    describe('Goad Them On', () => {
        const ability = rawAbility('Goad Them On', 'Ability',
            'Describe how you taunt a target within Close range, then make a **Presence Roll** against them. On a success, the target must **mark a Stress**, and the next time the GM spotlights them, they must target you with an attack, which they make with disadvantage.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have roll.trait = Presence', () => {
            expect(enhanced.roll?.trait).toBe('Presence');
        });

        it('should have attack.trait = Presence', () => {
            expect(enhanced.attack?.trait).toBe('Presence');
        });

        it('should be action_type attack', () => {
            expect(enhanced.action_type).toBe('attack');
        });
    });

    describe('Support Tank', () => {
        const ability = rawAbility('Support Tank', 'Ability',
            'When an ally within Close range fails a roll, you can **spend 2 Hope** to allow them to reroll either their Hope or Fear Die.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 2', () => {
            expect(enhanced.costs?.hope).toBe(2);
        });

        it('should be action_type passive or buff', () => {
            expect(['passive', 'buff']).toContain(enhanced.action_type);
        });
    });

    describe('Armorer', () => {
        const ability = rawAbility('Armorer', 'Ability',
            'While you\'re wearing armor, gain a +1 bonus to your Armor Score.\n\nDuring a rest, when you choose to repair your armor as a downtime move, your allies also clear an Armor Slot.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have modifier for armor_score +1', () => {
            const mod = enhanced.modifiers?.find(m => m.stat === 'armor_score');
            expect(mod?.value).toBe(1);
        });

        it('should be action_type downtime or passive', () => {
            expect(['downtime', 'passive']).toContain(enhanced.action_type);
        });
    });

    describe('Rousing Strike', () => {
        const ability = rawAbility('Rousing Strike', 'Ability',
            'Once per rest, when you critically succeed on an attack, you and allies who can see or hear you can clear a Hit Point or **1d4** Stress.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.frequency).toBe('once_per_rest');
        });

        it('should be action_type buff', () => {
            expect(enhanced.action_type).toBe('buff');
        });
    });

    describe('Inevitable', () => {
        const ability = rawAbility('Inevitable', 'Ability',
            'When you fail an **action roll**, your next **action roll** has advantage.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive', () => {
            expect(enhanced.action_type).toBe('passive');
        });

        it('should have no costs', () => {
            expect(enhanced.costs).toBeUndefined();
        });
    });

    describe('Rise Up', () => {
        const ability = rawAbility('Rise Up', 'Ability',
            'Gain a bonus to your Severe threshold equal to your Proficiency.\n\nWhen you mark 1 or more Hit Points from an attack, clear a Stress.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive or buff', () => {
            expect(['passive', 'buff']).toContain(enhanced.action_type);
        });
    });

    describe('Shrug It Off', () => {
        const ability = rawAbility('Shrug It Off', 'Ability',
            'When you would take damage, you can **mark a Stress** to reduce the severity of the damage by one threshold. When you do, roll a **d6**. On a result of 3 or lower, place this card in your vault.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });

        it('should be timing reaction (when taking damage)', () => {
            expect(enhanced.timing).toBe('reaction');
        });
    });

    describe('Valor-Touched', () => {
        const ability = rawAbility('Valor-Touched', 'Ability',
            'When 4 or more of the domain cards in your loadout are from the Valor domain, gain the following benefits:\n\n- +1 bonus to your Armor Score\n- When you mark 1 or more Hit Points without marking an Armor Slot, clear an Armor Slot.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive', () => {
            expect(enhanced.action_type).toBe('passive');
        });

        it('should have modifier for armor_score +1 with loadout condition', () => {
            const mod = enhanced.modifiers?.find(m => m.stat === 'armor_score');
            expect(mod?.value).toBe(1);
            expect(mod?.condition?.type).toBe('loadout_domain_count');
            expect(mod?.condition?.minCount).toBe(4);
        });
    });

    describe('Full Surge', () => {
        const ability = rawAbility('Full Surge', 'Ability',
            'Once per long rest, **mark 3 Stress** to push your body to its limits. Gain a +2 bonus to all of your character traits until your next rest.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.frequency).toBe('once_per_long_rest');
        });

        it('should have costs.stress = 3', () => {
            expect(enhanced.costs?.stress).toBe(3);
        });

        it('should have duration = rest', () => {
            expect(enhanced.duration).toBe('rest');
        });
    });

    describe('Ground Pound', () => {
        const ability = rawAbility('Ground Pound', 'Ability',
            '**Spend 2 Hope** to strike the ground where you stand and make a **Strength Roll** against all targets within Very Close range. Targets you succeed against are thrown back to Far range and must make a **Reaction Roll (17)**. Targets who fail take **4d10+8** damage. Targets who succeed take half damage.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 2', () => {
            expect(enhanced.costs?.hope).toBe(2);
        });

        it('should have roll.trait = Strength', () => {
            expect(enhanced.roll?.trait).toBe('Strength');
        });

        it('should have roll.target_reaction = true', () => {
            expect(enhanced.roll?.target_reaction).toBe(true);
        });

        it('should have attack.targets = all_in_range', () => {
            expect(enhanced.attack?.targets).toBe('all_in_range');
        });
    });

    describe('Hold the Line', () => {
        const ability = rawAbility('Hold the Line', 'Ability',
            'Describe the defensive stance you take and **spend a Hope**. If an adversary moves within Very Close range, they\'re pulled into Melee range and Restrained.\n\nThis condition lasts until you move or fail a roll with Fear, or the GM spends 2 Fear on their turn to clear it.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should be action_type passive or buff', () => {
            expect(['passive', 'buff']).toContain(enhanced.action_type);
        });
    });

    describe('Lead by Example', () => {
        const ability = rawAbility('Lead by Example', 'Ability',
            'When you deal damage to an adversary, you can **mark a Stress** and describe how you encourage your allies. The next PC to make an attack against that adversary can clear a Stress or gain a Hope.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });
    });

    describe('Unbreakable', () => {
        const ability = rawAbility('Unbreakable', 'Ability',
            'When you mark your last Hit Point, instead of making a death move, you can roll a **d6** and clear a number of Hit Points equal to the result. Then place this card in your vault.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be timing reaction (when marking last HP)', () => {
            expect(enhanced.timing).toBe('reaction');
        });
    });

    describe('Unyielding Armor', () => {
        const ability = rawAbility('Unyielding Armor', 'Ability',
            'When you would mark an Armor Slot, roll a number of **d6s** equal to your Proficiency. If any roll a 6, reduce the severity by one threshold without marking an Armor Slot.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be timing reaction (when marking armor slot)', () => {
            expect(enhanced.timing).toBe('reaction');
        });

        it('should be action_type passive or reaction', () => {
            expect(['passive', 'reaction']).toContain(enhanced.action_type);
        });
    });
});
