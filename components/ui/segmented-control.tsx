/**
 * SEGMENTED CONTROL COMPONENT
 * ----------------------------------------------------------------------------
 * A toggle button group for switching between mutually exclusive options.
 * Used for tab-like navigation within a section (e.g., Loadout/Vault, Stats/Gallery/Lore).
 *
 * FEATURES:
 * - Keyboard accessible (arrow keys to navigate)
 * - Clear visual feedback for active state
 * - Optional icons for each segment
 * - Flexible sizing
 *
 * USAGE:
 * ```tsx
 * <SegmentedControl
 *   value={viewMode}
 *   onChange={setViewMode}
 *   options={[
 *     { value: 'loadout', label: 'Loadout', icon: ScrollText },
 *     { value: 'vault', label: 'Vault', icon: Archive }
 *   ]}
 * />
 * ```
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const containerVariants = cva(
  'inline-flex rounded-lg p-1 border border-white/10',
  {
    variants: {
      variant: {
        default: 'bg-white/5',
        subtle: 'bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const segmentVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dagger-gold focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5',
        lg: 'px-4 py-2',
      },
      active: {
        true: 'bg-dagger-gold text-black',
        false: 'text-gray-400 hover:text-white',
      },
    },
    defaultVariants: {
      size: 'md',
      active: false,
    },
  }
);

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
} as const;

export interface SegmentOption<T extends string> {
  /** The value for this segment */
  value: T;
  /** Display label */
  label: string;
  /** Optional icon component */
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  /** Accessible label (defaults to label) */
  ariaLabel?: string;
}

export interface SegmentedControlProps<T extends string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof containerVariants> {
  /** Currently selected value */
  value: T;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Available options */
  options: SegmentOption<T>[];
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * SegmentedControl - A toggle button group for mutually exclusive options
 */
export function SegmentedControl<T extends string>({
  className,
  variant,
  value,
  onChange,
  options,
  size = 'md',
  ...props
}: SegmentedControlProps<T>) {
  const iconSize = iconSizes[size];

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex;

    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      newIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
    }

    if (newIndex !== currentIndex) {
      onChange(options[newIndex].value);
    }
  };

  return (
    <div
      role="tablist"
      className={cn(containerVariants({ variant, className }))}
      {...props}
    >
      {options.map((option, index) => {
        const isActive = value === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={option.ariaLabel || option.label}
            tabIndex={isActive ? 0 : -1}
            className={cn(segmentVariants({ size, active: isActive }))}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {Icon && <Icon size={iconSize} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
