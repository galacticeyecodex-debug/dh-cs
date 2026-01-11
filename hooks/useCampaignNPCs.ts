/**
 * USE CAMPAIGN NPCS HOOK
 * ----------------------------------------------------------------------------
 * A hook that automatically seeds campaign-specific NPCs for the current
 * character when a campaign is enabled. This should be called from views
 * that display relationships (e.g., JournalView).
 * 
 * The hook:
 * 1. Checks user's content access settings
 * 2. For each enabled campaign, ensures NPCs are seeded for the current character
 * 3. Only seeds NPCs once (skips if they already exist)
 */

'use client';

import { useEffect, useRef } from 'react';
import { useCharacterStore } from '@/store/character-store';
import useContentAccess from '@/hooks/useContentAccess';

/**
 * Hook to automatically seed campaign NPCs for the current character.
 * Should be called once in a component that loads relationships.
 */
export default function useCampaignNPCs() {
    const { character, relationships, seedCampaignNPCs } = useCharacterStore();
    const { enabledCampaigns, loading: accessLoading } = useContentAccess();

    // Track if we've already attempted seeding to avoid duplicate calls
    const seedingAttemptedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        // Don't run if still loading access or no character
        if (accessLoading || !character?.id) {
            return;
        }

        // Reset the seeding tracker when character changes
        if (seedingAttemptedRef.current.size > 0) {
            seedingAttemptedRef.current = new Set();
        }

        // Check each enabled campaign
        for (const campaignId of enabledCampaigns) {
            // Skip if we've already attempted seeding this campaign for this character
            const seedKey = `${character.id}-${campaignId}`;
            if (seedingAttemptedRef.current.has(seedKey)) {
                continue;
            }

            // Check if this campaign already has NPCs seeded
            const hasExistingCampaignNPCs = relationships.some(
                r => r.campaign === campaignId
            );

            // Only seed if no NPCs exist for this campaign
            if (!hasExistingCampaignNPCs) {
                seedingAttemptedRef.current.add(seedKey);
                seedCampaignNPCs(campaignId).then(result => {
                    if (result.success && result.seeded > 0) {
                        console.log(`Seeded ${result.seeded} NPCs for ${campaignId} campaign`);
                    }
                });
            }
        }
    }, [character?.id, enabledCampaigns, accessLoading, relationships, seedCampaignNPCs]);

    return { enabledCampaigns };
}
