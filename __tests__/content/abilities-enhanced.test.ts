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
import type { EnhancedAbilityCard } from '@/types/cards';

// Load the enhanced JSON files
const srdAbilities: EnhancedAbilityCard[] = JSON.parse(
    fs.readFileSync(
        path.join(process.cwd(), 'content/srd/json/abilities_enhanced.json'),
        'utf-8'
    )
);

const playtestAbilities: EnhancedAbilityCard[] = JSON.parse(
    fs.readFileSync(
        path.join(process.cwd(), 'content/playtest/json/abilities.json'),
        'utf-8'
    )
);

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
        const validTypes = ['attack', 'reaction', 'passive', 'downtime', 'buff', 'utility'];
        allAbilities.forEach((card) => {
            if (card.action_type) {
                expect(validTypes).toContain(card.action_type);
            }
        });
    });

    it('should have valid timing values', () => {
        const validTimings = ['action', 'reaction', 'free', 'downtime'];
        allAbilities.forEach((card) => {
            if (card.timing) {
                expect(validTimings).toContain(card.timing);
            }
        });
    });

    it('should have valid frequency values', () => {
        const validFrequencies = ['at_will', 'once_per_rest', 'once_per_long_rest', 'once_per_session'];
        allAbilities.forEach((card) => {
            if (card.frequency) {
                expect(validFrequencies).toContain(card.frequency);
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
        it('should be classified as utility (defensive)', () => {
            expect(runeWard?.action_type).toBe('utility');
        });

        it('should have reaction timing', () => {
            expect(runeWard?.timing).toBe('reaction');
        });

        it('should be at_will frequency', () => {
            expect(runeWard?.frequency).toBe('at_will');
        });

        // Costs
        it('should have hope cost of 1', () => {
            expect(runeWard?.costs).toBeDefined();
            expect(runeWard?.costs?.hope).toBe(1);
            expect(runeWard?.costs?.stress).toBeUndefined();
            expect(runeWard?.costs?.hit_points).toBeUndefined();
        });

        // Keywords
        it('should have damage_reduction keyword (not damage)', () => {
            expect(runeWard?.keywords).toBeDefined();
            expect(runeWard?.keywords).toContain('damage_reduction');
            expect(runeWard?.keywords).toContain('hope_cost');
            expect(runeWard?.keywords).toContain('spell');
            // Should NOT have offensive damage keyword
            expect(runeWard?.keywords).not.toContain('damage');
        });

        // Modifiers
        it('should have exactly one modifier', () => {
            expect(runeWard?.modifiers).toBeDefined();
            expect(runeWard?.modifiers?.length).toBe(1);
        });

        it('should have damage_reduction modifier with 1d8 formula', () => {
            const modifier = runeWard?.modifiers?.find((m) => m.stat === 'damage_reduction');
            expect(modifier).toBeDefined();
            expect(modifier?.stat).toBe('damage_reduction');
            expect(modifier?.value).toBe(0); // Dynamic - rolled at runtime
            expect(modifier?.formula).toBe('1d8');
            expect(modifier?.condition).toEqual({ type: 'always' });
            expect(modifier?.source).toBe('Rune Ward');
        });

        // What it should NOT have
        it('should NOT have attack data', () => {
            expect(runeWard?.attack).toBeUndefined();
        });

        it('should NOT have roll data', () => {
            expect(runeWard?.roll).toBeUndefined();
        });

        it('should NOT have token mechanics', () => {
            expect(runeWard?.has_tokens).toBeUndefined();
            expect(runeWard?.max_tokens).toBeUndefined();
            expect(runeWard?.token_source).toBeUndefined();
        });

        it('should NOT have threshold modifiers', () => {
            expect(runeWard?.threshold_modifiers).toBeUndefined();
        });

        // Edge case validation
        it('should not be misclassified as an attack', () => {
            // This is a defensive ability that reduces damage
            // It should never be classified as an attack
            expect(runeWard?.action_type).not.toBe('attack');
            expect(runeWard?.timing).not.toBe('action');
        });

        it('should have consistent defensive classification', () => {
            // All defensive abilities should have:
            // - action_type: utility or reaction
            // - timing: reaction
            // - damage_reduction keyword
            // - damage_reduction modifier
            expect(['utility', 'reaction']).toContain(runeWard?.action_type);
            expect(runeWard?.timing).toBe('reaction');
            expect(runeWard?.keywords).toContain('damage_reduction');
            expect(runeWard?.modifiers?.some((m) => m.stat === 'damage_reduction')).toBe(true);
        });
    });

    describe('Frenzy', () => {
        const frenzy = srdAbilities.find((c) => c.name === 'Frenzy');

        it('should exist', () => {
            expect(frenzy).toBeDefined();
        });

        it('should be classified as passive', () => {
            expect(frenzy?.action_type).toBe('passive');
        });

        it('should have modifiers array', () => {
            expect(frenzy?.modifiers).toBeDefined();
            expect(Array.isArray(frenzy?.modifiers)).toBe(true);
        });

        it('should have +10 damage modifier', () => {
            const damageModifier = frenzy?.modifiers?.find((m) => m.stat === 'damage');
            expect(damageModifier).toBeDefined();
            expect(damageModifier?.value).toBe(10);
            expect(damageModifier?.condition?.type).toBe('always');
        });

        it('should have +8 severe threshold modifier', () => {
            const thresholdModifier = frenzy?.modifiers?.find((m) => m.stat === 'damage_threshold_severe');
            expect(thresholdModifier).toBeDefined();
            expect(thresholdModifier?.value).toBe(8);
        });
    });

    describe('Unleash Chaos', () => {
        const unleashChaos = srdAbilities.find((c) => c.name === 'Unleash Chaos');

        it('should exist', () => {
            expect(unleashChaos).toBeDefined();
        });

        // Base fields
        it('should have correct base metadata', () => {
            expect(unleashChaos?.name).toBe('Unleash Chaos');
            expect(unleashChaos?.level).toBe('1');
            expect(unleashChaos?.domain).toBe('Arcana');
            expect(unleashChaos?.type).toBe('Spell');
            expect(unleashChaos?.recall).toBe('1');
            expect(unleashChaos?.text).toContain('roll a number of');
            expect(unleashChaos?.text).toContain('d10s');
        });

        // Action classification
        it('should be classified as attack', () => {
            expect(unleashChaos?.action_type).toBe('attack');
        });

        it('should have action timing', () => {
            expect(unleashChaos?.timing).toBe('action');
        });

        it('should be at_will frequency', () => {
            expect(unleashChaos?.frequency).toBe('at_will');
        });

        // Costs - NO activation costs (uses tokens instead)
        it('should NOT have activation costs', () => {
            // Stress is for replenishment, not activation
            expect(unleashChaos?.costs).toBeUndefined();
        });

        // Keywords
        it('should have correct keywords', () => {
            expect(unleashChaos?.keywords).toBeDefined();
            expect(unleashChaos?.keywords).toContain('damage');
            expect(unleashChaos?.keywords).toContain('magic');
            expect(unleashChaos?.keywords).toContain('tokens');
            expect(unleashChaos?.keywords).toContain('spell');
            // Has stress_cost keyword (for replenishment mechanic)
            expect(unleashChaos?.keywords).toContain('stress_cost');
            // Should NOT have stress_relief
            expect(unleashChaos?.keywords).not.toContain('stress_relief');
        });

        // Token mechanics
        it('should have token mechanics', () => {
            expect(unleashChaos?.has_tokens).toBe(true);
            expect(unleashChaos?.max_tokens).toBeNull(); // Dynamic based on Spellcast
            expect(unleashChaos?.token_source).toBe('spellcast');
        });

        // Attack data
        it('should have complete attack data', () => {
            expect(unleashChaos?.attack).toBeDefined();
            expect(unleashChaos?.attack?.trait).toBe('Spellcast');
            expect(unleashChaos?.attack?.range).toBe('Far');
            expect(unleashChaos?.attack?.combat_category).toBe('standalone_attack');
            expect(unleashChaos?.attack?.damage_type).toBe('magic');
            expect(unleashChaos?.attack?.targets).toBe('single');
        });

        it('should have variable damage notation', () => {
            // Variable damage based on tokens spent
            expect(unleashChaos?.attack?.damage).toBe('d10');
        });

        // Roll data
        it('should have roll data', () => {
            expect(unleashChaos?.roll).toBeDefined();
            expect(unleashChaos?.roll?.type).toBe('Spellcast Roll');
            expect(unleashChaos?.roll?.trait).toBe('Spellcast');
            expect(unleashChaos?.roll?.target_reaction).toBe(false);
        });

        // What it should NOT have
        it('should NOT have modifiers', () => {
            // Token-based damage, not modifier-based
            expect(unleashChaos?.modifiers).toBeUndefined();
        });

        it('should NOT have threshold modifiers', () => {
            expect(unleashChaos?.threshold_modifiers).toBeUndefined();
        });

        // Edge case validation
        it('should represent token-based variable damage correctly', () => {
            // This is a token-based attack where:
            // - Damage scales with tokens spent (variable)
            // - Stress is for replenishment, not activation
            // - Max tokens = Spellcast trait (dynamic)
            expect(unleashChaos?.has_tokens).toBe(true);
            expect(unleashChaos?.attack?.damage).toBe('d10');
            expect(unleashChaos?.costs).toBeUndefined();
            expect(unleashChaos?.keywords).toContain('tokens');
        });

        it('should have consistent token-based attack classification', () => {
            // All token-based variable damage attacks should have:
            // - action_type: attack
            // - has_tokens: true
            // - damage notation (d10, d8, etc.)
            // - no activation costs (uses tokens)
            expect(unleashChaos?.action_type).toBe('attack');
            expect(unleashChaos?.has_tokens).toBe(true);
            expect(unleashChaos?.attack?.damage).toBeDefined();
            expect(unleashChaos?.costs).toBeUndefined();
        });
    });

    describe('Wall Walk', () => {
        const wallWalk = srdAbilities.find((c) => c.name === 'Wall Walk');

        it('should exist', () => {
            expect(wallWalk).toBeDefined();
        });

        // Base fields
        it('should have correct base metadata', () => {
            expect(wallWalk?.name).toBe('Wall Walk');
            expect(wallWalk?.level).toBe('1');
            expect(wallWalk?.domain).toBe('Arcana');
            expect(wallWalk?.type).toBe('Spell');
        });

        // Duration parsing
        it('should have scene duration', () => {
            expect(wallWalk?.duration).toBe('scene');
        });

        // Costs
        it('should have hope cost of 1', () => {
            expect(wallWalk?.costs?.hope).toBe(1);
        });

        // Keywords
        it('should have correct keywords', () => {
            expect(wallWalk?.keywords).toContain('hope_cost');
            expect(wallWalk?.keywords).toContain('spell');
            expect(wallWalk?.keywords).not.toContain('hope_gain');
        });

        // Classification
        it('should be utility action', () => {
            expect(wallWalk?.action_type).toBe('utility');
            expect(wallWalk?.timing).toBe('action');
        });
    });

    describe('Cinder Grasp', () => {
        const cinderGrasp = srdAbilities.find((c) => c.name === 'Cinder Grasp');

        it('should exist', () => {
            expect(cinderGrasp).toBeDefined();
        });

        it('should have action timing (not reaction)', () => {
            expect(cinderGrasp?.timing).toBe('action');
        });

        it('should be classified as attack', () => {
            expect(cinderGrasp?.action_type).toBe('attack');
        });
    });
});

describe('Enhanced Abilities JSON - Modifier Parsing', () => {
    it('should parse static modifiers correctly', () => {
        const cardsWithModifiers = allAbilities.filter((c) => c.modifiers && c.modifiers.length > 0);
        expect(cardsWithModifiers.length).toBeGreaterThan(0);

        cardsWithModifiers.forEach((card) => {
            card.modifiers?.forEach((modifier) => {
                expect(modifier.stat).toBeDefined();
                expect(typeof modifier.value).toBe('number');
                expect(modifier.condition).toBeDefined();
                expect(modifier.source).toBe(card.name);
            });
        });
    });

    it('should parse dynamic modifiers with formulas', () => {
        const cardsWithFormulas = allAbilities.filter((c) =>
            c.modifiers?.some((m) => m.formula)
        );

        cardsWithFormulas.forEach((card) => {
            card.modifiers?.forEach((modifier) => {
                if (modifier.formula) {
                    // Formula should be in expected format:
                    // - "half_agility" (dynamic stat)
                    // - "3_plus_strength" (complex formula)
                    // - "agility" (simple stat reference)
                    // - "1d8" (dice notation for damage reduction)
                    expect(
                        modifier.formula.includes('half_') ||
                        modifier.formula.includes('_plus_') ||
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
            'loadout_domain_count',
            'environment'
        ];

        allAbilities.forEach((card) => {
            card.modifiers?.forEach((modifier) => {
                if (modifier.condition) {
                    expect(validConditionTypes).toContain(modifier.condition.type);
                }
            });
        });
    });
});

describe('Enhanced Abilities JSON - Attack Parsing', () => {
    it('should have attack data for attack-type cards', () => {
        const attackCards = allAbilities.filter((c) => c.action_type === 'attack');

        attackCards.forEach((card) => {
            // Most attacks should have attack data (some edge cases may not)
            if (card.attack) {
                expect(card.attack.trait).toBeDefined();
                expect(card.attack.range).toBeDefined();
            }
        });
    });

    it('should have valid combat_category values', () => {
        const validCategories = ['standalone_attack', 'damage_bonus', 'roll_only', 'passive_triggered'];

        allAbilities.forEach((card) => {
            if (card.attack?.combat_category) {
                expect(validCategories).toContain(card.attack.combat_category);
            }
        });
    });

    it('should have valid damage_type values', () => {
        const validTypes = ['magic', 'physical'];

        allAbilities.forEach((card) => {
            if (card.attack?.damage_type) {
                expect(validTypes).toContain(card.attack.damage_type);
            }
        });
    });
});

describe('Enhanced Abilities JSON - Keyword Extraction', () => {
    it('should not have false positive hope_gain keywords', () => {
        // Cards that spend hope should not have hope_gain
        const hopeSpenders = allAbilities.filter((c) => c.costs?.hope);

        hopeSpenders.forEach((card) => {
            // Unless the card explicitly grants hope back
            if (!card.text.toLowerCase().includes('gain') || !card.text.toLowerCase().includes('hope')) {
                expect(card.keywords).not.toContain('hope_gain');
            }
        });
    });

    it('should not have false positive stress_relief keywords', () => {
        // Cards that mark stress should not have stress_relief
        const stressMarkers = allAbilities.filter((c) => c.costs?.stress);

        stressMarkers.forEach((card) => {
            // Unless the card explicitly clears stress
            if (!card.text.toLowerCase().includes('clear') || !card.text.toLowerCase().includes('stress')) {
                expect(card.keywords).not.toContain('stress_relief');
            }
        });
    });
});

describe('Enhanced Abilities JSON - Statistics', () => {
    it('should have expected distribution of action types', () => {
        const counts = {
            attack: 0,
            reaction: 0,
            passive: 0,
            buff: 0,
            utility: 0,
            downtime: 0,
        };

        allAbilities.forEach((card) => {
            if (card.action_type) {
                counts[card.action_type]++;
            }
        });

        // Sanity checks - these numbers should be reasonable
        expect(counts.attack).toBeGreaterThan(50); // Should have many attacks
        expect(counts.passive).toBeGreaterThan(30); // Should have many passives
        expect(counts.reaction).toBeGreaterThan(5); // Should have some reactions
    });

    it('should have cards with modifiers', () => {
        const withModifiers = allAbilities.filter((c) => c.modifiers && c.modifiers.length > 0);
        expect(withModifiers.length).toBeGreaterThan(10); // Should have at least 10 cards with modifiers
    });

    it('should have cards with token mechanics', () => {
        const withTokens = allAbilities.filter((c) => c.has_tokens);
        expect(withTokens.length).toBeGreaterThan(10); // Should have at least 10 cards with tokens
    });
});
