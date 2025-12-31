'use client';

import React from 'react';
import { HandMetal } from 'lucide-react';
import clsx from 'clsx';
import { CharacterFormData } from './types';

interface AssignTraitsStepProps {
  formData: Partial<CharacterFormData>;
  displayTraitPool: number[];
  traitAssignmentPool: number[];
  selectedTraitIndex: number | null;
  setSelectedTraitIndex: (index: number | null) => void;
  assignTraitValue: (statName: keyof CharacterFormData['stats'], value: number | '') => void;
  isTraitValueAssigned: (value: number) => boolean;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

export default function AssignTraitsStep({
  formData,
  displayTraitPool,
  traitAssignmentPool,
  selectedTraitIndex,
  setSelectedTraitIndex,
  assignTraitValue,
  isTraitValueAssigned,
  onNext,
  onBack,
  isValid
}: AssignTraitsStepProps) {
  const availableTraits = Object.entries(formData.stats || {});
  // Count how many non-zero values still need to be assigned
  const assignedNonZeroCount = Object.values(formData.stats || {}).filter(v => v !== 0).length;
  const remainingCount = displayTraitPool.length - assignedNonZeroCount;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold font-serif flex items-center gap-2"><HandMetal size={20} /> Step 5: Assign Traits</h2>
      <p className="text-sm text-gray-400">
        <span className="hidden md:inline">Click a value to select, then click a stat to assign.</span>
        <span className="md:hidden">Tap a value, then tap a stat to assign.</span>
        {' '}Remaining: {remainingCount}
      </p>
      <div className="flex justify-center flex-wrap gap-2 mb-4">
        {displayTraitPool.map((val, index) => {
          const isAssigned = isTraitValueAssigned(val);
          const isSelected = selectedTraitIndex === index;

          return (
            <button
              key={index}
              type="button"
              className={clsx(
                "px-4 py-2 rounded-full cursor-pointer transition-all",
                isSelected
                  ? "bg-dagger-gold text-black ring-2 ring-dagger-gold ring-offset-2 ring-offset-dagger-dark scale-105 shadow-lg"
                  : isAssigned
                    ? "bg-gray-600 text-gray-400 hover:bg-gray-500"
                    : "bg-blue-600 text-white hover:bg-blue-500 active:scale-95"
              )}
              onClick={() => setSelectedTraitIndex(index)}
            >
              {val >= 0 ? `+${val}` : val}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {availableTraits.map(([stat, value]) => {
          const statValue = formData.stats![stat as keyof CharacterFormData['stats']];
          const isAssigned = statValue !== 0 && traitAssignmentPool.includes(statValue);

          return (
            <button
              type="button"
              key={stat}
              className={clsx(
                "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                isAssigned
                  ? "bg-dagger-gold/10 border-dagger-gold shadow-md shadow-dagger-gold/20"
                  : "bg-black/20 border-white/5 hover:border-white/20",
                selectedTraitIndex !== null && "cursor-pointer hover:scale-105 active:scale-95"
              )}
              onClick={() => {
                if (selectedTraitIndex !== null) {
                  const selectedValue = displayTraitPool[selectedTraitIndex];
                  assignTraitValue(stat as keyof CharacterFormData['stats'], selectedValue);
                }
              }}
            >
              <label className="capitalize text-sm text-gray-300 pointer-events-none">{stat}</label>
              <div className={clsx(
                "text-3xl font-bold mt-1 pointer-events-none",
                isAssigned ? "text-dagger-gold" : "text-gray-500"
              )}>
                {statValue >= 0 ? `+${statValue}` : statValue}
              </div>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  assignTraitValue(stat as keyof CharacterFormData['stats'], '');
                }}
                className="mt-2 text-red-400 text-xs hover:underline cursor-pointer"
              >
                Clear
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-between mt-4">
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
