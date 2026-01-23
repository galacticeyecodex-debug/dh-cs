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
import { realtimeManager } from '@/lib/realtime';
import { CharacterStore } from '@/types/store';
import { Character } from '@/types/character';
import type {
    Campaign,
    CampaignInsert,
    CampaignUpdate,
    CampaignMember,
    EnrichedCampaignMember,
    CampaignWithMembers,
    Countdown,
    CountdownInsert,
    Project,
    ProjectInsert,
} from '@/types/campaign';
import type { CampaignActivity, CampaignActivityInsert } from '@/types/activity';
import { toast } from 'sonner';
import { withOptimisticUpdate } from '@/lib/state-helpers';

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
    unlockedProjectSections: Set<string>; // Character IDs with unlocked project sections
    characterProjects: Record<string, any[]>; // Cache of projects by character ID

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
    toggleProjectsLock: (characterId: string) => void;
    fetchProjectsForCharacter: (characterId: string) => Promise<void>;
    gmSetProjectProgress: (projectId: string, progress: number) => Promise<void>;
    gmDeleteProject: (projectId: string) => Promise<void>;
    gmCreateProject: (input: any) => Promise<any>;

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

    // Error handling
    setCampaignError: (error: string | null) => void;

    // Phase 9: Countdowns and Projects
    createCountdown: (campaignId: string, countdown: CountdownInsert) => Promise<void>;
    advanceCountdown: (campaignId: string, countdownId: string, amount: number) => Promise<void>;
    resetCountdown: (campaignId: string, countdownId: string) => Promise<void>;
    deleteCountdown: (campaignId: string, countdownId: string) => Promise<void>;

    createCampaignProject: (campaignId: string, project: ProjectInsert) => Promise<void>;
    advanceCampaignProject: (campaignId: string, projectId: string) => Promise<void>;
    completeCampaignProject: (campaignId: string, projectId: string) => Promise<void>;
    abandonCampaignProject: (campaignId: string, projectId: string) => Promise<void>;
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
    unlockedProjectSections: new Set(),
    characterProjects: {},

    // Phase 3: Activity Feed state
    activityFeed: [],
    isLoadingActivity: false,
    activityTotalCount: 0,

    // Phase 4: Real-time subscription state
    realtimeSubscribed: false,

    fetchUserCampaigns: async () => {
        set({ isLoadingCampaigns: true, campaignError: null });
        try {
            const state = get() as CharacterStore;
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
            const state = get() as CharacterStore;
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
            const state = get() as CharacterStore;
            const userId = state.user?.id;
            if (!userId) throw new Error('Not authenticated');

            await dataService.campaign.joinByInviteCode(inviteCode, userId, characterId);

            // Refresh campaigns list
            await (get() as CharacterStore).fetchUserCampaigns();

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
            const state = get() as CharacterStore;
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
            const state = get() as CharacterStore;
            const userId = state.user?.id;
            if (!userId) throw new Error('Not authenticated');

            // Find member ID
            const members = await dataService.campaign.getMembers(campaignId);
            const member = members.find((m) => m.user_id === userId);
            if (!member) throw new Error('You are not a member of this campaign');

            await dataService.campaign.updateMember(member.id, { character_id: characterId });

            // Refresh active campaign if needed
            const currentState = get() as CharacterStore;
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
            const state = get() as CharacterStore;
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
            const state = get() as CharacterStore;
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
            const state = get() as CharacterStore;
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
            const state = get() as CharacterStore;
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

    toggleProjectsLock: (characterId: string) => {
        set((state) => {
            const newUnlocked = new Set(state.unlockedProjectSections);
            if (newUnlocked.has(characterId)) {
                newUnlocked.delete(characterId);
            } else {
                newUnlocked.add(characterId);
            }
            return { unlockedProjectSections: newUnlocked };
        });
    },

    fetchProjectsForCharacter: async (characterId: string) => {
        try {
            const projects = await dataService.character.getCharacterProjects(characterId);
            set((state) => ({
                characterProjects: {
                    ...state.characterProjects,
                    [characterId]: projects,
                },
            }));
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error('Failed to fetch projects for character:', errorMsg);
        }
    },

    gmSetProjectProgress: async (projectId: string, progress: number) => {
        try {
            await dataService.character.updateCharacterProject(projectId, {
                countdown_current: progress,
                updated_at: new Date().toISOString(),
            });

            // Update cache
            set((state) => {
                const newProjects = { ...state.characterProjects };
                for (const characterId in newProjects) {
                    newProjects[characterId] = newProjects[characterId].map((p: any) =>
                        p.id === projectId ? { ...p, countdown_current: progress } : p
                    );
                }
                return { characterProjects: newProjects };
            });
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error('Failed to set project progress:', errorMsg);
            toast.error('Failed to update project progress');
        }
    },

    gmDeleteProject: async (projectId: string) => {
        try {
            await dataService.character.deleteCharacterProject(projectId);

            // Update cache
            set((state) => {
                const newProjects = { ...state.characterProjects };
                for (const characterId in newProjects) {
                    newProjects[characterId] = newProjects[characterId].filter((p: any) => p.id !== projectId);
                }
                return { characterProjects: newProjects };
            });

            toast.success('Project deleted');
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error('Failed to delete project:', errorMsg);
            toast.error('Failed to delete project');
        }
    },

    gmCreateProject: async (input: any) => {
        try {
            const state = get() as CharacterStore;

            // Determine the character ID
            const characterId = input.character_id || (state.character?.id);
            if (!characterId) throw new Error('Character not found');

            // Create project via data service
            const data = await dataService.character.createCharacterProject(characterId, input);

            // Update cache
            set((state) => ({
                characterProjects: {
                    ...state.characterProjects,
                    [characterId]: [data, ...(state.characterProjects[characterId] || [])],
                },
            }));

            toast.success('Project created');
            return data;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error('Failed to create project:', errorMsg);
            toast.error('Failed to create project');
            return null;
        }
    },

    // =========================================================================
    // PHASE 3: ACTIVITY FEED ACTIONS
    // =========================================================================

    fetchActivityFeed: async (campaignId: string, offset: number = 0) => {
        set({ isLoadingActivity: true });
        try {
            // Fetch activity and count separately to handle partial failures
            const activity = await dataService.campaign.getActivity(campaignId, 50, offset);

            // Count is optional - if it fails, use current count or activity length
            let count = get().activityTotalCount;
            if (offset === 0) {
                try {
                    count = await dataService.campaign.getActivityCount(campaignId);
                } catch (countError) {
                    // If count fails, estimate from activity length
                    count = activity.length;
                }
            }

            set((state) => ({
                activityFeed: offset === 0 ? activity : [...state.activityFeed, ...activity],
                activityTotalCount: count,
                isLoadingActivity: false,
            }));
        } catch (error) {
            set({ isLoadingActivity: false });
        }
    },

    logActivity: async (activity: CampaignActivityInsert) => {
        console.log('[logActivity] Called with:', {
            campaignId: activity.campaign_id,
            activityType: activity.activity_type,
            characterName: activity.character_name,
        });
        try {
            const logged = await dataService.campaign.logActivity(activity);
            console.log('[logActivity] Successfully logged to database:', {
                activityId: logged.id,
                activityType: logged.activity_type,
            });

            // Add to local feed (optimistic update)
            set((state) => ({
                activityFeed: [logged, ...state.activityFeed],
                activityTotalCount: state.activityTotalCount + 1,
            }));
        } catch (error) {
            console.error('[logActivity] Failed to log activity:', error);
            // Activity logging failure is non-critical, silently ignored
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
            user: (state as CharacterStore).user,
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

    setCampaignError: (error: string | null) => {
        set({ campaignError: error });
    },

    // =========================================================================
    // Phase 9: Countdowns
    // =========================================================================

    createCountdown: async (campaignId: string, countdownData: CountdownInsert) => {
        const campaign = get().activeCampaign;
        if (!campaign) {
            toast.error('No active campaign');
            return;
        }

        const newCountdown: Countdown = {
            id: crypto.randomUUID(),
            name: countdownData.name,
            description: countdownData.description,
            type: countdownData.type,
            starting_value: countdownData.starting_value,
            current_value: countdownData.current_value ?? countdownData.starting_value,
            is_public: countdownData.is_public ?? true,
            is_looping: countdownData.is_looping ?? false,
            created_at: new Date().toISOString(),
        };

        const previousCountdowns = campaign.countdowns || [];
        const updatedCountdowns = [...previousCountdowns, newCountdown];

        const { success } = await withOptimisticUpdate(
            () => {
                set((state) => ({
                    activeCampaign: state.activeCampaign
                        ? { ...state.activeCampaign, countdowns: updatedCountdowns }
                        : null,
                }));
                return () => set((state) => ({
                    activeCampaign: state.activeCampaign
                        ? { ...state.activeCampaign, countdowns: previousCountdowns }
                        : null,
                }));
            },
            () => dataService.campaign.updateCountdowns(campaignId, updatedCountdowns),
            'Failed to create countdown'
        );

        if (success) {
            // Log activity
            const state = get() as CharacterStore;
            if (state.user) {
                state.logActivity({
                    campaign_id: campaignId,
                    user_id: state.user.id,
                    activity_type: 'countdown_created',
                    data: {
                        countdown_name: newCountdown.name,
                        countdown_type: newCountdown.type,
                        starting_value: newCountdown.starting_value,
                    },
                    is_private: !newCountdown.is_public,
                });
            }
            toast.success(`Countdown "${newCountdown.name}" created`);
        }
    },

    advanceCountdown: async (campaignId: string, countdownId: string, amount: number) => {
        const campaign = get().activeCampaign;
        if (!campaign) {
            toast.error('No active campaign');
            return;
        }

        const previousCountdowns = campaign.countdowns || [];
        const countdown = previousCountdowns.find(c => c.id === countdownId);
        if (!countdown) {
            toast.error('Countdown not found');
            return;
        }

        const previousValue = countdown.current_value;
        const newValue = Math.max(0, countdown.current_value - amount);

        const updatedCountdowns = previousCountdowns.map(c =>
            c.id === countdownId ? { ...c, current_value: newValue } : c
        );

        const { success } = await withOptimisticUpdate(
            () => {
                set((state) => ({
                    activeCampaign: state.activeCampaign
                        ? { ...state.activeCampaign, countdowns: updatedCountdowns }
                        : null,
                }));
                return () => set((state) => ({
                    activeCampaign: state.activeCampaign
                        ? { ...state.activeCampaign, countdowns: previousCountdowns }
                        : null,
                }));
            },
            () => dataService.campaign.updateCountdowns(campaignId, updatedCountdowns),
            'Failed to advance countdown'
        );

        if (success) {
            // Log activity
            const state = get() as CharacterStore;
            if (state.user) {
                const wasTriggered = newValue === 0 && previousValue > 0;
                state.logActivity({
                    campaign_id: campaignId,
                    user_id: state.user.id,
                    activity_type: wasTriggered ? 'countdown_triggered' : 'countdown_advanced',
                    data: {
                        countdown_name: countdown.name,
                        countdown_type: countdown.type,
                        previous_value: previousValue,
                        new_value: newValue,
                        amount_advanced: amount,
                    },
                    is_private: !countdown.is_public,
                });
            }

            if (newValue === 0) {
                toast.success(`Countdown "${countdown.name}" triggered!`);
            }
        }
    },

    resetCountdown: async (campaignId: string, countdownId: string) => {
        const campaign = get().activeCampaign;
        if (!campaign) {
            toast.error('No active campaign');
            return;
        }

        const previousCountdowns = campaign.countdowns || [];
        const countdown = previousCountdowns.find(c => c.id === countdownId);
        if (!countdown) {
            toast.error('Countdown not found');
            return;
        }

        const updatedCountdowns = previousCountdowns.map(c =>
            c.id === countdownId ? { ...c, current_value: c.starting_value } : c
        );

        const { success } = await withOptimisticUpdate(
            () => {
                set((state) => ({
                    activeCampaign: state.activeCampaign
                        ? { ...state.activeCampaign, countdowns: updatedCountdowns }
                        : null,
                }));
                return () => set((state) => ({
                    activeCampaign: state.activeCampaign
                        ? { ...state.activeCampaign, countdowns: previousCountdowns }
                        : null,
                }));
            },
            () => dataService.campaign.updateCountdowns(campaignId, updatedCountdowns),
            'Failed to reset countdown'
        );

        if (success) {
            toast.success(`Countdown "${countdown.name}" reset`);
        }
    },

    deleteCountdown: async (campaignId: string, countdownId: string) => {
        const campaign = get().activeCampaign;
        if (!campaign) {
            toast.error('No active campaign');
            return;
        }

        const previousCountdowns = campaign.countdowns || [];
        const countdown = previousCountdowns.find(c => c.id === countdownId);
        if (!countdown) {
            toast.error('Countdown not found');
            return;
        }

        const updatedCountdowns = previousCountdowns.filter(c => c.id !== countdownId);

        const { success } = await withOptimisticUpdate(
            () => {
                set((state) => ({
                    activeCampaign: state.activeCampaign
                        ? { ...state.activeCampaign, countdowns: updatedCountdowns }
                        : null,
                }));
                return () => set((state) => ({
                    activeCampaign: state.activeCampaign
                        ? { ...state.activeCampaign, countdowns: previousCountdowns }
                        : null,
                }));
            },
            () => dataService.campaign.updateCountdowns(campaignId, updatedCountdowns),
            'Failed to delete countdown'
        );

        if (success) {
            // Log activity
            const state = get() as CharacterStore;
            if (state.user) {
                state.logActivity({
                    campaign_id: campaignId,
                    user_id: state.user.id,
                    activity_type: 'countdown_deleted',
                    data: { countdown_name: countdown.name },
                    is_private: !countdown.is_public,
                });
            }
            toast.success(`Countdown "${countdown.name}" removed`);
        }
    },

    // =========================================================================
    // Phase 9: Projects
    // =========================================================================

    createCampaignProject: async (campaignId: string, projectData: ProjectInsert) => {
        const campaign = get().activeCampaign;
        if (!campaign) {
            toast.error('No active campaign');
            return;
        }

        const newProject: Project = {
            id: crypto.randomUUID(),
            character_id: projectData.character_id,
            character_name: projectData.character_name,
            name: projectData.name,
            description: projectData.description,
            starting_value: projectData.starting_value,
            current_value: projectData.current_value ?? projectData.starting_value,
            advancement_type: projectData.advancement_type ?? 'auto',
            status: projectData.status ?? 'active',
            created_at: new Date().toISOString(),
        };

        const previousProjects = campaign.projects || [];
        const updatedProjects = [...previousProjects, newProject];

        const { success } = await withOptimisticUpdate(
            () => {
                set((state) => ({
                    activeCampaign: state.activeCampaign
                        ? { ...state.activeCampaign, projects: updatedProjects }
                        : null,
                }));
                return () => set((state) => ({
                    activeCampaign: state.activeCampaign
                        ? { ...state.activeCampaign, projects: previousProjects }
                        : null,
                }));
            },
            () => dataService.campaign.updateProjects(campaignId, updatedProjects),
            'Failed to create project'
        );

        if (success) {
            // Log activity
            const state = get() as CharacterStore;
            if (state.user) {
                state.logActivity({
                    campaign_id: campaignId,
                    user_id: state.user.id,
                    activity_type: 'project_created',
                    data: {
                        project_name: newProject.name,
                        character_name: newProject.character_name,
                        starting_value: newProject.starting_value,
                    },
                    is_private: false,
                });
            }
            toast.success(`Project "${newProject.name}" created for ${newProject.character_name}`);
        }
    },

    advanceCampaignProject: async (campaignId: string, projectId: string) => {
        const campaign = get().activeCampaign;
        if (!campaign) {
            toast.error('No active campaign');
            return;
        }

        const previousProjects = campaign.projects || [];
        const project = previousProjects.find(p => p.id === projectId);
        if (!project) {
            toast.error('Project not found');
            return;
        }

        const previousValue = project.current_value;
        const newValue = Math.max(0, project.current_value - 1);

        const updatedProjects = previousProjects.map(p =>
            p.id === projectId ? { ...p, current_value: newValue } : p
        );

        const { success } = await withOptimisticUpdate(
            () => {
                set((state) => ({
                    activeCampaign: state.activeCampaign
                        ? { ...state.activeCampaign, projects: updatedProjects }
                        : null,
                }));
                return () => set((state) => ({
                    activeCampaign: state.activeCampaign
                        ? { ...state.activeCampaign, projects: previousProjects }
                        : null,
                }));
            },
            () => dataService.campaign.updateProjects(campaignId, updatedProjects),
            'Failed to advance project'
        );

        if (success) {
            // Log activity
            const state = get() as CharacterStore;
            if (state.user) {
                state.logActivity({
                    campaign_id: campaignId,
                    user_id: state.user.id,
                    activity_type: 'project_advanced',
                    data: {
                        project_name: project.name,
                        character_name: project.character_name,
                        previous_value: previousValue,
                        new_value: newValue,
                    },
                    is_private: false,
                });
            }
            toast.success(`${project.character_name}'s project "${project.name}" advanced`);
        }
    },

    completeCampaignProject: async (campaignId: string, projectId: string) => {
        const campaign = get().activeCampaign;
        if (!campaign) {
            toast.error('No active campaign');
            return;
        }

        const previousProjects = campaign.projects || [];
        const project = previousProjects.find(p => p.id === projectId);
        if (!project) {
            toast.error('Project not found');
            return;
        }

        const updatedProjects = previousProjects.map(p =>
            p.id === projectId
                ? { ...p, status: 'completed' as const, completed_at: new Date().toISOString() }
                : p
        );

        const { success } = await withOptimisticUpdate(
            () => {
                set((state) => ({
                    activeCampaign: state.activeCampaign
                        ? { ...state.activeCampaign, projects: updatedProjects }
                        : null,
                }));
                return () => set((state) => ({
                    activeCampaign: state.activeCampaign
                        ? { ...state.activeCampaign, projects: previousProjects }
                        : null,
                }));
            },
            () => dataService.campaign.updateProjects(campaignId, updatedProjects),
            'Failed to complete project'
        );

        if (success) {
            // Log activity
            const state = get() as CharacterStore;
            if (state.user) {
                state.logActivity({
                    campaign_id: campaignId,
                    user_id: state.user.id,
                    activity_type: 'project_completed',
                    data: {
                        project_name: project.name,
                        character_name: project.character_name,
                    },
                    is_private: false,
                });
            }
            toast.success(`🎉 ${project.character_name} completed "${project.name}"!`);
        }
    },

    abandonCampaignProject: async (campaignId: string, projectId: string) => {
        const campaign = get().activeCampaign;
        if (!campaign) {
            toast.error('No active campaign');
            return;
        }

        const previousProjects = campaign.projects || [];
        const project = previousProjects.find(p => p.id === projectId);
        if (!project) {
            toast.error('Project not found');
            return;
        }

        const updatedProjects = previousProjects.map(p =>
            p.id === projectId ? { ...p, status: 'abandoned' as const } : p
        );

        const { success } = await withOptimisticUpdate(
            () => {
                set((state) => ({
                    activeCampaign: state.activeCampaign
                        ? { ...state.activeCampaign, projects: updatedProjects }
                        : null,
                }));
                return () => set((state) => ({
                    activeCampaign: state.activeCampaign
                        ? { ...state.activeCampaign, projects: previousProjects }
                        : null,
                }));
            },
            () => dataService.campaign.updateProjects(campaignId, updatedProjects),
            'Failed to abandon project'
        );

        if (success) {
            toast.success(`Project "${project.name}" abandoned`);
        }
    },
});
