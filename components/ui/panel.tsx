/**
 * PANEL COMPONENT
 * ----------------------------------------------------------------------------
 * A container component that provides consistent panel styling across the application.
 * Wraps the common bg-dagger-panel border border-white/10 rounded-xl pattern
 * with configurable variants for different use cases.
 *
 * VARIANTS:
 * - default: Standard panel with subtle border
 * - elevated: Slightly more prominent with stronger border
 * - outlined: Dashed border for empty/placeholder states
 * - ghost: No background, border only
 *
 * PADDING:
 * - none: No padding (for custom layouts)
 * - sm: Compact padding (p-2)
 * - md: Standard padding (p-4)
 * - lg: Generous padding (p-6)
 *
 * USAGE:
 * ```tsx
 * <Panel>
 *   <h3>Section Title</h3>
 *   <p>Content here</p>
 * </Panel>
 *
 * <Panel variant="outlined" padding="lg">
 *   Empty state content
 * </Panel>
 * ```
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const panelVariants = cva('rounded-xl', {
  variants: {
    variant: {
      default: 'bg-dagger-panel border border-white/10',
      elevated: 'bg-dagger-panel border border-white/20 shadow-lg',
      outlined: 'bg-transparent border border-dashed border-white/10',
      ghost: 'bg-white/5 border border-white/5',
    },
    padding: {
      none: '',
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
  },
});

export interface PanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof panelVariants> {
  /** Element type to render (default: div) */
  as?: React.ElementType;
}

/**
 * Panel - A container component with consistent styling
 */
export function Panel({
  className,
  variant,
  padding,
  as: Component = 'div',
  children,
  ...props
}: PanelProps) {
  return (
    <Component
      className={cn(panelVariants({ variant, padding, className }))}
      {...props}
    >
      {children}
    </Component>
  );
}

export { panelVariants };
