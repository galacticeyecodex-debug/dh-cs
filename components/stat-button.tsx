'use client';

/**
 * STAT BUTTON COMPONENT
 * ----------------------------------------------------------------------------
 * A specialized interactive component for displaying and managing character attributes.
 *
 * CORE FUNCTIONALITY:
 * 1. Roll Trigger (Left Side): Clicking the label triggers a dice roll check for this stat
 *    via the global character store.
 * 2. Modifier Management (Right Side): Clicking the numerical value opens the ModifierSheet,
 *    allowing the user to inspect the base value and apply temporary adjustments/modifiers.
 *
 * VISUAL FEEDBACK:
 * - Automatically highlights modified values in gold with an indicator dot to alert the user
 *   that the current value differs from the base stat.
 *
 * PERFORMANCE:
 * - Memoized with React.memo to prevent unnecessary re-renders
 * - Custom comparison function checks only relevant props
 * - Re-renders only when stat values or modifiers actually change
 */

import React, { useState } from 'react';
import { useCharacterStore } from '@/store/character-store';
import clsx from 'clsx';
import ModifierSheet from '@/components/modifier-sheet';

interface StatButtonProps {
  label: string;
  value: number;
  baseValue?: number;
  modifiers?: { id: string; name: string; value: number; source: 'user' | 'system' | 'domain_card'; type?: 'equipment' | 'domain_card' }[];
  onUpdateModifiers?: (modifiers: { id: string; name: string; value: number; source: 'user' | 'system' | 'domain_card'; type?: 'equipment' | 'domain_card' }[]) => void;
}

const StatButton = React.memo(function StatButton({ label, value, baseValue, modifiers, onUpdateModifiers }: StatButtonProps) {
  const { prepareRoll } = useCharacterStore();
  const [showModifierSheet, setShowModifierSheet] = useState(false);

  const hasModifiers = modifiers && modifiers.length > 0; // Or check user modifiers specifically?
  // Actually, if value !== baseValue, it's modified.
  const isModified = baseValue !== undefined && value !== baseValue;

  return (
    <>
      <div className="flex bg-white/5 border border-white/5 rounded-lg overflow-hidden transition-colors group hover:border-white/20">
        {/* Roll Action (Left/Main) */}
        <button
          type="button"
          onClick={() => prepareRoll(label, value)}
          className="flex-1 p-3 flex items-center justify-start text-left hover:bg-white/5 transition-colors"
        >
          <span className="capitalize font-medium text-gray-300 group-hover:text-white">{label}</span>
        </button>

        {/* Modify Action (Right/Number) */}
        <button
          type="button"
          onClick={(e) => {
            if (onUpdateModifiers) {
              e.stopPropagation();
              setShowModifierSheet(true);
            } else {
              // If no modifier support, just pass click to roll? Or do nothing?
              // Let's fallback to roll if we can't modify, to keep old behavior if props missing.
              prepareRoll(label, value);
            }
          }}
          className={clsx(
            "p-3 min-w-[3rem] flex items-center justify-center font-bold text-xl border-l border-white/5 hover:bg-white/10 transition-colors relative",
            isModified ? "text-dagger-gold" : "text-white"
          )}
        >
          {value >= 0 ? `+${value}` : value}
          {isModified && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-dagger-gold rounded-full" />}
        </button>
      </div>

      {showModifierSheet && onUpdateModifiers && (
        <ModifierSheet
          isOpen={showModifierSheet}
          onClose={() => setShowModifierSheet(false)}
          statLabel={label}
          baseValue={baseValue !== undefined ? baseValue : value}
          currentModifiers={modifiers || []}
          onUpdateModifiers={onUpdateModifiers}
        />
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  // Return false if props are different (re-render needed)

  // Check core display values
  if (prevProps.label !== nextProps.label) return false;
  if (prevProps.value !== nextProps.value) return false;
  if (prevProps.baseValue !== nextProps.baseValue) return false;

  // Check modifiers array (deep comparison)
  if (JSON.stringify(prevProps.modifiers) !== JSON.stringify(nextProps.modifiers)) return false;

  // Check callback reference
  if (prevProps.onUpdateModifiers !== nextProps.onUpdateModifiers) return false;

  // All props are equal, skip re-render
  return true;
});

export default StatButton;