'use client';

/**
 * Outgoing Request Card Component
 * Displays a pending friend request the user has sent
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X, Clock } from 'lucide-react';
import type { OutgoingRequest } from '@/types/friendship';

interface OutgoingRequestCardProps {
    request: OutgoingRequest;
    onCancel: (requestId: string) => void;
    isLoading?: boolean;
}

export function OutgoingRequestCard({ request, onCancel, isLoading }: OutgoingRequestCardProps) {
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
                    <AvatarImage src={request.to.avatar_url || undefined} alt={request.to.username || 'User'} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                        {getInitials(request.to.username)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-medium text-foreground">{request.to.username || 'Unknown User'}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Pending • Sent {formatDate(request.created_at)}
                    </div>
                </div>
            </div>

            <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancel(request.id)}
                disabled={isLoading}
                className="h-8 px-3 text-muted-foreground hover:text-destructive"
            >
                <X className="h-4 w-4 mr-1" />
                Cancel
            </Button>
        </div>
    );
}
