/**
 * Downtime Slice
 * ----------------------------------------------------------------------------
 * This slice manages the downtime system state including:
 * - Rest type selection (short/long)
 * - Downtime move execution and tracking
 * - Project management (CRUD operations)
 * - Study token tracking (campaign-specific feature)
 */

import { StateCreator } from 'zustand';
import { CharacterStore } from '@/types/store';
import {
    RestType,
    RestState,
    Project,
    CreateProjectInput,
    StudyToken,
    getMovesForRestType,
} from '@/types/downtime';
import { dataService } from '@/lib/data-service';

export interface DowntimeSlice {
    // Rest state
    currentRest: RestState | null;

    // Projects
    projects: Project[];
    projectsLoading: boolean;
    projectsError: string | null;

    // Study Tokens (persisted on character)
    studyTokens: StudyToken[];

    // Rest Actions
    startRest: (type: RestType) => void;
    endRest: () => void;
    useMove: () => void;

    // Project Actions
    fetchProjects: () => Promise<void>;
    createProject: (input: CreateProjectInput) => Promise<Project | null>;
    advanceProject: (projectId: string, segments?: number) => Promise<void>;
    setProjectProgress: (projectId: string, progress: number) => Promise<void>;
    completeProject: (projectId: string) => Promise<void>;
    updateProject: (projectId: string, updates: Partial<CreateProjectInput>) => Promise<void>;
    deleteProject: (projectId: string) => Promise<void>;

    // Study Token Actions
    addStudyToken: (lesson: string, semester?: string) => void;
    spendStudyToken: (tokenId: string, purpose: string) => void;

    // Utility
    resetDowntimeState: () => void;
}

export const createDowntimeSlice: StateCreator<
    CharacterStore,
    [],
    [],
    DowntimeSlice
> = (set, get) => ({
    // Initial state
    currentRest: null,
    projects: [],
    projectsLoading: false,
    projectsError: null,
    studyTokens: [],

    // ============================================================================
    // REST ACTIONS
    // ============================================================================

    startRest: (type: RestType) => {
        const movesTotal = getMovesForRestType(type);
        set({
            currentRest: {
                type,
                movesRemaining: movesTotal,
                movesTotal,
                startedAt: new Date().toISOString(),
            },
        });
    },

    endRest: () => {
        set({ currentRest: null });
    },

    useMove: () => {
        const { currentRest } = get();
        if (!currentRest || currentRest.movesRemaining <= 0) return;

        set({
            currentRest: {
                ...currentRest,
                movesRemaining: currentRest.movesRemaining - 1,
            },
        });
    },

    // ============================================================================
    // PROJECT ACTIONS
    // ============================================================================

    fetchProjects: async () => {
        const { character } = get();
        if (!character?.id) return;

        set({ projectsLoading: true, projectsError: null });

        try {
            const data = await dataService.character.getCharacterProjects(character.id);
            set({ projects: data || [], projectsLoading: false });
        } catch (error) {
            console.error('Failed to fetch projects:', error);
            set({
                projectsError: error instanceof Error ? error.message : 'Failed to fetch projects',
                projectsLoading: false,
            });
        }
    },

    createProject: async (input: CreateProjectInput) => {
        const { character, fetchProjects } = get();
        if (!character?.id) return null;

        try {
            const data = await dataService.character.createCharacterProject(character.id, input);

            // Refresh projects list
            await fetchProjects();
            return data;
        } catch (error) {
            console.error('Failed to create project:', error);
            return null;
        }
    },

    advanceProject: async (projectId: string, segments: number = 1) => {
        const { projects, fetchProjects } = get();
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const newCurrent = Math.min(
            project.countdown_current + segments,
            project.countdown_total
        );
        const isNowComplete = newCurrent >= project.countdown_total;

        try {
            await dataService.character.updateCharacterProject(projectId, {
                countdown_current: newCurrent,
                completed: isNowComplete,
                completed_at: isNowComplete ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
            });

            // Refresh projects list
            await fetchProjects();
        } catch (error) {
            console.error('Failed to advance project:', error);
        }
    },

    setProjectProgress: async (projectId: string, progress: number) => {
        const { projects, fetchProjects } = get();
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        // Clamp progress between 0 and total
        const newCurrent = Math.max(0, Math.min(progress, project.countdown_total));
        const isNowComplete = newCurrent >= project.countdown_total;
        const wasComplete = project.completed;

        try {
            await dataService.character.updateCharacterProject(projectId, {
                countdown_current: newCurrent,
                completed: isNowComplete,
                // Only set completed_at if transitioning to complete
                completed_at: isNowComplete && !wasComplete ? new Date().toISOString() :
                    !isNowComplete ? null : project.completed_at,
                updated_at: new Date().toISOString(),
            });

            await fetchProjects();
        } catch (error) {
            console.error('Failed to set project progress:', error);
        }
    },

    completeProject: async (projectId: string) => {
        const { fetchProjects } = get();

        try {
            await dataService.character.updateCharacterProject(projectId, {
                completed: true,
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

            await fetchProjects();
        } catch (error) {
            console.error('Failed to complete project:', error);
        }
    },

    updateProject: async (projectId: string, updates: Partial<CreateProjectInput>) => {
        const { fetchProjects } = get();

        try {
            await dataService.character.updateCharacterProject(projectId, {
                name: updates.name,
                description: updates.description,
                countdown_total: updates.countdown_total,
                updated_at: new Date().toISOString(),
            });

            await fetchProjects();
        } catch (error) {
            console.error('Failed to update project:', error);
        }
    },

    deleteProject: async (projectId: string) => {
        const { fetchProjects } = get();

        try {
            await dataService.character.deleteCharacterProject(projectId);

            await fetchProjects();
        } catch (error) {
            console.error('Failed to delete project:', error);
        }
    },

    // ============================================================================
    // STUDY TOKEN ACTIONS (Local state - could be persisted to character later)
    // ============================================================================

    addStudyToken: (lesson: string, semester?: string) => {
        const newToken: StudyToken = {
            id: crypto.randomUUID(),
            lesson,
            semester,
            earnedAt: new Date().toISOString(),
        };

        set(state => ({
            studyTokens: [...state.studyTokens, newToken],
        }));
    },

    spendStudyToken: (tokenId: string, purpose: string) => {
        set(state => ({
            studyTokens: state.studyTokens.map(token =>
                token.id === tokenId
                    ? { ...token, spentOn: purpose, spentAt: new Date().toISOString() }
                    : token
            ),
        }));
    },

    // ============================================================================
    // UTILITY
    // ============================================================================

    resetDowntimeState: () => {
        set({
            currentRest: null,
            projects: [],
            projectsLoading: false,
            projectsError: null,
            studyTokens: [],
        });
    },
});
