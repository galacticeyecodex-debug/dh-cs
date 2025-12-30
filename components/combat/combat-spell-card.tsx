/**
 * COMBAT SPELL CARD
 * ----------------------------------------------------------------------------
 * Renders a spell/ability in Combat View with the same layout as weapon cards.
 * Includes interactive cost buttons and frequency checkboxes.
 *
 * Key Features:
 * - Matches weapon card visual pattern (name, badges, damage, action bar)
 * - Adds MarkStressButton and SpendHopeButton for ability costs
 * - Adds FrequencyCheckbox for once-per-rest/session abilities
 * - Integrates with dice roller for attack and damage rolls
 */

'use client';

import React from 'react';
import { Sparkles, Skull, Zap } from 'lucide-react';
import clsx from 'clsx';
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
  onClick?: () => void;
  className?: string;
}

export default function CombatSpellCard({
  card,
  onPrepareRoll,
  onClick,
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

  // Determine border color based on action type
  const borderColor = card.action_type === 'reaction'
    ? 'border-orange-500/30 hover:border-orange-500/50'
    : 'border-purple-500/30 hover:border-purple-500/50';

  const bgColor = card.action_type === 'reaction'
    ? 'bg-orange-900/20 border-orange-500/30'
    : 'bg-purple-900/20 border-purple-500/30';

  const textColor = card.action_type === 'reaction'
    ? 'text-orange-300'
    : 'text-purple-300';

  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-dagger-panel border rounded-xl overflow-hidden cursor-pointer transition-colors',
        borderColor,
        isUsed && 'opacity-50',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-serif font-bold text-white text-lg flex items-center gap-2 flex-wrap">
            {card.name}
            {/* Action type badge */}
            {card.action_type && card.action_type !== 'passive' && (
              <span className={clsx(
                'text-[10px] px-1.5 py-0.5 rounded font-bold uppercase',
                card.action_type === 'reaction'
                  ? 'bg-orange-900/30 text-orange-400 border border-orange-500/30'
                  : 'bg-purple-900/30 text-purple-400 border border-purple-500/30'
              )}>
                {getActionTypeLabel(card.action_type)}
              </span>
            )}
          </h4>
          <div className="flex gap-2 text-xs text-gray-400 mt-1 flex-wrap">
            {rollLabel && (
              <span className={clsx('uppercase px-1.5 py-0.5 rounded', bgColor)}>
                {rollLabel}
              </span>
            )}
            {card.attack?.range && (
              <span className="uppercase bg-white/10 px-1.5 py-0.5 rounded">
                {card.attack.range}
              </span>
            )}
            {card.attack?.damage_type && (
              <span className="uppercase bg-white/10 px-1.5 py-0.5 rounded">
                {card.attack.damage_type}
              </span>
            )}
            {card.roll?.difficulty && (
              <span className="uppercase bg-white/10 px-1.5 py-0.5 rounded">
                DC {card.roll.difficulty}
              </span>
            )}
          </div>
        </div>
        {finalDamage && (
          <div className="text-right ml-4">
            <div className={clsx('text-xl font-bold', textColor)}>{finalDamage}</div>
            <div className="text-[10px] text-gray-500 uppercase">
              {baseDamage} × {totalProficiency}
            </div>
          </div>
        )}
      </div>

      {/* Token Track (if applicable) */}
      {card.has_tokens && (
        <div className="px-4 pb-2">
          <CardTokenTrack
            cardName={card.name}
            maxTokens={card.max_tokens ?? null}
            tokenSource={card.token_source}
          />
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-black/40 p-2 flex flex-wrap gap-2 items-center">
        {/* Cost buttons */}
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

        {/* Roll buttons */}
        {rollLabel && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrepareRoll(`${card.name} ${rollLabel} Roll`, rollBonus);
            }}
            disabled={isUsed}
            className={clsx(
              'flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors',
              bgColor,
              textColor,
              isUsed ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-60'
            )}
          >
            <Zap size={16} className="text-yellow-400" />
            {rollLabel} ({rollBonus >= 0 ? `+${rollBonus}` : rollBonus})
          </button>
        )}

        {finalDamage && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const { dice, modifier } = parseDamageRoll(finalDamage);
              onPrepareRoll(`${card.name} Damage`, modifier, dice);
            }}
            disabled={isUsed}
            className={clsx(
              'flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors',
              bgColor,
              textColor,
              isUsed ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-60'
            )}
          >
            <Skull size={16} className="text-red-400" /> Damage
          </button>
        )}

        {/* Frequency checkbox */}
        {card.frequency && card.frequency !== 'at_will' && (
          <FrequencyCheckbox
            cardName={card.name}
            frequency={card.frequency}
          />
        )}
      </div>
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
