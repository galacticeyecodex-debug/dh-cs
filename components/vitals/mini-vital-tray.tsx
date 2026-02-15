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
import { Z_INDEX } from '@/constants/z-index';
import { ModifierTab } from '@/components/shared/modifier-sheet';

export type VitalTrackType = 'mark-bad' | 'fill-up-bad' | 'fill-up-good';

// Modifier source types align with ModifierSourceType from modifier-aggregator
type ModifierSourceType = 'equipment' | 'domain_card' | 'user' | 'ancestry' | 'community' | 'class' | 'subclass' | 'system';

export interface MiniVitalTrayProps {
  /** Whether the tray is open */
  isOpen: boolean;
  /** Display label for the vital (e.g., "Hit Points") */
  label: string;
  /** Current value of the vital */
  current: number;
  /** Maximum value for the track */
  max?: number;
  /** Vital track semantic type */
  trackType?: VitalTrackType;
  /** Icon component to render in the track */
  icon: React.ElementType;
  /** Vital ID for icon preference lookup */
  vitalId?: VitalId;
  /** Primary color class (e.g., "text-red-400") */
  color: string;
  /** Stroke color class for filled icons (e.g., "stroke-red-900") */
  strokeColor?: string;
  /** Called when user wants to increment */
  onIncrement?: () => void;
  /** Called when user wants to decrement */
  onDecrement?: () => void;
  /** Called to close the tray */
  onClose: () => void;
  /** Damage thresholds (for Armor) */
  thresholds?: { minor: number, major: number, severe: number };
  /** Stat modifiers for the modifier sheet */
  modifiers?: { id: string; name: string; value: number; source: ModifierSourceType; type?: string }[];
  /** Callback to update modifiers */
  onUpdateModifiers?: (modifiers: { id: string; name: string; value: number; source: ModifierSourceType; type?: string }[]) => void;
  /** Tabbed sub-stats for the modifier sheet (for Armor thresholds) */
  subStats?: ModifierTab[];
  /** Flag for critical condition (low HP, etc.) */
  isCriticalCondition?: boolean;
  /** Whether the base value has been modified */
  isModified?: boolean;
  /** The expected base value for comparison */
  expectedValue?: number;
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
  thresholds,
  modifiers,
  onUpdateModifiers,
  subStats,
  isCriticalCondition,
  isModified,
  expectedValue,
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
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="vital-tray"
          role="dialog"
          aria-label={`${label} controls`}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          layout
          className="fixed left-0 right-0 bg-dagger-panel border-t border-white/10 rounded-t-xl shadow-lg"
          style={{ 
            zIndex: Z_INDEX.VITAL_TRAY,
            bottom: 'calc(4rem + env(safe-area-inset-bottom) + 3rem)' 
          }}
        >
          {/* Handle - tap to close (matches modifier-sheet pattern) */}
          <button
            onClick={onClose}
            className="flex justify-center w-full py-2"
            aria-label="Close tray"
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
          </button>

          {/* VitalCard content - tray itself is the darker container, VitalCard provides the lighter nested card */}
          {/* motion.div with layout here handles height changes when switching between vitals (e.g. Armor vs Evasion) */}
          <motion.div 
            layout 
            className="px-3 pb-6 overflow-hidden"
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <VitalCard
              key={label} // Ensure unique key per vital type to trigger fresh layout/content
              label={label}
              current={current}
              max={max}
              color={color}
              strokeColor={strokeColor}
              icon={icon}
              vitalId={vitalId}
              trackType={trackType as any}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              thresholds={thresholds}
              modifiers={modifiers as any}
              onUpdateModifiers={onUpdateModifiers as any}
              subStats={subStats}
              isCriticalCondition={isCriticalCondition}
              isModified={isModified}
              expectedValue={expectedValue}
              isNested={true}
              disableCritColor={label === 'Armor'}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MiniVitalTray;
