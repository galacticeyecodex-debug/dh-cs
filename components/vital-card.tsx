'use client';

import React from 'react';
import { Heart, Zap, Shield, Eye } from 'lucide-react';
import clsx from 'clsx';

// Props interface for VitalCard
interface VitalCardProps {
  label: string;
  current: number;
  max?: number; // Max is optional for things like Evasion that don't have a 'max'
  color: string;
  icon: React.ElementType;
  onIncrement?: () => void; // Optional for read-only cards like Evasion
  onDecrement?: () => void; // Optional for read-only cards like Evasion
  isCriticalCondition?: boolean; // New prop for color indicator
  thresholds?: { minor: number, major: number, severe: number }; // For Armor thresholds
  variant?: 'square' | 'rectangle'; // Control shape
  className?: string; // Allow custom styling
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
  thresholds,
  variant = 'square',
  className
}: VitalCardProps) {
  const isReadOnly = onIncrement === undefined || onDecrement === undefined;

  return (
    <div className={clsx(
      "bg-dagger-panel border rounded-xl p-2 flex flex-col items-center justify-center gap-1 relative transition-all",
      "w-full", // Width controlled by parent grid
      isCriticalCondition ? "border-red-500 ring-2 ring-red-500" : "border-white/10",
      className
    )}>
      <div className={clsx("flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide", color)}>
        <Icon size={12} />
        {label}
      </div>
      
      <div className="text-2xl font-serif font-bold leading-none my-1">
        {current}
        {max !== undefined && <span className="text-xs text-gray-500 font-sans font-normal">/{max}</span>}
      </div>
      
      {thresholds && (
        <div className="w-full px-1 text-[9px] uppercase tracking-wider text-gray-500 flex justify-between">
          <span>Min: {thresholds.minor}</span>
          <span>Maj: {thresholds.major}</span>
          <span>Sev: {thresholds.severe}</span>
        </div>
      )}

      {!isReadOnly && (
        <div className="flex w-full gap-1 mt-1">
          <button type="button" onClick={onDecrement} className="flex-1 h-7 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-base font-bold">-</button>
          <button type="button" onClick={onIncrement} className="flex-1 h-7 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-base font-bold">+</button>
        </div>
      )}
    </div>
  );
}