'use client';

/**
 * PARTY OVERVIEW
 * ----------------------------------------------------------------------------
 * Displays all player characters in the campaign with their vitals.
 * 
 * FUNCTIONALITY:
 * - Shows grid of PlayerVitalsCards for each character
 * - Provides empty state when no characters are assigned
 * - Allows manual refresh of party data
 */

import { Character } from '@/types/character';
import { PlayerVitalsCard } from './player-vitals-card';
import { Users, RefreshCw } from 'lucide-react';
import { useCharacterStore } from '@/store/character-store';
import { useState } from 'react';

interface PartyOverviewProps {
    campaignId: string;
    characters: Character[];
}

export function PartyOverview({ campaignId, characters }: PartyOverviewProps) {
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

    if (characters.length === 0) {
        return (
            <div className="bg-dagger-panel border-2 border-dashed border-white/10 rounded-xl p-8 text-center">
                <div className="p-3 rounded-xl bg-white/5 inline-block mb-4">
                    <Users className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-400 mb-4">
                    No party members have assigned characters yet
                </p>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10 flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                        <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-serif font-bold text-white">Party Overview</h2>
                        <p className="text-xs text-gray-500">{characters.length} character{characters.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10 disabled:opacity-50"
                    aria-label="Refresh party characters"
                >
                    <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Character Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {characters.map((character) => (
                    <PlayerVitalsCard key={character.id} character={character} />
                ))}
            </div>
        </div>
    );
}
