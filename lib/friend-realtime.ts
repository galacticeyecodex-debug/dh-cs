/**
 * Friend Realtime Manager
 * Phase 7: Friendships (GH#67)
 * 
 * Manages real-time subscriptions for friend requests and friend activity.
 * Uses Supabase Realtime to provide instant notifications.
 */

import createClient from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Friendship } from '@/types/friendship';

type FriendshipChangeHandler = (
    payload: RealtimePostgresChangesPayload<Friendship>
) => void;

export class FriendRealtimeManager {
    private channel: RealtimeChannel | null = null;
    private userId: string | null = null;

    /**
     * Subscribe to friendship changes for a user.
     * Notifies on new requests, accepted friends, etc.
     */
    subscribe(
        userId: string,
        onInsert?: FriendshipChangeHandler,
        onUpdate?: FriendshipChangeHandler,
        onDelete?: FriendshipChangeHandler
    ) {
        if (this.channel) {
            this.unsubscribe();
        }

        this.userId = userId;
        const supabase = createClient();

        // Create a channel for friendship changes
        this.channel = supabase.channel(`friendships:${userId}`);

        // Listen for new friend requests (INSERT where I'm the recipient)
        if (onInsert && this.channel) {
            this.channel.on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'friendships',
                    filter: `recipient_id=eq.${userId}`,
                },
                onInsert
            );
        }

        // Listen for status updates (UPDATE - accepted, declined, blocked)
        if (onUpdate && this.channel) {
            this.channel.on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'friendships',
                    filter: `or(requester_id.eq.${userId},recipient_id.eq.${userId})`,
                },
                onUpdate
            );
        }

        // Listen for unfriend/deletion events
        if (onDelete && this.channel) {
            this.channel.on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'friendships',
                    filter: `or(requester_id.eq.${userId},recipient_id.eq.${userId})`,
                },
                onDelete
            );
        }

        // Subscribe to the channel
        if (this.channel) {
            this.channel.subscribe((status) => {
                if (status === 'CHANNEL_ERROR') {
                    console.error('[FriendRealtime] Error subscribing to friendship changes');
                }
            });
        }
    }

    /**
     * Unsubscribe from all friendship change events.
     */
    unsubscribe() {
        if (this.channel) {
            const supabase = createClient();
            supabase.removeChannel(this.channel);
            this.channel = null;
            this.userId = null;
        }
    }

    /**
     * Check if currently subscribed.
     */
    isSubscribed(): boolean {
        return this.channel !== null;
    }

    /**
     * Get the current user ID being subscribed to.
     */
    getCurrentUserId(): string | null {
        return this.userId;
    }
}

// Singleton instance for global use
export const friendRealtimeManager = new FriendRealtimeManager();

