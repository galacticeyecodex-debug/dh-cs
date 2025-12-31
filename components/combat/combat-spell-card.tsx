/**
 * COMBAT SPELL CARD
 * ----------------------------------------------------------------------------
 * Renders a spell/ability in Combat View using the shared AttackCard component.
 * Acts as a "smart container" that prepares data and handles state for AttackCard.
 *
 * Key Features:
 * - Calculates proficiency and modifiers for spells
 * - Manages card state (tokens, frequency)
 * - Adapts layout for Reaction/Action types
 * - Integrates with dice roller
 */

'use client';

import React from 'react';
import AttackCard from './attack-card';
import MarkStressButton from './mark-stress-button';
import SpendHopeButton from './spend-hope-button';
import FrequencyCheckbox from './frequency-checkbox';
import CardTokenTrack from './card-token-track';
import { useCharacterStore } from '@/store/character-store';
import { getSystemModifiers, parseDamageRoll, calculateWeaponDamage } from '@/lib/utils';
import { getActionTypeLabel } from '@/lib/card-parser';
import type { EnhancedAbilityCard, Frequency } from '@/types/cards';

interface CombatSpellCardProps {
  card: EnhancedAbilityCard;
  onPrepareRoll: (name: string, modifier: number, dice?: string) => void;
  onManageModifiers?: () => void;
  className?: string;
}

export default function CombatSpellCard({
  card,
  onPrepareRoll,
  onManageModifiers,
  className,
}: CombatSpellCardProps) {
  const { character, cardStates } = useCharacterStore();

  if (!character) return null;

  // Get total proficiency
  const baseProficiency = character.proficiency || 1;
  const systemProfMods = getSystemModifiers(character, 'proficiency');
  const userProfMods = character.modifiers?.['proficiency'] || [];
  const totalProficiency = Math.max(1, baseProficiency + [...systemProfMods, ...userProfMods].reduce((acc, mod) => acc + mod.value, 0));

  // Calculate spellcast modifier
  const spellcastTraitName = character.spellcast_trait || character.subclass_data?.data?.spellcast_trait;
  const rawTraitValue = spellcastTraitName
    ? (character.stats[spellcastTraitName.toLowerCase() as keyof typeof character.stats] || 0)
    : (character.spellcast || 0);

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
  const totalSpellcast = spellcastBase + [...spellcastMods, ...userSpellcastMods].reduce((acc, mod) => acc + mod.value, 0);

  // Determine roll trait and bonus
  let rollBonus = 0;
  let rollLabel = '';

  if (card.roll?.trait) {
    const traitKey = card.roll.trait.toLowerCase();
    if (traitKey === 'spellcast') {
      rollBonus = totalSpellcast;
      rollLabel = 'Spellcast';
    } else {
      const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;
      const systemTraitMods = getSystemModifiers(character, traitKey);
      const userTraitMods = character.modifiers?.[traitKey] || [];
      rollBonus = baseTraitValue + [...systemTraitMods, ...userTraitMods].reduce((acc, mod) => acc + mod.value, 0);
      rollLabel = card.roll.trait;
    }
  } else if (card.attack?.trait) {
    const traitKey = card.attack.trait.toLowerCase();
    if (traitKey === 'spellcast') {
      rollBonus = totalSpellcast;
      rollLabel = 'Spellcast';
    } else {
      const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;
      const systemTraitMods = getSystemModifiers(character, traitKey);
      const userTraitMods = character.modifiers?.[traitKey] || [];
      rollBonus = baseTraitValue + [...systemTraitMods, ...userTraitMods].reduce((acc, mod) => acc + mod.value, 0);
      rollLabel = card.attack.trait;
    }
  }

  // Calculate damage
  const baseDamage = card.attack?.damage;
  const finalDamage = baseDamage ? calculateWeaponDamage(baseDamage, totalProficiency) : undefined;

  // Check if ability is used (for frequency-limited abilities)
  const cardState = cardStates?.[card.name];
  const isUsed = getIsUsed(cardState, card.frequency);

  // Prepare custom badges
  const badges = [];
  if (card.roll?.difficulty) {
    badges.push({ label: `DC ${card.roll.difficulty}` });
  }

  // Determine border variant
  const borderVariant = card.action_type === 'reaction' ? 'reaction' : 'spell';

  // Prepare callbacks
  const handleAttackRoll = rollLabel ? () => {
    onPrepareRoll(`${card.name} ${rollLabel} Roll`, rollBonus);
  } : undefined;

  const handleDamageRoll = finalDamage ? () => {
    const { dice, modifier } = parseDamageRoll(finalDamage);
    onPrepareRoll(`${card.name} Damage`, modifier, dice);
  } : undefined;

  return (
    <div className={className}>
      <AttackCard
        id={card.name}
        name={card.name}
        trait={rollLabel || 'No Roll'} // Fallback, though if handleAttackRoll is undefined, button won't show
        range={card.attack?.range || ''}
        baseDamage={baseDamage}
        calculatedDamage={finalDamage}
        totalAttackBonus={rollBonus}
        attackModifier={0} // Spell modifiers not currently tracked separately like weapons
        damageModifier={0}
        proficiency={totalProficiency}
        onAttackRoll={handleAttackRoll}
        onDamageRoll={handleDamageRoll}
        onManageModifiers={onManageModifiers}
        damageType={card.attack?.damage_type}
        badges={badges}
        borderVariant={borderVariant}
        actionType={card.action_type}
        rollLabel={rollLabel}
        isUsed={isUsed}
        tokenTrack={card.has_tokens ? (
          <CardTokenTrack
            cardName={card.name}
            maxTokens={card.max_tokens ?? null}
            tokenSource={card.token_source}
          />
        ) : undefined}
        frequency={card.frequency && card.frequency !== 'at_will' ? (
          <FrequencyCheckbox
            cardName={card.name}
            frequency={card.frequency}
          />
        ) : undefined}
        customActions={
          (card.costs?.stress || card.costs?.hope) ? (
            <>
              {card.costs?.stress && (
                <MarkStressButton
                  cost={card.costs.stress}
                  size="sm"
                />
              )}
              {card.costs?.hope && (
                <SpendHopeButton
                  cost={card.costs.hope}
                  size="sm"
                />
              )}
            </>
          ) : undefined
        }
      />
    </div>
  );
}

/**
 * Helper to determine if card is used based on frequency type
 */
function getIsUsed(
  cardState: { used_this_rest?: boolean; used_this_long_rest?: boolean; used_this_session?: boolean } | undefined,
  frequency?: Frequency
): boolean {
  if (!cardState || !frequency || frequency === 'at_will') return false;

  switch (frequency) {
    case 'once_per_rest':
      return cardState.used_this_rest ?? false;
    case 'once_per_long_rest':
      return cardState.used_this_long_rest ?? false;
    case 'once_per_session':
      return cardState.used_this_session ?? false;
    default:
      return false;
  }
}