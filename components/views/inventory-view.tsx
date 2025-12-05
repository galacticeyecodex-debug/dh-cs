'use client';

import React, { useState, useEffect } from 'react';
import { useCharacterStore, CharacterInventoryItem, LibraryItem } from '@/store/character-store';
import { Coins, Package, Sword, Shield, ArrowRightLeft, Plus, Search, Heart, Gem, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';
import AddItemModal from '@/components/add-item-modal';
import createClient from '@/lib/supabase/client'; // Import Supabase client

export default function InventoryView() {
  const { character, equipItem, addItemToInventory, updateGold } = useCharacterStore();
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [showWealth, setShowWealth] = useState(true);
  const [showSearch, setShowSearch] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allLibraryItems, setAllLibraryItems] = useState<LibraryItem[]>([]
  );
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllLibraryItems = async () => {
      setLibraryLoading(true);
      setError(null);
      const supabase = createClient();

      const { data: weaponsData, error: e1 } = await supabase.from('library').select('*').eq('type', 'weapon');
      const { data: armorData, error: e2 } = await supabase.from('library').select('*').eq('type', 'armor');
      const { data: consumablesData, error: e3 } = await supabase.from('library').select('*').eq('type', 'consumable');
      const { data: itemsData, error: e4 } = await supabase.from('library').select('*').eq('type', 'item');


      if (e1 || e2 || e3 || e4) {
        setError("Failed to load library data: " + (e1?.message || e2?.message || e3?.message || e4?.message));
        console.error(e1, e2, e3, e4);
      } else {
        setAllLibraryItems([
          ...(weaponsData || []),
          ...(armorData || []),
          ...(consumablesData || []),
          ...(itemsData || []),
        ]);
      }
      setLibraryLoading(false);
    };

    fetchAllLibraryItems();
  }, []); // Run only once on mount


  if (!character) return null;

  const inventoryItems = character.character_inventory || [];

  // Filter and Sort: Equipped items first, then by name
  const sortedItems = [...inventoryItems]
    .filter(item => item.name !== 'Gold')
    .filter(item => {
       const matchesSearch = searchTerm ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
       let matchesCategory = true;
       const type = item.library_item?.type;
       
       if (selectedCategory === 'weapon') matchesCategory = type === 'weapon';
       else if (selectedCategory === 'armor') matchesCategory = type === 'armor';
       else if (selectedCategory === 'consumable') matchesCategory = type === 'consumable';
       else if (selectedCategory === 'item') matchesCategory = type === 'item';
       
       return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const aEquipped = a.location.startsWith('equipped') ? 1 : 0;
      const bEquipped = b.location.startsWith('equipped') ? 1 : 0;
      if (aEquipped !== bEquipped) return bEquipped - aEquipped;
      return a.name.localeCompare(b.name);
    });

  const handleEquip = (itemId: string, slot: 'equipped_primary' | 'equipped_secondary' | 'equipped_armor' | 'backpack') => {
    equipItem(itemId, slot);
  };

  const handleAddItem = (item: LibraryItem) => {
    addItemToInventory(item);
  };

  return (
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
                onIncrement={() => updateGold('handfuls', character.gold.handfuls + 1)}
                onDecrement={() => updateGold('handfuls', character.gold.handfuls - 1)}
              />
              <GoldCounter 
                label="Bags" 
                value={character.gold.bags} 
                onIncrement={() => updateGold('bags', character.gold.bags + 1)}
                onDecrement={() => updateGold('bags', character.gold.bags - 1)}
              />
              <GoldCounter 
                label="Chests" 
                value={character.gold.chests} 
                onIncrement={() => updateGold('chests', character.gold.chests + 1)}
                onDecrement={() => updateGold('chests', character.gold.chests - 1)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
            <Search size={14} /> Search
          </h3>
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
          >
            {showSearch ? <EyeOff size={14} /> : <Eye size={14} />}
            {showSearch ? 'Hide' : 'Show'}
          </button>
        </div>

        {showSearch && (
          <div className="p-4 space-y-3 bg-dagger-panel border border-white/10 rounded-xl">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-10 rounded bg-black/20 border border-white/10 focus:ring-dagger-gold focus:border-dagger-gold text-white placeholder:text-gray-600"
              />
            </div>

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
    </div>
  );
}

function GoldCounter({ label, value, onIncrement, onDecrement }: { label: string, value: number, onIncrement: () => void, onDecrement: () => void }) {
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
}

function ItemRow({ item, onEquip }: { item: CharacterInventoryItem, onEquip: (id: string, slot: any) => void }) {
  const type = item.library_item?.type;
  const isEquipped = item.location.startsWith('equipped');
  const data = item.library_item?.data;
  
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
                  {data.trait} • {data.range} • {data.damage}
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
        {item.quantity > 1 && (
          <div className="px-2 py-1 bg-black/30 rounded text-xs font-bold text-gray-300">
            x{item.quantity}
          </div>
        )}
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
}