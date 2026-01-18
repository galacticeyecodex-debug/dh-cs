'use client';

/**
 * GM DICE ROLLER MODAL
 * ----------------------------------------------------------------------------
 * Provides a dice rolling interface for the Game Master.
 * 
 * FUNCTIONALITY:
 * - Supports standard dice notation (1d6, 2d12+3, etc.)
 * - Quick presets for common dice (d4, d6, d8, d10, d12, d20)
 * - Toggle between public rolls (visible to players) and hidden rolls (GM only)
 * - Displays last roll result with large, readable display
 * - Animated modal with Daggerheart styling
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dices, EyeOff, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface GmDiceRollerModalProps {
    isOpen: boolean;
    onClose: () => void;
    isPrivate: boolean;
    campaignId: string;
}

// Common dice presets
const DICE_PRESETS = [
    { label: 'd4', formula: '1d4' },
    { label: 'd6', formula: '1d6' },
    { label: 'd8', formula: '1d8' },
    { label: 'd10', formula: '1d10' },
    { label: 'd12', formula: '1d12' },
    { label: 'd20', formula: '1d20' },
    { label: '2d6', formula: '2d6' },
    { label: '2d12', formula: '2d12' },
];

export function GmDiceRollerModal({
    isOpen,
    onClose,
    isPrivate: initialPrivate,
    campaignId,
}: GmDiceRollerModalProps) {
    const [formula, setFormula] = useState('2d6');
    const [isPrivate, setIsPrivate] = useState(initialPrivate);
    const [lastResult, setLastResult] = useState<number | null>(null);

    // Simple dice roller (can be enhanced later)
    const rollDice = (diceFormula: string): number => {
        const match = diceFormula.match(/^(\d+)?d(\d+)([+-]\d+)?$/i);
        if (!match) return 0;

        const count = parseInt(match[1] || '1', 10);
        const sides = parseInt(match[2], 10);
        const modifier = parseInt(match[3] || '0', 10);

        let total = 0;
        for (let i = 0; i < count; i++) {
            total += Math.floor(Math.random() * sides) + 1;
        }
        return total + modifier;
    };

    const handleRoll = async () => {
        const result = rollDice(formula);
        setLastResult(result);

        if (isPrivate) {
            toast.info(`🎲 Hidden Roll: ${formula} = ${result}`, {
                description: 'Only you can see this result',
            });
        } else {
            toast.success(`🎲 Rolled: ${formula} = ${result}`, {
                description: 'This roll will be visible in the activity feed',
            });
        }

        // TODO Phase 3: Actually log to activity feed
    };

    const handleClose = () => {
        onClose();
        setLastResult(null);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={handleClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-md bg-dagger-panel border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Dices size={20} className="text-purple-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">
                                {initialPrivate ? 'Hidden Roll' : 'Dice Roller'}
                            </h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            aria-label="Close dice roller"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        {/* Formula input */}
                        <div>
                            <label htmlFor="dice-formula" className="block text-sm font-medium text-gray-300 mb-2">
                                Dice Formula
                            </label>
                            <input
                                id="dice-formula"
                                type="text"
                                value={formula}
                                onChange={(e) => setFormula(e.target.value)}
                                placeholder="2d6+3"
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white text-lg font-mono placeholder:text-gray-500 focus:outline-none focus:border-dagger-gold/50 transition-colors"
                            />
                        </div>

                        {/* Quick presets */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Quick Dice</label>
                            <div className="grid grid-cols-4 gap-2">
                                {DICE_PRESETS.map((preset) => (
                                    <button
                                        key={preset.formula}
                                        onClick={() => setFormula(preset.formula)}
                                        className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-mono text-white transition-colors"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Privacy toggle */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsPrivate(true)}
                                className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${isPrivate
                                    ? 'bg-purple-500/30 border border-purple-500/50 text-purple-300'
                                    : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <EyeOff size={16} />
                                Hidden
                            </button>
                            <button
                                onClick={() => setIsPrivate(false)}
                                className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${!isPrivate
                                    ? 'bg-blue-500/30 border border-blue-500/50 text-blue-300'
                                    : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <Eye size={16} />
                                Public
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 text-center">
                            {isPrivate
                                ? 'Only you will see the result'
                                : 'All players will see this roll in the activity feed'}
                        </p>

                        {/* Last result display */}
                        {lastResult !== null && (
                            <div className="text-center py-6 bg-black/30 rounded-lg border border-white/10">
                                <p className="text-sm text-gray-500 mb-1">Result</p>
                                <p className="text-5xl font-bold text-white tabular-nums">{lastResult}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 p-6 border-t border-white/5">
                        <button
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={handleRoll}
                            className="flex-1 px-4 py-2 text-sm font-bold bg-dagger-gold hover:bg-dagger-gold-light text-black rounded-lg transition-colors"
                        >
                            🎲 Roll
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
