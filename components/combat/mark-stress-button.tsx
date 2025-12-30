/**
 * MARK STRESS BUTTON
 * ----------------------------------------------------------------------------
 * A smart button that integrates with the character's stress state to mark
 * stress as a cost for using abilities.
 *
 * Key Features:
 * - Reads current stress from character store
 * - Disabled (grayed out) when not enough stress slots available
 * - On click: marks stress via updateVitals, then calls onMark callback
 * - Visual feedback for available vs unavailable states
 */

'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import clsx from 'clsx';
import { useCharacterStore } from '@/store/character-store';
import type { MarkStressButtonProps } from '@/types/cards';

export default function MarkStressButton({
  cost,
  onMark,
  disabled = false,
  size = 'md',
  className,
}: MarkStressButtonProps) {
  const { character, updateVitals } = useCharacterStore();

  // Calculate if enough stress slots are available
  const stressCurrent = character?.vitals?.stress_current ?? 0;
  const stressMax = character?.vitals?.stress_max ?? 6;
  const availableSlots = stressMax - stressCurrent;
  const canAfford = availableSlots >= cost;
  const isDisabled = disabled || !canAfford || !character;

  const handleClick = async () => {
    if (isDisabled || !character) return;

    // Mark stress
    const newStress = Math.min(stressCurrent + cost, stressMax);
    await updateVitals('stress_current', newStress);

    // Call callback
    onMark?.();
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
          ? `Need ${cost} stress slot${cost > 1 ? 's' : ''}, only ${availableSlots} available`
          : `Mark ${cost} Stress`
      }
      className={clsx(
        'flex items-center font-medium rounded transition-all',
        sizeClasses,
        isDisabled
          ? 'bg-white/5 text-gray-600 cursor-not-allowed'
          : 'bg-white/10 text-white hover:bg-white/20 active:bg-white/25',
        className
      )}
    >
      <Zap size={size === 'sm' ? 12 : 14} className={clsx(
        isDisabled ? 'text-gray-600' : 'text-yellow-400'
      )} />
      <span>Mark Stress ({cost})</span>
    </button>
  );
}
