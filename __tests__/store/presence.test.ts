/**
 * Presence System Tests
 * ----------------------------------------------------------------------------
 * Tests for Phase 5: Presence System (who's online)
 * Tests the campaign slice presence state and actions.
 *
 * GitHub Issue: #67
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCampaignSlice } from '@/store/slices/campaign-slice';
import type { PresenceState } from '@/lib/presence';

// Mock dependencies
vi.mock('@/lib/data-service', () => ({
    dataService: {
        campaign: {
            list: vi.fn(),
            create: vi.fn(),
            get: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            addMember: vi.fn(),
            removeMember: vi.fn(),
            updateMember: vi.fn(),
            getByInviteCode: vi.fn(),
            transferGM: vi.fn(),
            getActivity: vi.fn(),
            getActivityCount: vi.fn(),
            logActivity: vi.fn(),
        },
        character: {
            list: vi.fn(),
            get: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock('@/lib/realtime', () => ({
    realtimeManager: {
        setStoreGetter: vi.fn(),
        subscribeToCampaign: vi.fn().mockResolvedValue(undefined),
        unsubscribe: vi.fn(),
    },
}));

vi.mock('@/lib/presence', () => ({
    presenceManager: {
        setStoreGetter: vi.fn(),
        track: vi.fn().mockResolvedValue(undefined),
        untrack: vi.fn().mockResolvedValue(undefined),
        setAway: vi.fn().mockResolvedValue(undefined),
        setOnline: vi.fn().mockResolvedValue(undefined),
    },
    PresenceState: {},
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

describe('Presence System', () => {
    const mockSet = vi.fn();
    const mockGet = vi.fn();
    let slice: ReturnType<typeof createCampaignSlice>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSet.mockClear();
        mockGet.mockClear();

        // Create a new slice for each test
        slice = createCampaignSlice(mockSet, mockGet, {} as any);
    });

    describe('Initial State', () => {
        it('should have empty onlineMembers array', () => {
            expect(slice.onlineMembers).toEqual([]);
        });

        it('should have presenceTracking set to false', () => {
            expect(slice.presenceTracking).toBe(false);
        });
    });

    describe('setOnlineMembers', () => {
        it('should update onlineMembers state', () => {
            const mockMembers: PresenceState[] = [
                {
                    user_id: 'user-1',
                    username: 'Alice',
                    character_id: 'char-1',
                    character_name: 'Aragorn',
                    status: 'online',
                    online_at: '2026-01-17T10:00:00Z',
                },
                {
                    user_id: 'user-2',
                    username: 'Bob',
                    status: 'away',
                    online_at: '2026-01-17T09:55:00Z',
                },
            ];

            slice.setOnlineMembers(mockMembers);

            expect(mockSet).toHaveBeenCalledWith({ onlineMembers: mockMembers });
        });

        it('should handle empty members array', () => {
            slice.setOnlineMembers([]);
            expect(mockSet).toHaveBeenCalledWith({ onlineMembers: [] });
        });
    });

    describe('startPresenceTracking', () => {
        it('should not track if no user is authenticated', async () => {
            mockGet.mockReturnValue({
                user: null,
                character: null,
            });

            await slice.startPresenceTracking('campaign-1');

            // Should not set presenceTracking to true
            expect(mockSet).not.toHaveBeenCalledWith({ presenceTracking: true });
        });

        it('should start tracking when user is authenticated', async () => {
            const mockUser = { id: 'user-1', email: 'test@example.com' };
            const mockCharacter = { id: 'char-1', name: 'Test Character' };

            mockGet.mockReturnValue({
                user: mockUser,
                character: mockCharacter,
                setOnlineMembers: vi.fn(),
            });

            await slice.startPresenceTracking('campaign-1');

            expect(mockSet).toHaveBeenCalledWith({ presenceTracking: true });
        });
    });

    describe('stopPresenceTracking', () => {
        it('should stop tracking and clear online members', async () => {
            await slice.stopPresenceTracking();

            expect(mockSet).toHaveBeenCalledWith({
                presenceTracking: false,
                onlineMembers: [],
            });
        });
    });

    describe('PresenceState Type', () => {
        it('should support online status', () => {
            const member: PresenceState = {
                user_id: 'user-1',
                username: 'Alice',
                status: 'online',
                online_at: '2026-01-17T10:00:00Z',
            };

            expect(member.status).toBe('online');
        });

        it('should support away status', () => {
            const member: PresenceState = {
                user_id: 'user-2',
                username: 'Bob',
                status: 'away',
                online_at: '2026-01-17T10:00:00Z',
            };

            expect(member.status).toBe('away');
        });

        it('should support optional character fields', () => {
            const memberWithCharacter: PresenceState = {
                user_id: 'user-1',
                username: 'Alice',
                character_id: 'char-1',
                character_name: 'Aragorn',
                status: 'online',
                online_at: '2026-01-17T10:00:00Z',
            };

            const memberWithoutCharacter: PresenceState = {
                user_id: 'user-2',
                username: 'Bob',
                status: 'online',
                online_at: '2026-01-17T10:00:00Z',
            };

            expect(memberWithCharacter.character_id).toBe('char-1');
            expect(memberWithCharacter.character_name).toBe('Aragorn');
            expect(memberWithoutCharacter.character_id).toBeUndefined();
            expect(memberWithoutCharacter.character_name).toBeUndefined();
        });
    });
});
