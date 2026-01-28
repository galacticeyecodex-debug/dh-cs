/**
 * ABILITIES SCHEMA VALIDATION TESTS - SPLENDOR DOMAIN
 */

import { describe, it, expect } from 'vitest';
import { enhanceAbilityCard } from '@/lib/card-parser';

function rawAbility(name: string, type: string, text: string) {
    return { name, level: '1', domain: 'Splendor', type, recall: '0', text };
}

describe('Abilities Schema Validation - Splendor Domain', () => {
    describe('Bolt Beacon', () => {
        const ability = rawAbility('Bolt Beacon', 'Spell',
            'Make a **Spellcast Roll** against a target within Far range. On a success, **spend a Hope** to send a bolt of shimmering light toward them, dealing **d8+2** magic damage using your Proficiency. The target becomes temporarily Vulnerable and glows brightly until this condition is cleared.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should be action_type attack', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should have attack.damage_type = magic', () => {
            expect(enhanced.enhancement.attack?.damage_type).toBe('magic');
        });

        it('should have damage_scaling = proficiency', () => {
            // Bolt Beacon explicitly says "using your Proficiency" so it should scale
            expect(enhanced.enhancement.attack?.damage_scaling).toBe('proficiency');
        });
    });

    describe('Mending Touch', () => {
        const ability = rawAbility('Mending Touch', 'Spell',
            'You lay your hands upon a creature and channel healing magic to close their wounds. When you can take a few minutes to focus on the target you\'re helping, you can **spend 2 Hope** to clear a Hit Point or a Stress on them.\n\nOnce per long rest, when you spend this healing time learning something new about them or revealing something about yourself, you can clear 2 Hit Points or 2 Stress on them instead.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 2', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(2);
        });

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should be action_type buff', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Reassurance', () => {
        const ability = rawAbility('Reassurance', 'Ability',
            'Once per rest, after any ill attempts an **action roll** but before the consequences take place, you can offer assistance or words of support. When you do, your ally can reroll their dice.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should be action_type passive', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Final Words', () => {
        const ability = rawAbility('Final Words', 'Spell',
            'You can infuse a corpse with a moment of life to speak with it. Make a **Spellcast Roll (13)**. On a success with Hope, the corpse answers up to three questions. On a success with Fear, the corpse answers one question. The corpse answers truthfully, but it can\'t impart information it didn\'t know in life. On a failure, or once the corpse has finished answering your questions, the body turns to dust.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have roll.difficulty = 13', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(13);
        });

        it('should be action_type utility', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Healing Hands', () => {
        const ability = rawAbility('Healing Hands', 'Spell',
            'Make a **Spellcast Roll (13)** and target a creature other than yourself within Melee range. On a success, **mark a Stress** to clear 2 Hit Points or 2 Stress on the target. On a failure, **mark a Stress** to clear a Hit Point or a Stress on the target. You can\'t heal the same target again until your next long rest.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should have roll.difficulty = 13', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(13);
        });

        it('should be action_type buff', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Second Wind', () => {
        const ability = rawAbility('Second Wind', 'Ability',
            'Once per rest, when you succeed on an attack against an adversary, you can clear 3 Stress or a Hit Point. On a success with Hope, you also clear 3 Stress or a Hit Point on an ally within Close range of you.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should be action_type passive', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Voice of Reason', () => {
        const ability = rawAbility('Voice of Reason', 'Ability',
            'You speak with an unmatched power and authority. You have advantage on **action rolls** to de-escalate violent situations or convince someone to follow your lead.\n\nAdditionally, you\'re emboldened in moments of duress. When all of your Stress slots are marked, you gain a +1 bonus to your Proficiency for damage rolls.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have modifier for proficiency +1', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'proficiency');
            expect(mod?.value).toBe(1);
        });
    });

    describe('Divination', () => {
        const ability = rawAbility('Divination', 'Spell',
            'Once per long rest, **spend 3 Hope** to reach out to the forces beyond and ask one "yes or no" question about an event, person, place, or situation in the near future. For a moment, the present falls away and you see the answer before you.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should have costs.hope = 3', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(3);
        });
    });

    describe('Life Ward', () => {
        const ability = rawAbility('Life Ward', 'Spell',
            '**Spend 3 Hope** and choose an ally within Close range. They are marked with a glowing sigil of protection. When this ally would make a death move, they clear a Hit Point instead.\n\nThis effect ends when it saves the target from a death move, you cast Life Ward on another target, or you take a long rest.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 3', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(3);
        });

        it('should be action_type buff', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Shape Material', () => {
        const ability = rawAbility('Shape Material', 'Spell',
            '**Spend a Hope** to shape a section of natural material you\'re touching (such as stone, ice, or wood) to suit your purpose. The area of the material can be no larger than you. For example, you can form a rudimentary tool or create a door.\n\nYou can only affect the material within Close range of where you\'re touching it.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should be action_type utility', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Smite', () => {
        const ability = rawAbility('Smite', 'Spell',
            'Once per rest, **spend 3 Hope** to charge your powerful smite. When you next successfully attack with a weapon, double the result of your damage roll. This attack deals magic damage regardless of the weapon\'s damage type.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should have costs.hope = 3', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(3);
        });
    });

    describe('Restoration', () => {
        const ability = rawAbility('Restoration', 'Spell',
            'After a long rest, place a number of tokens equal to your Spellcast trait on this card. Touch a creature and spend any number of tokens to clear 2 Hit Points or 2 Stress for each token spent.\n\nYou can also spend a token from this card when touching a creature to clear the Vulnerable condition or heal a physical or magical ailment (the GM might require additional tokens depending on the strength of the ailment).\n\nWhen you take a long rest, clear all unspent tokens.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have has_tokens = true', () => {
            expect(enhanced.enhancement.tokens?.has_tokens).toBe(true);
        });

        it('should have token_source = spellcast', () => {
            expect(enhanced.enhancement.tokens?.token_source).toBe('spellcast');
        });
    });

    describe('Zone of Protection', () => {
        const ability = rawAbility('Zone of Protection', 'Spell',
            'Make a **Spellcast Roll (16)**. Once per long rest on a success, choose a point within Far range and create a visible zone of protection there for all allies within Very Close range of that point. When you do, place a **d6** on this card with the 1 value facing up. When an ally in this zone takes damage, they reduce it by the die\'s value. You then increase the die\'s value by one. When the die\'s value would exceed 6, this effect ends.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should have roll.difficulty = 16', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(16);
        });
    });

    describe('Healing Strike', () => {
        const ability = rawAbility('Healing Strike', 'Spell',
            'When you deal damage to an adversary, you can **spend 2 Hope** to clear a Hit Point on an ally within Close range.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 2', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(2);
        });

        it('should be action_type buff', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Splendor-Touched', () => {
        const ability = rawAbility('Splendor-Touched', 'Ability',
            'When 4 or more of the domain cards in your loadout are from the Splendor domain, gain the following benefits:\n\n- +3 bonus to your Severe damage threshold\n- Once per long rest, when incoming damage would require you to mark a number of Hit Points, you can choose to **mark that much Stress** or **spend that much Hope** instead.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should have modifier for damage_threshold_severe +3', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'damage_threshold_severe');
            expect(mod?.value).toBe(3);
            expect(mod?.condition?.type).toBe('loadout_domain_count');
            expect(mod?.condition?.minCount).toBe(4);
        });
    });

    describe('Shield Aura', () => {
        const ability = rawAbility('Shield Aura', 'Spell',
            '**Mark a Stress** to cast a protective aura on a target within Very Close range. When the target marks an Armor Slot, they reduce the severity of the attack by an additional threshold. If this spell causes a creature who would be damaged to instead mark no Hit Points, the effect ends.\n\nYou can only hold Shield Aura on one creature at a time.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type utility', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Stunning Sunlight', () => {
        const ability = rawAbility('Stunning Sunlight', 'Spell',
            'Make a **Spellcast Roll** to unleash powerful rays of burning sunlight against all adversaries in front of you within Far range. On a success, **spend any number of Hope** and force that many targets you succeeded against to make a **Reaction Roll (14)**.\n\nTargets who succeed take **3d20+3** magic damage. Targets who fail take **4d20+5** magic damage and are temporarily Stunned. While Stunned, they can\'t use reactions and can\'t take any other actions until they clear this condition.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have roll.target_reaction = true', () => {
            expect(enhanced.enhancement.roll?.target_reaction).toBe(true);
        });

        it('should have attack.targets = all_in_range', () => {
            expect(enhanced.enhancement.attack?.targets).toBe('all_in_range');
        });
    });

    describe('Overwhelming Aura', () => {
        const ability = rawAbility('Overwhelming Aura', 'Spell',
            'Make a **Spellcast Roll (15)** to magically empower your aura. On a success, **spend 2 Hope** to make your Presence equal to your Spellcast trait until your next long rest.\n\nWhile this spell is active, an adversary must **mark a Stress** when they target you with an attack.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 2', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(2);
        });

        it('should have roll.difficulty = 15', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(15);
        });

        it('should have modifier for presence with formula', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'presence');
            expect(mod?.formula).toBe('spellcast');
        });
    });

    describe('Salvation Beam', () => {
        const ability = rawAbility('Salvation Beam', 'Spell',
            'Make a **Spellcast Roll (16)**. On a success, **mark any number of Stress** to target a line of allies within Far range. You can clear Hit Points on the targets equal to the number of Stress marked, divided among them however you\'d like.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have roll.difficulty = 16', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(16);
        });

        it('should be action_type utility', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Invigoration', () => {
        const ability = rawAbility('Invigoration', 'Spell',
            'When you or an ally within Close range has used a feature that has an exhaustion limit (such as once per rest or once per session), you can **spend any number of Hope** and roll that many **d6s**. If any roll a 6, the feature can be used again.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type utility', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Resurrection', () => {
        const ability = rawAbility('Resurrection', 'Spell',
            'Make a **Spellcast Roll (20)**. On a success, restore one creature who has been dead no longer than 100 years to full strength. Then roll a **d6**. On a result of 5 or lower, place this card in your vault permanently.\n\nOn a failure, you can\'t cast Resurrection again for a week.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have roll.difficulty = 20', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(20);
        });
    });
});
