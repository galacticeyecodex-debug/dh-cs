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
import { DomainAbilityButton } from '@/components/shared/ability-cost-button';
import { DomainCostsRow } from '@/components/shared/ability-costs-row';
import FrequencyCheckbox from '@/components/shared/frequency-checkbox';
import CardTokenTrack from '@/components/shared/token-track';
import ModifierActivationRow from '@/components/shared/modifier-activation-row';
import { useCharacterStore } from '@/store/character-store';
import { parseDamageRoll } from '@/lib/utils';
import { useCardMechanics } from '@/hooks/useCardMechanics';
import { getActionTypeLabel, getFrequencyLabel } from '@/lib/card-parser';
import { getEnhancement, getModifiers } from '@/lib/enhancement-utils';
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

  // Get the effective enhancement (override if present, else standard)
  const enhancement = getEnhancement(card);

  // Use shared hook for calculations - must be called before any early returns
  const mechanics = useCardMechanics(enhancement);

  if (!character) return null;
  if (!enhancement) return null;

  // Check if there's anything to show
  const hasCosts = enhancement.costs?.stress || enhancement.costs?.hope;
  const hasGains = enhancement.gains?.hope || enhancement.gains?.stress_clear ||
    enhancement.gains?.hit_points_clear || enhancement.gains?.armor_slots_clear;
  const hasTokens = enhancement.tokens?.has_tokens;
  const hasFrequency = enhancement.frequency && enhancement.frequency !== 'at_will';
  const hasActionInfo = !!enhancement.action_type;
  const hasRange = enhancement.attack?.range;
  const hasTargets = enhancement.attack?.targets;
  const hasDuration = !!enhancement.duration;

  // If nothing to enhance, don't render
  if (!hasCosts && !hasGains && !hasTokens && !hasFrequency && !hasActionInfo && !hasRange && !mechanics.hasAttackOrRoll && !hasDuration) {
    return null;
  }

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
      {mechanics.finalDamage && (
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 px-2 py-1 bg-red-900/30 text-red-400 border border-red-500/30 rounded font-medium">
            <Skull size={12} />
            {mechanics.finalDamage} {enhancement.attack?.damage_type || 'damage'}
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

      {/* Modifiers display */}
      {(() => {
        const modifiers = getModifiers(card);

        if (modifiers.length === 0) return null;

        // Helper to generate condition text
        const getConditionText = (condition?: { type: string; domain?: string; minCount?: number }) => {
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
            case 'always':
              return 'Always active';
            default:
              return undefined;
          }
        };

        // Helper to format stat names for display
        const formatStat = (stat: string) => {
          return stat
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        };

        // Helper to format modifier value
        const formatValue = (value: number, formula?: string) => {
          if (formula) {
            // Format formulas like "half_agility" or "strength"
            const formatted = formula
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            return `+${formatted}`;
          }
          return value >= 0 ? `+${value}` : `${value}`;
        };

        return (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-purple-400 tracking-wider">
              Modifiers
            </h4>
            {modifiers.map((mod, index) => {
              const modifierKey = `${mod.stat}-${index}`;

              // For when_active modifiers, use the activation row with toggle
              // For auto-activate conditions (loadout_domain_count, when_armored, etc.), also use activation row
              const isActivatableCondition = mod.condition?.type === 'when_active' ||
                mod.condition?.type === 'loadout_domain_count' ||
                mod.condition?.type === 'when_armored' ||
                mod.condition?.type === 'when_unarmored';

              if (isActivatableCondition) {
                return (
                  <ModifierActivationRow
                    key={`${card.name}-${mod.stat}-${index}`}
                    cardName={card.name}
                    modifier={mod}
                    modifierKey={modifierKey}
                    conditionText={getConditionText(mod.condition)}
                  />
                );
              }

              // For other modifiers (passive/always), show a read-only info row
              return (
                <div
                  key={`${card.name}-${mod.stat}-${index}`}
                  className="flex items-center justify-between gap-2 p-2 rounded bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200">
                      {formatStat(mod.stat)}
                    </span>
                    <span className="text-sm font-bold text-green-400">
                      {formatValue(mod.value, mod.formula)}
                    </span>
                  </div>
                  {getConditionText(mod.condition) && (
                    <span className="text-xs text-gray-400 italic">
                      {getConditionText(mod.condition)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Cost buttons */}
        <DomainCostsRow
          cardName={card.name}
          displayName={card.name}
          costs={enhancement.costs || undefined}
          className="flex flex-wrap gap-2"
        />

        {/* Gain buttons (e.g., "Gain 3 Hope" for A Soldier's Bond) */}
        {enhancement.gains?.hope && (
          <DomainAbilityButton
            cardName={card.name}
            displayName={card.name}
            costType="hope_gain"
            costValue={enhancement.gains.hope}
          />
        )}
        {enhancement.gains?.stress_clear && (
          <DomainAbilityButton
            cardName={card.name}
            displayName={card.name}
            costType="stress_clear"
            costValue={enhancement.gains.stress_clear}
          />
        )}
        {enhancement.gains?.hit_points_clear && (
          <DomainAbilityButton
            cardName={card.name}
            displayName={card.name}
            costType="hit_points_clear"
            costValue={enhancement.gains.hit_points_clear}
          />
        )}
        {enhancement.gains?.armor_slots_clear && (
          <DomainAbilityButton
            cardName={card.name}
            displayName={card.name}
            costType="armor_slots_clear"
            costValue={enhancement.gains.armor_slots_clear}
          />
        )}

        {/* Duration/Active button - ONLY for cards without when_active modifiers */}
        {enhancement.duration && !getModifiers(card).some(mod => mod.condition?.type === 'when_active') && (
          <DomainAbilityButton
            cardName={card.name}
            costType="duration"
            label={enhancement.duration === 'scene' ? 'Active (Scene)' : 'Active'}
          />
        )}

        {/* Roll button */}
        {mechanics.rollLabel && (
          <button
            onClick={() => prepareRoll(`${card.name} ${mechanics.rollLabel} Roll`, mechanics.rollBonus)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-500/30 rounded text-sm font-medium text-purple-300 transition-colors"
          >
            <Zap size={14} className="text-yellow-400" />
            Roll {mechanics.rollLabel} ({mechanics.rollBonus >= 0 ? `+${mechanics.rollBonus}` : mechanics.rollBonus})
          </button>
        )}

        {/* Damage button */}
        {mechanics.finalDamage && (
          <button
            onClick={() => {
              const { dice, modifier } = parseDamageRoll(mechanics.finalDamage!);
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
