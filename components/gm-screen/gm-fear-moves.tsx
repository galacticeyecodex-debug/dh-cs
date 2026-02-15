'use client';

/**
 * GM FEAR MOVES PANEL
 * ----------------------------------------------------------------------------
 * Clickable buttons for common GM Fear-spend actions. Replaces the static
 * "Spend Fear to: interrupt, make extra moves..." text with interactive controls.
 *
 * SRD Reference: content/public/srd/markdown/contents/The_GM.md
 * "The GM spends Fear to activate certain abilities and to spotlight adversaries."
 */

import { useState } from 'react';
import { AppIcons } from '@/lib/icon-utils';
import clsx from 'clsx';

interface FearMove {
    name: string;
    fearCost: number;
    icon: typeof AppIcons.vitals.fear;
    description: string;
}

const SRD_MOVES: FearMove[] = [
    {
        name: 'Spotlight Adversary',
        fearCost: 1,
        icon: AppIcons.combat.target,
        description: 'Activate an additional adversary this turn',
    },
    {
        name: 'End a Spell Early',
        fearCost: 1,
        icon: AppIcons.combat.spellcast,
        description: 'Force an active spell to end immediately',
    },
];

const NARRATIVE_MOVES: FearMove[] = [
    {
        name: 'Escalate Danger',
        fearCost: 1,
        icon: AppIcons.system.warning,
        description: 'Intensify the current threat or situation',
    },
    {
        name: 'Split the Party',
        fearCost: 1,
        icon: AppIcons.campaign.party,
        description: 'Separate players or create obstacles between them',
    },
    {
        name: 'Reveal a Threat',
        fearCost: 1,
        icon: AppIcons.ui.visibility,
        description: 'Introduce a new danger or complication',
    },
    {
        name: 'Environmental Hazard',
        fearCost: 1,
        icon: AppIcons.campaign.map,
        description: 'Activate a hazard in the environment',
    },
];

const FREE_MOVES: FearMove[] = [
    {
        name: 'Soft Move',
        fearCost: 0,
        icon: AppIcons.campaign.announce,
        description: 'Describe a consequence or foreshadow danger',
    },
    {
        name: 'Narrate Consequence',
        fearCost: 0,
        icon: AppIcons.ui.notability,
        description: 'Show the result of player actions',
    },
];

interface GmFearMovesProps {
    campaignId: string;
    currentFear: number;
    onUseMove: (moveName: string, fearCost: number) => void;
}

export function GmFearMoves({ currentFear, onUseMove }: GmFearMovesProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const renderMoveButton = (move: FearMove) => {
        const canAfford = move.fearCost === 0 || currentFear >= move.fearCost;
        const Icon = move.icon;

        return (
            <button
                key={move.name}
                onClick={() => onUseMove(move.name, move.fearCost)}
                disabled={!canAfford}
                className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-left w-full',
                    move.fearCost > 0
                        ? canAfford
                            ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20'
                            : 'bg-red-500/5 border-red-500/10 opacity-50 cursor-not-allowed'
                        : 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20'
                )}
                title={move.description}
            >
                <Icon size={14} className={clsx(
                    'flex-shrink-0',
                    move.fearCost > 0 ? 'text-red-400' : 'text-green-400'
                )} />
                <span className="flex-1 text-xs font-medium text-white">{move.name}</span>
                <span className={clsx(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0',
                    move.fearCost > 0
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-green-500/20 text-green-300'
                )}>
                    {move.fearCost > 0 ? `${move.fearCost} Fear` : 'Free'}
                </span>
            </button>
        );
    };

    return (
        <div className="mt-3 pt-3 border-t border-white/5">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-white transition-colors px-1 py-1"
            >
                <span className="font-bold uppercase tracking-wider">Fear Moves</span>
                {isExpanded ? (
                    <AppIcons.ui.collapse size={14} />
                ) : (
                    <AppIcons.ui.expand size={14} />
                )}
            </button>

            {isExpanded && (
                <div className="mt-2 space-y-3">
                    {/* SRD Moves */}
                    <div className="space-y-1">
                        <p className="text-[10px] text-gray-600 uppercase tracking-wider font-bold px-1">SRD Moves</p>
                        {SRD_MOVES.map(renderMoveButton)}
                    </div>

                    {/* Narrative Moves */}
                    <div className="space-y-1">
                        <p className="text-[10px] text-gray-600 uppercase tracking-wider font-bold px-1">Narrative Moves</p>
                        {NARRATIVE_MOVES.map(renderMoveButton)}
                    </div>

                    {/* Free Moves */}
                    <div className="space-y-1">
                        <p className="text-[10px] text-gray-600 uppercase tracking-wider font-bold px-1">Free Moves</p>
                        {FREE_MOVES.map(renderMoveButton)}
                    </div>
                </div>
            )}
        </div>
    );
}
