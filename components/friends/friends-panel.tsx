'use client';

/**
 * Friends Panel Component
 * Main view for managing friends, requests, and friend codes
 */

import { useEffect, useState } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { Loader2, Users, UserPlus, Send } from 'lucide-react';
import { FriendCard } from './friend-card';
import { FriendRequestCard } from './friend-request-card';
import { OutgoingRequestCard } from './outgoing-request-card';
import { AddFriendForm } from './add-friend-form';
import { MyFriendCode } from './my-friend-code';
import clsx from 'clsx';

interface FriendsPanelProps {
    onShareHomebrew?: (userId: string) => void;
}

type TabType = 'friends' | 'requests' | 'sent';

export function FriendsPanel({ onShareHomebrew }: FriendsPanelProps) {
    const [activeTab, setActiveTab] = useState<TabType>('friends');
    const {
        friends,
        pendingRequests,
        outgoingRequests,
        isLoadingFriends,
        myFriendCode,
        fetchAllFriendshipData,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        cancelFriendRequest,
        unfriend,
        blockUser,
        subscribeToFriendshipRealtime,
        unsubscribeFromFriendshipRealtime,
    } = useCharacterStore();

    // Fetch friendship data and subscribe to real-time updates on mount
    useEffect(() => {
        fetchAllFriendshipData();
        subscribeToFriendshipRealtime();
        return () => {
            unsubscribeFromFriendshipRealtime();
        };
    }, [fetchAllFriendshipData, subscribeToFriendshipRealtime, unsubscribeFromFriendshipRealtime]);

    if (isLoadingFriends && friends.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        );
    }

    const tabButtonClass = (tab: TabType) => clsx(
        'flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
        activeTab === tab
            ? 'bg-dagger-gold/20 text-dagger-gold'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
    );

    return (
        <div className="space-y-6">
            {/* Friend Code Section */}
            <MyFriendCode code={myFriendCode} />

            {/* Add Friend Form */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-white">
                    <UserPlus className="h-4 w-4 text-dagger-gold" />
                    Add Friend
                </h3>
                <AddFriendForm onSubmit={sendFriendRequest} />
            </div>

            {/* Custom Tabs */}
            <div className="space-y-4">
                {/* Tab Buttons */}
                <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
                    <button
                        onClick={() => setActiveTab('friends')}
                        className={tabButtonClass('friends')}
                    >
                        <Users className="h-4 w-4" />
                        Friends
                        {friends.length > 0 && (
                            <span className="px-1.5 py-0.5 text-xs rounded bg-white/10">
                                {friends.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={tabButtonClass('requests')}
                    >
                        Requests
                        {pendingRequests.length > 0 && (
                            <span className="px-1.5 py-0.5 text-xs rounded bg-dagger-gold/30 text-dagger-gold">
                                {pendingRequests.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={tabButtonClass('sent')}
                    >
                        <Send className="h-4 w-4" />
                        Sent
                        {outgoingRequests.length > 0 && (
                            <span className="px-1.5 py-0.5 text-xs rounded bg-white/10">
                                {outgoingRequests.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Tab Content */}
                <div className="max-h-[400px] overflow-y-auto">
                    {/* Friends List */}
                    {activeTab === 'friends' && (
                        friends.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="h-12 w-12 mx-auto text-gray-600 mb-3" />
                                <p className="text-gray-400">No friends yet</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Share your friend code or add someone using theirs!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {friends.map((friend) => (
                                    <FriendCard
                                        key={friend.friendship_id}
                                        friend={friend}
                                        onUnfriend={unfriend}
                                        onBlock={blockUser}
                                        onShareHomebrew={onShareHomebrew}
                                    />
                                ))}
                            </div>
                        )
                    )}

                    {/* Incoming Requests */}
                    {activeTab === 'requests' && (
                        pendingRequests.length === 0 ? (
                            <div className="text-center py-12">
                                <UserPlus className="h-12 w-12 mx-auto text-gray-600 mb-3" />
                                <p className="text-gray-400">No pending requests</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    When someone sends you a friend request, it will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {pendingRequests.map((request) => (
                                    <FriendRequestCard
                                        key={request.id}
                                        request={request}
                                        onAccept={acceptFriendRequest}
                                        onDecline={declineFriendRequest}
                                    />
                                ))}
                            </div>
                        )
                    )}

                    {/* Outgoing Requests (Sent) */}
                    {activeTab === 'sent' && (
                        outgoingRequests.length === 0 ? (
                            <div className="text-center py-12">
                                <Send className="h-12 w-12 mx-auto text-gray-600 mb-3" />
                                <p className="text-gray-400">No pending requests</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Friend requests you&apos;ve sent will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {outgoingRequests.map((request) => (
                                    <OutgoingRequestCard
                                        key={request.id}
                                        request={request}
                                        onCancel={cancelFriendRequest}
                                    />
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
