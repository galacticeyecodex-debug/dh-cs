'use client';

/**
 * ANNOUNCE MODAL
 * ----------------------------------------------------------------------------
 * Allows the GM to send announcements to all players in a campaign.
 * 
 * FUNCTIONALITY:
 * - Text input for custom announcement messages
 * - Quick templates for common announcements (Combat Start, Rest, Level Up)
 * - Logs announcement to activity feed for all players to see
 * - Animated modal with Daggerheart styling
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Megaphone, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useCharacterStore } from '@/store/character-store';

interface AnnounceModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaignId: string;
}

// Common announcement templates
const TEMPLATES = [
    { label: 'Combat Start', message: '⚔️ Combat begins! The spotlight is yours.' },
    { label: 'Short Rest', message: '☕ Take a short rest. You may spend Hope to heal.' },
    { label: 'Long Rest', message: '🌙 Long rest. Restore all HP, clear Stress, and repair Armor.' },
    { label: 'Level Up', message: '🎉 Level up! Check your character sheets for new abilities.' },
];

export function AnnounceModal({ isOpen, onClose, campaignId }: AnnounceModalProps) {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { user, logActivity } = useCharacterStore();

    const handleAnnounce = async () => {
        if (!message.trim() || !user) return;

        setIsSending(true);
        try {
            // Log the announcement as an activity
            await logActivity({
                campaign_id: campaignId,
                user_id: user.id,
                activity_type: 'gm_announcement',
                data: {
                    message: message.trim(),
                    importance: 'normal',
                },
                is_private: false,
            });

            toast.success('📢 Announcement sent to party!', {
                description: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
            });
            onClose();
            setMessage('');
        } catch (error) {
            toast.error('Failed to send announcement');
        } finally {
            setIsSending(false);
        }
    };

    const handleTemplateClick = (templateMessage: string) => {
        setMessage(templateMessage);
    };

    const handleClose = () => {
        onClose();
        setMessage('');
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
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Megaphone size={20} className="text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Announce to Party</h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            disabled={isSending}
                            aria-label="Close announcement"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        {/* Quick templates */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Quick Templates</label>
                            <div className="grid grid-cols-2 gap-2">
                                {TEMPLATES.map((template) => (
                                    <button
                                        key={template.label}
                                        onClick={() => handleTemplateClick(template.message)}
                                        className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-left text-gray-300 transition-colors"
                                    >
                                        {template.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Message input */}
                        <div>
                            <label htmlFor="announce-message" className="block text-sm font-medium text-gray-300 mb-2">
                                Message
                            </label>
                            <textarea
                                id="announce-message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter your message to the party..."
                                rows={4}
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-dagger-gold/50 transition-colors resize-none"
                                disabled={isSending}
                            />
                        </div>

                        <p className="text-xs text-gray-500 text-center">
                            This will appear in all players&apos; activity feeds
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 p-6 border-t border-white/5">
                        <button
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                            disabled={isSending}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAnnounce}
                            disabled={!message.trim() || isSending}
                            className="flex-1 px-4 py-2 text-sm font-bold bg-dagger-gold hover:bg-dagger-gold-light text-black rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Send size={16} />
                            {isSending ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
