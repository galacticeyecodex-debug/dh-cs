'use client';

/**
 * PLAYMAT VIEW
 * ----------------------------------------------------------------------------
 * Represents the character's "Playmat" - the active area for Domain Cards.
 *
 * FUNCTIONALITY:
 * - Displays the character's active "Loadout" (limited slots for cards in play).
 * - Manages the "Vault" (all other known cards not currently active).
 * - Allows moving cards between Loadout and Vault.
 * - Shows detailed card information (Abilities, Spells, Grimoires) in a visual card format.
 * - Provides access to the Library to add new cards to the collection.
 *
 * PERFORMANCE:
 * - Callbacks memoized with useCallback to prevent CardThumbnail re-renders
 * - CardThumbnail component memoized to prevent unnecessary re-renders
 * - Only re-renders cards when their location or data actually changes
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useCharacterStore, CharacterCard, LibraryItem } from '@/store/character-store';
import { LibraryBig, ScrollText, Plus, Archive, X, ArrowRightLeft, Zap, Shield, ShieldOff, Users, AlertCircle, Swords, Sparkles, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AddItemModal from '@/components/add-item-modal';
import { dataService } from '@/lib/data-service';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import { ErrorBoundary } from '@/components/error-boundary';
import { parseCardPassiveModifiers, type PassiveModifier, type ModifierCondition } from '@/lib/card-parser';
import { parseCombatAbility, type CombatAbility } from '@/lib/combat-spell-parser';
import { toast } from 'react-hot-toast';

export default function PlaymatView() {
  const { character, moveCard, addCardToCollection } = useCharacterStore();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'loadout' | 'vault'>('loadout');
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CharacterCard | null>(null);
  const [allLibraryItems, setAllLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAllLibraryItems = async () => {
      setLibraryLoading(true);

      try {
        // Fetch card-related types
        const [abilitiesData, spellsData, grimoiresData] = await Promise.all([
          dataService.library.getByType('ability'),
          dataService.library.getByType('spell'),
          dataService.library.getByType('grimoire'),
        ]);

        setAllLibraryItems([
          ...abilitiesData,
          ...spellsData,
          ...grimoiresData,
        ]);
      } catch (error) {
        console.error("Failed to load library data:", error);
      }
      setLibraryLoading(false);
    };

    fetchAllLibraryItems();
  }, []);

  // Memoize callbacks BEFORE early return (hooks must be unconditional)
  const handleAddCard = useCallback((item: LibraryItem) => {
    addCardToCollection(item);
  }, [addCardToCollection]);

  const allCharacterCards = character?.character_cards || [];

  const filteredCards = useMemo(() => {
    if (!searchTerm) return allCharacterCards;
    const term = searchTerm.toLowerCase();
    return allCharacterCards.filter(card => {
      const { name, domain, type } = card.library_item || {};
      return (
        name?.toLowerCase().includes(term) ||
        domain?.toLowerCase().includes(term) ||
        type?.toLowerCase().includes(term)
      );
    });
  }, [allCharacterCards, searchTerm]);

  const loadoutCards = filteredCards.filter(card => card.location === 'loadout');
  const vaultCards = filteredCards.filter(card => card.location === 'vault');

  const handleMoveCard = useCallback((cardId: string, destination: 'loadout' | 'vault') => {
    // Basic check for loadout limit
    if (destination === 'loadout' && loadoutCards.length >= 5) {
      toast.error("Loadout is full! Move a card to the Vault first.");
      return;
    }
    moveCard(cardId, destination);
  }, [moveCard, loadoutCards.length]);

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="animate-pulse">Loading Playmat...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 w-full sm:w-auto">
          <button
            onClick={() => setViewMode('loadout')}
            className={clsx(
              "flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-colors",
              viewMode === 'loadout' ? "bg-dagger-gold text-black" : "text-gray-400 hover:text-white"
            )}
          >
            <ScrollText size={16} /> Loadout
          </button>
          <button
            onClick={() => setViewMode('vault')}
            className={clsx(
              "flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-colors",
              viewMode === 'vault' ? "bg-dagger-gold text-black" : "text-gray-400 hover:text-white"
            )}
          >
            <Archive size={16} /> Vault
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input
              type="text"
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-dagger-gold transition-colors"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsAddCardModalOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-full text-sm font-bold flex items-center gap-1 transition-colors border border-white/10 flex-shrink-0"
          >
            <Plus size={16} /> <span className="hidden xs:inline">Add Card</span>
          </button>
        </div>
      </div>

      {/* Loadout View */}
      {viewMode === 'loadout' && (
        <div className="space-y-6">
          {/* Active Modifiers Summary */}
          {loadoutCards.length > 0 && character && (() => {
            // Collect all active modifiers from loadout cards
            const allModifiers: PassiveModifier[] = [];
            loadoutCards.forEach(card => {
              const mods = parseCardPassiveModifiers(card, character);
              allModifiers.push(...mods.filter(m => m.isActive));
            });

            // Group modifiers by stat
            const modifiersByStat = allModifiers.reduce((acc, mod) => {
              if (!acc[mod.stat]) {
                acc[mod.stat] = [];
              }
              acc[mod.stat].push(mod);
              return acc;
            }, {} as Record<string, PassiveModifier[]>);

            const statKeys = Object.keys(modifiersByStat);

            if (statKeys.length === 0) return null;

            return (
              <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase text-purple-400 tracking-wider mb-3 flex items-center gap-2">
                  <Sparkles size={14} /> Active Modifiers
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {statKeys.map(stat => {
                    const mods = modifiersByStat[stat];
                    const total = mods.reduce((sum, m) => sum + m.value, 0);
                    return (
                      <div key={stat} className="bg-white/5 border border-purple-500/30 rounded-lg p-3">
                        <div className="text-[10px] text-gray-400 uppercase mb-1 capitalize">
                          {stat.replace(/_/g, ' ')}
                        </div>
                        <div className={clsx(
                          "text-2xl font-bold",
                          total >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {total >= 0 ? `+${total}` : total}
                        </div>
                        <div className="text-[9px] text-gray-500 mt-1">
                          {mods.length} modifier{mods.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Loadout Grid */}
          <div className="grid grid-cols-2 gap-4">
            {loadoutCards.length > 0 ? (
              loadoutCards.map((charCard) => (
                <CardThumbnail
                  key={charCard.id}
                  charCard={charCard}
                  onClick={() => setSelectedCard(charCard)}
                  actionLabel="To Vault"
                  onAction={() => handleMoveCard(charCard.id, 'vault')}
                />
              ))
            ) : (
              <div className="aspect-[2/3] border-2 border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center text-gray-600 col-span-2 p-4 text-center">
                <LibraryBig size={24} className="mb-2" />
                <span className="text-sm">
                  {searchTerm ? "No cards match your search." : "No cards in Loadout."}
                </span>
                <span className="text-xs">
                  {searchTerm ? "Try a different search term." : "Add from Vault or create new!"}
                </span>
              </div>
            )}

            {/* Fill remaining slots up to 5 only if not searching */}
            {!searchTerm && Array.from({ length: Math.max(0, 5 - loadoutCards.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-[2/3] border-2 border-dashed border-white/5 rounded-lg flex items-center justify-center text-gray-600">
                <span className="text-xs uppercase">Slot {loadoutCards.length + i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vault View */}
      {viewMode === 'vault' && (
        <div className="space-y-4">
          {vaultCards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {vaultCards.map((charCard) => (
                <CardThumbnail
                  key={charCard.id}
                  charCard={charCard}
                  onClick={() => setSelectedCard(charCard)}
                  actionLabel="To Loadout"
                  onAction={() => handleMoveCard(charCard.id, 'loadout')}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              {searchTerm ? "No cards in vault match your search." : "Your Vault is empty."}
            </div>
          )}
        </div>
      )}

      {/* Add Card Modal */}
      <AddItemModal
        isOpen={isAddCardModalOpen}
        onClose={() => setIsAddCardModalOpen(false)}
        onAddItem={handleAddCard}
        libraryItems={allLibraryItems}
        filterType="cards"
      />

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          charCard={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
      </div>
    </ErrorBoundary>
  );
}

const CardThumbnail = React.memo(function CardThumbnail({ charCard, onClick, actionLabel, onAction }: { charCard: CharacterCard, onClick: () => void, actionLabel?: string, onAction?: () => void }) {
  const { character } = useCharacterStore();
  const { name, domain, tier, type, data } = charCard.library_item || { name: 'Unknown Card', domain: '', tier: 0, type: '', data: {} };
  // Ensure we check for recall in data, defaulting to '0' if not found or empty
  const recallCost = data?.recall || '0';

  // Check for mechanics
  const hasPassiveModifiers = character && parseCardPassiveModifiers(charCard, character).length > 0;
  const hasCombatAbility = parseCombatAbility(charCard) !== null;

  return (
    <div className="group relative">
      <div
        className="aspect-[2/3] bg-zinc-800 border border-white/10 rounded-lg p-2 flex flex-col overflow-hidden hover:border-dagger-gold transition-colors cursor-pointer relative"
        onClick={onClick}
      >
        {/* Top Header Section: Level & Recall Cost */}
        <div className="absolute top-0 left-0 w-full flex justify-between items-start p-2 z-20 pointer-events-none">
          {/* Top Left: Level */}
          <div className="relative w-8 h-10 flex items-center justify-center text-white font-bold text-sm shadow-md" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 80%, 50% 100%, 0% 80%)', backgroundColor: 'black' }}>
            {tier}
          </div>

          {/* Top Right: Recall Cost */}
          <div className="relative w-7 h-7 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white font-bold text-xs shadow-md">
            {recallCost}
            <Zap size={8} className="absolute bottom-0.5 right-0.5 text-yellow-400" />
          </div>
        </div>

        {/* Domain & Type Banner (Top Center) */}
        <div className="mt-8 text-center z-10">
          <span className="uppercase font-bold text-[9px] bg-black/60 border border-white/10 text-white px-2 py-0.5 rounded-sm tracking-wider shadow-sm backdrop-blur-sm">
            {domain} {type}
          </span>
        </div>

        {/* Card Name */}
        <div className="text-center mt-1 px-1 z-10">
          <div className="font-serif font-bold text-white leading-tight text-sm">{name}</div>
        </div>

        {/* Full Description (Small Text) */}
        <div className="flex-1 mt-2 overflow-hidden text-[9px] text-gray-300 leading-snug text-center px-1">
          {data?.description || data?.text ? (
            <div className="prose prose-invert prose-p:text-[9px] prose-p:leading-snug line-clamp-[8]">
              <ReactMarkdown>
                {data.description || data.text}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="italic text-gray-500">No description.</p>
          )}
        </div>

        {/* Mechanic Badges (Bottom of card) */}
        {(hasPassiveModifiers || hasCombatAbility) && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20">
            {hasPassiveModifiers && (
              <div className="bg-purple-900/80 border border-purple-500/50 rounded-full px-1.5 py-0.5 flex items-center gap-0.5" title="Has passive modifiers">
                <Sparkles size={8} className="text-purple-300" />
              </div>
            )}
            {hasCombatAbility && (
              <div className="bg-purple-900/80 border border-purple-500/50 rounded-full px-1.5 py-0.5 flex items-center gap-0.5" title="Has combat ability">
                <Swords size={8} className="text-purple-300" />
              </div>
            )}
          </div>
        )}

      </div>

      {actionLabel && onAction && (
        <button
          onClick={(e) => { e.stopPropagation(); onAction(); }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/20 text-[10px] font-bold text-gray-300 px-2 py-1 rounded-full hover:bg-zinc-700 hover:text-white whitespace-nowrap shadow-md z-30 flex items-center gap-1"
        >
          <ArrowRightLeft size={10} /> {actionLabel}
        </button>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if card data changed
  return prevProps.charCard.id === nextProps.charCard.id &&
         prevProps.charCard.location === nextProps.charCard.location &&
         prevProps.actionLabel === nextProps.actionLabel &&
         prevProps.onClick === nextProps.onClick &&
         prevProps.onAction === nextProps.onAction;
});

function CardDetailModal({ charCard, onClose }: { charCard: CharacterCard, onClose: () => void }) {
  const { character } = useCharacterStore();
  const { name, domain, tier, type, data } = charCard.library_item || { name: 'Unknown', domain: '', tier: 0, type: '', data: {} };
  const recallCost = data?.recall || '0';

  // Parse card mechanics
  const passiveModifiers = character ? parseCardPassiveModifiers(charCard, character) : [];
  const combatAbility = parseCombatAbility(charCard);

  // Helper to get condition icon
  const getConditionIcon = (condition?: ModifierCondition) => {
    if (!condition || condition.type === 'always') return null;
    switch (condition.type) {
      case 'when_armored':
        return <Shield size={12} className="text-gray-400" />;
      case 'when_unarmored':
        return <ShieldOff size={12} className="text-gray-400" />;
      case 'loadout_domain_count':
        return <Users size={12} className="text-purple-400" />;
      case 'environment':
        return <AlertCircle size={12} className="text-orange-400" />;
      default:
        return null;
    }
  };

  // Helper to get condition text
  const getConditionText = (condition?: ModifierCondition): string | null => {
    if (!condition || condition.type === 'always') return null;
    switch (condition.type) {
      case 'when_armored':
        return 'While wearing armor';
      case 'when_unarmored':
        return 'While not wearing armor';
      case 'loadout_domain_count':
        return `When ${condition.minCount}+ ${condition.domain} cards in loadout`;
      case 'environment':
        return condition.requirement || 'Environment requirement';
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-zinc-800 text-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Section */}
        <div className="absolute top-0 left-0 w-full flex justify-between items-center p-3 z-10">
          {/* Top Left: Level */}
          <div className="relative w-12 h-16 flex items-center justify-center text-white font-bold text-xl" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 80%, 50% 100%, 0% 80%)', backgroundColor: 'black' }}>
            {tier}
          </div>

          {/* Top Right: Recall Cost */}
          <div className="relative w-10 h-10 rounded-full bg-black/90 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {recallCost}
            <Zap size={14} className="absolute bottom-1 right-1 text-yellow-400" />
          </div>

          {/* Close Button - repositioned */}
          <button onClick={onClose} className="absolute top-2 right-2 text-white/70 hover:text-white bg-black/50 rounded-full p-1">
            <X size={20} />
          </button>
        </div>

        {/* Card Type Banner */}
        <div className="mt-16 pt-2 pb-1 text-center z-10">
          <span className="uppercase font-bold text-xs bg-black/60 border border-white/10 text-white px-3 py-1 rounded-full tracking-wider shadow-sm">
            {domain} - {type}
          </span>
        </div>

        {/* Card Name */}
        <div className="text-center px-4 pt-2">
          <h2 className="text-3xl font-bold font-serif text-white">{name}</h2>
        </div>

        {/* Card Description */}
        <div className="flex-1 overflow-y-auto px-6 py-4 text-sm leading-relaxed">
          {data?.description || data?.text ? (
            <div className="prose prose-invert text-gray-300 text-center">
              <ReactMarkdown>
                {data.description || data.text}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="italic text-gray-500 text-center">No description available.</p>
          )}

          {/* Passive Modifiers Section */}
          {passiveModifiers.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <h3 className="text-xs font-bold uppercase text-purple-400 tracking-wider mb-3 flex items-center gap-2">
                <Sparkles size={14} /> Passive Modifiers
              </h3>
              <div className="space-y-2">
                {passiveModifiers.map((mod, idx) => {
                  const conditionText = getConditionText(mod.condition);
                  const conditionIcon = getConditionIcon(mod.condition);
                  const isInactive = mod.isActive === false;

                  return (
                    <div
                      key={idx}
                      className={clsx(
                        "bg-white/5 border rounded-lg p-3 transition-all",
                        isInactive ? "border-red-500/30 opacity-60" : "border-purple-500/30"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-bold text-white capitalize flex items-center gap-2">
                            {mod.stat.replace(/_/g, ' ')}
                            {isInactive && (
                              <span className="text-[10px] bg-red-900/50 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded">
                                INACTIVE
                              </span>
                            )}
                          </div>
                          {conditionText && (
                            <div className="text-[10px] text-gray-500 italic flex items-center gap-1 mt-0.5">
                              {conditionIcon}
                              {conditionText}
                            </div>
                          )}
                        </div>
                        <div className={clsx(
                          "text-lg font-bold",
                          isInactive ? "text-gray-600" : mod.value >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {mod.value >= 0 ? `+${mod.value}` : mod.value}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Combat Ability Section */}
          {combatAbility && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <h3 className="text-xs font-bold uppercase text-purple-400 tracking-wider mb-3 flex items-center gap-2">
                <Swords size={14} /> Combat Ability
              </h3>
              <div className="bg-white/5 border border-purple-500/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase">Roll Type</span>
                  <span className="text-sm font-bold text-purple-300 capitalize">{combatAbility.rollType.replace(/_/g, ' ')}</span>
                </div>
                {combatAbility.range && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 uppercase">Range</span>
                    <span className="text-sm font-bold text-white">{combatAbility.range}</span>
                  </div>
                )}
                {combatAbility.damage && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 uppercase">Damage</span>
                    <span className="text-sm font-bold text-white">{combatAbility.damage}</span>
                  </div>
                )}
                {combatAbility.costs && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 uppercase">Cost</span>
                    <div className="flex items-center gap-2">
                      {combatAbility.costs.hope !== undefined && (
                        <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                          {combatAbility.costs.hope} Hope
                        </span>
                      )}
                      {combatAbility.costs.stress !== undefined && (
                        <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded border border-red-500/30">
                          {combatAbility.costs.stress} Stress
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {combatAbility.effects && combatAbility.effects.length > 0 && (
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-xs text-gray-400 uppercase block mb-1">Effects</span>
                    <div className="flex flex-wrap gap-1">
                      {combatAbility.effects.map((effect, idx) => (
                        <span key={idx} className="text-[10px] bg-orange-900/50 text-orange-300 px-2 py-0.5 rounded border border-orange-500/30">
                          {effect}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="py-2 text-center text-xs text-gray-500">
          {/* Footer content removed */}
        </div>
      </div>
    </div>
  );
}