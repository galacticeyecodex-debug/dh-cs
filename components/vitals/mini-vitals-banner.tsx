'use client';

import React, { useMemo } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { Heart, Zap, Shield, Eye, Skull, Sparkles } from 'lucide-react';
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
                "fixed left-0 right-0 z-40 bg-dagger-panel backdrop-blur-lg border-t border-white/10 shadow-xl transition-all",
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
                        aria-label={`${vital.label}: ${vital.current}${vital.max !== undefined ? ` of ${vital.max}` : ''}`}
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
 * When a character is in an active campaign, also shows the campaign's Fear level.
 */
export default function CharacterVitalsBanner() {
    const { character, cardStates, activeCampaign } = useCharacterStore();

    // --- VITAL CALCULATIONS (must be before any early returns) ---
    // We compute all values in a single useMemo to avoid hook ordering issues
    const vitalData = useMemo(() => {
        if (!character) return null;

        const hpMax = getClassBaseStat(character, 'hp') +
            getStatModifierTotal(character, 'hit_points', cardStates as any || {});

        const stressMax = 6 +
            getStatModifierTotal(character, 'stress', cardStates as any || {});

        const hopeMax = 6 +
            getStatModifierTotal(character, 'hope', cardStates as any || {});

        const evasionTotal = getClassBaseStat(character, 'evasion') +
            getStatModifierTotal(character, 'evasion', cardStates as any || {});

        const armorItem = character.character_inventory?.find(item => item.location === 'equipped_armor');
        const armorBaseScore = armorItem?.library_item?.data?.base_score || 0;
        const armorMax = (typeof armorBaseScore === 'string' ? parseInt(armorBaseScore) : armorBaseScore) +
            getStatModifierTotal(character, 'armor', cardStates as any || {});

        return {
            hpMax,
            stressMax,
            hopeMax,
            evasionTotal,
            armorMax,
            hp_current: character.vitals.hit_points_current,
            stress_current: character.vitals.stress_current,
            hope_current: character.hope,
            armor_current: character.vitals.armor_slots,
        };
    }, [character, cardStates]);

    // Early return after hooks
    if (!vitalData) return null;

    // Build vitals array - Fear appears first when in a campaign
    const vitals: VitalEntry[] = [];

    // Add Fear if in an active campaign (read-only for players)
    if (activeCampaign) {
        const isHighFear = activeCampaign.fear_current >= 10;
        vitals.push({
            label: 'Fear',
            current: activeCampaign.fear_current,
            max: activeCampaign.fear_max || 12,
            icon: Skull,
            color: isHighFear ? 'text-red-400' : 'text-purple-400',
        });
    }

    // Character vitals
    vitals.push(
        {
            label: 'Evasion',
            current: vitalData.evasionTotal,
            icon: Eye,
            color: 'text-cyan-400',
        },
        {
            label: 'Armor',
            current: vitalData.armor_current,
            max: vitalData.armorMax,
            icon: Shield,
            color: 'text-blue-400',
        },
        {
            label: 'HP',
            current: vitalData.hp_current,
            max: vitalData.hpMax,
            icon: Heart,
            color: 'text-red-400',
        },
        {
            label: 'Stress',
            current: vitalData.stress_current,
            max: vitalData.stressMax,
            icon: Zap,
            color: 'text-purple-400',
        },
        {
            label: 'Hope',
            current: vitalData.hope_current,
            max: vitalData.hopeMax,
            icon: Sparkles,
            color: 'text-dagger-gold',
        }
    );

    return <MiniVitalsPanel vitals={vitals} />;
}
