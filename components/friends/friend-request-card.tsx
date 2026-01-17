'use client';

/**
 * Friend Request Card Component
 * Displays an incoming friend request with accept/decline actions
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import type { FriendRequest } from '@/types/friendship';

interface FriendRequestCardProps {
    request: FriendRequest;
    onAccept: (requestId: string) => void;
    onDecline: (requestId: string) => void;
    isLoading?: boolean;
}

export function FriendRequestCard({ request, onAccept, onDecline, isLoading }: FriendRequestCardProps) {
    const getInitials = (name: string | null) => {
        if (!name) return '?';
        return name.slice(0, 2).toUpperCase();
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={request.from.avatar_url || undefined} alt={request.from.username || 'User'} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(request.from.username)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-medium text-foreground">{request.from.username || 'Unknown User'}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatDate(request.created_at)}
                    </p>
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => onAccept(request.id)}
                    disabled={isLoading}
                    className="h-8 px-3"
                >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDecline(request.id)}
                    disabled={isLoading}
                    className="h-8 px-3 text-muted-foreground hover:text-destructive"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
