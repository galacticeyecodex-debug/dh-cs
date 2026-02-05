'use client';

/**
 * ADD ITEM MODAL
 * ----------------------------------------------------------------------------
 * A modal dialog that allows users to browse the global game Library and add items 
 * (Weapons, Armor, Consumables, etc.) or cards (Abilities, Spells, etc.) to their character.
 * 
 * FUNCTIONALITY:
 * - Search: Real-time search by item name.
 * - Filtering: Category tags (e.g., "Weapon", "Card") to narrow down the list.
 * - Context Awareness: Accepts a `filterType` prop ('inventory' vs 'cards') to default 
 *   the view to relevant items based on where the user opened the modal from.
 * - Preview: Shows item details like damage dice for weapons or armor scores for armor.
 * - Item Selection: Clicking an item calls `onAddItem` to add it to the character's state.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LibraryItem, useCharacterStore } from '@/store/character-store';
import { AppIcons } from '@/lib/icon-utils';
import clsx from 'clsx';
import { ErrorBoundary } from '@/components/core/error-boundary';
import CreateHomebrewItemModal, { HomebrewItemData } from './create-homebrew-item-modal';
import { MarkdownText } from '@/components/shared/markdown-text';
import { DomainCard } from '@/components/physical-cards/domain-card';
import { DOMAIN_COLORS } from '@/lib/domain-colors';
interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: LibraryItem) => void;
  libraryItems: LibraryItem[];
  filterType?: 'inventory' | 'cards'; // Optional prop to default filtering context
  isLoading?: boolean;
  ownedCards?: { library_item?: LibraryItem }[]; // Cards already owned by character (to filter out duplicates)
  characterDomains?: string[];
  characterLevel?: number;
}

export default function AddItemModal({
  isOpen,
  onClose,
  onAddItem,
  libraryItems,
  filterType = 'inventory',
  isLoading = false,
  ownedCards,
  characterDomains = [],
  characterLevel = 1
}: AddItemModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // 'weapon', 'armor', 'consumable', 'item', 'card'
  const [selectedDomains, setSelectedDomains] = useState<(string | null)[]>([]);
  const [minLevel, setMinLevel] = useState<number>(1);
  const [maxLevel, setMaxLevel] = useState<number>(10);
  const [showHomebrewOnly, setShowHomebrewOnly] = useState(false); // Filter to show only homebrew items
  const [isCreateHomebrewOpen, setIsCreateHomebrewOpen] = useState(false);
  const initializedFilterContext = useRef<string | null>(null);

  const { homebrewItems, fetchHomebrewItems, addHomebrewItem } = useCharacterStore();

  // Extract domain names from library items and supported domains
  const domains = useMemo(() => {
    // 1. Get explicitly defined domains from library
    const explicitlyDefined = libraryItems
      .filter(item => item.type === 'domain')
      .map(item => item.name);

    // 2. Get domains from keys of DOMAIN_COLORS (source of truth for supported domains, includes private)
    const supportedDomains = Object.keys(DOMAIN_COLORS).map(key =>
      key.charAt(0).toUpperCase() + key.slice(1)
    );

    // 3. Get domains referenced by ANY item
    const usedDomains = libraryItems
      .map(item => item.domain)
      .filter((d): d is string => !!d);

    // Merge and unique
    const allDomains = new Set([
      ...explicitlyDefined,
      ...supportedDomains,
      ...usedDomains
    ]);

    return Array.from(allDomains).sort();
  }, [libraryItems]);

  // Fetch homebrew items when modal opens
  useEffect(() => {
    if (isOpen && filterType === 'inventory') {
      fetchHomebrewItems();
    }
  }, [isOpen, filterType, fetchHomebrewItems]);

  // Initialize filters ONLY when context changes (e.g. switching between Inventory and Playmat)
  useEffect(() => {
    if (initializedFilterContext.current !== filterType) {
      setSearchTerm('');
      setSelectedCategory(null);
      setShowHomebrewOnly(false);

      if (filterType === 'cards') {
        const initial: (string | null)[] = [...(characterDomains || [])];
        while (initial.length < 2) initial.push(null);
        setSelectedDomains(initial);
        setMinLevel(1);
        setMaxLevel(characterLevel);
      } else {
        setSelectedDomains([null, null]);
        setMinLevel(1);
        setMaxLevel(10);
      }
      initializedFilterContext.current = filterType;
    }
  }, [filterType, characterDomains, characterLevel]);

  const filteredItems = useMemo(() => {
    // Convert homebrew items to LibraryItem format
    const homebrewAsLibraryItems: LibraryItem[] = homebrewItems.map(item => ({
      id: `homebrew-${item.id}`,
      type: item.type,
      name: item.name,
      data: item.data,
      _isHomebrew: true, // Mark as homebrew for UI
      _homebrewId: item.id, // Store original ID
    })) as LibraryItem[];

    // Merge library and homebrew items
    const allItems = [...libraryItems, ...homebrewAsLibraryItems];

    // Create set of owned card IDs for fast lookup (only for cards, not inventory items)
    const ownedCardIds = new Set(
      filterType === 'cards' && ownedCards
        ? ownedCards.map(card => card.library_item?.id).filter(Boolean)
        : []
    );

    return allItems.filter(item => {
      // CRITICAL: For cards, filter out items that are already owned (prevent duplicates)
      if (filterType === 'cards' && ownedCardIds.has(item.id)) {
        return false;
      }

      const matchesSearch = searchTerm ? (
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.domain && item.domain.toLowerCase().includes(searchTerm.toLowerCase()))
      ) : true;

      // Category filtering
      let matchesCategory = true;
      if (selectedCategory === 'weapon') matchesCategory = item.type === 'weapon';
      else if (selectedCategory === 'armor') matchesCategory = item.type === 'armor';
      else if (selectedCategory === 'consumable') matchesCategory = item.type === 'consumable';
      else if (selectedCategory === 'item') matchesCategory = item.type === 'item';
      else if (selectedCategory === 'card') matchesCategory = ['ability', 'spell', 'grimoire'].includes(item.type);

      // Domain filtering - match ANY of the selected domains (if any selected)
      const activeDomains = selectedDomains.filter(d => d !== null);
      const matchesDomain = activeDomains.length === 0 || activeDomains.includes(item.domain || '');

      // Level filtering
      const itemLevel = item.tier ?? 0;
      const matchesLevel = itemLevel >= minLevel && itemLevel <= maxLevel;

      // Homebrew filtering
      const matchesHomebrew = showHomebrewOnly ? (item as any)._isHomebrew === true : true;

      // Relevant Type check based on context (Inventory vs Playmat/Cards)
      const isCardType = ['ability', 'spell', 'grimoire'].includes(item.type);
      const isInventoryType = ['weapon', 'armor', 'consumable', 'item'].includes(item.type);

      let isRelevantType = false;
      if (selectedCategory) {
        isRelevantType = true; // Category selection overrides context
      } else {
        // Default view based on prop
        if (filterType === 'cards') isRelevantType = isCardType;
        else isRelevantType = isInventoryType;
      }

      return matchesSearch && matchesCategory && matchesDomain && matchesLevel && matchesHomebrew && isRelevantType;
    }).sort((a, b) => {
      // Sort by domain first (e.g. Arcana, Blade, etc.)
      const domainA = a.domain || '';
      const domainB = b.domain || '';
      if (domainA < domainB) return -1;
      if (domainA > domainB) return 1;

      // Then sort by level (tier)
      const levelA = a.tier || 0;
      const levelB = b.tier || 0;
      if (levelA !== levelB) return levelA - levelB;

      // Finally sort by name
      return a.name.localeCompare(b.name);
    });
  }, [libraryItems, homebrewItems, searchTerm, selectedCategory, selectedDomains, minLevel, maxLevel, showHomebrewOnly, filterType, ownedCards]);

  if (!isOpen) return null;

  const handleAddItemClick = (item: LibraryItem) => {
    onAddItem(item);
    // Don't close automatically - allow batch adding
  };

  const handleSaveHomebrew = async (itemData: HomebrewItemData) => {
    await addHomebrewItem({
      type: itemData.type,
      name: itemData.name,
      description: itemData.description,
      data: itemData.data,
    });
    // Note: No need to fetchHomebrewItems - addHomebrewItem already updates state optimistically
  };

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-dagger-panel border border-white/10 rounded-xl shadow-lg w-full max-w-lg h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-dagger-gold">Add {filterType === 'cards' ? 'Card' : 'Item'}</h2>
            <div className="flex items-center gap-2">
              {filterType === 'inventory' && (
                <button
                  onClick={() => setIsCreateHomebrewOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-dagger-gold text-black text-sm font-bold rounded-full hover:scale-105 active:scale-95 transition-all"
                >
                  <AppIcons.ui.add size={16} />
                  Create Custom
                </button>
              )}
              <button onClick={onClose} aria-label="Close" className="text-white/70 hover:text-white">
                <AppIcons.ui.close size={24} />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-4 space-y-3">
            <div className="relative">
              <AppIcons.ui.search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-10 rounded bg-black/20 border border-white/10 focus:ring-dagger-gold focus:border-dagger-gold text-white"
              />
            </div>

            {filterType === 'inventory' && (
              <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
                <FilterButton
                  label="All"
                  icon={<AppIcons.inventory.item size={16} />}
                  isSelected={selectedCategory === null}
                  onClick={() => setSelectedCategory(null)}
                />
                <FilterButton
                  label="Weapons"
                  icon={<AppIcons.combat.attack size={16} />}
                  isSelected={selectedCategory === 'weapon'}
                  onClick={() => setSelectedCategory('weapon')}
                />
                <FilterButton
                  label="Armor"
                  icon={<AppIcons.vitals.armor size={16} />}
                  isSelected={selectedCategory === 'armor'}
                  onClick={() => setSelectedCategory('armor')}
                />
                <FilterButton
                  label="Consumables"
                  icon={<AppIcons.vitals.hitPoints size={16} />}
                  isSelected={selectedCategory === 'consumable'}
                  onClick={() => setSelectedCategory('consumable')}
                />
                <FilterButton
                  label="Misc Items"
                  icon={<AppIcons.inventory.valuable size={16} />}
                  isSelected={selectedCategory === 'item'}
                  onClick={() => setSelectedCategory('item')}
                />
                <FilterButton
                  label="Homebrew"
                  icon={<AppIcons.vitals.hope size={16} />}
                  isSelected={showHomebrewOnly}
                  onClick={() => setShowHomebrewOnly(!showHomebrewOnly)}
                />
              </div>
            )}

            {/* Domain Filters (Only for cards) */}
            {(filterType === 'cards' || selectedCategory === 'card') && (
              <div className="flex flex-wrap gap-4 items-center p-2 bg-black/20 rounded-lg border border-white/5">
                {selectedDomains.map((selectedDomain, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Domain {index + 1}:</span>
                    <div className="relative">
                      <select
                        value={selectedDomain || ''}
                        onChange={(e) => {
                          const newVal = e.target.value || null;
                          setSelectedDomains(prev => {
                            const next = [...prev];
                            next[index] = newVal;
                            return next;
                          });
                        }}
                        className="appearance-none bg-dagger-panel border border-white/10 rounded-md pl-2 pr-8 py-1 text-xs text-white focus:ring-1 focus:ring-dagger-gold focus:border-dagger-gold outline-none transition-all cursor-pointer hover:bg-white/5"
                      >
                        <option value="">Any Domain</option>
                        {domains.map(domain => (
                          <option key={domain} value={domain}>{domain}</option>
                        ))}
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <AppIcons.ui.expand size={12} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Level Filters (Only for cards) */}
            {(filterType === 'cards' || selectedCategory === 'card') && (
              <div className="flex flex-wrap gap-4 items-center p-2 bg-black/20 rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">From Level:</span>
                  <div className="relative">
                    <select
                      value={minLevel}
                      onChange={(e) => setMinLevel(Number(e.target.value))}
                      className="appearance-none bg-dagger-panel border border-white/10 rounded-md pl-2 pr-8 py-1 text-xs text-white focus:ring-1 focus:ring-dagger-gold focus:border-dagger-gold outline-none transition-all cursor-pointer hover:bg-white/5"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <AppIcons.ui.expand size={12} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">To Level:</span>
                  <div className="relative">
                    <select
                      value={maxLevel}
                      onChange={(e) => setMaxLevel(Number(e.target.value))}
                      className="appearance-none bg-dagger-panel border border-white/10 rounded-md pl-2 pr-8 py-1 text-xs text-white focus:ring-1 focus:ring-dagger-gold focus:border-dagger-gold outline-none transition-all cursor-pointer hover:bg-white/5"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <AppIcons.ui.expand size={12} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                <AppIcons.ui.loading className="animate-spin" size={24} />
                <span className="text-sm">Loading library items...</span>
              </div>
            ) : filteredItems.length > 0 ? (
              <div className={clsx(
                "space-y-4",
                filterType === 'cards' && "flex flex-col items-center"
              )}>
                {filteredItems.map(item => {
                  const isCard = ['ability', 'spell', 'grimoire', 'class', 'subclass'].includes(item.type);

                  if (isCard) {
                    return (
                      <div key={item.id} className="w-full flex justify-center">
                        <DomainCard
                          name={item.name}
                          domain={item.domain}
                          tier={item.tier || 0}
                          type={item.type}
                          description={item.data?.description || item.data?.text}
                          recallCost={item.data?.recall_cost}
                          size="thumbnail"
                          onClick={() => handleAddItemClick(item)}
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="w-full bg-black/20 p-3 rounded-lg border border-white/10 hover:border-dagger-gold cursor-pointer transition-colors"
                      onClick={() => handleAddItemClick(item)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold text-white">{item.name}</div>
                        {(item as any)._isHomebrew && (
                          <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-full font-bold uppercase">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 uppercase">{item.type} {item.tier ? `(Level ${item.tier})` : ''} {item.domain ? `- ${item.domain}` : ''}</div>
                      {item.type === 'weapon' && item.data && (
                        <div className="text-xs text-gray-500">
                          {item.data.trait} {item.data.range} {item.data.damage} {item.data.type === 'Physical' ? 'Phy' : item.data.type === 'Magic' ? 'Mag' : item.data.type}
                        </div>
                      )}
                      {item.type === 'armor' && item.data && (
                        <div className="text-xs text-gray-500">
                          Thresholds: {item.data.base_thresholds}, Score: {item.data.base_score}
                        </div>
                      )}

                      {/* Modifiers Tags */}
                      {item.data?.modifiers && Array.isArray(item.data.modifiers) && item.data.modifiers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.data.modifiers.map((mod: any, idx: number) => {
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
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">No items found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Create Homebrew Item Modal */}
      <CreateHomebrewItemModal
        isOpen={isCreateHomebrewOpen}
        onClose={() => setIsCreateHomebrewOpen(false)}
        onSave={handleSaveHomebrew}
      />
    </ErrorBoundary>
  );
}

interface FilterButtonProps {
  label: string;
  icon?: React.ReactNode;
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