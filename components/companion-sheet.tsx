'use client';

/**
 * COMPANION SHEET COMPONENT
 * ----------------------------------------------------------------------------
 * A bottom-sheet interface for managing Beastbond Ranger companions.
 *
 * FUNCTIONALITY:
 * - Initial Setup: Create a new companion with name, animal type, experiences, attack type, damage die
 * - Edit Companion: Modify companion info, experiences, vitals
 * - Level-Up Options: Track and apply the 8 different training options
 * - Vitals Management: Track stress, hope, armor usage
 * - Image Upload: Upload companion portrait from gallery
 */

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Trash2, Check, Pencil, Plus, PawPrint, ChevronDown, ChevronUp, Camera, Zap, Eye } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { RangerCompanion, CompanionExperience } from '@/types/character';
import { uploadCharacterImage } from '@/lib/storage-service';
import { toast } from 'sonner';

interface CompanionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  companion: RangerCompanion | undefined;
  onUpdateCompanion: (companion: RangerCompanion) => void;
  characterId?: string;
  userId?: string;
}

const DEFAULT_COMPANION: RangerCompanion = {
  name: '',
  animal_type: '',
  image_url: undefined,
  evasion: 10,
  stress_max: 3,
  stress_current: 0,
  armor_slot: false,
  armor_slot_used: false,
  hope_max: 1,
  hope_current: 0,
  attack_type: 'melee',
  damage_die: 'd6',
  attack_range: 'melee',
  experiences: [],
  level_up_options: {
    intelligent: 0,
    light_in_the_dark: 0,
    creature_comfort: false,
    creature_comfort_used: false,
    armored: false,
    armored_used: false,
    vicious: 0,
    resilient: 0,
    bonded: false,
    aware: false,
  },
};

const DAMAGE_DICE = ['d4', 'd6', 'd8', 'd10', 'd12'];
const ATTACK_RANGES = ['melee', 'very_close', 'close', 'far'] as const;

const LEVEL_UP_OPTIONS = [
  { key: 'intelligent', name: 'Intelligent', description: '+1 bonus to Companion Experience rolls', multi: true, color: 'cyan' },
  { key: 'light_in_the_dark', name: 'Light in the Dark', description: 'Additional Hope slot', multi: true, color: 'yellow' },
  { key: 'creature_comfort', name: 'Creature Comfort', description: 'Once per rest: Clear 1 Stress OR Give 1 Hope', multi: false, color: 'pink' },
  { key: 'armored', name: 'Armored', description: 'Mark Armor Slot instead of Stress (once per short rest)', multi: false, color: 'blue' },
  { key: 'vicious', name: 'Vicious', description: 'Increase damage die or range to Very Close', multi: true, color: 'red' },
  { key: 'resilient', name: 'Resilient', description: 'Additional Stress slot', multi: true, color: 'purple' },
  { key: 'bonded', name: 'Bonded', description: 'Emergency assistance when you reach 0 HP', multi: false, color: 'orange' },
  { key: 'aware', name: 'Aware', description: '+2 bonus to Evasion', multi: false, color: 'teal' },
];

export default function CompanionSheet({
  isOpen,
  onClose,
  companion,
  onUpdateCompanion,
  characterId,
  userId
}: CompanionSheetProps) {
  const [localCompanion, setLocalCompanion] = useState<RangerCompanion>(companion || DEFAULT_COMPANION);
  const [activeSection, setActiveSection] = useState<'info' | 'experiences' | 'training'>('info');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Experience editing state
  const [newExpName, setNewExpName] = useState('');
  const [newExpValue, setNewExpValue] = useState(2);
  const [editingExpIndex, setEditingExpIndex] = useState<number | null>(null);
  const [editExpName, setEditExpName] = useState('');
  const [editExpValue, setEditExpValue] = useState(0);

  // Reset local state when companion changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalCompanion(companion || DEFAULT_COMPANION);
      setActiveSection('info');
    }
  }, [companion, isOpen]);

  const isNewCompanion = !companion;

  const handleSave = () => {
    if (!localCompanion.name.trim() || !localCompanion.animal_type.trim()) {
      toast.error('Please enter a name and animal type');
      return;
    }
    onUpdateCompanion(localCompanion);
    onClose();
  };

  const updateLocal = (updates: Partial<RangerCompanion>) => {
    setLocalCompanion(prev => ({ ...prev, ...updates }));
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !characterId || !userId) return;

    setIsUploading(true);
    try {
      const { url, error } = await uploadCharacterImage(userId, file, characterId);
      if (error || !url) {
        toast.error(error || 'Failed to upload image');
        return;
      }
      updateLocal({ image_url: url });
      toast.success('Companion image uploaded');
    } catch (err) {
      console.error('Failed to upload image:', err);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Experience handlers
  const handleAddExperience = () => {
    if (!newExpName.trim()) return;
    const newExp: CompanionExperience = { name: newExpName.trim(), value: newExpValue };
    updateLocal({ experiences: [...localCompanion.experiences, newExp] });
    setNewExpName('');
    setNewExpValue(2);
  };

  const handleDeleteExperience = (index: number) => {
    const updated = localCompanion.experiences.filter((_, i) => i !== index);
    updateLocal({ experiences: updated });
  };

  const startEditExperience = (index: number, exp: CompanionExperience) => {
    setEditingExpIndex(index);
    setEditExpName(exp.name);
    setEditExpValue(exp.value);
  };

  const saveEditExperience = () => {
    if (editingExpIndex === null) return;
    const updated = localCompanion.experiences.map((exp, i) =>
      i === editingExpIndex ? { name: editExpName, value: editExpValue } : exp
    );
    updateLocal({ experiences: updated });
    setEditingExpIndex(null);
  };

  // Level-up option handlers
  const toggleLevelUpOption = (key: string, multi: boolean) => {
    const current = localCompanion.level_up_options[key as keyof typeof localCompanion.level_up_options];

    let newOptions = { ...localCompanion.level_up_options };
    const newCompanion = { ...localCompanion };

    if (multi) {
      newOptions = { ...newOptions, [key]: (current as number) + 1 };

      if (key === 'light_in_the_dark') {
        newCompanion.hope_max = (newCompanion.hope_max || 1) + 1;
      } else if (key === 'resilient') {
        newCompanion.stress_max = (newCompanion.stress_max || 3) + 1;
      }
    } else {
      newOptions = { ...newOptions, [key]: !current };

      if (key === 'armored' && !current) {
        newCompanion.armor_slot = true;
      } else if (key === 'armored' && current) {
        newCompanion.armor_slot = false;
        newCompanion.armor_slot_used = false;
      } else if (key === 'aware') {
        newCompanion.evasion = !current ? (newCompanion.evasion || 10) + 2 : (newCompanion.evasion || 12) - 2;
      }
    }

    setLocalCompanion({ ...newCompanion, level_up_options: newOptions });
  };

  const decrementLevelUpOption = (key: string) => {
    const current = localCompanion.level_up_options[key as keyof typeof localCompanion.level_up_options] as number;
    if (current <= 0) return;

    const newOptions = { ...localCompanion.level_up_options, [key]: current - 1 };
    const newCompanion = { ...localCompanion };

    if (key === 'light_in_the_dark') {
      newCompanion.hope_max = Math.max(1, (newCompanion.hope_max || 1) - 1);
      newCompanion.hope_current = Math.min(newCompanion.hope_current, newCompanion.hope_max);
    } else if (key === 'resilient') {
      newCompanion.stress_max = Math.max(3, (newCompanion.stress_max || 3) - 1);
      newCompanion.stress_current = Math.min(newCompanion.stress_current, newCompanion.stress_max);
    }

    setLocalCompanion({ ...newCompanion, level_up_options: newOptions });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-dagger-panel border-t border-white/10 rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center p-3 cursor-pointer" onClick={onClose}>
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                {/* Companion Portrait */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 bg-gray-800 rounded-xl border-2 border-dagger-gold/50 flex-shrink-0 relative group cursor-pointer overflow-hidden"
                >
                  {localCompanion.image_url ? (
                    <Image
                      src={localCompanion.image_url}
                      alt={localCompanion.name || 'Companion'}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dagger-gold/20 to-dagger-gold/5">
                      <PawPrint size={24} className="text-dagger-gold/60" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUploading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="text-white" size={16} />
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>

                <div className="flex-1">
                  <div className="text-lg font-serif font-bold text-white flex items-center gap-2">
                    <PawPrint className="text-dagger-gold" size={18} />
                    {isNewCompanion ? 'Create Companion' : localCompanion.name || 'Companion'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isNewCompanion ? 'Set up your animal companion' : 'Manage companion details'}
                  </div>
                </div>
              </div>
            </div>

            {/* Section Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveSection('info')}
                className={clsx(
                  "flex-1 py-3 text-sm font-bold transition-colors",
                  activeSection === 'info' ? "text-dagger-gold border-b-2 border-dagger-gold" : "text-gray-500 hover:text-white"
                )}
              >
                Info
              </button>
              <button
                onClick={() => setActiveSection('experiences')}
                className={clsx(
                  "flex-1 py-3 text-sm font-bold transition-colors",
                  activeSection === 'experiences' ? "text-dagger-gold border-b-2 border-dagger-gold" : "text-gray-500 hover:text-white"
                )}
              >
                Experiences
              </button>
              <button
                onClick={() => setActiveSection('training')}
                className={clsx(
                  "flex-1 py-3 text-sm font-bold transition-colors",
                  activeSection === 'training' ? "text-dagger-gold border-b-2 border-dagger-gold" : "text-gray-500 hover:text-white"
                )}
              >
                Training
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeSection === 'info' && (
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Companion Name</label>
                    <input
                      value={localCompanion.name}
                      onChange={(e) => updateLocal({ name: e.target.value })}
                      placeholder="e.g., Shadow, Fang, Luna..."
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-dagger-gold outline-none transition-colors"
                    />
                  </div>

                  {/* Animal Type */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Animal Type</label>
                    <input
                      value={localCompanion.animal_type}
                      onChange={(e) => updateLocal({ animal_type: e.target.value })}
                      placeholder="e.g., Wolf, Hawk, Bear..."
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-dagger-gold outline-none transition-colors"
                    />
                  </div>

                  {/* Attack Type */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Attack Type</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateLocal({ attack_type: 'melee', attack_range: 'melee' })}
                        className={clsx(
                          "flex-1 py-2 rounded-lg font-bold text-sm transition-colors border",
                          localCompanion.attack_type === 'melee'
                            ? "bg-dagger-gold text-black border-dagger-gold"
                            : "bg-black/30 text-gray-400 border-white/10 hover:border-white/30"
                        )}
                      >
                        Melee
                      </button>
                      <button
                        onClick={() => updateLocal({ attack_type: 'ranged', attack_range: 'close' })}
                        className={clsx(
                          "flex-1 py-2 rounded-lg font-bold text-sm transition-colors border",
                          localCompanion.attack_type === 'ranged'
                            ? "bg-dagger-gold text-black border-dagger-gold"
                            : "bg-black/30 text-gray-400 border-white/10 hover:border-white/30"
                        )}
                      >
                        Ranged
                      </button>
                    </div>
                  </div>

                  {/* Damage Die */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Damage Die</label>
                    <div className="flex gap-2 flex-wrap">
                      {DAMAGE_DICE.map(die => (
                        <button
                          key={die}
                          onClick={() => updateLocal({ damage_die: die })}
                          className={clsx(
                            "px-4 py-2 rounded-lg font-bold text-sm transition-colors border",
                            localCompanion.damage_die === die
                              ? "bg-dagger-gold text-black border-dagger-gold"
                              : "bg-black/30 text-gray-400 border-white/10 hover:border-white/30"
                          )}
                        >
                          {die}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Range */}
                  {(localCompanion.attack_type === 'ranged' || localCompanion.level_up_options.vicious > 0) && (
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Attack Range</label>
                      <div className="flex gap-2 flex-wrap">
                        {ATTACK_RANGES.map(range => (
                          <button
                            key={range}
                            onClick={() => updateLocal({ attack_range: range })}
                            className={clsx(
                              "px-3 py-2 rounded-lg font-bold text-sm transition-colors capitalize border",
                              localCompanion.attack_range === range
                                ? "bg-dagger-gold text-black border-dagger-gold"
                                : "bg-black/30 text-gray-400 border-white/10 hover:border-white/30"
                            )}
                          >
                            {range.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats Display */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Evasion */}
                    <div className="bg-dagger-panel border border-cyan-500/30 rounded-lg p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-cyan-400 flex items-center gap-1 mb-1">
                        <Eye size={10} /> Evasion
                      </div>
                      <div className="text-2xl font-serif font-bold text-white">{localCompanion.evasion}</div>
                      {localCompanion.level_up_options.aware && (
                        <div className="text-[10px] text-gray-500">Base 10 + 2 (Aware)</div>
                      )}
                    </div>

                    {/* Stress Slots */}
                    <div className="bg-dagger-panel border border-purple-500/30 rounded-lg p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-purple-400 flex items-center gap-1 mb-1">
                        <Zap size={10} /> Stress Slots
                      </div>
                      <div className="text-2xl font-serif font-bold text-white">{localCompanion.stress_max}</div>
                      {localCompanion.level_up_options.resilient > 0 && (
                        <div className="text-[10px] text-gray-500">Base 3 + {localCompanion.level_up_options.resilient} (Resilient)</div>
                      )}
                    </div>

                    {/* Hope Slots */}
                    <div className="bg-dagger-panel border border-dagger-gold/30 rounded-lg p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-dagger-gold flex items-center gap-1 mb-1">
                        <Zap size={10} /> Hope Slots
                      </div>
                      <div className="text-2xl font-serif font-bold text-white">{localCompanion.hope_max}</div>
                      {localCompanion.level_up_options.light_in_the_dark > 0 && (
                        <div className="text-[10px] text-gray-500">Base 1 + {localCompanion.level_up_options.light_in_the_dark} (Light)</div>
                      )}
                    </div>

                    {/* Armor Slot */}
                    {localCompanion.armor_slot && (
                      <div className="bg-dagger-panel border border-blue-500/30 rounded-lg p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-blue-400 flex items-center gap-1 mb-1">
                          <Zap size={10} /> Armor Slot
                        </div>
                        <div className="text-2xl font-serif font-bold text-white">1</div>
                        <div className="text-[10px] text-gray-500">From Armored training</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'experiences' && (
                <div className="space-y-4">
                  {/* Add New Experience */}
                  <div className="bg-black/20 rounded-lg p-4 space-y-3 border border-white/5">
                    <div className="text-xs font-bold text-gray-400 uppercase">Add Experience</div>
                    <div className="flex items-center gap-2">
                      <input
                        value={newExpName}
                        onChange={(e) => setNewExpName(e.target.value)}
                        placeholder="Experience name..."
                        className="flex-1 bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-white focus:border-dagger-gold outline-none transition-colors"
                      />
                      <div className="flex items-center bg-black/40 rounded border border-white/10">
                        <button onClick={() => setNewExpValue(v => Math.max(0, v - 1))} className="px-2 py-1 hover:bg-white/10 text-white">-</button>
                        <span className="w-8 text-center font-bold text-dagger-gold">+{newExpValue}</span>
                        <button onClick={() => setNewExpValue(v => v + 1)} className="px-2 py-1 hover:bg-white/10 text-white">+</button>
                      </div>
                    </div>
                    <button
                      onClick={handleAddExperience}
                      disabled={!newExpName.trim()}
                      className="w-full py-2 bg-dagger-gold/20 hover:bg-dagger-gold/30 text-dagger-gold font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-dagger-gold/30"
                    >
                      <Plus size={16} /> Add Experience
                    </button>
                  </div>

                  {/* Experience List */}
                  <div className="space-y-2">
                    {localCompanion.experiences.length === 0 && (
                      <div className="text-center text-gray-500 italic py-4 bg-black/20 rounded-lg border border-white/5">
                        No experiences recorded. Add 2 experiences based on your companion&apos;s training.
                      </div>
                    )}

                    {localCompanion.experiences.map((exp, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg p-3">
                        {editingExpIndex === index ? (
                          <div className="flex-1 flex flex-col gap-2">
                            <input
                              autoFocus
                              value={editExpName}
                              onChange={(e) => setEditExpName(e.target.value)}
                              className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm w-full text-white focus:border-dagger-gold outline-none"
                            />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center bg-black/40 rounded border border-white/20">
                                <button onClick={() => setEditExpValue(v => Math.max(0, v - 1))} className="px-2 py-0.5 hover:bg-white/10 text-white">-</button>
                                <span className="w-8 text-center font-bold text-dagger-gold">+{editExpValue}</span>
                                <button onClick={() => setEditExpValue(v => v + 1)} className="px-2 py-0.5 hover:bg-white/10 text-white">+</button>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => setEditingExpIndex(null)} className="p-1 text-gray-400 hover:text-white"><X size={16} /></button>
                                <button onClick={saveEditExperience} className="p-1 text-dagger-gold hover:text-dagger-gold/80"><Check size={16} /></button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <div
                              onClick={() => startEditExperience(index, exp)}
                              className="font-medium text-white cursor-pointer flex items-center gap-2 hover:text-dagger-gold transition-colors capitalize"
                            >
                              {exp.name}
                              <Pencil size={12} className="text-gray-600 opacity-50" />
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-dagger-gold font-bold">+{exp.value}</div>
                              <button onClick={() => handleDeleteExperience(index)} className="text-gray-500 hover:text-red-400 p-1">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Intelligent bonus display */}
                  {localCompanion.level_up_options.intelligent > 0 && (
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                      <div className="text-sm text-cyan-400">
                        <strong>Intelligent Training:</strong> +{localCompanion.level_up_options.intelligent} bonus to all Companion Experience rolls
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'training' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    Training options gained through level-ups. Some options can be taken multiple times.
                  </p>

                  {LEVEL_UP_OPTIONS.map(option => {
                    const value = localCompanion.level_up_options[option.key as keyof typeof localCompanion.level_up_options];
                    const isActive = option.multi ? (value as number) > 0 : value as boolean;
                    const count = option.multi ? value as number : 0;

                    const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
                      cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
                      yellow: { bg: 'bg-dagger-gold/10', text: 'text-dagger-gold', border: 'border-dagger-gold/20' },
                      pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
                      blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
                      red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
                      purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
                      orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
                      teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
                    };

                    const colors = colorClasses[option.color] || colorClasses.cyan;

                    return (
                      <div
                        key={option.key}
                        className={clsx(
                          "rounded-lg p-4 border transition-colors",
                          isActive ? `${colors.bg} ${colors.border}` : "bg-black/20 border-white/5"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className={clsx("font-bold", isActive ? colors.text : "text-white")}>
                                {option.name}
                              </h4>
                              {option.multi && count > 0 && (
                                <span className={clsx("text-xs px-2 py-0.5 rounded font-bold", colors.bg, colors.text)}>
                                  ×{count}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{option.description}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {option.multi ? (
                              <>
                                {count > 0 && (
                                  <button
                                    onClick={() => decrementLevelUpOption(option.key)}
                                    className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                                  >
                                    <ChevronDown size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() => toggleLevelUpOption(option.key, true)}
                                  className={clsx(
                                    "w-8 h-8 rounded flex items-center justify-center transition-colors",
                                    isActive ? "bg-dagger-gold text-black" : "bg-white/10 hover:bg-white/20 text-white"
                                  )}
                                >
                                  <ChevronUp size={16} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => toggleLevelUpOption(option.key, false)}
                                className={clsx(
                                  "w-8 h-8 rounded border-2 transition-colors flex items-center justify-center",
                                  isActive ? "bg-dagger-gold border-dagger-gold" : "bg-transparent border-gray-600 hover:border-dagger-gold"
                                )}
                              >
                                {isActive && <Check size={16} className="text-black" />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!localCompanion.name.trim() || !localCompanion.animal_type.trim()}
                className="flex-1 py-3 bg-dagger-gold hover:bg-dagger-gold/90 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isNewCompanion ? 'Create Companion' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
