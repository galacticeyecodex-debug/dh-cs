/**
 * USE SRD RULE HOOK
 * ----------------------------------------------------------------------------
 * React hook for fetching and consuming SRD rules in components.
 *
 * FUNCTIONALITY:
 * - Fetches SRD rule content by key when component mounts or key changes
 * - Provides loading and error states for UI feedback
 * - Integrates with the srd-service caching layer
 *
 * USAGE:
 * const { rule, loading, error } = useSRDRule('combat.attackRolls');
 */

import { useState, useEffect } from 'react';
import { getSRDRule, SRDRule } from '@/lib/srd-service';

interface UseSRDRuleResult {
  rule: SRDRule | null;
  loading: boolean;
  error: string | null;
}

export function useSRDRule(key: string): UseSRDRuleResult {
  const [rule, setRule] = useState<SRDRule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!key) return;

    setLoading(true);
    setError(null);

    getSRDRule(key)
      .then(setRule)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [key]);

  return { rule, loading, error };
}
