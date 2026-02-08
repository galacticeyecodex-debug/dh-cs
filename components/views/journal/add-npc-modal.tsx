'use client';

/**
 * ADD NPC MODAL
 * ----------------------------------------------------------------------------
 * A modal interface for creating new NPC relationships. Collects:
 * - NPC Name (required)
 * - Description (optional)
 * - Bond Boon - benefit when relationship is positive (optional)
 * - Bond Bane - penalty when relationship is negative (optional)
 * - Starting relationship points (defaults to 0 / Acquaintance)
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus, UserPlus } from '@/lib/icon-utils';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import type { CreateRelationshipInput } from '@/types/journal';
import { getRelationshipTier, getRelationshipTierInfo } from '@/types/journal';
import { Z_INDEX } from '@/constants/z-index';

interface AddNPCModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (input: CreateRelationshipInput) => Promise<void>;
}

export default function AddNPCModal({
    isOpen,
    onClose,
    onSubmit,
}: AddNPCModalProps) {
    const [npcName, setNpcName] = useState('');
    const [description, setDescription] = useState('');
    const [bondBoon, setBondBoon] = useState('');
    const [bondBane, setBondBane] = useState('');
    const [points, setPoints] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    // Focus name input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => nameInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const resetForm = () => {
        setNpcName('');
        setDescription('');
        setBondBoon('');
        setBondBane('');
        setPoints(0);
        setIsSubmitting(false);
    };

    const handleSubmit = async () => {
        if (!npcName.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                npc_name: npcName.trim(),
                npc_description: description.trim() || undefined,
                bond_boon: bondBoon.trim() || undefined,
                bond_bane: bondBane.trim() || undefined,
                points,
            });
            resetForm();
            onClose();
        } catch (error) {
            console.error('Failed to create NPC:', error);
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        resetForm();
        onClose();
    };

    const tier = getRelationshipTier(points);
    const tierInfo = getRelationshipTierInfo(tier);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCancel}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        style={{ zIndex: Z_INDEX.MODAL }}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 max-h-[90vh] overflow-hidden"
                        style={{ zIndex: Z_INDEX.MODAL }}
                    >
                        <div className="bg-dagger-panel border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-dagger-gold/10">
                                        <UserPlus size={20} className="text-dagger-gold" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-serif font-bold text-white">
                                            Add NPC
                                        </h2>
                                        <p className="text-sm text-gray-400">Create a new relationship</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCancel}
                                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content - scrollable */}
                            <div className="p-6 space-y-4 overflow-y-auto flex-1">
                                {/* NPC Name */}
                                <div>
                                    <label htmlFor="npc-name" className="block text-sm font-medium text-gray-400 mb-2">
                                        NPC Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        ref={nameInputRef}
                                        id="npc-name"
                                        type="text"
                                        value={npcName}
                                        onChange={(e) => setNpcName(e.target.value)}
                                        placeholder="Enter NPC name..."
                                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-sm focus:border-dagger-gold outline-none text-white placeholder-gray-600"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label htmlFor="npc-description" className="block text-sm font-medium text-gray-400 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        id="npc-description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Who is this NPC? What do they do?"
                                        rows={2}
                                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm focus:border-dagger-gold outline-none text-white placeholder-gray-600 resize-none"
                                    />
                                </div>

                                {/* Starting Points */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Starting Relationship
                                    </label>
                                    <div className="flex items-center justify-center gap-4 py-2">
                                        <button
                                            type="button"
                                            onClick={() => setPoints((v) => Math.max(v - 1, -5))}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                                            title="Decrease"
                                        >
                                            <Minus size={18} />
                                        </button>

                                        <div className="text-center min-w-[100px]">
                                            <div
                                                className={clsx(
                                                    'text-3xl font-bold',
                                                    points > 0
                                                        ? 'text-green-400'
                                                        : points < 0
                                                            ? 'text-red-400'
                                                            : 'text-gray-400'
                                                )}
                                            >
                                                {points > 0 ? '+' : ''}
                                                {points}
                                            </div>
                                            <div className={clsx('text-xs mt-1', tierInfo.color)}>
                                                {tierInfo.label}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setPoints((v) => Math.min(v + 1, 5))}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-green-500/20 text-gray-400 hover:text-green-400 transition-colors"
                                            title="Increase"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Bond Effects */}
                                <div className="space-y-3 pt-2 border-t border-white/5">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                                        Bond Effects (Optional)
                                    </p>

                                    {/* Bond Boon */}
                                    <div>
                                        <label htmlFor="bond-boon" className="block text-sm font-medium text-green-400 mb-1.5">
                                            Bond Boon
                                        </label>
                                        <input
                                            id="bond-boon"
                                            type="text"
                                            value={bondBoon}
                                            onChange={(e) => setBondBoon(e.target.value)}
                                            placeholder="Benefit when Friend or Beloved..."
                                            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm focus:border-green-500 outline-none text-white placeholder-gray-600"
                                        />
                                    </div>

                                    {/* Bond Bane */}
                                    <div>
                                        <label htmlFor="bond-bane" className="block text-sm font-medium text-red-400 mb-1.5">
                                            Bond Bane
                                        </label>
                                        <input
                                            id="bond-bane"
                                            type="text"
                                            value={bondBane}
                                            onChange={(e) => setBondBane(e.target.value)}
                                            placeholder="Penalty when Rival or Enemy..."
                                            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none text-white placeholder-gray-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-white/10 flex gap-3 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="flex-1 py-2.5 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!npcName.trim() || isSubmitting}
                                    className={clsx(
                                        'flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
                                        !npcName.trim() || isSubmitting
                                            ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                                            : 'bg-dagger-gold text-black hover:bg-dagger-gold/90'
                                    )}
                                >
                                    {isSubmitting ? (
                                        <span className="animate-pulse">Adding...</span>
                                    ) : (
                                        <>
                                            <Plus size={16} />
                                            Add NPC
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
