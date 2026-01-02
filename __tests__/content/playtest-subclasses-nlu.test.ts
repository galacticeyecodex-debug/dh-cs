/**
 * PLAYTEST SUBCLASSES NLU-BASED TESTS
 * Tests for Blood Hunter, Witch, and Brawler subclasses from playtest content
 * 
 * These tests verify that the parser correctly extracts structured data
 * from subclass feature descriptions based on human NLU interpretation.
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

describe('Playtest Subclasses NLU Validation - Blood Hunter Orders', () => {

    describe('Order of the Ghost Slayer', () => {

        describe('Chasing Death - Foundation', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Chasing Death',
                'While you have 1–3 unmarked Hit Points, you can use your Crimson Rite feature without paying the Hit Point cost. If you have only 1 unmarked Hit Point, you roll **d8s** instead of **d6s** for the extra damage of your Crimson Rite.'
            ));

            it('should be action_type passive (conditional enhancement)', () => {
                expect(enhanced.enhancement.action_type).toBe('passive');
            });

            it('should have keyword damage', () => {
                expect(enhanced.enhancement.keywords).toContain('damage');
            });
        });

        describe('Shadowed Grit - Foundation', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Shadowed Grit',
                'When the GM gains a Fear from a Duality Dice roll, you can **mark a Stress** to gain a Hope.'
            ));

            it('should be action_type reaction (triggers on GM action)', () => {
                expect(enhanced.enhancement.action_type).toBe('reaction');
            });

            it('should have costs.stress = 1', () => {
                expect(enhanced.enhancement.costs?.stress).toBe(1);
            });

            it('should have keyword hope_gain', () => {
                expect(enhanced.enhancement.keywords).toContain('hope_gain');
            });
        });

        describe('Veilwalker - Specialization', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Veilwalker',
                'You can briefly slip into the realm between the living and the dead. **Spend 2 Hope** to disappear and then reappear next to a creature or a corpse within Far range. You then have advantage on the next attack roll you make in this scene.'
            ));

            it('should be action_type utility (teleportation)', () => {
                expect(enhanced.enhancement.action_type).toBe('utility');
            });

            it('should have costs.hope = 2', () => {
                expect(enhanced.enhancement.costs?.hope).toBe(2);
            });

            it('should have attack.range = Far', () => {
                expect(enhanced.enhancement.attack?.range).toBe('Far');
            });

            it('should have keyword movement', () => {
                expect(enhanced.enhancement.keywords).toContain('movement');
            });
        });

        describe('Spectral Form - Mastery', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Spectral Form',
                "You have another death move option: Spectral Form. When you choose this option, you clear a Hit Point, your body becomes spectral, you have resistance to physical damage, and you can pass through objects. This form ends if you clear any more Hit Points. It also ends if you mark your last Hit Point, which forces you to take a different death move. You're shunted to the nearest open space if you're inside an object when the form ends."
            ));

            it('should be action_type utility (transformation)', () => {
                expect(enhanced.enhancement.action_type).toBe('utility');
            });

            it('should have keyword damage (resistance to physical)', () => {
                expect(enhanced.enhancement.keywords).toContain('damage');
            });
        });
    });

    describe('Order of the Mutant', () => {

        describe('Mutagens - Foundation', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Mutagens',
                "You employ mutagenic toxins created to enhance your abilities. When you finish a rest, you can drink one such toxin to gain its effects, which last until you finish your next rest. These effects include a +1 bonus to one trait of your choice, a −1 penalty to a different trait of your choice, and your choice of one of the following benefits:\n\n- Celerity: If you are Restrained or Vulnerable, you can **mark a Stress** to end the condition on yourself.\n- Durable: Your Armor Score increases by 2.\n- Hunter's Senses: You have advantage on any **action roll** you make to track a creature, and you can see in complete darkness."
            ));

            it('should be action_type downtime (occurs during rest)', () => {
                expect(enhanced.enhancement.action_type).toBe('downtime');
            });

            it('should have keyword buff (advantage, bonuses)', () => {
                expect(enhanced.enhancement.keywords).toContain('buff');
            });
        });

        describe('Mastered Mutagens - Mastery', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Mastered Mutagens',
                "The trait bonus and penalty you get from your Mutagens feature changes to +2 and −2, respectively. When you choose a mutagen benefit, your options also include the following:\n\n- Aetherblood: Within your line of sight, you can see creatures and objects that are invisible, and visual illusions appear transparent to you. If a creature or an object within your line of sight has been transformed by magic, you can see its true form.\n- Fury: When you make an attack roll, you can **mark a Stress** to gain a bonus to the roll equal to your Proficiency.\n- Steelflesh: Your Major damage threshold increases by a number equal to your Proficiency."
            ));

            it('should be action_type passive (enhances existing feature)', () => {
                expect(enhanced.enhancement.action_type).toBe('passive');
            });
        });
    });

    describe('Order of the Lycan', () => {

        describe('Werewolf - Foundation', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Werewolf',
                'You gain the Werewolf Transformation card. Your rolls to perceive via hearing and scent have advantage.'
            ));

            it('should be action_type passive (always active)', () => {
                expect(enhanced.enhancement.action_type).toBe('passive');
            });

            it('should have keyword buff (advantage)', () => {
                expect(enhanced.enhancement.keywords).toContain('buff');
            });
        });

        describe('Lycan Regeneration - Specialization', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Lycan Regeneration',
                'While in your Wolf Form with all your Hit Points marked, you can **mark a Stress** to clear a Hit Point. You can do this while unconscious.'
            ));

            it('should be action_type buff (healing)', () => {
                expect(enhanced.enhancement.action_type).toBe('buff');
            });

            it('should have costs.stress = 1', () => {
                expect(enhanced.enhancement.costs?.stress).toBe(1);
            });

            it('should have keyword healing', () => {
                expect(enhanced.enhancement.keywords).toContain('healing');
            });
        });
    });
});

describe('Playtest Subclasses NLU Validation - Witch Subclasses', () => {

    describe('Hedge', () => {

        describe('Herbal Remedies - Foundation', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Herbal Remedies',
                'When you or an ally clear one or more Hit Points or Stress as the result of using a consumable, increase the number cleared by one.'
            ));

            it('should be action_type passive (triggered enhancement)', () => {
                expect(enhanced.enhancement.action_type).toBe('passive');
            });

            it('should have keyword healing', () => {
                expect(enhanced.enhancement.keywords).toContain('healing');
            });
        });

        describe('Tethered Talisman - Foundation', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Tethered Talisman',
                "Once per rest, you can imbue a small item with your protective essence. When the person holding the talisman takes damage, you can expend its magic to reduce the number of Hit Points they mark by one. You can't create a new talisman until the old one has been used."
            ));

            it('should be frequency once_per_rest', () => {
                expect(enhanced.enhancement.frequency).toBe('once_per_rest');
            });

            it('should have keyword damage_reduction', () => {
                expect(enhanced.enhancement.keywords).toContain('damage_reduction');
            });
        });

        describe('Walk Between Worlds - Specialization', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Walk Between Worlds',
                'Make a **Spellcast Roll (13)** to step beyond the veil of death and converse with any nearby spirits. Place a number of tokens equal to your Spellcast trait on this card and remove one each time a spirit answers a question. You return to the mortal realm when the last token is removed.'
            ));

            it('should have roll.difficulty = 13', () => {
                expect(enhanced.enhancement.roll?.difficulty).toBe(13);
            });

            it('should have has_tokens = true', () => {
                expect(enhanced.enhancement.has_tokens).toBe(true);
            });

            it('should have keyword tokens', () => {
                expect(enhanced.enhancement.keywords).toContain('tokens');
            });
        });

        describe('Circle of Power - Mastery', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Circle of Power',
                "Once per rest, mark a circle on the ground around you up to Very Close range and place a number of tokens equal to your Spellcast Trait on this card. Each time you or any ally within the circle makes an **action roll** or is hit with an attack, remove a token. This spell lasts until the last token is removed or you step out of the circle. While within this circle, you and any allies:\n\n- Gain a +4 bonus to your damage thresholds.\n- Gain a +2 bonus to your attack rolls.\n- Gain a +1 bonus to your Evasion."
            ));

            it('should be frequency once_per_rest', () => {
                expect(enhanced.enhancement.frequency).toBe('once_per_rest');
            });

            it('should have has_tokens = true', () => {
                expect(enhanced.enhancement.has_tokens).toBe(true);
            });

            it('should have attack.range = Very Close', () => {
                expect(enhanced.enhancement.attack?.range).toBe('Very Close');
            });
        });
    });

    describe('Moon', () => {

        describe("Night's Glamour - Foundation", () => {
            const enhanced = enhanceAbilityCard(featToCard(
                "Night's Glamour",
                "**Mark a Stress** to Glamour yourself in a magical facade that lasts until you mark a Hit Point, make an attack, or take a rest. While Glamoured, you can:\n\n- Disguise yourself to look like any creature of your approximate size that you've seen.\n- Enhance your own appearance. You gain advantage on **Presence Rolls** that leverage this change."
            ));

            it('should be action_type utility (disguise/glamour)', () => {
                expect(enhanced.enhancement.action_type).toBe('utility');
            });

            it('should have costs.stress = 1', () => {
                expect(enhanced.enhancement.costs?.stress).toBe(1);
            });

            it('should have keyword buff (advantage)', () => {
                expect(enhanced.enhancement.keywords).toContain('buff');
            });
        });

        describe('Moonbeam - Specialization', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Moonbeam',
                "Once per session, you can conjure a column of moonlight that illuminates the area within Close range until the end of the scene. While bathed in this moonlight, you and any allies gain a +1 bonus to **Spellcast Rolls** and advantage on rolls to see through illusions."
            ));

            it('should be frequency once_per_session', () => {
                expect(enhanced.enhancement.frequency).toBe('once_per_session');
            });

            it('should have attack.range = Close', () => {
                expect(enhanced.enhancement.attack?.range).toBe('Close');
            });

            it('should have keyword buff', () => {
                expect(enhanced.enhancement.keywords).toContain('buff');
            });
        });

        describe('Ire of Pale Light - Specialization', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Ire of Pale Light',
                'When a Hexed creature within Far range fails an attack roll, they must **mark a Stress**.'
            ));

            it('should be action_type passive (triggered by enemy action)', () => {
                expect(enhanced.enhancement.action_type).toBe('passive');
            });

            it('should have attack.range = Far', () => {
                expect(enhanced.enhancement.attack?.range).toBe('Far');
            });
        });
    });
});

describe('Playtest Subclasses NLU Validation - Brawler Subclasses', () => {

    describe('Juggernaut', () => {

        describe('Powerhouse - Foundation', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Powerhouse',
                'Increase the **d8** damage dice for your unarmed attack to **d10s**. Additionally, you can **mark a Stress** to target two creatures within Melee range with a single attack roll.'
            ));

            it('should be action_type passive (permanent enhancement)', () => {
                expect(enhanced.enhancement.action_type).toBe('passive');
            });

            it('should have keyword damage', () => {
                expect(enhanced.enhancement.keywords).toContain('damage');
            });

            it('should have attack.range = Melee', () => {
                expect(enhanced.enhancement.attack?.range).toBe('Melee');
            });
        });

        describe('Overwhelm - Foundation', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Overwhelm',
                'On a successful attack, you can **spend a Hope** to force the target to **mark a Stress** or to throw them within Close range.'
            ));

            it('should be action_type passive (triggered by successful attack)', () => {
                expect(enhanced.enhancement.action_type).toBe('passive');
            });

            it('should have costs.hope = 1', () => {
                expect(enhanced.enhancement.costs?.hope).toBe(1);
            });

            it('should have keyword movement', () => {
                expect(enhanced.enhancement.keywords).toContain('movement');
            });
        });

        describe('Eye for an Eye - Specialization', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Eye for an Eye',
                'When you mark more than one Hit Point from an attack in Melee range, the attacker must make a **Reaction Roll (13)**. On a failure, once per rest, they immediately mark the same number of Hit Points in return.'
            ));

            it('should be action_type reaction (when you take damage)', () => {
                expect(enhanced.enhancement.action_type).toBe('reaction');
            });

            it('should be frequency once_per_rest', () => {
                expect(enhanced.enhancement.frequency).toBe('once_per_rest');
            });

            it('should have attack.range = Melee', () => {
                expect(enhanced.enhancement.attack?.range).toBe('Melee');
            });
        });

        describe('Pummeljoy - Mastery', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Pummeljoy',
                'When you critically succeed on a weapon attack in Melee range, you gain an additional Hope, clear an additional Stress, and gain a +1 bonus to your Proficiency for the attack.'
            ));

            it('should be action_type passive (triggered by crit)', () => {
                expect(enhanced.enhancement.action_type).toBe('passive');
            });

            it('should have keyword hope_gain', () => {
                expect(enhanced.enhancement.keywords).toContain('hope_gain');
            });

            it('should have keyword stress_relief', () => {
                expect(enhanced.enhancement.keywords).toContain('stress_relief');
            });
        });
    });

    describe('Martial Artist', () => {

        describe('Focus - Foundation', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Focus',
                'During a rest, roll a number of **d6s** equal to your Instinct and place a number of Focus tokens equal to the highest value rolled on this card. Spend a Focus to shift into a stance until you take Severe damage, the scene ends, you mark your last Hit Point, or you shift into another martial stance.'
            ));

            it('should be action_type downtime (during rest)', () => {
                expect(enhanced.enhancement.action_type).toBe('downtime');
            });

            it('should have has_tokens = true', () => {
                expect(enhanced.enhancement.has_tokens).toBe(true);
            });

            it('should have keyword tokens', () => {
                expect(enhanced.enhancement.keywords).toContain('tokens');
            });
        });

        describe('Keen Defenses - Specialization', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Keen Defenses',
                'When you are targeted by an attack, you can spend a Focus to give the attack roll disadvantage.'
            ));

            it('should be action_type reaction (when targeted)', () => {
                expect(enhanced.enhancement.action_type).toBe('reaction');
            });

            it('should have keyword debuff (disadvantage)', () => {
                expect(enhanced.enhancement.keywords).toContain('debuff');
            });
        });

        describe('Spirit Blast - Specialization', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Spirit Blast',
                'Spend a Focus to make an **Instinct Roll** against an adversary within Close range. On a success, deal **d20+3** magic damage using your Proficiency, and you can spend an additional Focus to make them temporarily Vulnerable.'
            ));

            it('should be action_type attack (roll against target, deals damage)', () => {
                expect(enhanced.enhancement.action_type).toBe('attack');
            });

            it('should have attack.range = Close', () => {
                expect(enhanced.enhancement.attack?.range).toBe('Close');
            });

            it('should have attack.damage_type = magic', () => {
                expect(enhanced.enhancement.attack?.damage_type).toBe('magic');
            });

            it('should have roll.trait = Instinct', () => {
                expect(enhanced.enhancement.roll?.trait).toBe('Instinct');
            });
        });

        describe('Limit Breaker - Mastery', () => {
            const enhanced = enhanceAbilityCard(featToCard(
                'Limit Breaker',
                'Once per rest, you can perform an unbelievable feat such as running across water, leaping between distant rooftops, or scaling the side of a building without needing to roll. When you do, gain a Hope and clear a Stress.'
            ));

            it('should be frequency once_per_rest', () => {
                expect(enhanced.enhancement.frequency).toBe('once_per_rest');
            });

            it('should be action_type utility (movement feat)', () => {
                expect(enhanced.enhancement.action_type).toBe('utility');
            });

            it('should have keyword hope_gain', () => {
                expect(enhanced.enhancement.keywords).toContain('hope_gain');
            });

            it('should have keyword stress_relief', () => {
                expect(enhanced.enhancement.keywords).toContain('stress_relief');
            });
        });
    });
});
