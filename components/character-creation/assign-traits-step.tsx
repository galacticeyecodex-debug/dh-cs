'use client';

import React from 'react';
import { HandMetal } from 'lucide-react';
import clsx from 'clsx';
import { CharacterFormData } from './types';

interface AssignTraitsStepProps {
  formData: Partial<CharacterFormData>;
  traitAssignmentPool: number[];
  suggestedTraits?: string;
  assignTraitValue: (statName: keyof CharacterFormData['stats'], value: number | '') => void;
  setFormData: React.Dispatch<React.SetStateAction<Partial<CharacterFormData>>>;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

export default function AssignTraitsStep({
  formData,
  traitAssignmentPool,
  suggestedTraits,
  assignTraitValue,
  setFormData,
  onNext,
  onBack,
  isValid
}: AssignTraitsStepProps) {
  // Use a default stats object if formData.stats is undefined
  const defaultStats = { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 };
  const stats = formData.stats || defaultStats;
  const statKeys: (keyof CharacterFormData['stats'])[] = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'];

  // Calculate remaining pool
  const getAvailableValues = (currentStatKey: keyof CharacterFormData['stats']) => {
    const assignedValues = Object.entries(stats)
      .filter(([key]) => key !== currentStatKey)
      .map(([_, val]) => val);
    
    const pool = [...traitAssignmentPool];
    assignedValues.forEach(val => {
      const index = pool.indexOf(val);
      if (index !== -1) pool.splice(index, 1);
    });

    // Return unique values for the dropdown
    return Array.from(new Set(pool)).sort((a, b) => b - a);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-serif flex items-center gap-2"><HandMetal size={20} /> Step 5: Assign Traits</h2>
      </div>
      
      <div className="p-3 bg-dagger-gold/10 border border-dagger-gold/20 rounded-lg text-xs text-dagger-gold/90 leading-relaxed">
        <span className="font-bold">Note:</span> We&apos;ve pre-populated these traits with the suggestions for your class. 
        Feel free to adjust them if you want a different assignment!
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {statKeys.map((stat) => {
          const value = stats[stat];
          const availableOptions = getAvailableValues(stat);
          const isAssigned = formData.stats && formData.stats[stat] !== undefined;
          
          return (
            <div key={stat} className="flex flex-col gap-1">
              <label className="capitalize text-xs font-bold text-gray-500 tracking-wider ml-1">{stat}</label>
              <select
                value={value}
                onChange={(e) => assignTraitValue(stat, parseInt(e.target.value))}
                className={clsx(
                  "w-full p-3 rounded-lg border-2 bg-black/20 text-xl font-bold transition-all focus:ring-dagger-gold focus:border-dagger-gold text-white",
                  isAssigned
                    ? "border-dagger-gold/30"
                    : "border-white/5"
                )}
              >
                {/* We must include the current value even if it's not in the 'available' list of other stats */}
                <option value={value}>{value >= 0 ? `+${value}` : value}</option>
                {availableOptions.filter(v => v !== value).map(opt => (
                  <option key={opt} value={opt}>{opt >= 0 ? `+${opt}` : opt}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-8">
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
