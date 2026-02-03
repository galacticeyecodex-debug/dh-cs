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
 * 1. Use the useModifierAggregatorInit() hook in your app root (automatically done in app/layout.tsx)
 * 2. Call getStatModifiers()/getRollBonus() for modifier calculations
 * 3. Call getAllActiveModifiers() for UI display of active modifiers
 *
 * INITIALIZATION:
 * The aggregator is initialized in app/layout-client.tsx via the useModifierAggregatorInit hook.
 * This ensures the cache is populated before any components attempt to access modifier data.
 * Components no longer need to call initModifierAggregator() themselves.
 * 
 * @see lib/enhancement-utils.ts for card-level modifier extraction
 * @see lib/modifier-service.ts for applying modifier operations
 * @see types/cards.ts for CardModifier type definition
 */

import type { EnhancedAbilityCard, CardModifier, CardStates } from '@/types/cards';
import type { Character } from '@/types/character';
import { getModifiers, isModifierActive } from './enhancement-utils';
import { calculateDynamicValue, calculateTierScaledValue, parseCardPassiveModifiers, getBareBonesBonuses, parseStaticModifiers, type PassiveModifier } from './card-parser';
import { validateModifierValue } from './modifier-validator';

// ============================================================================
// MODIFIER SOURCE REGISTRY (Exhaustive - TypeScript enforces completeness)
// ============================================================================

/**
 * All possible sources of character stat modifiers.
 * Adding a new source here requires implementing a handler in getStatModifiers.
 * TypeScript will error if any source is unhandled (via exhaustive switch).
 */
export const MODIFIER_SOURCES = [
    'equipment',
    'domain_card',
    'user',
    'ancestry',
    'community',
    'class',
    'subclass'
] as const;

export type ModifierSourceType = typeof MODIFIER_SOURCES[number];

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
    if (cachedEnhancedAbilities.length === 0) {
        if (process.env.NODE_ENV === 'development') {
            console.warn(
                '[modifier-aggregator] Cache is empty. ' +
                'Did you call initModifierAggregator() at app startup? ' +
                'The aggregator will still work, but with incomplete modifier data. ' +
                'See: useModifierAggregatorInit hook for proper initialization.'
            );
        }
    }
    return cachedEnhancedAbilities;
}

// ============================================================================
// TYPES
// ============================================================================

export interface ModifierSource {
    id: string;
    name: string;
    value: number;
    source: ModifierSourceType;
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
 *
 * Uses exhaustive switch to ensure all MODIFIER_SOURCES are handled.
 * TypeScript will error if a new source is added without a handler.
 */
export function getStatModifiers(
    character: Character | null,
    stat: string,
    cardStates: CardStates | Record<string, unknown> = {}
): ModifierSource[] {
    if (!character) return [];

    const modifiers: ModifierSource[] = [];

    // Calculate trait totals for dynamic formulas (avoid circular dependency)
    const traitsWithTotals = calculateTraitsWithTotals(character, stat);
    const charForParsing = { ...character, stats: traitsWithTotals };

    // Exhaustive handling of all modifier sources
    for (const sourceType of MODIFIER_SOURCES) {
        switch (sourceType) {
            case 'equipment':
                modifiers.push(...getEquipmentModifiers(character, stat));
                break;
            case 'domain_card':
                modifiers.push(...getDomainCardModifiers(charForParsing, stat, cardStates as CardStates));
                break;
            case 'user':
                modifiers.push(...getUserModifiers(character, stat));
                break;
            case 'ancestry':
                modifiers.push(...getAncestryModifiers(character, stat));
                break;
            case 'community':
                modifiers.push(...getCommunityModifiers(character, stat));
                break;
            case 'class':
                modifiers.push(...getClassModifiers(character, stat));
                break;
            case 'subclass':
                modifiers.push(...getSubclassModifiers(character, stat));
                break;
            default:
                // TypeScript compile-time exhaustiveness check
                const _exhaustive: never = sourceType;
                throw new Error(`Unhandled modifier source: ${_exhaustive}`);
        }
    }

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
                        // Use tier scaling if available, otherwise formula or static value
                        const calculatedValue = calculateTierScaledValue(mod, charForParsing as any);

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
 *
 * CIRCULAR DEPENDENCY MITIGATION:
 * ============================================================================
 * Problem: Domain cards can use dynamic formulas that reference trait values
 * (e.g., "Deal [2d8 + Strength] damage"). But calculating trait totals requires
 * knowing what domain card modifiers apply, which depends on evaluating those
 * same domain card formulas. This creates a circular dependency.
 *
 * Solution: Pre-calculate trait totals BEFORE processing domain card modifiers.
 * This creates a single-pass evaluation:
 * 1. Calculate base trait totals using character base values (no modifiers yet)
 * 2. Process domain cards with those pre-calculated trait values
 * 3. Return complete modifier list including domain card modifiers
 *
 * The base trait calculation does NOT include domain card modifiers, so when
 * you evaluate a domain card formula like "[2d8 + Strength]", the Strength
 * value is the base value, not the modified value. This is correct because
 * domain card bonuses are meant to stack on top of base traits.
 *
 * Example:
 * - Character base Strength: 4
 * - Domain card modifier to Strength: +2
 * - Formula in domain card: "[1d8 + Strength]"
 * - Strength value used in formula: 4 (base value, not 6)
 * - Final Strength total: 4 + 2 = 6 (the +2 is added as a separate modifier)
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
 * Get user-added modifiers (manually entered by player)
 */
function getUserModifiers(character: Character, stat: string): ModifierSource[] {
    const modifiers: ModifierSource[] = [];
    const userMods = (character.modifiers?.[stat] || []) as any[];

    userMods.forEach((mod: any, index: number) => {
        modifiers.push({
            id: `user-${stat}-${index}`,
            name: mod.name || 'Custom',
            value: validateModifierValue(mod.value || 0),
            source: 'user',
            type: 'user'
        });
    });

    return modifiers;
}

/**
 * Get modifiers from ancestry features.
 * CRITICAL: Check structured stat_bonuses FIRST to avoid duplication.
 * Only fall back to text parsing if no structured data exists for this stat.
 */
function getAncestryModifiers(character: Character, stat: string): ModifierSource[] {
    const modifiers: ModifierSource[] = [];
    if (!character.ancestry_features) return modifiers;

    character.ancestry_features.forEach((feature: any) => {
        // CRITICAL: Check structured stat_bonuses FIRST to avoid duplication
        const hasStructuredBonus = feature.stat_bonuses &&
            Object.keys(feature.stat_bonuses).includes(stat);

        if (hasStructuredBonus) {
            // Use structured data (preferred - exact value)
            modifiers.push({
                id: `ancestry-${feature.name}-${stat}`,
                name: `${character.ancestry || 'Ancestry'}: ${feature.name}`,
                value: validateModifierValue(feature.stat_bonuses[stat]),
                source: 'ancestry',
                type: 'ancestry'
            });
        } else if (feature.text) {
            // Fallback to text parsing ONLY if no structured data for this stat
            const featureSource = `${character.ancestry || 'Ancestry'}: ${feature.name}`;
            const textMods = parseStaticModifiers(feature.text, featureSource);
            textMods.filter(mod => mod.stat === stat).forEach((mod, index) => {
                modifiers.push({
                    id: `ancestry-${feature.name}-text-${stat}-${index}`,
                    name: mod.source || featureSource,
                    value: validateModifierValue(mod.value),
                    source: 'ancestry',
                    type: 'ancestry'
                });
            });
        }
    });

    return modifiers;
}

/**
 * Get modifiers from community features.
 * Same pattern as ancestry: structured first, text fallback.
 */
function getCommunityModifiers(character: Character, stat: string): ModifierSource[] {
    const modifiers: ModifierSource[] = [];

    // Check for community_features array on the character
    const communityFeatures = (character as any).community_features;
    if (!communityFeatures) return modifiers;

    communityFeatures.forEach((feature: any) => {
        // Check structured stat_bonuses FIRST
        const hasStructuredBonus = feature.stat_bonuses &&
            Object.keys(feature.stat_bonuses).includes(stat);

        if (hasStructuredBonus) {
            modifiers.push({
                id: `community-${feature.name}-${stat}`,
                name: `${character.community || 'Community'}: ${feature.name}`,
                value: validateModifierValue(feature.stat_bonuses[stat]),
                source: 'community',
                type: 'community'
            });
        } else if (feature.text) {
            // Fallback to text parsing
            const featureSource = `${character.community || 'Community'}: ${feature.name}`;
            const textMods = parseStaticModifiers(feature.text, featureSource);
            textMods.filter(mod => mod.stat === stat).forEach((mod, index) => {
                modifiers.push({
                    id: `community-${feature.name}-text-${stat}-${index}`,
                    name: mod.source || featureSource,
                    value: validateModifierValue(mod.value),
                    source: 'community',
                    type: 'community'
                });
            });
        }
    });

    return modifiers;
}

/**
 * Get modifiers from class features.
 * Extracts from character.class_data.data.class_features
 */
function getClassModifiers(character: Character, stat: string): ModifierSource[] {
    const modifiers: ModifierSource[] = [];

    // Class features are in class_data.data.class_features
    const classFeatures = (character.class_data as any)?.data?.class_features;
    if (!classFeatures || !Array.isArray(classFeatures)) return modifiers;

    const className = character.class_data?.name || 'Class';

    classFeatures.forEach((feature: any) => {
        // Check structured stat_bonuses FIRST
        const hasStructuredBonus = feature.stat_bonuses &&
            Object.keys(feature.stat_bonuses).includes(stat);

        if (hasStructuredBonus) {
            modifiers.push({
                id: `class-${feature.name}-${stat}`,
                name: `${className}: ${feature.name}`,
                value: validateModifierValue(feature.stat_bonuses[stat]),
                source: 'class',
                type: 'class'
            });
        } else if (feature.text) {
            // Fallback to text parsing
            const featureSource = `${className}: ${feature.name}`;
            const textMods = parseStaticModifiers(feature.text, featureSource);
            textMods.filter(mod => mod.stat === stat).forEach((mod, index) => {
                modifiers.push({
                    id: `class-${feature.name}-text-${stat}-${index}`,
                    name: mod.source || featureSource,
                    value: mod.value,
                    source: 'class',
                    type: 'class'
                });
            });
        }
    });

    return modifiers;
}

/**
 * Get modifiers from subclass features.
 * Extracts from foundation_features, specialization_features, mastery_features
 * based on character's subclass_progression.
 *
 * Priority order:
 * 1. enhancement.modifiers (from enhanced JSON - most precise)
 * 2. stat_bonuses (structured data)
 * 3. text parsing (fallback)
 */
function getSubclassModifiers(character: Character, stat: string): ModifierSource[] {
    const modifiers: ModifierSource[] = [];

    const subclassData = character.subclass_data?.data as any;
    if (!subclassData) return modifiers;

    const subclassName = character.subclass_data?.name || 'Subclass';
    const progression = character.subclass_progression || {};

    // Helper to process a feature array
    const processFeatures = (features: any[] | undefined, tier: string) => {
        if (!features || !Array.isArray(features)) return;

        features.forEach((feature: any) => {
            // Priority 1: Check enhancement.modifiers (from enhanced JSON)
            const enhancedMods = feature.enhancement?.modifiers;
            if (enhancedMods && Array.isArray(enhancedMods)) {
                // Handle "damage_threshold" stat which applies to all three thresholds
                const matchingMods = enhancedMods.filter((mod: any) => {
                    if (mod.stat === stat) return true;
                    // "damage_threshold" applies to minor, major, and severe
                    if (mod.stat === 'damage_threshold' &&
                        (stat === 'damage_threshold_minor' ||
                         stat === 'damage_threshold_major' ||
                         stat === 'damage_threshold_severe')) {
                        return true;
                    }
                    return false;
                });

                if (matchingMods.length > 0) {
                    matchingMods.forEach((mod: any, index: number) => {
                        // Check if modifier is active (always, when_active, etc.)
                        const isActive = !mod.condition || mod.condition.type === 'always';
                        if (isActive) {
                            const calculatedValue = mod.formula
                                ? calculateDynamicValue(mod.formula, character)
                                : mod.value;

                            modifiers.push({
                                id: `subclass-${tier}-${feature.name}-enhanced-${stat}-${index}`,
                                name: `${subclassName}: ${feature.name}`,
                                value: validateModifierValue(calculatedValue),
                                source: 'subclass',
                                type: 'subclass'
                            });
                        }
                    });
                    return; // Skip other extraction methods if we found enhanced modifiers
                }
            }

            // Priority 2: Check structured stat_bonuses
            const hasStructuredBonus = feature.stat_bonuses &&
                Object.keys(feature.stat_bonuses).includes(stat);

            if (hasStructuredBonus) {
                modifiers.push({
                    id: `subclass-${tier}-${feature.name}-${stat}`,
                    name: `${subclassName}: ${feature.name}`,
                    value: validateModifierValue(feature.stat_bonuses[stat]),
                    source: 'subclass',
                    type: 'subclass'
                });
            } else if (feature.text) {
                // Priority 3: Fallback to text parsing
                const featureSource = `${subclassName}: ${feature.name}`;
                const textMods = parseStaticModifiers(feature.text, featureSource);
                textMods.filter(mod => mod.stat === stat).forEach((mod, index) => {
                    modifiers.push({
                        id: `subclass-${tier}-${feature.name}-text-${stat}-${index}`,
                        name: mod.source || featureSource,
                        value: mod.value,
                        source: 'subclass',
                        type: 'subclass'
                    });
                });
            }
        });
    };

    // Process features based on progression
    // Foundation features are always available if subclass is selected
    processFeatures(subclassData.foundation_features, 'foundation');

    // Specialization features only if obtained
    if (progression.specialization_obtained) {
        processFeatures(subclassData.specialization_features, 'specialization');
    }

    // Mastery features only if obtained
    if (progression.mastery_obtained) {
        processFeatures(subclassData.mastery_features, 'mastery');
    }

    // Also check multiclass if present
    const multiclassData = (character as any).multiclass_data?.data;
    const multiclassProgression = character.multiclass_progression || {};
    if (multiclassData) {
        const multiclassName = (character as any).multiclass_data?.name || 'Multiclass';

        const processMulticlassFeatures = (features: any[] | undefined, tier: string) => {
            if (!features || !Array.isArray(features)) return;

            features.forEach((feature: any) => {
                // Priority 1: Check enhancement.modifiers (from enhanced JSON)
                const enhancedMods = feature.enhancement?.modifiers;
                if (enhancedMods && Array.isArray(enhancedMods)) {
                    // Handle "damage_threshold" stat which applies to all three thresholds
                    const matchingMods = enhancedMods.filter((mod: any) => {
                        if (mod.stat === stat) return true;
                        if (mod.stat === 'damage_threshold' &&
                            (stat === 'damage_threshold_minor' ||
                             stat === 'damage_threshold_major' ||
                             stat === 'damage_threshold_severe')) {
                            return true;
                        }
                        return false;
                    });

                    if (matchingMods.length > 0) {
                        matchingMods.forEach((mod: any, index: number) => {
                            const isActive = !mod.condition || mod.condition.type === 'always';
                            if (isActive) {
                                const calculatedValue = mod.formula
                                    ? calculateDynamicValue(mod.formula, character)
                                    : mod.value;

                                modifiers.push({
                                    id: `multiclass-${tier}-${feature.name}-enhanced-${stat}-${index}`,
                                    name: `${multiclassName}: ${feature.name}`,
                                    value: validateModifierValue(calculatedValue),
                                    source: 'subclass',
                                    type: 'multiclass'
                                });
                            }
                        });
                        return;
                    }
                }

                // Priority 2: Check structured stat_bonuses
                const hasStructuredBonus = feature.stat_bonuses &&
                    Object.keys(feature.stat_bonuses).includes(stat);

                if (hasStructuredBonus) {
                    modifiers.push({
                        id: `multiclass-${tier}-${feature.name}-${stat}`,
                        name: `${multiclassName}: ${feature.name}`,
                        value: validateModifierValue(feature.stat_bonuses[stat]),
                        source: 'subclass', // Multiclass is treated as subclass source
                        type: 'multiclass'
                    });
                } else if (feature.text) {
                    // Priority 3: Fallback to text parsing
                    const featureSource = `${multiclassName}: ${feature.name}`;
                    const textMods = parseStaticModifiers(feature.text, featureSource);
                    textMods.filter(mod => mod.stat === stat).forEach((mod, index) => {
                        modifiers.push({
                            id: `multiclass-${tier}-${feature.name}-text-${stat}-${index}`,
                            name: mod.source || featureSource,
                            value: mod.value,
                            source: 'subclass',
                            type: 'multiclass'
                        });
                    });
                }
            });
        };

        processMulticlassFeatures(multiclassData.foundation_features, 'foundation');
        if (multiclassProgression.specialization_obtained) {
            processMulticlassFeatures(multiclassData.specialization_features, 'specialization');
        }
        if (multiclassProgression.mastery_obtained) {
            processMulticlassFeatures(multiclassData.mastery_features, 'mastery');
        }
    }

    return modifiers;
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
 * Get modifiers from domain cards in loadout (and vault cards with permanent modifiers)
 *
 * Cards with `when_active_permanent` condition apply even from the vault.
 * This is used for cards like Vitality where you make a permanent choice.
 */
function getDomainCardModifiers(
    character: any,
    stat: string,
    cardStates: CardStates
): ModifierSource[] {
    const modifiers: ModifierSource[] = [];

    if (!character.character_cards) return modifiers;

    // Process all cards (loadout and vault) - we'll filter based on condition type
    const allCards = character.character_cards;

    allCards.forEach((card: any) => {
        const cardName = card.library_item?.name;
        if (!cardName || !card.library_item?.data) return;

        const isInLoadout = card.location === 'loadout';

        // Special case: Bare Bones (only applies from loadout)
        if (cardName === 'Bare Bones' && isInLoadout) {
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

            // Iterate over ALL modifiers to find matching ones while preserving the absolute index
            // for correct modifierKey lookup (matches UI in CardEnhancementPanel)
            jsonModifiers.forEach((mod, absIndex) => {
                if (mod.stat !== stat) return;

                // For vault cards, only process when_active_permanent modifiers
                if (!isInLoadout && mod.condition?.type !== 'when_active_permanent') {
                    return;
                }

                // Determine activation
                let isActive: boolean;
                if (mod.condition?.type === 'when_active' ||
                    mod.condition?.type === 'when_active_permanent' ||
                    mod.condition?.type === 'cost_activated') {
                    const modifierKey = `${mod.stat}-${absIndex}`;
                    isActive = cardStates[cardName]?.active_modifiers?.[modifierKey] ?? false;
                } else {
                    isActive = isModifierActive(mod, isCardActive, character);
                }

                if (isActive) {
                    // Use tier scaling if available, otherwise formula or static value
                    const calculatedValue = calculateTierScaledValue(mod, character);

                    modifiers.push({
                        id: `card-${card.id}-enhanced-${mod.stat}-${absIndex}`,
                        name: mod.source || cardName,
                        value: calculatedValue,
                        source: 'domain_card',
                        type: 'domain_card',
                        formula: mod.formula,
                        condition: mod.condition
                    });
                }
            });

            // Skip text parsing if we have enhanced data for this card
            return;
        }

        // Fallback: Text parsing (only for loadout cards)
        if (!isInLoadout) return;

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

        // Use tier scaling if available, otherwise formula or static value
        const calculatedValue = calculateTierScaledValue(mod, charForParsing as any);

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
