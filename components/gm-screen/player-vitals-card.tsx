'use client';

import { Character } from '@/types/character';
import { useCharacterStore } from '@/store/character-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Lock,
    Unlock,
    Heart,
    Brain,
    Shield,
    Sparkles,
    Minus,
    Plus,
    AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerVitalsCardProps {
    character: Character;
}

export function PlayerVitalsCard({ character }: PlayerVitalsCardProps) {
    const { unlockedVitalsCards, toggleVitalsLock, gmAdjustVital } = useCharacterStore();
    const isUnlocked = unlockedVitalsCards.has(character.id);

    // Get vitals from character using the correct Character type structure
    const hitPointsCurrent = character.vitals?.hit_points_current ?? 0;
    const hitPointsMax = character.vitals?.hit_points_max ?? 0;
    const stressCurrent = character.vitals?.stress_current ?? 0;
    const stressMax = character.vitals?.stress_max ?? 6;
    // Armor in Character type is armor_score/armor_slots - for display we'll use armor_slots as "remaining"
    const armorSlots = character.vitals?.armor_slots ?? 0;
    // Hope is at top level in Character
    const hopeCurrent = character.hope ?? 0;
    // Hope max is typically 5 but can be modified
    const hopeMax = 5;

    const vitalsList = [
        {
            id: 'hp' as const,
            label: 'Hit Points',
            icon: Heart,
            current: hitPointsCurrent,
            max: hitPointsMax,
            color: 'text-red-500',
            bgColor: 'bg-red-500',
        },
        {
            id: 'stress' as const,
            label: 'Stress',
            icon: Brain,
            current: stressCurrent,
            max: stressMax,
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500',
            inverse: true, // Lower is better for stress
        },
        {
            id: 'armor' as const,
            label: 'Armor Slots',
            icon: Shield,
            current: armorSlots,
            max: armorSlots, // Armor slots are the available slots
            color: 'text-blue-500',
            bgColor: 'bg-blue-500',
        },
        {
            id: 'hope' as const,
            label: 'Hope',
            icon: Sparkles,
            current: hopeCurrent,
            max: hopeMax,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500',
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

    // Get class/ancestry display names
    const ancestryDisplay = character.ancestry || 'Unknown';
    const classDisplay = character.class_id || 'Unknown';

    return (
        <Card
            className={cn(
                'p-4 transition-all duration-200',
                hasWarning && 'border-orange-500/50 shadow-lg shadow-orange-500/10',
                isUnlocked && 'ring-2 ring-green-500/50'
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold">{character.name}</h3>
                        {hasWarning && (
                            <AlertTriangle
                                className="w-4 h-4 text-orange-500"
                                aria-label="Character needs attention"
                            />
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {ancestryDisplay} {classDisplay} (Lvl {character.level})
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleVitalsLock(character.id)}
                    aria-label={isUnlocked ? 'Lock vitals card' : 'Unlock vitals card'}
                    className={cn(isUnlocked && 'text-green-500 hover:text-green-600')}
                >
                    {isUnlocked ? (
                        <Unlock className="w-4 h-4" />
                    ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                </Button>
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
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-1">
                                    <Icon className={cn('w-4 h-4', vital.color)} aria-hidden="true" />
                                    <span className="font-medium">{vital.label}</span>
                                    {isLow && (
                                        <span className="text-orange-500 ml-1" aria-label="Warning">
                                            ⚠️
                                        </span>
                                    )}
                                </div>
                                <span className="text-muted-foreground tabular-nums">
                                    {vital.current}/{vital.max}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        'h-full transition-all duration-200',
                                        vital.bgColor,
                                        vital.inverse && percentage > 80 && 'bg-red-500'
                                    )}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>

                            {/* Adjustment buttons */}
                            {isUnlocked && (
                                <div className="flex justify-end gap-1 pt-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleVitalChange(vital.id, -5)}
                                        disabled={vital.current < 5}
                                        className="h-7 w-7 p-0 text-xs"
                                        aria-label={`Decrease ${vital.label} by 5`}
                                    >
                                        -5
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleVitalChange(vital.id, -1)}
                                        disabled={vital.current === 0}
                                        className="h-7 w-7 p-0"
                                        aria-label={`Decrease ${vital.label} by 1`}
                                    >
                                        <Minus className="w-3 h-3" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleVitalChange(vital.id, 1)}
                                        disabled={vital.current >= vital.max}
                                        className="h-7 w-7 p-0"
                                        aria-label={`Increase ${vital.label} by 1`}
                                    >
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleVitalChange(vital.id, 5)}
                                        disabled={vital.current >= vital.max - 4}
                                        className="h-7 w-7 p-0 text-xs"
                                        aria-label={`Increase ${vital.label} by 5`}
                                    >
                                        +5
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
