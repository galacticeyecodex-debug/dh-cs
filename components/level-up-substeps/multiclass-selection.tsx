'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { getAllClassNames, getClassDomains } from '@/lib/level-up-helpers';

interface MulticlassSelectionProps {
  primaryClassId?: string;
  selectedClass?: string;
  selectedDomain?: string;
  onSelectClass: (classId: string) => void;
  onSelectDomain: (domain: string) => void;
}

export default function MulticlassSelection({
  primaryClassId,
  selectedClass,
  selectedDomain,
  onSelectClass,
  onSelectDomain,
}: MulticlassSelectionProps) {
  const allClasses = getAllClassNames();
  const selectedClassDomains = selectedClass ? getClassDomains(selectedClass) : [];

  return (
    <div className="space-y-6">
      {/* Class Selection */}
      <div>
        <h4 className="text-lg font-bold text-white mb-3">Choose Multiclass</h4>
        <p className="text-sm text-gray-400 mb-3">
          Select a second class to gain access to one of its domains
        </p>
        <div className="grid grid-cols-2 gap-2">
          {allClasses.map((className) => {
            const isSelected = selectedClass === className;
            const isPrimary = primaryClassId === className;
            const canSelect = !isPrimary;
            const domains = getClassDomains(className);

            return (
              <button
                key={className}
                onClick={() => canSelect && onSelectClass(className)}
                disabled={isPrimary}
                className={`text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-dagger-gold bg-dagger-gold/10'
                    : isPrimary
                    ? 'border-gray-700 bg-black/20 opacity-50 cursor-not-allowed'
                    : 'border-gray-600 bg-black/30 hover:border-dagger-gold/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-white">
                      {className}
                      {isPrimary && <span className="text-xs text-gray-500 ml-2">(Primary)</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {domains.join(' & ')}
                    </p>
                  </div>
                  {isSelected && (
                    <Check size={16} className="text-dagger-gold flex-shrink-0 mt-0.5" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Domain Selection */}
      {selectedClass && (
        <div>
          <h4 className="text-lg font-bold text-white mb-3">Choose Domain</h4>
          <p className="text-sm text-gray-400 mb-3">
            Select one domain from {selectedClass} to add to your character
          </p>
          <div className="grid grid-cols-2 gap-2">
            {selectedClassDomains.map((domain) => {
              const isSelected = selectedDomain === domain;

              return (
                <button
                  key={domain}
                  onClick={() => onSelectDomain(domain)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-dagger-gold bg-dagger-gold/10'
                      : 'border-gray-600 bg-black/30 hover:border-dagger-gold/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="font-bold text-white">{domain}</p>
                    {isSelected && (
                      <Check size={16} className="text-dagger-gold flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Preview */}
      {selectedClass && selectedDomain && (
        <div className="p-4 bg-dagger-gold/10 border border-dagger-gold/30 rounded-lg">
          <p className="text-sm text-gray-300">
            <span className="font-bold text-dagger-gold">Preview:</span> Your character will gain access to the{' '}
            <span className="font-bold text-white">{selectedDomain}</span> domain from{' '}
            <span className="font-bold text-white">{selectedClass}</span>
          </p>
        </div>
      )}
    </div>
  );
}
