'use client';

/**
 * RELATIONSHIP CHANGE MODAL
 * ----------------------------------------------------------------------------
 * A modal interface for recording relationship point changes with context.
 * Similar to the Experience Manager pattern, this allows users to:
 * - Specify the magnitude of change (+1, +2, -1, etc.)
 * - Provide a reason/description for the change
 * - Confirm or cancel the action
 */

import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface RelationshipChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    npcName: string;
    onConfirm: (change: number, reason: string) => void;
}

export default function RelationshipChangeModal({
    isOpen,
    onClose,
    npcName,
    onConfirm,
}: RelationshipChangeModalProps) {
    const [change, setChange] = useState(1);
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (!reason.trim()) return;
        onConfirm(change, reason.trim());
        // Reset for next use
        setChange(1);
        setReason('');
        onClose();
    };

    const handleCancel = () => {
        setChange(1);
        setReason('');
        onClose();
    };

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
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
                    >
                        <div className="bg-dagger-panel border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-serif font-bold text-white">
                                        Relationship Change
                                    </h2>
                                    <p className="text-sm text-gray-400">{npcName}</p>
                                </div>
                                <button
                                    onClick={handleCancel}
                                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                {/* Change Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Change Amount
                                    </label>
                                    <div className="flex items-center justify-center gap-4">
                                        <button
                                            onClick={() => setChange((v) => Math.max(v - 1, -5))}
                                            className="p-3 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                                            title="Decrease"
                                        >
                                            <Minus size={20} />
                                        </button>

                                        <div className="text-center min-w-[80px]">
                                            <div
                                                className={clsx(
                                                    'text-4xl font-bold',
                                                    change > 0
                                                        ? 'text-green-400'
                                                        : change < 0
                                                            ? 'text-red-400'
                                                            : 'text-gray-400'
                                                )}
                                            >
                                                {change > 0 ? '+' : ''}
                                                {change}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {change > 0 ? 'Positive' : change < 0 ? 'Negative' : 'Neutral'}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setChange((v) => Math.min(v + 1, 5))}
                                            className="p-3 rounded-lg bg-white/5 hover:bg-green-500/20 text-gray-400 hover:text-green-400 transition-colors"
                                            title="Increase"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Reason */}
                                <div>
                                    <label htmlFor="reason" className="block text-sm font-medium text-gray-400 mb-2">
                                        What happened?
                                    </label>
                                    <textarea
                                        id="reason"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Describe the interaction or event..."
                                        rows={3}
                                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm focus:border-dagger-gold outline-none text-white placeholder-gray-600 resize-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        This helps you remember why the relationship changed
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-white/10 flex gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 py-2.5 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={!reason.trim()}
                                    className={clsx(
                                        'flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors',
                                        !reason.trim()
                                            ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                                            : 'bg-dagger-gold text-black hover:bg-dagger-gold/90'
                                    )}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
