/**
 * PLAYMAT CARD WRAPPER
 * ----------------------------------------------------------------------------
 * A smart wrapper component for domain cards on the playmat.
 *
 * FUNCTIONALITY:
 * - Displays the visual Domain Card (thumbnail)
 * - Renders a "Mechanics Tray" below the card containing:
 *   - Token Tracks (for abilities with resources)
 *   - Frequency Checkboxes (once per rest, etc.)
 *   - Embedded Attack/Roll buttons (using AttackCard)
 *   - Move to Vault / Loadout controls
 *
 * This component bridges the gap between the static "Card" and the dynamic "Game".
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Box, ArrowRightLeft, Image as ImageIcon, Trash2, Info, Settings, Sliders } from 'lucide-react';
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
      className="relative isolate flex flex-col items-center gap-2 p-2 pt-14 bg-dagger-panel border border-white/10 rounded-xl shadow-lg w-full transition-colors"
    >
      {/* Visual Domain Card */}
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
        hasPassiveModifiers={!!(enhancement?.modifiers && enhancement.modifiers.length > 0)}
        hasCombatAbility={!!mechanics.hasAttackOrRoll}
      />

      {/* Top Right Icon Overlay - positioned over top padding area */}
      <div className="absolute top-3 right-3 z-40 flex items-center gap-1.5">
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
          <ArrowRightLeft size={12} />
          {isLoadout ? "Vault" : "Loadout"}
        </button>

        {/* Info Toggle */}
        {libraryItem.data?.description && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDescription(!showDescription);
            }}
            className={clsx(
              "p-1 rounded transition-colors backdrop-blur-sm",
              showDescription
                ? "bg-dagger-gold/30 text-dagger-gold border border-dagger-gold/50"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
            aria-label={`${showDescription ? 'Hide' : 'Show'} ${libraryItem.name} description`}
            title={showDescription ? "Hide description" : "Show description"}
          >
            <Info size={12} />
          </button>
        )}

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
            <ImageIcon size={12} />
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
            <Settings size={12} />
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
                <Sliders size={14} /> Manage Modifiers
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
                  <><Box size={14} /> Move to Vault</>
                ) : (
                  <><ArrowRightLeft size={14} /> Move to Loadout</>
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
                  <Trash2 size={14} /> Remove from Character
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Description Panel */}
      {showDescription && libraryItem.data?.description && (
        <div className="w-full p-3 bg-white/5 rounded-lg border border-white/5 text-sm text-gray-300">
          <MarkdownText>{libraryItem.data.description}</MarkdownText>
        </div>
      )}

      {/* Mechanics Tray */}
      {enhancement && (
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
        />
      )}
    </div>
  );
}
