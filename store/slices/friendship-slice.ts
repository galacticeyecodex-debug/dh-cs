/**
 * Friendship Slice
 * ----------------------------------------------------------------------------
 * This slice manages friendship state for Phase 7 social features.
 * It handles friend requests, friend list, and friend-based sharing/activity.
 * 
 * Key features:
 * - Send/cancel friend requests via friend codes
 * - Accept/decline incoming requests
 * - View and manage friend list
 * - Block/unblock users
 * - Real-time notifications for new friend requests
 * - Share homebrew with friends (integrates with sharing-slice)
 */

import type { StateCreator } from 'zustand';
import { dataService } from '@/lib/data-service';
import { friendRealtimeManager } from '@/lib/friend-realtime';
import type { Friendship, Friend, FriendRequest, OutgoingRequest } from '@/types/friendship';
import type { CharacterStore } from '@/types/store';
import { toast } from 'sonner';
import { withOptimisticUpdate } from '@/lib/state-helpers';

export interface FriendshipSlice {
    // State
    friends: Friend[];
    pendingRequests: FriendRequest[];
    outgoingRequests: OutgoingRequest[];
    isLoadingFriends: boolean;
    friendshipError: string | null;
    myFriendCode: string | null;
    friendRealtimeSubscribed: boolean;

    // Actions
    fetchFriends: () => Promise<void>;
    fetchPendingRequests: () => Promise<void>;
    fetchOutgoingRequests: () => Promise<void>;
    fetchAllFriendshipData: () => Promise<void>;

    sendFriendRequest: (friendCode: string) => Promise<boolean>;
    cancelFriendRequest: (requestId: string) => Promise<void>;
    acceptFriendRequest: (requestId: string) => Promise<void>;
    declineFriendRequest: (requestId: string) => Promise<void>;

    unfriend: (friendshipId: string) => Promise<void>;
    blockUser: (friendshipId: string) => Promise<void>;

    setMyFriendCode: (code: string) => void;
    clearFriendshipError: () => void;

    // Real-time
    subscribeToFriendshipRealtime: () => void;
    unsubscribeFromFriendshipRealtime: () => void;
    addPendingRequestFromRealtime: (request: FriendRequest) => void;
    removePendingRequestFromRealtime: (requestId: string) => void;
    updateFriendshipFromRealtime: (friendship: Friendship) => void;
}

export const createFriendshipSlice: StateCreator<
    FriendshipSlice,
    [],
    [],
    FriendshipSlice
> = (set, get) => ({
    // Initial state
    friends: [],
    pendingRequests: [],
    outgoingRequests: [],
    isLoadingFriends: false,
    friendshipError: null,
    myFriendCode: null,
    friendRealtimeSubscribed: false,

    // Fetch friends list
    fetchFriends: async () => {
        const state = get() as CharacterStore;
        const userId = state.user?.id;
        if (!userId) return;

        set({ isLoadingFriends: true, friendshipError: null });
        try {
            const friends = await dataService.friendship.getFriends(userId);
            set({ friends, isLoadingFriends: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch friends';
            set({ friendshipError: message, isLoadingFriends: false });
        }
    },

    // Fetch pending friend requests (incoming)
    fetchPendingRequests: async () => {
        const state = get() as CharacterStore;
        const userId = state.user?.id;
        if (!userId) return;

        try {
            const pendingRequests = await dataService.friendship.getPendingRequests(userId);
            set({ pendingRequests });
        } catch {
            // Error handled silently - UI will show stale data
        }
    },

    // Fetch outgoing friend requests
    fetchOutgoingRequests: async () => {
        const state = get() as CharacterStore;
        const userId = state.user?.id;
        if (!userId) return;

        try {
            const outgoingRequests = await dataService.friendship.getOutgoingRequests(userId);
            set({ outgoingRequests });
        } catch {
            // Error handled silently - UI will show stale data
        }
    },

    // Fetch all friendship data at once
    fetchAllFriendshipData: async () => {
        const state = get() as CharacterStore;
        const userId = state.user?.id;
        if (!userId) return;

        set({ isLoadingFriends: true, friendshipError: null });
        try {
            const [friends, pendingRequests, outgoingRequests] = await Promise.all([
                dataService.friendship.getFriends(userId),
                dataService.friendship.getPendingRequests(userId),
                dataService.friendship.getOutgoingRequests(userId),
            ]);
            set({ friends, pendingRequests, outgoingRequests, isLoadingFriends: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch friends';
            set({ friendshipError: message, isLoadingFriends: false });
        }
    },

    // Send a friend request by friend code
    sendFriendRequest: async (friendCode: string) => {
        const state = get() as CharacterStore;
        const userId = state.user?.id;
        if (!userId) {
            toast.error('You must be logged in to send friend requests');
            return false;
        }

        set({ friendshipError: null });
        try {
            // First, find user by friend code
            const foundUser = await dataService.friendship.findByCode(friendCode);

            if (!foundUser) {
                toast.error('No user found with that friend code');
                return false;
            }

            if (foundUser.user_id === userId) {
                toast.error("You can't add yourself as a friend");
                return false;
            }

            if (!foundUser.allow_friend_requests) {
                toast.error('This user is not accepting friend requests');
                return false;
            }

            // Send the request
            await dataService.friendship.sendRequest(foundUser.user_id);

            // Add to outgoing requests optimistically
            const newRequest: OutgoingRequest = {
                id: crypto.randomUUID(), // Temporary ID
                to: {
                    user_id: foundUser.user_id,
                    username: foundUser.username,
                    avatar_url: foundUser.avatar_url,
                },
                created_at: new Date().toISOString(),
            };

            set((state) => ({
                outgoingRequests: [newRequest, ...state.outgoingRequests],
            }));

            toast.success(`Friend request sent to ${foundUser.username || 'user'}!`);
            return true;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to send friend request';
            toast.error(message);
            set({ friendshipError: message });
            return false;
        }
    },

    // Cancel an outgoing friend request
    cancelFriendRequest: async (requestId: string) => {
        const previousRequests = get().outgoingRequests;

        const { success } = await withOptimisticUpdate(
            () => {
                set((state) => ({
                    outgoingRequests: state.outgoingRequests.filter((r) => r.id !== requestId),
                }));
                return () => set({ outgoingRequests: previousRequests });
            },
            () => dataService.friendship.cancelRequest(requestId),
            'Failed to cancel friend request'
        );

        if (success) {
            toast.success('Friend request cancelled');
        }
    },

    // Accept an incoming friend request
    acceptFriendRequest: async (requestId: string) => {
        const request = get().pendingRequests.find((r) => r.id === requestId);
        const previousRequests = get().pendingRequests;
        const previousFriends = get().friends;

        const { success } = await withOptimisticUpdate(
            () => {
                // Remove from pending requests
                set((state) => ({
                    pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
                }));

                // Add to friends list
                if (request) {
                    const newFriend: Friend = {
                        user_id: request.from.user_id,
                        username: request.from.username,
                        avatar_url: request.from.avatar_url,
                        friend_code: null,
                        friendship_id: requestId,
                        is_requester: false,
                        since: new Date().toISOString(),
                    };
                    set((state) => ({
                        friends: [newFriend, ...state.friends],
                    }));
                }

                return () => set({ pendingRequests: previousRequests, friends: previousFriends });
            },
            () => dataService.friendship.acceptRequest(requestId),
            'Failed to accept friend request'
        );

        if (success) {
            toast.success(`You are now friends with ${request?.from.username || 'user'}!`);
        }
    },

    // Decline an incoming friend request
    declineFriendRequest: async (requestId: string) => {
        const previousRequests = get().pendingRequests;

        const { success } = await withOptimisticUpdate(
            () => {
                set((state) => ({
                    pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
                }));
                return () => set({ pendingRequests: previousRequests });
            },
            () => dataService.friendship.declineRequest(requestId),
            'Failed to decline friend request'
        );

        if (success) {
            toast.success('Friend request declined');
        }
    },

    // Remove a friend
    unfriend: async (friendshipId: string) => {
        const friend = get().friends.find((f) => f.friendship_id === friendshipId);
        const previousFriends = get().friends;

        const { success } = await withOptimisticUpdate(
            () => {
                set((state) => ({
                    friends: state.friends.filter((f) => f.friendship_id !== friendshipId),
                }));
                return () => set({ friends: previousFriends });
            },
            () => dataService.friendship.unfriend(friendshipId),
            'Failed to remove friend'
        );

        if (success) {
            toast.success(`Removed ${friend?.username || 'user'} from friends`);
        }
    },

    // Block a user
    blockUser: async (friendshipId: string) => {
        const previousFriends = get().friends;

        const { success } = await withOptimisticUpdate(
            () => {
                set((state) => ({
                    friends: state.friends.filter((f) => f.friendship_id !== friendshipId),
                }));
                return () => set({ friends: previousFriends });
            },
            () => dataService.friendship.block(friendshipId),
            'Failed to block user'
        );

        if (success) {
            toast.success('User blocked');
        }
    },

    // Set user's friend code (from profile)
    setMyFriendCode: (code: string) => {
        set({ myFriendCode: code });
    },

    // Clear error state
    clearFriendshipError: () => {
        set({ friendshipError: null });
    },

    // =========================================================================
    // REAL-TIME SUBSCRIPTIONS
    // =========================================================================

    subscribeToFriendshipRealtime: () => {
        const state = get() as CharacterStore;
        const userId = state.user?.id;
        if (!userId || get().friendRealtimeSubscribed) return;

        friendRealtimeManager.subscribe(
            userId,
            // onInsert - New friend request received
            (payload) => {
                if (payload.new && payload.eventType === 'INSERT') {
                    const friendship = payload.new as Friendship;
                    // Only show notification if we're the recipient
                    if (friendship.recipient_id === userId && friendship.status === 'pending') {
                        // Fetch complete request data
                        get().fetchPendingRequests();
                        toast.info('New friend request received!', {
                            action: {
                                label: 'View',
                                onClick: () => {
                                    // Could navigate to friends tab
                                },
                            },
                        });
                    }
                }
            },
            // onUpdate - Friend request accepted/declined
            (payload) => {
                if (payload.new && payload.eventType === 'UPDATE') {
                    const friendship = payload.new as Friendship;
                    get().updateFriendshipFromRealtime(friendship);
                }
            },
            // onDelete - Unfriended
            (payload) => {
                if (payload.old && payload.eventType === 'DELETE') {
                    const oldFriendship = payload.old as Friendship;
                    set((state) => ({
                        friends: state.friends.filter((f) => f.friendship_id !== oldFriendship.id),
                        outgoingRequests: state.outgoingRequests.filter((r) => r.id !== oldFriendship.id),
                        pendingRequests: state.pendingRequests.filter((r) => r.id !== oldFriendship.id),
                    }));
                }
            }
        );

        set({ friendRealtimeSubscribed: true });
    },

    unsubscribeFromFriendshipRealtime: () => {
        friendRealtimeManager.unsubscribe();
        set({ friendRealtimeSubscribed: false });
    },

    addPendingRequestFromRealtime: (request: FriendRequest) => {
        set((state) => ({
            pendingRequests: [request, ...state.pendingRequests.filter((r) => r.id !== request.id)],
        }));
    },

    removePendingRequestFromRealtime: (requestId: string) => {
        set((state) => ({
            pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
        }));
    },

    updateFriendshipFromRealtime: (friendship: Friendship) => {
        const state = get() as CharacterStore;
        const userId = state.user?.id;
        if (!userId) return;

        if (friendship.status === 'accepted') {
            // Someone accepted our request or we accepted theirs
            const isMyOutgoing = friendship.requester_id === userId;

            if (isMyOutgoing) {
                // Our request was accepted - remove from outgoing, add to friends
                set((s) => ({
                    outgoingRequests: s.outgoingRequests.filter((r) => r.id !== friendship.id),
                    friends: [
                        {
                            user_id: friendship.recipient_id,
                            username: null, // Will be fetched on next load
                            avatar_url: null,
                            friend_code: null,
                            friendship_id: friendship.id,
                            is_requester: true,
                            since: friendship.updated_at,
                        },
                        ...s.friends.filter((f) => f.friendship_id !== friendship.id),
                    ],
                }));
                toast.success('Your friend request was accepted!');
            }
            // Else: We accepted their request - already handled by acceptFriendRequest
        } else if (friendship.status === 'declined') {
            // Remove from outgoing
            set((s) => ({
                outgoingRequests: s.outgoingRequests.filter((r) => r.id !== friendship.id),
            }));
        } else if (friendship.status === 'blocked') {
            // Remove from all lists
            set((s) => ({
                friends: s.friends.filter((f) => f.friendship_id !== friendship.id),
                outgoingRequests: s.outgoingRequests.filter((r) => r.id !== friendship.id),
                pendingRequests: s.pendingRequests.filter((r) => r.id !== friendship.id),
            }));
        }
    },
});

