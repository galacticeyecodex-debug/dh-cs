'use client';

/**
 * Outgoing Request Card Component
 * Displays a pending friend request the user has sent
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Clock } from '@/lib/icon-utils';
import { getInitials, formatRelativeDate } from '@/lib/format-utils';
import type { OutgoingRequest } from '@/types/friendship';

interface OutgoingRequestCardProps {
    request: OutgoingRequest;
    onCancel: (requestId: string) => void;
    isLoading?: boolean;
}

export function OutgoingRequestCard({ request, onCancel, isLoading }: OutgoingRequestCardProps) {
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
                        Pending • Sent {formatRelativeDate(request.created_at)}
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
