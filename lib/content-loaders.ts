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
import srdClasses from '@/content/public/srd/json/classes_enhanced.json';
import srdSubclasses from '@/content/public/srd/json/subclasses_enhanced.json';

// Re-export public content
export { srdAbilities, srdAncestries, srdCommunities, srdClasses, srdSubclasses };

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

/**
 * Playtest classes - loaded dynamically since the folder may not exist.
 * Returns an empty array if the content is not available.
 */
let playtestClassesCache: any[] | null = null;

export function getPlaytestClasses(): any[] {
    if (playtestClassesCache !== null) {
        return playtestClassesCache;
    }

    try {
        // Dynamic require - will fail if file doesn't exist
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const data = require('@/content/private/playtest/json/classes_enhanced.json');
        playtestClassesCache = (data.default || data) as any[];
        return playtestClassesCache;
    } catch {
        // Playtest content not available - this is expected in public clones
        playtestClassesCache = [];
        return playtestClassesCache;
    }
}

/**
 * Get all classes, optionally including playtest content.
 */
export function getAllClasses(includePlaytest: boolean = false): any[] {
    const srd = (srdClasses || []) as any[];
    if (!includePlaytest) {
        return srd;
    }
    return [...srd, ...getPlaytestClasses()];
}

/**
 * Playtest subclasses - loaded dynamically since the folder may not exist.
 * Returns an empty array if the content is not available.
 */
let playtestSubclassesCache: any[] | null = null;

export function getPlaytestSubclasses(): any[] {
    if (playtestSubclassesCache !== null) {
        return playtestSubclassesCache;
    }

    try {
        // Dynamic require - will fail if file doesn't exist
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const data = require('@/content/private/playtest/json/subclasses_enhanced.json');
        playtestSubclassesCache = (data.default || data) as any[];
        return playtestSubclassesCache;
    } catch {
        // Playtest content not available - this is expected in public clones
        playtestSubclassesCache = [];
        return playtestSubclassesCache;
    }
}

/**
 * Get all subclasses, optionally including playtest content.
 */
export function getAllSubclasses(includePlaytest: boolean = false): any[] {
    const srd = (srdSubclasses || []) as any[];
    if (!includePlaytest) {
        return srd;
    }
    return [...srd, ...getPlaytestSubclasses()];
}
