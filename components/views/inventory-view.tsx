'use client';

import React from 'react';
import { useCharacterStore, CharacterInventoryItem } from '@/store/character-store';
import { Coins, Package, Sword, Shield, ArrowRightLeft } from 'lucide-react';
import clsx from 'clsx';

export default function InventoryView() {
  const { character, equipItem } = useCharacterStore();

  if (!character) return null;

  const inventoryItems = character.character_inventory || [];

  // Sort: Equipped items first, then by name
  const sortedItems = [...inventoryItems].sort((a, b) => {
    const aEquipped = a.location.startsWith('equipped') ? 1 : 0;
    const bEquipped = b.location.startsWith('equipped') ? 1 : 0;
    if (aEquipped !== bEquipped) return bEquipped - aEquipped;
    return a.name.localeCompare(b.name);
  });

  const handleEquip = (itemId: string, slot: 'equipped_primary' | 'equipped_secondary' | 'equipped_armor' | 'backpack') => {
    equipItem(itemId, slot);
  };

  return (
    <div className="space-y-6">
      {/* Gold Tracker */}
      <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4 text-dagger-gold">
          <Coins size={18} />
          <h2 className="text-sm font-bold uppercase tracking-wider">Wealth</h2>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{character.gold.handfuls}</div>
            <div className="text-[10px] uppercase text-gray-500">Handfuls</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{character.gold.bags}</div>
            <div className="text-[10px] uppercase text-gray-500">Bags</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{character.gold.chests}</div>
            <div className="text-[10px] uppercase text-gray-500">Chests</div>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div>
        <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <Package size={20} /> Inventory Items
        </h2>
        <div className="space-y-2">
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
              Your inventory is empty.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemRow({ item, onEquip }: { item: CharacterInventoryItem, onEquip: (id: string, slot: any) => void }) {
  const type = item.library_item?.type;
  const isEquipped = item.location.startsWith('equipped');
  
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
          <div className="text-xs text-gray-400 line-clamp-1">
            {item.description || item.library_item?.data?.markdown || 'No description'}
          </div>
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
