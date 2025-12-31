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

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import ModifierBuilder from '../modifiers/modifier-builder';
import { Modifier } from '@/types/modifiers';

export interface HomebrewItemData {
  name: string;
  type: 'weapon' | 'armor' | 'item' | 'consumable';
  description: string;
  data: {
    modifiers?: Modifier[];
    // Weapon fields
    type?: string; // Physical or Magic
    hand?: string; // Primary or Secondary
    trait?: string; // Agility, Strength, etc.
    range?: string; // Melee, Close, Far, Very Far
    damage?: string; // For weapons (e.g., "d8 phy", "2d6+3 mag")
    burden?: string; // For weapons ("One-Handed", "Two-Handed", "Worn")
    feature?: object; // Feature object for SRD compatibility
    // Armor fields
    base_score?: number; // For armor
    base_thresholds?: string; // For armor (e.g., "5 / 11")
    // Consumable fields
    uses?: number; // For consumables
  };
}

interface CreateHomebrewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: HomebrewItemData) => void;
  onDelete?: () => void;
  initialData?: HomebrewItemData;
  isEditing?: boolean;
}

const ITEM_TYPES = [
  { value: 'weapon', label: 'Weapon' },
  { value: 'armor', label: 'Armor' },
  { value: 'item', label: 'Item' },
  { value: 'consumable', label: 'Consumable' },
] as const;

const BURDEN_OPTIONS = [
  { value: 'One-Handed', label: 'One-Handed' },
  { value: 'Two-Handed', label: 'Two-Handed' },
  { value: 'Worn', label: 'Worn (0 hands)' },
] as const;

const DAMAGE_TYPE_OPTIONS = [
  { value: 'Physical', label: 'Physical' },
  { value: 'Magic', label: 'Magic' },
] as const;

const WEAPON_HAND_OPTIONS = [
  { value: 'Primary', label: 'Primary' },
  { value: 'Secondary', label: 'Secondary' },
] as const;

const TRAIT_OPTIONS = [
  { value: 'Agility', label: 'Agility' },
  { value: 'Strength', label: 'Strength' },
  { value: 'Finesse', label: 'Finesse' },
  { value: 'Instinct', label: 'Instinct' },
] as const;

const RANGE_OPTIONS = [
  { value: 'Melee', label: 'Melee' },
  { value: 'Close', label: 'Close' },
  { value: 'Far', label: 'Far' },
  { value: 'Very Far', label: 'Very Far' },
] as const;

export default function CreateHomebrewItemModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  isEditing = false,
}: CreateHomebrewItemModalProps) {
  // Basic fields
  const [name, setName] = useState('');
  const [type, setType] = useState<'weapon' | 'armor' | 'item' | 'consumable'>('weapon');
  const [description, setDescription] = useState('');

  // Type-specific fields
  // Weapon fields
  const [damage, setDamage] = useState('');
  const [damageType, setDamageType] = useState('Physical');
  const [burden, setBurden] = useState('One-Handed');
  const [weaponHand, setWeaponHand] = useState('Primary');
  const [trait, setTrait] = useState('Agility');
  const [range, setRange] = useState('Melee');
  // Armor fields
  const [armorScore, setArmorScore] = useState('');
  const [thresholds, setThresholds] = useState('');
  // Consumable fields
  const [uses, setUses] = useState('1');

  // Modifiers
  const [modifiers, setModifiers] = useState<Modifier[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<string[]>([]);

  // Populate form with initial data when editing
  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        setName(initialData.name);
        setType(initialData.type);
        setDescription(initialData.description);
        setModifiers(initialData.data.modifiers || []);

        if (initialData.type === 'weapon') {
          setDamage(initialData.data.damage || '');
          setDamageType(initialData.data.type || 'Physical');
          setBurden(initialData.data.burden || 'One-Handed');
          setWeaponHand(initialData.data.hand || 'Primary');
          setTrait(initialData.data.trait || 'Agility');
          setRange(initialData.data.range || 'Melee');
        } else if (initialData.type === 'armor') {
          setArmorScore(initialData.data.base_score?.toString() || '');
          setThresholds(initialData.data.base_thresholds || '');
        } else if (initialData.type === 'consumable') {
          setUses(initialData.data.uses?.toString() || '1');
        }
      } else {
        resetForm();
      }
    }
  }, [isOpen, isEditing, initialData]);

  const resetForm = () => {
    setName('');
    setType('weapon');
    setDescription('');
    setDamage('');
    setDamageType('Physical');
    setBurden('One-Handed');
    setWeaponHand('Primary');
    setTrait('Agility');
    setRange('Melee');
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
      // Allow for loose spacing: "1 d 8 + 3"
      if (damage && !damage.replace(/\s/g, '').match(/^\d*d\d+([+-]\d+)?$/i)) {
        newErrors.push('Damage must match dice format like "1d8" or "2d6+3"');
      }
    }

    if (type === 'armor') {
      if (armorScore) {
        const score = parseInt(armorScore);
        if (isNaN(score) || score < 0) {
          newErrors.push('Armor score must be a positive number');
        }
      }
      if (thresholds && !thresholds.match(/^\s*\d+\s*\/\s*\d+(\s*\/\s*\d+)?\s*$/)) {
        newErrors.push('Thresholds must match format like "2/4" or "1 / 3 / 5"');
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

    // Add type-specific data matching SRD format
    if (type === 'weapon') {
      itemData.data.type = damageType;
      itemData.data.hand = weaponHand;
      itemData.data.trait = trait;
      itemData.data.range = range;
      if (damage) itemData.data.damage = damage;
      itemData.data.burden = burden;
      itemData.data.feature = {}; // Empty feature object for consistency with SRD
    } else if (type === 'armor') {
      if (armorScore) itemData.data.base_score = parseInt(armorScore);
      if (thresholds) itemData.data.base_thresholds = thresholds;
      itemData.data.feature = {}; // Empty feature object for consistency with SRD
    } else if (type === 'consumable') {
      if (uses) itemData.data.uses = parseInt(uses);
    }

    onSave(itemData);
    if (!isEditing) resetForm(); // Only reset if creating new, otherwise keep form state
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
            <h2 className="text-2xl font-bold text-dagger-gold">
              {isEditing ? 'Edit Homebrew Item' : 'Create Homebrew Item'}
            </h2>
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
                <label htmlFor="itemName" className="block text-sm text-gray-400 mb-2">
                  Item Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="itemName"
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
                      disabled={isEditing && value !== type} // Disable changing type when editing
                      className={clsx(
                        'p-3 rounded-lg font-bold border-2 transition-all',
                        type === value
                          ? 'bg-dagger-gold text-black border-dagger-gold'
                          : 'bg-white/5 text-white border-white/10 hover:border-white/30',
                        isEditing && value !== type && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {isEditing && <p className="text-xs text-gray-500 mt-1">Item type cannot be changed while editing.</p>}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm text-gray-400 mb-2">
                  Description <span className="text-gray-600">(optional)</span>
                </label>
                <textarea
                  id="description"
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
                  {/* Damage Type */}
                  <div>
                    <label htmlFor="damageType" className="block text-sm text-gray-400 mb-2">Damage Type</label>
                    <select
                      id="damageType"
                      value={damageType}
                      onChange={(e) => setDamageType(e.target.value)}
                      className="w-full p-3 rounded-lg bg-black/40 border border-white/20 text-white focus:border-dagger-gold outline-none"
                    >
                      {DAMAGE_TYPE_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Hand */}
                  <div>
                    <label htmlFor="weaponHand" className="block text-sm text-gray-400 mb-2">Hand</label>
                    <select
                      id="weaponHand"
                      value={weaponHand}
                      onChange={(e) => setWeaponHand(e.target.value)}
                      className="w-full p-3 rounded-lg bg-black/40 border border-white/20 text-white focus:border-dagger-gold outline-none"
                    >
                      {WEAPON_HAND_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Trait */}
                  <div>
                    <label htmlFor="attackTrait" className="block text-sm text-gray-400 mb-2">Attack Trait</label>
                    <select
                      id="attackTrait"
                      value={trait}
                      onChange={(e) => setTrait(e.target.value)}
                      className="w-full p-3 rounded-lg bg-black/40 border border-white/20 text-white focus:border-dagger-gold outline-none"
                    >
                      {TRAIT_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Range */}
                  <div>
                    <label htmlFor="weaponRange" className="block text-sm text-gray-400 mb-2">Range</label>
                    <select
                      id="weaponRange"
                      value={range}
                      onChange={(e) => setRange(e.target.value)}
                      className="w-full p-3 rounded-lg bg-black/40 border border-white/20 text-white focus:border-dagger-gold outline-none"
                    >
                      {RANGE_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Damage */}
                  <div>
                    <label htmlFor="weaponDamage" className="block text-sm text-gray-400 mb-2">Damage</label>
                    <input
                      id="weaponDamage"
                      type="text"
                      value={damage}
                      onChange={(e) => setDamage(e.target.value)}
                      className="w-full p-3 rounded-lg bg-black/40 border border-white/20 text-white focus:border-dagger-gold outline-none"
                      placeholder="e.g., 1d8, 2d6+3"
                    />
                    <div className="text-xs text-gray-500 mt-1">Format: XdY (e.g., 1d8, 2d6+3). Select type below.</div>
                  </div>

                  {/* Burden */}
                  <div>
                    <label htmlFor="weaponBurden" className="block text-sm text-gray-400 mb-2">Burden</label>
                    <select
                      id="weaponBurden"
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
                    <label htmlFor="armorScore" className="block text-sm text-gray-400 mb-2">Armor Score</label>
                    <input
                      id="armorScore"
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
                    <label htmlFor="damageThresholds" className="block text-sm text-gray-400 mb-2">Damage Thresholds</label>
                    <input
                      id="damageThresholds"
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
                  <label htmlFor="consumableUses" className="block text-sm text-gray-400 mb-2">Number of Uses</label>
                  <input
                    id="consumableUses"
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
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-white/10">
            {isEditing && onDelete && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this homebrew item? This action cannot be undone.')) {
                    onDelete();
                    onClose();
                  }
                }}
                className="px-4 py-3 bg-red-900/40 text-red-400 border border-red-500/50 rounded-full hover:bg-red-900/60 transition-all flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete
              </button>
            )}
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
              {isEditing ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}