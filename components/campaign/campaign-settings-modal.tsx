'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Trash2 } from 'lucide-react';
import { useCharacterStore } from '@/store/character-store';
import { Campaign } from '@/types/campaign';
import { useRouter } from 'next/navigation';

interface CampaignSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaign: Campaign;
}

export default function CampaignSettingsModal({ isOpen, onClose, campaign }: CampaignSettingsModalProps) {
    const router = useRouter();
    const { updateCampaign, deleteCampaign, user } = useCharacterStore();
    const [name, setName] = useState(campaign.name);
    const [description, setDescription] = useState(campaign.description || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isGM = campaign.gm_user_id === user?.id;

    useEffect(() => {
        if (isOpen) {
            setName(campaign.name);
            setDescription(campaign.description || '');
            setShowDeleteConfirm(false);
        }
    }, [isOpen, campaign]);

    if (!isOpen || !isGM) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await updateCampaign(campaign.id, {
                name: name.trim(),
                description: description.trim() || undefined,
            });
            onClose();
        } catch (error) {
            console.error('Failed to update campaign:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm) {
            setShowDeleteConfirm(true);
            return;
        }

        setIsSubmitting(true);
        try {
            await deleteCampaign(campaign.id);
            router.push('/campaigns');
            onClose();
        } catch (error) {
            console.error('Failed to delete campaign:', error);
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
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
                            <div className="p-2 bg-gray-500/20 rounded-lg">
                                <Settings size={20} className="text-gray-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Campaign Settings</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            disabled={isSubmitting}
                            aria-label="Close settings"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="settings-campaign-name" className="block text-sm font-medium text-gray-300 mb-2">
                                    Campaign Name
                                </label>
                                <input
                                    id="settings-campaign-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-dagger-gold/50 transition-colors"
                                    maxLength={100}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label htmlFor="settings-campaign-description" className="block text-sm font-medium text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    id="settings-campaign-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-dagger-gold/50 transition-colors resize-none"
                                    rows={3}
                                    maxLength={500}
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Fear Max is always 12 per SRD - not configurable */}
                            <div className="bg-white/5 rounded-lg p-3">
                                <p className="text-sm text-gray-400">
                                    <span className="font-medium text-gray-300">Fear Maximum:</span>{' '}
                                    <span className="text-dagger-gold font-bold">12</span>
                                    <span className="text-gray-500 text-xs ml-2">(per SRD rules)</span>
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 text-sm font-bold bg-dagger-gold hover:bg-dagger-gold-light text-black rounded-lg transition-colors disabled:opacity-50"
                                disabled={isSubmitting || !name.trim()}
                            >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>

                    {/* Danger Zone */}
                    <div className="p-6 border-t border-white/5 bg-red-500/5">
                        <h3 className="text-sm font-bold text-red-400 mb-2">Danger Zone</h3>
                        <p className="text-gray-400 text-xs mb-3">
                            Deleting a campaign is permanent and cannot be undone.
                        </p>
                        <button
                            onClick={handleDelete}
                            className={`w-full px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${showDeleteConfirm
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                                }`}
                            disabled={isSubmitting}
                        >
                            <Trash2 size={16} />
                            {showDeleteConfirm ? 'Click Again to Confirm' : 'Delete Campaign'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
