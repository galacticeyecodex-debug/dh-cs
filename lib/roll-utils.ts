/**
 * Roll Utilities
 * ----------------------------------------------------------------------------
 * Centralized roll bonus calculations for consistent modifier handling across
 * all views (character-view, combat-view, playmat).
 * 
 * This module ensures that roll buttons everywhere use the same logic to:
 * - Apply base trait values
 * - Apply system modifiers (from loadout cards)
 * - Apply user modifiers (manually added)
 * - Handle spellcast trait derivation
 */

import type { Character } from '@/types/character';
import type { CardState } from '@/store/slices/card-state-slice';
import type { EnhancedAbilityCard } from '@/types/cards';
import { getSystemModifiers } from '@/lib/utils';

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
 * @param enhancedAbilities - Optional enhanced ability data for system modifier calculation
 * @returns Complete roll bonus information
 */
export function calculateRollBonus(
    character: Character,
    trait: string,
    cardStates?: Record<string, CardState>,
    enhancedAbilities?: EnhancedAbilityCard[]
): RollBonusResult {
    const traitKey = trait.toLowerCase();

    // Handle Spellcast specially - it's derived from the character's spellcast trait
    if (traitKey === 'spellcast') {
        return calculateSpellcastBonus(character, cardStates, enhancedAbilities);
    }

    // Get base trait value
    const baseValue = character.stats[traitKey as keyof typeof character.stats] || 0;

    // Get system modifiers (from loadout cards, etc.)
    const systemMods = getSystemModifiers(character, traitKey, cardStates, enhancedAbilities);

    // Get user modifiers (manually added)
    const userMods = character.modifiers?.[traitKey] || [];

    // Calculate total modifier sum
    const modifierSum = [...systemMods, ...userMods].reduce((acc, mod) => acc + mod.value, 0);
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
    enhancedAbilities?: EnhancedAbilityCard[]
): RollBonusResult {
    // Determine which trait spellcast is based on
    const spellcastTraitName = character.spellcast_trait || character.subclass_data?.data?.spellcast_trait;

    // Get base value from the spellcast trait, or fall back to deprecated spellcast property
    const rawTraitValue = spellcastTraitName
        ? (character.stats[spellcastTraitName.toLowerCase() as keyof typeof character.stats] || 0)
        : (character.spellcast || 0);

    // Add modifiers for the underlying trait (e.g., Instinct modifiers)
    let traitModSum = 0;
    if (spellcastTraitName) {
        const traitKey = spellcastTraitName.toLowerCase();
        const systemTraitMods = getSystemModifiers(character, traitKey, cardStates, enhancedAbilities);
        const userTraitMods = character.modifiers?.[traitKey] || [];
        traitModSum = [...systemTraitMods, ...userTraitMods].reduce((acc, m) => acc + m.value, 0);
    }

    const spellcastBase = rawTraitValue + traitModSum;

    // Add spellcast-specific modifiers
    const spellcastMods = getSystemModifiers(character, 'spellcast', cardStates, enhancedAbilities);
    const userSpellcastMods = character.modifiers?.['spellcast'] || [];
    const spellcastModSum = [...spellcastMods, ...userSpellcastMods].reduce((acc, mod) => acc + mod.value, 0);

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
