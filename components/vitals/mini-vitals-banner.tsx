'use client';

import React, { useMemo } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { Heart, Zap, Shield, Eye } from 'lucide-react';
import { getClassBaseStat } from '@/lib/utils';
import { getStatModifierTotal } from '@/lib/modifier-aggregator';
import { cn } from '@/lib/utils';

export interface VitalEntry {
    label: string;
    current: number;
    max?: number;
    icon: React.ElementType;
    color: string;
    bgColor?: string;
    onClick?: () => void;
}

export interface MiniVitalsBannerProps {
    vitals: VitalEntry[];
    bottomOffset?: string;
    className?: string;
}

/**
 * MINI VITALS PANEL (UI Only)
 * A pure presentation component that renders a row of vitals.
 */
export function MiniVitalsPanel({
    vitals,
    bottomOffset = "calc(4rem + env(safe-area-inset-bottom))",
    className
}: MiniVitalsBannerProps) {
    return (
        <div
            className={cn(
                "fixed left-0 right-0 z-40 bg-dagger-panel/95 backdrop-blur-md border-t border-white/10 shadow-xl transition-all",
                className
            )}
            style={{ bottom: bottomOffset }}
        >
            <div className="flex items-center justify-around px-2 py-2">
                {vitals.map((vital) => (
                    <button
                        key={vital.label}
                        onClick={vital.onClick}
                        disabled={!vital.onClick}
                        className={cn(
                            "flex flex-col items-center gap-0.5 min-w-[60px] transition-transform",
                            vital.onClick ? "active:scale-95 cursor-pointer" : "cursor-default"
                        )}
                    >
                        <div className="flex items-center gap-1">
                            <vital.icon size={12} className={vital.color} />
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                                {vital.label.substring(0, 3)}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-0.5">
                            <span className={cn("text-sm font-bold leading-none", vital.color)}>
                                {vital.current}
                            </span>
                            {vital.max !== undefined && vital.max > 0 && (
                                <span className="text-[10px] text-gray-500 leading-none">
                                    /{vital.max}
                                </span>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

/**
 * CHARACTER VITALS BANNER (Smart Component)
 * Connects to the Character Store and provides content for the MiniVitalsPanel.
 */
export default function CharacterVitalsBanner() {
    const { character, cardStates } = useCharacterStore();

    if (!character) return null;

    // --- VITAL CALCULATIONS ---
    const hpMax = useMemo(() => {
        const base = getClassBaseStat(character, 'hp');
        const mod = getStatModifierTotal(character, 'hit_points', cardStates as any || {});
        return base + mod;
    }, [character, cardStates]);

    const stressMax = useMemo(() => {
        const base = 6;
        const mod = getStatModifierTotal(character, 'stress', cardStates as any || {});
        return base + mod;
    }, [character, cardStates]);

    const hopeMax = useMemo(() => {
        const base = 6;
        const mod = getStatModifierTotal(character, 'hope', cardStates as any || {});
        return base + mod;
    }, [character, cardStates]);

    const evasionTotal = useMemo(() => {
        const base = getClassBaseStat(character, 'evasion');
        const mod = getStatModifierTotal(character, 'evasion', cardStates as any || {});
        return base + mod;
    }, [character, cardStates]);

    const armorMax = useMemo(() => {
        const armorItem = character.character_inventory?.find(item => item.location === 'equipped_armor');
        const armorBaseScore = armorItem?.library_item?.data?.base_score || 0;
        const mod = getStatModifierTotal(character, 'armor', cardStates as any || {});
        return (typeof armorBaseScore === 'string' ? parseInt(armorBaseScore) : armorBaseScore) + mod;
    }, [character, cardStates]);

    const vitals: VitalEntry[] = [
        {
            label: 'Evasion',
            current: evasionTotal,
            icon: Eye,
            color: 'text-cyan-400',
        },
        {
            label: 'Armor',
            current: character.vitals.armor_slots,
            max: armorMax,
            icon: Shield,
            color: 'text-blue-400',
        },
        {
            label: 'HP',
            current: character.vitals.hit_points_current,
            max: hpMax,
            icon: Heart,
            color: 'text-red-400',
        },
        {
            label: 'Stress',
            current: character.vitals.stress_current,
            max: stressMax,
            icon: Zap,
            color: 'text-purple-400',
        },
        {
            label: 'Hope',
            current: character.hope,
            max: hopeMax,
            icon: Zap,
            color: 'text-dagger-gold',
        }
    ];

    return <MiniVitalsPanel vitals={vitals} />;
}
