'use client';

/**
 * PLAYER ENCOUNTER BOARD
 * ----------------------------------------------------------------------------
 * Shows players the active encounter on the campaign page.
 * Players see adversary names, tiers, types, and HP status (not exact numbers).
 * This gives players situational awareness without revealing GM-only stats.
 *
 * Visible when:
 * - An encounter exists in campaign settings
 * - The encounter has is_visible_to_players = true
 * - The encounter status is 'active' or 'preparing'
 */

import { AppIcons } from '@/lib/icon-utils';
import type { Encounter, PinnedAdversary } from '@/types/campaign';
import clsx from 'clsx';

interface PlayerEncounterBoardProps {
    encounter: Encounter;
}

export function PlayerEncounterBoard({ encounter }: PlayerEncounterBoardProps) {
    if (!encounter.is_visible_to_players) return null;

    const aliveAdversaries = encounter.adversaries.filter(a => !a.is_defeated);
    const defeatedAdversaries = encounter.adversaries.filter(a => a.is_defeated);

    return (
        <div className="bg-dagger-panel border border-red-500/20 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/20 animate-pulse">
                        <AppIcons.combat.attack size={20} className="text-red-400" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-serif font-bold text-white">{encounter.name}</h2>
                            {encounter.status === 'active' && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-medium animate-pulse">
                                    In Combat
                                </span>
                            )}
                            {encounter.status === 'preparing' && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-medium">
                                    Preparing
                                </span>
                            )}
                        </div>
                        {encounter.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{encounter.description}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-white tabular-nums">{aliveAdversaries.length}</span>
                        <p className="text-xs text-gray-500">
                            {aliveAdversaries.length === 1 ? 'enemy' : 'enemies'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Adversary List */}
            <div className="p-3 space-y-2">
                {aliveAdversaries.map((adversary) => (
                    <AdversaryStatusCard key={adversary.id} adversary={adversary} />
                ))}

                {/* Defeated Section */}
                {defeatedAdversaries.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-white/5">
                        <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">
                            Defeated ({defeatedAdversaries.length})
                        </p>
                        {defeatedAdversaries.map((adversary) => (
                            <div
                                key={adversary.id}
                                className="flex items-center gap-2 px-3 py-1.5 opacity-40"
                            >
                                <span className="text-xs text-gray-500 line-through">{adversary.label}</span>
                                <span className="text-xs text-gray-600">({adversary.type})</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function AdversaryStatusCard({ adversary }: { adversary: PinnedAdversary }) {
    // Show health as a visual indicator (Healthy/Bloodied/Critical) instead of exact numbers
    const hpPercent = adversary.hp_max > 0
        ? (adversary.hp_current / adversary.hp_max) * 100
        : 100;

    const healthStatus = hpPercent > 50
        ? { label: 'Healthy', color: 'text-green-400', bg: 'bg-green-500/20', barColor: 'bg-green-500' }
        : hpPercent > 25
            ? { label: 'Bloodied', color: 'text-yellow-400', bg: 'bg-yellow-500/20', barColor: 'bg-yellow-500' }
            : { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/20', barColor: 'bg-red-500' };

    return (
        <div className="flex items-center gap-3 bg-black/20 border border-white/5 rounded-lg px-3 py-2.5">
            {/* Adversary Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm">{adversary.label}</h3>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
                        T{adversary.tier}
                    </span>
                    <span className="text-xs text-gray-500">{adversary.type}</span>
                </div>

                {/* Health Bar (no numbers, just visual) */}
                <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div
                            className={clsx('h-full rounded-full transition-all duration-500', healthStatus.barColor)}
                            style={{ width: `${hpPercent}%` }}
                        />
                    </div>
                    <span className={clsx('text-xs font-medium', healthStatus.color)}>
                        {healthStatus.label}
                    </span>
                </div>
            </div>

            {/* Difficulty indicator */}
            <div className="flex items-center gap-1 px-2 py-1 bg-black/20 rounded-lg">
                <AppIcons.combat.target size={12} className="text-yellow-400" />
                <span className="text-xs text-gray-400">{adversary.difficulty}</span>
            </div>
        </div>
    );
}
