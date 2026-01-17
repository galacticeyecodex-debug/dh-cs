'use client';

/**
 * Fear Change Activity Component
 * ----------------------------------------------------------------------------
 * Displays GM Fear adjustments with dramatic styling.
 */

import { CampaignActivity, FearChangeActivityData } from '@/types/activity';
import { Skull, TrendingUp, TrendingDown } from 'lucide-react';

interface FearChangeActivityProps {
    activity: CampaignActivity;
    compact?: boolean;
}

export function FearChangeActivity({ activity, compact = false }: FearChangeActivityProps) {
    const data = activity.data as FearChangeActivityData;
    const isGaining = data.change > 0;
    const actionText = isGaining ? 'gained' : 'spent';

    return (
        <div className="flex items-start gap-2">
            <div className="p-1.5 bg-red-500/20 rounded-lg">
                <Skull size={14} className="text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-red-400 text-sm">GM</span>
                    <span className="text-gray-400 text-sm">
                        {actionText} {Math.abs(data.change)} Fear
                    </span>
                    {isGaining ? (
                        <TrendingUp size={14} className="text-red-500" />
                    ) : (
                        <TrendingDown size={14} className="text-green-500" />
                    )}
                </div>

                {/* Current status */}
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                        Fear now at {data.new_value}/{data.max_value}
                    </span>
                </div>

                {/* Message */}
                {data.message && !compact && (
                    <div className="mt-2 text-sm border-l-2 border-red-500/50 pl-2 text-gray-300 italic">
                        &ldquo;{data.message}&rdquo;
                    </div>
                )}
            </div>
        </div>
    );
}

export default FearChangeActivity;
