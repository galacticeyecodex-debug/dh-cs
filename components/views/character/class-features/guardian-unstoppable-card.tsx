'use client';

import { MarkdownText } from '@/components/shared/markdown-text';
import React from 'react';
import { AppIcons } from '@/lib/icon-utils';
import { GuardianUnstoppable } from '@/types/character';
import { toast } from 'sonner';
import clsx from 'clsx';

interface UnstoppableCardProps {
    unstoppable: GuardianUnstoppable | undefined;
    characterLevel: number;
    description: string;
    onUpdateUnstoppable: (data: GuardianUnstoppable) => void;
}

export default function UnstoppableCard({
    unstoppable,
    characterLevel,
    description,
    onUpdateUnstoppable,
}: UnstoppableCardProps) {
    const [showInfo, setShowInfo] = React.useState(false);

    // Die size: d4 at level 1, d6 at level 5
    const maxDieValue = characterLevel >= 5 ? 6 : 4;
    const dieSizeLabel = `d${maxDieValue}`;

    const isActive = unstoppable?.is_active || false;
    const currentValue = unstoppable?.current_value || 1;

    const handleStart = () => {
        onUpdateUnstoppable({
            is_active: true,
            current_value: 1,
            die_size: characterLevel >= 5 ? 'd6' : 'd4',
            start_value: 1
        });
        toast.success('You are now Unstoppable!');
    };

    const handleIncrease = () => {
        // "When the die's value would exceed its maximum value... remove the die and drop out"
        if (currentValue >= maxDieValue) {
            handleEnd();
            toast.info('Unstoppable die exceeded max value. Effect ended.');
        } else {
            onUpdateUnstoppable({
                ...unstoppable!,
                current_value: currentValue + 1
            });
        }
    };

    const handleEnd = () => {
        onUpdateUnstoppable({
            is_active: false,
            current_value: 1, // Reset to 1 for next time
            die_size: characterLevel >= 5 ? 'd6' : 'd4',
            start_value: 1
        });
    };

    return (
        <div className={clsx(
            "bg-dagger-panel border rounded-xl p-4 relative overflow-hidden transition-colors",
            isActive ? "border-dagger-gold/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]" : "border-dagger-gold/30"
        )}>
            {/* Left border accent - Gold if active, grey if not */}
            <div className={clsx(
                "absolute top-0 left-0 w-1 h-full transition-colors",
                isActive ? "bg-dagger-gold" : "bg-gray-600"
            )}></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h4 className={clsx("font-serif font-bold flex items-center gap-2", isActive ? "text-dagger-gold" : "text-gray-400")}>
                    <AppIcons.vitals.armor size={14} /> Unstoppable
                </h4>
                <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                    <AppIcons.ui.info size={14} className={showInfo ? "text-dagger-gold" : "text-gray-400"} />
                </button>
            </div>

            {/* Info Section */}
            {showInfo && (
                <div className="mb-3 p-3 bg-white/5 rounded-lg border border-white/5 text-xs text-gray-400">
                    <MarkdownText>
                        {description}
                    </MarkdownText>
                </div>
            )}

            {/* Active State UI */}
            {isActive ? (
                <div className="space-y-4">
                    {/* Main Counter Display */}
                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-4 border border-dagger-gold/20">
                        <div>
                            <div className="text-xs text-dagger-gold font-bold uppercase tracking-wider mb-1">Current Bonus</div>
                            <div className="text-3xl font-serif font-bold text-white">+{currentValue}</div>
                            <div className="text-[10px] text-gray-500">Max: {maxDieValue}</div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleIncrease}
                                className="flex items-center gap-2 px-4 py-2 bg-dagger-gold text-black font-bold rounded-lg hover:bg-white transition-colors"
                            >
                                <AppIcons.ui.collapse size={16} />
                                Scored Hit
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center px-1">
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                            <AppIcons.vitals.armor size={12} className="text-blue-400" /> Reduce Phys. Damage
                        </div>
                        <button
                            onClick={handleEnd}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-bold uppercase tracking-wider"
                        >
                            <AppIcons.ui.close size={12} /> End Effect
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="text-sm text-gray-400 italic">
                        Feature available (Once per Long Rest)
                    </div>
                    <button
                        onClick={handleStart}
                        className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 hover:border-dagger-gold/50 hover:text-dagger-gold"
                    >
                        <AppIcons.vitals.armor size={16} /> Become Unstoppable ({dieSizeLabel})
                    </button>
                </div>
            )}
        </div>
    );
}
