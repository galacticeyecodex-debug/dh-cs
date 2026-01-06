'use client';

/**
 * EMPTY STATE COMPONENT
 * ----------------------------------------------------------------------------
 * A standardized empty state component for displaying when lists or sections
 * have no content. Provides consistent styling with an icon, title, description,
 * and optional action button.
 * 
 * USAGE:
 * ```tsx
 * <EmptyState 
 *   icon={Package} 
 *   title="No items found" 
 *   description="Add items to get started"
 *   actionLabel="Add Item"
 *   onAction={() => setIsModalOpen(true)}
 * />
 * ```
 */

import React from 'react';
import clsx from 'clsx';

interface EmptyStateProps {
    icon: React.ElementType;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
    /** Use dashed border style (for inline empty states) */
    dashed?: boolean;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className,
    dashed = false
}: EmptyStateProps) {
    const Wrapper = onAction ? 'button' : 'div';

    return (
        <Wrapper
            onClick={onAction}
            className={clsx(
                "w-full text-center py-8 px-4 rounded-xl transition-colors",
                dashed
                    ? "border-2 border-dashed border-white/10"
                    : "bg-white/5 border border-white/5",
                onAction && "cursor-pointer hover:bg-white/10 hover:border-white/20",
                className
            )}
        >
            <Icon size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-sm mb-1">{title}</p>
            {description && (
                <p className="text-gray-500 text-xs">{description}</p>
            )}
            {actionLabel && onAction && (
                <span className="inline-block mt-3 text-xs text-dagger-gold font-medium">
                    {actionLabel}
                </span>
            )}
        </Wrapper>
    );
}

export default EmptyState;
