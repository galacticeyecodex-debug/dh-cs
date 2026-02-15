'use client';

/**
 * QUICK ACTIONS BAR
 * ----------------------------------------------------------------------------
 * Provides quick access buttons for common GM actions on the GM Screen.
 * 
 * FUNCTIONALITY:
 * - Roll Dice: Open dice roller modal for public rolls
 * - Hidden Roll: Open dice roller for private GM-only rolls
 * - Announce: Send announcements to all players
 * - Refresh Party: Manually refresh party character data
 * - Session Notes: (Coming Soon) Quick notes during sessions
 */

import { useState } from 'react';
import { GmDiceRollerModal } from './gm-dice-roller-modal';
import { AnnounceModal } from './announce-modal';
import { useCharacterStore } from '@/store/character-store';
import { AppIcons } from '@/lib/icon-utils';

interface QuickActionsBarProps {
    campaignId: string;
    onOpenNotes?: () => void;
    onOpenNPCs?: () => void;
}

export function QuickActionsBar({ campaignId, onOpenNotes, onOpenNPCs }: QuickActionsBarProps) {
    const [showDiceRoller, setShowDiceRoller] = useState(false);
    const [showAnnounce, setShowAnnounce] = useState(false);
    const [isPrivateRoll, setIsPrivateRoll] = useState(false);
    const { fetchPartyCharacters } = useCharacterStore();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchPartyCharacters(campaignId);
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <>
            <div className="bg-dagger-panel border border-white/10 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-dagger-gold/20">
                        <AppIcons.vitals.stress className="w-5 h-5 text-dagger-gold" />
                    </div>
                    <h2 className="text-lg font-serif font-bold text-white">Quick Actions</h2>
                </div>

                {/* Action Buttons Grid */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {/* Roll Dice */}
                    <button
                        onClick={() => {
                            setIsPrivateRoll(false);
                            setShowDiceRoller(true);
                        }}
                        className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-dagger-gold/10 border border-white/10 hover:border-dagger-gold/30 rounded-xl transition-colors group"
                    >
                        <AppIcons.combat.roll className="w-6 h-6 text-gray-400 group-hover:text-dagger-gold transition-colors" />
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Roll Dice</span>
                    </button>

                    {/* Hidden Roll */}
                    <button
                        onClick={() => {
                            setIsPrivateRoll(true);
                            setShowDiceRoller(true);
                        }}
                        className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/30 rounded-xl transition-colors group"
                    >
                        <AppIcons.ui.visibilityOff className="w-6 h-6 text-gray-400 group-hover:text-purple-400 transition-colors" />
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Hidden Roll</span>
                    </button>

                    {/* Announce */}
                    <button
                        onClick={() => setShowAnnounce(true)}
                        className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 rounded-xl transition-colors group"
                    >
                        <AppIcons.campaign.announce className="w-6 h-6 text-gray-400 group-hover:text-blue-400 transition-colors" />
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Announce</span>
                    </button>

                    {/* Refresh Party */}
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-green-500/10 border border-white/10 hover:border-green-500/30 rounded-xl transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <AppIcons.system.sync className={`w-6 h-6 text-gray-400 group-hover:text-green-400 transition-colors ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Refresh</span>
                    </button>

                    {/* Session Notes */}
                    <button
                        onClick={onOpenNotes}
                        className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 rounded-xl transition-colors group"
                    >
                        <AppIcons.campaign.note className="w-6 h-6 text-gray-400 group-hover:text-amber-400 transition-colors" />
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Notes</span>
                    </button>

                    {/* Campaign NPCs */}
                    <button
                        onClick={onOpenNPCs}
                        className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-pink-500/10 border border-white/10 hover:border-pink-500/30 rounded-xl transition-colors group"
                    >
                        <AppIcons.campaign.party className="w-6 h-6 text-gray-400 group-hover:text-pink-400 transition-colors" />
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">NPCs</span>
                    </button>
                </div>
            </div>

            <GmDiceRollerModal
                isOpen={showDiceRoller}
                onClose={() => setShowDiceRoller(false)}
                isPrivate={isPrivateRoll}
                campaignId={campaignId}
            />

            <AnnounceModal
                isOpen={showAnnounce}
                onClose={() => setShowAnnounce(false)}
                campaignId={campaignId}
            />
        </>
    );
}
