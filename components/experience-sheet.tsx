'use client';

import React, { useState } from 'react';
import { X, Trash2, Check, Pencil, Plus } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Experience } from '@/types/modifiers';

interface ExperienceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  experiences: Experience[];
  onUpdateExperiences: (experiences: Experience[]) => void;
}

export default function ExperienceSheet({
  isOpen,
  onClose,
  experiences,
  onUpdateExperiences
}: ExperienceSheetProps) {
  // New Experience State
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState(2);

  // Edit State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState(0);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newExp: Experience = { name: newName.trim(), value: newValue };
    onUpdateExperiences([...experiences, newExp]);
    setNewName('');
    setNewValue(2);
  };

  const handleDelete = (index: number) => {
    const updated = experiences.filter((_, i) => i !== index);
    onUpdateExperiences(updated);
  };

  const startEdit = (index: number, exp: Experience) => {
    setEditingIndex(index);
    setEditName(exp.name);
    setEditValue(exp.value);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const updated = experiences.map((exp, i) => 
      i === editingIndex ? { name: editName, value: editValue } : exp
    );
    onUpdateExperiences(updated);
    setEditingIndex(null);
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
            <div className="flex justify-center p-3 cursor-pointer" onClick={onClose}>
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-white/10 text-center">
              <div className="text-lg font-serif font-bold text-white">Manage Experiences</div>
              <div className="text-xs text-gray-500">Add, edit, or remove experiences</div>
            </div>

            {/* Add New Section */}
            <div className="p-4 border-b border-white/10 bg-black/20 flex flex-col gap-3">
               <div className="text-xs font-bold text-gray-400 uppercase">Add New</div>
               <div className="flex items-center gap-2">
                 <input 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Experience Name..."
                    className="flex-1 bg-black/40 border border-white/20 rounded px-3 py-2 text-sm focus:border-dagger-gold outline-none text-white"
                 />
                 <div className="flex items-center bg-white/5 rounded border border-white/10">
                    <button onClick={() => setNewValue(v => v - 1)} className="px-2 py-1 hover:bg-white/10 text-white">-</button>
                    <span className="w-8 text-center font-bold text-dagger-gold">+{newValue}</span>
                    <button onClick={() => setNewValue(v => v + 1)} className="px-2 py-1 hover:bg-white/10 text-white">+</button>
                 </div>
               </div>
               <button 
                 onClick={handleAdd}
                 disabled={!newName.trim()}
                 className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                 <Plus size={16} /> Add Experience
               </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {experiences.length === 0 && (
                <div className="text-center text-gray-600 italic py-4">No experiences recorded.</div>
              )}
              
              {experiences.map((exp, index) => (
                <div key={index} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg p-3">
                  <div className="flex-1">
                    {editingIndex === index ? (
                      <div className="flex flex-col gap-2">
                        <input 
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-black/40 border border-white/20 rounded px-2 py-1 text-sm w-full focus:border-dagger-gold outline-none text-white"
                        />
                        <div className="flex items-center justify-between">
                           <div className="flex items-center bg-black/40 rounded border border-white/20">
                              <button onClick={() => setEditValue(v => v - 1)} className="px-2 py-0.5 hover:bg-white/10 text-white">-</button>
                              <span className="w-8 text-center font-bold text-dagger-gold">+{editValue}</span>
                              <button onClick={() => setEditValue(v => v + 1)} className="px-2 py-0.5 hover:bg-white/10 text-white">+</button>
                           </div>
                           <div className="flex gap-2">
                             <button onClick={() => setEditingIndex(null)} className="p-1 text-gray-400 hover:text-white"><X size={16}/></button>
                             <button onClick={saveEdit} className="p-1 text-green-400 hover:text-green-300"><Check size={16}/></button>
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <div onClick={() => startEdit(index, exp)} className="font-bold text-white cursor-pointer flex items-center gap-2 hover:text-dagger-gold transition-colors">
                          {exp.name}
                          <Pencil size={12} className="text-gray-600 opacity-50" />
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-gray-400 font-medium">
                            +{exp.value}
                          </div>
                          <button onClick={() => handleDelete(index)} className="text-gray-500 hover:text-red-400 p-1">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
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
