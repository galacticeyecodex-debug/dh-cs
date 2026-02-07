/**
 * STALWART SUBCLASS FEATURES INTEGRATION TESTS
 * ----------------------------------------------------------------------------
 * Verifies that Guardian Stalwart subclass features correctly apply their
 * damage threshold modifiers through the modifier aggregator.
 *
 * Tests the generalized enhancement.modifiers extraction for subclass features.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/enhancement-utils', () => ({
    getModifiers: vi.fn(() => []),
    isModifierActive: vi.fn(() => false),
}));

vi.mock('@/lib/card-parser', () => ({
    calculateDynamicValue: vi.fn((formula: string) => 0),
    calculateTierScaledValue: vi.fn((mod: any) => mod.value),
    parseCardPassiveModifiers: vi.fn(() => []),
    getBareBonesBonuses: vi.fn(() => []),
    parseStaticModifiers: vi.fn(() => []),
}));

import {
    initModifierAggregator,
    getStatModifiers,
    getStatModifierTotal,
} from '@/lib/modifier-aggregator';

import type { Character } from '@/types/character';

// Mock Stalwart subclass data matching subclasses_enhanced.json structure
const stalwartSubclassData = {
    id: 'stalwart-1',
    type: 'subclass',
    name: 'Stalwart',
    data: {
        description: 'Play the Stalwart if you want to take heavy blows and keep fighting.',
        foundation_features: [
            {
                name: 'Unwavering',
                text: 'Gain a permanent +1 bonus to your damage thresholds.',
                enhancement: {
                    timing: 'free',
                    frequency: 'at_will',
                    modifiers: [
                        {
                            stat: 'damage_threshold',
                            value: 1,
                            condition: { type: 'always' },
                            source: 'Unwavering'
                        }
                    ]
                }
            },
            {
                name: 'Iron Will',
                text: 'When you take physical damage, you can mark an additional Armor Slot to reduce the severity.',
                enhancement: {
                    timing: 'reaction',
                    frequency: 'at_will'
                }
            }
        ],
        specialization_features: [
            {
                name: 'Unrelenting',
                text: 'Gain a permanent +2 bonus to your damage thresholds.',
                enhancement: {
                    timing: 'free',
                    frequency: 'at_will',
                    modifiers: [
                        {
                            stat: 'damage_threshold',
                            value: 2,
                            condition: { type: 'always' },
                            source: 'Unrelenting'
                        }
                    ]
                }
            }
        ],
        mastery_features: [
            {
                name: 'Undaunted',
                text: 'Gain a permanent +3 bonus to your damage thresholds.',
                enhancement: {
                    timing: 'free',
                    frequency: 'at_will',
                    modifiers: [
                        {
                            stat: 'damage_threshold',
                            value: 3,
                            condition: { type: 'always' },
                            source: 'Undaunted'
                        }
                    ]
                }
            }
        ]
    }
};

// Helper to create mock character with Stalwart subclass
function createStalwartCharacter(progression: {
    specialization_obtained?: boolean;
    mastery_obtained?: boolean;
} = {}): Character {
    return {
        id: 'char-1',
        user_id: 'user-1',
        name: 'Test Guardian',
        level: 1,
        stats: {
            agility: 0,
            strength: 2,
            finesse: 0,
            instinct: 0,
            presence: 0,
            knowledge: 0,
        },
        vitals: {
            hit_points_max: 6,
            hit_points_current: 6,
            stress_max: 6,
            stress_current: 0,
            armor_score: 0,
            armor_slots: 0,
        },
        damage_thresholds: { minor: 1, major: 5, severe: 9 },
        hope: 6,
        fear: 0,
        evasion: 10,
        proficiency: 1,
        experiences: [],
        modifiers: {},
        gold: { handfuls: 0, bags: 0, chests: 0 },
        character_cards: [],
        character_inventory: [],
        subclass_data: stalwartSubclassData as any,
        subclass_progression: progression,
    } as Character;
}

describe('Stalwart Subclass Features Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        initModifierAggregator([]);
    });

    describe('Foundation Feature: Unwavering (+1 to all thresholds)', () => {
        it('should apply +1 to damage_threshold_minor', () => {
            const character = createStalwartCharacter();
            const modifiers = getStatModifiers(character, 'damage_threshold_minor');

            expect(modifiers.length).toBe(1);
            expect(modifiers[0]).toMatchObject({
                name: 'Stalwart: Unwavering',
                value: 1,
                source: 'subclass',
                type: 'subclass'
            });
        });

        it('should apply +1 to damage_threshold_major', () => {
            const character = createStalwartCharacter();
            const modifiers = getStatModifiers(character, 'damage_threshold_major');

            expect(modifiers.length).toBe(1);
            expect(modifiers[0]).toMatchObject({
                name: 'Stalwart: Unwavering',
                value: 1,
                source: 'subclass'
            });
        });

        it('should apply +1 to damage_threshold_severe', () => {
            const character = createStalwartCharacter();
            const modifiers = getStatModifiers(character, 'damage_threshold_severe');

            expect(modifiers.length).toBe(1);
            expect(modifiers[0]).toMatchObject({
                name: 'Stalwart: Unwavering',
                value: 1,
                source: 'subclass'
            });
        });
    });

    describe('Specialization Feature: Unrelenting (+2 to all thresholds)', () => {
        it('should NOT apply when specialization not obtained', () => {
            const character = createStalwartCharacter({ specialization_obtained: false });
            const modifiers = getStatModifiers(character, 'damage_threshold_minor');

            // Only foundation feature should apply
            expect(modifiers.length).toBe(1);
            expect(modifiers[0].name).toBe('Stalwart: Unwavering');
        });

        it('should apply +2 when specialization obtained', () => {
            const character = createStalwartCharacter({ specialization_obtained: true });
            const modifiers = getStatModifiers(character, 'damage_threshold_minor');

            // Both foundation and specialization should apply
            expect(modifiers.length).toBe(2);
            expect(modifiers.find(m => m.name === 'Stalwart: Unwavering')).toBeDefined();
            expect(modifiers.find(m => m.name === 'Stalwart: Unrelenting')).toBeDefined();
        });

        it('should stack with Unwavering for total +3', () => {
            const character = createStalwartCharacter({ specialization_obtained: true });
            const total = getStatModifierTotal(character, 'damage_threshold_severe');

            expect(total).toBe(3); // 1 (Unwavering) + 2 (Unrelenting)
        });
    });

    describe('Mastery Feature: Undaunted (+3 to all thresholds)', () => {
        it('should NOT apply when mastery not obtained', () => {
            const character = createStalwartCharacter({
                specialization_obtained: true,
                mastery_obtained: false
            });
            const modifiers = getStatModifiers(character, 'damage_threshold_severe');

            // Only foundation and specialization should apply
            expect(modifiers.length).toBe(2);
        });

        it('should apply +3 when mastery obtained', () => {
            const character = createStalwartCharacter({
                specialization_obtained: true,
                mastery_obtained: true
            });
            const modifiers = getStatModifiers(character, 'damage_threshold_severe');

            // All three should apply
            expect(modifiers.length).toBe(3);
            expect(modifiers.find(m => m.name === 'Stalwart: Undaunted')).toBeDefined();
        });

        it('should stack all features for total +6', () => {
            const character = createStalwartCharacter({
                specialization_obtained: true,
                mastery_obtained: true
            });
            const total = getStatModifierTotal(character, 'damage_threshold_severe');

            expect(total).toBe(6); // 1 + 2 + 3
        });
    });

    describe('Non-modifier Features', () => {
        it('should not return modifiers for Iron Will (reaction ability, no static modifier)', () => {
            const character = createStalwartCharacter();
            // Iron Will has no modifiers, just a reaction ability
            const modifiers = getStatModifiers(character, 'armor_score');

            // Should be empty for armor_score from subclass
            expect(modifiers.filter(m => m.source === 'subclass').length).toBe(0);
        });
    });

    describe('All Three Threshold Types', () => {
        it('should apply modifiers to minor, major, and severe equally', () => {
            const character = createStalwartCharacter({
                specialization_obtained: true,
                mastery_obtained: true
            });

            const minorTotal = getStatModifierTotal(character, 'damage_threshold_minor');
            const majorTotal = getStatModifierTotal(character, 'damage_threshold_major');
            const severeTotal = getStatModifierTotal(character, 'damage_threshold_severe');

            // All should be equal since "damage_threshold" applies to all
            expect(minorTotal).toBe(6);
            expect(majorTotal).toBe(6);
            expect(severeTotal).toBe(6);
        });
    });
});
