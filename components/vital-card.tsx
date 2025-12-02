'use client';

import React from 'react';
import { Heart, Zap, Shield, Eye } from 'lucide-react';
import clsx from 'clsx';

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
  thresholds?: { minor: number, major: number, severe: number };
  variant?: 'square' | 'rectangle';
  className?: string;
  trackType?: 'fill-up-good' | 'fill-up-bad' | 'mark-bad'; // New prop for track behavior
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
  thresholds,
  variant = 'square',
  className,
  trackType
}: VitalCardProps) {
  const isReadOnly = onIncrement === undefined || onDecrement === undefined;

  // Render Track Logic
  const renderTrack = () => {
    if (!max) return null;

    const icons = [];
    // Determine how many are "filled" based on type
    // fill-up-good (Hope): current = filled.
    // fill-up-bad (Stress): current = filled.
    // mark-bad (HP): (max - current) = marked (filled).
    const filledCount = (trackType === 'fill-up-good' || trackType === 'fill-up-bad') ? current : Math.max(0, max - current);
    const isFullBad = (trackType === 'mark-bad' || trackType === 'fill-up-bad') && filledCount >= max;
    
    // Base color for filled icons
    // If mark-bad and full, use red. Else use prop color.
    // Actually, user said "turn the track red when full".
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

  return (
    <div className={clsx(
      "bg-dagger-panel border rounded-xl p-2 flex flex-col items-center justify-center gap-1 relative transition-all",
      "w-full",
      // Critical condition overrides modified border
      isCriticalCondition ? "border-red-500 ring-2 ring-red-500" : 
      isModified ? "border-yellow-500/50 border-dashed" : "border-white/10",
      className
    )}>
      <div className={clsx("flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide", color)}>
        <Icon size={12} />
        {label}
        {isModified && <span className="ml-1 text-[8px] bg-yellow-500/20 text-yellow-500 px-1 rounded">MOD</span>}
      </div>
      
      {/* Display: Track or Number */}
      {trackType && max ? (
        renderTrack()
      ) : (
        <div className="text-2xl font-serif font-bold leading-none my-1 flex flex-col items-center">
          <span>{current}</span>
          {max !== undefined && <span className="text-xs text-gray-500 font-sans font-normal">/{max}</span>}
          {isModified && expectedValue !== undefined && (
             <span className="text-[8px] text-gray-500 font-sans font-normal mt-0.5">Base: {expectedValue}</span>
          )}
        </div>
      )}
      
      {thresholds && (
        <div className="w-full px-1 text-[9px] uppercase tracking-wider text-gray-500 flex justify-between">
          <span>Min: {thresholds.minor}</span>
          <span>Maj: {thresholds.major}</span>
          <span>Sev: {thresholds.severe}</span>
        </div>
      )}

      {!isReadOnly && (
        <div className="flex w-full gap-1 mt-1">
          {/* 
             Button Logic depends on Track Type? 
             User said: "Hiting the + / - buttons will 'Mark' an icon"
             
             For 'mark-bad' (HP): 
               Marking adds a filled spot. 
               Since filled = max - current, Adding Filled means Reducing Current.
               So "Mark (+)" should CALL DECREMENT?
               Wait. "+" usually implies "Add to the stat".
               If stat is "HP Remaining", "+" adds HP (Unmarks).
               If User sees a "+" button, do they think "Add Health" or "Add Mark"?
               User said: "Hiting the + / - buttons will 'Mark' an icon"
               So they likely want a button labeled "Mark" or "+" that ADDS A MARK.
               Adding a Mark REDUCES 'current' (Remaining HP).
               
               So for 'mark-bad':
                 Left Button (-/Unmark/Heal): Increases Current.
                 Right Button (+/Mark/Hurt): Decreases Current.
                 
               For 'fill-up-good' (Hope):
                 Left Button (-/Spend): Decreases Current.
                 Right Button (+/Gain): Increases Current.
                 
               I should probably customize the button labels/icons too to be clear.
          */}
          
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
  );
}