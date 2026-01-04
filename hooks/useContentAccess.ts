/**
 * USE CONTENT ACCESS HOOK
 * ----------------------------------------------------------------------------
 * A hook that provides the current user's content access settings and
 * helpers to determine what content should be included in queries.
 * 
 * Supports:
 * - SRD content (always enabled)
 * - Playtest content (The Void)
 * - Homebrew campaign content (Strixhaven, custom campaigns, etc.)
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
 * Available homebrew campaigns that can be enabled.
 * Add new campaigns here as they become available.
 */
export const AVAILABLE_CAMPAIGNS = [
  {
    id: 'strixhaven',
    name: 'Strixhaven',
    description: 'MTG Strixhaven: Curriculum of Chaos campaign mechanics',
    features: ['Study Tokens', 'Signature Spells', 'Campus Relationships', 'Extracurriculars'],
  },
] as const;

export type CampaignId = typeof AVAILABLE_CAMPAIGNS[number]['id'];

export interface UseContentAccessResult {
  contentAccess: ContentAccess;
  includePlaytest: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;

  // Homebrew helpers
  hasHomebrewAccess: (campaignId: string) => boolean;
  enabledCampaigns: string[];

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
        // Ensure homebrew object exists for backwards compatibility
        const access = {
          ...profile.content_access,
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
   * Get list of all enabled campaign IDs
   */
  const enabledCampaigns = useMemo(() => {
    const homebrew = contentAccess.homebrew ?? {};
    return Object.entries(homebrew)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name);
  }, [contentAccess]);

  /**
   * Unified access check for any content source.
   * Supports:
   * - 'srd' - Always true
   * - 'playtest' - Based on user setting
   * - 'homebrew:campaignId' - Checks specific campaign
   * - 'homebrew' - True if any homebrew campaign is enabled
   */
  const hasAccess = useCallback((source: string): boolean => {
    if (!source) return false;

    // Handle 'srd' - always accessible
    if (source === 'srd') return true;

    // Handle 'playtest'
    if (source === 'playtest') return contentAccess.playtest;

    // Handle 'homebrew:campaignId' format
    if (source.startsWith('homebrew:')) {
      const campaignId = source.split(':')[1];
      return hasHomebrewAccess(campaignId);
    }

    // Handle bare 'homebrew' - true if any campaign is enabled
    if (source === 'homebrew') return enabledCampaigns.length > 0;

    return false;
  }, [contentAccess, hasHomebrewAccess, enabledCampaigns]);

  return {
    contentAccess,
    includePlaytest,
    loading,
    error,
    refresh: loadContentAccess,
    hasHomebrewAccess,
    enabledCampaigns,
    hasAccess,
  };
}

