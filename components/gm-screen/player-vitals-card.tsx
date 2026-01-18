'use client';

/**
 * PLAYER VITALS CARD
 * ----------------------------------------------------------------------------
 * Displays a single player character's vitals on the GM Screen.
 * 
 * FUNCTIONALITY:
 * - Shows character name, class, level, and ancestry
 * - Displays HP, Stress, Armor, and Hope with visual progress bars
 * - Locked by default - GM must unlock to make adjustments
 * - Warning indicators for low HP, high stress, or low hope
 * - Quick +/- buttons for adjusting vitals when unlocked
 */

import { Character } from '@/types/character';
import { useCharacterStore } from '@/store/character-store';
import {
    Lock,
    Unlock,
    Heart,
    Zap,
    Shield,
    Minus,
    Plus,
    AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';

interface PlayerVitalsCardProps {
    character: Character;
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
    const hopeCurrent = character.hope ?? 0;
    const hopeMax = 5;

    const vitalsList = [
        {
            id: 'armor' as const,
            label: 'Armor',
            icon: Shield,
            current: armorSlots,
            max: armorSlots,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500',
            bgLight: 'bg-blue-500/20',
        },
        {
            id: 'hp' as const,
            label: 'HP',
            icon: Heart,
            current: hitPointsCurrent,
            max: hitPointsMax,
            color: 'text-red-400',
            bgColor: 'bg-red-500',
            bgLight: 'bg-red-500/20',
        },
        {
            id: 'stress' as const,
            label: 'Stress',
            icon: Zap,
            current: stressCurrent,
            max: stressMax,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500',
            bgLight: 'bg-purple-500/20',
            inverse: true,
        },
        {
            id: 'hope' as const,
            label: 'Hope',
            icon: Zap,
            current: hopeCurrent,
            max: hopeMax,
            color: 'text-dagger-gold',
            bgColor: 'bg-dagger-gold',
            bgLight: 'bg-dagger-gold/20',
        },
    ];

    const handleVitalChange = async (
        vital: 'hp' | 'stress' | 'armor' | 'hope',
        delta: number
    ) => {
        const vitalData = vitalsList.find((v) => v.id === vital);
        if (!vitalData) return;

        const newValue = Math.max(0, Math.min(vitalData.max, vitalData.current + delta));
        await gmAdjustVital(character.id, vital, newValue);
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
            <div className="flex items-start justify-between mb-4">
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

            {/* Vitals */}
            <div className="space-y-3">
                {vitalsList.map((vital) => {
                    const percentage = vital.max > 0 ? (vital.current / vital.max) * 100 : 0;
                    const Icon = vital.icon;
                    const isLow =
                        (vital.id === 'hp' && isHpLow) ||
                        (vital.id === 'stress' && isStressHigh) ||
                        (vital.id === 'hope' && isHopeLow);

                    return (
                        <div key={vital.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                    <Icon className={clsx('w-3.5 h-3.5', vital.color)} aria-hidden="true" />
                                    <span className="font-medium text-gray-300">{vital.label}</span>
                                    {isLow && (
                                        <span className="text-orange-500" aria-label="Warning">
                                            ⚠️
                                        </span>
                                    )}
                                </div>
                                <span className="text-gray-500 tabular-nums font-medium">
                                    {vital.current}/{vital.max}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                                <div
                                    className={clsx(
                                        'h-full transition-all duration-200 rounded-full',
                                        vital.bgColor,
                                        vital.inverse && percentage > 80 && 'bg-red-500'
                                    )}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>

                            {/* Adjustment buttons */}
                            {isUnlocked && (
                                <div className="flex justify-end gap-1 pt-1">
                                    <button
                                        onClick={() => handleVitalChange(vital.id, -5)}
                                        disabled={vital.current < 5}
                                        className="h-6 w-6 flex items-center justify-center text-[10px] font-bold bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-white/10 text-gray-400 transition-colors"
                                        aria-label={`Decrease ${vital.label} by 5`}
                                    >
                                        -5
                                    </button>
                                    <button
                                        onClick={() => handleVitalChange(vital.id, -1)}
                                        disabled={vital.current === 0}
                                        className="h-6 w-6 flex items-center justify-center bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-white/10 text-gray-400 transition-colors"
                                        aria-label={`Decrease ${vital.label} by 1`}
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => handleVitalChange(vital.id, 1)}
                                        disabled={vital.current >= vital.max}
                                        className="h-6 w-6 flex items-center justify-center bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-white/10 text-gray-400 transition-colors"
                                        aria-label={`Increase ${vital.label} by 1`}
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => handleVitalChange(vital.id, 5)}
                                        disabled={vital.current >= vital.max - 4}
                                        className="h-6 w-6 flex items-center justify-center text-[10px] font-bold bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-white/10 text-gray-400 transition-colors"
                                        aria-label={`Increase ${vital.label} by 5`}
                                    >
                                        +5
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
