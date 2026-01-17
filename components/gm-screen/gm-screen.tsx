'use client';

import { useEffect, useState } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { FearTracker } from './fear-tracker';
import { PartyOverview } from './party-overview';
import { QuickActionsBar } from './quick-actions-bar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Loader2, Crown, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CampaignSettingsModal from '@/components/campaign/campaign-settings-modal';

interface GmScreenProps {
    campaignId: string;
}

export function GmScreen({ campaignId }: GmScreenProps) {
    const router = useRouter();
    const {
        activeCampaign,
        selectCampaign,
        fetchPartyCharacters,
        partyCharacters,
        isLoadingCampaigns,
        user,
    } = useCharacterStore();
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!activeCampaign || activeCampaign.id !== campaignId) {
                await selectCampaign(campaignId);
            }
            await fetchPartyCharacters(campaignId);
        };
        loadData();
    }, [campaignId, selectCampaign, fetchPartyCharacters, activeCampaign]);

    // Loading state
    if (isLoadingCampaigns || !activeCampaign) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading GM Screen...</p>
                </div>
            </div>
        );
    }

    // Check if current user is GM
    const isGm = activeCampaign.gm_user_id === user?.id;

    if (!isGm) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-muted-foreground mb-6">
                        Only the Game Master can access the GM Screen for this campaign.
                    </p>
                    <Button onClick={() => router.push(`/campaign/${campaignId}`)}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Campaign
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/campaign/${campaignId}`)}
                                aria-label="Back to campaign"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <div className="flex items-center gap-2">
                                <Crown className="w-5 h-5 text-amber-500" />
                                <h1 className="text-xl md:text-2xl font-bold">{activeCampaign.name}</h1>
                            </div>
                            <span className="hidden md:inline px-2 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                                GM Screen
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSettings(true)}
                                aria-label="Campaign settings"
                            >
                                <Settings className="w-4 h-4 md:mr-2" />
                                <span className="hidden md:inline">Settings</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container py-6 space-y-6">
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

            {/* Settings Modal */}
            <CampaignSettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                campaign={activeCampaign}
            />
        </div>
    );
}
