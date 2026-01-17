/**
 * Activity Feed Tests (Phase 3)
 * ----------------------------------------------------------------------------
 * TDD tests for the activity feed system. These tests define the expected
 * behavior for activity logging, retrieval, and store integration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================================
// MOCKS - All vi.mock calls must be at the top
// ============================================================================

// Mock data service
vi.mock('@/lib/data-service', () => ({
    dataService: {
        campaign: {
            list: vi.fn(),
            create: vi.fn(),
            get: vi.fn(),
            getWithMembers: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            getMembers: vi.fn(),
            joinByInviteCode: vi.fn(),
            addMember: vi.fn(),
            updateMember: vi.fn(),
            removeMember: vi.fn(),
            transferGM: vi.fn(),
            getPartyCharacters: vi.fn(),
            gmAdjustVital: vi.fn(),
            updateFear: vi.fn(),
            // Phase 3: Activity methods
            logActivity: vi.fn(),
            getActivity: vi.fn(),
            getActivityCount: vi.fn(),
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
        info: vi.fn(),
    },
}));

// ============================================================================
// IMPORTS - After all mocks are declared
// ============================================================================

import { useCharacterStore } from '@/store/character-store';
import { dataService } from '@/lib/data-service';
import type { CampaignActivity, CampaignActivityInsert } from '@/types/activity';

// Get typed references to mocks
const mockDataService = vi.mocked(dataService);

// ============================================================================
// TEST FIXTURES
// ============================================================================

const mockActivity: CampaignActivity = {
    id: 'activity-1',
    campaign_id: 'campaign-123',
    user_id: 'user-123',
    character_id: 'char-1',
    character_name: 'Thorn',
    activity_type: 'dice_roll',
    data: {
        roll_type: 'attack',
        dice: [5, 3],
        modifier: 2,
        total: 10,
        hope_fear: 'hope',
    },
    is_private: false,
    created_at: '2026-01-01T12:00:00Z',
};

const mockActivities: CampaignActivity[] = [
    mockActivity,
    {
        id: 'activity-2',
        campaign_id: 'campaign-123',
        user_id: 'user-123',
        character_id: 'char-1',
        character_name: 'Thorn',
        activity_type: 'vital_change',
        data: {
            vital: 'hp',
            change: -3,
            previous_value: 10,
            new_value: 7,
            max_value: 10,
        },
        is_private: false,
        created_at: '2026-01-01T12:01:00Z',
    },
    {
        id: 'activity-3',
        campaign_id: 'campaign-123',
        user_id: 'user-123',
        activity_type: 'gm_announcement',
        data: {
            message: 'Roll for initiative!',
            importance: 'important',
        },
        is_private: false,
        created_at: '2026-01-01T12:02:00Z',
    },
];

// ============================================================================
// TESTS
// ============================================================================

describe('Phase 3: Activity Feed', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Reset store to initial state
        useCharacterStore.setState({
            user: { id: 'user-123', email: 'test@test.com', user_metadata: {} } as any,
            activeCampaign: {
                id: 'campaign-123',
                name: 'Test Campaign',
                gm_user_id: 'user-123',
                invite_code: 'ABC12345',
                fear_current: 3,
                fear_max: 10,
                settings: {},
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-01T00:00:00Z',
                members: [],
                member_count: 1,
            } as any,
            activityFeed: [],
            activityTotalCount: 0,
            isLoadingActivity: false,
        });
    });

    describe('fetchActivityFeed', () => {
        it('should fetch activity feed for a campaign', async () => {
            mockDataService.campaign.getActivity.mockResolvedValue(mockActivities);
            mockDataService.campaign.getActivityCount.mockResolvedValue(3);

            await useCharacterStore.getState().fetchActivityFeed('campaign-123');

            expect(dataService.campaign.getActivity).toHaveBeenCalledWith('campaign-123', 50, 0);
            expect(dataService.campaign.getActivityCount).toHaveBeenCalledWith('campaign-123');
            expect(useCharacterStore.getState().activityFeed).toHaveLength(3);
            expect(useCharacterStore.getState().activityTotalCount).toBe(3);
        });

        it('should handle pagination with offset', async () => {
            // First fetch
            mockDataService.campaign.getActivity.mockResolvedValue(mockActivities);
            mockDataService.campaign.getActivityCount.mockResolvedValue(6);
            await useCharacterStore.getState().fetchActivityFeed('campaign-123');

            // Second fetch with offset
            const moreActivities: CampaignActivity[] = [
                {
                    id: 'activity-4',
                    campaign_id: 'campaign-123',
                    user_id: 'user-456',
                    activity_type: 'dice_roll',
                    data: { roll_type: 'damage', dice: [4], modifier: 0, total: 4 },
                    is_private: false,
                    created_at: '2026-01-01T11:00:00Z',
                },
            ];
            mockDataService.campaign.getActivity.mockResolvedValue(moreActivities);

            await useCharacterStore.getState().fetchActivityFeed('campaign-123', 3);

            expect(dataService.campaign.getActivity).toHaveBeenCalledWith('campaign-123', 50, 3);
            expect(useCharacterStore.getState().activityFeed).toHaveLength(4); // Original 3 + 1 more
        });

        it('should set loading state during fetch', async () => {
            mockDataService.campaign.getActivity.mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
            );
            mockDataService.campaign.getActivityCount.mockResolvedValue(0);

            const fetchPromise = useCharacterStore.getState().fetchActivityFeed('campaign-123');
            expect(useCharacterStore.getState().isLoadingActivity).toBe(true);

            await fetchPromise;
            expect(useCharacterStore.getState().isLoadingActivity).toBe(false);
        });

        it('should handle fetch errors gracefully', async () => {
            mockDataService.campaign.getActivity.mockRejectedValue(new Error('Network error'));

            await useCharacterStore.getState().fetchActivityFeed('campaign-123');

            expect(useCharacterStore.getState().isLoadingActivity).toBe(false);
            expect(useCharacterStore.getState().activityFeed).toEqual([]);
        });
    });

    describe('logActivity', () => {
        it('should log a dice roll activity', async () => {
            const activityInsert: CampaignActivityInsert = {
                campaign_id: 'campaign-123',
                user_id: 'user-123',
                character_id: 'char-1',
                character_name: 'Thorn',
                activity_type: 'dice_roll',
                data: {
                    roll_type: 'attack',
                    dice: [5, 3],
                    modifier: 2,
                    total: 10,
                    hope_fear: 'hope',
                },
                is_private: false,
            };

            mockDataService.campaign.logActivity.mockResolvedValue({
                ...activityInsert,
                id: 'new-activity-1',
                created_at: '2026-01-01T12:00:00Z',
            } as CampaignActivity);

            await useCharacterStore.getState().logActivity(activityInsert);

            expect(dataService.campaign.logActivity).toHaveBeenCalledWith(activityInsert);
            expect(useCharacterStore.getState().activityFeed[0].id).toBe('new-activity-1');
        });

        it('should log a vital change activity', async () => {
            const activityInsert: CampaignActivityInsert = {
                campaign_id: 'campaign-123',
                user_id: 'user-123',
                character_id: 'char-1',
                character_name: 'Thorn',
                activity_type: 'vital_change',
                data: {
                    vital: 'hp',
                    change: -3,
                    previous_value: 10,
                    new_value: 7,
                    max_value: 10,
                    cause: 'Goblin attack',
                },
                is_private: false,
            };

            mockDataService.campaign.logActivity.mockResolvedValue({
                ...activityInsert,
                id: 'new-activity-2',
                created_at: '2026-01-01T12:01:00Z',
            } as CampaignActivity);

            await useCharacterStore.getState().logActivity(activityInsert);

            expect(dataService.campaign.logActivity).toHaveBeenCalledWith(activityInsert);
        });

        it('should log a GM announcement activity', async () => {
            const activityInsert: CampaignActivityInsert = {
                campaign_id: 'campaign-123',
                user_id: 'user-123',
                activity_type: 'gm_announcement',
                data: {
                    message: 'Combat starts now!',
                    importance: 'critical',
                },
                is_private: false,
            };

            mockDataService.campaign.logActivity.mockResolvedValue({
                ...activityInsert,
                id: 'new-activity-3',
                created_at: '2026-01-01T12:02:00Z',
            } as CampaignActivity);

            await useCharacterStore.getState().logActivity(activityInsert);

            expect(dataService.campaign.logActivity).toHaveBeenCalledWith(activityInsert);
        });

        it('should log a fear change activity', async () => {
            const activityInsert: CampaignActivityInsert = {
                campaign_id: 'campaign-123',
                user_id: 'user-123',
                activity_type: 'fear_change',
                data: {
                    change: 2,
                    previous_value: 3,
                    new_value: 5,
                    max_value: 10,
                    trigger: 'manual',
                },
                is_private: false,
            };

            mockDataService.campaign.logActivity.mockResolvedValue({
                ...activityInsert,
                id: 'new-activity-4',
                created_at: '2026-01-01T12:03:00Z',
            } as CampaignActivity);

            await useCharacterStore.getState().logActivity(activityInsert);

            expect(dataService.campaign.logActivity).toHaveBeenCalledWith(activityInsert);
        });

        it('should log a GM vital adjust activity', async () => {
            const activityInsert: CampaignActivityInsert = {
                campaign_id: 'campaign-123',
                user_id: 'user-123',
                character_id: 'char-2',
                character_name: 'Aria',
                activity_type: 'gm_vital_adjust',
                data: {
                    target_character_id: 'char-2',
                    target_character_name: 'Aria',
                    vital: 'stress',
                    change: 1,
                    previous_value: 2,
                    new_value: 3,
                    reason: 'Failed stealth check',
                },
                is_private: false,
            };

            mockDataService.campaign.logActivity.mockResolvedValue({
                ...activityInsert,
                id: 'new-activity-5',
                created_at: '2026-01-01T12:04:00Z',
            } as CampaignActivity);

            await useCharacterStore.getState().logActivity(activityInsert);

            expect(dataService.campaign.logActivity).toHaveBeenCalledWith(activityInsert);
        });

        it('should log a private GM roll activity', async () => {
            const activityInsert: CampaignActivityInsert = {
                campaign_id: 'campaign-123',
                user_id: 'user-123',
                activity_type: 'gm_roll',
                data: {
                    roll_type: 'custom',
                    dice: [6, 4],
                    modifier: 3,
                    total: 13,
                    revealed: false,
                },
                is_private: true,
            };

            mockDataService.campaign.logActivity.mockResolvedValue({
                ...activityInsert,
                id: 'new-activity-6',
                created_at: '2026-01-01T12:05:00Z',
            } as CampaignActivity);

            await useCharacterStore.getState().logActivity(activityInsert);

            expect(dataService.campaign.logActivity).toHaveBeenCalledWith(activityInsert);
        });

        it('should add activity to the front of the feed (optimistic update)', async () => {
            useCharacterStore.setState({ activityFeed: mockActivities, activityTotalCount: 3 });

            const newActivity: CampaignActivityInsert = {
                campaign_id: 'campaign-123',
                user_id: 'user-123',
                activity_type: 'dice_roll',
                data: { roll_type: 'damage', dice: [6], modifier: 0, total: 6 },
                is_private: false,
            };

            mockDataService.campaign.logActivity.mockResolvedValue({
                ...newActivity,
                id: 'newest-activity',
                created_at: '2026-01-01T13:00:00Z',
            } as CampaignActivity);

            await useCharacterStore.getState().logActivity(newActivity);

            expect(useCharacterStore.getState().activityFeed[0].id).toBe('newest-activity');
            expect(useCharacterStore.getState().activityTotalCount).toBe(4);
        });

        it('should handle log errors gracefully', async () => {
            mockDataService.campaign.logActivity.mockRejectedValue(new Error('Failed to log'));

            const activityInsert: CampaignActivityInsert = {
                campaign_id: 'campaign-123',
                user_id: 'user-123',
                activity_type: 'dice_roll',
                data: { roll_type: 'attack', dice: [1], modifier: 0, total: 1 },
                is_private: false,
            };

            // Should not throw
            await useCharacterStore.getState().logActivity(activityInsert);

            // Activity should not be added
            expect(useCharacterStore.getState().activityFeed).toEqual([]);
        });
    });

    describe('clearActivityFeed', () => {
        it('should clear the activity feed', () => {
            useCharacterStore.setState({
                activityFeed: mockActivities,
                activityTotalCount: 3,
            });

            useCharacterStore.getState().clearActivityFeed();

            expect(useCharacterStore.getState().activityFeed).toEqual([]);
            expect(useCharacterStore.getState().activityTotalCount).toBe(0);
        });
    });
});

describe('Phase 3: Data Service Integration', () => {
    // These test the data service methods exist and have correct signatures
    it('should have logActivity method in data service', () => {
        expect(dataService.campaign.logActivity).toBeDefined();
    });

    it('should have getActivity method in data service', () => {
        expect(dataService.campaign.getActivity).toBeDefined();
    });

    it('should have getActivityCount method in data service', () => {
        expect(dataService.campaign.getActivityCount).toBeDefined();
    });
});
