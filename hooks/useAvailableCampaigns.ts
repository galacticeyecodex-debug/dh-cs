/**
 * USE AVAILABLE CAMPAIGNS HOOK
 * ----------------------------------------------------------------------------
 * Fetches available campaigns from the Supabase library table.
 * Campaigns are stored with type 'campaign' and source 'homebrew'.
 * 
 * This hook is data-driven - new campaigns can be added by uploading
 * campaign definitions to Supabase without any code changes.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import createClient from '@/lib/supabase/client';
import type { CampaignDefinition } from './useContentAccess';

export interface UseAvailableCampaignsResult {
    campaigns: CampaignDefinition[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

/**
 * Fetch all available campaign definitions from Supabase.
 * These are stored in the library table with type 'campaign'.
 */
export default function useAvailableCampaigns(): UseAvailableCampaignsResult {
    const [campaigns, setCampaigns] = useState<CampaignDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCampaigns = useCallback(async () => {
        try {
            setError(null);
            const supabase = createClient();

            const { data, error: fetchError } = await supabase
                .from('library')
                .select('id, name, data')
                .eq('type', 'campaign')
                .eq('source', 'homebrew');

            if (fetchError) throw fetchError;

            // Transform library rows into CampaignDefinition objects
            const campaignDefs: CampaignDefinition[] = (data || []).map(row => {
                // The id is stored as 'campaign-{campaignId}', extract the actual campaign ID
                const campaignId = row.id.replace('campaign-', '');
                const campaignData = row.data as {
                    description?: string;
                    features?: string[];
                    feature_descriptions?: Record<string, string>;
                };

                return {
                    id: campaignId,
                    name: row.name,
                    description: campaignData.description || '',
                    features: campaignData.features || [],
                    feature_descriptions: campaignData.feature_descriptions,
                };
            });

            setCampaigns(campaignDefs);
        } catch (err) {
            console.error('Failed to load available campaigns:', err);
            setError('Failed to load available campaigns');
            setCampaigns([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCampaigns();
    }, [loadCampaigns]);

    return {
        campaigns,
        loading,
        error,
        refresh: loadCampaigns,
    };
}
