/**
 * Presence Manager
 * ----------------------------------------------------------------------------
 * This module manages Supabase Presence subscriptions for tracking who's
 * online in each campaign. It uses Supabase Realtime Presence API for
 * real-time online/offline status and join/leave notifications.
 *
 * Phase 5: Presence System Implementation
 * GitHub Issue: #67
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import createClient from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface PresenceState {
    user_id: string;
    character_id?: string;
    username: string;
    character_name?: string;
    status: 'online' | 'away';
    online_at: string;
}

type StoreGetter = () => {
    user?: { id: string } | null;
    setOnlineMembers?: (members: PresenceState[]) => void;
};

export class PresenceManager {
    private channel: RealtimeChannel | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private getStore: StoreGetter | null = null;
    private currentCampaignId: string | null = null;
    private currentUserId: string | null = null;

    /**
     * Set the store getter function to access state without circular imports
     */
    setStoreGetter(getter: StoreGetter) {
        this.getStore = getter;
    }

    /**
     * Start tracking presence for a campaign
     */
    async track(
        campaignId: string,
        userId: string,
        username: string,
        characterId?: string,
        characterName?: string
    ) {
        // Untrack from any existing presence first
        this.untrack();

        this.currentCampaignId = campaignId;
        this.currentUserId = userId;

        const supabase = createClient();

        // Update database presence record
        await supabase.rpc('upsert_user_presence', {
            p_user_id: userId,
            p_campaign_id: campaignId,
            p_character_id: characterId || null,
            p_status: 'online',
        });

        // Create Supabase Realtime Presence channel
        this.channel = supabase.channel(`campaign-presence:${campaignId}`, {
            config: { presence: { key: userId } },
        });

        this.channel
            .on('presence', { event: 'sync' }, () => {
                const state = this.channel!.presenceState();
                const presences = Object.values(state).flat() as unknown as PresenceState[];
                this.getStore?.()?.setOnlineMembers?.(presences);
            })
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                (newPresences as unknown as PresenceState[]).forEach((p) => {
                    // Don't show toast for own join
                    if (p.user_id === this.currentUserId) return;
                    const displayName = p.character_name || p.username || 'Someone';
                    toast.info(`${displayName} joined`, {
                        duration: 3000,
                        icon: '👋',
                    });
                });
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                (leftPresences as unknown as PresenceState[]).forEach((p) => {
                    // Don't show toast for own leave
                    if (p.user_id === this.currentUserId) return;
                    const displayName = p.character_name || p.username || 'Someone';
                    toast.info(`${displayName} left`, {
                        duration: 3000,
                        icon: '👋',
                    });
                });
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Track our presence
                    await this.channel!.track({
                        user_id: userId,
                        character_id: characterId,
                        username: username,
                        character_name: characterName,
                        status: 'online',
                        online_at: new Date().toISOString(),
                    });

                    console.log('[Presence] Subscribed to campaign:', campaignId);

                    // Start heartbeat every 30 seconds to keep presence alive
                    this.startHeartbeat(userId, campaignId, characterId);
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('[Presence] Error subscribing to presence channel');
                }
            });
    }

    /**
     * Start the heartbeat interval to keep presence alive
     */
    private startHeartbeat(userId: string, campaignId: string, characterId?: string) {
        // Clear any existing heartbeat
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        const supabase = createClient();

        this.heartbeatInterval = setInterval(async () => {
            // Update database presence record
            await supabase.rpc('upsert_user_presence', {
                p_user_id: userId,
                p_campaign_id: campaignId,
                p_character_id: characterId || null,
                p_status: 'online',
            });
        }, 30000); // Every 30 seconds
    }

    /**
     * Set status to away (for when tab loses focus)
     */
    async setAway() {
        if (!this.channel || !this.currentUserId) return;

        await this.channel.track({
            user_id: this.currentUserId,
            status: 'away',
            online_at: new Date().toISOString(),
        });

        // Update database
        const supabase = createClient();
        await supabase
            .from('user_presence')
            .update({ status: 'away', last_seen: new Date().toISOString() })
            .eq('user_id', this.currentUserId);
    }

    /**
     * Set status back to online (for when tab regains focus)
     */
    async setOnline() {
        if (!this.channel || !this.currentUserId) return;

        await this.channel.track({
            user_id: this.currentUserId,
            status: 'online',
            online_at: new Date().toISOString(),
        });

        // Update database
        const supabase = createClient();
        await supabase
            .from('user_presence')
            .update({ status: 'online', last_seen: new Date().toISOString() })
            .eq('user_id', this.currentUserId);
    }

    /**
     * Stop tracking presence
     */
    async untrack() {
        // Clear heartbeat
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        // Untrack from channel
        if (this.channel) {
            this.channel.untrack();
            this.channel.unsubscribe();
            this.channel = null;
            console.log('[Presence] Untracked from campaign:', this.currentCampaignId);
        }

        // Update database to offline
        if (this.currentUserId) {
            const supabase = createClient();
            await supabase
                .from('user_presence')
                .update({ status: 'offline', last_seen: new Date().toISOString() })
                .eq('user_id', this.currentUserId);
        }

        this.currentCampaignId = null;
        this.currentUserId = null;
    }

    /**
     * Get the currently tracked campaign ID
     */
    getCurrentCampaignId(): string | null {
        return this.currentCampaignId;
    }

    /**
     * Check if currently tracking a campaign
     */
    isTracking(): boolean {
        return this.channel !== null;
    }
}

// Singleton instance
export const presenceManager = new PresenceManager();
