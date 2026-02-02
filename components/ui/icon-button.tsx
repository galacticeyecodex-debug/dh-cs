/**
 * ICON BUTTON COMPONENT
 * ----------------------------------------------------------------------------
 * A compact, accessible button designed for icon-only actions like edit, delete,
 * info, and other utility functions. Provides consistent sizing and color variants
 * across the application.
 *
 * VARIANTS:
 * - info (blue): View details, information buttons
 * - danger (red): Delete, remove, destructive actions
 * - action (gold): Primary actions, highlights
 * - ghost (gray): Subtle/secondary actions
 *
 * SIZES:
 * - sm: 12px icon, minimal padding (utility icons)
 * - md: 16px icon, standard padding (default)
 * - lg: 20px icon, larger padding (prominent actions)
 *
 * USAGE:
 * ```tsx
 * <IconButton icon={Trash2} variant="danger" label="Delete" onClick={handleDelete} />
 * <IconButton icon={Info} variant="info" size="sm" label="View details" />
 * ```
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-dagger-dark disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        info: 'text-blue-400 hover:bg-blue-400/10 focus-visible:ring-blue-400',
        danger: 'text-red-400 hover:bg-red-400/10 focus-visible:ring-red-400',
        action: 'text-dagger-gold hover:bg-dagger-gold/10 focus-visible:ring-dagger-gold',
        ghost: 'text-gray-400 hover:text-white hover:bg-white/10 focus-visible:ring-white',
      },
      size: {
        sm: 'p-1',
        md: 'p-1.5',
        lg: 'p-2',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  }
);

const iconSizes = {
  sm: 12,
  md: 16,
  lg: 20,
} as const;

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  /** The icon component to render */
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** Accessible label for the button (used for title and aria-label) */
  label: string;
}

/**
 * IconButton - A compact button for icon-only actions
 */
export function IconButton({
  className,
  variant,
  size,
  icon: Icon,
  label,
  ...props
}: IconButtonProps) {
  const iconSize = iconSizes[size || 'md'];

  return (
    <button
      type="button"
      className={cn(iconButtonVariants({ variant, size, className }))}
      title={label}
      aria-label={label}
      {...props}
    >
      <Icon size={iconSize} />
    </button>
  );
}

export { iconButtonVariants };
