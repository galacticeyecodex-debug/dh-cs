/**
 * PILL BUTTON COMPONENT
 * ----------------------------------------------------------------------------
 * A rounded pill-shaped button used for filter selections, tags, and toggle options.
 * Provides clear visual feedback for active/inactive states with consistent styling.
 *
 * FEATURES:
 * - Active state with gold background
 * - Inactive state with subtle hover effects
 * - Optional icon support
 * - Horizontal scroll-friendly (whitespace-nowrap)
 *
 * USAGE:
 * ```tsx
 * <PillButton
 *   icon={Sword}
 *   active={selectedCategory === 'weapon'}
 *   onClick={() => setSelectedCategory('weapon')}
 * >
 *   Weapons
 * </PillButton>
 * ```
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const pillButtonVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dagger-gold focus-visible:ring-offset-2 focus-visible:ring-offset-dagger-dark disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'px-2 py-0.5',
        md: 'px-3 py-1',
        lg: 'px-4 py-1.5',
      },
      active: {
        true: 'bg-dagger-gold text-black',
        false: 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white',
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
  md: 16,
  lg: 18,
} as const;

export interface PillButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof pillButtonVariants> {
  /** Optional icon component to display before the label */
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  /** Whether the pill is in active/selected state */
  active?: boolean;
  /** The content/label of the pill */
  children: React.ReactNode;
}

/**
 * PillButton - A rounded button for filter selections and toggles
 */
export function PillButton({
  className,
  size,
  active = false,
  icon: Icon,
  children,
  ...props
}: PillButtonProps) {
  const iconSize = iconSizes[size || 'md'];

  return (
    <button
      type="button"
      className={cn(pillButtonVariants({ size, active, className }))}
      {...props}
    >
      {Icon && <Icon size={iconSize} />}
      {children}
    </button>
  );
}

export { pillButtonVariants };
