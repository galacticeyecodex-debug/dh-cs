'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Pencil } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacterStore } from '@/store/character-store';

interface Modifier {
  id: string;
  name: string;
  value: number;
  source: 'user' | 'system';
}

interface ModifierSheetProps {
  isOpen: boolean;
  onClose: () => void;
  statLabel: string;
  baseValue: number;
  currentModifiers: Modifier[];
  onUpdateModifiers: (modifiers: Modifier[]) => void;
}

export default function ModifierSheet({
  isOpen,
  onClose,
  statLabel,
  baseValue,
  currentModifiers,
  onUpdateModifiers
}: ModifierSheetProps) {
  const [newModifierValue, setNewModifierValue] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Calculate Total
  const total = baseValue + currentModifiers.reduce((acc, mod) => acc + mod.value, 0);

  const handleAddQuick = (val: number) => {
    const newMod: Modifier = {
      id: crypto.randomUUID(),
      name: 'Adjustment',
      value: val,
      source: 'user'
    };
    onUpdateModifiers([...currentModifiers, newMod]);
  };

  const handleDelete = (id: string) => {
    onUpdateModifiers(currentModifiers.filter(m => m.id !== id));
  };

  const startEdit = (mod: Modifier) => {
    setEditingId(mod.id);
    setEditName(mod.name);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updated = currentModifiers.map(m => 
      m.id === editingId ? { ...m, name: editName } : m
    );
    onUpdateModifiers(updated);
    setEditingId(null);
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
            className="fixed bottom-0 left-0 right-0 z-50 bg-dagger-panel border-t border-white/10 rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center p-3" onClick={onClose}>
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Header / Total */}
            <div className="px-6 pb-4 border-b border-white/10 text-center">
              <div className="text-sm text-gray-400 uppercase tracking-wider font-bold">{statLabel}</div>
              <div className="text-6xl font-serif font-black text-white flex items-center justify-center gap-2">
                {total}
                {total !== baseValue && (
                  <span className="text-sm bg-dagger-gold text-black px-2 py-0.5 rounded-full font-bold align-top -mt-4">
                    MOD
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">Base Value: {baseValue}</div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 flex justify-center gap-3 border-b border-white/10 bg-black/20">
              <button onClick={() => handleAddQuick(-1)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-bold text-red-400">-1</button>
              <button onClick={() => handleAddQuick(1)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-bold text-green-400">+1</button>
              <button onClick={() => handleAddQuick(2)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-bold text-green-400">+2</button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {currentModifiers.length === 0 && (
                <div className="text-center text-gray-600 italic py-4">No modifiers active.</div>
              )}
              
              {currentModifiers.map(mod => (
                <div key={mod.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg p-3">
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
                        <button onClick={saveEdit} className="p-1 text-green-400 hover:bg-white/10 rounded"><Check size={16}/></button>
                      </div>
                    ) : (
                      <div onClick={() => mod.source === 'user' && startEdit(mod)} className={clsx("font-bold", mod.source === 'user' ? "text-white cursor-pointer flex items-center gap-2" : "text-gray-400")}>
                        {mod.name}
                        {mod.source === 'user' && <Pencil size={12} className="text-gray-600 opacity-50" />}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 uppercase">{mod.source}</div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={clsx("text-xl font-bold", mod.value >= 0 ? "text-green-400" : "text-red-400")}>
                      {mod.value >= 0 ? `+${mod.value}` : mod.value}
                    </div>
                    {mod.source === 'user' && (
                      <button onClick={() => handleDelete(mod.id)} className="text-gray-500 hover:text-red-400 p-1">
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}