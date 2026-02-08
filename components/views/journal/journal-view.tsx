'use client';

/**
 * JOURNAL VIEW
 * ----------------------------------------------------------------------------
 * Main view for managing the character's journal including:
 * - NPC Relationships with tier tracking
 * - Reputation tracking with history
 * - Automatic campaign NPC seeding when campaigns are enabled
 */

import React, { useEffect, useState } from 'react';
import { useCharacterStore } from '@/store/character-store';
import {
    BookOpen,
    Users,
    Star,
    Plus,
    ChevronUp,
    ChevronDown,
    Trash2,
    Heart,
    Frown,
    Meh,
    Smile,
    Settings,
    FileText,
    Info,
} from 'lucide-react';
import {
    getRelationshipTier,
    getRelationshipTierInfo,
    getReputationTier,
    getReputationTierInfo,
} from '@/types/journal';
import type { Relationship, RelationshipTier } from '@/types/journal';
import clsx from 'clsx';
import RelationshipChangeModal from './relationship-change-modal';
import AddNPCModal from './add-npc-modal';
import TextNotesPanel from './text-notes-panel';
import PromptModal from '@/components/shared/prompt-modal';
import useCampaignNPCs from '@/hooks/useCampaignNPCs';
import type { CreateRelationshipInput } from '@/types/journal';
import { Z_INDEX } from '@/constants/z-index';

type JournalTab = 'relationships' | 'reputation' | 'notes';

export default function JournalView() {
    const [activeTab, setActiveTab] = useState<JournalTab>('relationships');
    const [isAddNPCModalOpen, setIsAddNPCModalOpen] = useState(false);
    const {
        relationships,
        relationshipsLoading,
        reputation,
        reputationHistory,
        notes,
        fetchRelationships,
        createRelationship,
        updateRelationshipPoints,
        deleteRelationship,
        changeReputation,
        createNote,
        updateNote,
        deleteNote,
    } = useCharacterStore();

    // Hook to automatically seed campaign NPCs when content is enabled
    useCampaignNPCs();

    // Fetch relationships on mount
    useEffect(() => {
        fetchRelationships();
    }, [fetchRelationships]);

    // Handler for creating a new NPC
    const handleAddNPC = async (input: CreateRelationshipInput) => {
        await createRelationship(input);
    };

    return (
        <div className="p-4 space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-dagger-gold/10">
                    <BookOpen size={28} className="text-dagger-gold" />
                </div>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-white">Journal</h1>
                    <p className="text-sm text-gray-400">Track relationships, reputation, and notes</p>
                </div>
            </div>

            {/* Tab Selector */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl overflow-x-auto">
                <button
                    onClick={() => setActiveTab('relationships')}
                    className={clsx(
                        'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-colors whitespace-nowrap',
                        activeTab === 'relationships'
                            ? 'bg-dagger-gold text-black'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                >
                    <Users size={18} />
                    Relationships
                </button>
                <button
                    onClick={() => setActiveTab('reputation')}
                    className={clsx(
                        'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-colors whitespace-nowrap',
                        activeTab === 'reputation'
                            ? 'bg-dagger-gold text-black'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                >
                    <Star size={18} />
                    Reputation
                </button>
                <button
                    onClick={() => setActiveTab('notes')}
                    className={clsx(
                        'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-colors whitespace-nowrap',
                        activeTab === 'notes'
                            ? 'bg-dagger-gold text-black'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                >
                    <FileText size={18} />
                    Notes
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'relationships' ? (
                <RelationshipsPanel
                    relationships={relationships}
                    loading={relationshipsLoading}
                    onChangePoints={updateRelationshipPoints}
                    onDelete={deleteRelationship}
                    onAddNPC={() => setIsAddNPCModalOpen(true)}
                />
            ) : activeTab === 'reputation' ? (
                <ReputationPanel
                    reputation={reputation}
                    history={reputationHistory}
                    onChangeReputation={changeReputation}
                />
            ) : (
                <TextNotesPanel
                    notes={notes}
                    onCreate={createNote}
                    onUpdate={updateNote}
                    onDelete={deleteNote}
                />
            )}

            {/* Add NPC Modal */}
            <AddNPCModal
                isOpen={isAddNPCModalOpen}
                onClose={() => setIsAddNPCModalOpen(false)}
                onSubmit={handleAddNPC}
            />
        </div>
    );
}

// ============================================================================
// RELATIONSHIPS PANEL
// ============================================================================

interface RelationshipsPanelProps {
    relationships: Relationship[];
    loading: boolean;
    onChangePoints: (id: string, change: number) => void;
    onDelete: (id: string) => void;
    onAddNPC: () => void;
}

function RelationshipsPanel({
    relationships,
    loading,
    onChangePoints,
    onDelete,
    onAddNPC,
}: RelationshipsPanelProps) {
    // Sort: positive points first (highest to lowest), then negative (by magnitude), then zero last
    const sortedRelationships = [...relationships].sort((a, b) => {
        // Priority: positive > negative > zero
        const getPriority = (points: number) => {
            if (points > 0) return 0; // Positive first
            if (points < 0) return 1; // Negative second
            return 2; // Zero last
        };

        const priorityA = getPriority(a.points);
        const priorityB = getPriority(b.points);

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        // Within same priority, sort by magnitude (highest first)
        return Math.abs(b.points) - Math.abs(a.points);
    });

    return (
        <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">NPCs</h2>
                <button
                    onClick={onAddNPC}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-dagger-gold/10 text-dagger-gold hover:bg-dagger-gold/20 transition-colors"
                >
                    <Plus size={16} />
                    Add NPC
                </button>
            </div>

            {loading ? (
                <p className="text-gray-400 text-sm py-4 text-center">Loading relationships...</p>
            ) : relationships.length === 0 ? (
                <div className="text-center py-8">
                    <Users size={48} className="mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400 text-sm mb-2">No relationships tracked yet</p>
                    <p className="text-gray-500 text-xs">
                        Add NPCs to track your connections and their bond effects
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedRelationships.map((relationship) => (
                        <RelationshipCard
                            key={relationship.id}
                            relationship={relationship}
                            onChangePoints={onChangePoints}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// RELATIONSHIP CARD
// ============================================================================

interface RelationshipCardProps {
    relationship: Relationship;
    onChangePoints: (id: string, change: number) => void;
    onDelete: (id: string) => void;
}

function RelationshipCard({
    relationship,
    onChangePoints,
    onDelete,
}: RelationshipCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showDescription, setShowDescription] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);
    const tier = getRelationshipTier(relationship.points);
    const tierInfo = getRelationshipTierInfo(tier);

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showMenu]);

    const getTierIcon = (tier: RelationshipTier) => {
        switch (tier) {
            case 'enemy':
            case 'rival':
                return <Frown size={16} className={tierInfo.color} />;
            case 'acquaintance':
                return <Meh size={16} className={tierInfo.color} />;
            case 'friend':
                return <Smile size={16} className={tierInfo.color} />;
            case 'beloved':
                return <Heart size={16} className={tierInfo.color} />;
        }
    };

    const handleConfirmChange = (change: number, reason: string) => {
        onChangePoints(relationship.id, change);
        // TODO: Store the reason in a relationship history table
        console.log(`Relationship change: ${change}, Reason: ${reason}`);
    };

    return (
        <>
            <div className="relative p-3 pt-2 rounded-lg bg-white/5 border border-white/10">
                {/* Top-right action buttons - overlay */}
                <div 
                    className="absolute top-2 right-2 flex items-center gap-1"
                    style={{ zIndex: Z_INDEX.BASE + 1 }}
                >
                    {/* Info Button - toggle description */}
                    {relationship.npc_description && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDescription(!showDescription);
                            }}
                            className={clsx(
                                "transition-colors p-0.5 rounded hover:bg-white/10",
                                showDescription ? "text-dagger-gold" : "text-gray-500 hover:text-gray-300"
                            )}
                            aria-label={showDescription ? `Hide description for ${relationship.npc_name}` : `Show description for ${relationship.npc_name}`}
                            title={showDescription ? "Hide description" : "Show description"}
                        >
                            <Info size={12} />
                        </button>
                    )}

                    {/* Settings Menu */}
                    <div className="relative" ref={menuRef}>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className={clsx(
                                "transition-colors p-0.5 rounded hover:bg-white/10",
                                showMenu ? "text-white bg-white/10" : "text-gray-500 hover:text-gray-300"
                            )}
                            aria-label={`Settings for ${relationship.npc_name}`}
                            title="More options"
                        >
                            <Settings size={12} />
                        </button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <div
                                className="absolute right-0 top-full mt-1 w-44 bg-dagger-panel border border-white/10 rounded-lg shadow-xl overflow-hidden"
                                style={{ zIndex: Z_INDEX.MODAL }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => {
                                        setIsModalOpen(true);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2 transition-colors"
                                >
                                    <ChevronUp size={14} /> Adjust Points
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete(relationship.id);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 flex items-center gap-2 transition-colors border-t border-white/5"
                                >
                                    <Trash2 size={14} /> Remove NPC
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main content row */}
                <div className="flex items-center gap-3 pr-14">
                    {/* Tier icon */}
                    <div className="flex-shrink-0">
                        {getTierIcon(tier)}
                    </div>

                    {/* Name and tier label - stacked */}
                    <div className="flex-1 min-w-0">
                        <span className="font-medium text-white truncate block">
                            {relationship.npc_name}
                        </span>
                        <span className={clsx('text-xs font-medium', tierInfo.color)}>
                            {tierInfo.label}
                        </span>
                    </div>

                    {/* Points - clickable to adjust */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className={clsx(
                            'text-lg font-bold flex-shrink-0 hover:opacity-80 transition-opacity',
                            relationship.points > 0 ? 'text-green-400' :
                                relationship.points < 0 ? 'text-red-400' : 'text-gray-400'
                        )}
                        aria-label={`Adjust relationship points for ${relationship.npc_name}`}
                        title="Click to adjust points"
                    >
                        {relationship.points > 0 ? '+' : ''}{relationship.points}
                    </button>
                </div>

                {/* Bond effects - second row */}
                {(relationship.bond_boon || relationship.bond_bane) && (
                    <div className="flex flex-wrap gap-2 text-xs mt-2 ml-7">
                        {relationship.bond_boon && (tier === 'friend' || tier === 'beloved') ? (
                            <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400">
                                {relationship.bond_boon}
                            </span>
                        ) : null}
                        {relationship.bond_bane && (tier === 'rival' || tier === 'enemy') ? (
                            <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400">
                                {relationship.bond_bane}
                            </span>
                        ) : null}
                    </div>
                )}

                {/* Collapsible Description Panel */}
                {showDescription && relationship.npc_description && (
                    <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/5 text-sm text-gray-300">
                        {relationship.npc_description}
                    </div>
                )}
            </div>

            {/* Relationship Change Modal */}
            <RelationshipChangeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                npcName={relationship.npc_name}
                onConfirm={handleConfirmChange}
            />
        </>
    );
}

// ============================================================================
// REPUTATION PANEL
// ============================================================================

interface ReputationPanelProps {
    reputation: number;
    history: { id: string; description: string; change: number; timestamp: string }[];
    onChangeReputation: (change: number, description: string) => void;
}

function ReputationPanel({
    reputation,
    history,
    onChangeReputation,
}: ReputationPanelProps) {
    const tier = getReputationTier(reputation);
    const tierInfo = getReputationTierInfo(tier);
    const [promptOpen, setPromptOpen] = useState(false);
    const [pendingChange, setPendingChange] = useState<number>(0);

    const handleOpenPrompt = (change: number) => {
        setPendingChange(change);
        setPromptOpen(true);
    };

    const handleConfirmChange = (description: string) => {
        onChangeReputation(pendingChange, description);
    };

    return (
        <>
            <PromptModal
                isOpen={promptOpen}
                onClose={() => setPromptOpen(false)}
                title={pendingChange > 0 ? "Reputation Increase" : "Reputation Decrease"}
                description={pendingChange > 0 ? "What caused your reputation to improve?" : "What caused your reputation to decline?"}
                placeholder="Describe the event..."
                submitLabel="Confirm"
                onSubmit={handleConfirmChange}
            />
            <div className="space-y-4">
                {/* Current Reputation */}
                <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
                    <h2 className="text-lg font-semibold text-white mb-4">Current Standing</h2>

                    {/* Reputation meter */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <button
                            onClick={() => handleOpenPrompt(-1)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                            aria-label="Decrease reputation"
                        >
                            <ChevronDown size={24} />
                        </button>

                        <div className="text-center">
                            <div className={clsx('text-4xl font-bold mb-1', tierInfo.color)}>
                                {reputation > 0 ? '+' : ''}{reputation}
                            </div>
                            <div className={clsx('text-lg font-semibold', tierInfo.color)}>
                                {tierInfo.label}
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                                {tierInfo.effect}
                            </div>
                        </div>

                        <button
                            onClick={() => handleOpenPrompt(1)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-green-500/20 text-gray-400 hover:text-green-400 transition-colors"
                            aria-label="Increase reputation"
                        >
                            <ChevronUp size={24} />
                        </button>
                    </div>

                    {/* Tier scale */}
                    <div className="flex justify-between text-xs text-gray-500 px-2">
                        <span>Pariah</span>
                        <span>Troubled</span>
                        <span>Average</span>
                        <span>Respected</span>
                        <span>Legend</span>
                    </div>
                    <div className="h-2 rounded-full bg-gradient-to-r from-red-500 via-gray-500 to-dagger-gold mt-1 relative">
                        {/* Position indicator */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-dagger-dark"
                            style={{
                                left: `${Math.min(Math.max((reputation + 6) / 12 * 100, 0), 100)}%`,
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                    </div>
                </div>

                {/* History */}
                <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
                    <h2 className="text-lg font-semibold text-white mb-3">History</h2>

                    {history.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4">
                            No reputation changes recorded
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {history.slice(0, 10).map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-center justify-between p-2 rounded bg-white/5"
                                >
                                    <span className="text-sm text-gray-300">{event.description}</span>
                                    <span className={clsx(
                                        'text-sm font-medium',
                                        event.change > 0 ? 'text-green-400' : 'text-red-400'
                                    )}>
                                        {event.change > 0 ? '+' : ''}{event.change}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
