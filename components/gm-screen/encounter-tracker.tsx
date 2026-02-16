'use client';

/**
 * ENCOUNTER TRACKER COMPONENT
 * ----------------------------------------------------------------------------
 * The GM's combat management panel. Allows the GM to:
 * - Create and manage encounters
 * - Track pinned adversary HP/stress in real-time
 * - Spotlight adversaries and activate their features
 * - Mark adversaries as defeated
 * - Control player visibility of the encounter
 * - End GM turn (clear spotlights)
 *
 * The PinnedAdversaryCard is extracted to its own file for maintainability.
 */

import { useState } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { AppIcons } from '@/lib/icon-utils';
import { PinnedAdversaryCard } from './pinned-adversary-card';
import type { EncounterStatus } from '@/types/campaign';
import clsx from 'clsx';

interface EncounterTrackerProps {
    campaignId: string;
}

export function EncounterTracker({ campaignId }: EncounterTrackerProps) {
    const {
        activeEncounter,
        activeCampaign,
        createEncounter,
        endEncounter,
        setEncounterStatus,
        toggleEncounterVisibility,
        unpinAdversary,
        damageAdversary,
        healAdversary,
        defeatAdversary,
        reviveAdversary,
        spotlightAdversary,
        clearSpotlights,
        activateAdversaryFeature,
    } = useCharacterStore();

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [encounterName, setEncounterName] = useState('');
    const [encounterDescription, setEncounterDescription] = useState('');
    const [expandedAdversary, setExpandedAdversary] = useState<string | null>(null);

    const currentFear = activeCampaign?.fear_current ?? 0;
    const hasSpotlights = activeEncounter?.adversaries.some(a => a.is_spotlighted) ?? false;

    const handleCreateEncounter = async () => {
        if (!encounterName.trim()) return;
        await createEncounter(campaignId, encounterName.trim(), encounterDescription.trim() || undefined);
        setEncounterName('');
        setEncounterDescription('');
        setShowCreateForm(false);
    };

    const handleEndEncounter = async () => {
        if (!confirm('End this encounter? Pinned adversaries will be removed.')) return;
        await endEncounter(campaignId);
    };

    // No active encounter - show create form
    if (!activeEncounter) {
        return (
            <div className="bg-dagger-panel border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/20">
                            <AppIcons.combat.attack size={20} className="text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-serif font-bold text-white">Encounter</h2>
                            <p className="text-xs text-gray-500">No active encounter</p>
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    {showCreateForm ? (
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={encounterName}
                                onChange={(e) => setEncounterName(e.target.value)}
                                placeholder="Encounter name..."
                                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-orange-500/50"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateEncounter()}
                            />
                            <textarea
                                value={encounterDescription}
                                onChange={(e) => setEncounterDescription(e.target.value)}
                                placeholder="Description (optional)..."
                                rows={2}
                                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-orange-500/50 resize-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCreateEncounter}
                                    disabled={!encounterName.trim()}
                                    className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg text-sm transition-colors"
                                >
                                    Create Encounter
                                </button>
                                <button
                                    onClick={() => setShowCreateForm(false)}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="w-full py-8 flex flex-col items-center gap-3 border-2 border-dashed border-white/10 hover:border-orange-500/30 rounded-xl transition-colors group"
                        >
                            <div className="p-3 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                                <AppIcons.combat.attack size={28} className="text-orange-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-white font-medium">Start an Encounter</p>
                                <p className="text-xs text-gray-500 mt-1">Pin adversaries from the browser to track them</p>
                            </div>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Active encounter
    const aliveCount = activeEncounter.adversaries.filter(a => !a.is_defeated).length;
    const totalCount = activeEncounter.adversaries.length;
    const defeatedCount = totalCount - aliveCount;

    const statusColors: Record<EncounterStatus, { bg: string; text: string; label: string }> = {
        preparing: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Preparing' },
        active: { bg: 'bg-red-500/20', text: 'text-red-300', label: 'In Combat' },
        completed: { bg: 'bg-green-500/20', text: 'text-green-300', label: 'Completed' },
    };
    const currentStatus = statusColors[activeEncounter.status];

    return (
        <div className="bg-dagger-panel border border-white/10 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/20">
                            <AppIcons.combat.attack size={20} className="text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-serif font-bold text-white">{activeEncounter.name}</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', currentStatus.bg, currentStatus.text)}>
                                    {currentStatus.label}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {aliveCount}/{totalCount} alive
                                    {defeatedCount > 0 && ` (${defeatedCount} defeated)`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Encounter Controls */}
                <div className="flex gap-2 mt-3">
                    {activeEncounter.status === 'preparing' && (
                        <button
                            onClick={() => setEncounterStatus(campaignId, 'active')}
                            className="flex-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                        >
                            <AppIcons.combat.attack size={14} />
                            Begin Combat
                        </button>
                    )}
                    {activeEncounter.status === 'active' && (
                        <>
                            <button
                                onClick={() => setEncounterStatus(campaignId, 'preparing')}
                                className="flex-1 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg text-xs font-medium transition-colors"
                            >
                                Pause
                            </button>
                            {hasSpotlights && (
                                <button
                                    onClick={() => clearSpotlights(campaignId)}
                                    className="px-3 py-1.5 bg-dagger-gold/20 hover:bg-dagger-gold/30 text-dagger-gold rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                                >
                                    <AppIcons.ui.reset size={12} />
                                    End GM Turn
                                </button>
                            )}
                        </>
                    )}
                    <button
                        onClick={() => toggleEncounterVisibility(campaignId)}
                        className={clsx(
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                            activeEncounter.is_visible_to_players
                                ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
                                : 'bg-white/10 hover:bg-white/20 text-gray-400'
                        )}
                    >
                        {activeEncounter.is_visible_to_players ? (
                            <><AppIcons.ui.visibility size={14} /> Visible</>
                        ) : (
                            <><AppIcons.ui.visibilityOff size={14} /> Hidden</>
                        )}
                    </button>
                    <button
                        onClick={handleEndEncounter}
                        className="px-3 py-1.5 bg-white/10 hover:bg-red-500/20 text-gray-400 hover:text-red-300 rounded-lg text-xs font-medium transition-colors"
                    >
                        End
                    </button>
                </div>
            </div>

            {/* Adversary List */}
            <div className="max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-hide">
                {activeEncounter.adversaries.length === 0 ? (
                    <div className="p-8 text-center">
                        <AppIcons.combat.attack size={32} className="mx-auto mb-2 text-gray-600" />
                        <p className="text-gray-400 text-sm">No adversaries pinned</p>
                        <p className="text-gray-600 text-xs mt-1">Use the Adversaries tab to pin enemies</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {activeEncounter.adversaries.map((adversary) => (
                            <PinnedAdversaryCard
                                key={adversary.id}
                                adversary={adversary}
                                campaignId={campaignId}
                                currentFear={currentFear}
                                isExpanded={expandedAdversary === adversary.id}
                                onToggle={() => setExpandedAdversary(
                                    expandedAdversary === adversary.id ? null : adversary.id
                                )}
                                onDamage={(dmg) => damageAdversary(campaignId, adversary.id, dmg)}
                                onHeal={(amt) => healAdversary(campaignId, adversary.id, amt)}
                                onDamageStress={(dmg) => damageAdversary(campaignId, adversary.id, dmg, true)}
                                onHealStress={(amt) => healAdversary(campaignId, adversary.id, amt, true)}
                                onDefeat={() => defeatAdversary(campaignId, adversary.id)}
                                onRevive={() => reviveAdversary(campaignId, adversary.id)}
                                onUnpin={() => unpinAdversary(campaignId, adversary.id)}
                                onSpotlight={() => spotlightAdversary(campaignId, adversary.id)}
                                onActivateFeature={(featureName, fearCost, stressCost) =>
                                    activateAdversaryFeature(campaignId, adversary.id, featureName, fearCost, stressCost)
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
