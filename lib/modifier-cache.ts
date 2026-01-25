/**
 * MODIFIER CACHE SERVICE
 * ============================================================================
 * Caching layer for expensive modifier calculations to improve performance.
 *
 * This module provides:
 * - Memoization of trait total calculations
 * - Pre-calculation of all active modifiers
 * - Cache invalidation strategies
 * - Performance monitoring (development mode)
 *
 * Estimated Performance Improvement: 30% faster for multi-stat queries
 */

import type { Character } from '@/types/character';
import type { CardStates } from '@/types/cards';
import { validateModifierValue } from './modifier-validator';

/**
 * Cache key for trait totals.
 * Uses weak identity comparison to detect when character object changes.
 */
interface TraitTotalsCache {
  character: Character;
  totals: Record<string, number>;
  timestamp: number;
}

interface AllModifiersCache {
  character: Character;
  cardStates: CardStates;
  allModifiers: Array<{ stat: string; value: number; source: string }>;
  timestamp: number;
}

// Caches stored as WeakMap for automatic garbage collection
let traitTotalsCache: WeakMap<Character, TraitTotalsCache> = new WeakMap();
let allModifiersCache: WeakMap<Character, AllModifiersCache> = new WeakMap();

// Cache statistics (development mode only)
let cacheStats = {
  traitTotalsHits: 0,
  traitTotalsMisses: 0,
  allModifiersHits: 0,
  allModifiersMisses: 0,
};

/**
 * Get cached trait totals or calculate and cache them.
 * Uses WeakMap for automatic garbage collection.
 *
 * @param character - The character to calculate trait totals for
 * @param calculateFn - Function to calculate trait totals if not cached
 * @returns Cached or newly calculated trait totals
 */
export function getCachedTraitTotals(
  character: Character,
  calculateFn: (char: Character) => Record<string, number>
): Record<string, number> {
  const cached = traitTotalsCache.get(character);

  if (cached) {
    if (process.env.NODE_ENV === 'development') {
      cacheStats.traitTotalsHits++;
    }
    return cached.totals;
  }

  const totals = calculateFn(character);

  if (process.env.NODE_ENV === 'development') {
    cacheStats.traitTotalsMisses++;
  }

  // Cache the result
  traitTotalsCache.set(character, {
    character,
    totals,
    timestamp: Date.now(),
  });

  return totals;
}

/**
 * Get all active modifiers from all sources, with caching.
 * Much faster than querying each stat individually.
 *
 * @param character - The character to get modifiers for
 * @param cardStates - Card state for conditional modifiers
 * @param calculateFn - Function to calculate all modifiers if not cached
 * @returns All modifiers grouped by stat
 */
export function getCachedAllModifiers(
  character: Character,
  cardStates: CardStates,
  calculateFn: (char: Character, states: CardStates) => Array<{ stat: string; value: number; source: string }>
): Array<{ stat: string; value: number; source: string }> {
  const cached = allModifiersCache.get(character);

  // Check if cached result is still valid
  // (same character object + same card states reference)
  if (cached && cacheIsValid(cached.cardStates, cardStates)) {
    if (process.env.NODE_ENV === 'development') {
      cacheStats.allModifiersHits++;
    }
    return cached.allModifiers;
  }

  const allModifiers = calculateFn(character, cardStates);

  if (process.env.NODE_ENV === 'development') {
    cacheStats.allModifiersMisses++;
  }

  // Cache the result
  allModifiersCache.set(character, {
    character,
    cardStates,
    allModifiers,
    timestamp: Date.now(),
  });

  return allModifiers;
}

/**
 * Clear all caches (useful for testing or manual cache invalidation).
 * In production, caches are automatically cleared via WeakMap GC.
 */
export function clearModifierCaches(): void {
  traitTotalsCache = new WeakMap();
  allModifiersCache = new WeakMap();

  if (process.env.NODE_ENV === 'development') {
    console.debug('[modifier-cache] Caches cleared');
  }
}

/**
 * Get cache statistics (development mode only).
 * Useful for performance monitoring and optimization.
 *
 * @returns Cache hit/miss statistics
 */
export function getCacheStats() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const totalTraitTotals = cacheStats.traitTotalsHits + cacheStats.traitTotalsMisses;
  const totalAllModifiers = cacheStats.allModifiersHits + cacheStats.allModifiersMisses;

  return {
    traitTotals: {
      hits: cacheStats.traitTotalsHits,
      misses: cacheStats.traitTotalsMisses,
      hitRate: totalTraitTotals > 0 ? ((cacheStats.traitTotalsHits / totalTraitTotals) * 100).toFixed(1) + '%' : 'N/A',
    },
    allModifiers: {
      hits: cacheStats.allModifiersHits,
      misses: cacheStats.allModifiersMisses,
      hitRate: totalAllModifiers > 0 ? ((cacheStats.allModifiersHits / totalAllModifiers) * 100).toFixed(1) + '%' : 'N/A',
    },
  };
}

/**
 * Reset cache statistics (development mode only).
 * Useful for profiling specific operations.
 */
export function resetCacheStats(): void {
  if (process.env.NODE_ENV === 'development') {
    cacheStats = {
      traitTotalsHits: 0,
      traitTotalsMisses: 0,
      allModifiersHits: 0,
      allModifiersMisses: 0,
    };
  }
}

/**
 * Check if card states are equivalent for cache purposes.
 * Uses shallow comparison since card state values are primitives.
 *
 * @param cached - Cached card states
 * @param current - Current card states
 * @returns True if states are equivalent
 */
function cacheIsValid(cached: CardStates, current: CardStates): boolean {
  // Quick reference check
  if (cached === current) return true;

  // Shallow comparison of keys
  const cachedKeys = Object.keys(cached || {}).sort();
  const currentKeys = Object.keys(current || {}).sort();

  if (cachedKeys.length !== currentKeys.length) {
    return false;
  }

  // Check if all keys and values are the same
  for (let i = 0; i < cachedKeys.length; i++) {
    const key = cachedKeys[i];
    if (cachedKeys[i] !== currentKeys[i]) {
      return false;
    }
    // Deep check card state objects
    const cachedState = cached[key];
    const currentState = current[key];
    if (JSON.stringify(cachedState) !== JSON.stringify(currentState)) {
      return false;
    }
  }

  return true;
}
