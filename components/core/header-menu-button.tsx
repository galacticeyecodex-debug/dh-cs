'use client';

/**
 * HEADER MENU BUTTON COMPONENT
 * ----------------------------------------------------------------------------
 * A shared button component for dropdown menus in the header.
 * Provides consistent styling and behavior for both Character and User menus.
 * 
 * Features:
 * - Consistent background color on open/hover
 * - Avatar support with fallback
 * - Chevron animation
 * - Accessible ARIA attributes
 */

import React from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface HeaderMenuButtonProps {
    /** Whether the dropdown menu is currently open */
    isOpen: boolean;
    /** Click handler for the button */
    onClick: () => void;
    /** Avatar image URL (optional) */
    avatarUrl?: string;
    /** Avatar alt text */
    avatarAlt: string;
    /** Fallback text/initials for avatar */
    avatarFallback: string;
    /** Button label text */
    label: string;
    /** Aria label for accessibility */
    ariaLabel: string;
    /** Optional: Custom avatar size class (default: h-10 w-10) */
    avatarSize?: string;
    /** Optional: Custom label styling */
    labelClassName?: string;
}

export default function HeaderMenuButton({
    isOpen,
    onClick,
    avatarUrl,
    avatarAlt,
    avatarFallback,
    label,
    ariaLabel,
    avatarSize = 'h-10 w-10',
    labelClassName = 'text-lg font-serif font-bold text-dagger-gold',
}: HeaderMenuButtonProps) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors',
                isOpen ? 'bg-white/10' : 'hover:bg-white/5'
            )}
            aria-label={ariaLabel}
            aria-expanded={isOpen}
            aria-haspopup="true"
        >
            <Avatar className={clsx(avatarSize, 'border border-white/20 shrink-0')}>
                {avatarUrl && <AvatarImage src={avatarUrl} alt={avatarAlt} className="object-cover" />}
                <AvatarFallback className="bg-dagger-gold/20 text-dagger-gold text-[10px]">
                    {avatarFallback}
                </AvatarFallback>
            </Avatar>
            <span className={clsx(labelClassName, 'truncate')}>{label}</span>
            <ChevronDown
                size={18}
                className={clsx(
                    'text-gray-400 transition-transform duration-200 flex-shrink-0',
                    isOpen && 'rotate-180'
                )}
            />
        </button>
    );
}
