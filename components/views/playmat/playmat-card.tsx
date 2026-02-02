/**
 * PLAYMAT CARD WRAPPER
 * ----------------------------------------------------------------------------
 * A unified card wrapper component for domain cards on the playmat.
 *
 * FUNCTIONALITY:
 * - Displays the visual Domain Card (thumbnail) at the top
 * - Renders a header with the card name below the visual
 * - Shows collapsible description with "Info" button
 * - Renders mechanics/tokens (using MechanicsTray):
 *   - Token Tracks (for abilities with resources)
 *   - Frequency Checkboxes (once per rest, etc.)
 *   - Modifiers (passive and active)
 * - Top-right overlay buttons: Move, Info, Art, Settings
 *
 * This component bridges the gap between the static "Card" and the dynamic "Game".
 * Layout matches AttackCard standalone variant for visual consistency.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppIcons } from '@/lib/icon-utils';
import clsx from 'clsx';
import { DomainCard } from '@/components/physical-cards/domain-card';
import MechanicsTray from '@/components/shared/mechanics-tray';
import { MarkdownText } from '@/components/shared/markdown-text';
import { type CharacterCard } from '@/store/character-store';
import { useCardMechanics } from '@/hooks/useCardMechanics';
import { EnhancedAbilityCard } from '@/types/cards';
import { getEnhancement } from '@/lib/enhancement-utils';

interface PlaymatCardProps {
  card: CharacterCard;
  enhancedData?: EnhancedAbilityCard; // Use generalized interface if needed
  onMoveLocation: (location: 'loadout' | 'vault') => void;
  onView: () => void;
  onEditArt?: () => void;
  onManageModifiers?: () => void;
  onRemove?: () => void;
  hasModifiersToManage?: boolean; // Whether the card has attack/roll that would have modifiers
}

export default function PlaymatCard({
  card,
  enhancedData,
  onMoveLocation,
  onView,
  onEditArt,
  onManageModifiers,
  onRemove,
  hasModifiersToManage = false,
}: PlaymatCardProps) {
  const [showDescription, setShowDescription] = useState(false);
  const [showManageMenu, setShowManageMenu] = useState(false);
  const manageMenuRef = useRef<HTMLDivElement>(null);
  const libraryItem = card.library_item;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (manageMenuRef.current && !manageMenuRef.current.contains(event.target as Node)) {
        setShowManageMenu(false);
      }
    };

    if (showManageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showManageMenu]);

  // --- Enhancement Data Extraction ---
  const enhancement = enhancedData ? getEnhancement(enhancedData) : undefined;

  // --- Shared Mechanics Calculations ---
  const mechanics = useCardMechanics(enhancement);

  if (!libraryItem) return null;

  const isLoadout = card.location === 'loadout';

  return (
    <div
      className="relative isolate flex flex-col bg-dagger-panel border border-white/10 rounded-xl shadow-lg w-full transition-colors overflow-hidden pt-20"
    >
      {/* Visual Domain Card - centered at the top with buttons above and to the right */}
      <div className="relative px-4 -mt-16 mb-4">
        <div className="flex flex-col w-full">
          {/* Top Actions Tray - positioned above domain card, aligned right */}
          <div className="flex justify-end items-center gap-1.5 mb-2 z-40">
            {/* Toggle Location Button (Vault/Loadout) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveLocation(isLoadout ? 'vault' : 'loadout');
              }}
              className={clsx(
                "flex items-center gap-1 px-2.5 py-1 rounded-full transition-all backdrop-blur-md border text-[10px] font-bold uppercase shadow-lg",
                isLoadout
                  ? "bg-black/60 hover:bg-black/80 text-gray-300 hover:text-white border-white/20"
                  : "bg-dagger-gold/30 border-dagger-gold/50 text-dagger-gold hover:bg-dagger-gold/40 shadow-dagger-gold/10"
              )}
              aria-label={isLoadout ? `Move ${libraryItem.name} to vault` : `Move ${libraryItem.name} to loadout`}
              title={isLoadout ? "Move to Vault" : "Add to Loadout"}
            >
              <AppIcons.ui.swap size={12} />
              {isLoadout ? "Vault" : "Loadout"}
            </button>

            {/* Art Button */}
            {onEditArt && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditArt();
                }}
                className="p-1 text-white/70 hover:text-white rounded transition-colors hover:bg-white/10"
                title="Change Card Art"
                aria-label={`Change art for ${libraryItem.name}`}
              >
                <AppIcons.ui.image size={12} />
              </button>
            )}

            {/* Settings/Manage Button */}
            <div className="relative" ref={manageMenuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowManageMenu(!showManageMenu);
                }}
                className={clsx(
                  "p-1 rounded transition-colors",
                  showManageMenu
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
                title="Manage Card"
                aria-label={`Manage options for ${libraryItem.name}`}
              >
                <AppIcons.ui.settings size={12} />
              </button>

              {/* Dropdown Menu */}
              {showManageMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-48 bg-dagger-panel border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Manage Modifiers */}
                  <button
                    onClick={() => {
                      if (hasModifiersToManage && onManageModifiers) {
                        onManageModifiers();
                        setShowManageMenu(false);
                      }
                    }}
                    disabled={!hasModifiersToManage}
                    className={clsx(
                      "w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors",
                      hasModifiersToManage
                        ? "text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer"
                        : "text-gray-600 cursor-not-allowed"
                    )}
                    aria-label={`Manage modifiers for ${libraryItem.name}`}
                  >
                    <AppIcons.ui.sliders size={14} /> Manage Modifiers
                  </button>

                  {/* Move to Vault/Loadout */}
                  <button
                    onClick={() => {
                      onMoveLocation(isLoadout ? 'vault' : 'loadout');
                      setShowManageMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    {isLoadout ? (
                      <><AppIcons.ui.archive size={14} /> Move to Vault</>
                    ) : (
                      <><AppIcons.ui.swap size={14} /> Move to Loadout</>
                    )}
                  </button>

                  {/* Remove from Character */}
                  {onRemove && (
                    <button
                      onClick={() => {
                        onRemove();
                        setShowManageMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 flex items-center gap-2 transition-colors border-t border-white/5"
                    >
                      <AppIcons.ui.delete size={14} /> Remove from Character
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <DomainCard
              name={libraryItem.name}
              domain={libraryItem.domain}
              tier={libraryItem.tier || 1}
              type={libraryItem.type}
              description={libraryItem.data?.description}
              recallCost={libraryItem.data?.recall_cost ?? 0}
              customImageUrl={card.state?.custom_image_url || '/assets/card/domain-placeholder.png'}
              customImageType={card.state?.custom_image_type || 'artwork'}
              customImagePosition={{
                x: card.state?.custom_image_position_x ?? 50,
                y: card.state?.custom_image_position_y ?? 0,
              }}
              size="thumbnail"
            />
          </div>
        </div>
      </div>

      {/* Inner Card Container - bg-white/5 to match character view nested cards */}
      <div className="mx-4 mb-4 bg-white/5 rounded border border-white/5 p-3">
        {/* Header Section - Card Title with Gold All-Caps */}
        <div className="flex justify-between items-start relative mb-2">
          {/* Info button for description */}
          {libraryItem.data?.description && (
            <div className="absolute top-0 right-0 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDescription(!showDescription);
                }}
                className={clsx(
                  "transition-colors p-0.5 rounded hover:bg-white/10",
                  showDescription ? "text-dagger-gold" : "text-gray-500 hover:text-gray-300"
                )}
                aria-label={`${showDescription ? 'Hide' : 'Show'} ${libraryItem.name} description`}
                title={showDescription ? "Hide description" : "Show description"}
              >
                <AppIcons.ui.info size={12} />
              </button>
            </div>
          )}

          {/* Card Name - Gold All-Caps to match character/combat view */}
          <h4 className="text-xs font-bold text-dagger-gold uppercase tracking-wider">{libraryItem.name}</h4>
        </div>

        {/* Collapsible Description Panel */}
        {showDescription && libraryItem.data?.description && (
          <div className="text-sm text-gray-300 leading-relaxed mb-3">
            <MarkdownText>{libraryItem.data.description}</MarkdownText>
          </div>
        )}

        {/* Mechanics Section (matching character feature cards) */}
        {enhancement && (
          <div className="mt-2 pt-3 border-t border-white/10 space-y-2">
            {/* Tokens & Modifiers */}
            <MechanicsTray
              cardName={libraryItem.name}
              enhancement={enhancement}
              enhancedData={enhancedData}
              showAttackButton={mechanics.showAttackButton}
              hasAttackOrRoll={mechanics.hasAttackOrRoll}
              rollBonus={mechanics.rollBonus}
              rollLabel={mechanics.rollLabel}
              finalDamage={mechanics.finalDamage}
              additionalDamage={enhancement.attack?.additional_damage}
              costMode="uncontrolled"
              variant="nested"
            />
          </div>
        )}
      </div>
    </div>
  );
}
