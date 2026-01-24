'use client';

/**
 * useCampaignRealtime Hook
 * ----------------------------------------------------------------------------
 * A custom hook that manages realtime subscriptions for a character's campaign.
 * 
 * When a character is assigned to a campaign, this hook:
 * 1. Finds the campaign for the character
 * 2. Sets it as the active campaign in the store
 * 3. Subscribes to realtime updates
 * 4. Manages roll notification state
 * 
 * Phase 9: Roll Announcements & Pop-up Notifications (Issue #67)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { dataService } from '@/lib/data-service';
import { realtimeManager } from '@/lib/realtime';
import { CampaignActivity } from '@/types/activity';
import { CampaignWithMembers } from '@/types/campaign';

interface UseCampaignRealtimeReturn {
    /** The current broadcast notification to display, if any */
    currentBroadcastNotification: CampaignActivity | null;
    /** Dismiss the current broadcast notification */
    dismissBroadcastNotification: () => void;
    /** Whether realtime is currently subscribed */
    isSubscribed: boolean;
    /** The active campaign, if any */
    activeCampaign: CampaignWithMembers | null;
}

export function useCampaignRealtime(): UseCampaignRealtimeReturn {
    const [currentBroadcastNotification, setCurrentBroadcastNotification] = useState<CampaignActivity | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const initializingRef = useRef(false);
    const lastCharacterIdRef = useRef<string | null>(null);

    const {
        character,
        user,
        activeCampaign,
        realtimeSubscribed,
        subscribeToCampaignRealtime,
        unsubscribeFromCampaignRealtime,
        selectCampaign,
        clearActiveCampaign,
    } = useCharacterStore();

    // Dismiss the current notification
    const dismissBroadcastNotification = useCallback(() => {
        setCurrentBroadcastNotification(null);
    }, []);

    // Listen for broadcast notifications from the realtime manager
    useEffect(() => {
        const unsubscribe = realtimeManager.onBroadcastActivity((activity) => {
            setCurrentBroadcastNotification(activity);
        });

        return unsubscribe;
    }, []);

    // Initialize campaign subscription when character changes
    useEffect(() => {
        const initializeCampaign = async () => {
            // Skip if no character or already initializing
            if (!character?.id || !user?.id) {
                // Cleanup if character was removed
                if (isInitialized) {
                    unsubscribeFromCampaignRealtime();
                    clearActiveCampaign();
                    setIsInitialized(false);
                }
                return;
            }

            // Skip if same character
            if (lastCharacterIdRef.current === character.id && isInitialized) {
                return;
            }

            // Prevent duplicate initialization
            if (initializingRef.current) return;
            initializingRef.current = true;

            try {
                // Find the campaign this character is assigned to
                const campaign = await dataService.campaign.getCampaignForCharacter(character.id);

                if (campaign) {
                    // Set active campaign and subscribe to realtime
                    await selectCampaign(campaign.id);
                    await subscribeToCampaignRealtime(campaign.id);
                } else {
                    // No campaign for this character
                    if (realtimeSubscribed) {
                        unsubscribeFromCampaignRealtime();
                    }
                    clearActiveCampaign();
                }

                lastCharacterIdRef.current = character.id;
                setIsInitialized(true);
            } catch (error) {
                // Initialization failure is non-critical - character may not be in a campaign
            } finally {
                initializingRef.current = false;
            }
        };

        initializeCampaign();

        // Cleanup on unmount
        return () => {
            // Don't unsubscribe on unmount - let the store handle this
            // The subscription should persist across tab changes
        };
    }, [
        character?.id,
        user?.id,
        isInitialized,
        selectCampaign,
        subscribeToCampaignRealtime,
        unsubscribeFromCampaignRealtime,
        clearActiveCampaign,
        realtimeSubscribed,
    ]);

    return {
        currentBroadcastNotification,
        dismissBroadcastNotification,
        isSubscribed: realtimeSubscribed,
        activeCampaign,
    };
}

export default useCampaignRealtime;

