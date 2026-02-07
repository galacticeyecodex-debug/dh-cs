'use client';

/**
 * LINKED COST BUTTON
 * ----------------------------------------------------------------------------
 * A specialized button component for abilities that have costs explicitly
 * linked to an action or gain.
 *
 * FEATURES:
 * - Adjustable quantity with +/- buttons for variable costs (amount: 'X')
 * - Fixed button style for single-click actions (amount: number)
 * - Automatic resource validation
 * - Integrated with character store for resource management
 */

import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { useCharacterStore } from '@/store/character-store';
import { AppIcons, getIconByName } from '@/lib/icon-utils';
import { parseDamageRoll } from '@/lib/utils';
import { toast } from 'sonner';

export interface LinkedCostButtonProps {
    /** Card name for state tracking and activity logging */
    cardName: string;
    /** Human-readable display name for notifications */
    displayName?: string;
    /** Type of resource to spend */
    costType: 'hope' | 'stress' | 'tokens' | 'hit_points' | 'armor_slots' | 'fear' | 'custom';
    /** Amount to spend (number for fixed, 'X' for variable) */
    amount: number | 'X';
    /** Optional label override for the cost button */
    costLabel?: string;
    /** Optional label override for the benefit/action button */
    benefitLabel?: string;
    /** Dice to roll per resource spent (for variable rolls) */
    dice?: string;
    /** Optional fixed damage modifier per die */
    modifierPerDie?: number;
    /** Whether the cost button is disabled */
    disabled?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Callback triggered after successful payment */
    onPaySuccess?: (quantity: number) => void;
    /** Custom action label */
    actionLabel?: string;
}

export function LinkedCostButton({
    cardName,
    displayName,
    costType,
    amount,
    costLabel,
    benefitLabel,
    dice,
    modifierPerDie = 0,
    disabled = false,
    className,
    onPaySuccess,
    actionLabel,
}: LinkedCostButtonProps) {
    const isVariable = amount === 'X';
    const fixedAmount = typeof amount === 'number' ? amount : 1;
    const [quantity, setQuantity] = useState(fixedAmount);

    const {
        character,
        updateHope,
        updateVitals,
        prepareRoll,
        vitalIcons,
        logActivity,
        activeCampaign,
        cardStates,
        spendCardToken,
    } = useCharacterStore();

    const friendlyName = displayName || cardName;

    // Resolve dynamic icons
    const HopeIcon = getIconByName(vitalIcons.hope, AppIcons.vitals.hope);
    const StressIcon = getIconByName(vitalIcons.stress, AppIcons.vitals.stress);
    const HPIcon = getIconByName(vitalIcons.hitPoints, AppIcons.vitals.hitPoints);
    const ArmorIcon = getIconByName(vitalIcons.armor, AppIcons.vitals.armor);

    const Icon = useMemo(() => {
        switch (costType) {
            case 'hope': return HopeIcon;
            case 'stress': return StressIcon;
            case 'hit_points': return HPIcon;
            case 'armor_slots': return ArmorIcon;
            default: return AppIcons.ui.settings;
        }
    }, [costType, HopeIcon, StressIcon, HPIcon, ArmorIcon]);

    // Calculate max available based on current resources
    const maxAvailable = useMemo(() => {
        if (!character) return fixedAmount;

        switch (costType) {
            case 'hope':
                return isVariable ? character.hope : (character.hope >= fixedAmount ? fixedAmount : 0);
            case 'stress':
                const stressRoom = character.vitals.stress_max - character.vitals.stress_current;
                return isVariable ? stressRoom : (stressRoom >= fixedAmount ? fixedAmount : 0);
            case 'hit_points':
                return isVariable ? character.vitals.hit_points_current : (character.vitals.hit_points_current >= fixedAmount ? fixedAmount : 0);
            case 'armor_slots':
                return isVariable ? character.vitals.armor_slots : (character.vitals.armor_slots >= fixedAmount ? fixedAmount : 0);
            case 'tokens':
                const currentTokens = cardStates[cardName]?.current_tokens || 0;
                return isVariable ? currentTokens : (currentTokens >= fixedAmount ? fixedAmount : 0);
            case 'fear':
            case 'custom':
            default:
                // Untracked resources default to a generous max (12) to allow manual "X" selection
                return 12;
        }
    }, [character, cardStates, cardName, costType, isVariable, fixedAmount]);

    // Resource tracking info
    const resourceInfo = useMemo(() => {
        if (!character) return '';
        switch (costType) {
            case 'hope': return `(${character.hope}/6)`;
            case 'stress': return `(${character.vitals.stress_current}/${character.vitals.stress_max})`;
            case 'hit_points': return `(${character.vitals.hit_points_current}/${character.vitals.hit_points_max})`;
            case 'armor_slots': return `(${character.vitals.armor_slots}/${character.vitals.armor_score})`;
            case 'tokens': return `(${cardStates[cardName]?.current_tokens || 0})`;
            default: return '';
        }
    }, [character, cardStates, cardName, costType]);

    // Determine colors
    const costColorMap = {
        hope: 'text-dagger-gold',
        stress: 'text-purple-400',
        hit_points: 'text-red-400',
        armor_slots: 'text-blue-400',
        tokens: 'text-cyan-400',
        fear: 'text-orange-400',
        custom: 'text-gray-300',
    };
    const borderColorMap = {
        hope: 'border-dagger-gold/30',
        stress: 'border-purple-500/30',
        hit_points: 'border-red-500/30',
        armor_slots: 'border-blue-500/30',
        tokens: 'border-cyan-500/30',
        fear: 'border-orange-500/30',
        custom: 'border-white/10',
    };

    const costColor = costColorMap[costType as keyof typeof costColorMap] || 'text-white';
    const borderColor = borderColorMap[costType as keyof typeof borderColorMap] || 'border-white/10';

    const handleAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!character || isDisabled) return;

        const payAmount = isVariable ? quantity : fixedAmount;

        // 1. PERFORM PAYMENTS
        switch (costType) {
            case 'hope':
                updateHope(character.hope - payAmount);
                break;
            case 'stress':
                updateVitals('stress_current', character.vitals.stress_current + payAmount);
                break;
            case 'hit_points':
                updateVitals('hit_points_current', character.vitals.hit_points_current - payAmount);
                break;
            case 'armor_slots':
                updateVitals('armor_slots', character.vitals.armor_slots - payAmount);
                break;
            case 'tokens':
                spendCardToken(cardName, payAmount);
                break;
            case 'fear':
            case 'custom':
                // No automated tracking for these
                break;
        }

        // 2. TRIGGER ROLL IF APPLICABLE
        if (dice) {
            const totalModifier = modifierPerDie * payAmount;
            const modifierStr = totalModifier > 0 ? `+${totalModifier}` : totalModifier < 0 ? `${totalModifier}` : '';
            const diceString = `${payAmount}${dice}${modifierStr}`;
            const { dice: parsedDice, modifier } = parseDamageRoll(diceString);
            prepareRoll(`${friendlyName} Roll`, modifier, parsedDice);
        }

        // 3. BROADCAST ACTIVITY
        if (activeCampaign) {
            logActivity({
                campaign_id: activeCampaign.id,
                user_id: character.user_id,
                character_id: character.id,
                character_name: character.name,
                activity_type: 'card_used',
                data: {
                    card_id: cardName,
                    card_name: friendlyName,
                    card_type: 'ability',
                    cost_paid: { [costType]: payAmount },
                },
                is_private: false,
            });
        }

        if (onPaySuccess) onPaySuccess(payAmount);
    };

    const canAfford = isVariable ? maxAvailable >= quantity : maxAvailable >= fixedAmount;
    const isDisabled = disabled || !canAfford;

    const multiplierValue = modifierPerDie * (isVariable ? quantity : fixedAmount);
    const multiplierStr = multiplierValue > 0 ? `+${multiplierValue}` : multiplierValue < 0 ? `${multiplierValue}` : '';

    const finalCostLabel = (costLabel || (costType === 'hope' ? `Spend {n} Hope` : `Mark {n} Stress`))
        .replace(/X|\{n\}/g, (isVariable ? quantity : fixedAmount).toString())
        .replace(/\{multiplier\}/g, multiplierStr);

    const finalBenefitLabel = (benefitLabel || actionLabel || 'Activate')
        .replace(/X|\{n\}/g, (isVariable ? quantity : fixedAmount).toString())
        .replace(/\{multiplier\}/g, multiplierStr);

    return (
        <div className={clsx(
            "flex items-center gap-0 rounded overflow-hidden border",
            "bg-white/5",
            borderColor,
            className
        )}>
            {/* Cost Side */}
            <button
                onClick={handleAction}
                disabled={isDisabled}
                className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                    "hover:bg-white/10",
                    isDisabled ? "opacity-50 cursor-not-allowed grayscale" : costColor,
                )}
            >
                <Icon size={12} />
                <span>{finalCostLabel}</span>
                {isVariable && (
                    <span className="opacity-70 text-[10px] ml-0.5">{resourceInfo}</span>
                )}
            </button>

            {/* Variable Controls (Only show if amount is 'X') */}
            {isVariable && (
                <div className="flex items-center border-l border-white/10">
                    <button
                        onClick={(e) => { e.stopPropagation(); setQuantity(q => Math.max(1, q - 1)); }}
                        disabled={quantity <= 1}
                        className={clsx(
                            "px-2 py-1.5 text-xs font-bold transition-colors hover:bg-white/10",
                            quantity <= 1 ? "opacity-30 cursor-not-allowed" : "text-gray-400 hover:text-white"
                        )}
                    >
                        -
                    </button>
                    <span className={clsx("px-2 py-1.5 text-sm font-bold min-w-[1.5rem] text-center", costColor)}>
                        {quantity}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); setQuantity(q => Math.min(maxAvailable, q + 1)); }}
                        disabled={quantity >= maxAvailable}
                        className={clsx(
                            "px-2 py-1.5 text-xs font-bold transition-colors hover:bg-white/10",
                            quantity >= maxAvailable ? "opacity-30 cursor-not-allowed" : "text-gray-400 hover:text-white"
                        )}
                    >
                        +
                    </button>
                </div>
            )}

            {/* Benefit Side */}
            <button
                onClick={handleAction}
                disabled={isDisabled}
                className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-l border-white/10 transition-colors",
                    "hover:bg-white/10",
                    dice ? "text-red-400" : "text-emerald-400",
                    isDisabled && "opacity-50 cursor-not-allowed"
                )}
            >
                {dice ? <AppIcons.combat.damage size={14} /> : <AppIcons.ui.confirm size={14} />}
                <span>{finalBenefitLabel}</span>
            </button>
        </div>
    );
}
