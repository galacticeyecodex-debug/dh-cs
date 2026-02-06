'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { AppIcons } from '@/lib/icon-utils';
import clsx from 'clsx';
import { debounce } from 'lodash';

export interface CardNoteProps {
    cardName: string;
    noteKey: string;
    label: string;
    placeholder?: string;
    className?: string;
}

export function CardNote({
    cardName,
    noteKey,
    label,
    placeholder = 'Enter note...',
    className,
}: CardNoteProps) {
    const { cardStates, setCardNote } = useCharacterStore();
    const currentNote = cardStates[cardName]?.notes?.[noteKey] || '';
    const [localText, setLocalText] = useState(currentNote);

    // Sync with store if it changes externally
    useEffect(() => {
        setLocalText(currentNote);
    }, [currentNote]);

    // Debounced save to store
    const debouncedSave = useCallback(
        debounce((text: string) => {
            setCardNote(cardName, noteKey, text);
        }, 1000),
        [cardName, noteKey, setCardNote]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setLocalText(text);
        debouncedSave(text);
    };

    return (
        <div className={clsx("flex flex-col gap-1 w-full", className)}>
            <div className="flex items-center gap-1.5 opacity-70">
                <AppIcons.ui.info size={12} className="text-dagger-gold" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {label}
                </span>
            </div>
            <div className="relative group">
                <input
                    type="text"
                    value={localText}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-dagger-gold/50 transition-colors"
                />
                <div className="absolute right-2 top-1.5 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none">
                    <AppIcons.ui.settings size={10} />
                </div>
            </div>
        </div>
    );
}
