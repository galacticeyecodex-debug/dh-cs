'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { Character } from '@/store/character-store';

interface TraitSelectionProps {
  character: Character;
  selectedTraits: string[];
  onSelectTraits: (traits: string[]) => void;
  markedTraits?: Record<string, any>;
}

const TRAIT_NAMES = [
  { id: 'agility', label: 'Agility' },
  { id: 'strength', label: 'Strength' },
  { id: 'finesse', label: 'Finesse' },
  { id: 'instinct', label: 'Instinct' },
  { id: 'presence', label: 'Presence' },
  { id: 'knowledge', label: 'Knowledge' },
];

export default function TraitSelection({
  character,
  selectedTraits,
  onSelectTraits,
  markedTraits = {},
}: TraitSelectionProps) {
  const toggleTrait = (traitId: string) => {
    const newSelected = [...selectedTraits];
    const index = newSelected.indexOf(traitId);

    if (index === -1) {
      // Adding - only allow if we have less than 2
      if (newSelected.length < 2) {
        newSelected.push(traitId);
      }
    } else {
      // Removing
      newSelected.splice(index, 1);
    }

    onSelectTraits(newSelected);
  };

  const isTraitMarked = (traitId: string): boolean => {
    return markedTraits && markedTraits[traitId] === true;
  };

  const isSelected = (traitId: string): boolean => {
    return selectedTraits.includes(traitId);
  };

  const canSelect = (traitId: string): boolean => {
    if (isSelected(traitId)) return true;
    if (isTraitMarked(traitId)) return false;
    return selectedTraits.length < 2;
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-2">Select Traits to Boost</h3>
      <p className="text-gray-400 mb-4">
        Choose 2 unmarked traits to permanently increase by +1. (Selected: {selectedTraits.length}/2)
      </p>

      <div className="grid grid-cols-2 gap-3">
        {TRAIT_NAMES.map((trait) => {
          const currentValue = character.stats[trait.id as keyof typeof character.stats];
          const selected = isSelected(trait.id);
          const marked = isTraitMarked(trait.id);
          const selectable = canSelect(trait.id);

          return (
            <button
              key={trait.id}
              onClick={() => toggleTrait(trait.id)}
              disabled={!selectable}
              className={`relative p-4 rounded-lg border transition-all ${
                selected
                  ? 'border-dagger-gold bg-dagger-gold/10'
                  : selectable
                  ? 'border-gray-600 bg-black/30 hover:border-dagger-gold/50'
                  : 'border-gray-700 bg-black/20 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 text-left">
                  <p className="font-bold text-white">{trait.label}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-gray-300">
                      {currentValue}
                    </span>
                    {selected && (
                      <>
                        <span className="text-dagger-gold text-sm">→</span>
                        <span className="text-2xl font-bold text-dagger-gold">
                          {currentValue + 1}
                        </span>
                      </>
                    )}
                  </div>
                  {marked && (
                    <p className="text-xs text-gray-500 mt-1">Already marked</p>
                  )}
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

      {selectedTraits.length < 2 && (
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg text-blue-200 text-sm">
          Select {2 - selectedTraits.length} more trait{selectedTraits.length === 1 ? '' : 's'} to continue
        </div>
      )}
    </div>
  );
}
