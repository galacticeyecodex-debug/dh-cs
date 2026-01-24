'use client';

import React from 'react';
import clsx from 'clsx';
import { useCharacterStore } from '@/store/character-store';
import { CardCosts } from '@/types/cards';
import { AppIcons, getIconByName } from '@/lib/icon-utils';

interface DomainAbilityButtonProps {
  cardName: string;
  /**
   * Cost type determines button appearance and behavior:
   * - 'hope': Spend Hope to activate (yellow/gold styling)
   * - 'stress': Mark Stress to activate (purple styling)
   * - 'activate': No cost, just toggle on/off (green styling) - for abilities like Frenzy
   * - 'duration': Persistent effect toggle (blue styling)
   * - 'free': Same as 'activate' - deprecated, use 'activate'
   */
  costType: 'hope' | 'stress' | 'activate' | 'duration' | 'free';
  costValue?: number;
  label?: string; // Optional override
  className?: string;
  disabled?: boolean;
  // Controlled mode props
  isActiveOverride?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
}

export function DomainAbilityButton({
  cardName,
  costType,
  costValue = 0,
  label,
  className,
  disabled = false,
  isActiveOverride,
  onActivate,
  onDeactivate,
}: DomainAbilityButtonProps) {
  const {
    character,
    cardStates,
    updateHope,
    updateVitals,
    toggleCardActive,
    vitalIcons
  } = useCharacterStore();

  // Resolve dynamic icons based on user preferences
  const HopeIcon = getIconByName(vitalIcons.hope, AppIcons.vitals.hope);
  const StressIcon = getIconByName(vitalIcons.stress, AppIcons.vitals.stress);

  // Use override if provided, otherwise check store
  const isActive = isActiveOverride !== undefined
    ? isActiveOverride
    : (cardStates[cardName]?.is_active || false);

  // Resource Tracking Logic
  let resourceInfo = '';
  if (character) {
    if (costType === 'hope') {
      resourceInfo = `(${character.hope}/6)`;
    } else if (costType === 'stress') {
      resourceInfo = `(${character.vitals.stress_current}/${character.vitals.stress_max})`;
    }
  }

  // Determine effective label and icon
  let displayLabel = label;
  let Icon = AppIcons.combat.activation;
  let costColor = 'text-gray-300';
  let activeColor = 'bg-dagger-gold/20 text-dagger-gold border-dagger-gold/50';

  if (costType === 'hope') {
    displayLabel = label || `Spend ${costValue > 0 ? costValue : 'a'} Hope`;
    Icon = HopeIcon;  // Use user's preferred icon
    costColor = 'text-dagger-gold';
    activeColor = 'bg-dagger-gold/20 text-dagger-gold border-dagger-gold/50';
  } else if (costType === 'stress') {
    displayLabel = label || `Mark ${costValue > 0 ? costValue : 'a'} Stress`;
    Icon = StressIcon;  // Use user's preferred icon
    costColor = 'text-purple-400';
    activeColor = 'bg-purple-900/40 text-purple-300 border-purple-500/50';
  } else if (costType === 'activate' || costType === 'free') {
    // No-cost activation (e.g., Frenzy) - green styling
    displayLabel = label || 'Activate';
    Icon = AppIcons.combat.activation;  // Could use Play or Power icon if desired
    costColor = 'text-emerald-400';
    activeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
  } else if (costType === 'duration') {
    displayLabel = label || 'Active';
    Icon = AppIcons.combat.duration;
    costColor = 'text-blue-400';
    activeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/50';
  }

  const handleActivate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!character || disabled) return;

    // DECOUPLED: Cost buttons ONLY pay costs, activation buttons ONLY toggle state
    if (costType === 'hope') {
      // Pay Hope cost (no activation)
      if (costValue > 0) {
        if (character.hope < costValue) return;
        updateHope(character.hope - costValue);
      }
      // Call callback if provided (for custom behavior)
      if (onActivate) onActivate();
    } else if (costType === 'stress') {
      // Pay Stress cost (no activation)
      if (costValue > 0) {
        const currentStress = character.vitals.stress_current;
        if (currentStress + costValue > character.vitals.stress_max) return;
        updateVitals('stress_current', currentStress + costValue);
      }
      // Call callback if provided (for custom behavior)
      if (onActivate) onActivate();
    } else if (costType === 'duration' || costType === 'activate' || costType === 'free') {
      // Toggle activation state (no cost payment)
      if (isActive) return; // Already active, use handleReset instead
      if (onActivate) {
        onActivate();
      } else {
        toggleCardActive(cardName);
      }
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!character || !isActive) return;

    // Just toggle off
    if (onDeactivate) {
      onDeactivate();
    } else {
      toggleCardActive(cardName);
    }
  };

  // Check affordability
  const canAfford = React.useMemo(() => {
    if (!character) return false;
    if (costType === 'hope') return character.hope >= costValue;
    if (costType === 'stress') return character.vitals.stress_current + costValue <= character.vitals.stress_max;
    return true;
  }, [character, costType, costValue]);

  // Cost buttons (stress/hope) should never be disabled - users can always spend resources
  // Only activation buttons (duration/activate) can be disabled
  const isCostButton = costType === 'stress' || costType === 'hope';
  const isActuallyDisabled = isCostButton ? disabled : (disabled || !canAfford);

  // Cost buttons NEVER show "active" state - they just pay resources
  // Only activation buttons show active/inactive states
  const showActiveState = !isCostButton && isActive;

  const buttonContent = (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      {showActiveState ? <AppIcons.ui.confirm size={12} /> : <Icon size={12} />}
      <span>{displayLabel}</span>
      {resourceInfo && (
        <span className="opacity-70 font-normal ml-0.5 text-[10px]">{resourceInfo}</span>
      )}
    </span>
  );

  // Activation buttons show active state with reset button
  if (showActiveState) {
    return (
      <div className={clsx(
        "flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-bold border transition-colors cursor-default",
        activeColor,
        className
      )}>
        {buttonContent}
        <button
          onClick={handleReset}
          className="ml-1 p-0.5 hover:bg-black/20 rounded-full transition-colors group"
          title="Reset / Deactivate"
        >
          <AppIcons.system.sync size={10} className="group-hover:rotate-180 transition-transform" />
        </button>
      </div>
    );
  }

  // All other states: normal button
  return (
    <button
      onClick={handleActivate}
      disabled={isActuallyDisabled}
      className={clsx(
        "flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-medium border transition-colors",
        "bg-white/5 border-white/10 hover:bg-white/10",
        isActuallyDisabled ? "opacity-50 cursor-not-allowed grayscale" : costColor,
        className
      )}
    >
      {buttonContent}
    </button>
  );
}
