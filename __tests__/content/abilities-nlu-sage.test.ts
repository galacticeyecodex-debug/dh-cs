/**
 * ABILITIES SCHEMA VALIDATION TESTS - SAGE DOMAIN
 */

import { describe, it, expect } from 'vitest';
import { enhanceAbilityCard } from '@/lib/card-parser';

function rawAbility(name: string, type: string, text: string) {
    return { name, level: '1', domain: 'Sage', type, recall: '0', text };
}

describe('Abilities Schema Validation - Sage Domain', () => {
    describe('Gifted Tracker', () => {
        const ability = rawAbility('Gifted Tracker', 'Ability',
            'When you\'re tracking a specific creature or group of creatures based on signs of their passage, you can **spend any number of Hope** and ask the GM that many questions from the following list.\n\n- What direction did they go?\n- How long ago did they pass through?\n- What were they doing in this location?\n- How many of them were here?\n\nWhen you encounter creatures you\'ve tracked in this way, gain a +1 bonus to your Evasion against them.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have modifier for evasion +1', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'evasion');
            expect(mod?.value).toBe(1);
        });
    });

    describe('Nature\'s Tongue', () => {
        const ability = rawAbility('Nature\'s Tongue', 'Ability',
            'You can speak the language of the natural world. When you want to speak to the plants and animals around you, make an **Instinct Roll (12)**. On a success, they\'ll give you the information they know. On a roll with Fear, their knowledge might be limited or come at a cost.\n\nAdditionally, before you make a **Spellcast Roll** while within a natural environment, you can **spend a Hope** to gain a +2 bonus to the roll.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should have roll.difficulty = 12', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(12);
        });
    });

    describe('Vicious Entangle', () => {
        const ability = rawAbility('Vicious Entangle', 'Spell',
            'Make a **Spellcast Roll** against a target within Far range. On a success, roots and vines reach out from the ground, dealing **1d8+1** physical damage and temporarily Restraining the target.\n\nAdditionally on a success, you can **spend a Hope** to temporarily Restrain another adversary within Very Close range of your target.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should be action_type attack', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should have attack.damage_type = physical', () => {
            expect(enhanced.enhancement.attack?.damage_type).toBe('physical');
        });
    });

    describe('Conjure Swarm', () => {
        const ability = rawAbility('Conjure Swarm', 'Spell',
            'Tekaira Armored Beetles: **Mark a Stress** to conjure armored beetles that encircle you. When you next take damage, reduce the severity by one threshold. You can **spend a Hope** to keep the beetles conjured after taking damage.\n\nFire Flies: Make a **Spellcast Roll** against all adversaries within Close range. **Spend a Hope** to deal **2d8+3** magic damage to targets you succeed against.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should have attack.targets = all_in_range', () => {
            expect(enhanced.enhancement.attack?.targets).toBe('all_in_range');
        });
    });

    describe('Natural Familiar', () => {
        const ability = rawAbility('Natural Familiar', 'Spell',
            '**Spend a Hope** to summon a small nature spirit or forest critter to your side until your next rest, you cast Natural Familiar again, or the familiar is targeted by an attack. If you **spend an additional Hope**, you can summon a familiar that flies. You can communicate with them, make a **Spellcast Roll** to command them to perform simple tasks, and **mark a Stress** to see through their eyes.\n\nWhen you deal damage to an adversary within Melee range of your familiar, you add a **d6** to your damage roll.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should have duration = rest', () => {
            expect(enhanced.enhancement.duration).toBe('rest');
        });
    });

    describe('Corrosive Projectile', () => {
        const ability = rawAbility('Corrosive Projectile', 'Spell',
            'Make a **Spellcast Roll** against a target within Far range. On a success, deal **6d4** magic damage using your Proficiency. Additionally, **mark 2 or more Stress** to make them permanently Corroded. While a target is Corroded, they gain a –1 penalty to their Difficulty for every 2 Stress you spent. This condition can stack.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type attack', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should have attack.damage_type = magic', () => {
            expect(enhanced.enhancement.attack?.damage_type).toBe('magic');
        });
    });

    describe('Towering Stalk', () => {
        const ability = rawAbility('Towering Stalk', 'Spell',
            'Once per rest, you can conjure a thick, twisting stalk within Close range that can be easily climbed. Its height can grow up to Far range.\n\n**Mark a Stress** to use this spell as an attack. Make a **Spellcast Roll** against an adversary or group of adversaries within Close range. The erupting stalk lifts targets you succeed against into the air and drops them, dealing **d8** physical damage using your Proficiency.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });
    });

    describe('Death Grip', () => {
        const ability = rawAbility('Death Grip', 'Spell',
            'Make a **Spellcast Roll** against a target within Close range and choose one of the following options:\n\n- You pull the target into Melee range or pull yourself into Melee range of them.\n- You constrict the target and force them to **mark 2 Stress**.\n- All adversaries between you and the target must succeed on a **Reaction Roll (13)** or be hit by vines, taking **3d6+2** physical damage.\n\nOn a success, vines reach out from your hands, causing the chosen effect and temporarily Restraining the target.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have roll.target_reaction = true', () => {
            expect(enhanced.enhancement.roll?.target_reaction).toBe(true);
        });

        it('should have roll.difficulty = 13', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(13);
        });
    });

    describe('Healing Field', () => {
        const ability = rawAbility('Healing Field', 'Spell',
            'Once per long rest, you can conjure a field of healing plants around you. Everywhere within Close range of you bursts to life with vibrant nature, allowing you and all allies in the area to clear a Hit Point.\n\n**Spend 2 Hope** to allow you and all allies to clear 2 Hit Points instead.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should have costs.hope = 2', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(2);
        });

        it('should be action_type buff', () => {
            expect(enhanced.enhancement.action_type).toBe('buff');
        });
    });

    describe('Thorn Skin', () => {
        const ability = rawAbility('Thorn Skin', 'Spell',
            'Once per rest, **spend a Hope** to sprout thorns all over your body. When you do, place a number of tokens equal to your Spellcast trait on this card. When you take damage, you can spend any number of tokens to roll that number of **d6s**. Add the results together and reduce the incoming damage by that amount. If you\'re within Melee range of the attacker, deal that amount of damage back to them.\n\nWhen you take a rest, clear all unspent tokens.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should have has_tokens = true', () => {
            expect(enhanced.enhancement.has_tokens).toBe(true);
        });

        it('should have token_source = spellcast', () => {
            expect(enhanced.enhancement.token_source).toBe('spellcast');
        });
    });

    describe('Wild Fortress', () => {
        const ability = rawAbility('Wild Fortress', 'Spell',
            'Make a **Spellcast Roll (13)**. On a success, **spend 2 Hope** to grow a natural barricade in the shape of a dome that you and one ally can take cover within. While inside the dome, a creature can\'t be targeted by attacks and can\'t make attacks. Attacks made against the dome automatically succeed. The dome has the following damage thresholds and lasts until it marks 3 Hit Points. Place tokens on this card to represent marking Hit Points.\n\n**Thresholds: 15/30**');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 2', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(2);
        });

        it('should have has_tokens = true', () => {
            expect(enhanced.enhancement.has_tokens).toBe(true);
        });

        it('should have roll.difficulty = 13', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(13);
        });
    });

    describe('Conjured Steeds', () => {
        const ability = rawAbility('Conjured Steeds', 'Spell',
            '**Spend any number of Hope** to conjure that many magical steeds (such as horses, camels, or elephants) that you and your allies can ride until your next long rest or the steeds take any damage. The steeds double your land speed while traveling and, when in danger, allow you to move within Far range without having to roll. Creatures riding a steed gain a –2 penalty to attack rolls and a +2 bonus to damage rolls.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type utility', () => {
            expect(enhanced.enhancement.action_type).toBe('utility');
        });

        it('should have modifier for damage +2', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'damage');
            expect(mod?.value).toBe(2);
        });
    });

    describe('Forager', () => {
        const ability = rawAbility('Forager', 'Ability',
            'As an additional downtime move you can choose, roll a **d6** to see what you forage. Work with the GM to describe it and add it to your inventory as a consumable. Your party can carry up to five foraged consumables at a time.\n\n1. An unusual flower (Clear 2 Stress)\n1. A beautiful relic (Gain 2 Hope)\n1. An arcane rune (+2 to a **Spellcast Roll**)\n1. A healing vial (Clear 2 Hit Points)\n1. A luck charm (Reroll any die)\n1. Choose one of the options above.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type downtime', () => {
            expect(enhanced.enhancement.action_type).toBe('downtime');
        });
    });

    describe('Sage-Touched', () => {
        const ability = rawAbility('Sage-Touched', 'Ability',
            'When 4 or more of the domain cards in your loadout are from the Sage domain, gain the following benefits:\n\n- While you\'re in a natural environment, you gain a +2 bonus to your **Spellcast Rolls**.\n- Once per rest, you can double your Agility or Instinct when making a roll that uses that trait. You must choose to do this before you roll.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should have modifier for spellcast +2 with loadout condition', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'spellcast');
            expect(mod?.value).toBe(2);
            expect(mod?.condition?.type).toBe('loadout_domain_count');
            expect(mod?.condition?.minCount).toBe(4);
        });
    });

    describe('Wild Surge', () => {
        const ability = rawAbility('Wild Surge', 'Spell',
            'Once per long rest, **mark a Stress** to channel the natural world around you and enhance yourself. Describe how your appearance changes, then place a **d6** on this card with the 1 value facing up.\n\nWhile the Wild Surge Die is active, you add its value to every **action roll** you make. After you add its value to a roll, increase the Wild Surge Die\'s value by one. When the die\'s value would exceed 6 or you take a rest, this form drops and you must **mark an additional Stress**.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });
    });

    describe('Forest Sprites', () => {
        const ability = rawAbility('Forest Sprites', 'Spell',
            'Make a **Spellcast Roll (13)**. On a success, **spend any number of Hope** to create an equal number of small forest sprites who appear at points you choose within Far range, providing the following benefits:\n\n- Your allies gain a +3 bonus to attack rolls against adversaries within Melee range of a sprite.\n- An ally who marks an Armor Slot while within Melee range of a sprite can mark an additional Armor Slot.\n\nA sprite vanishes after granting a benefit or taking any damage.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have modifier for attack +3', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'attack');
            expect(mod?.value).toBe(3);
        });

        it('should have roll.difficulty = 13', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(13);
        });
    });

    describe('Rejuvenation Barrier', () => {
        const ability = rawAbility('Rejuvenation Barrier', 'Spell',
            'Make a **Spellcast Roll (15)**. Once per rest on a success, create a temporary barrier of protective energy around you at Very Close range. You and all allies within the barrier when this spell is cast clear **1d4** Hit Points. While the barrier is up, you and all allies within have resistance to physical damage from outside the barrier.\n\nWhen you move, the barrier follows you.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should have roll.difficulty = 15', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(15);
        });
    });

    describe('Fane of the Wilds', () => {
        const ability = rawAbility('Fane of the Wilds', 'Ability',
            'After a long rest, place a number of tokens equal to the number of Sage domain cards in your loadout and vault on this card.\n\nWhen you would make a **Spellcast Roll**, you can spend any number of tokens after the roll to gain a +1 bonus for each token spent.\n\nWhen you critically succeed on a **Spellcast Roll** for a Sage domain spell, gain a token.\n\nWhen you take a long rest, clear all unspent tokens.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have has_tokens = true', () => {
            expect(enhanced.enhancement.has_tokens).toBe(true);
        });

        it('should be action_type passive', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });
    });

    describe('Plant Dominion', () => {
        const ability = rawAbility('Plant Dominion', 'Spell',
            'Make a **Spellcast Roll (18)**. Once per long rest on a success, you reshape the natural world, changing the surrounding plant life anywhere within Far range of you. For example, you can grow trees instantly, clear a path through dense vines, or create a wall of roots.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should have roll.difficulty = 18', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(18);
        });
    });

    describe('Force of Nature', () => {
        const ability = rawAbility('Force of Nature', 'Spell',
            '**Mark a Stress** to transform into a hulking nature spirit, gaining the following benefits:\n\n- When you succeed on an attack or **Spellcast Roll**, gain a +10 bonus to the damage roll.\n- When you deal enough damage to defeat a creature within Close range, you absorb them and clear an Armor Slot.\n- You can\'t be Restrained.\n\nBefore you make an **action roll**, you must **spend a Hope**. If you can\'t, you revert to your normal form.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should have modifier for damage +10', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'damage');
            expect(mod?.value).toBe(10);
        });
    });

    describe('Tempest', () => {
        const ability = rawAbility('Tempest', 'Spell',
            'Choose one of the following tempests and make a **Spellcast Roll** against all targets within Far range. Targets you succeed against experience its effects until the GM spends a Fear on their turn to end this spell.\n\n- **Blizzard**: Deal **2d20+8** magic damage and targets are temporarily Vulnerable.\n- **Hurricane**: Deal **3d10+10** magic damage and choose a direction the wind is blowing. Targets can\'t move against the wind.\n- **Sandstorm**: Deal **5d6+9** magic damage. Attacks made from beyond Melee range have disadvantage.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type attack', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should have attack.targets = all_in_range', () => {
            expect(enhanced.enhancement.attack?.targets).toBe('all_in_range');
        });

        it('should have attack.damage_type = magic', () => {
            expect(enhanced.enhancement.attack?.damage_type).toBe('magic');
        });
    });
});
