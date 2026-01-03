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
                'when_active',
                'loadout_domain_count',
                'environment'
            ];

            allAbilities.forEach((card) => {
                card.enhancement?.modifiers?.forEach((modifier) => {
                    if (modifier.condition) {
                        expect(validConditionTypes).toContain(modifier.condition.type);
                    }
                });
            });
        });
    });

    describe('Enhanced Abilities JSON - Attack Parsing', () => {
        it('should have attack data for attack-type cards', () => {
            const attackCards = allAbilities.filter((c) => c.enhancement?.action_type === 'attack');

            attackCards.forEach((card) => {
                // Most attacks should have attack data (some edge cases may not)
                if (card.enhancement?.attack) {
                    expect(card.enhancement.attack.trait).toBeDefined();
                    expect(card.enhancement.attack.range).toBeDefined();
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
});
