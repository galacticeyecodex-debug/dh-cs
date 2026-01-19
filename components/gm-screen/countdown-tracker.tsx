'use client';

/**
 * COUNTDOWN TRACKER
 * ----------------------------------------------------------------------------
 * Displays and manages active countdowns on the GM Screen.
 *
 * FEATURES:
 * - Visual track display with tick boxes
 * - Manual tick down button
 * - Roll-based advancement for dynamic countdowns
 * - Trigger notification when countdown hits 0
 * - Loop reset for looping countdowns
 * - Delete/edit options
 *
 * ADVANCEMENT TABLE (per SRD):
 * | Roll Result         | Progress | Consequence |
 * |---------------------|----------|-------------|
 * | Failure with Fear   | 0        | 3           |
 * | Failure with Hope   | 0        | 2           |
 * | Success with Fear   | 1        | 1           |
 * | Success with Hope   | 2        | 0           |
 * | Critical Success    | 3        | 0           |
 */

import { useState } from 'react';
import {
    Timer,
    Plus,
    Minus,
    Trash2,
    Eye,
    EyeOff,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Zap,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import { Countdown, CountdownType, RollOutcome, COUNTDOWN_ADVANCEMENT } from '@/types/campaign';
import clsx from 'clsx';
import { toast } from 'sonner';

interface CountdownTrackerProps {
    countdowns: Countdown[];
    onAdvance: (countdownId: string, amount: number) => Promise<void>;
    onDelete: (countdownId: string) => Promise<void>;
    onReset: (countdownId: string) => Promise<void>;
    onCreateNew: () => void;
}

const TYPE_COLORS: Record<CountdownType, { bg: string; border: string; text: string; icon: string }> = {
    standard: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'text-blue-400' },
    progress: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: 'text-green-400' },
    consequence: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: 'text-red-400' },
    loop: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', icon: 'text-purple-400' },
    long_term: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-400' },
};

const ROLL_OUTCOMES: { outcome: RollOutcome; label: string; shortLabel: string }[] = [
    { outcome: 'critical', label: 'Critical Success', shortLabel: 'Crit' },
    { outcome: 'success_hope', label: 'Success + Hope', shortLabel: 'S+H' },
    { outcome: 'success_fear', label: 'Success + Fear', shortLabel: 'S+F' },
    { outcome: 'failure_hope', label: 'Failure + Hope', shortLabel: 'F+H' },
    { outcome: 'failure_fear', label: 'Failure + Fear', shortLabel: 'F+F' },
];

function CountdownCard({
    countdown,
    onAdvance,
    onDelete,
    onReset,
}: {
    countdown: Countdown;
    onAdvance: (amount: number) => Promise<void>;
    onDelete: () => Promise<void>;
    onReset: () => Promise<void>;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const colors = TYPE_COLORS[countdown.type];
    const isTriggered = countdown.current_value <= 0;
    const isDynamic = countdown.type === 'progress' || countdown.type === 'consequence';

    const handleRollAdvance = async (outcome: RollOutcome) => {
        const advancement = COUNTDOWN_ADVANCEMENT[outcome];
        const amount = countdown.type === 'progress' ? advancement.progress : advancement.consequence;

        if (amount > 0) {
            await onAdvance(amount);
        } else {
            toast.info('No advancement for this roll outcome');
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete();
        } finally {
            setIsDeleting(false);
        }
    };

    // Render tick boxes
    const renderTrack = () => {
        const boxes = [];
        const remaining = countdown.current_value;
        const total = countdown.starting_value;

        for (let i = 0; i < total; i++) {
            const isFilled = i >= remaining; // Filled boxes represent ticked-down values
            boxes.push(
                <div
                    key={i}
                    className={clsx(
                        "w-5 h-5 rounded border-2 transition-all",
                        isFilled
                            ? "bg-current border-current opacity-60"
                            : "border-current opacity-40",
                        colors.text
                    )}
                />
            );
        }

        return (
            <div className="flex flex-wrap gap-1">
                {boxes}
            </div>
        );
    };

    return (
        <div
            className={clsx(
                "rounded-lg border transition-all",
                colors.bg,
                colors.border,
                isTriggered && "ring-2 ring-dagger-gold/50 animate-pulse"
            )}
        >
            {/* Header */}
            <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <Timer size={14} className={colors.icon} />
                            <span className="font-medium text-white truncate">{countdown.name}</span>
                            {isTriggered && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-dagger-gold text-black rounded">
                                    Triggered!
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span className={clsx("capitalize", colors.text)}>{countdown.type.replace('_', '-')}</span>
                            {countdown.is_looping && (
                                <span className="flex items-center gap-0.5">
                                    <RefreshCw size={10} />
                                    Loop
                                </span>
                            )}
                            {!countdown.is_public && (
                                <span className="flex items-center gap-0.5">
                                    <EyeOff size={10} />
                                    Hidden
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className={clsx("text-lg font-bold tabular-nums", colors.text)}>
                            {countdown.current_value}/{countdown.starting_value}
                        </span>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>
                </div>

                {/* Track */}
                <div className="mt-2">
                    {renderTrack()}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 mt-3">
                    {isTriggered ? (
                        countdown.is_looping ? (
                            <button
                                onClick={onReset}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-xs font-medium transition-colors"
                            >
                                <RefreshCw size={12} />
                                Reset Loop
                            </button>
                        ) : (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs font-medium transition-colors disabled:opacity-50"
                            >
                                <CheckCircle size={12} />
                                {isDeleting ? 'Removing...' : 'Complete & Remove'}
                            </button>
                        )
                    ) : (
                        <>
                            <button
                                onClick={() => onAdvance(1)}
                                disabled={countdown.current_value <= 0}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs font-medium transition-colors disabled:opacity-50"
                            >
                                <Minus size={12} />
                                Tick Down
                            </button>
                            {isDynamic && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className={clsx(
                                        "flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                                        colors.bg,
                                        "hover:opacity-80"
                                    )}
                                >
                                    <Zap size={12} className={colors.text} />
                                    <span className={colors.text}>Roll Advance</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Expanded Section */}
            {isExpanded && (
                <div className="px-3 pb-3 border-t border-white/5 pt-3 space-y-3">
                    {countdown.description && (
                        <p className="text-xs text-gray-400">{countdown.description}</p>
                    )}

                    {/* Roll-based advancement for dynamic countdowns */}
                    {isDynamic && !isTriggered && (
                        <div className="space-y-2">
                            <div className="text-xs font-medium text-gray-300">Advance by Roll Outcome:</div>
                            <div className="grid grid-cols-5 gap-1">
                                {ROLL_OUTCOMES.map(({ outcome, shortLabel }) => {
                                    const advancement = COUNTDOWN_ADVANCEMENT[outcome];
                                    const amount = countdown.type === 'progress'
                                        ? advancement.progress
                                        : advancement.consequence;

                                    return (
                                        <button
                                            key={outcome}
                                            onClick={() => handleRollAdvance(outcome)}
                                            disabled={amount === 0}
                                            className={clsx(
                                                "flex flex-col items-center justify-center p-2 rounded text-[10px] transition-colors",
                                                amount > 0
                                                    ? "bg-white/5 hover:bg-white/10"
                                                    : "bg-white/5 opacity-40 cursor-not-allowed"
                                            )}
                                            title={`${shortLabel}: ${amount} tick${amount !== 1 ? 's' : ''}`}
                                        >
                                            <span className="font-medium">{shortLabel}</span>
                                            <span className={clsx(
                                                "font-bold",
                                                amount > 0 ? colors.text : "text-gray-500"
                                            )}>
                                                -{amount}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Manual adjustment */}
                    {!isTriggered && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onAdvance(3)}
                                disabled={countdown.current_value < 3}
                                className="flex-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs font-medium transition-colors disabled:opacity-50"
                            >
                                -3
                            </button>
                            <button
                                onClick={() => onAdvance(2)}
                                disabled={countdown.current_value < 2}
                                className="flex-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs font-medium transition-colors disabled:opacity-50"
                            >
                                -2
                            </button>
                            <button
                                onClick={() => onAdvance(1)}
                                disabled={countdown.current_value < 1}
                                className="flex-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs font-medium transition-colors disabled:opacity-50"
                            >
                                -1
                            </button>
                            <button
                                onClick={() => onAdvance(-1)}
                                disabled={countdown.current_value >= countdown.starting_value}
                                className="flex-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs font-medium transition-colors disabled:opacity-50"
                            >
                                +1
                            </button>
                        </div>
                    )}

                    {/* Delete */}
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs font-medium transition-colors disabled:opacity-50"
                    >
                        <Trash2 size={12} />
                        {isDeleting ? 'Deleting...' : 'Delete Countdown'}
                    </button>
                </div>
            )}
        </div>
    );
}

export function CountdownTracker({
    countdowns,
    onAdvance,
    onDelete,
    onReset,
    onCreateNew,
}: CountdownTrackerProps) {
    const activeCountdowns = countdowns.filter(c => c.current_value > 0);
    const triggeredCountdowns = countdowns.filter(c => c.current_value <= 0);

    return (
        <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/20">
                        <Timer className="w-5 h-5 text-amber-400" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="text-base font-serif font-bold text-white">Countdowns</h2>
                        <p className="text-[10px] text-gray-500">
                            {countdowns.length} active
                        </p>
                    </div>
                </div>
                <button
                    onClick={onCreateNew}
                    className="flex items-center gap-1 px-3 py-1.5 bg-dagger-gold/10 hover:bg-dagger-gold/20 text-dagger-gold rounded-lg text-xs font-medium transition-colors"
                >
                    <Plus size={14} />
                    New
                </button>
            </div>

            {/* Triggered Countdowns Warning */}
            {triggeredCountdowns.length > 0 && (
                <div className="flex items-center gap-2 p-2 mb-3 bg-dagger-gold/10 border border-dagger-gold/30 rounded-lg">
                    <AlertTriangle size={14} className="text-dagger-gold" />
                    <span className="text-xs text-dagger-gold font-medium">
                        {triggeredCountdowns.length} countdown{triggeredCountdowns.length > 1 ? 's' : ''} triggered!
                    </span>
                </div>
            )}

            {/* Countdowns List */}
            {countdowns.length === 0 ? (
                <div className="text-center py-6">
                    <Timer size={24} className="mx-auto mb-2 text-gray-600" />
                    <p className="text-sm text-gray-500">No active countdowns</p>
                    <button
                        onClick={onCreateNew}
                        className="mt-2 text-xs text-dagger-gold hover:underline"
                    >
                        Create your first countdown
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Triggered first */}
                    {triggeredCountdowns.map((countdown) => (
                        <CountdownCard
                            key={countdown.id}
                            countdown={countdown}
                            onAdvance={(amount) => onAdvance(countdown.id, amount)}
                            onDelete={() => onDelete(countdown.id)}
                            onReset={() => onReset(countdown.id)}
                        />
                    ))}
                    {/* Then active */}
                    {activeCountdowns.map((countdown) => (
                        <CountdownCard
                            key={countdown.id}
                            countdown={countdown}
                            onAdvance={(amount) => onAdvance(countdown.id, amount)}
                            onDelete={() => onDelete(countdown.id)}
                            onReset={() => onReset(countdown.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
