'use client';

/**
 * Friends Panel Component
 * Main view for managing friends, requests, and friend codes
 */

import { useEffect } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, UserPlus, Send } from 'lucide-react';
import { FriendCard } from './friend-card';
import { FriendRequestCard } from './friend-request-card';
import { OutgoingRequestCard } from './outgoing-request-card';
import { AddFriendForm } from './add-friend-form';
import { MyFriendCode } from './my-friend-code';

interface FriendsPanelProps {
    onShareHomebrew?: (userId: string) => void;
}

export function FriendsPanel({ onShareHomebrew }: FriendsPanelProps) {
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
    } = useCharacterStore();

    // Fetch friendship data on mount
    useEffect(() => {
        fetchAllFriendshipData();
    }, [fetchAllFriendshipData]);

    if (isLoadingFriends && friends.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Friend Code Section */}
            <MyFriendCode code={myFriendCode} />

            {/* Add Friend Form */}
            <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Friend
                </h3>
                <AddFriendForm onSubmit={sendFriendRequest} />
            </div>

            {/* Tabs for Friends / Requests */}
            <Tabs defaultValue="friends" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="friends" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Friends
                        {friends.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                                {friends.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="flex items-center gap-2">
                        Requests
                        {pendingRequests.length > 0 && (
                            <Badge variant="default" className="ml-1 h-5 px-1.5 bg-primary">
                                {pendingRequests.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="sent" className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Sent
                        {outgoingRequests.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                                {outgoingRequests.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Friends List */}
                <TabsContent value="friends" className="mt-4">
                    <ScrollArea className="h-[400px] pr-4">
                        {friends.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                                <p className="text-muted-foreground">No friends yet</p>
                                <p className="text-sm text-muted-foreground mt-1">
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
                        )}
                    </ScrollArea>
                </TabsContent>

                {/* Incoming Requests */}
                <TabsContent value="requests" className="mt-4">
                    <ScrollArea className="h-[400px] pr-4">
                        {pendingRequests.length === 0 ? (
                            <div className="text-center py-12">
                                <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                                <p className="text-muted-foreground">No pending requests</p>
                                <p className="text-sm text-muted-foreground mt-1">
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
                        )}
                    </ScrollArea>
                </TabsContent>

                {/* Outgoing Requests (Sent) */}
                <TabsContent value="sent" className="mt-4">
                    <ScrollArea className="h-[400px] pr-4">
                        {outgoingRequests.length === 0 ? (
                            <div className="text-center py-12">
                                <Send className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                                <p className="text-muted-foreground">No pending requests</p>
                                <p className="text-sm text-muted-foreground mt-1">
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
                        )}
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
}
