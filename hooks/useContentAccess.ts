/**
 * USE CONTENT ACCESS HOOK
 * ----------------------------------------------------------------------------
 * A hook that provides the current user's content access settings and
 * helpers to determine what content should be included in queries.
 * 
 * Supports:
 * - SRD content (always enabled)
 * - Playtest content (optional playtest packs)
 * - Homebrew campaign content (fetched dynamically from Supabase)
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { dataService } from '@/lib/data-service';
import useUser from '@/hooks/useUser';
import type { ContentAccess } from '@/types/character';

const DEFAULT_CONTENT_ACCESS: ContentAccess = {
  srd: true,
  playtest: false,
  homebrew: {},
};

/**
 * Campaign definition as stored in Supabase library table
 */
export interface CampaignDefinition {
  id: string;
  name: string;
  description: string;
  features: string[];
  feature_descriptions?: Record<string, string>;
}

export type CampaignId = string;

export interface UseContentAccessResult {
  contentAccess: ContentAccess;
  includePlaytest: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;

  // Homebrew helpers
  hasHomebrewAccess: (campaignId: string) => boolean;
  enabledCampaigns: string[];

  // Playtest helpers
  hasPlaytestPackAccess: (packId: string) => boolean;
  enabledSources: string[];

  // Unified access check for any content source
  hasAccess: (source: string) => boolean;
}

export default function useContentAccess(): UseContentAccessResult {
  const { user } = useUser();
  const [contentAccess, setContentAccess] = useState<ContentAccess>(DEFAULT_CONTENT_ACCESS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContentAccess = useCallback(async () => {
    if (!user?.id) {
      setContentAccess(DEFAULT_CONTENT_ACCESS);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const profile = await dataService.profile.get(user.id);

      if (profile?.content_access) {
        // Ensure nested objects exist
        const access = {
          ...profile.content_access,
          playtest_packs: profile.content_access.playtest_packs ?? {},
          homebrew: profile.content_access.homebrew ?? {},
        };
        setContentAccess(access);
      } else {
        setContentAccess(DEFAULT_CONTENT_ACCESS);
      }
    } catch (err) {
      console.error('Failed to load content access settings:', err);
      setError('Failed to load content access settings');
      setContentAccess(DEFAULT_CONTENT_ACCESS);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadContentAccess();
  }, [loadContentAccess]);

  const includePlaytest = useMemo(() => contentAccess.playtest, [contentAccess]);

  /**
   * Check if user has access to a specific homebrew campaign
   */
  const hasHomebrewAccess = useCallback((campaignId: string): boolean => {
    return contentAccess.homebrew?.[campaignId] ?? false;
  }, [contentAccess]);

  /**
   * Check if user has access to a specific playtest pack
   */
  const hasPlaytestPackAccess = useCallback((packId: string): boolean => {
    return contentAccess.playtest_packs?.[packId] ?? false;
  }, [contentAccess]);

  /**
   * Get list of all enabled content sources (SRD + Packs + Campaigns)
   */
  const enabledSources = useMemo(() => {
    const sources = ['srd'];

    // Legacy playtest boolean support
    if (contentAccess.playtest) {
      sources.push('playtest');
    }

    // Dynamic Playtest Packs
    const playtestPacks = contentAccess.playtest_packs ?? {};
    Object.entries(playtestPacks).forEach(([packId, enabled]) => {
      if (enabled) sources.push(packId);
    });

    // Homebrew Campaigns
    const homebrew = contentAccess.homebrew ?? {};
    Object.entries(homebrew).forEach(([campaignId, enabled]) => {
      if (enabled) sources.push(campaignId);
      // Note: Currently campaign logic might use separate IDs for filtering, 
      // but 'source' column in library usually matches campaign ID for homebrew items?
      // Actually, homebrew campaigns in 'library' table usually have source='homebrew' 
      // OR a specific source if seeded. The current seed script sets source='homebrew'.
      // So for homebrew campaigns, "source" checking in library table might basically be 
      // checking `campaign_id` or similar if we were fully rigorous, but for Library items 
      // (like downtime moves), they might be tagged.
      // Let's assume for now this list is used for `source IN (...)` queries on the library table.
    });

    return sources;
  }, [contentAccess]);

  /**
   * Unified access check for any content source.
   */
  const hasAccess = useCallback((source: string): boolean => {
    if (!source) return false;
    if (source === 'srd') return true;

    // Check purely based on string matching enabled sources
    return enabledSources.includes(source);
  }, [enabledSources]);

  return {
    contentAccess,
    includePlaytest, // Deprecated but kept for compatibility
    loading,
    error,
    refresh: loadContentAccess,
    hasHomebrewAccess,
    hasPlaytestPackAccess,
    enabledCampaigns: Object.keys(contentAccess.homebrew ?? {}).filter(k => contentAccess.homebrew![k]),
    enabledSources,
    hasAccess,
  };
}

