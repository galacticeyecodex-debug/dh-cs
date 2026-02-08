'use client';

/**
 * COUNTDOWN CREATOR MODAL
 * ----------------------------------------------------------------------------
 * Allows the GM to create new countdown trackers for the campaign.
 *
 * COUNTDOWN TYPES (per SRD):
 * - Standard: Advances by 1 every action roll
 * - Progress: Dynamic countdown to positive effect (advances 0-3 based on roll)
 * - Consequence: Dynamic countdown to negative effect (advances 0-3 based on roll)
 * - Loop: Resets to starting value after triggering
 * - Long-term: Advances on rests, not action rolls
 *
 * FEATURES:
 * - Name and description input
 * - Starting value selection (1-10 or custom)
 * - Type selection with descriptions
 * - Public/Private visibility toggle
 * - Loop option for repeating countdowns
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Timer, Eye, EyeOff, RefreshCw, Info } from 'lucide-react';
import { CountdownType, CountdownInsert } from '@/types/campaign';
import clsx from 'clsx';
import { Z_INDEX } from '@/constants/z-index';

interface CountdownCreatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (countdown: CountdownInsert) => Promise<void>;
}

const COUNTDOWN_TYPES: { type: CountdownType; label: string; description: string; color: string }[] = [
    {
        type: 'standard',
        label: 'Standard',
        description: 'Advances by 1 every action roll',
        color: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    },
    {
        type: 'progress',
        label: 'Progress',
        description: 'Positive effect, advances 0-3 based on roll outcome',
        color: 'bg-green-500/20 border-green-500/50 text-green-400',
    },
    {
        type: 'consequence',
        label: 'Consequence',
        description: 'Negative effect, advances 0-3 based on roll outcome',
        color: 'bg-red-500/20 border-red-500/50 text-red-400',
    },
    {
        type: 'loop',
        label: 'Loop',
        description: 'Resets to starting value after triggering',
        color: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
    },
    {
        type: 'long_term',
        label: 'Long-term',
        description: 'Advances on rests, not action rolls',
        color: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
    },
];

const PRESET_VALUES = [3, 4, 5, 6, 8, 10];

export function CountdownCreatorModal({ isOpen, onClose, onSubmit }: CountdownCreatorModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<CountdownType>('standard');
    const [startingValue, setStartingValue] = useState(5);
    const [customValue, setCustomValue] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [isLooping, setIsLooping] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            const countdown: CountdownInsert = {
                name: name.trim(),
                description: description.trim() || undefined,
                type,
                starting_value: customValue ? parseInt(customValue) : startingValue,
                is_public: isPublic,
                is_looping: type === 'loop' || isLooping,
            };

            await onSubmit(countdown);
            handleClose();
        } catch {
            // Error handling done in parent
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setName('');
        setDescription('');
        setType('standard');
        setStartingValue(5);
        setCustomValue('');
        setIsPublic(true);
        setIsLooping(false);
        onClose();
    };

    const handleValueChange = (value: number) => {
        setStartingValue(value);
        setCustomValue('');
    };

    const handleCustomValueChange = (value: string) => {
        setCustomValue(value);
        const num = parseInt(value);
        if (!isNaN(num) && num > 0) {
            setStartingValue(num);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div 
                className="fixed inset-0 flex items-center justify-center p-4"
                style={{ zIndex: Z_INDEX.TOAST }}
            >
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
                    className="relative w-full max-w-lg bg-dagger-panel border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                <Timer size={20} className="text-amber-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Create Countdown</h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            disabled={isSubmitting}
                            aria-label="Close"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-5 overflow-y-auto flex-1">
                        {/* Name */}
                        <div>
                            <label htmlFor="countdown-name" className="block text-sm font-medium text-gray-300 mb-2">
                                Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="countdown-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Ritual Completion, Reinforcements Arrive"
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-dagger-gold/50 transition-colors"
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="countdown-description" className="block text-sm font-medium text-gray-300 mb-2">
                                Description (optional)
                            </label>
                            <textarea
                                id="countdown-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What happens when this countdown triggers?"
                                rows={2}
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-dagger-gold/50 transition-colors resize-none"
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Type Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Type
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {COUNTDOWN_TYPES.map((ct) => (
                                    <button
                                        key={ct.type}
                                        onClick={() => setType(ct.type)}
                                        className={clsx(
                                            "flex items-start gap-3 p-3 rounded-lg border transition-all text-left",
                                            type === ct.type
                                                ? ct.color
                                                : "bg-white/5 border-white/10 hover:bg-white/10"
                                        )}
                                        disabled={isSubmitting}
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium text-white">{ct.label}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{ct.description}</div>
                                        </div>
                                        {type === ct.type && (
                                            <div className="w-2 h-2 rounded-full bg-current mt-2" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Starting Value */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Starting Value
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {PRESET_VALUES.map((value) => (
                                    <button
                                        key={value}
                                        onClick={() => handleValueChange(value)}
                                        className={clsx(
                                            "px-4 py-2 rounded-lg border font-medium transition-colors",
                                            startingValue === value && !customValue
                                                ? "bg-dagger-gold/20 border-dagger-gold text-dagger-gold"
                                                : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                                        )}
                                        disabled={isSubmitting}
                                    >
                                        {value}
                                    </button>
                                ))}
                                <input
                                    type="number"
                                    value={customValue}
                                    onChange={(e) => handleCustomValueChange(e.target.value)}
                                    placeholder="Custom"
                                    min={1}
                                    max={99}
                                    className={clsx(
                                        "w-20 px-3 py-2 rounded-lg border font-medium text-center transition-colors",
                                        customValue
                                            ? "bg-dagger-gold/20 border-dagger-gold text-dagger-gold"
                                            : "bg-white/5 border-white/10 text-gray-300"
                                    )}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Options */}
                        <div className="flex flex-col gap-3">
                            {/* Visibility */}
                            <button
                                onClick={() => setIsPublic(!isPublic)}
                                className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                                disabled={isSubmitting}
                            >
                                <div className="flex items-center gap-3">
                                    {isPublic ? (
                                        <Eye size={18} className="text-blue-400" />
                                    ) : (
                                        <EyeOff size={18} className="text-purple-400" />
                                    )}
                                    <div className="text-left">
                                        <div className="font-medium text-white">
                                            {isPublic ? 'Public' : 'Hidden'}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {isPublic ? 'Players can see this countdown' : 'Only visible to GM'}
                                        </div>
                                    </div>
                                </div>
                                <div className={clsx(
                                    "w-10 h-6 rounded-full transition-colors relative",
                                    isPublic ? "bg-blue-500" : "bg-gray-600"
                                )}>
                                    <div className={clsx(
                                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                                        isPublic ? "translate-x-5" : "translate-x-1"
                                    )} />
                                </div>
                            </button>

                            {/* Looping (only show if not already a loop type) */}
                            {type !== 'loop' && (
                                <button
                                    onClick={() => setIsLooping(!isLooping)}
                                    className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    <div className="flex items-center gap-3">
                                        <RefreshCw size={18} className={isLooping ? "text-purple-400" : "text-gray-500"} />
                                        <div className="text-left">
                                            <div className="font-medium text-white">Looping</div>
                                            <div className="text-xs text-gray-400">
                                                Reset to starting value after triggering
                                            </div>
                                        </div>
                                    </div>
                                    <div className={clsx(
                                        "w-10 h-6 rounded-full transition-colors relative",
                                        isLooping ? "bg-purple-500" : "bg-gray-600"
                                    )}>
                                        <div className={clsx(
                                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                                            isLooping ? "translate-x-5" : "translate-x-1"
                                        )} />
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* Info Box */}
                        <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-blue-300">
                                {type === 'progress' || type === 'consequence'
                                    ? "Dynamic countdowns advance based on roll outcomes: Critical (3), Success+Hope (2/0), Success+Fear (1/1), Failure+Hope (0/2), Failure+Fear (0/3)"
                                    : type === 'long_term'
                                        ? "Long-term countdowns advance when the party takes a rest, not on action rolls."
                                        : "Standard countdowns tick down by 1 every time a player makes an action roll."
                                }
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 p-6 border-t border-white/5">
                        <button
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!name.trim() || isSubmitting}
                            className="flex-1 px-4 py-2 text-sm font-bold bg-dagger-gold hover:bg-dagger-gold-light text-black rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Timer size={16} />
                            {isSubmitting ? 'Creating...' : 'Create Countdown'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
