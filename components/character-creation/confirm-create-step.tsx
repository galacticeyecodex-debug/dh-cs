'use client';

import React from 'react';
import { Shield, Coins } from '@/lib/icon-utils';
import { CharacterFormData, LibraryData } from './types';

interface ConfirmCreateStepProps {
  formData: Partial<CharacterFormData>;
  libraryData: LibraryData;
  calculatedVitals: { hp: number; stress: number; armor: number; evasion: number };
  startingItemsAndCards: { gold: { handfuls: number; bags: number; chests: number } };
  isSubmitting: boolean;
  uploadingImage: boolean;
  onBack: () => void;
}

export default function ConfirmCreateStep({
  formData,
  libraryData,
  calculatedVitals,
  startingItemsAndCards,
  isSubmitting,
  uploadingImage,
  onBack
}: ConfirmCreateStepProps) {
  const currentClassSummary = formData.class_id ? libraryData.classes.find(c => c.id === formData.class_id) : null;
  const currentSubclassSummary = formData.subclass_id ? libraryData.subclasses.find(s => s.id === formData.subclass_id) : null;
  const currentAncestrySummary = formData.ancestry_id ? libraryData.ancestries.find(a => a.id === formData.ancestry_id) : null;
  const currentCommunitySummary = formData.community_id ? libraryData.communities.find(c => c.id === formData.community_id) : null;
  const finalPrimaryWeapon = libraryData.weapons.find(w => w.id === formData.selectedPrimaryWeaponId);
  const finalSecondaryWeapon = libraryData.weapons.find(w => w.id === formData.selectedSecondaryWeaponId);
  const finalArmor = libraryData.armor.find(a => a.id === formData.selectedArmorId);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold font-serif flex items-center gap-2"><Shield size={20} /> Step 8: Confirm & Create</h2>
      <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-3">
        <p><strong>Name:</strong> {formData.name}</p>
        <p><strong>Ancestry:</strong> {currentAncestrySummary?.name || 'N/A'}</p>
        <p><strong>Community:</strong> {currentCommunitySummary?.name || 'N/A'}</p>
        <p><strong>Class:</strong> {currentClassSummary?.name || 'N/A'}</p>
        <p><strong>Subclass:</strong> {currentSubclassSummary?.name || 'N/A'}</p>
        <p><strong>Domains:</strong> {formData.domains?.join(', ')}</p>
        <p><strong>Calculated Vitals:</strong> HP: {calculatedVitals.hp}, Stress: {calculatedVitals.stress}, Armor: {calculatedVitals.armor}</p>
        <p><strong>Evasion:</strong> {calculatedVitals.evasion}</p>
        <p><strong>Experiences:</strong> {formData.experiences?.join(', ')}</p>
        <p className="flex items-center gap-1">
          <Coins size={16} /> <strong>Starting Gold:</strong> {startingItemsAndCards.gold.handfuls}h, {startingItemsAndCards.gold.bags}b, {startingItemsAndCards.gold.chests}c
        </p>
        <p><strong>Primary Weapon:</strong> {finalPrimaryWeapon?.name || 'N/A'}</p>
        {finalSecondaryWeapon && <p><strong>Secondary Weapon:</strong> {finalSecondaryWeapon.name}</p>}
        <p><strong>Armor:</strong> {finalArmor?.name || 'N/A'}</p>
        <p><strong>Starting Potion:</strong> {formData.selectedPotionType === 'health' ? 'Minor Health Potion' : formData.selectedPotionType === 'stamina' ? 'Minor Stamina Potion' : 'N/A'}</p>
        <p className="text-xs text-gray-400"><em>Also includes: Torch, 50 Feet of Rope, Basic Supplies</em></p>
        <p><strong>Starting Cards ({formData.selectedCards?.length}):</strong></p>
        <ul className="list-disc pl-5">
          {formData.selectedCards?.map(id => {
            const card = [
              ...libraryData.abilities, 
              ...libraryData.spells, 
              ...libraryData.grimoires
            ].find(c => c.id === id);
            return <li key={id}>{card?.name} ({card?.domain} {card?.type})</li>
          })}
        </ul>
      </div>
      <div className="flex justify-between mt-4">
        <button type="button" onClick={onBack} className="px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20">Back</button>
        <button
          type="submit"
          disabled={isSubmitting || uploadingImage}
          className="px-4 py-2 bg-green-600 text-white font-bold rounded-full shadow-md hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {uploadingImage ? 'Uploading Image...' : isSubmitting ? 'Creating...' : 'Create Character'}
        </button>
      </div>
    </div>
  );
}
