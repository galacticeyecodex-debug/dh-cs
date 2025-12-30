'use client';

import React from 'react';
import { Sparkle } from 'lucide-react';
import clsx from 'clsx';
import { CharacterFormData, LibraryData } from './types';

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
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold font-serif flex items-center gap-2"><Sparkle size={20} /> Step 3: Class & Domains</h2>
      <div>
        <label htmlFor="class_id" className="block text-sm font-medium text-gray-400">Class</label>
        <select 
          id="class_id" 
          name="class_id" 
          value={formData.class_id || ''} 
          onChange={handleInputChange}
          className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold text-white" 
          required
        >
          <option value="">Select a Class</option>
          {libraryData.classes.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.name}{cls.source === 'playtest' ? ' [Playtest]' : ''}
            </option>
          ))}
        </select>
      </div>
      {formData.class_id && (
        <>
          <div>
            <label htmlFor="subclass_id" className="block text-sm font-medium text-gray-400">Subclass</label>
            <select 
              id="subclass_id" 
              name="subclass_id" 
              value={formData.subclass_id || ''} 
              onChange={handleInputChange}
              className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold text-white" 
              required
            >
              <option value="">Select a Subclass</option>
              {libraryData.subclasses
                .filter(sc => sc.data.parent_class_id === formData.class_id)
                .map(sc => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}{sc.source === 'playtest' ? ' [Playtest]' : ''}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400">Domain 1</label>
              <select
                value={formData.domains?.[0] || ''}
                onChange={(e) => handleDomainChange(0, e.target.value)}
                className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold text-white"
              >
                <option value="">Select Domain</option>
                {libraryData.domains.map(d => (
                  <option key={d.name} value={d.name}>
                    {d.name}{d.source === 'playtest' ? ' [Playtest]' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">Domain 2</label>
              <select
                value={formData.domains?.[1] || ''}
                onChange={(e) => handleDomainChange(1, e.target.value)}
                className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold text-white"
              >
                <option value="">Select Domain</option>
                {libraryData.domains.map(d => (
                  <option key={d.name} value={d.name}>
                    {d.name}{d.source === 'playtest' ? ' [Playtest]' : ''}
                  </option>
                ))}
              </select>
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
