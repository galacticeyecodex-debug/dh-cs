'use client';

import React, { useState } from 'react';
import { X, Zap, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateTierAchievements, calculateNewDamageThresholds, getTier } from '@/lib/level-up-helpers';
import { validateNewLevel, validateAdvancementSelections } from '@/lib/level-up-validation';
import { getCardLevel, getCardDescription, getCardType, isCardInDomain, isCardAvailableAtLevel } from '@/lib/card-helpers';
import MulticlassSelection from './level-up-substeps/multiclass-selection';
import DomainExchange from './level-up-substeps/domain-exchange';
import TraitSelection from './level-up-substeps/trait-selection';
import ExperienceSelection from './level-up-substeps/experience-selection';
import VitalSlotSelection from './level-up-substeps/vital-slot-selection';
import { Character } from '@/store/character-store';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character; // Full character object needed for sub-steps
  domainCards?: any[]; // Library cards
  onComplete?: (options: {
    newLevel: number;
    selectedAdvancements: string[];
    selectedDomainCardId: string;
    multiclassId?: string;
    multiclassDomain?: string;
    exchangeExistingCardId?: string;
    traitIncrements?: { trait: string; amount: number }[];
    experienceIncrements?: { experienceId: string; amount: number }[];
    hpSlotsAdded?: number;
    stressSlotsAdded?: number;
  }) => Promise<void>;
  isLoading?: boolean;
}

const ADVANCEMENT_OPTIONS = [
  { id: 'increase_traits', name: 'Increase Traits', description: 'Choose 2 unmarked traits and gain +1 to them', cost: 1 },
  { id: 'add_hp', name: 'Add HP', description: 'Permanently increase max Hit Points by 1', cost: 1 },
  { id: 'add_stress', name: 'Add Stress', description: 'Permanently increase max Stress by 1', cost: 1 },
  { id: 'increase_experience', name: 'Increase Experience', description: 'Choose 2 experiences and gain +1 to both', cost: 1 },
  { id: 'domain_card', name: 'Additional Domain Card', description: 'Gain an additional domain card', cost: 1 },
  { id: 'increase_evasion', name: 'Increase Evasion', description: 'Gain +1 to your Evasion', cost: 1 },
  { id: 'subclass_card', name: 'Upgraded Subclass Card', description: 'Take your next subclass card (Specialization or Mastery)', cost: 1 },
  { id: 'increase_proficiency', name: 'Increase Proficiency', description: 'Gain +1 to Proficiency and +1 damage die', cost: 2 },
  { id: 'multiclass', name: 'Multiclass', description: 'Gain access to a second class domain (available at level 5+)', cost: 2, minLevel: 5 },
];

export default function LevelUpModal({
  isOpen,
  onClose,
  character,
  domainCards = [],
  onComplete,
  isLoading = false,
}: LevelUpModalProps) {
  const currentLevel = character.level;
  const newLevel = currentLevel + 1;
  const [step, setStep] = useState(1);
  
  // Selection State
  const [selectedAdvancements, setSelectedAdvancements] = useState<string[]>([]);
  const [selectedDomainCard, setSelectedDomainCard] = useState<string>('');
  const [selectedMulticlass, setSelectedMulticlass] = useState<string>('');
  const [selectedMulticlassDomain, setSelectedMulticlassDomain] = useState<string>('');
  const [exchangeExistingCardId, setExchangeExistingCardId] = useState<string | null>(null);
  
  // Configuration State (Sub-steps)
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [selectedExperienceIndices, setSelectedExperienceIndices] = useState<number[]>([]);
  const [hpSlotsAdded, setHpSlotsAdded] = useState(1);
  const [stressSlotsAdded, setStressSlotsAdded] = useState(1);

  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const tierAchievements = calculateTierAchievements(newLevel);
  const newThresholds = calculateNewDamageThresholds(character.damage_thresholds);

  // Determine all available domains (primary + multiclass)
  const allDomains = [...(character.domains || [])];
  if (selectedAdvancements.includes('multiclass') && selectedMulticlassDomain) {
    allDomains.push(selectedMulticlassDomain);
  }

  // Filter available domain cards by character's domains (including multiclass if selected)
  const availableDomainCards = domainCards.filter((card: any) =>
    allDomains.some(d => isCardInDomain(card, d))
  );

  // Calculate total advancement slots used
  const totalSlots = selectedAdvancements.reduce((sum, id) => {
    const advancement = ADVANCEMENT_OPTIONS.find(a => a.id === id);
    return sum + (advancement?.cost || 0);
  }, 0);

  // Check for Tier-based restrictions (Subclass vs Multiclass)
  // Iterate through previous levels in the same tier to see if restricted options were taken
  let takenSubclassInTier = false;
  let takenMulticlassInTier = false;

  if (character.advancement_history_jsonb) {
    for (let l = 1; l < newLevel; l++) {
      // Only check levels within the *new* tier (or current tier if leveling within it)
      if (getTier(l) === getTier(newLevel)) {
        const record = character.advancement_history_jsonb[l.toString()];
        if (record?.advancements) {
          if (record.advancements.includes('subclass_card')) takenSubclassInTier = true;
          if (record.advancements.includes('multiclass')) takenMulticlassInTier = true;
        }
      }
    }
  }

  // Determine if configuration step is needed
  const needsConfiguration = selectedAdvancements.some(id => 
    ['increase_traits', 'increase_experience'].includes(id)
  );

  const canProceed = () => {
    // Step 1: Display only (tier achievements) - always allow next
    if (step === 1) return true;

    // Step 2: Advancement selection - require exactly 2 slots
    if (step === 2) {
      // Must use exactly 2 slots
      if (totalSlots !== 2) return false;

      // If multiclass selected, must choose class and domain
      if (selectedAdvancements.includes('multiclass')) {
        return selectedMulticlass !== '' && selectedMulticlassDomain !== '';
      }

      return true;
    }

    // Step 3: Configuration (if needed)
    if (step === 3 && needsConfiguration) {
      if (selectedAdvancements.includes('increase_traits')) {
        if (selectedTraits.length !== 2) return false;
      }
      if (selectedAdvancements.includes('increase_experience')) {
        if (selectedExperienceIndices.length !== 2) return false;
      }
      return true;
    }

    // Step 4: Display only (new damage thresholds) - always allow next
    // (Adjusted logic: if no config needed, this is step 3)
    const thresholdStep = needsConfiguration ? 4 : 3;
    if (step === thresholdStep) return true;

    // Step 5: Domain card selection
    const domainStep = needsConfiguration ? 5 : 4;
    if (step === domainStep) {
      // Check if any valid cards are available for selection
      const validCards = availableDomainCards.filter(
        card => isCardAvailableAtLevel(card, newLevel)
      );
      // If no cards available, allow skip
      if (validCards.length === 0) return true;
      // If cards available, require a selection
      return selectedDomainCard !== '';
    }

    return true;
  };

  const handleNext = () => {
    setError('');

    // Step 2: Validate advancement selection
    if (step === 2) {
      if (totalSlots !== 2) {
        setError('You must select exactly 2 advancement slots');
        return;
      }
    }

    // Step 3: Validate configuration
    if (step === 3 && needsConfiguration) {
      if (selectedAdvancements.includes('increase_traits') && selectedTraits.length !== 2) {
        setError('Please select exactly 2 traits to increase.');
        return;
      }
      if (selectedAdvancements.includes('increase_experience') && selectedExperienceIndices.length !== 2) {
        setError('Please select exactly 2 experiences to increase.');
        return;
      }
    }

    // Step 5 (or 4): Validate domain card selection
    const domainStep = needsConfiguration ? 5 : 4;
    if (step === domainStep) {
      const validCards = availableDomainCards.filter(
        card => isCardAvailableAtLevel(card, newLevel)
      );
      if (validCards.length > 0 && !selectedDomainCard) {
        setError('You must select a domain card');
        return;
      }
    }

    // Proceed to next step
    // Skip configuration step if not needed
    if (step === 2 && !needsConfiguration) {
      setStep(4); // Skip to thresholds (mapped to logical step 3 in UI, but state 4 here? No, let's keep state linear)
    } else if (step < (needsConfiguration ? 5 : 4)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) {
      if (step === 4 && !needsConfiguration) {
        setStep(2);
      } else {
        setStep(step - 1);
      }
    }
  };

  const handleComplete = async () => {
    setError('');
    
    if (onComplete) {
      try {
        // Prepare data
        const traitIncrements = selectedTraits.map(trait => ({ trait, amount: 1 }));
        const experienceIncrements = selectedExperienceIndices.map(idx => ({ experienceId: idx.toString(), amount: 1 }));

        await onComplete({
          newLevel,
          selectedAdvancements,
          selectedDomainCardId: selectedDomainCard,
          multiclassId: selectedMulticlass || undefined,
          multiclassDomain: selectedMulticlassDomain || undefined,
          exchangeExistingCardId: exchangeExistingCardId || undefined,
          traitIncrements: selectedAdvancements.includes('increase_traits') ? traitIncrements : [],
          experienceIncrements: selectedAdvancements.includes('increase_experience') ? experienceIncrements : [],
          hpSlotsAdded: selectedAdvancements.includes('add_hp') ? 1 : 0,
          stressSlotsAdded: selectedAdvancements.includes('add_stress') ? 1 : 0,
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to complete level up');
      }
    }
  };

  const toggleAdvancement = (advancementId: string) => {
    setSelectedAdvancements(prev => {
      const newSelected = [...prev];
      const index = newSelected.indexOf(advancementId);

      if (index === -1) {
        // Adding
        const advancement = ADVANCEMENT_OPTIONS.find(a => a.id === advancementId);
        const currentCost = newSelected.reduce((sum, id) => {
          const adv = ADVANCEMENT_OPTIONS.find(a => a.id === id);
          return sum + (adv?.cost || 0);
        }, 0);

        if (currentCost + (advancement?.cost || 0) <= 2) {
          newSelected.push(advancementId);
          // Reset configuration for this new addition if needed
           if (advancementId === 'add_hp') setHpSlotsAdded(1);
           if (advancementId === 'add_stress') setStressSlotsAdded(1);
        }
      } else {
        // Removing
        newSelected.splice(index, 1);
        // Clear configuration
        if (advancementId === 'increase_traits') setSelectedTraits([]);
        if (advancementId === 'increase_experience') setSelectedExperienceIndices([]);
      }

      return newSelected;
    });
  };

  // Determine step label/count for UI
  const maxSteps = needsConfiguration ? 5 : 4;

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
                <Zap size={24} className="text-dagger-gold" />
                <h2 className="text-2xl font-bold text-white">Level Up to {newLevel}</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="px-6 py-3 flex items-center justify-center gap-2 border-b border-white/10">
              {Array.from({ length: maxSteps }, (_, i) => i + 1).map((s) => {
                 // Map UI step `s` to internal `step`
                 // If needsConfig: 1, 2, 3, 4, 5. 
                 // If !needsConfig: 1, 2, 3(mapped to 4), 4(mapped to 5).
                 let internalStepForS = s;
                 if (!needsConfiguration && s > 2) internalStepForS = s + 1;

                 const isActive = internalStepForS === step;
                 const isPast = internalStepForS < step;

                 return (
                    <div key={s} className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full transition-all ${
                          isActive || isPast ? 'bg-dagger-gold w-4' : 'bg-gray-600'
                        }`}
                      />
                      {s < maxSteps && <div className={`w-6 h-0.5 ${isPast ? 'bg-dagger-gold' : 'bg-gray-600'}`} />}
                    </div>
                 );
              })}
            </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 1 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Tier Achievements</h3>
              <div className="space-y-3 text-gray-300">
                <div className="flex items-start gap-3 p-3 bg-black/30 rounded-lg">
                  <Check size={20} className="text-dagger-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-white">New Experience</p>
                    <p className="text-sm">You gain a new Experience at +{tierAchievements.newExperienceValue || 0}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-black/30 rounded-lg">
                  <Check size={20} className="text-dagger-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-white">Proficiency</p>
                    <p className="text-sm">Your Proficiency increases by +{tierAchievements.proficiencyIncrease}</p>
                  </div>
                </div>
                {tierAchievements.shouldClearMarkedTraits && (
                  <div className="flex items-start gap-3 p-3 bg-black/30 rounded-lg">
                    <Check size={20} className="text-dagger-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-white">Clear Marked Traits</p>
                      <p className="text-sm">All traits marked in previous tiers are cleared and available to upgrade again</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Select Advancements</h3>
              <p className="text-gray-400 mb-4">
                Choose advancements totaling exactly 2 slots. (Current: <span className={totalSlots === 2 ? 'text-dagger-gold font-bold' : 'text-gray-400'}>{totalSlots}</span> slots)
              </p>
              <div className="grid grid-cols-1 gap-2">
                {ADVANCEMENT_OPTIONS.map((advancement) => {
                  const isSelected = selectedAdvancements.includes(advancement.id);

                  // Check if advancement is available at this level
                  const meetsLevelRequirement = !advancement.minLevel || newLevel >= advancement.minLevel;

                  // Multiclass can only be taken once
                  // AND cannot be taken if Subclass Upgrade was taken in this tier
                  let isBlockedByTier = false;
                  
                  if (advancement.id === 'multiclass' && takenSubclassInTier) {
                     isBlockedByTier = true;
                  }
                  
                  if (advancement.id === 'subclass_card' && (takenMulticlassInTier || selectedAdvancements.includes('multiclass'))) {
                     isBlockedByTier = true;
                  }
                  
                  if (advancement.id === 'multiclass' && selectedAdvancements.includes('subclass_card')) {
                     isBlockedByTier = true;
                  }

                  // Multiclass can only be taken once
                  const isAlreadyTaken = advancement.id === 'multiclass' && character.multiclass_id;

                  const canSelect = !isSelected && totalSlots + advancement.cost <= 2 && meetsLevelRequirement && !isAlreadyTaken && !isBlockedByTier;

                  return (
                    <button
                      key={advancement.id}
                      onClick={() => toggleAdvancement(advancement.id)}
                      disabled={!isSelected && !canSelect}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-dagger-gold bg-dagger-gold/10'
                          : canSelect
                          ? 'border-gray-600 bg-black/30 hover:border-dagger-gold/50'
                          : 'border-gray-700 bg-black/20 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-white">
                            {advancement.name}
                            {isAlreadyTaken && <span className="text-xs text-gray-500 ml-2">(Already Taken)</span>}
                            {isBlockedByTier && !isAlreadyTaken && <span className="text-xs text-gray-500 ml-2">(Locked this Tier)</span>}
                            {!meetsLevelRequirement && <span className="text-xs text-gray-500 ml-2">(Level {advancement.minLevel}+)</span>}
                          </p>
                          <p className="text-sm text-gray-400">{advancement.description}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ml-2 ${
                          isSelected ? 'bg-dagger-gold text-black' : 'bg-gray-700 text-gray-300'
                        }`}>
                          {advancement.cost} slot{advancement.cost > 1 ? 's' : ''}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Multiclass Selection Substep */}
              {selectedAdvancements.includes('multiclass') && (
                <div className="mt-6 p-4 bg-black/20 rounded-lg border border-dagger-gold/30">
                  <MulticlassSelection
                    primaryClassId={character.class_id}
                    selectedClass={selectedMulticlass}
                    selectedDomain={selectedMulticlassDomain}
                    onSelectClass={setSelectedMulticlass}
                    onSelectDomain={setSelectedMulticlassDomain}
                  />
                </div>
              )}
            </div>
          )}

          {step === 3 && needsConfiguration && (
             <div className="space-y-6">
                {selectedAdvancements.includes('increase_traits') && (
                   <TraitSelection 
                      character={character}
                      selectedTraits={selectedTraits}
                      onSelectTraits={setSelectedTraits}
                      markedTraits={character.marked_traits_jsonb}
                   />
                )}
                
                {selectedAdvancements.includes('increase_experience') && (
                   <ExperienceSelection 
                      experiences={character.experiences || []}
                      selectedExperienceIndices={selectedExperienceIndices}
                      onSelectExperiences={setSelectedExperienceIndices}
                   />
                )}
             </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Damage Thresholds</h3>
              <p className="text-gray-300 mb-4">All your damage thresholds increase by +1:</p>
              <div className="space-y-3">
                <div className="p-4 bg-black/30 rounded-lg border border-dagger-gold/20">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Minor Threshold</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{character.damage_thresholds.minor}</span>
                      <span className="text-dagger-gold">→</span>
                      <span className="text-dagger-gold font-bold">{newThresholds.minor}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-black/30 rounded-lg border border-dagger-gold/20">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Major Threshold</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{character.damage_thresholds.major}</span>
                      <span className="text-dagger-gold">→</span>
                      <span className="text-dagger-gold font-bold">{newThresholds.major}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-black/30 rounded-lg border border-dagger-gold/20">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Severe Threshold</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{character.damage_thresholds.severe}</span>
                      <span className="text-dagger-gold">→</span>
                      <span className="text-dagger-gold font-bold">{newThresholds.severe}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Select Domain Card</h3>
              <p className="text-gray-400 mb-4">Choose a new domain card at level {newLevel} or below:</p>
              {character.domains?.length === 0 ? (
                <p className="text-gray-500 text-sm p-4 bg-black/20 rounded-lg">No domains available. Ensure your character has at least one domain.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {availableDomainCards.filter(
                    card => isCardAvailableAtLevel(card, newLevel)
                  ).map((card) => {
                    const isSelected = selectedDomainCard === card.id;
                    const cardLevel = getCardLevel(card);
                    const cardDescription = getCardDescription(card);
                    const cardType = getCardType(card);

                    return (
                      <button
                        key={card.id}
                        onClick={() => setSelectedDomainCard(card.id)}
                        className={`text-left p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-dagger-gold bg-dagger-gold/10'
                            : 'border-gray-600 bg-black/30 hover:border-dagger-gold/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-bold text-dagger-gold">{card.name}</p>
                            <p className="text-xs text-gray-400 mb-1">
                              {cardType} • Level {cardLevel}
                            </p>
                            <p className="text-sm text-gray-300 line-clamp-2">
                              {cardDescription}
                            </p>
                          </div>
                          {isSelected && (
                            <span className="text-xs bg-dagger-gold text-black px-2 py-1 rounded-full font-bold flex-shrink-0 mt-0.5">
                              Selected
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Domain Exchange */}
              {selectedDomainCard && (
                <DomainExchange
                  selectedNewCard={domainCards.find(c => c.id === selectedDomainCard)!}
                  characterCards={character.character_cards || []}
                  onSelectExchangeCard={setExchangeExistingCardId}
                />
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}
        </div>

            {/* Footer */}
            <div className="border-t border-white/10 px-6 py-4 flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
              >
                Back
              </button>
              <span className="text-sm text-gray-400">
                Step {step > 2 && !needsConfiguration ? step - 1 : step} of {maxSteps}
              </span>
              {step < (needsConfiguration ? 5 : 4) ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed() || isLoading}
                  className="px-4 py-2 rounded-lg bg-dagger-gold text-black font-bold hover:bg-dagger-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={!canProceed() || isLoading}
                  className="px-3 py-1.5 text-sm rounded-lg bg-dagger-gold text-black font-bold hover:bg-dagger-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isLoading ? 'Leveling up...' : 'Complete Level Up'}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}