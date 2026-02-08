'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppIcons } from '@/lib/icon-utils';
import { useCharacterStore } from '@/store/character-store';
import { Z_INDEX } from '@/constants/z-index';

interface CreateCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateCampaignModal({ isOpen, onClose }: CreateCampaignModalProps) {
    const { createCampaign } = useCharacterStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await createCampaign(name.trim(), description.trim() || undefined);
            setName('');
            setDescription('');
            onClose();
        } catch (error) {
            console.error('Failed to create campaign:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setName('');
            setDescription('');
            onClose();
        }
    };

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
                    className="relative w-full max-w-md bg-dagger-panel border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-dagger-gold/20 rounded-lg">
                                <AppIcons.vitals.hope size={20} className="text-dagger-gold" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Create Campaign</h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            disabled={isSubmitting}
                            aria-label="Close modal"
                        >
                            <AppIcons.ui.close size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-300 mb-2">
                                    Campaign Name *
                                </label>
                                <input
                                    id="campaign-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="The Shattered Realm"
                                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-dagger-gold/50 transition-colors"
                                    maxLength={100}
                                    required
                                    autoFocus
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label htmlFor="campaign-description" className="block text-sm font-medium text-gray-300 mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    id="campaign-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your campaign..."
                                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-dagger-gold/50 transition-colors resize-none"
                                    rows={3}
                                    maxLength={500}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 text-sm font-bold bg-dagger-gold hover:bg-dagger-gold-light text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting || !name.trim()}
                            >
                                {isSubmitting ? 'Creating...' : 'Create Campaign'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
