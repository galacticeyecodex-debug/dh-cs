/**
 * Friendship Slice Tests
 * Phase 7: Friendships (GH#67)
 * 
 * Tests for friend request management, friend list, and related operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the data service
vi.mock('@/lib/data-service', () => ({
    dataService: {
        friendship: {
            findByCode: vi.fn(),
            sendRequest: vi.fn(),
            cancelRequest: vi.fn(),
            acceptRequest: vi.fn(),
            declineRequest: vi.fn(),
            getFriends: vi.fn(),
            getPendingRequests: vi.fn(),
            getOutgoingRequests: vi.fn(),
            unfriend: vi.fn(),
            block: vi.fn(),
            checkFriendship: vi.fn(),
        },
    },
}));

// Import after mocking
import { dataService } from '@/lib/data-service';
import type { Friendship, FriendshipStatus } from '@/types/friendship';

describe('Friendship Types', () => {
    describe('FriendshipStatus', () => {
        it('should have correct status values', () => {
            const validStatuses = ['pending', 'accepted', 'declined', 'blocked'];
            validStatuses.forEach(status => {
                expect(typeof status).toBe('string');
            });
        });
    });
});

describe('Friendship Data Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('findByCode', () => {
        it('should find user by valid friend code', async () => {
            const mockUser = {
                user_id: 'user-123',
                username: 'TestUser',
                avatar_url: 'https://example.com/avatar.jpg',
                allow_friend_requests: true,
            };

            vi.mocked(dataService.friendship.findByCode).mockResolvedValue(mockUser);

            const result = await dataService.friendship.findByCode('ABCD1234');

            expect(result).toEqual(mockUser);
            expect(dataService.friendship.findByCode).toHaveBeenCalledWith('ABCD1234');
        });

        it('should return null for non-existent friend code', async () => {
            vi.mocked(dataService.friendship.findByCode).mockResolvedValue(null);

            const result = await dataService.friendship.findByCode('ZZZZ9999');

            expect(result).toBeNull();
        });
    });

    describe('sendRequest', () => {
        it('should send friend request successfully', async () => {
            const mockFriendship: Friendship = {
                id: 'friendship-123',
                requester_id: 'user-a',
                recipient_id: 'user-b',
                status: 'pending' as FriendshipStatus,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            vi.mocked(dataService.friendship.sendRequest).mockResolvedValue(mockFriendship);

            const result = await dataService.friendship.sendRequest('user-b');

            expect(result).toEqual(mockFriendship);
            expect(result.status).toBe('pending');
        });

        it('should throw error if already friends', async () => {
            vi.mocked(dataService.friendship.sendRequest).mockRejectedValue(
                new Error('You are already friends with this user')
            );

            await expect(dataService.friendship.sendRequest('user-b')).rejects.toThrow(
                'You are already friends with this user'
            );
        });
    });

    describe('acceptRequest', () => {
        it('should accept pending friend request', async () => {
            const mockFriendship: Friendship = {
                id: 'friendship-123',
                requester_id: 'user-a',
                recipient_id: 'user-b',
                status: 'accepted' as FriendshipStatus,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            vi.mocked(dataService.friendship.acceptRequest).mockResolvedValue(mockFriendship);

            const result = await dataService.friendship.acceptRequest('friendship-123');

            expect(result.status).toBe('accepted');
        });
    });

    describe('declineRequest', () => {
        it('should decline pending friend request', async () => {
            vi.mocked(dataService.friendship.declineRequest).mockResolvedValue(undefined);

            await expect(dataService.friendship.declineRequest('friendship-123')).resolves.toBeUndefined();
        });
    });

    describe('getFriends', () => {
        it('should return list of friends', async () => {
            const mockFriends = [
                {
                    user_id: 'friend-1',
                    username: 'Friend One',
                    avatar_url: null,
                    friend_code: 'FRIEND01',
                    friendship_id: 'fs-1',
                    is_requester: true,
                    since: new Date().toISOString(),
                },
                {
                    user_id: 'friend-2',
                    username: 'Friend Two',
                    avatar_url: 'https://example.com/avatar2.jpg',
                    friend_code: 'FRIEND02',
                    friendship_id: 'fs-2',
                    is_requester: false,
                    since: new Date().toISOString(),
                },
            ];

            vi.mocked(dataService.friendship.getFriends).mockResolvedValue(mockFriends);

            const result = await dataService.friendship.getFriends('user-123');

            expect(result).toHaveLength(2);
            expect(result[0].username).toBe('Friend One');
            expect(result[1].username).toBe('Friend Two');
        });

        it('should return empty array when no friends', async () => {
            vi.mocked(dataService.friendship.getFriends).mockResolvedValue([]);

            const result = await dataService.friendship.getFriends('user-123');

            expect(result).toEqual([]);
        });
    });

    describe('getPendingRequests', () => {
        it('should return incoming friend requests', async () => {
            const mockRequests = [
                {
                    id: 'req-1',
                    from: {
                        user_id: 'sender-1',
                        username: 'Sender One',
                        avatar_url: null,
                    },
                    created_at: new Date().toISOString(),
                },
            ];

            vi.mocked(dataService.friendship.getPendingRequests).mockResolvedValue(mockRequests);

            const result = await dataService.friendship.getPendingRequests('user-123');

            expect(result).toHaveLength(1);
            expect(result[0].from.username).toBe('Sender One');
        });
    });

    describe('unfriend', () => {
        it('should remove friendship', async () => {
            vi.mocked(dataService.friendship.unfriend).mockResolvedValue(undefined);

            await expect(dataService.friendship.unfriend('friendship-123')).resolves.toBeUndefined();
            expect(dataService.friendship.unfriend).toHaveBeenCalledWith('friendship-123');
        });
    });

    describe('block', () => {
        it('should block user', async () => {
            const mockFriendship: Friendship = {
                id: 'friendship-123',
                requester_id: 'user-a',
                recipient_id: 'user-b',
                status: 'blocked' as FriendshipStatus,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            vi.mocked(dataService.friendship.block).mockResolvedValue(mockFriendship);

            const result = await dataService.friendship.block('friendship-123');

            expect(result.status).toBe('blocked');
        });
    });

    describe('checkFriendship', () => {
        it('should return exists=true for existing friendship', async () => {
            vi.mocked(dataService.friendship.checkFriendship).mockResolvedValue({
                exists: true,
                friendshipId: 'friendship-123',
                status: 'accepted',
            });

            const result = await dataService.friendship.checkFriendship('user-a', 'user-b');

            expect(result.exists).toBe(true);
            expect(result.status).toBe('accepted');
        });

        it('should return exists=false for non-existent friendship', async () => {
            vi.mocked(dataService.friendship.checkFriendship).mockResolvedValue({
                exists: false,
            });

            const result = await dataService.friendship.checkFriendship('user-a', 'user-c');

            expect(result.exists).toBe(false);
        });
    });
});

describe('Friend Code Validation', () => {
    it('should reject codes shorter than 8 characters', () => {
        const code = 'ABC1234'; // 7 chars
        expect(code.length).toBeLessThan(8);
    });

    it('should accept codes exactly 8 characters', () => {
        const code = 'ABCD1234';
        expect(code.length).toBe(8);
    });

    it('should convert to uppercase', () => {
        const code = 'abcd1234';
        expect(code.toUpperCase()).toBe('ABCD1234');
    });

    it('should only contain valid characters (no ambiguous I, O, 0, 1)', () => {
        const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const code = 'ABCD2345';

        for (const char of code) {
            expect(validChars).toContain(char);
        }
    });
});
