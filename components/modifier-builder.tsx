'use client';

/**
 * MODIFIER BUILDER COMPONENT
 * ----------------------------------------------------------------------------
 * A reusable UI component for visually composing modifiers for homebrew items.
 *
 * FUNCTIONALITY:
 * - Add Modifier: Opens a form to create new modifiers with target, value, operator
 * - Edit/Delete: Modify or remove existing modifiers
 * - Preview: Shows auto-generated description for each modifier
 * - Validation: Ensures required fields are filled and values are numeric
 */

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import clsx from 'clsx';
import { Modifier, ModifierOperator, CharacterStat } from '@/types/modifiers';

interface ModifierBuilderProps {
  modifiers: Modifier[];
  onChange: (modifiers: Modifier[]) => void;
}

const STAT_OPTIONS: { value: CharacterStat | string; label: string }[] = [
  { value: 'agility', label: 'Agility' },
  { value: 'strength', label: 'Strength' },
  { value: 'finesse', label: 'Finesse' },
  { value: 'instinct', label: 'Instinct' },
  { value: 'presence', label: 'Presence' },
  { value: 'knowledge', label: 'Knowledge' },
  { value: 'evasion', label: 'Evasion' },
  { value: 'armor', label: 'Armor' },
  { value: 'hp', label: 'Hit Points' },
  { value: 'stress', label: 'Stress' },
  { value: 'hope', label: 'Hope' },
  { value: 'proficiency', label: 'Proficiency' },
];

const OPERATOR_OPTIONS: { value: ModifierOperator; label: string }[] = [
  { value: 'add', label: 'Add (+)' },
  { value: 'subtract', label: 'Subtract (-)' },
  { value: 'multiply', label: 'Multiply (×)' },
  { value: 'divide', label: 'Divide (÷)' },
  { value: 'set', label: 'Set (=)' },
];

export default function ModifierBuilder({ modifiers, onChange }: ModifierBuilderProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [target, setTarget] = useState<CharacterStat | string>('agility');
  const [value, setValue] = useState<string>('1');
  const [operator, setOperator] = useState<ModifierOperator>('add');
  const [condition, setCondition] = useState<string>('');

  const resetForm = () => {
    setTarget('agility');
    setValue('1');
    setOperator('add');
    setCondition('');
    setIsAdding(false);
    setEditingId(null);
  };

  const generateDescription = (mod: { target: string; value: number; operator: ModifierOperator; condition?: string }) => {
    const statLabel = STAT_OPTIONS.find(s => s.value === mod.target)?.label || mod.target;
    let desc = '';

    if (mod.operator === 'add') desc = `+${mod.value} to ${statLabel}`;
    else if (mod.operator === 'subtract') desc = `-${mod.value} to ${statLabel}`;
    else if (mod.operator === 'multiply') desc = `×${mod.value} to ${statLabel}`;
    else if (mod.operator === 'divide') desc = `÷${mod.value} to ${statLabel}`;
    else if (mod.operator === 'set') desc = `Set ${statLabel} to ${mod.value}`;

    if (mod.condition) desc += ` (${mod.condition})`;

    return desc;
  };

  const handleAdd = () => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      alert('Value must be a number');
      return;
    }

    const newModifier: Modifier = {
      id: crypto.randomUUID(),
      type: 'stat',
      target: target as CharacterStat,
      value: numValue,
      operator,
      condition: condition || undefined,
      description: generateDescription({ target, value: numValue, operator, condition }),
    };

    onChange([...modifiers, newModifier]);
    resetForm();
  };

  const handleEdit = (mod: Modifier) => {
    setEditingId(mod.id);
    setTarget(mod.target);
    setValue(mod.value.toString());
    setOperator(mod.operator);
    setCondition(mod.condition || '');
    setIsAdding(true);
  };

  const handleUpdate = () => {
    if (!editingId) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      alert('Value must be a number');
      return;
    }

    const updated = modifiers.map(m =>
      m.id === editingId
        ? {
            ...m,
            target: target as CharacterStat,
            value: numValue,
            operator,
            condition: condition || undefined,
            description: generateDescription({ target, value: numValue, operator, condition }),
          }
        : m
    );

    onChange(updated);
    resetForm();
  };

  const handleDelete = (id: string) => {
    onChange(modifiers.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Modifiers</h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-dagger-gold text-black text-sm font-bold rounded-full hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={16} />
            Add Modifier
          </button>
        )}
      </div>

      {/* Modifier List */}
      {modifiers.length === 0 && !isAdding && (
        <div className="text-center text-gray-600 italic py-4 text-sm">
          No modifiers yet. Click &ldquo;Add Modifier&rdquo; to create one.
        </div>
      )}

      {modifiers.map(mod => (
        <div
          key={mod.id}
          className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3"
        >
          <div className="flex-1">
            <div className="font-bold text-white text-sm">{mod.description}</div>
            <div className="text-xs text-gray-500 uppercase mt-0.5">
              {mod.target} • {mod.operator} • {mod.value}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(mod)}
              className="p-1.5 text-blue-400 hover:bg-white/10 rounded transition-colors"
              title="Edit modifier"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleDelete(mod.id)}
              className="p-1.5 text-red-400 hover:bg-white/10 rounded transition-colors"
              title="Delete modifier"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-black/40 border border-dagger-gold/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-dagger-gold">
              {editingId ? 'Edit Modifier' : 'New Modifier'}
            </h4>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-white"
              title="Cancel"
            >
              <X size={18} />
            </button>
          </div>

          {/* Target Stat */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Target Stat</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full p-2 rounded bg-black/40 border border-white/20 text-white text-sm focus:border-dagger-gold outline-none"
            >
              {STAT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Operator */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Operator</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as ModifierOperator)}
              className="w-full p-2 rounded bg-black/40 border border-white/20 text-white text-sm focus:border-dagger-gold outline-none"
            >
              {OPERATOR_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Value */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Value</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full p-2 rounded bg-black/40 border border-white/20 text-white text-sm focus:border-dagger-gold outline-none"
              placeholder="e.g., 2"
            />
          </div>

          {/* Condition (Optional) */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Condition <span className="text-gray-600">(optional)</span>
            </label>
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full p-2 rounded bg-black/40 border border-white/20 text-white text-sm focus:border-dagger-gold outline-none"
              placeholder="e.g., while unarmored"
            />
          </div>

          {/* Preview */}
          <div className="bg-white/5 border border-white/10 rounded p-2">
            <div className="text-xs text-gray-500 mb-1">Preview:</div>
            <div className="text-sm text-white font-medium">
              {generateDescription({ target, value: parseFloat(value) || 0, operator, condition })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              className="flex-1 py-2 bg-dagger-gold text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-all text-sm"
            >
              <Check size={16} className="inline mr-1" />
              {editingId ? 'Update' : 'Add'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-all text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
