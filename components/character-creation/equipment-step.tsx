'use client';

import React, { useState } from 'react';
import { Shield, Sword, Heart, Sparkle, X } from 'lucide-react';
import clsx from 'clsx';
import { CharacterFormData, LibraryData, LibraryLookupItem } from './types';
import AddItemModal from '@/components/modals/add-item-modal';
import { LibraryItem } from '@/store/character-store';

interface EquipmentStepProps {
  formData: Partial<CharacterFormData>;
  libraryData: LibraryData;
  setFormData: React.Dispatch<React.SetStateAction<Partial<CharacterFormData>>>;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

export default function EquipmentStep({
  formData,
  libraryData,
  setFormData,
  onNext,
  onBack,
  isValid
}: EquipmentStepProps) {
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  const [equipmentModalContext, setEquipmentModalContext] = useState<'primary' | 'secondary' | 'armor' | null>(null);

  // Filter Tier 1 weapons and armor
  const tier1PrimaryWeapons = libraryData.weapons.filter(w => w.tier === 1 && (w.data.primary_or_secondary === 'Primary' || w.data.hand === 'Primary'));
  const tier1SecondaryWeapons = libraryData.weapons.filter(w => w.tier === 1 && (w.data.primary_or_secondary === 'Secondary' || w.data.hand === 'Secondary'));
  const tier1Armor = libraryData.armor.filter(a => a.tier === 1);

  const selectedPrimaryWeapon = libraryData.weapons.find(w => w.id === formData.selectedPrimaryWeaponId);
  const selectedSecondaryWeapon = libraryData.weapons.find(w => w.id === formData.selectedSecondaryWeaponId);
  const selectedArmor = libraryData.armor.find(a => a.id === formData.selectedArmorId);

  // Determine if secondary weapon selection should be enabled
  const isSecondaryWeaponEnabled = selectedPrimaryWeapon?.data.burden !== 'Two-Handed';

  const handleEquipmentSelect = (item: LibraryItem) => {
    if (!equipmentModalContext) return;

    if (equipmentModalContext === 'primary') {
      setFormData(prev => ({ ...prev, selectedPrimaryWeaponId: item.id }));
    } else if (equipmentModalContext === 'secondary') {
      setFormData(prev => ({ ...prev, selectedSecondaryWeaponId: item.id }));
    } else if (equipmentModalContext === 'armor') {
      setFormData(prev => ({ ...prev, selectedArmorId: item.id }));
    }
    setEquipmentModalOpen(false);
  };

  const renderEquipmentCard = (
    label: string,
    item: LibraryLookupItem | undefined,
    context: 'primary' | 'secondary' | 'armor',
    enabled: boolean = true
  ) => (
    <div
      className={clsx(
        "flex flex-col gap-2 p-3 rounded-lg border transition-all",
        item ? "bg-dagger-gold/10 border-dagger-gold/30" : "bg-white/5 border-white/5",
        !enabled && "opacity-50"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase bg-white/10 text-gray-400 px-1.5 py-0.5 rounded">
              {label}
            </span>
            {item && (
              <span className="text-[10px] font-bold uppercase bg-dagger-gold text-black px-1.5 py-0.5 rounded">
                Selected
              </span>
            )}
          </div>
          {item ? (
            <>
              <div className="font-medium text-white">{item.name}</div>
              <div className="text-xs text-gray-400 mt-1">
                {context === 'armor' ? (
                  <>
                    {item.data.feature?.name && <span className="font-bold text-gray-300">{item.data.feature.name}: </span>}
                    {item.data.feature?.text && <span className="italic">{item.data.feature.text} </span>}
                    <span className="block mt-0.5 text-gray-500">
                      Score: {item.data.base_score}, Thresholds: {item.data.base_thresholds}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block mb-0.5">
                      {item.data.trait} • {item.data.range} • {item.data.damage}
                    </span>
                    {item.data.feature?.name && <span className="font-bold text-gray-300">{item.data.feature.name}: </span>}
                    {item.data.feature?.text && <span className="italic">{item.data.feature.text}</span>}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="text-white/50 italic text-sm">
              {enabled ? `Click to select ${label.toLowerCase()}...` : `${label} disabled (two-handed weapon equipped)`}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-1">
        {enabled && (
          <button
            type="button"
            onClick={() => {
              setEquipmentModalContext(context);
              setEquipmentModalOpen(true);
            }}
            className="text-[10px] font-bold uppercase px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1"
          >
            <Sword size={12} /> {item ? 'Change' : 'Select'}
          </button>
        )}
        {item && enabled && (
          <button
            type="button"
            onClick={() => {
              if (context === 'primary') setFormData(prev => ({ ...prev, selectedPrimaryWeaponId: null }));
              else if (context === 'secondary') setFormData(prev => ({ ...prev, selectedSecondaryWeaponId: null }));
              else if (context === 'armor') setFormData(prev => ({ ...prev, selectedArmorId: null }));
            }}
            className="text-[10px] font-bold uppercase px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded flex items-center gap-1 ml-auto"
          >
            <X size={12} /> Remove
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold font-serif flex items-center gap-2"><Shield size={20} /> Step 7: Starting Equipment</h2>
      <p className="text-sm text-gray-400">
        Choose from Tier 1 equipment: either a two-handed primary weapon OR a one-handed primary weapon and secondary weapon, plus one set of armor.
      </p>

      {/* Equipment Cards */}
      <div className="space-y-2">
        {renderEquipmentCard("Primary Weapon", selectedPrimaryWeapon, 'primary')}
        {renderEquipmentCard("Secondary Weapon", selectedSecondaryWeapon, 'secondary', isSecondaryWeaponEnabled)}
        {renderEquipmentCard("Armor", selectedArmor, 'armor')}
      </div>

      {/* Starting Potion Selection */}
      <div className="bg-black/30 border border-white/10 rounded-xl p-4 mt-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Starting Potion</h3>
        <p className="text-xs text-gray-400 mb-3">Choose one starting potion (you&apos;ll also receive a torch, rope, and basic supplies)</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, selectedPotionType: 'health' }))}
            className={clsx(
              "p-3 rounded-lg border transition-all text-left",
              formData.selectedPotionType === 'health'
                ? "bg-dagger-gold/10 border-dagger-gold"
                : "bg-white/5 border-white/10 hover:border-white/20"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Heart size={16} className="text-red-400" />
              <span className="font-bold text-white text-sm">Minor Health Potion</span>
            </div>
            <div className="text-xs text-gray-400">Clear 1d4 Hit Points</div>
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, selectedPotionType: 'stamina' }))}
            className={clsx(
              "p-3 rounded-lg border transition-all text-left",
              formData.selectedPotionType === 'stamina'
                ? "bg-dagger-gold/10 border-dagger-gold"
                : "bg-white/5 border-white/10 hover:border-white/20"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkle size={16} className="text-blue-400" />
              <span className="font-bold text-white text-sm">Minor Stamina Potion</span>
            </div>
            <div className="text-xs text-gray-400">Clear 1d4 Stress</div>
          </button>
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20"
        >
          Back
        </button>
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

      {/* Modal Rendering */}
      {equipmentModalOpen && (
        <AddItemModal
          isOpen={equipmentModalOpen}
          onClose={() => setEquipmentModalOpen(false)}
          onAddItem={(item) => handleEquipmentSelect(item)}
          libraryItems={
            equipmentModalContext === 'primary' ? tier1PrimaryWeapons as LibraryItem[] :
              equipmentModalContext === 'secondary' ? tier1SecondaryWeapons as LibraryItem[] :
                equipmentModalContext === 'armor' ? tier1Armor as LibraryItem[] : []
          }
          filterType="inventory"
        />
      )}
    </div>
  );
}
