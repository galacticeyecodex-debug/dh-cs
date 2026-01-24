'use client';

/**
 * ENVIRONMENT BROWSER COMPONENT
 * ----------------------------------------------------------------------------
 * Provides a searchable list of Daggerheart environments for GMs.
 * 
 * FEATURES:
 * - Search by name, type, or description
 * - Filter by tier (1-4)
 * - Expandable cards showing full environment details
 * - Matches the Daggerheart style guide
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Map, ChevronDown, ChevronUp, Target, Users } from 'lucide-react';
import { Environment } from '@/types/adversary';
import { MarkdownText } from '@/components/shared/markdown-text';
import clsx from 'clsx';

// Import environment data
import environmentsData from '@/content/public/srd/json/environments.json';

interface EnvironmentBrowserProps {
    /** Optional: Compact mode for sidebar usage */
    compact?: boolean;
}

export function EnvironmentBrowser({ compact = false }: EnvironmentBrowserProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTier, setSelectedTier] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [environments, setEnvironments] = useState<Environment[]>([]);

    useEffect(() => {
        setEnvironments(environmentsData as Environment[]);
    }, []);

    const filteredEnvironments = useMemo(() => {
        return environments.filter(env => {
            const matchesSearch = searchTerm === '' ||
                env.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                env.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                env.description.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesTier = selectedTier === 'all' || env.tier === selectedTier;

            return matchesSearch && matchesTier;
        });
    }, [environments, searchTerm, selectedTier]);

    const toggleExpanded = (name: string) => {
        setExpandedId(expandedId === name ? null : name);
    };

    const tiers = ['all', '1', '2', '3', '4'];

    return (
        <div className="bg-dagger-panel border border-white/10 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-500/20">
                        <Map size={20} className="text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-serif font-bold text-white">Environments</h2>
                        <p className="text-xs text-gray-500">{filteredEnvironments.length} found</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search environments..."
                        className="w-full pl-9 pr-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-green-500/50"
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
                                    ? 'bg-green-500/30 text-green-300'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            )}
                        >
                            {tier === 'all' ? 'All Tiers' : `Tier ${tier}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Environment List */}
            <div className={clsx(
                'overflow-y-auto scrollbar-hide',
                compact ? 'max-h-[400px]' : 'max-h-[600px]'
            )}>
                {filteredEnvironments.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Map size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No environments found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {filteredEnvironments.map((environment) => (
                            <EnvironmentCard
                                key={environment.name}
                                environment={environment}
                                isExpanded={expandedId === environment.name}
                                onToggle={() => toggleExpanded(environment.name)}
                                compact={compact}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface EnvironmentCardProps {
    environment: Environment;
    isExpanded: boolean;
    onToggle: () => void;
    compact?: boolean;
}

function EnvironmentCard({ environment, isExpanded, onToggle }: EnvironmentCardProps) {
    return (
        <div className="p-3 hover:bg-white/5 transition-colors">
            {/* Header Row */}
            <button
                onClick={onToggle}
                className="w-full text-left flex items-start justify-between gap-2"
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white">{environment.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-300">
                            Tier {environment.tier}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-400">
                            {environment.type}
                        </span>
                    </div>
                    <MarkdownText className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {environment.description}
                    </MarkdownText>
                </div>
                {isExpanded ? (
                    <ChevronUp size={18} className="text-gray-500 flex-shrink-0 mt-1" />
                ) : (
                    <ChevronDown size={18} className="text-gray-500 flex-shrink-0 mt-1" />
                )}
            </button>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                    {/* Stats Row */}
                    <div className="flex gap-2 flex-wrap">
                        <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2 text-xs">
                            <Target size={14} className="text-yellow-400" />
                            <span className="text-gray-400">Difficulty:</span>
                            <span className="text-white font-bold">{environment.difficulty}</span>
                        </div>
                    </div>

                    {/* Impulses */}
                    <div className="text-xs">
                        <span className="text-gray-500">Impulses: </span>
                        <MarkdownText className="text-gray-300 inline-block align-top">
                            {environment.impulses}
                        </MarkdownText>
                    </div>

                    {/* Potential Adversaries */}
                    {environment.potential_adversaries && (
                        <div className="text-xs">
                            <div className="flex items-center gap-1 text-gray-500 mb-1">
                                <Users size={12} />
                                <span>Potential Adversaries:</span>
                            </div>
                            <MarkdownText className="text-gray-300 pl-4">
                                {environment.potential_adversaries}
                            </MarkdownText>
                        </div>
                    )}

                    {/* Feats */}
                    {environment.feats.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Features</h4>
                            {environment.feats.map((feat, idx) => (
                                <div key={idx} className="bg-black/20 rounded-lg p-2">
                                    <p className="text-xs font-bold text-green-300 mb-1">{feat.name}</p>
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
