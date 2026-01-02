'use client';

/**
 * ATTACK CARD COMPONENT
 * ----------------------------------------------------------------------------
 * A reusable card component for displaying attack options in combat.
 * Used for: Weapons, Companion Attacks, Transformation Attacks, Heritage Features
 *
 * FEATURES:
 * - Consistent styling across all attack types
 * - Optional gear button for modifier management
 * - Dice indicators on roll buttons
 * - Support for different border variants (companion gold, heritage colors)
 * - Optional icon and description display
 * - Optional costs (stress/hope) for abilities
 * - Optional action type badges (reaction, action)
 */

import React, { useState } from 'react';
import { MarkdownText } from '@/components/shared/markdown-text';
import { Zap, Skull, Dices, RotateCcw, Info } from 'lucide-react';
import clsx from 'clsx';
import { getValueColor } from '@/lib/styles';
import MarkStressButton from './mark-stress-button';
import SpendHopeButton from './spend-hope-button';

export interface AttackCardCosts {
    stress?: number;
    hope?: number;
}

export interface AttackCardProps {
    /** Unique identifier for the card */
    id: string;
    /** Display name of the attack */
    name: string;
    /** The trait used for this attack (e.g., "Strength", "Agility") */
    trait: string;
    /** Attack range (e.g., "Melee", "Ranged", "Very Close") */
    range: string;
    /** Base damage dice (e.g., "1d8", "2d6") - optional for non-damage abilities */
    baseDamage?: string;
    /** Calculated damage after proficiency multiplier - optional */
    calculatedDamage?: string;
    /** Total attack bonus (trait + modifiers) */
    totalAttackBonus: number;
    /** Attack modifier from equipment/effects (used for gold highlighting) */
    attackModifier: number;
    /** Damage modifier from equipment/effects (used for gold highlighting) */
    damageModifier: number;
    /** Character's proficiency value */
    proficiency: number;
    /** Callback when Attack button is clicked - optional if no attack roll */
    onAttackRoll?: () => void;
    /** Callback when Damage button is clicked - optional if no damage */
    onDamageRoll?: () => void;
    /** Optional callback for gear button - if provided, gear button is shown */
    onManageModifiers?: () => void;
    /** Optional damage type (e.g., "Physical", "Magic") */
    damageType?: string;
    /** Optional icon to display next to the name */
    icon?: React.ReactNode;
    /** Optional description text to show below badges */
    description?: string;
    /** Additional badges to display */
    badges?: Array<{
        label: string;
        className?: string;
    }>;
    /** Border variant for different card types */
    borderVariant?: 'default' | 'companion' | 'ancestry' | 'community' | 'spell' | 'reaction' | 'class' | 'subclass';
    /** Action type (reaction, action, etc.) */
    actionType?: string;
    /** Costs for using this ability */
    costs?: AttackCardCosts;
    /** Optional callbacks for cost buttons */
    onMarkStress?: () => void;
    onSpendHope?: () => void;
    /** Optional token track component */
    tokenTrack?: React.ReactNode;
    /** Optional frequency checkbox component */
    frequency?: React.ReactNode;
    /** Optional custom actions to render in the action bar (replaces default cost buttons) */
    customActions?: React.ReactNode;
    /** Label for the main roll button (default: "Attack" or "Roll") */
    rollLabel?: string;
    /** Whether the card is currently used/exhausted */
    isUsed?: boolean;
}

const AttackCard = React.memo(function AttackCard({
    id,
    name,
    trait,
    range,
    baseDamage,
    calculatedDamage,
    totalAttackBonus,
    attackModifier,
    damageModifier,
    proficiency,
    onAttackRoll,
    onDamageRoll,
    onManageModifiers,
    damageType,
    icon,
    description,
    badges = [],
    borderVariant = 'default',
    actionType,
    costs,
    onMarkStress,
    onSpendHope,
    tokenTrack,
    frequency,
    customActions,
    rollLabel,
    isUsed = false,
}: AttackCardProps) {
    const [isCostPaid, setIsCostPaid] = useState(false);
    const [showDescription, setShowDescription] = useState(false);

    // Determine styles based on variant
    const borderClasses = {
        default: 'border-white/10 hover:border-white/30',
        companion: 'border-dagger-gold/30 hover:border-dagger-gold/50',
        ancestry: 'border-emerald-500/30 hover:border-white/30',
        community: 'border-amber-500/30 hover:border-white/30',
        spell: 'border-purple-500/30 hover:border-purple-500/50',
        reaction: 'border-orange-500/30 hover:border-orange-500/50',
        class: 'border-cyan-500/30 hover:border-white/30',
        subclass: 'border-indigo-500/30 hover:border-white/30',
    };

    const bgClasses = {
        default: '',
        companion: '',
        ancestry: '',
        community: '',
        spell: 'bg-purple-900/10',
        reaction: 'bg-orange-900/10',
        class: 'bg-cyan-900/5',
        subclass: 'bg-indigo-900/5',
    };

    // Check if we have damage to display
    const hasDamage = baseDamage && calculatedDamage;

    // Determine default roll label
    const finalRollLabel = rollLabel || (hasDamage ? 'Attack' : 'Roll');

    // Cost activation logic
    const needsActivation = !!(costs?.stress || costs?.hope);
    const canRoll = !needsActivation || isCostPaid;

    return (
        <div
            className={clsx(
                'bg-dagger-panel border rounded-xl overflow-hidden transition-colors',
                borderClasses[borderVariant],
                bgClasses[borderVariant],
                isUsed && 'opacity-50'
            )}
        >
            {/* Header Section */}
            <div className="p-4 flex justify-between items-start relative">
                {/* Action buttons - top right corner of header */}
                <div className="absolute top-1 right-1 z-10 flex items-center gap-0.5">
                    {/* Info button - toggle description visibility */}
                    {description && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDescription(!showDescription);
                            }}
                            className={clsx(
                                "transition-colors p-0.5 rounded hover:bg-white/10",
                                showDescription ? "text-dagger-gold" : "text-gray-500 hover:text-gray-300"
                            )}
                            aria-label={`${showDescription ? 'Hide' : 'Show'} ${name} description`}
                            title={showDescription ? "Hide description" : "Show description"}
                        >
                            <Info size={12} />
                        </button>
                    )}
                    {/* Gear button for modifiers */}
                    {onManageModifiers && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onManageModifiers();
                            }}
                            className="text-gray-500 hover:text-gray-300 transition-colors p-0.5 rounded hover:bg-white/10"
                            aria-label={`Manage ${name} modifiers`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Name and Badges */}
                <div className="flex-1 mr-4">
                    <div className="flex items-center gap-2">
                        {icon}
                        <h4 className="font-serif font-bold text-white text-lg">{name}</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-1">
                        {/* Custom badges first */}
                        {badges.map((badge, idx) => (
                            <span
                                key={idx}
                                className={clsx('uppercase px-1.5 py-0.5 rounded', badge.className || 'bg-white/10')}
                            >
                                {badge.label}
                            </span>
                        ))}
                        {/* Standard trait and range badges */}
                        <span className="uppercase bg-white/10 px-1.5 py-0.5 rounded">{trait}</span>
                        {range && (
                            <span className="uppercase bg-white/10 px-1.5 py-0.5 rounded">{range}</span>
                        )}
                        {damageType && (
                            <span className="text-gray-400 uppercase">{damageType}</span>
                        )}
                        {/* Action type badge */}
                        {actionType && actionType !== 'passive' && (
                            <span className={clsx(
                                'uppercase px-1.5 py-0.5 rounded',
                                actionType === 'reaction' ? 'bg-orange-900/30 text-orange-400' : 'bg-purple-900/30 text-purple-400'
                            )}>
                                {actionType}
                            </span>
                        )}
                    </div>
                </div>

                {/* Damage Display - only show if we have damage */}
                {hasDamage && (
                    <div className="text-right">
                        <div className={clsx('text-xl font-bold', getValueColor(damageModifier !== 0))}>
                            {calculatedDamage}
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase">
                            {baseDamage.replace(/\*\*/g, '')} × {proficiency}
                        </div>
                    </div>
                )}
            </div>

            {/* Collapsible Description Section */}
            {showDescription && description && (
                <div className="mx-4 mb-2 p-3 bg-white/5 rounded-lg border border-white/5 text-sm text-gray-300">
                    <MarkdownText>{description}</MarkdownText>
                </div>
            )}

            {/* Token Track */}
            {tokenTrack && (
                <div className="px-4 pb-2">
                    {tokenTrack}
                </div>
            )}

            {/* Costs Bar */}
            {needsActivation && (
                <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        {costs?.stress && (
                            <MarkStressButton
                                cost={costs.stress}
                                size="sm"
                                onMark={() => {
                                    setIsCostPaid(true);
                                    onMarkStress?.();
                                }}
                                disabled={isCostPaid || isUsed}
                                className={isCostPaid ? 'opacity-50' : ''}
                            />
                        )}
                        {costs?.hope && (
                            <SpendHopeButton
                                cost={costs.hope}
                                size="sm"
                                onSpend={() => {
                                    setIsCostPaid(true);
                                    onSpendHope?.();
                                }}
                                disabled={isCostPaid || isUsed}
                                className={isCostPaid ? 'opacity-50' : ''}
                            />
                        )}
                    </div>
                    {isCostPaid && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsCostPaid(false);
                            }}
                            className="text-[10px] text-gray-500 hover:text-white uppercase tracking-wider font-bold flex items-center gap-1 transition-colors"
                            title="Reset cost activation"
                        >
                            <RotateCcw size={10} />
                            Reset
                        </button>
                    )}
                </div>
            )}

            {/* Action Bar */}
            <div className="bg-black/40 p-2 flex flex-wrap gap-2 items-center">
                {/* Custom Actions (Smart Buttons) */}
                {customActions}

                {/* Attack Button */}
                {onAttackRoll && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAttackRoll();
                        }}
                        disabled={isUsed || !canRoll}
                        className={clsx(
                            'relative flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors',
                            attackModifier !== 0 && 'text-dagger-gold',
                            (isUsed || !canRoll) ? 'opacity-30 cursor-not-allowed' : 'hover:bg-opacity-60',
                            !isCostPaid && needsActivation && 'border border-dashed border-white/20'
                        )}
                    >
                        {/* Dice icon for roll action */}
                        <div
                            className="absolute top-1 right-1 text-gray-500 transition-colors pointer-events-none"
                            aria-hidden="true"
                        >
                            <Dices size={12} />
                        </div>
                        <Zap size={16} className={clsx(canRoll ? "text-yellow-400" : "text-gray-500")} />
                        {finalRollLabel} ({totalAttackBonus >= 0 ? `+${totalAttackBonus}` : totalAttackBonus})
                    </button>
                )}

                {/* Damage Button - only show if we have damage */}
                {hasDamage && onDamageRoll && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDamageRoll();
                        }}
                        disabled={isUsed || !canRoll}
                        className={clsx(
                            'relative flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors',
                            damageModifier !== 0 && 'text-dagger-gold',
                            (isUsed || !canRoll) ? 'opacity-30 cursor-not-allowed' : 'hover:bg-opacity-60',
                            !isCostPaid && needsActivation && 'border border-dashed border-white/20'
                        )}
                    >
                        {/* Dice icon for roll action */}
                        <div
                            className="absolute top-1 right-1 text-gray-500 transition-colors pointer-events-none"
                            aria-hidden="true"
                        >
                            <Dices size={12} />
                        </div>
                        <Skull size={16} className={clsx(canRoll ? "text-red-400" : "text-gray-500")} />
                        Damage {damageModifier !== 0 && `(${damageModifier >= 0 ? `+${damageModifier}` : damageModifier})`}
                    </button>
                )}

                {/* Frequency Checkbox */}
                {frequency}
            </div>
        </div>
    );
});

export default AttackCard;
