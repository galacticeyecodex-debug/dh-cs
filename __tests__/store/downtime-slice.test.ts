/**
 * DOWNTIME SLICE TESTS
 * ----------------------------------------------------------------------------
 * This test suite validates the downtime-slice.ts store functions that manage
 * rest mechanics and project tracking.
 *
 * FUNCTIONALITY TESTED:
 * - startRest / endRest: Rest session management
 * - useMove: Consuming downtime moves
 * - fetchProjects: Loading projects from database
 * - createProject / updateProject / deleteProject: CRUD operations
 * - advanceProject / setProjectProgress / completeProject: Progress tracking
 * - addStudyToken / spendStudyToken: Study token management
 * - resetDowntimeState: Full state reset
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// ============================================================================
// MOCKS - All vi.mock calls must be at the top, before any variable definitions
// ============================================================================

// Mock Supabase client - No longer used directly
vi.mock('@/lib/supabase/client', () => ({
  default: () => ({}),
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
      getCharacterProjects: vi.fn(),
      createCharacterProject: vi.fn(),
      updateCharacterProject: vi.fn(),
      deleteCharacterProject: vi.fn(),
    },
    inventory: {
      equip: vi.fn(),
    },
  },
}));

// ============================================================================
// IMPORTS - After all mocks are declared
// ============================================================================
import { useCharacterStore } from '@/store/character-store';
import { dataService } from '@/lib/data-service';
import type { Character } from '@/types/character';
import type { Project } from '@/types/downtime';

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

const createMockProject = (overrides?: Partial<Project>): Project => ({
  id: 'project-1',
  character_id: 'char-1',
  name: 'Forge Magic Sword',
  description: 'Crafting an enchanted blade',
  type: 'generic',
  countdown_total: 4,
  countdown_current: 0,
  completed: false,
  data: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// ============================================================================
// SETUP AND TEARDOWN
// ============================================================================

describe('Downtime Slice', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default successful mock responses
    vi.mocked((dataService.character as any).getCharacterProjects).mockResolvedValue([]);
    vi.mocked((dataService.character as any).createCharacterProject).mockResolvedValue(createMockProject());
    vi.mocked((dataService.character as any).updateCharacterProject).mockResolvedValue(undefined);
    vi.mocked((dataService.character as any).deleteCharacterProject).mockResolvedValue(undefined);

    // Reset store to initial state
    useCharacterStore.setState({
      character: null,
      user: { id: 'user-1', email: 'test@test.com', user_metadata: {} },
      isLoading: false,
      currentRest: null,
      projects: [],
      projectsLoading: false,
      projectsError: null,
      studyTokens: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // REST ACTIONS TESTS
  // ==========================================================================

  describe('startRest', () => {
    it('should start a short rest with 2 moves', () => {
      useCharacterStore.getState().startRest('short');

      const state = useCharacterStore.getState();
      expect(state.currentRest).toBeDefined();
      expect(state.currentRest?.type).toBe('short');
      expect(state.currentRest?.movesRemaining).toBe(2);
      expect(state.currentRest?.movesTotal).toBe(2);
      expect(state.currentRest?.startedAt).toBeDefined();
    });

    it('should start a long rest with 2 moves', () => {
      useCharacterStore.getState().startRest('long');

      const state = useCharacterStore.getState();
      expect(state.currentRest?.type).toBe('long');
      expect(state.currentRest?.movesRemaining).toBe(2);
    });

    it('should set startedAt timestamp', () => {
      const before = new Date().toISOString();
      useCharacterStore.getState().startRest('short');
      const after = new Date().toISOString();

      const state = useCharacterStore.getState();
      expect(state.currentRest?.startedAt).toBeDefined();
      expect(state.currentRest?.startedAt! >= before).toBe(true);
      expect(state.currentRest?.startedAt! <= after).toBe(true);
    });
  });

  describe('endRest', () => {
    it('should clear current rest state', () => {
      useCharacterStore.getState().startRest('short');
      expect(useCharacterStore.getState().currentRest).toBeDefined();

      useCharacterStore.getState().endRest();
      expect(useCharacterStore.getState().currentRest).toBeNull();
    });

    it('should not crash when no rest is active', () => {
      expect(() => useCharacterStore.getState().endRest()).not.toThrow();
    });
  });

  describe('useMove', () => {
    it('should decrement moves remaining', () => {
      useCharacterStore.getState().startRest('short');
      expect(useCharacterStore.getState().currentRest?.movesRemaining).toBe(2);

      useCharacterStore.getState().useMove();
      expect(useCharacterStore.getState().currentRest?.movesRemaining).toBe(1);

      useCharacterStore.getState().useMove();
      expect(useCharacterStore.getState().currentRest?.movesRemaining).toBe(0);
    });

    it('should not go below 0 moves', () => {
      useCharacterStore.getState().startRest('short');

      // Use all moves
      useCharacterStore.getState().useMove();
      useCharacterStore.getState().useMove();

      // Try to use another
      useCharacterStore.getState().useMove();
      expect(useCharacterStore.getState().currentRest?.movesRemaining).toBe(0);
    });

    it('should not crash when no rest is active', () => {
      expect(() => useCharacterStore.getState().useMove()).not.toThrow();
    });

    it('should preserve rest type and total when using move', () => {
      useCharacterStore.getState().startRest('long');
      useCharacterStore.getState().useMove();

      const state = useCharacterStore.getState();
      expect(state.currentRest?.type).toBe('long');
      expect(state.currentRest?.movesTotal).toBe(2);
    });
  });

  // ==========================================================================
  // PROJECT FETCH TESTS
  // ==========================================================================

  describe('fetchProjects', () => {
    it('should set loading state while fetching', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      // Create a delayed promise to check loading state
      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise(resolve => { resolvePromise = resolve; });
      vi.mocked((dataService.character as any).getCharacterProjects).mockReturnValue(delayedPromise);

      const fetchPromise = useCharacterStore.getState().fetchProjects();

      // Check loading state
      expect(useCharacterStore.getState().projectsLoading).toBe(true);

      // Resolve the promise
      resolvePromise!([]);
      await fetchPromise;

      expect(useCharacterStore.getState().projectsLoading).toBe(false);
    });

    it('should store fetched projects', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      const mockProjects = [
        createMockProject({ id: 'project-1', name: 'Project 1' }),
        createMockProject({ id: 'project-2', name: 'Project 2' }),
      ];

      vi.mocked((dataService.character as any).getCharacterProjects).mockResolvedValue(mockProjects);

      await useCharacterStore.getState().fetchProjects();

      const state = useCharacterStore.getState();
      expect(state.projects).toHaveLength(2);
      expect(state.projects[0].name).toBe('Project 1');
    });

    it('should set error on fetch failure', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      vi.mocked((dataService.character as any).getCharacterProjects).mockRejectedValue(new Error('Fetch failed'));

      await useCharacterStore.getState().fetchProjects();

      const state = useCharacterStore.getState();
      expect(state.projectsError).toBeDefined();
      expect(state.projectsLoading).toBe(false);
    });

    it('should not fetch when no character loaded', async () => {
      useCharacterStore.setState({ character: null });

      await useCharacterStore.getState().fetchProjects();

      // Should not have called the database
      expect(vi.mocked((dataService.character as any).getCharacterProjects)).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // PROJECT CRUD TESTS
  // ==========================================================================

  describe('createProject', () => {
    it('should create a new project', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      const newProject = createMockProject({ id: 'new-project' });
      vi.mocked((dataService.character as any).createCharacterProject).mockResolvedValue(newProject);
      vi.mocked((dataService.character as any).getCharacterProjects).mockResolvedValue([newProject]);

      const result = await useCharacterStore.getState().createProject({
        name: 'New Project',
        type: 'generic',
        countdown_total: 4,
      });

      expect(result).toBeDefined();
      expect(result?.name).toBe('Forge Magic Sword');
      expect(vi.mocked((dataService.character as any).createCharacterProject)).toHaveBeenCalledWith(
        character.id,
        expect.objectContaining({ name: 'New Project' })
      );
    });

    it('should return null when no character loaded', async () => {
      useCharacterStore.setState({ character: null });

      const result = await useCharacterStore.getState().createProject({
        name: 'New Project',
        type: 'generic',
      });

      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      vi.mocked((dataService.character as any).createCharacterProject).mockRejectedValue(new Error('DB error'));

      const result = await useCharacterStore.getState().createProject({
        name: 'New Project',
        type: 'generic',
      });

      expect(result).toBeNull();
    });
  });

  describe('advanceProject', () => {
    it('should advance project by 1 segment by default', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      const project = createMockProject({ countdown_current: 1 });
      useCharacterStore.setState({ projects: [project] });

      vi.mocked((dataService.character as any).getCharacterProjects).mockResolvedValue([{ ...project, countdown_current: 2 }]);

      await useCharacterStore.getState().advanceProject('project-1');

      // Verify update was called with incremented value
      expect(vi.mocked((dataService.character as any).updateCharacterProject)).toHaveBeenCalledWith(
        'project-1',
        expect.objectContaining({ countdown_current: 2 })
      );
    });

    it('should advance project by specified segments', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      const project = createMockProject({ countdown_current: 0 });
      useCharacterStore.setState({ projects: [project] });

      vi.mocked((dataService.character as any).getCharacterProjects).mockResolvedValue([{ ...project, countdown_current: 3 }]);

      await useCharacterStore.getState().advanceProject('project-1', 3);

      expect(vi.mocked((dataService.character as any).updateCharacterProject)).toHaveBeenCalledWith(
        'project-1',
        expect.objectContaining({ countdown_current: 3 })
      );
    });

    it('should not exceed countdown_total', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      const project = createMockProject({ countdown_current: 3, countdown_total: 4 });
      useCharacterStore.setState({ projects: [project] });

      vi.mocked((dataService.character as any).getCharacterProjects).mockResolvedValue([{ ...project, countdown_current: 4, completed: true }]);

      await useCharacterStore.getState().advanceProject('project-1', 5);

      expect(vi.mocked((dataService.character as any).updateCharacterProject)).toHaveBeenCalledWith(
        'project-1',
        expect.objectContaining({ countdown_current: 4, completed: true })
      );
    });

    it('should not crash when project not found', async () => {
      useCharacterStore.setState({ projects: [] });

      await expect(
        useCharacterStore.getState().advanceProject('non-existent')
      ).resolves.not.toThrow();
    });
  });

  describe('setProjectProgress', () => {
    it('should set project progress to specific value', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      const project = createMockProject({ countdown_current: 1 });
      useCharacterStore.setState({ projects: [project] });

      vi.mocked((dataService.character as any).getCharacterProjects).mockResolvedValue([{ ...project, countdown_current: 3 }]);

      await useCharacterStore.getState().setProjectProgress('project-1', 3);

      expect(vi.mocked((dataService.character as any).updateCharacterProject)).toHaveBeenCalledWith(
        'project-1',
        expect.objectContaining({ countdown_current: 3 })
      );
    });

    it('should clamp progress to valid range', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      const project = createMockProject({ countdown_current: 2, countdown_total: 4 });
      useCharacterStore.setState({ projects: [project] });

      vi.mocked((dataService.character as any).getCharacterProjects).mockResolvedValue([{ ...project, countdown_current: 4, completed: true }]);

      // Try to set above max
      await useCharacterStore.getState().setProjectProgress('project-1', 10);

      expect(vi.mocked((dataService.character as any).updateCharacterProject)).toHaveBeenCalledWith(
        'project-1',
        expect.objectContaining({ countdown_current: 4 })
      );
    });
  });

  describe('completeProject', () => {
    it('should mark project as completed', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      const project = createMockProject();
      useCharacterStore.setState({ projects: [project] });

      vi.mocked((dataService.character as any).getCharacterProjects).mockResolvedValue([{ ...project, completed: true }]);

      await useCharacterStore.getState().completeProject('project-1');

      expect(vi.mocked((dataService.character as any).updateCharacterProject)).toHaveBeenCalledWith(
        'project-1',
        expect.objectContaining({ completed: true })
      );
    });
  });

  describe('updateProject', () => {
    it('should update project fields', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      const project = createMockProject();
      useCharacterStore.setState({ projects: [project] });

      vi.mocked((dataService.character as any).getCharacterProjects).mockResolvedValue([{ ...project, name: 'Updated Name' }]);

      await useCharacterStore.getState().updateProject('project-1', {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(vi.mocked((dataService.character as any).updateCharacterProject)).toHaveBeenCalledWith(
        'project-1',
        expect.objectContaining({ name: 'Updated Name' })
      );
    });
  });

  describe('deleteProject', () => {
    it('should delete project from database', async () => {
      const character = createMockCharacter();
      useCharacterStore.getState().setCharacter(character);

      const project = createMockProject();
      useCharacterStore.setState({ projects: [project] });

      vi.mocked((dataService.character as any).getCharacterProjects).mockResolvedValue([]);

      await useCharacterStore.getState().deleteProject('project-1');

      expect(vi.mocked((dataService.character as any).deleteCharacterProject)).toHaveBeenCalledWith('project-1');
    });
  });

  // ==========================================================================
  // STUDY TOKEN TESTS
  // ==========================================================================

  describe('addStudyToken', () => {
    it('should add a new study token', () => {
      useCharacterStore.getState().addStudyToken('Elemental Theory');

      const state = useCharacterStore.getState();
      expect(state.studyTokens).toHaveLength(1);
      expect(state.studyTokens[0].lesson).toBe('Elemental Theory');
      expect(state.studyTokens[0].id).toBeDefined();
      expect(state.studyTokens[0].earnedAt).toBeDefined();
    });

    it('should add study token with semester', () => {
      useCharacterStore.getState().addStudyToken('Advanced Magic', 'Fall 2024');

      const state = useCharacterStore.getState();
      expect(state.studyTokens[0].semester).toBe('Fall 2024');
    });

    it('should add multiple study tokens', () => {
      useCharacterStore.getState().addStudyToken('Lesson 1');
      useCharacterStore.getState().addStudyToken('Lesson 2');
      useCharacterStore.getState().addStudyToken('Lesson 3');

      expect(useCharacterStore.getState().studyTokens).toHaveLength(3);
    });
  });

  describe('spendStudyToken', () => {
    it('should mark token as spent', () => {
      useCharacterStore.getState().addStudyToken('Test Lesson');
      const tokenId = useCharacterStore.getState().studyTokens[0].id;

      useCharacterStore.getState().spendStudyToken(tokenId, 'Passed Exam');

      const state = useCharacterStore.getState();
      expect(state.studyTokens[0].spentOn).toBe('Passed Exam');
      expect(state.studyTokens[0].spentAt).toBeDefined();
    });

    it('should not affect other tokens when spending one', () => {
      useCharacterStore.getState().addStudyToken('Lesson 1');
      useCharacterStore.getState().addStudyToken('Lesson 2');

      const tokenId = useCharacterStore.getState().studyTokens[0].id;
      useCharacterStore.getState().spendStudyToken(tokenId, 'Used for exam');

      const state = useCharacterStore.getState();
      expect(state.studyTokens[0].spentOn).toBe('Used for exam');
      expect(state.studyTokens[1].spentOn).toBeUndefined();
    });
  });

  // ==========================================================================
  // RESET STATE TESTS
  // ==========================================================================

  describe('resetDowntimeState', () => {
    it('should reset all downtime state', () => {
      // Set up some state
      useCharacterStore.getState().startRest('short');
      useCharacterStore.setState({
        projects: [createMockProject()],
        projectsError: 'Some error',
      });
      useCharacterStore.getState().addStudyToken('Test');

      // Reset
      useCharacterStore.getState().resetDowntimeState();

      const state = useCharacterStore.getState();
      expect(state.currentRest).toBeNull();
      expect(state.projects).toHaveLength(0);
      expect(state.projectsLoading).toBe(false);
      expect(state.projectsError).toBeNull();
      expect(state.studyTokens).toHaveLength(0);
    });
  });
});
