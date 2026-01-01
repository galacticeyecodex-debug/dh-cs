'use client';

import { MarkdownText } from '@/components/shared/markdown-text';
import React from 'react';
import { Dices, RotateCcw, Info } from 'lucide-react';
import { useCharacterStore } from '@/store/character-store';
import { toast } from 'sonner';
import { BardRallyDice } from '@/types/character';

interface RallyDiceCardProps {
    rallyDice: BardRallyDice | undefined;
    characterLevel: number;
    description: string;
    onUpdateRallyDice: (dice: BardRallyDice) => void;
}

export default function RallyDiceCard({
    rallyDice,
    characterLevel,
    description,
    onUpdateRallyDice,
}: RallyDiceCardProps) {
    const { prepareRoll } = useCharacterStore();
    const [showInfo, setShowInfo] = React.useState(false);

    // Die size upgrades at level 5
    // SRD: "At level 1... d6. At level 5... d8."
    const dieSize = characterLevel >= 5 ? 'd8' : 'd6';

    // Check if character currently holds a die
    const hasDie = rallyDice?.dice && rallyDice.dice.length > 0 && !rallyDice.dice[0].used;

    const handleRally = () => {
        // "Once per session..."
        // In digital form, we just allow resetting/granting.

        const newDie = {
            id: crypto.randomUUID(),
            value: 0,
            used: false
        };

        // We overwrite existing dice because "At the end of each session, clear all unspent".
        // And "Once per session" implies a refresh.
        onUpdateRallyDice({
            dice: [newDie],
            die_size: dieSize,
            lastRolled: new Date().toISOString()
        });

        toast.success('Rallied the party! You gained a Rally Die.');
    };

    const handleSpend = () => {
        if (!hasDie) return;

        prepareRoll('Rally Die', 0, `1${dieSize}`);

        // Mark as used
        if (rallyDice) {
            const updatedDice = rallyDice.dice.map(d => ({ ...d, used: true }));
            onUpdateRallyDice({
                ...rallyDice,
                dice: updatedDice
            });
        }
    };

    const handleClear = () => {
        onUpdateRallyDice({
            dice: [],
            die_size: dieSize
        });
        toast.success('Rally dice cleared.');
    };

    return (
        <div className="bg-dagger-panel border border-dagger-gold/30 rounded-xl p-4 relative overflow-hidden">
            {/* Gold left border accent */}
            <div className="absolute top-0 left-0 w-1 h-full bg-dagger-gold"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-serif font-bold text-dagger-gold flex items-center gap-2">
                    <Dices size={14} /> Rally
                </h4>
                <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                    <Info size={14} className="text-gray-400" />
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

            <div className="space-y-3">
                {!hasDie ? (
                    <div className="space-y-2">
                        <p className="text-sm text-gray-400 italic">No Rally Die currently held.</p>
                        <button
                            onClick={handleRally}
                            className="w-full py-2.5 bg-dagger-gold/10 hover:bg-dagger-gold/20 border border-dagger-gold/30 text-dagger-gold font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Dices size={16} /> Rally the Party ({dieSize})
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-dagger-gold text-black flex items-center justify-center font-bold text-sm shadow-lg">
                                    {dieSize}
                                </div>
                                <span className="font-bold text-white text-sm">Rally Die Ready</span>
                            </div>
                            <button
                                onClick={handleSpend}
                                className="px-3 py-1.5 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors text-sm"
                            >
                                Roll
                            </button>
                        </div>

                        <div className="flex justify-end">
                            <button onClick={handleClear} className="text-[10px] text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors uppercase font-bold tracking-wider">
                                <RotateCcw size={10} /> Clear Dice
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
