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

import React, { useState, useCallback } from 'react';
import { useCharacterStore, CharacterInventoryItem, LibraryItem } from '@/store/character-store';
import { AppIcons } from '@/lib/icon-utils';
import AddItemModal from './add-item-modal';
import CreateHomebrewItemModal, { HomebrewItemData } from './create-homebrew-item-modal';
import ItemArtModal from './item-art-modal';
import InventoryItemCard from './inventory-item-card';
import SectionHeader from '@/components/shared/section-header';
import { ErrorBoundary } from '@/components/core/error-boundary';
import ViewHeader from '@/components/shared/view-header';
import { useLibraryItems, LibraryPresets } from '@/hooks/useLibraryItems';
import { Panel } from '@/components/ui/panel';
import { PillButton } from '@/components/ui/pill-button';
import { Counter } from '@/components/ui/counter';

type FilterCategory = 'weapon' | 'armor' | 'consumable' | 'item' | null;

const FILTER_OPTIONS: { value: FilterCategory; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { value: null, label: 'All', icon: AppIcons.inventory.item },
  { value: 'weapon', label: 'Weapons', icon: AppIcons.combat.attack },
  { value: 'armor', label: 'Armor', icon: AppIcons.vitals.armor },
  { value: 'consumable', label: 'Consumables', icon: AppIcons.inventory.consumable },
  { value: 'item', label: 'Misc Items', icon: AppIcons.inventory.valuable },
];

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
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>(null);

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
      if (!selectedCategory) return true;
      return item.library_item?.type === selectedCategory;
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
          icon={AppIcons.inventory.gear}
          title="Inventory"
          subtitle="Manage your gear, weapons, and wealth"
        />

        {/* Gold Tracker */}
        <div className="space-y-2">
          <SectionHeader
            title={<><AppIcons.inventory.currency size={14} /> Wealth</>}
            isVisible={showWealth}
            onToggle={() => setShowWealth(!showWealth)}
          />

          {showWealth && (
            <Panel>
              <div className="grid grid-cols-3 gap-4 text-center">
                <Counter
                  label="Handfuls"
                  value={character.gold.handfuls}
                  onIncrement={handleHandfulsIncrement}
                  onDecrement={handleHandfulsDecrement}
                  min={0}
                />
                <Counter
                  label="Bags"
                  value={character.gold.bags}
                  onIncrement={handleBagsIncrement}
                  onDecrement={handleBagsDecrement}
                  min={0}
                />
                <Counter
                  label="Chests"
                  value={character.gold.chests}
                  onIncrement={handleChestsIncrement}
                  onDecrement={handleChestsDecrement}
                  min={0}
                />
              </div>
            </Panel>
          )}
        </div>

        {/* Filter */}
        <div className="space-y-2">
          <SectionHeader
            title={<><AppIcons.inventory.item size={14} /> Filter</>}
            isVisible={showFilter}
            onToggle={() => setShowFilter(!showFilter)}
          />

          {showFilter && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
              {FILTER_OPTIONS.map(({ value, label, icon }) => (
                <PillButton
                  key={label}
                  icon={icon}
                  active={selectedCategory === value}
                  onClick={() => setSelectedCategory(value)}
                >
                  {label}
                </PillButton>
              ))}
            </div>
          )}
        </div>

        {/* Items List Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
            <AppIcons.inventory.item size={14} /> Inventory Items
          </h3>
          <button
            onClick={() => setIsAddItemModalOpen(true)}
            className="bg-dagger-gold text-black px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 hover:scale-105 transition-transform"
          >
            <AppIcons.ui.add size={16} /> Add Item
          </button>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          {error && (
            <Panel variant="ghost" className="bg-red-800/50 border-red-500 text-red-300 text-sm">
              {error}
            </Panel>
          )}
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
            <Panel variant="ghost" className="text-gray-400 text-sm text-center">
              Your inventory is empty. Click &quot;Add Item&quot; to get started!
            </Panel>
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
