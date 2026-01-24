'use client';

/**
 * STAT BUTTON COMPONENT
 * ----------------------------------------------------------------------------
 * A specialized interactive component for displaying and managing character attributes.
 *
 * CORE FUNCTIONALITY:
 * 1. Roll Trigger (Left Side): Clicking the label triggers a dice roll check for this stat
 *    via the global character store.
 * 2. Modifier Management (Top-Right Gear Button): A small gear icon appears when modifiers
 *    are available. Clicking it opens the ModifierSheet for inspecting base values and 
 *    applying temporary adjustments/modifiers.
 * 3. Value Display (Right Side): Shows the current total value (base + modifiers).
 *
 * VISUAL FEEDBACK:
 * - Automatically highlights modified values in gold to alert the user
 *   that the current value differs from the base stat.
 * - Gear icon appears only when onUpdateModifiers is provided.
 *
 * PERFORMANCE:
 * - Memoized with React.memo to prevent unnecessary re-renders
 * - Custom comparison function checks only relevant props
 * - Re-renders only when stat values or modifiers actually change
 */

import React, { useState } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { AppIcons } from '@/lib/icon-utils';
import clsx from 'clsx';
import ModifierSheet from '@/components/shared/modifier-sheet';
import { getValueColor } from '@/lib/styles';

interface StatButtonProps {
  label: string;
  value: number;
  baseValue?: number;
  modifiers?: { id: string; name: string; value: number; source: 'user' | 'system' | 'domain_card'; type?: 'equipment' | 'domain_card' }[];
  onUpdateModifiers?: (modifiers: { id: string; name: string; value: number; source: 'user' | 'system' | 'domain_card'; type?: 'equipment' | 'domain_card' }[]) => void;
  hideModifierButton?: boolean;
  isSpellcast?: boolean;
}

const StatButton = React.memo(function StatButton({ label, value, baseValue, modifiers, onUpdateModifiers, hideModifierButton, isSpellcast }: StatButtonProps) {
  const { prepareRoll } = useCharacterStore();
  const [showModifierSheet, setShowModifierSheet] = useState(false);

  const hasModifiers = modifiers && modifiers.length > 0; // Or check user modifiers specifically?
  // Actually, if value !== baseValue, it's modified.
  const isModified = baseValue !== undefined && value !== baseValue;

  return (
    <>
      <div className="relative flex bg-white/5 border border-white/5 rounded-lg overflow-hidden transition-colors group hover:border-white/20">
        {/* Gear button for modifiers - top right corner of entire card */}
        {onUpdateModifiers && !hideModifierButton && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowModifierSheet(true);
            }}
            className="absolute top-1 right-1 z-10 text-gray-500 hover:text-gray-300 transition-colors p-0.5 rounded hover:bg-white/10"
            aria-label={`Manage ${label} modifiers`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        )}

        {/* Roll Action (Left/Main) - with dice icon in its top-right */}
        <button
          type="button"
          onClick={() => prepareRoll(label, value)}
          className="relative flex-1 p-2 sm:p-3 flex items-center justify-start text-left hover:bg-white/5 transition-colors"
        >
          {/* Dice icon for roll action - top right of this compartment */}
          <div
            className="absolute top-1 right-1 text-gray-500 group-hover:text-gray-400 transition-colors pointer-events-none"
            aria-hidden="true"
          >
            <AppIcons.combat.roll size={12} />
          </div>

          <span className="capitalize font-medium text-gray-300 group-hover:text-white text-sm sm:text-base flex items-center gap-1.5">
            {label}
            {isSpellcast && <AppIcons.combat.spellcast size={14} className="text-purple-400 shrink-0" />}
          </span>
        </button>

        {/* Value Display (Right/Number) */}
        <div
          className={clsx(
            "p-2 sm:p-3 min-w-[2.5rem] sm:min-w-[3rem] flex items-center justify-center font-bold text-lg sm:text-xl border-l border-white/5",
            getValueColor(isModified)
          )}
        >
          {value >= 0 ? `+${value}` : value}
        </div>
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

  // Check isSpellcast
  if (prevProps.isSpellcast !== nextProps.isSpellcast) return false;

  // All props are equal, skip re-render
  return true;
});

export default StatButton;