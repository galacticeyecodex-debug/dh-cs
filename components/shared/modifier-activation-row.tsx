/**
 * MODIFIER ACTIVATION ROW
 * ----------------------------------------------------------------------------
 * Displays a single modifier (e.g., "+1 Attack") with an activation toggle.
 *
 * This component decouples modifier activation from cost payment, giving users
 * explicit control over when bonuses apply. Used for modifiers with conditions
 * like "when_active" that the user should manually toggle.
 *
 * Key Features:
 * - Shows the modifier value and stat (e.g., "+2 Evasion")
 * - Shows the condition description (e.g., "While wearing armor")
 * - Provides a checkbox/toggle to activate/deactivate EACH MODIFIER INDEPENDENTLY
 * - Color-codes positive (green) vs negative (red) modifiers
 */

'use client';

import React from 'react';
import { AppIcons } from '@/lib/icon-utils';
import clsx from 'clsx';
import { useCharacterStore } from '@/store/character-store';
import { getStatModifiers } from '@/lib/modifier-aggregator';
import { isModifierActive } from '@/lib/enhancement-utils';
import type { CardModifier, CardStates } from '@/types/cards';
import type { Character } from '@/types/character';

/**
 * Calculate formula value using MODIFIED stats (after all modifiers applied).
 * This ensures formulas like "2_times_strength" use the total Strength, not base.
 */
function calculateFormulaWithModifiedStats(
  formula: string,
  character: Character,
  cardStates: CardStates
): number {
  // Handle "[number]_times_marked_hp" pattern (e.g., "2_times_marked_hp" for Power Through Pain)
  const markedHpMatch = formula.match(/^(\d+)_times_marked_hp$/);
  if (markedHpMatch) {
    const multiplier = parseInt(markedHpMatch[1]);
    const maxHp = character.vitals?.hit_points_max || 0;
    const currentHp = character.vitals?.hit_points_current || 0;
    const markedHp = maxHp - currentHp;
    return multiplier * markedHp;
  }

  // Handle direct "marked_hp" reference
  if (formula === 'marked_hp') {
    const maxHp = character.vitals?.hit_points_max || 0;
    const currentHp = character.vitals?.hit_points_current || 0;
    return maxHp - currentHp;
  }

  // Handle "1_per_3_marked_hp" pattern (for Blood-Touched Evasion)
  if (formula === '1_per_3_marked_hp') {
    const maxHp = character.vitals?.hit_points_max || 0;
    const currentHp = character.vitals?.hit_points_current || 0;
    const markedHp = maxHp - currentHp;
    return Math.floor(markedHp / 3);
  }

  // Handle "[number]_times_[stat]" pattern (e.g., "2_times_strength")
  const timesMatch = formula.match(/^(\d+)_times_([a-z]+)$/);
  if (timesMatch) {
    const multiplier = parseInt(timesMatch[1]);
    const stat = timesMatch[2];
    const baseValue = character.stats?.[stat as keyof typeof character.stats] || 0;
    const modifiers = getStatModifiers(character, stat, cardStates);
    const totalMods = modifiers.reduce((sum, m) => sum + m.value, 0);
    return multiplier * (baseValue + totalMods);
  }

  // Handle "half_[stat]" pattern
  if (formula.startsWith('half_')) {
    const stat = formula.replace('half_', '');
    const baseValue = character.stats?.[stat as keyof typeof character.stats] || 0;
    const modifiers = getStatModifiers(character, stat, cardStates);
    const totalMods = modifiers.reduce((sum, m) => sum + m.value, 0);
    return Math.floor((baseValue + totalMods) / 2);
  }

  // Handle "[number]_plus_[stat]" pattern
  const plusMatch = formula.match(/^(\d+)_plus_([a-z]+)$/);
  if (plusMatch) {
    const baseNum = parseInt(plusMatch[1]);
    const stat = plusMatch[2];
    const baseValue = character.stats?.[stat as keyof typeof character.stats] || 0;
    const modifiers = getStatModifiers(character, stat, cardStates);
    const totalMods = modifiers.reduce((sum, m) => sum + m.value, 0);
    return baseNum + baseValue + totalMods;
  }

  // Handle proficiency reference
  if (formula === 'proficiency') {
    return character.proficiency || 1;
  }

  // Handle direct stat reference
  const statValue = character.stats?.[formula as keyof typeof character.stats];
  if (typeof statValue === 'number') {
    const modifiers = getStatModifiers(character, formula, cardStates);
    const totalMods = modifiers.reduce((sum, m) => sum + m.value, 0);
    return statValue + totalMods;
  }

  return 0;
}

interface ModifierActivationRowProps {
  cardName: string;
  modifier: CardModifier;
  /** Unique key for this modifier (used to track independent activation state) */
  modifierKey: string;
  /** Optional description of when this modifier applies */
  conditionText?: string;
  className?: string;
  /** The domain of the card (for styling Touched cards) */
  domain?: string;
}

export default function ModifierActivationRow({
  cardName,
  modifier,
  modifierKey,
  conditionText,
  className,
  domain,
}: ModifierActivationRowProps) {
  const { character, cardStates, toggleModifierActive } = useCharacterStore();

  // Determine if this is an auto-activating condition (not user-controlled)
  const isAutoActivateCondition = modifier.condition?.type === 'loadout_domain_count' ||
    modifier.condition?.type === 'when_armored' ||
    modifier.condition?.type === 'when_unarmored' ||
    modifier.condition?.type === 'when_hp_marked' ||
    modifier.condition?.type === 'always';

  // For auto-activate conditions, check if the condition is met
  // For manual conditions (when_active), use the stored activation state
  const isCardActive = cardStates[cardName]?.is_active ?? false;
  const isConditionMet = character && modifier.condition
    ? isModifierActive(modifier, isCardActive, character)
    : false;

  // Per-modifier activation state - auto conditions are active when condition is met
  const isActive = isAutoActivateCondition
    ? isConditionMet
    : (cardStates[cardName]?.active_modifiers?.[modifierKey] || false);

  // Calculate the effective value - use formula if present, otherwise use static value
  // For formulas, we need to use MODIFIED stats (after all modifiers applied)
  const value = React.useMemo(() => {
    if (modifier.formula && character) {
      return calculateFormulaWithModifiedStats(modifier.formula, character, cardStates);
    }
    return modifier.value;
  }, [modifier.formula, modifier.value, character, cardStates]);

  const isPositive = value > 0;

  // Format the stat name nicely
  const statLabel = modifier.stat
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Standardize to white/10 border like other buttons
  const borderColor = isActive
    ? (isPositive ? 'border-green-500/30' : 'border-red-500/30')
    : 'border-white/10';
  const bgColor = isActive
    ? (isPositive ? 'bg-green-500/10' : 'bg-red-500/10')
    : 'bg-white/5';

  const handleToggle = () => {
    toggleModifierActive(cardName, modifierKey);
  };

  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-3 px-3 py-1.5 rounded border transition-colors',
        isActive ? bgColor : 'bg-white/5',
        isActive ? borderColor : 'border-white/10',
        className
      )}
    >
      {/* Modifier Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={clsx('text-xs font-black', isPositive ? 'text-green-400' : 'text-red-400')}>
            {value >= 0 ? '+' : ''}{value}
          </span>
          <span className="text-xs font-bold text-white uppercase tracking-tight">
            {statLabel}
          </span>
        </div>
        {conditionText && (
          <div className="text-[10px] text-gray-400 leading-none">
            {conditionText}
          </div>
        )}
      </div>

      {/* Activation Toggle - Auto conditions show status, manual conditions show toggle */}
      {isAutoActivateCondition ? (
        <div
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-all duration-300',
            isActive
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-lg shadow-black/20'
              : 'bg-white/5 border-white/10 text-gray-500 opacity-50'
          )}
          title={isActive ? 'Condition met - automatically active' : 'Condition not met'}
        >
          {isActive && <AppIcons.ui.confirm size={12} />}
          <span>{isActive ? 'Active' : 'Inactive'}</span>
        </div>
      ) : (
        <button
          onClick={handleToggle}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-colors',
            isActive
              ? 'bg-dagger-gold/20 border-dagger-gold text-dagger-gold shadow-lg shadow-dagger-gold/5'
              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
          )}
          aria-label={`${isActive ? 'Deactivate' : 'Activate'} ${value} ${statLabel} modifier for ${cardName}`}
        >
          {isActive && <AppIcons.ui.confirm size={12} />}
          <span>{isActive ? 'Active' : 'Activate'}</span>
        </button>
      )}
    </div>
  );
}

