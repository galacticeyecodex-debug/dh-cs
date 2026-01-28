'use client';

/**
 * MINI VITAL TRAY COMPONENT
 * ----------------------------------------------------------------------------
 * An expandable tray that rises from the mini-vitals bar when a vital is tapped.
 * Provides quick access to Mark/Clear controls with an icon track, matching
 * the VitalCard UI pattern.
 *
 * FUNCTIONALITY:
 * - Full-width tray positioned above the mini-vitals bar
 * - Icon track visualization matching VitalCard semantics
 * - Clear/Mark (or Spend/Gain for Hope) buttons
 * - Backdrop for dismissal, Escape key support
 * - Respects prefers-reduced-motion
 *
 * SRD Reference: content/public/srd/markdown/contents/Tracking_Resources.md
 * "Hit Points and Armor are marked (reduced), Stress fills up (accumulated)."
 */

import React, { useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { AppIcons } from '@/lib/icon-utils';

export type VitalTrackType = 'mark-bad' | 'fill-up-bad' | 'fill-up-good';

export interface MiniVitalTrayProps {
  /** Display label for the vital (e.g., "Hit Points") */
  label: string;
  /** Current value of the vital */
  current: number;
  /** Maximum value for the track */
  max: number;
  /** Vital track semantic type */
  vitalType: VitalTrackType;
  /** Icon component to render in the track */
  icon: React.ElementType;
  /** Tailwind color class (e.g., "text-red-400") */
  color: string;
  /** Called when user wants to increment (Mark/Gain) */
  onIncrement: () => void;
  /** Called when user wants to decrement (Clear/Spend) */
  onDecrement: () => void;
  /** Called to close the tray */
  onClose: () => void;
}

/**
 * MiniVitalTray renders a full-width expandable tray with icon track and controls.
 */
export function MiniVitalTray({
  label,
  current,
  max,
  vitalType,
  icon: Icon,
  color,
  onIncrement,
  onDecrement,
  onClose,
}: MiniVitalTrayProps) {
  const trayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus management - focus tray when opened
  useEffect(() => {
    trayRef.current?.focus();
  }, []);

  // Render the icon track - matches VitalCard logic
  const renderTrack = useCallback(() => {
    const icons = [];
    // For fill-up types, current = filled count
    // For mark-bad types, filled = max - current (current = remaining capacity)
    const filledCount =
      vitalType === 'fill-up-good' || vitalType === 'fill-up-bad'
        ? current
        : Math.max(0, max - current);

    const filledColor = color;
    const emptyColor = 'text-white/10';

    for (let i = 0; i < max; i++) {
      const isFilled = i < filledCount;

      icons.push(
        <Icon
          key={i}
          size={vitalType === 'mark-bad' ? 16 : 14}
          className={clsx(
            'transition-all duration-300',
            isFilled
              ? clsx(filledColor, 'scale-100')
              : clsx(emptyColor, 'scale-90')
          )}
          fill={isFilled ? 'currentColor' : 'none'}
        />
      );
    }

    return (
      <div className="flex flex-wrap justify-center gap-1 px-1">
        {icons}
      </div>
    );
  }, [current, max, vitalType, color, Icon]);

  // Determine button labels based on track type
  const leftButtonLabel =
    vitalType === 'fill-up-good' ? 'Spend' : 'Clear';
  const rightButtonLabel =
    vitalType === 'fill-up-good' ? 'Gain' : 'Mark';

  // For mark-bad, left button increments (Clear = restore), right decrements (Mark = use)
  // For fill-up types, left button decrements (Clear/Spend), right increments (Mark/Gain)
  const handleLeftClick = () => {
    if (vitalType === 'mark-bad') {
      onIncrement();
    } else {
      onDecrement();
    }
  };

  const handleRightClick = () => {
    if (vitalType === 'mark-bad') {
      onDecrement();
    } else {
      onIncrement();
    }
  };

  return (
    <>
      {/* Backdrop for dismissal */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Tray */}
      <div
        ref={trayRef}
        role="dialog"
        aria-label={`${label} controls`}
        tabIndex={-1}
        className={clsx(
          'fixed left-0 right-0 z-50 bg-dagger-panel border-t border-white/10',
          'motion-safe:animate-slide-up motion-reduce:animate-none'
        )}
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom) + 3rem)' }}
      >
        {/* Close button and title */}
        <div className="flex items-center justify-between px-3 pt-2 pb-1">
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            aria-label="Close tray"
          >
            <AppIcons.ui.close size={12} />
          </button>
          <div className={clsx('flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide', color)}>
            <Icon size={12} />
            {label}
          </div>
          {/* Spacer for centering */}
          <div className="w-6" />
        </div>

        {/* Track and buttons */}
        <div className="flex items-center gap-1 px-3 pb-3">
          {/* Left Button (Clear/Spend) */}
          <button
            type="button"
            onClick={handleLeftClick}
            aria-label={`${leftButtonLabel} ${label}`}
            className="min-h-[32px] px-2 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-[9px] font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
          >
            {leftButtonLabel}
          </button>

          {/* Center: Icon Track */}
          <div className="flex-1 flex items-center justify-center min-h-[32px]">
            {renderTrack()}
          </div>

          {/* Right Button (Mark/Gain) */}
          <button
            type="button"
            onClick={handleRightClick}
            aria-label={`${rightButtonLabel} ${label}`}
            className="min-h-[32px] px-2 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-[9px] font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
          >
            {rightButtonLabel}
          </button>
        </div>
      </div>
    </>
  );
}

export default MiniVitalTray;
