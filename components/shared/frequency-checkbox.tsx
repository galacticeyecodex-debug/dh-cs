/**
 * FREQUENCY CHECKBOX
 * ----------------------------------------------------------------------------
 * A checkbox component that tracks ability usage and resets on rest/session events.
 *
 * Key Features:
 * - Tracks "used this rest", "used this long rest", "used this session"
 * - Reads/writes to card state in Zustand store
 * - Displays appropriate label based on frequency type
 * - Visual feedback for used vs available state
 */

'use client';

import React from 'react';
import { Check, Square } from '@/lib/icon-utils';
import clsx from 'clsx';
import { useCharacterStore } from '@/store/character-store';
import { getFrequencyLabel } from '@/lib/card-parser';
import type { FrequencyCheckboxProps } from '@/types/cards';
import type { Frequency } from '@/types/cards';

export default function FrequencyCheckbox({
  cardName,
  frequency,
  onToggle,
  className,
}: FrequencyCheckboxProps) {
  const { cardStates, markCardUsed, resetCardUsed } = useCharacterStore();

  // Skip rendering for at_will abilities (no frequency limit)
  if (frequency === 'at_will') {
    return null;
  }

  // Get current used state for this card
  const cardState = cardStates?.[cardName];
  const isUsed = getIsUsed(cardState, frequency);

  const handleToggle = () => {
    if (isUsed) {
      resetCardUsed(cardName, frequency);
    } else {
      markCardUsed(cardName, frequency);
    }
    onToggle?.(!isUsed);
  };

  const label = getFrequencyLabel(frequency);

  return (
    <button
      onClick={handleToggle}
      className={clsx(
        'flex items-center gap-1.5 text-xs font-medium rounded px-2 py-1 transition-all',
        isUsed
          ? 'text-gray-500 line-through bg-white/5'
          : 'text-white hover:bg-white/10',
        className
      )}
      title={isUsed ? `${label} - Used (click to restore)` : `${label} - Available (click to mark used)`}
    >
      {isUsed ? (
        <Check size={12} className="text-gray-500" />
      ) : (
        <Square size={12} className="text-white" />
      )}
      <span>{label}</span>
    </button>
  );
}

/**
 * Helper to determine if card is used based on frequency type
 */
function getIsUsed(
  cardState: { used_this_rest?: boolean; used_this_long_rest?: boolean; used_this_session?: boolean } | undefined,
  frequency: Frequency
): boolean {
  if (!cardState) return false;

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
