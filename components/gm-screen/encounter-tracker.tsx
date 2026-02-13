'use client';

/**
 * ENCOUNTER TRACKER COMPONENT
 * ----------------------------------------------------------------------------
 * The GM's combat management panel. Allows the GM to:
 * - Create and manage encounters
 * - Track pinned adversary HP/stress in real-time
 * - Mark adversaries as defeated
 * - Control player visibility of the encounter
 * - Quick reference adversary stats during combat
 */

import { useState } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { AppIcons } from '@/lib/icon-utils';
import { MarkdownText } from '@/components/shared/markdown-text';
import type { PinnedAdversary, EncounterStatus } from '@/types/campaign';
import clsx from 'clsx';

interface EncounterTrackerProps {
    campaignId: string;
}

export function EncounterTracker({ campaignId }: EncounterTrackerProps) {
    const {
        activeEncounter,
        createEncounter,
        endEncounter,
        setEncounterStatus,
        toggleEncounterVisibility,
        unpinAdversary,
        damageAdversary,
        healAdversary,
        defeatAdversary,
        reviveAdversary,
    } = useCharacterStore();

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [encounterName, setEncounterName] = useState('');
    const [encounterDescription, setEncounterDescription] = useState('');
    const [expandedAdversary, setExpandedAdversary] = useState<string | null>(null);

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
                        <button
                            onClick={() => setEncounterStatus(campaignId, 'preparing')}
                            className="flex-1 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg text-xs font-medium transition-colors"
                        >
                            Pause
                        </button>
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
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface PinnedAdversaryCardProps {
    adversary: PinnedAdversary;
    campaignId: string;
    isExpanded: boolean;
    onToggle: () => void;
    onDamage: (amount: number) => void;
    onHeal: (amount: number) => void;
    onDamageStress: (amount: number) => void;
    onHealStress: (amount: number) => void;
    onDefeat: () => void;
    onRevive: () => void;
    onUnpin: () => void;
}

function PinnedAdversaryCard({
    adversary,
    isExpanded,
    onToggle,
    onDamage,
    onHeal,
    onDamageStress,
    onHealStress,
    onDefeat,
    onRevive,
    onUnpin,
}: PinnedAdversaryCardProps) {
    const [damageInput, setDamageInput] = useState('');
    const [stressDamageInput, setStressDamageInput] = useState('');

    const hpPercent = adversary.hp_max > 0
        ? (adversary.hp_current / adversary.hp_max) * 100
        : 0;

    const stressPercent = adversary.stress_max > 0
        ? (adversary.stress_current / adversary.stress_max) * 100
        : 0;

    const hpColor = hpPercent > 50
        ? 'bg-green-500'
        : hpPercent > 25
            ? 'bg-yellow-500'
            : 'bg-red-500';

    const handleDamageSubmit = () => {
        const amount = parseInt(damageInput);
        if (!isNaN(amount) && amount > 0) {
            onDamage(amount);
            setDamageInput('');
        }
    };

    const handleStressDamageSubmit = () => {
        const amount = parseInt(stressDamageInput);
        if (!isNaN(amount) && amount > 0) {
            onDamageStress(amount);
            setStressDamageInput('');
        }
    };

    return (
        <div className={clsx(
            'p-3 transition-all',
            adversary.is_defeated
                ? 'opacity-50 bg-black/20'
                : 'hover:bg-white/5'
        )}>
            {/* Header Row */}
            <button
                onClick={onToggle}
                className="w-full text-left flex items-center gap-3"
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className={clsx(
                            'font-bold',
                            adversary.is_defeated ? 'text-gray-500 line-through' : 'text-white'
                        )}>
                            {adversary.label}
                        </h3>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
                            T{adversary.tier}
                        </span>
                        {adversary.is_defeated && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400">
                                Defeated
                            </span>
                        )}
                    </div>

                    {/* HP Bar */}
                    {!adversary.is_defeated && (
                        <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                                <div
                                    className={clsx('h-full rounded-full transition-all duration-300', hpColor)}
                                    style={{ width: `${hpPercent}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-400 tabular-nums min-w-[48px] text-right">
                                {adversary.hp_current}/{adversary.hp_max}
                            </span>
                        </div>
                    )}
                </div>

                {isExpanded ? (
                    <AppIcons.ui.collapse size={18} className="text-gray-500 flex-shrink-0" />
                ) : (
                    <AppIcons.ui.expand size={18} className="text-gray-500 flex-shrink-0" />
                )}
            </button>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-3 space-y-3">
                    {/* HP & Stress Tracks */}
                    {!adversary.is_defeated && (
                        <div className="space-y-2">
                            {/* HP Damage Input */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 min-w-[60px]">
                                    <AppIcons.vitals.hitPoints size={14} className="text-red-400" />
                                    <span className="text-xs text-gray-400">HP</span>
                                </div>
                                <div className="flex-1 flex items-center gap-1">
                                    <button
                                        onClick={() => onHeal(1)}
                                        className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded text-xs font-bold transition-colors"
                                    >
                                        +1
                                    </button>
                                    <input
                                        type="number"
                                        value={damageInput}
                                        onChange={(e) => setDamageInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleDamageSubmit()}
                                        placeholder="Dmg"
                                        min={1}
                                        className="w-16 px-2 py-1 bg-black/40 border border-white/10 rounded text-xs text-white text-center placeholder:text-gray-600 focus:outline-none focus:border-red-500/50"
                                    />
                                    <button
                                        onClick={handleDamageSubmit}
                                        disabled={!damageInput}
                                        className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-30 text-red-300 rounded text-xs font-bold transition-colors"
                                    >
                                        Hit
                                    </button>
                                </div>
                                <span className="text-xs text-gray-500 tabular-nums">
                                    {adversary.hp_current}/{adversary.hp_max}
                                </span>
                            </div>

                            {/* Stress Damage Input */}
                            {adversary.stress_max > 0 && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 min-w-[60px]">
                                        <AppIcons.vitals.stress size={14} className="text-purple-400" />
                                        <span className="text-xs text-gray-400">Stress</span>
                                    </div>
                                    <div className="flex-1 flex items-center gap-1">
                                        <button
                                            onClick={() => onHealStress(1)}
                                            className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded text-xs font-bold transition-colors"
                                        >
                                            +1
                                        </button>
                                        <input
                                            type="number"
                                            value={stressDamageInput}
                                            onChange={(e) => setStressDamageInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleStressDamageSubmit()}
                                            placeholder="Dmg"
                                            min={1}
                                            className="w-16 px-2 py-1 bg-black/40 border border-white/10 rounded text-xs text-white text-center placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
                                        />
                                        <button
                                            onClick={handleStressDamageSubmit}
                                            disabled={!stressDamageInput}
                                            className="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-30 text-purple-300 rounded text-xs font-bold transition-colors"
                                        >
                                            Hit
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-12 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 rounded-full transition-all duration-300"
                                                style={{ width: `${stressPercent}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500 tabular-nums">
                                            {adversary.stress_current}/{adversary.stress_max}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <div className="flex items-center gap-1.5 bg-black/20 rounded px-2 py-1.5">
                            <AppIcons.combat.target size={12} className="text-yellow-400" />
                            <span className="text-gray-400">Diff:</span>
                            <span className="text-white font-bold">{adversary.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-black/20 rounded px-2 py-1.5">
                            <AppIcons.vitals.armor size={12} className="text-blue-400" />
                            <span className="text-gray-400">Thr:</span>
                            <span className="text-white font-bold">{adversary.thresholds}</span>
                        </div>
                    </div>

                    {/* Attack Info */}
                    <div className="bg-black/20 rounded-lg p-2 text-xs">
                        <div className="flex items-center gap-1.5 mb-1">
                            <AppIcons.combat.attack size={12} className="text-orange-400" />
                            <MarkdownText className="text-white font-bold inline-block">{adversary.attack}</MarkdownText>
                            <span className="text-gray-500">({adversary.range})</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-gray-400">Atk: <MarkdownText className="text-white font-bold inline-block">{adversary.atk}</MarkdownText></span>
                            <span className="text-gray-400">Dmg: <MarkdownText className="text-orange-300 font-bold inline-block">{adversary.damage}</MarkdownText></span>
                        </div>
                    </div>

                    {/* Motives */}
                    <div className="text-xs">
                        <span className="text-gray-500">Motives: </span>
                        <MarkdownText className="text-gray-300 inline-block align-top">
                            {adversary.motives_and_tactics}
                        </MarkdownText>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1">
                        {adversary.is_defeated ? (
                            <button
                                onClick={onRevive}
                                className="flex-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-xs font-medium transition-colors"
                            >
                                Revive
                            </button>
                        ) : (
                            <button
                                onClick={onDefeat}
                                className="flex-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-medium transition-colors"
                            >
                                Defeat
                            </button>
                        )}
                        <button
                            onClick={onUnpin}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-400 rounded-lg text-xs font-medium transition-colors"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
