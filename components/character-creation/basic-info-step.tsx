'use client';

import React, { useState } from 'react';
import clsx from 'clsx';
import { CharacterFormData, LibraryData } from './types';
import { AppIcons } from '@/lib/icon-utils';

interface BasicInfoStepProps {
  formData: Partial<CharacterFormData>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  imagePreview: string | null;
  selectedImageFile: File | null;
  handleImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setSelectedImageFile: (file: File | null) => void;
  setImagePreview: (preview: string | null) => void;
  onNext: () => void;
  isValid: boolean;
  libraryData: LibraryData;
  onApplyTemplate: (classId: string, subclassId: string) => void;
}

export default function BasicInfoStep({
  formData,
  handleInputChange,
  imagePreview,
  selectedImageFile,
  handleImageFileChange,
  setSelectedImageFile,
  setImagePreview,
  onNext,
  isValid,
  libraryData,
  onApplyTemplate
}: BasicInfoStepProps) {
  const [creationMode, setCreationMode] = useState<'custom' | 'template'>('custom');
  const [selectedTemplateClassId, setSelectedTemplateClassId] = useState<string | null>(null);

  const handleClassSelect = (classId: string) => {
    setSelectedTemplateClassId(classId === selectedTemplateClassId ? null : classId);
  };

  const handleSubclassSelect = (subclassId: string) => {
    if (selectedTemplateClassId) {
      onApplyTemplate(selectedTemplateClassId, subclassId);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-serif flex items-center gap-2"><AppIcons.ui.external size={20} /> Step 1: Basic Info</h2>

      {/* Basic Info Fields */}
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-400">Character Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name || ''}
            onChange={handleInputChange}
            className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold text-white"
            required
            placeholder="e.g., Aragorn, Lyra Moonwhisper, Grimjaw..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Character Image (Optional)</label>
          <div className="flex flex-col gap-3">
            {imagePreview && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-dagger-gold">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 rounded-full text-white"
                >
                  <AppIcons.ui.close size={12} />
                </button>
              </div>
            )}
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-colors w-fit">
                <AppIcons.ui.upload size={16} />
                <span className="text-sm">{selectedImageFile ? 'Change Image' : 'Upload Image'}</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500">Max 2MB. PNG, JPG, or WEBP</p>
          </div>
        </div>
      </div>

      <hr className="border-white/10" />

      {/* Creation Method Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-400">Creation Method</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setCreationMode('custom')}
            className={clsx(
              "p-4 rounded-lg border flex flex-col items-center gap-2 transition-all",
              creationMode === 'custom'
                ? "bg-dagger-gold/20 border-dagger-gold text-white"
                : "bg-black/20 border-white/10 text-gray-400 hover:bg-black/40"
            )}
          >
            <AppIcons.campaign.player size={24} />
            <span className="font-bold">Custom Character</span>
            <span className="text-xs text-center opacity-70">Build your character step-by-step from scratch</span>
          </button>

          <button
            type="button"
            onClick={() => setCreationMode('template')}
            className={clsx(
              "p-4 rounded-lg border flex flex-col items-center gap-2 transition-all",
              creationMode === 'template'
                ? "bg-dagger-gold/20 border-dagger-gold text-white"
                : "bg-black/20 border-white/10 text-gray-400 hover:bg-black/40"
            )}
          >
            <AppIcons.combat.ability size={24} />
            <span className="font-bold">Class Template</span>
            <span className="text-xs text-center opacity-70">Start with a pre-generated archetype</span>
          </button>
        </div>

        {/* Template Selection UI */}
        {creationMode === 'template' && (
          <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Select Class</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {libraryData.classes.map(cls => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => handleClassSelect(cls.id)}
                    className={clsx(
                      "px-3 py-2 rounded text-sm font-medium transition-colors border",
                      selectedTemplateClassId === cls.id
                        ? "bg-dagger-gold text-black border-dagger-gold"
                        : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {cls.name}
                  </button>
                ))}
              </div>
            </div>

            {selectedTemplateClassId && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-medium text-gray-400 mb-2">Select Subclass to Apply Template</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {libraryData.subclasses
                    .filter(sub => sub.data.parent_class_id === selectedTemplateClassId)
                    .map(sub => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSubclassSelect(sub.id)}
                        className={clsx(
                          "px-3 py-2 rounded text-sm font-medium transition-colors border text-left flex items-center justify-between group",
                          formData.subclass_id === sub.id
                            ? "bg-dagger-gold/20 border-dagger-gold text-white"
                            : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                        )}
                      >
                        <span>{sub.name}</span>
                        {formData.subclass_id === sub.id && <span className="text-xs bg-dagger-gold text-black px-1.5 py-0.5 rounded">Selected</span>}
                      </button>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Selecting a subclass will automatically populate Ancestry, Community, Stats, and Equipment based on a standard archetype.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!isValid}
        className={clsx(
          "w-full px-4 py-2 font-bold rounded-full shadow-md transition-all mt-6",
          isValid
            ? "bg-dagger-gold text-black hover:scale-[1.02]"
            : "bg-gray-600 text-gray-400 cursor-not-allowed"
        )}
      >
        Next
      </button>
    </div>
  );
}
