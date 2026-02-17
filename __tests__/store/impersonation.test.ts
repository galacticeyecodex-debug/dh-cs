/**
 * IMPERSONATION TESTS
 * ----------------------------------------------------------------------------
 * Tests for the GM character impersonation feature that allows the GM to
 * view a player's full character sheet from the GM Screen.
 *
 * FUNCTIONALITY TESTED:
 * - startImpersonation: Saves original character and sets impersonation metadata
 * - stopImpersonation: Restores original character and clears state
 * - Vitals route through gmAdjustVital when impersonating
 * - Non-vital mutations are blocked with toast when impersonating
 * - Impersonation state is null by default (page refresh safety)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================================
// MOCKS
// ============================================================================

vi.mock('@/lib/data-service', () => ({
    dataService: {
        campaign: {
            gmAdjustVital: vi.fn().mockResolvedValue(undefined),
            getActivity: vi.fn().mockResolvedValue([]),
            getActivityCount: vi.fn().mockResolvedValue(0),
            logActivity: vi.fn().mockResolvedValue({}),
        },
        character: {
            update: vi.fn().mockResolvedValue(undefined),
        },
    },
}));

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

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

vi.mock('@/lib/realtime', () => ({
    realtimeManager: {
        setStoreGetter: vi.fn(),
        subscribeToCampaign: vi.fn(),
        unsubscribe: vi.fn(),
    },
}));

// ============================================================================
// IMPORTS
// ============================================================================

import { useCharacterStore } from '@/store/character-store';
import { dataService } from '@/lib/data-service';
import { toast } from 'sonner';
import type { Character } from '@/types/character';
import type { CampaignWithMembers } from '@/types/campaign';

const mockDataService = vi.mocked(dataService);
const mockToast = vi.mocked(toast);

// ============================================================================
// FIXTURES
// ============================================================================

const createMockCharacter = (overrides?: Partial<Character>): Character => ({
    id: 'gm-char-1',
    user_id: 'gm-user-1',
    name: 'GM Character',
    level: 5,
    stats: {
        agility: 2,
        strength: 1,
        finesse: 0,
        instinct: 1,
        presence: 0,
        knowledge: 2,
    },
    vitals: {
        hit_points_max: 12,
        hit_points_current: 12,
        stress_max: 6,
        stress_current: 0,
        armor_score: 3,
        armor_slots: 3,
    },
    damage_thresholds: { minor: 2, major: 5, severe: 8 },
    hope: 3,
    fear: 0,
    evasion: 12,
    proficiency: 2,
    experiences: [],
    modifiers: {},
    gold: { handfuls: 5, bags: 1, chests: 0 },
    character_cards: [],
    character_inventory: [],
    ...overrides,
});

const createPlayerCharacter = (): Character => createMockCharacter({
    id: 'player-char-1',
    user_id: 'player-user-1',
    name: 'Player Character',
    level: 3,
    vitals: {
        hit_points_max: 8,
        hit_points_current: 6,
        stress_max: 6,
        stress_current: 2,
        armor_score: 2,
        armor_slots: 2,
    },
    hope: 4,
});

const createMockCampaign = (): CampaignWithMembers => ({
    id: 'campaign-1',
    name: 'Test Campaign',
    gm_user_id: 'gm-user-1',
    invite_code: 'ABC123',
    fear_current: 3,
    fear_max: 12,
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    members: [{
        id: 'member-1',
        campaign_id: 'campaign-1',
        user_id: 'player-user-1',
        character_id: 'player-char-1',
        role: 'player',
        joined_at: new Date().toISOString(),
        profile: { username: 'TestPlayer' },
    }],
    member_count: 1,
});

// ============================================================================
// TESTS
// ============================================================================

describe('GM Character Impersonation', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        const gmCharacter = createMockCharacter();
        const campaign = createMockCampaign();

        useCharacterStore.setState({
            user: { id: 'gm-user-1', email: 'gm@test.com' },
            character: gmCharacter,
            activeCampaign: campaign,
            impersonation: null,
            partyCharacters: [createPlayerCharacter()],
        });
    });

    describe('startImpersonation', () => {
        it('should save the original character and inject the player character', () => {
            const store = useCharacterStore.getState();
            const playerChar = createPlayerCharacter();

            store.startImpersonation(playerChar, 'TestPlayer');

            const state = useCharacterStore.getState();
            expect(state.impersonation).not.toBeNull();
            expect(state.impersonation!.originalCharacterId).toBe('gm-char-1');
            expect(state.impersonation!.originalCharacterData!.name).toBe('GM Character');
            expect(state.impersonation!.characterId).toBe('player-char-1');
            expect(state.impersonation!.characterName).toBe('Player Character');
            expect(state.impersonation!.playerName).toBe('TestPlayer');
            expect(state.character!.id).toBe('player-char-1');
            expect(state.character!.name).toBe('Player Character');
        });

        it('should not start impersonation without an active campaign', () => {
            useCharacterStore.setState({ activeCampaign: null });

            const store = useCharacterStore.getState();
            const playerChar = createPlayerCharacter();

            store.startImpersonation(playerChar, 'TestPlayer');

            const state = useCharacterStore.getState();
            expect(state.impersonation).toBeNull();
            expect(mockToast.error).toHaveBeenCalledWith('No active campaign');
        });
    });

    describe('stopImpersonation', () => {
        it('should restore the original character and clear impersonation', async () => {
            const store = useCharacterStore.getState();
            const playerChar = createPlayerCharacter();

            store.startImpersonation(playerChar, 'TestPlayer');
            expect(useCharacterStore.getState().character!.id).toBe('player-char-1');

            await useCharacterStore.getState().stopImpersonation();

            const state = useCharacterStore.getState();
            expect(state.impersonation).toBeNull();
            expect(state.character!.id).toBe('gm-char-1');
            expect(state.character!.name).toBe('GM Character');
        });

        it('should be a no-op if not impersonating', async () => {
            const originalChar = useCharacterStore.getState().character;
            await useCharacterStore.getState().stopImpersonation();

            const state = useCharacterStore.getState();
            expect(state.character).toBe(originalChar);
            expect(state.impersonation).toBeNull();
        });
    });

    describe('impersonation state defaults', () => {
        it('should be null on initial state (page refresh safety)', () => {
            const state = useCharacterStore.getState();
            expect(state.impersonation).toBeNull();
        });
    });

    describe('vital mutations while impersonating', () => {
        it('should route updateVitals through gmAdjustVital', async () => {
            const store = useCharacterStore.getState();
            const playerChar = createPlayerCharacter();

            store.startImpersonation(playerChar, 'TestPlayer');

            await useCharacterStore.getState().updateVitals('hit_points_current', 5);

            expect(mockDataService.campaign.gmAdjustVital).toHaveBeenCalledWith(
                'player-char-1', 'hp', 5
            );
            // Local state should be synced
            expect(useCharacterStore.getState().character!.vitals.hit_points_current).toBe(5);
        });

        it('should route updateHope through gmAdjustVital', async () => {
            const store = useCharacterStore.getState();
            const playerChar = createPlayerCharacter();

            store.startImpersonation(playerChar, 'TestPlayer');

            await useCharacterStore.getState().updateHope(2);

            expect(mockDataService.campaign.gmAdjustVital).toHaveBeenCalledWith(
                'player-char-1', 'hope', 2
            );
            expect(useCharacterStore.getState().character!.hope).toBe(2);
        });
    });

    describe('non-vital mutations blocked while impersonating', () => {
        const setupImpersonation = () => {
            const store = useCharacterStore.getState();
            store.startImpersonation(createPlayerCharacter(), 'TestPlayer');
        };

        it('should block updateGold with toast', async () => {
            setupImpersonation();
            await useCharacterStore.getState().updateGold('handfuls', 10);
            expect(mockToast.info).toHaveBeenCalledWith('View-only while impersonating a character');
            expect(mockDataService.character.update).not.toHaveBeenCalled();
        });

        it('should block updateModifiers with toast', async () => {
            setupImpersonation();
            await useCharacterStore.getState().updateModifiers('agility', []);
            expect(mockToast.info).toHaveBeenCalledWith('View-only while impersonating a character');
            expect(mockDataService.character.update).not.toHaveBeenCalled();
        });

        it('should block updateExperiences with toast', async () => {
            setupImpersonation();
            await useCharacterStore.getState().updateExperiences([]);
            expect(mockToast.info).toHaveBeenCalledWith('View-only while impersonating a character');
            expect(mockDataService.character.update).not.toHaveBeenCalled();
        });

        it('should block updateLore with toast', async () => {
            setupImpersonation();
            await useCharacterStore.getState().updateLore({ appearance: 'test' });
            expect(mockToast.info).toHaveBeenCalledWith('View-only while impersonating a character');
            expect(mockDataService.character.update).not.toHaveBeenCalled();
        });

        it('should block updateEvasion with toast', async () => {
            setupImpersonation();
            await useCharacterStore.getState().updateEvasion(15);
            expect(mockToast.info).toHaveBeenCalledWith('View-only while impersonating a character');
            expect(mockDataService.character.update).not.toHaveBeenCalled();
        });
    });
});
