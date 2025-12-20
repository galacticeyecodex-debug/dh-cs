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
import { Coins, Package, Sword, Shield, ArrowRightLeft, Plus, Heart, Gem, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import AddItemModal from '@/components/add-item-modal';
import CreateHomebrewItemModal, { HomebrewItemData } from '@/components/create-homebrew-item-modal';
import { dataService } from '@/lib/data-service';
import { ErrorBoundary } from '@/components/error-boundary';

export default function InventoryView() {
  const { 
    character, 
    equipItem, 
    addItemToInventory, 
    updateGold,
    updateHomebrewItem,
    deleteHomebrewItem,
    convertItemToHomebrew,
    deleteItemFromInventory
  } = useCharacterStore();
  
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CharacterInventoryItem | null>(null);
  const [showWealth, setShowWealth] = useState(true);
  const [showFilter, setShowFilter] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allLibraryItems, setAllLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllLibraryItems = async () => {
      setLibraryLoading(true);
      setError(null);

      try {
        const [weaponsData, armorData, consumablesData, itemsData] = await Promise.all([
          dataService.library.getByType('weapon'),
          dataService.library.getByType('armor'),
          dataService.library.getByType('consumable'),
          dataService.library.getByType('item'),
        ]);

        setAllLibraryItems([
          ...weaponsData,
          ...armorData,
          ...consumablesData,
          ...itemsData,
        ]);
      } catch (error) {
        setError("Failed to load library data: " + (error instanceof Error ? error.message : String(error)));
        console.error(error);
      }
      setLibraryLoading(false);
    };

    fetchAllLibraryItems();
  }, []); // Run only once on mount

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

  const handleDeleteClick = useCallback((itemId: string) => {
    if (confirm('Are you sure you want to remove this item from your inventory?')) {
      deleteItemFromInventory(itemId);
    }
  }, [deleteItemFromInventory]);

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

  // Memoize gold callbacks
  const handleHandfulsIncrement = useCallback(() => {
    if (!character) return;
    updateGold('handfuls', character.gold.handfuls + 1);
  }, [updateGold, character?.gold.handfuls, character]);

  const handleHandfulsDecrement = useCallback(() => {
    if (!character) return;
    updateGold('handfuls', character.gold.handfuls - 1);
  }, [updateGold, character?.gold.handfuls, character]);

  const handleBagsIncrement = useCallback(() => {
    if (!character) return;
    updateGold('bags', character.gold.bags + 1);
  }, [updateGold, character?.gold.bags, character]);

  const handleBagsDecrement = useCallback(() => {
    if (!character) return;
    updateGold('bags', character.gold.bags - 1);
  }, [updateGold, character?.gold.bags, character]);

  const handleChestsIncrement = useCallback(() => {
    if (!character) return;
    updateGold('chests', character.gold.chests + 1);
  }, [updateGold, character?.gold.chests, character]);

  const handleChestsDecrement = useCallback(() => {
    if (!character) return;
    updateGold('chests', character.gold.chests - 1);
  }, [updateGold, character?.gold.chests, character]);

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
      <div className="space-y-6">
        {/* Gold Tracker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
            <Coins size={14} /> Wealth
          </h3>
          <button
            onClick={() => setShowWealth(!showWealth)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
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
            <ItemRow
              key={item.id}
              item={item}
              onEquip={handleEquip}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
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
          initialData={editingItem.library_item ? {
              name: editingItem.library_item.name,
              type: editingItem.library_item.type as any,
              description: editingItem.library_item.data?.markdown || editingItem.library_item.data?.description || '',
              data: editingItem.library_item.data
          } : undefined}
          isEditing={true}
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
        <button type="button" onClick={onDecrement} className="flex-1 h-6 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-sm font-bold text-gray-300">-</button>
        <button type="button" onClick={onIncrement} className="flex-1 h-6 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-sm font-bold text-gray-300">+</button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value &&
         prevProps.label === nextProps.label &&
         prevProps.onIncrement === nextProps.onIncrement &&
         prevProps.onDecrement === nextProps.onDecrement;
});

const ItemRow = React.memo(function ItemRow({ 
  item, 
  onEquip,
  onEdit,
  onDelete
}: { 
  item: CharacterInventoryItem, 
  onEquip: (id: string, slot: any) => void,
  onEdit: (item: CharacterInventoryItem) => void,
  onDelete: (id: string) => void
}) {
  const type = item.library_item?.type;
  const isEquipped = item.location.startsWith('equipped');
  const data = item.library_item?.data;
  const isHomebrew = !!item.homebrew_item_id;

  let locationLabel = '';
  if (item.location === 'equipped_primary') locationLabel = 'Primary';
  if (item.location === 'equipped_secondary') locationLabel = 'Secondary';
  if (item.location === 'equipped_armor') locationLabel = 'Armor';

  return (
    <div className={clsx(
      "flex flex-col gap-2 p-3 rounded-lg border transition-all",
      isEquipped ? "bg-dagger-gold/10 border-dagger-gold/30" : "bg-white/5 border-white/5"
    )}>
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-white flex items-center gap-2">
            {item.name}
            {isEquipped && (
              <span className="text-[10px] font-bold uppercase bg-dagger-gold text-black px-1.5 py-0.5 rounded">
                {locationLabel}
              </span>
            )}
            {isHomebrew && (
              <span className="text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                Custom
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {type === 'armor' && data ? (
              <>
                {data.feature?.name && <span className="font-bold text-gray-300">{data.feature.name}: </span>}
                {data.feature?.text && <span className="italic">{data.feature.text} </span>}
                <span className="block mt-0.5 text-gray-500">Score: {data.base_score}, Thresholds: {data.base_thresholds}</span>
              </>
            ) : type === 'weapon' && data ? (
              <>
                <span className="block mb-0.5">
                  {data.trait} • {data.range} • {data.damage} {data.type === 'Physical' ? 'Phy' : data.type === 'Magic' ? 'Mag' : data.type}
                </span>
                {data.feature?.name && <span className="font-bold text-gray-300">{data.feature.name}: </span>}
                {data.feature?.text && <span className="italic">{data.feature.text}</span>}
              </>
            ) : (
              item.description || data?.markdown || 'No description'
            )}
          </div>

          {/* Modifiers Tags */}
          {data?.modifiers && Array.isArray(data.modifiers) && data.modifiers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {data.modifiers.map((mod: any, idx: number) => {
                const isPositive = mod.value > 0;
                const sign = mod.value > 0 ? '+' : '';
                const label = `${sign}${mod.value} ${mod.target.charAt(0).toUpperCase() + mod.target.slice(1)}`;

                return (
                  <span
                    key={idx}
                    className={clsx(
                      "text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold",
                      isPositive
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                    )}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex flex-col items-end gap-1">
          {item.quantity > 1 && (
            <div className="px-2 py-1 bg-black/30 rounded text-xs font-bold text-gray-300 mb-1">
              x{item.quantity}
            </div>
          )}
          <div className="flex gap-1">
             <button
               onClick={() => onEdit(item)}
               className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
               title="Edit Item"
             >
               <Pencil size={14} />
             </button>
             <button
               onClick={() => onDelete(item.id)}
               className="p-1.5 bg-white/5 hover:bg-red-900/40 rounded text-gray-400 hover:text-red-400 transition-colors"
               title="Remove Item"
             >
               <Trash2 size={14} />
             </button>
          </div>
        </div>
      </div>

      {/* Equip Controls */}
      <div className="flex gap-2 mt-1">
        {type === 'weapon' && (
          <>
            {item.location !== 'equipped_primary' && (
              <button
                onClick={() => onEquip(item.id, 'equipped_primary')}
                className="text-[10px] font-bold uppercase px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1"
              >
                <Sword size={12} /> Primary
              </button>
            )}
            {item.location !== 'equipped_secondary' && (
              <button
                onClick={() => onEquip(item.id, 'equipped_secondary')}
                className="text-[10px] font-bold uppercase px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1"
              >
                <Sword size={12} /> Secondary
              </button>
            )}
          </>
        )}

        {type === 'armor' && item.location !== 'equipped_armor' && (
          <button
            onClick={() => onEquip(item.id, 'equipped_armor')}
            className="text-[10px] font-bold uppercase px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1"
          >
            <Shield size={12} /> Equip
          </button>
        )}

        {isEquipped && (
          <button
            onClick={() => onEquip(item.id, 'backpack')}
            className="text-[10px] font-bold uppercase px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded flex items-center gap-1 ml-auto"
          >
            <ArrowRightLeft size={12} /> Unequip
          </button>
        )}
      </div>
    </div>
  );
});