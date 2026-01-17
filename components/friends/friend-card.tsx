'use client';

/**
 * Friend Card Component
 * Displays a friend's basic information with actions
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, UserMinus, Ban, Share2 } from 'lucide-react';
import type { Friend } from '@/types/friendship';

interface FriendCardProps {
    friend: Friend;
    onUnfriend: (friendshipId: string) => void;
    onBlock: (friendshipId: string) => void;
    onShareHomebrew?: (userId: string) => void;
}

export function FriendCard({ friend, onUnfriend, onBlock, onShareHomebrew }: FriendCardProps) {
    const getInitials = (name: string | null) => {
        if (!name) return '?';
        return name.slice(0, 2).toUpperCase();
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    };

    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={friend.avatar_url || undefined} alt={friend.username || 'Friend'} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(friend.username)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-medium text-foreground">{friend.username || 'Unknown User'}</p>
                    <p className="text-xs text-muted-foreground">
                        Friends since {formatDate(friend.since)}
                    </p>
                </div>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {onShareHomebrew && (
                        <DropdownMenuItem onClick={() => onShareHomebrew(friend.user_id)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share Homebrew
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                        onClick={() => onUnfriend(friend.friendship_id)}
                        className="text-orange-500 focus:text-orange-500"
                    >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove Friend
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => onBlock(friend.friendship_id)}
                        className="text-destructive focus:text-destructive"
                    >
                        <Ban className="h-4 w-4 mr-2" />
                        Block User
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
