/**
 * CONTENT LOADERS
 * ----------------------------------------------------------------------------
 * Utility functions for loading content from public and private directories.
 * Private content (playtest, campaign data) is loaded conditionally since
 * those folders may not exist in public clones of the repository.
 */

import type { EnhancedAbilityCard } from '@/types/cards';

// Public SRD content - always available
import srdAbilities from '@/content/public/srd/json/abilities_enhanced.json';
import srdAncestries from '@/content/public/srd/json/ancestries_enhanced.json';
import srdCommunities from '@/content/public/srd/json/communities_enhanced.json';

// Re-export public content
export { srdAbilities, srdAncestries, srdCommunities };

/**
 * Playtest abilities - loaded dynamically since the folder may not exist.
 * Returns an empty array if the content is not available.
 */
let playtestAbilitiesCache: EnhancedAbilityCard[] | null = null;

export function getPlaytestAbilities(): EnhancedAbilityCard[] {
    if (playtestAbilitiesCache !== null) {
        return playtestAbilitiesCache;
    }

    try {
        // Dynamic require - will fail if file doesn't exist
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const data = require('@/content/private/playtest/json/abilities_enhanced.json');
        playtestAbilitiesCache = (data.default || data) as EnhancedAbilityCard[];
        return playtestAbilitiesCache;
    } catch {
        // Playtest content not available - this is expected in public clones
        playtestAbilitiesCache = [];
        return playtestAbilitiesCache;
    }
}

/**
 * Get all abilities, optionally including playtest content.
 */
export function getAllAbilities(includePlaytest: boolean = false): EnhancedAbilityCard[] {
    const srd = (srdAbilities || []) as EnhancedAbilityCard[];
    if (!includePlaytest) {
        return srd;
    }
    return [...srd, ...getPlaytestAbilities()];
}
