'use client';

/**
 * WARRIOR SLAYER DICE CARD
 * ----------------------------------------------------------------------------
 * Interactive card for the Warrior's Call of the Slayer subclass.
 * 
 * FUNCTIONALITY:
 * - Manages a pool of d6 "Slayer Dice" (max = Proficiency).
 * - Allows banking dice on Hope rolls instead of taking Hope.
 * - Allows spending dice on attack/damage rolls to add to the result.
 * - Handles session-based tracking (clear at end of session -> gain Hope).
 */

import { MarkdownText } from '@/components/shared/markdown-text';
import React from 'react';
import { Swords, Plus, Dices, RotateCcw, Info } from 'lucide-react';
import { useCharacterStore } from '@/store/character-store';
import { toast } from 'sonner';
import { WarriorSlayerDice, SlayerDie } from '@/types/character';
import clsx from 'clsx';

interface SlayerDiceCardProps {
    slayerDice: WarriorSlayerDice | undefined;
    proficiency: number;
    description: string;
    onUpdateSlayerDice: (dice: WarriorSlayerDice) => void;
}

export default function SlayerDiceCard({
    slayerDice,
    proficiency,
    description,
    onUpdateSlayerDice,
}: SlayerDiceCardProps) {
    const { prepareRoll } = useCharacterStore();
    const [showInfo, setShowInfo] = React.useState(false);

    const maxDice = proficiency;
    const currentDice = slayerDice?.dice?.filter(d => !d.used) || [];
    const diceCount = currentDice.length;
    const canAddDie = diceCount < maxDice;

    // Add a new Slayer Die to the pool (when rolling with Hope)
    const handleAddDie = () => {
        if (!canAddDie) {
            toast.error(`Maximum of ${maxDice} Slayer Dice (equals Proficiency)`);
            return;
        }

        const newDie: SlayerDie = {
            id: crypto.randomUUID(),
            value: 0, // Value is rolled when spent
            used: false
        };

        const updatedDice = [...currentDice, newDie];
        onUpdateSlayerDice({
            dice: updatedDice,
            lastRolled: new Date().toISOString()
        });

        toast.success('Slayer Die added! (Instead of gaining Hope)');
    };

    // Spend dice from the pool
    const handleSpendDice = (count: number) => {
        if (count > diceCount || count <= 0) return;

        // Prepare the roll
        const diceNotation = `${count}d6`;
        prepareRoll('Slayer Dice', 0, diceNotation);

        // Mark dice as used
        const toSpend = currentDice.slice(0, count);
        const remaining = currentDice.slice(count);
        const spent = toSpend.map(d => ({ ...d, used: true }));

        onUpdateSlayerDice({
            dice: [...remaining, ...spent],
            lastRolled: new Date().toISOString()
        });

        toast.success(`Spent ${count} Slayer ${count === 1 ? 'Die' : 'Dice'}!`);
    };

    // Clear all dice (end of session)
    const handleClearDice = () => {
        const hopeGained = diceCount;
        onUpdateSlayerDice({
            dice: [],
            lastRolled: new Date().toISOString()
        });
        toast.success(`Session ended! Gain ${hopeGained} Hope from unspent Slayer Dice.`);
    };

    return (
        <div className="bg-dagger-panel border border-white/10 rounded-xl p-4 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-serif font-bold text-white flex items-center gap-2">
                    <Swords size={14} className="text-dagger-gold" /> Slayer Dice
                </h4>
                <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    aria-label={showInfo ? "Hide slayer dice info" : "Show slayer dice info"}
                >
                    <Info size={14} className={showInfo ? "text-dagger-gold" : "text-gray-400"} />
                </button>
            </div>

            {/* Info Section */}
            {showInfo && (
                <div className="mb-3 p-3 bg-white/5 rounded-lg border border-white/5 text-xs text-gray-300">
                    <MarkdownText>
                        {description}
                    </MarkdownText>
                </div>
            )}

            <div className="space-y-3">
                {/* Dice Pool Display */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-dagger-gold uppercase font-bold tracking-wider">
                            Pool
                        </span>
                        <span className="text-xs text-gray-400">
                            {diceCount} / {maxDice}
                        </span>
                    </div>

                    {/* Dice Visual */}
                    <div className="flex items-center gap-2 flex-wrap min-h-[2.5rem]">
                        {currentDice.length > 0 ? (
                            currentDice.map((die) => (
                                <div
                                    key={die.id}
                                    className={clsx(
                                        "w-8 h-8 rounded bg-dagger-gold text-black flex items-center justify-center font-bold text-sm shadow-md",
                                        "border border-yellow-600/50"
                                    )}
                                >
                                    d6
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic">No Slayer Dice collected</p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                    {/* Add Die (when rolling with Hope) */}
                    <button
                        onClick={handleAddDie}
                        disabled={!canAddDie}
                        className={clsx(
                            "py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all",
                            canAddDie
                                ? "bg-dagger-gold/10 hover:bg-dagger-gold/20 border border-dagger-gold/30 text-dagger-gold"
                                : "bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed"
                        )}
                    >
                        <Plus size={14} /> Bank Die
                    </button>

                    {/* Spend Die */}
                    <button
                        onClick={() => handleSpendDice(1)}
                        disabled={diceCount === 0}
                        className={clsx(
                            "py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all",
                            diceCount > 0
                                ? "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                                : "bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed"
                        )}
                    >
                        <Dices size={14} /> Spend 1
                    </button>
                </div>

                {/* Spend Multiple */}
                {diceCount > 1 && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Spend multiple:</span>
                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(diceCount, 5) }, (_, i) => i + 2)
                                .filter(n => n <= diceCount)
                                .map(count => (
                                    <button
                                        key={count}
                                        onClick={() => handleSpendDice(count)}
                                        className="px-2 py-1 bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold rounded transition-colors border border-white/5"
                                    >
                                        {count}
                                    </button>
                                ))}
                        </div>
                    </div>
                )}

                {/* Clear (End of Session) */}
                {diceCount > 0 && (
                    <div className="flex justify-end mt-2 pt-2 border-t border-white/5">
                        <button
                            onClick={handleClearDice}
                            className="text-[10px] text-gray-500 hover:text-dagger-gold flex items-center gap-1 transition-colors uppercase font-bold tracking-wider"
                        >
                            <RotateCcw size={10} /> End Session (Gain Hope)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
