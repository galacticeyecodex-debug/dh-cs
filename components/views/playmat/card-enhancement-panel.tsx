/**
 * CARD ENHANCEMENT PANEL
 * ----------------------------------------------------------------------------
 * A panel that appears below domain cards in the detail modal, providing
 * interactive elements for costs, tokens, and frequency tracking.
 *
 * This component is designed to be placed BELOW the physical card representation
 * to maintain fidelity with the actual Daggerheart cards while adding digital
 * functionality.
 *
 * Key Features:
 * - Action type badge (Attack, Reaction, Passive, etc.)
 * - Range and target type indicators
 * - MarkStressButton and SpendHopeButton for costs
 * - CardTokenTrack for token-based abilities
 * - FrequencyCheckbox for once-per-rest/session abilities
 * - Roll buttons for spellcast/attack rolls
 */

'use client';

import React from 'react';
import { Target, Zap, MapPin, Skull } from 'lucide-react';
import clsx from 'clsx';
import { DomainAbilityButton } from './domain-ability-button';
import FrequencyCheckbox from '@/components/views/playmat/frequency-checkbox';
import CardTokenTrack from '@/components/views/playmat/card-token-track';
import { useCharacterStore } from '@/store/character-store';
import { getSystemModifiers, parseDamageRoll, calculateWeaponDamage } from '@/lib/utils';
import { getActionTypeLabel, getFrequencyLabel } from '@/lib/card-parser';
import type { EnhancedAbilityCard } from '@/types/cards';

interface CardEnhancementPanelProps {
  card: EnhancedAbilityCard;
  className?: string;
}

export default function CardEnhancementPanel({
  card,
  className,
}: CardEnhancementPanelProps) {
  const { character, prepareRoll } = useCharacterStore();

  if (!character) return null;

  const { enhancement } = card;
  // Fallback if enhancement is missing (shouldn't happen for valid cards)
  if (!enhancement) return null;

  // Check if there's anything to show
  const hasCosts = enhancement.costs?.stress || enhancement.costs?.hope;
  const hasTokens = enhancement.tokens?.has_tokens;
  const hasFrequency = enhancement.frequency && enhancement.frequency !== 'at_will';
  const hasActionInfo = !!enhancement.action_type;
  const hasRange = enhancement.attack?.range;
  const hasTargets = enhancement.attack?.targets;
  const hasRoll = enhancement.roll || enhancement.attack;
  const hasDamage = enhancement.attack?.damage;
  const hasDuration = !!enhancement.duration;

  // If nothing to enhance, don't render
  if (!hasCosts && !hasTokens && !hasFrequency && !hasActionInfo && !hasRange && !hasRoll && !hasDuration) {
    return null;
  }

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

  if (enhancement.roll?.trait) {
    const traitKey = enhancement.roll.trait.toLowerCase();
    if (traitKey === 'spellcast') {
      rollBonus = totalSpellcast;
      rollLabel = 'Spellcast';
    } else {
      const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;
      const systemTraitMods = getSystemModifiers(character, traitKey);
      const userTraitMods = character.modifiers?.[traitKey] || [];
      rollBonus = baseTraitValue + [...systemTraitMods, ...userTraitMods].reduce((acc, mod) => acc + mod.value, 0);
      rollLabel = enhancement.roll.trait;
    }
  } else if (enhancement.attack?.trait) {
    const traitKey = enhancement.attack.trait.toLowerCase();
    if (traitKey === 'spellcast') {
      rollBonus = totalSpellcast;
      rollLabel = 'Spellcast';
    } else {
      const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;
      const systemTraitMods = getSystemModifiers(character, traitKey);
      const userTraitMods = character.modifiers?.[traitKey] || [];
      rollBonus = baseTraitValue + [...systemTraitMods, ...userTraitMods].reduce((acc, mod) => acc + mod.value, 0);
      rollLabel = enhancement.attack.trait;
    }
  }

  // Calculate damage
  const baseDamage = enhancement.attack?.damage;
  const finalDamage = baseDamage ? calculateWeaponDamage(baseDamage, totalProficiency) : undefined;

  // Target type labels
  const targetLabel = enhancement.attack?.targets === 'all_in_range'
    ? 'All in Range'
    : enhancement.attack?.targets === 'allies_in_range'
      ? 'All Allies'
      : enhancement.attack?.targets === 'single'
        ? 'Single Target'
        : enhancement.attack?.targets === 'self'
          ? 'Self'
          : undefined;

  return (
    <div className={clsx('border-t border-white/10 pt-4 space-y-3', className)}>
      {/* Info Bar: Action Type, Range, Targets */}
      {(hasActionInfo || hasRange || hasTargets || enhancement.roll?.difficulty) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {hasActionInfo && (
            <span className={clsx(
              'flex items-center gap-1 px-2 py-1 rounded font-medium',
              enhancement.action_type === 'attack' && 'bg-red-900/30 text-red-400 border border-red-500/30'
            )}>
              <Zap size={12} />
              {getActionTypeLabel(enhancement.action_type!)}
            </span>
          )}
          {hasRange && (
            <span className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded font-medium text-gray-300">
              <MapPin size={12} />
              {enhancement.attack?.range}
            </span>
          )}
          {targetLabel && (
            <span className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded font-medium text-gray-300">
              <Target size={12} />
              {targetLabel}
            </span>
          )}
          {enhancement.roll?.difficulty && (
            <span className="flex items-center gap-1 px-2 py-1 bg-purple-900/30 text-purple-400 border border-purple-500/30 rounded font-medium">
              DC {enhancement.roll.difficulty}
            </span>
          )}
          {hasFrequency && (
            <span className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded font-medium text-gray-400">
              {getFrequencyLabel(enhancement.frequency!)}
            </span>
          )}
        </div>
      )}

      {/* Damage indicator */}
      {finalDamage && (
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 px-2 py-1 bg-red-900/30 text-red-400 border border-red-500/30 rounded font-medium">
            <Skull size={12} />
            {finalDamage} {enhancement.attack?.damage_type || 'damage'}
          </span>
        </div>
      )}

      {/* Token Track */}
      {hasTokens && (
        <CardTokenTrack
          cardName={card.name}
          maxTokens={enhancement.tokens?.max_tokens ?? null}
          tokenSource={enhancement.tokens?.token_source}
        />
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Cost buttons */}
        {enhancement.costs?.stress && (
          <DomainAbilityButton 
            cardName={card.name}
            costType="stress" 
            costValue={enhancement.costs.stress} 
          />
        )}
        {enhancement.costs?.hope && (
          <DomainAbilityButton 
            cardName={card.name}
            costType="hope" 
            costValue={enhancement.costs.hope} 
          />
        )}

        {/* Duration/Active button */}
        {enhancement.duration && (
          <DomainAbilityButton
            cardName={card.name}
            costType="duration"
            label={enhancement.duration === 'scene' ? 'Active (Scene)' : 'Active'}
          />
        )}

        {/* Roll button */}
        {rollLabel && (
          <button
            onClick={() => prepareRoll(`${card.name} ${rollLabel} Roll`, rollBonus)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-500/30 rounded text-sm font-medium text-purple-300 transition-colors"
          >
            <Zap size={14} className="text-yellow-400" />
            Roll {rollLabel} ({rollBonus >= 0 ? `+${rollBonus}` : rollBonus})
          </button>
        )}

        {/* Damage button */}
        {finalDamage && (
          <button
            onClick={() => {
              const { dice, modifier } = parseDamageRoll(finalDamage);
              prepareRoll(`${card.name} Damage`, modifier, dice);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 rounded text-sm font-medium text-red-300 transition-colors"
          >
            <Skull size={14} />
            Roll Damage
          </button>
        )}

        {/* Frequency checkbox */}
        {hasFrequency && (
          <FrequencyCheckbox
            cardName={card.name}
            frequency={enhancement.frequency!}
          />
        )}
      </div>
    </div>
  );
}
