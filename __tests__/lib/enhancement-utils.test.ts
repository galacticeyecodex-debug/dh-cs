/**
 * ENHANCEMENT UTILS TESTS
 * ----------------------------------------------------------------------------
 * This test suite validates the enhancement-utils.ts helper functions for
 * working with the enhancement/enhancement_override block structure in cards.
 *
 * FUNCTIONALITY TESTED:
 * - getEnhancement: Prefer override, fallback to enhancement
 * - hasOverride: Check if override exists
 * - getActionType, getTiming, getFrequency: Extract specific fields
 * - getKeywords, getCosts, getAttack, getRoll, getModifiers: Extract data
 * - hasTokens: Check token mechanics
 * - isModifierActive: Evaluate condition-based modifiers
 * - migrateToBlockStructure: Migrate legacy cards to new format
 */

import { describe, it, expect } from 'vitest';
import {
    getEnhancement,
    hasOverride,
    getActionType,
    getTiming,
    getFrequency,
    getKeywords,
    getCosts,
    getAttack,
    getRoll,
    getModifiers,
    hasTokens,
    isModifierActive,
    migrateToBlockStructure,
    WithEnhancement,
} from '@/lib/enhancement-utils';
import type { EnhancementBlock, CardModifier } from '@/types/cards';

describe('Enhancement Utils', () => {
    // ========================================================================
    // getEnhancement
    // ========================================================================
    describe('getEnhancement', () => {
        it('should return enhancement when no override exists', () => {
            const item: WithEnhancement = {
                enhancement: {
                    action_type: 'attack',
                    timing: 'action',
                    frequency: 'at_will',
                },
            };

            const result = getEnhancement(item);

            expect(result).toEqual(item.enhancement);
            expect(result?.action_type).toBe('attack');
        });

        it('should prefer enhancement_override when both exist', () => {
            const item: WithEnhancement = {
                enhancement: {
                    action_type: 'attack',
                    timing: 'action',
                    frequency: 'at_will',
                },
                enhancement_override: {
                    action_type: 'utility',
                    timing: 'reaction',
                    frequency: 'once_per_session',
                },
            };

            const result = getEnhancement(item);

            expect(result).toEqual(item.enhancement_override);
            expect(result?.action_type).toBe('utility');
            expect(result?.timing).toBe('reaction');
        });

        it('should return undefined when no enhancement exists', () => {
            const item: WithEnhancement = {};

            const result = getEnhancement(item);

            expect(result).toBeUndefined();
        });

        it('should return override even when enhancement is undefined', () => {
            const item: WithEnhancement = {
                enhancement_override: {
                    action_type: 'buff',
                    timing: 'action',
                    frequency: 'at_will',
                },
            };

            const result = getEnhancement(item);

            expect(result?.action_type).toBe('buff');
        });
    });

    // ========================================================================
    // hasOverride
    // ========================================================================
    describe('hasOverride', () => {
        it('should return true when override exists', () => {
            const item: WithEnhancement = {
                enhancement: { action_type: 'attack', timing: 'action', frequency: 'at_will' },
                enhancement_override: { action_type: 'buff', timing: 'action', frequency: 'at_will' },
            };

            expect(hasOverride(item)).toBe(true);
        });

        it('should return false when no override exists', () => {
            const item: WithEnhancement = {
                enhancement: { action_type: 'attack', timing: 'action', frequency: 'at_will' },
            };

            expect(hasOverride(item)).toBe(false);
        });

        it('should return false for empty item', () => {
            const item: WithEnhancement = {};

            expect(hasOverride(item)).toBe(false);
        });
    });

    // ========================================================================
    // getActionType
    // ========================================================================
    describe('getActionType', () => {
        it('should return action_type from enhancement', () => {
            const item: WithEnhancement = {
                enhancement: { action_type: 'attack', timing: 'action', frequency: 'at_will' },
            };

            expect(getActionType(item)).toBe('attack');
        });

        it('should prefer action_type from override', () => {
            const item: WithEnhancement = {
                enhancement: { action_type: 'attack', timing: 'action', frequency: 'at_will' },
                enhancement_override: { action_type: 'utility', timing: 'action', frequency: 'at_will' },
            };

            expect(getActionType(item)).toBe('utility');
        });

        it('should return undefined when no enhancement', () => {
            const item: WithEnhancement = {};

            expect(getActionType(item)).toBeUndefined();
        });
    });

    // ========================================================================
    // getTiming
    // ========================================================================
    describe('getTiming', () => {
        it('should return timing from enhancement', () => {
            const item: WithEnhancement = {
                enhancement: { action_type: 'attack', timing: 'reaction', frequency: 'at_will' },
            };

            expect(getTiming(item)).toBe('reaction');
        });

        it('should default to "action" when no timing specified', () => {
            const item: WithEnhancement = {
                enhancement: { action_type: 'attack', frequency: 'at_will' } as EnhancementBlock,
            };

            expect(getTiming(item)).toBe('action');
        });

        it('should default to "action" when no enhancement', () => {
            const item: WithEnhancement = {};

            expect(getTiming(item)).toBe('action');
        });
    });

    // ========================================================================
    // getFrequency
    // ========================================================================
    describe('getFrequency', () => {
        it('should return frequency from enhancement', () => {
            const item: WithEnhancement = {
                enhancement: { action_type: 'attack', timing: 'action', frequency: 'once_per_rest' },
            };

            expect(getFrequency(item)).toBe('once_per_rest');
        });

        it('should default to "at_will" when no frequency specified', () => {
            const item: WithEnhancement = {
                enhancement: { action_type: 'attack', timing: 'action' } as EnhancementBlock,
            };

            expect(getFrequency(item)).toBe('at_will');
        });

        it('should default to "at_will" when no enhancement', () => {
            const item: WithEnhancement = {};

            expect(getFrequency(item)).toBe('at_will');
        });
    });

    // ========================================================================
    // getKeywords
    // ========================================================================
    describe('getKeywords', () => {
        it('should return keywords from enhancement', () => {
            const item: WithEnhancement = {
                enhancement: {
                    action_type: 'attack',
                    timing: 'action',
                    frequency: 'at_will',
                    keywords: ['fire', 'ranged'],
                },
            };

            expect(getKeywords(item)).toEqual(['fire', 'ranged']);
        });

        it('should return empty array when no keywords', () => {
            const item: WithEnhancement = {
                enhancement: { action_type: 'attack', timing: 'action', frequency: 'at_will' },
            };

            expect(getKeywords(item)).toEqual([]);
        });

        it('should return empty array when no enhancement', () => {
            const item: WithEnhancement = {};

            expect(getKeywords(item)).toEqual([]);
        });
    });

    // ========================================================================
    // getCosts
    // ========================================================================
    describe('getCosts', () => {
        it('should return costs from enhancement', () => {
            const costs = { stress: 2, hope: 1 };
            const item: WithEnhancement = {
                enhancement: {
                    action_type: 'attack',
                    timing: 'action',
                    frequency: 'at_will',
                    costs,
                },
            };

            expect(getCosts(item)).toEqual(costs);
        });

        it('should return null when costs is explicitly null', () => {
            const item: WithEnhancement = {
                enhancement: {
                    action_type: 'attack',
                    timing: 'action',
                    frequency: 'at_will',
                    costs: null,
                },
            };

            expect(getCosts(item)).toBeNull();
        });

        it('should return undefined when no costs', () => {
            const item: WithEnhancement = {
                enhancement: { action_type: 'attack', timing: 'action', frequency: 'at_will' },
            };

            expect(getCosts(item)).toBeUndefined();
        });
    });

    // ========================================================================
    // getAttack
    // ========================================================================
    describe('getAttack', () => {
        it('should return attack from enhancement', () => {
            const attack = {
                damage: '2d8',
                damage_type: 'magic',
                range: 'far',
            };
            const item: WithEnhancement = {
                enhancement: {
                    action_type: 'attack',
                    timing: 'action',
                    frequency: 'at_will',
                    attack,
                },
            };

            expect(getAttack(item)).toEqual(attack);
        });

        it('should return null when attack is explicitly null', () => {
            const item: WithEnhancement = {
                enhancement: {
                    action_type: 'utility',
                    timing: 'action',
                    frequency: 'at_will',
                    attack: null,
                },
            };

            expect(getAttack(item)).toBeNull();
        });
    });

    // ========================================================================
    // getRoll
    // ========================================================================
    describe('getRoll', () => {
        it('should return roll from enhancement', () => {
            const roll = {
                stat: 'presence',
                type: 'spellcast',
            };
            const item: WithEnhancement = {
                enhancement: {
                    action_type: 'attack',
                    timing: 'action',
                    frequency: 'at_will',
                    roll,
                },
            };

            expect(getRoll(item)).toEqual(roll);
        });

        it('should return null when roll is explicitly null', () => {
            const item: WithEnhancement = {
                enhancement: {
                    action_type: 'utility',
                    timing: 'action',
                    frequency: 'at_will',
                    roll: null,
                },
            };

            expect(getRoll(item)).toBeNull();
        });
    });

    // ========================================================================
    // getModifiers
    // ========================================================================
    describe('getModifiers', () => {
        it('should return modifiers from enhancement', () => {
            const modifiers = [
                { stat: 'evasion', value: 2, condition: { type: 'always' } },
            ];
            const item: WithEnhancement = {
                enhancement: {
                    action_type: 'buff',
                    timing: 'action',
                    frequency: 'at_will',
                    modifiers,
                },
            };

            expect(getModifiers(item)).toEqual(modifiers);
        });

        it('should return empty array when no modifiers', () => {
            const item: WithEnhancement = {
                enhancement: { action_type: 'attack', timing: 'action', frequency: 'at_will' },
            };

            expect(getModifiers(item)).toEqual([]);
        });
    });

    // ========================================================================
    // hasTokens
    // ========================================================================
    describe('hasTokens', () => {
        it('should return true when has_tokens is true', () => {
            const item: WithEnhancement = {
                enhancement: {
                    action_type: 'summon',
                    timing: 'action',
                    frequency: 'at_will',
                    tokens: {
                        has_tokens: true,
                        max_tokens: 3,
                        token_source: 'proficiency',
                    },
                },
            };

            expect(hasTokens(item)).toBe(true);
        });

        it('should return false when has_tokens is false', () => {
            const item: WithEnhancement = {
                enhancement: {
                    action_type: 'attack',
                    timing: 'action',
                    frequency: 'at_will',
                    tokens: { has_tokens: false },
                },
            };

            expect(hasTokens(item)).toBe(false);
        });

        it('should return false when no tokens object', () => {
            const item: WithEnhancement = {
                enhancement: { action_type: 'attack', timing: 'action', frequency: 'at_will' },
            };

            expect(hasTokens(item)).toBe(false);
        });

        it('should return false when no enhancement', () => {
            const item: WithEnhancement = {};

            expect(hasTokens(item)).toBe(false);
        });
    });

    // ========================================================================
    // isModifierActive
    // ========================================================================
    describe('isModifierActive', () => {
        describe('condition: always', () => {
            it('should return true regardless of card state', () => {
                const modifier: CardModifier = {
                    stat: 'evasion',
                    value: 2,
                    condition: { type: 'always' },
                };

                expect(isModifierActive(modifier, false)).toBe(true);
                expect(isModifierActive(modifier, true)).toBe(true);
            });
        });

        describe('condition: none (no condition)', () => {
            it('should return true when no condition specified', () => {
                const modifier: CardModifier = {
                    stat: 'strength',
                    value: 1,
                };

                expect(isModifierActive(modifier, false)).toBe(true);
                expect(isModifierActive(modifier, true)).toBe(true);
            });
        });

        describe('condition: when_active', () => {
            it('should return true only when card is active', () => {
                const modifier: CardModifier = {
                    stat: 'evasion',
                    value: 3,
                    condition: { type: 'when_active' },
                };

                expect(isModifierActive(modifier, false)).toBe(false);
                expect(isModifierActive(modifier, true)).toBe(true);
            });
        });

        describe('condition: cost_activated', () => {
            it('should return true only when card is active', () => {
                const modifier: CardModifier = {
                    stat: 'damage',
                    value: 2,
                    condition: { type: 'cost_activated' },
                };

                expect(isModifierActive(modifier, false)).toBe(false);
                expect(isModifierActive(modifier, true)).toBe(true);
            });
        });

        describe('condition: when_armored', () => {
            it('should return true when character has armor equipped', () => {
                const modifier: CardModifier = {
                    stat: 'evasion',
                    value: -2,
                    condition: { type: 'when_armored' },
                };

                const characterWithArmor = {
                    character_inventory: [
                        { location: 'equipped_armor' },
                    ],
                };

                expect(isModifierActive(modifier, false, characterWithArmor)).toBe(true);
            });

            it('should return false when character has no armor', () => {
                const modifier: CardModifier = {
                    stat: 'evasion',
                    value: -2,
                    condition: { type: 'when_armored' },
                };

                const characterWithoutArmor = {
                    character_inventory: [
                        { location: 'inventory' },
                        { location: 'equipped_primary' },
                    ],
                };

                expect(isModifierActive(modifier, false, characterWithoutArmor)).toBe(false);
            });

            it('should return false when no character provided', () => {
                const modifier: CardModifier = {
                    stat: 'evasion',
                    value: -2,
                    condition: { type: 'when_armored' },
                };

                expect(isModifierActive(modifier, false)).toBe(false);
            });
        });

        describe('condition: when_unarmored', () => {
            it('should return true when character has no armor equipped', () => {
                const modifier: CardModifier = {
                    stat: 'evasion',
                    value: 2,
                    condition: { type: 'when_unarmored' },
                };

                const characterWithoutArmor = {
                    character_inventory: [
                        { location: 'inventory' },
                    ],
                };

                expect(isModifierActive(modifier, false, characterWithoutArmor)).toBe(true);
            });

            it('should return false when character has armor', () => {
                const modifier: CardModifier = {
                    stat: 'evasion',
                    value: 2,
                    condition: { type: 'when_unarmored' },
                };

                const characterWithArmor = {
                    character_inventory: [
                        { location: 'equipped_armor' },
                    ],
                };

                expect(isModifierActive(modifier, false, characterWithArmor)).toBe(false);
            });
        });

        describe('condition: loadout_domain_count', () => {
            it('should return true when domain count meets minimum', () => {
                const modifier: CardModifier = {
                    stat: 'damage',
                    value: 2,
                    condition: { type: 'loadout_domain_count', domain: 'arcana', minCount: 2 },
                };

                const character = {
                    character_cards: [
                        { location: 'loadout', library_item: { domain: 'Arcana' } },
                        { location: 'loadout', library_item: { domain: 'Arcana' } },
                        { location: 'loadout', library_item: { domain: 'Blade' } },
                    ],
                };

                expect(isModifierActive(modifier, false, character)).toBe(true);
            });

            it('should return false when domain count below minimum', () => {
                const modifier: CardModifier = {
                    stat: 'damage',
                    value: 2,
                    condition: { type: 'loadout_domain_count', domain: 'arcana', minCount: 3 },
                };

                const character = {
                    character_cards: [
                        { location: 'loadout', library_item: { domain: 'Arcana' } },
                        { location: 'loadout', library_item: { domain: 'Arcana' } },
                    ],
                };

                expect(isModifierActive(modifier, false, character)).toBe(false);
            });

            it('should handle domain in data object', () => {
                const modifier: CardModifier = {
                    stat: 'damage',
                    value: 1,
                    condition: { type: 'loadout_domain_count', domain: 'bone', minCount: 1 },
                };

                const character = {
                    character_cards: [
                        { location: 'loadout', library_item: { data: { domain: 'Bone' } } },
                    ],
                };

                expect(isModifierActive(modifier, false, character)).toBe(true);
            });

            it('should ignore cards not in loadout', () => {
                const modifier: CardModifier = {
                    stat: 'damage',
                    value: 1,
                    condition: { type: 'loadout_domain_count', domain: 'arcana', minCount: 2 },
                };

                const character = {
                    character_cards: [
                        { location: 'loadout', library_item: { domain: 'Arcana' } },
                        { location: 'vault', library_item: { domain: 'Arcana' } }, // Not in loadout
                    ],
                };

                expect(isModifierActive(modifier, false, character)).toBe(false);
            });

            it('should return false when no character provided', () => {
                const modifier: CardModifier = {
                    stat: 'damage',
                    value: 1,
                    condition: { type: 'loadout_domain_count', domain: 'arcana', minCount: 1 },
                };

                expect(isModifierActive(modifier, false)).toBe(false);
            });
        });

        describe('condition: when_hp_marked', () => {
            it('should return true when character has HP marked (Power Through Pain)', () => {
                const modifier: CardModifier = {
                    stat: 'damage',
                    value: 0,
                    formula: '2_times_marked_hp',
                    condition: { type: 'when_hp_marked', minMarked: 1 },
                };

                const character = {
                    vitals: {
                        hit_points_max: 6,
                        hit_points_current: 4, // 2 HP marked
                    },
                };

                expect(isModifierActive(modifier, false, character)).toBe(true);
            });

            it('should return false when no HP marked', () => {
                const modifier: CardModifier = {
                    stat: 'damage',
                    value: 0,
                    formula: '2_times_marked_hp',
                    condition: { type: 'when_hp_marked', minMarked: 1 },
                };

                const character = {
                    vitals: {
                        hit_points_max: 6,
                        hit_points_current: 6, // 0 HP marked
                    },
                };

                expect(isModifierActive(modifier, false, character)).toBe(false);
            });

            it('should respect minMarked threshold', () => {
                const modifier: CardModifier = {
                    stat: 'damage',
                    value: 0,
                    condition: { type: 'when_hp_marked', minMarked: 3 },
                };

                const characterWith2Marked = {
                    vitals: {
                        hit_points_max: 6,
                        hit_points_current: 4, // 2 HP marked
                    },
                };

                const characterWith3Marked = {
                    vitals: {
                        hit_points_max: 6,
                        hit_points_current: 3, // 3 HP marked
                    },
                };

                expect(isModifierActive(modifier, false, characterWith2Marked)).toBe(false);
                expect(isModifierActive(modifier, false, characterWith3Marked)).toBe(true);
            });

            it('should default minMarked to 1 when not specified', () => {
                const modifier: CardModifier = {
                    stat: 'damage',
                    value: 0,
                    condition: { type: 'when_hp_marked' },
                };

                const characterWithNoMarked = {
                    vitals: {
                        hit_points_max: 6,
                        hit_points_current: 6,
                    },
                };

                const characterWith1Marked = {
                    vitals: {
                        hit_points_max: 6,
                        hit_points_current: 5,
                    },
                };

                expect(isModifierActive(modifier, false, characterWithNoMarked)).toBe(false);
                expect(isModifierActive(modifier, false, characterWith1Marked)).toBe(true);
            });

            it('should return false when no character vitals provided', () => {
                const modifier: CardModifier = {
                    stat: 'damage',
                    value: 0,
                    condition: { type: 'when_hp_marked', minMarked: 1 },
                };

                expect(isModifierActive(modifier, false)).toBe(false);
                expect(isModifierActive(modifier, false, {})).toBe(false);
            });
        });

        describe('condition: when_stress_maxed', () => {
            it('should return true when all stress slots are marked (Voice of Reason)', () => {
                const modifier: CardModifier = {
                    stat: 'proficiency',
                    value: 1,
                    condition: { type: 'when_stress_maxed' },
                };

                const character = {
                    vitals: {
                        stress_max: 4,
                        stress_current: 4, // all slots marked
                    },
                };

                expect(isModifierActive(modifier, false, character)).toBe(true);
            });

            it('should return false when stress is not fully marked', () => {
                const modifier: CardModifier = {
                    stat: 'proficiency',
                    value: 1,
                    condition: { type: 'when_stress_maxed' },
                };

                const character = {
                    vitals: {
                        stress_max: 4,
                        stress_current: 3, // one slot remaining
                    },
                };

                expect(isModifierActive(modifier, false, character)).toBe(false);
            });

            it('should return false when stress is zero', () => {
                const modifier: CardModifier = {
                    stat: 'proficiency',
                    value: 1,
                    condition: { type: 'when_stress_maxed' },
                };

                const character = {
                    vitals: {
                        stress_max: 4,
                        stress_current: 0,
                    },
                };

                expect(isModifierActive(modifier, false, character)).toBe(false);
            });

            it('should return false when no character vitals provided', () => {
                const modifier: CardModifier = {
                    stat: 'proficiency',
                    value: 1,
                    condition: { type: 'when_stress_maxed' },
                };

                expect(isModifierActive(modifier, false)).toBe(false);
                expect(isModifierActive(modifier, false, {})).toBe(false);
            });

            it('should return false when stress_max is 0 to avoid false positives', () => {
                const modifier: CardModifier = {
                    stat: 'proficiency',
                    value: 1,
                    condition: { type: 'when_stress_maxed' },
                };

                const character = {
                    vitals: {
                        stress_max: 0,
                        stress_current: 0,
                    },
                };

                expect(isModifierActive(modifier, false, character)).toBe(false);
            });
        });

        describe('condition: environment', () => {
            it('should return false (not implemented)', () => {
                const modifier: CardModifier = {
                    stat: 'evasion',
                    value: 2,
                    condition: { type: 'environment', environmentType: 'darkness' },
                };

                expect(isModifierActive(modifier, true)).toBe(false);
            });
        });

        describe('unknown condition type', () => {
            it('should return false for unknown conditions', () => {
                const modifier: CardModifier = {
                    stat: 'evasion',
                    value: 2,
                    condition: { type: 'unknown_type' as any },
                };

                expect(isModifierActive(modifier, true)).toBe(false);
            });
        });
    });

    // ========================================================================
    // migrateToBlockStructure
    // ========================================================================
    describe('migrateToBlockStructure', () => {
        it('should return card unchanged if already has enhancement block', () => {
            const card = {
                name: 'Fireball',
                level: '3',
                domain: 'Arcana',
                type: 'Spell' as const,
                recall: 'INT',
                text: 'Deal 3d10 fire damage',
                enhancement: {
                    action_type: 'attack' as const,
                    timing: 'action' as const,
                    frequency: 'at_will' as const,
                },
            };

            const result = migrateToBlockStructure(card);

            expect(result.enhancement).toEqual(card.enhancement);
        });

        it('should migrate flat enhanced fields to enhancement block', () => {
            const legacyCard = {
                name: 'Shield',
                level: '1',
                domain: 'Bone',
                type: 'Ability' as const,
                recall: 'CON',
                text: 'Gain +2 armor',
                action_type: 'buff',
                timing: 'reaction',
                frequency: 'once_per_rest',
                costs: { hope: 1 },
                keywords: ['defensive'],
                has_tokens: false,
                max_tokens: null,
                token_source: undefined,
                attack: null,
                roll: null,
                modifiers: [{ stat: 'armor', value: 2 }],
                duration: '1 round',
            };

            const result = migrateToBlockStructure(legacyCard);

            expect(result.name).toBe('Shield');
            expect(result.level).toBe('1');
            expect(result.domain).toBe('Bone');
            expect(result.type).toBe('Ability');
            expect(result.enhancement).toBeDefined();
            expect(result.enhancement?.action_type).toBe('buff');
            expect(result.enhancement?.timing).toBe('reaction');
            expect(result.enhancement?.frequency).toBe('once_per_rest');
            expect(result.enhancement?.costs).toEqual({ hope: 1 });
            expect(result.enhancement?.keywords).toEqual(['defensive']);
            expect(result.enhancement?.tokens?.has_tokens).toBe(false);
            expect(result.enhancement?.modifiers).toEqual([{ stat: 'armor', value: 2 }]);
            expect(result.enhancement?.duration).toBe('1 round');
        });

        it('should handle minimal legacy card', () => {
            const minimalCard = {
                name: 'Basic Attack',
                level: '1',
                domain: 'Blade',
                type: 'Ability' as const,
                recall: 'STR',
                text: 'Make a melee attack',
            };

            const result = migrateToBlockStructure(minimalCard);

            expect(result.name).toBe('Basic Attack');
            expect(result.enhancement).toBeDefined();
            expect(result.enhancement?.timing).toBe('action'); // default
            expect(result.enhancement?.frequency).toBe('at_will'); // default
        });

        it('should migrate token fields correctly', () => {
            const tokenCard = {
                name: 'Summon Familiar',
                level: '2',
                domain: 'Midnight',
                type: 'Spell' as const,
                recall: 'INT',
                text: 'Summon a familiar',
                has_tokens: true,
                max_tokens: 5,
                token_source: 'proficiency',
            };

            const result = migrateToBlockStructure(tokenCard);

            expect(result.enhancement?.tokens?.has_tokens).toBe(true);
            expect(result.enhancement?.tokens?.max_tokens).toBe(5);
            expect(result.enhancement?.tokens?.token_source).toBe('proficiency');
        });
    });
});
