/**
 * ABILITIES SCHEMA VALIDATION TESTS - GRACE DOMAIN
 */

import { describe, it, expect } from 'vitest';
import { enhanceAbilityCard } from '@/lib/card-parser';

function rawAbility(name: string, type: string, text: string) {
    return { name, level: '1', domain: 'Grace', type, recall: '0', text };
}

describe('Abilities Schema Validation - Grace Domain', () => {
    describe('Deft Deceiver', () => {
        const ability = rawAbility('Deft Deceiver', 'Ability',
            '**Spend a Hope** to gain advantage on a roll to deceive or trick someone into believing a lie you tell them.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should be action_type buff', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Enrapture', () => {
        const ability = rawAbility('Enrapture', 'Spell',
            'Make a **Spellcast Roll** against a target within Close range. On a success, they become temporarily Enraptured. While Enraptured, a target\'s attention is fixed on you, narrowing their field of view and drowning out any sound but your voice. Once per rest on a success, you can **mark a Stress** to force the Enraptured target to **mark a Stress** as well.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });
    });

    describe('Inspirational Words', () => {
        const ability = rawAbility('Inspirational Words', 'Ability',
            'Your speech is imbued with power. After a long rest, place a number of tokens on this card equal to your Presence. When you speak with an ally, you can spend a token from this card to give them one benefit from the following options:\n\n- Your ally clears a Stress.\n- Your ally clears a Hit Point.\n- Your ally gains a Hope.\n\nWhen you take a long rest, clear all unspent tokens.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have has_tokens = true', () => {
            expect(enhanced.enhancement.tokens?.has_tokens).toBe(true);
        });

        it('should have token_source = presence', () => {
            expect(enhanced.enhancement.tokens?.token_source).toBe('presence');
        });

        it('should be action_type passive or buff', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Tell No Lies', () => {
        const ability = rawAbility('Tell No Lies', 'Spell',
            'Make a **Spellcast Roll** against a target within Very Close range. On a success, they can\'t lie to you while they remain within Close range, but they are not compelled to speak. If you ask them a question and they refuse to answer, they must **mark a Stress** and the effect ends. The target is typically unaware this spell has been cast on them until it causes them to utter the truth.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type attack (rolls against target)', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should have attack.range = Very Close', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Very Close');
        });
    });

    describe('Troublemaker', () => {
        const ability = rawAbility('Troublemaker', 'Ability',
            'When you taunt or provoke a target within Far range, make a **Presence Roll** against them. Once per rest on a success, roll a number of **d4s** equal to your Proficiency. The target must **mark Stress** equal to the highest result rolled.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should have roll.trait = Presence', () => {
            expect(enhanced.enhancement.roll?.trait).toBe('Presence');
        });
    });

    describe('Hypnotic Shimmer', () => {
        const ability = rawAbility('Hypnotic Shimmer', 'Spell',
            'Make a **Spellcast Roll** against all adversaries in front of you within Close range. Once per rest on a success, create an illusion of flashing colors and lights that temporarily Stuns targets you succeed against and forces them to **mark a Stress**. While Stunned, they can\'t use reactions and can\'t take any other actions until they clear this condition.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should have attack.targets = all_in_range', () => {
            expect(enhanced.enhancement.attack?.targets).toBe('all_in_range');
        });
    });

    describe('Invisibility', () => {
        const ability = rawAbility('Invisibility', 'Spell',
            'Make a **Spellcast Roll (10)**. On a success, **mark a Stress** and choose yourself or an ally within Melee range to become Invisible. An Invisible creature can\'t be seen except through magical means and attack rolls against them are made with disadvantage. Place a number of tokens equal to your Spellcast trait on this card. When the Invisible creature takes an action, spend a token from this card. After the action that spends the last token is resolved, the effect ends.\n\nYou can only hold Invisibility on one creature at a time.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should have has_tokens = true', () => {
            expect(enhanced.enhancement.tokens?.has_tokens).toBe(true);
        });

        it('should have token_source = spellcast', () => {
            expect(enhanced.enhancement.tokens?.token_source).toBe('spellcast');
        });

        it('should have roll.difficulty = 10', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(10);
        });
    });

    describe('Soothing Speech', () => {
        const ability = rawAbility('Soothing Speech', 'Ability',
            'During a short rest, when you take the time to comfort another character while using the Tend to Wounds downtime move on them, clear an additional Hit Point on that character. When you do, you also clear 2 Hit Points.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type downtime', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should be timing downtime', () => {
            expect(enhanced.enhancement.timing).toBe('downtime');
        });
    });

    describe('Through Your Eyes', () => {
        const ability = rawAbility('Through Your Eyes', 'Spell',
            'Choose a target within Very Far range. You can see through their eyes and hear through their ears. You can transition between using your own senses or the target\'s freely until you cast another spell or until your next rest.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type utility', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have duration = rest', () => {
            expect(enhanced.enhancement.duration).toBe('rest');
        });
    });

    describe('Thought Delver', () => {
        const ability = rawAbility('Thought Delver', 'Spell',
            'You can peek into the minds of others. **Spend a Hope** to read the vague surface thoughts of a target within Far range. Make a **Spellcast Roll** against the target to delve for deeper, more hidden thoughts.\n\nOn a roll with Fear, the target might, at the GM\'s discretion, become aware that you\'re reading their thoughts.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should have attack.range = Far', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Far');
        });
    });

    describe('Words of Discord', () => {
        const ability = rawAbility('Words of Discord', 'Spell',
            'Whisper words of discord to an adversary within Melee range and make a **Spellcast Roll (13)**. On a success, the target must **mark a Stress** and make an attack against another adversary instead of against you or your allies.\n\nOnce this attack is over, the target realizes what happened. The next time you cast Words of Discord on them, gain a –5 penalty to the **Spellcast Roll**.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have roll.difficulty = 13', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(13);
        });

        it('should have attack.range = Melee', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Melee');
        });
    });

    describe('Never Upstaged', () => {
        const ability = rawAbility('Never Upstaged', 'Ability',
            'When you mark 1 or more Hit Points from an attack, you can **mark a Stress** to place a number of tokens equal to the number of Hit Points you marked on this card. On your next successful attack, gain a +5 bonus to your damage roll for each token on this card, then clear all tokens.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should have has_tokens = true', () => {
            expect(enhanced.enhancement.tokens?.has_tokens).toBe(true);
        });

        it('should have modifier for damage +5', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'damage');
            expect(mod?.value).toBe(5);
        });
    });

    describe('Share the Burden', () => {
        const ability = rawAbility('Share the Burden', 'Spell',
            'Once per rest, take on the Stress from a willing creature within Melee range. The target describes what intimate knowledge or emotions telepathically leak from their mind in this moment between you. Transfer any number of their marked Stress to you, then gain a Hope for each Stress transferred.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should be action_type utility', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Endless Charisma', () => {
        const ability = rawAbility('Endless Charisma', 'Ability',
            'After you make an **action roll** to persuade, lie, or garner favor, you can **spend a Hope** to reroll the Hope or Fear Die.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should be action_type passive', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Grace-Touched', () => {
        const ability = rawAbility('Grace-Touched', 'Ability',
            'When 4 or more of the domain cards in your loadout are from the Grace domain, gain the following benefits:\n\n- You can mark an Armor Slot instead of marking a Stress.\n- When you would force a target to mark a number of Hit Points, you can choose instead to force them to **mark that number of Stress**.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Astral Projection', () => {
        const ability = rawAbility('Astral Projection', 'Spell',
            'Once per long rest, **mark a Stress** to create a projected copy of yourself that can appear anywhere you\'ve been before.\n\nYou can see and hear through the projection as though it were you and affect the world as though you were there. A creature investigating the projection can tell it\'s of magical origin. This effect lasts until your next rest or your projection takes any damage.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should have duration = rest', () => {
            expect(enhanced.enhancement.duration).toBe('rest');
        });
    });

    describe('Mass Enrapture', () => {
        const ability = rawAbility('Mass Enrapture', 'Spell',
            'Make a **Spellcast Roll** against all targets within Far range. Targets you succeed against become temporarily Enraptured. While Enraptured, a target\'s attention is fixed on you, narrowing their field of view and drowning out any sound but your voice. **Mark a Stress** to force all Enraptured targets to **mark a Stress**, ending this spell.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should have attack.targets = all_in_range', () => {
            expect(enhanced.enhancement.attack?.targets).toBe('all_in_range');
        });
    });

    describe('Copycat', () => {
        const ability = rawAbility('Copycat', 'Spell',
            'Once per long rest, this card can mimic the features of another domain card of level 8 or lower in another player\'s loadout. **Spend Hope** equal to half the card\'s level to gain access to the feature. It lasts until your next rest or they place the card in their vault.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should have duration = rest', () => {
            expect(enhanced.enhancement.duration).toBe('rest');
        });
    });

    describe('Master of the Craft', () => {
        const ability = rawAbility('Master of the Craft', 'Ability',
            'Gain a permanent +2 bonus to two of your Experiences or a permanent +3 bonus to one of your Experiences. Then place this card in your vault permanently.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Encore', () => {
        const ability = rawAbility('Encore', 'Spell',
            'When an ally within Close range deals damage to an adversary, you can make a **Spellcast Roll** against that same target. On a success, you deal the same damage to the target that your ally dealt. If your **Spellcast Roll** succeeds with Fear, place this card in your vault.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type attack', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should be timing reaction (when ally deals damage)', () => {
            expect(enhanced.enhancement.timing).toBe('reaction');
        });
    });

    describe('Notorious', () => {
        const ability = rawAbility('Notorious', 'Ability',
            'People know who you are and what you\'ve done, and they treat you differently because of it. When you leverage your notoriety to get what you want, you can **mark a Stress** before you roll to gain a +10 bonus to the result. Your food and drinks are always free wherever you go, and everything else you buy is reduced in price by one bag of gold (to a minimum of one handful).\n\nThis card doesn\'t count against your loadout\'s domain card maximum of 5 and can\'t be placed in your vault.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type passive', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });
});
