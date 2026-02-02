/**
 * COUNTER COMPONENT
 * ----------------------------------------------------------------------------
 * An increment/decrement counter for numeric values like gold, quantities,
 * or any bounded number. Provides consistent styling and accessible controls.
 *
 * FEATURES:
 * - Increment/decrement buttons
 * - Optional min/max bounds
 * - Configurable step size
 * - Label display
 * - Disabled state when at bounds
 *
 * USAGE:
 * ```tsx
 * <Counter
 *   label="Handfuls"
 *   value={gold.handfuls}
 *   onIncrement={() => updateGold('handfuls', gold.handfuls + 1)}
 *   onDecrement={() => updateGold('handfuls', gold.handfuls - 1)}
 *   min={0}
 * />
 * ```
 */

import * as React from 'react';
import { AppIcons } from '@/lib/icon-utils';
import { cn } from '@/lib/utils';

export interface CounterProps {
  /** Display label above the counter */
  label: string;
  /** Current value */
  value: number;
  /** Callback to increment the value */
  onIncrement: () => void;
  /** Callback to decrement the value */
  onDecrement: () => void;
  /** Minimum allowed value (disables decrement at this value) */
  min?: number;
  /** Maximum allowed value (disables increment at this value) */
  max?: number;
  /** Additional class names */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    container: 'gap-1',
    label: 'text-[10px]',
    value: 'text-lg',
    button: 'p-0.5',
    icon: 10,
  },
  md: {
    container: 'gap-2',
    label: 'text-xs',
    value: 'text-2xl',
    button: 'p-1',
    icon: 12,
  },
  lg: {
    container: 'gap-3',
    label: 'text-sm',
    value: 'text-3xl',
    button: 'p-1.5',
    icon: 14,
  },
} as const;

/**
 * Counter - An increment/decrement control for numeric values
 */
export function Counter({
  label,
  value,
  onIncrement,
  onDecrement,
  min,
  max,
  className,
  size = 'md',
}: CounterProps) {
  const config = sizeConfig[size];
  const canDecrement = min === undefined || value > min;
  const canIncrement = max === undefined || value < max;

  return (
    <div className={cn('flex flex-col items-center', config.container, className)}>
      <span className={cn('uppercase font-bold text-gray-400 tracking-wider', config.label)}>
        {label}
      </span>
      <span className={cn('font-bold text-dagger-gold', config.value)}>
        {value}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onDecrement}
          disabled={!canDecrement}
          className={cn(
            'rounded bg-white/10 text-white transition-colors',
            'hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed',
            config.button
          )}
          aria-label={`Decrease ${label}`}
        >
          <AppIcons.ui.remove size={config.icon} />
        </button>
        <button
          type="button"
          onClick={onIncrement}
          disabled={!canIncrement}
          className={cn(
            'rounded bg-white/10 text-white transition-colors',
            'hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed',
            config.button
          )}
          aria-label={`Increase ${label}`}
        >
          <AppIcons.ui.add size={config.icon} />
        </button>
      </div>
    </div>
  );
}
