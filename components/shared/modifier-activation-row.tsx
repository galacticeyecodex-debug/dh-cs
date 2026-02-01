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
import { Check } from 'lucide-react';
import clsx from 'clsx';
import { useCharacterStore } from '@/store/character-store';
import type { CardModifier } from '@/types/cards';

interface ModifierActivationRowProps {
  cardName: string;
  modifier: CardModifier;
  /** Unique key for this modifier (used to track independent activation state) */
  modifierKey: string;
  /** Optional description of when this modifier applies */
  conditionText?: string;
  className?: string;
}

export default function ModifierActivationRow({
  cardName,
  modifier,
  modifierKey,
  conditionText,
  className,
}: ModifierActivationRowProps) {
  const { cardStates, toggleModifierActive } = useCharacterStore();

  // Per-modifier activation state
  const isActive = cardStates[cardName]?.active_modifiers?.[modifierKey] || false;
  const value = modifier.value;
  const isPositive = value > 0;

  // Format the stat name nicely
  const statLabel = modifier.stat
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Color coding
  const valueColor = isPositive ? 'text-green-400' : 'text-red-400';
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
        bgColor,
        borderColor,
        className
      )}
    >
      {/* Modifier Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={clsx('text-xs font-black', valueColor)}>
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

      {/* Activation Toggle */}
      <button
        onClick={handleToggle}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-colors',
          isActive
            ? 'bg-dagger-gold/20 border-dagger-gold text-dagger-gold shadow-lg shadow-dagger-gold/5'
            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
        )}
        aria-label={`${isActive ? 'Deactivate' : 'Activate'} ${modifier.value} ${statLabel} modifier for ${cardName}`}
      >
        {isActive && <Check size={12} />}
        <span>{isActive ? 'Active' : 'Activate'}</span>
      </button>
    </div>
  );
}

