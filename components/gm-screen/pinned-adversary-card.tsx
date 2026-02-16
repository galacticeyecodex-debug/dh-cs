'use client';

/**
 * PINNED ADVERSARY CARD
 * ----------------------------------------------------------------------------
 * Extracted from encounter-tracker.tsx for maintainability (<400 LOC).
 * Displays a single pinned adversary with HP/Stress tracking, spotlight toggle,
 * interactive feat buttons, and quick stat reference.
 *
 * SRD Reference: content/public/srd/markdown/contents/The_GM.md
 * "During the GM's turn, the GM can activate their Adversaries."
 */

import { useState, useCallback, useMemo } from 'react';
import { AppIcons } from '@/lib/icon-utils';
import { MarkdownText } from '@/components/shared/markdown-text';
import { AdversaryFeatureButton } from './adversary-feature-button';
import { classifyAndSortFeatures } from '@/lib/card-parser';
import type { PinnedAdversary } from '@/types/campaign';
import clsx from 'clsx';

/**
 * Parse adversary thresholds string "major/severe" into numeric values.
 * SRD: "The numbers listed after 'Threshold' are the adversary's Major and Severe Thresholds."
 * Example: "9/17" → { major: 9, severe: 17 }
 */
function parseThresholds(thresholds: string): { major: number; severe: number } {
    const parts = thresholds.split('/');
    return {
        major: parseInt(parts[0], 10) || 0,
        severe: parseInt(parts[1], 10) || 0,
    };
}

/**
 * Convert raw damage to HP marks based on SRD damage thresholds.
 * SRD Reference: content/public/srd/markdown/contents/Combat.md
 * - If damage >= severe threshold → mark 3 HP
 * - If damage >= major threshold → mark 2 HP
 * - If damage < major threshold → mark 1 HP
 */
function damageToHpMarks(
    damage: number,
    thresholds: { major: number; severe: number }
): { hpLoss: number; severity: 'minor' | 'major' | 'severe' } {
    if (thresholds.severe > 0 && damage >= thresholds.severe) {
        return { hpLoss: 3, severity: 'severe' };
    }
    if (thresholds.major > 0 && damage >= thresholds.major) {
        return { hpLoss: 2, severity: 'major' };
    }
    return { hpLoss: 1, severity: 'minor' };
}

interface PinnedAdversaryCardProps {
    adversary: PinnedAdversary;
    campaignId: string;
    currentFear: number;
    isExpanded: boolean;
    onToggle: () => void;
    onDamage: (amount: number) => void;
    onHeal: (amount: number) => void;
    onDamageStress: (amount: number) => void;
    onHealStress: (amount: number) => void;
    onDefeat: () => void;
    onRevive: () => void;
    onUnpin: () => void;
    onSpotlight: () => void;
    onActivateFeature: (featureName: string, fearCost: number, stressCost: number) => void;
}

export function PinnedAdversaryCard({
    adversary,
    currentFear,
    isExpanded,
    onToggle,
    onDamage,
    onHeal,
    onDamageStress,
    onHealStress,
    onDefeat,
    onRevive,
    onUnpin,
    onSpotlight,
    onActivateFeature,
}: PinnedAdversaryCardProps) {
    const [damageInput, setDamageInput] = useState('');
    const [stressDamageInput, setStressDamageInput] = useState('');
    const [lastHit, setLastHit] = useState<{ hpLoss: number; severity: string } | null>(null);

    const thresholds = useMemo(() => parseThresholds(adversary.thresholds), [adversary.thresholds]);

    const hpPercent = adversary.hp_max > 0
        ? (adversary.hp_current / adversary.hp_max) * 100
        : 0;

    const stressPercent = adversary.stress_max > 0
        ? (adversary.stress_current / adversary.stress_max) * 100
        : 0;

    const hpColor = hpPercent > 50
        ? 'bg-green-500'
        : hpPercent > 25
            ? 'bg-yellow-500'
            : 'bg-red-500';

    const classifiedFeatures = adversary.feats
        ? classifyAndSortFeatures(adversary.feats)
        : [];

    // Preview what threshold would be hit for current input
    const damagePreview = useMemo(() => {
        const amount = parseInt(damageInput);
        if (isNaN(amount) || amount <= 0) return null;
        return damageToHpMarks(amount, thresholds);
    }, [damageInput, thresholds]);

    const handleDamageSubmit = useCallback(() => {
        const amount = parseInt(damageInput);
        if (isNaN(amount) || amount <= 0) return;

        const result = damageToHpMarks(amount, thresholds);
        onDamage(result.hpLoss);
        setDamageInput('');

        // Show result briefly
        setLastHit(result);
        setTimeout(() => setLastHit(null), 1500);
    }, [damageInput, thresholds, onDamage]);

    const handleStressDamageSubmit = () => {
        const amount = parseInt(stressDamageInput);
        if (!isNaN(amount) && amount > 0) {
            onDamageStress(amount);
            setStressDamageInput('');
        }
    };

    return (
        <div className={clsx(
            'p-3 transition-all',
            adversary.is_defeated
                ? 'opacity-50 bg-black/20'
                : 'hover:bg-white/5',
            adversary.is_spotlighted && !adversary.is_defeated
            && 'border-l-2 border-l-dagger-gold bg-dagger-gold/5'
        )}>
            {/* Header Row */}
            <div className="flex items-center gap-2">
                {/* Spotlight Button */}
                {!adversary.is_defeated && (
                    <button
                        onClick={onSpotlight}
                        className={clsx(
                            'p-1 rounded transition-colors flex-shrink-0',
                            adversary.is_spotlighted
                                ? 'text-dagger-gold bg-dagger-gold/20'
                                : 'text-gray-600 hover:text-dagger-gold hover:bg-dagger-gold/10'
                        )}
                        title={adversary.is_spotlighted ? 'Spotlighted' : 'Spotlight this adversary'}
                    >
                        <AppIcons.combat.target size={14} />
                    </button>
                )}

                <button
                    onClick={onToggle}
                    className="flex-1 text-left flex items-center gap-3 min-w-0"
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className={clsx(
                                'font-bold',
                                adversary.is_defeated ? 'text-gray-500 line-through' : 'text-white'
                            )}>
                                {adversary.label}
                            </h3>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
                                T{adversary.tier}
                            </span>
                            {adversary.is_defeated && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400">
                                    Defeated
                                </span>
                            )}
                            {adversary.is_spotlighted && !adversary.is_defeated && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-dagger-gold/20 text-dagger-gold">
                                    Active
                                </span>
                            )}
                        </div>

                        {/* HP Bar */}
                        {!adversary.is_defeated && (
                            <div className="flex items-center gap-2 mt-1.5">
                                <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                                    <div
                                        className={clsx('h-full rounded-full transition-all duration-300', hpColor)}
                                        style={{ width: `${hpPercent}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-400 tabular-nums min-w-[48px] text-right">
                                    {adversary.hp_current}/{adversary.hp_max}
                                </span>
                            </div>
                        )}
                    </div>

                    {isExpanded ? (
                        <AppIcons.ui.collapse size={18} className="text-gray-500 flex-shrink-0" />
                    ) : (
                        <AppIcons.ui.expand size={18} className="text-gray-500 flex-shrink-0" />
                    )}
                </button>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-3 space-y-3">
                    {/* HP & Stress Tracks */}
                    {!adversary.is_defeated && (
                        <div className="space-y-2">
                            {/* HP Damage Input */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 min-w-[60px]">
                                    <AppIcons.vitals.hitPoints size={14} className="text-red-400" />
                                    <span className="text-xs text-gray-400">HP</span>
                                </div>
                                <div className="flex-1 flex items-center gap-1">
                                    <button
                                        onClick={() => onHeal(1)}
                                        className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded text-xs font-bold transition-colors"
                                    >
                                        +1
                                    </button>
                                    <input
                                        type="number"
                                        value={damageInput}
                                        onChange={(e) => setDamageInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleDamageSubmit()}
                                        placeholder="Dmg"
                                        min={1}
                                        className="w-16 px-2 py-1 bg-black/40 border border-white/10 rounded text-xs text-white text-center placeholder:text-gray-600 focus:outline-none focus:border-red-500/50"
                                    />
                                    <button
                                        onClick={handleDamageSubmit}
                                        disabled={!damageInput}
                                        className={clsx(
                                            'px-2 py-1 rounded text-xs font-bold transition-colors disabled:opacity-30',
                                            damagePreview?.severity === 'severe'
                                                ? 'bg-red-600/30 hover:bg-red-600/40 text-red-200'
                                                : damagePreview?.severity === 'major'
                                                    ? 'bg-orange-500/30 hover:bg-orange-500/40 text-orange-200'
                                                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-300'
                                        )}
                                    >
                                        {damagePreview
                                            ? `−${damagePreview.hpLoss} ${damagePreview.severity[0].toUpperCase() + damagePreview.severity.slice(1)}`
                                            : 'HIT POINTS MARKED'}
                                    </button>
                                </div>
                                {/* Result flash or HP count */}
                                {lastHit ? (
                                    <span className={clsx(
                                        'text-xs font-bold tabular-nums animate-pulse',
                                        lastHit.severity === 'severe' ? 'text-red-400'
                                            : lastHit.severity === 'major' ? 'text-orange-400'
                                                : 'text-yellow-400'
                                    )}>
                                        −{lastHit.hpLoss} HP
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-500 tabular-nums">
                                        {adversary.hp_current}/{adversary.hp_max}
                                    </span>
                                )}
                            </div>

                            {/* Stress Damage Input */}
                            {adversary.stress_max > 0 && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 min-w-[60px]">
                                        <AppIcons.vitals.stress size={14} className="text-purple-400" />
                                        <span className="text-xs text-gray-400">Stress</span>
                                    </div>
                                    <div className="flex-1 flex items-center gap-1">
                                        <button
                                            onClick={() => onHealStress(1)}
                                            className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded text-xs font-bold transition-colors"
                                        >
                                            +1
                                        </button>
                                        <input
                                            type="number"
                                            value={stressDamageInput}
                                            onChange={(e) => setStressDamageInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleStressDamageSubmit()}
                                            placeholder="Dmg"
                                            min={1}
                                            className="w-16 px-2 py-1 bg-black/40 border border-white/10 rounded text-xs text-white text-center placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
                                        />
                                        <button
                                            onClick={handleStressDamageSubmit}
                                            disabled={!stressDamageInput}
                                            className="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-30 text-purple-300 rounded text-xs font-bold transition-colors"
                                        >
                                            Hit
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-12 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 rounded-full transition-all duration-300"
                                                style={{ width: `${stressPercent}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500 tabular-nums">
                                            {adversary.stress_current}/{adversary.stress_max}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <div className="flex items-center gap-1.5 bg-black/20 rounded px-2 py-1.5">
                            <AppIcons.combat.target size={12} className="text-yellow-400" />
                            <span className="text-gray-400">Diff:</span>
                            <span className="text-white font-bold">{adversary.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-black/20 rounded px-2 py-1.5">
                            <AppIcons.vitals.armor size={12} className="text-blue-400" />
                            <span className="text-gray-400">Thr:</span>
                            <span className="text-white font-bold">{adversary.thresholds}</span>
                        </div>
                    </div>

                    {/* Attack Info */}
                    <div className="bg-black/20 rounded-lg p-2 text-xs">
                        <div className="flex items-center gap-1.5 mb-1">
                            <AppIcons.combat.attack size={12} className="text-orange-400" />
                            <MarkdownText className="text-white font-bold inline-block">{adversary.attack}</MarkdownText>
                            <span className="text-gray-500">({adversary.range})</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-gray-400">Atk: <MarkdownText className="text-white font-bold inline-block">{adversary.atk}</MarkdownText></span>
                            <span className="text-gray-400">Dmg: <MarkdownText className="text-orange-300 font-bold inline-block">{adversary.damage}</MarkdownText></span>
                        </div>
                    </div>

                    {/* Feature Buttons */}
                    {classifiedFeatures.length > 0 && (
                        <div className="space-y-1.5">
                            <h4 className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                Features
                            </h4>
                            {classifiedFeatures.map((cf) => (
                                <AdversaryFeatureButton
                                    key={cf.feat.name}
                                    classified={cf}
                                    currentFear={currentFear}
                                    adversaryStress={adversary.stress_current}
                                    onActivate={() => onActivateFeature(cf.feat.name, cf.fearCost, cf.stressCost)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Motives */}
                    <div className="text-xs">
                        <span className="text-gray-500">Motives: </span>
                        <MarkdownText className="text-gray-300 inline-block align-top">
                            {adversary.motives_and_tactics}
                        </MarkdownText>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1">
                        {adversary.is_defeated ? (
                            <button
                                onClick={onRevive}
                                className="flex-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-xs font-medium transition-colors"
                            >
                                Revive
                            </button>
                        ) : (
                            <button
                                onClick={onDefeat}
                                className="flex-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-medium transition-colors"
                            >
                                Defeat
                            </button>
                        )}
                        <button
                            onClick={onUnpin}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-400 rounded-lg text-xs font-medium transition-colors"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
