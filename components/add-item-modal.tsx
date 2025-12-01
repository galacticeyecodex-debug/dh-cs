'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LibraryItem } from '@/store/character-store';
import { Search, X, Sword, Shield, Heart, Gem, Package } from 'lucide-react';
import clsx from 'clsx';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: LibraryItem) => void;
  libraryItems: LibraryItem[];
}

export default function AddItemModal({ isOpen, onClose, onAddItem, libraryItems }: AddItemModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // 'weapon', 'armor', 'consumable', 'item'

  const filteredItems = useMemo(() => {
    return libraryItems.filter(item => {
      const matchesSearch = searchTerm ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      const matchesCategory = selectedCategory ? item.type === selectedCategory : true;
      
      // Only show types relevant to inventory
      const isRelevantType = ['weapon', 'armor', 'consumable', 'item'].includes(item.type);

      return matchesSearch && matchesCategory && isRelevantType;
    });
  }, [libraryItems, searchTerm, selectedCategory]);

  if (!isOpen) return null;

  const handleAddItemClick = (item: LibraryItem) => {
    onAddItem(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-dagger-panel border border-white/10 rounded-xl shadow-lg w-full max-w-lg h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-dagger-gold">Add Item to Inventory</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 rounded bg-black/20 border border-white/10 focus:ring-dagger-gold focus:border-dagger-gold text-white"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
            <FilterButton 
              label="All" 
              icon={<Package size={16} />} 
              isSelected={selectedCategory === null} 
              onClick={() => setSelectedCategory(null)} 
            />
            <FilterButton 
              label="Weapons" 
              icon={<Sword size={16} />} 
              isSelected={selectedCategory === 'weapon'} 
              onClick={() => setSelectedCategory('weapon')} 
            />
            <FilterButton 
              label="Armor" 
              icon={<Shield size={16} />} 
              isSelected={selectedCategory === 'armor'} 
              onClick={() => setSelectedCategory('armor')} 
            />
            <FilterButton 
              label="Consumables" 
              icon={<Heart size={16} />} 
              isSelected={selectedCategory === 'consumable'} 
              onClick={() => setSelectedCategory('consumable')} 
            />
            <FilterButton 
              label="Misc Items" 
              icon={<Gem size={16} />} 
              isSelected={selectedCategory === 'item'} 
              onClick={() => setSelectedCategory('item')} 
            />
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <div 
                key={item.id} 
                className="bg-black/20 p-3 rounded-lg border border-white/10 hover:border-dagger-gold cursor-pointer transition-colors"
                onClick={() => handleAddItemClick(item)}
              >
                <div className="font-bold text-white">{item.name}</div>
                <div className="text-xs text-gray-400 uppercase">{item.type} {item.tier ? `(Tier ${item.tier})` : ''}</div>
                {item.type === 'weapon' && item.data && (
                  <div className="text-xs text-gray-500">
                    {item.data.trait} {item.data.range} {item.data.damage}
                  </div>
                )}
                {item.type === 'armor' && item.data && (
                  <div className="text-xs text-gray-500">
                    Thresholds: {item.data.base_thresholds}, Score: {item.data.base_score}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">No items found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

interface FilterButtonProps {
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, icon, isSelected, onClick }) => {
  return (
    <button
      className={clsx(
        "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap",
        isSelected
          ? "bg-dagger-gold text-black"
          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
      )}
      onClick={onClick}
    >
      {icon} {label}
    </button>
  );
};