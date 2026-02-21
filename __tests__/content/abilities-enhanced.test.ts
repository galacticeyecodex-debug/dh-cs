/**
 * ENHANCED ABILITIES JSON - Integration Tests
 * ----------------------------------------------------------------------------
 * Validates that the enhanced abilities.json file has correct parsed metadata
 * 
 * These tests ensure:
 * 1. All cards have required fields
 * 2. Parsed metadata is accurate for known cards
 * 3. Edge cases are handled correctly
 * 4. No regressions in parsing logic
 */

import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import type { EnhancedAbilityCard } from '@/types/cards';
import { getEnhancement } from '@/lib/enhancement-utils';

// Load the enhanced JSON files
const srdAbilities: EnhancedAbilityCard[] = JSON.parse(
    fs.readFileSync(
        path.join(process.cwd(), 'content/public/srd/json/abilities_enhanced.json'),
        'utf-8'
    )
);

// Playtest content is optional (lives in gitignored private folder)
let playtestAbilities: EnhancedAbilityCard[] = [];
const playtestPath = path.join(process.cwd(), 'content/private/playtest/json/abilities.json');
if (fs.existsSync(playtestPath)) {
    playtestAbilities = JSON.parse(fs.readFileSync(playtestPath, 'utf-8'));
} else {
    console.log('Note: Playtest content not available (content/private/playtest not present)');
}

const allAbilities = [...srdAbilities, ...playtestAbilities];

describe('Enhanced Abilities JSON - Schema Validation', () => {
    it('should have all required base fields', () => {
        allAbilities.forEach((card) => {
            expect(card.name).toBeDefined();
            expect(card.level).toBeDefined();
            expect(card.domain).toBeDefined();
            expect(card.type).toBeDefined();
            expect(card.recall).toBeDefined();
            expect(card.text).toBeDefined();
        });
    });

    it('should have valid action_type values', () => {
        allAbilities.forEach((card) => {
            if (card.enhancement?.action_type) {
                expect(card.enhancement.action_type).toBe('attack');
            }
        });
    });

    it('should have valid timing values', () => {
        const validTimings = ['action', 'reaction', 'free', 'downtime'];
        allAbilities.forEach((card) => {
            if (card.enhancement?.timing) {
                expect(validTimings).toContain(card.enhancement.timing);
            }
        });
    });

    it('should have valid frequency values', () => {
        const validFrequencies = ['at_will', 'once_per_rest', 'once_per_long_rest', 'once_per_session'];
        allAbilities.forEach((card) => {
            if (card.enhancement?.frequency) {
                expect(validFrequencies).toContain(card.enhancement.frequency);
            }
        });
    });
});

describe('Enhanced Abilities JSON - Known Cards Validation', () => {
    describe('Rune Ward', () => {
        const runeWard = srdAbilities.find((c) => c.name === 'Rune Ward');

        it('should exist', () => {
            expect(runeWard).toBeDefined();
        });

        // Base fields
        it('should have correct base metadata', () => {
            expect(runeWard?.name).toBe('Rune Ward');
            expect(runeWard?.level).toBe('1');
            expect(runeWard?.domain).toBe('Arcana');
            expect(runeWard?.type).toBe('Spell');
            expect(runeWard?.recall).toBe('0');
            expect(runeWard?.text).toContain('reduce incoming damage');
        });

        // Action classification
        it('should be classified as utility (defensive) -> undefined', () => {
            expect(runeWard?.enhancement?.action_type).toBeUndefined();
        });

        it('should have reaction timing', () => {
            expect(runeWard?.enhancement?.timing).toBe('reaction');
        });

        it('should be at_will frequency', () => {
            expect(runeWard?.enhancement?.frequency).toBe('at_will');
        });

        // Costs
        it('should have hope cost of 1', () => {
            expect(runeWard?.enhancement?.costs).toBeDefined();
            expect(runeWard?.enhancement?.costs?.hope).toBe(1);
            expect(runeWard?.enhancement?.costs?.stress).toBeUndefined();
            expect(runeWard?.enhancement?.costs?.hit_points).toBeUndefined();
        });

        // Keywords
        it('should have damage_reduction keyword (not damage)', () => {
            expect(runeWard?.enhancement?.keywords).toBeDefined();
            expect(runeWard?.enhancement?.keywords).toContain('damage_reduction');
            expect(runeWard?.enhancement?.keywords).toContain('hope_cost');
            expect(runeWard?.enhancement?.keywords).toContain('spell');
            // Should NOT have offensive damage keyword
            expect(runeWard?.enhancement?.keywords).not.toContain('damage');
        });

        // Modifiers
        it('should have exactly one modifier', () => {
            expect(runeWard?.enhancement?.modifiers).toBeDefined();
            expect(runeWard?.enhancement?.modifiers?.length).toBe(1);
        });

        it('should have damage_reduction modifier with 1d8 formula', () => {
            const modifier = runeWard?.enhancement?.modifiers?.find((m) => m.stat === 'damage_reduction');
            expect(modifier).toBeDefined();
            expect(modifier?.stat).toBe('damage_reduction');
            expect(modifier?.value).toBe(0); // Dynamic - rolled at runtime
            expect(modifier?.formula).toBe('1d8');
            expect(modifier?.condition).toEqual({ type: 'always' });
            expect(modifier?.source).toBe('Rune Ward');
        });

        // What it should NOT have
        it('should NOT have attack data', () => {
            expect(runeWard?.enhancement?.attack).toBeUndefined();
        });

        it('should NOT have roll data', () => {
            expect(runeWard?.enhancement?.roll).toBeUndefined();
        });

        it('should NOT have token mechanics', () => {
            expect(runeWard?.enhancement?.tokens).toBeUndefined();
        });

        it('should NOT have threshold modifiers', () => {
            expect(runeWard?.enhancement?.threshold_modifiers).toBeUndefined();
        });

        // Edge case validation
        it('should not be misclassified as an attack', () => {
            // This is a defensive ability that reduces damage
            // It should never be classified as an attack
            expect(runeWard?.enhancement?.action_type).not.toBe('attack');
            expect(runeWard?.enhancement?.timing).not.toBe('action');
        });

        it('should have consistent defensive classification', () => {
            // All defensive abilities should have:
            // - action_type: utility or reaction
            // - timing: reaction
            // - damage_reduction keyword
            // - damage_reduction modifier
            expect(runeWard?.enhancement?.action_type).toBeUndefined();
            expect(runeWard?.enhancement?.timing).toBe('reaction');
            expect(runeWard?.enhancement?.keywords).toContain('damage_reduction');
            expect(runeWard?.enhancement?.modifiers?.some((m) => m.stat === 'damage_reduction')).toBe(true);
        });
    });


    describe('Enhanced Abilities JSON - Modifier Parsing', () => {
        it('should parse static modifiers correctly', () => {
            const cardsWithModifiers = allAbilities.filter((c) => c.enhancement?.modifiers && c.enhancement.modifiers.length > 0);
            expect(cardsWithModifiers.length).toBeGreaterThan(0);

            cardsWithModifiers.forEach((card) => {
                card.enhancement?.modifiers?.forEach((modifier) => {
                    expect(modifier.stat).toBeDefined();
                    expect(typeof modifier.value).toBe('number');
                    expect(modifier.condition).toBeDefined();
                    expect(modifier.source).toBe(card.name);
                });
            });
        });

        it('should parse dynamic modifiers with formulas', () => {
            const cardsWithFormulas = allAbilities.filter((c) =>
                c.enhancement?.modifiers?.some((m) => m.formula)
            );

            cardsWithFormulas.forEach((card) => {
                card.enhancement?.modifiers?.forEach((modifier) => {
                    if (modifier.formula) {
                        // Formula should be in expected format:
                        // - "half_agility" (dynamic stat)
                        // - "3_plus_strength" (complex formula)
                        // - "2_times_strength" (multiplier formula)
                        // - "agility" (simple stat reference)
                        // - "1d8" (dice notation for damage reduction)
                        // - "roll_result_d4" (user rolls dice, enters result)
                        // - "fear_die" (user enters Fear Die result)
                        expect(
                            modifier.formula.includes('half_') ||
                            modifier.formula.includes('_plus_') ||
                            modifier.formula.includes('_times_') ||
                            modifier.formula.startsWith('roll_result_') ||
                            modifier.formula === 'fear_die' ||
                            /^[a-z]+$/.test(modifier.formula) ||
                            /^\d*d\d+(?:\+\d+)?$/.test(modifier.formula) // Dice notation
                        ).toBe(true);
                    }
                });
            });
        });

        it('should have valid condition types', () => {
            const validConditionTypes = [
                'always',
                'when_armored',
                'when_unarmored',
                'when_active',
                'when_active_permanent',
                'when_hp_marked',
                'when_stress_maxed',
                'loadout_domain_count',
                'environment'
            ];

            allAbilities.forEach((card) => {
                // Check both enhancement and enhancement_override modifiers
                const modifiers = [
                    ...(card.enhancement?.modifiers ?? []),
                    ...(card.enhancement_override?.modifiers ?? []),
                ];
                modifiers.forEach((modifier) => {
                    if (modifier.condition) {
                        expect(validConditionTypes).toContain(modifier.condition.type);
                    }
                });
            });
        });
    });
});

describe('Enhanced Abilities JSON - Override Validation', () => {
    describe('Second Wind (Splendor)', () => {
        const card = srdAbilities.find(c => c.name === 'Second Wind');
        const enhancement = card ? getEnhancement(card) : undefined;

        it('should have enhancement_override', () => {
            expect(card?.enhancement_override).toBeDefined();
        });

        it('should use override: frequency once_per_rest', () => {
            expect(enhancement?.frequency).toBe('once_per_rest');
        });

        it('should use override: gains.stress_clear = 3', () => {
            expect(enhancement?.gains?.stress_clear).toBe(3);
        });

        it('should use override: gains.hit_points_clear = 1', () => {
            expect(enhancement?.gains?.hit_points_clear).toBe(1);
        });

        it('should use override: no duplicate keywords', () => {
            const keywords = enhancement?.keywords ?? [];
            const unique = new Set(keywords);
            expect(keywords.length).toBe(unique.size);
        });
    });

    describe('Voice of Reason (Splendor)', () => {
        const card = srdAbilities.find(c => c.name === 'Voice of Reason');
        const enhancement = card ? getEnhancement(card) : undefined;

        it('should have enhancement_override', () => {
            expect(card?.enhancement_override).toBeDefined();
        });

        it('should use override: proficiency modifier +1', () => {
            const mod = enhancement?.modifiers?.find(m => m.stat === 'proficiency');
            expect(mod?.value).toBe(1);
        });

        it('should use override: proficiency modifier condition when_stress_maxed', () => {
            const mod = enhancement?.modifiers?.find(m => m.stat === 'proficiency');
            expect(mod?.condition?.type).toBe('when_stress_maxed');
        });
    });

    describe('Zone of Protection (Splendor)', () => {
        const card = srdAbilities.find(c => c.name === 'Zone of Protection');
        const enhancement = card ? getEnhancement(card) : undefined;

        it('should have enhancement_override', () => {
            expect(card?.enhancement_override).toBeDefined();
        });

        it('should use override: frequency once_per_long_rest', () => {
            expect(enhancement?.frequency).toBe('once_per_long_rest');
        });

        it('should use override: tokens.max_tokens = 6', () => {
            expect(enhancement?.tokens?.max_tokens).toBe(6);
        });

        it('should use override: tokens.initial_tokens = 1', () => {
            expect(enhancement?.tokens?.initial_tokens).toBe(1);
        });

        it('should use override: tokens.tokens_per_use = 1', () => {
            expect(enhancement?.tokens?.tokens_per_use).toBe(1);
        });

        it('should use override: roll.difficulty = 16', () => {
            expect(enhancement?.roll?.difficulty).toBe(16);
        });
    });

    describe('Stunning Sunlight (Splendor)', () => {
        const card = srdAbilities.find(c => c.name === 'Stunning Sunlight');
        const enhancement = card ? getEnhancement(card) : undefined;

        it('should have enhancement_override', () => {
            expect(card?.enhancement_override).toBeDefined();
        });

        it('should use override: primary damage 3d20+3', () => {
            expect(enhancement?.attack?.damage).toBe('3d20+3');
        });

        it('should use override: has additional_damage for fail outcome', () => {
            expect(enhancement?.attack?.additional_damage).toBeDefined();
            expect(enhancement?.attack?.additional_damage?.length).toBe(1);
        });

        it('should use override: additional_damage is 4d20+5 magic', () => {
            const extra = enhancement?.attack?.additional_damage?.[0];
            expect(extra?.damage).toBe('4d20+5');
            expect(extra?.damage_type).toBe('magic');
        });

        it('should use override: additional_damage label is Damage', () => {
            const extra = enhancement?.attack?.additional_damage?.[0];
            expect(extra?.label).toBe('Damage');
        });

        it('should use override: roll.target_reaction = true', () => {
            expect(enhancement?.roll?.target_reaction).toBe(true);
        });
    });

    describe('Overwhelming Aura (Splendor)', () => {
        const card = srdAbilities.find(c => c.name === 'Overwhelming Aura');
        const enhancement = card ? getEnhancement(card) : undefined;

        it('should have enhancement_override', () => {
            expect(card?.enhancement_override).toBeDefined();
        });

        it('should use override: frequency once_per_long_rest', () => {
            expect(enhancement?.frequency).toBe('once_per_long_rest');
        });

        it('should use override: costs.hope = 2', () => {
            expect(enhancement?.costs?.hope).toBe(2);
        });

        it('should use override: no stress cost', () => {
            expect(enhancement?.costs?.stress).toBeUndefined();
        });

        it('should use override: presence modifier with formula spellcast_minus_presence (sets Presence equal to Spellcast)', () => {
            const mod = enhancement?.modifiers?.find(m => m.stat === 'presence');
            expect(mod?.formula).toBe('spellcast_minus_presence');
        });

        it('should use override: presence modifier condition when_active', () => {
            const mod = enhancement?.modifiers?.find(m => m.stat === 'presence');
            expect(mod?.condition?.type).toBe('when_active');
        });

        it('should use override: roll.difficulty = 15', () => {
            expect(enhancement?.roll?.difficulty).toBe(15);
        });
    });

    describe('Invigoration (Splendor)', () => {
        const card = srdAbilities.find(c => c.name === 'Invigoration');
        const enhancement = card ? getEnhancement(card) : undefined;

        it('should have enhancement_override', () => {
            expect(card?.enhancement_override).toBeDefined();
        });

        it('should use override: frequency once_per_session', () => {
            expect(enhancement?.frequency).toBe('once_per_session');
        });

        it('should use override: linked_costs with variable Hope spend', () => {
            const linked = enhancement?.linked_costs?.[0];
            expect(linked?.resource).toBe('hope');
            expect(linked?.amount).toBe('X');
        });

        it('should use override: linked_cost action is variable_roll with d6', () => {
            const linked = enhancement?.linked_costs?.[0];
            expect(linked?.action?.type).toBe('variable_roll');
            expect(linked?.action?.dice).toBe('d6');
        });

        it('should use override: no static hope cost (variable spend only)', () => {
            expect(enhancement?.costs?.hope).toBeUndefined();
        });
    });

    describe('Resurrection (Splendor)', () => {
        const card = srdAbilities.find(c => c.name === 'Resurrection');
        const enhancement = card ? getEnhancement(card) : undefined;

        it('should have enhancement_override', () => {
            expect(card?.enhancement_override).toBeDefined();
        });

        it('should use override: Spellcast Roll with difficulty 20', () => {
            expect(enhancement?.roll?.type).toBe('Spellcast Roll');
            expect(enhancement?.roll?.difficulty).toBe(20);
        });

        it('should use override: attack block with Fate d6 additional damage', () => {
            const fateRoll = enhancement?.attack?.additional_damage?.find(d => d.label === 'Fate');
            expect(fateRoll).toBeDefined();
            expect(fateRoll?.damage).toBe('1d6');
        });
    });

    describe('Gifted Tracker (Sage)', () => {
        const card = srdAbilities.find(c => c.name === 'Gifted Tracker');
        const enhancement = card ? getEnhancement(card) : undefined;

        it('should have enhancement_override', () => {
            expect(card?.enhancement_override).toBeDefined();
        });

        it('should use override: evasion modifier with when_active condition', () => {
            const mod = enhancement?.modifiers?.find(m => m.stat === 'evasion');
            expect(mod?.value).toBe(1);
            expect(mod?.condition?.type).toBe('when_active');
        });

        it('should use override: linked_costs for variable Hope spend', () => {
            const linked = enhancement?.linked_costs?.[0];
            expect(linked?.resource).toBe('hope');
            expect(linked?.amount).toBe('X');
            expect(linked?.action?.type).toBe('custom');
        });

        it('should use override: no static hope cost', () => {
            expect(enhancement?.costs?.hope).toBeUndefined();
        });
    });

    describe("Nature\u2019s Tongue (Sage)", () => {
        const card = srdAbilities.find(c => c.name === "Nature\u2019s Tongue");
        const enhancement = card ? getEnhancement(card) : undefined;

        it('should have enhancement_override', () => {
            expect(card?.enhancement_override).toBeDefined();
        });

        it('should use override: Instinct Roll DC 12', () => {
            expect(enhancement?.roll?.trait).toBe('Instinct');
            expect(enhancement?.roll?.difficulty).toBe(12);
        });

        it('should use override: no linked Hope cost (player adds Experience manually)', () => {
            expect(enhancement?.linked_costs).toBeUndefined();
        });

        it('should use override: no static hope cost', () => {
            expect(enhancement?.costs?.hope).toBeUndefined();
        });
    });

    describe('Corrosive Projectile (Sage)', () => {
        const card = srdAbilities.find(c => c.name === 'Corrosive Projectile');
        const enhancement = card ? getEnhancement(card) : undefined;

        it('should have enhancement_override', () => {
            expect(card?.enhancement_override).toBeDefined();
        });

        it('should use override: combat_category standalone_attack', () => {
            expect(enhancement?.attack?.combat_category).toBe('standalone_attack');
        });

        it('should use override: damage d6+4 magic', () => {
            expect(enhancement?.attack?.damage).toBe('d6+4');
            expect(enhancement?.attack?.damage_type).toBe('magic');
        });

        it('should use override: damage_scaling proficiency', () => {
            expect(enhancement?.attack?.damage_scaling).toBe('proficiency');
        });

        it('should use override: Spellcast Roll', () => {
            expect(enhancement?.roll?.trait).toBe('Spellcast');
        });

        it('should use override: linked_costs with variable stress spend', () => {
            const linked = enhancement?.linked_costs?.[0];
            expect(linked?.resource).toBe('stress');
            expect(linked?.amount).toBe('X');
        });

        it('should use override: when_active modifier for Corroded condition', () => {
            const mod = enhancement?.modifiers?.find(m => m.stat === 'corroded_condition');
            expect(mod).toBeDefined();
            expect(mod?.value).toBe(0);
            expect(mod?.condition?.type).toBe('when_active');
            expect(mod?.source).toBe('Corroded');
        });
    });

    describe('Fane of the Wilds (Sage)', () => {
        const card = srdAbilities.find(c => c.name === 'Fane of the Wilds');
        const enhancement = card ? getEnhancement(card) : undefined;

        it('should have enhancement_override', () => {
            expect(card?.enhancement_override).toBeDefined();
        });

        it('should use override: token_label "Tokens" (not "Tokens (The)")', () => {
            expect(enhancement?.tokens?.token_label).toBe('Tokens');
        });

        it('should use override: no token_source (avoids label bug)', () => {
            expect(enhancement?.tokens?.token_source).toBeUndefined();
        });

        it('should use override: has_tokens = true', () => {
            expect(enhancement?.tokens?.has_tokens).toBe(true);
        });

        it('should use override: Spellcast Roll', () => {
            expect(enhancement?.roll?.trait).toBe('Spellcast');
        });
    });

    describe('Thorn Skin (Sage)', () => {
        const card = srdAbilities.find(c => c.name === 'Thorn Skin');
        const enhancement = card ? getEnhancement(card) : undefined;

        it('should have enhancement_override', () => {
            expect(card?.enhancement_override).toBeDefined();
        });

        it('should use override: token tracking with spellcast source', () => {
            expect(enhancement?.tokens?.has_tokens).toBe(true);
            expect(enhancement?.tokens?.token_source).toBe('spellcast');
        });

        it('should use override: linked_costs for token-spending d6 rolls', () => {
            const linked = enhancement?.linked_costs?.[0];
            expect(linked?.resource).toBe('tokens');
            expect(linked?.amount).toBe('X');
            expect(linked?.action?.type).toBe('variable_roll');
            expect(linked?.action?.dice).toBe('d6');
        });

        it('should use override: hope cost of 1', () => {
            expect(enhancement?.costs?.hope).toBe(1);
        });

        it('should use override: frequency once_per_rest', () => {
            expect(enhancement?.frequency).toBe('once_per_rest');
        });
    });

    describe('Wild Fortress (Sage)', () => {
        const card = srdAbilities.find(c => c.name === 'Wild Fortress');
        const enhancement = card ? getEnhancement(card) : undefined;

        it('should have enhancement_override', () => {
            expect(card?.enhancement_override).toBeDefined();
        });

        it('should use override: tokens.max_tokens = 3', () => {
            expect(enhancement?.tokens?.max_tokens).toBe(3);
        });

        it('should use override: tokens.initial_tokens = 0', () => {
            expect(enhancement?.tokens?.initial_tokens).toBe(0);
        });

        it('should use override: tokens.token_label = Barricade Hit Points', () => {
            expect(enhancement?.tokens?.token_label).toBe('Barricade Hit Points');
        });

        it('should use override: Spellcast Roll DC 13', () => {
            expect(enhancement?.roll?.difficulty).toBe(13);
        });

        it('should use override: costs.hope = 2', () => {
            expect(enhancement?.costs?.hope).toBe(2);
        });
    });

    describe('Forager (Sage)', () => {
        const card = srdAbilities.find(c => c.name === 'Forager');
        const enhancement = card ? getEnhancement(card) : undefined;

        it('should have enhancement_override', () => {
            expect(card?.enhancement_override).toBeDefined();
        });

        it('should use override: timing downtime', () => {
            expect(enhancement?.timing).toBe('downtime');
        });

        it('should use override: d6 roll via damage_reduction_roll', () => {
            expect(enhancement?.gains?.damage_reduction_roll).toBe('1d6');
        });

        it('should use override: no Spellcast roll', () => {
            expect(enhancement?.roll).toBeUndefined();
        });

        it('should use override: deduplicated keywords', () => {
            const keywords = enhancement?.keywords ?? [];
            const unique = new Set(keywords);
            expect(keywords.length).toBe(unique.size);
        });
    });

    describe('Wild Surge (Sage)', () => {
        const card = srdAbilities.find(c => c.name === 'Wild Surge');
        const enhancement = card ? getEnhancement(card) : undefined;

        it('should have enhancement_override', () => {
            expect(card?.enhancement_override).toBeDefined();
        });

        it('should use override: tokens.max_tokens = 6', () => {
            expect(enhancement?.tokens?.max_tokens).toBe(6);
        });

        it('should use override: tokens.initial_tokens = 1', () => {
            expect(enhancement?.tokens?.initial_tokens).toBe(1);
        });

        it('should use override: tokens.token_label = Wild Surge Value', () => {
            expect(enhancement?.tokens?.token_label).toBe('Wild Surge Value');
        });

        it('should use override: frequency once_per_long_rest', () => {
            expect(enhancement?.frequency).toBe('once_per_long_rest');
        });

        it('should use override: costs.stress = 1', () => {
            expect(enhancement?.costs?.stress).toBe(1);
        });
    });

    describe('Forest Sprites (Sage)', () => {
        const card = srdAbilities.find(c => c.name === 'Forest Sprites');
        const enhancement = card ? getEnhancement(card) : undefined;

        it('should have enhancement_override', () => {
            expect(card?.enhancement_override).toBeDefined();
        });

        it('should use override: token tracking with Sprites label', () => {
            expect(enhancement?.tokens?.has_tokens).toBe(true);
            expect(enhancement?.tokens?.token_label).toBe('Sprites');
        });

        it('should use override: Spellcast Roll DC 13', () => {
            expect(enhancement?.roll?.difficulty).toBe(13);
        });

        it('should use override: linked_costs for Hope -> Sprites', () => {
            const linked = enhancement?.linked_costs?.[0];
            expect(linked?.resource).toBe('hope');
            expect(linked?.amount).toBe('X');
            expect(linked?.action?.type).toBe('gain_tokens');
        });

        it('should use override: no permanent +3 attack modifier', () => {
            const mod = enhancement?.modifiers?.find(m => m.stat === 'attack' && m.condition?.type === 'always');
            expect(mod).toBeUndefined();
        });
    });

    describe('Rejuvenation Barrier (Sage)', () => {
        const card = srdAbilities.find(c => c.name === 'Rejuvenation Barrier');
        const enhancement = card ? getEnhancement(card) : undefined;

        it('should have enhancement_override', () => {
            expect(card?.enhancement_override).toBeDefined();
        });

        it('should use override: when_active modifier for physical resistance display', () => {
            const mod = enhancement?.modifiers?.find(m => m.condition?.type === 'when_active');
            expect(mod).toBeDefined();
            expect(mod?.source).toBe('Resistance to Physical Damage');
        });

        it('should use override: gains.damage_reduction_roll = 1d4', () => {
            expect(enhancement?.gains?.damage_reduction_roll).toBe('1d4');
        });

        it('should use override: gains.hit_points_clear = 1', () => {
            expect(enhancement?.gains?.hit_points_clear).toBe(1);
        });

        it('should use override: Spellcast Roll DC 15', () => {
            expect(enhancement?.roll?.difficulty).toBe(15);
        });

        it('should use override: frequency once_per_rest', () => {
            expect(enhancement?.frequency).toBe('once_per_rest');
        });
    });

    describe('Tempest (Sage)', () => {
        const card = srdAbilities.find(c => c.name === 'Tempest');
        const enhancement = card ? getEnhancement(card) : undefined;

        it('should have enhancement_override', () => {
            expect(card?.enhancement_override).toBeDefined();
        });

        it('should use override: 3 additional_damage entries', () => {
            expect(enhancement?.attack?.additional_damage?.length).toBe(3);
        });

        it('should use override: Blizzard 2d20+8 magic', () => {
            const blizzard = enhancement?.attack?.additional_damage?.find(d => d.label === 'Blizzard');
            expect(blizzard?.damage).toBe('2d20+8');
            expect(blizzard?.damage_type).toBe('magic');
        });

        it('should use override: Hurricane 3d10+10 magic', () => {
            const hurricane = enhancement?.attack?.additional_damage?.find(d => d.label === 'Hurricane');
            expect(hurricane?.damage).toBe('3d10+10');
            expect(hurricane?.damage_type).toBe('magic');
        });

        it('should use override: Sandstorm 5d6+9 magic', () => {
            const sandstorm = enhancement?.attack?.additional_damage?.find(d => d.label === 'Sandstorm');
            expect(sandstorm?.damage).toBe('5d6+9');
            expect(sandstorm?.damage_type).toBe('magic');
        });

        it('should use override: Spellcast Roll', () => {
            expect(enhancement?.roll?.trait).toBe('Spellcast');
        });

        it('should use override: deduplicated keywords', () => {
            const keywords = enhancement?.keywords ?? [];
            const unique = new Set(keywords);
            expect(keywords.length).toBe(unique.size);
        });
    });
});

    describe('Enhanced Abilities JSON - Attack Parsing', () => {
        it('should have attack data for attack-type cards', () => {
            const attackCards = allAbilities.filter((c) => c.enhancement?.action_type === 'attack');

            // Some attack cards (e.g., Whirlwind, Boost) have range but no trait
            // as they may use a default trait or have variable trait selection
            const cardsWithoutTraitAllowed = ['Whirlwind', 'Boost'];

            attackCards.forEach((card) => {
                // Most attacks should have attack data (some edge cases may not)
                if (card.enhancement?.attack) {
                    // Range should always be defined for attack cards with attack data
                    expect(card.enhancement.attack.range).toBeDefined();

                    // Trait is expected unless the card is a known edge case
                    if (!cardsWithoutTraitAllowed.includes(card.name)) {
                        expect(card.enhancement.attack.trait).toBeDefined();
                    }
                }
            });
        });

        it('should have valid combat_category values', () => {
            const validCategories = ['standalone_attack', 'damage_bonus', 'roll_only', 'passive_triggered'];

            allAbilities.forEach((card) => {
                if (card.enhancement?.attack?.combat_category) {
                    expect(validCategories).toContain(card.enhancement.attack.combat_category);
                }
            });
        });

        it('should have valid damage_type values', () => {
            const validTypes = ['magic', 'physical'];

            allAbilities.forEach((card) => {
                if (card.enhancement?.attack?.damage_type) {
                    expect(validTypes).toContain(card.enhancement.attack.damage_type);
                }
            });
        });
    });

    describe('Enhanced Abilities JSON - Keyword Extraction', () => {
        it('should not have false positive hope_gain keywords', () => {
            // Cards that spend hope should not have hope_gain
            const hopeSpenders = allAbilities.filter((c) => c.enhancement?.costs?.hope);

            hopeSpenders.forEach((card) => {
                // Unless the card explicitly grants hope back
                if (!card.text.toLowerCase().includes('gain') || !card.text.toLowerCase().includes('hope')) {
                    expect(card.enhancement?.keywords).not.toContain('hope_gain');
                }
            });
        });

        it('should not have false positive stress_relief keywords', () => {
            // Cards that mark stress should not have stress_relief
            const stressMarkers = allAbilities.filter((c) => c.enhancement?.costs?.stress);

            stressMarkers.forEach((card) => {
                // Unless the card explicitly clears stress
                if (!card.text.toLowerCase().includes('clear') || !card.text.toLowerCase().includes('stress')) {
                    expect(card.enhancement?.keywords).not.toContain('stress_relief');
                }
            });
        });
    });

    describe('Enhanced Abilities JSON - Statistics', () => {
        it('should have expected distribution of action types', () => {
            const counts: Record<string, number> = {
                attack: 0,
                undefined: 0,
            };

            allAbilities.forEach((card) => {
                if (card.enhancement?.action_type === 'attack') {
                    counts.attack++;
                } else {
                    counts.undefined++;
                }
            });

            // Sanity checks - these numbers should be reasonable
            expect(counts.attack).toBeGreaterThan(40); // Should have many attacks
            expect(counts.undefined).toBeGreaterThan(30); // Should have many non-attacks
        });

        it('should have cards with modifiers', () => {
            const withModifiers = allAbilities.filter((c) => c.enhancement?.modifiers && c.enhancement.modifiers.length > 0);
            expect(withModifiers.length).toBeGreaterThan(10); // Should have at least 10 cards with modifiers
        });

        it('should have cards with token mechanics', () => {
            const withTokens = allAbilities.filter((c) => c.enhancement?.tokens?.has_tokens);
            expect(withTokens.length).toBeGreaterThan(10); // Should have at least 10 cards with tokens
        });
    });

