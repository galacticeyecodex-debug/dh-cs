'use client';

/**
 * ADVERSARY BROWSER COMPONENT
 * ----------------------------------------------------------------------------
 * Provides a searchable list of Daggerheart adversaries for GMs.
 * 
 * FEATURES:
 * - Search by name, type, or description
 * - Filter by tier (1-4)
 * - Expandable cards showing full adversary details
 * - Matches the Daggerheart style guide
 */

import React, { useState, useMemo, useEffect } from 'react';
import { AppIcons } from '@/lib/icon-utils';
import { Adversary } from '@/types/adversary';
import { MarkdownText } from '@/components/shared/markdown-text';
import clsx from 'clsx';

// Import adversary data
import adversariesData from '@/content/public/srd/json/adversaries.json';

interface AdversaryBrowserProps {
    /** Optional: Compact mode for sidebar usage */
    compact?: boolean;
}

export function AdversaryBrowser({ compact = false }: AdversaryBrowserProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTier, setSelectedTier] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [adversaries, setAdversaries] = useState<Adversary[]>([]);

    useEffect(() => {
        setAdversaries(adversariesData as Adversary[]);
    }, []);

    const filteredAdversaries = useMemo(() => {
        return adversaries.filter(adversary => {
            const matchesSearch = searchTerm === '' ||
                adversary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                adversary.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                adversary.description.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesTier = selectedTier === 'all' || adversary.tier === selectedTier;

            return matchesSearch && matchesTier;
        });
    }, [adversaries, searchTerm, selectedTier]);

    const toggleExpanded = (name: string) => {
        setExpandedId(expandedId === name ? null : name);
    };

    const tiers = ['all', '1', '2', '3', '4'];

    return (
        <div className="bg-dagger-panel border border-white/10 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-red-500/20">
                        <AppIcons.vitals.fear size={20} className="text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-serif font-bold text-white">Adversaries</h2>
                        <p className="text-xs text-gray-500">{filteredAdversaries.length} found</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <AppIcons.ui.search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search adversaries..."
                        className="w-full pl-9 pr-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-red-500/50"
                    />
                </div>

                {/* Tier Filter */}
                <div className="flex gap-1">
                    {tiers.map(tier => (
                        <button
                            key={tier}
                            onClick={() => setSelectedTier(tier)}
                            className={clsx(
                                'px-3 py-1 text-xs font-medium rounded-lg transition-colors',
                                selectedTier === tier
                                    ? 'bg-red-500/30 text-red-300'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            )}
                        >
                            {tier === 'all' ? 'All Tiers' : `Tier ${tier}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Adversary List */}
            <div className={clsx(
                'overflow-y-auto scrollbar-hide',
                compact ? 'max-h-[400px]' : 'max-h-[600px]'
            )}>
                {filteredAdversaries.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <AppIcons.vitals.fear size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No adversaries found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {filteredAdversaries.map((adversary) => (
                            <AdversaryCard
                                key={adversary.name}
                                adversary={adversary}
                                isExpanded={expandedId === adversary.name}
                                onToggle={() => toggleExpanded(adversary.name)}
                                compact={compact}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface AdversaryCardProps {
    adversary: Adversary;
    isExpanded: boolean;
    onToggle: () => void;
    compact?: boolean;
}

function AdversaryCard({ adversary, isExpanded, onToggle, compact }: AdversaryCardProps) {
    return (
        <div className="p-3 hover:bg-white/5 transition-colors">
            {/* Header Row */}
            <button
                onClick={onToggle}
                className="w-full text-left flex items-start justify-between gap-2"
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white">{adversary.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                            Tier {adversary.tier}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-400">
                            {adversary.type}
                        </span>
                    </div>
                    <MarkdownText className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {adversary.description}
                    </MarkdownText>
                </div>
                {isExpanded ? (
                    <AppIcons.ui.collapse size={18} className="text-gray-500 flex-shrink-0 mt-1" />
                ) : (
                    <AppIcons.ui.expand size={18} className="text-gray-500 flex-shrink-0 mt-1" />
                )}
            </button>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                            <AppIcons.combat.target size={14} className="text-yellow-400" />
                            <span className="text-gray-400">Difficulty:</span>
                            <span className="text-white font-bold">{adversary.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                            <AppIcons.vitals.armor size={14} className="text-blue-400" />
                            <span className="text-gray-400">Thresholds:</span>
                            <span className="text-white font-bold">{adversary.thresholds}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                            <AppIcons.vitals.hitPoints size={14} className="text-red-400" />
                            <span className="text-gray-400">HP:</span>
                            <span className="text-white font-bold">{adversary.hp}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                            <AppIcons.vitals.stress size={14} className="text-purple-400" />
                            <span className="text-gray-400">Stress:</span>
                            <span className="text-white font-bold">{adversary.stress}</span>
                        </div>
                    </div>

                    {/* Attack Info */}
                    <div className="bg-black/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <AppIcons.combat.attack size={14} className="text-orange-400" />
                            <MarkdownText className="text-sm font-bold text-white inline-block">
                                {adversary.attack}
                            </MarkdownText>
                            <span className="text-xs text-gray-500">({adversary.range})</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                            <span className="text-gray-400">Attack: <MarkdownText className="text-white font-bold inline-block">{adversary.atk}</MarkdownText></span>
                            <span className="text-gray-400">Damage: <MarkdownText className="text-orange-300 font-bold inline-block">{adversary.damage}</MarkdownText></span>
                        </div>
                    </div>

                    {/* Motives */}
                    <div className="text-xs">
                        <span className="text-gray-500">Motives & Tactics: </span>
                        <MarkdownText className="text-gray-300 inline-block align-top">
                            {adversary.motives_and_tactics}
                        </MarkdownText>
                    </div>

                    {/* Experience */}
                    {adversary.experience && (
                        <div className="text-xs">
                            <span className="text-gray-500">Experience: </span>
                            <MarkdownText className="text-gray-300 inline-block align-top">
                                {adversary.experience}
                            </MarkdownText>
                        </div>
                    )}

                    {/* Feats */}
                    {adversary.feats.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Feats</h4>
                            {adversary.feats.map((feat, idx) => (
                                <div key={idx} className="bg-black/20 rounded-lg p-2">
                                    <p className="text-xs font-bold text-orange-300 mb-1">{feat.name}</p>
                                    <MarkdownText className="text-xs text-gray-400 leading-relaxed">
                                        {feat.text}
                                    </MarkdownText>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
