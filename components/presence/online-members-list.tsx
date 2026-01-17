/**
 * Online Members List Component
 * ----------------------------------------------------------------------------
 * Displays a list of online members in a campaign with their status indicators.
 *
 * Phase 5: Presence System Implementation
 * GitHub Issue: #67
 */

'use client';

import { useCharacterStore } from '@/store/character-store';
import { OnlineIndicator } from './online-indicator';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnlineMembersListProps {
    className?: string;
    compact?: boolean;
}

export function OnlineMembersList({ className, compact = false }: OnlineMembersListProps) {
    const onlineMembers = useCharacterStore((state) => state.onlineMembers);

    const onlineCount = onlineMembers.filter((m) => m.status === 'online').length;
    const awayCount = onlineMembers.filter((m) => m.status === 'away').length;

    if (compact) {
        // Compact view: just show count with icon
        return (
            <div
                className={cn(
                    'flex items-center gap-1.5 text-sm text-muted-foreground',
                    className
                )}
                aria-label={`${onlineCount} online, ${awayCount} away`}
            >
                <Users className="h-4 w-4" />
                <span className="flex items-center gap-1">
                    <span className="text-green-500 font-medium">{onlineCount}</span>
                    {awayCount > 0 && (
                        <span className="text-yellow-500">+{awayCount}</span>
                    )}
                </span>
            </div>
        );
    }

    // Full view: show list with names
    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Online ({onlineCount})</span>
            </div>
            <ul className="space-y-1.5">
                {onlineMembers.length === 0 ? (
                    <li className="text-sm text-muted-foreground italic">No one online</li>
                ) : (
                    onlineMembers.map((member) => (
                        <li
                            key={member.user_id}
                            className="flex items-center gap-2 text-sm"
                        >
                            <OnlineIndicator
                                status={member.status}
                                size="sm"
                                showPulse={false}
                            />
                            <span className={cn(
                                member.status === 'away' && 'text-muted-foreground'
                            )}>
                                {member.character_name || member.username || 'Unknown'}
                            </span>
                            {member.status === 'away' && (
                                <span className="text-xs text-muted-foreground">(away)</span>
                            )}
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}
