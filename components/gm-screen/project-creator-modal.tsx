'use client';

/**
 * PROJECT CREATOR MODAL
 * ----------------------------------------------------------------------------
 * Allows the GM to create new player projects from the Downtime mechanic.
 *
 * PER SRD (Downtime - Work on a Project):
 * "With GM approval, a PC may pursue a long-term project, such as deciphering
 * an ancient text or crafting a new weapon. The first time they start a new
 * project, assign it a countdown. Each time a PC makes the Work on a Project
 * move, they either advance their project's countdown automatically or make
 * an action roll to advance it (GM's choice)."
 *
 * FEATURES:
 * - Assign project to a specific character
 * - Name and description input
 * - Starting countdown value selection
 * - Advancement type: auto (always advances) or roll (requires action roll)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hammer, User, Info } from 'lucide-react';
import { ProjectInsert, ProjectAdvancementType } from '@/types/campaign';
import { Character } from '@/types/character';
import clsx from 'clsx';

interface ProjectCreatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (project: ProjectInsert) => Promise<void>;
    partyCharacters: Character[];
}

const PRESET_VALUES = [3, 4, 5, 6, 8, 10];

const ADVANCEMENT_TYPES: { type: ProjectAdvancementType; label: string; description: string }[] = [
    {
        type: 'auto',
        label: 'Automatic',
        description: 'Project advances automatically each time they work on it',
    },
    {
        type: 'roll',
        label: 'Requires Roll',
        description: 'Player must make an action roll to advance the project',
    },
];

export function ProjectCreatorModal({
    isOpen,
    onClose,
    onSubmit,
    partyCharacters,
}: ProjectCreatorModalProps) {
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startingValue, setStartingValue] = useState(5);
    const [customValue, setCustomValue] = useState('');
    const [advancementType, setAdvancementType] = useState<ProjectAdvancementType>('auto');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim() || !selectedCharacter) return;

        setIsSubmitting(true);
        try {
            const project: ProjectInsert = {
                character_id: selectedCharacter.id,
                character_name: selectedCharacter.name,
                name: name.trim(),
                description: description.trim() || undefined,
                starting_value: customValue ? parseInt(customValue) : startingValue,
                advancement_type: advancementType,
                status: 'active',
            };

            await onSubmit(project);
            handleClose();
        } catch {
            // Error handling done in parent
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedCharacter(null);
        setName('');
        setDescription('');
        setStartingValue(5);
        setCustomValue('');
        setAdvancementType('auto');
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
                    className="relative w-full max-w-lg bg-dagger-panel border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/20 rounded-lg">
                                <Hammer size={20} className="text-orange-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Create Project</h2>
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
                        {/* Character Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Assign to Character <span className="text-red-400">*</span>
                            </label>
                            {partyCharacters.length === 0 ? (
                                <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-center">
                                    <User size={24} className="mx-auto mb-2 text-gray-500" />
                                    <p className="text-sm text-gray-400">No party members available</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {partyCharacters.map((char) => (
                                        <button
                                            key={char.id}
                                            onClick={() => setSelectedCharacter(char)}
                                            className={clsx(
                                                "flex items-center gap-2 p-3 rounded-lg border transition-all text-left",
                                                selectedCharacter?.id === char.id
                                                    ? "bg-dagger-gold/20 border-dagger-gold"
                                                    : "bg-white/5 border-white/10 hover:bg-white/10"
                                            )}
                                            disabled={isSubmitting}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                <User size={14} className="text-gray-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-white text-sm truncate">
                                                    {char.name}
                                                </div>
                                                <div className="text-[10px] text-gray-400 truncate">
                                                    Lvl {char.level} {char.class_id}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Name */}
                        <div>
                            <label htmlFor="project-name" className="block text-sm font-medium text-gray-300 mb-2">
                                Project Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="project-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Deciphering the Ancient Tome, Crafting a Magic Sword"
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-dagger-gold/50 transition-colors"
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="project-description" className="block text-sm font-medium text-gray-300 mb-2">
                                Description (optional)
                            </label>
                            <textarea
                                id="project-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What is the character working on? What's the goal?"
                                rows={2}
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-dagger-gold/50 transition-colors resize-none"
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Starting Value */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Countdown Value
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Number of successful advances needed to complete the project
                            </p>
                            <div className="flex flex-wrap gap-2">
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

                        {/* Advancement Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Advancement Type
                            </label>
                            <div className="space-y-2">
                                {ADVANCEMENT_TYPES.map((at) => (
                                    <button
                                        key={at.type}
                                        onClick={() => setAdvancementType(at.type)}
                                        className={clsx(
                                            "w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left",
                                            advancementType === at.type
                                                ? "bg-orange-500/10 border-orange-500/50"
                                                : "bg-white/5 border-white/10 hover:bg-white/10"
                                        )}
                                        disabled={isSubmitting}
                                    >
                                        <div className={clsx(
                                            "w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center",
                                            advancementType === at.type
                                                ? "border-orange-400"
                                                : "border-gray-500"
                                        )}>
                                            {advancementType === at.type && (
                                                <div className="w-2 h-2 rounded-full bg-orange-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-white">{at.label}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{at.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-blue-300">
                                Projects are advanced during long rests when a character chooses the
                                &quot;Work on a Project&quot; downtime move. Each advance ticks down the countdown by 1
                                {advancementType === 'roll' && ' (if the action roll succeeds)'}.
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
                            disabled={!name.trim() || !selectedCharacter || isSubmitting}
                            className="flex-1 px-4 py-2 text-sm font-bold bg-dagger-gold hover:bg-dagger-gold-light text-black rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Hammer size={16} />
                            {isSubmitting ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
