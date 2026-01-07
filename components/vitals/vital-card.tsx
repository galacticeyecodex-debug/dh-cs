'use client';

/**
 * VITAL CARD COMPONENT
 * ----------------------------------------------------------------------------
 * A versatile UI component for displaying and managing a single character resource or stat.
 *
 * CORE FUNCTIONALITY:
 * - Dynamic Visualization: Supports numeric displays (e.g., Evasion) or visual tracks
 *   (e.g., Health, Stress, Armor slots) based on the 'trackType' prop.
 * - Interactive Controls: Provides contextual buttons for manipulating the stat
 *   (increment/decrement, markup/clear, spend/gain) tailored to the specific resource type.
 * - Modifier Integration: Can connect to the ModifierSheet system to allow for temporary
 *   bonuses or penalties to be applied to the base stat.
 * - Status Feedback: Visually indicates critical conditions (e.g., low health) or modified states.
 *
 * PERFORMANCE:
 * - Memoized with React.memo to prevent unnecessary re-renders
 * - Custom comparison function checks only relevant props
 * - Re-renders only when display values or state actually changes
 */

import React, { useState } from 'react';
import { Heart, Zap, Shield, Eye, Settings } from 'lucide-react';
import clsx from 'clsx';
import ModifierSheet, { ModifierTab } from '@/components/shared/modifier-sheet';
import { getValueColor, getPanelBorder, PANEL } from '@/lib/styles';

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
  modifiers?: { id: string; name: string; value: number; source: 'user' | 'system' | 'domain_card'; type?: 'equipment' | 'domain_card' }[];
  onUpdateModifiers?: (modifiers: { id: string; name: string; value: number; source: 'user' | 'system' | 'domain_card'; type?: 'equipment' | 'domain_card' }[]) => void;
  subStats?: ModifierTab[];
}

const VitalCard = React.memo(function VitalCard({
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
  onUpdateModifiers,
  subStats
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
      <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 my-1.5 sm:my-2 px-1 sm:px-2">
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
          className={clsx(
            PANEL.base,
            "p-1.5 sm:p-2 flex flex-col items-center justify-start gap-1 relative transition-all",
            "w-full",
            getPanelBorder({ isModified }),
            className
          )}>
          <div className="relative flex items-center justify-center w-full">
            <div className={clsx("flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide", color)}>
              <Icon size={12} />
              {label}
            </div>
            {onUpdateModifiers && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModifierSheet(true);
                }}
                className="absolute right-0 text-gray-500 hover:text-gray-300 transition-colors"
                aria-label={`Manage ${label} modifiers`}
              >
                <Settings size={12} />
              </button>
            )}
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
            tabs={subStats}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className={clsx(
          PANEL.base,
          "p-1.5 sm:p-2 flex flex-col items-center justify-start gap-1 relative transition-all",
          "w-full",
          // Critical condition overrides modified border (handled by getPanelBorder)
          // Hide modified border for Evasion specifically
          getPanelBorder({
            isCritical: isCriticalCondition,
            isModified: label === 'Evasion' ? false : isModified
          }),
          className
        )}>
        <div className="relative flex items-center justify-center w-full">
          <div className={clsx("flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide", color)}>
            <Icon size={12} />
            {label}
          </div>
          {onUpdateModifiers && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModifierSheet(true);
              }}
              className="absolute right-0 text-gray-500 hover:text-gray-300 transition-colors"
              aria-label={`Manage ${label} modifiers`}
            >
              <Settings size={12} />
            </button>
          )}
        </div>

        {/* Display: Track or Number */}
        {trackType && max && max > 0 ? (
          renderTrack()
        ) : (
          <div className="text-2xl font-serif font-bold leading-none my-1 flex flex-col items-center">
            <span className={isModified && !trackType ? getValueColor(true) : ""}>{current}</span>
            {max !== undefined && <span className="text-xs text-gray-500 font-sans font-normal">/{max}</span>}
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
          <div className="flex w-full gap-1 mt-1">
            {/* ... Buttons ... */}
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
          tabs={subStats}
        />
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  // Return false if props are different (re-render needed)

  // Check core display values
  if (prevProps.current !== nextProps.current) return false;
  if (prevProps.max !== nextProps.max) return false;
  if (prevProps.label !== nextProps.label) return false;
  if (prevProps.color !== nextProps.color) return false;

  // Check state flags
  if (prevProps.isCriticalCondition !== nextProps.isCriticalCondition) return false;
  if (prevProps.isModified !== nextProps.isModified) return false;
  if (prevProps.expectedValue !== nextProps.expectedValue) return false;
  if (prevProps.disableCritColor !== nextProps.disableCritColor) return false;

  // Check styling
  if (prevProps.variant !== nextProps.variant) return false;
  if (prevProps.className !== nextProps.className) return false;
  if (prevProps.trackType !== nextProps.trackType) return false;

  // Check thresholds (shallow comparison)
  if (prevProps.thresholds !== nextProps.thresholds) {
    if (!prevProps.thresholds || !nextProps.thresholds) return false;
    if (prevProps.thresholds.minor !== nextProps.thresholds.minor) return false;
    if (prevProps.thresholds.major !== nextProps.thresholds.major) return false;
    if (prevProps.thresholds.severe !== nextProps.thresholds.severe) return false;
  }

  // Check modifiers array (deep comparison)
  if (JSON.stringify(prevProps.modifiers) !== JSON.stringify(nextProps.modifiers)) return false;
  if (JSON.stringify(prevProps.subStats) !== JSON.stringify(nextProps.subStats)) return false;

  // Callbacks: Allow re-render only if both old and new exist but are different
  // If callbacks are the same reference, don't re-render
  // Note: Parent should wrap these in useCallback for best performance
  if (prevProps.onIncrement !== nextProps.onIncrement) return false;
  if (prevProps.onDecrement !== nextProps.onDecrement) return false;
  if (prevProps.onUpdateModifiers !== nextProps.onUpdateModifiers) return false;

  // All props are equal, skip re-render
  return true;
});

export default VitalCard;