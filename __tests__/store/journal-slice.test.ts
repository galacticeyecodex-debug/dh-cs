/**
 * JOURNAL SLICE TESTS
 * ----------------------------------------------------------------------------
 * This test suite validates the journal-slice.ts store functions that manage
 * NPC relationships and reputation tracking.
 *
 * FUNCTIONALITY TESTED:
 * - fetchRelationships: Loading relationships from database
 * - createRelationship / updateRelationship / deleteRelationship: CRUD operations
 * - updateRelationshipPoints: Modifying relationship points
 * - changeReputation / resetReputation: Reputation management
 * - createNote / updateNote / deleteNote: Journal notes
 * - seedCampaignNPCs / removeCampaignNPCs: Campaign-specific NPC management
 * - resetJournalState: Full state reset
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// ============================================================================
// MOCKS - All vi.mock calls must be at the top, before any variable definitions
// ============================================================================

// Mock Supabase client
const mockSelect = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockUpdate = vi.fn().mockReturnThis();
const mockDelete = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockReturnThis();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  default: () => ({
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
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

// Mock utils
vi.mock('@/lib/utils', () => ({
  getSystemModifiers: vi.fn(() => []),
  calculateBaseEvasion: vi.fn(() => 10),
}));

// Mock data service
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

// Mock campaign NPCs
vi.mock('@/data/campaigns/strixhaven-npcs', () => ({
  getStrixhavenNPCsForSeeding: vi.fn(() => [
    { npc_name: 'Professor Onyx', npc_description: 'Powerful wizard', campaign: 'strixhaven' },
    { npc_name: 'Cadogan', npc_description: 'Student', campaign: 'strixhaven' },
  ]),
}));

// ============================================================================
// IMPORTS - After all mocks are declared
// ============================================================================
import { useCharacterStore } from '@/store/character-store';
import type { Character } from '@/types/character';
import type { Relationship } from '@/types/journal';

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

const createMockRelationship = (overrides?: Partial<Relationship>): Relationship => ({
  id: 'rel-1',
  character_id: 'char-1',
  npc_name: 'Gandalf',
  npc_description: 'A wise wizard',
  points: 0,
  bond_boon: 'Helpful advice',
  bond_bane: 'Cryptic answers',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// ============================================================================
// SETUP AND TEARDOWN
// ============================================================================

describe('Journal Slice', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Reset store to initial state
    useCharacterStore.setState({
      character: null,
      user: { id: 'user-1', email: 'test@test.com' },
      isLoading: false,
      relationships: [],
      relationshipsLoading: false,
      relationshipsError: null,
      reputation: 0,
      reputationHistory: [],
      notes: [],
    });

    // Default successful mock responses
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // RELATIONSHIP FETCH TESTS
  // ==========================================================================

  describe('fetchRelationships', () => {
    it('should set loading state while fetching', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise(resolve => { resolvePromise = resolve; });
      mockOrder.mockReturnValue(delayedPromise);

      const fetchPromise = useCharacterStore.getState().fetchRelationships();

      expect(useCharacterStore.getState().relationshipsLoading).toBe(true);

      resolvePromise!({ data: [], error: null });
      await fetchPromise;

      expect(useCharacterStore.getState().relationshipsLoading).toBe(false);
    });

    it('should store fetched relationships', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      const mockRelationships = [
        createMockRelationship({ id: 'rel-1', npc_name: 'NPC 1' }),
        createMockRelationship({ id: 'rel-2', npc_name: 'NPC 2' }),
      ];

      mockOrder.mockResolvedValue({ data: mockRelationships, error: null });

      await useCharacterStore.getState().fetchRelationships();

      const state = useCharacterStore.getState();
      expect(state.relationships).toHaveLength(2);
      expect(state.relationships[0].npc_name).toBe('NPC 1');
    });

    it('should set error on fetch failure', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      mockOrder.mockResolvedValue({ data: null, error: new Error('Fetch failed') });

      await useCharacterStore.getState().fetchRelationships();

      const state = useCharacterStore.getState();
      expect(state.relationshipsError).toBeDefined();
      expect(state.relationshipsLoading).toBe(false);
    });

    it('should not fetch when no character loaded', async () => {
      useCharacterStore.setState({ character: null });

      await useCharacterStore.getState().fetchRelationships();

      expect(mockSelect).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // RELATIONSHIP CRUD TESTS
  // ==========================================================================

  describe('createRelationship', () => {
    it('should create a new relationship', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      const newRelationship = createMockRelationship({ id: 'new-rel' });
      mockSingle.mockResolvedValue({ data: newRelationship, error: null });
      mockOrder.mockResolvedValue({ data: [newRelationship], error: null });

      const result = await useCharacterStore.getState().createRelationship({
        npc_name: 'New NPC',
        npc_description: 'A new friend',
      });

      expect(result).toBeDefined();
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should return null when no character loaded', async () => {
      useCharacterStore.setState({ character: null });

      const result = await useCharacterStore.getState().createRelationship({
        npc_name: 'New NPC',
      });

      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      mockSingle.mockResolvedValue({ data: null, error: new Error('DB error') });

      const result = await useCharacterStore.getState().createRelationship({
        npc_name: 'New NPC',
      });

      expect(result).toBeNull();
    });
  });

  describe('updateRelationshipPoints', () => {
    it('should update relationship points', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      const relationship = createMockRelationship({ points: 0 });
      useCharacterStore.setState({ relationships: [relationship] });

      mockEq.mockResolvedValue({ error: null });
      mockOrder.mockResolvedValue({
        data: [{ ...relationship, points: 2 }],
        error: null
      });

      await useCharacterStore.getState().updateRelationshipPoints('rel-1', 2);

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle negative point changes', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      const relationship = createMockRelationship({ points: 3 });
      useCharacterStore.setState({ relationships: [relationship] });

      mockEq.mockResolvedValue({ error: null });
      mockOrder.mockResolvedValue({
        data: [{ ...relationship, points: 1 }],
        error: null
      });

      await useCharacterStore.getState().updateRelationshipPoints('rel-1', -2);

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should not crash when relationship not found', async () => {
      useCharacterStore.setState({ relationships: [] });

      await expect(
        useCharacterStore.getState().updateRelationshipPoints('non-existent', 1)
      ).resolves.not.toThrow();
    });
  });

  describe('updateRelationship', () => {
    it('should update relationship fields', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      const relationship = createMockRelationship();
      useCharacterStore.setState({ relationships: [relationship] });

      mockEq.mockResolvedValue({ error: null });
      mockOrder.mockResolvedValue({
        data: [{ ...relationship, npc_description: 'Updated description' }],
        error: null
      });

      await useCharacterStore.getState().updateRelationship('rel-1', {
        npc_description: 'Updated description',
      });

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('deleteRelationship', () => {
    it('should delete relationship from database', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      const relationship = createMockRelationship();
      useCharacterStore.setState({ relationships: [relationship] });

      mockEq.mockResolvedValue({ error: null });
      mockOrder.mockResolvedValue({ data: [], error: null });

      await useCharacterStore.getState().deleteRelationship('rel-1');

      expect(mockDelete).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // REPUTATION TESTS
  // ==========================================================================

  describe('changeReputation', () => {
    it('should increase reputation', () => {
      useCharacterStore.getState().changeReputation(2, 'Helped the mayor');

      const state = useCharacterStore.getState();
      expect(state.reputation).toBe(2);
    });

    it('should decrease reputation', () => {
      useCharacterStore.getState().changeReputation(-3, 'Stole from merchants');

      const state = useCharacterStore.getState();
      expect(state.reputation).toBe(-3);
    });

    it('should accumulate reputation changes', () => {
      useCharacterStore.getState().changeReputation(2, 'Good deed 1');
      useCharacterStore.getState().changeReputation(1, 'Good deed 2');
      useCharacterStore.getState().changeReputation(-1, 'Minor offense');

      const state = useCharacterStore.getState();
      expect(state.reputation).toBe(2);
    });

    it('should add event to history', () => {
      useCharacterStore.getState().changeReputation(2, 'Saved the village');

      const state = useCharacterStore.getState();
      expect(state.reputationHistory).toHaveLength(1);
      expect(state.reputationHistory[0].description).toBe('Saved the village');
      expect(state.reputationHistory[0].change).toBe(2);
      expect(state.reputationHistory[0].id).toBeDefined();
      expect(state.reputationHistory[0].timestamp).toBeDefined();
    });

    it('should add new events at the beginning of history', () => {
      useCharacterStore.getState().changeReputation(1, 'First event');
      useCharacterStore.getState().changeReputation(2, 'Second event');

      const state = useCharacterStore.getState();
      expect(state.reputationHistory[0].description).toBe('Second event');
      expect(state.reputationHistory[1].description).toBe('First event');
    });
  });

  describe('resetReputation', () => {
    it('should reset reputation to 0', () => {
      useCharacterStore.getState().changeReputation(5, 'Built up rep');
      useCharacterStore.getState().resetReputation();

      expect(useCharacterStore.getState().reputation).toBe(0);
    });

    it('should clear reputation history', () => {
      useCharacterStore.getState().changeReputation(1, 'Event 1');
      useCharacterStore.getState().changeReputation(2, 'Event 2');
      useCharacterStore.getState().resetReputation();

      expect(useCharacterStore.getState().reputationHistory).toHaveLength(0);
    });
  });

  // ==========================================================================
  // NOTE TESTS
  // ==========================================================================

  describe('createNote', () => {
    it('should create a new note', () => {
      useCharacterStore.getState().createNote({
        title: 'Quest Log',
        content: 'Find the missing artifact',
      });

      const state = useCharacterStore.getState();
      expect(state.notes).toHaveLength(1);
      expect(state.notes[0].title).toBe('Quest Log');
      expect(state.notes[0].content).toBe('Find the missing artifact');
      expect(state.notes[0].id).toBeDefined();
      expect(state.notes[0].created_at).toBeDefined();
    });

    it('should add new notes at the beginning', () => {
      useCharacterStore.getState().createNote({ title: 'Note 1', content: 'Content 1' });
      useCharacterStore.getState().createNote({ title: 'Note 2', content: 'Content 2' });

      const state = useCharacterStore.getState();
      expect(state.notes[0].title).toBe('Note 2');
      expect(state.notes[1].title).toBe('Note 1');
    });
  });

  describe('updateNote', () => {
    it('should update note content', () => {
      useCharacterStore.getState().createNote({ title: 'Original', content: 'Original content' });
      const noteId = useCharacterStore.getState().notes[0].id;

      useCharacterStore.getState().updateNote(noteId, { content: 'Updated content' });

      const state = useCharacterStore.getState();
      expect(state.notes[0].content).toBe('Updated content');
      expect(state.notes[0].title).toBe('Original'); // Should remain unchanged
    });

    it('should update note title', () => {
      useCharacterStore.getState().createNote({ title: 'Original', content: 'Content' });
      const noteId = useCharacterStore.getState().notes[0].id;

      useCharacterStore.getState().updateNote(noteId, { title: 'New Title' });

      const state = useCharacterStore.getState();
      expect(state.notes[0].title).toBe('New Title');
    });

    it('should update updated_at timestamp', async () => {
      useCharacterStore.getState().createNote({ title: 'Note', content: 'Content' });
      const noteId = useCharacterStore.getState().notes[0].id;
      const originalUpdatedAt = useCharacterStore.getState().notes[0].updated_at;

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      useCharacterStore.getState().updateNote(noteId, { content: 'New content' });

      const state = useCharacterStore.getState();
      expect(state.notes[0].updated_at).not.toBe(originalUpdatedAt);
    });
  });

  describe('deleteNote', () => {
    it('should delete note by id', () => {
      useCharacterStore.getState().createNote({ title: 'Note 1', content: 'Content 1' });
      useCharacterStore.getState().createNote({ title: 'Note 2', content: 'Content 2' });
      const noteToDelete = useCharacterStore.getState().notes[0].id;

      useCharacterStore.getState().deleteNote(noteToDelete);

      const state = useCharacterStore.getState();
      expect(state.notes).toHaveLength(1);
      expect(state.notes[0].title).toBe('Note 1');
    });

    it('should not crash when deleting non-existent note', () => {
      useCharacterStore.getState().createNote({ title: 'Note', content: 'Content' });

      expect(() => {
        useCharacterStore.getState().deleteNote('non-existent');
      }).not.toThrow();

      expect(useCharacterStore.getState().notes).toHaveLength(1);
    });
  });

  // ==========================================================================
  // CAMPAIGN NPC SEEDING TESTS
  // ==========================================================================

  describe('seedCampaignNPCs', () => {
    it('should return failure when no character loaded', async () => {
      useCharacterStore.setState({ character: null });

      const result = await useCharacterStore.getState().seedCampaignNPCs('strixhaven');

      expect(result).toEqual({ success: false, seeded: 0 });
    });

    it('should seed NPCs for known campaign', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      mockInsert.mockReturnThis();
      mockEq.mockResolvedValue({ error: null });
      mockOrder.mockResolvedValue({ data: [], error: null });

      const result = await useCharacterStore.getState().seedCampaignNPCs('strixhaven');

      expect(mockInsert).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.seeded).toBe(2); // From mock
    });

    it('should not duplicate existing NPCs', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      // One NPC already exists
      useCharacterStore.setState({
        relationships: [
          createMockRelationship({ npc_name: 'Professor Onyx', campaign: 'strixhaven' }),
        ],
      });

      mockInsert.mockReturnThis();
      mockEq.mockResolvedValue({ error: null });
      mockOrder.mockResolvedValue({ data: [], error: null });

      const result = await useCharacterStore.getState().seedCampaignNPCs('strixhaven');

      expect(result.success).toBe(true);
      expect(result.seeded).toBe(1); // Only Cadogan, not Professor Onyx
    });

    it('should return 0 seeded for unknown campaign', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      const result = await useCharacterStore.getState().seedCampaignNPCs('unknown_campaign');

      expect(result).toEqual({ success: true, seeded: 0 });
    });
  });

  describe('removeCampaignNPCs', () => {
    it('should return failure when no character loaded', async () => {
      useCharacterStore.setState({ character: null });

      const result = await useCharacterStore.getState().removeCampaignNPCs('strixhaven');

      expect(result).toEqual({ success: false, removed: 0 });
    });

    it('should only remove NPCs with 0 points', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      useCharacterStore.setState({
        relationships: [
          createMockRelationship({ id: '1', npc_name: 'NPC 1', campaign: 'strixhaven', points: 0 }),
          createMockRelationship({ id: '2', npc_name: 'NPC 2', campaign: 'strixhaven', points: 2 }),
        ],
      });

      // Mock delete chain - delete().eq().eq().eq() returns resolved value
      mockDelete.mockReturnThis();
      mockEq.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      });
      mockOrder.mockResolvedValue({ data: [], error: null });

      const result = await useCharacterStore.getState().removeCampaignNPCs('strixhaven');

      expect(result.success).toBe(true);
      expect(result.removed).toBe(1); // Only NPC with 0 points
    });

    it('should return 0 removed when no matching NPCs', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      useCharacterStore.setState({
        relationships: [
          createMockRelationship({ npc_name: 'NPC', campaign: 'other', points: 0 }),
        ],
      });

      const result = await useCharacterStore.getState().removeCampaignNPCs('strixhaven');

      expect(result).toEqual({ success: true, removed: 0 });
    });
  });

  // ==========================================================================
  // RESET STATE TESTS
  // ==========================================================================

  describe('resetJournalState', () => {
    it('should reset all journal state', () => {
      // Set up some state
      useCharacterStore.setState({
        relationships: [createMockRelationship()],
        relationshipsError: 'Some error',
      });
      useCharacterStore.getState().changeReputation(5, 'Test');
      useCharacterStore.getState().createNote({ title: 'Note', content: 'Content' });

      // Reset
      useCharacterStore.getState().resetJournalState();

      const state = useCharacterStore.getState();
      expect(state.relationships).toHaveLength(0);
      expect(state.relationshipsLoading).toBe(false);
      expect(state.relationshipsError).toBeNull();
      expect(state.reputation).toBe(0);
      expect(state.reputationHistory).toHaveLength(0);
      expect(state.notes).toHaveLength(0);
    });
  });
});
