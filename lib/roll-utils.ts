/**
 * Roll Utilities
 * ----------------------------------------------------------------------------
 * Centralized roll bonus calculations for consistent modifier handling across
 * all views (character-view, combat-view, playmat).
 *
 * This module ensures that roll buttons everywhere use the same logic to:
 * - Apply base trait values
 * - Apply system modifiers (from loadout cards, ancestry, community, class, subclass)
 * - Apply user modifiers (manually added)
 * - Handle spellcast trait derivation
 *
 * NOTE: This module now uses the unified modifier-aggregator as the single
 * source of truth for all modifier calculations.
 */

import type { Character } from '@/types/character';
import type { CardState } from '@/store/slices/card-state-slice';
import type { EnhancedAbilityCard, CardStates } from '@/types/cards';
import { getStatModifiers } from '@/lib/modifier-aggregator';
import { WithEnhancement } from './enhancement-utils';

export interface RollBonusResult {
    /** The total calculated bonus including all modifiers */
    bonus: number;
    /** Display label for the roll (e.g., "Spellcast", "Agility") */
    label: string;
    /** The underlying trait key (lowercase) */
    trait: string;
    /** Whether any modifiers were applied beyond the base value */
    isModified: boolean;
    /** The base value before modifiers */
    baseValue: number;
}

/**
 * Calculate the complete roll bonus for a given trait, including all modifiers.
 *
 * @param character - The character making the roll
 * @param trait - The trait to roll with (e.g., "Agility", "Spellcast")
 * @param cardStates - Optional card states for conditional modifier logic
 * @param _enhancedAbilities - Deprecated: Now uses cached enhanced abilities from modifier-aggregator
 * @returns Complete roll bonus information
 */
export function calculateRollBonus(
    character: Character,
    trait: string,
    cardStates?: Record<string, CardState>,
    _enhancedAbilities?: EnhancedAbilityCard[]
): RollBonusResult {
    const traitKey = trait.toLowerCase();

    // Handle Spellcast specially - it's derived from the character's spellcast trait
    if (traitKey === 'spellcast') {
        return calculateSpellcastBonus(character, cardStates, _enhancedAbilities);
    }

    // Get base trait value
    const baseValue = character.stats[traitKey as keyof typeof character.stats] || 0;

    // Get all modifiers from the unified aggregator (includes user modifiers)
    // Cast cardStates to CardStates for type compatibility
    const allMods = getStatModifiers(character, traitKey, (cardStates || {}) as CardStates);

    // Calculate total modifier sum
    const modifierSum = allMods.reduce((acc, mod) => acc + mod.value, 0);
    const totalBonus = baseValue + modifierSum;

    return {
        bonus: totalBonus,
        label: trait.charAt(0).toUpperCase() + trait.slice(1),
        trait: traitKey,
        isModified: modifierSum !== 0,
        baseValue,
    };
}

/**
 * Calculate spellcast bonus with proper trait derivation.
 *
 * Spellcast is special because it's derived from a character's spellcast_trait
 * (e.g., "Instinct" for some classes, "Presence" for others).
 *
 * The calculation is:
 * 1. Get the base value from the derived trait (e.g., character.stats.instinct)
 * 2. Add modifiers for that trait
 * 3. Add modifiers specifically for "spellcast"
 */
export function calculateSpellcastBonus(
    character: Character,
    cardStates?: Record<string, CardState>,
    _enhancedAbilities?: EnhancedAbilityCard[]
): RollBonusResult {
    // Determine which trait spellcast is based on
    const spellcastTraitName = character.spellcast_trait || character.subclass_data?.data?.spellcast_trait;
    // Cast cardStates to CardStates for type compatibility
    const cardStatesObj = (cardStates || {}) as CardStates;

    // Get base value from the spellcast trait, or fall back to deprecated spellcast property
    const rawTraitValue = spellcastTraitName
        ? (character.stats[spellcastTraitName.toLowerCase() as keyof typeof character.stats] || 0)
        : (character.spellcast || 0);

    // Add modifiers for the underlying trait (e.g., Instinct modifiers)
    let traitModSum = 0;
    if (spellcastTraitName) {
        const traitKey = spellcastTraitName.toLowerCase();
        // Get all modifiers from unified aggregator (includes user modifiers)
        const traitMods = getStatModifiers(character, traitKey, cardStatesObj);
        traitModSum = traitMods.reduce((acc, m) => acc + m.value, 0);
    }

    const spellcastBase = rawTraitValue + traitModSum;

    // Add spellcast-specific modifiers from unified aggregator
    const spellcastMods = getStatModifiers(character, 'spellcast', cardStatesObj);
    const spellcastModSum = spellcastMods.reduce((acc, mod) => acc + mod.value, 0);

    const totalSpellcast = spellcastBase + spellcastModSum;

    return {
        bonus: totalSpellcast,
        label: 'Spellcast',
        trait: 'spellcast',
        isModified: traitModSum !== 0 || spellcastModSum !== 0,
        baseValue: rawTraitValue,
    };
}

/**
 * Calculate roll bonus from enhancement roll info.
 * 
 * This is a convenience wrapper that extracts the trait from enhancement data.
 * 
 * @param character - The character making the roll
 * @param enhancement - Enhancement data containing roll.trait or attack.trait
 * @param cardStates - Optional card states for conditional modifier logic
 * @param enhancedAbilities - Optional enhanced ability data
 * @returns Roll bonus result or null if no roll trait is specified
 */
export function calculateEnhancementRollBonus(
    character: Character,
    enhancement: { roll?: { trait?: string; difficulty?: number }; attack?: { trait?: string } },
    cardStates?: Record<string, CardState>,
    enhancedAbilities?: EnhancedAbilityCard[]
): RollBonusResult | null {
    const rollTrait = enhancement.roll?.trait || enhancement.attack?.trait;

    if (!rollTrait) {
        return null;
    }

    return calculateRollBonus(character, rollTrait, cardStates, enhancedAbilities);
}

/**
 * Calculate the complete damage bonus for a character.
 * Uses the unified modifier aggregator to collect all damage-specific modifiers.
 * 
 * @param character - The character making the roll
 * @param cardStates - Optional card states for conditional modifier logic
 * @returns The total damage bonus from all sources
 */
export function calculateDamageBonus(
    character: Character | null,
    cardStates?: Record<string, CardState> | Record<string, any>
): number {
    if (!character) return 0;
    // Cast cardStates to CardStates for type compatibility
    const cardStatesObj = (cardStates || {}) as CardStates;

    // Get all damage-specific modifiers from the unified aggregator
    const damageMods = getStatModifiers(character, 'damage', cardStatesObj);

    // Sum them up
    return damageMods.reduce((acc, mod) => acc + mod.value, 0);
}

/**
 * Calculate the complete attack bonus for a character.
 * Uses the unified modifier aggregator to collect all attack-specific modifiers.
 * 
 * @param character - The character making the roll
 * @param cardStates - Optional card states for conditional modifier logic
 * @param _enhancedAbilities - Deprecated: Now uses cached enhanced abilities from modifier-aggregator
 * @returns The total attack bonus from all sources
 */
export function calculateAttackBonus(
    character: Character | null,
    cardStates?: Record<string, CardState> | Record<string, any>,
    _enhancedAbilities?: Array<WithEnhancement & { name: string }>
): number {
    if (!character) return 0;
    // Cast cardStates to CardStates for type compatibility
    const cardStatesObj = (cardStates || {}) as CardStates;

    // getStatModifiers already includes ALL sources: equipment, domain cards, user, etc.
    const allMods = getStatModifiers(character, 'attack', cardStatesObj);
    return allMods.reduce((acc, mod) => acc + mod.value, 0);
}
