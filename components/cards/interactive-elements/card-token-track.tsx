/**
 * CARD TOKEN TRACK
 * ----------------------------------------------------------------------------
 * Interactive token management for cards like Flight, Unleash Chaos, and Feed.
 *
 * Key Features:
 * - Displays filled/empty circles based on current tokens
 * - [-1] and [+1] buttons to adjust token count
 * - [Reset] button to refill to max
 * - Reads/writes to card state in Zustand store
 * - Supports dynamic max tokens based on character trait
 */

'use client';

import React from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { useCharacterStore } from '@/store/character-store';
import type { CardTokenTrackProps } from '@/types/cards';

export default function CardTokenTrack({
  cardName,
  maxTokens,
  tokenSource,
  currentTokens: propTokens,
  onTokenChange,
  className,
}: CardTokenTrackProps) {
  const { character, cardStates, setCardTokens } = useCharacterStore();

  // Calculate max tokens
  let calculatedMax = maxTokens ?? 0;
  if (maxTokens === null && tokenSource && character?.stats) {
    // Dynamic max based on trait
    const stat = character.stats[tokenSource as keyof typeof character.stats];
    if (typeof stat === 'number') {
      calculatedMax = stat;
    }
  }

  // Get current tokens from store or props
  const storedTokens = cardStates?.[cardName]?.current_tokens ?? 0;
  const currentTokens = propTokens ?? storedTokens;

  const handleSpendToken = () => {
    if (currentTokens <= 0) return;
    const newValue = currentTokens - 1;
    setCardTokens(cardName, newValue);
    onTokenChange?.(newValue);
  };

  const handleGainToken = () => {
    if (currentTokens >= calculatedMax) return;
    const newValue = currentTokens + 1;
    setCardTokens(cardName, newValue);
    onTokenChange?.(newValue);
  };

  const handleReset = () => {
    setCardTokens(cardName, calculatedMax);
    onTokenChange?.(calculatedMax);
  };

  // Don't render if no max tokens
  if (calculatedMax <= 0) {
    return null;
  }

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {/* Token label */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          Tokens{tokenSource ? ` (${tokenSource.charAt(0).toUpperCase() + tokenSource.slice(1)})` : ''}
        </span>
        <span>
          {currentTokens}/{calculatedMax}
        </span>
      </div>

      {/* Token circles */}
      <div className="flex items-center gap-1 flex-wrap">
        {Array.from({ length: calculatedMax }).map((_, idx) => (
          <div
            key={idx}
            className={clsx(
              'w-4 h-4 rounded-full border-2 transition-all',
              idx < currentTokens
                ? 'bg-dagger-gold border-dagger-gold'
                : 'bg-transparent border-gray-600'
            )}
          />
        ))}
      </div>

      {/* Control buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSpendToken}
          disabled={currentTokens <= 0}
          className={clsx(
            'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-all',
            currentTokens <= 0
              ? 'bg-white/5 text-gray-600 cursor-not-allowed'
              : 'bg-white/10 text-white hover:bg-white/20'
          )}
          title="Spend 1 token"
        >
          <Minus size={12} />
          <span>Spend</span>
        </button>

        <button
          onClick={handleReset}
          disabled={currentTokens === calculatedMax}
          className={clsx(
            'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-all',
            currentTokens === calculatedMax
              ? 'bg-white/5 text-gray-600 cursor-not-allowed'
              : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
          )}
          title="Reset to max tokens"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>

        <button
          onClick={handleGainToken}
          disabled={currentTokens >= calculatedMax}
          className={clsx(
            'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-all',
            currentTokens >= calculatedMax
              ? 'bg-white/5 text-gray-600 cursor-not-allowed'
              : 'bg-white/10 text-dagger-gold hover:bg-dagger-gold/20'
          )}
          title="Gain 1 token"
        >
          <Plus size={12} />
          <span>Gain</span>
        </button>
      </div>
    </div>
  );
}
