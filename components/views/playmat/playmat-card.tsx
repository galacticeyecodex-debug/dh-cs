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

import React from 'react';
import { Box, ArrowRightLeft, Settings, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';
import { DomainCard } from '@/components/physical-cards/domain-card';
import CardTokenTrack from '@/components/views/playmat/card-token-track';
import FrequencyCheckbox from '@/components/views/playmat/frequency-checkbox';
import ActiveEffectCheckbox from '@/components/views/playmat/active-effect-checkbox';
import { AttackCard, MarkStressButton, SpendHopeButton } from '@/components/views/combat';
import { useCharacterStore, CharacterCard } from '@/store/character-store';
import { EnhancedAbilityCard } from '@/types/cards';
import { getSystemModifiers, calculateWeaponDamage, parseDamageRoll } from '@/lib/utils';

interface PlaymatCardProps {
  card: CharacterCard;
  enhancedData?: EnhancedAbilityCard;
  onMoveLocation: (location: 'loadout' | 'vault') => void;
  onView: () => void;
  onEditArt?: () => void;
  onManageModifiers?: () => void;
}

export default function PlaymatCard({
  card,
  enhancedData,
  onMoveLocation,
  onView,
  onEditArt,
  onManageModifiers,
}: PlaymatCardProps) {
  const { character, prepareRoll, updateHope, updateVitals } = useCharacterStore();
  const libraryItem = card.library_item;

  if (!libraryItem) return null;

  // --- Attack / Roll Calculation Logic (Similar to CombatView) ---
  // If the card has an attack or roll, we prepare the data for AttackCard
  const hasAttack = enhancedData?.attack || enhancedData?.roll;

  let attackCardNode = null;

  if (character && hasAttack && enhancedData) {
    // 1. Calculate Proficiency
    const baseProficiency = character.proficiency || 1;
    const systemProfMods = getSystemModifiers(character, 'proficiency');
    const userProfMods = character.modifiers?.['proficiency'] || [];
    const totalProficiency = Math.max(1, baseProficiency + [...systemProfMods, ...userProfMods].reduce((acc, mod) => acc + mod.value, 0));

    // 2. Calculate Spellcast/Trait Bonus
    const rollTrait = enhancedData.roll?.trait || enhancedData.attack?.trait;
    let rollBonus = 0;
    let rollLabel = '';

    if (rollTrait) {
      if (rollTrait.toLowerCase() === 'spellcast') {
        const spellcastTraitName = character.spellcast_trait || character.subclass_data?.data?.spellcast_trait;
        const rawTraitValue = spellcastTraitName
          ? (character.stats[spellcastTraitName.toLowerCase() as keyof typeof character.stats] || 0)
          : (character.spellcast || 0);

        // Add trait modifiers
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
        rollBonus = spellcastBase + [...spellcastMods, ...userSpellcastMods].reduce((acc, mod) => acc + mod.value, 0);
        rollLabel = 'Spellcast';
      } else {
        const traitKey = rollTrait.toLowerCase();
        const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;
        const systemTraitMods = getSystemModifiers(character, traitKey);
        const userTraitMods = character.modifiers?.[traitKey] || [];
        rollBonus = baseTraitValue + [...systemTraitMods, ...userTraitMods].reduce((acc, mod) => acc + mod.value, 0);
        rollLabel = rollTrait;
      }
    }

    // 3. Calculate Damage
    const baseDamage = enhancedData.attack?.damage;
    const finalDamage = baseDamage ? calculateWeaponDamage(baseDamage, totalProficiency) : undefined;

    // 4. Render AttackCard (Mini Version)
    attackCardNode = (
      <div className="mt-2">
        <AttackCard
          id={`playmat-${card.id}`}
          name={enhancedData.name} // Usually we might want simpler name or just "Attack"
          trait={rollLabel || 'Roll'}
          range={enhancedData.attack?.range || ''}
          baseDamage={baseDamage}
          calculatedDamage={finalDamage}
          totalAttackBonus={rollBonus}
          attackModifier={0}
          damageModifier={0}
          proficiency={totalProficiency}
          onAttackRoll={() => prepareRoll(`${enhancedData.name} ${rollLabel}`, rollBonus)}
          onDamageRoll={finalDamage ? () => {
            const { dice, modifier } = parseDamageRoll(finalDamage);
            prepareRoll(`${enhancedData.name} Damage`, modifier, dice);
          } : undefined}
          borderVariant={enhancedData.action_type === 'reaction' ? 'reaction' : 'spell'}
          // For playmat, we might want a simplified look? 
          // AttackCard is already quite dense. Let's use it as is for consistency.
          rollLabel={rollLabel || 'Roll'}
          costs={enhancedData.costs}
          onSpendHope={() => character && updateHope(character.hope - (enhancedData.costs?.hope || 0))}
          onMarkStress={() => character && updateVitals('stress_current', character.vitals.stress_current + (enhancedData.costs?.stress || 0))}
        />
      </div>
    );
  }

  // --- Mechanics Tray Logic ---
  const showTokenTrack = enhancedData?.has_tokens;
  const showFrequency = enhancedData?.frequency && enhancedData.frequency !== 'at_will';
  const showDuration = !!enhancedData?.duration;
  const showMechanics = showTokenTrack || showFrequency || hasAttack || showDuration;

  const isLoadout = card.location === 'loadout';

  return (
    <div
      className="relative flex flex-col items-center gap-2 p-2 bg-dagger-panel border border-white/10 rounded-xl shadow-lg w-full transition-colors"
    >
      {/* Visual Domain Card */}
      <DomainCard
        name={libraryItem.name}
        domain={libraryItem.domain}
        tier={libraryItem.tier || 1}
        type={libraryItem.type}
        description={libraryItem.data?.description}
        recallCost={libraryItem.data?.recall ?? 0}
        customImageUrl={card.state?.custom_image_url || '/assets/card/domain-placeholder.png'}
        customImageType={card.state?.custom_image_type || 'artwork'}
        customImagePosition={{
          x: card.state?.custom_image_position_x ?? 50,
          y: card.state?.custom_image_position_y ?? 0,
        }}
        size="thumbnail"
        // variant="default" is implied
        hasPassiveModifiers={!!(enhancedData?.modifiers && enhancedData.modifiers.length > 0)}
        hasCombatAbility={!!hasAttack}
      />

      {/* Modifiers Button (Top Right Overlay) */}
      {onEditArt && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditArt();
          }}
          className="absolute top-2 right-2 z-40 p-1.5 bg-black/50 hover:bg-black/80 text-white/70 hover:text-white rounded-full transition-colors backdrop-blur-sm border border-white/10"
          title="Change Card Art"
        >
          {/* Future: This button may be used to manage card-specific modifiers (TBD) */}
          <Settings size={14} />
        </button>
      )}

      {/* Mechanics Tray */}
      <div
        className="bg-black/40 border border-white/10 rounded-lg p-2 space-y-2 w-full"
        onClick={(e) => {
          // Allow clicking empty space in tray to trigger View (bubble up)
        }}
      >
        {/* Token Track */}
        {showTokenTrack && (
          <CardTokenTrack
            cardName={libraryItem.name}
            maxTokens={enhancedData?.max_tokens ?? null}
            tokenSource={enhancedData?.token_source}
          />
        )}

        {/* Frequency */}
        {showFrequency && enhancedData?.frequency && (
          <div className="flex justify-center">
            <FrequencyCheckbox
              cardName={libraryItem.name}
              frequency={enhancedData.frequency}
              className="bg-white/5 px-3 py-1.5 w-full justify-center"
            />
          </div>
        )}

        {/* Persistent Effect / Duration */}
        {enhancedData?.duration && (
          <div className="flex justify-center">
            <ActiveEffectCheckbox
              cardName={libraryItem.name}
              duration={enhancedData.duration}
              className="bg-white/5 px-3 py-1.5 w-full justify-center"
            />
          </div>
        )}

        {/* Embedded Attack Card */}
        {attackCardNode}

        {/* Action Costs (for non-attack cards) */}
        {!hasAttack && enhancedData?.costs && (
          <div className="flex flex-wrap gap-2 justify-center pt-1 border-t border-white/5">
            {enhancedData.costs.hope && (
              <SpendHopeButton
                cost={enhancedData.costs.hope}
                onSpend={() => character && updateHope(character.hope - (enhancedData.costs?.hope || 0))}
                disabled={!character || character.hope < (enhancedData.costs?.hope || 0)}
              />
            )}
            {enhancedData.costs.stress && (
              <MarkStressButton
                cost={enhancedData.costs.stress}
                onMark={() => character && updateVitals('stress_current', character.vitals.stress_current + (enhancedData.costs?.stress || 0))}
                disabled={!character || character.vitals.stress_current + (enhancedData.costs?.stress || 0) > character.vitals.stress_max}
              />
            )}
          </div>
        )}

        {/* Actions Row */}
        <div className="pt-1 border-t border-white/5 flex gap-2">
          {/* Change Art */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onEditArt) {
                onEditArt();
              } else {
                onView();
              }
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-md text-[10px] font-medium text-gray-400 hover:text-white transition-colors"
          >
            <ImageIcon size={12} /> Change Art
          </button>

          {/* Move Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveLocation(isLoadout ? 'vault' : 'loadout');
            }}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold transition-colors border",
              isLoadout
                ? "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                : "bg-dagger-gold/10 border-dagger-gold/30 text-dagger-gold hover:bg-dagger-gold/20"
            )}
          >
            {isLoadout ? (
              <>
                <Box size={12} /> To Vault
              </>
            ) : (
              <>
                <ArrowRightLeft size={12} /> To Loadout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}