import { StateCreator } from 'zustand';
import createClient from '@/lib/supabase/client';
import { withOptimisticUpdate } from '@/lib/state-helpers';
import { HomebrewItem } from '@/types/character';
import { toast } from 'sonner';
import { CharacterStore } from '@/types/store';

export interface HomebrewSlice {
  homebrewItems: HomebrewItem[];
  fetchHomebrewItems: () => Promise<void>;
  addHomebrewItem: (item: Omit<HomebrewItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateHomebrewItem: (id: string, updates: Partial<Omit<HomebrewItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteHomebrewItem: (id: string) => Promise<void>;
}

export const createHomebrewSlice: StateCreator<CharacterStore, [], [], HomebrewSlice> = (set, get) => ({
  homebrewItems: [],

  fetchHomebrewItems: async () => {
    const state = get() as any;
    if (!state.user) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('homebrew_items')
      .select('*')
      .eq('user_id', state.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch homebrew items:', error);
      return;
    }

    set({ homebrewItems: data || [] });
  },

  addHomebrewItem: async (item) => {
    const state = get() as any;
    if (!state.user) return;

    const supabase = createClient();

    const result = await withOptimisticUpdate(
      () => {
        // Optimistically add item with temporary ID
        const tempItem: HomebrewItem = {
          id: `temp-${Date.now()}`,
          user_id: state.user!.id,
          ...item,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        set((s: any) => ({
          homebrewItems: [tempItem, ...s.homebrewItems],
        }));

        return () => {
          // Rollback: Remove temp item
          set((s: any) => ({
            homebrewItems: s.homebrewItems.filter((i: any) => i.id !== tempItem.id),
          }));
        };
      },
      async () => {
        const { data, error } = await supabase
          .from('homebrew_items')
          .insert({
            user_id: state.user!.id,
            type: item.type,
            name: item.name,
            description: item.description,
            data: item.data,
          })
          .select()
          .single();

        return { data, error };
      },
      'Failed to create homebrew item'
    );

    // Replace temp item with real item if successful
    if (result.success && result.data) {
      set((s: any) => ({
        homebrewItems: [result.data!, ...s.homebrewItems.filter((i: any) => !i.id.startsWith('temp-'))],
      }));
    }
  },

  updateHomebrewItem: async (id, updates) => {
    const state = get() as any;
    const previousItems = [...state.homebrewItems];
    const previousInventory = state.character?.character_inventory
      ? [...state.character.character_inventory]
      : [];

    await withOptimisticUpdate(
      () => {
        // Update homebrew definition
        const updatedHomebrewItems = state.homebrewItems.map((item: any) =>
          item.id === id
            ? {
                ...item,
                ...updates,
                updated_at: new Date().toISOString(),
              }
            : item
        );

        // Also update any inventory items that use this homebrew definition
        const updatedInventory = state.character?.character_inventory?.map((invItem: any) => {
          if (invItem.homebrew_item_id === id) {
            const updatedItem = { ...invItem };

            // Update denormalized fields
            if (updates.name) updatedItem.name = updates.name;
            if (updates.description !== undefined) updatedItem.description = updates.description;

            // Update the library_item wrapper (used by UI)
            if (updatedItem.library_item) {
              updatedItem.library_item = {
                ...updatedItem.library_item,
                name: updates.name || updatedItem.library_item.name,
                data: updates.data || updatedItem.library_item.data,
              };
            }

            // Update the homebrew_item reference
            if (updatedItem.homebrew_item) {
              updatedItem.homebrew_item = {
                ...updatedItem.homebrew_item,
                ...updates,
                updated_at: new Date().toISOString(),
              };
            }

            return updatedItem;
          }
          return invItem;
        });

        set((s: any) => ({
          homebrewItems: updatedHomebrewItems,
          character: s.character && updatedInventory ? {
            ...s.character,
            character_inventory: updatedInventory
          } : s.character,
        } as any));

        return () => {
          set({
            homebrewItems: previousItems,
            character: state.character ? {
              ...state.character,
              character_inventory: previousInventory
            } : null,
          } as any);
        };
      },
      async () => {
        const supabase = createClient();

        // 1. Update homebrew definition
        const { data, error } = await supabase
          .from('homebrew_items')
          .update(updates)
          .eq('id', id)
          .select();

        if (error) return { data, error };

        // 2. Update inventory items' denormalized fields
        // Only update if name or description changed
        if (updates.name !== undefined || updates.description !== undefined) {
          const inventoryUpdates: any = {};
          if (updates.name !== undefined) inventoryUpdates.name = updates.name;
          if (updates.description !== undefined) inventoryUpdates.description = updates.description;

          const { error: invError } = await supabase
            .from('character_inventory')
            .update(inventoryUpdates)
            .eq('homebrew_item_id', id);

          if (invError) {
            console.error('Failed to update inventory item names:', invError);
            return { data: null, error: invError };
          }
        }

        return { data, error };
      },
      'Failed to update homebrew item'
    );
  },

  deleteHomebrewItem: async (id) => {
    const state = get() as any;

    // Check how many inventory items use this homebrew definition
    const affectedItems = state.character?.character_inventory?.filter(
      (i: any) => i.homebrew_item_id === id
    ) || [];

    if (affectedItems.length > 1) {
      // Multiple items use this definition - prevent deletion
      toast.error('Cannot delete homebrew item', {
        description: `This item is used by ${affectedItems.length} items in your inventory. Delete individual copies first.`,
        duration: 6000,
      });
      return;
    }

    await withOptimisticUpdate(
      () => {
        const previousItems = [...state.homebrewItems];

        // Remove definition only (inventory items are handled separately)
        set((s: any) => ({
          homebrewItems: s.homebrewItems.filter((item: any) => item.id !== id),
        }));

        return () => {
          set({ homebrewItems: previousItems });
        };
      },
      async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('homebrew_items')
          .delete()
          .eq('id', id);

        return { data, error };
      },
      'Failed to delete homebrew item'
    );
  },
});
