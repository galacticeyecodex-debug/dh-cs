/**
 * SPEND HOPE BUTTON
 * ----------------------------------------------------------------------------
 * A smart button that integrates with the character's hope state to spend
 * hope as a cost for using abilities.
 *
 * Key Features:
 * - Reads current hope from character store
 * - Disabled (grayed out) when not enough hope available
 * - On click: spends hope via updateHope, then calls onSpend callback
 * - Visual feedback with gold accent for available state
 */

'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { useCharacterStore } from '@/store/character-store';
import type { SpendHopeButtonProps } from '@/types/cards';

export default function SpendHopeButton({
  cost,
  onSpend,
  disabled = false,
  size = 'md',
  className,
}: SpendHopeButtonProps) {
  const { character, updateHope } = useCharacterStore();

  // Calculate if enough hope is available
  const hopeCurrent = character?.hope ?? 0;
  const canAfford = hopeCurrent >= cost;
  const isDisabled = disabled || !canAfford || !character;

  const handleClick = async () => {
    if (isDisabled || !character) return;

    // Spend hope
    const newHope = Math.max(hopeCurrent - cost, 0);
    await updateHope(newHope);

    // Call callback
    onSpend?.();
  };

  const sizeClasses = size === 'sm'
    ? 'px-2 py-1 text-xs gap-1'
    : 'px-3 py-1.5 text-sm gap-1.5';

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      title={
        isDisabled && !canAfford
          ? `Need ${cost} Hope, only ${hopeCurrent} available`
          : `Spend ${cost} Hope`
      }
      className={clsx(
        'flex items-center font-medium rounded transition-all',
        sizeClasses,
        isDisabled
          ? 'bg-white/5 text-gray-600 cursor-not-allowed'
          : 'bg-white/10 text-dagger-gold hover:bg-dagger-gold/20 active:bg-dagger-gold/30',
        className
      )}
    >
      <Sparkles size={size === 'sm' ? 12 : 14} className={clsx(
        isDisabled ? 'text-gray-600' : 'text-dagger-gold'
      )} />
      <span>Spend Hope ({cost})</span>
    </button>
  );
}
