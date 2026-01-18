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

export class CampaignRealtimeManager {
    private activityChannel: RealtimeChannel | null = null;
    private campaignChannel: RealtimeChannel | null = null;
    private characterChannels: Map<string, RealtimeChannel> = new Map();
    private getStore: StoreGetter | null = null;
    private currentCampaignId: string | null = null;

    /**
     * Set the store getter function to access state without circular imports
     */
    setStoreGetter(getter: StoreGetter) {
        this.getStore = getter;
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

                    // Don't show own activity (already optimistically added)
                    if (activity.user_id === currentUserId) return;

                    // Don't show private activity from others
                    if (activity.is_private && activity.user_id !== currentUserId) return;

                    // Add to feed
                    state?.addActivityToFeed?.(activity);

                    // Show toast notification for the activity
                    this.showActivityNotification(activity);
                }
            )
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] Subscribed to campaign activity:', campaignId);
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('[Realtime] Error subscribing to activity channel');
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
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] Subscribed to campaign updates:', campaignId);
                }
            });
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
                .subscribe((status: string) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('[Realtime] Subscribed to character vitals:', characterId);
                    }
                });

            this.characterChannels.set(characterId, channel);
        });
    }

    /**
     * Unsubscribe from all channels
     */
    unsubscribe() {
        const hadChannels = this.activityChannel || this.campaignChannel || this.characterChannels.size > 0;

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

        // Only log if we actually had channels to unsubscribe from
        if (hadChannels) {
            console.log('[Realtime] Unsubscribed from all channels');
        }
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
