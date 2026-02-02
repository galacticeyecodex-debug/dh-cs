/**
 * TOUCHED CARDS INTEGRATION TESTS
 * ----------------------------------------------------------------------------
 * Verifies that all "-Touched" domain cards correctly apply their modifiers
 * when the loadout_domain_count condition is met.
 *
 * These are integration tests that load the actual JSON data and verify
 * the complete modifier pipeline works correctly.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { isModifierActive, getModifiers } from '@/lib/enhancement-utils';
import type { EnhancedAbilityCard, CardModifier } from '@/types/cards';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load the actual enhanced abilities JSON
let enhancedAbilities: EnhancedAbilityCard[] = [];

beforeAll(() => {
    const jsonPath = join(process.cwd(), 'content/public/srd/json/abilities_enhanced.json');
    const jsonContent = readFileSync(jsonPath, 'utf-8');
    enhancedAbilities = JSON.parse(jsonContent);
});

// Helper to find a card by name
function findCard(name: string): EnhancedAbilityCard | undefined {
    return enhancedAbilities.find(c => c.name === name);
}

// Helper to create a mock character with loadout cards
function createCharacterWithLoadout(domain: string, count: number) {
    const cards = Array.from({ length: count }, (_, i) => ({
        location: 'loadout',
        library_item: { domain: domain.charAt(0).toUpperCase() + domain.slice(1).toLowerCase() }
    }));

    return {
        character_cards: cards,
        character_inventory: []
    };
}

describe('Touched Cards Integration Tests', () => {
    describe('JSON Structure Verification', () => {
        it('should have all 10 -Touched cards in the JSON', () => {
            const touchedCardNames = [
                'Arcana-Touched',
                'Blade-Touched',
                'Bone-Touched',
                'Codex-Touched',
                'Grace-Touched',
                'Midnight-Touched',
                'Sage-Touched',
                'Splendor-Touched',
                'Valor-Touched'
            ];

            for (const name of touchedCardNames) {
                const card = findCard(name);
                expect(card, `${name} should exist in JSON`).toBeDefined();
            }
        });
    });

    describe('Arcana-Touched', () => {
        it('should have spellcast +1 modifier with loadout_domain_count condition', () => {
            const card = findCard('Arcana-Touched');
            expect(card).toBeDefined();

            const modifiers = getModifiers(card!);
            expect(modifiers.length).toBeGreaterThanOrEqual(1);

            const spellcastMod = modifiers.find(m => m.stat === 'spellcast');
            expect(spellcastMod).toBeDefined();
            expect(spellcastMod?.value).toBe(1);
            expect(spellcastMod?.condition?.type).toBe('loadout_domain_count');
            expect(spellcastMod?.condition?.domain).toBe('arcana');
            expect(spellcastMod?.condition?.minCount).toBe(4);
        });

        it('should activate when 4+ Arcana cards in loadout', () => {
            const card = findCard('Arcana-Touched');
            const modifier = getModifiers(card!).find(m => m.stat === 'spellcast')!;
            const character = createCharacterWithLoadout('arcana', 4);

            expect(isModifierActive(modifier, false, character)).toBe(true);
        });

        it('should NOT activate when less than 4 Arcana cards in loadout', () => {
            const card = findCard('Arcana-Touched');
            const modifier = getModifiers(card!).find(m => m.stat === 'spellcast')!;
            const character = createCharacterWithLoadout('arcana', 3);

            expect(isModifierActive(modifier, false, character)).toBe(false);
        });
    });

    describe('Blade-Touched', () => {
        it('should have attack +2 and damage_threshold_severe +4 modifiers', () => {
            const card = findCard('Blade-Touched');
            expect(card).toBeDefined();

            const modifiers = getModifiers(card!);
            expect(modifiers.length).toBeGreaterThanOrEqual(2);

            const attackMod = modifiers.find(m => m.stat === 'attack');
            expect(attackMod).toBeDefined();
            expect(attackMod?.value).toBe(2);
            expect(attackMod?.condition?.type).toBe('loadout_domain_count');
            expect(attackMod?.condition?.domain).toBe('blade');

            const thresholdMod = modifiers.find(m => m.stat === 'damage_threshold_severe');
            expect(thresholdMod).toBeDefined();
            expect(thresholdMod?.value).toBe(4);
            expect(thresholdMod?.condition?.type).toBe('loadout_domain_count');
        });

        it('should activate BOTH modifiers when 4+ Blade cards in loadout', () => {
            const card = findCard('Blade-Touched');
            const modifiers = getModifiers(card!);
            const character = createCharacterWithLoadout('blade', 4);

            for (const mod of modifiers) {
                expect(isModifierActive(mod, false, character)).toBe(true);
            }
        });
    });

    describe('Bone-Touched', () => {
        it('should have agility +1 modifier with loadout condition', () => {
            const card = findCard('Bone-Touched');
            expect(card).toBeDefined();

            const modifiers = getModifiers(card!);
            const agilityMod = modifiers.find(m => m.stat === 'agility');
            expect(agilityMod).toBeDefined();
            expect(agilityMod?.value).toBe(1);
            expect(agilityMod?.condition?.type).toBe('loadout_domain_count');
            expect(agilityMod?.condition?.domain).toBe('bone');
            expect(agilityMod?.condition?.minCount).toBe(4);
        });

        it('should activate when 4+ Bone cards in loadout', () => {
            const card = findCard('Bone-Touched');
            const modifier = getModifiers(card!).find(m => m.stat === 'agility')!;
            const character = createCharacterWithLoadout('bone', 5); // More than 4

            expect(isModifierActive(modifier, false, character)).toBe(true);
        });
    });

    describe('Codex-Touched', () => {
        it('should have spellcast modifier with proficiency formula', () => {
            const card = findCard('Codex-Touched');
            expect(card).toBeDefined();

            const modifiers = getModifiers(card!);
            const spellcastMod = modifiers.find(m => m.stat === 'spellcast');
            expect(spellcastMod).toBeDefined();
            expect(spellcastMod?.formula).toBe('proficiency');
            expect(spellcastMod?.condition?.type).toBe('loadout_domain_count');
            expect(spellcastMod?.condition?.domain).toBe('codex');
        });
    });

    describe('Sage-Touched', () => {
        it('should have spellcast +2 modifier', () => {
            const card = findCard('Sage-Touched');
            expect(card).toBeDefined();

            const modifiers = getModifiers(card!);
            const spellcastMod = modifiers.find(m => m.stat === 'spellcast');
            expect(spellcastMod).toBeDefined();
            expect(spellcastMod?.value).toBe(2);
            expect(spellcastMod?.condition?.type).toBe('loadout_domain_count');
            expect(spellcastMod?.condition?.domain).toBe('sage');
        });
    });

    describe('Splendor-Touched', () => {
        it('should have damage_threshold_severe +3 modifier', () => {
            const card = findCard('Splendor-Touched');
            expect(card).toBeDefined();

            const modifiers = getModifiers(card!);
            const thresholdMod = modifiers.find(m => m.stat === 'damage_threshold_severe');
            expect(thresholdMod).toBeDefined();
            expect(thresholdMod?.value).toBe(3);
            expect(thresholdMod?.condition?.type).toBe('loadout_domain_count');
            expect(thresholdMod?.condition?.domain).toBe('splendor');
            expect(thresholdMod?.condition?.minCount).toBe(4);
        });
    });

    describe('Valor-Touched', () => {
        it('should have armor_score +1 modifier', () => {
            const card = findCard('Valor-Touched');
            expect(card).toBeDefined();

            const modifiers = getModifiers(card!);
            const armorMod = modifiers.find(m => m.stat === 'armor_score');
            expect(armorMod).toBeDefined();
            expect(armorMod?.value).toBe(1);
            expect(armorMod?.condition?.type).toBe('loadout_domain_count');
            expect(armorMod?.condition?.domain).toBe('valor');
            expect(armorMod?.condition?.minCount).toBe(4);
        });
    });

    describe('Grace-Touched (no stat modifiers)', () => {
        it('should exist but have no stat modifiers (utility-only card)', () => {
            const card = findCard('Grace-Touched');
            expect(card).toBeDefined();

            const modifiers = getModifiers(card!);
            // Grace-Touched has utility effects (armor slot swap, stress swap)
            // but no static stat modifiers
            expect(modifiers.length).toBe(0);
        });
    });

    describe('Midnight-Touched (no stat modifiers)', () => {
        it('should exist but have no stat modifiers (utility-only card)', () => {
            const card = findCard('Midnight-Touched');
            expect(card).toBeDefined();

            const modifiers = getModifiers(card!);
            // Midnight-Touched has utility effects (hope gain, fear die damage)
            // but no static stat modifiers
            expect(modifiers.length).toBe(0);
        });
    });

    describe('Cross-Domain Verification', () => {
        it('should not activate Arcana-Touched with Blade cards', () => {
            const card = findCard('Arcana-Touched');
            const modifier = getModifiers(card!).find(m => m.stat === 'spellcast')!;
            const character = createCharacterWithLoadout('blade', 4); // Wrong domain

            expect(isModifierActive(modifier, false, character)).toBe(false);
        });

        it('should handle mixed loadout correctly', () => {
            const card = findCard('Arcana-Touched');
            const modifier = getModifiers(card!).find(m => m.stat === 'spellcast')!;

            // 3 Arcana + 3 Blade = not enough Arcana
            const character = {
                character_cards: [
                    { location: 'loadout', library_item: { domain: 'Arcana' } },
                    { location: 'loadout', library_item: { domain: 'Arcana' } },
                    { location: 'loadout', library_item: { domain: 'Arcana' } },
                    { location: 'loadout', library_item: { domain: 'Blade' } },
                    { location: 'loadout', library_item: { domain: 'Blade' } },
                    { location: 'loadout', library_item: { domain: 'Blade' } },
                ],
                character_inventory: []
            };

            expect(isModifierActive(modifier, false, character)).toBe(false);
        });

        it('should ignore vault cards when counting domain', () => {
            const card = findCard('Arcana-Touched');
            const modifier = getModifiers(card!).find(m => m.stat === 'spellcast')!;

            // 2 in loadout + 2 in vault = not enough in loadout
            const character = {
                character_cards: [
                    { location: 'loadout', library_item: { domain: 'Arcana' } },
                    { location: 'loadout', library_item: { domain: 'Arcana' } },
                    { location: 'vault', library_item: { domain: 'Arcana' } },
                    { location: 'vault', library_item: { domain: 'Arcana' } },
                ],
                character_inventory: []
            };

            expect(isModifierActive(modifier, false, character)).toBe(false);
        });
    });

    describe('Case Sensitivity', () => {
        it('should match domain case-insensitively', () => {
            const card = findCard('Arcana-Touched');
            const modifier = getModifiers(card!).find(m => m.stat === 'spellcast')!;

            // Mix of cases
            const character = {
                character_cards: [
                    { location: 'loadout', library_item: { domain: 'ARCANA' } },
                    { location: 'loadout', library_item: { domain: 'arcana' } },
                    { location: 'loadout', library_item: { domain: 'Arcana' } },
                    { location: 'loadout', library_item: { domain: 'ArCaNa' } },
                ],
                character_inventory: []
            };

            expect(isModifierActive(modifier, false, character)).toBe(true);
        });
    });
});
