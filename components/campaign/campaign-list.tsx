'use client';

import React, { useEffect, useState } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { Plus, Users } from 'lucide-react';
import CampaignCard from './campaign-card';
import CreateCampaignModal from './create-campaign-modal';
import JoinCampaignForm from './join-campaign-form';

export default function CampaignList() {
    const {
        campaigns,
        isLoadingCampaigns,
        fetchUserCampaigns,
    } = useCharacterStore();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinForm, setShowJoinForm] = useState(false);

    useEffect(() => {
        fetchUserCampaigns();
    }, [fetchUserCampaigns]);

    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Campaigns</h1>
                    <p className="text-gray-400">Create or join campaigns to play with your party</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowJoinForm(true)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
                        aria-label="Join campaign with invite code"
                    >
                        <Users size={20} />
                        Join Campaign
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-dagger-gold hover:bg-dagger-gold-light text-black font-bold rounded-lg transition-colors flex items-center gap-2"
                        aria-label="Create new campaign"
                    >
                        <Plus size={20} />
                        Create Campaign
                    </button>
                </div>
            </div>

            {isLoadingCampaigns ? (
                <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-dagger-gold border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 mt-4">Loading campaigns...</p>
                </div>
            ) : campaigns.length === 0 ? (
                <div className="bg-dagger-panel border border-white/10 rounded-xl p-12 text-center">
                    <Users size={48} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Campaigns Yet</h3>
                    <p className="text-gray-400 mb-6">Create your first campaign or join one with an invite code</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => setShowJoinForm(true)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        >
                            Join Campaign
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-dagger-gold hover:bg-dagger-gold-light text-black font-bold rounded-lg transition-colors"
                        >
                            Create Campaign
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {campaigns.map((campaign) => (
                        <CampaignCard key={campaign.id} campaign={campaign} />
                    ))}
                </div>
            )}

            <CreateCampaignModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />

            <JoinCampaignForm
                isOpen={showJoinForm}
                onClose={() => setShowJoinForm(false)}
            />
        </div>
    );
}
