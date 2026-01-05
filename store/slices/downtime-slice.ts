/**
 * Downtime Slice
 * ----------------------------------------------------------------------------
 * This slice manages the downtime system state including:
 * - Rest type selection (short/long)
 * - Downtime move execution and tracking
 * - Project management (CRUD operations)
 * - Study token tracking (Strixhaven campaign)
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
import createClient from '@/lib/supabase/client';

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
            const supabase = createClient();
            const { data, error } = await supabase
                .from('character_projects')
                .select('*')
                .eq('character_id', character.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

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
            const supabase = createClient();
            const { data, error } = await supabase
                .from('character_projects')
                .insert({
                    character_id: character.id,
                    name: input.name,
                    description: input.description || null,
                    type: input.type,
                    countdown_total: input.countdown_total || 4,
                    countdown_current: 0,
                    completed: false,
                    data: input.data || {},
                })
                .select()
                .single();

            if (error) throw error;

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
            const supabase = createClient();
            const { error } = await supabase
                .from('character_projects')
                .update({
                    countdown_current: newCurrent,
                    completed: isNowComplete,
                    completed_at: isNowComplete ? new Date().toISOString() : null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', projectId);

            if (error) throw error;

            // Refresh projects list
            await fetchProjects();
        } catch (error) {
            console.error('Failed to advance project:', error);
        }
    },

    completeProject: async (projectId: string) => {
        const { fetchProjects } = get();

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('character_projects')
                .update({
                    completed: true,
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', projectId);

            if (error) throw error;

            await fetchProjects();
        } catch (error) {
            console.error('Failed to complete project:', error);
        }
    },

    updateProject: async (projectId: string, updates: Partial<CreateProjectInput>) => {
        const { fetchProjects } = get();

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('character_projects')
                .update({
                    name: updates.name,
                    description: updates.description,
                    countdown_total: updates.countdown_total,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', projectId);

            if (error) throw error;

            await fetchProjects();
        } catch (error) {
            console.error('Failed to update project:', error);
        }
    },

    deleteProject: async (projectId: string) => {
        const { fetchProjects } = get();

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('character_projects')
                .delete()
                .eq('id', projectId);

            if (error) throw error;

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
