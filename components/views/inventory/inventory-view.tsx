'use client';

/**
 * INVENTORY VIEW
 * ----------------------------------------------------------------------------
 * Manages the character's physical possessions and wealth.
 *
 * FUNCTIONALITY:
 * - Lists all items in the character's inventory (Weapons, Armor, Consumables, Misc).
 * - Provides filtering and sorting options to help manage large inventories.
 * - Tracks Wealth (Gold in Handfuls, Bags, Chests) with increment/decrement controls.
 * - Allows equipping/unequipping items, which updates their status in other views (like Combat).
 * - Includes an "Add Item" flow to browse the game library and add new items.
 * - Allows Editing items (converts standard items to homebrew, or edits existing homebrew).
 * - Allows Removing items from inventory.
 *
 * PERFORMANCE:
 * - Callbacks memoized with useCallback to prevent ItemRow re-renders
 * - GoldCounter callbacks memoized for stability
 * - ItemRow component memoized to prevent unnecessary list re-renders
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useCharacterStore, CharacterInventoryItem, LibraryItem } from '@/store/character-store';
import { Coins, Package, Plus, Heart, Gem, Eye, EyeOff, Sword, Shield, Backpack } from 'lucide-react';
import clsx from 'clsx';
import AddItemModal from './add-item-modal';
import CreateHomebrewItemModal, { HomebrewItemData } from './create-homebrew-item-modal';
import ItemArtModal from './item-art-modal';
import InventoryItemCard from './inventory-item-card';
import { ErrorBoundary } from '@/components/core/error-boundary';
import ViewHeader from '@/components/shared/view-header';
import { useLibraryItems, LibraryPresets } from '@/hooks/useLibraryItems';

export default function InventoryView() {
  const {
    character,
    equipItem,
    addItemToInventory,
    updateGold,
    updateHomebrewItem,
    deleteHomebrewItem,
    convertItemToHomebrew,
    deleteItemFromInventory,
    useConsumable: consumeItem
  } = useCharacterStore();

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CharacterInventoryItem | null>(null);
  const [artEditingItem, setArtEditingItem] = useState<CharacterInventoryItem | null>(null);
  const [showWealth, setShowWealth] = useState(true);
  const [showFilter, setShowFilter] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Use centralized library hook instead of duplicated fetch logic
  const {
    items: allLibraryItems,
    loading: libraryLoading,
    error
  } = useLibraryItems({
    types: LibraryPresets.INVENTORY,
    cacheTimeMs: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Memoize callbacks BEFORE early return (hooks must be unconditional)
  const handleEquip = useCallback((itemId: string, slot: 'equipped_primary' | 'equipped_secondary' | 'equipped_armor' | 'backpack') => {
    equipItem(itemId, slot);
  }, [equipItem]);

  const handleAddItem = useCallback((item: LibraryItem) => {
    addItemToInventory(item);
  }, [addItemToInventory]);

  const handleEditClick = useCallback((item: CharacterInventoryItem) => {
    setEditingItem(item);
  }, []);

  const handleUseConsumable = useCallback((item: CharacterInventoryItem) => {
    consumeItem(item.id);
  }, [consumeItem]);

  const handleEditArt = useCallback((item: CharacterInventoryItem) => {
    setArtEditingItem(item);
  }, []);

  const handleSaveEditedItem = async (data: HomebrewItemData) => {
    if (!editingItem) return;

    if (editingItem.homebrew_item_id) {
      // Already homebrew, update definition
      await updateHomebrewItem(editingItem.homebrew_item_id, {
        name: data.name,
        type: data.type,
        description: data.description,
        data: data.data
      });
    } else {
      // Convert standard to homebrew
      await convertItemToHomebrew(editingItem.id, {
        name: data.name,
        type: data.type,
        description: data.description,
        data: data.data
      });
    }
    setEditingItem(null);
  };

  const handleDeleteHomebrewDefinition = async () => {
    if (!editingItem || !editingItem.homebrew_item_id) return;
    // Delete from DB and remove from inventory
    await deleteHomebrewItem(editingItem.homebrew_item_id);
    await deleteItemFromInventory(editingItem.id);
    setEditingItem(null);
  };

  const handleDeleteInstance = async () => {
    if (!editingItem) return;
    await deleteItemFromInventory(editingItem.id);
    setEditingItem(null);
  };

  // Memoize gold callbacks
  const handleHandfulsIncrement = useCallback(() => {
    if (!character) return;
    updateGold('handfuls', character.gold.handfuls + 1);
  }, [updateGold, character]);

  const handleHandfulsDecrement = useCallback(() => {
    if (!character) return;
    updateGold('handfuls', character.gold.handfuls - 1);
  }, [updateGold, character]);

  const handleBagsIncrement = useCallback(() => {
    if (!character) return;
    updateGold('bags', character.gold.bags + 1);
  }, [updateGold, character]);

  const handleBagsDecrement = useCallback(() => {
    if (!character) return;
    updateGold('bags', character.gold.bags - 1);
  }, [updateGold, character]);

  const handleChestsIncrement = useCallback(() => {
    if (!character) return;
    updateGold('chests', character.gold.chests + 1);
  }, [updateGold, character]);

  const handleChestsDecrement = useCallback(() => {
    if (!character) return;
    updateGold('chests', character.gold.chests - 1);
  }, [updateGold, character]);

  if (!character) return null;

  const inventoryItems = character.character_inventory || [];

  // Filter and Sort: Equipped items first, then by name
  const sortedItems = [...inventoryItems]
    .filter(item => item.name !== 'Gold')
    .filter(item => {
      let matchesCategory = true;
      const type = item.library_item?.type;

      if (selectedCategory === 'weapon') matchesCategory = type === 'weapon';
      else if (selectedCategory === 'armor') matchesCategory = type === 'armor';
      else if (selectedCategory === 'consumable') matchesCategory = type === 'consumable';
      else if (selectedCategory === 'item') matchesCategory = type === 'item';

      return matchesCategory;
    })
    .sort((a, b) => {
      const aEquipped = a.location.startsWith('equipped') ? 1 : 0;
      const bEquipped = b.location.startsWith('equipped') ? 1 : 0;
      if (aEquipped !== bEquipped) return bEquipped - aEquipped;
      return a.name.localeCompare(b.name);
    });

  return (
    <ErrorBoundary>
      <div className="p-4 space-y-6 pb-24">
        {/* Header */}
        <ViewHeader
          icon={Backpack}
          title="Inventory"
          subtitle="Manage your gear, weapons, and wealth"
        />

        {/* Gold Tracker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
              <Coins size={14} /> Wealth
            </h3>
            <button
              onClick={() => setShowWealth(!showWealth)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
              aria-label={showWealth ? "Hide wealth details" : "Show wealth details"}
            >
              {showWealth ? <EyeOff size={14} /> : <Eye size={14} />}
              {showWealth ? 'Hide' : 'Show'}
            </button>
          </div>

          {showWealth && (
            <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <GoldCounter
                  label="Handfuls"
                  value={character.gold.handfuls}
                  onIncrement={handleHandfulsIncrement}
                  onDecrement={handleHandfulsDecrement}
                />
                <GoldCounter
                  label="Bags"
                  value={character.gold.bags}
                  onIncrement={handleBagsIncrement}
                  onDecrement={handleBagsDecrement}
                />
                <GoldCounter
                  label="Chests"
                  value={character.gold.chests}
                  onIncrement={handleChestsIncrement}
                  onDecrement={handleChestsDecrement}
                />
              </div>
            </div>
          )}
        </div>

        {/* Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
              <Package size={14} /> Filter
            </h3>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
              aria-label={showFilter ? "Hide filters" : "Show filters"}
            >
              {showFilter ? <EyeOff size={14} /> : <Eye size={14} />}
              {showFilter ? 'Hide' : 'Show'}
            </button>
          </div>

          {showFilter && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
              <button
                className={clsx(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap",
                  selectedCategory === null ? "bg-dagger-gold text-black" : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                )}
                onClick={() => setSelectedCategory(null)}
              >
                <Package size={16} /> All
              </button>
              <button
                className={clsx(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap",
                  selectedCategory === 'weapon' ? "bg-dagger-gold text-black" : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                )}
                onClick={() => setSelectedCategory('weapon')}
              >
                <Sword size={16} /> Weapons
              </button>
              <button
                className={clsx(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap",
                  selectedCategory === 'armor' ? "bg-dagger-gold text-black" : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                )}
                onClick={() => setSelectedCategory('armor')}
              >
                <Shield size={16} /> Armor
              </button>
              <button
                className={clsx(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap",
                  selectedCategory === 'consumable' ? "bg-dagger-gold text-black" : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                )}
                onClick={() => setSelectedCategory('consumable')}
              >
                <Heart size={16} /> Consumables
              </button>
              <button
                className={clsx(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap",
                  selectedCategory === 'item' ? "bg-dagger-gold text-black" : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                )}
                onClick={() => setSelectedCategory('item')}
              >
                <Gem size={16} /> Misc Items
              </button>
            </div>
          )}
        </div>

        {/* Items List Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
            <Package size={14} /> Inventory Items
          </h3>
          <button
            onClick={() => setIsAddItemModalOpen(true)}
            className="bg-dagger-gold text-black px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 hover:scale-105 transition-transform"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          {error && <div className="p-3 bg-red-800/50 border border-red-500 rounded text-red-300 text-sm">{error}</div>}
          {sortedItems.length > 0 ? (
            sortedItems.map((item) => (
              <InventoryItemCard
                key={item.id}
                item={item}
                onEquip={handleEquip}
                onManage={handleEditClick}
                onEditArt={handleEditArt}
                onUse={handleUseConsumable}
              />
            ))
          ) : (
            <div className="p-4 bg-white/5 rounded-lg border border-white/5 text-gray-400 text-sm text-center">
              Your inventory is empty. Click &quot;Add Item&quot; to get started!
            </div>
          )}
        </div>

        <AddItemModal
          isOpen={isAddItemModalOpen}
          onClose={() => setIsAddItemModalOpen(false)}
          onAddItem={handleAddItem}
          libraryItems={allLibraryItems}
          isLoading={libraryLoading}
        />

        {editingItem && (
          <CreateHomebrewItemModal
            isOpen={!!editingItem}
            onClose={() => setEditingItem(null)}
            onSave={handleSaveEditedItem}
            onDelete={editingItem.homebrew_item_id ? handleDeleteHomebrewDefinition : undefined}
            onRemoveFromInventory={handleDeleteInstance}
            initialData={editingItem.library_item ? {
              name: editingItem.library_item.name,
              type: editingItem.library_item.type as any,
              description: editingItem.library_item.data?.markdown || editingItem.library_item.data?.description || '',
              data: editingItem.library_item.data
            } : undefined}
            isEditing={true}
          />
        )}

        {artEditingItem && (
          <ItemArtModal
            item={artEditingItem}
            onClose={() => setArtEditingItem(null)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

const GoldCounter = React.memo(function GoldCounter({ label, value, onIncrement, onDecrement }: { label: string, value: number, onIncrement: () => void, onDecrement: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-[10px] uppercase text-gray-500">{label}</div>
      <div className="flex w-full gap-1 mt-1 max-w-[80px]">
        <button type="button" onClick={onDecrement} aria-label={`Decrease ${label}`} className="flex-1 h-6 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-sm font-bold text-gray-300">-</button>
        <button type="button" onClick={onIncrement} aria-label={`Increase ${label}`} className="flex-1 h-6 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-sm font-bold text-gray-300">+</button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value &&
    prevProps.label === nextProps.label &&
    prevProps.onIncrement === nextProps.onIncrement &&
    prevProps.onDecrement === nextProps.onDecrement;
});
