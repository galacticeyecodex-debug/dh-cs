'use client';

/**
 * CREATE HOMEBREW ITEM MODAL
 * ----------------------------------------------------------------------------
 * A modal dialog for creating custom homebrew items with modifiers.
 *
 * FUNCTIONALITY:
 * - Basic Info: Name, type, description
 * - Type-Specific Fields: Damage for weapons, armor score for armor, etc.
 * - Modifier Builder: Integrated ModifierBuilder for adding stat modifiers
 * - Validation: Ensures required fields are filled and data is valid
 * - Preview: Shows how the item will look when equipped
 */

import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import ModifierBuilder from './modifier-builder';
import { Modifier } from '@/types/modifiers';

export interface HomebrewItemData {
  name: string;
  type: 'weapon' | 'armor' | 'item' | 'consumable';
  description: string;
  data: {
    modifiers?: Modifier[];
    damage?: string; // For weapons (e.g., "1d8+2")
    burden?: string; // For weapons ("1h", "2h", "0h")
    armor_score?: number; // For armor
    thresholds?: string; // For armor (e.g., "2/4")
    uses?: number; // For consumables
  };
}

interface CreateHomebrewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: HomebrewItemData) => void;
}

const ITEM_TYPES = [
  { value: 'weapon', label: 'Weapon' },
  { value: 'armor', label: 'Armor' },
  { value: 'item', label: 'Item' },
  { value: 'consumable', label: 'Consumable' },
] as const;

const BURDEN_OPTIONS = [
  { value: '0h', label: '0 Hands (Worn)' },
  { value: '1h', label: '1 Hand' },
  { value: '2h', label: '2 Hands' },
] as const;

export default function CreateHomebrewItemModal({
  isOpen,
  onClose,
  onSave,
}: CreateHomebrewItemModalProps) {
  // Basic fields
  const [name, setName] = useState('');
  const [type, setType] = useState<'weapon' | 'armor' | 'item' | 'consumable'>('weapon');
  const [description, setDescription] = useState('');

  // Type-specific fields
  const [damage, setDamage] = useState('');
  const [burden, setBurden] = useState('1h');
  const [armorScore, setArmorScore] = useState('');
  const [thresholds, setThresholds] = useState('');
  const [uses, setUses] = useState('1');

  // Modifiers
  const [modifiers, setModifiers] = useState<Modifier[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<string[]>([]);

  const resetForm = () => {
    setName('');
    setType('weapon');
    setDescription('');
    setDamage('');
    setBurden('1h');
    setArmorScore('');
    setThresholds('');
    setUses('1');
    setModifiers([]);
    setErrors([]);
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    // Name required
    if (!name.trim()) {
      newErrors.push('Item name is required');
    } else if (name.trim().length < 3) {
      newErrors.push('Item name must be at least 3 characters');
    }

    // Type-specific validation
    if (type === 'weapon') {
      if (damage && !damage.match(/^\d*d\d+([+-]\d+)?$/i)) {
        newErrors.push('Damage must match format like "1d8", "2d6+3", or "d10-1"');
      }
    }

    if (type === 'armor') {
      if (armorScore) {
        const score = parseInt(armorScore);
        if (isNaN(score) || score < 0) {
          newErrors.push('Armor score must be a positive number');
        }
      }
      if (thresholds && !thresholds.match(/^\d+\/\d+(\/\d+)?$/)) {
        newErrors.push('Thresholds must match format like "2/4" or "1/3/5"');
      }
    }

    if (type === 'consumable') {
      if (uses) {
        const usesNum = parseInt(uses);
        if (isNaN(usesNum) || usesNum < 1) {
          newErrors.push('Uses must be a positive number');
        }
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const itemData: HomebrewItemData = {
      name: name.trim(),
      type,
      description: description.trim(),
      data: {
        modifiers: modifiers.length > 0 ? modifiers : undefined,
      },
    };

    // Add type-specific data
    if (type === 'weapon') {
      if (damage) itemData.data.damage = damage;
      itemData.data.burden = burden;
    } else if (type === 'armor') {
      if (armorScore) itemData.data.armor_score = parseInt(armorScore);
      if (thresholds) itemData.data.thresholds = thresholds;
    } else if (type === 'consumable') {
      if (uses) itemData.data.uses = parseInt(uses);
    }

    onSave(itemData);
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-dagger-panel border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-dagger-gold">Create Homebrew Item</h2>
            <button
              onClick={handleClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Validation Errors */}
            {errors.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-bold text-red-300 mb-1">Validation Errors:</div>
                    <ul className="list-disc list-inside text-sm text-red-200 space-y-1">
                      {errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Basic Information</h3>

              {/* Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Item Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-black/40 border border-white/20 text-white focus:border-dagger-gold outline-none"
                  placeholder="e.g., Flaming Sword, Dragon Scale Armor"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Item Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ITEM_TYPES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setType(value)}
                      className={clsx(
                        'p-3 rounded-lg font-bold border-2 transition-all',
                        type === value
                          ? 'bg-dagger-gold text-black border-dagger-gold'
                          : 'bg-white/5 text-white border-white/10 hover:border-white/30'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Description <span className="text-gray-600">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-lg bg-black/40 border border-white/20 text-white focus:border-dagger-gold outline-none min-h-[80px] resize-y"
                  placeholder="Describe your item's appearance, history, or special properties..."
                />
              </div>
            </div>

            {/* Type-Specific Fields */}
            {type === 'weapon' && (
              <div className="space-y-4 bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white">Weapon Properties</h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Damage */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Damage</label>
                    <input
                      type="text"
                      value={damage}
                      onChange={(e) => setDamage(e.target.value)}
                      className="w-full p-3 rounded-lg bg-black/40 border border-white/20 text-white focus:border-dagger-gold outline-none"
                      placeholder="e.g., 1d8, 2d6+3"
                    />
                    <div className="text-xs text-gray-500 mt-1">Format: XdY or XdY+Z</div>
                  </div>

                  {/* Burden */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Burden</label>
                    <select
                      value={burden}
                      onChange={(e) => setBurden(e.target.value)}
                      className="w-full p-3 rounded-lg bg-black/40 border border-white/20 text-white focus:border-dagger-gold outline-none"
                    >
                      {BURDEN_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {type === 'armor' && (
              <div className="space-y-4 bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white">Armor Properties</h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Armor Score */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Armor Score</label>
                    <input
                      type="number"
                      value={armorScore}
                      onChange={(e) => setArmorScore(e.target.value)}
                      className="w-full p-3 rounded-lg bg-black/40 border border-white/20 text-white focus:border-dagger-gold outline-none"
                      placeholder="e.g., 3"
                      min="0"
                    />
                  </div>

                  {/* Thresholds */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Damage Thresholds</label>
                    <input
                      type="text"
                      value={thresholds}
                      onChange={(e) => setThresholds(e.target.value)}
                      className="w-full p-3 rounded-lg bg-black/40 border border-white/20 text-white focus:border-dagger-gold outline-none"
                      placeholder="e.g., 2/4 or 1/3/5"
                    />
                    <div className="text-xs text-gray-500 mt-1">Format: Minor/Major or Minor/Major/Severe</div>
                  </div>
                </div>
              </div>
            )}

            {type === 'consumable' && (
              <div className="space-y-4 bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white">Consumable Properties</h3>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Number of Uses</label>
                  <input
                    type="number"
                    value={uses}
                    onChange={(e) => setUses(e.target.value)}
                    className="w-full p-3 rounded-lg bg-black/40 border border-white/20 text-white focus:border-dagger-gold outline-none"
                    placeholder="e.g., 1"
                    min="1"
                  />
                </div>
              </div>
            )}

            {/* Modifiers Section */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <ModifierBuilder modifiers={modifiers} onChange={setModifiers} />
            </div>

            {/* Info Box */}
            <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 text-sm text-blue-200">
              <strong>Tip:</strong> Modifiers are optional but make your item more powerful. Add bonuses to stats like
              Strength, Evasion, or Armor to create unique effects.
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-white/10">
            <button
              onClick={handleClose}
              className="flex-1 py-3 px-6 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 px-6 bg-dagger-gold text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Create Item
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
