'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { getClassBaseStat, cn } from '@/lib/utils';
import { getStatModifierTotal } from '@/lib/modifier-aggregator';
import { getIconByName, AppIcons, VitalId } from '@/lib/icon-utils';
import { MiniVitalTray, VitalTrackType } from './mini-vital-tray';
import { Z_INDEX } from '@/constants/z-index';

export interface VitalEntry {
    label: string;
    /** Display value for mini-vital bar (may be "marked" count for mark-bad vitals) */
    current: number;
    /** Raw value for VitalCard tray (actual armor_slots/hit_points_current) */
    rawCurrent?: number;
    max?: number;
    icon: React.ElementType;
    /** Vital ID for icon preference lookup */
    vitalId?: VitalId;
    /** Primary color class (e.g., "text-red-400") */
    color: string;
    /** Stroke color class for filled icons (e.g., "stroke-red-900") */
    strokeColor?: string;
    bgColor?: string;
    onClick?: () => void;
    subLabel?: string;
    /** Track type for tray semantics (undefined = read-only, no tray) */
    trackType?: VitalTrackType;
    /** Called when user increments (Mark/Gain) - required if trackType is set */
    onIncrement?: () => void;
    /** Called when user decrements (Clear/Spend) - required if trackType is set */
    onDecrement?: () => void;
}

export interface MiniVitalsBannerProps {
    vitals: VitalEntry[];
    bottomOffset?: string;
    className?: string;
}

/**
 * MINI VITALS PANEL (UI Only)
 * A pure presentation component that renders a row of vitals.
 * When a vital with a trackType is tapped, opens an expandable tray with Mark/Clear controls.
 */
export function MiniVitalsPanel({
    vitals,
    bottomOffset = "calc(4rem + env(safe-area-inset-bottom))",
    className
}: MiniVitalsBannerProps) {
    const [selectedVitalIndex, setSelectedVitalIndex] = useState<number | null>(null);

    const handleVitalClick = useCallback((index: number, vital: VitalEntry) => {
        // If vital has trackType (interactive), toggle the tray
        // Otherwise, use the provided onClick handler (for read-only vitals)
        if (vital.trackType && vital.onIncrement && vital.onDecrement && vital.max) {
            // Toggle: close if already open, open if closed
            setSelectedVitalIndex(prev => prev === index ? null : index);
        } else if (vital.onClick) {
            vital.onClick();
        }
    }, []);

    const handleCloseTray = useCallback(() => {
        setSelectedVitalIndex(null);
    }, []);

    const selectedVital = selectedVitalIndex !== null ? vitals[selectedVitalIndex] : null;
    const isValidTrayVital = selectedVital && selectedVital.trackType && selectedVital.max && selectedVital.onIncrement && selectedVital.onDecrement;

    return (
        <>
            {/* Tray (animated open/close via isOpen prop) */}
            <MiniVitalTray
                isOpen={!!isValidTrayVital}
                label={selectedVital?.label ?? ''}
                current={selectedVital?.rawCurrent ?? selectedVital?.current ?? 0}
                max={selectedVital?.max ?? 0}
                trackType={selectedVital?.trackType ?? 'mark-bad'}
                icon={selectedVital?.icon ?? (() => null)}
                vitalId={selectedVital?.vitalId}
                color={selectedVital?.color ?? ''}
                strokeColor={selectedVital?.strokeColor}
                onIncrement={selectedVital?.onIncrement ?? (() => { })}
                onDecrement={selectedVital?.onDecrement ?? (() => { })}
                onClose={handleCloseTray}
            />

            {/* Mini vitals bar */}
                    <div
                        className={cn(
                            "fixed left-0 right-0 bg-dagger-panel backdrop-blur-lg border-t border-white/10 transition-all",
                            className
                        )}
                        style={{
                            bottom: bottomOffset,
                            zIndex: Z_INDEX.NAV_BAR
                        }}
                    >
                <div className="flex items-center justify-around px-2 py-2">
                    {vitals.map((vital, index) => {
                        const isInteractive = vital.trackType && vital.onIncrement && vital.onDecrement && vital.max;
                        const hasClickHandler = isInteractive || vital.onClick;

                        return (
                            <button
                                key={vital.label}
                                onClick={() => handleVitalClick(index, vital)}
                                disabled={!hasClickHandler}
                                aria-label={`${vital.label}: ${vital.current}${vital.max !== undefined ? ` of ${vital.max}` : ''}${isInteractive ? ' (tap to edit)' : ''}`}
                                className={cn(
                                    "flex flex-col items-center gap-0.5 min-w-[60px] transition-transform",
                                    hasClickHandler ? "active:scale-95 cursor-pointer" : "cursor-default"
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
                        );
                    })}
                </div>
            </div>
        </>
    );
}

/**
 * CHARACTER VITALS BANNER (Smart Component)
 * Connects to the Character Store and provides content for the MiniVitalsPanel.
 * When a character is in an active campaign, also shows the campaign's Fear level.
 * Provides handlers for Mark/Clear actions on interactive vitals.
 */
export default function CharacterVitalsBanner() {
    const { character, cardStates, activeCampaign, vitalIcons: iconPreferences, updateVitals, updateHope } = useCharacterStore();

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
            // Display values (for mini-vital bar)
            hp_marked: hpMax - character.vitals.hit_points_current,
            stress_current: character.vitals.stress_current,
            hope_current: character.hope,
            armor_marked: armorMax - character.vitals.armor_slots,
            // Raw values (for VitalCard tray - matching common-vitals-display.tsx)
            hp_current: character.vitals.hit_points_current,
            armor_slots: character.vitals.armor_slots,
        };
    }, [character, cardStates]);

    // --- VITAL HANDLERS ---
    // HP: mark-bad semantics - current is capacity remaining
    // Mark (-1 to current) = take damage, Clear (+1 to current) = heal
    const handleHpIncrement = useCallback(() => {
        if (!character) return;
        updateVitals('hit_points_current', character.vitals.hit_points_current + 1);
    }, [character, updateVitals]);

    const handleHpDecrement = useCallback(() => {
        if (!character) return;
        updateVitals('hit_points_current', character.vitals.hit_points_current - 1);
    }, [character, updateVitals]);

    // Armor: mark-bad semantics - current is slots remaining
    // Mark (-1 to current) = use armor, Clear (+1 to current) = repair armor
    const handleArmorIncrement = useCallback(() => {
        if (!character) return;
        updateVitals('armor_slots', character.vitals.armor_slots + 1);
    }, [character, updateVitals]);

    const handleArmorDecrement = useCallback(() => {
        if (!character) return;
        updateVitals('armor_slots', character.vitals.armor_slots - 1);
    }, [character, updateVitals]);

    // Stress: fill-up-bad semantics - current is amount accumulated
    // Mark (+1) = gain stress, Clear (-1) = relieve stress
    const handleStressIncrement = useCallback(() => {
        if (!character) return;
        updateVitals('stress_current', character.vitals.stress_current + 1);
    }, [character, updateVitals]);

    const handleStressDecrement = useCallback(() => {
        if (!character) return;
        updateVitals('stress_current', character.vitals.stress_current - 1);
    }, [character, updateVitals]);

    // Hope: fill-up-good semantics - current is amount accumulated
    // Gain (+1) = gain hope, Spend (-1) = use hope
    const handleHopeIncrement = useCallback(() => {
        if (!character) return;
        updateHope(character.hope + 1);
    }, [character, updateHope]);

    const handleHopeDecrement = useCallback(() => {
        if (!character) return;
        updateHope(character.hope - 1);
    }, [character, updateHope]);

    // Early return after hooks
    if (!vitalData) return null;

    // Build vitals array
    const vitals: VitalEntry[] = [];

    // Character vitals
    // Evasion: read-only (no trackType)
    vitals.push({
        label: 'Evasion',
        current: vitalData.evasionTotal,
        icon: getIconByName(iconPreferences.evasion, AppIcons.vitals.evasion),
        vitalId: 'evasion',
        color: 'text-vital-evasion',
        strokeColor: 'stroke-vital-evasion-stroke',
        subLabel: 'Score',
    });

    // Armor: mark-bad (only interactive if armor exists)
    // Colors match common-vitals-display.tsx
    if (vitalData.armorMax > 0) {
        vitals.push({
            label: 'Armor',
            current: vitalData.armor_marked,
            rawCurrent: vitalData.armor_slots,
            max: vitalData.armorMax,
            icon: getIconByName(iconPreferences.armor, AppIcons.vitals.armor),
            vitalId: 'armor',
            color: 'text-vital-armor',
            strokeColor: 'stroke-vital-armor-stroke',
            subLabel: 'Marked',
            trackType: 'mark-bad',
            onIncrement: handleArmorIncrement,
            onDecrement: handleArmorDecrement,
        });
    } else {
        vitals.push({
            label: 'Armor',
            current: 0,
            max: 0,
            icon: getIconByName(iconPreferences.armor, AppIcons.vitals.armor),
            vitalId: 'armor',
            color: 'text-vital-armor',
            subLabel: 'None',
        });
    }

    // HP: mark-bad
    vitals.push({
        label: 'Hit Points',
        current: vitalData.hp_marked,
        rawCurrent: vitalData.hp_current,
        max: vitalData.hpMax,
        icon: getIconByName(iconPreferences.hitPoints, AppIcons.vitals.hitPoints),
        vitalId: 'hitPoints',
        color: 'text-vital-hp',
        strokeColor: 'stroke-vital-hp-stroke',
        subLabel: 'Marked',
        trackType: 'mark-bad',
        onIncrement: handleHpIncrement,
        onDecrement: handleHpDecrement,
    });

    // Stress: fill-up-bad
    vitals.push({
        label: 'Stress',
        current: vitalData.stress_current,
        max: vitalData.stressMax,
        icon: getIconByName(iconPreferences.stress, AppIcons.vitals.stress),
        vitalId: 'stress',
        color: 'text-vital-stress',
        strokeColor: 'stroke-vital-stress-stroke',
        subLabel: 'Marked',
        trackType: 'fill-up-bad',
        onIncrement: handleStressIncrement,
        onDecrement: handleStressDecrement,
    });

    // Hope: fill-up-good
    vitals.push({
        label: 'Hope',
        current: vitalData.hope_current,
        max: vitalData.hopeMax,
        icon: getIconByName(iconPreferences.hope, AppIcons.vitals.hope),
        vitalId: 'hope',
        color: 'text-vital-hope',
        strokeColor: 'stroke-vital-hope-stroke',
        subLabel: 'Gained',
        trackType: 'fill-up-good',
        onIncrement: handleHopeIncrement,
        onDecrement: handleHopeDecrement,
    });

    // Add Fear if in an active campaign (read-only for players)
    // SRD: Max Fear is always 12
    if (activeCampaign) {
        const isHighFear = activeCampaign.fear_current >= 10; // ~83% of max
        vitals.push({
            label: 'Fear',
            current: activeCampaign.fear_current,
            max: 12, // SRD: Max Fear is always 12
            icon: getIconByName(iconPreferences.fear, AppIcons.vitals.fear),
            vitalId: 'fear',
            color: isHighFear ? 'text-vital-fear-high' : 'text-vital-fear',
            strokeColor: isHighFear ? 'stroke-vital-fear-high-stroke' : 'stroke-vital-fear-stroke',
            subLabel: 'Gained',
        });
    }

    return <MiniVitalsPanel vitals={vitals} />;
}
