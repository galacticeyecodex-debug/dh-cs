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

  const featIndex1 = formData.ancestry_feat_index_1 ?? 0;
  const featIndex2 = formData.ancestry_feat_index_2 ?? 1;

  const handleFeatSelect = (ancestryNum: 1 | 2, index: number) => {
    if (!formData.is_mixed_ancestry) return;
    setFormData(prev => ({
      ...prev,
      [ancestryNum === 1 ? 'ancestry_feat_index_1' : 'ancestry_feat_index_2']: index
    }));
  };

  const renderFeatCard = (feat: any, isSelected: boolean, onClick: () => void, colorClass: string) => (
    <div 
      onClick={onClick}
      className={clsx(
        "p-2 border rounded text-xs transition-all",
        isSelected 
          ? `${colorClass} ring-1 ring-offset-1 ring-offset-black ring-white/20 scale-[1.02]` 
          : "bg-white/5 border-white/5 opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 cursor-pointer"
      )}
    >
      <span className="font-bold uppercase tracking-tight">{feat.name}</span>
      <p className="text-gray-400 mt-1 line-clamp-2">{feat.text?.replace(/\*\*/g, '')}</p>
    </div>
  );

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
            ancestry_id_2: e.target.checked ? prev.ancestry_id_2 : undefined,
            ancestry_feat_index_1: 0,
            ancestry_feat_index_2: 1
          }))}
          className="w-4 h-4 rounded border-white/20 bg-black/20 text-dagger-gold focus:ring-dagger-gold"
        />
        <label htmlFor="is_mixed_ancestry" className="text-sm font-medium text-gray-200 cursor-pointer">
          Mixed Ancestry (Hybrid)
        </label>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="ancestry_id" className="block text-sm font-medium text-gray-400 mb-1">
            {formData.is_mixed_ancestry ? 'Primary Ancestry' : 'Ancestry'}
          </label>
          <select 
            id="ancestry_id" 
            name="ancestry_id" 
            value={formData.ancestry_id || ''} 
            onChange={handleInputChange}
            className="w-full p-2 rounded bg-black/20 border border-white/10 focus:ring-dagger-gold focus:border-dagger-gold text-white" 
            required
          >
            <option value="">Select an Ancestry</option>
            {libraryData.ancestries.map(anc => <option key={anc.id} value={anc.id}>{anc.name}</option>)}
          </select>
          
          {selectedAncestry1?.data?.features && (
            <div className="mt-2 grid grid-cols-1 gap-2">
              {formData.is_mixed_ancestry ? (
                <>
                  <p className="text-[10px] text-gray-500 uppercase font-bold ml-1">Select one feature:</p>
                  {selectedAncestry1.data.features.map((feat: any, i: number) => (
                    renderFeatCard(feat, featIndex1 === i, () => handleFeatSelect(1, i), "bg-emerald-900/30 border-emerald-500/40 text-emerald-400")
                  ))}
                </>
              ) : (
                selectedAncestry1.data.features.map((feat: any, i: number) => (
                  <div key={i} className="p-2 bg-emerald-900/10 border border-emerald-500/10 rounded text-xs opacity-80">
                    <span className="font-bold text-emerald-400 uppercase tracking-tight">{feat.name}</span>
                    <p className="text-gray-400 mt-1">{feat.text?.replace(/\*\*/g, '')}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {formData.is_mixed_ancestry && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 border-t border-white/5 pt-4">
            <label htmlFor="ancestry_id_2" className="block text-sm font-medium text-gray-400 mb-1">Secondary Ancestry</label>
            <select 
              id="ancestry_id_2" 
              name="ancestry_id_2" 
              value={formData.ancestry_id_2 || ''} 
              onChange={handleInputChange}
              className="w-full p-2 rounded bg-black/20 border border-white/10 focus:ring-dagger-gold focus:border-dagger-gold text-white" 
              required
            >
              <option value="">Select an Ancestry</option>
              {libraryData.ancestries.map(anc => <option key={anc.id} value={anc.id}>{anc.name}</option>)}
            </select>
            
            {selectedAncestry2?.data?.features && (
              <div className="mt-2 grid grid-cols-1 gap-2">
                <p className="text-[10px] text-gray-500 uppercase font-bold ml-1">Select one feature:</p>
                {selectedAncestry2.data.features.map((feat: any, i: number) => (
                  renderFeatCard(feat, featIndex2 === i, () => handleFeatSelect(2, i), "bg-blue-900/30 border-blue-500/40 text-blue-400")
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="community_id" className="block text-sm font-medium text-gray-400 mb-1">Community</label>
        <select 
          id="community_id" 
          name="community_id" 
          value={formData.community_id || ''} 
          onChange={handleInputChange}
          className="w-full p-2 rounded bg-black/20 border border-white/10 focus:ring-dagger-gold focus:border-dagger-gold text-white" 
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
