'use client';

/**
 * MULTICLASS SELECTION COMPONENT
 * ----------------------------------------------------------------------------
 * This component handles the "Multiclass" advancement option, available to characters
 * at Level 5 and above.
 * 
 * FUNCTIONALITY:
 * - Allows the user to select a secondary Class from the list of all available classes.
 * - Enforces validation: Users cannot select their own Primary Class as a secondary class.
 * - Allows user to select a Subclass from the chosen secondary class (gaining its Foundation Feature).
 * - Once a class is selected, the user must choose exactly ONE of that class's two Domains.
 * - This selection permanently adds the chosen Domain to the character's available domains list,
 *   granting access to that domain's cards in this and future level-ups.
 */

import React from 'react';
import { Check } from 'lucide-react';
import { getAllClassNames, getClassDomains } from '@/lib/level-up-helpers';

interface MulticlassSelectionProps {
  primaryClassId?: string;
  selectedClass?: string;
  selectedDomain?: string;
  selectedSubclass?: string;
  onSelectClass: (classId: string) => void;
  onSelectDomain: (domain: string) => void;
  onSelectSubclass: (subclassId: string) => void;
  subclasses?: any[];
  classes?: any[];
}

export default function MulticlassSelection({
  primaryClassId,
  selectedClass,
  selectedDomain,
  selectedSubclass,
  onSelectClass,
  onSelectDomain,
  onSelectSubclass,
  subclasses = [],
  classes = [],
}: MulticlassSelectionProps) {
  const allClasses = getAllClassNames();
  const selectedClassDomains = selectedClass ? getClassDomains(selectedClass) : [];

  // Filter subclasses for the selected class
  // Use data from the classes table to find valid subclass names
  // avoiding hardcoded maps.
  let validSubclassNames: string[] = [];
  if (selectedClass && classes.length > 0) {
    const classData = classes.find(c => c.name === selectedClass);
    if (classData?.data?.subclass_names) {
      validSubclassNames = classData.data.subclass_names;
    }
  }
  
  const filteredSubclasses = selectedClass 
    ? subclasses.filter(sc => 
        // Match by explicit DB link (parent_class_id) OR by name found in class definition
        sc.data?.parent_class_id === `class-${selectedClass.toLowerCase()}` ||
        validSubclassNames.includes(sc.name)
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Class Selection */}
      <div>
        <h4 className="text-lg font-bold text-white mb-3">1. Choose Multiclass</h4>
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
                onClick={() => {
                    if (canSelect) {
                        onSelectClass(className);
                        // Reset subclass and domain when class changes
                        onSelectSubclass('');
                        onSelectDomain('');
                    }
                }}
                disabled={isPrimary}
                className={`text-left p-3 rounded-lg border transition-all ${isSelected
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

      {/* Subclass Selection */}
      {selectedClass && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <h4 className="text-lg font-bold text-white mb-3">2. Choose Subclass</h4>
          <p className="text-sm text-gray-400 mb-3">
            Select a subclass from {selectedClass} to gain its Foundation Feature.
          </p>
          {filteredSubclasses.length === 0 ? (
            <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg text-yellow-200 text-sm">
                No subclasses found for {selectedClass}. Check library data.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
                {filteredSubclasses.map((sub) => {
                    const isSelected = selectedSubclass === sub.id;
                    const description = sub.data?.description || '';
                    const foundationFeatures = sub.data?.foundation_features || [];

                    return (
                        <button
                            key={sub.id}
                            onClick={() => onSelectSubclass(sub.id)}
                            className={`text-left p-3 rounded-lg border transition-all ${isSelected
                                ? 'border-dagger-gold bg-dagger-gold/10'
                                : 'border-gray-600 bg-black/30 hover:border-dagger-gold/50'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <p className="font-bold text-white">{sub.name}</p>
                                    <p className="text-sm text-gray-300 line-clamp-2 mb-2">{description}</p>
                                    
                                    {/* Preview Foundation Feature(s) */}
                                    {foundationFeatures.length > 0 && (
                                        <div className="mt-2 p-2 bg-black/40 rounded border border-white/10">
                                            <p className="text-xs font-bold text-dagger-gold uppercase mb-1">Foundation: {foundationFeatures[0].name}</p>
                                            <p className="text-xs text-gray-400 line-clamp-3">{foundationFeatures[0].text}</p>
                                        </div>
                                    )}
                                </div>
                                {isSelected && (
                                    <Check size={16} className="text-dagger-gold flex-shrink-0 mt-0.5" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
          )}
        </div>
      )}

      {/* Domain Selection */}
      {selectedClass && selectedSubclass && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <h4 className="text-lg font-bold text-white mb-3">3. Choose Domain</h4>
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
                  className={`text-left p-3 rounded-lg border transition-all ${isSelected
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
      {selectedClass && selectedSubclass && selectedDomain && (
        <div className="p-4 bg-dagger-gold/10 border border-dagger-gold/30 rounded-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <p className="text-sm text-gray-300">
            <span className="font-bold text-dagger-gold">Preview:</span> Your character will gain access to the{' '}
            <span className="font-bold text-white">{selectedDomain}</span> domain from{' '}
            <span className="font-bold text-white">{selectedClass}</span>, plus the{' '}
            <span className="font-bold text-white">
                {subclasses.find(s => s.id === selectedSubclass)?.name || 'Unknown'}
            </span> subclass Foundation Feature.
          </p>
        </div>
      )}
    </div>
  );
}
