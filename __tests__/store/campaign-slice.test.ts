/**
 * CAMPAIGN SLICE TESTS
 * ----------------------------------------------------------------------------
 * This test suite validates the campaign-slice.ts store functions that manage
 * campaign CRUD operations and membership.
 *
 * FUNCTIONALITY TESTED:
 * - fetchUserCampaigns: Loading user's campaigns
 * - createCampaign: Creating new campaigns with GM membership
 * - selectCampaign: Loading campaign details with members
 * - updateCampaign: Updating campaign settings with optimistic updates
 * - deleteCampaign: Removing campaigns
 * - joinCampaignByCode: Joining via invite code with validation
 * - leaveCampaign: Leaving a campaign
 * - assignCharacterToCampaign: Assigning characters to campaigns
 * - kickMember: Removing members (GM only)
 * - transferGM: Transferring GM role
 *
 * ERROR RECOVERY:
 * - All functions handle database errors gracefully
 * - Toast notifications for success and error states
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// ============================================================================
// MOCKS - All vi.mock calls must be at the top
// ============================================================================

// Mock the data service
vi.mock('@/lib/data-service', () => ({
    dataService: {
        campaign: {
            create: vi.fn(),
            get: vi.fn(),
            getWithMembers: vi.fn(),
            list: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            getMembers: vi.fn(),
            addMember: vi.fn(),
            updateMember: vi.fn(),
            removeMember: vi.fn(),
            findByInviteCode: vi.fn(),
            joinByInviteCode: vi.fn(),
            transferGM: vi.fn(),
        },
    },
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
    default: () => ({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    }),
}));

// Mock toast notifications
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// ============================================================================
// IMPORTS - After all mocks are declared
// ============================================================================
import { useCharacterStore } from '@/store/character-store';
import { dataService } from '@/lib/data-service';
import { toast } from 'sonner';
import type { Campaign, CampaignWithMembers, EnrichedCampaignMember } from '@/types/campaign';

// Get typed references to mocks
const mockDataService = vi.mocked(dataService);
const mockToast = vi.mocked(toast);

// ============================================================================
// TEST FIXTURES
// ============================================================================

const createMockCampaign = (overrides?: Partial<Campaign>): Campaign => ({
    id: 'campaign-1',
    name: 'Test Campaign',
    description: 'A test campaign',
    gm_user_id: 'user-1',
    invite_code: 'ABC12345',
    fear_current: 0,
    fear_max: 10,
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
});

const createMockMember = (overrides?: Partial<EnrichedCampaignMember>): EnrichedCampaignMember => ({
    id: 'member-1',
    campaign_id: 'campaign-1',
    user_id: 'user-2',
    character_id: 'char-1',
    role: 'player',
    joined_at: new Date().toISOString(),
    profile: {
        username: 'TestPlayer',
        avatar_url: null,
    },
    character: {
        name: 'Test Character',
        level: 1,
        class_id: 'warrior',
        ancestry: 'human',
    },
    ...overrides,
});

const createMockCampaignWithMembers = (overrides?: Partial<CampaignWithMembers>): CampaignWithMembers => ({
    ...createMockCampaign(),
    members: [createMockMember()],
    member_count: 1,
    ...overrides,
});

// ============================================================================
// SETUP AND TEARDOWN
// ============================================================================

describe('Campaign Slice', () => {
    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();

        // Reset store to initial state
        useCharacterStore.setState({
            user: { id: 'user-1', email: 'test@test.com' },
            campaigns: [],
            activeCampaign: null,
            campaignMembers: [],
            isLoadingCampaigns: false,
            campaignError: null,
        });

        // Default mock implementations (success cases)
        mockDataService.campaign.list.mockResolvedValue([]);
        mockDataService.campaign.create.mockResolvedValue(createMockCampaign());
        mockDataService.campaign.get.mockResolvedValue(createMockCampaign());
        mockDataService.campaign.getWithMembers.mockResolvedValue(createMockCampaignWithMembers());
        mockDataService.campaign.update.mockResolvedValue(createMockCampaign());
        mockDataService.campaign.delete.mockResolvedValue(undefined);
        mockDataService.campaign.getMembers.mockResolvedValue([createMockMember()]);
        mockDataService.campaign.joinByInviteCode.mockResolvedValue(createMockMember());
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ==========================================================================
    // fetchUserCampaigns TESTS
    // ==========================================================================

    describe('fetchUserCampaigns', () => {
        it('should fetch campaigns for current user', async () => {
            const campaigns = [createMockCampaign(), createMockCampaign({ id: 'campaign-2', name: 'Campaign 2' })];
            mockDataService.campaign.list.mockResolvedValue(campaigns);

            await useCharacterStore.getState().fetchUserCampaigns();

            const state = useCharacterStore.getState();
            expect(state.campaigns).toHaveLength(2);
            expect(state.isLoadingCampaigns).toBe(false);
            expect(mockDataService.campaign.list).toHaveBeenCalledWith('user-1');
        });

        it('should set loading state during fetch', async () => {
            const fetchPromise = useCharacterStore.getState().fetchUserCampaigns();

            // Check loading state immediately
            expect(useCharacterStore.getState().isLoadingCampaigns).toBe(true);

            await fetchPromise;

            // Should be false after completion
            expect(useCharacterStore.getState().isLoadingCampaigns).toBe(false);
        });

        it('should handle errors and set error state', async () => {
            mockDataService.campaign.list.mockRejectedValue(new Error('Network error'));

            try {
                await useCharacterStore.getState().fetchUserCampaigns();
            } catch (error) {
                // Expected to throw
            }

            const state = useCharacterStore.getState();
            expect(state.campaignError).toBe('Network error');
            expect(state.isLoadingCampaigns).toBe(false);
            expect(mockToast.error).toHaveBeenCalled();
        });
    });

    // ==========================================================================
    // createCampaign TESTS
    // ==========================================================================

    describe('createCampaign', () => {
        it('should create a new campaign', async () => {
            const newCampaign = createMockCampaign({ name: 'New Campaign' });
            mockDataService.campaign.create.mockResolvedValue(newCampaign);

            const result = await useCharacterStore.getState().createCampaign('New Campaign', 'Description');

            expect(result).toEqual(newCampaign);
            expect(mockDataService.campaign.create).toHaveBeenCalledWith({
                name: 'New Campaign',
                description: 'Description',
                gm_user_id: 'user-1',
            });
        });

        it('should add campaign to local state', async () => {
            const newCampaign = createMockCampaign({ name: 'New Campaign' });
            mockDataService.campaign.create.mockResolvedValue(newCampaign);

            await useCharacterStore.getState().createCampaign('New Campaign');

            const state = useCharacterStore.getState();
            expect(state.campaigns).toHaveLength(1);
            expect(state.campaigns[0].name).toBe('New Campaign');
        });

        it('should show success toast', async () => {
            await useCharacterStore.getState().createCampaign('New Campaign');

            expect(mockToast.success).toHaveBeenCalledWith('Campaign created successfully!');
        });

        it('should handle errors', async () => {
            mockDataService.campaign.create.mockRejectedValue(new Error('Create failed'));

            try {
                await useCharacterStore.getState().createCampaign('Bad Campaign');
            } catch (error) {
                // Expected
            }

            expect(mockToast.error).toHaveBeenCalledWith('Create failed');
            expect(useCharacterStore.getState().campaignError).toBe('Create failed');
        });
    });

    // ==========================================================================
    // selectCampaign TESTS
    // ==========================================================================

    describe('selectCampaign', () => {
        it('should load campaign with members', async () => {
            const campaign = createMockCampaignWithMembers();
            mockDataService.campaign.getWithMembers.mockResolvedValue(campaign);

            await useCharacterStore.getState().selectCampaign('campaign-1');

            const state = useCharacterStore.getState();
            expect(state.activeCampaign).toEqual(campaign);
            expect(state.isLoadingCampaigns).toBe(false);
        });

        it('should throw error when campaign not found', async () => {
            mockDataService.campaign.getWithMembers.mockResolvedValue(null);

            try {
                await useCharacterStore.getState().selectCampaign('non-existent');
            } catch (error: any) {
                expect(error.message).toBe('Campaign not found');
            }
        });
    });

    // ==========================================================================
    // updateCampaign TESTS
    // ==========================================================================

    describe('updateCampaign', () => {
        it('should update campaign in database', async () => {
            const updated = createMockCampaign({ name: 'Updated Name' });
            mockDataService.campaign.update.mockResolvedValue(updated);
            useCharacterStore.setState({ campaigns: [createMockCampaign()] });

            await useCharacterStore.getState().updateCampaign('campaign-1', { name: 'Updated Name' });

            expect(mockDataService.campaign.update).toHaveBeenCalledWith('campaign-1', { name: 'Updated Name' });
            expect(mockToast.success).toHaveBeenCalledWith('Campaign updated successfully!');
        });

        it('should update campaign in local state', async () => {
            const updated = createMockCampaign({ name: 'Updated Name' });
            mockDataService.campaign.update.mockResolvedValue(updated);
            useCharacterStore.setState({ campaigns: [createMockCampaign()] });

            await useCharacterStore.getState().updateCampaign('campaign-1', { name: 'Updated Name' });

            const state = useCharacterStore.getState();
            expect(state.campaigns[0].name).toBe('Updated Name');
        });

        it('should update activeCampaign if currently selected', async () => {
            const updated = createMockCampaign({ name: 'Updated Name' });
            mockDataService.campaign.update.mockResolvedValue(updated);
            useCharacterStore.setState({
                campaigns: [createMockCampaign()],
                activeCampaign: createMockCampaignWithMembers(),
            });

            await useCharacterStore.getState().updateCampaign('campaign-1', { name: 'Updated Name' });

            const state = useCharacterStore.getState();
            expect(state.activeCampaign?.name).toBe('Updated Name');
        });
    });

    // ==========================================================================
    // deleteCampaign TESTS
    // ==========================================================================

    describe('deleteCampaign', () => {
        it('should delete campaign from database', async () => {
            useCharacterStore.setState({ campaigns: [createMockCampaign()] });

            await useCharacterStore.getState().deleteCampaign('campaign-1');

            expect(mockDataService.campaign.delete).toHaveBeenCalledWith('campaign-1');
            expect(mockToast.success).toHaveBeenCalledWith('Campaign deleted successfully!');
        });

        it('should remove campaign from local state', async () => {
            useCharacterStore.setState({ campaigns: [createMockCampaign(), createMockCampaign({ id: 'campaign-2' })] });

            await useCharacterStore.getState().deleteCampaign('campaign-1');

            const state = useCharacterStore.getState();
            expect(state.campaigns).toHaveLength(1);
            expect(state.campaigns[0].id).toBe('campaign-2');
        });

        it('should clear activeCampaign if deleted', async () => {
            useCharacterStore.setState({
                campaigns: [createMockCampaign()],
                activeCampaign: createMockCampaignWithMembers(),
            });

            await useCharacterStore.getState().deleteCampaign('campaign-1');

            expect(useCharacterStore.getState().activeCampaign).toBeNull();
        });
    });

    // ==========================================================================
    // joinCampaignByCode TESTS
    // ==========================================================================

    describe('joinCampaignByCode', () => {
        it('should join campaign with valid code', async () => {
            await useCharacterStore.getState().joinCampaignByCode('ABC12345', 'char-1');

            expect(mockDataService.campaign.joinByInviteCode).toHaveBeenCalledWith('ABC12345', 'user-1', 'char-1');
            expect(mockToast.success).toHaveBeenCalledWith('Joined campaign successfully!');
        });

        it('should refresh campaigns after joining', async () => {
            const campaigns = [createMockCampaign()];
            mockDataService.campaign.list.mockResolvedValue(campaigns);

            await useCharacterStore.getState().joinCampaignByCode('ABC12345');

            expect(mockDataService.campaign.list).toHaveBeenCalled();
            expect(useCharacterStore.getState().campaigns).toHaveLength(1);
        });

        it('should handle invalid code error', async () => {
            mockDataService.campaign.joinByInviteCode.mockRejectedValue(new Error('Invalid invite code'));

            try {
                await useCharacterStore.getState().joinCampaignByCode('INVALID');
            } catch (error) {
                // Expected
            }

            expect(mockToast.error).toHaveBeenCalledWith('Invalid invite code');
        });
    });

    // ==========================================================================
    // leaveCampaign TESTS
    // ==========================================================================

    describe('leaveCampaign', () => {
        it('should leave campaign', async () => {
            const member = createMockMember({ user_id: 'user-1' });
            mockDataService.campaign.getMembers.mockResolvedValue([member]);
            useCharacterStore.setState({ campaigns: [createMockCampaign()] });

            await useCharacterStore.getState().leaveCampaign('campaign-1');

            expect(mockDataService.campaign.removeMember).toHaveBeenCalledWith('member-1');
            expect(mockToast.success).toHaveBeenCalledWith('Left campaign successfully!');
        });

        it('should remove campaign from local state', async () => {
            const member = createMockMember({ user_id: 'user-1' });
            mockDataService.campaign.getMembers.mockResolvedValue([member]);
            useCharacterStore.setState({ campaigns: [createMockCampaign(), createMockCampaign({ id: 'campaign-2' })] });

            await useCharacterStore.getState().leaveCampaign('campaign-1');

            const state = useCharacterStore.getState();
            expect(state.campaigns).toHaveLength(1);
            expect(state.campaigns[0].id).toBe('campaign-2');
        });
    });

    // ==========================================================================
    // assignCharacterToCampaign TESTS
    // ==========================================================================

    describe('assignCharacterToCampaign', () => {
        it('should assign character to campaign', async () => {
            const member = createMockMember({ user_id: 'user-1' });
            mockDataService.campaign.getMembers.mockResolvedValue([member]);

            await useCharacterStore.getState().assignCharacterToCampaign('campaign-1', 'char-new');

            expect(mockDataService.campaign.updateMember).toHaveBeenCalledWith('member-1', { character_id: 'char-new' });
            expect(mockToast.success).toHaveBeenCalledWith('Character assigned to campaign!');
        });

        it('should refresh active campaign after assignment', async () => {
            const member = createMockMember({ user_id: 'user-1' });
            mockDataService.campaign.getMembers.mockResolvedValue([member]);
            useCharacterStore.setState({ activeCampaign: createMockCampaignWithMembers() });

            await useCharacterStore.getState().assignCharacterToCampaign('campaign-1', 'char-new');

            expect(mockDataService.campaign.getWithMembers).toHaveBeenCalledWith('campaign-1');
        });
    });

    // ==========================================================================
    // kickMember TESTS
    // ==========================================================================

    describe('kickMember', () => {
        it('should remove member from campaign', async () => {
            useCharacterStore.setState({ activeCampaign: createMockCampaignWithMembers() });

            await useCharacterStore.getState().kickMember('member-1');

            expect(mockDataService.campaign.removeMember).toHaveBeenCalledWith('member-1');
            expect(mockToast.success).toHaveBeenCalledWith('Member removed from campaign!');
        });

        it('should refresh active campaign after kick', async () => {
            useCharacterStore.setState({ activeCampaign: createMockCampaignWithMembers() });

            await useCharacterStore.getState().kickMember('member-1');

            expect(mockDataService.campaign.getWithMembers).toHaveBeenCalledWith('campaign-1');
        });
    });

    // ==========================================================================
    // transferGM TESTS
    // ==========================================================================

    describe('transferGM', () => {
        it('should transfer GM role', async () => {
            useCharacterStore.setState({ activeCampaign: createMockCampaignWithMembers() });

            await useCharacterStore.getState().transferGM('campaign-1', 'user-2');

            expect(mockDataService.campaign.transferGM).toHaveBeenCalledWith('campaign-1', 'user-2');
            expect(mockToast.success).toHaveBeenCalledWith('GM transferred successfully!');
        });

        it('should refresh campaign after transfer', async () => {
            useCharacterStore.setState({ activeCampaign: createMockCampaignWithMembers() });

            await useCharacterStore.getState().transferGM('campaign-1', 'user-2');

            expect(mockDataService.campaign.getWithMembers).toHaveBeenCalledWith('campaign-1');
        });
    });

    // ==========================================================================
    // clearActiveCampaign TESTS
    // ==========================================================================

    describe('clearActiveCampaign', () => {
        it('should clear active campaign', () => {
            useCharacterStore.setState({ activeCampaign: createMockCampaignWithMembers() });

            useCharacterStore.getState().clearActiveCampaign();

            expect(useCharacterStore.getState().activeCampaign).toBeNull();
        });
    });

    // ==========================================================================
    // setCampaignError TESTS
    // ==========================================================================

    describe('setCampaignError', () => {
        it('should set error message', () => {
            useCharacterStore.getState().setCampaignError('Test error');

            expect(useCharacterStore.getState().campaignError).toBe('Test error');
        });

        it('should clear error message', () => {
            useCharacterStore.setState({ campaignError: 'Some error' });

            useCharacterStore.getState().setCampaignError(null);

            expect(useCharacterStore.getState().campaignError).toBeNull();
        });
    });

    // ==========================================================================
    // PHASE 2: GM SCREEN TESTS
    // ==========================================================================

    describe('Phase 2: GM Screen - fetchPartyCharacters', () => {
        beforeEach(() => {
            // Add mock for Phase 2 method
            mockDataService.campaign.getPartyCharacters = vi.fn();
        });

        it('should fetch party characters for campaign', async () => {
            const mockCharacters = [
                { id: 'char-1', name: 'Fighter', level: 1 },
                { id: 'char-2', name: 'Wizard', level: 1 },
            ];
            mockDataService.campaign.getPartyCharacters.mockResolvedValue(mockCharacters as any);

            await useCharacterStore.getState().fetchPartyCharacters('campaign-1');

            expect(mockDataService.campaign.getPartyCharacters).toHaveBeenCalledWith('campaign-1');
            expect(useCharacterStore.getState().partyCharacters).toEqual(mockCharacters);
        });

        it('should handle errors when fetching party characters', async () => {
            mockDataService.campaign.getPartyCharacters.mockRejectedValue(new Error('Fetch failed'));

            try {
                await useCharacterStore.getState().fetchPartyCharacters('campaign-1');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });

    describe('Phase 2: GM Screen - gmAdjustVital', () => {
        beforeEach(() => {
            mockDataService.campaign.gmAdjustVital = vi.fn().mockResolvedValue(undefined);
            useCharacterStore.setState({
                partyCharacters: [
                    {
                        id: 'char-1',
                        name: 'Test Char',
                        vitals: { hit_points_current: 5, hit_points_max: 10 },
                    } as any,
                ],
            });
        });

        it('should adjust HP for a character', async () => {
            await useCharacterStore.getState().gmAdjustVital('char-1', 'hp', 8);

            expect(mockDataService.campaign.gmAdjustVital).toHaveBeenCalledWith('char-1', 'hp', 8);
        });

        it('should optimistically update local state', async () => {
            await useCharacterStore.getState().gmAdjustVital('char-1', 'hp', 8);

            const state = useCharacterStore.getState();
            const char = state.partyCharacters.find((c) => c.id === 'char-1');
            expect(char?.hit_points_current).toBe(8);
        });

        it('should handle errors and show toast', async () => {
            mockDataService.campaign.gmAdjustVital.mockRejectedValue(new Error('Update failed'));

            try {
                await useCharacterStore.getState().gmAdjustVital('char-1', 'hp', 8);
            } catch (error) {
                // Expected
            }

            expect(mockToast.error).toHaveBeenCalledWith('Failed to adjust vital');
        });
    });

    describe('Phase 2: GM Screen - updateFear', () => {
        beforeEach(() => {
            mockDataService.campaign.updateFear = vi.fn();
            useCharacterStore.setState({
                activeCampaign: createMockCampaignWithMembers({ fear_current: 5 }),
            });
        });

        it('should update Fear value', async () => {
            const updated = createMockCampaign({ fear_current: 6 });
            mockDataService.campaign.updateFear.mockResolvedValue(updated);

            await useCharacterStore.getState().updateFear('campaign-1', 1);

            expect(mockDataService.campaign.updateFear).toHaveBeenCalledWith('campaign-1', 1);
        });

        it('should update activeCampaign with new Fear value', async () => {
            const updated = createMockCampaign({ fear_current: 6 });
            mockDataService.campaign.updateFear.mockResolvedValue(updated);

            await useCharacterStore.getState().updateFear('campaign-1', 1);

            const state = useCharacterStore.getState();
            expect(state.activeCampaign?.fear_current).toBe(6);
        });

        it('should handle errors', async () => {
            mockDataService.campaign.updateFear.mockRejectedValue(new Error('Fear update failed'));

            try {
                await useCharacterStore.getState().updateFear('campaign-1', 1);
            } catch (error) {
                // Expected
            }

            expect(mockToast.error).toHaveBeenCalledWith('Failed to update Fear');
        });
    });

    describe('Phase 2: GM Screen - toggleVitalsLock', () => {
        it('should unlock a locked card', () => {
            useCharacterStore.setState({ unlockedVitalsCards: new Set() });

            useCharacterStore.getState().toggleVitalsLock('char-1');

            expect(useCharacterStore.getState().unlockedVitalsCards.has('char-1')).toBe(true);
        });

        it('should lock an unlocked card', () => {
            useCharacterStore.setState({ unlockedVitalsCards: new Set(['char-1']) });

            useCharacterStore.getState().toggleVitalsLock('char-1');

            expect(useCharacterStore.getState().unlockedVitalsCards.has('char-1')).toBe(false);
        });

        it('should handle multiple cards independently', () => {
            useCharacterStore.setState({ unlockedVitalsCards: new Set(['char-1']) });

            useCharacterStore.getState().toggleVitalsLock('char-2');

            const unlocked = useCharacterStore.getState().unlockedVitalsCards;
            expect(unlocked.has('char-1')).toBe(true);
            expect(unlocked.has('char-2')).toBe(true);
        });
    });
});

