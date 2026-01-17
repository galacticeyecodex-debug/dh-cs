'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCharacterStore } from '@/store/character-store';
import { ArrowLeft, Settings, LogOut, UserPlus, Crown, Monitor } from 'lucide-react';
import InviteCodeDisplay from '@/components/campaign/invite-code-display';
import MemberList from '@/components/campaign/member-list';
import CampaignSettingsModal from '@/components/campaign/campaign-settings-modal';
import AssignCharacterModal from '@/components/campaign/assign-character-modal';
import { ActivityFeed } from '@/components/activity';

export default function CampaignDetailPage() {
    const params = useParams();
    const router = useRouter();
    const campaignId = params?.id as string;

    const {
        activeCampaign,
        selectCampaign,
        clearActiveCampaign,
        leaveCampaign,
        user,
        isLoadingCampaigns,
    } = useCharacterStore();

    const [showSettings, setShowSettings] = useState(false);
    const [showAssignCharacter, setShowAssignCharacter] = useState(false);

    useEffect(() => {
        if (campaignId) {
            selectCampaign(campaignId);
        }

        return () => {
            clearActiveCampaign();
        };
    }, [campaignId]);

    const handleLeave = async () => {
        if (!activeCampaign) return;

        if (!confirm('Are you sure you want to leave this campaign?')) {
            return;
        }

        try {
            await leaveCampaign(activeCampaign.id);
            router.push('/app/campaigns');
        } catch (error) {
            console.error('Failed to leave campaign:', error);
        }
    };

    const isGM = activeCampaign?.gm_user_id === user?.id;

    if (isLoadingCampaigns) {
        return (
            <div className="min-h-screen bg-dagger-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-dagger-gold border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 mt-4">Loading campaign...</p>
                </div>
            </div>
        );
    }

    if (!activeCampaign) {
        return (
            <div className="min-h-screen bg-dagger-bg flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400">Campaign not found</p>
                    <button
                        onClick={() => router.push('/app/campaigns')}
                        className="mt-4 px-4 py-2 bg-dagger-gold hover:bg-dagger-gold-light text-black font-bold rounded-lg transition-colors"
                    >
                        Back to Campaigns
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dagger-bg">
            <div className="w-full max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/app/campaigns')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                        aria-label="Back to campaigns"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-sm font-medium">Back to Campaigns</span>
                    </button>

                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">{activeCampaign.name}</h1>
                            {activeCampaign.description && (
                                <p className="text-gray-400">{activeCampaign.description}</p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            {isGM && (
                                <>
                                    <button
                                        onClick={() => router.push(`/campaign/${activeCampaign.id}/gm`)}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-colors flex items-center gap-2"
                                        aria-label="Open GM Screen"
                                    >
                                        <Crown size={18} />
                                        <span className="hidden sm:inline">GM Screen</span>
                                    </button>
                                    <button
                                        onClick={() => setShowSettings(true)}
                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                        title="Campaign settings"
                                        aria-label="Open campaign settings"
                                    >
                                        <Settings size={20} className="text-gray-400" />
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setShowAssignCharacter(true)}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                                aria-label="Assign character to campaign"
                            >
                                <UserPlus size={18} />
                                Assign Character
                            </button>
                            {!isGM && (
                                <button
                                    onClick={handleLeave}
                                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2"
                                    aria-label="Leave campaign"
                                >
                                    <LogOut size={18} />
                                    Leave
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Fear Tracker */}
                <div className="bg-dagger-panel border border-white/10 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white">Fear</h2>
                        <div className="text-2xl font-bold text-white">
                            {activeCampaign.fear_current} / {activeCampaign.fear_max}
                        </div>
                    </div>
                    <div className="mt-4 h-3 bg-black/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-red-500 to-red-700 transition-all duration-500"
                            style={{
                                width: `${(activeCampaign.fear_current / activeCampaign.fear_max) * 100}%`,
                            }}
                        />
                    </div>
                </div>

                {/* Content Grid - 3 columns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Members - takes 1 column */}
                    <div className="lg:col-span-1">
                        <MemberList
                            members={activeCampaign.members || []}
                            campaignId={activeCampaign.id}
                            gmUserId={activeCampaign.gm_user_id}
                        />
                    </div>

                    {/* Activity Feed - takes 1 column */}
                    <div className="lg:col-span-1">
                        <ActivityFeed
                            campaignId={activeCampaign.id}
                            maxHeight="500px"
                        />
                    </div>

                    {/* Invite Code (GM only) - takes 1 column */}
                    {isGM && (
                        <div className="lg:col-span-1">
                            <InviteCodeDisplay campaign={activeCampaign} />
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {isGM && (
                <CampaignSettingsModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    campaign={activeCampaign}
                />
            )}

            <AssignCharacterModal
                isOpen={showAssignCharacter}
                onClose={() => setShowAssignCharacter(false)}
                campaignId={activeCampaign.id}
            />
        </div>
    );
}
