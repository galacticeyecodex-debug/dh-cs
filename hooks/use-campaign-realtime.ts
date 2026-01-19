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
    /** The current roll notification to display, if any */
    currentRollNotification: CampaignActivity | null;
    /** Dismiss the current roll notification */
    dismissRollNotification: () => void;
    /** Whether realtime is currently subscribed */
    isSubscribed: boolean;
    /** The active campaign, if any */
    activeCampaign: CampaignWithMembers | null;
}

export function useCampaignRealtime(): UseCampaignRealtimeReturn {
    const [currentRollNotification, setCurrentRollNotification] = useState<CampaignActivity | null>(null);
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
    const dismissRollNotification = useCallback(() => {
        setCurrentRollNotification(null);
    }, []);

    // Listen for roll notifications from the realtime manager
    useEffect(() => {
        const unsubscribe = realtimeManager.onRollNotification((activity) => {
            setCurrentRollNotification(activity);
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
                    console.log('[useCampaignRealtime] Subscribed to campaign:', campaign.name);
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
                console.error('[useCampaignRealtime] Failed to initialize campaign:', error);
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
        currentRollNotification,
        dismissRollNotification,
        isSubscribed: realtimeSubscribed,
        activeCampaign,
    };
}

export default useCampaignRealtime;

