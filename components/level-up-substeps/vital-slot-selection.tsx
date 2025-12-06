'use client';

import React from 'react';
import { Plus, Minus, Heart, Zap } from 'lucide-react';

interface VitalSlotSelectionProps {
  selectedAdvancements: string[];
  currentHpMax?: number;
  currentStressMax?: number;
  hpSlotsAdded?: number;
  stressSlotsAdded?: number;
  onSetHpSlots: (count: number) => void;
  onSetStressSlots: (count: number) => void;
}

export default function VitalSlotSelection({
  selectedAdvancements,
  currentHpMax = 0,
  currentStressMax = 0,
  hpSlotsAdded = 1,
  stressSlotsAdded = 1,
  onSetHpSlots,
  onSetStressSlots,
}: VitalSlotSelectionProps) {
  const hasHp = selectedAdvancements.includes('add_hp');
  const hasStress = selectedAdvancements.includes('add_stress');

  const adjustHp = (delta: number) => {
    const newValue = Math.max(1, Math.min(5, hpSlotsAdded + delta));
    onSetHpSlots(newValue);
  };

  const adjustStress = (delta: number) => {
    const newValue = Math.max(1, Math.min(5, stressSlotsAdded + delta));
    onSetStressSlots(newValue);
  };

  // Edge case: neither advancement selected
  if (!hasHp && !hasStress) {
    return (
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Configure Vital Slots</h3>
        <div className="p-4 bg-gray-800/40 border border-gray-700 rounded-lg text-gray-400 text-sm">
          No vital slot advancements selected. This step will be skipped.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-2">Configure Vital Slots</h3>
      <p className="text-gray-400 mb-4">
        Choose how many slots to add (1-5) for each vital advancement you selected.
      </p>

      <div className="space-y-4">
        {hasHp && (
          <div className="p-4 bg-black/30 rounded-lg border border-dagger-gold/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center">
                <Heart size={20} className="text-red-400" />
              </div>
              <div>
                <p className="font-bold text-white">Hit Points</p>
                <p className="text-sm text-gray-400">Add permanent HP slots</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => adjustHp(-1)}
                  disabled={hpSlotsAdded <= 1}
                  className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <Minus size={16} className="text-white" />
                </button>
                <div className="w-16 text-center">
                  <span className="text-2xl font-bold text-white">+{hpSlotsAdded}</span>
                </div>
                <button
                  onClick={() => adjustHp(1)}
                  disabled={hpSlotsAdded >= 5}
                  className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <Plus size={16} className="text-white" />
                </button>
              </div>

              <div className="text-right">
                <div className="flex items-baseline gap-2">
                  <span className="text-gray-400">{currentHpMax}</span>
                  <span className="text-dagger-gold">→</span>
                  <span className="text-xl font-bold text-dagger-gold">
                    {currentHpMax + hpSlotsAdded}
                  </span>
                </div>
                <p className="text-xs text-gray-500">New max HP</p>
              </div>
            </div>
          </div>
        )}

        {hasStress && (
          <div className="p-4 bg-black/30 rounded-lg border border-dagger-gold/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center">
                <Zap size={20} className="text-purple-400" />
              </div>
              <div>
                <p className="font-bold text-white">Stress</p>
                <p className="text-sm text-gray-400">Add permanent Stress slots</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => adjustStress(-1)}
                  disabled={stressSlotsAdded <= 1}
                  className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <Minus size={16} className="text-white" />
                </button>
                <div className="w-16 text-center">
                  <span className="text-2xl font-bold text-white">+{stressSlotsAdded}</span>
                </div>
                <button
                  onClick={() => adjustStress(1)}
                  disabled={stressSlotsAdded >= 5}
                  className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <Plus size={16} className="text-white" />
                </button>
              </div>

              <div className="text-right">
                <div className="flex items-baseline gap-2">
                  <span className="text-gray-400">{currentStressMax}</span>
                  <span className="text-dagger-gold">→</span>
                  <span className="text-xl font-bold text-dagger-gold">
                    {currentStressMax + stressSlotsAdded}
                  </span>
                </div>
                <p className="text-xs text-gray-500">New max Stress</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-black/30 border border-gray-600 rounded-lg text-gray-300 text-sm">
        <p className="font-bold mb-1">Tip:</p>
        <p>You can add 1-5 slots per advancement. Choose wisely based on your playstyle!</p>
      </div>
    </div>
  );
}
