'use client';

/**
 * EXPERIENCE SELECTION COMPONENT
 * ----------------------------------------------------------------------------
 * This component handles the "Increase Experience" advancement option during level up.
 * When a player chooses to increase an experience, they select two of their existing
 * experiences to permanently boost by +1 each.
 *
 * FUNCTIONALITY:
 * - Displays the character's current list of experiences with their current values.
 * - Allows the user to select exactly TWO experiences to upgrade.
 * - Provides immediate visual feedback showing the old value vs. the new value (e.g., +2 → +3).
 * - Enforces validation: The user cannot proceed if they haven't selected 2 experiences,
 *   and meaningful error messages are shown if the character has no experiences to upgrade.
 */

import React from 'react';
import { Check } from 'lucide-react';
import { Experience } from '@/types/modifiers';

interface ExperienceSelectionProps {
  experiences: Experience[];
  selectedExperienceIndices: number[];
  onSelectExperiences: (indices: number[]) => void;
}

export default function ExperienceSelection({
  experiences,
  selectedExperienceIndices,
  onSelectExperiences,
}: ExperienceSelectionProps) {
  const toggleExperience = (index: number) => {
    const newSelected = [...selectedExperienceIndices];
    const currentIndex = newSelected.indexOf(index);

    if (currentIndex === -1) {
      // Adding - only allow if we have less than 2
      if (newSelected.length < 2) {
        newSelected.push(index);
      }
    } else {
      // Removing
      newSelected.splice(currentIndex, 1);
    }

    onSelectExperiences(newSelected);
  };

  const isSelected = (index: number): boolean => {
    return selectedExperienceIndices.includes(index);
  };

  const canSelect = (index: number): boolean => {
    if (isSelected(index)) return true;
    return selectedExperienceIndices.length < 2;
  };

  // Handle edge case: no experiences
  if (!experiences || experiences.length === 0) {
    return (
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Select Experience to Boost</h3>
        <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg text-yellow-200 text-sm">
          You don&apos;t have any experiences yet. You must have at least 1 experience to select this advancement.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-2">Select Experiences to Boost</h3>
      <p className="text-gray-400 mb-4">
        Choose 2 experiences to permanently increase by +1 each. (Selected: {selectedExperienceIndices.length}/2)
      </p>

      <div className="grid grid-cols-1 gap-2">
        {experiences.map((experience, index) => {
          const selected = isSelected(index);
          const selectable = canSelect(index);

          return (
            <button
              key={`${experience.name}-${index}`}
              onClick={() => toggleExperience(index)}
              disabled={!selectable}
              className={`relative p-4 rounded-lg border transition-all ${selected
                ? 'border-dagger-gold bg-dagger-gold/10'
                : 'border-gray-600 bg-black/30 hover:border-dagger-gold/50'
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 text-left">
                  <p className="font-bold text-white">{experience.name}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg text-gray-300">
                      Current: <span className="font-bold">+{experience.value}</span>
                    </span>
                    {selected && (
                      <>
                        <span className="text-dagger-gold text-sm">→</span>
                        <span className="text-lg font-bold text-dagger-gold">
                          +{experience.value + 1}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {selected && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-dagger-gold flex items-center justify-center">
                      <Check size={16} className="text-black" />
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedExperienceIndices.length < 2 && (
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg text-blue-200 text-sm">
          Select {2 - selectedExperienceIndices.length} more experience{selectedExperienceIndices.length === 0 ? 's' : ''} to continue
        </div>
      )}
    </div>
  );
}
