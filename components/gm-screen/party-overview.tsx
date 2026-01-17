'use client';

import { Character } from '@/types/character';
import { PlayerVitalsCard } from './player-vitals-card';
import { Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                    No party members have assigned characters yet
                </p>
                <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                    <RefreshCw
                        className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                    Refresh
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    Party ({characters.length})
                </h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    aria-label="Refresh party characters"
                >
                    <RefreshCw
                        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {characters.map((character) => (
                    <PlayerVitalsCard key={character.id} character={character} />
                ))}
            </div>
        </div>
    );
}
