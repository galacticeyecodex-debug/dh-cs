'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Dices, Megaphone, EyeOff, StickyNote, Zap, RefreshCw } from 'lucide-react';
import { GmDiceRollerModal } from './gm-dice-roller-modal';
import { AnnounceModal } from './announce-modal';
import { useCharacterStore } from '@/store/character-store';

interface QuickActionsBarProps {
    campaignId: string;
}

export function QuickActionsBar({ campaignId }: QuickActionsBarProps) {
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
            <Card className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Quick Actions
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <button
                        onClick={() => {
                            setIsPrivateRoll(false);
                            setShowDiceRoller(true);
                        }}
                        className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/50 rounded-lg transition-colors"
                    >
                        <Dices className="w-6 h-6 text-gray-300" />
                        <span className="text-sm text-gray-300">Roll Dice</span>
                    </button>

                    <button
                        onClick={() => {
                            setIsPrivateRoll(true);
                            setShowDiceRoller(true);
                        }}
                        className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/50 rounded-lg transition-colors"
                    >
                        <EyeOff className="w-6 h-6 text-gray-300" />
                        <span className="text-sm text-gray-300">Hidden Roll</span>
                    </button>

                    <button
                        onClick={() => setShowAnnounce(true)}
                        className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/50 rounded-lg transition-colors"
                    >
                        <Megaphone className="w-6 h-6 text-gray-300" />
                        <span className="text-sm text-gray-300">Announce</span>
                    </button>

                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-green-500/10 border border-white/10 hover:border-green-500/50 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-6 h-6 text-gray-300 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="text-sm text-gray-300">Refresh Party</span>
                    </button>

                    <button
                        disabled
                        className="h-20 md:h-24 flex flex-col items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-lg opacity-50 cursor-not-allowed"
                    >
                        <StickyNote className="w-6 h-6 text-gray-500" />
                        <span className="text-sm text-gray-500">Session Notes</span>
                        <span className="text-xs text-gray-600">(Coming Soon)</span>
                    </button>
                </div>
            </Card>

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
