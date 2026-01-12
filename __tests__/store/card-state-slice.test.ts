/**
 * CARD STATE SLICE TESTS
 * ----------------------------------------------------------------------------
 * This test suite validates the card-state-slice.ts store functions that manage
 * domain card runtime state including tokens and frequency tracking.
 *
 * FUNCTIONALITY TESTED:
 * - setCardTokens / spendCardToken / gainCardToken: Token management
 * - markCardUsed / resetCardUsed / resetAllCardsByFrequency: Frequency tracking
 * - toggleCardActive / toggleModifierActive / isModifierActive: Active states
 * - initializeCardState: State initialization
 *
 * ERROR RECOVERY:
 * - All async functions use withOptimisticUpdate for rollback on database errors
 * - Tests verify state is restored when database operations fail
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// ============================================================================
// MOCKS - All vi.mock calls must be at the top, before any variable definitions
// ============================================================================

// Mock the data service
vi.mock('@/lib/data-service', () => ({
  dataService: {
    character: {
      update: vi.fn(),
      get: vi.fn(),
      updateVitals: vi.fn(),
    },
    inventory: {
      equip: vi.fn(),
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
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock utils
vi.mock('@/lib/utils', () => ({
  getSystemModifiers: vi.fn(() => []),
  calculateBaseEvasion: vi.fn(() => 10),
}));

// ============================================================================
// IMPORTS - After all mocks are declared
// ============================================================================
import { useCharacterStore } from '@/store/character-store';
import { dataService } from '@/lib/data-service';
import { toast } from 'sonner';
import type { Character } from '@/types/character';

// Get typed references to mocks
const mockDataService = vi.mocked(dataService);
const mockToast = vi.mocked(toast);

// ============================================================================
// TEST FIXTURES
// ============================================================================

const createMockCharacter = (overrides?: Partial<Character>): Character => ({
  id: 'char-1',
  user_id: 'user-1',
  name: 'Test Character',
  level: 1,
  stats: {
    agility: 0, strength: 0, finesse: 0,
    instinct: 0, presence: 0, knowledge: 0,
  },
  vitals: {
    hit_points_max: 6,
    hit_points_current: 6,
    stress_max: 6,
    stress_current: 0,
    armor_score: 0,
    armor_slots: 0,
  },
  damage_thresholds: { minor: 1, major: 1, severe: 2 },
  hope: 6,
  fear: 0,
  evasion: 10,
  proficiency: 0,
  experiences: [],
  modifiers: {},
  gold: { handfuls: 0, bags: 0, chests: 0 },
  character_cards: [],
  character_inventory: [],
  class_data: { id: 'class1', type: 'class', name: 'Warrior', data: {} },
  ...overrides,
});

// ============================================================================
// SETUP AND TEARDOWN
// ============================================================================

describe('Card State Slice', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Reset store to initial state
    useCharacterStore.setState({
      character: null,
      user: { id: 'user-1', email: 'test@test.com' },
      isLoading: false,
      cardStates: {},
    });

    // Default mock implementations (success cases)
    mockDataService.character.update.mockResolvedValue({ error: null });
    mockDataService.character.updateVitals.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // TOKEN MANAGEMENT TESTS
  // ==========================================================================

  describe('setCardTokens', () => {
    it('should set tokens for a card', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().setCardTokens('Flight', 3);

      const state = useCharacterStore.getState();
      expect(state.cardStates['Flight']?.current_tokens).toBe(3);
    });

    it('should not allow negative tokens', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().setCardTokens('Flight', -5);

      const state = useCharacterStore.getState();
      expect(state.cardStates['Flight']?.current_tokens).toBe(0);
    });

    it('should call dataService.character.update with card_states', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().setCardTokens('Flight', 2);

      expect(mockDataService.character.update).toHaveBeenCalledWith(
        'char-1',
        expect.objectContaining({
          card_states: expect.objectContaining({
            'Flight': expect.objectContaining({ current_tokens: 2 })
          })
        })
      );
    });

    it('should rollback on database error', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);
      useCharacterStore.setState({ cardStates: { 'Flight': { current_tokens: 5, used_this_rest: false, used_this_long_rest: false, used_this_session: false, is_active: false } } });

      mockDataService.character.update.mockResolvedValue({ error: new Error('DB error') });

      await useCharacterStore.getState().setCardTokens('Flight', 2);

      // Should rollback to original state
      const state = useCharacterStore.getState();
      expect(state.cardStates['Flight']?.current_tokens).toBe(5);
    });

    it('should not crash when no character loaded', async () => {
      useCharacterStore.getState().setCharacter(null);

      await expect(
        useCharacterStore.getState().setCardTokens('Flight', 3)
      ).resolves.not.toThrow();
    });
  });

  describe('spendCardToken', () => {
    it('should decrement tokens by 1 by default', () => {
      useCharacterStore.setState({
        cardStates: {
          'Flight': { current_tokens: 3, used_this_rest: false, used_this_long_rest: false, used_this_session: false, is_active: false }
        }
      });

      useCharacterStore.getState().spendCardToken('Flight');

      expect(useCharacterStore.getState().cardStates['Flight']?.current_tokens).toBe(2);
    });

    it('should decrement by specified amount', () => {
      useCharacterStore.setState({
        cardStates: {
          'Flight': { current_tokens: 5, used_this_rest: false, used_this_long_rest: false, used_this_session: false, is_active: false }
        }
      });

      useCharacterStore.getState().spendCardToken('Flight', 2);

      expect(useCharacterStore.getState().cardStates['Flight']?.current_tokens).toBe(3);
    });

    it('should not go below 0 tokens', () => {
      useCharacterStore.setState({
        cardStates: {
          'Flight': { current_tokens: 1, used_this_rest: false, used_this_long_rest: false, used_this_session: false, is_active: false }
        }
      });

      useCharacterStore.getState().spendCardToken('Flight', 5);

      expect(useCharacterStore.getState().cardStates['Flight']?.current_tokens).toBe(0);
    });

    it('should initialize card state if not exists', () => {
      useCharacterStore.setState({ cardStates: {} });

      useCharacterStore.getState().spendCardToken('NewCard');

      expect(useCharacterStore.getState().cardStates['NewCard']).toBeDefined();
      expect(useCharacterStore.getState().cardStates['NewCard']?.current_tokens).toBe(0);
    });
  });

  describe('gainCardToken', () => {
    it('should increment tokens by 1 by default', () => {
      useCharacterStore.setState({
        cardStates: {
          'Flight': { current_tokens: 2, used_this_rest: false, used_this_long_rest: false, used_this_session: false, is_active: false }
        }
      });

      useCharacterStore.getState().gainCardToken('Flight');

      expect(useCharacterStore.getState().cardStates['Flight']?.current_tokens).toBe(3);
    });

    it('should increment by specified amount', () => {
      useCharacterStore.setState({
        cardStates: {
          'Flight': { current_tokens: 1, used_this_rest: false, used_this_long_rest: false, used_this_session: false, is_active: false }
        }
      });

      useCharacterStore.getState().gainCardToken('Flight', 3);

      expect(useCharacterStore.getState().cardStates['Flight']?.current_tokens).toBe(4);
    });

    it('should initialize card state if not exists', () => {
      useCharacterStore.setState({ cardStates: {} });

      useCharacterStore.getState().gainCardToken('NewCard', 2);

      expect(useCharacterStore.getState().cardStates['NewCard']?.current_tokens).toBe(2);
    });
  });

  // ==========================================================================
  // FREQUENCY TRACKING TESTS
  // ==========================================================================

  describe('markCardUsed', () => {
    it('should mark card as used once_per_rest', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().markCardUsed('Deft Maneuvers', 'once_per_rest');

      const state = useCharacterStore.getState();
      expect(state.cardStates['Deft Maneuvers']?.used_this_rest).toBe(true);
    });

    it('should mark card as used once_per_long_rest', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().markCardUsed('Frenzy', 'once_per_long_rest');

      const state = useCharacterStore.getState();
      expect(state.cardStates['Frenzy']?.used_this_long_rest).toBe(true);
    });

    it('should mark card as used once_per_session', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().markCardUsed('Ultimate Power', 'once_per_session');

      const state = useCharacterStore.getState();
      expect(state.cardStates['Ultimate Power']?.used_this_session).toBe(true);
    });

    it('should rollback on database error', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);
      useCharacterStore.setState({
        cardStates: {
          'Deft Maneuvers': { current_tokens: 0, used_this_rest: false, used_this_long_rest: false, used_this_session: false, is_active: false }
        }
      });

      mockDataService.character.update.mockResolvedValue({ error: new Error('DB error') });

      await useCharacterStore.getState().markCardUsed('Deft Maneuvers', 'once_per_rest');

      // Should rollback
      const state = useCharacterStore.getState();
      expect(state.cardStates['Deft Maneuvers']?.used_this_rest).toBe(false);
    });
  });

  describe('resetCardUsed', () => {
    it('should reset once_per_rest flag', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);
      useCharacterStore.setState({
        cardStates: {
          'Deft Maneuvers': { current_tokens: 0, used_this_rest: true, used_this_long_rest: false, used_this_session: false, is_active: false }
        }
      });

      await useCharacterStore.getState().resetCardUsed('Deft Maneuvers', 'once_per_rest');

      const state = useCharacterStore.getState();
      expect(state.cardStates['Deft Maneuvers']?.used_this_rest).toBe(false);
    });

    it('should reset once_per_long_rest flag', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);
      useCharacterStore.setState({
        cardStates: {
          'Frenzy': { current_tokens: 0, used_this_rest: false, used_this_long_rest: true, used_this_session: false, is_active: false }
        }
      });

      await useCharacterStore.getState().resetCardUsed('Frenzy', 'once_per_long_rest');

      const state = useCharacterStore.getState();
      expect(state.cardStates['Frenzy']?.used_this_long_rest).toBe(false);
    });
  });

  describe('resetAllCardsByFrequency', () => {
    it('should reset all cards for once_per_rest', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);
      useCharacterStore.setState({
        cardStates: {
          'Card1': { current_tokens: 0, used_this_rest: true, used_this_long_rest: false, used_this_session: false, is_active: false },
          'Card2': { current_tokens: 0, used_this_rest: true, used_this_long_rest: true, used_this_session: false, is_active: false },
        }
      });

      await useCharacterStore.getState().resetAllCardsByFrequency('once_per_rest');

      const state = useCharacterStore.getState();
      expect(state.cardStates['Card1']?.used_this_rest).toBe(false);
      expect(state.cardStates['Card2']?.used_this_rest).toBe(false);
      // Should not affect other flags
      expect(state.cardStates['Card2']?.used_this_long_rest).toBe(true);
    });

    it('should reset all cards for once_per_session', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);
      useCharacterStore.setState({
        cardStates: {
          'Card1': { current_tokens: 0, used_this_rest: false, used_this_long_rest: false, used_this_session: true, is_active: false },
          'Card2': { current_tokens: 0, used_this_rest: false, used_this_long_rest: false, used_this_session: true, is_active: false },
        }
      });

      await useCharacterStore.getState().resetAllCardsByFrequency('once_per_session');

      const state = useCharacterStore.getState();
      expect(state.cardStates['Card1']?.used_this_session).toBe(false);
      expect(state.cardStates['Card2']?.used_this_session).toBe(false);
    });
  });

  // ==========================================================================
  // ACTIVE STATE TESTS
  // ==========================================================================

  describe('toggleCardActive', () => {
    it('should toggle card active state from false to true', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);
      useCharacterStore.setState({
        cardStates: {
          'PassiveCard': { current_tokens: 0, used_this_rest: false, used_this_long_rest: false, used_this_session: false, is_active: false }
        }
      });

      await useCharacterStore.getState().toggleCardActive('PassiveCard');

      const state = useCharacterStore.getState();
      expect(state.cardStates['PassiveCard']?.is_active).toBe(true);
    });

    it('should toggle card active state from true to false', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);
      useCharacterStore.setState({
        cardStates: {
          'PassiveCard': { current_tokens: 0, used_this_rest: false, used_this_long_rest: false, used_this_session: false, is_active: true }
        }
      });

      await useCharacterStore.getState().toggleCardActive('PassiveCard');

      const state = useCharacterStore.getState();
      expect(state.cardStates['PassiveCard']?.is_active).toBe(false);
    });

    it('should rollback on database error', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);
      useCharacterStore.setState({
        cardStates: {
          'PassiveCard': { current_tokens: 0, used_this_rest: false, used_this_long_rest: false, used_this_session: false, is_active: false }
        }
      });

      mockDataService.character.update.mockResolvedValue({ error: new Error('DB error') });

      await useCharacterStore.getState().toggleCardActive('PassiveCard');

      // Should rollback
      const state = useCharacterStore.getState();
      expect(state.cardStates['PassiveCard']?.is_active).toBe(false);
    });
  });

  describe('toggleModifierActive', () => {
    it('should toggle individual modifier active state', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);
      useCharacterStore.setState({
        cardStates: {
          'Frenzy': {
            current_tokens: 0,
            used_this_rest: false,
            used_this_long_rest: false,
            used_this_session: false,
            is_active: false,
            active_modifiers: {}
          }
        }
      });

      await useCharacterStore.getState().toggleModifierActive('Frenzy', 'damage');

      const state = useCharacterStore.getState();
      expect(state.cardStates['Frenzy']?.active_modifiers?.['damage']).toBe(true);
    });

    it('should toggle modifier from true to false', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);
      useCharacterStore.setState({
        cardStates: {
          'Frenzy': {
            current_tokens: 0,
            used_this_rest: false,
            used_this_long_rest: false,
            used_this_session: false,
            is_active: false,
            active_modifiers: { damage: true }
          }
        }
      });

      await useCharacterStore.getState().toggleModifierActive('Frenzy', 'damage');

      const state = useCharacterStore.getState();
      expect(state.cardStates['Frenzy']?.active_modifiers?.['damage']).toBe(false);
    });

    it('should allow multiple modifiers to be independently active', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);
      useCharacterStore.setState({
        cardStates: {
          'Frenzy': {
            current_tokens: 0,
            used_this_rest: false,
            used_this_long_rest: false,
            used_this_session: false,
            is_active: false,
            active_modifiers: { damage: true }
          }
        }
      });

      await useCharacterStore.getState().toggleModifierActive('Frenzy', 'threshold');

      const state = useCharacterStore.getState();
      expect(state.cardStates['Frenzy']?.active_modifiers?.['damage']).toBe(true);
      expect(state.cardStates['Frenzy']?.active_modifiers?.['threshold']).toBe(true);
    });
  });

  describe('isModifierActive', () => {
    it('should return true for active modifier', () => {
      useCharacterStore.setState({
        cardStates: {
          'Frenzy': {
            current_tokens: 0,
            used_this_rest: false,
            used_this_long_rest: false,
            used_this_session: false,
            is_active: false,
            active_modifiers: { damage: true }
          }
        }
      });

      const result = useCharacterStore.getState().isModifierActive('Frenzy', 'damage');
      expect(result).toBe(true);
    });

    it('should return false for inactive modifier', () => {
      useCharacterStore.setState({
        cardStates: {
          'Frenzy': {
            current_tokens: 0,
            used_this_rest: false,
            used_this_long_rest: false,
            used_this_session: false,
            is_active: false,
            active_modifiers: { damage: false }
          }
        }
      });

      const result = useCharacterStore.getState().isModifierActive('Frenzy', 'damage');
      expect(result).toBe(false);
    });

    it('should return false for non-existent card', () => {
      useCharacterStore.setState({ cardStates: {} });

      const result = useCharacterStore.getState().isModifierActive('NonExistent', 'damage');
      expect(result).toBe(false);
    });

    it('should return false for non-existent modifier', () => {
      useCharacterStore.setState({
        cardStates: {
          'Frenzy': {
            current_tokens: 0,
            used_this_rest: false,
            used_this_long_rest: false,
            used_this_session: false,
            is_active: false,
            active_modifiers: {}
          }
        }
      });

      const result = useCharacterStore.getState().isModifierActive('Frenzy', 'nonexistent');
      expect(result).toBe(false);
    });
  });

  // ==========================================================================
  // INITIALIZATION TESTS
  // ==========================================================================

  describe('initializeCardState', () => {
    it('should create default card state for new card', () => {
      useCharacterStore.setState({ cardStates: {} });

      useCharacterStore.getState().initializeCardState('NewCard');

      const state = useCharacterStore.getState();
      expect(state.cardStates['NewCard']).toBeDefined();
      expect(state.cardStates['NewCard']?.current_tokens).toBe(0);
      expect(state.cardStates['NewCard']?.used_this_rest).toBe(false);
      expect(state.cardStates['NewCard']?.used_this_long_rest).toBe(false);
      expect(state.cardStates['NewCard']?.used_this_session).toBe(false);
      expect(state.cardStates['NewCard']?.is_active).toBe(false);
    });

    it('should not overwrite existing card state', () => {
      useCharacterStore.setState({
        cardStates: {
          'ExistingCard': {
            current_tokens: 5,
            used_this_rest: true,
            used_this_long_rest: false,
            used_this_session: false,
            is_active: true
          }
        }
      });

      useCharacterStore.getState().initializeCardState('ExistingCard');

      const state = useCharacterStore.getState();
      expect(state.cardStates['ExistingCard']?.current_tokens).toBe(5);
      expect(state.cardStates['ExistingCard']?.used_this_rest).toBe(true);
      expect(state.cardStates['ExistingCard']?.is_active).toBe(true);
    });

    it('should not affect other cards when initializing new one', () => {
      useCharacterStore.setState({
        cardStates: {
          'Card1': { current_tokens: 3, used_this_rest: true, used_this_long_rest: false, used_this_session: false, is_active: false }
        }
      });

      useCharacterStore.getState().initializeCardState('Card2');

      const state = useCharacterStore.getState();
      expect(state.cardStates['Card1']?.current_tokens).toBe(3);
      expect(state.cardStates['Card2']?.current_tokens).toBe(0);
    });
  });
});
