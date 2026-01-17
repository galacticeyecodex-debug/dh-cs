/**
 * Online Indicator Component
 * ----------------------------------------------------------------------------
 * A simple visual indicator showing online/away/offline status.
 *
 * Phase 5: Presence System Implementation
 * GitHub Issue: #67
 */

import { cn } from '@/lib/utils';

interface OnlineIndicatorProps {
    status: 'online' | 'away' | 'offline';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    showPulse?: boolean;
}

export function OnlineIndicator({
    status,
    size = 'md',
    className,
    showPulse = true,
}: OnlineIndicatorProps) {
    const sizeClasses = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
    };

    const colorClasses = {
        online: 'bg-green-500',
        away: 'bg-yellow-500',
        offline: 'bg-gray-400 dark:bg-gray-600',
    };

    const pulseClasses = {
        online: 'animate-pulse',
        away: '',
        offline: '',
    };

    return (
        <div className={cn('relative', className)}>
            <div
                className={cn(
                    'rounded-full',
                    sizeClasses[size],
                    colorClasses[status],
                    showPulse && pulseClasses[status]
                )}
                aria-label={`${status} status`}
            />
            {status === 'online' && showPulse && (
                <div
                    className={cn(
                        'absolute inset-0 rounded-full bg-green-500 animate-ping opacity-50',
                        sizeClasses[size]
                    )}
                />
            )}
        </div>
    );
}
