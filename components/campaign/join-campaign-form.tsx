'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, Users as UsersIcon } from 'lucide-react';
import { useCharacterStore } from '@/store/character-store';

interface JoinCampaignFormProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function JoinCampaignForm({ isOpen, onClose }: JoinCampaignFormProps) {
    const { joinCampaignByCode, character } = useCharacterStore();
    const [inviteCode, setInviteCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCode.trim()) return;

        setIsSubmitting(true);
        try {
            await joinCampaignByCode(inviteCode.trim().toUpperCase(), character?.id);
            setInviteCode('');
            onClose();
        } catch (error) {
            console.error('Failed to join campaign:', error);
            // Error toast is shown by the store
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setInviteCode('');
            onClose();
        }
    };

    const handleCodeInput = (value: string) => {
        // Auto-uppercase and limit to 8 characters
        const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
        setInviteCode(cleaned);
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
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <UsersIcon size={20} className="text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Join Campaign</h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            disabled={isSubmitting}
                            aria-label="Close modal"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="mb-6">
                            <p className="text-gray-400 text-sm mb-4">
                                Enter the 8-character invite code provided by your GM to join their campaign.
                            </p>

                            <div>
                                <label htmlFor="invite-code" className="block text-sm font-medium text-gray-300 mb-2">
                                    Invite Code
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <Ticket size={20} className="text-gray-500" />
                                    </div>
                                    <input
                                        id="invite-code"
                                        type="text"
                                        value={inviteCode}
                                        onChange={(e) => handleCodeInput(e.target.value)}
                                        placeholder="ABC12345"
                                        className="w-full pl-11 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white text-center text-2xl font-mono tracking-wider placeholder:text-gray-500 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-blue-500/50 transition-colors uppercase"
                                        maxLength={8}
                                        required
                                        autoFocus
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <p className="text-gray-500 text-xs mt-2">
                                    {inviteCode.length}/8 characters
                                </p>
                            </div>

                            {character && (
                                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <p className="text-blue-400 text-sm">
                                        You&apos;ll join as <span className="font-bold">{character.name}</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3">
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
                                className="flex-1 px-4 py-2 text-sm font-bold bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting || inviteCode.length !== 8}
                            >
                                {isSubmitting ? 'Joining...' : 'Join Campaign'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
