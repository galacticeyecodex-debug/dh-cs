'use client';

/**
 * Friend Request Card Component
 * Displays an incoming friend request with accept/decline actions
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X } from '@/lib/icon-utils';
import { getInitials, formatRelativeDate } from '@/lib/format-utils';
import type { FriendRequest } from '@/types/friendship';

interface FriendRequestCardProps {
    request: FriendRequest;
    onAccept: (requestId: string) => void;
    onDecline: (requestId: string) => void;
    isLoading?: boolean;
}

export function FriendRequestCard({ request, onAccept, onDecline, isLoading }: FriendRequestCardProps) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={request.from.avatar_url || undefined} alt={request.from.username || 'User'} />
                    <AvatarFallback className="bg-dagger-gold/20 text-dagger-gold">
                        {getInitials(request.from.username)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-medium text-white">{request.from.username || 'Unknown User'}</p>
                    <p className="text-xs text-gray-500">
                        {formatRelativeDate(request.created_at)}
                    </p>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => onAccept(request.id)}
                    disabled={isLoading}
                    className="h-8 px-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                >
                    <Check className="h-4 w-4" />
                    Accept
                </button>
                <button
                    onClick={() => onDecline(request.id)}
                    disabled={isLoading}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
