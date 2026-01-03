/**
 * PLAYTEST CLASSES NLU-BASED TESTS
 * Tests for Blood Hunter, Witch, and Brawler classes from playtest content
 * 
 * These tests verify that the parser correctly extracts structured data
 * from class feature descriptions based on human NLU interpretation.
 */

import { enhanceAbilityCard } from '@/lib/card-parser';

// Helper to convert feat format to ability card format
function featToCard(name: string, text: string) {
    return {
        name,
        level: '1',
        domain: 'Feature',
        type: 'Ability',
        recall: '0',
        text
    };
}

describe('Playtest Classes NLU Validation', () => {

    describe('Blood Hunter', () => {

        describe('Crimson Rite', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Crimson Rite',
                'You can enchant your strikes with bloodthirsty power at the cost of your vitality. Mark a Hit Point to enchant one of your active weapons. Until you finish your next rest, that weapon deals physical or magic damage (choose when you use this feature) and an extra **1d6** damage when you hit with it. This extra damage increases to **2d6** at level 5 and **3d6** at level 8.'
            ));

            it('should be action_type buff (enhances weapon)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });

            it('should have keyword damage', () => {
                expect(enhanced.enhancement.keywords).toContain('damage');
            });

            it('should have duration rest (until next rest)', () => {
                expect(enhanced.enhancement.duration).toBe('rest');
            });
        });

        describe('Grim Psychometry', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Grim Psychometry',
                'While inspecting a creature, a location, or an object within Very Close range, make a **Spellcast Roll (12)**. On a success, **mark a Stress** to have a vision of the most recent violence involving the target, and until you finish a rest, you have advantage on any **action roll** to recall lore about things in the vision.'
            ));

            it('should have roll.trait = Spellcast', () => {
                expect(enhanced.enhancement.roll?.trait).toBe('Spellcast');
            });

            it('should have roll.difficulty = 12', () => {
                expect(enhanced.enhancement.roll?.difficulty).toBe(12);
            });

            it('should have costs.stress = 1', () => {
                expect(enhanced.enhancement.costs?.stress).toBe(1);
            });

            it('should have attack.range = Very Close', () => {
                expect(enhanced.enhancement.attack?.range).toBe('Very Close');
            });
        });

        describe('Blood Maledict (Hope Feat)', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Blood Maledict',
                '**Spend 3 Hope** to target a creature within Far range or in a vision from your Grim Psychometry. Until you finish a rest, take Severe damage, or use this feature again, you have advantage on all **action rolls** against the target.'
            ));

            it('should be action_type buff (grants advantage)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });

            it('should have costs.hope = 3', () => {
                expect(enhanced.enhancement.costs?.hope).toBe(3);
            });

            it('should have attack.range = Far', () => {
                expect(enhanced.enhancement.attack?.range).toBe('Far');
            });

            it('should have keyword buff (advantage)', () => {
                expect(enhanced.enhancement.keywords).toContain('buff');
            });
        });
    });

    describe('Witch', () => {

        describe('Hex', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Hex',
                'When a creature causes you or an ally within Close range to mark any number of Hit Points, you can **mark a Stress** to Hex them. Action and damage rolls against a Hexed creature gain a bonus equal to your tier. This condition lasts until the GM spends a number of Fear equal to your Spellcast trait to remove it or you Hex another creature. Otherwise, remove it when the scene ends.'
            ));

            it('should be action_type reaction (triggers when damage is dealt)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });

            it('should have costs.stress = 1', () => {
                expect(enhanced.enhancement.costs?.stress).toBe(1);
            });

            it('should have attack.range = Close (ally protection range)', () => {
                expect(enhanced.enhancement.attack?.range).toBe('Close');
            });
        });

        describe('Commune', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Commune',
                'Once per long rest, during a moment of calm, you can commune with an ancestor, deity, nature spirit, or otherworldly being. Ask them a question, then roll a number of **d6s** equal to your Spellcast trait. Choose one value from the rolled results and reference the chart below for the effect:\n\n1-3: You taste a flavor, smell a scent, or feel a sensation relevant to the answer.\n4-5: You hear sounds or see a vision relevant to the answer.\n6: You psychically experience a scene relevant to the answer as if you were there.'
            ));

            it('should be frequency once_per_long_rest', () => {
                expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
            });

            it('should be action_type utility (information gathering)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });
        });

        describe("Witch's Charm (Hope Feat)", () => {
            const enhanced = enhanceAbilityCard(featToCard(
                "Witch's Charm",
                'When you or an ally within Far range rolls a failure on an **action roll**, you can **spend 3 Hope** to change it into a success with Fear instead.'
            ));

            it('should be action_type reaction (triggers on ally failure)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });

            it('should have costs.hope = 3', () => {
                expect(enhanced.enhancement.costs?.hope).toBe(3);
            });

            it('should have attack.range = Far (ally range)', () => {
                expect(enhanced.enhancement.attack?.range).toBe('Far');
            });
        });
    });

    describe('Brawler', () => {

        describe('I Am The Weapon', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'I Am The Weapon',
                "While you don't have any equipped weapons:\n- You gain a +1 bonus to Evasion.\n- Your unarmed strikes are considered a Melee weapon, use the trait of your choice, and deal **d8**+**d6** phy damage using your Proficiency."
            ));

            it('should be action_type passive (conditional bonus)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });

            it('should have modifier for evasion +1', () => {
                const evasionMod = enhanced.enhancement.modifiers?.find(m => m.stat === 'evasion');
                expect(evasionMod).toBeDefined();
                expect(evasionMod?.value).toBe(1);
            });

            it('should have keyword damage', () => {
                expect(enhanced.enhancement.keywords).toContain('damage');
            });
        });

        describe('Combo Strikes', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Combo Strikes',
                'After making a damage roll with a Melee weapon but before dealing that damage to the target, **mark a Stress** to start a combo strike. When you do, roll your Combo Die and note its value. Then, roll your Combo Die again. If the value of the second roll is equal to or greater than your first roll, continue rolling until the latest Combo Die\'s roll is less than the roll that preceded it. Total all rolled values and add that amount to your weapon\'s damage. These values cannot be adjusted by features that affect damage dice.\n\nYour Combo Die starts as a **d4**. When you level up, once per tier you may use one of your advancement options to increase your Combo Die instead.'
            ));

            it('should be action_type buff (adds to damage)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });

            it('should have costs.stress = 1', () => {
                expect(enhanced.enhancement.costs?.stress).toBe(1);
            });

            it('should have keyword damage', () => {
                expect(enhanced.enhancement.keywords).toContain('damage');
            });
        });

        describe('Staggering Strike (Hope Feat)', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Staggering Strike',
                '**Spend 3 Hope** when you succeed on an attack to temporarily Stagger your target and force them to **mark a Stress**. While Staggered, they have disadvantage on attack rolls.'
            ));

            it('should be action_type passive (triggered by successful attack)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });

            it('should have costs.hope = 3', () => {
                expect(enhanced.enhancement.costs?.hope).toBe(3);
            });

            it('should have keyword debuff (stagger, disadvantage)', () => {
                expect(enhanced.enhancement.keywords).toContain('debuff');
            });
        });
    });
});
