'use client';

/**
 * VIEW HEADER COMPONENT
 * ----------------------------------------------------------------------------
 * A standardized header component for main views in the application.
 * Provides consistent styling with an icon, title, and optional subtitle.
 * 
 * USAGE:
 * ```tsx
 * <ViewHeader 
 *   icon={BookOpen} 
 *   title="Journal" 
 *   subtitle="Track relationships, reputation, and notes" 
 * />
 * ```
 */

import React from 'react';

interface ViewHeaderProps {
    icon: React.ElementType;
    title: string;
    subtitle?: string;
}

export function ViewHeader({ icon: Icon, title, subtitle }: ViewHeaderProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-dagger-gold/10">
                <Icon size={28} className="text-dagger-gold" />
            </div>
            <div>
                <h1 className="text-2xl font-serif font-bold text-white">{title}</h1>
                {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
            </div>
        </div>
    );
}

export default ViewHeader;
