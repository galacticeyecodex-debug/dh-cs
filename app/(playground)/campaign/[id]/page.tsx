'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCharacterStore } from '@/store/character-store';
import useUser from '@/hooks/useUser';
import { Settings, LogOut, UserPlus, Crown, Skull } from 'lucide-react';
import PageLayout from '@/components/core/page-layout';
import InviteCodeDisplay from '@/components/campaign/invite-code-display';
import MemberList from '@/components/campaign/member-list';
import CampaignSettingsModal from '@/components/campaign/campaign-settings-modal';
import AssignCharacterModal from '@/components/campaign/assign-character-modal';
import { ActivityFeed, RollNotification } from '@/components/activity';
import { realtimeManager } from '@/lib/realtime';
import { CampaignActivity } from '@/types/activity';

export default function CampaignDetailPage() {
    const params = useParams();
    const router = useRouter();
    const campaignId = params?.id as string;
    const subscribedRef = useRef(false);
    const { user: authUser, loading: authLoading } = useUser();

    const {
        activeCampaign,
        selectCampaign,
        clearActiveCampaign,
        leaveCampaign,
        user,
        isLoadingCampaigns,
        subscribeToCampaignRealtime,
        unsubscribeFromCampaignRealtime,
        setUser,
    } = useCharacterStore();

    const [showSettings, setShowSettings] = useState(false);
    const [showAssignCharacter, setShowAssignCharacter] = useState(false);

    // Roll notification state for Campaign Page
    const [currentRollNotification, setCurrentRollNotification] = useState<CampaignActivity | null>(null);
    const dismissRollNotification = useCallback(() => {
        setCurrentRollNotification(null);
    }, []);

    // Listen for roll notifications from the realtime manager
    useEffect(() => {
        const unsubscribe = realtimeManager.onRollNotification((activity) => {
            setCurrentRollNotification(activity);
        });

        return unsubscribe;
    }, []);

    // Sync auth user to store when loaded
    useEffect(() => {
        if (!authLoading && authUser) {
            setUser(authUser as any);
        }
    }, [authLoading, authUser, setUser]);

    // Load campaign data
    useEffect(() => {
        if (campaignId) {
            selectCampaign(campaignId);
        }

        return () => {
            clearActiveCampaign();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId]);

    /**
     * REALTIME SUBSCRIPTION PATTERN
     * =========================================================================
     * We use a useRef to track subscription state instead of relying on store
     * state (like `realtimeSubscribed`). This is critical because:
     * 
     * 1. PROBLEM: If we put store functions (subscribeToCampaignRealtime,
     *    unsubscribeFromCampaignRealtime) or objects (activeCampaign) in the
     *    dependency array, the effect runs on EVERY re-render because:
     *    - Store functions are recreated on each render (not memoized)
     *    - Object references change even if contents are the same
     * 
     * 2. PROBLEM: If cleanup runs on every re-render (not just unmount), we get:
     *    - Subscribe -> Cleanup (unsubscribe) -> Re-render -> Subscribe -> ...
     *    - This creates a "subscribe spam" loop with thousands of logs
     * 
     * 3. SOLUTION: Use a ref (subscribedRef) because:
     *    - Refs persist across renders without causing re-renders
     *    - Separate the cleanup into its own useEffect with [] deps
     *    - Only cleanup on actual component unmount
     * 
     * 4. KEY PATTERN:
     *    - Effect 1: Subscribe (when conditions met, tracked by ref)
     *    - Effect 2: Cleanup on unmount only (empty deps [])
     * =========================================================================
     */

    // Subscribe to realtime updates when campaign is loaded
    useEffect(() => {
        if (activeCampaign && activeCampaign.id === campaignId && !subscribedRef.current) {
            subscribedRef.current = true;
            subscribeToCampaignRealtime(campaignId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCampaign?.id, campaignId]);

    // Cleanup on unmount only - MUST be separate effect with empty deps
    useEffect(() => {
        return () => {
            if (subscribedRef.current) {
                subscribedRef.current = false;
                unsubscribeFromCampaignRealtime();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLeave = async () => {
        if (!activeCampaign) return;

        if (!confirm('Are you sure you want to leave this campaign?')) {
            return;
        }

        try {
            await leaveCampaign(activeCampaign.id);
            router.push('/campaigns');
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
                        onClick={() => router.push('/campaigns')}
                        className="mt-4 px-4 py-2 bg-dagger-gold hover:bg-dagger-gold-light text-black font-bold rounded-lg transition-colors"
                    >
                        Back to Campaigns
                    </button>
                </div>
            </div>
        );
    }

    const headerActions = (
        <div className="flex gap-2">
            {isGM && (
                <>
                    <button
                        onClick={() => router.push(`/campaign/${activeCampaign.id}/gm`)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-colors flex items-center gap-2 text-sm"
                        aria-label="Open GM Screen"
                    >
                        <Crown size={16} />
                        <span className="hidden sm:inline">GM Screen</span>
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        title="Campaign settings"
                        aria-label="Open campaign settings"
                    >
                        <Settings size={18} className="text-gray-400" />
                    </button>
                </>
            )}
            <button
                onClick={() => setShowAssignCharacter(true)}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                aria-label="Assign character to campaign"
            >
                <UserPlus size={16} />
                <span className="hidden sm:inline">Assign</span>
            </button>
            {!isGM && (
                <button
                    onClick={handleLeave}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2 text-sm"
                    aria-label="Leave campaign"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Leave</span>
                </button>
            )}
        </div>
    );

    return (
        <PageLayout
            title={activeCampaign.name}
            headerActions={headerActions}
        >
            <div className="w-full max-w-6xl mx-auto p-6">
                {/* Campaign Description */}
                {activeCampaign.description && (
                    <p className="text-gray-400 mb-6">{activeCampaign.description}</p>
                )}

                {/* Fear Tracker - SRD: Max Fear is always 12 */}
                <div className="bg-dagger-panel border border-white/10 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-red-500/20">
                                <Skull className="w-5 h-5 text-red-500" aria-hidden="true" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Fear</h2>
                        </div>
                        <div className="text-xl font-bold tabular-nums text-white">
                            {activeCampaign.fear_current} / 12
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5 px-2">
                        {Array.from({ length: 12 }, (_, i) => {
                            const isFilled = i < activeCampaign.fear_current;
                            const isHighFear = activeCampaign.fear_current >= 10;
                            return (
                                <Skull
                                    key={i}
                                    size={20}
                                    className={`transition-all duration-300 ${isFilled ? 'scale-100' : 'text-white/10 scale-90'}`}
                                    fill={isFilled ? (isHighFear ? "#ef4444" : "#a855f7") : "none"}
                                    stroke={isFilled ? (isHighFear ? "#7f1d1d" : "#581c87") : "currentColor"}
                                />
                            );
                        })}
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

            {/* Roll notification pop-ups for campaign members */}
            <RollNotification
                activity={currentRollNotification}
                onDismiss={dismissRollNotification}
            />
        </PageLayout>
    );
}
