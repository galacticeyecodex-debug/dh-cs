'use client';

import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Campaign } from '@/types/campaign';

interface InviteCodeDisplayProps {
    campaign: Campaign;
}

export default function InviteCodeDisplay({ campaign }: InviteCodeDisplayProps) {
    const [copied, setCopied] = useState(false);

    const inviteLink = typeof window !== 'undefined'
        ? `${window.location.origin}/app/campaigns?invite=${campaign.invite_code}`
        : '';

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(campaign.invite_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const copyLinkToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy link:', error);
        }
    };

    return (
        <div className="bg-dagger-panel border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Invite Players</h3>

            <div className="space-y-4">
                {/* Invite Code */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Invite Code
                    </label>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 px-4 py-3 bg-black/30 border border-white/10 rounded-lg">
                            <p className="text-2xl font-mono font-bold text-dagger-gold text-center tracking-wider">
                                {campaign.invite_code}
                            </p>
                        </div>
                        <button
                            onClick={copyToClipboard}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            title="Copy invite code"
                            aria-label="Copy invite code to clipboard"
                        >
                            {copied ? (
                                <Check size={20} className="text-green-400" />
                            ) : (
                                <Copy size={20} className="text-gray-400" />
                            )}
                        </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                        Share this code with players to invite them to your campaign
                    </p>
                </div>

                {/* Invite Link */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Invite Link
                    </label>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg">
                            <p className="text-sm text-gray-300 truncate font-mono">
                                {inviteLink}
                            </p>
                        </div>
                        <button
                            onClick={copyLinkToClipboard}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            title="Copy invite link"
                            aria-label="Copy invite link to clipboard"
                        >
                            {copied ? (
                                <Check size={18} className="text-green-400" />
                            ) : (
                                <ExternalLink size={18} className="text-gray-400" />
                            )}
                        </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                        Players can click this link to automatically join your campaign
                    </p>
                </div>
            </div>
        </div>
    );
}
