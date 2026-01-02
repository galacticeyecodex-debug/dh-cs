/**
 * ACTIVE EFFECT CHECKBOX
 * ----------------------------------------------------------------------------
 * A checkbox component for persistent effects (until end of scene, rest, etc.).
 *
 * Key Features:
 * - Tracks whether an effect is currently active
 * - Reads/writes to card state in Zustand store
 * - Displays appropriate label based on duration type
 * - Visual feedback for active vs inactive state
 */

'use client';

import React from 'react';
import { Check, Square } from 'lucide-react';
import clsx from 'clsx';
import { useCharacterStore } from '@/store/character-store';
import type { ActiveEffectCheckboxProps } from '@/types/cards';

export default function ActiveEffectCheckbox({
    cardName,
    duration,
    onToggle,
    className,
}: ActiveEffectCheckboxProps) {
    const { cardStates, toggleCardActive } = useCharacterStore();

    // Get current active state for this card
    const cardState = cardStates?.[cardName];
    const isActive = cardState?.is_active ?? false;

    const handleToggle = () => {
        toggleCardActive(cardName);
        onToggle?.(!isActive);
    };

    const label = duration === 'scene'
        ? 'Active (Scene)'
        : duration === 'rest'
            ? 'Active (Rest)'
            : 'Active Effect';

    return (
        <button
            onClick={handleToggle}
            className={clsx(
                'flex items-center gap-1.5 text-xs font-medium rounded px-2 py-1 transition-all',
                isActive
                    ? 'text-dagger-gold bg-dagger-gold/10 border border-dagger-gold/30'
                    : 'text-white hover:bg-white/10',
                className
            )}
            title={isActive ? `${label} - Active (click to end)` : `${label} - Inactive (click to activate)`}
        >
            {isActive ? (
                <Check size={12} className="text-dagger-gold" />
            ) : (
                <Square size={12} className="text-white" />
            )}
            <span>{label}</span>
        </button>
    );
}
