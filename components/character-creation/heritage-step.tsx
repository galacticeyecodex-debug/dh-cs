'use client';

import React from 'react';
import { User as UserIcon } from 'lucide-react';
import clsx from 'clsx';
import { CharacterFormData, LibraryData } from './types';

interface HeritageStepProps {
  formData: Partial<CharacterFormData>;
  libraryData: LibraryData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

export default function HeritageStep({
  formData,
  libraryData,
  handleInputChange,
  onNext,
  onBack,
  isValid
}: HeritageStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold font-serif flex items-center gap-2"><UserIcon size={20} /> Step 2: Heritage</h2>
      <div>
        <label htmlFor="ancestry_id" className="block text-sm font-medium text-gray-400">Ancestry</label>
        <select 
          id="ancestry_id" 
          name="ancestry_id" 
          value={formData.ancestry_id || ''} 
          onChange={handleInputChange}
          className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold text-white" 
          required
        >
          <option value="">Select an Ancestry</option>
          {libraryData.ancestries.map(anc => <option key={anc.id} value={anc.id}>{anc.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="community_id" className="block text-sm font-medium text-gray-400">Community</label>
        <select 
          id="community_id" 
          name="community_id" 
          value={formData.community_id || ''} 
          onChange={handleInputChange}
          className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold text-white" 
          required
        >
          <option value="">Select a Community</option>
          {libraryData.communities.map(comm => <option key={comm.id} value={comm.id}>{comm.name}</option>)}
        </select>
      </div>
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
