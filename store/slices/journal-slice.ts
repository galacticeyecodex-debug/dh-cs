/**
 * Journal Slice
 * ----------------------------------------------------------------------------
 * This slice manages the journal system state including:
 * - NPC Relationship tracking
 * - Reputation management
 * - Campaign-specific NPC seeding (fetched from Supabase library table)
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

/**
 * Fetches campaign NPC presets from the library table.
 * Campaign NPCs are stored with type='campaign_npcs' and name=campaignId.
 */
async function fetchCampaignNPCsFromLibrary(campaignId: string): Promise<CreateRelationshipInput[]> {
    try {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('library')
            .select('data')
            .eq('type', 'campaign_npcs')
            .eq('name', campaignId)
            .single();

        if (error) {
            // No data found is not an error - just means no preset for this campaign
            if (error.code === 'PGRST116') {
                console.log(`No NPC preset found for campaign: ${campaignId}`);
                return [];
            }
            throw error;
        }

        // data.data contains the array of NPCs
        const npcs = data?.data as Omit<CreateRelationshipInput, 'points'>[] | undefined;
        if (!npcs || !Array.isArray(npcs)) {
            return [];
        }

        // Add points: 0 to each NPC (default starting relationship)
        return npcs.map(npc => ({
            ...npc,
            points: 0,
        }));
    } catch (error) {
        console.error(`Failed to fetch campaign NPCs for ${campaignId}:`, error);
        return [];
    }
}

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
    seedCampaignNPCs: (campaignId: string) => Promise<{ success: boolean; seeded: number }>;
    removeCampaignNPCs: (campaignId: string) => Promise<{ success: boolean; removed: number }>;

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
                    character_name: character.name, // For debugging
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
    // CAMPAIGN NPC SEEDING
    // ============================================================================

    /**
     * Seeds campaign-specific NPCs for the current character.
     * This is called when a user enables a campaign.
     * Only creates NPCs that don't already exist for this character.
     * NPCs are fetched from the library table (type='campaign_npcs').
     */
    seedCampaignNPCs: async (campaignId: string) => {
        const { character, relationships, fetchRelationships } = get();
        if (!character?.id) {
            return { success: false, seeded: 0 };
        }

        try {
            // Fetch NPCs to seed from the library table
            const npcsToSeed = await fetchCampaignNPCsFromLibrary(campaignId);

            if (npcsToSeed.length === 0) {
                return { success: true, seeded: 0 };
            }

            // Filter out NPCs that already exist for this character
            const existingNpcNames = new Set(
                relationships
                    .filter(r => r.campaign === campaignId)
                    .map(r => r.npc_name)
            );

            const newNpcs = npcsToSeed.filter(
                npc => !existingNpcNames.has(npc.npc_name)
            );

            if (newNpcs.length === 0) {
                return { success: true, seeded: 0 };
            }

            // Insert all new NPCs in a single batch
            const supabase = createClient();
            const { error } = await supabase
                .from('character_relationships')
                .insert(
                    newNpcs.map(npc => ({
                        character_id: character.id,
                        character_name: character.name, // For debugging
                        npc_name: npc.npc_name,
                        npc_description: npc.npc_description || null,
                        npc_image_url: npc.npc_image_url || null,
                        points: npc.points ?? 0,
                        bond_boon: npc.bond_boon || null,
                        bond_bane: npc.bond_bane || null,
                        notes: npc.notes || null,
                        campaign: npc.campaign || null,
                    }))
                );

            if (error) throw error;

            // Refresh relationships to include the new NPCs
            await fetchRelationships();

            return { success: true, seeded: newNpcs.length };
        } catch (error) {
            console.error(`Failed to seed ${campaignId} NPCs:`, error);
            return { success: false, seeded: 0 };
        }
    },

    /**
     * Removes campaign-specific NPCs for the current character.
     * This is called when a user disables a campaign.
     * Only removes NPCs that are tagged with the campaign and have 0 points
     * (i.e., the player hasn't interacted with them).
     */
    removeCampaignNPCs: async (campaignId: string) => {
        const { character, relationships, fetchRelationships } = get();
        if (!character?.id) {
            return { success: false, removed: 0 };
        }

        try {
            // Find campaign NPCs that haven't been modified (still at 0 points)
            const npcsToRemove = relationships.filter(
                r => r.campaign === campaignId && r.points === 0
            );

            if (npcsToRemove.length === 0) {
                return { success: true, removed: 0 };
            }

            const supabase = createClient();
            const { error } = await supabase
                .from('character_relationships')
                .delete()
                .eq('character_id', character.id)
                .eq('campaign', campaignId)
                .eq('points', 0);

            if (error) throw error;

            // Refresh relationships
            await fetchRelationships();

            return { success: true, removed: npcsToRemove.length };
        } catch (error) {
            console.error(`Failed to remove ${campaignId} NPCs:`, error);
            return { success: false, removed: 0 };
        }
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
