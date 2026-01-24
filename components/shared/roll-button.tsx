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

    const hasTextColorOverride = className?.includes('text-');

    // Determine styles based on variant
    const variantStyles = {
        primary: clsx('bg-white/10 hover:bg-white/20 border-white/10', !hasTextColorOverride && 'text-white'),
        secondary: clsx('bg-white/5 hover:bg-white/10 border-white/5', !hasTextColorOverride && 'text-gray-300'),
        damage: clsx('bg-white/10 hover:bg-white/20 border-white/10', !hasTextColorOverride && 'text-white'),
    };

    const isDamage = label.toLowerCase().includes('damage');
    const isAttack = label.toLowerCase().includes('attack');
    const isSpellcast = label === 'Spellcast';

    const activeIconColor = isDamage ? 'text-red-400' : (isSpellcast ? 'text-purple-400' : 'text-dagger-gold');

    const Icon = icon || (isDamage ? AppIcons.combat.damage :
        isSpellcast ? (AppIcons.combat as any).spellcast :
            isAttack ? AppIcons.combat.attack :
                variant === 'primary' ? AppIcons.combat.attack :
                    AppIcons.combat.activation);

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
                className="absolute top-0.5 right-0.5 text-gray-600 transition-colors pointer-events-none"
                aria-hidden="true"
            >
                <AppIcons.combat.roll size={10} />
            </div>

            <Icon size={14} className={clsx(disabled ? "text-gray-500" : activeIconColor)} />

            <span>{label}</span>

            {bonus !== undefined && (
                <span className={clsx("font-bold", disabled ? "text-gray-500" : !hasTextColorOverride && "text-white")}>
                    {bonus >= 0 ? `+${bonus}` : bonus}
                </span>
            )}
        </button>
    );
}
