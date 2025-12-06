'use client';

import React, { useState } from 'react';
import { X, AlertCircle, Settings, Plus, Minus, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import createClient from '@/lib/supabase/client';

interface ManageCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  currentName: string;
  currentAncestry?: string;
  currentCommunity?: string;
  advancementHistory?: Record<string, any>;
  onUpdate?: (updates: {
    name?: string;
    level?: number;
    ancestry?: string;
    community?: string;
  }) => Promise<void>;
  isLoading?: boolean;
  onLevelUp?: () => void;
}


export default function ManageCharacterModal({
  isOpen,
  onClose,
  currentLevel,
  currentName,
  currentAncestry = '',
  currentCommunity = '',
  advancementHistory = {},
  onUpdate,
  isLoading = false,
  onLevelUp,
}: ManageCharacterModalProps) {
  const [name, setName] = useState<string>(currentName);
  const [level, setLevel] = useState<number>(currentLevel);
  const [ancestry, setAncestry] = useState<string>(currentAncestry);
  const [community, setCommunity] = useState<string>(currentCommunity);
  const [error, setError] = useState<string>('');
  const [confirmDeLevelOpen, setConfirmDeLevelOpen] = useState(false);

  // Dynamic lists
  const [availableAncestries, setAvailableAncestries] = useState<{name: string}[]>([]);
  const [availableCommunities, setAvailableCommunities] = useState<{name: string}[]>([]);

  // Fetch dynamic options on mount
  React.useEffect(() => {
    const fetchOptions = async () => {
      const supabase = createClient();
      const { data: ancestries } = await supabase.from('library').select('name').eq('type', 'ancestry');
      const { data: communities } = await supabase.from('library').select('name').eq('type', 'community');

      if (ancestries) setAvailableAncestries(ancestries);
      if (communities) setAvailableCommunities(communities);
    };

    if (isOpen) fetchOptions();
  }, [isOpen]);

  // Sync state with props when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setName(currentName || '');
      setLevel(currentLevel);
      setAncestry(currentAncestry || '');
      setCommunity(currentCommunity || '');
    }
  }, [isOpen, currentName, currentLevel, currentAncestry, currentCommunity]);

  if (!isOpen) return null;

  const isDeLeveling = level < currentLevel;
  const hasChanges = name !== currentName || level !== currentLevel || ancestry !== currentAncestry || community !== currentCommunity;

  const getLeveledUpString = () => {
    const levels = Object.keys(advancementHistory)
      .filter(key => !isNaN(Number(key)) && Number(key) > level)
      .sort((a, b) => Number(b) - Number(a));

    if (levels.length === 0) return '';
    return `(will remove advancements from levels: ${levels.join(', ')})`;
  };

  const handleSave = async () => {
    setError('');

    if (level < 1 || level > currentLevel) {
      setError('Level can only be reduced');
      return;
    }

    if (!name || !name.trim()) {
      setError('Character name is required');
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
          name: name !== currentName ? name : undefined,
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
          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Character Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-gray-600 text-white focus:border-dagger-gold outline-none transition-colors"
              placeholder="Enter character name"
            />
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Level <span className="text-gray-500">(reduce or level up)</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => level > 1 && setLevel(level - 1)}
                disabled={level <= 1}
                className="px-3 py-2 rounded-lg bg-black/50 border border-gray-600 text-gray-300 hover:text-white hover:border-dagger-gold/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Minus size={20} />
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold text-dagger-gold">{level}</span>
              </div>
              <button
                onClick={() => {
                  if (level < currentLevel) {
                    setLevel(level + 1);
                  } else if (onLevelUp) {
                    onLevelUp();
                  }
                }}
                className={
                  level >= currentLevel
                    ? "px-3 py-2 rounded-lg bg-dagger-gold text-black hover:bg-dagger-gold/90 transition-colors shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                    : "px-3 py-2 rounded-lg bg-black/50 border border-gray-600 text-gray-300 hover:text-white hover:border-dagger-gold/50 transition-colors"
                }
              >
                {level >= currentLevel ? <Zap size={20} className="fill-black" /> : <Plus size={20} />}
              </button>
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
              {availableAncestries.map((anc) => (
                <option key={anc.name} value={anc.name}>
                  {anc.name}
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
              {availableCommunities.map((com) => (
                <option key={com.name} value={com.name}>
                  {com.name}
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
