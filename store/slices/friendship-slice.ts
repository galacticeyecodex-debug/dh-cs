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
 * - Share homebrew with friends (integrates with sharing-slice)
 */

import type { StateCreator } from 'zustand';
import { dataService } from '@/lib/data-service';
import type { Friendship, Friend, FriendRequest, OutgoingRequest } from '@/types/friendship';
import { toast } from 'sonner';

export interface FriendshipSlice {
    // State
    friends: Friend[];
    pendingRequests: FriendRequest[];
    outgoingRequests: OutgoingRequest[];
    isLoadingFriends: boolean;
    friendshipError: string | null;
    myFriendCode: string | null;

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

    // Fetch friends list
    fetchFriends: async () => {
        const state = get() as any;
        const userId = state.user?.id;
        if (!userId) return;

        set({ isLoadingFriends: true, friendshipError: null });
        try {
            const friends = await dataService.friendship.getFriends(userId);
            set({ friends, isLoadingFriends: false });
        } catch (error: any) {
            console.error('Failed to fetch friends:', error);
            set({ friendshipError: error.message, isLoadingFriends: false });
        }
    },

    // Fetch pending friend requests (incoming)
    fetchPendingRequests: async () => {
        const state = get() as any;
        const userId = state.user?.id;
        if (!userId) return;

        try {
            const pendingRequests = await dataService.friendship.getPendingRequests(userId);
            set({ pendingRequests });
        } catch (error: any) {
            console.error('Failed to fetch pending requests:', error);
        }
    },

    // Fetch outgoing friend requests
    fetchOutgoingRequests: async () => {
        const state = get() as any;
        const userId = state.user?.id;
        if (!userId) return;

        try {
            const outgoingRequests = await dataService.friendship.getOutgoingRequests(userId);
            set({ outgoingRequests });
        } catch (error: any) {
            console.error('Failed to fetch outgoing requests:', error);
        }
    },

    // Fetch all friendship data at once
    fetchAllFriendshipData: async () => {
        const state = get() as any;
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
        } catch (error: any) {
            console.error('Failed to fetch friendship data:', error);
            set({ friendshipError: error.message, isLoadingFriends: false });
        }
    },

    // Send a friend request by friend code
    sendFriendRequest: async (friendCode: string) => {
        const state = get() as any;
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
        } catch (error: any) {
            console.error('Failed to send friend request:', error);
            toast.error(error.message || 'Failed to send friend request');
            set({ friendshipError: error.message });
            return false;
        }
    },

    // Cancel an outgoing friend request
    cancelFriendRequest: async (requestId: string) => {
        try {
            // Optimistically remove from outgoing
            set((state) => ({
                outgoingRequests: state.outgoingRequests.filter((r) => r.id !== requestId),
            }));

            await dataService.friendship.cancelRequest(requestId);
            toast.success('Friend request cancelled');
        } catch (error: any) {
            console.error('Failed to cancel friend request:', error);
            toast.error('Failed to cancel friend request');
            // Refetch to restore state
            get().fetchOutgoingRequests();
        }
    },

    // Accept an incoming friend request
    acceptFriendRequest: async (requestId: string) => {
        const request = get().pendingRequests.find((r) => r.id === requestId);

        try {
            // Optimistically update
            set((state) => ({
                pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
            }));

            await dataService.friendship.acceptRequest(requestId);

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

            toast.success(`You are now friends with ${request?.from.username || 'user'}!`);
        } catch (error: any) {
            console.error('Failed to accept friend request:', error);
            toast.error('Failed to accept friend request');
            // Refetch to restore state
            get().fetchAllFriendshipData();
        }
    },

    // Decline an incoming friend request
    declineFriendRequest: async (requestId: string) => {
        try {
            // Optimistically remove
            set((state) => ({
                pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
            }));

            await dataService.friendship.declineRequest(requestId);
            toast.success('Friend request declined');
        } catch (error: any) {
            console.error('Failed to decline friend request:', error);
            toast.error('Failed to decline friend request');
            get().fetchPendingRequests();
        }
    },

    // Remove a friend
    unfriend: async (friendshipId: string) => {
        const friend = get().friends.find((f) => f.friendship_id === friendshipId);

        try {
            // Optimistically remove
            set((state) => ({
                friends: state.friends.filter((f) => f.friendship_id !== friendshipId),
            }));

            await dataService.friendship.unfriend(friendshipId);
            toast.success(`Removed ${friend?.username || 'user'} from friends`);
        } catch (error: any) {
            console.error('Failed to unfriend:', error);
            toast.error('Failed to remove friend');
            get().fetchFriends();
        }
    },

    // Block a user
    blockUser: async (friendshipId: string) => {
        try {
            // Remove from friends list
            set((state) => ({
                friends: state.friends.filter((f) => f.friendship_id !== friendshipId),
            }));

            await dataService.friendship.block(friendshipId);
            toast.success('User blocked');
        } catch (error: any) {
            console.error('Failed to block user:', error);
            toast.error('Failed to block user');
            get().fetchFriends();
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
});
