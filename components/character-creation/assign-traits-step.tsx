/**
 * ASSIGN TRAITS STEP
 * ----------------------------------------------------------------------------
 * This component handles the assignment of the 6 core traits during character creation.
 * 
 * DESIGN PHILOSOPHY:
 * - Pre-populates with class recommendations on mount for a streamlined experience.
 * - Uses segmented button rows instead of dropdowns for one-click value changes.
 * - Each pool value slot can only be used once; taken slots are visually dimmed.
 * - Shows "Recommended" indicator when a stat matches the class suggestion.
 * - "Reset to Recommended" button allows reverting customizations.
 */

'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { User, RotateCcw, Info, Check, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { CharacterFormData } from './types';
import { PANEL } from '@/lib/styles';

interface AssignTraitsStepProps {
  formData: Partial<CharacterFormData>;
  traitAssignmentPool: number[]; // Expected: [2, 1, 1, 0, 0, -1]
  suggestedTraits?: string; // e.g. "0, -1, +1, 0, +2, +1"
  classSource?: string;
  assignTraitValue: (statName: keyof CharacterFormData['stats'], value: number | '') => void;
  setFormData: React.Dispatch<React.SetStateAction<Partial<CharacterFormData>>>;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

const STAT_ORDER: (keyof CharacterFormData['stats'])[] = [
  'agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'
];

const STAT_LABELS: Record<keyof CharacterFormData['stats'], string> = {
  agility: 'Agility',
  strength: 'Strength',
  finesse: 'Finesse',
  instinct: 'Instinct',
  presence: 'Presence',
  knowledge: 'Knowledge'
};

export default function AssignTraitsStep({
  formData,
  traitAssignmentPool,
  suggestedTraits,
  classSource,
  setFormData,
  onNext,
  onBack,
  isValid
}: AssignTraitsStepProps) {
  const hasAutoApplied = useRef(false);

  // Current values from the form data
  const stats = useMemo(() =>
    formData.stats || { agility: undefined, strength: undefined, finesse: undefined, instinct: undefined, presence: undefined, knowledge: undefined },
    [formData.stats]);

  // Parse suggested traits
  const suggestedValues = useMemo(() => {
    if (!suggestedTraits) return null;
    try {
      const values = suggestedTraits.split(',').map(v => parseInt(v.trim()));
      if (values.length !== 6) return null;
      const suggestionMap: Record<string, number> = {};
      STAT_ORDER.forEach((stat, index) => {
        suggestionMap[stat] = values[index];
      });
      return suggestionMap;
    } catch {
      return null;
    }
  }, [suggestedTraits]);

  // Auto-apply suggestions on mount (only once)
  useEffect(() => {
    if (suggestedValues && !hasAutoApplied.current) {
      // Check if stats are all unassigned
      const allUnassigned = STAT_ORDER.every(stat =>
        (stats as any)[stat] === undefined || (stats as any)[stat] === null
      );

      if (allUnassigned) {
        setFormData(prev => ({
          ...prev,
          stats: {
            agility: suggestedValues.agility,
            strength: suggestedValues.strength,
            finesse: suggestedValues.finesse,
            instinct: suggestedValues.instinct,
            presence: suggestedValues.presence,
            knowledge: suggestedValues.knowledge,
          }
        }));
        hasAutoApplied.current = true;
      }
    }
  }, [suggestedValues, stats, setFormData]);

  /**
   * SLOT MAPPING LOGIC
   * We map the current stat values to specific indices in the traitAssignmentPool.
   * This ensures duplicate values (like two 0s) are tracked as separate "slots".
   */
  const slotMapping = useMemo(() => {
    const assignedSlots: Record<string, number> = {}; // statName -> poolIndex
    const claimedPoolIndices = new Set<number>();

    STAT_ORDER.forEach(stat => {
      const val = (stats as any)[stat];
      if (val === undefined || val === null) return;

      const poolIndex = traitAssignmentPool.findIndex((v, idx) => v === val && !claimedPoolIndices.has(idx));
      if (poolIndex !== -1) {
        assignedSlots[stat] = poolIndex;
        claimedPoolIndices.add(poolIndex);
      }
    });
    return { assignedSlots, claimedPoolIndices };
  }, [stats, traitAssignmentPool]);

  // Apply suggestions (reset to recommended)
  const applySuggestions = () => {
    if (suggestedValues) {
      setFormData(prev => ({
        ...prev,
        stats: {
          agility: suggestedValues.agility,
          strength: suggestedValues.strength,
          finesse: suggestedValues.finesse,
          instinct: suggestedValues.instinct,
          presence: suggestedValues.presence,
          knowledge: suggestedValues.knowledge,
        }
      }));
    }
  };

  const isMatchingSuggestions = useMemo(() => {
    if (!suggestedValues) return false;
    return STAT_ORDER.every(stat => (stats as any)[stat] === (suggestedValues as any)[stat]);
  }, [stats, suggestedValues]);

  // Handle pool button click for a stat
  const handlePoolButtonClick = (stat: keyof CharacterFormData['stats'], poolIndex: number) => {
    const currentSlotIndex = slotMapping.assignedSlots[stat];

    // If clicking the already-selected value, deselect it
    if (currentSlotIndex === poolIndex) {
      setFormData(prev => {
        const newStats = { ...(prev.stats || stats) } as any;
        newStats[stat] = undefined;
        return { ...prev, stats: newStats };
      });
      return;
    }

    // Check if this pool index is taken by another stat
    const isTakenByOther = slotMapping.claimedPoolIndices.has(poolIndex) && currentSlotIndex !== poolIndex;
    if (isTakenByOther) return;

    // Assign the value
    setFormData(prev => {
      const newStats = { ...(prev.stats || stats) } as any;
      newStats[stat] = traitAssignmentPool[poolIndex];
      return { ...prev, stats: newStats };
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-serif flex items-center gap-2">
        <User size={20} /> Step 5: Assign Traits
      </h2>

      <div className="space-y-4">
        {/* Info Box with Pool Display */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex gap-3 items-start shadow-sm">
          <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
          <div className="space-y-2 text-sm text-gray-300">
            <p>
              {classSource ? (
                <>Each class benefits from specific traits. Choose the recommended values or change them to suit your character.</>
              ) : (
                <>Assign trait values from your pool. Tap any value to change it.</>
              )}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 uppercase font-bold">Pool:</span>
              <div className="flex gap-1.5">
                {traitAssignmentPool.map((val, idx) => {
                  const isClaimed = slotMapping.claimedPoolIndices.has(idx);
                  return (
                    <span
                      key={idx}
                      className={clsx(
                        "px-2 py-0.5 rounded font-mono font-bold text-[10px] transition-all",
                        isClaimed
                          ? "bg-dagger-gold/20 text-dagger-gold border border-dagger-gold/30"
                          : "bg-white/5 border border-white/10 text-white"
                      )}
                    >
                      {val > 0 ? `+${val}` : val}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Trait Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STAT_ORDER.map((stat) => {
            const currentSlotIndex = slotMapping.assignedSlots[stat];
            const currentValue = (stats as any)[stat];
            const isAssigned = currentValue !== undefined && currentValue !== null;
            const suggestionForThis = suggestedValues ? (suggestedValues as any)[stat] : null;
            const isSuggestedValue = suggestionForThis !== null && currentValue === suggestionForThis;

            return (
              <div
                key={stat}
                className={clsx(
                  PANEL.baseWithBorder,
                  "p-3 flex flex-col gap-2 transition-all duration-200",
                  isSuggestedValue && "border-dagger-gold/30"
                )}
              >
                {/* Header: Stat Label + Recommendation Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {STAT_LABELS[stat]}
                  </span>
                  {isSuggestedValue && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-dagger-gold/20 text-dagger-gold border border-dagger-gold/30 flex items-center gap-1">
                      <Check size={8} /> Rec
                    </span>
                  )}
                </div>

                {/* Current Value Display */}
                <div className="text-center py-2">
                  <span className={clsx(
                    "text-4xl font-serif font-bold transition-colors",
                    isAssigned ? "text-white" : "text-gray-700"
                  )}>
                    {isAssigned ? (currentValue > 0 ? `+${currentValue}` : currentValue) : '---'}
                  </span>
                </div>

                {/* Segmented Button Row */}
                <div className="flex gap-1 justify-center flex-wrap">
                  {traitAssignmentPool.map((poolVal, poolIdx) => {
                    const isSelected = currentSlotIndex === poolIdx;
                    const isTakenByOther = slotMapping.claimedPoolIndices.has(poolIdx) && currentSlotIndex !== poolIdx;
                    const isRecommendedButton = suggestionForThis === poolVal;

                    return (
                      <button
                        key={poolIdx}
                        type="button"
                        onClick={() => handlePoolButtonClick(stat, poolIdx)}
                        disabled={isTakenByOther}
                        className={clsx(
                          "relative px-2.5 py-1.5 rounded text-xs font-bold transition-all",
                          isSelected
                            ? "bg-dagger-gold text-black shadow-md scale-105"
                            : isTakenByOther
                              ? "bg-white/5 text-gray-600 cursor-not-allowed opacity-40 line-through"
                              : "bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20"
                        )}
                      >
                        {poolVal > 0 ? `+${poolVal}` : poolVal}
                        {/* Recommendation dot indicator */}
                        {isRecommendedButton && !isSelected && !isTakenByOther && (
                          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-dagger-gold/60" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Reset Button (only show if not matching recommendations) */}
        {suggestedValues && !isMatchingSuggestions && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={applySuggestions}
              className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <RotateCcw size={12} />
              Reset to Recommended
            </button>
          </div>
        )}

        {/* Validation Footer */}
        {!isValid && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            <span>Assign all 6 traits to continue</span>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors">
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className={clsx(
            "px-4 py-2 font-bold rounded-full shadow-md transition-all",
            isValid
              ? "bg-dagger-gold text-black hover:scale-[1.02]"
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}
