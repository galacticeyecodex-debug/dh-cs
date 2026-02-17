'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { getClassBaseStat, cn } from '@/lib/utils';
import { getStatModifierTotal, getStatModifiers } from '@/lib/modifier-aggregator';
import { getIconByName, AppIcons, VitalId } from '@/lib/icon-utils';
import { MiniVitalTray, VitalTrackType, SecondaryVitalProps } from './mini-vital-tray';
import { Z_INDEX } from '@/constants/z-index';
import { ModifierTab } from '@/components/shared/modifier-sheet';

// Modifier source types align with ModifierSourceType from modifier-aggregator
type ModifierSourceType = 'equipment' | 'domain_card' | 'user' | 'ancestry' | 'community' | 'class' | 'subclass' | 'system';

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
    /** Called when user wants to mark multiple HP via thresholds */
    onMarkAmount?: (amount: number) => void;
    /** Damage thresholds (for Armor and HP) */
    thresholds?: { minor: number, major: number, severe: number };
    /** Stat modifiers for the modifier sheet */
    modifiers?: { id: string; name: string; value: number; source: ModifierSourceType; type?: string }[];
    /** Callback to update modifiers */
    onUpdateModifiers?: (modifiers: { id: string; name: string; value: number; source: ModifierSourceType; type?: string }[]) => void;
    /** Tabbed sub-stats for the modifier sheet (for Armor thresholds) */
    subStats?: ModifierTab[];
    /** Flag for critical condition (low HP, etc.) */
    isCriticalCondition?: boolean;
    /** Whether the base value has been modified */
    isModified?: boolean;
    /** The expected base value for comparison */
    expectedValue?: number;
}

export interface MiniVitalsBannerProps {
    vitals: VitalEntry[];
    bottomOffset?: string;
    className?: string;
    /** When true, paired vitals (Armor+HP, Stress+Hope) open together and share a visual group. Default: true */
    groupVitalPairs?: boolean;
}

/**
 * Vital group definitions: [secondary (top), primary (bottom)]
 * The first entry in each tuple is rendered on top in the tray.
 */
const VITAL_GROUPS: [string, string][] = [
    ['Armor', 'Hit Points'],
    ['Stress', 'Hope'],
];

/** Find which group a vital label belongs to, if any */
function findGroup(label: string): [string, string] | undefined {
    return VITAL_GROUPS.find(g => g[0] === label || g[1] === label);
}

/** Build a SecondaryVitalProps from a VitalEntry */
function buildSecondaryProps(vital: VitalEntry): SecondaryVitalProps {
    return {
        label: vital.label,
        current: vital.rawCurrent ?? vital.current,
        max: vital.max,
        trackType: vital.trackType,
        icon: vital.icon,
        vitalId: vital.vitalId,
        color: vital.color,
        strokeColor: vital.strokeColor,
        onIncrement: vital.onIncrement,
        onDecrement: vital.onDecrement,
        onMarkAmount: vital.onMarkAmount,
        thresholds: vital.thresholds,
        modifiers: vital.modifiers,
        onUpdateModifiers: vital.onUpdateModifiers,
        subStats: vital.subStats,
        isCriticalCondition: vital.isCriticalCondition,
        isModified: vital.isModified,
        expectedValue: vital.expectedValue,
    };
}

/**
 * A single vital button used both standalone and inside groups.
 */
function VitalButton({
    vital,
    index,
    onClick,
    standalone = true,
}: {
    vital: VitalEntry;
    index: number;
    onClick: (index: number, vital: VitalEntry) => void;
    standalone?: boolean;
}) {
    const isInteractive = (vital.trackType && vital.onIncrement && vital.onDecrement) ||
        (vital.onUpdateModifiers);
    const hasClickHandler = isInteractive || vital.onClick;

    return (
        <button
            key={vital.label}
            onClick={() => onClick(index, vital)}
            disabled={!hasClickHandler}
            aria-label={`${vital.label}: ${vital.current}${vital.max !== undefined ? ` of ${vital.max}` : ''}${isInteractive ? ' (tap to edit)' : ''}`}
            className={cn(
                "flex flex-col items-center gap-0.5 min-w-[48px] transition-transform",
                hasClickHandler ? "cursor-pointer" : "cursor-default",
                // Only add individual active:scale on standalone (ungrouped) items
                standalone && hasClickHandler ? "active:scale-95" : ""
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
}

/** A segment is either a single vital or a pair of vitals rendered together */
type Segment =
    | { type: 'single'; vital: VitalEntry; index: number }
    | { type: 'pair'; vitals: [{ vital: VitalEntry; index: number }, { vital: VitalEntry; index: number }] };

/**
 * MINI VITALS PANEL (UI Only)
 * A pure presentation component that renders a row of vitals.
 * When a vital with a trackType or modifiers is tapped, opens an expandable tray.
 * Paired vitals (Armor+HP, Stress+Hope) are grouped: tapping either shows both.
 */
export function MiniVitalsPanel({
    vitals,
    bottomOffset = "calc(4rem + env(safe-area-inset-bottom))",
    className,
    groupVitalPairs = true
}: MiniVitalsBannerProps) {
    const [selectedVitalIndex, setSelectedVitalIndex] = useState<number | null>(null);

    const handleVitalClick = useCallback((index: number, vital: VitalEntry) => {
        const isInteractive = (vital.trackType && vital.onIncrement && vital.onDecrement) ||
            (vital.onUpdateModifiers);

        if (isInteractive) {
            setSelectedVitalIndex(prev => {
                if (prev === index) return null; // Same button = close

                // If grouping is enabled and both vitals are in the same group, close
                if (groupVitalPairs && prev !== null) {
                    const prevVital = vitals[prev];
                    const prevGroup = prevVital && findGroup(prevVital.label);
                    const clickedGroup = findGroup(vital.label);
                    if (prevGroup && clickedGroup && prevGroup === clickedGroup) {
                        return null;
                    }
                }

                return index;
            });
        } else if (vital.onClick) {
            vital.onClick();
        }
    }, [vitals, groupVitalPairs]);

    const handleCloseTray = useCallback(() => {
        setSelectedVitalIndex(null);
    }, []);

    const selectedVital = selectedVitalIndex !== null ? vitals[selectedVitalIndex] : null;
    const isValidTrayVital = !!selectedVital && (
        (!!selectedVital.trackType && !!selectedVital.onIncrement && !!selectedVital.onDecrement) ||
        (!!selectedVital.onUpdateModifiers)
    );

    // Determine if the selected vital is in a group, and resolve primary/secondary
    const selectedGroup = groupVitalPairs && selectedVital ? findGroup(selectedVital.label) : undefined;
    const partnerVital = selectedGroup
        ? vitals.find(v => selectedGroup.includes(v.label) && v.label !== selectedVital!.label)
        : undefined;

    // In a group, the first label is always the secondary (top), second is primary (bottom)
    const isSelectedSecondary = selectedGroup && selectedVital?.label === selectedGroup[0];
    const primaryVital = isSelectedSecondary ? partnerVital ?? selectedVital : selectedVital;
    const secondaryData: SecondaryVitalProps | undefined = (() => {
        if (!selectedGroup || !partnerVital) return undefined;
        const secondaryVital = isSelectedSecondary ? selectedVital! : partnerVital;
        return buildSecondaryProps(secondaryVital);
    })();

    // Use the resolved primary vital for tray props
    const trayVital = selectedGroup ? primaryVital : selectedVital;

    // Build segments: group paired vitals into shared containers
    const segments = useMemo((): Segment[] => {
        const result: Segment[] = [];
        const consumed = new Set<number>();

        for (let i = 0; i < vitals.length; i++) {
            if (consumed.has(i)) continue;

            if (groupVitalPairs) {
                const group = findGroup(vitals[i].label);
                if (group) {
                    // Find the partner in the vitals array
                    const partnerLabel = group[0] === vitals[i].label ? group[1] : group[0];
                    const partnerIdx = vitals.findIndex((v, j) => j !== i && v.label === partnerLabel);
                    if (partnerIdx >= 0) {
                        consumed.add(i);
                        consumed.add(partnerIdx);
                        result.push({
                            type: 'pair',
                            vitals: [
                                { vital: vitals[i], index: i },
                                { vital: vitals[partnerIdx], index: partnerIdx },
                            ]
                        });
                        continue;
                    }
                }
            }

            result.push({ type: 'single', vital: vitals[i], index: i });
        }

        return result;
    }, [vitals, groupVitalPairs]);

    return (
        <>
            {/* Tray (animated open/close via isOpen prop) */}
            <MiniVitalTray
                isOpen={!!isValidTrayVital}
                label={trayVital?.label ?? ''}
                current={trayVital?.rawCurrent ?? trayVital?.current ?? 0}
                max={trayVital?.max}
                trackType={trayVital?.trackType}
                icon={trayVital?.icon ?? (() => null)}
                vitalId={trayVital?.vitalId}
                color={trayVital?.color ?? ''}
                strokeColor={trayVital?.strokeColor}
                onIncrement={trayVital?.onIncrement}
                onDecrement={trayVital?.onDecrement}
                onMarkAmount={trayVital?.onMarkAmount}
                onClose={handleCloseTray}
                thresholds={trayVital?.thresholds}
                modifiers={trayVital?.modifiers}
                onUpdateModifiers={trayVital?.onUpdateModifiers}
                subStats={trayVital?.subStats}
                isCriticalCondition={trayVital?.isCriticalCondition}
                isModified={trayVital?.isModified}
                expectedValue={trayVital?.expectedValue}
                secondaryVital={secondaryData}
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
                    {segments.map((segment, segIdx) => (
                        <React.Fragment key={segIdx}>
                            {/* Divider between segments (not before first) */}
                            {segIdx > 0 && (
                                <div className="w-px h-8 bg-white/10 flex-shrink-0" />
                            )}

                            {segment.type === 'single' ? (
                                <VitalButton
                                    vital={segment.vital}
                                    index={segment.index}
                                    onClick={handleVitalClick}
                                    standalone={true}
                                />
                            ) : (
                                /* Paired group: shared background pill, container-level active:scale */
                                <div className="flex items-center bg-white/5 rounded-lg px-1 py-0.5 active:scale-95 transition-transform">
                                    {segment.vitals.map((entry, entryIdx) => (
                                        <React.Fragment key={entry.vital.label}>
                                            {entryIdx > 0 && (
                                                <div className="w-px h-6 bg-white/5 flex-shrink-0 mx-0.5" />
                                            )}
                                            <VitalButton
                                                vital={entry.vital}
                                                index={entry.index}
                                                onClick={handleVitalClick}
                                                standalone={false}
                                            />
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </React.Fragment>
                    ))}
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
    const {
        character,
        cardStates,
        activeCampaign,
        vitalIcons: iconPreferences,
        updateVitals,
        updateHope,
        updateEvasion,
        updateModifiers
    } = useCharacterStore();

    // Helper to calculate totals and combine modifiers (memoized)
    const getStatDetails = useCallback((stat: string, base: number) => {
        if (!character) return { total: base, allMods: [] };
        const allMods = getStatModifiers(character, stat, cardStates as any);
        const total = base + allMods.reduce((acc, mod) => acc + mod.value, 0);
        return { total, allMods };
    }, [character, cardStates]);

    // --- VITAL CALCULATIONS (must be before any early returns) ---
    // We compute all values in a single useMemo to avoid hook ordering issues
    const vitalData = useMemo(() => {
        if (!character) return null;

        // HP
        const classBaseHP = getClassBaseStat(character, 'hp');
        const hpDetails = getStatDetails('hit_points', classBaseHP);

        // Stress
        const classBaseStress = 6;
        const stressDetails = getStatDetails('stress', classBaseStress);

        // Hope
        const baseHope = 6;
        const hopeDetails = getStatDetails('hope', baseHope);

        // Evasion
        const classBaseEvasion = getClassBaseStat(character, 'evasion');
        const evasionDetails = getStatDetails('evasion', classBaseEvasion);

        // Armor & Thresholds
        const armorItem = character.character_inventory?.find(item => item.location === 'equipped_armor');
        let armorBaseScore = 0;
        let majorThreshold = character.level;
        let severeThreshold = character.level * 2;

        if (armorItem?.library_item?.data) {
            armorBaseScore = (parseInt(armorItem.library_item.data.base_score) || 0);

            if (armorItem.library_item.data.base_thresholds) {
                const [baseMajor, baseSevere] = armorItem.library_item.data.base_thresholds.split('/').map((s: string) => parseInt(s.trim()));
                majorThreshold = (baseMajor || 0) + character.level;
                severeThreshold = (baseSevere || 0) + character.level;
            }
        } else {
            // Unarmored thresholds
            majorThreshold = character.level;
            severeThreshold = character.level * 2;
        }

        const armorDetails = getStatDetails('armor', armorBaseScore);

        // Threshold calculations (matching CommonVitalsDisplay)
        const genericStats = getStatDetails('damage_thresholds', 0);
        const minorStats = getStatDetails('damage_threshold_minor', 1);
        const majorStats = getStatDetails('damage_threshold_major', majorThreshold);
        const severeStats = getStatDetails('damage_threshold_severe', severeThreshold);

        const genericBonus = genericStats.total;

        const armorSubStats: ModifierTab[] = [
            {
                id: 'armor',
                label: 'Armor',
                baseValue: armorBaseScore,
                currentModifiers: armorDetails.allMods as any,
                onUpdateModifiers: (mods: any[]) => updateModifiers('armor', mods)
            },
            {
                id: 'generic',
                label: 'Thresholds (All)',
                baseValue: 0,
                currentModifiers: genericStats.allMods as any,
                onUpdateModifiers: (mods: any[]) => updateModifiers('damage_thresholds', mods)
            },
            {
                id: 'minor',
                label: 'Minor',
                baseValue: 1,
                currentModifiers: minorStats.allMods as any,
                onUpdateModifiers: (mods: any[]) => updateModifiers('damage_threshold_minor', mods)
            },
            {
                id: 'major',
                label: 'Major',
                baseValue: majorThreshold + genericBonus,
                currentModifiers: majorStats.allMods as any,
                onUpdateModifiers: (mods: any[]) => updateModifiers('damage_threshold_major', mods)
            },
            {
                id: 'severe',
                label: 'Severe',
                baseValue: severeThreshold + genericBonus,
                currentModifiers: severeStats.allMods as any,
                onUpdateModifiers: (mods: any[]) => updateModifiers('damage_threshold_severe', mods)
            }
        ];

        return {
            // HP
            hpMax: hpDetails.total,
            hp_current: character.vitals.hit_points_current,
            hp_marked: hpDetails.total - character.vitals.hit_points_current,
            hp_modifiers: hpDetails.allMods,
            hp_base: classBaseHP,

            // Stress
            stressMax: stressDetails.total,
            stress_current: character.vitals.stress_current,
            stress_modifiers: stressDetails.allMods,
            stress_base: classBaseStress,

            // Hope
            hopeMax: hopeDetails.total,
            hope_current: character.hope,
            hope_modifiers: hopeDetails.allMods,
            hope_base: baseHope,

            // Evasion
            evasionTotal: evasionDetails.total,
            evasion_modifiers: evasionDetails.allMods,
            evasion_base: classBaseEvasion,

            // Armor
            armorMax: armorDetails.total,
            armor_slots: character.vitals.armor_slots,
            armor_marked: armorDetails.total - character.vitals.armor_slots,
            armor_modifiers: armorDetails.allMods,
            armor_base: armorBaseScore,
            armor_subStats: armorSubStats,
            thresholds: character.damage_thresholds,
        };
    }, [character, getStatDetails, updateModifiers]);

    // --- VITAL HANDLERS ---
    const handleHpIncrement = useCallback(() => {
        if (!character || !vitalData) return;
        updateVitals('hit_points_current', character.vitals.hit_points_current + 1);
    }, [character, updateVitals, vitalData]);

    const handleHpDecrement = useCallback(() => {
        if (!character) return;
        updateVitals('hit_points_current', character.vitals.hit_points_current - 1);
    }, [character, updateVitals]);

    const handleHpMarkAmount = useCallback((amount: number) => {
        if (!character) return;
        updateVitals('hit_points_current', Math.max(0, character.vitals.hit_points_current - amount));
    }, [character, updateVitals]);

    const handleArmorIncrement = useCallback(() => {
        if (!character || !vitalData) return;
        updateVitals('armor_slots', character.vitals.armor_slots + 1);
    }, [character, updateVitals, vitalData]);

    const handleArmorDecrement = useCallback(() => {
        if (!character) return;
        updateVitals('armor_slots', character.vitals.armor_slots - 1);
    }, [character, updateVitals]);

    const handleStressIncrement = useCallback(() => {
        if (!character || !vitalData) return;
        updateVitals('stress_current', character.vitals.stress_current + 1);
    }, [character, updateVitals, vitalData]);

    const handleStressDecrement = useCallback(() => {
        if (!character) return;
        updateVitals('stress_current', character.vitals.stress_current - 1);
    }, [character, updateVitals]);

    const handleHopeIncrement = useCallback(() => {
        if (!character || !vitalData) return;
        updateHope(character.hope + 1);
    }, [character, updateHope, vitalData]);

    const handleHopeDecrement = useCallback(() => {
        if (!character) return;
        updateHope(character.hope - 1);
    }, [character, updateHope]);

    const handleUpdateEvasionMods = useCallback((mods: any) => {
        updateModifiers('evasion', mods);
    }, [updateModifiers]);

    const handleUpdateArmorMods = useCallback((mods: any) => {
        updateModifiers('armor', mods);
    }, [updateModifiers]);

    const handleUpdateHPMods = useCallback((mods: any) => {
        updateModifiers('hit_points', mods);
    }, [updateModifiers]);

    const handleUpdateStressMods = useCallback((mods: any) => {
        updateModifiers('stress', mods);
    }, [updateModifiers]);

    const handleUpdateHopeMods = useCallback((mods: any) => {
        updateModifiers('hope', mods);
    }, [updateModifiers]);

    // Early return after hooks
    if (!vitalData || !character) return null;

    // Build vitals array
    const vitals: VitalEntry[] = [];

    // Character vitals
    // Evasion: interactive (for modifiers)
    vitals.push({
        label: 'Evasion',
        current: vitalData.evasionTotal,
        icon: getIconByName(iconPreferences.evasion, AppIcons.vitals.evasion),
        vitalId: 'evasion',
        color: 'text-vital-evasion',
        strokeColor: 'stroke-vital-evasion-stroke',
        subLabel: 'Score',
        trackType: undefined, // Evasion is numeric only
        modifiers: vitalData.evasion_modifiers as any,
        onUpdateModifiers: handleUpdateEvasionMods,
        isModified: vitalData.evasionTotal !== vitalData.evasion_base,
        expectedValue: vitalData.evasion_base,
    });

    // Armor: mark-bad (always interactive to allow modifiers/unarmored view)
    vitals.push({
        label: 'Armor',
        current: vitalData.armor_marked,
        rawCurrent: vitalData.armor_slots,
        max: vitalData.armorMax,
        icon: getIconByName(iconPreferences.armor, AppIcons.vitals.armor),
        vitalId: 'armor',
        color: 'text-vital-armor',
        strokeColor: 'stroke-vital-armor-stroke',
        subLabel: vitalData.armorMax > 0 ? 'Marked' : 'None',
        trackType: 'mark-bad',
        onIncrement: handleArmorIncrement,
        onDecrement: handleArmorDecrement,
        thresholds: vitalData.thresholds,
        modifiers: vitalData.armor_modifiers as any,
        onUpdateModifiers: handleUpdateArmorMods,
        subStats: vitalData.armor_subStats,
        isCriticalCondition: vitalData.armor_slots === 0 && vitalData.armorMax > 0,
        isModified: false, // Match Character View - no modified border/color for Armor
        expectedValue: vitalData.armor_base,
    });

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
        onMarkAmount: handleHpMarkAmount,
        thresholds: vitalData.thresholds,
        modifiers: vitalData.hp_modifiers as any,
        onUpdateModifiers: handleUpdateHPMods,
        isCriticalCondition: vitalData.hp_current === 0,
        isModified: false, // Match Character View - no modified border/color for HP
        expectedValue: vitalData.hp_base,
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
        modifiers: vitalData.stress_modifiers as any,
        onUpdateModifiers: handleUpdateStressMods,
        isCriticalCondition: vitalData.stress_current >= vitalData.stressMax && vitalData.stressMax > 0,
        isModified: false, // Match Character View - no modified border/color for Stress
        expectedValue: vitalData.stress_base,
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
        modifiers: vitalData.hope_modifiers as any,
        onUpdateModifiers: handleUpdateHopeMods,
        isModified: false, // Match Character View - no modified border/color for Hope
        expectedValue: vitalData.hope_base,
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
