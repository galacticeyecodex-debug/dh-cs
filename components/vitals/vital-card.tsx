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

import React, { useState, useMemo, useCallback } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { getIconByName, VitalId, AppIcons } from '@/lib/icon-utils';
import clsx from 'clsx';
import ModifierSheet, { ModifierTab } from '@/components/shared/modifier-sheet';
import SRDInfoButton from '@/components/shared/srd-info-button';
import { getValueColor, getPanelBorder, PANEL } from '@/lib/styles';
import { Z_INDEX } from '@/constants/z-index';

// Modifier source types align with ModifierSourceType from modifier-aggregator
type ModifierSourceType = 'equipment' | 'domain_card' | 'user' | 'ancestry' | 'community' | 'class' | 'subclass' | 'system';

// Props interface for VitalCard
/**
 * Convert raw damage to HP marks based on SRD damage thresholds.
 * SRD Reference: content/public/srd/markdown/contents/Combat.md
 * - If damage >= severe threshold → mark 3 HP
 * - If damage >= major threshold → mark 2 HP
 * - If damage < major threshold → mark 1 HP (minor)
 */
function damageToHpMarks(
  damage: number,
  thresholds: { minor: number; major: number; severe: number }
): { hpLoss: number; severity: 'minor' | 'major' | 'severe' } {
  if (thresholds.severe > 0 && damage >= thresholds.severe) {
    return { hpLoss: 3, severity: 'severe' };
  }
  if (thresholds.major > 0 && damage >= thresholds.major) {
    return { hpLoss: 2, severity: 'major' };
  }
  return { hpLoss: thresholds.minor || 1, severity: 'minor' };
}

interface VitalCardProps {
  label: string;
  current: number;
  max?: number;
  color: string;
  icon?: React.ElementType;
  vitalId?: VitalId;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onMarkAmount?: (amount: number) => void;
  isCriticalCondition?: boolean;
  isModified?: boolean;
  expectedValue?: number;
  disableCritColor?: boolean; // New prop to disable red color on full track
  thresholds?: { minor: number, major: number, severe: number };
  variant?: 'square' | 'rectangle';
  className?: string;
  trackType?: 'fill-up-good' | 'fill-up-bad' | 'mark-bad';
  modifiers?: { id: string; name: string; value: number; source: ModifierSourceType; type?: string }[];
  onUpdateModifiers?: (modifiers: { id: string; name: string; value: number; source: ModifierSourceType; type?: string }[]) => void;
  strokeColor?: string;
  subStats?: ModifierTab[];
  isNested?: boolean;
  isFlat?: boolean;
  showDamageCalculator?: boolean;
}



/**
 * VISUAL THRESHOLDS COMPONENT
 * ----------------------------------------------------------------------------
 * Replicates the Daggerheart SRD visual style for damage thresholds.
 * For Hit Points, it uses the themed damage-thresholds.svg asset.
 * For other stats, it uses a simpler visual layout.
 */
function VisualThresholds({
  thresholds,
  label,
  onMarkAmount
}: {
  thresholds: { minor: number; major: number; severe: number };
  label: string;
  onMarkAmount?: (amount: number) => void;
}) {
  const isHP = label === 'Hit Points';

  if (isHP) {
    return (
      <div className="w-full pt-1 pb-2">
        <div
          className="relative flex items-center mx-auto"
          style={{ height: 42, width: '100%', maxWidth: 300 }}
        >
          <svg
            viewBox="-8 -8 421 62"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Original artwork */}
            <g transform="translate(0,46) scale(0.1,-0.1)" fill="rgba(255,255,255, 0.05)" stroke="none">
              <path d="M7 453 c-13 -12 -7 -81 8 -93 22 -18 22 -242 0 -260 -11 -9 -15 -27 -13 -54 3 -40 4 -41 44 -44 27 -2 45 2 54 13 11 13 62 15 395 15 333 0 384 -2 395 -15 9 -11 27 -15 54 -13 38 3 41 5 44 36 l3 32 269 0 269 0 3 -32 c3 -31 6 -33 44 -36 27 -2 45 2 54 13 11 13 62 15 395 15 333 0 384 -2 395 -15 9 -11 27 -15 54 -13 38 3 41 5 44 36 l3 32 269 0 269 0 3 -32 c3 -31 6 -33 44 -36 27 -2 45 2 54 13 11 13 62 15 395 15 333 0 384 -2 395 -15 9 -11 27 -15 54 -13 40 3 41 4 44 44 2 27 -2 45 -13 54 -22 18 -22 242 0 260 11 9 15 27 13 54 -3 40 -4 41 -44 44 -27 2 -45 -2 -54 -13 -11 -13 -62 -15 -395 -15 -333 0 -384 2 -395 15 -9 11 -27 15 -54 13 -38 -3 -41 -5 -44 -35 l-3 -33 -269 0 -269 0 -3 33 c-3 30 -6 32 -44 35 -27 2 -45 -2 -54 -13 -11 -13 -62 -15 -395 -15 -333 0 -384 2 -395 15 -9 11 -27 15 -54 13 -38 -3 -41 -5 -44 -35 l-3 -33 -269 0 -269 0 -3 33 c-3 30 -6 32 -44 35 -27 2 -45 -2 -54 -13 -19 -22 -771 -23 -790 0 -12 15 -81 21 -93 8z m1598 -153 l69 -70 -69 -70 -69 -70 -276 0 c-201 0 -279 3 -288 12 -17 17 -17 239 0 256 9 9 87 12 288 12 l276 0 69 -70z m1530 0 l69 -70 -69 -70 -69 -70 -276 0 c-201 0 -279 3 -288 12 -8 8 -12 51 -12 128 0 77 4 120 12 128 9 9 87 12 288 12 l276 0 69 -70z" />
              <path d="M1550 230 l0 -65 32 33 33 32 -33 32 -32 33 0 -65z" />
              <path d="M3080 230 l0 -65 32 33 33 32 -33 32 -32 33 0 -65z" />
            </g>

            {/* Rounded rectangle borders */}
            <rect x="-5" y="-4" width="110" height="54" rx="6" ry="6"
              fill="none" stroke='#f6c928' strokeWidth="1" />
            <rect x="148" y="-4" width="110" height="54" rx="6" ry="6"
              fill="none" stroke='#f6c928' strokeWidth="1" />
            <rect x="301" y="-4" width="110" height="54" rx="6" ry="6"
              fill="none" stroke='#f6c928' strokeWidth="1" />

            {/* Labels — positioned at rectangle centers */}
            <text x="50" y="21" textAnchor="middle" fill="#9ca3af" fontSize="14" fontWeight="bold" style={{ textTransform: 'uppercase' }}>Minor</text>
            <text x="50" y="36" textAnchor="middle" fill="#9ca3af" fontSize="13" fontWeight="500">Mark 1 HP</text>

            <text x="203" y="21" textAnchor="middle" fill="#9ca3af" fontSize="14" fontWeight="bold" style={{ textTransform: 'uppercase' }}>Major</text>
            <text x="203" y="36" textAnchor="middle" fill="#9ca3af" fontSize="13" fontWeight="500">Mark 2 HP</text>

            <text x="356" y="21" textAnchor="middle" fill="#9ca3af" fontSize="14" fontWeight="bold" style={{ textTransform: 'uppercase' }}>Severe</text>
            <text x="356" y="36" textAnchor="middle" fill="#9ca3af" fontSize="13" fontWeight="500">Mark 3 HP</text>

            {/* Threshold numbers — positioned at gap centers */}
            <text x="124" y="31" textAnchor="middle" fill="#9ca3af" fontSize="22" fontWeight="bold">{thresholds.major}</text>
            <text x="279.5" y="31" textAnchor="middle" fill="#9ca3af" fontSize="22" fontWeight="bold">{thresholds.severe}</text>

            {/* Click targets — invisible rects over each section */}
            {onMarkAmount && (
              <>
                <rect x="-5" y="-4" width="110" height="54" rx="6" ry="6"
                  fill="transparent" className="cursor-pointer hover:fill-white/10 active:fill-white/20 transition-colors" style={{ transition: 'fill 0.15s' }}
                  onClick={() => onMarkAmount(1)} />
                <rect x="148" y="-4" width="110" height="54" rx="6" ry="6"
                  fill="transparent" className="cursor-pointer hover:fill-white/10 active:fill-white/20 transition-colors" style={{ transition: 'fill 0.15s' }}
                  onClick={() => onMarkAmount(2)} />
                <rect x="301" y="-4" width="110" height="54" rx="6" ry="6"
                  fill="transparent" className="cursor-pointer hover:fill-white/10 active:fill-white/20 transition-colors" style={{ transition: 'fill 0.15s' }}
                  onClick={() => onMarkAmount(3)} />
              </>
            )}
          </svg>
        </div>
      </div>
    );
  }

  return null;
}

const VitalCard = React.memo(function VitalCard({
  label,
  current,
  max,
  color,
  icon: PassedIcon,
  vitalId,
  onIncrement,
  onDecrement,
  onMarkAmount,
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
  strokeColor,
  subStats,
  isNested = false,
  isFlat = false,
  showDamageCalculator = false
}: VitalCardProps) {
  const [showModifierSheet, setShowModifierSheet] = useState(false);
  const [damageInput, setDamageInput] = useState('');
  const [lastHit, setLastHit] = useState<{ hpLoss: number; severity: string } | null>(null);

  // Live preview of threshold result while typing damage
  const damagePreview = useMemo(() => {
    if (!thresholds || !onMarkAmount) return null;
    const amount = parseInt(damageInput);
    if (isNaN(amount) || amount <= 0) return null;
    return damageToHpMarks(amount, thresholds);
  }, [damageInput, thresholds, onMarkAmount]);

  // Submit damage through thresholds
  const handleDamageSubmit = useCallback(() => {
    if (!thresholds || !onMarkAmount) return;
    const amount = parseInt(damageInput);
    if (isNaN(amount) || amount <= 0) return;

    const result = damageToHpMarks(amount, thresholds);
    onMarkAmount(result.hpLoss);
    setDamageInput('');

    // Show result briefly
    setLastHit(result);
    setTimeout(() => setLastHit(null), 1500);
  }, [damageInput, thresholds, onMarkAmount]);

  // Resolve icon: Prop > dynamic from store > Heart fallback
  const iconPreference = useCharacterStore(state => vitalId ? state.vitalIcons[vitalId] : null);
  const Icon = PassedIcon || (vitalId && iconPreference ? getIconByName(iconPreference) : AppIcons.vitals.hitPoints);

  // Determine SRD rule key based on vital type
  const srdRuleKeyMap: Record<string, string> = {
    'Hit Points': 'vitals.hitPoints',
    'Stress': 'vitals.stress',
    'Hope': 'vitals.hope',
    'Armor': 'equipment.armor',
    'Evasion': 'vitals.evasion',
  };
  const srdRuleKey = srdRuleKeyMap[label];

  const isReadOnly = onIncrement === undefined || onDecrement === undefined;
  const isUnarmored = label === 'Armor' && (!max || max === 0);

  // Render Track Logic
  const renderTrack = () => {
    if (!max) return null;

    const icons = [];
    // Determine how many are "filled" based on type
    const filledCount = (trackType === 'fill-up-good' || trackType === 'fill-up-bad') ? current : Math.max(0, max - current);

    // Base color for filled icons
    const filledColor = color;
    const emptyColor = "text-white/10";

    for (let i = 0; i < max; i++) {
      const isFilled = i < filledCount;

      // Apply stroke color if provided and icon is filled, otherwise use active/empty colors
      // If strokeColor is provided (and not in critical 'bad' state), it is added to className.
      // Lucide icons default to stroke="currentColor" so the class overrides it.

      icons.push(
        <Icon
          key={i}
          size={trackType === 'mark-bad' ? 16 : 14}
          className={clsx(
            "transition-all duration-300",
            isFilled ? clsx(filledColor, "scale-100", strokeColor) : clsx(emptyColor, "scale-90")
          )}
          fill={isFilled ? "currentColor" : "none"}
        />
      );
    }

    return (
      <div className="flex flex-wrap justify-center gap-1 px-1">
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
            isFlat ? "bg-transparent border-none" : (isNested ? "bg-white/5 border-white/5" : PANEL.base),
            "p-1.5 sm:p-2 flex flex-col items-center justify-start gap-1 relative transition-all rounded-xl",
            !isFlat && "border",
            "w-full",
            getPanelBorder({ isModified: false }), // Match Vitals consistency
            className
          )}>
          <div
            className="absolute top-1 right-1 flex items-center gap-0.5"
            style={{ zIndex: Z_INDEX.DECORATIVE }}
          >
            {onUpdateModifiers && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModifierSheet(true);
                }}
                className="p-0.5 text-gray-500 hover:text-gray-300 transition-colors rounded hover:bg-white/10"
                aria-label={`Manage ${label} modifiers`}
              >
                <AppIcons.ui.settings size={12} />
              </button>
            )}
          </div>
          <div className="flex items-center justify-center w-full">
            <div className={clsx("flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide", color)}>
              <Icon size={12} />
              {label}
            </div>
          </div>
          <div className="text-sm text-gray-400 italic my-2">Unarmored</div>
          {thresholds && (
            <VisualThresholds thresholds={thresholds} label={label} />
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
          isFlat ? "bg-transparent border-none" : (isNested ? "bg-white/5 border-white/5" : PANEL.base),
          "p-1.5 sm:p-2 flex flex-col items-center justify-start gap-1 relative transition-all rounded-xl",
          !isFlat && "border",
          "w-full",
          // Critical condition overrides modified border (handled by getPanelBorder)
          // Hide modified border for Evasion specifically
          getPanelBorder({
            isCritical: isCriticalCondition,
            isModified: false // Vitals in Character View do not show the modified border to reduce noise
          }),
          className
        )}>
        {/* Header Buttons - Positioned in top-right like StatButton for consistency */}
        <div
          className="absolute top-1 right-1 flex items-center gap-0.5"
          style={{ zIndex: Z_INDEX.DECORATIVE }}
        >
          {srdRuleKey && <SRDInfoButton ruleKey={srdRuleKey} size={12} title={label} />}
          {onUpdateModifiers && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModifierSheet(true);
              }}
              className="p-0.5 text-gray-500 hover:text-gray-300 transition-colors rounded hover:bg-white/10"
              aria-label={`Manage ${label} modifiers`}
            >
              <AppIcons.ui.settings size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center justify-center w-full">
          <div className={clsx("flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide", color)}>
            <Icon size={12} />
            {label}
          </div>
        </div>

        {/* Main Content Row: Left Button | Track/Value | Right Button */}
        <div className="flex items-center w-full gap-1 flex-1">
          {/* Left Button (Clear/Spend/Decrease) */}
          {!isReadOnly && max && max > 0 && (
            <button
              type="button"
              onClick={trackType === 'mark-bad' ? onIncrement : onDecrement}
              aria-label={
                trackType === 'mark-bad' ? `Clear ${label}` :
                  trackType === 'fill-up-bad' ? `Clear ${label}` :
                    trackType === 'fill-up-good' ? `Spend ${label}` :
                      `Decrease ${label}`
              }
              className="h-full min-h-[32px] px-2 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-[9px] font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
            >
              {trackType === 'mark-bad' ? 'Clear' :
                trackType === 'fill-up-bad' ? 'Clear' :
                  trackType === 'fill-up-good' ? 'Spend' :
                    '-'}
            </button>
          )}

          {/* Center: Track or Value */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[32px]">
            {trackType && max && max > 0 ? (
              renderTrack()
            ) : (
              <div className="text-2xl font-serif font-bold leading-none my-1 flex flex-col items-center">
                <span className={isModified && !trackType ? getValueColor(true) : ""}>{current}</span>
                {max !== undefined && <span className="text-xs text-gray-500 font-sans font-normal">/{max}</span>}
              </div>
            )}
          </div>

          {/* Right Button (Mark/Gain/Increase) */}
          {!isReadOnly && max && max > 0 && (
            <button
              type="button"
              onClick={trackType === 'mark-bad' ? onDecrement : onIncrement}
              aria-label={
                trackType === 'mark-bad' ? `Mark ${label}` :
                  trackType === 'fill-up-bad' ? `Mark ${label}` :
                    trackType === 'fill-up-good' ? `Gain ${label}` :
                      `Increase ${label}`
              }
              className="h-full min-h-[32px] px-2 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-[9px] font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
            >
              {trackType === 'mark-bad' ? 'Mark' :
                trackType === 'fill-up-bad' ? 'Mark' :
                  trackType === 'fill-up-good' ? 'Gain' :
                    '+'}
            </button>
          )}
        </div>

        {thresholds && (
          <VisualThresholds thresholds={thresholds} label={label} onMarkAmount={onMarkAmount} />
        )}

        {/* Threshold-based damage calculator (HP only) */}
        {showDamageCalculator && thresholds && onMarkAmount && (
          <div className="w-full flex items-center gap-1 mt-1">
            <input
              type="number"
              value={damageInput}
              onChange={(e) => setDamageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDamageSubmit()}
              placeholder="Dmg"
              min={1}
              className="w-14 px-1.5 py-1 bg-black/40 border border-white/10 rounded text-[10px] text-white text-center placeholder:text-gray-400 focus:outline-none focus:border-red-500/50"
            />
            <button
              onClick={handleDamageSubmit}
              disabled={!damageInput}
              className={clsx(
                'flex-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-30',
                damagePreview?.severity === 'severe'
                  ? 'bg-red-600/40 hover:bg-red-600/50 text-red-100 border border-red-500/30'
                  : damagePreview?.severity === 'major'
                    ? 'bg-orange-500/40 hover:bg-orange-500/50 text-orange-100 border border-orange-400/30'
                    : 'bg-red-500/30 hover:bg-red-500/40 text-red-100 border border-red-400/20'
              )}
            >
              {damagePreview
                ? `−${damagePreview.hpLoss} ${damagePreview.severity[0].toUpperCase() + damagePreview.severity.slice(1)}`
                : <span className="text-gray-400">HIT POINTS MARKED</span>}
            </button>
            {lastHit && (
              <span className={clsx(
                'text-[10px] font-bold animate-pulse',
                lastHit.severity === 'severe' ? 'text-red-400'
                  : lastHit.severity === 'major' ? 'text-orange-400'
                    : 'text-yellow-400'
              )}>
                −{lastHit.hpLoss}
              </span>
            )}
          </div>
        )}
      </div >
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
      )
      }
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
  if (prevProps.showDamageCalculator !== nextProps.showDamageCalculator) return false;
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
  if (prevProps.onMarkAmount !== nextProps.onMarkAmount) return false;
  if (prevProps.onUpdateModifiers !== nextProps.onUpdateModifiers) return false;

  // All props are equal, skip re-render
  return true;
});

export default VitalCard;