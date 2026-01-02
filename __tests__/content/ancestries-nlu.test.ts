/**
 * ANCESTRY ABILITIES SCHEMA VALIDATION TESTS
 * 
 * These tests validate that the card parser correctly extracts structured data
 * from ancestry feat descriptions using Natural Language Understanding. Each test is based
 * solely on analyzing the "text" fields to predict expected output.
 * 
 * Test expectations are derived from human understanding of the ability text,
 * NOT from the current parser output (which may be inaccurate).
 */

import { describe, it, expect } from 'vitest';
import { enhanceAbilityCard } from '@/lib/card-parser';

// Helper to create minimal raw feat for testing
function rawFeat(name: string, text: string) {
    return { name, level: '1', domain: 'Ancestry', type: 'Ability', recall: '0', text };
}

describe('Ancestry Abilities Schema Validation - Clank', () => {
    describe('Purposeful Design', () => {
        const feat = rawFeat('Purposeful Design',
            'Decide who made you and for what purpose. At character creation, choose one of your Experiences that best aligns with this purpose and gain a permanent +1 bonus to it.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (permanent character creation bonus)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should be timing free (always active)', () => {
            expect(enhanced.enhancement.timing).toBe('free');
        });

        it('should be frequency at_will (permanent bonus)', () => {
            expect(enhanced.enhancement.frequency).toBe('at_will');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Efficient', () => {
        const feat = rawFeat('Efficient',
            'When you take a short rest, you can choose a long rest move instead of a short rest move.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (triggered by taking a rest)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should be timing free (optional during rest)', () => {
            expect(enhanced.enhancement.timing).toBe('free');
        });

        it('should be frequency at_will', () => {
            expect(enhanced.enhancement.frequency).toBe('at_will');
        });
    });
});

describe('Ancestry Abilities Schema Validation - Drakona', () => {
    describe('Scales', () => {
        const feat = rawFeat('Scales',
            'Your scales act as natural protection. When you would take Severe damage, you can **mark a Stress** to mark 1 fewer Hit Points.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type reaction (when you would take damage)', () => {
            expect(enhanced.enhancement.action_type).toBe('reaction');
        });

        it('should be timing reaction', () => {
            expect(enhanced.enhancement.timing).toBe('reaction');
        });

        it('should be frequency at_will', () => {
            expect(enhanced.enhancement.frequency).toBe('at_will');
        });
    });

    describe('Elemental Breath', () => {
        const feat = rawFeat('Elemental Breath',
            'Choose an element for your breath (such as electricity, fire, or ice). You can use this breath against a target or group of targets within Very Close range, treating it as an Instinct weapon that deals **d8** magic damage using your Proficiency.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type attack (deals damage)', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should have attack.trait = Instinct', () => {
            expect(enhanced.enhancement.attack?.trait).toBe('Instinct');
        });

        it('should have attack.range = Very Close', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Very Close');
        });

        it('should have attack.damage = d8', () => {
            expect(enhanced.enhancement.attack?.damage).toBe('d8');
        });

        it('should have attack.damage_type = magic', () => {
            expect(enhanced.enhancement.attack?.damage_type).toBe('magic');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });
});

describe('Ancestry Abilities Schema Validation - Dwarf', () => {
    describe('Thick Skin', () => {
        const feat = rawFeat('Thick Skin',
            'When you take Minor damage, you can **mark 2 Stress** instead of marking a Hit Point.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 2', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(2);
        });

        it('should be action_type reaction (when you take damage)', () => {
            expect(enhanced.enhancement.action_type).toBe('reaction');
        });

        it('should be timing reaction', () => {
            expect(enhanced.enhancement.timing).toBe('reaction');
        });
    });

    describe('Increased Fortitude', () => {
        const feat = rawFeat('Increased Fortitude',
            '**Spend 3 Hope** to halve incoming physical damage.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 3', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(3);
        });

        it('should be action_type reaction (defensive, when taking damage)', () => {
            expect(enhanced.enhancement.action_type).toBe('reaction');
        });

        it('should be timing reaction', () => {
            expect(enhanced.enhancement.timing).toBe('reaction');
        });
    });
});

describe('Ancestry Abilities Schema Validation - Elf', () => {
    describe('Quick Reactions', () => {
        const feat = rawFeat('Quick Reactions',
            '**Mark a Stress** to gain advantage on a **reaction roll**.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type buff (grants advantage)', () => {
            expect(enhanced.enhancement.action_type).toBe('buff');
        });
    });

    describe('Celestial Trance', () => {
        const feat = rawFeat('Celestial Trance',
            'During a rest, you can drop into a trance to choose an additional downtime move.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type downtime (occurs during rest)', () => {
            expect(enhanced.enhancement.action_type).toBe('downtime');
        });

        it('should be timing downtime', () => {
            expect(enhanced.enhancement.timing).toBe('downtime');
        });
    });
});

describe('Ancestry Abilities Schema Validation - Faerie', () => {
    describe('Luckbender', () => {
        const feat = rawFeat('Luckbender',
            'Once per session, after you or a willing ally within Close range makes an **action roll**, you can **spend 3 Hope** to reroll the Duality Dice.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 3', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(3);
        });

        it('should be frequency once_per_session', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_session');
        });

        it('should have attack.range = Close (ally range)', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Close');
        });
    });

    describe('Wings', () => {
        const feat = rawFeat('Wings',
            'You can fly. While flying, you can **mark a Stress** after an adversary makes an attack against you to gain a +2 bonus to your Evasion against that attack.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type reaction (after adversary attacks)', () => {
            expect(enhanced.enhancement.action_type).toBe('reaction');
        });

        it('should be timing reaction', () => {
            expect(enhanced.enhancement.timing).toBe('reaction');
        });

        it('should have modifier for evasion +2', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'evasion');
            expect(mod?.value).toBe(2);
        });
    });
});

describe('Ancestry Abilities Schema Validation - Faun', () => {
    describe('Caprine Leap', () => {
        const feat = rawFeat('Caprine Leap',
            'You can leap anywhere within Close range as though you were using normal movement, allowing you to vault obstacles, jump across gaps, or scale barriers with ease.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (movement ability)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have attack.range = Close (leap range)', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Close');
        });

        it('should have keyword movement', () => {
            expect(enhanced.enhancement.keywords).toContain('movement');
        });
    });

    describe('Kick', () => {
        const feat = rawFeat('Kick',
            'When you succeed on an attack against a target within Melee range, you can **mark a Stress** to kick yourself off them, dealing an extra **2d6** damage and knocking back either yourself or the target to Very Close range.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type passive (triggered by succeeding on an attack)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have attack.damage = 2d6', () => {
            expect(enhanced.enhancement.attack?.damage).toBe('2d6');
        });

        it('should have attack.range defined (Melee or Very Close)', () => {
            expect(['Melee', 'Very Close']).toContain(enhanced.enhancement.attack?.range);
        });
    });
});

describe('Ancestry Abilities Schema Validation - Firbolg', () => {
    describe('Charge', () => {
        const feat = rawFeat('Charge',
            'When you succeed on an **Agility Roll** to move from Far or Very Far range into Melee range with one or more targets, you can **mark a Stress** to deal **1d12** physical damage to all targets within Melee range.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type passive (triggered by movement roll)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have attack.damage = 1d12', () => {
            expect(enhanced.enhancement.attack?.damage).toBe('1d12');
        });

        it('should have attack.damage_type = physical', () => {
            expect(enhanced.enhancement.attack?.damage_type).toBe('physical');
        });

        it('should have keyword aoe (all targets)', () => {
            expect(enhanced.enhancement.keywords).toContain('aoe');
        });

        it('should have roll.trait = Agility', () => {
            expect(enhanced.enhancement.roll?.trait).toBe('Agility');
        });
    });

    describe('Unshakable', () => {
        const feat = rawFeat('Unshakable',
            'When you would **mark a Stress**, roll a **d6**. On a result of 6, don\'t mark it.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (triggered condition)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should be timing reaction (when you would mark stress)', () => {
            expect(enhanced.enhancement.timing).toBe('reaction');
        });

        it('should NOT have costs (prevents stress, not requires it)', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });
});

describe('Ancestry Abilities Schema Validation - Fungril', () => {
    describe('Fungril Network', () => {
        const feat = rawFeat('Fungril Network',
            'Make an **Instinct Roll (12)** to use your mycelial array to speak with others of your ancestry. On a success, you can communicate across any distance.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type utility (communication, not attack)', () => {
            expect(enhanced.enhancement.action_type).toBe('utility');
        });

        it('should have roll.trait = Instinct', () => {
            expect(enhanced.enhancement.roll?.trait).toBe('Instinct');
        });

        it('should have roll.difficulty = 12', () => {
            expect(enhanced.enhancement.roll?.difficulty).toBe(12);
        });
    });

    describe('Death Connection', () => {
        const feat = rawFeat('Death Connection',
            'While touching a corpse that died recently, you can **mark a Stress** to extract one memory from the corpse related to a specific emotion or sensation of your choice.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type utility (information gathering)', () => {
            expect(enhanced.enhancement.action_type).toBe('utility');
        });
    });
});

describe('Ancestry Abilities Schema Validation - Galapa', () => {
    describe('Shell', () => {
        const feat = rawFeat('Shell',
            'Gain a bonus to your damage thresholds equal to your Proficiency.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (permanent bonus)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have modifier for damage_threshold with formula = proficiency', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'damage_threshold');
            expect(mod?.formula).toBe('proficiency');
        });
    });

    describe('Retract', () => {
        const feat = rawFeat('Retract',
            '**Mark a Stress** to retract into your shell. While in your shell, you have resistance to physical damage, you have disadvantage on **action rolls**, and you can\'t move.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type utility (defensive stance)', () => {
            expect(enhanced.enhancement.action_type).toBe('utility');
        });

        it('should have keyword debuff (disadvantage)', () => {
            expect(enhanced.enhancement.keywords).toContain('debuff');
        });
    });
});

describe('Ancestry Abilities Schema Validation - Giant', () => {
    describe('Endurance', () => {
        const feat = rawFeat('Endurance',
            'Gain an additional Hit Point slot at character creation.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (character creation bonus)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have stat_bonuses.hit_point_slots = 1', () => {
            expect(enhanced.stat_bonuses?.hit_point_slots).toBe(1);
        });
    });

    describe('Reach', () => {
        const feat = rawFeat('Reach',
            'Treat any weapon, ability, spell, or other feature that has a Melee range as though it has a Very Close range instead.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (always active)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have attack.range = Very Close (effective range)', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Very Close');
        });
    });
});

describe('Ancestry Abilities Schema Validation - Goblin', () => {
    describe('Surefooted', () => {
        const feat = rawFeat('Surefooted',
            'You ignore disadvantage on **Agility Rolls**.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (always active)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have keyword debuff (removes disadvantage)', () => {
            expect(enhanced.enhancement.keywords).toContain('debuff');
        });
    });

    describe('Danger Sense', () => {
        const feat = rawFeat('Danger Sense',
            'Once per rest, **mark a Stress** to force an adversary to reroll an attack against you or an ally within Very Close range.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should be action_type reaction (during adversary attack)', () => {
            expect(enhanced.enhancement.action_type).toBe('reaction');
        });

        it('should have attack.range = Very Close', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Very Close');
        });
    });
});

describe('Ancestry Abilities Schema Validation - Halfling', () => {
    describe('Luckbringer', () => {
        const feat = rawFeat('Luckbringer',
            'At the start of each session, everyone in your party gains a Hope.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (automatic at session start)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should be frequency once_per_session (or at_will as it happens automatically)', () => {
            expect(['once_per_session', 'at_will']).toContain(enhanced.enhancement.frequency);
        });

        it('should have keyword hope_gain', () => {
            expect(enhanced.enhancement.keywords).toContain('hope_gain');
        });
    });

    describe('Internal Compass', () => {
        const feat = rawFeat('Internal Compass',
            'When you roll a 1 on your Hope Die, you can reroll it.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (triggered by roll result)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });
});

describe('Ancestry Abilities Schema Validation - Human', () => {
    describe('High Stamina', () => {
        const feat = rawFeat('High Stamina',
            'Gain an additional Stress slot at character creation.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (character creation bonus)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have stat_bonuses.stress_slots = 1', () => {
            expect(enhanced.stat_bonuses?.stress_slots).toBe(1);
        });
    });

    describe('Adaptability', () => {
        const feat = rawFeat('Adaptability',
            'When you fail a roll that utilized one of your Experiences, you can **mark a Stress** to reroll.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type passive (triggered by failed roll)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });
    });
});

describe('Ancestry Abilities Schema Validation - Infernis', () => {
    describe('Fearless', () => {
        const feat = rawFeat('Fearless',
            'When you roll with Fear, you can **mark 2 Stress** to change it into a roll with Hope instead.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 2', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(2);
        });

        it('should be action_type passive (triggered by roll result)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });
    });

    describe('Dread Visage', () => {
        const feat = rawFeat('Dread Visage',
            'You have advantage on rolls to intimidate hostile creatures.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (always active advantage)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have keyword buff (grants advantage)', () => {
            expect(enhanced.enhancement.keywords).toContain('buff');
        });
    });
});

describe('Ancestry Abilities Schema Validation - Katari', () => {
    describe('Feline Instincts', () => {
        const feat = rawFeat('Feline Instincts',
            'When you make an **Agility Roll**, you can **spend 2 Hope** to reroll your Hope Die.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 2', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(2);
        });

        it('should be action_type passive (triggered during roll)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have roll.trait = Agility', () => {
            expect(enhanced.enhancement.roll?.trait).toBe('Agility');
        });
    });

    describe('Retracting Claws', () => {
        const feat = rawFeat('Retracting Claws',
            'Make an **Agility Roll** to scratch a target within Melee range. On a success, they become temporarily Vulnerable.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type attack (roll against target)', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should have attack.trait = Agility', () => {
            expect(enhanced.enhancement.attack?.trait).toBe('Agility');
        });

        it('should have attack.range = Melee', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Melee');
        });

        it('should have keyword debuff (vulnerable)', () => {
            expect(enhanced.enhancement.keywords).toContain('debuff');
        });
    });
});

describe('Ancestry Abilities Schema Validation - Orc', () => {
    describe('Sturdy', () => {
        const feat = rawFeat('Sturdy',
            'When you have 1 Hit Point remaining, attacks against you have disadvantage.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (conditional always-on)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });

    describe('Tusks', () => {
        const feat = rawFeat('Tusks',
            'When you succeed on an attack against a target within Melee range, you can **spend a Hope** to gore the target with your tusks, dealing an extra **1d6** damage.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should be action_type passive (triggered by attack success)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have attack.damage = 1d6', () => {
            expect(enhanced.enhancement.attack?.damage).toBe('1d6');
        });

        it('should have attack.range = Melee', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Melee');
        });
    });
});

describe('Ancestry Abilities Schema Validation - Ribbet', () => {
    describe('Amphibious', () => {
        const feat = rawFeat('Amphibious',
            'You can breathe and move naturally underwater.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (always active)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have keyword movement', () => {
            expect(enhanced.enhancement.keywords).toContain('movement');
        });
    });

    describe('Long Tongue', () => {
        const feat = rawFeat('Long Tongue',
            'You can use your long tongue to grab onto things within Close range. **Mark a Stress** to use your tongue as a Finesse Close weapon that deals **d12** physical damage using your Proficiency.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.stress = 1', () => {
            expect(enhanced.enhancement.costs?.stress).toBe(1);
        });

        it('should be action_type attack (weapon attack)', () => {
            expect(enhanced.enhancement.action_type).toBe('attack');
        });

        it('should have attack.trait = Finesse', () => {
            expect(enhanced.enhancement.attack?.trait).toBe('Finesse');
        });

        it('should have attack.range = Close', () => {
            expect(enhanced.enhancement.attack?.range).toBe('Close');
        });

        it('should have attack.damage = d12', () => {
            expect(enhanced.enhancement.attack?.damage).toBe('d12');
        });

        it('should have attack.damage_type = physical', () => {
            expect(enhanced.enhancement.attack?.damage_type).toBe('physical');
        });
    });
});

describe('Ancestry Abilities Schema Validation - Simiah', () => {
    describe('Natural Climber', () => {
        const feat = rawFeat('Natural Climber',
            'You have advantage on **Agility Rolls** that involve balancing and climbing.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (always active advantage)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have keyword buff (grants advantage)', () => {
            expect(enhanced.enhancement.keywords).toContain('buff');
        });
    });

    describe('Nimble', () => {
        const feat = rawFeat('Nimble',
            'Gain a permanent +1 bonus to your Evasion at character creation.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (permanent bonus)', () => {
            expect(enhanced.enhancement.action_type).toBe('passive');
        });

        it('should have modifier for evasion +1', () => {
            const mod = enhanced.enhancement.modifiers?.find(m => m.stat === 'evasion');
            expect(mod?.value).toBe(1);
        });
    });
});
