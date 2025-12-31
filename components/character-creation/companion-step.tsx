'use client';

import React from 'react';
import { PawPrint } from 'lucide-react';
import clsx from 'clsx';
import { CharacterFormData } from './types';
import { RangerCompanion } from '@/types/character';

interface CompanionStepProps {
  formData: Partial<CharacterFormData>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<CharacterFormData>>>;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

export default function CompanionStep({
  formData,
  setFormData,
  onNext,
  onBack,
  isValid
}: CompanionStepProps) {
  const updateCompanion = (updates: Partial<RangerCompanion>) => {
    setFormData(prev => ({
      ...prev,
      companion: {
        ...prev.companion,
        name: prev.companion?.name || '',
        animal_type: prev.companion?.animal_type || '',
        evasion: prev.companion?.evasion || 10,
        stress_max: prev.companion?.stress_max || 3,
        stress_current: prev.companion?.stress_current || 0,
        armor_slot: prev.companion?.armor_slot || false,
        armor_slot_used: prev.companion?.armor_slot_used || false,
        hope_max: prev.companion?.hope_max || 1,
        hope_current: prev.companion?.hope_current || 0,
        attack_type: prev.companion?.attack_type || 'melee',
        attack_name: prev.companion?.attack_name || '',
        damage_die: prev.companion?.damage_die || 'd6',
        attack_range: prev.companion?.attack_range || 'melee',
        experiences: prev.companion?.experiences || [{ name: '', value: 2 }, { name: '', value: 2 }],
        level_up_options: prev.companion?.level_up_options || {
          intelligent: 0,
          light_in_the_dark: false,
          creature_comfort: false,
          armored: false,
          vicious: 0,
          resilient: 0,
          bonded: false,
          aware: false,
        },
        ...updates
      } as RangerCompanion
    }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold font-serif flex items-center gap-2">
        <PawPrint size={20} className="text-dagger-gold" /> Step 7: Create Your Companion
      </h2>
      <p className="text-sm text-gray-400">
        As a Beastbound Ranger, you have an animal companion. Give them a name and describe their background.
      </p>
      <div>
        <label className="block text-sm font-medium text-gray-400">Companion Name</label>
        <input
          type="text"
          value={formData.companion?.name || ''}
          onChange={(e) => updateCompanion({ name: e.target.value })}
          placeholder="e.g., Shadow, Fang, Luna"
          className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400">Animal Type</label>
        <input
          type="text"
          value={formData.companion?.animal_type || ''}
          onChange={(e) => updateCompanion({ animal_type: e.target.value })}
          placeholder="e.g., Wolf, Hawk, Bear"
          className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400">Attack Name</label>
        <input
          type="text"
          value={formData.companion?.attack_name || ''}
          onChange={(e) => updateCompanion({ attack_name: e.target.value })}
          placeholder="e.g., Claw Swipe, Bite, Pounce"
          className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400">Companion Experience 1 (+2)</label>
        <input
          type="text"
          value={formData.companion?.experiences?.[0]?.name || ''}
          onChange={(e) => {
            const newExperiences = [...(formData.companion?.experiences || [{ name: '', value: 2 }, { name: '', value: 2 }])];
            newExperiences[0] = { name: e.target.value, value: 2 };
            updateCompanion({ experiences: newExperiences });
          }}
          placeholder="e.g., Tracking, Hunting"
          className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400">Companion Experience 2 (+2)</label>
        <input
          type="text"
          value={formData.companion?.experiences?.[1]?.name || ''}
          onChange={(e) => {
            const newExperiences = [...(formData.companion?.experiences || [{ name: '', value: 2 }, { name: '', value: 2 }])];
            newExperiences[1] = { name: e.target.value, value: 2 };
            updateCompanion({ experiences: newExperiences });
          }}
          placeholder="e.g., Loyal Guardian"
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
