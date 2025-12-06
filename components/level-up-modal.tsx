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
  characterDomains?: string[];
  domainCards?: any[]; // Library cards (abilities, spells, grimoires)
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
  // Arcana Domain Cards
  { id: 'arcana_1', name: 'Arcane Bolt', level: 1, domain: 'Arcana', type: 'Spell', description: 'Unleash raw magical energy as a projectile, dealing arcane damage to a target.' },
  { id: 'arcana_2', name: 'Mana Shield', level: 2, domain: 'Arcana', type: 'Ability', description: 'Create a protective barrier of magical energy that absorbs damage and regenerates slowly.' },
  { id: 'arcana_3', name: 'Spell Weaving', level: 3, domain: 'Arcana', type: 'Ability', description: 'Combine multiple spells into a single powerful effect, allowing creative magical combinations.' },

  // Blade Domain Cards
  { id: 'blade_1', name: 'Riposte', level: 1, domain: 'Blade', type: 'Ability', description: 'Quickly counterattack after successfully defending, turning defense into offense.' },
  { id: 'blade_2', name: 'Cleave', level: 2, domain: 'Blade', type: 'Ability', description: 'Strike with overwhelming force, damaging multiple enemies in a wide arc.' },
  { id: 'blade_3', name: 'Blade Mastery', level: 3, domain: 'Blade', type: 'Ability', description: 'Perfect your combat technique, increasing accuracy and critical strike chance with all weapons.' },

  // Bone Domain Cards
  { id: 'bone_1', name: 'Body Control', level: 1, domain: 'Bone', type: 'Ability', description: 'Master your physical form, gaining enhanced reflexes and precise body control in combat.' },
  { id: 'bone_2', name: 'Tactical Strike', level: 2, domain: 'Bone', type: 'Ability', description: 'Analyze enemy weaknesses and exploit them with surgical precision for massive damage.' },
  { id: 'bone_3', name: 'Perfect Form', level: 3, domain: 'Bone', type: 'Ability', description: 'Achieve ideal physical condition, gaining immunity to certain status effects and enhanced durability.' },

  // Codex Domain Cards
  { id: 'codex_1', name: 'Spellbook Study', level: 1, domain: 'Codex', type: 'Grimoire', description: 'Learn fundamental spells from ancient tomes, gaining access to basic magical abilities.' },
  { id: 'codex_2', name: 'Arcane Knowledge', level: 2, domain: 'Codex', type: 'Grimoire', description: 'Decipher complex magical theory, unlocking powerful spells and improving spell effectiveness.' },
  { id: 'codex_3', name: 'Magical Mastery', level: 3, domain: 'Codex', type: 'Grimoire', description: 'Achieve profound understanding of magic itself, casting legendary spells with reduced cost.' },

  // Grace Domain Cards
  { id: 'grace_1', name: 'Charm', level: 1, domain: 'Grace', type: 'Ability', description: 'Use your charisma to influence others, making them more receptive to your suggestions.' },
  { id: 'grace_2', name: 'Persuasion', level: 2, domain: 'Grace', type: 'Ability', description: 'Master the art of negotiation, bending wills and turning enemies into allies.' },
  { id: 'grace_3', name: 'Captivating Presence', level: 3, domain: 'Grace', type: 'Ability', description: 'Command attention with your mere presence, inspiring allies and demoralizing enemies simultaneously.' },

  // Midnight Domain Cards
  { id: 'midnight_1', name: 'Shadow Dance', level: 1, domain: 'Midnight', type: 'Ability', description: 'Merge with shadows to move unseen, gaining invisibility and evasion bonuses.' },
  { id: 'midnight_2', name: 'Cloak of Night', level: 2, domain: 'Midnight', type: 'Ability', description: 'Weave darkness around yourself, becoming immune to detection and gaining concealment.' },
  { id: 'midnight_3', name: 'Master of Shadows', level: 3, domain: 'Midnight', type: 'Ability', description: 'Command shadows as your allies, summoning them to attack, defend, or manipulate the battlefield.' },

  // Sage Domain Cards
  { id: 'sage_1', name: 'Nature\'s Grasp', level: 1, domain: 'Sage', type: 'Spell', description: 'Call upon nature to entangle enemies with vines and roots, immobilizing them temporarily.' },
  { id: 'sage_2', name: 'Wild Ally', level: 2, domain: 'Sage', type: 'Ability', description: 'Bond with a creature of the wilderness, gaining a loyal companion that fights alongside you.' },
  { id: 'sage_3', name: 'Primal Power', level: 3, domain: 'Sage', type: 'Ability', description: 'Unlock primal instincts, transforming into a mighty beast form with enhanced strength and abilities.' },

  // Splendor Domain Cards
  { id: 'splendor_1', name: 'Healing Touch', level: 1, domain: 'Splendor', type: 'Spell', description: 'Channel divine energy to mend wounds, restoring hit points to yourself or an ally.' },
  { id: 'splendor_2', name: 'Life Restoration', level: 2, domain: 'Splendor', type: 'Spell', description: 'Perform powerful healing magic that not only restores health but also cures diseases and curses.' },
  { id: 'splendor_3', name: 'Divine Intervention', level: 3, domain: 'Splendor', type: 'Spell', description: 'Call upon divine power to perform a miracle, resurrecting fallen allies or preventing certain death.' },

  // Valor Domain Cards
  { id: 'valor_1', name: 'Protective Shield', level: 1, domain: 'Valor', type: 'Ability', description: 'Raise your defenses to shield allies nearby, reducing incoming damage for the group.' },
  { id: 'valor_2', name: 'Guardian\'s Resolve', level: 2, domain: 'Valor', type: 'Ability', description: 'Stand your ground with unwavering determination, becoming a bastion against overwhelming odds.' },
  { id: 'valor_3', name: 'Bastion', level: 3, domain: 'Valor', type: 'Ability', description: 'Become an impenetrable fortress, protecting everyone nearby and reflecting damage back to attackers.' },
];

export default function LevelUpModal({
  isOpen,
  onClose,
  currentLevel,
  currentDamageThresholds = { minor: 1, major: 2, severe: 3 },
  characterDomains = [],
  domainCards = [],
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

  // Filter available domain cards by character's domains
  const availableDomainCards = domainCards.filter((card: any) =>
    characterDomains.includes(card.domain)
  );

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
              {characterDomains.length === 0 ? (
                <p className="text-gray-500 text-sm p-4 bg-black/20 rounded-lg">No domains available. Ensure your character has at least one domain.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {availableDomainCards.filter(
                    card => (card.data?.level || card.level) <= newLevel
                  ).map((card) => {
                    const isSelected = selectedDomainCard === card.id;
                    const cardLevel = card.data?.level || card.level || 1;
                    const cardDescription = card.data?.description || card.description || '';

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
                              {card.type} • Level {cardLevel}
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
