'use client';

import React from 'react';
import { BookOpen, FlaskConical } from '@/lib/icon-utils';
import clsx from 'clsx';
import { CharacterFormData, LibraryData } from './types';

interface DomainCardsStepProps {
  formData: Partial<CharacterFormData>;
  libraryData: LibraryData;
  handleCardSelection: (cardId: string) => void;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

export default function DomainCardsStep({
  formData,
  libraryData,
  handleCardSelection,
  onNext,
  onBack,
  isValid
}: DomainCardsStepProps) {
  const domain1 = formData.domains?.[0];
  const domain2 = formData.domains?.[1];

  const cardsDomain1 = [
    ...(libraryData.abilities || []),
    ...(libraryData.spells || []),
    ...(libraryData.grimoires || []),
  ].filter(card => card.domain === domain1 && card.data.level === 1);

  const cardsDomain2 = [
    ...(libraryData.abilities || []),
    ...(libraryData.spells || []),
    ...(libraryData.grimoires || []),
  ].filter(card => card.domain === domain2 && card.data.level === 1);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-serif flex items-center gap-2"><BookOpen size={20} /> Step 4: Choose up to 2 Domain Cards</h2>
      <p className="text-sm text-gray-400">Select exactly 2 starting cards from your chosen domains.</p>

      {/* Domain 1 Section */}
      <div>
        <h3 className="text-lg font-serif text-dagger-gold mb-2">{domain1} Cards</h3>
        <div className="grid grid-cols-1 gap-2 max-h-[30vh] overflow-y-auto pr-2">
          {cardsDomain1.map(card => {
            const isSelected = formData.selectedCards?.includes(card.id);
            const isPlaytest = card.source === 'playtest';
            return (
              <div
                key={card.id}
                onClick={() => handleCardSelection(card.id)}
                className={clsx(
                  "p-3 rounded border cursor-pointer transition-all",
                  isSelected
                    ? "bg-dagger-gold/20 border-dagger-gold ring-1 ring-dagger-gold"
                    : "bg-black/20 border-white/10 hover:bg-white/5 opacity-80 hover:opacity-100"
                )}
              >
                <div className="font-bold text-dagger-gold flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-white">
                    {card.name}
                    {isPlaytest && <FlaskConical size={14} className="text-purple-400" />}
                  </span>
                  {isSelected && <span className="text-xs bg-dagger-gold text-black px-2 py-0.5 rounded-full">Selected</span>}
                </div>
                <div className="text-xs text-gray-400 mb-1">{card.type} - Level {card.data.level}</div>
                <div className="text-sm text-gray-300 line-clamp-2">{card.data.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Domain 2 Section */}
      <div>
        <h3 className="text-lg font-serif text-dagger-gold mb-2">{domain2} Cards</h3>
        <div className="grid grid-cols-1 gap-2 max-h-[30vh] overflow-y-auto pr-2">
          {cardsDomain2.map(card => {
            const isSelected = formData.selectedCards?.includes(card.id);
            const isPlaytest = card.source === 'playtest';
            return (
              <div
                key={card.id}
                onClick={() => handleCardSelection(card.id)}
                className={clsx(
                  "p-3 rounded border cursor-pointer transition-all",
                  isSelected
                    ? "bg-dagger-gold/20 border-dagger-gold ring-1 ring-dagger-gold"
                    : "bg-black/20 border-white/10 hover:bg-white/5 opacity-80 hover:opacity-100"
                )}
              >
                <div className="font-bold text-dagger-gold flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-white">
                    {card.name}
                    {isPlaytest && <FlaskConical size={14} className="text-purple-400" />}
                  </span>
                  {isSelected && <span className="text-xs bg-dagger-gold text-black px-2 py-0.5 rounded-full">Selected</span>}
                </div>
                <div className="text-xs text-gray-400 mb-1">{card.type} - Level {card.data.level}</div>
                <div className="text-sm text-gray-300 line-clamp-2">{card.data.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between pt-4">
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
