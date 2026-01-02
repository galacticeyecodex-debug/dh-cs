/**
 * ABILITIES SCHEMA VALIDATION TESTS - CODEX DOMAIN
 */

import { describe, it, expect } from 'vitest';
import { enhanceAbilityCard } from '@/lib/card-parser';

function rawAbility(name: string, type: string, text: string) {
    return { name, level: '1', domain: 'Codex', type, recall: '0', text };
}

describe('Abilities Schema Validation - Codex Domain', () => {
    describe('Book of Ava', () => {
        const ability = rawAbility('Book of Ava', 'Grimoire',
            '**Power Push:** Make a **Spellcast Roll** against a target within Melee range.\nOn a success, they\'re knocked back to Far range and take **d10+2** magic damage using your Proficiency.\n\n**Tova\'s Armor:** **Spend a Hope** to give a target you can touch a +1 bonus to their Armor Score until their next rest or you cast Tova\'s Armor again.\n\n**Ice Spike:** Make a **Spellcast Roll (12)** to summon a large ice spike within Far range. If you use it as a weapon, make the **Spellcast Roll** against the target\'s Difficulty instead. On a success, deal **d6** physical damage using your Proficiency.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1 (Tova\'s Armor)', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should be action_type attack (Power Push and Ice Spike deal damage)', () => {
            expect(enhanced.action_type).toBe('attack');
        });

        it('should have modifier for armor_score +1', () => {
            const mod = enhanced.modifiers?.find(m => m.stat === 'armor_score');
            expect(mod?.value).toBe(1);
        });
    });

    describe('Book of Illiat', () => {
        const ability = rawAbility('Book of Illiat', 'Grimoire',
            '**Slumber:** Make a **Spellcast Roll** against a target within Very Close range. On a success, they\'re Asleep until they take damage or the GM spends a Fear on their turn to clear this condition.\n\n**Arcane Barrage:** Once per rest, **spend any number of Hope** and shoot magical projectiles that strike a target of your choice within Close range. Roll a number of **d6s** equal to the Hope spent and deal that much magic damage to the target.\n\n**Telepathy:** **Spend a Hope** to open a line of mental communication with one target you can see. This connection lasts until your next rest or you cast Telepathy again.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1 (Telepathy base cost)', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should be frequency once_per_rest (Arcane Barrage)', () => {
            expect(enhanced.frequency).toBe('once_per_rest');
        });

        it('should have duration = rest (Telepathy lasts until rest)', () => {
            expect(enhanced.duration).toBe('rest');
        });
    });

    describe('Book of Tyfar', () => {
        const ability = rawAbility('Book of Tyfar', 'Grimoire',
            '**Wild Flame:** Make a **Spellcast Roll** against up to three adversaries within Melee range. Targets you succeed against take **2d6** magic damage and must **mark a Stress** as flames erupt from your hand.\n\n**Magic Hand:** You conjure a magical hand with the same size and strength as your own within Far range.\n\n**Mysterious Mist:** Make a **Spellcast Roll (13)** to cast a temporary thick fog that gathers in a stationary area within Very Close range. The fog heavily obscures this area and everything in it.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type attack', () => {
            expect(enhanced.action_type).toBe('attack');
        });

        it('should have attack.damage_type = magic', () => {
            expect(enhanced.attack?.damage_type).toBe('magic');
        });
    });

    describe('Book of Sitil', () => {
        const ability = rawAbility('Book of Sitil', 'Grimoire',
            '**Adjust Appearance:** You magically shift your appearance and clothing to avoid recognition.\n\n**Parallecta:** **Spend 2 Hope** to cast this spell on yourself or an ally within Close range. The next time the target makes an attack, they can roll an additional target within range that their attack roll would succeed against. You can only hold this spell on one creature at a time.\n\n**Illusion:** Make a **Spellcast Roll (14)**.\nOn a success, create a temporary visual illusion no larger than you within Close range that lasts for as long as you look at it. It holds up to scrutiny until an observer is within Melee range.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 2 (Parallecta)', () => {
            expect(enhanced.costs?.hope).toBe(2);
        });

        it('should be action_type utility or buff', () => {
            expect(['utility', 'buff']).toContain(enhanced.action_type);
        });
    });

    describe('Book of Vagras', () => {
        const ability = rawAbility('Book of Vagras', 'Grimoire',
            '**Runic Lock:** Make a **Spellcast Roll (15)** on an object you\'re touching that can close (such as a lock, chest, or box). Once per rest on a success, you can lock the object so it can only be opened by creatures of your choice. Someone with access to magic and an hour of time to study the spell can break it.\n\n**Arcane Door:** When you have no adversaries within Melee range, make a **Spellcast Roll (13)**. On a success, **spend a Hope** to create a portal from where you are to a point within Far range you can see. It closes once a creature has passed through it.\n\n**Reveal:** Make a **Spellcast Roll**. If there is anything magically hidden within Close range, it is revealed.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1 (Arcane Door)', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should be frequency once_per_rest (Runic Lock)', () => {
            expect(enhanced.frequency).toBe('once_per_rest');
        });
    });

    describe('Book of Korvax', () => {
        const ability = rawAbility('Book of Korvax', 'Grimoire',
            '**Levitation:** Make a **Spellcast Roll** to temporarily lift a target you can see up into the air and move them within Close range of their original position.\n\n**Recant:** **Spend a Hope** to force a target within Melee range to make a **Reaction Roll (15)**. On a failure, they forget the last minute of your conversation.\n\n**Rune Circle:** **Mark a Stress** to create a temporary magical circle on the ground where you stand. All adversaries within Melee range, who enter Melee range, take **2d12+4** magic damage and are knocked back to Very Close range.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1 (Recant)', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should have costs.stress = 1 (Rune Circle)', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });

        it('should have roll.target_reaction = true (Recant forces reaction)', () => {
            expect(enhanced.roll?.target_reaction).toBe(true);
        });
    });

    describe('Book of Norai', () => {
        const ability = rawAbility('Book of Norai', 'Grimoire',
            '**Mystic Tether:** Make a **Spellcast Roll** against a target within Far range. On a success, they\'re temporarily Restrained and must **mark a Stress**. If you target a flying creature, this spell grounds and temporarily Restrains them.\n\n**Fireball:** Make a **Spellcast Roll** against a target within Very Far range. On a success, hurl a sphere of fire toward them that explodes on impact. The target and all creatures within Very Close range of them must make a **Reaction Roll (13)**. Targets who fail take **4d20+5** magic damage using your Proficiency. Targets who succeed take half damage.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type attack (Fireball deals massive damage)', () => {
            expect(enhanced.action_type).toBe('attack');
        });

        it('should have attack.range = Very Far (Fireball)', () => {
            expect(enhanced.attack?.range).toBe('Very Far');
        });

        it('should have roll.target_reaction = true', () => {
            expect(enhanced.roll?.target_reaction).toBe(true);
        });
    });

    describe('Book of Exota', () => {
        const ability = rawAbility('Book of Exota', 'Grimoire',
            '**Repudiate:** You can interrupt a magical effect taking place. Make a **reaction roll** using your Spellcast trait. Once per rest on a success, the effect stops and any consequences are avoided.\n\n**Create Construct:** **Spend a Hope** to choose a group of objects around you and create an animated construct from them that obeys basic commands. Make a **Spellcast Roll** to command them to take action. When necessary, they share your Evasion and traits and their attacks deal **2d10+3** physical damage. You can only maintain one construct at a time, and they fall apart when they take any amount of damage.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1 (Create Construct)', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should be frequency once_per_rest (Repudiate)', () => {
            expect(enhanced.frequency).toBe('once_per_rest');
        });

        it('should be action_type reaction (Repudiate is a reaction)', () => {
            expect(enhanced.action_type).toBe('reaction');
        });
    });

    describe('Book of Grynn', () => {
        const ability = rawAbility('Book of Grynn', 'Grimoire',
            '**Arcane Deflection:** Once per long rest, **spend a Hope** to negate the damage of an attack targeting you or an ally within Very Close range.\n\n**Time Lock:** Target an object within Far range. That object stops in time and space exactly where it is until your next rest. If a creature tries to move it, make a **Spellcast Roll** against them to maintain this spell.\n\n**Wall of Flame:** Make a **Spellcast Roll (15)**. On a success, create a temporary wall of magical flame between two points within Far range. All creatures in its path must choose a side to be on, and anything that subsequently passes through the wall takes **4d10+3** magic damage.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1 (Arcane Deflection)', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should be frequency once_per_long_rest (Arcane Deflection)', () => {
            expect(enhanced.frequency).toBe('once_per_long_rest');
        });

        it('should have duration = rest (Time Lock)', () => {
            expect(enhanced.duration).toBe('rest');
        });
    });

    describe('Manifest Wall', () => {
        const ability = rawAbility('Manifest Wall', 'Spell',
            'Make a **Spellcast Roll (15)**. Once per rest on a success, **spend a Hope** to create a temporary magical wall between two points within Far range. It can be up to 50 feet high and form at any angle. Creatures or objects in its path are shunted to a side of their choice. The wall stays up until your next rest or you cast Manifest Wall again.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should be frequency once_per_rest', () => {
            expect(enhanced.frequency).toBe('once_per_rest');
        });

        it('should have duration = rest', () => {
            expect(enhanced.duration).toBe('rest');
        });

        it('should have roll.difficulty = 15', () => {
            expect(enhanced.roll?.difficulty).toBe(15);
        });
    });

    describe('Teleport', () => {
        const ability = rawAbility('Teleport', 'Spell',
            'Once per long rest, you can instantly teleport yourself and any number of willing targets within Close range to a place you\'ve been before. Choose one of the following options, then make a **Spellcast Roll (16)**:\n\n- If you know the place very well, gain a +3 bonus.\n- If you\'ve visited the place frequently, gain a +1 bonus.\n- If you\'ve visited the place infrequently, gain no modifier.\n- If you\'ve only been there once, gain a -2 penalty.\n\nOn a success, you appear where you were intending to go. On a failure, you appear off course, with the range of failure determining how far off course.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.frequency).toBe('once_per_long_rest');
        });

        it('should have roll.difficulty = 16', () => {
            expect(enhanced.roll?.difficulty).toBe(16);
        });

        it('should be action_type utility', () => {
            expect(enhanced.action_type).toBe('utility');
        });
    });

    describe('Banish', () => {
        const ability = rawAbility('Banish', 'Spell',
            'Make a **Spellcast Roll** against a target within Close range. On a success, roll a number of **d20s** equal to your Spellcast trait. The target must make a **reaction roll** with a Difficulty equal to your highest result. On a success, the target must **mark a Stress** but isn\'t banished. Once per rest on a failure, they are banished from this realm.\n\nWhen the PCs roll with Fear, the Difficulty gains a -1 penalty and the target makes another **reaction roll**. On a success, they return from banishment.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_rest', () => {
            expect(enhanced.frequency).toBe('once_per_rest');
        });

        it('should have roll.target_reaction = true', () => {
            expect(enhanced.roll?.target_reaction).toBe(true);
        });
    });

    describe('Sigil of Retribution', () => {
        const ability = rawAbility('Sigil of Retribution', 'Spell',
            'Mark an adversary within Close range with a sigil of retribution. The GM gains a Fear. When the marked adversary deals damage to you or your allies, place a **d8** on this card. You can hold a number of **d8s** equal to your level. When you successfully attack the marked adversary, roll the dice on this card and add the total to your damage roll, then clear the dice. This effect ends when the marked adversary is defeated or you cast Sigil of Retribution again.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be action_type utility (marks target, no immediate damage)', () => {
            expect(enhanced.action_type).toBe('utility');
        });

        it('should be frequency at_will', () => {
            expect(enhanced.frequency).toBe('at_will');
        });
    });

    describe('Book of Homet', () => {
        const ability = rawAbility('Book of Homet', 'Grimoire',
            '**Pass Through:** Make a **Spellcast Roll (13)**. Once per rest on a success, you and all creatures touching you can pass through a wall or door within Close range. The effect ends once everyone is on the other side.\n\n**Plane Gate:** Make a **Spellcast Roll (14)**. Once per long rest on a success, open a gateway to a location in another dimension or plane of existence you\'ve been to before. This gateway lasts until your next rest.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest (Plane Gate is more restrictive)', () => {
            expect(enhanced.frequency).toBe('once_per_long_rest');
        });

        it('should have duration = rest (Plane Gate)', () => {
            expect(enhanced.duration).toBe('rest');
        });
    });

    describe('Codex-Touched', () => {
        const ability = rawAbility('Codex-Touched', 'Ability',
            'When 4 or more of the domain cards in your loadout are from the Codex domain, gain the following benefits:\n\n- You can **mark a Stress** to add your Proficiency to a **Spellcast Roll**.\n- Once per rest, replace this card with any card from your vault without paying its Recall Cost.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.stress = 1', () => {
            expect(enhanced.costs?.stress).toBe(1);
        });

        it('should be frequency once_per_rest', () => {
            expect(enhanced.frequency).toBe('once_per_rest');
        });

        it('should be action_type passive', () => {
            expect(enhanced.action_type).toBe('passive');
        });
    });

    describe('Book of Vyola', () => {
        const ability = rawAbility('Book of Vyola', 'Grimoire',
            '**Memory Delve:** Make a **Spellcast Roll** against a target within Far range. On a success, peer into the target\'s mind and ask the GM a question. The GM describes any memories the target has pertaining to the answer.\n\n**Shared Clarity:** Once per long rest, **spend a Hope** to choose two willing creatures. When one of them would **mark Stress**, they can choose between the two of them who marks it. This spell lasts until their next rest.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 1 (Shared Clarity)', () => {
            expect(enhanced.costs?.hope).toBe(1);
        });

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.frequency).toBe('once_per_long_rest');
        });
    });

    describe('Safe Haven', () => {
        const ability = rawAbility('Safe Haven', 'Spell',
            'When you have a few minutes of calm to focus, you can **spend 2 Hope** to summon your Safe Haven, a large interdimensional home where you and your allies can take shelter. When you do, a magical door appears somewhere within Close range. Only creatures of your choice can enter. Once inside, you can make the entrance invisible. You and anyone else inside can always exit. Once you leave, the doorway must be summoned again.\n\nWhen you take a rest within your own Safe Haven, you can choose an additional downtime move.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 2', () => {
            expect(enhanced.costs?.hope).toBe(2);
        });

        it('should be action_type downtime', () => {
            expect(enhanced.action_type).toBe('downtime');
        });

        it('should be timing downtime', () => {
            expect(enhanced.timing).toBe('downtime');
        });
    });

    describe('Book of Ronin', () => {
        const ability = rawAbility('Book of Ronin', 'Grimoire',
            '**Transform:** Make a **Spellcast Roll (15)**. On a success, transform into an inanimate object no larger than twice your normal size. You can remain in this shape until you take damage.\n\n**Eternal Enervation:** Once per long rest, make a **Spellcast Roll** against a target within Close range. On a success, they become permanently Vulnerable. They can\'t clear this condition by any means.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest (Eternal Enervation)', () => {
            expect(enhanced.frequency).toBe('once_per_long_rest');
        });

        it('should have roll.difficulty = 15 (Transform)', () => {
            expect(enhanced.roll?.difficulty).toBe(15);
        });
    });

    describe('Disintegration Wave', () => {
        const ability = rawAbility('Disintegration Wave', 'Spell',
            'Make a **Spellcast Roll (18)**. Once per long rest on a success, the GM tells you which adversaries within Far range have a Difficulty of 18 or lower. **Mark a Stress** for each one you wish to hit with this spell. They are killed and can\'t come back to life by any means.');
        const enhanced = enhanceAbilityCard(ability);

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.frequency).toBe('once_per_long_rest');
        });

        it('should have roll.difficulty = 18', () => {
            expect(enhanced.roll?.difficulty).toBe(18);
        });
    });

    describe('Book of Yarrow', () => {
        const ability = rawAbility('Book of Yarrow', 'Grimoire',
            '**Timejammer:** Make a **Spellcast Roll (18)**. On a success, time temporarily slows to a halt for everyone within Far range except for you. It resumes the next time you make an **action roll** that targets another creature.\n\n**Magic Immunity:** **Spend 5 Hope** to become immune to magic damage until your next rest.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 5 (Magic Immunity)', () => {
            expect(enhanced.costs?.hope).toBe(5);
        });

        it('should have duration = rest (Magic Immunity)', () => {
            expect(enhanced.duration).toBe('rest');
        });
    });

    describe('Transcendent Union', () => {
        const ability = rawAbility('Transcendent Union', 'Spell',
            'Once per long rest, **spend 5 Hope** to cast this spell on two or more willing creatures. Until your next rest, when a creature connected by this union would **mark Stress** or Hit Points, the connected creatures can choose who marks it.');
        const enhanced = enhanceAbilityCard(ability);

        it('should have costs.hope = 5', () => {
            expect(enhanced.costs?.hope).toBe(5);
        });

        it('should be frequency once_per_long_rest', () => {
            expect(enhanced.frequency).toBe('once_per_long_rest');
        });

        it('should have duration = rest', () => {
            expect(enhanced.duration).toBe('rest');
        });
    });
});
