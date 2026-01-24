'use client';

/**
 * MODIFIER AGGREGATOR INITIALIZATION HOOK
 * ============================================================================
 * This hook safely initializes the modifier aggregator with enhanced abilities.
 *
 * Should be called once in the app root to ensure the cache is populated
 * before any components try to access modifier data.
 *
 * SAFETY:
 * - If initialization fails, the aggregator still works (just with less data)
 * - Gracefully handles missing playtest content
 * - Provides development warnings for debugging
 */

import { useEffect, useRef } from 'react';
import { initModifierAggregator } from '@/lib/modifier-aggregator';
import { getAllAbilities } from '@/lib/content-loaders';

/**
 * Initialize the modifier aggregator once when the app loads.
 * This ensures the cache is populated before any components need it.
 *
 * @param includePlaytest - Whether to include playtest abilities (default: false)
 */
export function useModifierAggregatorInit(includePlaytest: boolean = false): void {
  const initDoneRef = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    try {
      const abilities = getAllAbilities(includePlaytest);
      initModifierAggregator(abilities);

      if (process.env.NODE_ENV === 'development') {
        console.debug(
          `[modifier-aggregator] Initialized with ${abilities.length} abilities (includePlaytest: ${includePlaytest})`
        );
      }
    } catch (error) {
      // Gracefully handle initialization errors
      // The aggregator will still work, just without enhanced ability data
      console.error('[modifier-aggregator] Failed to initialize:', error);
      initModifierAggregator([]);
    }
  }, [includePlaytest]);
}
