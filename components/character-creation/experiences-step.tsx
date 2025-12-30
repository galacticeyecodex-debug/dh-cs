'use client';

import React from 'react';
import { Sparkle } from 'lucide-react';
import clsx from 'clsx';
import { CharacterFormData } from './types';

interface ExperiencesStepProps {
  formData: Partial<CharacterFormData>;
  handleExperienceChange: (index: number, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

export default function ExperiencesStep({
  formData,
  handleExperienceChange,
  onNext,
  onBack,
  isValid
}: ExperiencesStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold font-serif flex items-center gap-2"><Sparkle size={20} /> Step 6: Experiences</h2>
      <p className="text-sm text-gray-400">Create two experiences that reflect your character&apos;s background. E.g., &quot;Expert Tracker&quot;, &quot;Raised by Wolves&quot;, &quot;Disgraced Noble&quot;. (+2 bonus when relevant)</p>
      <div>
        <label className="block text-sm font-medium text-gray-400">Experience 1 (+2)</label>
        <input
          type="text"
          value={formData.experiences?.[0] || ''}
          onChange={(e) => handleExperienceChange(0, e.target.value)}
          placeholder="e.g. Former Guard Captain"
          className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400">Experience 2 (+2)</label>
        <input
          type="text"
          value={formData.experiences?.[1] || ''}
          onChange={(e) => handleExperienceChange(1, e.target.value)}
          placeholder="e.g. Trust No One"
          className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold text-white"
        />
      </div>
      <div className="flex justify-between mt-4">
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
