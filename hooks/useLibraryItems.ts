/**
 * USE LIBRARY ITEMS HOOK
 * ----------------------------------------------------------------------------
 * Centralized hook for fetching library items from the database.
 * 
 * BENEFITS:
 * - DRY: Single source of truth for library fetching logic
 * - Maintainability: Bug fixes and improvements in one place
 * - Consistency: Same error handling and loading states everywhere
 * - Performance: Optional caching to reduce database hits
 * - Reusability: Any component can use this hook
 * 
 * USAGE:
 * ```tsx
 * // Fetch specific types
 * const { items, loading, error, refetch } = useLibraryItems({
 *   types: ['weapon', 'armor', 'consumable']
 * });
 * 
 * // Fetch all items
 * const { items, loading, error, refetch } = useLibraryItems({
 *   fetchAll: true
 * });
 * 
 * // With playtest content
 * const { items, loading, error, refetch } = useLibraryItems({
 *   types: ['ability', 'spell'],
 *   includePlaytest: true
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { dataService } from '@/lib/data-service';
import { LibraryItem } from '@/store/character-store';

/** Valid library item types that can be fetched */
export type LibraryItemType =
    | 'weapon'
    | 'armor'
    | 'consumable'
    | 'item'
    | 'ability'
    | 'spell'
    | 'grimoire'
    | 'domain'
    | 'ancestry'
    | 'community'
    | 'class'
    | 'subclass'
    | 'transformation';

export interface UseLibraryItemsOptions {
    /** Specific types to fetch. If empty and fetchAll is false, returns empty array. */
    types?: LibraryItemType[];
    /** If true, fetches all library items regardless of type. */
    fetchAll?: boolean;
    /** If true, includes playtest content. Default: false */
    includePlaytest?: boolean;
    /** If false, disables automatic fetching on mount. Default: true */
    enabled?: boolean;
    /** Cache time in milliseconds. If set, results are cached. Default: 0 (no cache) */
    cacheTimeMs?: number;
}

export interface UseLibraryItemsResult {
    /** Fetched library items */
    items: LibraryItem[];
    /** Loading state */
    loading: boolean;
    /** Error message if fetch failed */
    error: string | null;
    /** Function to manually refetch items */
    refetch: () => Promise<void>;
}

// Simple in-memory cache
const cache = new Map<string, { data: LibraryItem[]; timestamp: number }>();

function getCacheKey(options: UseLibraryItemsOptions): string {
    const types = options.fetchAll ? 'all' : (options.types?.sort().join(',') || 'none');
    const playtest = options.includePlaytest ? 'playtest' : 'srd';
    return `${types}-${playtest}`;
}

function getFromCache(key: string, cacheTimeMs: number): LibraryItem[] | null {
    const cached = cache.get(key);
    if (cached && cacheTimeMs > 0 && Date.now() - cached.timestamp < cacheTimeMs) {
        return cached.data;
    }
    return null;
}

function setCache(key: string, data: LibraryItem[]): void {
    cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Hook for fetching library items with consistent loading, error, and caching behavior.
 */
export function useLibraryItems(options: UseLibraryItemsOptions = {}): UseLibraryItemsResult {
    const {
        types = [],
        fetchAll = false,
        includePlaytest = false,
        enabled = true,
        cacheTimeMs = 0,
    } = options;

    const [items, setItems] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Use ref to track if component is mounted to prevent state updates after unmount
    const isMounted = useRef(true);

    const fetchItems = useCallback(async () => {
        // Skip if disabled or no types specified and not fetching all
        if (!enabled || (!fetchAll && types.length === 0)) {
            setLoading(false);
            return;
        }

        const cacheKey = getCacheKey({ types, fetchAll, includePlaytest });

        // Check cache first
        if (cacheTimeMs > 0) {
            const cachedData = getFromCache(cacheKey, cacheTimeMs);
            if (cachedData) {
                setItems(cachedData);
                setLoading(false);
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            let fetchedItems: LibraryItem[];

            if (fetchAll) {
                // Fetch all items
                fetchedItems = await dataService.library.getAll({ includePlaytest });
            } else {
                // Fetch specific types in parallel
                const contentOptions = { includePlaytest };
                const queries = types.map(type => dataService.library.getByType(type, contentOptions));
                const results = await Promise.all(queries);

                // Flatten all results
                fetchedItems = results.flat();
            }

            // Only update state if component is still mounted
            if (isMounted.current) {
                setItems(fetchedItems);
                setError(null);

                // Cache the results
                if (cacheTimeMs > 0) {
                    setCache(cacheKey, fetchedItems);
                }
            }
        } catch (err) {
            if (isMounted.current) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                setError(`Failed to load library data: ${errorMessage}`);
                console.error('useLibraryItems fetch error:', err);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [types.join(','), fetchAll, includePlaytest, enabled, cacheTimeMs]);

    // Fetch on mount and when dependencies change
    useEffect(() => {
        isMounted.current = true;
        fetchItems();

        return () => {
            isMounted.current = false;
        };
    }, [fetchItems]);

    return { items, loading, error, refetch: fetchItems };
}

/**
 * Clears the library items cache.
 * Useful when library data is updated and you need to refetch.
 */
export function clearLibraryCache(): void {
    cache.clear();
}

/**
 * Pre-defined configurations for common use cases.
 */
export const LibraryPresets = {
    /** Inventory items: weapons, armor, consumables, misc items */
    INVENTORY: ['weapon', 'armor', 'consumable', 'item'] as LibraryItemType[],

    /** Playmat cards: abilities, spells, grimoires, domains */
    CARDS: ['ability', 'spell', 'grimoire', 'domain'] as LibraryItemType[],

    /** Character creation: ancestries, communities, classes, subclasses, domains */
    CHARACTER_CREATION: ['ancestry', 'community', 'class', 'subclass', 'domain'] as LibraryItemType[],

    /** Heritage data: ancestries and communities */
    HERITAGE: ['ancestry', 'community'] as LibraryItemType[],
};

export default useLibraryItems;
