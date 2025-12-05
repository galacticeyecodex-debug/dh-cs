'use client';

import React, { useState } from 'react';
import { Heart, Zap, Shield, Eye } from 'lucide-react';
import clsx from 'clsx';
import ModifierSheet from '@/components/modifier-sheet';

// Props interface for VitalCard
interface VitalCardProps {
  label: string;
  current: number;
  max?: number;
  color: string;
  icon: React.ElementType;
  onIncrement?: () => void;
  onDecrement?: () => void;
  isCriticalCondition?: boolean;
  isModified?: boolean;
  expectedValue?: number;
  disableCritColor?: boolean; // New prop to disable red color on full track
  thresholds?: { minor: number, major: number, severe: number };
  variant?: 'square' | 'rectangle';
  className?: string;
  trackType?: 'fill-up-good' | 'fill-up-bad' | 'mark-bad';
  modifiers?: { id: string; name: string; value: number; source: 'user' | 'system' }[];
  onUpdateModifiers?: (modifiers: { id: string; name: string; value: number; source: 'user' | 'system' }[]) => void;
}

export default function VitalCard({ 
  label, 
  current, 
  max, 
  color, 
  icon: Icon, 
  onIncrement, 
  onDecrement,
  isCriticalCondition = false,
  isModified = false,
  expectedValue,
  disableCritColor = false,
  thresholds,
  variant = 'square',
  className,
  trackType,
  modifiers,
  onUpdateModifiers
}: VitalCardProps) {
  const [showModifierSheet, setShowModifierSheet] = useState(false);
  const isReadOnly = onIncrement === undefined || onDecrement === undefined;
  const isUnarmored = label === 'Armor' && (!max || max === 0); 

  // Render Track Logic
  const renderTrack = () => {
    if (!max) return null;

    const icons = [];
    // Determine how many are "filled" based on type
    const filledCount = (trackType === 'fill-up-good' || trackType === 'fill-up-bad') ? current : Math.max(0, max - current);
    
    // Check if track is "badly" full (e.g. full stress/damage)
    // Respect disableCritColor prop (e.g. for Armor, which isn't "bad" when full)
    const isFullBad = (trackType === 'mark-bad' || trackType === 'fill-up-bad') && filledCount >= max && !disableCritColor;
    
    // Base color for filled icons
    const filledColor = isFullBad ? "text-red-500" : color;
    const emptyColor = "text-white/10";

    for (let i = 0; i < max; i++) {
      const isFilled = i < filledCount;
      icons.push(
        <Icon 
          key={i} 
          size={trackType === 'mark-bad' ? 16 : 14} 
          className={clsx(
            "transition-all duration-300",
            isFilled ? clsx(filledColor, "scale-100") : clsx(emptyColor, "scale-90")
          )}
          fill={isFilled ? "currentColor" : "none"}
        />
      );
    }
    
    return (
      <div className="flex flex-wrap justify-center gap-1.5 my-2 px-2">
        {icons}
      </div>
    );
  };

  const handleCardClick = () => {
    if (onUpdateModifiers) {
      setShowModifierSheet(true);
    }
  };

  if (isUnarmored) {
    return (
      <>
      <div 
        onClick={handleCardClick}
        className={clsx(
        "bg-dagger-panel border rounded-xl p-2 flex flex-col items-center justify-center gap-1 relative transition-all",
        "w-full",
        isModified ? "border-yellow-500/50 border-dashed" : "border-white/10",
        onUpdateModifiers && "cursor-pointer hover:border-white/30",
        className
      )}>
        <div className={clsx("flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide", color)}>
          <Icon size={12} />
          {label}
          {isModified && <span className="ml-1 text-[8px] bg-yellow-500/20 text-yellow-500 px-1 rounded">MOD</span>}
        </div>
        <div className="text-sm text-gray-400 italic my-2">Unarmored</div>
        {thresholds && ( 
          <div className="w-full px-1 text-[9px] uppercase tracking-wider text-gray-500 flex justify-between">
            <span>Min: {thresholds.minor}</span>
            <span>Maj: {thresholds.major}</span>
            <span>Sev: {thresholds.severe}</span>
          </div>
        )}
      </div>
      {showModifierSheet && onUpdateModifiers && (
        <ModifierSheet 
          isOpen={showModifierSheet} 
          onClose={() => setShowModifierSheet(false)}
          statLabel={label}
          baseValue={expectedValue || 0} // Use expectedValue as base if available, else 0
          currentModifiers={modifiers || []}
          onUpdateModifiers={onUpdateModifiers}
        />
      )}
      </>
    );
  }

  return (
    <>
    <div 
      onClick={handleCardClick}
      className={clsx(
      "bg-dagger-panel border rounded-xl p-2 flex flex-col items-center justify-center gap-1 relative transition-all",
      "w-full",
      // Critical condition overrides modified border
      isCriticalCondition ? "border-red-500 ring-2 ring-red-500" : 
      isModified ? "border-yellow-500/50 border-dashed" : "border-white/10",
      onUpdateModifiers && "cursor-pointer hover:border-white/30",
      className
    )}>
      <div className={clsx("flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide", color)}>
        <Icon size={12} />
        {label}
        {isModified && <span className="ml-1 text-[8px] bg-yellow-500/20 text-yellow-500 px-1 rounded">MOD</span>}
      </div>
      
      {/* Display: Track or Number */}
      {trackType && max && max > 0 ? (
        renderTrack()
      ) : (
        <div className="text-2xl font-serif font-bold leading-none my-1 flex flex-col items-center relative">
          <span>{current}</span>
          {max !== undefined && <span className="text-xs text-gray-500 font-sans font-normal">/{max}</span>}
          {isModified && expectedValue !== undefined && (
             <span className="text-[8px] text-gray-500 font-sans font-normal mt-0.5">Base: {expectedValue}</span>
          )}
          {isModified && !trackType && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-dagger-gold rounded-full" />}
        </div>
      )}
      
      {thresholds && (
        <div className="w-full px-1 text-[9px] uppercase tracking-wider text-gray-500 flex justify-between">
          <span>Min: {thresholds.minor}</span>
          <span>Maj: {thresholds.major}</span>
          <span>Sev: {thresholds.severe}</span>
        </div>
      )}

      {!isReadOnly && max && max > 0 && (
        <div className="flex w-full gap-1 mt-1" onClick={(e) => e.stopPropagation()}> {/* Stop propagation so button clicks don't open sheet */}
          {/* ... Buttons ... */}
          {trackType === 'mark-bad' ? (
             <>
                <button type="button" onClick={onIncrement} className="flex-1 h-7 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-[10px] font-bold uppercase tracking-wider">Clear</button>
                <button type="button" onClick={onDecrement} className="flex-1 h-7 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-[10px] font-bold uppercase tracking-wider">Mark</button>
             </>
          ) : trackType === 'fill-up-bad' ? (
             <>
                <button type="button" onClick={onDecrement} className="flex-1 h-7 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-[10px] font-bold uppercase tracking-wider">Clear</button>
                <button type="button" onClick={onIncrement} className="flex-1 h-7 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-[10px] font-bold uppercase tracking-wider">Mark</button>
             </>
          ) : trackType === 'fill-up-good' ? (
             <>
                <button type="button" onClick={onDecrement} className="flex-1 h-7 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-[10px] font-bold uppercase tracking-wider">Spend</button>
                <button type="button" onClick={onIncrement} className="flex-1 h-7 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-[10px] font-bold uppercase tracking-wider">Gain</button>
             </>
          ) : (
             <>
                <button type="button" onClick={onDecrement} className="flex-1 h-7 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-base font-bold">-</button>
                <button type="button" onClick={onIncrement} className="flex-1 h-7 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-base font-bold">+</button>
             </>
          )}
        </div>
      )}
    </div>
    {showModifierSheet && onUpdateModifiers && (
        <ModifierSheet 
          isOpen={showModifierSheet} 
          onClose={() => setShowModifierSheet(false)}
          statLabel={label}
          baseValue={expectedValue || 0}
          currentModifiers={modifiers || []}
          onUpdateModifiers={onUpdateModifiers}
        />
      )}
    </>
  );
}