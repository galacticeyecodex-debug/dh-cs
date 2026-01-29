'use client';

/**
 * MINI VITAL TRAY COMPONENT
 * ----------------------------------------------------------------------------
 * An expandable tray that rises from the mini-vitals bar when a vital is tapped.
 * Wraps VitalCard to provide quick access to Mark/Clear controls.
 *
 * FUNCTIONALITY:
 * - Full-width tray positioned above the mini-vitals bar
 * - Uses VitalCard for consistent track visualization and button behavior
 * - Spring animation matching modifier-sheet behavior
 * - Escape key support for dismissal
 *
 * SRD Reference: content/public/srd/markdown/contents/Tracking_Resources.md
 * "Hit Points and Armor are marked (reduced), Stress fills up (accumulated)."
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VitalId } from '@/lib/icon-utils';
import VitalCard from './vital-card';

export type VitalTrackType = 'mark-bad' | 'fill-up-bad' | 'fill-up-good';

export interface MiniVitalTrayProps {
  /** Whether the tray is open */
  isOpen: boolean;
  /** Display label for the vital (e.g., "Hit Points") */
  label: string;
  /** Current value of the vital */
  current: number;
  /** Maximum value for the track */
  max: number;
  /** Vital track semantic type */
  trackType: VitalTrackType;
  /** Icon component to render in the track */
  icon: React.ElementType;
  /** Vital ID for icon preference lookup */
  vitalId?: VitalId;
  /** Primary color class (e.g., "text-red-400") */
  color: string;
  /** Stroke color class for filled icons (e.g., "stroke-red-900") */
  strokeColor?: string;
  /** Called when user wants to increment */
  onIncrement: () => void;
  /** Called when user wants to decrement */
  onDecrement: () => void;
  /** Called to close the tray */
  onClose: () => void;
}

/**
 * MiniVitalTray renders a full-width expandable tray using VitalCard.
 */
export function MiniVitalTray({
  isOpen,
  label,
  current,
  max,
  trackType,
  icon,
  vitalId,
  color,
  strokeColor,
  onIncrement,
  onDecrement,
  onClose,
}: MiniVitalTrayProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-label={`${label} controls`}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed left-0 right-0 z-50 bg-dagger-panel border-t border-white/10 rounded-t-xl shadow-lg px-3 py-2"
          style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom) + 3rem)' }}
        >
          <VitalCard
            label={label}
            current={current}
            max={max}
            color={color}
            strokeColor={strokeColor}
            icon={icon}
            vitalId={vitalId}
            trackType={trackType}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            isFlat={true}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MiniVitalTray;
