'use client';

import React from 'react';
import { RefreshCw, Check, Zap, Skull, Clock } from 'lucide-react';
import clsx from 'clsx';
import { useCharacterStore } from '@/store/character-store';
import { CardCosts } from '@/types/cards';

interface DomainAbilityButtonProps {
  cardName: string;
  costType: 'hope' | 'stress' | 'duration' | 'free';
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
    toggleCardActive 
  } = useCharacterStore();

  // Use override if provided, otherwise check store
  const isActive = isActiveOverride !== undefined 
    ? isActiveOverride 
    : (cardStates[cardName]?.is_active || false);

  // Determine effective label and icon
  let displayLabel = label;
  let Icon = Zap;
  let costColor = 'text-gray-300';
  let activeColor = 'bg-dagger-gold/20 text-dagger-gold border-dagger-gold/50';

  if (costType === 'hope') {
    displayLabel = label || `Spend ${costValue > 0 ? costValue : 'a'} Hope`;
    Icon = Zap;
    costColor = 'text-dagger-gold'; // Harmonized to dagger-gold for Hope
    activeColor = 'bg-dagger-gold/20 text-dagger-gold border-dagger-gold/50';
  } else if (costType === 'stress') {
    displayLabel = label || `Mark ${costValue > 0 ? costValue : 'a'} Stress`;
    Icon = Skull;
    costColor = 'text-purple-400';
    activeColor = 'bg-purple-900/40 text-purple-300 border-purple-500/50';
  } else if (costType === 'duration') {
    displayLabel = label || 'Active';
    Icon = Clock;
    costColor = 'text-blue-400';
    activeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/50';
  }

  const handleActivate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!character || disabled || isActive) return;

    // 1. Pay Cost (always pay unless it's a duration/free toggle)
    if (costType === 'hope' && costValue > 0) {
      if (character.hope < costValue) return; 
      updateHope(character.hope - costValue);
    } else if (costType === 'stress' && costValue > 0) {
      const currentStress = character.vitals.stress_current;
      if (currentStress + costValue > character.vitals.stress_max) return;
      updateVitals('stress_current', currentStress + costValue);
    }

    // 2. Set Active / Callback
    if (onActivate) {
      onActivate();
    } else {
      toggleCardActive(cardName);
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

  const isActuallyDisabled = disabled || (!isActive && !canAfford);

  if (isActive) {
    return (
      <div className={clsx(
        "flex items-center gap-1 px-2 py-1.5 rounded text-xs font-bold border transition-colors",
        activeColor,
        className
      )}>
        <span className="flex items-center gap-1.5">
          <Check size={12} />
          {displayLabel}
        </span>
        <button
          onClick={handleReset}
          className="ml-1 p-0.5 hover:bg-black/20 rounded-full transition-colors group"
          title="Reset / Deactivate"
        >
          <RefreshCw size={10} className="group-hover:rotate-180 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleActivate}
      disabled={isActuallyDisabled}
      className={clsx(
        "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors",
        "bg-white/5 border-white/10 hover:bg-white/10",
        isActuallyDisabled ? "opacity-50 cursor-not-allowed grayscale" : costColor,
        className
      )}
    >
      <Icon size={12} />
      {displayLabel}
    </button>
  );
}
