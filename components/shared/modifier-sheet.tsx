'use client';

/**
 * MODIFIER SHEET COMPONENT
 * ----------------------------------------------------------------------------
 * A bottom-sheet interface for inspecting and modifying a specific character stat.
 * 
 * FUNCTIONALITY:
 * - Stat Breakdown: Displays the Base Value, active System Modifiers (e.g., from Armor), 
 *   and User Modifiers to show how the Final Total is calculated.
 * - Quick Adjustments: Provides a stepper interface to quickly add/remove temporary modifiers.
 * - Modifier Management: Allows users to rename or delete their manual adjustments.
 * - Source tracking: Visually distinguishes between 'System' (read-only) and 'User' (editable) modifiers.
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Pencil, Shield, ShieldOff, Users, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacterStore } from '@/store/character-store';
import SRDInfoButton from './srd-info-button';
import type { ModifierCondition } from '@/types/cards';
import { Z_INDEX } from '@/constants/z-index';

type ModifierSourceType = 'equipment' | 'domain_card' | 'user' | 'ancestry' | 'community' | 'class' | 'subclass' | 'system';


interface Modifier {
  id: string;
  name: string;
  value: number;
  source: ModifierSourceType;
  type?: string; // For visual distinction (equipment, domain_card, etc.)
  isActive?: boolean; // Whether condition is currently met
  condition?: ModifierCondition;
}

export interface ModifierTab {
  id: string;
  label: string;
  baseValue: number;
  currentModifiers: Modifier[];
  onUpdateModifiers: (modifiers: Modifier[]) => void;
}

interface ModifierSheetProps {
  isOpen: boolean;
  onClose: () => void;
  statLabel: string;
  baseValue: number;
  currentModifiers: Modifier[];
  onUpdateModifiers: (modifiers: Modifier[]) => void;
  tabs?: ModifierTab[];
}

export default function ModifierSheet({
  isOpen,
  onClose,
  statLabel,
  baseValue,
  currentModifiers,
  onUpdateModifiers,
  tabs
}: ModifierSheetProps) {
  // If tabs are provided, use them. Otherwise, create a single "virtual" tab from props.
  const effectiveTabs: ModifierTab[] = tabs && tabs.length > 0
    ? tabs
    : [{
      id: 'default',
      label: statLabel,
      baseValue,
      currentModifiers,
      onUpdateModifiers
    }];

  const [activeTabId, setActiveTabId] = useState<string>(effectiveTabs[0].id);
  const activeTab = effectiveTabs.find(t => t.id === activeTabId) || effectiveTabs[0];

  const [newModifierValue, setNewModifierValue] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Reset pending value when switching tabs
  useEffect(() => {
    setPendingValue(0);
    setEditingId(null);
  }, [activeTabId]);

  // Calculate Total
  const total = activeTab.baseValue + activeTab.currentModifiers.reduce((acc, mod) => acc + mod.value, 0);

  // Pending Value for Stepper
  const [pendingValue, setPendingValue] = useState(0);

  const handleApplyPending = () => {
    if (pendingValue === 0) return;

    const newMod: Modifier = {
      id: crypto.randomUUID(),
      name: 'Adjustment',
      value: pendingValue,
      source: 'user'
    };
    // CRITICAL FIX: Only spread USER modifiers, not system modifiers
    // currentModifiers includes equipment, ancestry, domain cards, etc.
    // We should only save user-editable modifiers back to the database
    const userModsOnly = activeTab.currentModifiers.filter(m => m.source === 'user');
    activeTab.onUpdateModifiers([...userModsOnly, newMod]);
    setPendingValue(0); // Reset after apply
  };

  const handleDelete = (id: string) => {
    // CRITICAL FIX: Only operate on USER modifiers when deleting
    // System modifiers should not be deleted from the user modifiers list
    const userModsOnly = activeTab.currentModifiers.filter(m => m.source === 'user');
    activeTab.onUpdateModifiers(userModsOnly.filter(m => m.id !== id));
  };

  const startEdit = (mod: Modifier) => {
    setEditingId(mod.id);
    setEditName(mod.name);
  };

  const saveEdit = () => {
    if (!editingId) return;
    // CRITICAL FIX: Only save to user modifiers, not all modifiers
    const userModsOnly = activeTab.currentModifiers.filter(m => m.source === 'user');
    const updated = userModsOnly.map(m =>
      m.id === editingId ? { ...m, name: editName } : m
    );
    activeTab.onUpdateModifiers(updated);
    setEditingId(null);
  };

  // Helper to get condition description
  const getConditionText = (condition?: Modifier['condition']): string | null => {
    if (!condition || condition.type === 'always') return null;

    switch (condition.type) {
      case 'when_armored':
        return 'While wearing armor';
      case 'when_unarmored':
        return 'While not wearing armor';
      case 'loadout_domain_count':
        return `When ${condition.minCount}+ ${condition.domain} cards in loadout`;
      case 'environment':
        return condition.requirement || 'Environment requirement';
      default:
        return null;
    }
  };

  // Helper to get condition icon
  const getConditionIcon = (condition?: Modifier['condition']) => {
    if (!condition || condition.type === 'always') return null;

    switch (condition.type) {
      case 'when_armored':
        return <Shield size={12} className="text-gray-500" />;
      case 'when_unarmored':
        return <ShieldOff size={12} className="text-gray-500" />;
      case 'loadout_domain_count':
        return <Users size={12} className="text-purple-400" />;
      case 'environment':
        return <AlertCircle size={12} className="text-orange-400" />;
      default:
        return null;
    }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: Z_INDEX.MODIFIER_SHEET }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-dagger-panel border-t border-white/10 rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col"
            style={{ zIndex: Z_INDEX.MODIFIER_SHEET }}
          >
            {/* Handle */}
            <div className="flex justify-center p-3" onClick={onClose}>
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Tabs (if multiple) */}
            {effectiveTabs.length > 1 && (
              <div className="flex overflow-x-auto border-b border-white/10 px-4 gap-4 no-scrollbar">
                {effectiveTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={clsx(
                      "py-3 px-1 text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap border-b-2",
                      activeTabId === tab.id
                        ? "text-dagger-gold border-dagger-gold"
                        : "text-gray-500 border-transparent hover:text-gray-300"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Header / Total */}
            <div className="px-6 pb-4 pt-4 border-b border-white/10 text-center">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-400 uppercase tracking-wider font-bold">{activeTab.label}</div>
                <SRDInfoButton ruleKey="equipment.general" size={12} title={activeTab.label} />
              </div>
              <div className="text-6xl font-serif font-black text-white flex items-center justify-center gap-2">
                {total}
                {total !== activeTab.baseValue && (
                  <span className="text-sm bg-dagger-gold text-black px-2 py-0.5 rounded-full font-bold align-top -mt-4">
                    MOD
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">Base Value: {activeTab.baseValue}</div>
            </div>

            {/* Stepper / Quick Actions */}
            <div className="p-4 border-b border-white/10 bg-black/20 flex flex-col items-center gap-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPendingValue(prev => prev - 1)}
                  aria-label="Decrease modifier"
                  className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-2xl font-bold text-white transition-colors"
                >
                  -
                </button>

                <div className={clsx(
                  "w-16 text-center text-3xl font-bold",
                  pendingValue > 0 ? "text-green-400" : pendingValue < 0 ? "text-red-400" : "text-gray-500"
                )}>
                  {pendingValue > 0 ? `+${pendingValue}` : pendingValue}
                </div>

                <button
                  onClick={() => setPendingValue(prev => prev + 1)}
                  aria-label="Increase modifier"
                  className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-2xl font-bold text-white transition-colors"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleApplyPending}
                disabled={pendingValue === 0}
                className="w-full py-3 bg-dagger-gold text-black font-bold rounded-full shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Apply Adjustment
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {activeTab.currentModifiers.length === 0 && (
                <div className="text-center text-gray-600 italic py-4">No modifiers active.</div>
              )}

              {activeTab.currentModifiers.map(mod => {
                const conditionText = getConditionText(mod.condition);
                const conditionIcon = getConditionIcon(mod.condition);
                const isInactive = mod.isActive === false;

                return (
                  <div key={mod.id} className={clsx(
                    "flex items-center justify-between rounded-lg p-3 border transition-all",
                    isInactive ? "bg-white/5 border-red-500/30 opacity-60" : "bg-white/5 border-white/5"
                  )}>
                    <div className="flex-1">
                      {editingId === mod.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm w-full focus:border-dagger-gold outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          />
                          <button onClick={saveEdit} aria-label="Save edit" className="p-1 text-green-400 hover:bg-white/10 rounded"><Check size={16} /></button>
                        </div>
                      ) : (
                        <div>
                          <div onClick={() => mod.source === 'user' && startEdit(mod)} className={clsx("font-bold flex items-center gap-2", mod.source === 'user' ? "text-white cursor-pointer" : "text-gray-400")}>
                            {mod.name}
                            {mod.source === 'user' && <Pencil size={12} className="text-gray-600 opacity-50" />}
                            {isInactive && <span className="text-[10px] bg-red-900/50 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded">INACTIVE</span>}
                          </div>
                          {conditionText && (
                            <div className="text-[10px] text-gray-500 italic flex items-center gap-1 mt-0.5">
                              {conditionIcon}
                              {conditionText}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 uppercase flex items-center gap-1 mt-1">
                        {mod.type === 'equipment' && <span className="bg-dagger-gold/20 text-dagger-gold px-1.5 rounded text-[10px] border border-dagger-gold/30">EQUIPMENT</span>}
                        {mod.type === 'domain_card' && <span className="bg-purple-900/50 text-purple-300 px-1.5 rounded text-[10px] border border-purple-500/30">DOMAIN CARD</span>}
                        {mod.source === 'system' && !mod.type && <span className="bg-blue-900/50 text-blue-300 px-1.5 rounded text-[10px]">SYSTEM</span>}
                        {mod.source === 'user' && <span className="bg-white/10 text-gray-400 px-1.5 rounded text-[10px]">USER</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={clsx("text-xl font-bold", isInactive ? "text-gray-600" : mod.value >= 0 ? "text-green-400" : "text-red-400")}>
                        {mod.value >= 0 ? `+${mod.value}` : mod.value}
                      </div>
                      {mod.source === 'user' && (
                        <button onClick={() => handleDelete(mod.id)} aria-label="Delete modifier" className="text-gray-500 hover:text-red-400 p-1">
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}