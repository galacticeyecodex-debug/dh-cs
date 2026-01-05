/**
 * Journal Slice
 * ----------------------------------------------------------------------------
 * This slice manages the journal system state including:
 * - NPC Relationship tracking
 * - Reputation management
 */

import { StateCreator } from 'zustand';
import { CharacterStore } from '@/types/store';
import {
    Relationship,
    CreateRelationshipInput,
    ReputationEvent,
    JournalNote,
    CreateNoteInput,
} from '@/types/journal';
import createClient from '@/lib/supabase/client';

export interface JournalSlice {
    // Relationships
    relationships: Relationship[];
    relationshipsLoading: boolean;
    relationshipsError: string | null;

    // Reputation (stored locally, could be extended to persist)
    reputation: number;
    reputationHistory: ReputationEvent[];

    // Relationship Actions
    fetchRelationships: () => Promise<void>;
    createRelationship: (input: CreateRelationshipInput) => Promise<Relationship | null>;
    updateRelationshipPoints: (relationshipId: string, change: number) => Promise<void>;
    updateRelationship: (relationshipId: string, updates: Partial<Relationship>) => Promise<void>;
    deleteRelationship: (relationshipId: string) => Promise<void>;

    // Reputation Actions
    changeReputation: (change: number, description: string) => void;
    resetReputation: () => void;

    // Notes
    notes: JournalNote[];
    createNote: (input: CreateNoteInput) => void;
    updateNote: (id: string, updates: Partial<CreateNoteInput>) => void;
    deleteNote: (id: string) => void;

    // Utility
    resetJournalState: () => void;
}

export const createJournalSlice: StateCreator<
    CharacterStore,
    [],
    [],
    JournalSlice
> = (set, get) => ({
    // Initial state
    relationships: [],
    relationshipsLoading: false,
    relationshipsError: null,
    reputation: 0,
    reputationHistory: [],
    notes: [],

    // ============================================================================
    // RELATIONSHIP ACTIONS
    // ============================================================================

    fetchRelationships: async () => {
        const { character } = get();
        if (!character?.id) return;

        set({ relationshipsLoading: true, relationshipsError: null });

        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('character_relationships')
                .select('*')
                .eq('character_id', character.id)
                .order('npc_name', { ascending: true });

            if (error) throw error;

            set({ relationships: data || [], relationshipsLoading: false });
        } catch (error) {
            console.error('Failed to fetch relationships:', error);
            set({
                relationshipsError: error instanceof Error ? error.message : 'Failed to fetch relationships',
                relationshipsLoading: false,
            });
        }
    },

    createRelationship: async (input: CreateRelationshipInput) => {
        const { character, fetchRelationships } = get();
        if (!character?.id) return null;

        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('character_relationships')
                .insert({
                    character_id: character.id,
                    npc_name: input.npc_name,
                    npc_description: input.npc_description || null,
                    npc_image_url: input.npc_image_url || null,
                    points: input.points ?? 0,
                    bond_boon: input.bond_boon || null,
                    bond_bane: input.bond_bane || null,
                    notes: input.notes || null,
                    campaign: input.campaign || null,
                })
                .select()
                .single();

            if (error) throw error;

            await fetchRelationships();
            return data;
        } catch (error) {
            console.error('Failed to create relationship:', error);
            return null;
        }
    },

    updateRelationshipPoints: async (relationshipId: string, change: number) => {
        const { relationships, fetchRelationships } = get();
        const relationship = relationships.find(r => r.id === relationshipId);
        if (!relationship) return;

        const newPoints = relationship.points + change;

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('character_relationships')
                .update({
                    points: newPoints,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', relationshipId);

            if (error) throw error;

            await fetchRelationships();
        } catch (error) {
            console.error('Failed to update relationship points:', error);
        }
    },

    updateRelationship: async (relationshipId: string, updates: Partial<Relationship>) => {
        const { fetchRelationships } = get();

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('character_relationships')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', relationshipId);

            if (error) throw error;

            await fetchRelationships();
        } catch (error) {
            console.error('Failed to update relationship:', error);
        }
    },

    deleteRelationship: async (relationshipId: string) => {
        const { fetchRelationships } = get();

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('character_relationships')
                .delete()
                .eq('id', relationshipId);

            if (error) throw error;

            await fetchRelationships();
        } catch (error) {
            console.error('Failed to delete relationship:', error);
        }
    },

    // ============================================================================
    // REPUTATION ACTIONS
    // ============================================================================

    changeReputation: (change: number, description: string) => {
        const event: ReputationEvent = {
            id: crypto.randomUUID(),
            description,
            change,
            timestamp: new Date().toISOString(),
        };

        set(state => ({
            reputation: state.reputation + change,
            reputationHistory: [event, ...state.reputationHistory],
        }));
    },

    resetReputation: () => {
        set({
            reputation: 0,
            reputationHistory: [],
        });
    },

    // ============================================================================
    // NOTE ACTIONS
    // ============================================================================

    createNote: (input: CreateNoteInput) => {
        const newNote: JournalNote = {
            id: crypto.randomUUID(),
            title: input.title,
            content: input.content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        set(state => ({
            notes: [newNote, ...state.notes],
        }));
    },

    updateNote: (id: string, updates: Partial<CreateNoteInput>) => {
        set(state => ({
            notes: state.notes.map(note =>
                note.id === id
                    ? {
                        ...note,
                        ...updates,
                        updated_at: new Date().toISOString(),
                    }
                    : note
            ),
        }));
    },

    deleteNote: (id: string) => {
        set(state => ({
            notes: state.notes.filter(note => note.id !== id),
        }));
    },

    // ============================================================================
    // UTILITY
    // ============================================================================

    resetJournalState: () => {
        set({
            relationships: [],
            relationshipsLoading: false,
            relationshipsError: null,
            reputation: 0,
            reputationHistory: [],
            notes: [],
        });
    },
});
