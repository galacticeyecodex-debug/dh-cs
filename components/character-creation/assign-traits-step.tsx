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
  const stats = formData.stats || { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 };
  const statKeys: (keyof CharacterFormData['stats'])[] = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'];

  const useSuggested = () => {
    if (!suggestedTraits) return;
    // suggestedTraits is "+1, 0, +1, +2, -1, 0"
    const values = suggestedTraits.split(',').map(v => parseInt(v.trim()));
    if (values.length === 6) {
      setFormData(prev => ({
        ...prev,
        stats: {
          agility: values[0],
          strength: values[1],
          finesse: values[2],
          instinct: values[3],
          presence: values[4],
          knowledge: values[5]
        }
      }));
    }
  };

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

    // Return unique values for the dropdown, but we need to know how many of each are left
    return Array.from(new Set(pool)).sort((a, b) => b - a);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-serif flex items-center gap-2"><HandMetal size={20} /> Step 5: Assign Traits</h2>
        {suggestedTraits && (
          <button 
            type="button" 
            onClick={useSuggested}
            className="text-xs bg-dagger-gold/20 hover:bg-dagger-gold/30 text-dagger-gold border border-dagger-gold/30 px-3 py-1.5 rounded-full transition-all"
          >
            Use Suggested
          </button>
        )}
      </div>
      
      <p className="text-sm text-gray-400">
        Assign your traits using the values: {traitAssignmentPool.map(v => v >= 0 ? `+${v}` : v).join(', ')}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {statKeys.map((stat) => {
          const value = stats[stat];
          const availableOptions = getAvailableValues(stat);
          
          return (
            <div key={stat} className="flex flex-col gap-1">
              <label className="capitalize text-xs font-bold text-gray-500 tracking-wider ml-1">{stat}</label>
              <select
                value={value}
                onChange={(e) => assignTraitValue(stat, parseInt(e.target.value))}
                className={clsx(
                  "w-full p-3 rounded-lg border-2 bg-black/20 text-xl font-bold transition-all focus:ring-dagger-gold focus:border-dagger-gold",
                  value !== 0 || traitAssignmentPool.filter(v => v === 0).length > 0
                    ? "border-dagger-gold/30 text-dagger-gold"
                    : "border-white/5 text-gray-500"
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
