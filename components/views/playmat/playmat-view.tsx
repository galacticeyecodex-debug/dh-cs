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

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useCharacterStore, CharacterCard, LibraryItem } from '@/store/character-store';
import { LibraryBig, ScrollText, Plus, Archive, X, ArrowRightLeft, Zap, Shield, ShieldOff, Users, AlertCircle, Swords, Sparkles, Search, Upload, Image as ImageIcon, Trash2, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AddItemModal from '@/components/views/inventory/add-item-modal';
import clsx from 'clsx';
import { MarkdownText } from '@/components/shared/markdown-text';
import { ErrorBoundary } from '@/components/core/error-boundary';
import ViewHeader from '@/components/shared/view-header';
import ModifierSheet from '@/components/shared/modifier-sheet';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import { parseCardPassiveModifiers, parseCombatAbility, calculateDynamicValue, type PassiveModifier, type ModifierCondition, type CombatAbility } from '@/lib/card-parser';
import { toast } from 'react-hot-toast';
import { getDomainTheme } from '@/lib/domain-colors';
import { uploadCharacterImage } from '@/lib/storage-service';
import { MAX_IMAGE_FILE_SIZE, MAX_IMAGE_FILE_SIZE_MB } from '@/lib/image-utils';
import { getSystemModifiers } from '@/lib/utils';
import Image from 'next/image';
import PlaymatCard from './playmat-card';
import type { EnhancedAbilityCard } from '@/types/cards';
import { getAttack, getRoll, getModifiers, isModifierActive } from '@/lib/enhancement-utils';
import useContentAccess from '@/hooks/useContentAccess';
import { useLibraryItems, LibraryPresets } from '@/hooks/useLibraryItems';

import srdAbilities from '@/content/srd/json/abilities_enhanced.json';
import playtestAbilities from '@/content/playtest/json/abilities_enhanced.json';

export default function PlaymatView() {
  const { character, cardStates, moveCard, addCardToCollection, removeCard, updateCardImage, updateCardImagePosition, updateModifiers, user } = useCharacterStore();
  const { includePlaytest } = useContentAccess();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'loadout' | 'vault'>('loadout');
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CharacterCard | null>(null);
  const [cardDetailMode, setCardDetailMode] = useState<'full' | 'art-only'>('full');
  const [activeAbilityId, setActiveAbilityId] = useState<string | null>(null);
  const [cardToRemove, setCardToRemove] = useState<CharacterCard | null>(null);

  const handleViewCard = useCallback((card: CharacterCard) => {
    setCardDetailMode('full');
    setSelectedCard(card);
  }, []);

  const handleEditCardArt = useCallback((card: CharacterCard) => {
    setCardDetailMode('art-only');
    setSelectedCard(card);
  }, []);

  const handleRemoveCardClick = useCallback((card: CharacterCard) => {
    setCardToRemove(card);
  }, []);

  const handleConfirmRemoveCard = useCallback(async () => {
    if (cardToRemove) {
      await removeCard(cardToRemove.id);
      setCardToRemove(null);
      toast.success(`"${cardToRemove.library_item?.name}" removed from character`);
    }
  }, [cardToRemove, removeCard]);

  const [searchTerm, setSearchTerm] = useState('');

  // Memoize enhanced abilities based on playtest setting
  const enhancedAbilities = useMemo(() => {
    const srdData = (srdAbilities || []) as EnhancedAbilityCard[];
    const playtestData = includePlaytest ? ((playtestAbilities || []) as EnhancedAbilityCard[]) : [];
    return [...srdData, ...playtestData];
  }, [includePlaytest]);

  // Use centralized library hook instead of duplicated fetch logic
  const {
    items: allLibraryItems,
    loading: libraryLoading
  } = useLibraryItems({
    types: LibraryPresets.CARDS,
    includePlaytest,
    cacheTimeMs: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Memoize callbacks BEFORE early return (hooks must be unconditional)
  const handleAddCard = useCallback((item: LibraryItem) => {
    addCardToCollection(item);
  }, [addCardToCollection]);


  // Loadout cards never filtered by search - always show all 5 (max)
  const loadoutCards = useMemo(() =>
    (character?.character_cards || []).filter(card => card.location === 'loadout'),
    [character?.character_cards]
  );

  // Vault cards can be filtered by search term
  const vaultCards = useMemo(() => {
    const allCards = character?.character_cards || [];
    const vaultOnly = allCards.filter(card => card.location === 'vault');
    if (!searchTerm) return vaultOnly;
    const term = searchTerm.toLowerCase();
    return vaultOnly.filter(card => {
      const { name, domain, type } = card.library_item || {};
      return (
        name?.toLowerCase().includes(term) ||
        domain?.toLowerCase().includes(term) ||
        type?.toLowerCase().includes(term)
      );
    });
  }, [character?.character_cards, searchTerm]);

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
      <div className="p-4 space-y-6 pb-24">
        {/* Header */}
        <ViewHeader
          icon={Layers}
          title="Playmat"
          subtitle="Manage your domain cards and loadout"
        />

        {/* Sticky Toggle Bar - Compact Design */}
        <div className="sticky top-0 z-20 bg-dagger-dark/95 backdrop-blur border-b border-white/10 -mx-4 px-4 py-2 shadow-sm">
          {/* Top row: Loadout/Vault toggle + Add Card button */}
          <div className="flex justify-between items-center gap-2">
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setViewMode('loadout')}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-colors",
                  viewMode === 'loadout' ? "bg-dagger-gold text-black" : "text-gray-400 hover:text-white"
                )}
                aria-label="Show loadout cards"
              >
                <ScrollText size={14} /> Loadout
              </button>
              <button
                onClick={() => setViewMode('vault')}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-colors",
                  viewMode === 'vault' ? "bg-dagger-gold text-black" : "text-gray-400 hover:text-white"
                )}
                aria-label="Show vault cards"
              >
                <Archive size={14} /> Vault
              </button>
            </div>

            <button
              onClick={() => setIsAddCardModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-full text-sm font-bold flex items-center gap-1 transition-colors border border-white/10"
            >
              <Plus size={16} /> <span className="hidden xs:inline">Add Card</span>
            </button>
          </div>

          {/* Loadout Mode: Horizontal Quick Nav Pills */}
          {viewMode === 'loadout' && (
            <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide pb-1 -mb-1">
              {loadoutCards.length > 0 ? (
                loadoutCards.map((card) => {
                  const cardId = `loadout-card-${card.id}`;
                  return (
                    <button
                      key={card.id}
                      onClick={() => {
                        const el = document.getElementById(cardId);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white hover:bg-white/10 hover:text-dagger-gold transition-colors truncate max-w-[120px]"
                      title={card.library_item?.name || 'Unknown Card'}
                      aria-label={`Scroll to ${card.library_item?.name || 'card'} in loadout`}
                    >
                      {card.library_item?.name || 'Card'}
                    </button>
                  );
                })
              ) : (
                <span className="text-xs text-gray-500 italic py-1.5">No cards in loadout</span>
              )}
              {/* Empty slot indicators */}
              {loadoutCards.length < 5 && loadoutCards.length > 0 && (
                <span className="flex-shrink-0 px-2 py-1.5 text-xs text-gray-600">
                  +{5 - loadoutCards.length} empty
                </span>
              )}
            </div>
          )}

          {/* Vault Mode: Search Bar */}
          {viewMode === 'vault' && (
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input
                type="text"
                placeholder="Search vault cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-dagger-gold transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loadout View */}
        {viewMode === 'loadout' && (
          <div className="space-y-6">
            {/* Active Modifiers Summary */}
            {loadoutCards.length > 0 && character && (() => {
              // CRITICAL: Calculate total trait values (base + modifiers) for dynamic formulas
              // This ensures cards like "Untouchable" (half Agility) use the correct total
              const traitsWithTotals: any = { ...character.stats };
              const traitNames = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'];

              for (const trait of traitNames) {
                const baseStat = character.stats?.[trait as keyof typeof character.stats] || 0;
                const userMods = (character.modifiers?.[trait] || []) as any[];
                const userTotal = userMods.reduce((sum: number, mod: any) => sum + (mod.value || 0), 0);
                traitsWithTotals[trait] = baseStat + userTotal;
              }

              // Create temporary character with calculated total stats for formula evaluation
              const charForParsing = { ...character, stats: traitsWithTotals };

              // Collect all active modifiers from loadout cards
              const allModifiers: PassiveModifier[] = [];
              loadoutCards.forEach(card => {
                const cardName = card.library_item?.name || '';
                const isCardActive = cardStates?.[cardName]?.is_active ?? false;

                // FIRST: Check for enhanced JSON modifiers with proper condition evaluation
                const enhancedData = enhancedAbilities.find(a => a.name === cardName);
                if (enhancedData) {
                  const jsonModifiers = getModifiers(enhancedData);
                  if (jsonModifiers.length > 0) {
                    let addedFromJson = false;
                    jsonModifiers.forEach((mod, index) => {
                      // For when_active conditions, check per-modifier activation state
                      let active: boolean;
                      if (mod.condition?.type === 'when_active' || mod.condition?.type === 'cost_activated') {
                        // Per-modifier activation state: use modifierKey pattern matching the UI
                        const modifierKey = `${mod.stat}-${index}`;
                        active = cardStates?.[cardName]?.active_modifiers?.[modifierKey] ?? false;
                      } else {
                        // For other condition types, use the generic isModifierActive helper
                        active = isModifierActive(mod, isCardActive, charForParsing);
                      }

                      if (active) {
                        // Calculate the actual value - for dynamic formulas, evaluate them
                        const calculatedValue = mod.formula
                          ? calculateDynamicValue(mod.formula, charForParsing)
                          : mod.value;

                        allModifiers.push({
                          stat: mod.stat,
                          value: calculatedValue,
                          formula: mod.formula,
                          condition: mod.condition as ModifierCondition,
                          isActive: true,
                          source: mod.source || cardName
                        });
                        addedFromJson = true;
                      }
                    });
                    // Only skip text parsing if we added at least one modifier from JSON
                    // This ensures cards with all inactive conditions (like when_active) 
                    // don't get fallback modifiers from text parsing
                    if (addedFromJson || jsonModifiers.length > 0) {
                      return; // Skip text parsing - JSON is authoritative for this card
                    }
                  }
                }

                // FALLBACK: Text parsing for cards without JSON modifiers
                const mods = parseCardPassiveModifiers(card, charForParsing, isCardActive);
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
                  <h3 className="text-xs font-bold uppercase text-dagger-gold tracking-wider mb-3 flex items-center gap-2">
                    <Sparkles size={14} /> Active Modifiers
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {statKeys.map(stat => {
                      const mods = modifiersByStat[stat];
                      const total = mods.reduce((sum, m) => sum + m.value, 0);
                      return (
                        <div key={stat} className="bg-white/5 border border-dagger-gold/30 rounded-lg p-3">
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

            {/* Loadout Cards - Single Column */}
            <div className="flex flex-col gap-4">
              {loadoutCards.length > 0 ? (
                loadoutCards.map((charCard) => {
                  const enhancedData = enhancedAbilities.find(a => a.name === charCard.library_item?.name);
                  // Check if card has attack or roll (which means it has modifiers to manage)
                  const hasModifiers = !!(enhancedData && (getAttack(enhancedData) || getRoll(enhancedData)));
                  return (
                    <div key={charCard.id} id={`loadout-card-${charCard.id}`}>
                      <PlaymatCard
                        card={charCard}
                        enhancedData={enhancedData}
                        onMoveLocation={(loc) => handleMoveCard(charCard.id, loc)}
                        onView={() => handleViewCard(charCard)}
                        onEditArt={() => handleEditCardArt(charCard)}
                        onManageModifiers={() => setActiveAbilityId(charCard.library_item?.name || null)}
                        onRemove={() => handleRemoveCardClick(charCard)}
                        hasModifiersToManage={hasModifiers}
                      />
                    </div>
                  );
                })
              ) : (
                <div className="relative flex flex-col items-center gap-2 p-2 bg-dagger-panel border-2 border-dashed border-white/5 rounded-xl w-full">
                  <div className="w-[240px] aspect-[2.5/3.5] flex flex-col items-center justify-center text-gray-600 p-4 text-center">
                    <LibraryBig size={24} className="mb-2" />
                    <span className="text-sm">No cards in Loadout.</span>
                    <span className="text-xs">Add from Vault or create new!</span>
                  </div>
                </div>
              )}

              {/* Fill remaining slots up to 5 */}
              {Array.from({ length: Math.max(0, 5 - loadoutCards.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="relative flex flex-col items-center gap-2 p-2 bg-dagger-panel border-2 border-dashed border-white/5 rounded-xl w-full">
                  <div className="w-[240px] aspect-[2.5/3.5] flex items-center justify-center text-gray-600">
                    <span className="text-xs uppercase">Slot {loadoutCards.length + i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vault View */}
        {viewMode === 'vault' && (
          <div className="space-y-4">
            {vaultCards.length > 0 ? (
              <div className="flex flex-col items-center gap-4">
                {vaultCards.map((charCard) => {
                  const enhancedData = enhancedAbilities.find(a => a.name === charCard.library_item?.name);
                  // Check if card has attack or roll (which means it has modifiers to manage)
                  const hasModifiers = !!(enhancedData && (getAttack(enhancedData) || getRoll(enhancedData)));
                  return (
                    <PlaymatCard
                      key={charCard.id}
                      card={charCard}
                      enhancedData={enhancedData}
                      onMoveLocation={(loc) => handleMoveCard(charCard.id, loc)}
                      onView={() => handleViewCard(charCard)}
                      onEditArt={() => handleEditCardArt(charCard)}
                      onManageModifiers={() => setActiveAbilityId(charCard.library_item?.name || null)}
                      onRemove={() => handleRemoveCardClick(charCard)}
                      hasModifiersToManage={hasModifiers}
                    />
                  );
                })}
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
          ownedCards={character?.character_cards}
        />

        {/* Card Detail Modal */}
        {selectedCard && (
          <CardDetailModal
            charCard={selectedCard}
            onClose={() => setSelectedCard(null)}
            mode={cardDetailMode}
          />
        )}

        {/* Ability Modifier Sheet */}
        {activeAbilityId && (() => {
          const ability = enhancedAbilities.find(a => a.name === activeAbilityId);
          if (!ability) return null;

          const tabs = [];

          // 1. Roll Tab (Spellcast or Trait)
          const attack = getAttack(ability);
          const roll = getRoll(ability);
          const rollTrait = roll?.trait || attack?.trait;

          if (rollTrait) {
            if (rollTrait.toLowerCase() === 'spellcast') {
              const spellcastTraitName = character.spellcast_trait || character.subclass_data?.data?.spellcast_trait;
              const rawTraitValue = spellcastTraitName ? (character.stats[spellcastTraitName.toLowerCase() as keyof typeof character.stats] || 0) : (character.spellcast || 0);

              // Add trait modifiers if a trait is used
              let traitModSum = 0;
              if (spellcastTraitName) {
                const tKey = spellcastTraitName.toLowerCase();
                const tSystem = getSystemModifiers(character, tKey);
                const tUser = character.modifiers?.[tKey] || [];
                traitModSum = [...tSystem, ...tUser].reduce((acc, m) => acc + m.value, 0);
              }

              const spellcastBase = rawTraitValue + traitModSum;
              const spellcastMods = getSystemModifiers(character, 'spellcast');
              const userSpellcastMods = character.modifiers?.['spellcast'] || [];

              tabs.push({
                id: 'spellcast',
                label: 'Spellcast',
                baseValue: spellcastBase,
                currentModifiers: [...spellcastMods, ...userSpellcastMods],
                onUpdateModifiers: (mods: any[]) => updateModifiers('spellcast', mods)
              });
            } else {
              const traitKey = rollTrait.toLowerCase();
              const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;
              const systemTraitMods = getSystemModifiers(character, traitKey);
              const userTraitMods = character.modifiers?.[traitKey] || [];

              tabs.push({
                id: traitKey,
                label: rollTrait,
                baseValue: baseTraitValue,
                currentModifiers: [...systemTraitMods, ...userTraitMods],
                onUpdateModifiers: (mods: any[]) => updateModifiers(traitKey, mods)
              });
            }
          }

          // 2. Damage Tab
          if (attack?.damage) {
            const systemDamageMods = getSystemModifiers(character, 'damage');
            const userDamageMods = character.modifiers?.['damage'] || [];

            tabs.push({
              id: 'damage',
              label: 'Damage',
              baseValue: 0,
              currentModifiers: [...systemDamageMods, ...userDamageMods],
              onUpdateModifiers: (mods: any[]) => updateModifiers('damage', mods)
            });
          }

          if (tabs.length === 0) return null;

          return (
            <ModifierSheet
              isOpen={!!activeAbilityId}
              onClose={() => setActiveAbilityId(null)}
              statLabel={`${ability.name} Modifiers`}
              baseValue={0}
              currentModifiers={[]}
              onUpdateModifiers={() => { }}
              tabs={tabs}
            />
          );
        })()}

        {/* Remove Card Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!cardToRemove}
          onClose={() => setCardToRemove(null)}
          onConfirm={handleConfirmRemoveCard}
          title="Remove Card"
          description={`Are you sure you want to remove "${cardToRemove?.library_item?.name}" from your character? This cannot be undone.`}
          confirmText="Remove"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    </ErrorBoundary >
  );
}

// Remove CardThumbnail component


function CardDetailModal({ charCard, onClose, mode = 'full' }: { charCard: CharacterCard, onClose: () => void, mode?: 'full' | 'art-only' }) {
  const { character, cardStates, updateCardImage, updateCardImagePosition, removeCard, user } = useCharacterStore();
  const { name, domain, tier, type, data } = charCard.library_item || { name: 'Unknown', domain: '', tier: 0, type: '', data: {} };
  const recallCost = data?.recall_cost ?? 0;
  const theme = getDomainTheme(domain);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(mode === 'art-only');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Local position state for immediate UI feedback (debounced save to DB)
  const [localPosition, setLocalPosition] = useState({
    x: charCard.state?.custom_image_position_x ?? 50,
    y: charCard.state?.custom_image_position_y ?? 0,
  });
  const positionSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Parse card mechanics
  const cardName = charCard.library_item?.name || '';
  const isCardActive = cardStates?.[cardName]?.is_active ?? false;
  const passiveModifiers = character ? parseCardPassiveModifiers(charCard, character, isCardActive) : [];
  const combatAbility = parseCombatAbility(charCard);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'artwork' | 'full-card') => {
    const file = e.target.files?.[0];
    if (!file || !user || !character) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      toast.error(`Image must be smaller than ${MAX_IMAGE_FILE_SIZE_MB}`);
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadCharacterImage(user.id, file, character.id);

      if (result.error || !result.url) {
        toast.error(result.error || 'Failed to upload image');
        return;
      }

      await updateCardImage(charCard.id, result.url, imageType);
      setShowImageOptions(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle image removal
  const handleRemoveImage = async () => {
    await updateCardImage(charCard.id, null);
    setShowImageOptions(false);
  };

  // Handle position change with debounced save
  const handlePositionChange = (newPosition: { x: number; y: number }) => {
    setLocalPosition(newPosition);

    // Clear existing timeout
    if (positionSaveTimeoutRef.current) {
      clearTimeout(positionSaveTimeoutRef.current);
    }

    // Debounce the save to prevent excessive API calls while dragging
    positionSaveTimeoutRef.current = setTimeout(() => {
      updateCardImagePosition(charCard.id, newPosition);
    }, 300);
  };

  // Helper to get condition icon
  const getConditionIcon = (condition?: ModifierCondition) => {
    if (!condition || condition.type === 'always') return null;
    switch (condition.type) {
      case 'when_armored':
        return <Shield size={12} className="text-gray-400" />;
      case 'when_unarmored':
        return <ShieldOff size={12} className="text-gray-400" />;
      case 'when_active':
        return <Zap size={12} className="text-yellow-400" />;
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
      case 'when_active':
        return 'While active';
      case 'loadout_domain_count':
        return `When ${condition.minCount}+ ${condition.domain} cards in loadout`;
      case 'environment':
        return condition.requirement || 'Environment requirement';
      default:
        return null;
    }
  };

  const isFull = mode === 'full';

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-zinc-800 text-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] relative"
        style={{ borderTop: `4px solid ${theme.primary}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {isFull && (
          <>
            {/* Top Header Section */}
            <div className="absolute top-0 left-0 w-full flex justify-between items-center p-3 z-10">
              {/* Top Left: Level */}
              <div
                className="relative w-12 h-16 flex items-center justify-center text-white font-eveleth font-bold text-xl"
                style={{
                  clipPath: 'polygon(0% 0%, 100% 0%, 100% 80%, 50% 100%, 0% 80%)',
                  backgroundColor: theme.primary
                }}
              >
                {tier}
              </div>

              {/* Top Right: Recall Cost */}
              <div
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-white font-eveleth font-bold text-lg shadow-md border-2"
                style={{
                  backgroundColor: theme.secondary,
                  borderColor: theme.accent
                }}
              >
                {recallCost}
                <Zap size={14} className="absolute bottom-1 right-1 text-yellow-400" />
              </div>
            </div>

            {/* Card Type Banner */}
            <div className="mt-16 pt-2 pb-1 text-center z-10">
              <span
                className="uppercase font-bold text-xs text-white px-3 py-1 rounded-full tracking-wider shadow-sm border"
                style={{
                  backgroundColor: `${theme.primary}cc`,
                  borderColor: theme.accent
                }}
              >
                {domain} - {type}
              </span>
            </div>

            {/* Card Name */}
            <div className="text-center px-4 pt-2">
              <h2 className="text-3xl font-bold font-eveleth text-white">{name}</h2>
            </div>
          </>
        )}

        {!isFull && (
          <div className="flex justify-between items-center p-4 border-b border-white/10">
            <h2 className="text-lg font-bold font-eveleth text-white">Change Art</h2>
            <button onClick={onClose} aria-label="Close" className="text-white/70 hover:text-white">
              <X size={20} />
            </button>
          </div>
        )}

        {isFull && (
          <button onClick={onClose} aria-label="Close" className="absolute top-2 right-2 text-white/70 hover:text-white bg-black/50 rounded-full p-1 z-20">
            <X size={20} />
          </button>
        )}

        {/* Card Description */}
        <div className="flex-1 overflow-y-auto px-6 py-4 text-sm leading-relaxed">
          {isFull && (
            <>
              {data?.description || data?.text ? (
                <div className="text-gray-300 text-center">
                  <MarkdownText>
                    {data.description || data.text}
                  </MarkdownText>
                </div>
              ) : (
                <p className="italic text-gray-500 text-center">No description available.</p>
              )}
            </>
          )}

          {/* Image Management Section */}
          <div className={clsx("pt-4", isFull ? "mt-6 border-t border-white/10" : "")}>
            <h3
              className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center justify-between"
              style={{ color: theme.accent }}
            >
              <span className="flex items-center gap-2">
                <ImageIcon size={14} /> Card Artwork
              </span>
              <button
                onClick={() => setShowImageOptions(!showImageOptions)}
                className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded normal-case"
              >
                {charCard.state?.custom_image_url ? 'Change' : 'Add'}
              </button>
            </h3>

            {/* Interactive Image Preview - drag to position (artwork type only) */}
            {charCard.state?.custom_image_url && charCard.state?.custom_image_type !== 'full-card' && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">
                  Drag the image to adjust position
                </p>
                <div
                  className="relative rounded-lg overflow-hidden border-2 cursor-move select-none"
                  style={{
                    borderColor: theme.primary,
                    // Match domain card art area aspect ratio: 240:160 = 1.5
                    aspectRatio: '240 / 160',
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startPosX = localPosition.x;
                    const startPosY = localPosition.y;

                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      // Calculate delta as percentage of container size
                      const deltaX = (moveEvent.clientX - startX) / 2; // Sensitivity factor
                      const deltaY = (moveEvent.clientY - startY) / 2;

                      // Invert direction: dragging right should move image left (show more right side)
                      const newX = Math.max(0, Math.min(100, startPosX - deltaX));
                      const newY = Math.max(0, Math.min(100, startPosY - deltaY));

                      handlePositionChange({ x: newX, y: newY });
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    const startX = touch.clientX;
                    const startY = touch.clientY;
                    const startPosX = localPosition.x;
                    const startPosY = localPosition.y;

                    const handleTouchMove = (moveEvent: TouchEvent) => {
                      const touchMove = moveEvent.touches[0];
                      const deltaX = (touchMove.clientX - startX) / 2;
                      const deltaY = (touchMove.clientY - startY) / 2;

                      const newX = Math.max(0, Math.min(100, startPosX - deltaX));
                      const newY = Math.max(0, Math.min(100, startPosY - deltaY));

                      handlePositionChange({ x: newX, y: newY });
                    };

                    const handleTouchEnd = () => {
                      document.removeEventListener('touchmove', handleTouchMove);
                      document.removeEventListener('touchend', handleTouchEnd);
                    };

                    document.addEventListener('touchmove', handleTouchMove);
                    document.addEventListener('touchend', handleTouchEnd);
                  }}
                >
                  <Image
                    src={charCard.state.custom_image_url}
                    alt={name}
                    fill
                    className="object-cover pointer-events-none"
                    style={{ objectPosition: `${localPosition.x}% ${localPosition.y}%` }}
                    sizes="400px"
                    draggable={false}
                  />
                  {/* Drag indicator */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 pointer-events-none">
                    <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <ImageIcon size={12} /> Drag to reposition
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                  <span>Artwork Position</span>
                  <button
                    onClick={handleRemoveImage}
                    className="text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            )}

            {/* Full Card Preview (non-interactive) */}
            {charCard.state?.custom_image_url && charCard.state?.custom_image_type === 'full-card' && (
              <div className="mb-3 relative group">
                <div className="aspect-[2/3] relative rounded-lg overflow-hidden border-2" style={{ borderColor: theme.primary }}>
                  <Image
                    src={charCard.state.custom_image_url}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                  <span>Full Card Image</span>
                  <button
                    onClick={handleRemoveImage}
                    className="text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            )}

            {/* Image Upload Options */}
            {showImageOptions && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">Choose how to display your custom image:</p>

                {/* Upload as Artwork */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg p-3 text-left transition-colors disabled:opacity-50"
                  data-type="artwork"
                >
                  <div className="flex items-start gap-3">
                    <Upload size={16} className="mt-0.5" style={{ color: theme.accent }} />
                    <div>
                      <div className="font-bold text-sm">Artwork Only</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Upload character art or scene. Text will display over the image with a gradient overlay.
                      </div>
                    </div>
                  </div>
                </button>

                {/* Upload as Full Card */}
                <button
                  onClick={() => {
                    const input = fileInputRef.current;
                    if (input) {
                      input.dataset.type = 'full-card';
                      input.click();
                    }
                  }}
                  disabled={isUploading}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg p-3 text-left transition-colors disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <Upload size={16} className="mt-0.5" style={{ color: theme.accent }} />
                    <div>
                      <div className="font-bold text-sm">Full Custom Card</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Upload a complete card image from the official site or a custom source
                      </div>
                    </div>
                  </div>
                </button>

                {isUploading && (
                  <div className="text-center text-sm text-gray-400 py-2">
                    Uploading...
                  </div>
                )}

                {/* Choose from Gallery */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                    <ImageIcon size={12} /> Choose from Gallery
                  </h4>
                  {character?.gallery_images && character.gallery_images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {character.gallery_images.map((galleryUrl, idx) => (
                        <button
                          key={idx}
                          disabled={isUploading}
                          onClick={async () => {
                            setIsUploading(true);
                            try {
                              await updateCardImage(charCard.id, galleryUrl, 'artwork');
                              setShowImageOptions(false);
                              toast.success('Card art updated from gallery');
                            } catch (error) {
                              console.error('Failed to set gallery image:', error);
                              toast.error('Failed to update card art');
                            } finally {
                              setIsUploading(false);
                            }
                          }}
                          className="aspect-square relative rounded-lg overflow-hidden border-2 border-transparent hover:border-dagger-gold transition-colors group disabled:opacity-50"
                        >
                          <Image
                            src={galleryUrl}
                            alt={`Gallery image ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="100px"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                              Select
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-white/5 rounded-lg border border-dashed border-white/10">
                      <p className="text-sm text-gray-500 italic">No gallery images yet.</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Upload images in <span className="text-dagger-gold">Character → Gallery</span> to use them here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const type = (e.target.dataset.type || 'artwork') as 'artwork' | 'full-card';
                handleImageUpload(e, type);
              }}
              data-type="artwork"
            />
          </div>

          {/* Passive Modifiers Section */}
          {isFull && passiveModifiers.length > 0 && (
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
          {isFull && combatAbility && (
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
        <div className="p-4 border-t border-white/10 flex justify-center">
          <button
            onClick={() => setShowRemoveConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg text-sm font-bold transition-colors border border-red-500/30"
          >
            <Trash2 size={14} /> Remove from Character
          </button>
        </div>
      </div>

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={async () => {
          await removeCard(charCard.id);
          toast.success(`"${name}" removed from character`);
          onClose();
        }}
        title="Remove Card"
        description={`Are you sure you want to remove "${name}" from your character? This cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}