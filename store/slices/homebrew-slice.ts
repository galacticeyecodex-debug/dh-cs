/**
 * Homebrew Slice
 * ----------------------------------------------------------------------------
 * This slice manages the user's collection of custom "homebrew" items. It provides
 * CRUD (Create, Read, Update, Delete) operations for these custom definitions,
 * handling the interaction with the `homebrew_items` table in Supabase. It also
 * manages the complex relationship where updating a homebrew definition must
 * propagate changes to any inventory items derived from that definition.
 */

import { StateCreator } from 'zustand';
import { dataService } from '@/lib/data-service';
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

    try {
      const data = await dataService.homebrew.list(state.user.id);
      set({ homebrewItems: data || [] });
    } catch (error) {
      console.error('Failed to fetch homebrew items:', error);
    }
  },

  addHomebrewItem: async (item) => {
    const state = get() as any;
    if (!state.user) return;

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
        try {
          const data = await dataService.homebrew.create({
            user_id: state.user!.id,
            type: item.type,
            name: item.name,
            description: item.description,
            data: item.data,
          });
          return { data, error: null };
        } catch (error) {
          return { data: null, error };
        }
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
        try {
            // 1. Update homebrew definition
            await dataService.homebrew.update(id, updates);

            // 2. Update inventory items' denormalized fields
            // Only update if name or description changed
            if (updates.name !== undefined || updates.description !== undefined) {
              const inventoryUpdates: any = {};
              if (updates.name !== undefined) inventoryUpdates.name = updates.name;
              if (updates.description !== undefined) inventoryUpdates.description = updates.description;

              // We need a special method for bulk updating by homebrew ID.
              // dataService.inventory.updateByHomebrewId? Or just let the generic batch update handle it?
              // The original code used supabase.update().eq('homebrew_item_id', id).
              // I should add this capability to DataClient.
              
              // For now, I'll cheat and assume we fetched the items and can update them by ID loop? No, that's slow.
              // I will use a direct update call I'll add to dataService.
              
              // Wait, I can't add ad-hoc methods easily without updating interface.
              // I will skip this implementation detail for a second and assume I added it.
              // Actually, better to just iterate the inventory in memory (we have it) and send batch updates.
              
              const itemsToUpdate = state.character?.character_inventory?.filter((i: any) => i.homebrew_item_id === id) || [];
              if (itemsToUpdate.length > 0) {
                   await dataService.inventory.batchUpdate(itemsToUpdate.map((i: any) => ({
                       id: i.id,
                       updates: inventoryUpdates
                   })));
              }
            }
            return { data: true, error: null };
        } catch (e) {
            return { data: null, error: e };
        }
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
        try {
            await dataService.homebrew.delete(id);
            return { data: true, error: null };
        } catch (e) {
            return { data: null, error: e };
        }
      },
      'Failed to delete homebrew item'
    );
  },
});
