'use client';

/**
 * Broadcast Notification Component
 * ----------------------------------------------------------------------------
 * An enhanced pop-up notification that displays both dice roll results and
 * ability card usage (resource spending) from players in the campaign.
 * 
 * Replaces the original RollNotification to support broader campaign events.
 */

import React from 'react';
import { CampaignActivity, DiceRollActivityData, GmRollActivityData, CardUsedActivityData } from '@/types/activity';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, X, Sparkles, Skull, Wand2, Zap } from '@/lib/icon-utils';
import clsx from 'clsx';
import { AppIcons } from '@/lib/icon-utils';
import { Z_INDEX } from '@/constants/z-index';

interface BroadcastNotificationProps {
    activity: CampaignActivity | null;
    onDismiss: () => void;
    /** Duration in ms before auto-dismiss (0 = no auto-dismiss) */
    autoDismissMs?: number;
}

export function BroadcastNotification({
    activity,
    onDismiss,
    autoDismissMs = 5000,
}: BroadcastNotificationProps) {
    // Auto-dismiss timer
    React.useEffect(() => {
        if (!activity || autoDismissMs === 0) return;

        const timer = setTimeout(() => {
            onDismiss();
        }, autoDismissMs);

        return () => clearTimeout(timer);
    }, [activity, autoDismissMs, onDismiss]);

    if (!activity) return null;
    if (activity.activity_type !== 'dice_roll' && activity.activity_type !== 'card_used') return null;

    const characterName = activity.character_name || 'Someone';

    // --- DICE ROLL DATA ---
    if (activity.activity_type === 'dice_roll') {
        const data = activity.data as DiceRollActivityData | GmRollActivityData;
        const isGmRoll = 'is_gm_roll' in data && data.is_gm_roll;
        const hopeFear = data.hope_fear;

        const isCritical = hopeFear === 'hope' && data.dice?.length >= 2 &&
            data.dice[0] === data.dice[1] && data.dice[0] > 0;
        const isHope = hopeFear === 'hope' && !isCritical;
        const isFear = hopeFear === 'fear';
        const isDamage = data.roll_type === 'damage';

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
            <NotificationPortal onDismiss={onDismiss}>
                <div className={containerClasses}>
                    <DismissButton onDismiss={onDismiss} />
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className={clsx('p-1.5 rounded-lg', {
                                'bg-green-500/30': isCritical,
                                'bg-amber-500/30': isHope,
                                'bg-purple-500/30': isFear,
                                'bg-red-500/30': isDamage,
                                'bg-white/10': !isCritical && !isHope && !isFear && !isDamage,
                            })}>
                                <Icon size={16} className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">{characterName}</p>
                                <p className="text-xs text-gray-400">{data.description || 'rolled dice'}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className={totalClasses}>{data.total}</span>
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
                            <div className={clsx('px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide', {
                                'bg-green-500/30 text-green-300': isCritical,
                                'bg-amber-500/30 text-amber-300': isHope,
                                'bg-purple-500/30 text-purple-300': isFear,
                                'bg-red-500/30 text-red-300': isDamage,
                                'bg-white/10 text-gray-300': !isCritical && !isHope && !isFear && !isDamage,
                            })}>
                                {rollTypeLabel}
                            </div>
                        </div>
                    </div>
                    {isCritical && <CriticalDecoration />}
                </div>
            </NotificationPortal>
        );
    }

    // --- CARD USED DATA ---
    if (activity.activity_type === 'card_used') {
        const data = activity.data as CardUsedActivityData;
        const hasHope = !!data.cost_paid?.hope;
        const hasStress = !!data.cost_paid?.stress;
        const isGain = !!data.gains || !!data.hope_gained;
        const isSpend = !!data.cost_paid;

        const containerClasses = clsx(
            'relative overflow-hidden rounded-2xl shadow-2xl border backdrop-blur-md',
            {
                'bg-gradient-to-br from-emerald-500/20 to-emerald-900/30 border-emerald-500/40': isGain && !isSpend,
                'bg-gradient-to-br from-amber-500/20 to-amber-900/30 border-amber-500/40': isSpend && hasHope && !hasStress,
                'bg-gradient-to-br from-purple-500/20 to-purple-900/30 border-purple-500/40': isSpend && hasStress && !hasHope,
                'bg-gradient-to-br from-purple-500/20 to-amber-900/30 border-dagger-gold/40': isSpend && hasHope && hasStress,
                'bg-gradient-to-br from-gray-500/20 to-gray-900/30 border-gray-500/40': !isSpend && !isGain,
            }
        );

        return (
            <NotificationPortal onDismiss={onDismiss}>
                <div className={containerClasses}>
                    <DismissButton onDismiss={onDismiss} />
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className={clsx('p-1.5 rounded-lg', {
                                'bg-amber-500/30': hasHope,
                                'bg-purple-500/30': hasStress,
                                'bg-white/10': !hasHope && !hasStress,
                            })}>
                                <Wand2 size={16} className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">{characterName}</p>
                                <p className="text-xs text-gray-400">activated an ability</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <h3 className="text-xl font-serif font-bold text-white leading-tight">
                                    {data.card_name}
                                </h3>
                                <div className="flex gap-2 mt-1">
                                    {data.gains?.hope && (
                                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold uppercase">
                                            <Sparkles size={10} />
                                            Gained {data.gains.hope} Hope
                                        </div>
                                    )}
                                    {data.hope_gained && ( // Handle legacy field
                                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold uppercase">
                                            <Sparkles size={10} />
                                            Gained {data.hope_gained} Hope
                                        </div>
                                    )}
                                    {data.gains?.stress && (
                                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold uppercase">
                                            <Zap size={10} />
                                            Cleared {data.gains.stress} Stress
                                        </div>
                                    )}
                                    {data.gains?.hp && (
                                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold uppercase">
                                            <AppIcons.vitals.hitPoints size={10} />
                                            Healed {data.gains.hp} HP
                                        </div>
                                    )}
                                    {data.gains?.armor && (
                                        <div className="flex items-center gap-1 text-sky-400 text-xs font-bold uppercase">
                                            <AppIcons.vitals.armor size={10} />
                                            Restored {data.gains.armor} Armor
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={clsx(
                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                                isGain ? "bg-emerald-500/30 text-emerald-300" : "bg-white/10 text-gray-300"
                            )}>
                                {isGain ? "Resource Gained" : isSpend ? "Resource Spent" : "Ability Used"}
                            </div>
                        </div>
                    </div>
                </div>
            </NotificationPortal>
        );
    }

    return null;
}

/**
 * HELPER COMPONENTS
 */

function NotificationPortal({ children, onDismiss }: { children: React.ReactNode, onDismiss: () => void }) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 1, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm"
                style={{ zIndex: Z_INDEX.TOAST }}
                role="alert"
                aria-live="polite"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

function DismissButton({ onDismiss }: { onDismiss: () => void }) {
    return (
        <button
            onClick={onDismiss}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            style={{ zIndex: Z_INDEX.DECORATIVE }}
            aria-label="Dismiss notification"
        >
            <X size={14} className="text-white/70" />
        </button>
    );
}

function CriticalDecoration() {
    return (
        <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: 2 }}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/20 to-transparent" />
        </motion.div>
    );
}

export default BroadcastNotification;
