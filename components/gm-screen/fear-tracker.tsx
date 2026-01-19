'use client';

/**
 * FEAR TRACKER
 * ----------------------------------------------------------------------------
 * Displays and controls the campaign's Fear resource on the GM Screen.
 *
 * FUNCTIONALITY:
 * - Shows current Fear level with visual icon track (12 skull icons per SRD)
 * - Maximum Fear is ALWAYS 12 (hardcoded per SRD rules)
 * - "Spend" and "Gain" buttons matching VitalCard pattern
 * - Quick increment buttons for common adjustments
 * - Logs Fear changes to activity feed
 * - Uses Daggerheart visual styling with red/purple theme
 *
 * SRD RULES:
 * - Maximum Fear is always 12: "You can never have more than 12 Fear at one time"
 * - Starting Fear: 1 per PC in party
 * - Fear carries over between sessions
 */

import { useCharacterStore } from '@/store/character-store';
import { Skull } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';

// SRD: Maximum Fear is always 12
const MAX_FEAR = 12;

interface FearTrackerProps {
    campaignId: string;
    currentFear: number;
    /** @deprecated Fear max is always 12 per SRD. This prop is ignored. */
    maxFear?: number;
}

export function FearTracker({ campaignId, currentFear }: FearTrackerProps) {
    const { updateFear, logActivity, user } = useCharacterStore();

    const handleFearChange = async (change: number) => {
        try {
            await updateFear(campaignId, change);

            // Log to activity feed
            if (user) {
                const newValue = Math.max(0, Math.min(MAX_FEAR, currentFear + change));
                await logActivity({
                    campaign_id: campaignId,
                    user_id: user.id,
                    activity_type: 'fear_change',
                    data: {
                        change,
                        previous_value: currentFear,
                        new_value: newValue,
                        max_value: MAX_FEAR,
                        trigger: 'manual',
                    },
                    is_private: false,
                });
            }

            const action = change > 0 ? 'gained' : 'spent';
            toast.success(`Fear ${action}: ${Math.abs(change)}`);
        } catch {
            // Error toast already shown in store
        }
    };

    // Render the skull icon track (fill-up-bad semantics: gaining Fear fills the track)
    const renderTrack = () => {
        const icons = [];
        const filledCount = currentFear;
        const isFullFear = filledCount >= MAX_FEAR;

        for (let i = 0; i < MAX_FEAR; i++) {
            const isFilled = i < filledCount;
            icons.push(
                <Skull
                    key={i}
                    size={20}
                    className={clsx(
                        "transition-all duration-300",
                        isFilled
                            ? clsx(isFullFear ? "text-red-500" : "text-purple-400", "scale-100")
                            : "text-white/10 scale-90"
                    )}
                    fill={isFilled ? "currentColor" : "none"}
                />
            );
        }

        return (
            <div className="flex flex-wrap justify-center gap-1.5 my-3 px-2">
                {icons}
            </div>
        );
    };

    return (
        <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-500/20">
                        <Skull className="w-5 h-5 text-red-500" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="text-base font-serif font-bold text-white">Fear</h2>
                        <p className="text-[10px] text-gray-500">
                            Visible to all players
                        </p>
                    </div>
                </div>
                <span className="text-xl font-bold tabular-nums text-white">
                    {currentFear}/{MAX_FEAR}
                </span>
            </div>

            {/* Icon Track */}
            {renderTrack()}

            {/* Spend/Gain Buttons */}
            <div className="flex gap-2 mt-3">
                <button
                    onClick={() => handleFearChange(-1)}
                    disabled={currentFear === 0}
                    className="flex-1 h-8 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center text-xs font-bold uppercase tracking-wider transition-colors"
                    aria-label="Spend Fear"
                >
                    Spend
                </button>
                <button
                    onClick={() => handleFearChange(1)}
                    disabled={currentFear >= MAX_FEAR}
                    className="flex-1 h-8 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center text-xs font-bold uppercase tracking-wider transition-colors"
                    aria-label="Gain Fear"
                >
                    Gain
                </button>
            </div>

            {/* Quick Increment Buttons */}
            <div className="flex gap-2 mt-2">
                <button
                    onClick={() => handleFearChange(-3)}
                    disabled={currentFear < 3}
                    className="flex-1 px-2 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs font-medium text-gray-400 transition-colors border border-white/5"
                    aria-label="Spend 3 Fear"
                >
                    -3
                </button>
                <button
                    onClick={() => handleFearChange(-1)}
                    disabled={currentFear < 1}
                    className="flex-1 px-2 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs font-medium text-gray-400 transition-colors border border-white/5"
                    aria-label="Spend 1 Fear"
                >
                    -1
                </button>
                <button
                    onClick={() => handleFearChange(1)}
                    disabled={currentFear >= MAX_FEAR}
                    className="flex-1 px-2 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs font-medium text-gray-400 transition-colors border border-white/5"
                    aria-label="Gain 1 Fear"
                >
                    +1
                </button>
                <button
                    onClick={() => handleFearChange(3)}
                    disabled={currentFear > MAX_FEAR - 3}
                    className="flex-1 px-2 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs font-medium text-gray-400 transition-colors border border-white/5"
                    aria-label="Gain 3 Fear"
                >
                    +3
                </button>
            </div>

            {/* Fear Spending Guide */}
            <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-[10px] text-gray-500 text-center">
                    Spend Fear to: interrupt, make extra moves, use Fear Features
                </p>
            </div>
        </div>
    );
}
