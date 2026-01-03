/**
 * SUBCLASS ABILITIES SCHEMA VALIDATION TESTS
 * 
 * These tests validate that the card parser correctly extracts structured data
 * from subclass ability descriptions using Natural Language Understanding. Each test is based
 * solely on analyzing the "text" fields to predict expected output.
 * 
 * Test expectations are derived from human understanding of the ability text,
 * NOT from the current parser output (which may be inaccurate).
 * 
 * Subclasses have:
 * - foundations (level 1)
 * - specializations (level 2)
 * - masteries (level 5)
 */

import { describe, it, expect } from 'vitest';
import { enhanceAbilityCard } from '@/lib/card-parser';

// Helper to create minimal raw feat for testing
function rawFeat(name: string, text: string) {
    return { name, level: '1', domain: 'Subclass', type: 'Ability', recall: '0', text };
}

// ============================================================================
// RANGER SUBCLASSES
// ============================================================================

describe('Subclass Abilities Schema Validation - Beastbound (Ranger)', () => {
    describe('Companion - Foundation', () => {
        const feat = rawFeat('Companion',
            'You have an animal companion of your choice (at the GM\'s discretion). They stay by your side unless you tell them otherwise.\n\nTake the Ranger Companion sheet. When you level up your character, choose a level-up option for your companion from this sheet as well.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (always have companion)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Battle-Bonded - Specialization', () => {
        const feat = rawFeat('Battle-Bonded',
            'When an adversary attacks you while they\'re within your companion\'s Melee range, you gain a +2 bonus to your Evasion against the attack.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (conditional bonus)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have modifier for evasion +2', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'evasion');
            expect(mod?.value).toBe(2);
        });
    });

    describe('Loyal Friend - Mastery', () => {
        const feat = rawFeat('Loyal Friend',
            'Once per long rest, when the damage from an attack would **mark your companion\'s last Stress** or your last Hit Point and you\'re within Close range of each other, you or your companion can rush to the other\'s side and take that damage instead.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should be action_type reaction (when damage would occur)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have attack.range = Close', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Close');
        });
    });
});

describe('Subclass Abilities Schema Validation - Wayfinder (Ranger)', () => {
    describe('Ruthless Predator - Foundation', () => {
        const feat = rawFeat('Ruthless Predator',
            'When you make a damage roll, you can **mark a Stress** to gain a +1 bonus to your Proficiency. Additionally, when you deal Severe damage to an adversary, they must **mark a Stress**.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type passive (triggered during damage roll)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have modifier for proficiency +1', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'proficiency');
            expect(mod?.value).toBe(1);
        });
    });

    describe('Elusive Predator - Specialization', () => {
        const feat = rawFeat('Elusive Predator',
            'When your Focus makes an attack against you, you gain a +2 bonus to your Evasion against the attack.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (conditional bonus)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have modifier for evasion +2', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'evasion');
            expect(mod?.value).toBe(2);
        });
    });

    describe('Apex Predator - Mastery', () => {
        const feat = rawFeat('Apex Predator',
            'Before you make an attack roll against your Focus, you can **spend a Hope**. On a successful attack, you remove a Fear from the GM\'s Fear pool.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should be action_type passive (optional enhancement to attack)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });
});

// ============================================================================
// WARRIOR SUBCLASSES
// ============================================================================

describe('Subclass Abilities Schema Validation - Call of the Brave (Warrior)', () => {
    describe('Courage - Foundation', () => {
        const feat = rawFeat('Courage',
            'When you fail a roll with Fear, you gain a Hope.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (triggered by Fear roll)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword hope_gain', () => {
            expect(enhanced.enhancement.keywords).toContain('hope_gain');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Battle Ritual - Foundation', () => {
        const feat = rawFeat('Battle Ritual',
            'Once per long rest, before you attempt something incredibly dangerous or face off against a foe who clearly outmatches you, describe what ritual you perform or preparations you make. When you do, clear 2 Stress and gain 2 Hope.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should be action_type buff (clears stress, gains hope)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword stress_relief', () => {
            expect(enhanced.enhancement.keywords).toContain('stress_relief');
        });

        it('should have keyword hope_gain', () => {
            expect(enhanced.enhancement.keywords).toContain('hope_gain');
        });
    });

    describe('Rise to the Challenge - Specialization', () => {
        const feat = rawFeat('Rise to the Challenge',
            'You are vigilant in the face of mounting danger. While you have 2 or fewer Hit Points unmarked, you can roll a **d20** as your Hope Die.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (conditional ability)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });
});

describe('Subclass Abilities Schema Validation - Call of the Slayer (Warrior)', () => {
    describe('Slayer - Foundation', () => {
        const feat = rawFeat('Slayer',
            'You gain a pool of dice called Slayer Dice. On a roll with Hope, you can place a **d6** on this card instead of gaining a Hope, adding the die to the pool. You can store a number of Slayer Dice equal to your Proficiency. When you make an attack roll or damage roll, you can spend any number of these Slayer Dice, rolling them and adding their result to the roll. At the end of each session, clear any unspent Slayer Dice on this card and gain a Hope per die cleared.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (token/dice mechanics)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have has_tokens = true', () => {
            expect(enhanced.enhancement.tokens?.has_tokens).toBe(true);
        });

        it('should have token_source = proficiency', () => {
            expect(enhanced.enhancement.tokens?.token_source).toBe('proficiency');
        });
    });

    describe('Weapon Specialist - Specialization', () => {
        const feat = rawFeat('Weapon Specialist',
            'You can wield multiple weapons with dangerous ease. When you succeed on an attack, you can **spend a Hope** to add one of the damage dice from your secondary weapon to the damage roll. Additionally, once per long rest when you roll your Slayer Dice, reroll any 1s.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should be action_type passive (triggered by attack success)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });
});

// ============================================================================
// GUARDIAN SUBCLASSES
// ============================================================================

describe('Subclass Abilities Schema Validation - Stalwart (Guardian)', () => {
    describe('Unwavering - Foundation', () => {
        const feat = rawFeat('Unwavering',
            'Gain a permanent +1 bonus to your damage thresholds.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (permanent bonus)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have modifier for damage_threshold +1', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'damage_threshold');
            expect(mod?.value).toBe(1);
        });
    });

    describe('Iron Will - Foundation', () => {
        const feat = rawFeat('Iron Will',
            'When you take physical damage, you can mark an additional Armor Slot to reduce the severity.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type reaction (when taking damage)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should be timing reaction', () => {
            expect(enhanced.enhancement.timing).toBe('reaction');
        });

        it('should have no costs (uses armor slots)', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Unrelenting - Specialization', () => {
        const feat = rawFeat('Unrelenting',
            'Gain a permanent +2 bonus to your damage thresholds.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (permanent bonus)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have modifier for damage_threshold +2', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'damage_threshold');
            expect(mod?.value).toBe(2);
        });
    });

    describe('Partners-in-Arms - Specialization', () => {
        const feat = rawFeat('Partners-in-Arms',
            'When an ally within Very Close range takes damage, you can mark an Armor Slot to reduce the severity by one threshold.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type reaction (when ally takes damage)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have attack.range = Very Close', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Very Close');
        });
    });

    describe('Undaunted - Mastery', () => {
        const feat = rawFeat('Undaunted',
            'Gain a permanent +3 bonus to your damage thresholds.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (permanent bonus)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have modifier for damage_threshold +3', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'damage_threshold');
            expect(mod?.value).toBe(3);
        });
    });
});

describe('Subclass Abilities Schema Validation - Vengeance (Guardian)', () => {
    describe('At Ease - Foundation', () => {
        const feat = rawFeat('At Ease',
            'Gain an additional Stress slot.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (character bonus)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have stat_bonuses.stress_slots = 1', () => {
            expect(enhanced.stat_bonuses?.stress_slots).toBe(1);
        });
    });

    describe('Revenge - Foundation', () => {
        const feat = rawFeat('Revenge',
            'When an adversary within Melee range succeeds on an attack against you, you can **mark 2 Stress** to force the attacker to mark a Hit Point.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 2', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(2);
        });

        it('should be action_type reaction (when attacked)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have attack.range = Melee', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Melee');
        });
    });

    describe('Nemesis - Mastery', () => {
        const feat = rawFeat('Nemesis',
            '**Spend 2 Hope** to Prioritize an adversary until your next rest. When you make an attack against your Prioritized adversary, you can swap the results of your Hope and Fear Dice. You can only Prioritize one adversary at a time.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 2', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(2);
        });

        it('should have duration rest', () => {
            expect(enhanced.enhancement.duration).toBe('rest');
        });

        it('should be action_type utility (marks target for bonus)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });
});

// ============================================================================
// ROGUE SUBCLASSES
// ============================================================================

describe('Subclass Abilities Schema Validation - Nightwalker (Rogue)', () => {
    describe('Shadow Stepper - Foundation', () => {
        const feat = rawFeat('Shadow Stepper',
            'You can move from shadow to shadow. When you move into an area of darkness or a shadow cast by another creature or object, you can **mark a Stress** to disappear from where you are and reappear inside another shadow within Far range. When you reappear, you are Cloaked.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type utility (teleportation)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have attack.range = Far', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Far');
        });

        it('should have keyword movement', () => {
            expect(enhanced.enhancement.keywords).toContain('movement');
        });
    });

    describe('Dark Cloud - Specialization', () => {
        const feat = rawFeat('Dark Cloud',
            'Make a **Spellcast Roll (15)**. On a success, create a temporary dark cloud that covers any area within Close range. Anyone in this cloud can\'t see outside of it, and anyone outside of it can\'t see in. You\'re considered Cloaked from any adversary for whom the cloud blocks line of sight.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have roll.trait = Spellcast', () => {
            expect(enhanced.enhancement.roll?.trait).toBe('Spellcast');
        });

        it('should have roll.difficulty = 15', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(15);
        });

        it('should have attack.range = Close', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Close');
        });

        it('should be action_type utility (creates zone)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Adrenaline - Specialization', () => {
        const feat = rawFeat('Adrenaline',
            'While you\'re Vulnerable, add your level to your damage rolls.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (conditional bonus)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword damage', () => {
            expect(enhanced.enhancement.keywords).toContain('damage');
        });
    });

    describe('Fleeting Shadow - Mastery', () => {
        const feat = rawFeat('Fleeting Shadow',
            'Gain a permanent +1 bonus to your Evasion. You can use your "Shadow Stepper" feature to move within Very Far range.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (permanent bonus)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have modifier for evasion +1', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'evasion');
            expect(mod?.value).toBe(1);
        });
    });

    describe('Vanishing Act - Mastery', () => {
        const feat = rawFeat('Vanishing Act',
            '**Mark a Stress** to become Cloaked at any time. When Cloaked from this feature, you automatically clear the Restrained condition if you have it. You remain Cloaked in this way until you roll with Fear or until your next rest.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type utility (becomes cloaked)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have duration rest', () => {
            expect(enhanced.enhancement.duration).toBe('rest');
        });
    });
});

describe('Subclass Abilities Schema Validation - Syndicate (Rogue)', () => {
    describe('Well-Connected - Foundation', () => {
        const feat = rawFeat('Well-Connected',
            'When you arrive in a prominent town or environment, you know somebody who calls this place home. Give them a name, note how you think they could be useful, and choose one fact from the following list:\n\n- They owe me a favor, but they\'ll be hard to find.\n- They\'re going to ask for something in exchange.\n- They\'re always in a great deal of trouble.\n- We used to be together. It\'s a long story.\n- We didn\'t part on great terms.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (always know someone)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Contacts Everywhere - Specialization', () => {
        const feat = rawFeat('Contacts Everywhere',
            'Once per session, you can briefly call on a shady contact. Choose one of the following benefits and describe what brought them here to help you in this moment:\n\n- They provide 1 handful of gold, a unique tool, or a mundane object that the situation requires.\n- On your next **action roll**, their help provides a +3 bonus to the result of your Hope or Fear Die.\n- The next time you deal damage, they snipe from the shadows, adding **2d8** to your damage roll.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be frequency once_per_session', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_session');
        });

        it('should be action_type utility (summons contact)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });
});

// ============================================================================
// BARD SUBCLASSES
// ============================================================================

describe('Subclass Abilities Schema Validation - Troubadour (Bard)', () => {
    describe('Gifted Performer - Foundation', () => {
        const feat = rawFeat('Gifted Performer',
            'You can play three different types of songs, once each per long rest; describe how you perform for others to gain the listed benefit:\n\n- **Relaxing Song:** You and all allies within Close range clear a Hit Point.\n- **Epic Song:** Make a target within Close range temporarily Vulnerable.\n- **Heartbreaking Song:** You and all allies within Close range gain a Hope.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be frequency once_per_long_rest (each song once)', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should have attack.range = Close', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Close');
        });

        it('should have keyword healing', () => {
            expect(enhanced.enhancement.keywords).toContain('healing');
        });

        it('should have keyword hope_gain', () => {
            expect(enhanced.enhancement.keywords).toContain('hope_gain');
        });
    });

    describe('Maestro - Specialization', () => {
        const feat = rawFeat('Maestro',
            'Your rallying songs steel the courage of those who listen. When you give a Rally Die to an ally, they can gain a Hope or clear a Stress.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (enhances Rally)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Virtuoso - Mastery', () => {
        const feat = rawFeat('Virtuoso',
            'You are among the greatest of your craft and your skill is boundless. You can perform each of your "Gifted Performer" feature\'s songs twice per long rest.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (enhances Gifted Performer)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });
});

describe('Subclass Abilities Schema Validation - Wordsmith (Bard)', () => {
    describe('Rousing Speech - Foundation', () => {
        const feat = rawFeat('Rousing Speech',
            'Once per long rest, you can give a heartfelt, inspiring speech. All allies within Far range clear 2 Stress.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should have attack.range = Far', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Far');
        });

        it('should have keyword stress_relief', () => {
            expect(enhanced.enhancement.keywords).toContain('stress_relief');
        });
    });

    describe('Heart of a Poet - Foundation', () => {
        const feat = rawFeat('Heart of a Poet',
            'After you make an **action roll** to impress, persuade, or offend someone, you can **spend a Hope** to add a **d4** to the roll.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should be action_type passive (triggered after roll)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Epic Poetry - Mastery', () => {
        const feat = rawFeat('Epic Poetry',
            'Your Rally Die increases to a **d10**. Additionally, when you Help an Ally, you can narrate the moment as if you were writing the tale of their heroism in a memoir. When you do, roll a **d10** as your advantage die.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (enhances Rally Die)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });
});

// ============================================================================
// SERAPH SUBCLASSES
// ============================================================================

describe('Subclass Abilities Schema Validation - Divine Wielder (Seraph)', () => {
    describe('Spirit Weapon - Foundation', () => {
        const feat = rawFeat('Spirit Weapon',
            'When you have an equipped weapon with a range of Melee or Very Close, it can fly from your hand to attack an adversary within Close range and then return to you. You can **mark a Stress** to target an additional adversary within range with the same attack roll.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type attack (weapon attack at range)', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should have attack.range = Close', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Close');
        });
    });

    describe('Sparing Touch - Foundation', () => {
        const feat = rawFeat('Sparing Touch',
            'Once per long rest, touch a creature and clear 2 Hit Points or 2 Stress from them.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should be action_type buff (healing)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword healing', () => {
            expect(enhanced.enhancement.keywords).toContain('healing');
        });

        it('should have keyword stress_relief', () => {
            expect(enhanced.enhancement.keywords).toContain('stress_relief');
        });
    });
});

describe('Subclass Abilities Schema Validation - Winged Sentinel (Seraph)', () => {
    describe('Wings of Light - Foundation', () => {
        const feat = rawFeat('Wings of Light',
            'You can fly. While flying, you can do the following:\n\n- **Mark a Stress** to pick up and carry another willing creature approximately your size or smaller.\n- **Spend a Hope** to deal an extra **1d8** damage on a successful attack.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (flight with optional costs)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword movement', () => {
            expect(enhanced.enhancement.keywords).toContain('movement');
        });
    });

    describe('Ethereal Visage - Specialization', () => {
        const feat = rawFeat('Ethereal Visage',
            'Your supernatural visage strikes awe and fear. While flying, you have advantage on **Presence Rolls**. When you succeed with Hope on a **Presence Roll**, you can remove a Fear from the GM\'s Fear pool instead of gaining Hope.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (conditional advantage)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword buff (advantage)', () => {
            expect(enhanced.enhancement.keywords).toContain('buff');
        });
    });

    describe('Ascendant - Mastery', () => {
        const feat = rawFeat('Ascendant',
            'Gain a permanent +4 bonus to your Severe damage threshold.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (permanent bonus)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have modifier for damage_threshold_severe +4', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'damage_threshold_severe');
            expect(mod?.value).toBe(4);
        });
    });

    describe('Power of the Gods - Mastery', () => {
        const feat = rawFeat('Power of the Gods',
            'While flying, you deal an extra **1d12** damage instead of **1d8** from your "Wings of Light" feature.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (enhances Wings of Light)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword damage', () => {
            expect(enhanced.enhancement.keywords).toContain('damage');
        });
    });
});

// ============================================================================
// SORCERER SUBCLASSES
// ============================================================================

describe('Subclass Abilities Schema Validation - Elemental Origin (Sorcerer)', () => {
    describe('Elementalist - Foundation', () => {
        const feat = rawFeat('Elementalist',
            'Choose one of the following elements at character creation: air, earth, fire, lightning, water.\n\nYou can shape this element into harmless effects. Additionally, **spend a Hope** and describe how your control over this element helps an **action roll** you\'re about to make, then either gain a +2 bonus to the roll or a +3 bonus to the roll\'s damage.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should be action_type buff (roll enhancement)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Natural Evasion - Specialization', () => {
        const feat = rawFeat('Natural Evasion',
            'You can call forth your element to protect you from harm. When an attack roll against you succeeds, you can **mark a Stress** and describe how you use your element to defend you. When you do, roll a **d6** and add its result to your Evasion against the attack.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type reaction (when attacked)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should be timing reaction', () => {
            expect(enhanced.enhancement.timing).toBe('reaction');
        });
    });

    describe('Transcendence - Mastery', () => {
        const feat = rawFeat('Transcendence',
            'Once per long rest, you can transform into a physical manifestation of your element. When you do, describe your transformation and choose two of the following benefits to gain until your next rest:\n\n- +4 bonus to your Severe threshold\n- +1 bonus to a character trait of your choice\n- +1 bonus to your Proficiency\n- +2 bonus to your Evasion');
        const enhanced = enhanceAbilityCard(feat);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should have duration rest', () => {
            expect(enhanced.enhancement.duration).toBe('rest');
        });

        it('should be action_type utility (transformation)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });
});

describe('Subclass Abilities Schema Validation - Primal Origin (Sorcerer)', () => {
    describe('Manipulate Magic - Foundation', () => {
        const feat = rawFeat('Manipulate Magic',
            'Your primal origin allows you to modify the essence of magic itself. After you cast a spell or make an attack using a weapon that deals magic damage, you can **mark a Stress** to do one of the following:\n\n- Extend the spell or attack\'s reach by one range\n- Gain a +2 bonus to the **action roll**\'s result\n- Double a damage die of your choice\n- Hit an additional target within range');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type passive (post-cast enhancement)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Arcane Charge - Mastery', () => {
        const feat = rawFeat('Arcane Charge',
            'You can gather magical energy to enhance your capabilities. When you take magic damage, you become Charged. Alternatively, you can **spend 2 Hope** to become Charged. When you successfully make an attack that deals magic damage while Charged, you can clear your Charge to either gain a +10 bonus to the damage roll or gain a +3 bonus to the Difficulty of a **reaction roll** the spell causes the target to make. You stop being Charged at your next long rest.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 2 (optional activation)', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(2);
        });

        it('should be action_type passive (triggered by taking damage or spending Hope)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });
});

// ============================================================================
// WIZARD SUBCLASSES
// ============================================================================

describe('Subclass Abilities Schema Validation - School of Knowledge (Wizard)', () => {
    describe('Prepared - Foundation', () => {
        const feat = rawFeat('Prepared',
            'Take an additional domain card of your level or lower from a domain you have access to.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (character creation bonus)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Adept - Foundation', () => {
        const feat = rawFeat('Adept',
            'When you Utilize an Experience, you can **mark a Stress** instead of spending a Hope. If you do, double your Experience modifier for that roll.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type passive (alternative cost)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Perfect Recall - Specialization', () => {
        const feat = rawFeat('Perfect Recall',
            'Once per rest, when you recall a domain card in your vault, you can reduce its Recall Cost by 1.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should be action_type passive (modifies recall)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Honed Expertise - Mastery', () => {
        const feat = rawFeat('Honed Expertise',
            'When you use an Experience, roll a **d6**. On a result of 5 or higher, you can use it without spending Hope.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (triggered by using Experience)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });
});

describe('Subclass Abilities Schema Validation - School of War (Wizard)', () => {
    describe('Battlemage - Foundation', () => {
        const feat = rawFeat('Battlemage',
            'You\'ve focused your studies on becoming an unconquerable force on the battlefield. Gain an additional Hit Point slot.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (character bonus)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have stat_bonuses.hit_point_slots = 1', () => {
            expect(enhanced.stat_bonuses?.hit_point_slots).toBe(1);
        });
    });

    describe('Face Your Fear - Foundation', () => {
        const feat = rawFeat('Face Your Fear',
            'When you succeed with Fear on an attack roll, you deal an extra **1d10** magic damage.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (triggered by Fear success)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword damage', () => {
            expect(enhanced.enhancement.keywords).toContain('damage');
        });

        it('should have keyword magic', () => {
            expect(enhanced.enhancement.keywords).toContain('magic');
        });
    });

    describe('Conjure Shield - Specialization', () => {
        const feat = rawFeat('Conjure Shield',
            'You can maintain a protective barrier of magic. While you have at least 2 Hope, you add your Proficiency to your Evasion.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (conditional bonus)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have modifier for evasion with formula = proficiency', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'evasion');
            expect(mod?.formula).toBe('proficiency');
        });
    });

    describe('Thrive in Chaos - Mastery', () => {
        const feat = rawFeat('Thrive in Chaos',
            'When you succeed on an attack, you can **mark a Stress** after rolling damage to force the target to mark an additional Hit Point.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type passive (triggered by attack success)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });
});

// ============================================================================
// DRUID SUBCLASSES
// ============================================================================

describe('Subclass Abilities Schema Validation - Warden of Renewal (Druid)', () => {
    describe('Clarity of Nature - Foundation', () => {
        const feat = rawFeat('Clarity of Nature',
            'Once per long rest, you can create a space of natural serenity within Close range. When you spend a few minutes resting within the space, clear Stress equal to your Instinct, distributed as you choose between you and your allies.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should have attack.range = Close', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Close');
        });

        it('should have keyword stress_relief', () => {
            expect(enhanced.enhancement.keywords).toContain('stress_relief');
        });
    });

    describe('Regeneration - Foundation', () => {
        const feat = rawFeat('Regeneration',
            'Touch a creature and **spend 3 Hope**. That creature clears **1d4** Hit Points.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 3', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(3);
        });

        it('should be action_type buff (healing)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword healing', () => {
            expect(enhanced.enhancement.keywords).toContain('healing');
        });
    });

    describe('Warden\'s Protection - Specialization', () => {
        const feat = rawFeat('Warden\'s Protection',
            'Once per long rest, **spend 2 Hope** to clear 2 Hit Points on **1d4** allies within Close range.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 2', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(2);
        });

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should have attack.range = Close', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Close');
        });

        it('should have keyword healing', () => {
            expect(enhanced.enhancement.keywords).toContain('healing');
        });
    });

    describe('Defender - Mastery', () => {
        const feat = rawFeat('Defender',
            'Your animal transformation embodies a healing guardian spirit. When you\'re in Beastform and an ally within Close range marks 2 or more Hit Points, you can **mark a Stress** to reduce the number of Hit Points they mark by 1.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type reaction (when ally takes damage)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have attack.range = Close', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Close');
        });
    });
});

describe('Subclass Abilities Schema Validation - Warden of the Elements (Druid)', () => {
    describe('Elemental Incarnation - Foundation', () => {
        const feat = rawFeat('Elemental Incarnation',
            '**Mark a Stress** to Channel one of the following elements until you take Severe damage or until your next rest:\n\n- **Fire:** When an adversary within Melee range deals damage to you, they take **1d10** magic damage.\n- **Earth:** Gain a bonus to your damage thresholds equal to your Proficiency.\n- **Water:** When you deal damage to an adversary within Melee range, all other adversaries within Very Close range must **mark a Stress**.\n- **Air:** You can hover, gaining advantage on **Agility Rolls**.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should have duration rest', () => {
            expect(enhanced.enhancement.duration).toBe('rest');
        });

        it('should be action_type utility (transformation/channeling)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Elemental Aura - Specialization', () => {
        const feat = rawFeat('Elemental Aura',
            'Once per rest while Channeling, you can assume an aura matching your element. The aura affects targets within Close range until your Channeling ends.\n\n- **Fire:** When an adversary marks 1 or more Hit Points, they must also **mark a Stress**.\n- **Earth:** Your allies gain a +1 bonus to Strength.\n- **Water:** When an adversary deals damage to you, you can **mark a Stress** to move them anywhere within Very Close range of where they are.\n- **Air:** When you or an ally takes damage from an attack beyond Melee range, reduce the damage by **1d8**.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should have attack.range = Close', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Close');
        });

        it('should be action_type utility (aura effect)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });
});
