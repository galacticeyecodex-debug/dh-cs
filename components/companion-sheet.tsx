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
 */

import React, { useState, useEffect } from 'react';
import { X, Trash2, Check, Pencil, Plus, PawPrint, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { RangerCompanion, CompanionExperience } from '@/types/character';

interface CompanionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  companion: RangerCompanion | undefined;
  onUpdateCompanion: (companion: RangerCompanion) => void;
}

const DEFAULT_COMPANION: RangerCompanion = {
  name: '',
  animal_type: '',
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
  { key: 'intelligent', name: 'Intelligent', description: '+1 bonus to Companion Experience (can take multiple times)', multi: true, color: 'emerald' },
  { key: 'light_in_the_dark', name: 'Light in the Dark', description: 'Additional Hope slot', multi: true, color: 'yellow' },
  { key: 'creature_comfort', name: 'Creature Comfort', description: 'Once per rest: Clear 1 Stress OR Give 1 Hope', multi: false, color: 'pink' },
  { key: 'armored', name: 'Armored', description: 'Mark Armor Slot instead of Companion Stress (once per short rest)', multi: false, color: 'blue' },
  { key: 'vicious', name: 'Vicious', description: 'Increase damage die by one step OR increase range to Very Close', multi: true, color: 'red' },
  { key: 'resilient', name: 'Resilient', description: 'Additional Stress slot', multi: true, color: 'orange' },
  { key: 'bonded', name: 'Bonded', description: 'Emergency assistance when character reaches 0 HP', multi: false, color: 'purple' },
  { key: 'aware', name: 'Aware', description: '+2 bonus to Evasion', multi: false, color: 'cyan' },
];

export default function CompanionSheet({
  isOpen,
  onClose,
  companion,
  onUpdateCompanion
}: CompanionSheetProps) {
  const [localCompanion, setLocalCompanion] = useState<RangerCompanion>(companion || DEFAULT_COMPANION);
  const [activeSection, setActiveSection] = useState<'info' | 'experiences' | 'training'>('info');

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
    }
  }, [companion, isOpen]);

  const isNewCompanion = !companion;

  const handleSave = () => {
    if (!localCompanion.name.trim() || !localCompanion.animal_type.trim()) {
      return;
    }
    onUpdateCompanion(localCompanion);
    onClose();
  };

  const updateLocal = (updates: Partial<RangerCompanion>) => {
    setLocalCompanion(prev => ({ ...prev, ...updates }));
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
      // Multi-select options increment
      newOptions = { ...newOptions, [key]: (current as number) + 1 };

      // Apply effects
      if (key === 'light_in_the_dark') {
        newCompanion.hope_max = (newCompanion.hope_max || 1) + 1;
      } else if (key === 'resilient') {
        newCompanion.stress_max = (newCompanion.stress_max || 3) + 1;
      }
    } else {
      // Toggle boolean options
      newOptions = { ...newOptions, [key]: !current };

      // Apply effects
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

    // Reverse effects
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
            className="fixed bottom-0 left-0 right-0 z-50 bg-dagger-panel border-t border-emerald-500/30 rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center p-3 cursor-pointer" onClick={onClose}>
              <div className="w-12 h-1.5 bg-emerald-500/40 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-white/10 text-center">
              <div className="text-lg font-serif font-bold text-white flex items-center justify-center gap-2">
                <PawPrint className="text-emerald-400" size={20} />
                {isNewCompanion ? 'Create Companion' : 'Manage Companion'}
              </div>
              <div className="text-xs text-gray-500">
                {isNewCompanion ? 'Set up your animal companion' : 'Edit companion details and training'}
              </div>
            </div>

            {/* Section Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveSection('info')}
                className={clsx(
                  "flex-1 py-2 text-sm font-bold transition-colors",
                  activeSection === 'info' ? "text-emerald-400 border-b-2 border-emerald-400" : "text-gray-500 hover:text-white"
                )}
              >
                Info
              </button>
              <button
                onClick={() => setActiveSection('experiences')}
                className={clsx(
                  "flex-1 py-2 text-sm font-bold transition-colors",
                  activeSection === 'experiences' ? "text-emerald-400 border-b-2 border-emerald-400" : "text-gray-500 hover:text-white"
                )}
              >
                Experiences
              </button>
              <button
                onClick={() => setActiveSection('training')}
                className={clsx(
                  "flex-1 py-2 text-sm font-bold transition-colors",
                  activeSection === 'training' ? "text-emerald-400 border-b-2 border-emerald-400" : "text-gray-500 hover:text-white"
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
                      className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  {/* Animal Type */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Animal Type</label>
                    <input
                      value={localCompanion.animal_type}
                      onChange={(e) => updateLocal({ animal_type: e.target.value })}
                      placeholder="e.g., Wolf, Hawk, Bear..."
                      className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  {/* Attack Type */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Attack Type</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateLocal({ attack_type: 'melee', attack_range: 'melee' })}
                        className={clsx(
                          "flex-1 py-2 rounded-lg font-bold text-sm transition-colors",
                          localCompanion.attack_type === 'melee'
                            ? "bg-emerald-500 text-black"
                            : "bg-white/10 text-gray-400 hover:bg-white/20"
                        )}
                      >
                        Melee
                      </button>
                      <button
                        onClick={() => updateLocal({ attack_type: 'ranged', attack_range: 'close' })}
                        className={clsx(
                          "flex-1 py-2 rounded-lg font-bold text-sm transition-colors",
                          localCompanion.attack_type === 'ranged'
                            ? "bg-emerald-500 text-black"
                            : "bg-white/10 text-gray-400 hover:bg-white/20"
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
                            "px-4 py-2 rounded-lg font-bold text-sm transition-colors",
                            localCompanion.damage_die === die
                              ? "bg-emerald-500 text-black"
                              : "bg-white/10 text-gray-400 hover:bg-white/20"
                          )}
                        >
                          {die}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Range (for ranged attackers or if Vicious was applied) */}
                  {(localCompanion.attack_type === 'ranged' || localCompanion.level_up_options.vicious > 0) && (
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Attack Range</label>
                      <div className="flex gap-2 flex-wrap">
                        {ATTACK_RANGES.map(range => (
                          <button
                            key={range}
                            onClick={() => updateLocal({ attack_range: range })}
                            className={clsx(
                              "px-3 py-2 rounded-lg font-bold text-sm transition-colors capitalize",
                              localCompanion.attack_range === range
                                ? "bg-emerald-500 text-black"
                                : "bg-white/10 text-gray-400 hover:bg-white/20"
                            )}
                          >
                            {range.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evasion Display */}
                  <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Evasion</div>
                      <div className="text-xs text-gray-600">Base 10 {localCompanion.level_up_options.aware ? '+ 2 (Aware)' : ''}</div>
                    </div>
                    <div className="text-2xl font-bold text-white">{localCompanion.evasion}</div>
                  </div>

                  {/* Vitals Display */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase mb-2">
                        Stress ({localCompanion.stress_current}/{localCompanion.stress_max})
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {Array.from({ length: localCompanion.stress_max }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => updateLocal({
                              stress_current: i < localCompanion.stress_current ? i : i + 1
                            })}
                            className={clsx(
                              "w-8 h-8 rounded border-2 transition-colors",
                              i < localCompanion.stress_current
                                ? "bg-red-500 border-red-400"
                                : "bg-transparent border-gray-600 hover:border-red-500"
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase mb-2">
                        Hope ({localCompanion.hope_current}/{localCompanion.hope_max})
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {Array.from({ length: localCompanion.hope_max }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => updateLocal({
                              hope_current: i < localCompanion.hope_current ? i : i + 1
                            })}
                            className={clsx(
                              "w-8 h-8 rounded border-2 transition-colors",
                              i < localCompanion.hope_current
                                ? "bg-dagger-gold border-dagger-gold"
                                : "bg-transparent border-gray-600 hover:border-dagger-gold"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Armor Slot (if Armored) */}
                  {localCompanion.armor_slot && (
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase mb-2">Armor Slot</div>
                      <button
                        onClick={() => updateLocal({ armor_slot_used: !localCompanion.armor_slot_used })}
                        className={clsx(
                          "w-8 h-8 rounded border-2 transition-colors",
                          localCompanion.armor_slot_used
                            ? "bg-blue-500 border-blue-400"
                            : "bg-transparent border-gray-600 hover:border-blue-500"
                        )}
                      />
                      <p className="text-xs text-gray-500 mt-1">Mark instead of stress (resets on short rest)</p>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'experiences' && (
                <div className="space-y-4">
                  {/* Add New Experience */}
                  <div className="bg-black/20 rounded-lg p-4 space-y-3">
                    <div className="text-xs font-bold text-gray-400 uppercase">Add Experience</div>
                    <div className="flex items-center gap-2">
                      <input
                        value={newExpName}
                        onChange={(e) => setNewExpName(e.target.value)}
                        placeholder="Experience name..."
                        className="flex-1 bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                      />
                      <div className="flex items-center bg-white/5 rounded border border-white/10">
                        <button onClick={() => setNewExpValue(v => Math.max(0, v - 1))} className="px-2 py-1 hover:bg-white/10 text-white">-</button>
                        <span className="w-8 text-center font-bold text-emerald-400">+{newExpValue}</span>
                        <button onClick={() => setNewExpValue(v => v + 1)} className="px-2 py-1 hover:bg-white/10 text-white">+</button>
                      </div>
                    </div>
                    <button
                      onClick={handleAddExperience}
                      disabled={!newExpName.trim()}
                      className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Add Experience
                    </button>
                  </div>

                  {/* Experience List */}
                  <div className="space-y-2">
                    {localCompanion.experiences.length === 0 && (
                      <div className="text-center text-gray-600 italic py-4">
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
                              className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm w-full text-white focus:border-emerald-500 outline-none"
                            />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center bg-black/40 rounded border border-white/20">
                                <button onClick={() => setEditExpValue(v => Math.max(0, v - 1))} className="px-2 py-0.5 hover:bg-white/10 text-white">-</button>
                                <span className="w-8 text-center font-bold text-emerald-400">+{editExpValue}</span>
                                <button onClick={() => setEditExpValue(v => v + 1)} className="px-2 py-0.5 hover:bg-white/10 text-white">+</button>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => setEditingExpIndex(null)} className="p-1 text-gray-400 hover:text-white"><X size={16} /></button>
                                <button onClick={saveEditExperience} className="p-1 text-green-400 hover:text-green-300"><Check size={16} /></button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <div
                              onClick={() => startEditExperience(index, exp)}
                              className="font-bold text-white cursor-pointer flex items-center gap-2 hover:text-emerald-400 transition-colors"
                            >
                              {exp.name}
                              <Pencil size={12} className="text-gray-600 opacity-50" />
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-emerald-400 font-medium">+{exp.value}</div>
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
                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3">
                      <div className="text-sm text-emerald-400">
                        <strong>Intelligent Training:</strong> +{localCompanion.level_up_options.intelligent} bonus to all Companion Experience rolls
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'training' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    Select training options gained through level-ups. Some options can be taken multiple times.
                  </p>

                  {LEVEL_UP_OPTIONS.map(option => {
                    const value = localCompanion.level_up_options[option.key as keyof typeof localCompanion.level_up_options];
                    const isActive = option.multi ? (value as number) > 0 : value as boolean;
                    const count = option.multi ? value as number : 0;

                    return (
                      <div
                        key={option.key}
                        className={clsx(
                          "rounded-lg p-4 border transition-colors",
                          isActive
                            ? `bg-${option.color}-900/20 border-${option.color}-500/30`
                            : "bg-black/20 border-white/10"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className={clsx(
                                "font-bold",
                                isActive ? `text-${option.color}-400` : "text-white"
                              )}>
                                {option.name}
                              </h4>
                              {option.multi && count > 0 && (
                                <span className={`text-xs bg-${option.color}-500/20 text-${option.color}-400 px-2 py-0.5 rounded font-bold`}>
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
                                    isActive
                                      ? "bg-emerald-500 text-black"
                                      : "bg-white/10 hover:bg-white/20 text-white"
                                  )}
                                >
                                  <ChevronUp size={16} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => toggleLevelUpOption(option.key, false)}
                                className={clsx(
                                  "w-8 h-8 rounded border-2 transition-colors",
                                  isActive
                                    ? "bg-emerald-500 border-emerald-400"
                                    : "bg-transparent border-gray-600 hover:border-emerald-500"
                                )}
                              >
                                {isActive && <Check size={16} className="mx-auto text-black" />}
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
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
