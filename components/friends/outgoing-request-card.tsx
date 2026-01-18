'use client';

/**
 * Outgoing Request Card Component
 * Displays a pending friend request the user has sent
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={request.to.avatar_url || undefined} alt={request.to.username || 'User'} />
                    <AvatarFallback className="bg-white/10 text-gray-400">
                        {getInitials(request.to.username)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-medium text-white">{request.to.username || 'Unknown User'}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        Pending • Sent {formatDate(request.created_at)}
                    </div>
                </div>
            </div>

            <button
                onClick={() => onCancel(request.id)}
                disabled={isLoading}
                className="h-8 px-3 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1 text-sm"
            >
                <X className="h-4 w-4" />
                Cancel
            </button>
        </div>
    );
}
