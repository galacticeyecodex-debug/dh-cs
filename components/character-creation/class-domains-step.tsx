'use client';

import React from 'react';
import { Sparkle } from '@/lib/icon-utils';
import clsx from 'clsx';
import { CharacterFormData, LibraryData } from './types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ClassDomainsStepProps {
  formData: Partial<CharacterFormData>;
  libraryData: LibraryData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleDomainChange: (index: number, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

export default function ClassDomainsStep({
  formData,
  libraryData,
  handleInputChange,
  handleDomainChange,
  onNext,
  onBack,
  isValid
}: ClassDomainsStepProps) {
  const selectedClass = libraryData.classes.find(c => c.id === formData.class_id);
  const subclassNames = selectedClass?.data?.subclass_names || [];

  // Helper to create synthetic event for handleInputChange compatibility
  const createSelectHandler = (name: string) => (value: string) => {
    const syntheticEvent = {
      target: { name, value }
    } as React.ChangeEvent<HTMLSelectElement>;
    handleInputChange(syntheticEvent);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold font-serif flex items-center gap-2"><Sparkle size={20} /> Step 3: Class & Domains</h2>
      <div>
        <label htmlFor="class_id" className="block text-sm font-medium text-gray-400">Class</label>
        <Select value={formData.class_id || ''} onValueChange={createSelectHandler('class_id')}>
          <SelectTrigger className="w-full mt-1">
            <SelectValue placeholder="Select a Class" />
          </SelectTrigger>
          <SelectContent>
            {libraryData.classes.map(cls => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}{cls.source === 'playtest' ? ' [Playtest]' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {formData.class_id && (
        <>
          <div>
            <label htmlFor="subclass_id" className="block text-sm font-medium text-gray-400">Subclass</label>
            <Select value={formData.subclass_id || ''} onValueChange={createSelectHandler('subclass_id')}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a Subclass" />
              </SelectTrigger>
              <SelectContent>
                {libraryData.subclasses
                  .filter(sc => sc.data.parent_class_id === formData.class_id || subclassNames.includes(sc.name))
                  .map(sc => (
                    <SelectItem key={sc.id} value={sc.id}>
                      {sc.name}{sc.source === 'playtest' ? ' [Playtest]' : ''}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400">Domain 1</label>
              <Select value={formData.domains?.[0] || ''} onValueChange={(val) => handleDomainChange(0, val)}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select Domain" />
                </SelectTrigger>
                <SelectContent>
                  {libraryData.domains.map(d => (
                    <SelectItem key={d.name} value={d.name}>
                      {d.name}{d.source === 'playtest' ? ' [Playtest]' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">Domain 2</label>
              <Select value={formData.domains?.[1] || ''} onValueChange={(val) => handleDomainChange(1, val)}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select Domain" />
                </SelectTrigger>
                <SelectContent>
                  {libraryData.domains.map(d => (
                    <SelectItem key={d.name} value={d.name}>
                      {d.name}{d.source === 'playtest' ? ' [Playtest]' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}
      <div className="flex justify-between">
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
