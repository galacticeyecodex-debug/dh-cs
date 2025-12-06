'use client';

import React, { useState } from 'react';
import { X, AlertCircle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ManageCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  currentAncestry?: string;
  currentCommunity?: string;
  advancementHistory?: Record<string, any>;
  onUpdate?: (updates: {
    level?: number;
    ancestry?: string;
    community?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

const ANCESTRIES = [
  'Aarakocra',
  'Bugbear',
  'Dragonborn',
  'Dwarf',
  'Elf',
  'Fairy',
  'Goliath',
  'Half-Orc',
  'Halfling',
  'Human',
  'Kenku',
  'Orc',
  'Tabaxi',
  'Tiefling',
];

const COMMUNITIES = [
  'Caravan Folk',
  'City-Dweller',
  'Diasporic Refugee',
  'Island Shipfolk',
  'Outland Exile',
  'Shire-Folk',
  'Sunken Depths',
  'Temple Bound',
  'Underground Dweller',
  'Wandering Merchant',
  'Wild Folk',
  'Woodland Warden',
];

export default function ManageCharacterModal({
  isOpen,
  onClose,
  currentLevel,
  currentAncestry = '',
  currentCommunity = '',
  advancementHistory = {},
  onUpdate,
  isLoading = false,
}: ManageCharacterModalProps) {
  const [level, setLevel] = useState<number>(currentLevel);
  const [ancestry, setAncestry] = useState<string>(currentAncestry);
  const [community, setCommunity] = useState<string>(currentCommunity);
  const [error, setError] = useState<string>('');
  const [confirmDeLevelOpen, setConfirmDeLevelOpen] = useState(false);

  if (!isOpen) return null;

  const isLeveling = level > currentLevel;
  const isDeLeveling = level < currentLevel;
  const hasChanges = level !== currentLevel || ancestry !== currentAncestry || community !== currentCommunity;

  const getLeveledUpString = () => {
    const levels = Object.keys(advancementHistory)
      .filter(key => !isNaN(Number(key)) && Number(key) > level)
      .sort((a, b) => Number(b) - Number(a));

    if (levels.length === 0) return '';
    return `(will remove advancements from levels: ${levels.join(', ')})`;
  };

  const handleSave = async () => {
    setError('');

    if (level < 1 || level > 10) {
      setError('Level must be between 1 and 10');
      return;
    }

    if (!ancestry || !community) {
      setError('Ancestry and Community are required');
      return;
    }

    if (isDeLeveling) {
      setConfirmDeLevelOpen(true);
      return;
    }

    await performUpdate();
  };

  const performUpdate = async () => {
    if (onUpdate) {
      try {
        await onUpdate({
          level: level !== currentLevel ? level : undefined,
          ancestry: ancestry !== currentAncestry ? ancestry : undefined,
          community: community !== currentCommunity ? community : undefined,
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update character');
      }
    }
  };

  if (confirmDeLevelOpen) {
    return (
      <AnimatePresence>
        {confirmDeLevelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeLevelOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-dagger-panel border-t border-red-700/30 rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Drag Handle */}
              <div className="flex justify-center p-3" onClick={() => setConfirmDeLevelOpen(false)}>
                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 pb-4 border-b border-red-700/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle size={24} className="text-red-500" />
                  <h2 className="text-xl font-bold text-red-200">Confirm De-Level</h2>
                </div>
                <button
                  onClick={() => setConfirmDeLevelOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                <p className="text-gray-300">
                  You are about to reduce this character from level <span className="font-bold text-white">{currentLevel}</span> to level <span className="font-bold text-white">{level}</span>.
                </p>

                <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-lg text-red-200 text-sm space-y-2">
                  <p className="font-bold">This will remove:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>All advancements from levels {level + 1} to {currentLevel}</li>
                    <li>Any traits, stats, or features gained at those levels</li>
                    <li>Domain cards selected at those levels</li>
                  </ul>
                </div>

                <div className="p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg text-yellow-200 text-sm">
                  <p>
                    <span className="font-bold">Note:</span> Hit points, stress, and damage thresholds will be recalculated based on the new level.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-red-700/30 px-6 py-4 flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDeLevelOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 transition-colors font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setConfirmDeLevelOpen(false);
                    performUpdate();
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-bold"
                >
                  {isLoading ? 'Updating...' : 'Confirm De-Level'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

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

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-dagger-panel border-t border-white/10 rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Drag Handle */}
            <div className="flex justify-center p-3" onClick={onClose}>
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings size={24} className="text-dagger-gold" />
                <h2 className="text-xl font-bold text-white">Manage Character</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {/* Level */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Level <span className="text-gray-500">(1-10)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={10}
                value={level}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) setLevel(val);
                }}
                className="flex-1 px-3 py-2 rounded-lg bg-black/50 border border-gray-600 text-white focus:border-dagger-gold outline-none transition-colors"
              />
              <span className="text-gray-400 text-sm">
                {isLeveling ? '↑' : isDeLeveling ? '↓' : '='}
              </span>
            </div>
            {isDeLeveling && (
              <p className="text-xs text-yellow-200 mt-2">
                {getLeveledUpString()}
              </p>
            )}
          </div>

          {/* Ancestry */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Ancestry
            </label>
            <select
              value={ancestry}
              onChange={(e) => setAncestry(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-gray-600 text-white focus:border-dagger-gold outline-none transition-colors"
            >
              <option value="">Select an ancestry...</option>
              {ANCESTRIES.map((anc) => (
                <option key={anc} value={anc}>
                  {anc}
                </option>
              ))}
            </select>
          </div>

          {/* Community */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Community
            </label>
            <select
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-gray-600 text-white focus:border-dagger-gold outline-none transition-colors"
            >
              <option value="">Select a community...</option>
              {COMMUNITIES.map((com) => (
                <option key={com} value={com}>
                  {com}
                </option>
              ))}
            </select>
          </div>

              {error && (
                <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 transition-colors font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || isLoading}
                className="px-4 py-2 rounded-lg bg-dagger-gold text-black font-bold hover:bg-dagger-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
