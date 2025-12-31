/**
 * Inventory Slice
 * ----------------------------------------------------------------------------
 * This slice handles all operations related to the character's inventory and equipment
 * management. It provides functionality for adding, deleting, and equipping items,
 * as well as moving cards between the loadout and vault. It ensures that changes to
 * the inventory are correctly reflected in the database and triggers necessary stat
 * recalculations when equipment changes occur.
 */

import { StateCreator } from 'zustand';
import { dataService } from '@/lib/data-service';
import { withOptimisticUpdate } from '@/lib/state-helpers';
import { LibraryItem, CharacterCard, CharacterInventoryItem, HomebrewItem } from '@/types/character';
import { toast } from 'sonner';
import { CharacterStore } from '@/types/store';

export interface InventorySlice {
  equipItem: (itemId: string, slot: 'equipped_primary' | 'equipped_secondary' | 'equipped_armor' | 'backpack') => Promise<void>;
  addItemToInventory: (item: LibraryItem) => Promise<void>;
  deleteItemFromInventory: (inventoryItemId: string) => Promise<void>;
  moveCard: (cardId: string, destination: 'loadout' | 'vault') => Promise<void>;
  addCardToCollection: (item: LibraryItem) => Promise<void>;
  updateCardImage: (cardId: string, imageUrl: string | null, imageType?: 'artwork' | 'full-card', position?: { x: number; y: number }) => Promise<void>;
  updateCardImagePosition: (cardId: string, position: { x: number; y: number }) => Promise<void>;
  updateInventoryItemImage: (itemId: string, imageUrl: string | null, position?: { x: number; y: number }) => Promise<void>;
  updateInventoryItemImagePosition: (itemId: string, position: { x: number; y: number }) => Promise<void>;
  convertItemToHomebrew: (inventoryItemId: string, homebrewItemData: Omit<HomebrewItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export const createInventorySlice: StateCreator<CharacterStore, [], [], InventorySlice> = (set, get) => ({
  moveCard: async (cardId, destination) => {
    const state = get() as any;
    if (!state.character) return;

    const cards = [...(state.character.character_cards || [])];
    const cardIndex = cards.findIndex((c: any) => c.id === cardId);
    if (cardIndex === -1) return;

    const previousLocation = cards[cardIndex].location;
    const updatedCard = { ...cards[cardIndex], location: destination };
    cards[cardIndex] = updatedCard;

    const success = await withOptimisticUpdate(
      () => {
        set((s: any) => ({
          character: s.character ? { ...s.character, character_cards: cards } : null,
        }));

        return () => {
          const rollbackCards = [...((get() as any).character?.character_cards || [])];
          const idx = rollbackCards.findIndex(c => c.id === cardId);
          if (idx !== -1) {
            rollbackCards[idx] = { ...rollbackCards[idx], location: previousLocation };
          }
          set((s: any) => ({
            character: s.character ? { ...s.character, character_cards: rollbackCards } : null,
          }));
        };
      },
      async () => dataService.card.update(cardId, { location: destination }),
      'Failed to move card'
    );

    // Recalculate derived stats after successful card movement
    // (Domain cards in loadout may provide passive modifiers)
    if (success) {
      (get() as any).recalculateDerivedStats?.();
    }
  },

  addCardToCollection: async (item) => {
    const state = get() as any;
    if (!state.character) return;

    try {
      const data = await dataService.card.add(state.character.id, item.id, 'vault');

      // Manually add the library_item data
      const addedCard: CharacterCard = {
        ...data,
        library_item: item,
      };

      set((s: any) => ({
        character: s.character ? {
          ...s.character,
          character_cards: [...(s.character.character_cards || []), addedCard],
        } : null,
      }));
    } catch (error) {
      console.error('Error adding card:', error);
    }
  },

  updateCardImage: async (cardId, imageUrl, imageType = 'artwork', position) => {
    const state = get() as any;
    if (!state.character) return;

    const cards = [...(state.character.character_cards || [])];
    const cardIndex = cards.findIndex((c: any) => c.id === cardId);
    if (cardIndex === -1) return;

    const previousState = cards[cardIndex].state;
    const updatedState = {
      ...previousState,
      custom_image_url: imageUrl,
      custom_image_type: imageUrl ? imageType : undefined,
      // Set default position if not provided (center-top for portraits)
      custom_image_position_x: position?.x ?? previousState?.custom_image_position_x ?? 50,
      custom_image_position_y: position?.y ?? previousState?.custom_image_position_y ?? 0,
    };

    // Clear position if removing image
    if (!imageUrl) {
      delete updatedState.custom_image_position_x;
      delete updatedState.custom_image_position_y;
    }

    const updatedCard = { ...cards[cardIndex], state: updatedState };
    cards[cardIndex] = updatedCard;

    const success = await withOptimisticUpdate(
      () => {
        set((s: any) => ({
          character: s.character ? { ...s.character, character_cards: cards } : null,
        }));

        return () => {
          const rollbackCards = [...((get() as any).character?.character_cards || [])];
          const idx = rollbackCards.findIndex(c => c.id === cardId);
          if (idx !== -1) {
            rollbackCards[idx] = { ...rollbackCards[idx], state: previousState };
          }
          set((s: any) => ({
            character: s.character ? { ...s.character, character_cards: rollbackCards } : null,
          }));
        };
      },
      async () => dataService.card.update(cardId, { state: updatedState }),
      imageUrl ? 'Failed to update card image' : 'Failed to remove card image'
    );

    if (success) {
      toast.success(imageUrl ? 'Card image updated!' : 'Card image removed');
    }
  },

  updateCardImagePosition: async (cardId, position) => {
    const state = get() as any;
    if (!state.character) return;

    const cards = [...(state.character.character_cards || [])];
    const cardIndex = cards.findIndex((c: any) => c.id === cardId);
    if (cardIndex === -1) return;

    const previousState = cards[cardIndex].state;
    const updatedState = {
      ...previousState,
      custom_image_position_x: position.x,
      custom_image_position_y: position.y,
    };
    const updatedCard = { ...cards[cardIndex], state: updatedState };
    cards[cardIndex] = updatedCard;

    await withOptimisticUpdate(
      () => {
        set((s: any) => ({
          character: s.character ? { ...s.character, character_cards: cards } : null,
        }));

        return () => {
          const rollbackCards = [...((get() as any).character?.character_cards || [])];
          const idx = rollbackCards.findIndex(c => c.id === cardId);
          if (idx !== -1) {
            rollbackCards[idx] = { ...rollbackCards[idx], state: previousState };
          }
          set((s: any) => ({
            character: s.character ? { ...s.character, character_cards: rollbackCards } : null,
          }));
        };
      },
      async () => dataService.card.update(cardId, { state: updatedState }),
      'Failed to update image position'
    );
  },

  addItemToInventory: async (item: LibraryItem) => {
    const state = get() as any;
    if (!state.character) return;

    // Check if this is a homebrew item (ID starts with 'homebrew-')
    const isHomebrew = item.id.startsWith('homebrew-');
    const actualItemId = isHomebrew ? undefined : item.id; // Set to undefined for homebrew items
    const homebrewItemId = isHomebrew ? item.id.replace('homebrew-', '') : undefined;

    const newInventoryItem: Omit<CharacterInventoryItem, 'id'> = {
      character_id: state.character.id,
      item_id: actualItemId,
      homebrew_item_id: homebrewItemId,
      name: item.name,
      description: item.data?.markdown || item.data?.description || '',
      location: 'backpack',
      quantity: 1,
      // library_item will be joined on fetch, so not directly set here
    };

    try {
      const data = await dataService.inventory.add(state.character.id, newInventoryItem);

      // Manually add the library_item data since it's not joined on insert
      const addedItem: CharacterInventoryItem = {
        ...data,
        library_item: item,
        homebrew_item: isHomebrew ? state.homebrewItems.find((h: any) => h.id === homebrewItemId) : undefined,
      };

      // Optimistically update the UI
      set((s: any) => ({
        character: s.character ? {
          ...s.character,
          character_inventory: [...(s.character.character_inventory || []), addedItem],
        } : null,
      }));
    } catch (error) {
      console.error('Error adding item to inventory:', error);
    }
  },

  equipItem: async (itemId, slot) => {
    const state = get() as any;
    if (!state.character) return;

    const inventory = [...(state.character.character_inventory || [])];
    const itemIndex = inventory.findIndex((i: any) => i.id === itemId);
    if (itemIndex === -1) return;

    // Build updates array with previous locations for rollback
    const updates: Array<{ id: string; location: string; previousLocation: string }> = [];

    const itemToEquip = { ...inventory[itemIndex] };
    const itemPreviousLocation = itemToEquip.location;

    // If we are equipping to a slot (not unequipped to backpack)
    if (slot !== 'backpack') {
      // Check if something is already in that slot
      const existingItemIndex = inventory.findIndex((i: any) => i.location === slot);
      if (existingItemIndex !== -1) {
        // Move existing item to backpack
        const existingItem = { ...inventory[existingItemIndex] };
        const existingItemPreviousLocation = existingItem.location;
        inventory[existingItemIndex] = { ...existingItem, location: 'backpack' as const };
        updates.push({ id: existingItem.id, location: 'backpack', previousLocation: existingItemPreviousLocation });
      }
    }

    // Update the target item location
    itemToEquip.location = slot;
    inventory[itemIndex] = itemToEquip;
    updates.push({ id: itemToEquip.id, location: slot, previousLocation: itemPreviousLocation });

    const { success } = await withOptimisticUpdate(
      () => {
        set((s: any) => ({
          character: s.character ? { ...s.character, character_inventory: inventory } : null,
        }));

        return () => {
          const rollbackInventory = [...((get() as any).character?.character_inventory || [])];
          updates.forEach(({ id, previousLocation }) => {
            const idx = rollbackInventory.findIndex((i: any) => i.id === id);
            if (idx !== -1) {
              rollbackInventory[idx] = { ...rollbackInventory[idx], location: previousLocation as 'equipped_primary' | 'equipped_secondary' | 'equipped_armor' | 'armor' | 'backpack' };
            }
          });
          set((s: any) => ({
            character: s.character ? { ...s.character, character_inventory: rollbackInventory } : null,
          }));
        };
      },
      async () => {
        // Send simple updates list to service, let it handle RPC details
        return dataService.inventory.equip(updates.map(u => ({ id: u.id, location: u.location })));
      }, 'Failed to equip item'
    );

    // Only recalculate if DB update succeeded
    if (success && state.recalculateDerivedStats) {
      await state.recalculateDerivedStats();
    }
  },

  deleteItemFromInventory: async (inventoryItemId) => {
    const state = get() as any;
    if (!state.character) return;

    await withOptimisticUpdate(
      () => {
        const previousInventory = [...((get() as any).character?.character_inventory || [])];
        set((s: any) => ({
          character: s.character ? {
            ...s.character,
            character_inventory: s.character.character_inventory?.filter((i: any) => i.id !== inventoryItemId)
          } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, character_inventory: previousInventory } : null,
          }));
        };
      },
      async () => dataService.inventory.remove(inventoryItemId),
      'Failed to delete item from inventory'
    );

    // Recalculate stats in case an equipped item was deleted
    if (state.recalculateDerivedStats) {
      await state.recalculateDerivedStats();
    }
  },

  updateInventoryItemImage: async (itemId, imageUrl, position) => {
    const state = get() as any;
    if (!state.character) return;

    const inventory = [...(state.character.character_inventory || [])];
    const itemIndex = inventory.findIndex((i: any) => i.id === itemId);
    if (itemIndex === -1) return;

    const previousState = inventory[itemIndex].state;
    const updatedState = {
      ...previousState,
      custom_image_url: imageUrl,
      // Set default position if not provided (center-top for portraits)
      custom_image_position_x: position?.x ?? previousState?.custom_image_position_x ?? 50,
      custom_image_position_y: position?.y ?? previousState?.custom_image_position_y ?? 50,
    };

    // Clear position if removing image
    if (!imageUrl) {
      delete updatedState.custom_image_url;
      delete updatedState.custom_image_position_x;
      delete updatedState.custom_image_position_y;
    }

    const updatedItem = { ...inventory[itemIndex], state: updatedState };
    inventory[itemIndex] = updatedItem;

    const success = await withOptimisticUpdate(
      () => {
        set((s: any) => ({
          character: s.character ? { ...s.character, character_inventory: inventory } : null,
        }));

        return () => {
          const rollbackInventory = [...((get() as any).character?.character_inventory || [])];
          const idx = rollbackInventory.findIndex((i: any) => i.id === itemId);
          if (idx !== -1) {
            rollbackInventory[idx] = { ...rollbackInventory[idx], state: previousState };
          }
          set((s: any) => ({
            character: s.character ? { ...s.character, character_inventory: rollbackInventory } : null,
          }));
        };
      },
      async () => dataService.inventory.update(itemId, { state: updatedState }),
      imageUrl ? 'Failed to update item image' : 'Failed to remove item image'
    );

    if (success) {
      toast.success(imageUrl ? 'Item image updated!' : 'Item image removed');
    }
  },

  updateInventoryItemImagePosition: async (itemId, position) => {
    const state = get() as any;
    if (!state.character) return;

    const inventory = [...(state.character.character_inventory || [])];
    const itemIndex = inventory.findIndex((i: any) => i.id === itemId);
    if (itemIndex === -1) return;

    const previousState = inventory[itemIndex].state;
    const updatedState = {
      ...previousState,
      custom_image_position_x: position.x,
      custom_image_position_y: position.y,
    };
    const updatedItem = { ...inventory[itemIndex], state: updatedState };
    inventory[itemIndex] = updatedItem;

    await withOptimisticUpdate(
      () => {
        set((s: any) => ({
          character: s.character ? { ...s.character, character_inventory: inventory } : null,
        }));

        return () => {
          const rollbackInventory = [...((get() as any).character?.character_inventory || [])];
          const idx = rollbackInventory.findIndex((i: any) => i.id === itemId);
          if (idx !== -1) {
            rollbackInventory[idx] = { ...rollbackInventory[idx], state: previousState };
          }
          set((s: any) => ({
            character: s.character ? { ...s.character, character_inventory: rollbackInventory } : null,
          }));
        };
      },
      async () => dataService.inventory.update(itemId, { state: updatedState }),
      'Failed to update image position'
    );
  },

  convertItemToHomebrew: async (inventoryItemId, homebrewItemData) => {
    const state = get() as any;
    if (!state.character || !state.user) return;

    // Capture state for rollback
    const previousInventory = [...(state.character.character_inventory || [])];
    const previousHomebrewItems = [...state.homebrewItems];

    // Find the item to convert
    const itemIndex = previousInventory.findIndex((i: any) => i.id === inventoryItemId);
    if (itemIndex === -1) {
      toast.error('Item not found', {
        description: 'Could not find the item to convert',
        duration: 5000,
      });
      return;
    }

    const tempHbId = `temp-hb-${Date.now()}`;
    const tempHbItem: HomebrewItem = {
      id: tempHbId,
      user_id: state.user.id,
      ...homebrewItemData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedInventoryItem = {
      ...previousInventory[itemIndex],
      item_id: undefined,
      homebrew_item_id: tempHbId,
      name: tempHbItem.name,  // Update denormalized name field
      description: tempHbItem.description,  // Update denormalized description field
      homebrew_item: tempHbItem,
      library_item: {
        id: `homebrew-${tempHbId}`,
        type: tempHbItem.type,
        name: tempHbItem.name,
        data: tempHbItem.data,
      } as LibraryItem
    };

    const newInventory = [...previousInventory];
    newInventory[itemIndex] = updatedInventoryItem;

    // Optimistic update
    set({
      character: { ...state.character, character_inventory: newInventory },
      homebrewItems: [tempHbItem, ...state.homebrewItems]
    });

    try {
      // 1. Create homebrew item
      const hbData = await dataService.homebrew.create({
        user_id: state.user.id,
        type: homebrewItemData.type,
        name: homebrewItemData.name,
        description: homebrewItemData.description,
        data: homebrewItemData.data,
      });

      // 2. Link inventory item to homebrew item and update denormalized fields
      await dataService.inventory.update(inventoryItemId, {
        item_id: null,
        homebrew_item_id: hbData.id,
        name: hbData.name,  // Update denormalized name
        description: hbData.description  // Update denormalized description
      });

      // 3. Replace temp IDs with real ones
      const realHbId = hbData.id;
      const realHbItem = hbData;

      set((s: any) => {
        const currentInventory = [...(s.character?.character_inventory || [])];
        const idx = currentInventory.findIndex((i: any) => i.id === inventoryItemId);
        if (idx !== -1) {
          currentInventory[idx] = {
            ...currentInventory[idx],
            homebrew_item_id: realHbId,
            homebrew_item: realHbItem,
            library_item: { ...currentInventory[idx].library_item, id: `homebrew-${realHbId}` }
          };
        }
        return {
          character: s.character ? { ...s.character, character_inventory: currentInventory } : null,
          homebrewItems: s.homebrewItems.map((h: any) => h.id === tempHbId ? realHbItem : h)
        };
      });

    } catch (error) {
      console.error("Conversion failed:", error);
      toast.error("Conversion failed");
      // Rollback
      set({
        character: { ...state.character, character_inventory: previousInventory },
        homebrewItems: previousHomebrewItems
      });
    }
  },
});
