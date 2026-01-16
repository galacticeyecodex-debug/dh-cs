/**
 * Campaign Slice
 * ----------------------------------------------------------------------------
 * This slice manages campaign state for multiplayer/social features.
 * It handles campaign CRUD operations, member management, invite codes,
 * and provides the foundation for real-time collaboration (Phase 4).
 * 
 * Phase 1: Campaign Foundation - Basic CRUD and membership
 * Phase 2: GM Screen integration
 * Phase 3: Activity feed integration
 * Phase 4: Real-time subscriptions
 */

import { StateCreator } from 'zustand';
import { dataService } from '@/lib/data-service';
import { CharacterStore } from '@/types/store';
import type {
    Campaign,
    CampaignInsert,
    CampaignUpdate,
    CampaignMember,
    EnrichedCampaignMember,
    CampaignWithMembers,
} from '@/types/campaign';
import { toast } from 'sonner';

export interface CampaignSlice {
    // State
    campaigns: Campaign[];
    activeCampaign: CampaignWithMembers | null;
    campaignMembers: EnrichedCampaignMember[];
    isLoadingCampaigns: boolean;
    campaignError: string | null;

    // Campaign CRUD
    fetchUserCampaigns: () => Promise<void>;
    createCampaign: (name: string, description?: string) => Promise<Campaign>;
    selectCampaign: (campaignId: string) => Promise<void>;
    updateCampaign: (campaignId: string, updates: CampaignUpdate) => Promise<void>;
    deleteCampaign: (campaignId: string) => Promise<void>;
    clearActiveCampaign: () => void;

    // Joining
    joinCampaignByCode: (inviteCode: string, characterId?: string) => Promise<void>;
    leaveCampaign: (campaignId: string) => Promise<void>;

    // Member management
    assignCharacterToCampaign: (campaignId: string, characterId: string) => Promise<void>;
    kickMember: (memberId: string) => Promise<void>;
    transferGM: (campaignId: string, newGmUserId: string) => Promise<void>;

    // Error handling
    setCampaignError: (error: string | null) => void;
}

export const createCampaignSlice: StateCreator<CharacterStore, [], [], CampaignSlice> = (set, get) => ({
    // Initial state
    campaigns: [],
    activeCampaign: null,
    campaignMembers: [],
    isLoadingCampaigns: false,
    campaignError: null,

    fetchUserCampaigns: async () => {
        set({ isLoadingCampaigns: true, campaignError: null });
        try {
            const state = get() as any;
            const userId = state.user?.id;
            if (!userId) throw new Error('Not authenticated');

            const campaigns = await dataService.campaign.list(userId);
            set({ campaigns, isLoadingCampaigns: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch campaigns';
            set({ campaignError: message, isLoadingCampaigns: false });
            toast.error(message);
            throw error;
        }
    },

    createCampaign: async (name: string, description?: string) => {
        set({ campaignError: null });
        try {
            const state = get() as any;
            const userId = state.user?.id;
            if (!userId) throw new Error('Not authenticated');

            const campaign = await dataService.campaign.create({
                name,
                description,
                gm_user_id: userId,
            });

            // Add to local campaigns list
            set((state) => ({
                campaigns: [campaign, ...state.campaigns],
            }));

            toast.success('Campaign created successfully!');
            return campaign;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create campaign';
            set({ campaignError: message });
            toast.error(message);
            throw error;
        }
    },

    selectCampaign: async (campaignId: string) => {
        set({ isLoadingCampaigns: true, campaignError: null });
        try {
            const campaign = await dataService.campaign.getWithMembers(campaignId);
            if (!campaign) throw new Error('Campaign not found');

            set({ activeCampaign: campaign, isLoadingCampaigns: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load campaign';
            set({ campaignError: message, isLoadingCampaigns: false });
            toast.error(message);
            throw error;
        }
    },

    updateCampaign: async (campaignId: string, updates: CampaignUpdate) => {
        set({ campaignError: null });
        try {
            const updated = await dataService.campaign.update(campaignId, updates);

            // Update in campaigns list
            set((state) => ({
                campaigns: state.campaigns.map((c) => (c.id === campaignId ? updated : c)),
                activeCampaign:
                    state.activeCampaign?.id === campaignId
                        ? { ...state.activeCampaign, ...updated }
                        : state.activeCampaign,
            }));

            toast.success('Campaign updated successfully!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update campaign';
            set({ campaignError: message });
            toast.error(message);
            throw error;
        }
    },

    deleteCampaign: async (campaignId: string) => {
        set({ campaignError: null });
        try {
            await dataService.campaign.delete(campaignId);

            set((state) => ({
                campaigns: state.campaigns.filter((c) => c.id !== campaignId),
                activeCampaign: state.activeCampaign?.id === campaignId ? null : state.activeCampaign,
            }));

            toast.success('Campaign deleted successfully!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete campaign';
            set({ campaignError: message });
            toast.error(message);
            throw error;
        }
    },

    clearActiveCampaign: () => {
        set({ activeCampaign: null });
    },

    joinCampaignByCode: async (inviteCode: string, characterId?: string) => {
        set({ campaignError: null });
        try {
            const state = get() as any;
            const userId = state.user?.id;
            if (!userId) throw new Error('Not authenticated');

            await dataService.campaign.joinByInviteCode(inviteCode, userId, characterId);

            // Refresh campaigns list
            await (get() as any).fetchUserCampaigns();

            toast.success('Joined campaign successfully!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to join campaign';
            set({ campaignError: message });
            toast.error(message);
            throw error;
        }
    },

    leaveCampaign: async (campaignId: string) => {
        set({ campaignError: null });
        try {
            const state = get() as any;
            const userId = state.user?.id;
            if (!userId) throw new Error('Not authenticated');

            // Find member ID
            const members = await dataService.campaign.getMembers(campaignId);
            const member = members.find((m) => m.user_id === userId);
            if (!member) throw new Error('You are not a member of this campaign');

            await dataService.campaign.removeMember(member.id);

            // Remove from local state
            set((state) => ({
                campaigns: state.campaigns.filter((c) => c.id !== campaignId),
                activeCampaign: state.activeCampaign?.id === campaignId ? null : state.activeCampaign,
            }));

            toast.success('Left campaign successfully!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to leave campaign';
            set({ campaignError: message });
            toast.error(message);
            throw error;
        }
    },

    assignCharacterToCampaign: async (campaignId: string, characterId: string) => {
        set({ campaignError: null });
        try {
            const state = get() as any;
            const userId = state.user?.id;
            if (!userId) throw new Error('Not authenticated');

            // Find member ID
            const members = await dataService.campaign.getMembers(campaignId);
            const member = members.find((m) => m.user_id === userId);
            if (!member) throw new Error('You are not a member of this campaign');

            await dataService.campaign.updateMember(member.id, { character_id: characterId });

            // Refresh active campaign if needed
            const currentState = get() as any;
            if (currentState.activeCampaign?.id === campaignId) {
                await currentState.selectCampaign(campaignId);
            }

            toast.success('Character assigned to campaign!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to assign character';
            set({ campaignError: message });
            toast.error(message);
            throw error;
        }
    },

    kickMember: async (memberId: string) => {
        set({ campaignError: null });
        try {
            await dataService.campaign.removeMember(memberId);

            // Refresh active campaign
            const state = get() as any;
            if (state.activeCampaign) {
                await state.selectCampaign(state.activeCampaign.id);
            }

            toast.success('Member removed from campaign!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to kick member';
            set({ campaignError: message });
            toast.error(message);
            throw error;
        }
    },

    transferGM: async (campaignId: string, newGmUserId: string) => {
        set({ campaignError: null });
        try {
            await dataService.campaign.transferGM(campaignId, newGmUserId);

            // Refresh campaign data
            const state = get() as any;
            await state.selectCampaign(campaignId);

            toast.success('GM transferred successfully!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to transfer GM';
            set({ campaignError: message });
            toast.error(message);
            throw error;
        }
    },

    setCampaignError: (error: string | null) => {
        set({ campaignError: error });
    },
});
