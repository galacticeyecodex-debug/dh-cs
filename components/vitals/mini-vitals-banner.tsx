'use client';

import React, { useMemo } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { getClassBaseStat, cn } from '@/lib/utils';
import { getStatModifierTotal } from '@/lib/modifier-aggregator';
import { getIconByName, AppIcons } from '@/lib/icon-utils';

export interface VitalEntry {
    label: string;
    current: number;
    max?: number;
    icon: React.ElementType;
    color: string;
    bgColor?: string;
    onClick?: () => void;
    subLabel?: string;
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
                "fixed left-0 right-0 z-40 bg-dagger-panel backdrop-blur-lg border-t border-white/10 transition-all",
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
                        <div className="flex flex-col items-center gap-0">
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
                            {vital.subLabel && (
                                <span className="text-[8px] text-gray-500 font-medium uppercase tracking-wider">
                                    {vital.subLabel}
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
    const { character, cardStates, activeCampaign, vitalIcons: iconPreferences } = useCharacterStore();

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
            hp_marked: hpMax - character.vitals.hit_points_current,
            stress_current: character.vitals.stress_current,
            hope_current: character.hope,
            armor_marked: armorMax - character.vitals.armor_slots,
        };
    }, [character, cardStates]);

    // Early return after hooks
    if (!vitalData) return null;

    // Build vitals array
    const vitals: VitalEntry[] = [];

    // Character vitals
    vitals.push(
        {
            label: 'Evasion',
            current: vitalData.evasionTotal,
            icon: getIconByName(iconPreferences.evasion, AppIcons.vitals.evasion),
            color: 'text-cyan-400',
            subLabel: 'Score',
        },
        {
            label: 'Armor',
            current: vitalData.armor_marked,
            max: vitalData.armorMax,
            icon: getIconByName(iconPreferences.armor, AppIcons.vitals.armor),
            color: 'text-blue-400',
            subLabel: 'Marked',
        },
        {
            label: 'HP',
            current: vitalData.hp_marked,
            max: vitalData.hpMax,
            icon: getIconByName(iconPreferences.hitPoints, AppIcons.vitals.hitPoints),
            color: 'text-red-400',
            subLabel: 'Marked',
        },
        {
            label: 'Stress',
            current: vitalData.stress_current,
            max: vitalData.stressMax,
            icon: getIconByName(iconPreferences.stress, AppIcons.vitals.stress),
            color: 'text-purple-400',
            subLabel: 'Marked',
        },
        {
            label: 'Hope',
            current: vitalData.hope_current,
            max: vitalData.hopeMax,
            icon: getIconByName(iconPreferences.hope, AppIcons.vitals.hope),
            color: 'text-dagger-gold',
            subLabel: 'Gained',
        }
    );

    // Add Fear if in an active campaign (read-only for players)
    // SRD: Max Fear is always 12
    if (activeCampaign) {
        const isHighFear = activeCampaign.fear_current >= 10; // ~83% of max
        vitals.push({
            label: 'Fear',
            current: activeCampaign.fear_current,
            max: 12, // SRD: Max Fear is always 12
            icon: getIconByName(iconPreferences.fear, AppIcons.vitals.fear),
            color: isHighFear ? 'text-red-400' : 'text-purple-400',
            subLabel: 'Gained',
        });
    }

    return <MiniVitalsPanel vitals={vitals} />;
}
