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
import { DomainAbilityButton } from '@/components/views/playmat/domain-ability-button';
import { DomainCostsRow } from '@/components/views/playmat/domain-costs-row';
import ModifierActivationRow from '@/components/views/playmat/modifier-activation-row';
import { AttackCard } from '@/components/views/combat';
import { useCharacterStore, CharacterCard } from '@/store/character-store';
import { EnhancedAbilityCard } from '@/types/cards';
import { getSystemModifiers, calculateWeaponDamage, parseDamageRoll } from '@/lib/utils';
import {
  getEnhancement,
  getAttack,
  getRoll,
  getCosts,
  getModifiers,
  getActionType,
  hasTokens as checkHasTokens
} from '@/lib/enhancement-utils';

interface PlaymatCardProps {
  card: CharacterCard;
  enhancedData?: EnhancedAbilityCard; // Use generalized interface if needed
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
  const { character, cardStates, prepareRoll, updateHope, updateVitals } = useCharacterStore();
  const libraryItem = card.library_item;

  if (!libraryItem) return null;

  // --- Enhancement Data Extraction ---
  const enhancement = enhancedData ? getEnhancement(enhancedData) : undefined;
  const attack = enhancedData ? getAttack(enhancedData) : undefined;
  const roll = enhancedData ? getRoll(enhancedData) : undefined;
  const costs = enhancedData ? getCosts(enhancedData) : undefined;
  const actionType = enhancedData ? getActionType(enhancedData) : 'passive';
  const hasTokens = enhancedData ? checkHasTokens(enhancedData) : false;

  // --- Attack / Roll Calculation Logic (Similar to CombatView) ---
  const hasAttackOrRoll = !!(attack || roll);

  let attackCardNode = null;

  if (character && hasAttackOrRoll && enhancedData && enhancement) {
    // 1. Calculate Proficiency
    const baseProficiency = character.proficiency || 1;
    const systemProfMods = getSystemModifiers(character, 'proficiency', cardStates);
    const userProfMods = character.modifiers?.['proficiency'] || [];
    const totalProficiency = Math.max(1, baseProficiency + [...systemProfMods, ...userProfMods].reduce((acc, mod) => acc + mod.value, 0));

    // 2. Calculate Spellcast/Trait Bonus
    const rollTrait = roll?.trait || attack?.trait;
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
          const tSystem = getSystemModifiers(character, tKey, cardStates);
          const tUser = character.modifiers?.[tKey] || [];
          traitModSum = [...tSystem, ...tUser].reduce((acc, m) => acc + m.value, 0);
        }

        const spellcastBase = rawTraitValue + traitModSum;
        const spellcastMods = getSystemModifiers(character, 'spellcast', cardStates);
        const userSpellcastMods = character.modifiers?.['spellcast'] || [];
        rollBonus = spellcastBase + [...spellcastMods, ...userSpellcastMods].reduce((acc, mod) => acc + mod.value, 0);
        rollLabel = 'Spellcast';
      } else {
        const traitKey = rollTrait.toLowerCase();
        const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;
        const systemTraitMods = getSystemModifiers(character, traitKey, cardStates);
        const userTraitMods = character.modifiers?.[traitKey] || [];
        rollBonus = baseTraitValue + [...systemTraitMods, ...userTraitMods].reduce((acc, mod) => acc + mod.value, 0);
        rollLabel = rollTrait;
      }
    }

    // 3. Calculate Damage
    const baseDamage = attack?.damage;
    const finalDamage = baseDamage ? calculateWeaponDamage(baseDamage, totalProficiency) : undefined;

    // 4. Determine if Attack button should be shown based on combat_category
    // damage_bonus and passive_triggered features don't need Attack buttons
    const combatCategory = attack?.combat_category || 'passive_triggered';
    const showAttackButton = roll || combatCategory === 'standalone_attack' || combatCategory === 'roll_only';

    // 5. Render AttackCard (Mini Version)
    attackCardNode = (
      <div className="mt-2">
        <AttackCard
          id={`playmat-${card.id}`}
          name={enhancedData.name}
          trait={rollLabel || 'Roll'}
          range={attack?.range || ''}
          baseDamage={baseDamage}
          calculatedDamage={finalDamage}
          totalAttackBonus={rollBonus}
          attackModifier={0}
          damageModifier={0}
          proficiency={totalProficiency}
          onAttackRoll={showAttackButton ? () => prepareRoll(`${enhancedData.name} ${rollLabel}`, rollBonus) : undefined}
          onDamageRoll={finalDamage ? () => {
            const { dice, modifier } = parseDamageRoll(finalDamage);
            prepareRoll(`${enhancedData.name} Damage`, modifier, dice);
          } : undefined}
          additionalDamage={attack?.additional_damage}
          onAdditionalDamageRoll={(damage, label) => {
            // For additional damage, we typically assume it's dice-heavy, but might have modifier
            // Using parseDamageRoll should work for "2d6" or "1d8+2"
            // Note: It doesn't include proficiency usually for extra damage, so we use it raw.
            const { dice, modifier } = parseDamageRoll(damage);
            prepareRoll(`${enhancedData.name} ${label}`, modifier, dice);
          }}
          borderVariant={enhancement?.timing === 'reaction' ? 'reaction' : 'spell'}
          rollLabel={combatCategory === 'roll_only' ? 'Roll' : (rollLabel || 'Attack')}
          roll={roll || undefined}
        />
      </div>
    );
  }

  // --- Mechanics Tray Logic ---
  const showTokenTrack = hasTokens;
  const showFrequency = enhancement?.frequency && enhancement.frequency !== 'at_will';
  const showDuration = !!enhancement?.duration;
  const showMechanics = showTokenTrack || showFrequency || hasAttackOrRoll || showDuration;

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
        hasPassiveModifiers={!!(enhancement?.modifiers && enhancement.modifiers.length > 0)}
        hasCombatAbility={!!hasAttackOrRoll}
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
        {showTokenTrack && enhancement && (
          <CardTokenTrack
            cardName={libraryItem.name}
            maxTokens={enhancement.tokens?.max_tokens ?? null}
            tokenSource={enhancement.tokens?.token_source}
          />
        )}

        {/* Frequency */}
        {showFrequency && enhancement?.frequency && (
          <div className="flex justify-center">
            <FrequencyCheckbox
              cardName={libraryItem.name}
              frequency={enhancement.frequency}
              className="bg-white/5 px-3 py-1.5 w-full justify-center"
            />
          </div>
        )}

        {/* Modifiers with when_active conditions */}
        {(() => {
          // Use enhancedData (the full EnhancedAbilityCard) for modifier extraction
          // libraryItem.data only contains raw data (recall, description), NOT enhancement blocks
          if (!enhancedData) return null;

          const modifiers = getModifiers(enhancedData);
          const whenActiveModifiers = modifiers.filter(mod => mod.condition?.type === 'when_active');

          if (whenActiveModifiers.length === 0) return null;

          // Helper to generate condition text
          const getConditionText = (condition?: any) => {
            if (!condition) return undefined;
            switch (condition.type) {
              case 'when_active':
                return 'Activate to apply this bonus';
              case 'when_armored':
                return 'While wearing armor';
              case 'when_unarmored':
                return 'While not wearing armor';
              case 'loadout_domain_count':
                return `With ${condition.minCount}+ ${condition.domain} cards`;
              default:
                return undefined;
            }
          };

          return (
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold uppercase text-purple-400 tracking-wider text-center">
                Modifiers
              </h4>
              {whenActiveModifiers.map((mod, index) => {
                // Create a unique key for this modifier: cardName-stat-index
                const modifierKey = `${mod.stat}-${index}`;
                return (
                  <ModifierActivationRow
                    key={`${libraryItem.name}-${mod.stat}-${index}`}
                    cardName={libraryItem.name}
                    modifier={mod}
                    modifierKey={modifierKey}
                    conditionText={getConditionText(mod.condition)}
                    className="text-sm"
                  />
                );
              })}
            </div>
          );
        })()}

        {/* Persistent Effect / Duration - ONLY for cards without when_active modifiers */}
        {showDuration && enhancement?.duration && enhancedData && !getModifiers(enhancedData).some(mod => mod.condition?.type === 'when_active') && (
          <div className="flex justify-center">
            <DomainAbilityButton
              cardName={libraryItem.name}
              costType="duration"
              label={enhancement.duration === 'scene' ? 'Active (Scene)' : 'Active'}
              className="w-full justify-center"
            />
          </div>
        )}

        {/* Action Costs - Show for ALL cards with costs (including attack cards) */}
        {costs && (
          <DomainCostsRow
            cardName={libraryItem.name}
            costs={costs}
            className="flex flex-wrap gap-2 justify-center pt-1 border-t border-white/5"
          />
        )}

        {/* Embedded Attack Card */}
        {attackCardNode}

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