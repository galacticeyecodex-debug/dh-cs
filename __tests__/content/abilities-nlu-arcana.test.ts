/**
 * ABILITIES SCHEMA VALIDATION TESTS
 * 
 * These tests validate that the card parser correctly extracts structured data
 * from ability text using Natural Language Understanding. Each test is based
 * solely on analyzing the "type" and "text" fields to predict expected output.
 * 
 * Test expectations are derived from human understanding of the card text,
 * NOT from the current parser output (which may be inaccurate).
 */

import { describe, it, expect } from 'vitest';
import { enhanceAbilityCard } from '@/lib/card-parser';

// Helper to create minimal raw ability for testing
function rawAbility(name: string, type: string, text: string) {
    return { name, level: '1', domain: 'Test', type, recall: '0', text };
}

describe('Abilities Schema Validation - Arcana Domain', () => {
    describe('Rune Ward', () => {
        const ability = rawAbility('Rune Ward', 'Spell',
            'You have a deeply personal trinket that can be infused with protective magic and held as a ward by you or an ally. Describe what it is and why it\'s important to you. The ward\'s holder can **spend a Hope** to reduce incoming damage by **1d8**.\n\nIf the Ward Die result is 8, the ward\'s power ends after it reduces damage this turn. It can be recharged for free on your next rest.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should be action_type utility (defensive, no attack)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should be timing reaction (when taking damage)', () => {
            expect(enhanced.enhancement.timing).toBe('reaction');
        });

        it('should be frequency at_will (no usage limit in text)', () => {
            expect(enhanced.enhancement.frequency).toBe('at_will');
        });
    });

    describe('Unleash Chaos', () => {
        const ability = rawAbility('Unleash Chaos', 'Spell',
            'At the beginning of a session, place a number of tokens equal to your Spellcast trait on this card.\n\nMake a **Spellcast Roll** against a target within Far range and spend any number of tokens to channel raw energy from within yourself to unleash against them. On a success, roll a number of **d10s** equal to the tokens you spent and deal that much magic damage to the target. **Mark a Stress** to replenish this card with tokens (up to your Spellcast trait).\n\nAt the end of each session, clear all unspent tokens.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have tokens.has_tokens = true', () => {
            expect(enhanced.enhancement.tokens?.has_tokens).toBe(true);
        });

        it('should have tokens.token_source = spellcast', () => {
            expect(enhanced.enhancement.tokens?.token_source).toBe('spellcast');
        });

        it('should be action_type attack (deals magic damage)', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
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

        it('should have attack.damage = d10', () => {
            expect(enhanced.enhancement.attack?.damage).toBe('d10');
        });
    });

    describe('Wall Walk', () => {
        const ability = rawAbility('Wall Walk', 'Spell',
            '**Spend a Hope** to allow a creature you can touch to climb on walls and ceilings as easily as walking on the ground. This lasts until the end of the scene or you cast Wall Walk again.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should have duration = scene', () => {
            expect(enhanced.enhancement.duration).toBe('scene');
        });

        it('should be action_type utility', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should be frequency at_will', () => {
            expect(enhanced.enhancement.frequency).toBe('at_will');
        });
    });

    describe('Cinder Grasp', () => {
        const ability = rawAbility('Cinder Grasp', 'Spell',
            'Make a **Spellcast Roll** against a target within Melee range. On a success, the target instantly bursts into flames, takes **1d20+3** magic damage, and is temporarily lit On Fire.\n\nWhen a creature acts while On Fire, they must take an extra **2d6** magic damage if they are still On Fire at the end of their action.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type attack', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should have attack.range = Melee', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Melee');
        });

        it('should have attack.damage_type = magic', () => {
            expect(enhanced.enhancement.attack?.damage_type).toBe('magic');
        });

        it('should have no costs (no spend/mark in activation)', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Floating Eye', () => {
        const ability = rawAbility('Floating Eye', 'Spell',
            '**Spend a Hope** to create a single, small floating orb that you can move anywhere within Very Far range. While this spell is active, you can see through the orb as though you\'re looking out from its position. You can transition between using your own senses and seeing through the orb freely. If the orb takes damage or moves out of range, the spell ends.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should be action_type utility (no attack/damage dealt)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Counterspell', () => {
        const ability = rawAbility('Counterspell', 'Spell',
            'You can interrupt a magical effect taking place by making a **reaction roll** using your Spellcast trait. On a success, the effect stops and any consequences are avoided, and this card is placed in your vault.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type reaction', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should be timing reaction', () => {
            expect(enhanced.enhancement.timing).toBe('reaction');
        });

        it('should have roll.trait = Spellcast', () => {
            expect(enhanced.enhancement.roll?.trait).toBe('Spellcast');
        });
    });

    describe('Flight', () => {
        const ability = rawAbility('Flight', 'Spell',
            'Make a **Spellcast Roll (15)**. On a success, place a number of tokens equal to your Agility on this card (minimum 1). When you make an **action roll** while flying, spend a token from this card. After the action that spends the last token is resolved, you descend to the ground directly below you.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have tokens.has_tokens = true', () => {
            expect(enhanced.enhancement.tokens?.has_tokens).toBe(true);
        });

        it('should have tokens.token_source = agility', () => {
            expect(enhanced.enhancement.tokens?.token_source).toBe('agility');
        });

        it('should have roll.difficulty = 15', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(15);
        });

        it('should be action_type utility', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should match the exact configuration (strict)', () => {
            const expected = {
                action_type: undefined,
                timing: "action",
                frequency: "at_will",
                costs: undefined,
                keywords: ["tokens", "spell"],
                tokens: {
                    has_tokens: true,
                    max_tokens: null,
                    token_source: "agility",
                },
                roll: {
                    type: "Spellcast Roll",
                    trait: "Spellcast",
                    difficulty: 15,
                    target_reaction: false,
                    requires_cost_for_roll: undefined
                }
            };
            expect(enhanced.enhancement).toEqual(expected);
        });
    });

    describe('Blink Out', () => {
        const ability = rawAbility('Blink Out', 'Spell',
            'Make a **Spellcast Roll (12)**. On a success, **spend a Hope** to teleport to another point you can see within Far range. If any willing creatures are within Very Close range, **spend an additional Hope** for each creature to bring them with you.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1 (base cost)', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should have roll.difficulty = 12', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(12);
        });

        it('should be action_type utility (movement, no damage)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should NOT have roll.requires_cost_for_roll (cost is conditional on success)', () => {
            expect(enhanced.enhancement.roll?.requires_cost_for_roll).toBeUndefined();
        });
    });

    describe('Preservation Blast', () => {
        const ability = rawAbility('Preservation Blast', 'Spell',
            'Make a **Spellcast Roll** against all targets within Melee range. Targets you succeed against are forced back to Far range and take **d8+3** magic damage using your Spellcast trait.');
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

    describe('Chain Lightning', () => {
        const ability = rawAbility('Chain Lightning', 'Spell',
            '**Mark 2 Stress** to make a **Spellcast Roll**, unleashing lightning on all targets within Close range. Targets you succeed against must make a **reaction roll** with a Difficulty equal to the result of your **Spellcast Roll**. Targets who fail take **2d8+4** magic damage. Additional adversaries not already targeted by Chain Lightning and within Close range of previous targets who took damage must also make the **reaction roll**. Targets who fail take **2d8+4** magic damage. This chain continues until there are no more adversaries within range.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 2', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(2);
        });

        it('should be action_type attack', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should have roll.target_reaction = true', () => {
            expect(enhanced.enhancement.roll?.target_reaction).toBe(true);
        });

        it('should have roll.requires_cost_for_roll = true (cost is prerequisite)', () => {
            expect(enhanced.enhancement.roll?.requires_cost_for_roll).toBe(true);
        });
    });

    describe('Premonition', () => {
        const ability = rawAbility('Premonition', 'Spell',
            'You can channel arcane energy to have visions of the future. Once per long rest, immediately after the GM conveys the consequences of a roll you made, you can rescind the move and consequences like they never happened and make another move instead.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should be action_type utility', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Rift Walker', () => {
        const ability = rawAbility('Rift Walker', 'Spell',
            'Make a **Spellcast Roll (15)**. On a success, you place an arcane marking on the ground where you currently stand. The next time you successfully cast Rift Walker, a rift in space opens up, providing safe passage back to the exact spot where the marking was placed. This rift stays open until you choose to close it or you cast another spell.\n\nYou can drop the spell at any time to cast Rift Walker again and place the marking somewhere new.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have roll.difficulty = 15', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(15);
        });

        it('should be action_type utility', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Telekinesis', () => {
        const ability = rawAbility('Telekinesis', 'Spell',
            'Make a **Spellcast Roll** against a target within Far range. On a success, you can use your mind to move them anywhere within Far range of their original position. You can throw the lifted target as an attack by making an additional **Spellcast Roll** against the second target you\'re trying to attack. On a success, deal **d12+4** physical damage to the second target using your Proficiency.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type attack (can deal damage)', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should have attack.damage_type = physical', () => {
            expect(enhanced.enhancement.attack?.damage_type).toBe('physical');
        });

        it('should have attack.range = Far', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Far');
        });
    });

    describe('Arcana-Touched', () => {
        const ability = rawAbility('Arcana-Touched', 'Ability',
            'When 4 or more of the domain cards in your loadout are from the Arcana domain, gain the following benefits:\n\n- +1 bonus to your **Spellcast Rolls**\n- Once per rest, you can switch the results of your Hope and Fear Dice.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type passive', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have modifier for spellcast with loadout condition', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'spellcast');
            expect(mod?.value).toBe(1);
            expect(mod?.condition?.type).toBe('loadout_domain_count');
            expect(mod?.condition?.minCount).toBe(4);
        });

        it('should be frequency once_per_rest (for dice switch)', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });
    });

    describe('Cloaking Blast', () => {
        const ability = rawAbility('Cloaking Blast', 'Spell',
            'When you make a successful **Spellcast Roll** to cast a different spell, you can **spend a Hope** to become Cloaked. While Cloaked, you remain unseen if you are stationary when an adversary moves to where they would normally see you. When you move into or within an adversary\'s line of sight or make an attack, you are no longer Cloaked.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should be action_type utility', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Arcane Reflection', () => {
        const ability = rawAbility('Arcane Reflection', 'Spell',
            'When you would take magic damage, you can **spend any number of Hope** to roll that many **d6s**. If any roll a 6, the attack is reflected back to the caster, dealing the damage to them instead.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be timing reaction (when taking damage)', () => {
            expect(enhanced.enhancement.timing).toBe('reaction');
        });

        it('should be action_type undefined', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Confusing Aura', () => {
        const ability = rawAbility('Confusing Aura', 'Spell',
            'Make a **Spellcast Roll (14)**. Once per long rest on a success, you create a layer of illusion over your body that makes it hard to tell exactly where you are. **Mark any number of Stress** to make that many additional layers. When an adversary makes an attack against you, roll a number of **d6s** equal to the number of layers currently active. If any roll a 5 or higher, one layer of the aura is destroyed and the attack fails. If all the results are 4 or lower, you take the damage and this spell ends.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_long_rest');
        });

        it('should have roll.difficulty = 14', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(14);
        });
    });

    describe('Earthquake', () => {
        const ability = rawAbility('Earthquake', 'Spell',
            'Make a **Spellcast Roll (16)**. Once per rest on a success, all targets within Very Far range who aren\'t flying must make a **Reaction Roll (18)**. Targets who fail take **3d10+8** physical damage and are temporarily Vulnerable. Targets who succeed take half damage.\n\nAdditionally, when you succeed on the **Spellcast Roll**, all terrain within Very Far range becomes difficult to move through and structures within this range might sustain damage or crumble.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should have roll.difficulty = 16', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(16);
        });

        it('should have roll.target_reaction = true', () => {
            expect(enhanced.enhancement.roll?.target_reaction).toBe(true);
        });
    });

    describe('Sensory Projection', () => {
        const ability = rawAbility('Sensory Projection', 'Spell',
            'Once per rest, make a **Spellcast Roll (15)**. On a success, drop into a vision that lets you clearly see and hear any place you have been before as though you are standing there in this moment. You can move freely in this vision and are not constrained by the physics or impediments of a physical body. This spell cannot be detected by mundane or magical means. You drop out of this vision upon taking damage or casting another spell.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should have roll.difficulty = 15', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(15);
        });

        it('should be action_type utility', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Adjust Reality', () => {
        const ability = rawAbility('Adjust Reality', 'Spell',
            'After you or a willing ally make any roll, you can **spend 5 Hope** to change the numerical result of that roll to a result of your choice instead. The result must be plausible within the range of the dice.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 5', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(5);
        });

        it('should be action_type utility', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });

    describe('Falling Sky', () => {
        const ability = rawAbility('Falling Sky', 'Spell',
            'Make a **Spellcast Roll** against all adversaries within Far range. **Mark any number of Stress** to make shards of arcana rain down from above. Targets you succeed against take **1d20+2** magic damage for each Stress marked.');
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
