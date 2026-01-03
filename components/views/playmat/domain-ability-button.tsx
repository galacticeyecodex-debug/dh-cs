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
  let Icon = Zap;
  let costColor = 'text-gray-300';
  let activeColor = 'bg-dagger-gold/20 text-dagger-gold border-dagger-gold/50';

  if (costType === 'hope') {
    displayLabel = label || `Spend ${costValue > 0 ? costValue : 'a'} Hope`;
    Icon = Zap;
    costColor = 'text-dagger-gold'; 
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

  // Unified visual style for both active and inactive states
  // We use flex-wrap to handle the extra resource text gracefully on small screens
  const buttonContent = (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      {isActive ? <Check size={12} /> : <Icon size={12} />}
      <span>{displayLabel}</span>
      {resourceInfo && !isActive && (
        <span className="opacity-70 font-normal ml-0.5 text-[10px]">{resourceInfo}</span>
      )}
    </span>
  );

  if (isActive) {
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
