/**
 * MODIFIER AGGREGATION SERVICE
 * ============================================================================
 * Centralized service for COLLECTING and AGGREGATING all character stat modifiers
 * from all sources (equipment, domain cards, user-added).
 * 
 * This service is the SINGLE SOURCE OF TRUTH for:
 * - Trait modifiers (Agility, Strength, etc.)
 * - Derived stat modifiers (Evasion, Armor, etc.)
 * - Roll bonuses (Spellcast, Attack, Damage)
 * - Active modifier tracking for UI display
 * 
 * DIFFERENCE FROM modifier-service.ts:
 * - modifier-service.ts: Applies modifier operations (add, multiply) to values
 * - THIS FILE: Collects modifiers from sources (equipment, cards, user)
 * 
 * WHY THIS EXISTS:
 * Previously, modifier collection logic was fragmented across:
 * - getSystemModifiers() in utils.ts
 * - parseCardPassiveModifiers() in card-parser.ts
 * - Inline calculations in 10+ component files
 * 
 * This caused:
 * - Inconsistent modifier application (some paths missing enhancedAbilities)
 * - Duplicated code
 * - Hard-to-debug modifier issues
 * 
 * HOW TO USE:
 * 1. Call initModifierAggregator() once when enhanced abilities are loaded
 * 2. Use getStatModifiers()/getRollBonus() for calculations
 * 3. Use getAllActiveModifiers() for UI display
 * 
 * @see lib/enhancement-utils.ts for card-level modifier extraction
 * @see lib/modifier-service.ts for applying modifier operations
 * @see types/cards.ts for CardModifier type definition
 */

import type { EnhancedAbilityCard, CardModifier, CardStates } from '@/types/cards';
import type { Character } from '@/types/character';
import { getModifiers, isModifierActive } from './enhancement-utils';
import { calculateDynamicValue, parseCardPassiveModifiers, getBareBonesBonuses, type PassiveModifier } from './card-parser';

// ============================================================================
// SERVICE STATE
// ============================================================================

/**
 * Cached enhanced abilities data.
 * Set via initModifierAggregator(), used by all modifier calculations.
 */
let cachedEnhancedAbilities: EnhancedAbilityCard[] = [];

/**
 * Initialize the modifier aggregator with enhanced ability data.
 * Call this once when the app loads or when ability data changes.
 */
export function initModifierAggregator(enhancedAbilities: EnhancedAbilityCard[]): void {
    cachedEnhancedAbilities = enhancedAbilities;
}

/**
 * Get the cached enhanced abilities (for components that need direct access)
 */
export function getEnhancedAbilitiesCache(): EnhancedAbilityCard[] {
    return cachedEnhancedAbilities;
}

// ============================================================================
// TYPES
// ============================================================================

export interface ModifierSource {
    id: string;
    name: string;
    value: number;
    source: 'equipment' | 'domain_card' | 'user' | 'class' | 'ancestry';
    type: string;
    formula?: string;
    condition?: CardModifier['condition'];
}

export interface TraitTotal {
    base: number;
    modifierTotal: number;
    total: number;
    breakdown: ModifierSource[];
}

// ============================================================================
// CORE MODIFIER FUNCTIONS
// ============================================================================

/**
 * Get all modifiers for a specific stat from all sources.
 * This is the core function that replaces getSystemModifiers.
 */
export function getStatModifiers(
    character: Character | null,
    stat: string,
    cardStates: CardStates = {}
): ModifierSource[] {
    if (!character) return [];

    const modifiers: ModifierSource[] = [];

    // Calculate trait totals for dynamic formulas (avoid circular dependency)
    const traitsWithTotals = calculateTraitsWithTotals(character, stat);
    const charForParsing = { ...character, stats: traitsWithTotals };

    // A. EQUIPPED ITEMS
    modifiers.push(...getEquipmentModifiers(character, stat));

    // B. DOMAIN CARDS IN LOADOUT
    modifiers.push(...getDomainCardModifiers(charForParsing, stat, cardStates));

    // C. USER-ADDED MODIFIERS
    const userMods = (character.modifiers?.[stat] || []) as any[];
    userMods.forEach((mod: any, index: number) => {
        modifiers.push({
            id: `user-${stat}-${index}`,
            name: mod.name || 'Custom',
            value: mod.value || 0,
            source: 'user',
            type: 'user'
        });
    });

    return modifiers;
}

/**
 * Get total modifier value for a stat (sum of all sources)
 */
export function getStatModifierTotal(
    character: Character | null,
    stat: string,
    cardStates: CardStates = {}
): number {
    const modifiers = getStatModifiers(character, stat, cardStates);
    return modifiers.reduce((sum, mod) => sum + mod.value, 0);
}

/**
 * Get complete trait information including base value and modifiers
 */
export function getTraitTotal(
    character: Character | null,
    trait: string,
    cardStates: CardStates = {}
): TraitTotal {
    if (!character) {
        return { base: 0, modifierTotal: 0, total: 0, breakdown: [] };
    }

    const traitKey = trait.toLowerCase();
    const base = character.stats?.[traitKey as keyof typeof character.stats] || 0;
    const breakdown = getStatModifiers(character, traitKey, cardStates);
    const modifierTotal = breakdown.reduce((sum, mod) => sum + mod.value, 0);

    return {
        base,
        modifierTotal,
        total: base + modifierTotal,
        breakdown
    };
}

// ============================================================================
// ROLL BONUS FUNCTIONS
// ============================================================================

/**
 * Get spellcast roll bonus.
 * Handles the spellcast_trait resolution (e.g., Presence for Bard).
 */
export function getSpellcastBonus(
    character: Character | null,
    cardStates: CardStates = {}
): number {
    if (!character) return 0;

    // Resolve spellcast trait (e.g., "Presence" for Bard)
    const spellcastTraitName = character.spellcast_trait ||
        (character.subclass_data as any)?.data?.spellcast_trait;

    // Get base spellcast value
    let baseValue: number;
    if (spellcastTraitName) {
        const traitKey = spellcastTraitName.toLowerCase();
        baseValue = character.stats?.[traitKey as keyof typeof character.stats] || 0;
        // Add trait modifiers
        baseValue += getStatModifierTotal(character, traitKey, cardStates);
    } else {
        baseValue = (character as any).spellcast || 0;
    }

    // Add spellcast-specific modifiers
    const spellcastMods = getStatModifierTotal(character, 'spellcast', cardStates);

    return baseValue + spellcastMods;
}

/**
 * Get roll bonus for any trait.
 * Special-cases spellcast to handle trait resolution.
 */
export function getRollBonus(
    character: Character | null,
    trait: string,
    cardStates: CardStates = {}
): number {
    if (!character) return 0;

    const traitKey = trait.toLowerCase();

    // Special case: spellcast
    if (traitKey === 'spellcast') {
        return getSpellcastBonus(character, cardStates);
    }

    // Standard trait
    return getTraitTotal(character, trait, cardStates).total;
}

/**
 * Get proficiency die count
 */
export function getProficiency(
    character: Character | null,
    cardStates: CardStates = {}
): number {
    if (!character) return 1;

    const base = character.proficiency || 1;
    const mods = getStatModifierTotal(character, 'proficiency', cardStates);

    return Math.max(1, base + mods);
}

// ============================================================================
// ACTIVE MODIFIERS FOR UI DISPLAY
// ============================================================================

/**
 * Get all currently active modifiers from loadout cards.
 * Used by the Active Modifiers sidebar in playmat-view.
 */
export function getAllActiveModifiers(
    character: Character | null,
    cardStates: CardStates = {}
): PassiveModifier[] {
    if (!character?.character_cards) return [];

    const traitsWithTotals = calculateTraitsWithTotals(character, 'all');
    const charForParsing = { ...character, stats: traitsWithTotals };

    const allModifiers: PassiveModifier[] = [];

    const loadoutCards = character.character_cards.filter(
        (card: any) => card.location === 'loadout'
    );

    loadoutCards.forEach((card: any) => {
        const cardName = card.library_item?.name || '';
        const isCardActive = cardStates[cardName]?.is_active ?? false;

        // Check for enhanced JSON modifiers
        const enhancedData = cachedEnhancedAbilities.find(a => a.name === cardName);
        if (enhancedData) {
            const jsonModifiers = getModifiers(enhancedData);
            if (jsonModifiers.length > 0) {
                let addedFromJson = false;

                jsonModifiers.forEach((mod, index) => {
                    // Determine if this modifier is active
                    let active: boolean;
                    if (mod.condition?.type === 'when_active' || mod.condition?.type === 'cost_activated') {
                        const modifierKey = `${mod.stat}-${index}`;
                        active = cardStates[cardName]?.active_modifiers?.[modifierKey] ?? false;
                    } else {
                        active = isModifierActive(mod, isCardActive, charForParsing as any);
                    }

                    if (active) {
                        const calculatedValue = mod.formula
                            ? calculateDynamicValue(mod.formula, charForParsing as any)
                            : mod.value;

                        allModifiers.push({
                            stat: mod.stat,
                            value: calculatedValue,
                            formula: mod.formula,
                            condition: mod.condition as any,
                            isActive: true,
                            source: mod.source || cardName
                        });
                        addedFromJson = true;
                    }
                });

                // Skip text parsing if we processed JSON modifiers
                if (addedFromJson || jsonModifiers.length > 0) {
                    return;
                }
            }
        }

        // Fallback: Text parsing for cards without JSON modifiers
        const mods = parseCardPassiveModifiers(card, charForParsing as any, isCardActive);
        allModifiers.push(...mods.filter(m => m.isActive));
    });

    return allModifiers;
}

/**
 * Get modifiers grouped by stat for the sidebar display
 */
export function getModifiersByStat(
    character: Character | null,
    cardStates: CardStates = {}
): Record<string, PassiveModifier[]> {
    const allModifiers = getAllActiveModifiers(character, cardStates);

    return allModifiers.reduce((acc, mod) => {
        if (!acc[mod.stat]) {
            acc[mod.stat] = [];
        }
        acc[mod.stat].push(mod);
        return acc;
    }, {} as Record<string, PassiveModifier[]>);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate trait totals for dynamic formula evaluation.
 * Avoids circular dependency when calculating trait modifiers.
 */
function calculateTraitsWithTotals(
    character: Character,
    targetStat: string
): Record<string, number> {
    const traitsWithTotals: Record<string, number> = { ...character.stats };
    const traitNames = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'];

    // Only calculate totals if we're not directly querying a trait
    // (to avoid circular dependency)
    const needsTotalStats = !traitNames.includes(targetStat.toLowerCase()) || targetStat === 'all';

    if (needsTotalStats) {
        for (const trait of traitNames) {
            const baseStat = character.stats?.[trait as keyof typeof character.stats] || 0;
            const userMods = (character.modifiers?.[trait] || []) as any[];
            const userTotal = userMods.reduce((sum: number, mod: any) => sum + (mod.value || 0), 0);
            traitsWithTotals[trait] = baseStat + userTotal;
        }
    }

    return traitsWithTotals;
}

/**
 * Get modifiers from equipped items
 */
function getEquipmentModifiers(character: Character, stat: string): ModifierSource[] {
    const modifiers: ModifierSource[] = [];

    if (!character.character_inventory) return modifiers;

    const equippedItems = character.character_inventory.filter((item: any) =>
        ['equipped_primary', 'equipped_secondary', 'equipped_armor'].includes(item.location)
    );

    equippedItems.forEach((item: any) => {
        if (!item.library_item?.data) return;

        // Structured modifiers (preferred)
        if (Array.isArray(item.library_item.data.modifiers)) {
            item.library_item.data.modifiers.forEach((mod: any) => {
                if (mod.target === stat) {
                    modifiers.push({
                        id: `sys-${item.id}-${mod.id || Math.random()}`,
                        name: item.name,
                        value: mod.value,
                        source: 'equipment',
                        type: 'equipment'
                    });
                }
            });
            return;
        }

        // Fallback regex parsing
        const featureText = item.library_item.data.feature?.text || '';
        const featText = item.library_item.data.feat_text || '';
        const combinedText = `${featureText} ${featText}`;

        const regex = new RegExp(`([+-]?\\d+)\\s+(?:to|bonus\\s+to)\\s+${stat.replace('_', '\\s+')}`, 'gi');
        const matches = Array.from(combinedText.matchAll(regex));

        for (const match of matches) {
            const val = parseInt(match[1]);
            if (!isNaN(val)) {
                modifiers.push({
                    id: `sys-${item.id}-regex`,
                    name: item.name,
                    value: val,
                    source: 'equipment',
                    type: 'equipment'
                });
            }
        }
    });

    return modifiers;
}

/**
 * Get modifiers from domain cards in loadout
 */
function getDomainCardModifiers(
    character: any,
    stat: string,
    cardStates: CardStates
): ModifierSource[] {
    const modifiers: ModifierSource[] = [];

    if (!character.character_cards) return modifiers;

    const loadoutCards = character.character_cards.filter(
        (card: any) => card.location === 'loadout'
    );

    loadoutCards.forEach((card: any) => {
        const cardName = card.library_item?.name;
        if (!cardName || !card.library_item?.data) return;

        // Special case: Bare Bones
        if (cardName === 'Bare Bones') {
            const bareBonesModifiers = getBareBonesBonuses(character);
            bareBonesModifiers
                .filter((mod: any) => mod.stat === stat && mod.isActive)
                .forEach((mod: any, index: number) => {
                    modifiers.push({
                        id: `card-${card.id}-barebones-${mod.stat}-${index}`,
                        name: mod.source,
                        value: mod.value,
                        source: 'domain_card',
                        type: 'domain_card'
                    });
                });
            return;
        }

        const isCardActive = cardStates[cardName]?.is_active ?? false;

        // Check enhanced JSON modifiers first
        const enhancedData = cachedEnhancedAbilities.find(
            (a: EnhancedAbilityCard) => a.name === cardName
        );

        if (enhancedData) {
            const jsonModifiers = getModifiers(enhancedData);
            const matchingMods = jsonModifiers.filter(mod => mod.stat === stat);

            matchingMods.forEach((mod, index) => {
                // Determine activation
                let isActive: boolean;
                if (mod.condition?.type === 'when_active' || mod.condition?.type === 'cost_activated') {
                    const modifierKey = `${mod.stat}-${index}`;
                    isActive = cardStates[cardName]?.active_modifiers?.[modifierKey] ?? false;
                } else {
                    isActive = isModifierActive(mod, isCardActive, character);
                }

                if (isActive) {
                    const calculatedValue = mod.formula
                        ? calculateDynamicValue(mod.formula, character)
                        : mod.value;

                    modifiers.push({
                        id: `card-${card.id}-enhanced-${mod.stat}-${index}`,
                        name: mod.source || cardName,
                        value: calculatedValue,
                        source: 'domain_card',
                        type: 'domain_card',
                        formula: mod.formula,
                        condition: mod.condition
                    });
                }
            });

            // Skip text parsing if we found matching enhanced modifiers
            if (matchingMods.length > 0) {
                return;
            }
        }

        // Fallback: Text parsing
        const cardModifiers = parseCardPassiveModifiers(card, character, isCardActive);
        cardModifiers
            .filter((mod: any) => mod.stat === stat && mod.isActive)
            .forEach((mod: any, index: number) => {
                modifiers.push({
                    id: `card-${card.id}-${mod.stat}-${index}`,
                    name: mod.source,
                    value: mod.value,
                    source: 'domain_card',
                    type: 'domain_card'
                });
            });
    });

    return modifiers;
}

/**
 * Get modifiers for a specific card (for display in card enhancement panel)
 */
export function getCardModifiersForDisplay(
    cardName: string,
    character: Character | null,
    cardStates: CardStates = {}
): PassiveModifier[] {
    if (!character) return [];

    const enhancedData = cachedEnhancedAbilities.find(a => a.name === cardName);
    if (!enhancedData) return [];

    const traitsWithTotals = calculateTraitsWithTotals(character, 'all');
    const charForParsing = { ...character, stats: traitsWithTotals };
    const isCardActive = cardStates[cardName]?.is_active ?? false;

    const jsonModifiers = getModifiers(enhancedData);

    return jsonModifiers.map((mod, index) => {
        // Determine if this modifier is active
        let active: boolean;
        if (mod.condition?.type === 'when_active' || mod.condition?.type === 'cost_activated') {
            const modifierKey = `${mod.stat}-${index}`;
            active = cardStates[cardName]?.active_modifiers?.[modifierKey] ?? false;
        } else {
            active = isModifierActive(mod, isCardActive, charForParsing as any);
        }

        const calculatedValue = mod.formula
            ? calculateDynamicValue(mod.formula, charForParsing as any)
            : mod.value;

        return {
            stat: mod.stat,
            value: calculatedValue,
            formula: mod.formula,
            condition: mod.condition as any,
            isActive: active,
            source: mod.source || cardName
        };
    });
}
