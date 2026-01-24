/**
 * Real-Time Subscription Manager
 * ----------------------------------------------------------------------------
 * This module manages Supabase Realtime subscriptions for campaign activity.
 * It handles subscribing to activity feeds, campaign updates, and showing
 * toast notifications for real-time events.
 * 
 * Phase 4: Real-Time Subscriptions Implementation
 * GitHub Issue: #67
 */

import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import createClient from '@/lib/supabase/client';
import { toast } from 'sonner';
import { CampaignActivity } from '@/types/activity';
import { Campaign } from '@/types/campaign';
import { Character } from '@/types/character';
type StoreGetter = () => {
    user?: { id: string } | null;
    addActivityToFeed?: (activity: CampaignActivity) => void;
    updateActiveCampaign?: (updates: Record<string, unknown>) => void;
    updatePartyCharacterFromRealtime?: (characterId: string, updates: Record<string, unknown>) => void;
};

// Callback type for broadcast notifications (dice rolls, card usage, etc.)
type BroadcastNotificationCallback = (activity: CampaignActivity) => void;

export class CampaignRealtimeManager {
    private activityChannel: RealtimeChannel | null = null;
    private campaignChannel: RealtimeChannel | null = null;
    private characterChannels: Map<string, RealtimeChannel> = new Map();
    private getStore: StoreGetter | null = null;
    private currentCampaignId: string | null = null;
    private broadcastNotificationCallbacks: Set<BroadcastNotificationCallback> = new Set();

    /**
     * Set the store getter function to access state without circular imports
     */
    setStoreGetter(getter: StoreGetter) {
        this.getStore = getter;
    }

    /**
     * Register a callback to be notified when broadcastable activities arrive
     */
    onBroadcastActivity(callback: BroadcastNotificationCallback) {
        this.broadcastNotificationCallbacks.add(callback);
        return () => {
            this.broadcastNotificationCallbacks.delete(callback);
        };
    }

    /**
     * Emit a broadcast notification to all registered callbacks
     */
    private emitBroadcastNotification(activity: CampaignActivity) {
        this.broadcastNotificationCallbacks.forEach(callback => {
            try {
                callback(activity);
            } catch (error) {
                // Callback error is non-critical, continue with other callbacks
            }
        });
    }

    /**
     * Subscribe to all real-time channels for a campaign
     */
    async subscribeToCampaign(campaignId: string, partyCharacterIds?: string[]) {
        // Unsubscribe from any existing subscriptions first
        this.unsubscribe();
        this.currentCampaignId = campaignId;

        // Subscribe to activity feed
        this.subscribeToActivity(campaignId);

        // Subscribe to campaign updates (Fear changes, settings)
        this.subscribeToCampaignUpdates(campaignId);

        // Subscribe to character vitals updates for party members
        if (partyCharacterIds && partyCharacterIds.length > 0) {
            this.subscribeToPartyVitals(partyCharacterIds);
        }
    }

    /**
     * Subscribe to campaign activity feed
     */
    private subscribeToActivity(campaignId: string) {
        const supabase = createClient();

        this.activityChannel = supabase
            .channel(`campaign-activity:${campaignId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'campaign_activity',
                    filter: `campaign_id=eq.${campaignId}`,
                },
                (payload: RealtimePostgresChangesPayload<CampaignActivity>) => {
                    const activity = payload.new as CampaignActivity;
                    const state = this.getStore?.();
                    const currentUserId = state?.user?.id;
                    const isOwnActivity = activity.user_id === currentUserId;

                    // Don't show private activity from others
                    if (activity.is_private && !isOwnActivity) return;

                    // For dice rolls or card usage (resource spending), always emit the notification
                    if (activity.activity_type === 'dice_roll' || activity.activity_type === 'card_used') {
                        this.emitBroadcastNotification(activity);
                        // Only add to feed if it's not our own (own added optimistically)
                        if (!isOwnActivity) {
                            state?.addActivityToFeed?.(activity);
                        }
                        return;
                    }

                    // For non-dice activities, skip own (already optimistically added)
                    if (isOwnActivity) return;

                    // Add to feed and show toast for other activity types
                    state?.addActivityToFeed?.(activity);
                    this.showActivityNotification(activity);
                }
            )
            .subscribe((status, err) => {
                if (err) {
                    console.error('[Realtime] Subscription error:', err);
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error('[Realtime] ❌ Channel error - subscription failed');
                } else if (status === 'TIMED_OUT') {
                    console.error('[Realtime] ⏰ Subscription timed out');
                }
            });
    }

    /**
     * Subscribe to campaign updates (Fear changes, etc.)
     */
    private subscribeToCampaignUpdates(campaignId: string) {
        const supabase = createClient();
        this.campaignChannel = supabase
            .channel(`campaign-updates:${campaignId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'campaigns',
                    filter: `id=eq.${campaignId}`,
                },
                (payload: RealtimePostgresChangesPayload<Campaign>) => {
                    const updates = payload.new as Partial<Campaign>;
                    const state = this.getStore?.();
                    state?.updateActiveCampaign?.(updates);
                }
            )
            .subscribe();
    }

    /**
     * Subscribe to character vitals updates for party members (GM screen)
     */
    private subscribeToPartyVitals(characterIds: string[]) {
        const supabase = createClient();
        characterIds.forEach((characterId) => {
            const channel = supabase
                .channel(`character-vitals:${characterId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'characters',
                        filter: `id=eq.${characterId}`,
                    },
                    (payload: RealtimePostgresChangesPayload<Character>) => {
                        const updates = payload.new as Partial<Character>;
                        const state = this.getStore?.();
                        state?.updatePartyCharacterFromRealtime?.(characterId, updates);
                    }
                )
                .subscribe();

            this.characterChannels.set(characterId, channel);
        });
    }

    /**
     * Unsubscribe from all channels
     */
    unsubscribe() {
        if (this.activityChannel) {
            this.activityChannel.unsubscribe();
            this.activityChannel = null;
        }
        if (this.campaignChannel) {
            this.campaignChannel.unsubscribe();
            this.campaignChannel = null;
        }
        this.characterChannels.forEach((channel) => channel.unsubscribe());
        this.characterChannels.clear();
        this.currentCampaignId = null;
    }

    /**
     * Get the currently subscribed campaign ID
     */
    getCurrentCampaignId(): string | null {
        return this.currentCampaignId;
    }

    /**
     * Show a toast notification for an activity
     */
    private showActivityNotification(activity: CampaignActivity) {
        const characterName = activity.character_name || 'Someone';
        let message = '';
        let description = '';

        switch (activity.activity_type) {
            case 'dice_roll': {
                const data = activity.data as { total?: number; description?: string; hope_fear?: string };
                message = `${characterName} rolled ${data.total || '?'}`;
                description = data.description || '';
                if (data.hope_fear) {
                    description += ` (${data.hope_fear})`;
                }
                break;
            }

            case 'vital_change': {
                const data = activity.data as { vital?: string; change?: number };
                const change = data.change || 0;
                const direction = change > 0 ? 'gained' : 'lost';
                message = `${characterName} ${direction} ${Math.abs(change)} ${data.vital || 'vitals'}`;
                break;
            }

            case 'gm_vital_adjust': {
                const data = activity.data as { target_character_name?: string; vital?: string; change?: number };
                const change = data.change || 0;
                const direction = change > 0 ? '+' : '';
                message = `GM adjusted ${data.target_character_name || 'character'}'s ${data.vital || 'vital'}`;
                description = `${direction}${change}`;
                break;
            }

            case 'fear_change': {
                const data = activity.data as { change?: number; new_value?: number };
                const change = data.change || 0;
                message = change > 0 ? '⚡ Fear increased!' : '🌟 Fear decreased!';
                description = `Now at ${data.new_value || 0}`;
                break;
            }

            case 'gm_announcement': {
                const data = activity.data as { title?: string };
                message = `📢 ${data.title || 'GM Announcement'}`;
                break;
            }

            case 'item_used': {
                const data = activity.data as { item_name?: string; effect?: string };
                message = `${characterName} used ${data.item_name || 'an item'}`;
                description = data.effect || '';
                break;
            }

            default:
                // Don't show toast for unknown activity types
                return;
        }

        if (message) {
            toast.info(message, {
                description: description || undefined,
                duration: 4000,
            });
        }
    }
}

// Singleton instance
export const realtimeManager = new CampaignRealtimeManager();
