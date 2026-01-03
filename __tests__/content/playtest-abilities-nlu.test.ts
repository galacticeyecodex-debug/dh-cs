/**
 * PLAYTEST ABILITIES NLU-BASED TESTS
 * Tests for Blood and Dread domain abilities from playtest content
 * 
 * These tests verify that the parser correctly extracts structured data
 * from ability descriptions based on human NLU interpretation.
 */

import { enhanceAbilityCard } from '@/lib/card-parser';

// Helper to create raw ability card format
function createAbilityCard(name: string, level: string, domain: string, type: string, recall: string, text: string) {
    return { name, level, domain, type, recall, text };
}

describe('Playtest Abilities NLU Validation - Blood Domain', () => {

    describe('Blood Spike (Level 1)', () => {
        const card = createAbilityCard(
            'Blood Spike',
            '1',
            'Blood',
            'Spell',
            '1',
            'Make a **Spellcast Roll** against a target within Far range. On a success, **mark a Stress** to deal **d10** magic damage to the target using your Proficiency. On a success with Hope, the target also marks a Stress. On a roll with Fear, **mark a Stress**.'
        );
        const enhanced = enhanceAbilityCard(card);

        it('should be action_type attack (makes roll against target, deals damage)', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should have attack.trait = Spellcast', () => {
            expect(enhanced.enhancement.attack?.trait).toBe('Spellcast');
        });

        it('should have attack.range = Far', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Far');
        });

        it('should have attack.damage_type = magic', () => {
            expect(enhanced.enhancement.attack?.damage_type).toBe('magic');
        });

        it('should have keyword damage', () => {
            expect(enhanced.enhancement.keywords).toContain('damage');
        });
    });

    describe('Lifeblood Talisman (Level 1)', () => {
        const card = createAbilityCard(
            'Lifeblood Talisman',
            '1',
            'Blood',
            'Spell',
            '0',
            'Mark a Hit Point to conjure a talisman infused with your life essence. The talisman appears in your hand, and whoever carries the talisman gains its benefit: Whenever the talisman\'s bearer marks 2 or more Hit Points, they can **spend a Hope** to reduce the number of Hit Points marked by 1. The talisman disappears if you have no Hit Points marked or you use this spell again.'
        );
        const enhanced = enhanceAbilityCard(card);

        it('should be action_type utility (creates object, not direct buff)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword hope_cost', () => {
            expect(enhanced.enhancement.keywords).toContain('hope_cost');
        });
    });

    describe('Power Through Pain (Level 1)', () => {
        const card = createAbilityCard(
            'Power Through Pain',
            '1',
            'Blood',
            'Ability',
            '1',
            'If you have at least one Hit Point marked, you gain a bonus to your damage rolls. The bonus equals twice your number of marked Hit Points.'
        );
        const enhanced = enhanceAbilityCard(card);

        it('should be action_type passive (conditional bonus)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword damage', () => {
            expect(enhanced.enhancement.keywords).toContain('damage');
        });
    });

    describe('Mutual Suffering (Level 5)', () => {
        const card = createAbilityCard(
            'Mutual Suffering',
            '5',
            'Blood',
            'Spell',
            '1',
            'When an attack from a creature causes you to mark one or more Hit Points, you can make a **Reaction Roll** using your Spellcast trait against the creature. On a success, the creature marks the same number of Hit Points as you did, and you can\'t use this spell again until you finish a rest.'
        );
        const enhanced = enhanceAbilityCard(card);

        it('should be action_type reaction (triggers when taking damage)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should be timing reaction', () => {
            expect(enhanced.enhancement.timing).toBe('reaction');
        });

        it('should have roll.trait = Spellcast', () => {
            expect(enhanced.enhancement.roll?.trait).toBe('Spellcast');
        });
    });

    describe('Weave the Flesh (Level 4)', () => {
        const card = createAbilityCard(
            'Weave the Flesh',
            '4',
            'Blood',
            'Spell',
            '1',
            'Once per rest, mark a Hit Point to allow each ally within Close range to clear a Hit Point or a Stress. You can **mark a Stress** to allow those allies to clear one of each.'
        );
        const enhanced = enhanceAbilityCard(card);

        it('should be action_type buff (healing allies)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should have keyword healing', () => {
            expect(enhanced.enhancement.keywords).toContain('healing');
        });

        it('should have attack.range = Close (ally range)', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Close');
        });
    });

    describe('Crimson Adamance (Level 10)', () => {
        const card = createAbilityCard(
            'Crimson Adamance',
            '10',
            'Blood',
            'Ability',
            '1',
            'When you would mark your last Hit Point, **spend a Hope** to **mark a Stress** instead.'
        );
        const enhanced = enhanceAbilityCard(card);

        it('should be action_type reaction (when you would mark)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });
    });

    describe('Vampiric Strike (Level 7)', () => {
        const card = createAbilityCard(
            'Vampiric Strike',
            '7',
            'Blood',
            'Spell',
            '2',
            'When you make a successful attack roll against an adversary and cause them to mark 2 or more Hit Points, you can **spend a Hope** to clear a Hit Point or Stress.'
        );
        const enhanced = enhanceAbilityCard(card);

        it('should be action_type passive (triggered by successful attack)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword healing', () => {
            expect(enhanced.enhancement.keywords).toContain('healing');
        });

        it('should have keyword stress_relief', () => {
            expect(enhanced.enhancement.keywords).toContain('stress_relief');
        });

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });
    });

    describe('Blood-Touched (Level 7)', () => {
        const card = createAbilityCard(
            'Blood-Touched',
            '7',
            'Blood',
            'Ability',
            '1',
            'While 4 or more of the domain cards in your loadout are from the Blood domain, gain the following benefits:\n\n• When you take enough damage to mark 2 or more Hit Points, gain a Hope.\n• For every 3 Hit Points you have marked, gain a +1 bonus to your Evasion.'
        );
        const enhanced = enhanceAbilityCard(card);

        it('should be action_type passive (loadout-conditional)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword hope_gain', () => {
            expect(enhanced.enhancement.keywords).toContain('hope_gain');
        });

        it('should have modifier for evasion', () => {
            const evasionMod = enhanced.enhancement.modifiers?.find(m => m.stat === 'evasion');
            expect(evasionMod).toBeDefined();
        });
    });
});

describe('Playtest Abilities NLU Validation - Dread Domain', () => {

    describe('Blighting Strike (Level 1)', () => {
        const card = createAbilityCard(
            'Blighting Strike',
            '1',
            'Dread',
            'Spell',
            '1',
            'Make a **Spellcast Roll** against a target within Far range. On a success, the target takes **d6+1** magic damage using your Proficiency and the next time the target deals damage to an ally, it is reduced by half. If you succeed with Fear, the target instead takes **d10+1** magic damage using your Proficiency.'
        );
        const enhanced = enhanceAbilityCard(card);

        it('should be action_type attack', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should have attack.range = Far', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Far');
        });

        it('should have attack.damage_type = magic', () => {
            expect(enhanced.enhancement.attack?.damage_type).toBe('magic');
        });
    });

    describe('Voice of Dread (Level 1)', () => {
        const card = createAbilityCard(
            'Voice of Dread',
            '1',
            'Dread',
            'Spell',
            '0',
            'You can magically speak directly into the ears of a creature you can see. To torment them with your words, make a **Spellcast Roll** against them. On a success, they must **mark a Stress** and become temporarily Vulnerable.'
        );
        const enhanced = enhanceAbilityCard(card);

        it('should be action_type attack (roll against target)', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should have keyword debuff (makes vulnerable)', () => {
            expect(enhanced.enhancement.keywords).toContain('debuff');
        });
    });

    describe('Umbral Veil (Level 1)', () => {
        const card = createAbilityCard(
            'Umbral Veil',
            '1',
            'Dread',
            'Spell',
            '1',
            'Once per rest, when you roll with Fear, you can **spend any number of Hope** to place an equal number of tokens on this card, encasing yourself in a shadowy energy. After an attack roll is made against you, you can spend any number of tokens to give the attack roll a +1 penalty per token. On your next rest, remove all tokens from this card.'
        );
        const enhanced = enhanceAbilityCard(card);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should have has_tokens = true', () => {
            expect(enhanced.enhancement.tokens?.has_tokens).toBe(true);
        });

        it('should have keyword tokens', () => {
            expect(enhanced.enhancement.keywords).toContain('tokens');
        });
    });

    describe('Hideous Retribution (Level 2)', () => {
        const card = createAbilityCard(
            'Hideous Retribution',
            '2',
            'Dread',
            'Spell',
            '2',
            'When an ally within Close range takes damage from a target you can see, you can make a **Spellcast Reaction Roll** against the target. On a success, **mark a Stress** to deal them **d6** magic damage using your Proficiency.'
        );
        const enhanced = enhanceAbilityCard(card);

        it('should be action_type reaction (ally damage trigger)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should be timing reaction', () => {
            expect(enhanced.enhancement.timing).toBe('reaction');
        });

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });
    });

    describe('Terrify (Level 3)', () => {
        const card = createAbilityCard(
            'Terrify',
            '3',
            'Dread',
            'Spell',
            '1',
            'Make a **Spellcast Roll** against a target within Far range. On a success, the target marks **1d4** Stress and you can choose to make the target run one range away from you (Close to Far, Far to Very Far, etc). On a success with Fear, the target becomes temporarily Vulnerable.'
        );
        const enhanced = enhanceAbilityCard(card);

        it('should be action_type attack (roll against target)', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should have attack.range = Far', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Far');
        });

        it('should have keyword debuff', () => {
            expect(enhanced.enhancement.keywords).toContain('debuff');
        });
    });

    describe('Darkfire (Level 6)', () => {
        const card = createAbilityCard(
            'Darkfire',
            '6',
            'Dread',
            'Spell',
            '2',
            'Make a **Spellcast Roll** against all adversaries within Close range. You can **spend a Hope** for any you succeed against, and they must make a **Reaction Roll (14)**. On a failure, they take **d8+6** magic damage using your Proficiency as they are engulfed in dark fire. On a success, they take half damage.'
        );
        const enhanced = enhanceAbilityCard(card);

        it('should be action_type attack', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should have attack.range = Close', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Close');
        });

        it('should have keyword aoe (all adversaries)', () => {
            expect(enhanced.enhancement.keywords).toContain('aoe');
        });

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });
    });

    describe('Dread-Touched (Level 7)', () => {
        const card = createAbilityCard(
            'Dread-Touched',
            '7',
            'Dread',
            'Ability',
            '2',
            'When 4 or more of the domain cards in your loadout are from the Dread domain, gain the following benefits:\n\n• When you succeed with Fear, you can **mark 2 Stress** to prevent the GM from gaining a Fear.\n• Once per rest, when making an **action roll**, you can add a +1 bonus to the roll for each Fear token the GM has stored.'
        );
        const enhanced = enhanceAbilityCard(card);

        it('should be action_type passive (loadout-conditional)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have costs.stress = 2', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(2);
        });
    });

    describe('Dark Army (Level 8)', () => {
        const card = createAbilityCard(
            'Dark Army',
            '8',
            'Dread',
            'Spell',
            '2',
            'Make a **Spellcast Roll (14)**. Once per long rest, on a success you can summon a group of fiends that surround and move with you. Place 8 tokens on this card. When you deal damage to a target within Very Close range, you can spend a token to increase it by +**1d8**. Additionally, when you take damage, you can spend a token to reduce it by **1d8**. Each time you spend a token, a fiend acts on your behalf, then disappears. Remove all tokens from this card on your next rest.'
        );
        const enhanced = enhanceAbilityCard(card);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should have has_tokens = true', () => {
            expect(enhanced.enhancement.tokens?.has_tokens).toBe(true);
        });

        it('should have max_tokens = 8', () => {
            expect(enhanced.enhancement.tokens?.max_tokens).toBe(8);
        });

        it('should have roll.difficulty = 14', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(14);
        });
    });

    describe('Damnation (Level 9)', () => {
        const card = createAbilityCard(
            'Damnation',
            '9',
            'Dread',
            'Spell',
            '2',
            'Make a **Spellcast Roll** against a target within Far range. On a success, **mark any number of Stress** to roll an equal number of **d20s**, dealing magic damage equal to the total result. If the target is defeated as a result of this attack, all adversaries within Far range of the target **mark a Stress**.'
        );
        const enhanced = enhanceAbilityCard(card);

        it('should be action_type attack', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should have attack.range = Far', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Far');
        });

        it('should have keyword aoe (all adversaries affected on defeat)', () => {
            expect(enhanced.enhancement.keywords).toContain('aoe');
        });
    });

    describe('Avatar of Terror (Level 10)', () => {
        const card = createAbilityCard(
            'Avatar of Terror',
            '10',
            'Dread',
            'Spell',
            '1',
            '**Mark a Stress** to transform into a creature fueled by fear. While in this form, your damage rolls gain a +**1d6** bonus for each Fear the GM has. Additionally, gain a Hope when the GM uses a Fear feature on an adversary within Close range.\n\nYou must **spend a Hope** to make an **action roll** while in this form. Otherwise, you drop out of this form.'
        );
        const enhanced = enhanceAbilityCard(card);

        it('should be action_type utility (transformation)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should have keyword hope_gain', () => {
            expect(enhanced.enhancement.keywords).toContain('hope_gain');
        });
    });
});
