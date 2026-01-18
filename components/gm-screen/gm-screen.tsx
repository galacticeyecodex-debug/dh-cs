'use client';

/**
 * GM SCREEN
 * ----------------------------------------------------------------------------
 * The main Game Master screen for managing campaigns in real-time.
 * 
 * FUNCTIONALITY:
 * - Displays Fear Tracker for managing the party's Fear resource
 * - Shows Party Overview with all player characters and their vitals
 * - Provides Quick Actions for common GM tasks (dice rolls, announcements)
 * - Displays Activity Feed for real-time campaign updates
 * - Integrates real-time subscriptions for live data updates
 */

import { useEffect, useState, useRef } from 'react';
import { useCharacterStore } from '@/store/character-store';
import useUser from '@/hooks/useUser';
import { FearTracker } from './fear-tracker';
import { PartyOverview } from './party-overview';
import { QuickActionsBar } from './quick-actions-bar';
import { AdversaryBrowser } from './adversary-browser';
import { EnvironmentBrowser } from './environment-browser';
import { ActivityFeed } from '@/components/activity';
import { Settings, Crown, Shield, ArrowLeft, Activity, Skull, Map } from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import CampaignSettingsModal from '@/components/campaign/campaign-settings-modal';
import PageLayout from '@/components/core/page-layout';

interface GmScreenProps {
    campaignId: string;
}

export function GmScreen({ campaignId }: GmScreenProps) {
    const router = useRouter();
    const subscribedRef = useRef(false);
    const { user: authUser, loading: authLoading } = useUser();
    const {
        activeCampaign,
        selectCampaign,
        fetchPartyCharacters,
        partyCharacters,
        isLoadingCampaigns,
        user,
        subscribeToCampaignRealtime,
        unsubscribeFromCampaignRealtime,
        setUser,
    } = useCharacterStore();
    const [showSettings, setShowSettings] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'activity' | 'adversaries' | 'environments'>('activity');

    // Sync auth user to store when loaded
    useEffect(() => {
        if (!authLoading && authUser) {
            setUser(authUser as any);
        }
    }, [authLoading, authUser, setUser]);

    // Load campaign data - always select campaign to ensure it's in the store
    // The selectCampaign function handles loading state properly
    useEffect(() => {
        const loadData = async () => {
            // Always call selectCampaign - it will load/refresh the campaign
            await selectCampaign(campaignId);
            await fetchPartyCharacters(campaignId);
        };

        // Only load if auth is ready and we have a user
        if (!authLoading && authUser) {
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId, authLoading, authUser]);

    /**
     * REALTIME SUBSCRIPTION - Uses ref pattern to prevent subscribe spam loop.
     * See campaign/[id]/page.tsx for detailed explanation of this pattern.
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

    // Loading state - also wait for auth to ensure user is loaded before GM check
    if (isLoadingCampaigns || !activeCampaign || authLoading) {
        return (
            <div className="min-h-screen bg-dagger-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="inline-block w-8 h-8 border-4 border-dagger-gold border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400">Loading GM Screen...</p>
                </div>
            </div>
        );
    }

    // Check if current user is GM
    const isGm = activeCampaign.gm_user_id === user?.id;

    if (!isGm) {
        return (
            <div className="min-h-screen bg-dagger-dark flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="p-4 rounded-xl bg-white/5 inline-block mb-4">
                        <Shield className="w-12 h-12 text-gray-500" />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-gray-400 mb-6">
                        Only the Game Master can access the GM Screen for this campaign.
                    </p>
                    <button
                        onClick={() => router.push(`/campaign/${campaignId}`)}
                        className="bg-dagger-gold hover:bg-yellow-500 text-black font-bold px-6 py-3 rounded-full transition-colors flex items-center gap-2 mx-auto"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Campaign
                    </button>
                </div>
            </div>
        );
    }

    const headerActions = (
        <div className="flex items-center gap-2">
            <span className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-dagger-gold/20 text-dagger-gold rounded-full text-xs font-bold">
                <Crown className="w-3 h-3" />
                GM Screen
            </span>
            <button
                onClick={() => setShowSettings(true)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10"
                aria-label="Campaign settings"
            >
                <Settings className="w-4 h-4 text-gray-400" />
            </button>
        </div>
    );

    return (
        <PageLayout
            title={activeCampaign.name}
            headerActions={headerActions}
        >
            {/* Main Content */}
            <div className="w-full max-w-6xl mx-auto p-4 md:p-6 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Controls & Party */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Fear Tracker */}
                        <FearTracker
                            campaignId={campaignId}
                            currentFear={activeCampaign.fear_current}
                            maxFear={activeCampaign.fear_max}
                        />

                        {/* Quick Actions */}
                        <QuickActionsBar campaignId={campaignId} />

                        {/* Party Overview */}
                        <PartyOverview campaignId={campaignId} characters={partyCharacters} />
                    </div>

                    {/* Right Column - Tabbed Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Sidebar Tab Bar */}
                        <div className="flex gap-1 p-1 bg-dagger-panel border border-white/10 rounded-xl">
                            <button
                                onClick={() => setSidebarTab('activity')}
                                className={clsx(
                                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                    sidebarTab === 'activity'
                                        ? 'bg-blue-500/20 text-blue-300'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                )}
                            >
                                <Activity size={16} />
                                <span className="hidden sm:inline">Activity</span>
                            </button>
                            <button
                                onClick={() => setSidebarTab('adversaries')}
                                className={clsx(
                                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                    sidebarTab === 'adversaries'
                                        ? 'bg-red-500/20 text-red-300'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                )}
                            >
                                <Skull size={16} />
                                <span className="hidden sm:inline">Adversaries</span>
                            </button>
                            <button
                                onClick={() => setSidebarTab('environments')}
                                className={clsx(
                                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                    sidebarTab === 'environments'
                                        ? 'bg-green-500/20 text-green-300'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                )}
                            >
                                <Map size={16} />
                                <span className="hidden sm:inline">Environments</span>
                            </button>
                        </div>

                        {/* Sidebar Content */}
                        {sidebarTab === 'activity' && (
                            <ActivityFeed
                                campaignId={campaignId}
                                maxHeight="calc(100vh - 220px)"
                                compact={true}
                            />
                        )}
                        {sidebarTab === 'adversaries' && (
                            <AdversaryBrowser compact />
                        )}
                        {sidebarTab === 'environments' && (
                            <EnvironmentBrowser compact />
                        )}
                    </div>
                </div>
            </div>

            {/* Settings Modal */}
            <CampaignSettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                campaign={activeCampaign}
            />
        </PageLayout>
    );
}
