'use client';

import React, { useState } from 'react';
import { X, Zap, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateTierAchievements, calculateNewDamageThresholds, getTier } from '@/lib/level-up-helpers';
import { validateNewLevel, validateAdvancementSelections } from '@/lib/level-up-validation';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  currentDamageThresholds?: { minor: number; major: number; severe: number };
  onComplete?: (options: {
    newLevel: number;
    selectedAdvancements: string[];
    selectedDomainCardId: string;
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
];

const DOMAIN_CARDS = [
  { id: 'card_1', name: 'Heroic Intervention', level: 1, domain: 'Warrior' },
  { id: 'card_2', name: 'Cunning Strike', level: 1, domain: 'Rogue' },
  { id: 'card_3', name: 'Arcane Bolt', level: 1, domain: 'Caster' },
  { id: 'card_4', name: 'Guardian\'s Shield', level: 2, domain: 'Warrior' },
  { id: 'card_5', name: 'Shadow Dance', level: 2, domain: 'Rogue' },
  { id: 'card_6', name: 'Fireball', level: 3, domain: 'Caster' },
];

export default function LevelUpModal({
  isOpen,
  onClose,
  currentLevel,
  currentDamageThresholds = { minor: 1, major: 2, severe: 3 },
  onComplete,
  isLoading = false,
}: LevelUpModalProps) {
  const newLevel = currentLevel + 1;
  const [step, setStep] = useState(1);
  const [selectedAdvancements, setSelectedAdvancements] = useState<string[]>([]);
  const [selectedDomainCard, setSelectedDomainCard] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const tierAchievements = calculateTierAchievements(newLevel);
  const newThresholds = calculateNewDamageThresholds(currentDamageThresholds);
  const currentTier = getTier(newLevel);

  // Calculate total advancement slots used
  const totalSlots = selectedAdvancements.reduce((sum, id) => {
    const advancement = ADVANCEMENT_OPTIONS.find(a => a.id === id);
    return sum + (advancement?.cost || 0);
  }, 0);

  const canProceed = () => {
    if (step === 2) return totalSlots === 2;
    if (step === 4) return selectedDomainCard !== '';
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 2) {
      if (totalSlots !== 2) {
        setError('You must select exactly 2 advancement slots');
        return;
      }
    }
    if (step === 4) {
      if (!selectedDomainCard) {
        setError('You must select a domain card');
        return;
      }
    }
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setError('');

    if (!selectedDomainCard) {
      setError('You must select a domain card');
      return;
    }

    if (onComplete) {
      try {
        await onComplete({
          newLevel,
          selectedAdvancements,
          selectedDomainCardId: selectedDomainCard,
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
        }
      } else {
        // Removing
        newSelected.splice(index, 1);
      }

      return newSelected;
    });
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
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full transition-all ${
                      s <= step ? 'bg-dagger-gold w-4' : 'bg-gray-600'
                    }`}
                  />
                  {s < 4 && <div className={`w-6 h-0.5 ${s < step ? 'bg-dagger-gold' : 'bg-gray-600'}`} />}
                </div>
              ))}
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
                  const canSelect = !isSelected && totalSlots + advancement.cost <= 2;

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
                          <p className="font-bold text-white">{advancement.name}</p>
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
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Damage Thresholds</h3>
              <p className="text-gray-300 mb-4">All your damage thresholds increase by +1:</p>
              <div className="space-y-3">
                <div className="p-4 bg-black/30 rounded-lg border border-dagger-gold/20">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Minor Threshold</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{currentDamageThresholds.minor}</span>
                      <span className="text-dagger-gold">→</span>
                      <span className="text-dagger-gold font-bold">{newThresholds.minor}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-black/30 rounded-lg border border-dagger-gold/20">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Major Threshold</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{currentDamageThresholds.major}</span>
                      <span className="text-dagger-gold">→</span>
                      <span className="text-dagger-gold font-bold">{newThresholds.major}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-black/30 rounded-lg border border-dagger-gold/20">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Severe Threshold</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{currentDamageThresholds.severe}</span>
                      <span className="text-dagger-gold">→</span>
                      <span className="text-dagger-gold font-bold">{newThresholds.severe}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Select Domain Card</h3>
              <p className="text-gray-400 mb-4">Choose a new domain card at level {newLevel} or below:</p>
              <div className="grid grid-cols-1 gap-2">
                {DOMAIN_CARDS.filter(card => card.level <= newLevel).map((card) => {
                  const isSelected = selectedDomainCard === card.id;

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
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">{card.name}</p>
                          <p className="text-xs text-gray-400">{card.domain} • Level {card.level}</p>
                        </div>
                        {isSelected && <Check size={20} className="text-dagger-gold" />}
                      </div>
                    </button>
                  );
                })}
              </div>
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
                Step {step} of 4
              </span>
              {step < 4 ? (
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
                  className="px-4 py-2 rounded-lg bg-dagger-gold text-black font-bold hover:bg-dagger-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
