'use client';

/**
 * ATTACK CARD COMPONENT
 * ----------------------------------------------------------------------------
 * A unified card component for displaying game features across all views.
 * Used for: Combat attacks, Character features, Playmat cards, Spells, Heritage Features
 *
 * FEATURES:
 * - Consistent styling across all attack/feature types
 * - Context-aware rendering (combat, character, playmat)
 * - Optional gear button for modifier management
 * - Dice indicators on roll buttons
 * - Support for different border variants (companion gold, heritage colors)
 * - Optional icon and description display
 * - Optional costs (stress/hope) for abilities
 * - Optional action type badges (reaction, action)
 * - Two rendering variants: 'standalone' for combat/playmat, 'feature' for character
 */

import React, { useState } from 'react';
import { MarkdownText } from '@/components/shared/markdown-text';
import { AppIcons } from '@/lib/icon-utils';
import clsx from 'clsx';
import { getValueColor } from '@/lib/styles';
import { DomainAbilityButton } from '@/components/shared/ability-cost-button';
import { DomainCostsRow } from '@/components/shared/ability-costs-row';
import { RollButton } from '@/components/shared/roll-button';

import { AdditionalDamage, EnhancedAbilityCard } from '@/types/cards';
import MechanicsTray from '@/components/shared/mechanics-tray';
import { getEnhancement, getModifiers } from '@/lib/enhancement-utils';
import { useCardMechanics } from '@/hooks/useCardMechanics';

export interface AttackCardCosts {
    stress?: number;
    hope?: number;
}

export interface AttackCardProps {
    /** Unique identifier for the card */
    id: string;
    /** Display name of the attack */
    name: string;
    /** The trait used for this attack (e.g., "Strength", "Agility") - optional for features */
    trait?: string;
    /** Attack range (e.g., "Melee", "Ranged", "Very Close") - optional for features */
    range?: string;
    /** Base damage dice (e.g., "1d8", "2d6") - optional for non-damage abilities */
    baseDamage?: string;
    /** Calculated damage after proficiency multiplier - optional */
    calculatedDamage?: string;
    /** Total attack bonus (trait + modifiers) - default 0 for features */
    totalAttackBonus?: number;
    /** Attack modifier from equipment/effects (used for gold highlighting) - default 0 */
    attackModifier?: number;
    /** Damage modifier from equipment/effects (used for gold highlighting) - default 0 */
    damageModifier?: number;
    /** Character's proficiency value - optional for features */
    proficiency?: number;
    /** Callback when Attack button is clicked - optional if no attack roll */
    onAttackRoll?: () => void;
    /** Callback when Damage button is clicked - optional if no damage */
    onDamageRoll?: () => void;
    /** Optional callback for gear button - if provided, gear button is shown */
    onManageModifiers?: () => void;
    /** Optional additional damage instances */
    additionalDamage?: AdditionalDamage[];
    /** Callback for rolling additional damage */
    onAdditionalDamageRoll?: (damage: string, label: string) => void;
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
    /** Roll information - used to determine if costs are required for the roll */
    roll?: { requires_cost_for_roll?: boolean };
    /** Enhanced ability data for domain cards - enables modifier activation rows */
    enhancedData?: EnhancedAbilityCard;
    /** 'standalone': standard card look. 'feature': compact look for grid/list grouping */
    variant?: 'standalone' | 'feature';
    /** Context for styling hierarchy: 'combat' (dark), 'character' (light), 'playmat' (dark) */
    context?: 'combat' | 'character' | 'playmat';
}

const AttackCard = React.memo(function AttackCard({
    id,
    name,
    trait,
    range,
    baseDamage,
    calculatedDamage,
    totalAttackBonus = 0,
    attackModifier = 0,
    damageModifier = 0,
    proficiency,
    onAttackRoll,
    onDamageRoll,
    onManageModifiers,
    additionalDamage,
    onAdditionalDamageRoll,
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
    roll,
    enhancedData,
    variant = 'standalone',
    context = 'combat',
}: AttackCardProps) {
    const [isCostPaid, setIsCostPaid] = useState(false);
    // In character context, show descriptions by default so players can learn about their abilities
    const [showDescription, setShowDescription] = useState(context === 'character');

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
        spell: '',
        reaction: '',
        class: '',
        subclass: '',
    };

    // Check if we have damage to display
    const hasDamage = baseDamage && calculatedDamage;

    // Determine default roll label
    const finalRollLabel = rollLabel || (hasDamage ? 'Attack' : 'Roll');

    // Cost activation logic:
    // 1. If roll?.requires_cost_for_roll is true, costs are prerequisites for rolling
    // 2. If there are costs but NO roll (e.g., Deft Maneuvers), always show costs
    // 3. If roll exists but requires_cost_for_roll is false/undefined, costs are post-roll (don't gate the roll)
    const hasCosts = !!(costs?.stress || costs?.hope);
    const hasRoll = !!onAttackRoll;
    const needsActivation = hasCosts && (roll?.requires_cost_for_roll === true || !hasRoll);
    const canRoll = !needsActivation || isCostPaid;

    // Check if enhancedData has actionable mechanics (not just metadata like range/keywords)
    const hasEnhancedMechanics = (() => {
        if (!enhancedData) return false;
        const enhancement = getEnhancement(enhancedData);
        if (!enhancement) return false;

        // Check for tokens
        const hasTokens = enhancement.tokens?.has_tokens && (
            ((enhancement.tokens.max_tokens ?? 0) > 0) ||
            !!enhancement.tokens.token_source
        );
        // Check for non-at_will frequency
        const hasFrequency = enhancement.frequency && enhancement.frequency !== 'at_will';
        // Check for duration
        const hasDuration = !!enhancement.duration;
        // Check for costs
        const hasEnhancedCosts = !!(enhancement.costs?.stress || enhancement.costs?.hope);
        // Check for when_active or when_active_permanent modifiers
        const modifiers = getModifiers(enhancedData);
        const hasWhenActiveModifiers = modifiers.some(mod =>
            mod.condition?.type === 'when_active' ||
            mod.condition?.type === 'when_active_permanent' ||
            mod.condition?.type === 'loadout_domain_count'
        );

        return hasTokens || hasFrequency || hasDuration || hasEnhancedCosts || hasWhenActiveModifiers;
    })();

    const hasInteractiveContent = !!(tokenTrack || hasEnhancedMechanics || needsActivation || customActions || onAttackRoll || (hasDamage && onDamageRoll) || (additionalDamage && additionalDamage.length > 0) || frequency);

    // Context-specific background styling
    // For standalone variant: use context-based colors
    // For feature variant: always use light background (bg-white/5) within darker parent container
    const contextBgClass = variant === 'feature'
        ? 'bg-white/5'
        : {
            combat: 'bg-dagger-panel',
            character: 'bg-white/5',
            playmat: 'bg-dagger-panel',
        }[context];

    return (
        <div
            className={clsx(
                variant === 'standalone'
                    ? clsx(contextBgClass, 'border rounded-xl', borderClasses[borderVariant], bgClasses[borderVariant])
                    : contextBgClass,
                variant === 'feature' && 'rounded border border-white/5 p-3',
                'transition-colors overflow-hidden',
                isUsed && 'opacity-50'
            )}
        >
            {/* Header Section */}
            <div className={clsx(
                "flex justify-between items-start relative",
                variant === 'standalone' ? 'p-4' : 'mb-2'
            )}>
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
                            <AppIcons.ui.info size={12} />
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
                            <AppIcons.ui.settings size={12} />
                        </button>
                    )}
                </div>

                {/* Name and Icon Only (Badges moved below description) */}
                <div className="flex-1 mr-4">
                    <div className="flex items-center gap-2">
                        {icon}
                        {variant === 'feature' ? (
                            <h4 className="text-xs font-bold text-dagger-gold uppercase tracking-wider">{name}</h4>
                        ) : (
                            <h4 className="font-serif font-bold text-white text-lg">{name}</h4>
                        )}
                    </div>
                </div>

            </div>

            {/* Content: Description, Badges, Mechanics, and Actions */}
            {(showDescription || tokenTrack || (enhancedData && (getEnhancement(enhancedData))) || needsActivation || customActions || onAttackRoll || (hasDamage && onDamageRoll) || (additionalDamage && additionalDamage.length > 0) || frequency) && (
                <div className="flex flex-col">
                    {/* Description (toggled) */}
                    {showDescription && description && (
                        <div className={clsx(
                            "text-sm text-gray-300 leading-relaxed mb-3",
                            variant === 'standalone' ? 'px-4' : ''
                        )}>
                            <MarkdownText>{description}</MarkdownText>
                        </div>
                    )}

                    {/* Badges Row - only show if we have content */}
                    {(trait || range || damageType || actionType || badges.length > 0) && (
                        <div className={clsx(
                            "flex flex-wrap gap-1.5",
                            variant === 'standalone' ? 'px-4 pb-4' : '',
                            showDescription && description && "pt-0"
                        )}>
                            {/* Custom badges first */}
                            {badges.map((badge, idx) => (
                                <span
                                    key={idx}
                                    className={clsx('uppercase px-1.5 py-0.5 rounded-sm border border-white/10 bg-white/5 font-semibold text-[10px] text-gray-400', badge.className)}
                                >
                                    {badge.label}
                                </span>
                            ))}
                            {/* Standard trait and range badges */}
                            {trait && (
                                <span className="uppercase bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-sm font-semibold text-[10px] text-gray-400">{trait}</span>
                            )}
                            {range && (
                                <span className="uppercase bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-sm font-semibold text-[10px] text-gray-400">{range}</span>
                            )}
                            {damageType && (
                                <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-sm font-semibold uppercase text-[10px] text-gray-400">{damageType}</span>
                            )}
                            {/* Action type badge */}
                            {actionType && actionType !== 'passive' && (
                                <span className={clsx(
                                    'uppercase px-1.5 py-0.5 rounded-sm font-semibold border text-[10px]',
                                    actionType === 'reaction' ? 'bg-orange-900/10 border-orange-500/20 text-orange-400/80' : 'bg-purple-900/10 border-purple-500/20 text-purple-400/80'
                                )}>
                                    {actionType}
                                </span>
                            )}
                        </div>
                    )}

                    {/* FEATURE VARIANT: Unified Interactive Section */}
                    {variant === 'feature' && hasInteractiveContent && (
                        <div className="mt-2 pt-3 border-t border-white/10 space-y-2">
                            {/* Tokens & Mechanics (Block Level) */}
                            {(tokenTrack || hasEnhancedMechanics) && (
                                <div className="space-y-2">
                                    {tokenTrack && !hasEnhancedMechanics && (
                                        <div className="pb-1">
                                            {tokenTrack}
                                        </div>
                                    )}
                                    {hasEnhancedMechanics && enhancedData && (() => {
                                        const enhancement = getEnhancement(enhancedData);
                                        if (!enhancement) return null;
                                        return (
                                            <MechanicsTray
                                                cardName={name}
                                                enhancement={enhancement}
                                                enhancedData={enhancedData}
                                                costMode="uncontrolled"
                                                isCostPaid={isCostPaid}
                                                variant="nested"
                                                showAttackButton={!!onAttackRoll}
                                                // Pass the main roll handler and details to MechanicsTray
                                                onRoll={onAttackRoll}
                                                rollLabel={finalRollLabel}
                                                rollBonus={totalAttackBonus}
                                                // Pass damage details
                                                onDamageRoll={onDamageRoll}
                                                finalDamage={calculatedDamage}
                                                // Pass additional damage
                                                additionalDamage={additionalDamage}
                                                onAdditionalDamageRoll={onAdditionalDamageRoll}
                                                // Ensure we signal that we have rolls so the tray renders the row
                                                hasAttackOrRoll={!!onAttackRoll || (!!hasDamage && !!onDamageRoll)}
                                            />
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Manual Actions Row - renders when no enhanced mechanics (MechanicsTray handles that case) */}
                            {(!hasEnhancedMechanics || customActions) && (
                                <>
                                    {!hasEnhancedMechanics && (needsActivation || onAttackRoll || (hasDamage && onDamageRoll) || (additionalDamage && (additionalDamage.length > 0)) || frequency) && (
                                        <div className={clsx(
                                            "flex flex-wrap gap-2 items-center",
                                            // Only add border if there are token/mechanics elements above
                                            tokenTrack && "mt-2 pt-3 border-t border-white/10"
                                        )}>
                                            {/* Costs */}
                                            {needsActivation && (
                                                <DomainCostsRow
                                                    cardName={name}
                                                    displayName={name}
                                                    costs={costs}
                                                    isActiveOverride={isCostPaid}
                                                    onActivate={() => {
                                                        setIsCostPaid(true);
                                                        if (costs?.stress && onMarkStress) onMarkStress();
                                                        if (costs?.hope && onSpendHope) onSpendHope();
                                                    }}
                                                    onDeactivate={() => setIsCostPaid(false)}
                                                    disabled={isCostPaid || isUsed}
                                                    className="flex flex-wrap gap-2 items-center"
                                                />
                                            )}

                                            {/* Custom Actions */}
                                            {customActions}

                                            {/* Attack Button */}
                                            {onAttackRoll && (
                                                <RollButton
                                                    label={finalRollLabel}
                                                    onClick={onAttackRoll}
                                                    bonus={totalAttackBonus}
                                                    disabled={isUsed || !canRoll}
                                                    className={clsx(
                                                        attackModifier !== 0 && 'text-dagger-gold',
                                                        !isCostPaid && needsActivation && 'border border-dashed border-white/20'
                                                    )}
                                                />
                                            )}

                                            {/* Damage Button */}
                                            {hasDamage && onDamageRoll && (
                                                <RollButton
                                                    label={`Damage ${calculatedDamage}`}
                                                    onClick={onDamageRoll}
                                                    bonus={undefined}
                                                    variant="damage"
                                                    disabled={isUsed || !canRoll}
                                                    className={clsx(
                                                        damageModifier !== 0 && 'text-dagger-gold',
                                                        !isCostPaid && needsActivation && 'border border-dashed border-white/20'
                                                    )}
                                                />
                                            )}

                                            {/* Additional Damage Buttons */}
                                            {additionalDamage?.map((extra, idx) => (
                                                <RollButton
                                                    key={idx}
                                                    label={`${extra.damage}${extra.label ? ` ${extra.label}` : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAdditionalDamageRoll?.(extra.damage, extra.label || 'Extra');
                                                    }}
                                                    variant="damage"
                                                    disabled={isUsed || !canRoll}
                                                    className="opacity-90 py-2 px-3 text-xs"
                                                />
                                            ))}

                                            {/* Frequency Checkbox */}
                                            {frequency}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* STANDALONE VARIANT: Separated Sections */}
                    {variant === 'standalone' && (
                        <>
                            {/* Mechanics (Tokens, Modifiers, Frequency) */}
                            {(tokenTrack || hasEnhancedMechanics) && (
                                <div className="px-4 py-3 bg-black/10 space-y-2 border-t border-white/5">
                                    {tokenTrack && !hasEnhancedMechanics && (
                                        <div className="pb-1">
                                            {tokenTrack}
                                        </div>
                                    )}

                                    {hasEnhancedMechanics && enhancedData && (() => {
                                        const enhancement = getEnhancement(enhancedData);
                                        if (!enhancement) return null;

                                        return (
                                            <MechanicsTray
                                                cardName={name}
                                                enhancement={enhancement}
                                                enhancedData={enhancedData}
                                                showAttackButton={false}
                                                hasAttackOrRoll={false}
                                                costMode="uncontrolled"
                                                isCostPaid={isCostPaid}
                                                variant="nested"
                                                showCosts={false}
                                                showFrequency={false}
                                            />
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Action Bar (Costs + Rolls) */}
                            {(needsActivation || customActions || onAttackRoll || (hasDamage && onDamageRoll) || (additionalDamage && (additionalDamage.length > 0)) || frequency) && (
                                <div className="border-t border-white/10 flex flex-col bg-black/20">
                                    {/* Costs Row */}
                                    {needsActivation && (
                                        <div className="px-4 py-3 border-b border-white/5">
                                            <DomainCostsRow
                                                cardName={name}
                                                displayName={name}
                                                costs={costs}
                                                isActiveOverride={isCostPaid}
                                                onActivate={() => {
                                                    setIsCostPaid(true);
                                                    if (costs?.stress && onMarkStress) onMarkStress();
                                                    if (costs?.hope && onSpendHope) onSpendHope();
                                                }}
                                                onDeactivate={() => setIsCostPaid(false)}
                                                disabled={isCostPaid || isUsed}
                                                className="flex flex-wrap gap-2 justify-start"
                                            />
                                        </div>
                                    )}

                                    {/* Rolls & Actions Row */}
                                    {(customActions || onAttackRoll || (hasDamage && onDamageRoll) || (additionalDamage && (additionalDamage.length > 0)) || frequency) && (
                                        <div className="px-4 py-4 flex flex-wrap gap-2 items-center">
                                            {/* Custom Actions */}
                                            {customActions}

                                            {/* Attack Button */}
                                            {onAttackRoll && (
                                                <RollButton
                                                    label={finalRollLabel}
                                                    onClick={onAttackRoll}
                                                    bonus={totalAttackBonus}
                                                    disabled={isUsed || !canRoll}
                                                    className={clsx(
                                                        attackModifier !== 0 && 'text-dagger-gold',
                                                        !isCostPaid && needsActivation && 'border border-dashed border-white/20'
                                                    )}
                                                />
                                            )}

                                            {/* Damage Button */}
                                            {hasDamage && onDamageRoll && (
                                                <RollButton
                                                    label={`Damage ${calculatedDamage}`}
                                                    onClick={onDamageRoll}
                                                    bonus={undefined}
                                                    variant="damage"
                                                    disabled={isUsed || !canRoll}
                                                    className={clsx(
                                                        damageModifier !== 0 && 'text-dagger-gold',
                                                        !isCostPaid && needsActivation && 'border border-dashed border-white/20'
                                                    )}
                                                />
                                            )}

                                            {/* Additional Damage Buttons */}
                                            {additionalDamage?.map((extra, idx) => (
                                                <RollButton
                                                    key={idx}
                                                    label={`${extra.damage}${extra.label ? ` ${extra.label}` : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAdditionalDamageRoll?.(extra.damage, extra.label || 'Extra');
                                                    }}
                                                    variant="damage"
                                                    disabled={isUsed || !canRoll}
                                                    className="opacity-90 py-2 px-3 text-xs"
                                                />
                                            ))}

                                            {/* Frequency Checkbox (if standalone) */}
                                            {!hasEnhancedMechanics && frequency}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
});

export default AttackCard;
