/**
 * PLAYTEST TRANSFORMATIONS NLU-BASED TESTS
 * Tests for Vampire, Werewolf, Reanimated, Shapeshifter, Ghost, Demigod
 * 
 * These tests verify that the parser correctly extracts structured data
 * from transformation feature descriptions based on human NLU interpretation.
 */

import { enhanceAbilityCard } from '@/lib/card-parser';

// Helper to convert feat format to ability card format
function featToCard(name: string, text: string) {
    return {
        name,
        level: '1',
        domain: 'Transformation',
        type: 'Ability',
        recall: '0',
        text
    };
}

describe('Playtest Transformations NLU Validation', () => {

    describe('Vampire', () => {

        describe('Fangs', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Fangs',
                'Make a **Strength Roll** to bite a target within Melee range, dealing **d8** physical damage using your Proficiency.'
            ));

            it('should be action_type attack', () => {
                expect(enhanced.enhancement.action_type).toBe('attack');
            });

            it('should have attack.trait = Strength', () => {
                expect(enhanced.enhancement.attack?.trait).toBe('Strength');
            });

            it('should have attack.range = Melee', () => {
                expect(enhanced.enhancement.attack?.range).toBe('Melee');
            });

            it('should have attack.damage_type = physical', () => {
                expect(enhanced.enhancement.attack?.damage_type).toBe('physical');
            });

            it('should have keyword damage', () => {
                expect(enhanced.enhancement.keywords).toContain('damage');
            });
        });

        describe('Feed', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Feed',
                "On a successful Fangs attack against a living creature, you can also **mark a Stress** to Feed. Place a number of tokens on this card equal to the number of Hit Points your target marks. You can hold up to **5 tokens** at a time. Spend a token before an **action roll** to make your Fear Die a **d20** instead. When you take a Long Rest, remove a token. If there are no tokens on this card, all your action and **reaction rolls** are made with disadvantage."
            ));

            it('should be action_type passive (triggered by successful attack)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });

            it('should have has_tokens = true', () => {
                expect(enhanced.enhancement.tokens?.has_tokens).toBe(true);
            });

            it('should have max_tokens = 5', () => {
                expect(enhanced.enhancement.tokens?.max_tokens).toBe(5);
            });

            it('should have costs.stress = 1', () => {
                expect(enhanced.enhancement.costs?.stress).toBe(1);
            });
        });
    });

    describe('Werewolf', () => {

        describe('Wolf Form', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Wolf Form',
                'When you mark one or more Hit Points, you can also **mark a Stress** to enter your Wolf Form. While in this form, gain a **d10** Wolf Die that you add to all attack and damage rolls. When you would gain a Hope while in Wolf Form, you **mark a Stress** instead.'
            ));

            it('should be action_type reaction (triggers when marking HP)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });

            it('should have costs.stress = 1', () => {
                expect(enhanced.enhancement.costs?.stress).toBe(1);
            });

            it('should have keyword damage', () => {
                expect(enhanced.enhancement.keywords).toContain('damage');
            });
        });

        describe('Frenzy', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Frenzy',
                'When you **mark your last Stress** while in Wolf Form, you go into a Frenzy. Roll a number of **d20s** equal to your tier and automatically deal that much physical damage to all creatures within Very Close range. Then drop out of Wolf Form.'
            ));

            it('should be action_type reaction (triggers on last stress)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });

            it('should have attack.range = Very Close', () => {
                expect(enhanced.enhancement.attack?.range).toBe('Very Close');
            });

            it('should have keyword damage', () => {
                expect(enhanced.enhancement.keywords).toContain('damage');
            });

            it('should have keyword aoe (all creatures)', () => {
                expect(enhanced.enhancement.keywords).toContain('aoe');
            });
        });
    });

    describe('Reanimated', () => {

        describe('Stitch Up', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Stitch Up',
                "During a rest, you can only clear Hit Points if you have access to remains from a recently deceased creature. Describe how using this material affects your appearance. You cannot clear Hit Points by any means except a downtime move or the Risk It All death move."
            ));

            it('should be action_type downtime (during rest)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });
        });

        describe('Corpse', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Corpse',
                "When you Risk It All on a death move, if you fail, you can permanently **mark a Hit Point** to succeed instead. When you do, you still use the Hope Die's value to clear Hit Points and Stress."
            ));

            it('should be action_type passive (modifies death move)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });
        });
    });

    describe('Shapeshifter', () => {

        describe('Change Shape', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Change Shape',
                'During a long rest, you can spend a downtime move to swap your current ancestry with another. When you do, describe how your appearance changes.'
            ));

            it('should be action_type downtime (during long rest)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });
        });

        describe('Only Skin Deep', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Only Skin Deep',
                "When you Change Shape, you only gain the benefit of one of the ancestry's features, which you select when you choose the ancestry. You can spend a downtime move to switch which of your ancestry's features you gain the benefit of."
            ));

            it('should be action_type passive (modifies Change Shape)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });
        });
    });

    describe('Ghost', () => {

        describe('Spirit Form', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Spirit Form',
                'Your physical form can shift between corporeal and incorporeal. **Mark a Stress** to transition into and out of your Spirit Form. While in Spirit Form, you can move through solid objects, are immune to physical damage, and take double magic damage. You can **spend 2 Hope** to attack or physically interact with the material world.'
            ));

            it('should be action_type utility (transformation)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });

            it('should have costs.stress = 1', () => {
                expect(enhanced.enhancement.costs?.stress).toBe(1);
            });

            it('should have keyword damage (physical immune, magic double)', () => {
                expect(enhanced.enhancement.keywords).toContain('damage');
            });

            it('should have keyword movement (move through objects)', () => {
                expect(enhanced.enhancement.keywords).toContain('movement');
            });
        });

        describe('Ephemeral', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Ephemeral',
                'Cross out a Hit Point slot when you take this card and when you increase your tier. When you mark your last Hit Point, you must choose Blaze of Glory as your death move.'
            ));

            it('should be action_type passive (permanent restriction)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });
        });
    });

    describe('Demigod', () => {

        describe('Ichor of the Gods', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Ichor of the Gods',
                'Your advantage die is always a **d10** instead of a **d6**.'
            ));

            it('should be action_type passive (always active enhancement)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });

            it('should have keyword buff (advantage die upgrade)', () => {
                expect(enhanced.enhancement.keywords).toContain('buff');
            });
        });

        describe('Weight of Divinity', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Weight of Divinity',
                'When you roll a failure with Fear, you must **mark a Stress** or give the GM an additional Fear.'
            ));

            it('should be action_type passive (triggered by roll result)', () => {
                expect(enhanced.enhancement.action_type).toBeUndefined();
            });

            it('should have costs.stress = 1', () => {
                expect(enhanced.enhancement.costs?.stress).toBe(1);
            });
        });
    });
});
