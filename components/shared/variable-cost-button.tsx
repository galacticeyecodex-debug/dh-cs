'use client';

/**
 * VARIABLE COST BUTTON
 * ----------------------------------------------------------------------------
 * A specialized button component for abilities that have variable costs and
 * corresponding variable effects (e.g., "Spend X Hope to roll Xd6").
 *
 * FEATURES:
 * - Adjustable quantity with +/- buttons
 * - Combined cost and roll button in a single row
 * - Automatic resource validation (can't spend more than available)
 * - Integrated with character store for resource management
 *
 * USAGE:
 * Used for Arcana cards like Arcane Reflection ("spend any number of Hope to
 * roll that many d6s") and Falling Sky ("mark any number of Stress to deal
 * 1d20+2 damage for each Stress marked").
 *
 * SRD Reference: content/public/srd/markdown/contents/DomainsAndCards.md
 * "Some cards allow you to spend any number of a resource for scaled effects."
 */

import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { useCharacterStore } from '@/store/character-store';
import { AppIcons, getIconByName } from '@/lib/icon-utils';
import { parseDamageRoll } from '@/lib/utils';
import { toast } from 'sonner';

export interface VariableCostButtonProps {
  /** Card name for state tracking and activity logging */
  cardName: string;
  /** Human-readable display name for notifications */
  displayName?: string;
  /** Type of resource to spend */
  costType: 'hope' | 'stress' | 'tokens';
  /** Optional label override for cost button (default: "Spend X Hope" / "Mark X Stress") */
  costLabel?: string;
  /** Dice to roll per resource spent (e.g., "d6", "d12") */
  dicePerCost: string;
  /** Optional damage label (default: "Extra") */
  damageLabel?: string;
  /** Optional fixed damage modifier per die (e.g., "+2" for Falling Sky) */
  damageModifierPerCost?: number;
  /** Whether the cost button is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Minimum quantity (default: 1) */
  minQuantity?: number;
  /** Maximum quantity (default: 10, will be capped by available resources) */
  maxQuantity?: number;
  /** Callback triggered after successful payment */
  onPaySuccess?: (quantity: number) => void;
  /** Label for the action button (if not rolling) */
  actionLabel?: string;
}

export function VariableCostButton({
  cardName,
  displayName,
  costType,
  costLabel,
  dicePerCost,
  damageLabel = 'Extra',
  damageModifierPerCost = 0,
  disabled = false,
  className,
  minQuantity = 1,
  maxQuantity = 10,
  onPaySuccess,
  actionLabel,
}: VariableCostButtonProps) {
  const friendlyName = displayName || cardName;
  const [quantity, setQuantity] = useState(minQuantity);

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

  // Resolve dynamic icons
  const HopeIcon = getIconByName(vitalIcons.hope, AppIcons.vitals.hope);
  const StressIcon = getIconByName(vitalIcons.stress, AppIcons.vitals.stress);
  const Icon = costType === 'hope' ? HopeIcon : (costType === 'stress' ? StressIcon : AppIcons.ui.settings);

  // Calculate max available based on current resources
  const maxAvailable = useMemo(() => {
    if (!character) return minQuantity;

    if (costType === 'hope') {
      return Math.min(maxQuantity, character.hope);
    } else if (costType === 'stress') {
      // Stress: how many more can we mark before hitting max
      const stressRoom = character.vitals.stress_max - character.vitals.stress_current;
      return Math.min(maxQuantity, stressRoom);
    } else {
      // Tokens
      const currentTokens = cardStates[cardName]?.current_tokens || 0;
      return Math.min(maxQuantity, currentTokens);
    }
  }, [character, cardStates, cardName, costType, maxQuantity, minQuantity]);

  // Resource tracking info
  const resourceInfo = useMemo(() => {
    if (!character) return '';
    if (costType === 'hope') {
      return `(${character.hope}/6)`;
    } else if (costType === 'stress') {
      return `(${character.vitals.stress_current}/${character.vitals.stress_max})`;
    } else {
      const currentTokens = cardStates[cardName]?.current_tokens || 0;
      return `(${currentTokens})`;
    }
  }, [character, cardStates, cardName, costType]);

  // Determine colors
  const costColor = costType === 'hope' ? 'text-dagger-gold' : (costType === 'stress' ? 'text-purple-400' : 'text-cyan-400');
  const borderColor = costType === 'hope' ? 'border-dagger-gold/30' : (costType === 'stress' ? 'border-purple-500/30' : 'border-cyan-500/30');

  // Generate dice string for display (e.g., "3d6" or "3d20+6")
  const getDiceString = (qty: number) => {
    if (!dicePerCost) return '';
    const totalModifier = damageModifierPerCost * qty;
    const modifierStr = totalModifier > 0 ? `+${totalModifier}` : totalModifier < 0 ? `${totalModifier}` : '';
    return `${qty}${dicePerCost}${modifierStr}`;
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(prev => Math.max(minQuantity, prev - 1));
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(prev => Math.min(maxAvailable, prev + 1));
  };

  const handlePayCost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!character || disabled || quantity < minQuantity) return;

    if (costType === 'hope') {
      if (character.hope < quantity) {
        toast.error('Not enough Hope');
        return;
      }
      updateHope(character.hope - quantity);
      toast.success(`Spent ${quantity} Hope for ${friendlyName}`);
    } else if (costType === 'stress') {
      const newStress = character.vitals.stress_current + quantity;
      if (newStress > character.vitals.stress_max) {
        toast.error('Would exceed max Stress');
        return;
      }
      updateVitals('stress_current', newStress);
      toast.success(`Marked ${quantity} Stress for ${friendlyName}`);
    } else {
      // Tokens
      const currentTokens = cardStates[cardName]?.current_tokens || 0;
      if (currentTokens < quantity) {
        toast.error('Not enough Tokens');
        return;
      }
      spendCardToken(cardName, quantity);
      toast.success(`Spent ${quantity} Tokens for ${friendlyName}`);
    }

    // Log activity
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
          cost_paid: costType === 'hope' ? { hope: quantity } : { stress: quantity },
        },
        is_private: false,
      });
    }

    // Trigger success callback
    if (onPaySuccess) {
      onPaySuccess(quantity);
    }
  };

  const handleRoll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!character || quantity < minQuantity) return;

    const diceString = getDiceString(quantity);
    const { dice, modifier } = parseDamageRoll(diceString);
    prepareRoll(`${friendlyName} ${damageLabel}`, modifier, dice);
  };

  const canAfford = maxAvailable >= quantity;
  const isDisabled = disabled || !canAfford || quantity < minQuantity;

  // Generate cost label
  const finalCostLabel = costLabel
    ? costLabel.replace(/X|\{n\}/g, quantity.toString())
    : (costType === 'hope' ? `Spend ${quantity} Hope` : `Mark ${quantity} Stress`);

  const finalActionLabel = actionLabel?.replace(/X|\{n\}/g, quantity.toString());

  return (
    <div className={clsx(
      "flex items-center gap-0 rounded overflow-hidden border",
      "bg-white/5",
      borderColor,
      className
    )}>
      {/* Cost Button */}
      <button
        onClick={handlePayCost}
        disabled={isDisabled}
        className={clsx(
          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
          "hover:bg-white/10 border-r border-white/10",
          isDisabled ? "opacity-50 cursor-not-allowed grayscale" : costColor,
        )}
        title={`Pay ${quantity} ${costType === 'hope' ? 'Hope' : 'Stress'}`}
      >
        <Icon size={12} />
        <span>{finalCostLabel}</span>
        <span className="opacity-70 text-[10px] ml-0.5">{resourceInfo}</span>
      </button>

      {/* Quantity Controls */}
      <div className="flex items-center border-r border-white/10">
        <button
          onClick={handleDecrease}
          disabled={quantity <= minQuantity}
          className={clsx(
            "px-2 py-1.5 text-xs font-bold transition-colors hover:bg-white/10",
            quantity <= minQuantity ? "opacity-30 cursor-not-allowed" : "text-gray-400 hover:text-white"
          )}
          title="Decrease quantity"
        >
          -
        </button>
        <span className={clsx(
          "px-2 py-1.5 text-sm font-bold min-w-[2rem] text-center",
          costColor
        )}>
          {quantity}
        </span>
        <button
          onClick={handleIncrease}
          disabled={quantity >= maxAvailable}
          className={clsx(
            "px-2 py-1.5 text-xs font-bold transition-colors hover:bg-white/10",
            quantity >= maxAvailable ? "opacity-30 cursor-not-allowed" : "text-gray-400 hover:text-white"
          )}
          title="Increase quantity"
        >
          +
        </button>
      </div>

      {/* Roll / Action Button */}
      {(dicePerCost || actionLabel) && (
        <button
          onClick={dicePerCost ? handleRoll : (e) => handlePayCost(e)}
          disabled={quantity < minQuantity}
          className={clsx(
            "relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
            "hover:bg-white/10",
            dicePerCost ? "text-red-400" : "text-emerald-400",
            quantity < minQuantity && "opacity-50 cursor-not-allowed"
          )}
          title={dicePerCost ? `Roll ${getDiceString(quantity)} damage` : finalActionLabel}
        >
          {dicePerCost ? (
            <>
              {/* Dice indicator */}
              <div
                className="absolute top-0.5 right-0.5 text-gray-600 pointer-events-none"
                aria-hidden="true"
              >
                <AppIcons.combat.roll size={10} />
              </div>
              <AppIcons.combat.damage size={14} className="text-red-400" />
              <span>{damageLabel} {getDiceString(quantity)}</span>
            </>
          ) : (
            <>
              <AppIcons.ui.confirm size={14} className="text-emerald-400" />
              <span>{finalActionLabel}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
