/**
 * Friendship Types
 * ----------------------------------------------------------------------------
 * Types for the Phase 7 Friendships feature (GH#67).
 * Enables 1-to-1 friend connections for direct sharing outside campaigns.
 */

/**
 * Friendship status enum
 */
export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

/**
 * Core Friendship type from database
 */
export interface Friendship {
    id: string;
    requester_id: string;
    recipient_id: string;
    status: FriendshipStatus;
    created_at: string;
    updated_at: string;
}

/**
 * Friendship with user profile data
 */
export interface EnrichedFriendship extends Friendship {
    requester?: {
        username: string | null;
        avatar_url: string | null;
        friend_code?: string | null;
    };
    recipient?: {
        username: string | null;
        avatar_url: string | null;
        friend_code?: string | null;
    };
}

/**
 * Insert type for creating friendship requests
 */
export interface FriendshipInsert {
    requester_id: string;
    recipient_id: string;
    status?: FriendshipStatus;
}

/**
 * Update type for modifying friendships
 */
export interface FriendshipUpdate {
    status?: FriendshipStatus;
}

/**
 * Friend view - simplified friend data for display
 */
export interface Friend {
    user_id: string;
    username: string | null;
    avatar_url: string | null;
    friend_code: string | null;
    friendship_id: string;
    is_requester: boolean;
    since: string;
}

/**
 * Pending friend request
 */
export interface FriendRequest {
    id: string;
    from: {
        user_id: string;
        username: string | null;
        avatar_url: string | null;
    };
    created_at: string;
}

/**
 * Outgoing friend request (pending)
 */
export interface OutgoingRequest {
    id: string;
    to: {
        user_id: string;
        username: string | null;
        avatar_url: string | null;
    };
    created_at: string;
}
