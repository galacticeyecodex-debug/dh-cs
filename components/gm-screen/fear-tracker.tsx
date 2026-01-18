'use client';

/**
 * FEAR TRACKER
 * ----------------------------------------------------------------------------
 * Displays and controls the campaign's Fear resource on the GM Screen.
 * 
 * FUNCTIONALITY:
 * - Shows current Fear level with visual progress bar
 * - Allows GM to increment/decrement Fear with quick action buttons
 * - Logs Fear changes to activity feed
 * - Uses Daggerheart visual styling with red/purple gradient
 */

import { useCharacterStore } from '@/store/character-store';
import { Skull, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface FearTrackerProps {
    campaignId: string;
    currentFear: number;
    maxFear: number;
}

export function FearTracker({ campaignId, currentFear, maxFear }: FearTrackerProps) {
    const { updateFear, logActivity, user } = useCharacterStore();

    const handleFearChange = async (change: number) => {
        try {
            await updateFear(campaignId, change);

            // Log to activity feed
            if (user) {
                const newValue = Math.max(0, Math.min(maxFear, currentFear + change));
                await logActivity({
                    campaign_id: campaignId,
                    user_id: user.id,
                    activity_type: 'fear_change',
                    data: {
                        change,
                        previous_value: currentFear,
                        new_value: newValue,
                        max_value: maxFear,
                        trigger: 'manual',
                    },
                    is_private: false,
                });
            }

            const action = change > 0 ? 'gained' : 'spent';
            toast.success(`Fear ${action}: ${Math.abs(change)}`);
        } catch (error) {
            // Error toast already shown in store
        }
    };

    const percentage = maxFear > 0 ? (currentFear / maxFear) * 100 : 0;

    return (
        <div className="bg-dagger-panel border border-white/10 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/20">
                        <Skull className="w-6 h-6 text-red-500" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="text-lg font-serif font-bold text-white">Fear</h2>
                        <p className="text-xs text-gray-500">
                            GM-controlled resource, visible to all players
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleFearChange(-1)}
                        disabled={currentFear === 0}
                        className="p-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors border border-white/10"
                        aria-label="Spend 1 Fear"
                    >
                        <Minus className="w-4 h-4 text-gray-300" />
                    </button>
                    <span className="text-2xl font-bold min-w-[80px] text-center tabular-nums text-white">
                        {currentFear}/{maxFear}
                    </span>
                    <button
                        onClick={() => handleFearChange(1)}
                        disabled={currentFear >= maxFear}
                        className="p-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors border border-white/10"
                        aria-label="Gain 1 Fear"
                    >
                        <Plus className="w-4 h-4 text-gray-300" />
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-4 bg-black/30 rounded-full overflow-hidden border border-white/5">
                <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-purple-600 transition-all duration-300 ease-out"
                    style={{ width: `${percentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/80">
                    {currentFear > 0 && `${Math.round(percentage)}%`}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-4">
                <button
                    onClick={() => handleFearChange(-5)}
                    disabled={currentFear < 5}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium text-gray-400 transition-colors border border-white/5"
                >
                    -5
                </button>
                <button
                    onClick={() => handleFearChange(-3)}
                    disabled={currentFear < 3}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium text-gray-400 transition-colors border border-white/5"
                >
                    -3
                </button>
                <div className="flex-1" />
                <button
                    onClick={() => handleFearChange(3)}
                    disabled={currentFear >= maxFear - 2}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium text-gray-400 transition-colors border border-white/5"
                >
                    +3
                </button>
                <button
                    onClick={() => handleFearChange(5)}
                    disabled={currentFear >= maxFear - 4}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium text-gray-400 transition-colors border border-white/5"
                >
                    +5
                </button>
            </div>
        </div>
    );
}
