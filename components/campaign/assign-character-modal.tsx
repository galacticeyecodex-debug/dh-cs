'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User } from 'lucide-react';
import { useCharacterStore } from '@/store/character-store';
import { dataService } from '@/lib/data-service';
import { Character } from '@/types/character';

interface AssignCharacterModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaignId: string;
}

export default function AssignCharacterModal({ isOpen, onClose, campaignId }: AssignCharacterModalProps) {
    const { character, assignCharacterToCampaign, user } = useCharacterStore();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedCharacterId, setSelectedCharacterId] = useState<string>(character?.id || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setIsLoading(true);
            dataService.character.list(user.id)
                .then((chars) => {
                    setCharacters(chars);
                    setSelectedCharacterId(character?.id || '');
                })
                .catch((error) => console.error('Failed to fetch characters:', error))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, user?.id, character?.id]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCharacterId) return;

        setIsSubmitting(true);
        try {
            await assignCharacterToCampaign(campaignId, selectedCharacterId);
            onClose();
        } catch (error) {
            console.error('Failed to assign character:', error);
        } finally {
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
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <User size={20} className="text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Assign Character</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            disabled={isSubmitting}
                            aria-label="Close modal"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="p-6">
                        <p className="text-gray-400 text-sm mb-4">
                            Select which character you want to use in this campaign.
                        </p>

                        <div className="space-y-2 mb-6 max-h-80 overflow-y-auto">
                            {isLoading ? (
                                <div className="text-center py-8">
                                    <div className="inline-block w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-gray-400 text-sm mt-2">Loading characters...</p>
                                </div>
                            ) : characters.length === 0 ? (
                                <div className="text-center py-8">
                                    <User size={32} className="mx-auto text-gray-600 mb-2" />
                                    <p className="text-gray-500 text-sm">No characters found</p>
                                    <p className="text-gray-600 text-xs mt-1">Create a character first</p>
                                </div>
                            ) : (
                                characters.map((char) => (
                                    <label
                                        key={char.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedCharacterId === char.id
                                            ? 'border-dagger-gold bg-dagger-gold/10'
                                            : 'border-white/10 bg-black/20 hover:border-white/20'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="character"
                                            value={char.id}
                                            checked={selectedCharacterId === char.id}
                                            onChange={() => setSelectedCharacterId(char.id)}
                                            className="sr-only"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-white">{char.name}</p>
                                            <p className="text-gray-400 text-sm">
                                                Level {char.level} {char.class_id || 'Adventurer'}
                                            </p>
                                        </div>
                                        {selectedCharacterId === char.id && (
                                            <div className="w-5 h-5 rounded-full bg-dagger-gold flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-black" />
                                            </div>
                                        )}
                                    </label>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 text-sm font-bold bg-dagger-gold hover:bg-dagger-gold-light text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting || !selectedCharacterId || characters.length === 0}
                            >
                                {isSubmitting ? 'Assigning...' : 'Assign Character'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
