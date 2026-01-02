/**
 * ABILITIES SCHEMA VALIDATION TESTS - MIDNIGHT DOMAIN
 */

import { describe, it, expect } from 'vitest';
import { enhanceAbilityCard } from '@/lib/card-parser';

function rawAbility(name: string, type: string, text: string) {
    return { name, level: '1', domain: 'Midnight', type, recall: '0', text };
}

describe('Abilities Schema Validation - Midnight Domain', () => {
    describe('Pick and Pull', () => {
        const ability = rawAbility('Pick and Pull', 'Ability',
            'You have advantage on **action rolls** to pick nonmagical locks, disarm nonmagical traps, or steal items from a target (either through stealth or by force).');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive', () => {
            expect(enhanced.action_type).toBe('passive');
        });

        it('should have no costs', () => {
            expect(enhanced.costs).toBeUndefined();
        });
    });

    describe('Rain of Blades', () => {
        const ability = rawAbility('Rain of Blades', 'Spell',
            '**Spend a Hope** to make a **Spellcast Roll** and conjure throwing blades that strike out at all targets within Very Close range. Targets you succeed against take **1d8+2** magic damage using your Proficiency.\n\nIf a target you hit is Vulnerable, they take an extra **1d8** damage.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should be action_type attack', () => {
            expect(enhanced.action_type).toBe('attack');
        });

        it('should have attack.targets = all_in_range', () => {
            expect(enhanced.attack?.targets).toBe('all_in_range');
        });

        it('should have attack.damage_type = magic', () => {
            expect(enhanced.attack?.damage_type).toBe('magic');
        });
    });

    describe('Uncanny Disguise', () => {
        const ability = rawAbility('Uncanny Disguise', 'Spell',
            'When you have a few minutes to prepare, you can **mark a Stress** to don the facade of any humanoid you can picture clearly in your mind. While disguised, you have advantage on **Presence Rolls** to avoid scrutiny.\n\nPlace a number of tokens equal to your Spellcast trait on this card. When you take an action while disguised, spend a token from this card. After the action that spends the last token is resolved, the disguise drops.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });

        it('should have has_tokens = true', () => {
            expect(enhanced.has_tokens).toBe(true);
        });

        it('should have token_source = spellcast', () => {
            expect(enhanced.token_source).toBe('spellcast');
        });
    });

    describe('Midnight Spirit', () => {
        const ability = rawAbility('Midnight Spirit', 'Spell',
            '**Spend a Hope** to summon a humanoid-sized spirit that can move or carry things for you until your next rest.\n\nYou can also send it to attack an adversary. When you do, make a **Spellcast Roll** against a target within Very Far range. On a success, the spirit moves into Melee range with that target. Roll a number of **d6s** equal to your Spellcast trait and deal that much magic damage to the target. The spirit then dissipates. You can only have one spirit at a time.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should have attack.range = Very Far', () => {
            expect(enhanced.attack?.range).toBe('Very Far');
        });

        it('should have duration = rest', () => {
            expect(enhanced.duration).toBe('rest');
        });
    });

    describe('Shadowbind', () => {
        const ability = rawAbility('Shadowbind', 'Spell',
            'Make a **Spellcast Roll** against all adversaries within Very Close range. Targets you succeed against are temporarily Restrained as their shadow binds them in place.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type attack', () => {
            expect(enhanced.action_type).toBe('attack');
        });

        it('should have attack.targets = all_in_range', () => {
            expect(enhanced.attack?.targets).toBe('all_in_range');
        });

        it('should have no costs', () => {
            expect(enhanced.costs).toBeUndefined();
        });
    });

    describe('Chokehold', () => {
        const ability = rawAbility('Chokehold', 'Ability',
            'When you position yourself behind a creature who\'s about your size, you can **mark a Stress** to pull them into a chokehold, making them temporarily Vulnerable.\n\nWhen a creature attacks a target who is Vulnerable in this way, they deal an extra **2d6** damage.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });

        it('should be action_type passive or buff', () => {
            expect(['passive', 'buff']).toContain(enhanced.action_type);
        });
    });

    describe('Veil of Night', () => {
        const ability = rawAbility('Veil of Night', 'Spell',
            'Make a **Spellcast Roll (13)**. On a success, you can create a temporary curtain of darkness between two points within Far range. Only you can see through this darkness. You\'re considered Hidden to adversaries on the other side of the veil, and you have advantage on attacks you make through the darkness. The veil remains until you cast another spell.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have roll.difficulty = 13', () => {
            expect(enhanced.roll?.difficulty).toBe(13);
        });

        it('should be action_type utility or buff', () => {
            expect(['utility', 'buff', 'attack']).toContain(enhanced.action_type);
        });
    });

    describe('Stealth Expertise', () => {
        const ability = rawAbility('Stealth Expertise', 'Ability',
            'When you roll with Fear while attempting to move unnoticed through a dangerous area, you can **mark a Stress** to roll with Hope instead.\n\nIf an ally within Close range is also attempting to move unnoticed and rolls with Fear, you can **mark a Stress** to change their result to a roll with Hope.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });

        it('should be action_type passive', () => {
            expect(enhanced.action_type).toBe('passive');
        });
    });

    describe('Glyph of Nightfall', () => {
        const ability = rawAbility('Glyph of Nightfall', 'Spell',
            'Make a **Spellcast Roll** against a target within Very Close range. On a success, **spend a Hope** to conjure a dark glyph upon their body that exposes their weak points, temporarily reducing the target\'s Difficulty by a value equal to your Knowledge (minimum 1).');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should be action_type attack (rolls against target)', () => {
            expect(enhanced.action_type).toBe('attack');
        });
    });

    describe('Hush', () => {
        const ability = rawAbility('Hush', 'Spell',
            'Make a **Spellcast Roll** against a target within Close range. On a success, **spend a Hope** to conjure suppressive magic around the target that encompasses everything within Very Close range of them and follows them as they move.\n\nThe target and anything within the area is Silenced until the GM spends a Fear on their turn to clear this condition, you cast Hush again, or you take Major damage. While Silenced, they can\'t make noise and can\'t cast spells.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });
    });

    describe('Phantom Retreat', () => {
        const ability = rawAbility('Phantom Retreat', 'Spell',
            '**Spend a Hope** to activate Phantom Retreat where you\'re currently standing. **Spend another Hope** at any time before your next rest to disappear from where you are and reappear where you were standing when you activated Phantom Retreat. This spell ends after you reappear.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1 (base activation)', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should be action_type utility', () => {
            expect(enhanced.action_type).toBe('utility');
        });
    });

    describe('Dark Whispers', () => {
        const ability = rawAbility('Dark Whispers', 'Spell',
            'You can speak into the mind of any person with whom you\'ve made physical contact. Once you\'ve opened a channel with them, they can speak back into your mind. Additionally, you can **mark a Stress** to make a **Spellcast Roll** against them. On a success, you can ask the GM one of the following questions and receive an answer:\n\n- Where are they?\n- What are they doing?\n- What are they afraid of?\n- What do they cherish most in the world?');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });
    });

    describe('Mass Disguise', () => {
        const ability = rawAbility('Mass Disguise', 'Spell',
            'When you have a few minutes of silence to focus, you can **mark a Stress** to change the appearance of all willing creatures within Close range. Their new forms must share a general body structure and size, and can be somebody or something you\'ve seen before or entirely fabricated. A disguised creature has advantage on **Presence Rolls** to avoid scrutiny.\n\nActivate a Countdown (8). It ticks down as a consequence the GM chooses. When it triggers, the disguise drops.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });

        it('should be action_type utility', () => {
            expect(enhanced.action_type).toBe('utility');
        });
    });

    describe('Midnight-Touched', () => {
        const ability = rawAbility('Midnight-Touched', 'Ability',
            'When you have midnight domain cards in your loadout are from the midnight domain, gain the following benefits:\n\n- Once per rest, when you have 0 Hope and the GM would gain a Fear, you can gain a Hope instead.\n- When you make a successful attack, you can **mark a Stress** to add the result of your Fear Die to your damage roll.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.frequency).toBe('once_per_rest');
        });

        it('should have costs.stress = 1', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });
    });

    describe('Vanishing Dodge', () => {
        const ability = rawAbility('Vanishing Dodge', 'Spell',
            'When an attack made against you that would deal physical damage fails, you can **spend a Hope** to envelop yourself in shadow, becoming Hidden and teleporting to a point within Close range of the attacker. You remain Hidden until the next time you make an **action roll**.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should be action_type reaction', () => {
            expect(enhanced.action_type).toBe('reaction');
        });

        it('should be timing reaction', () => {
            expect(enhanced.timing).toBe('reaction');
        });
    });

    describe('Shadowhunter', () => {
        const ability = rawAbility('Shadowhunter', 'Ability',
            'Your prowess is enhanced under the cover of shadow. While you\'re shrouded in low light or darkness, you gain a +1 bonus to your Evasion and make attack rolls with advantage.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive', () => {
            expect(enhanced.action_type).toBe('passive');
        });

        it('should have modifier for evasion +1', () => {
            const mod = enhanced.modifiers?.find(m => m.stat === 'evasion');
            expect(mod?.value).toBe(1);
        });
    });

    describe('Spellcharge', () => {
        const ability = rawAbility('Spellcharge', 'Spell',
            'When you take magic damage, place tokens equal to the number of Hit Points you marked on this card. You can store a number of tokens equal to your Spellcast trait.\n\nWhen you make a successful attack against a target, you can spend any number of tokens to add a **d6** for each token spent to your damage roll.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have has_tokens = true', () => {
            expect(enhanced.has_tokens).toBe(true);
        });

        it('should be action_type passive or attack', () => {
            expect(['passive', 'attack']).toContain(enhanced.action_type);
        });
    });

    describe('Night Terror', () => {
        const ability = rawAbility('Night Terror', 'Spell',
            'Once per long rest, choose any targets within Very Close range to perceive you as a nightmarish horror. The targets must succeed on a **Reaction Roll (16)** or become temporarily Horrified. While Horrified, they\'re Vulnerable. Steal a number of Fear from the GM equal to the number of targets that are Horrified (up to the number of Fear in the GM\'s pool). Roll a number of **d6s** equal to the number of stolen Fear and deal the total damage to each Horrified target. Discard the stolen Fear.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.frequency).toBe('once_per_long_rest');
        });

        it('should be action_type attack', () => {
            expect(enhanced.action_type).toBe('attack');
        });
    });

    describe('Twilight Toll', () => {
        const ability = rawAbility('Twilight Toll', 'Ability',
            'Choose a target within Far range. When you succeed on an **action roll** against them that doesn\'t result in making a damage roll, place a token on this card. When you deal damage to this target, spend any number of tokens to add a **d12** for each token spent to your damage roll. You can only hold Twilight Toll on one creature at a time.\n\nWhen you choose a new target or take a rest, clear all unspent tokens.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have has_tokens = true', () => {
            expect(enhanced.has_tokens).toBe(true);
        });

        it('should be action_type passive', () => {
            expect(enhanced.action_type).toBe('passive');
        });
    });

    describe('Eclipse', () => {
        const ability = rawAbility('Eclipse', 'Spell',
            'Make a **Spellcast Roll (16)**. Once per long rest on a success, plunge the entire area within Far range into complete darkness only you and your allies can see through. Attack rolls have disadvantage when targeting you or an ally within this shadow.\n\nAdditionally, when you or an ally succeeds with Hope against an adversary within this shadow, the target must **mark a Stress**.\n\nThis spell lasts until the GM spends a Fear on their turn to clear this effect or you take Severe damage.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.frequency).toBe('once_per_long_rest');
        });

        it('should have roll.difficulty = 16', () => {
            expect(enhanced.roll?.difficulty).toBe(16);
        });
    });

    describe('Specter of the Dark', () => {
        const ability = rawAbility('Specter of the Dark', 'Spell',
            '**Mark a Stress** to become Spectral until you make an **action roll** targeting another creature. While Spectral, you\'re immune to physical damage and can float and pass through solid objects. Other creatures can still see you while you\'re in this form.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });

        it('should be action_type utility', () => {
            expect(enhanced.action_type).toBe('utility');
        });
    });
});
