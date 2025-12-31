'use client';

import React from 'react';
import { BookOpen, X, Upload } from 'lucide-react';
import clsx from 'clsx';
import { CharacterFormData } from './types';

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
  isValid
}: BasicInfoStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold font-serif flex items-center gap-2"><BookOpen size={20} /> Step 1: Basic Info</h2>
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
                <X size={12} />
              </button>
            </div>
          )}
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-colors">
              <Upload size={16} />
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
      <button
        type="button"
        onClick={onNext}
        disabled={!isValid}
        className={clsx(
          "w-full px-4 py-2 font-bold rounded-full shadow-md transition-all",
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
