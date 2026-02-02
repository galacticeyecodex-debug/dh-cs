/**
 * SEARCH INPUT COMPONENT
 * ----------------------------------------------------------------------------
 * A styled search input with icon, placeholder, and optional clear button.
 * Provides consistent search UI across the application.
 *
 * FEATURES:
 * - Search icon prefix
 * - Clear button when value is present
 * - Focus ring with gold accent
 * - Configurable placeholder
 *
 * USAGE:
 * ```tsx
 * <SearchInput
 *   value={searchTerm}
 *   onChange={setSearchTerm}
 *   placeholder="Search vault cards..."
 * />
 * ```
 */

import * as React from 'react';
import { AppIcons } from '@/lib/icon-utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const searchInputVariants = cva(
  'w-full bg-white/5 border text-white transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-white/10 focus:border-dagger-gold',
        pill: 'border-white/10 focus:border-dagger-gold rounded-full',
      },
      size: {
        sm: 'py-1 pl-8 pr-8 text-xs',
        md: 'py-1.5 pl-9 pr-10 text-sm',
        lg: 'py-2 pl-10 pr-12 text-base',
      },
    },
    compoundVariants: [
      {
        variant: 'default',
        className: 'rounded-lg',
      },
    ],
    defaultVariants: {
      variant: 'pill',
      size: 'md',
    },
  }
);

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
} as const;

const iconPositions = {
  sm: 'left-2.5',
  md: 'left-3',
  lg: 'left-3.5',
} as const;

const clearPositions = {
  sm: 'right-2',
  md: 'right-3',
  lg: 'right-3.5',
} as const;

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'>,
  VariantProps<typeof searchInputVariants> {
  /** Current search value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Optional callback for clear button (defaults to onChange('')) */
  onClear?: () => void;
  /** Show clear button when value is present (default: true) */
  showClear?: boolean;
}

/**
 * SearchInput - A styled search input with icon and clear functionality
 */
export function SearchInput({
  className,
  variant,
  size = 'md',
  value,
  onChange,
  onClear,
  showClear = true,
  placeholder = 'Search...',
  ...props
}: SearchInputProps) {
  const sizeKey = size ?? 'md';
  const iconSize = iconSizes[sizeKey];
  const iconPosition = iconPositions[sizeKey];
  const clearPosition = clearPositions[sizeKey];

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
  };

  return (
    <div className="relative">
      <AppIcons.ui.search
        className={cn(
          'absolute top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none',
          iconPosition
        )}
        size={iconSize}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(searchInputVariants({ variant, size, className }))}
        {...props}
      />
      {showClear && value && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors',
            clearPosition
          )}
          aria-label="Clear search"
        >
          <AppIcons.ui.close size={iconSize} />
        </button>
      )}
    </div>
  );
}
