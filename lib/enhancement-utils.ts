/**
 * Enhancement Block Utilities
 * ----------------------------------------------------------------------------
 * Helper functions for working with the enhancement/enhancement_override
 * block structure in enhanced JSON files.
 *
 * Usage:
 * import { getEnhancement, hasOverride } from '@/lib/enhancement-utils';
 *
 * const enhancement = getEnhancement(card);
 * if (hasOverride(card)) {
 *   console.log('Using manual override');
 * }
 */

import type {
    EnhancedAbilityCard,
    EnhancementBlock,
    CardCosts,
    CardAttack,
    CardRoll,
    CardModifier,
    ActionType,
    Timing,
    Frequency
} from '@/types/cards';

/**
 * Interface for cards/feats with the new enhancement block structure
 */
export interface WithEnhancement {
    enhancement?: EnhancementBlock;
    enhancement_override?: EnhancementBlock;
}

/**
 * Get the effective enhancement for a card/feat.
 * Uses enhancement_override if present, otherwise falls back to enhancement.
 *
 * @param item - Card or feat with enhancement blocks
 * @returns The effective enhancement block, or undefined if none exists
 *
 * @example
 * const card = await loadCard('Fireball');
 * const enhancement = getEnhancement(card);
 * console.log(enhancement?.action_type); // 'attack'
 */
export function getEnhancement<T extends WithEnhancement>(
    item: T
): EnhancementBlock | undefined {
    return item.enhancement_override ?? item.enhancement;
}

/**
 * Check if a card/feat has a manual enhancement override
 *
 * @param item - Card or feat with enhancement blocks
 * @returns true if enhancement_override exists
 */
export function hasOverride<T extends WithEnhancement>(item: T): boolean {
    return item.enhancement_override !== undefined;
}

/**
 * Get the action type from a card/feat, preferring override
 *
 * @param item - Card or feat with enhancement blocks
 * @returns The effective action_type
 */
export function getActionType<T extends WithEnhancement>(item: T): ActionType {
    return getEnhancement(item)?.action_type;
}

/**
 * Get the timing from a card/feat, preferring override
 *
 * @param item - Card or feat with enhancement blocks
 * @returns The effective timing
 */
export function getTiming<T extends WithEnhancement>(item: T): Timing {
    return getEnhancement(item)?.timing ?? 'action';
}

/**
 * Get the frequency from a card/feat, preferring override
 *
 * @param item - Card or feat with enhancement blocks
 * @returns The effective frequency
 */
export function getFrequency<T extends WithEnhancement>(item: T): Frequency {
    return getEnhancement(item)?.frequency ?? 'at_will';
}

/**
 * Get the keywords from a card/feat, preferring override
 *
 * @param item - Card or feat with enhancement blocks
 * @returns The effective keywords array, or empty array if none
 */
export function getKeywords<T extends WithEnhancement>(item: T): string[] {
    return getEnhancement(item)?.keywords ?? [];
}

/**
 * Get the costs from a card/feat, preferring override
 *
 * @param item - Card or feat with enhancement blocks
 * @returns The effective costs object, or null if none
 */
export function getCosts<T extends WithEnhancement>(
    item: T
): CardCosts | null | undefined {
    return getEnhancement(item)?.costs;
}

/**
 * Get the attack info from a card/feat, preferring override
 *
 * @param item - Card or feat with enhancement blocks
 * @returns The effective attack object, or null if none
 */
export function getAttack<T extends WithEnhancement>(
    item: T
): CardAttack | null | undefined {
    return getEnhancement(item)?.attack;
}

/**
 * Get the roll info from a card/feat, preferring override
 *
 * @param item - Card or feat with enhancement blocks
 * @returns The effective roll object, or null if none
 */
export function getRoll<T extends WithEnhancement>(
    item: T
): CardRoll | null | undefined {
    return getEnhancement(item)?.roll;
}

/**
 * Check if a card/feat has token mechanics, preferring override
 *
 * @param item - Card or feat with enhancement blocks
 * @returns true if has_tokens is true in the effective enhancement
 */
export function hasTokens<T extends WithEnhancement>(item: T): boolean {
    return getEnhancement(item)?.tokens?.has_tokens ?? false;
}

/**
 * Get the modifiers from a card/feat, preferring override
 *
 * @param item - Card or feat with enhancement blocks
 * @returns The effective modifiers array, or empty array if none
 */
export function getModifiers<T extends WithEnhancement>(item: T): CardModifier[] {
    return getEnhancement(item)?.modifiers ?? [];
}

/**
 * Evaluate whether a CardModifier is currently active based on its condition
 *
 * @param modifier - The modifier with a condition to evaluate
 * @param isCardActive - Whether the card is currently activated (via UI toggle)
 * @param character - The character for armor/loadout/HP checks (optional)
 * @returns true if the modifier should be applied
 */
export function isModifierActive(
    modifier: CardModifier,
    isCardActive: boolean,
    character?: {
        character_inventory?: Array<{ location: string }>;
        character_cards?: Array<{ location: string; library_item?: { domain?: string; data?: { domain?: string } } }>;
        vitals?: { hit_points_max?: number; hit_points_current?: number };
    }
): boolean {
    const condition = modifier.condition;

    // No condition = always active
    if (!condition) return true;

    switch (condition.type) {
        case 'always':
            return true;

        case 'when_active':
        case 'when_active_permanent':
        case 'cost_activated':
            // Only active when user has toggled the ability on
            // when_active_permanent works the same but also applies from vault
            return isCardActive;

        case 'when_armored':
            return !!character?.character_inventory?.find(i => i.location === 'equipped_armor');

        case 'when_unarmored':
            return !character?.character_inventory?.find(i => i.location === 'equipped_armor');

        case 'when_hp_marked':
            // Active when character has at least 1 HP marked
            // Marked HP = max HP - current HP (HP uses "mark-bad" semantics)
            if (!character?.vitals) return false;
            const maxHp = character.vitals.hit_points_max || 0;
            const currentHp = character.vitals.hit_points_current || 0;
            const markedHp = maxHp - currentHp;
            return markedHp >= (condition.minMarked || 1);

        case 'loadout_domain_count':
            if (!character?.character_cards) return false;
            const loadoutCards = character.character_cards.filter(c => c.location === 'loadout');
            const domainCount = loadoutCards.filter(c => {
                const domain = c.library_item?.domain || c.library_item?.data?.domain;
                return domain?.toLowerCase() === condition.domain?.toLowerCase();
            }).length;
            return domainCount >= (condition.minCount || 0);

        case 'environment':
            // Not yet implemented - always inactive
            return false;

        default:
            return false;
    }
}

/**
 * Legacy interface for migration
 */
interface LegacyAbilityCard {
    name: string;
    level: string;
    domain: string;
    type: 'Spell' | 'Ability';
    recall: string;
    text: string;

    // Flattened enhanced fields (legacy)
    action_type?: string;
    timing?: string;
    frequency?: string;
    costs?: Record<string, number> | null;
    keywords?: string[];
    has_tokens?: boolean;
    max_tokens?: number | null;
    token_source?: string;
    attack?: Record<string, unknown> | null;
    roll?: Record<string, unknown> | null;
    modifiers?: Array<Record<string, unknown>>;
    duration?: string;

    // New structure might already exist
    enhancement?: EnhancementBlock;
}

/**
 * Migrate a flat enhanced card to the new block structure
 * Useful for transitioning existing data
 *
 * @param card - Card in old flat structure (fields at top level)
 * @returns Card with enhancement block structure
 */
export function migrateToBlockStructure(
    card: LegacyAbilityCard
): EnhancedAbilityCard {
    // If already has enhancement block, return it (cast to formatted type)
    if (card.enhancement) {
        return card as unknown as EnhancedAbilityCard;
    }

    // Extract enhanced fields into block
    const enhancement: EnhancementBlock = {
        action_type: (card.action_type as ActionType),
        timing: (card.timing as Timing) ?? 'action',
        frequency: (card.frequency as Frequency) ?? 'at_will',
        costs: card.costs as unknown as CardCosts,
        keywords: card.keywords,
        tokens: {
            has_tokens: card.has_tokens ?? false,
            max_tokens: card.max_tokens,
            token_source: card.token_source
        },
        attack: card.attack as unknown as CardAttack,
        roll: card.roll as unknown as CardRoll,
        modifiers: card.modifiers as unknown as CardModifier[],
        duration: card.duration,
    };

    // Return with base fields + enhancement block
    return {
        name: card.name,
        level: card.level,
        domain: card.domain,
        type: card.type,
        recall: card.recall,
        text: card.text,
        enhancement,
    };
}
