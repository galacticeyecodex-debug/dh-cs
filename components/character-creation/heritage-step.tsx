'use client';

import React from 'react';
import { User as UserIcon } from 'lucide-react';
import clsx from 'clsx';
import { CharacterFormData, LibraryData } from './types';

interface HeritageStepProps {
  formData: Partial<CharacterFormData>;
  libraryData: LibraryData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<Partial<CharacterFormData>>>;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

export default function HeritageStep({
  formData,
  libraryData,
  handleInputChange,
  setFormData,
  onNext,
  onBack,
  isValid
}: HeritageStepProps) {
  const selectedAncestry1 = libraryData.ancestries.find(a => a.id === formData.ancestry_id);
  const selectedAncestry2 = libraryData.ancestries.find(a => a.id === formData.ancestry_id_2);

  const feature1 = selectedAncestry1?.data?.features?.[0];
  const feature2 = formData.is_mixed_ancestry 
    ? selectedAncestry2?.data?.features?.[1] 
    : selectedAncestry1?.data?.features?.[1];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-serif flex items-center gap-2"><UserIcon size={20} /> Step 2: Heritage</h2>
      
      <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
        <input 
          type="checkbox" 
          id="is_mixed_ancestry" 
          checked={formData.is_mixed_ancestry || false}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            is_mixed_ancestry: e.target.checked,
            ancestry_id_2: e.target.checked ? prev.ancestry_id_2 : undefined
          }))}
          className="w-4 h-4 rounded border-white/20 bg-black/20 text-dagger-gold focus:ring-dagger-gold"
        />
        <label htmlFor="is_mixed_ancestry" className="text-sm font-medium text-gray-200 cursor-pointer">
          Mixed Ancestry (Hybrid)
        </label>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="ancestry_id" className="block text-sm font-medium text-gray-400">
            {formData.is_mixed_ancestry ? 'Primary Ancestry' : 'Ancestry'}
          </label>
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
          {feature1 && (
            <div className="mt-2 p-2 bg-emerald-900/20 border border-emerald-500/20 rounded text-xs">
              <span className="font-bold text-emerald-400 uppercase tracking-tight">{feature1.name}</span>
              <p className="text-gray-400 mt-1 line-clamp-2">{feature1.text?.replace(/\*\*/g, '')}</p>
            </div>
          )}
        </div>

        {formData.is_mixed_ancestry && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label htmlFor="ancestry_id_2" className="block text-sm font-medium text-gray-400">Secondary Ancestry</label>
            <select 
              id="ancestry_id_2" 
              name="ancestry_id_2" 
              value={formData.ancestry_id_2 || ''} 
              onChange={handleInputChange}
              className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold text-white" 
              required
            >
              <option value="">Select an Ancestry</option>
              {libraryData.ancestries.map(anc => <option key={anc.id} value={anc.id}>{anc.name}</option>)}
            </select>
            {feature2 && (
              <div className="mt-2 p-2 bg-blue-900/20 border border-blue-500/20 rounded text-xs">
                <span className="font-bold text-blue-400 uppercase tracking-tight">{feature2.name}</span>
                <p className="text-gray-400 mt-1 line-clamp-2">{feature2.text?.replace(/\*\*/g, '')}</p>
              </div>
            )}
          </div>
        )}

        {!formData.is_mixed_ancestry && feature2 && (
           <div className="p-2 bg-blue-900/10 border border-blue-500/10 rounded text-xs opacity-80">
            <span className="font-bold text-blue-400/80 uppercase tracking-tight">{feature2.name}</span>
            <p className="text-gray-500 mt-1 line-clamp-1">{feature2.text?.replace(/\*\*/g, '')}</p>
          </div>
        )}
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

      <div className="flex justify-between pt-2">
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
