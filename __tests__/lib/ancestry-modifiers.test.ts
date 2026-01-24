
import { describe, it, expect } from 'vitest';
import { calculateBaseEvasion } from '../../lib/utils';
import { getStatModifiers } from '../../lib/modifier-aggregator';
import type { Character } from '../../types/character';

const createTestCharacter = (overrides?: Partial<Character>): Character => ({
    id: 'test-char',
    user_id: 'test-user',
    name: 'Test Character',
    level: 1,
    stats: {
        agility: 0,
        strength: 0,
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
    damage_thresholds: { minor: 0, major: 0, severe: 0 },
    hope: 2,
    fear: 0,
    evasion: 10,
    proficiency: 1,
    gold: { handfuls: 0, bags: 0, chests: 0 },
    experiences: [],
    class_data: {
        id: 'test-class',
        name: 'Test Class',
        type: 'class',
        data: {
            starting_evasion: 10,
            starting_hp: 6
        }
    },
    ...overrides,
} as Character);

describe('Ancestry Modifier Integration', () => {
    it('should apply Simiah Evasion bonus from text description', () => {
        const character = createTestCharacter({
            ancestry: 'Simiah',
            ancestry_features: [
                {
                    name: 'Nimble',
                    text: 'Gain a permanent +1 bonus to your Evasion at character creation.',
                }
            ]
        });

        // Test implementation via getStatModifiers directly
        const mods = getStatModifiers(character, 'evasion');
        expect(mods).toHaveLength(1);
        expect(mods[0].value).toBe(1);
        expect(mods[0].source).toBe('ancestry');

        // Test implementation via calculateBaseEvasion
        const evasion = calculateBaseEvasion(character);
        // Base 10 + 1 bonus = 11
        expect(evasion).toBe(11);
    });

    it('should apply structured stat bonuses if present', () => {
        const character = createTestCharacter({
            ancestry: 'Simiah',
            ancestry_features: [
                {
                    name: 'Nimble',
                    text: 'Some flavor text.', // Text doesn't match pattern
                    stat_bonuses: {
                        evasion: 1
                    }
                }
            ]
        });

        const evasion = calculateBaseEvasion(character);
        expect(evasion).toBe(11);
    });

    it('should prefer structured bonuses over text parsing (no duplication)', () => {
        // FIXED: When both text and stat_bonuses exist, prefer structured data only
        // This prevents the duplication bug (Issue #75)
        const character = createTestCharacter({
            ancestry: 'Goat',
            ancestry_features: [
                {
                    name: 'Super Goat',
                    text: 'Gain +1 bonus to your Evasion.',
                    stat_bonuses: {
                        evasion: 1
                    }
                }
            ]
        });

        const evasion = calculateBaseEvasion(character);
        // Base 10 + 1 (structured only, text NOT parsed when structured exists) = 11
        expect(evasion).toBe(11);

        // Also verify only one modifier is returned
        const mods = getStatModifiers(character, 'evasion');
        expect(mods.filter(m => m.source === 'ancestry')).toHaveLength(1);
    });

    it('should ignore irrelevant features', () => {
        const character = createTestCharacter({
            ancestry: 'Dwarf',
            ancestry_features: [
                {
                    name: 'Thick Skin',
                    text: 'When you take damage, reduce it.', // No static bonus
                }
            ]
        });

        const evasion = calculateBaseEvasion(character);
        expect(evasion).toBe(10);
    });
});
