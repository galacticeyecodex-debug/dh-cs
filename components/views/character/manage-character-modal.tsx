'use client';

/**
 * MANAGE CHARACTER MODAL
 * ----------------------------------------------------------------------------
 * A settings interface for modifying core character attributes and level state.
 *
 * FUNCTIONALITY:
 * - Level Management:
 *   - "Level Up": Triggers the Level Up flow if increasing the current level.
 *   - "De-Level": Allows reducing the character's level, which triggers a destructive confirmation
 *     dialog as it removes associated advancements.
 * - Attribute Editing: Enables changing Name, Ancestry (including Mixed Ancestry), and Community.
 *   - Fetches available options for Ancestry/Community dynamically from the library.
 *   - Mixed Ancestry: Allows selecting two ancestries and one feature from each.
 * - Validation: Ensures required fields are present and warns users about data loss during de-leveling.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { AppIcons } from '@/lib/icon-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { dataService } from '@/lib/data-service';
import { ErrorBoundary } from '@/components/core/error-boundary';
import { Z_INDEX } from '@/constants/z-index';
import clsx from 'clsx';
import useContentAccess from '@/hooks/useContentAccess';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AncestryFeature {
  name: string;
  text?: string;
  [key: string]: any;
}

interface AncestryData {
  id: string;
  name: string;
  data?: {
    features?: AncestryFeature[];
    [key: string]: any;
  };
}

interface ManageCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  currentName: string;
  currentAncestry?: string;
  currentAncestryFeatures?: any[];
  currentCommunity?: string;
  currentTransformation?: string;
  currentSpellcastTrait?: string;
  advancementHistory?: Record<string, any>;
  onUpdate?: (updates: {
    name?: string;
    level?: number;
    ancestry?: string;
    ancestry_features?: any[];
    community?: string;
    transformation?: string;
    spellcast_trait?: string;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  isLoading?: boolean;
  onLevelUp?: () => void;
}


export default function ManageCharacterModal({
  isOpen,
  onClose,
  currentLevel,
  currentName,
  currentAncestry = '',
  currentAncestryFeatures = [],
  currentCommunity = '',
  currentTransformation = '',
  currentSpellcastTrait = '',
  advancementHistory = {},
  onUpdate,
  onDelete,
  isLoading = false,
  onLevelUp,
}: ManageCharacterModalProps) {
  const { includePlaytest } = useContentAccess();
  const [name, setName] = useState<string>(currentName);
  const [level, setLevel] = useState<number>(currentLevel);
  const [community, setCommunity] = useState<string>(currentCommunity);
  const [transformation, setTransformation] = useState<string>(currentTransformation || 'none');
  const [spellcastTrait, setSpellcastTrait] = useState<string>(currentSpellcastTrait);
  const [error, setError] = useState<string>('');
  const [confirmDeLevelOpen, setConfirmDeLevelOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Mixed ancestry state
  const [isMixedAncestry, setIsMixedAncestry] = useState(false);
  const [primaryAncestryId, setPrimaryAncestryId] = useState<string>('');
  const [secondaryAncestryId, setSecondaryAncestryId] = useState<string>('');
  const [mixedAncestryName, setMixedAncestryName] = useState<string>('');
  const [primaryFeatureIndex, setPrimaryFeatureIndex] = useState<number>(0);
  const [secondaryFeatureIndex, setSecondaryFeatureIndex] = useState<number>(0);

  // Dynamic lists
  const [availableAncestries, setAvailableAncestries] = useState<AncestryData[]>([]);
  const [availableCommunities, setAvailableCommunities] = useState<{ name: string }[]>([]);
  const [availableTransformations, setAvailableTransformations] = useState<{ name: string; source?: string }[]>([]);

  // Derived ancestry data
  const primaryAncestry = useMemo(() =>
    availableAncestries.find(a => a.id === primaryAncestryId),
    [availableAncestries, primaryAncestryId]
  );

  const secondaryAncestry = useMemo(() =>
    availableAncestries.find(a => a.id === secondaryAncestryId),
    [availableAncestries, secondaryAncestryId]
  );

  const suggestedMixedName = useMemo(() => {
    if (primaryAncestry && secondaryAncestry) {
      return `${primaryAncestry.name}-${secondaryAncestry.name}`;
    }
    return '';
  }, [primaryAncestry, secondaryAncestry]);

  // Compute effective ancestry name for single ancestry mode
  const singleAncestryName = useMemo(() => {
    if (!isMixedAncestry && primaryAncestryId) {
      return primaryAncestry?.name || '';
    }
    return '';
  }, [isMixedAncestry, primaryAncestryId, primaryAncestry]);

  // Helper to find ancestry by feature name
  const findAncestryByFeature = useCallback((features: any[]) => {
    if (!features || features.length < 2) return;

    for (const anc of availableAncestries) {
      if (anc.data?.features) {
        const idx1 = anc.data.features.findIndex(
          (f: AncestryFeature) => f.name === features[0]?.name
        );
        if (idx1 >= 0) {
          setPrimaryAncestryId(anc.id);
          setPrimaryFeatureIndex(idx1);
          break;
        }
      }
    }

    for (const anc of availableAncestries) {
      if (anc.data?.features) {
        const idx2 = anc.data.features.findIndex(
          (f: AncestryFeature) => f.name === features[1]?.name
        );
        if (idx2 >= 0) {
          setSecondaryAncestryId(anc.id);
          setSecondaryFeatureIndex(idx2);
          break;
        }
      }
    }
  }, [availableAncestries]);

  // Fetch dynamic options on mount
  React.useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [ancestries, communities, transformations] = await Promise.all([
          dataService.library.getByType('ancestry'),
          dataService.library.getByType('community'),
          dataService.library.getByType('transformation', { includePlaytest })
        ]);

        if (ancestries) setAvailableAncestries(ancestries as AncestryData[]);
        if (communities) setAvailableCommunities(communities);
        if (transformations) setAvailableTransformations(transformations);
      } catch (e) {
        console.error("Failed to load options", e);
      }
    };

    if (isOpen) fetchOptions();
  }, [isOpen, includePlaytest]);

  // Sync state with props when modal opens
  React.useEffect(() => {
    if (isOpen && availableAncestries.length > 0) {
      setName(currentName || '');
      setLevel(currentLevel);
      setCommunity(currentCommunity || '');
      setTransformation(currentTransformation || '');
      setSpellcastTrait(currentSpellcastTrait || '');

      // Detect if character has mixed ancestry (2 features from different ancestries)
      const hasMixedAncestry = currentAncestryFeatures && currentAncestryFeatures.length === 2;

      if (hasMixedAncestry && currentAncestry) {
        setIsMixedAncestry(true);
        // Try to parse ancestry name to find the two ancestries
        // Format is usually "Ancestry1-Ancestry2" or a custom name
        const parts = currentAncestry.split('-');
        if (parts.length === 2) {
          const anc1 = availableAncestries.find(a => a.name === parts[0]);
          const anc2 = availableAncestries.find(a => a.name === parts[1]);
          if (anc1 && anc2) {
            setPrimaryAncestryId(anc1.id);
            setSecondaryAncestryId(anc2.id);
            setMixedAncestryName(''); // It was auto-generated

            // Try to find which feature index matches
            if (anc1.data?.features && currentAncestryFeatures[0]) {
              const idx = anc1.data.features.findIndex(
                (f: AncestryFeature) => f.name === currentAncestryFeatures[0].name
              );
              setPrimaryFeatureIndex(idx >= 0 ? idx : 0);
            }
            if (anc2.data?.features && currentAncestryFeatures[1]) {
              const idx = anc2.data.features.findIndex(
                (f: AncestryFeature) => f.name === currentAncestryFeatures[1].name
              );
              setSecondaryFeatureIndex(idx >= 0 ? idx : 0);
            }
          } else {
            // Custom mixed ancestry name - try to match features to ancestries
            setMixedAncestryName(currentAncestry);
            findAncestryByFeature(currentAncestryFeatures);
          }
        } else {
          // Custom mixed ancestry name
          setMixedAncestryName(currentAncestry);
          findAncestryByFeature(currentAncestryFeatures);
        }
      } else {
        // Single ancestry
        setIsMixedAncestry(false);
        const matchedAncestry = availableAncestries.find(a => a.name === currentAncestry);
        setPrimaryAncestryId(matchedAncestry?.id || '');
        setSecondaryAncestryId('');
        setMixedAncestryName('');
        setPrimaryFeatureIndex(0);
        setSecondaryFeatureIndex(0);
      }
    }
  }, [isOpen, currentName, currentLevel, currentAncestry, currentAncestryFeatures, currentCommunity, currentTransformation, currentSpellcastTrait, availableAncestries, findAncestryByFeature]);

  if (!isOpen) return null;

  const isDeLeveling = level < currentLevel;

  // Compute the effective ancestry value
  const getEffectiveAncestry = () => {
    if (isMixedAncestry) {
      return mixedAncestryName || suggestedMixedName;
    }
    return singleAncestryName;
  };

  // Compute ancestry features array
  const getAncestryFeatures = (): any[] => {
    if (isMixedAncestry && primaryAncestry && secondaryAncestry) {
      const feat1 = primaryAncestry.data?.features?.[primaryFeatureIndex];
      const feat2 = secondaryAncestry.data?.features?.[secondaryFeatureIndex];
      return [feat1, feat2].filter(Boolean);
    } else if (!isMixedAncestry && primaryAncestry) {
      // Single ancestry: include all features
      return primaryAncestry.data?.features || [];
    }
    return [];
  };

  const hasChanges =
    name !== currentName ||
    level !== currentLevel ||
    getEffectiveAncestry() !== currentAncestry ||
    community !== currentCommunity ||
    (transformation === 'none' ? '' : transformation) !== currentTransformation ||
    spellcastTrait !== currentSpellcastTrait ||
    JSON.stringify(getAncestryFeatures()) !== JSON.stringify(currentAncestryFeatures);

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

    const effectiveAncestry = getEffectiveAncestry();
    if (!effectiveAncestry || !community) {
      setError('Ancestry and Community are required');
      return;
    }

    if (isMixedAncestry && (!primaryAncestryId || !secondaryAncestryId)) {
      setError('Both ancestries must be selected for mixed ancestry');
      return;
    }

    if (isDeLeveling) {
      setConfirmDeLevelOpen(true);
      return;
    }

    await performUpdate();
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (confirm(`Are you sure you want to delete ${currentName}? This action is permanent and cannot be undone.`)) {
      setIsDeleting(true);
      try {
        await onDelete();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete character');
        setIsDeleting(false);
      }
    }
  };

  const performUpdate = async () => {
    if (onUpdate) {
      try {
        const effectiveAncestry = getEffectiveAncestry();
        const ancestryFeatures = getAncestryFeatures();
        const effectiveTransformation = transformation === 'none' ? '' : transformation;

        await onUpdate({
          name: name !== currentName ? name : undefined,
          level: level !== currentLevel ? level : undefined,
          ancestry: effectiveAncestry !== currentAncestry ? effectiveAncestry : undefined,
          ancestry_features: JSON.stringify(ancestryFeatures) !== JSON.stringify(currentAncestryFeatures) ? ancestryFeatures : undefined,
          community: community !== currentCommunity ? community : undefined,
          transformation: effectiveTransformation !== currentTransformation ? effectiveTransformation : undefined,
          spellcast_trait: spellcastTrait !== currentSpellcastTrait ? spellcastTrait : undefined,
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update character');
      }
    }
  };

  const handleMixedAncestryToggle = (enabled: boolean) => {
    setIsMixedAncestry(enabled);
    if (!enabled) {
      setSecondaryAncestryId('');
      setMixedAncestryName('');
      setSecondaryFeatureIndex(0);
    }
  };

  const renderFeatureCard = (
    feature: AncestryFeature,
    isSelected: boolean,
    onClick: () => void,
    key: React.Key
  ) => (
    <div
      key={key}
      onClick={onClick}
      className={clsx(
        "p-2 border rounded text-xs transition-all cursor-pointer",
        isSelected
          ? "bg-dagger-gold/20 border-dagger-gold/40 text-dagger-gold ring-1 ring-offset-1 ring-offset-black ring-white/20 scale-[1.02]"
          : "bg-white/5 border-white/5 opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0"
      )}
    >
      <span className="font-bold uppercase tracking-tight">{feature.name}</span>
      <p className="text-gray-400 mt-1 line-clamp-2">{feature.text?.replace(/\*\*/g, '')}</p>
    </div>
  );

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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              style={{ zIndex: Z_INDEX.MODAL }}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-dagger-panel border-t border-red-700/30 rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col"
              style={{ zIndex: Z_INDEX.MODAL }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center p-3" onClick={() => setConfirmDeLevelOpen(false)}>
                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 pb-4 border-b border-red-700/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AppIcons.system.error size={24} className="text-red-500" />
                  <h2 className="text-xl font-bold text-red-200">Confirm De-Level</h2>
                </div>
                <button
                  onClick={() => setConfirmDeLevelOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <AppIcons.ui.close size={24} />
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
                  className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:border-white/30 transition-colors font-bold"
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
        <ErrorBoundary>
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              style={{ zIndex: Z_INDEX.MODAL }}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-dagger-panel border-t border-white/10 rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col"
              style={{ zIndex: Z_INDEX.MODAL }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center p-3" onClick={onClose}>
                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 pb-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AppIcons.ui.settings size={24} className="text-dagger-gold" />
                  <h2 className="text-xl font-bold text-white">Manage Character</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <AppIcons.ui.close size={24} />
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
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:border-dagger-gold outline-none transition-colors"
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
                      className="px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-gray-300 hover:text-white hover:border-dagger-gold/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <AppIcons.ui.remove size={20} />
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
                      disabled={level >= 10}
                      className={
                        level >= currentLevel
                          ? "px-3 py-2 rounded-lg bg-dagger-gold text-black hover:bg-dagger-gold/90 transition-colors shadow-[0_0_10px_rgba(251,191,36,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                          : "px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-gray-300 hover:text-white hover:border-dagger-gold/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      }
                    >
                      {level >= currentLevel ? <AppIcons.combat.activation size={20} className="fill-black" /> : <AppIcons.ui.add size={20} />}
                    </button>
                  </div>
                  {isDeLeveling && (
                    <p className="text-xs text-yellow-200 mt-2">
                      {getLeveledUpString()}
                    </p>
                  )}
                </div>

                {/* Mixed Ancestry Toggle */}
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
                  <input
                    type="checkbox"
                    id="is_mixed_ancestry"
                    checked={isMixedAncestry}
                    onChange={(e) => handleMixedAncestryToggle(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-black/20 text-dagger-gold focus:ring-dagger-gold"
                  />
                  <label htmlFor="is_mixed_ancestry" className="text-sm font-medium text-gray-200 cursor-pointer">
                    Mixed Ancestry (Hybrid)
                  </label>
                </div>

                {/* Custom Mixed Ancestry Name */}
                {isMixedAncestry && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-bold text-gray-300 mb-2">
                      Custom Ancestry Name
                    </label>
                    <input
                      type="text"
                      value={mixedAncestryName}
                      onChange={(e) => setMixedAncestryName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:border-dagger-gold outline-none transition-colors font-bold"
                      placeholder={suggestedMixedName || "e.g. Toothling"}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to use &quot;{suggestedMixedName || 'Ancestry1-Ancestry2'}&quot;
                    </p>
                  </div>
                )}

                {/* Primary Ancestry */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    {isMixedAncestry ? 'Primary Ancestry' : 'Ancestry'}
                  </label>
                  <Select
                    value={primaryAncestryId}
                    onValueChange={(val) => {
                      setPrimaryAncestryId(val);
                      setPrimaryFeatureIndex(0);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an ancestry..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAncestries.map((anc) => (
                        <SelectItem key={anc.id} value={anc.id}>
                          {anc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Primary Ancestry Features */}
                  {primaryAncestry?.data?.features && (
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      {isMixedAncestry ? (
                        <>
                          <p className="text-[10px] text-gray-500 uppercase font-bold ml-1">Select one feature:</p>
                          {primaryAncestry.data.features.map((feat: AncestryFeature, i: number) => (
                            renderFeatureCard(
                              feat,
                              primaryFeatureIndex === i,
                              () => setPrimaryFeatureIndex(i),
                              i
                            )
                          ))}
                        </>
                      ) : (
                        primaryAncestry.data.features.map((feat: AncestryFeature, i: number) => (
                          <div key={i} className="p-2 bg-dagger-gold/10 border border-dagger-gold/20 rounded text-xs opacity-80">
                            <span className="font-bold text-dagger-gold uppercase tracking-tight">{feat.name}</span>
                            <p className="text-gray-400 mt-1">{feat.text?.replace(/\*\*/g, '')}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Secondary Ancestry (Mixed only) */}
                {isMixedAncestry && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 border-t border-white/5 pt-4">
                    <label className="block text-sm font-bold text-gray-300 mb-2">
                      Secondary Ancestry
                    </label>
                    <Select
                      value={secondaryAncestryId}
                      onValueChange={(val) => {
                        setSecondaryAncestryId(val);
                        setSecondaryFeatureIndex(0);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an ancestry..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAncestries.map((anc) => (
                          <SelectItem key={anc.id} value={anc.id}>
                            {anc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Secondary Ancestry Features */}
                    {secondaryAncestry?.data?.features && (
                      <div className="mt-2 grid grid-cols-1 gap-2">
                        <p className="text-[10px] text-gray-500 uppercase font-bold ml-1">Select one feature:</p>
                        {secondaryAncestry.data.features.map((feat: AncestryFeature, i: number) => (
                          renderFeatureCard(
                            feat,
                            secondaryFeatureIndex === i,
                            () => setSecondaryFeatureIndex(i),
                            i
                          )
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Community */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Community
                  </label>
                  <Select value={community} onValueChange={setCommunity}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a community..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCommunities.map((com) => (
                        <SelectItem key={com.name} value={com.name}>
                          {com.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Transformation */}
                {includePlaytest && availableTransformations.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                      Transformation
                      <span className="text-xs text-purple-400 font-normal">(Playtest)</span>
                    </label>
                    <Select value={transformation} onValueChange={setTransformation}>
                      <SelectTrigger className="w-full border-purple-500/30 focus:ring-purple-500">
                        <SelectValue placeholder="None (no transformation)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (no transformation)</SelectItem>
                        {availableTransformations.map((t) => (
                          <SelectItem key={t.name} value={t.name}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Transformations are typically awarded by the GM during play.
                    </p>
                  </div>
                )}

                {/* Spellcast Trait */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Spellcast Trait
                  </label>
                  <Select value={spellcastTrait} onValueChange={setSpellcastTrait}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a trait..." />
                    </SelectTrigger>
                    <SelectContent>
                      {['Agility', 'Strength', 'Finesse', 'Instinct', 'Presence', 'Knowledge'].map((trait) => (
                        <SelectItem key={trait} value={trait}>
                          {trait}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-200 text-sm">
                    {error}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-white/10 px-6 py-4 flex gap-3 justify-between items-center">
                <div>
                  {onDelete && (
                    <button
                      onClick={handleDelete}
                      disabled={isLoading || isDeleting}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors text-sm font-bold disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <span className="inline-block w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <AppIcons.ui.delete size={16} />
                      )}
                      Delete Character
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:border-white/30 transition-colors font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || isLoading || isDeleting}
                    className="px-4 py-2 rounded-lg bg-dagger-gold text-black font-bold hover:bg-dagger-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        </ErrorBoundary>
      )}
    </AnimatePresence>
  );
}
