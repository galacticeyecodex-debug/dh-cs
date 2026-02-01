/**
 * SRD SERVICE
 * ----------------------------------------------------------------------------
 * Fetches SRD rule content from the library table for contextual help buttons.
 *
 * FUNCTIONALITY:
 * - Retrieves SRD rules by their unique key (e.g., 'combat.attackRolls')
 * - Implements an in-memory cache to minimize database queries
 * - Used by SRDInfoButton/SRDInfoSheet components to display game rules
 *
 * SRD Reference: Various SRD markdown files
 * Rules are extracted and stored in library table with type='srd_rule'
 */

import createClient from '@/lib/supabase/client';

export interface SRDRule {
  key: string;
  title: string;
  content: string;
  source_file: string;
  source_section: string | null;
}

// In-memory cache for SRD rules
const cache = new Map<string, SRDRule>();

/**
 * Fetches an SRD rule by its key from the library table.
 * Results are cached in memory to avoid repeated database calls.
 *
 * @param key - The rule key (e.g., 'combat.attackRolls', 'vitals.armor')
 * @returns The SRD rule data or null if not found
 */
export async function getSRDRule(key: string): Promise<SRDRule | null> {
  // Check cache first
  if (cache.has(key)) {
    return cache.get(key)!;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('library')
    .select('data')
    .eq('type', 'srd_rule')
    .eq('data->>key', key)
    .single();

  if (error || !data) {
    console.error('Failed to fetch SRD rule:', key, error);
    return null;
  }

  const rule = data.data as SRDRule;
  cache.set(key, rule);
  return rule;
}

/**
 * Clears the SRD rule cache.
 * Useful for testing or when rules may have been updated.
 */
export function clearSRDCache(): void {
  cache.clear();
}
