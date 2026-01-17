/**
 * Campaign Slice
 * ----------------------------------------------------------------------------
 * This slice manages campaign state for multiplayer/social features.
 * It handles campaign CRUD operations, member management, invite codes,
 * and provides the foundation for real-time collaboration.
 *
 * Phase 1: Campaign Foundation - Basic CRUD and membership
 * Phase 2: GM Screen integration
 * Phase 3: Activity feed integration
 * Phase 4: Real-time subscriptions
 * Phase 5: Presence system (who's online)
 */

import { StateCreator } from 'zustand';
import { dataService } from '@/lib/data-service';
import { realtimeManager } from '@/lib/realtime';
import { presenceManager, PresenceState } from '@/lib/presence';
import { CharacterStore } from '@/types/store';
import { Character } from '@/types/character';
import type {
    Campaign,
    CampaignInsert,
    CampaignUpdate,
    CampaignMember,
    EnrichedCampaignMember,
    CampaignWithMembers,
} from '@/types/campaign';
import type { CampaignActivity, CampaignActivityInsert } from '@/types/activity';
import type { SharedHomebrew, EnrichedSharedHomebrew, ShareTarget } from '@/types/sharing';
import { toast } from 'sonner';

export interface CampaignSlice {
    // State
    campaigns: Campaign[];
    activeCampaign: CampaignWithMembers | null;
    campaignMembers: EnrichedCampaignMember[];
    isLoadingCampaigns: boolean;
    campaignError: string | null;

    // Phase 2: GM Screen state
    partyCharacters: Character[];
    unlockedVitalsCards: Set<string>; // Character IDs with unlocked vitals

    // Phase 3: Activity Feed state
    activityFeed: CampaignActivity[];
    isLoadingActivity: boolean;
    activityTotalCount: number;

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

    // Phase 2: GM Screen actions
    fetchPartyCharacters: (campaignId: string) => Promise<void>;
    gmAdjustVital: (characterId: string, vital: 'hp' | 'stress' | 'armor' | 'hope', newValue: number) => Promise<void>;
    updateFear: (campaignId: string, change: number) => Promise<void>;
    toggleVitalsLock: (characterId: string) => void;

    // Phase 3: Activity Feed actions
    fetchActivityFeed: (campaignId: string, offset?: number) => Promise<void>;
    logActivity: (activity: CampaignActivityInsert) => Promise<void>;
    clearActivityFeed: () => void;

    // Phase 4: Real-time subscription actions
    realtimeSubscribed: boolean;
    subscribeToCampaignRealtime: (campaignId: string) => Promise<void>;
    unsubscribeFromCampaignRealtime: () => void;
    addActivityToFeed: (activity: CampaignActivity) => void;
    updateActiveCampaignFromRealtime: (updates: Partial<Campaign>) => void;
    updatePartyCharacterFromRealtime: (characterId: string, updates: Partial<Character>) => void;

    // Phase 5: Presence system state and actions
    onlineMembers: PresenceState[];
    presenceTracking: boolean;
    setOnlineMembers: (members: PresenceState[]) => void;
    startPresenceTracking: (campaignId: string) => Promise<void>;
    stopPresenceTracking: () => Promise<void>;

    // Phase 6: Homebrew Sharing state and actions
    sharedWithMe: EnrichedSharedHomebrew[];
    sharedByMe: SharedHomebrew[];
    isLoadingSharing: boolean;
    shareHomebrewItem: (homebrewItemId: string, target: ShareTarget, message?: string) => Promise<void>;
    unshareHomebrewItem: (sharedId: string) => Promise<void>;
    fetchSharedWithMe: () => Promise<void>;
    fetchSharedByMe: () => Promise<void>;
    fetchSharedWithCampaign: (campaignId: string) => Promise<void>;
    addSharedToInventory: (sharedId: string) => Promise<void>;
    clearSharingState: () => void;

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

    // Phase 2: GM Screen state
    partyCharacters: [],
    unlockedVitalsCards: new Set(),

    // Phase 3: Activity Feed state
    activityFeed: [],
    isLoadingActivity: false,
    activityTotalCount: 0,

    // Phase 4: Real-time subscription state
    realtimeSubscribed: false,

    // Phase 5: Presence system state
    onlineMembers: [],
    presenceTracking: false,

    // Phase 6: Homebrew Sharing state
    sharedWithMe: [],
    sharedByMe: [],
    isLoadingSharing: false,

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

    // =========================================================================
    // PHASE 2: GM SCREEN METHODS
    // =========================================================================

    fetchPartyCharacters: async (campaignId: string) => {
        try {
            const characters = await dataService.campaign.getPartyCharacters(campaignId);
            set({ partyCharacters: characters });
        } catch (error) {
            console.error('Failed to fetch party characters:', error);
            throw error;
        }
    },

    gmAdjustVital: async (
        characterId: string,
        vital: 'hp' | 'stress' | 'armor' | 'hope',
        newValue: number
    ) => {
        // Capture character info and previous value before the optimistic update
        const character = get().partyCharacters.find((c) => c.id === characterId);
        if (!character) {
            toast.error('Character not found');
            return;
        }

        // Map vital to the correct property path
        const previousValueMap: Record<string, number> = {
            hp: character.vitals?.hit_points_current ?? 0,
            stress: character.vitals?.stress_current ?? 0,
            armor: character.vitals?.armor_slots ?? 0,
            hope: character.hope ?? 0,
        };
        const previousValue = previousValueMap[vital];
        const change = newValue - previousValue;

        try {
            // Optimistically update local state
            set((state) => ({
                partyCharacters: state.partyCharacters.map((char) =>
                    char.id === characterId
                        ? {
                            ...char,
                            ...(vital === 'hp' && { vitals: { ...char.vitals, hit_points_current: newValue } }),
                            ...(vital === 'stress' && { vitals: { ...char.vitals, stress_current: newValue } }),
                            ...(vital === 'armor' && { vitals: { ...char.vitals, armor_slots: newValue } }),
                            ...(vital === 'hope' && { hope: newValue }),
                        }
                        : char
                ),
            }));

            // Update database
            await dataService.campaign.gmAdjustVital(characterId, vital, newValue);

            // Log activity if we're in a campaign
            const state = get() as any;
            const activeCampaign = state.activeCampaign;
            const user = state.user;

            if (activeCampaign && user) {
                await state.logActivity({
                    campaign_id: activeCampaign.id,
                    user_id: user.id,
                    character_id: characterId,
                    character_name: character.name,
                    activity_type: 'gm_vital_adjust',
                    data: {
                        target_character_id: characterId,
                        target_character_name: character.name,
                        vital,
                        change,
                        previous_value: previousValue,
                        new_value: newValue,
                    },
                    is_private: false,
                });
            }

            // Success - optimistic update is already applied
        } catch (error) {
            // Rollback on error - refetch party characters
            const state = get() as any;
            if (state.activeCampaign) {
                await state.fetchPartyCharacters(state.activeCampaign.id);
            }
            toast.error('Failed to adjust vital');
            throw error;
        }
    },

    updateFear: async (campaignId: string, change: number) => {
        try {
            const updated = await dataService.campaign.updateFear(campaignId, change);

            // Update active campaign
            set((state) => ({
                activeCampaign: state.activeCampaign
                    ? { ...state.activeCampaign, ...updated }
                    : null,
            }));
        } catch (error) {
            toast.error('Failed to update Fear');
            throw error;
        }
    },

    toggleVitalsLock: (characterId: string) => {
        set((state) => {
            const newUnlocked = new Set(state.unlockedVitalsCards);
            if (newUnlocked.has(characterId)) {
                newUnlocked.delete(characterId);
            } else {
                newUnlocked.add(characterId);
            }
            return { unlockedVitalsCards: newUnlocked };
        });
    },

    // =========================================================================
    // PHASE 3: ACTIVITY FEED ACTIONS
    // =========================================================================

    fetchActivityFeed: async (campaignId: string, offset: number = 0) => {
        set({ isLoadingActivity: true });
        try {
            const [activity, count] = await Promise.all([
                dataService.campaign.getActivity(campaignId, 50, offset),
                offset === 0
                    ? dataService.campaign.getActivityCount(campaignId)
                    : Promise.resolve(get().activityTotalCount),
            ]);

            set((state) => ({
                activityFeed: offset === 0 ? activity : [...state.activityFeed, ...activity],
                activityTotalCount: count,
                isLoadingActivity: false,
            }));
        } catch (error) {
            console.error('Failed to fetch activity:', error);
            set({ isLoadingActivity: false });
        }
    },

    logActivity: async (activity: CampaignActivityInsert) => {
        try {
            const logged = await dataService.campaign.logActivity(activity);

            // Add to local feed (optimistic update)
            set((state) => ({
                activityFeed: [logged, ...state.activityFeed],
                activityTotalCount: state.activityTotalCount + 1,
            }));
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    },

    clearActivityFeed: () => {
        set({ activityFeed: [], activityTotalCount: 0 });
    },

    // Phase 4: Real-time subscription methods
    subscribeToCampaignRealtime: async (campaignId: string) => {
        const state = get();

        // Set up the store getter for the realtime manager
        realtimeManager.setStoreGetter(() => ({
            user: (state as any).user,
            addActivityToFeed: state.addActivityToFeed,
            updateActiveCampaign: state.updateActiveCampaignFromRealtime,
            updatePartyCharacterFromRealtime: state.updatePartyCharacterFromRealtime,
        }));

        // Get party character IDs for vital subscriptions
        const partyCharacterIds = state.partyCharacters.map(c => c.id);

        // Subscribe to realtime updates
        await realtimeManager.subscribeToCampaign(campaignId, partyCharacterIds);
        set({ realtimeSubscribed: true });
    },

    unsubscribeFromCampaignRealtime: () => {
        realtimeManager.unsubscribe();
        set({ realtimeSubscribed: false });
    },

    addActivityToFeed: (activity: CampaignActivity) => {
        set((state) => ({
            activityFeed: [activity, ...state.activityFeed],
            activityTotalCount: state.activityTotalCount + 1,
        }));
    },

    updateActiveCampaignFromRealtime: (updates: Partial<Campaign>) => {
        set((state) => ({
            activeCampaign: state.activeCampaign
                ? { ...state.activeCampaign, ...updates }
                : null,
        }));
    },

    updatePartyCharacterFromRealtime: (characterId: string, updates: Partial<Character>) => {
        set((state) => ({
            partyCharacters: state.partyCharacters.map((char) =>
                char.id === characterId ? { ...char, ...updates } : char
            ),
        }));
    },

    // Phase 5: Presence system actions
    setOnlineMembers: (members: PresenceState[]) => {
        set({ onlineMembers: members });
    },

    startPresenceTracking: async (campaignId: string) => {
        const state = get() as CharacterStore;
        const user = state.user;
        const character = state.character;

        if (!user) {
            console.warn('[Presence] Cannot track presence: no user');
            return;
        }

        // Set up the store getter for the presence manager
        presenceManager.setStoreGetter(() => ({
            user: (get() as CharacterStore).user,
            setOnlineMembers: get().setOnlineMembers,
        }));

        // Start tracking with user info and optionally character info
        await presenceManager.track(
            campaignId,
            user.id,
            user.email || 'Unknown',
            character?.id,
            character?.name
        );

        set({ presenceTracking: true });
    },

    stopPresenceTracking: async () => {
        await presenceManager.untrack();
        set({ presenceTracking: false, onlineMembers: [] });
    },

    // =========================================================================
    // Phase 6: Homebrew Sharing Actions
    // =========================================================================

    shareHomebrewItem: async (homebrewItemId: string, target: ShareTarget, message?: string) => {
        const state = get() as CharacterStore;
        const user = state.user;

        if (!user) {
            return;
        }

        // Check if item exists in user's homebrew items
        const homebrewItem = state.homebrewItems.find(item => item.id === homebrewItemId);
        if (!homebrewItem) {
            toast.error('Item not found');
            return;
        }

        try {
            const sharedItem = await dataService.sharing.share(homebrewItemId, target, message);
            set((s) => ({
                sharedByMe: [sharedItem, ...s.sharedByMe],
            }));
            toast.success('Item shared successfully!');
        } catch (error) {
            toast.error('Failed to share item');
        }
    },

    unshareHomebrewItem: async (sharedId: string) => {
        const state = get() as CharacterStore;
        const previousSharedByMe = [...state.sharedByMe];

        // Optimistic update
        set((s) => ({
            sharedByMe: s.sharedByMe.filter(item => item.id !== sharedId),
        }));

        try {
            await dataService.sharing.unshare(sharedId);
            toast.success('Item unshared');
        } catch (error) {
            // Rollback on error
            set({ sharedByMe: previousSharedByMe });
            toast.error('Failed to unshare item');
        }
    },

    fetchSharedWithMe: async () => {
        set({ isLoadingSharing: true });

        try {
            const items = await dataService.sharing.listSharedWithMe();
            set({ sharedWithMe: items, isLoadingSharing: false });
        } catch (error) {
            set({ isLoadingSharing: false, sharedWithMe: [] });
        }
    },

    fetchSharedByMe: async () => {
        try {
            const items = await dataService.sharing.listSharedByMe();
            set({ sharedByMe: items });
        } catch (error) {
            set({ sharedByMe: [] });
        }
    },

    fetchSharedWithCampaign: async (campaignId: string) => {
        set({ isLoadingSharing: true });

        try {
            const items = await dataService.sharing.listSharedWithCampaign(campaignId);
            set({ sharedWithMe: items, isLoadingSharing: false });
        } catch (error) {
            set({ isLoadingSharing: false, sharedWithMe: [] });
        }
    },

    addSharedToInventory: async (sharedId: string) => {
        const state = get() as CharacterStore;
        const character = state.character;

        if (!character) {
            toast.error('No character loaded');
            return;
        }

        // Find the shared item
        const sharedItem = state.sharedWithMe.find(item => item.id === sharedId);
        if (!sharedItem) {
            toast.error('Shared item not found');
            return;
        }

        try {
            // Create inventory item from the snapshot
            const snapshot = sharedItem.item_snapshot;
            await dataService.inventory.add(character.id, {
                name: snapshot.name,
                description: snapshot.description || undefined,
                location: 'backpack',
                quantity: 1,
                // The library_item data for UI rendering
                library_item: {
                    id: `shared-${sharedId}`,
                    type: snapshot.type,
                    name: snapshot.name,
                    data: snapshot.data,
                    _isHomebrew: true,
                },
            });

            toast.success('Item added to inventory!');
        } catch (error) {
            toast.error('Failed to add item to inventory');
        }
    },

    clearSharingState: () => {
        set({
            sharedWithMe: [],
            sharedByMe: [],
            isLoadingSharing: false,
        });
    },

    setCampaignError: (error: string | null) => {
        set({ campaignError: error });
    },
});
