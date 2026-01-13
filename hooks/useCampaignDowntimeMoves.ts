/**
 * USE CAMPAIGN DOWNTIME MOVES HOOK
 * ----------------------------------------------------------------------------
 * Fetches campaign-specific downtime moves from the Supabase library table.
 * Downtime moves are stored with type 'downtime_move' and source 'homebrew'.
 * 
 * This makes the downtime system data-driven - new campaign moves can be
 * added by uploading content to Supabase without any code changes.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import createClient from '@/lib/supabase/client';
import { DOWNTIME_MOVES, type DowntimeMove, type RestType } from '@/types/downtime';

export interface CampaignDowntimeMove {
    id: string;
    name: string;
    description: string;
    rest_types: RestType[];
    roll_required: boolean;
    roll_dice?: string;
    roll_modifier?: 'tier' | 'proficiency' | 'none';
    effect: {
        type: string;
        value?: number;
    };
    campaign: string;
}

export interface UseCampaignDowntimeMovesResult {
    /** All moves (core + enabled campaign moves) */
    allMoves: DowntimeMove[];
    /** Just the campaign-specific moves */
    campaignMoves: CampaignDowntimeMove[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    /** Get available moves for a rest type, filtered by enabled campaigns */
    getAvailableMoves: (restType: RestType) => DowntimeMove[];
}

/**
 * Fetch campaign-specific downtime moves and combine with core moves.
 * @param enabledCampaigns - Array of campaign IDs that the user has enabled
 */
export default function useCampaignDowntimeMoves(
    enabledCampaigns: string[] = []
): UseCampaignDowntimeMovesResult {
    const [campaignMoves, setCampaignMoves] = useState<CampaignDowntimeMove[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadMoves = useCallback(async () => {
        if (enabledCampaigns.length === 0) {
            setCampaignMoves([]);
            setLoading(false);
            return;
        }

        try {
            setError(null);
            const supabase = createClient();

            const { data, error: fetchError } = await supabase
                .from('library')
                .select('id, name, data')
                .eq('type', 'downtime_move')
                .eq('source', 'homebrew');

            if (fetchError) throw fetchError;

            // Filter to only moves for enabled campaigns and transform
            const moves: CampaignDowntimeMove[] = (data || [])
                .map(row => {
                    const moveData = row.data as CampaignDowntimeMove;
                    return {
                        id: row.id,
                        name: row.name,
                        description: moveData.description || '',
                        rest_types: moveData.rest_types || ['long'],
                        roll_required: moveData.roll_required || false,
                        roll_dice: moveData.roll_dice,
                        roll_modifier: moveData.roll_modifier,
                        effect: moveData.effect || { type: 'custom' },
                        campaign: moveData.campaign,
                    };
                })
                .filter(move => enabledCampaigns.includes(move.campaign));

            setCampaignMoves(moves);
        } catch (err) {
            console.error('Failed to load campaign downtime moves:', err);
            setError('Failed to load campaign downtime moves');
            setCampaignMoves([]);
        } finally {
            setLoading(false);
        }
    }, [enabledCampaigns]);

    useEffect(() => {
        loadMoves();
    }, [loadMoves]);

    // Convert campaign moves to DowntimeMove format
    const convertedCampaignMoves: DowntimeMove[] = useMemo(() => {
        return campaignMoves.map(move => ({
            id: move.id as DowntimeMove['id'],
            name: move.name,
            description: move.description,
            restTypes: move.rest_types,
            requiresCampaign: move.campaign,
            rollRequired: move.roll_required,
            rollDice: move.roll_dice,
            rollModifier: move.roll_modifier,
            effect: {
                type: move.effect.type as DowntimeMove['effect']['type'],
                value: move.effect.value,
            },
        }));
    }, [campaignMoves]);

    // Combine core moves with campaign moves
    const allMoves = useMemo(() => {
        // Get core moves (those without requiresCampaign or with enabled campaigns)
        const coreMoves = DOWNTIME_MOVES.filter(
            move => !move.requiresCampaign || enabledCampaigns.includes(move.requiresCampaign)
        );
        return [...coreMoves, ...convertedCampaignMoves];
    }, [convertedCampaignMoves, enabledCampaigns]);

    // Helper to get available moves for a rest type
    const getAvailableMoves = useCallback((restType: RestType): DowntimeMove[] => {
        return allMoves.filter(move => move.restTypes.includes(restType));
    }, [allMoves]);

    return {
        allMoves,
        campaignMoves,
        loading,
        error,
        refresh: loadMoves,
        getAvailableMoves,
    };
}
