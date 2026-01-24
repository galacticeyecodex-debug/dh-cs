/**
 * Roll Utils Tests
 * ----------------------------------------------------------------------------
 * Tests for the centralized roll bonus calculation utilities.
 */

import { describe, it, expect, vi } from 'vitest';
import { calculateRollBonus, calculateSpellcastBonus, calculateEnhancementRollBonus } from '@/lib/roll-utils';
import type { Character } from '@/types/character';

// Mock getSystemModifiers
vi.mock('@/lib/utils', () => ({
    getSystemModifiers: vi.fn(() => []),
}));

const createMockCharacter = (overrides: Partial<Character> = {}): Character => ({
    id: 'test-char',
    user_id: 'test-user',
    name: 'Test Character',
    level: 1,
    stats: {
        agility: 2,
        strength: 1,
        finesse: 0,
        instinct: 3,
        presence: 1,
        knowledge: 0,
    },
    vitals: {
        hit_points_max: 10,
        hit_points_current: 10,
        stress_max: 6,
        stress_current: 0,
        armor_score: 0,
        armor_slots: 0,
    },
    damage_thresholds: { minor: 1, major: 5, severe: 9 },
    hope: 2,
    fear: 0,
    evasion: 10,
    proficiency: 1,
    experiences: [],
    gold: { handfuls: 0, bags: 0, chests: 0 },
    ...overrides,
});

describe('calculateRollBonus', () => {
    it('should calculate base trait value correctly', () => {
        const character = createMockCharacter();

        const result = calculateRollBonus(character, 'Agility');

        expect(result.bonus).toBe(2);
        expect(result.label).toBe('Agility');
        expect(result.trait).toBe('agility');
        expect(result.baseValue).toBe(2);
    });

    it('should handle lowercase trait names', () => {
        const character = createMockCharacter();

        const result = calculateRollBonus(character, 'instinct');

        expect(result.bonus).toBe(3);
        expect(result.label).toBe('Instinct');
    });

    it('should return zero for unknown traits', () => {
        const character = createMockCharacter();

        const result = calculateRollBonus(character, 'Unknown');

        expect(result.bonus).toBe(0);
        expect(result.baseValue).toBe(0);
    });

    it('should apply user modifiers', () => {
        const character = createMockCharacter({
            modifiers: {
                agility: [{ id: 'mod1', name: 'Blessing', value: 2, source: 'user' }],
            },
        });

        const result = calculateRollBonus(character, 'Agility');

        expect(result.bonus).toBe(4); // 2 base + 2 modifier
        expect(result.isModified).toBe(true);
    });

    it('should handle multiple user modifiers', () => {
        const character = createMockCharacter({
            modifiers: {
                strength: [
                    { id: 'mod1', name: 'Buff', value: 1, source: 'user' },
                    { id: 'mod2', name: 'Enchant', value: 2, source: 'user' },
                ],
            },
        });

        const result = calculateRollBonus(character, 'Strength');

        expect(result.bonus).toBe(4); // 1 base + 1 + 2 modifiers
    });
});

describe('calculateSpellcastBonus', () => {
    it('should derive from spellcast_trait when set', () => {
        const character = createMockCharacter({
            spellcast_trait: 'Instinct',
        });

        const result = calculateSpellcastBonus(character);

        expect(result.bonus).toBe(3); // Instinct value
        expect(result.label).toBe('Spellcast');
        expect(result.trait).toBe('spellcast');
    });

    it('should derive from subclass spellcast_trait', () => {
        const character = createMockCharacter({
            subclass_data: {
                id: 'sub1',
                type: 'subclass',
                name: 'Test Subclass',
                data: { spellcast_trait: 'Presence' },
            },
        });

        const result = calculateSpellcastBonus(character);

        expect(result.bonus).toBe(1); // Presence value
    });

    it('should fall back to deprecated spellcast property', () => {
        const character = createMockCharacter({
            spellcast: 5,
        });

        const result = calculateSpellcastBonus(character);

        expect(result.bonus).toBe(5);
    });

    it('should apply spellcast-specific modifiers', () => {
        const character = createMockCharacter({
            spellcast_trait: 'Instinct',
            modifiers: {
                spellcast: [{ id: 'mod1', name: 'Focus', value: 2, source: 'user' }],
            },
        });

        const result = calculateSpellcastBonus(character);

        expect(result.bonus).toBe(5); // 3 Instinct + 2 spellcast modifier
        expect(result.isModified).toBe(true);
    });

    it('should apply trait modifiers when deriving from trait', () => {
        const character = createMockCharacter({
            spellcast_trait: 'Instinct',
            modifiers: {
                instinct: [{ id: 'mod1', name: 'Keen', value: 1, source: 'user' }],
            },
        });

        const result = calculateSpellcastBonus(character);

        expect(result.bonus).toBe(4); // 3 Instinct + 1 instinct modifier
        expect(result.isModified).toBe(true);
    });
});

describe('calculateEnhancementRollBonus', () => {
    it('should return null when no roll trait specified', () => {
        const character = createMockCharacter();

        const result = calculateEnhancementRollBonus(character, {});

        expect(result).toBeNull();
    });

    it('should extract trait from roll.trait', () => {
        const character = createMockCharacter();

        const result = calculateEnhancementRollBonus(character, {
            roll: { trait: 'Agility' },
        });

        expect(result?.bonus).toBe(2);
        expect(result?.label).toBe('Agility');
    });

    it('should extract trait from attack.trait', () => {
        const character = createMockCharacter();

        const result = calculateEnhancementRollBonus(character, {
            attack: { trait: 'Strength' },
        });

        expect(result?.bonus).toBe(1);
    });

    it('should prefer roll.trait over attack.trait', () => {
        const character = createMockCharacter();

        const result = calculateEnhancementRollBonus(character, {
            roll: { trait: 'Agility' },
            attack: { trait: 'Strength' },
        });

        expect(result?.label).toBe('Agility');
    });

    it('should handle spellcast trait', () => {
        const character = createMockCharacter({
            spellcast_trait: 'Instinct',
        });

        const result = calculateEnhancementRollBonus(character, {
            roll: { trait: 'Spellcast' },
        });

        expect(result?.bonus).toBe(3);
        expect(result?.label).toBe('Spellcast');
    });
});
