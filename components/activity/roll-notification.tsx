'use client';

/**
 * Roll Notification Component
 * ----------------------------------------------------------------------------
 * An enhanced pop-up toast notification that displays dice roll results from
 * other players in the campaign. This provides more prominent feedback than
 * the standard toast for important game events like dice rolls.
 * 
 * Phase 9: Roll Announcements & Pop-up Notifications (Issue #67)
 */

import React from 'react';
import { CampaignActivity, DiceRollActivityData, GmRollActivityData } from '@/types/activity';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, X, Sparkles, Skull } from 'lucide-react';
import clsx from 'clsx';

interface RollNotificationProps {
    activity: CampaignActivity | null;
    onDismiss: () => void;
    /** Duration in ms before auto-dismiss (0 = no auto-dismiss) */
    autoDismissMs?: number;
}

export function RollNotification({
    activity,
    onDismiss,
    autoDismissMs = 5000,
}: RollNotificationProps) {
    // Auto-dismiss timer
    React.useEffect(() => {
        if (!activity || autoDismissMs === 0) return;

        const timer = setTimeout(() => {
            onDismiss();
        }, autoDismissMs);

        return () => clearTimeout(timer);
    }, [activity, autoDismissMs, onDismiss]);

    if (!activity || activity.activity_type !== 'dice_roll') return null;

    const data = activity.data as DiceRollActivityData | GmRollActivityData;
    const isGmRoll = 'is_gm_roll' in data && data.is_gm_roll;
    const characterName = activity.character_name || (isGmRoll ? 'GM' : 'Unknown');
    const hopeFear = data.hope_fear;

    // Determine roll type styling
    const isCritical = hopeFear === 'hope' && data.dice?.length >= 2 &&
        data.dice[0] === data.dice[1] && data.dice[0] > 0;
    const isHope = hopeFear === 'hope' && !isCritical;
    const isFear = hopeFear === 'fear';
    const isDamage = data.roll_type === 'damage';

    // Background and border colors based on roll type
    const containerClasses = clsx(
        'relative overflow-hidden rounded-2xl shadow-2xl border backdrop-blur-md',
        {
            'bg-gradient-to-br from-green-500/30 to-green-900/40 border-green-500/50': isCritical,
            'bg-gradient-to-br from-amber-500/20 to-amber-900/30 border-amber-500/40': isHope,
            'bg-gradient-to-br from-purple-500/20 to-purple-900/30 border-purple-500/40': isFear,
            'bg-gradient-to-br from-red-500/20 to-red-900/30 border-red-500/40': isDamage,
            'bg-gradient-to-br from-gray-500/20 to-gray-900/30 border-gray-500/40': !isCritical && !isHope && !isFear && !isDamage,
        }
    );

    const totalClasses = clsx(
        'text-5xl font-serif font-black tabular-nums',
        {
            'text-green-400': isCritical,
            'text-amber-400': isHope,
            'text-purple-400': isFear,
            'text-red-400': isDamage,
            'text-white': !isCritical && !isHope && !isFear && !isDamage,
        }
    );

    const rollTypeLabel = isCritical ? 'Critical Success!' :
        isHope ? 'With Hope' :
            isFear ? 'With Fear' :
                isDamage ? 'Damage' :
                    'Roll';

    const Icon = isCritical ? Sparkles : isFear ? Skull : Dices;

    return (
        <AnimatePresence>
            {activity && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
                    role="alert"
                    aria-live="polite"
                    data-testid="roll-notification"
                >
                    <div className={containerClasses}>
                        {/* Dismiss button */}
                        <button
                            onClick={onDismiss}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            aria-label="Dismiss notification"
                        >
                            <X size={14} className="text-white/70" />
                        </button>

                        <div className="p-4">
                            {/* Header: Who rolled */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className={clsx(
                                    'p-1.5 rounded-lg',
                                    {
                                        'bg-green-500/30': isCritical,
                                        'bg-amber-500/30': isHope,
                                        'bg-purple-500/30': isFear,
                                        'bg-red-500/30': isDamage,
                                        'bg-white/10': !isCritical && !isHope && !isFear && !isDamage,
                                    }
                                )}>
                                    <Icon size={16} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{characterName}</p>
                                    <p className="text-xs text-gray-400">{data.description || 'rolled dice'}</p>
                                </div>
                            </div>

                            {/* Total and dice breakdown */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Big total */}
                                    <span className={totalClasses}>
                                        {data.total}
                                    </span>

                                    {/* Dice breakdown */}
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1 text-xs text-gray-400 font-mono">
                                            [{data.dice?.join(', ') || '?'}]
                                        </div>
                                        {data.modifier !== 0 && (
                                            <span className="text-xs text-gray-500">
                                                {data.modifier > 0 ? `+${data.modifier}` : data.modifier} modifier
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Roll type badge */}
                                <div className={clsx(
                                    'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide',
                                    {
                                        'bg-green-500/30 text-green-300': isCritical,
                                        'bg-amber-500/30 text-amber-300': isHope,
                                        'bg-purple-500/30 text-purple-300': isFear,
                                        'bg-red-500/30 text-red-300': isDamage,
                                        'bg-white/10 text-gray-300': !isCritical && !isHope && !isFear && !isDamage,
                                    }
                                )}>
                                    {rollTypeLabel}
                                </div>
                            </div>
                        </div>

                        {/* Animated decoration for critical rolls */}
                        {isCritical && (
                            <motion.div
                                className="absolute inset-0 pointer-events-none"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 1.5, repeat: 2 }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/20 to-transparent" />
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default RollNotification;
