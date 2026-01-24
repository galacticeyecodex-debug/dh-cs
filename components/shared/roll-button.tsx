'use client';

import React from 'react';
import clsx from 'clsx';
import { AppIcons } from '@/lib/icon-utils';

interface RollButtonProps {
    label: string;
    onClick: (e: React.MouseEvent) => void;
    disabled?: boolean;
    icon?: React.ElementType;
    bonus?: number;
    variant?: 'primary' | 'secondary' | 'damage'; // primary = attack, secondary = subtle, damage = red
    className?: string;
}

export function RollButton({
    label,
    onClick,
    disabled = false,
    icon,
    bonus,
    variant = 'primary',
    className,
}: RollButtonProps) {

    // Determine styles based on variant
    const variantStyles = {
        primary: 'bg-white/10 hover:bg-white/20 text-white border-white/10',
        secondary: 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/5',
        damage: 'bg-white/10 hover:bg-white/20 text-white border-white/10', // specialized handling below
    };

    const activeIconColor = variant === 'damage' ? 'text-red-400' : 'text-dagger-gold';
    const Icon = icon || (variant === 'damage' ? AppIcons.combat.damage : AppIcons.combat.activation);

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick(e);
            }}
            disabled={disabled}
            className={clsx(
                "relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors",
                variantStyles[variant],
                disabled ? "opacity-30 cursor-not-allowed grayscale" : "hover:bg-opacity-80",
                className
            )}
        >
            <div
                className="absolute top-0.5 right-0.5 text-gray-600 transition-colors pointer-events-none opacity-0 sm:opacity-100"
                aria-hidden="true"
            >
                <AppIcons.combat.roll size={8} />
            </div>

            <Icon size={14} className={clsx(disabled ? "text-gray-500" : activeIconColor)} />

            <span>{label}</span>

            {bonus !== undefined && (
                <span className={clsx("font-bold", disabled ? "text-gray-500" : "text-white")}>
                    {bonus >= 0 ? `+${bonus}` : bonus}
                </span>
            )}
        </button>
    );
}
