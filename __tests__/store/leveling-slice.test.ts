/**
 * LEVELING SLICE TESTS
 * ----------------------------------------------------------------------------
 * This test suite validates the leveling-slice.ts store functions that manage
 * character progression and leveling.
 *
 * FUNCTIONALITY TESTED:
 * - levelUpCharacter: Core leveling with advancements, domain cards, traits
 * - updateCharacterDetails: Basic character updates and de-leveling
 * - updateMarkedTraits: Trait marking for advancement selection
 *
 * ERROR RECOVERY:
 * - All functions use withOptimisticUpdate for rollback on database errors
 * - Tests verify state is restored when database operations fail
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// ============================================================================
// MOCKS - All vi.mock calls must be at the top, before any variable definitions
// vi.mock is hoisted, so factories cannot reference external variables
// ============================================================================

// Mock the data service
vi.mock('@/lib/data-service', () => ({
  dataService: {
    character: {
      update: vi.fn(),
      get: vi.fn(),
      updateVitals: vi.fn(),
    },
    card: {
      add: vi.fn(),
      remove: vi.fn(),
      update: vi.fn(),
    },
    library: {
      get: vi.fn(),
    },
    inventory: {
      update: vi.fn(),
    },
  },
}));

// Mock Supabase client (needed for other store functions)
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
  experiences: [
    { name: 'Athletic', value: 2 },
  ],
  modifiers: {},
  gold: { handfuls: 0, bags: 0, chests: 0 },
  character_cards: [],
  character_inventory: [],
  class_data: { id: 'class1', type: 'class', name: 'Warrior', data: {} },
  advancement_history_jsonb: {},
  marked_traits_jsonb: {},
  subclass_progression: {
    foundation_obtained: true,
    specialization_obtained: false,
    mastery_obtained: false,
  },
  ...overrides,
});

// ============================================================================
// SETUP AND TEARDOWN
// ============================================================================

describe('Leveling Slice', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Reset store to initial state
    useCharacterStore.setState({
      character: null,
      user: { id: 'user-1', email: 'test@test.com' },
      isLoading: false,
      activeTab: 'character',
      isDiceOverlayOpen: false,
      activeRoll: null,
      lastRollResult: null,
      homebrewItems: [],
    });

    // Default mock implementations (success cases)
    mockDataService.character.update.mockResolvedValue({ error: null });
    mockDataService.character.updateVitals.mockResolvedValue({ error: null });
    mockDataService.card.add.mockResolvedValue({
      id: 'new-card-1',
      character_id: 'char-1',
      item_id: 'lib-card-1',
      location: 'vault',
      state: {},
    });
    mockDataService.card.remove.mockResolvedValue({ error: null });
    mockDataService.library.get.mockResolvedValue({
      id: 'lib-card-1',
      type: 'ability',
      name: 'Test Ability',
      data: { domain: 'Blade', tier: 2 },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // levelUpCharacter TESTS
  // ==========================================================================

  describe('levelUpCharacter', () => {
    it('should increase character level', async () => {
      const character = createMockCharacter({ level: 1 });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 2,
        selectedAdvancements: ['increase_traits', 'add_hp'],
        selectedDomainCardIds: [],
        traitIncrements: [{ trait: 'agility', amount: 1 }],
        hpSlotsAdded: 1,
      });

      const state = useCharacterStore.getState();
      expect(state.character?.level).toBe(2);
    });

    it('should increase proficiency at tier threshold (level 2)', async () => {
      const character = createMockCharacter({ level: 1, proficiency: 0 });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 2,
        selectedAdvancements: ['increase_traits', 'add_hp'],
        selectedDomainCardIds: [],
        traitIncrements: [{ trait: 'agility', amount: 1 }],
        hpSlotsAdded: 1,
      });

      const state = useCharacterStore.getState();
      // Tier 2 gives +1 proficiency automatically
      expect(state.character?.proficiency).toBe(1);
    });

    it('should add experience at tier threshold (level 2)', async () => {
      const character = createMockCharacter({
        level: 1,
        experiences: [{ name: 'Athletic', value: 2 }]
      });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 2,
        selectedAdvancements: ['increase_traits', 'add_hp'],
        selectedDomainCardIds: [],
        traitIncrements: [{ trait: 'agility', amount: 1 }],
        hpSlotsAdded: 1,
      });

      const state = useCharacterStore.getState();
      // Should have original + new experience at +2
      expect(state.character?.experiences.length).toBe(2);
      expect(state.character?.experiences[1].value).toBe(2);
    });

    it('should apply trait increments as system modifiers', async () => {
      const character = createMockCharacter({ level: 1, modifiers: {} });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 2,
        selectedAdvancements: ['increase_traits', 'add_hp'],
        selectedDomainCardIds: [],
        traitIncrements: [
          { trait: 'agility', amount: 1 },
          { trait: 'strength', amount: 1 },
        ],
        hpSlotsAdded: 1,
      });

      const state = useCharacterStore.getState();
      expect(state.character?.modifiers?.agility).toBeDefined();
      expect(state.character?.modifiers?.agility?.[0].value).toBe(1);
      expect(state.character?.modifiers?.agility?.[0].source).toBe('system');
      expect(state.character?.modifiers?.strength?.[0].value).toBe(1);
    });

    it('should add HP slots as system modifier', async () => {
      const character = createMockCharacter({ level: 1, modifiers: {} });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 2,
        selectedAdvancements: ['add_hp', 'increase_traits'],
        selectedDomainCardIds: [],
        traitIncrements: [{ trait: 'agility', amount: 1 }],
        hpSlotsAdded: 2,
      });

      const state = useCharacterStore.getState();
      expect(state.character?.modifiers?.hit_points?.[0].value).toBe(2);
      expect(state.character?.modifiers?.hit_points?.[0].name).toBe('Level 2 Advancement');
    });

    it('should add stress slots as system modifier', async () => {
      const character = createMockCharacter({ level: 1, modifiers: {} });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 2,
        selectedAdvancements: ['add_stress', 'increase_traits'],
        selectedDomainCardIds: [],
        traitIncrements: [{ trait: 'agility', amount: 1 }],
        stressSlotsAdded: 1,
      });

      const state = useCharacterStore.getState();
      expect(state.character?.modifiers?.stress?.[0].value).toBe(1);
    });

    it('should increase evasion when advancement selected', async () => {
      const character = createMockCharacter({ level: 1, modifiers: {} });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 2,
        selectedAdvancements: ['increase_evasion', 'increase_traits'],
        selectedDomainCardIds: [],
        traitIncrements: [{ trait: 'agility', amount: 1 }],
      });

      const state = useCharacterStore.getState();
      expect(state.character?.modifiers?.evasion?.[0].value).toBe(1);
      expect(state.character?.modifiers?.evasion?.[0].name).toBe('Level 2 Advancement');
    });

    it('should increase proficiency when advancement selected at valid level', async () => {
      const character = createMockCharacter({ level: 4, proficiency: 1 });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 5,
        selectedAdvancements: ['increase_proficiency'],
        selectedDomainCardIds: [],
      });

      const state = useCharacterStore.getState();
      // Tier 3 auto +1, plus advancement +1 = 3 total (1 base + 2)
      expect(state.character?.proficiency).toBe(3);
    });

    it('should increase damage thresholds on level up', async () => {
      const character = createMockCharacter({
        level: 1,
        damage_thresholds: { minor: 1, major: 1, severe: 2 }
      });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 2,
        selectedAdvancements: ['increase_traits', 'add_hp'],
        selectedDomainCardIds: [],
        traitIncrements: [{ trait: 'agility', amount: 1 }],
        hpSlotsAdded: 1,
      });

      const state = useCharacterStore.getState();
      // Unarmored character at level 2: minor=1, major=level(2), severe=level*2(4)
      // recalculateDerivedStats recalculates from scratch based on level
      expect(state.character?.damage_thresholds).toEqual({
        minor: 1,
        major: 2,
        severe: 4,
      });
    });

    it('should update marked traits based on trait increments', async () => {
      const character = createMockCharacter({ level: 1, marked_traits_jsonb: {} });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 2,
        selectedAdvancements: ['increase_traits', 'add_hp'],
        selectedDomainCardIds: [],
        traitIncrements: [{ trait: 'agility', amount: 1 }],
        hpSlotsAdded: 1,
      });

      const state = useCharacterStore.getState();
      expect(state.character?.marked_traits_jsonb?.agility).toBe(true);
    });

    it('should clear marked traits at tier 3 (level 5)', async () => {
      const character = createMockCharacter({
        level: 4,
        marked_traits_jsonb: { agility: true, strength: true }
      });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 5,
        selectedAdvancements: ['increase_traits', 'add_hp'],
        selectedDomainCardIds: [],
        traitIncrements: [{ trait: 'finesse', amount: 1 }],
        hpSlotsAdded: 1,
      });

      const state = useCharacterStore.getState();
      // Should clear old marked traits and only have finesse
      expect(state.character?.marked_traits_jsonb).toEqual({ finesse: true });
    });

    it('should save advancement history', async () => {
      const character = createMockCharacter({ level: 1, advancement_history_jsonb: {} });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 2,
        selectedAdvancements: ['increase_traits', 'add_hp'],
        selectedDomainCardIds: ['card-1'],
        traitIncrements: [{ trait: 'agility', amount: 1 }],
        hpSlotsAdded: 1,
      });

      const state = useCharacterStore.getState();
      const history = state.character?.advancement_history_jsonb;
      expect(history?.[2]).toBeDefined();
      expect(history?.[2].advancements).toEqual(['increase_traits', 'add_hp']);
      expect(history?.[2].domainCardsSelected).toEqual(['card-1']);
    });

    it('should add domain cards to vault after level up', async () => {
      const character = createMockCharacter({ level: 1, character_cards: [] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 2,
        selectedAdvancements: ['additional_domain_card', 'increase_traits'],
        selectedDomainCardIds: ['lib-card-1'],
        traitIncrements: [{ trait: 'agility', amount: 1 }],
      });

      expect(mockDataService.card.add).toHaveBeenCalledWith('char-1', 'lib-card-1', 'vault');
    });

    it('should update subclass progression when subclass_card selected', async () => {
      const character = createMockCharacter({
        level: 1,
        subclass_progression: {
          foundation_obtained: true,
          specialization_obtained: false,
          mastery_obtained: false,
        }
      });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 2,
        selectedAdvancements: ['subclass_card', 'increase_traits'],
        selectedDomainCardIds: [],
        traitIncrements: [{ trait: 'agility', amount: 1 }],
      });

      const state = useCharacterStore.getState();
      expect(state.character?.subclass_progression?.specialization_obtained).toBe(true);
    });

    it('should apply experience increments', async () => {
      const character = createMockCharacter({
        level: 1,
        experiences: [{ name: 'Athletic', value: 2 }]
      });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 2,
        selectedAdvancements: ['increase_experience', 'add_hp'],
        selectedDomainCardIds: [],
        experienceIncrements: [{ experienceId: '0', amount: 1 }],
        hpSlotsAdded: 1,
      });

      const state = useCharacterStore.getState();
      // Original experience should be incremented
      expect(state.character?.experiences[0].value).toBe(3);
    });

    it('should call dataService.character.update with correct payload', async () => {
      const character = createMockCharacter({ level: 1 });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 2,
        selectedAdvancements: ['increase_traits', 'add_hp'],
        selectedDomainCardIds: [],
        traitIncrements: [{ trait: 'agility', amount: 1 }],
        hpSlotsAdded: 1,
      });

      expect(mockDataService.character.update).toHaveBeenCalledWith(
        'char-1',
        expect.objectContaining({
          level: 2,
          proficiency: expect.any(Number),
          damage_thresholds: expect.any(Object),
          modifiers: expect.any(Object),
          advancement_history_jsonb: expect.any(Object),
        })
      );
    });

    it('should rollback on database error', async () => {
      const character = createMockCharacter({ level: 1, proficiency: 0 });
      useCharacterStore.getState().setCharacter(character);

      mockDataService.character.update.mockResolvedValue({ error: new Error('DB error') });

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 2,
        selectedAdvancements: ['increase_traits', 'add_hp'],
        selectedDomainCardIds: [],
        traitIncrements: [{ trait: 'agility', amount: 1 }],
        hpSlotsAdded: 1,
      });

      // Should rollback to original state
      const state = useCharacterStore.getState();
      expect(state.character?.level).toBe(1);
      expect(state.character?.proficiency).toBe(0);
    });

    it('should not crash when no character loaded', async () => {
      useCharacterStore.getState().setCharacter(null);

      await expect(
        useCharacterStore.getState().levelUpCharacter({
          newLevel: 2,
          selectedAdvancements: [],
          selectedDomainCardIds: [],
        })
      ).resolves.not.toThrow();
    });

    it('should exchange domain card when exchangeExistingCardId provided', async () => {
      const existingCard = {
        id: 'existing-card-1',
        character_id: 'char-1',
        item_id: 'old-lib-card',
        location: 'loadout' as const,
        state: {},
        library_item: {
          id: 'old-lib-card',
          type: 'ability' as const,
          name: 'Old Ability',
          data: {},
        },
      };
      const character = createMockCharacter({
        level: 1,
        character_cards: [existingCard]
      });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 2,
        selectedAdvancements: ['additional_domain_card', 'increase_traits'],
        selectedDomainCardIds: ['new-lib-card'],
        traitIncrements: [{ trait: 'agility', amount: 1 }],
        exchangeExistingCardId: 'existing-card-1',
      });

      expect(mockDataService.card.remove).toHaveBeenCalledWith('existing-card-1');
    });
  });

  // ==========================================================================
  // updateCharacterDetails TESTS
  // ==========================================================================

  describe('updateCharacterDetails', () => {
    it('should update character name', async () => {
      const character = createMockCharacter({ name: 'Old Name' });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().updateCharacterDetails({ name: 'New Name' });

      expect(mockDataService.character.update).toHaveBeenCalledWith(
        'char-1',
        expect.objectContaining({ name: 'New Name' })
      );
    });

    it('should update spellcast trait', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().updateCharacterDetails({ spellcast_trait: 'presence' });

      expect(mockDataService.character.update).toHaveBeenCalledWith(
        'char-1',
        expect.objectContaining({ spellcast_trait: 'presence' })
      );
    });

    it('should handle de-leveling by reversing advancement history', async () => {
      const character = createMockCharacter({
        level: 3,
        proficiency: 1,
        experiences: [
          { name: 'Athletic', value: 2 },
          { name: 'Experience (Level 2)', value: 2 },
        ],
        advancement_history_jsonb: {
          2: {
            advancements: ['increase_traits', 'add_hp'],
            traitIncrements: [{ trait: 'agility', amount: 1 }],
            hpAdded: 1,
          },
          3: {
            advancements: ['add_stress', 'increase_experience'],
            stressAdded: 1,
            experienceIncrements: [{ experienceId: '0', amount: 1 }],
          },
        },
        modifiers: {
          agility: [{ id: 'mod-1', name: 'Level 2 Advancement', value: 1, source: 'system' }],
          hit_points: [{ id: 'mod-2', name: 'Level 2 Advancement', value: 1, source: 'system' }],
          stress: [{ id: 'mod-3', name: 'Level 3 Advancement', value: 1, source: 'system' }],
        },
      });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().updateCharacterDetails({ level: 1 });

      expect(mockDataService.character.update).toHaveBeenCalledWith(
        'char-1',
        expect.objectContaining({
          level: 1,
          proficiency: 0, // Tier 2 proficiency removed
        })
      );
    });

    it('should remove domain cards gained during de-leveled levels', async () => {
      const domainCard = {
        id: 'card-1',
        character_id: 'char-1',
        item_id: 'lib-card-1',
        card_id: 'lib-card-1', // Matches the domainCardsSelected
        location: 'vault' as const,
        state: {},
        library_item: {
          id: 'lib-card-1',
          type: 'ability' as const,
          name: 'Test Ability',
          data: {},
        },
      };
      const character = createMockCharacter({
        level: 3,
        character_cards: [domainCard],
        advancement_history_jsonb: {
          2: {
            advancements: ['additional_domain_card', 'increase_traits'],
            traitIncrements: [{ trait: 'agility', amount: 1 }],
            domainCardsSelected: ['lib-card-1'],
          },
        },
      });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().updateCharacterDetails({ level: 1 });

      expect(mockDataService.card.remove).toHaveBeenCalledWith('card-1');
    });

    it('should clear marked traits when de-leveling past tier 3', async () => {
      const character = createMockCharacter({
        level: 5,
        marked_traits_jsonb: { agility: true, finesse: true },
        advancement_history_jsonb: {},
      });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().updateCharacterDetails({ level: 4 });

      expect(mockDataService.character.update).toHaveBeenCalledWith(
        'char-1',
        expect.objectContaining({
          marked_traits_jsonb: {},
        })
      );
    });

    it('should rollback on database error', async () => {
      const character = createMockCharacter({ name: 'Original Name' });
      useCharacterStore.getState().setCharacter(character);

      mockDataService.character.update.mockResolvedValue({ error: new Error('DB error') });

      await useCharacterStore.getState().updateCharacterDetails({ name: 'New Name' });

      // Should rollback
      const state = useCharacterStore.getState();
      expect(state.character?.name).toBe('Original Name');
    });

    it('should not crash when no character loaded', async () => {
      useCharacterStore.getState().setCharacter(null);

      await expect(
        useCharacterStore.getState().updateCharacterDetails({ name: 'Test' })
      ).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // updateMarkedTraits TESTS
  // ==========================================================================

  describe('updateMarkedTraits', () => {
    it('should update marked traits', async () => {
      const character = createMockCharacter({ marked_traits_jsonb: {} });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().updateMarkedTraits({ agility: true, strength: true });

      const state = useCharacterStore.getState();
      expect(state.character?.marked_traits_jsonb).toEqual({ agility: true, strength: true });
    });

    it('should call dataService with correct payload', async () => {
      const character = createMockCharacter({ marked_traits_jsonb: {} });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().updateMarkedTraits({ finesse: true });

      expect(mockDataService.character.update).toHaveBeenCalledWith(
        'char-1',
        { marked_traits_jsonb: { finesse: true } }
      );
    });

    it('should rollback on database error', async () => {
      const character = createMockCharacter({ marked_traits_jsonb: { agility: true } });
      useCharacterStore.getState().setCharacter(character);

      mockDataService.character.update.mockResolvedValue({ error: new Error('DB error') });

      await useCharacterStore.getState().updateMarkedTraits({ finesse: true });

      // Should rollback
      const state = useCharacterStore.getState();
      expect(state.character?.marked_traits_jsonb).toEqual({ agility: true });
    });

    it('should clear all marked traits when passed empty object', async () => {
      const character = createMockCharacter({
        marked_traits_jsonb: { agility: true, strength: true }
      });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().updateMarkedTraits({});

      const state = useCharacterStore.getState();
      expect(state.character?.marked_traits_jsonb).toEqual({});
    });

    it('should not crash when no character loaded', async () => {
      useCharacterStore.getState().setCharacter(null);

      await expect(
        useCharacterStore.getState().updateMarkedTraits({ agility: true })
      ).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // MULTICLASS TESTS
  // ==========================================================================

  describe('multiclass leveling', () => {
    it('should set multiclass data when multiclass advancement selected', async () => {
      const character = createMockCharacter({
        level: 4,
        domains: ['Blade', 'Bone'],
        multiclass_id: undefined,
      });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 5,
        selectedAdvancements: ['multiclass'],
        selectedDomainCardIds: [],
        multiclassId: 'bard',
        multiclassDomain: 'Codex',
        multiclassSubclassId: 'lorekeeper',
      });

      const state = useCharacterStore.getState();
      expect(state.character?.multiclass_id).toBe('bard');
      expect(state.character?.multiclass_subclass_id).toBe('lorekeeper');
      expect(state.character?.domains).toContain('Codex');
    });

    it('should add multiclass foundation card when provided', async () => {
      const character = createMockCharacter({
        level: 4,
        domains: ['Blade', 'Bone'],
        character_cards: [],
      });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 5,
        selectedAdvancements: ['multiclass'],
        selectedDomainCardIds: [],
        multiclassId: 'bard',
        multiclassDomain: 'Codex',
        multiclassSubclassId: 'lorekeeper',
        multiclassFoundationCardId: 'lorekeeper-foundation',
      });

      expect(mockDataService.card.add).toHaveBeenCalledWith(
        'char-1',
        'lorekeeper-foundation',
        'feature'
      );
    });

    it('should set multiclass progression to foundation obtained', async () => {
      const character = createMockCharacter({ level: 4 });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 5,
        selectedAdvancements: ['multiclass'],
        selectedDomainCardIds: [],
        multiclassId: 'bard',
        multiclassDomain: 'Codex',
      });

      const state = useCharacterStore.getState();
      expect(state.character?.multiclass_progression).toEqual({
        foundation_obtained: true,
        specialization_obtained: false,
        mastery_obtained: false,
      });
    });
  });

  // ==========================================================================
  // COMPANION TESTS (Ranger Beastbound)
  // ==========================================================================

  describe('companion training during level up', () => {
    it('should apply resilient training to companion', async () => {
      const character = createMockCharacter({
        level: 1,
        ranger_companion: {
          name: 'Shadow',
          type: 'wolf',
          stress_current: 0,
          stress_max: 3,
          evasion: 9,
          experiences: [],
          level_up_options: {
            intelligent: 0,
            resilient: 0,
            vicious: 0,
            light_in_the_dark: false,
            armored: false,
            aware: false,
          },
        },
      });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 2,
        selectedAdvancements: ['increase_traits', 'add_hp'],
        selectedDomainCardIds: [],
        traitIncrements: [{ trait: 'agility', amount: 1 }],
        hpSlotsAdded: 1,
        companionTraining: 'resilient',
      });

      expect(mockDataService.character.update).toHaveBeenCalledWith(
        'char-1',
        expect.objectContaining({
          ranger_companion: expect.objectContaining({
            stress_max: 4, // +1 from resilient
            level_up_options: expect.objectContaining({
              resilient: 1,
            }),
          }),
        })
      );
    });

    it('should give companion an experience when player gains one at tier threshold', async () => {
      const character = createMockCharacter({
        level: 1,
        experiences: [{ name: 'Athletic', value: 2 }],
        ranger_companion: {
          name: 'Shadow',
          type: 'wolf',
          stress_current: 0,
          stress_max: 3,
          evasion: 9,
          experiences: [],
          level_up_options: {
            intelligent: 0,
            resilient: 0,
            vicious: 0,
            light_in_the_dark: false,
            armored: false,
            aware: false,
          },
        },
      });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().levelUpCharacter({
        newLevel: 2,
        selectedAdvancements: ['increase_traits', 'add_hp'],
        selectedDomainCardIds: [],
        traitIncrements: [{ trait: 'agility', amount: 1 }],
        hpSlotsAdded: 1,
      });

      const state = useCharacterStore.getState();
      // Companion should have gained an experience at +2
      expect(state.character?.ranger_companion?.experiences.length).toBe(1);
      expect(state.character?.ranger_companion?.experiences[0].value).toBe(2);
    });
  });
});
