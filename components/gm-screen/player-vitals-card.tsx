'use client';

/**
 * PLAYER VITALS CARD
 * ----------------------------------------------------------------------------
 * Displays a single player character's vitals on the GM Screen with icon tracks.
 *
 * FUNCTIONALITY:
 * - Shows character name, class, level, and ancestry
 * - Displays HP, Stress, Armor, and Hope with visual icon tracks (like character sheet)
 * - Locked by default - GM must unlock to make adjustments
 * - Warning indicators for low HP, high stress, or low hope
 * - Clear/Mark buttons for adjusting vitals when unlocked
 *
 * TRACK SEMANTICS (matches VitalCard):
 * - HP (mark-bad): current = remaining capacity, marking decreases it
 * - Armor (mark-bad): current = available slots, marking uses them
 * - Stress (fill-up-bad): current = accumulated stress, marking increases it
 * - Hope (fill-up-good): current = available hope, spending decreases it
 */

import { Character } from '@/types/character';
import { useCharacterStore } from '@/store/character-store';
import {
    Lock,
    Unlock,
    Heart,
    Zap,
    Shield,
    AlertTriangle,
    Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

interface PlayerVitalsCardProps {
    character: Character;
}

type TrackType = 'mark-bad' | 'fill-up-bad' | 'fill-up-good';

interface VitalConfig {
    id: 'hp' | 'stress' | 'armor' | 'hope';
    label: string;
    icon: React.ElementType;
    current: number;
    max: number;
    color: string;
    strokeColor?: string;
    trackType: TrackType;
}

export function PlayerVitalsCard({ character }: PlayerVitalsCardProps) {
    const { unlockedVitalsCards, toggleVitalsLock, gmAdjustVital } = useCharacterStore();
    const isUnlocked = unlockedVitalsCards.has(character.id);

    // Get vitals from character
    const hitPointsCurrent = character.vitals?.hit_points_current ?? 0;
    const hitPointsMax = character.vitals?.hit_points_max ?? 0;
    const stressCurrent = character.vitals?.stress_current ?? 0;
    const stressMax = character.vitals?.stress_max ?? 6;
    const armorSlots = character.vitals?.armor_slots ?? 0;
    const armorMax = character.vitals?.armor_score ?? 0; // armor_score is the max, armor_slots is current
    const hopeCurrent = character.hope ?? 0;
    const hopeMax = 5;

    const vitalsList: VitalConfig[] = [
        {
            id: 'hp',
            label: 'HP',
            icon: Heart,
            current: hitPointsCurrent,
            max: hitPointsMax,
            color: 'text-red-400',
            strokeColor: 'stroke-red-900',
            trackType: 'mark-bad',
        },
        {
            id: 'stress',
            label: 'Stress',
            icon: Zap,
            current: stressCurrent,
            max: stressMax,
            color: 'text-purple-400',
            strokeColor: 'stroke-purple-900',
            trackType: 'fill-up-bad',
        },
        {
            id: 'armor',
            label: 'Armor',
            icon: Shield,
            current: armorSlots,
            max: armorMax,
            color: 'text-blue-400',
            strokeColor: 'stroke-blue-900',
            trackType: 'mark-bad',
        },
        {
            id: 'hope',
            label: 'Hope',
            icon: Sparkles,
            current: hopeCurrent,
            max: hopeMax,
            color: 'text-dagger-gold',
            strokeColor: 'stroke-amber-900',
            trackType: 'fill-up-good',
        },
    ];

    // Handle vital changes based on track type semantics
    const handleVitalChange = async (
        vital: VitalConfig,
        action: 'clear' | 'mark' | 'spend' | 'gain'
    ) => {
        let newValue: number;

        switch (vital.trackType) {
            case 'mark-bad':
                // HP/Armor: current = capacity remaining
                // Clear = restore 1, Mark = lose 1
                if (action === 'clear') {
                    newValue = Math.min(vital.max, vital.current + 1);
                } else {
                    newValue = Math.max(0, vital.current - 1);
                }
                break;
            case 'fill-up-bad':
                // Stress: current = accumulated
                // Clear = remove 1, Mark = add 1
                if (action === 'clear') {
                    newValue = Math.max(0, vital.current - 1);
                } else {
                    newValue = Math.min(vital.max, vital.current + 1);
                }
                break;
            case 'fill-up-good':
                // Hope: current = available
                // Spend = use 1, Gain = add 1
                if (action === 'spend') {
                    newValue = Math.max(0, vital.current - 1);
                } else {
                    newValue = Math.min(vital.max, vital.current + 1);
                }
                break;
            default:
                return;
        }

        await gmAdjustVital(character.id, vital.id, newValue);
    };

    // Render icon track for a vital
    const renderTrack = (vital: VitalConfig) => {
        if (vital.max <= 0) return null;

        const Icon = vital.icon;
        const icons = [];

        // Determine how many are "filled" based on track type
        let filledCount: number;
        if (vital.trackType === 'fill-up-good' || vital.trackType === 'fill-up-bad') {
            // Fill-up: current represents filled icons
            filledCount = vital.current;
        } else {
            // Mark-bad: current is capacity remaining, so filled = max - current (marked/lost)
            filledCount = Math.max(0, vital.max - vital.current);
        }

        // Determine if track is in a "bad" state
        const isFullBad = vital.trackType === 'fill-up-bad' && filledCount >= vital.max;
        const isEmptyBad = vital.trackType === 'mark-bad' && vital.current === 0;
        const isCritical = isFullBad || isEmptyBad;

        for (let i = 0; i < vital.max; i++) {
            const isFilled = i < filledCount;
            const iconColor = isCritical ? 'text-red-500' : vital.color;

            icons.push(
                <Icon
                    key={i}
                    size={14}
                    className={clsx(
                        'transition-all duration-200',
                        isFilled
                            ? clsx(iconColor, 'scale-100', vital.strokeColor)
                            : 'text-white/10 scale-90'
                    )}
                    fill={isFilled ? 'currentColor' : 'none'}
                />
            );
        }

        return (
            <div className="flex flex-wrap gap-0.5">
                {icons}
            </div>
        );
    };

    // Get button labels based on track type
    const getButtonLabels = (trackType: TrackType): { decrease: string; increase: string } => {
        switch (trackType) {
            case 'mark-bad':
                return { decrease: 'Mark', increase: 'Clear' };
            case 'fill-up-bad':
                return { decrease: 'Clear', increase: 'Mark' };
            case 'fill-up-good':
                return { decrease: 'Spend', increase: 'Gain' };
        }
    };

    // Check if buttons should be disabled
    const isDecreaseDisabled = (vital: VitalConfig): boolean => {
        switch (vital.trackType) {
            case 'mark-bad':
                return vital.current === 0; // Can't mark if already at 0
            case 'fill-up-bad':
                return vital.current === 0; // Can't clear if no stress
            case 'fill-up-good':
                return vital.current === 0; // Can't spend if no hope
        }
    };

    const isIncreaseDisabled = (vital: VitalConfig): boolean => {
        switch (vital.trackType) {
            case 'mark-bad':
                return vital.current >= vital.max; // Can't clear if already full
            case 'fill-up-bad':
                return vital.current >= vital.max; // Can't mark if stress is maxed
            case 'fill-up-good':
                return vital.current >= vital.max; // Can't gain if hope is maxed
        }
    };

    // Warning thresholds
    const isHpLow = hitPointsMax > 0 && hitPointsCurrent <= Math.ceil(hitPointsMax * 0.33);
    const isStressHigh = stressMax > 0 && stressCurrent >= stressMax - 1;
    const isHopeLow = hopeCurrent <= 1;
    const hasWarning = isHpLow || isStressHigh || isHopeLow;

    // Display names
    const ancestryDisplay = character.ancestry || 'Unknown';
    const classDisplay = character.class_id || 'Unknown';

    return (
        <div
            className={clsx(
                'bg-dagger-panel border rounded-xl p-4 transition-all duration-200',
                hasWarning ? 'border-orange-500/50 shadow-lg shadow-orange-500/10' : 'border-white/10',
                isUnlocked && 'ring-2 ring-green-500/50'
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-serif font-bold text-white truncate">{character.name}</h3>
                        {hasWarning && (
                            <AlertTriangle
                                className="w-4 h-4 text-orange-500 flex-shrink-0"
                                aria-label="Character needs attention"
                            />
                        )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                        {ancestryDisplay} {classDisplay} (Lvl {character.level})
                    </p>
                </div>
                <button
                    onClick={() => toggleVitalsLock(character.id)}
                    className={clsx(
                        'p-2 rounded-lg transition-colors',
                        isUnlocked
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-white/5 text-gray-500 hover:bg-white/10'
                    )}
                    aria-label={isUnlocked ? 'Lock vitals card' : 'Unlock vitals card'}
                >
                    {isUnlocked ? (
                        <Unlock className="w-4 h-4" />
                    ) : (
                        <Lock className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Vitals Grid - 2x2 layout */}
            <div className="grid grid-cols-2 gap-3">
                {vitalsList.map((vital) => {
                    const Icon = vital.icon;
                    const buttonLabels = getButtonLabels(vital.trackType);
                    const isLow =
                        (vital.id === 'hp' && isHpLow) ||
                        (vital.id === 'stress' && isStressHigh) ||
                        (vital.id === 'hope' && isHopeLow);

                    return (
                        <div
                            key={vital.id}
                            className={clsx(
                                'bg-black/20 rounded-lg p-2',
                                isLow && 'ring-1 ring-orange-500/50'
                            )}
                        >
                            {/* Vital Header */}
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1">
                                    <Icon size={12} className={vital.color} />
                                    <span className={clsx('text-[10px] font-bold uppercase tracking-wide', vital.color)}>
                                        {vital.label}
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-500 tabular-nums">
                                    {vital.current}/{vital.max}
                                </span>
                            </div>

                            {/* Icon Track */}
                            <div className="min-h-[18px] mb-1.5">
                                {vital.max > 0 ? renderTrack(vital) : (
                                    <span className="text-[10px] text-gray-600 italic">None</span>
                                )}
                            </div>

                            {/* Action Buttons (only when unlocked) */}
                            {isUnlocked && vital.max > 0 && (
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleVitalChange(
                                            vital,
                                            vital.trackType === 'fill-up-good' ? 'spend' : 'mark'
                                        )}
                                        disabled={isDecreaseDisabled(vital)}
                                        className="flex-1 h-5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded text-[9px] font-bold uppercase tracking-wider text-gray-400 transition-colors"
                                        aria-label={`${buttonLabels.decrease} ${vital.label}`}
                                    >
                                        {buttonLabels.decrease}
                                    </button>
                                    <button
                                        onClick={() => handleVitalChange(
                                            vital,
                                            vital.trackType === 'fill-up-good' ? 'gain' : 'clear'
                                        )}
                                        disabled={isIncreaseDisabled(vital)}
                                        className="flex-1 h-5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded text-[9px] font-bold uppercase tracking-wider text-gray-400 transition-colors"
                                        aria-label={`${buttonLabels.increase} ${vital.label}`}
                                    >
                                        {buttonLabels.increase}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
