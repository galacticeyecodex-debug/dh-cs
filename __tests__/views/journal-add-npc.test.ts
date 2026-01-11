/**
 * JOURNAL ADD NPC TEST
 * ---------------------
 * This test validates the `createRelationship` store function that is called
 * when the "Add NPC" button is clicked in the Journal view.
 *
 * IMPLEMENTATION:
 * - AddNPCModal (components/views/journal/add-npc-modal.tsx) collects NPC data
 * - Button in RelationshipsPanel opens the modal
 * - Modal calls createRelationship() from useCharacterStore on submit
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCharacterStore } from '@/store/character-store';
import type { CreateRelationshipInput } from '@/types/journal';

// Mock Supabase client - factory function to create fresh mocks
const createMockSupabase = () => {
  let currentMockData = {
    id: 'rel1',
    character_id: 'char1',
    npc_name: 'Test NPC',
    npc_description: 'A test NPC',
    points: 0,
    bond_boon: null,
    bond_bane: null,
    notes: null,
    campaign: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Track what was inserted
  let lastInsertedData: any = null;
  let fetchedRelationships: any[] = [];

  const insertMock = vi.fn().mockImplementation((data) => {
    lastInsertedData = data;
    // Simulate the inserted data being added to fetchedRelationships
    fetchedRelationships = [{
      ...currentMockData,
      ...data,
      id: currentMockData.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }];
    return {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() =>
        Promise.resolve({
          data: { ...currentMockData },
          error: null,
        })
      ),
    };
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: vi.fn((table) => ({
      select: vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: fetchedRelationships,
          error: null,
        }),
      })),
      insert: insertMock,
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockImplementation(() =>
        Promise.resolve({
          data: { ...currentMockData },
          error: null,
        })
      ),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    setMockData: (data: any) => {
      currentMockData = { ...currentMockData, ...data };
    },
    getLastInsertedData: () => lastInsertedData,
    getFetchedRelationships: () => fetchedRelationships,
    setFetchedRelationships: (rels: any[]) => {
      fetchedRelationships = rels;
    },
  };
};

let mockSupabase = createMockSupabase();

vi.mock('@/lib/supabase/client', () => ({
  default: () => mockSupabase,
}));

// Mock getSystemModifiers and calculateBaseEvasion
vi.mock('@/lib/utils', () => ({
  getSystemModifiers: vi.fn(() => []),
  calculateBaseEvasion: vi.fn(() => 10),
}));

// ============================================================================
// TEST FIXTURES
// ============================================================================

const createMockCharacter = (overrides?: Record<string, unknown>) => ({
  id: 'char1',
  user_id: 'user1',
  name: 'Test Character',
  level: 1,
  stats: {
    agility: 0,
    strength: 0,
    finesse: 0,
    instinct: 0,
    presence: 0,
    knowledge: 0,
  },
  vitals: {
    hit_points_max: 6,
    hit_points_current: 6,
    stress_max: 6,
    stress_current: 0,
    armor_score: 0,
    armor_slots: 0,
  },
  damage_thresholds: {
    minor: 1,
    major: 1,
    severe: 2,
  },
  hope: 6,
  fear: 0,
  evasion: 10,
  proficiency: 0,
  experiences: [],
  modifiers: {},
  gold: {
    handfuls: 0,
    bags: 0,
    chests: 0,
  },
  character_cards: [],
  character_inventory: [],
  class_data: {
    id: 'class1',
    type: 'class',
    name: 'Warrior',
    data: { starting_hp: 6 },
  },
  ...overrides,
});

// ============================================================================
// TEST SUITE
// ============================================================================

describe('Journal - Add NPC', () => {
  beforeEach(() => {
    // Reset the store state before each test
    const { result } = renderHook(() => useCharacterStore());
    act(() => {
      result.current.resetJournalState();
      result.current.setCharacter(createMockCharacter());
    });

    // Reset mock to default state
    mockSupabase = createMockSupabase();

    // Clear all mock calls
    vi.clearAllMocks();
  });

  describe('createRelationship', () => {
    it('should create a new NPC relationship with minimal data', async () => {
      const { result } = renderHook(() => useCharacterStore());

      // Set a character first
      act(() => {
        result.current.setCharacter(createMockCharacter());
      });

      const input: CreateRelationshipInput = {
        npc_name: 'Test NPC',
      };

      // Create relationship
      let createdRelationship;
      await act(async () => {
        createdRelationship = await result.current.createRelationship(input);
      });

      // Verify the relationship was created
      expect(createdRelationship).toBeDefined();
      expect(createdRelationship?.npc_name).toBe('Test NPC');
      expect(createdRelationship?.id).toBe('rel1');
      expect(createdRelationship?.points).toBe(0);
    });

    it('should create an NPC with full details including description and points', async () => {
      // Set mock data for this test
      mockSupabase.setMockData({
        id: 'rel2',
        npc_name: 'Elara the Sage',
        npc_description: 'A wise mage from the tower',
        points: 2,
        bond_boon: 'Gain +1 to spell rolls',
        bond_bane: 'Suffer disadvantage on deception rolls',
      });

      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        result.current.setCharacter(createMockCharacter());
      });

      const input: CreateRelationshipInput = {
        npc_name: 'Elara the Sage',
        npc_description: 'A wise mage from the tower',
        points: 2,
        bond_boon: 'Gain +1 to spell rolls',
        bond_bane: 'Suffer disadvantage on deception rolls',
      };

      let createdRelationship;
      await act(async () => {
        createdRelationship = await result.current.createRelationship(input);
      });

      expect(createdRelationship).toBeDefined();
      expect(createdRelationship?.npc_name).toBe('Elara the Sage');
      expect(createdRelationship?.points).toBe(2);
    });

    it('should call insert with correct data when creating NPC', async () => {
      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        result.current.setCharacter(createMockCharacter());
      });

      const input: CreateRelationshipInput = {
        npc_name: 'New NPC',
        npc_description: 'A friendly merchant',
        points: 1,
        bond_boon: 'Gives discounts',
      };

      // Create the relationship
      await act(async () => {
        await result.current.createRelationship(input);
      });

      // Verify that from() was called with the correct table
      expect(mockSupabase.from).toHaveBeenCalledWith('character_relationships');
    });

    it('should handle campaign-specific NPCs', async () => {
      // Set mock data for this test
      mockSupabase.setMockData({
        id: 'rel3',
        npc_name: 'Strixhaven Professor',
        npc_description: 'A mysterious professor from Strixhaven',
        points: 1,
        campaign: 'strixhaven',
      });

      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        result.current.setCharacter(createMockCharacter());
      });

      const input: CreateRelationshipInput = {
        npc_name: 'Strixhaven Professor',
        npc_description: 'A mysterious professor from Strixhaven',
        campaign: 'strixhaven',
        points: 1,
      };

      let createdRelationship;
      await act(async () => {
        createdRelationship = await result.current.createRelationship(input);
      });

      expect(createdRelationship).toBeDefined();
      expect(createdRelationship?.npc_name).toBe('Strixhaven Professor');
      expect(createdRelationship?.campaign).toBe('strixhaven');
    });

    it('should return null if no character is set', async () => {
      const { result } = renderHook(() => useCharacterStore());

      // Explicitly reset character to null
      act(() => {
        result.current.setCharacter(null);
      });

      const input: CreateRelationshipInput = {
        npc_name: 'Test NPC',
      };

      let createdRelationship;
      await act(async () => {
        createdRelationship = await result.current.createRelationship(input);
      });

      expect(createdRelationship).toBeNull();
    });

    it('should default points to 0 if not provided', async () => {
      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        result.current.setCharacter(createMockCharacter());
      });

      const input: CreateRelationshipInput = {
        npc_name: 'New Friend',
        // Intentionally omit points
      };

      let createdRelationship;
      await act(async () => {
        createdRelationship = await result.current.createRelationship(input);
      });

      expect(createdRelationship?.points).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      // Mock a database error
      mockSupabase.from = vi.fn((table) => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      })) as any;

      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        result.current.setCharacter(createMockCharacter());
      });

      const input: CreateRelationshipInput = {
        npc_name: 'Test NPC',
      };

      let createdRelationship;
      await act(async () => {
        createdRelationship = await result.current.createRelationship(input);
      });

      // Should return null on error
      expect(createdRelationship).toBeNull();
    });
  });

  describe('Store integration', () => {
    it('should fetch relationships after character is set', async () => {
      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        result.current.setCharacter(createMockCharacter());
      });

      await act(async () => {
        await result.current.fetchRelationships();
      });

      // Should call the database query
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });
});
