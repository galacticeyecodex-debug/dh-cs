'use client';

/**
 * CAMPAIGN NPC DIRECTORY
 * ----------------------------------------------------------------------------
 * A GM tool for managing campaign-wide NPCs. The GM can:
 * - Create NPCs with name, description, and starting relationship points
 * - Push NPCs to all party members' journals in one click
 * - Track which party members have received each NPC
 *
 * This makes sharing NPCs trivial and fun - the GM creates them once
 * and pushes to everyone, instead of each player adding them manually.
 */

import { useState } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { AppIcons } from '@/lib/icon-utils';
import { getRelationshipTier, getRelationshipTierInfo } from '@/types/journal';
import { motion, AnimatePresence } from 'framer-motion';
import { Z_INDEX } from '@/constants/z-index';
import clsx from 'clsx';

interface CampaignNPCDirectoryProps {
    isOpen: boolean;
    onClose: () => void;
    campaignId: string;
}

export function CampaignNPCDirectory({ isOpen, onClose, campaignId }: CampaignNPCDirectoryProps) {
    const {
        campaignNPCs,
        addCampaignNPC,
        removeCampaignNPC,
        pushNPCToParty,
        partyCharacters,
    } = useCharacterStore();

    const [showAddForm, setShowAddForm] = useState(false);
    const [npcName, setNpcName] = useState('');
    const [npcDescription, setNpcDescription] = useState('');
    const [npcBondBoon, setNpcBondBoon] = useState('');
    const [npcBondBane, setNpcBondBane] = useState('');
    const [npcPoints, setNpcPoints] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setNpcName('');
        setNpcDescription('');
        setNpcBondBoon('');
        setNpcBondBane('');
        setNpcPoints(0);
        setShowAddForm(false);
        setIsSubmitting(false);
    };

    const handleAddNPC = async () => {
        if (!npcName.trim() || isSubmitting) return;
        setIsSubmitting(true);

        await addCampaignNPC(campaignId, {
            name: npcName.trim(),
            description: npcDescription.trim() || undefined,
            bond_boon: npcBondBoon.trim() || undefined,
            bond_bane: npcBondBane.trim() || undefined,
            starting_points: npcPoints,
        });

        resetForm();
    };

    const handlePush = async (npcId: string) => {
        await pushNPCToParty(campaignId, npcId);
    };

    const handleRemove = async (npcId: string) => {
        await removeCampaignNPC(campaignId, npcId);
    };

    const tier = getRelationshipTier(npcPoints);
    const tierInfo = getRelationshipTierInfo(tier);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60"
                        style={{ zIndex: Z_INDEX.MODAL }}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full max-w-lg bg-dagger-dark border-l border-white/10 shadow-2xl flex flex-col"
                        style={{ zIndex: Z_INDEX.MODAL + 1 }}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-pink-500/20">
                                    <AppIcons.campaign.party size={20} className="text-pink-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-serif font-bold text-white">Campaign NPCs</h2>
                                    <p className="text-xs text-gray-500">
                                        {campaignNPCs.length} NPCs &middot; {partyCharacters.length} party members
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <AppIcons.ui.close size={18} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Add NPC Section */}
                        <div className="p-4 border-b border-white/10">
                            {showAddForm ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={npcName}
                                        onChange={(e) => setNpcName(e.target.value)}
                                        placeholder="NPC Name *"
                                        className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-pink-500/50"
                                        autoFocus
                                    />
                                    <textarea
                                        value={npcDescription}
                                        onChange={(e) => setNpcDescription(e.target.value)}
                                        placeholder="Description (who are they, where did the party meet them?)"
                                        rows={2}
                                        className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-pink-500/50 resize-none"
                                    />

                                    {/* Starting Relationship */}
                                    <div className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                                        <span className="text-sm text-gray-400">Starting Relationship</span>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setNpcPoints(Math.max(-5, npcPoints - 1))}
                                                className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors text-sm font-bold"
                                            >
                                                -
                                            </button>
                                            <div className="text-center min-w-[60px]">
                                                <span className={clsx('text-lg font-bold', tierInfo.color)}>
                                                    {npcPoints > 0 ? '+' : ''}{npcPoints}
                                                </span>
                                                <p className={clsx('text-xs', tierInfo.color)}>{tierInfo.label}</p>
                                            </div>
                                            <button
                                                onClick={() => setNpcPoints(Math.min(5, npcPoints + 1))}
                                                className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors text-sm font-bold"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {/* Bond Effects */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            value={npcBondBoon}
                                            onChange={(e) => setNpcBondBoon(e.target.value)}
                                            placeholder="Bond Boon (positive)"
                                            className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-green-500/50"
                                        />
                                        <input
                                            type="text"
                                            value={npcBondBane}
                                            onChange={(e) => setNpcBondBane(e.target.value)}
                                            placeholder="Bond Bane (negative)"
                                            className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-red-500/50"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleAddNPC}
                                            disabled={!npcName.trim() || isSubmitting}
                                            className="flex-1 px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg text-sm transition-colors"
                                        >
                                            Add NPC
                                        </button>
                                        <button
                                            onClick={resetForm}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-white/10 hover:border-pink-500/30 rounded-xl transition-colors group"
                                >
                                    <AppIcons.ui.add size={16} className="text-gray-500 group-hover:text-pink-400" />
                                    <span className="text-sm text-gray-400 group-hover:text-white">Add New NPC</span>
                                </button>
                            )}
                        </div>

                        {/* NPC List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {campaignNPCs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <AppIcons.campaign.party size={40} className="text-gray-600 mb-3" />
                                    <p className="text-gray-400 text-sm">No campaign NPCs yet</p>
                                    <p className="text-gray-600 text-xs mt-1">
                                        Create NPCs here and push them to all party members&apos; journals instantly
                                    </p>
                                </div>
                            ) : (
                                campaignNPCs.map((npc) => {
                                    const npcTier = getRelationshipTier(npc.starting_points);
                                    const npcTierInfo = getRelationshipTierInfo(npcTier);
                                    const pushedCount = npc.pushed_to.length;
                                    const totalParty = partyCharacters.length;
                                    const allPushed = totalParty > 0 && pushedCount >= totalParty;

                                    return (
                                        <div
                                            key={npc.id}
                                            className="bg-black/20 border border-white/5 rounded-lg p-4 group"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-white">{npc.name}</h3>
                                                        <span className={clsx('text-xs px-1.5 py-0.5 rounded', npcTierInfo.color, 'bg-white/5')}>
                                                            {npcTierInfo.label}
                                                        </span>
                                                    </div>
                                                    {npc.description && (
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{npc.description}</p>
                                                    )}
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {npc.bond_boon && (
                                                            <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                                                                Boon: {npc.bond_boon}
                                                            </span>
                                                        )}
                                                        {npc.bond_bane && (
                                                            <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                                                                Bane: {npc.bond_bane}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Push Status & Actions */}
                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                                                <span className="text-xs text-gray-500">
                                                    {pushedCount}/{totalParty} party members
                                                </span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handlePush(npc.id)}
                                                        disabled={allPushed || totalParty === 0}
                                                        className={clsx(
                                                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                                                            allPushed
                                                                ? 'bg-green-500/10 text-green-400 cursor-default'
                                                                : 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-300'
                                                        )}
                                                    >
                                                        {allPushed ? (
                                                            <>All Synced</>
                                                        ) : (
                                                            <>
                                                                <AppIcons.system.sync size={12} />
                                                                Push to Party
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemove(npc.id)}
                                                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <AppIcons.ui.delete size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
