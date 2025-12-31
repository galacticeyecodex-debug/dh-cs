/**
 * ASSIGN TRAITS STEP
 * ----------------------------------------------------------------------------
 * This component handles the assignment of the 6 core traits during character creation.
 * 
 * DESIGN PHILOSOPHY:
 * - Unifies recommendations and assignment into a single "Selection Box".
 * - Starts with all traits unassigned ("---").
 * - Each trait is displayed in a grid with large value displays (Vital Card style).
 * - Dropdowns contain the 6 pool slots plus a reset ("---") option.
 * - Selecting a slot for one trait disables it for others.
 * - "Use Recommended Assignments" button provides a quick-start path.
 */

'use client';

import React, { useMemo, useEffect } from 'react';
import { User, RefreshCw, Info, Check, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { CharacterFormData } from './types';
import { PANEL, BUTTON } from '@/lib/styles';

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
  // Current values from the form data
  const stats = useMemo(() => 
    formData.stats || { agility: undefined, strength: undefined, finesse: undefined, instinct: undefined, presence: undefined, knowledge: undefined },
  [formData.stats]);

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
    } catch (e) {
      return null;
    }
  }, [suggestedTraits]);

  // Apply suggestions
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

  // Handle slot selection
  const handleSlotSelection = (stat: keyof CharacterFormData['stats'], poolIndex: number | null) => {
    setFormData(prev => {
      const newStats = { ...(prev.stats || stats) } as any;
      if (poolIndex === null) {
        newStats[stat] = undefined; // Set back to blank
      } else {
        newStats[stat] = traitAssignmentPool[poolIndex];
      }
      return { ...prev, stats: newStats };
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-serif flex items-center gap-2">
        <User size={20} /> Step 5: Assign Traits
      </h2>

      <div className="space-y-4">
        {/* Info Box */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex gap-3 items-start shadow-sm">
          <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
          <div className="space-y-1 text-sm text-gray-300">
            <p>Assign trait values from your pool. Each slot can only be used once.</p>
            <div className="flex gap-1.5 mt-2">
              {traitAssignmentPool.map((val, idx) => (
                <span key={idx} className={clsx(
                  "px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono font-bold text-[10px] text-white"
                )}>
                  {val > 0 ? `+${val}` : val}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Unified Selection Box */}
        <div className="bg-dagger-panel border border-white/10 rounded-xl overflow-hidden shadow-lg">
          {/* Box Header */}
          <div className={clsx(
            "px-4 py-3 border-b flex flex-col sm:flex-row gap-3 justify-between items-center transition-colors bg-white/5 border-white/10"
          )}>
            <div className="flex items-center gap-2">
              <p className={clsx(
                "text-xs font-bold uppercase tracking-wider text-dagger-gold"
              )}>
                {isMatchingSuggestions ? "Using Recommended Build" : "Selection Card"}
              </p>
              {classSource && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase border bg-black/40 text-gray-400 border-white/10">
                  {classSource}
                </span>
              )}
            </div>
            {suggestedValues && (
              <button
                type="button"
                onClick={applySuggestions}
                disabled={isMatchingSuggestions}
                className={clsx(
                  "text-[10px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border",
                  isMatchingSuggestions
                    ? "bg-white/10 text-gray-400 border-white/10 cursor-default"
                    : "bg-dagger-gold text-black hover:bg-yellow-500 border-dagger-gold shadow-md hover:scale-105"
                )}
              >
                {!isMatchingSuggestions && <RefreshCw size={12} />}
                {isMatchingSuggestions ? "Build Applied" : "Use Recommended Assignments"}
              </button>
            )}
          </div>

          {/* Grid Layout */}
          <div className="p-4 bg-black/20">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                      "flex flex-col gap-1 p-2 rounded-lg border transition-all duration-300 relative overflow-hidden",
                      isSuggestedValue ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5",
                      !isAssigned && "border-white/5"
                    )}
                  >
                    {/* Stat Label */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        {stat}
                      </span>
                    </div>

                    {/* Value Display */}
                    <div className="relative group">
                      <select
                        value={currentSlotIndex !== undefined ? String(currentSlotIndex) : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            handleSlotSelection(stat, null);
                            return;
                          }
                          
                          const idx = parseInt(val);
                          // STRICT CHECK: Is this specific pool index already taken by another stat?
                          const isTakenByOther = slotMapping.claimedPoolIndices.has(idx) && currentSlotIndex !== idx;
                          
                          if (!isTakenByOther) {
                            handleSlotSelection(stat, idx);
                          } else {
                            // If taken, we force the select back to its current state
                            // This prevents the visual "reset to ---" bug in some browsers
                            e.target.value = currentSlotIndex !== undefined ? String(currentSlotIndex) : "";
                          }
                        }}
                        className={clsx(
                          "w-full appearance-none bg-transparent text-center font-serif font-bold text-3xl py-2 cursor-pointer outline-none transition-all z-10 relative",
                          isAssigned ? "text-white" : "text-gray-700",
                          "hover:scale-110"
                        )}
                      >
                        <option value="" className="bg-zinc-900 text-gray-500">---</option>
                        {traitAssignmentPool.map((poolVal, poolIdx) => {
                          const isClaimedByOther = slotMapping.claimedPoolIndices.has(poolIdx) && currentSlotIndex !== poolIdx;
                          return (
                            <option 
                              key={poolIdx} 
                              value={String(poolIdx)} 
                              disabled={isClaimedByOther}
                              className="bg-zinc-900 text-base disabled:text-gray-600"
                            >
                              {poolVal > 0 ? `+${poolVal}` : poolVal} {isClaimedByOther ? '(Taken)' : ''}
                            </option>
                          );
                        })}
                      </select>
                      <div className="absolute bottom-2 left-4 right-4 border-b border-dashed border-white/10 group-hover:border-dagger-gold/30 transition-colors" />
                    </div>

                    {/* Suggestion hint */}
                    {suggestionForThis !== null && (
                      <div className="flex justify-center mt-1">
                        <span className={clsx(
                          "text-[9px] font-medium transition-colors",
                          isSuggestedValue ? "text-dagger-gold/80" : "text-gray-600"
                        )}>
                          Rec: {suggestionForThis > 0 ? `+${suggestionForThis}` : suggestionForThis}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Validation Footer */}
          {!isValid && (
            <div className="px-4 py-2 bg-white/5 border-t border-white/10 flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
              <AlertCircle size={12} />
              <span>Complete all trait assignments from the pool to continue</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20">Back</button>
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
