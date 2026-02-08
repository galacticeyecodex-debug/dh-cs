'use client';

/**
 * Friend Card Component
 * Displays a friend's basic information with actions
 */

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreVertical, UserMinus, Ban, Share2 } from '@/lib/icon-utils';
import { getInitials, formatShortDate } from '@/lib/format-utils';
import type { Friend } from '@/types/friendship';
import { Z_INDEX } from '@/constants/z-index';

interface FriendCardProps {
    friend: Friend;
    onUnfriend: (friendshipId: string) => void;
    onBlock: (friendshipId: string) => void;
    onShareHomebrew?: (userId: string) => void;
}

export function FriendCard({ friend, onUnfriend, onBlock, onShareHomebrew }: FriendCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={friend.avatar_url || undefined} alt={friend.username || 'Friend'} />
                    <AvatarFallback className="bg-dagger-gold/20 text-dagger-gold">
                        {getInitials(friend.username)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-medium text-white">{friend.username || 'Unknown User'}</p>
                    <p className="text-xs text-gray-500">
                        Friends since {formatShortDate(friend.since)}
                    </p>
                </div>
            </div>

            <div className="relative">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                >
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                </button>

                {showMenu && (
                    <>
                        <div
                            className="fixed inset-0"
                            style={{ zIndex: Z_INDEX.BASE }}
                            onClick={() => setShowMenu(false)}
                        />
                        <div 
                            className="absolute right-0 top-full mt-1 bg-dagger-panel border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[160px]"
                            style={{ zIndex: Z_INDEX.CARD_CONTENT }}
                        >
                            {onShareHomebrew && (
                                <button
                                    onClick={() => {
                                        onShareHomebrew(friend.user_id);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                                >
                                    <Share2 className="h-4 w-4" />
                                    Share Homebrew
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    onUnfriend(friend.friendship_id);
                                    setShowMenu(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-orange-400 hover:bg-white/10 flex items-center gap-2"
                            >
                                <UserMinus className="h-4 w-4" />
                                Remove Friend
                            </button>
                            <button
                                onClick={() => {
                                    onBlock(friend.friendship_id);
                                    setShowMenu(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2"
                            >
                                <Ban className="h-4 w-4" />
                                Block User
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
