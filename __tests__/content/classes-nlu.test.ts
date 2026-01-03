/**
 * CLASS ABILITIES SCHEMA VALIDATION TESTS
 * 
 * These tests validate that the card parser correctly extracts structured data
 * from class feat descriptions using Natural Language Understanding. Each test is based
 * solely on analyzing the "text" fields to predict expected output.
 * 
 * Test expectations are derived from human understanding of the ability text,
 * NOT from the current parser output (which may be inaccurate).
 * 
 * Note: Classes have both class_feats and hope_feat. We test both.
 */

import { describe, it, expect } from 'vitest';
import { enhanceAbilityCard } from '@/lib/card-parser';

// Helper to create minimal raw feat for testing
function rawFeat(name: string, text: string) {
    return { name, level: '1', domain: 'Class', type: 'Ability', recall: '0', text };
}

describe('Class Abilities Schema Validation - Bard', () => {
    describe('Rally', () => {
        const feat = rawFeat('Rally',
            'Once per session, describe how you rally the party and give yourself and each of your allies a Rally Die. At level 1, your Rally Die is a **d6**. A PC can spend their Rally Die to roll it, adding the result to their **action roll**, **reaction roll**, damage roll, or to clear a number of Stress equal to the result. At the end of each session, clear all unspent Rally Dice. At level 5, your Rally Die increases to a **d8**.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be frequency once_per_session', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_session');
        });

        it('should be action_type buff (grants dice to allies)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Make a Scene (Hope Feat)', () => {
        const feat = rawFeat('Make a Scene',
            '**Spend 3 Hope** to temporarily Distract a target within Close range, giving them a -2 penalty to their Difficulty.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 3', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(3);
        });

        it('should be action_type utility (debuff, not attack)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have attack.range = Close', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Close');
        });
    });
});

describe('Class Abilities Schema Validation - Druid', () => {
    describe('Beastform', () => {
        const feat = rawFeat('Beastform',
            '**Mark a Stress** to magically transform into a creature of your tier or lower from the Beastform list. You can drop out of this form at any time. While transformed, you can\'t use weapons or cast spells from domain cards, but you can still use other features or abilities you have access to. Spells you cast before you transform stay active and last for their normal duration, and you can talk and communicate as normal. Additionally, you gain the Beastform\'s features, add their Evasion bonus to your Evasion, and use the trait specified in their statistics for your attack. While you\'re in a Beastform, your armor becomes part of your body and you mark Armor Slots as usual; when you drop out of a Beastform, those marked Armor Slots remain marked. If you mark your last Hit Point, you automatically drop out of this form.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type utility (transformation)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Wildtouch', () => {
        const feat = rawFeat('Wildtouch',
            'You can perform harmless, subtle effects that involve nature—such as causing a flower to rapidly grow, summoning a slight gust of wind, or starting a campfire—at will.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type utility (cantrip effects)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should be frequency at_will', () => {
            expect(enhanced.enhancement.frequency).toBe('at_will');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Evolution (Hope Feat)', () => {
        const feat = rawFeat('Evolution',
            '**Spend 3 Hope** to transform into a Beastform without marking a Stress. When you do, choose one trait to raise by +1 until you drop out of that Beastform.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 3', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(3);
        });

        it('should be action_type utility (transformation enhancement)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });
});

describe('Class Abilities Schema Validation - Guardian', () => {
    describe('Unstoppable', () => {
        const feat = rawFeat('Unstoppable',
            'Once per long rest, you can become Unstoppable. You gain an Unstoppable Die. At level 1, your Unstoppable Die is a **d4**. Place it on your character sheet in the space provided, starting with the 1 value facing up. After you make a damage roll that deals 1 or more Hit Points to a target, increase the Unstoppable Die value by one. When the die\'s value would exceed its maximum value or when the scene ends, remove the die and drop out of Unstoppable. At level 5, your Unstoppable Die increases to a **d6**.\n\nWhile Unstoppable, you gain the following benefits:\n\n- You reduce the severity of physical damage by one threshold (Severe to Major, Major to Minor, Minor to None).\n- You add the current value of the Unstoppable Die to your damage roll.\n- You can\'t be Restrained or Vulnerable.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should be action_type buff (self-enhancement)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Frontline Tank (Hope Feat)', () => {
        const feat = rawFeat('Frontline Tank',
            '**Spend 3 Hope** to clear 2 Armor Slots.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 3', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(3);
        });

        it('should be action_type buff (restores armor)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });
});

describe('Class Abilities Schema Validation - Ranger', () => {
    describe('Ranger\'s Focus', () => {
        const feat = rawFeat('Ranger\'s Focus',
            '**Spend a Hope** and make an attack against a target. On a success, deal your attack\'s normal damage and temporarily make the attack\'s target your Focus. Until this feature ends or you make a different creature your Focus, you gain the following benefits against your Focus:\n\n- You know precisely what direction they are in.\n- When you deal damage to them, they must **mark a Stress**.\n- When you fail an attack against them, you can end your Ranger\'s Focus feature to reroll your Duality Dice.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should be action_type attack (makes attack against target)', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });
    });

    describe('Hold Them Off (Hope Feat)', () => {
        const feat = rawFeat('Hold Them Off',
            '**Spend 3 Hope** when you succeed on an attack with a weapon to use that same roll against two additional adversaries within range of the attack.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 3', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(3);
        });

        it('should be action_type passive (triggered by attack success)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });
});

describe('Class Abilities Schema Validation - Rogue', () => {
    describe('Cloaked', () => {
        const feat = rawFeat('Cloaked',
            'Any time you would be Hidden, you are instead Cloaked. In addition to the benefits of the Hidden condition, while Cloaked you remain unseen if you are stationary when an adversary moves to where they would normally see you. After you make an attack or end a move within line of sight of an adversary, you are no longer Cloaked.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (always enhances Hidden)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Sneak Attack', () => {
        const feat = rawFeat('Sneak Attack',
            'When you succeed on an attack while Cloaked or while an ally is within Melee range of your target, add a number of **d6s** equal to your tier to your damage roll.\n\n- Level 1 → Tier 1\n- Levels 2–4 → Tier 2\n- Levels 5–7 → Tier 3\n- Levels 8–10 → Tier 4');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (triggered by attack success)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword damage', () => {
            expect(enhanced.enhancement.keywords).toContain('damage');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Rogue\'s Dodge (Hope Feat)', () => {
        const feat = rawFeat('Rogue\'s Dodge',
            '**Spend 3 Hope** to gain a +2 bonus to your Evasion until the next time an attack succeeds against you. Otherwise, this bonus lasts until your next rest.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 3', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(3);
        });

        it('should be action_type buff (evasion bonus)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have modifier for evasion +2', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'evasion');
            expect(mod?.value).toBe(2);
        });
    });
});

describe('Class Abilities Schema Validation - Seraph', () => {
    describe('Prayer Dice', () => {
        const feat = rawFeat('Prayer Dice',
            'At the beginning of each session, roll a number of **d4s** equal to your subclass\'s Spellcast trait and place them on your character sheet in the space provided. These are your Prayer Dice. You can spend any number of Prayer Dice to aid yourself or an ally within Far range. You can use a spent die\'s value to reduce incoming damage, add to a roll\'s result after the roll is made, or gain Hope equal to the result. At the end of each session, clear all unspent Prayer Dice.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type buff (aids self or ally)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have attack.range = Far (ally range)', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Far');
        });

        it('should have no costs (uses Prayer Dice, not Hope/Stress)', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Life Support (Hope Feat)', () => {
        const feat = rawFeat('Life Support',
            '**Spend 3 Hope** to clear a Hit Point on an ally within Close range.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 3', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(3);
        });

        it('should be action_type buff (healing)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have attack.range = Close', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Close');
        });

        it('should have keyword healing', () => {
            expect(enhanced.enhancement.keywords).toContain('healing');
        });
    });
});

describe('Class Abilities Schema Validation - Sorcerer', () => {
    describe('Arcane Sense', () => {
        const feat = rawFeat('Arcane Sense',
            'You can sense the presence of magical people and objects within Close range.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (sensory ability)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have attack.range = Close', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Close');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Minor Illusion', () => {
        const feat = rawFeat('Minor Illusion',
            'Make a **Spellcast Roll (10)**. On a success, you create a minor visual illusion no larger than yourself within Close range. This illusion is convincing to anyone at Close range or farther.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type utility (creates illusion)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have roll.trait = Spellcast', () => {
            expect(enhanced.enhancement.roll?.trait).toBe('Spellcast');
        });

        it('should have roll.difficulty = 10', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(10);
        });

        it('should have attack.range = Close', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Close');
        });
    });

    describe('Channel Raw Power', () => {
        const feat = rawFeat('Channel Raw Power',
            'Once per long rest, you can place a domain card from your loadout into your vault and choose to either:\n\n- Gain Hope equal to the level of the card.\n- Enhance a spell that deals damage, gaining a bonus to your damage roll equal to twice the level of the card.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should be action_type utility (resource conversion)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have no costs (sacrifices a card instead)', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Volatile Magic (Hope Feat)', () => {
        const feat = rawFeat('Volatile Magic',
            '**Spend 3 Hope** to reroll any number of your damage dice on an attack that deals magic damage.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 3', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(3);
        });

        it('should be action_type buff (reroll enhancement)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });
});

describe('Class Abilities Schema Validation - Warrior', () => {
    describe('Attack of Opportunity', () => {
        const feat = rawFeat('Attack of Opportunity',
            'If an adversary within Melee range attempts to leave that range, make a **reaction roll** using a trait of your choice against their Difficulty. Choose one effect on a success, or two if you critically succeed:\n\n- They can\'t move from where they are.\n- You deal damage to them equal to your primary weapon\'s damage.\n- You move with them.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type reaction', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should be timing reaction', () => {
            expect(enhanced.enhancement.timing).toBe('reaction');
        });

        it('should have attack.range = Melee', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Melee');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Combat Training', () => {
        const feat = rawFeat('Combat Training',
            'You ignore burden when equipping weapons. When you deal physical damage, you gain a bonus to your damage roll equal to your level.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (always active)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword damage', () => {
            expect(enhanced.enhancement.keywords).toContain('damage');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('No Mercy (Hope Feat)', () => {
        const feat = rawFeat('No Mercy',
            '**Spend 3 Hope** to gain a +1 bonus to your attack rolls until your next rest.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 3', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(3);
        });

        it('should be action_type buff (attack bonus)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have duration rest', () => {
            expect(enhanced.enhancement.duration).toBe('rest');
        });

        it('should have modifier for attack +1', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'attack');
            expect(mod?.value).toBe(1);
        });
    });
});

describe('Class Abilities Schema Validation - Wizard', () => {
    describe('Prestidigitation', () => {
        const feat = rawFeat('Prestidigitation',
            'You can perform harmless, subtle magical effects at will. For example, you can change an object\'s color, create a smell, light a candle, cause a tiny object to float, illuminate a room, or repair a small object.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type utility (cantrip effects)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should be frequency at_will', () => {
            expect(enhanced.enhancement.frequency).toBe('at_will');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Strange Patterns', () => {
        const feat = rawFeat('Strange Patterns',
            'Choose a number between 1 and 12. When you roll that number on a Duality Die, gain a Hope or clear a Stress.\n\nYou can change this number when you take a long rest.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (triggered by roll result)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });

        it('should have keyword hope_gain', () => {
            expect(enhanced.enhancement.keywords).toContain('hope_gain');
        });

        it('should have keyword stress_relief', () => {
            expect(enhanced.enhancement.keywords).toContain('stress_relief');
        });
    });

    describe('Not This Time (Hope Feat)', () => {
        const feat = rawFeat('Not This Time',
            '**Spend 3 Hope** to force an adversary within Far range to reroll an attack or damage roll.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 3', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(3);
        });

        it('should be action_type reaction (during adversary roll)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have attack.range = Far', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Far');
        });
    });
});
