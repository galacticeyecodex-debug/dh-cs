/**
 * USE CONTENT ACCESS HOOK
 * ----------------------------------------------------------------------------
 * A hook that provides the current user's content access settings and a
 * helper to determine if playtest content should be included in queries.
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { dataService } from '@/lib/data-service';
import useUser from '@/hooks/useUser';
import type { ContentAccess } from '@/types/character';

const DEFAULT_CONTENT_ACCESS: ContentAccess = {
  srd: true,
  playtest: false,
};

export interface UseContentAccessResult {
  contentAccess: ContentAccess;
  includePlaytest: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
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
        setContentAccess(profile.content_access);
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

  return {
    contentAccess,
    includePlaytest,
    loading,
    error,
    refresh: loadContentAccess,
  };
}
