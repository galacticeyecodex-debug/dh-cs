'use client';

/**
 * LEVEL UP MODAL DOCUMENTATION
 * ----------------------------------------------------------------------------
 * This component handles the complex logic of leveling up a Daggerheart character.
 *
 * GAME RULES & MECHANICS:
 *
 * 1. Tiers:
 *    - Characters progress through 4 Tiers over 10 Levels.
 *    - Tier 1: Level 1
 *    - Tier 2: Levels 2-4
 *    - Tier 3: Levels 5-7
 *    - Tier 4: Levels 8-10
 *
 * 2. Tier Achievements (Automatic):
 *    - At specific levels (2, 5, 8), characters automatically gain benefits:
 *      - Level 2: +1 Proficiency, New Experience (+2).
 *      - Level 5: +1 Proficiency, New Experience (+2), Clear all Marked Traits.
 *      - Level 8: +1 Proficiency, New Experience (+2), Clear all Marked Traits.
 *
 * 3. Advancements (User Selection):
 *    - Every level up, the user must select up to 2 "slots" worth of advancements from a list of available options.
 *    - Costs: Most options cost 1 slot. "Increase Proficiency" and "Multiclass" cost 2 slots.
 *
 * 4. Restrictions & Limits:
 *    - Domain Cards:
 *      - Users ALWAYS gain ONE free domain card every level.
 *    - Other Advancements that can only be selected a certain number of times per Tier:
 *      1. Traits: Gain a "+1" to 2 *Unmarked* Traits; 3 times per tier (but not the same trait multiple times; hence marking the upgraded traits until the next tier)
 *      2. Permenantly add 1 additional Hit Point slot; 2 times per tier
 *      3. Permenantly add 1 additional Stress slot; 2 times per tier
 *      4. Increase one Experience to gain a permanent +1 to that experience; 2 times per tier
 *      5. Gain 1 additional +2 Experience; 1 time per tier
 *      6. Add an additional domain card from the character's initial domains at the character's level or lower; 1 time per tier (however, if you chose a card from a multiclassed domain, you can choose a card at only half your level.)
 *      7. Permenantly add 1 to Evasion; 1 time per tier
 *      8. Upgrade a Subclass card; 1 time per tier (unless Multiclass was chosen this tier)
 *      9. Increase Proficiency; 1 time per tier (costs 2 slots)
 *      (e.g. If you take +1 HP at Level 2, you cannot take it again until Tier 3 at Level 5).
 *    - Multiclass:
 *      - Can only be selected ONCE per character lifetime.
 *      - Costs 2 slots.
 *      - Cannot be taken in the same Tier as a Subclass upgrade.
 *      - NOTE: Multi-class has not yet been fully implemented.
 */

import React, { useState } from 'react';
import { X, Zap, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateTierAchievements, calculateNewDamageThresholds, getTier, getMaxCardLevelForDomain, getClassDomains } from '@/lib/level-up-helpers';
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
  subclasses?: any[]; // Library subclasses
  classes?: any[]; // Library classes
  onComplete?: (options: {
    newLevel: number;
    selectedAdvancements: string[];
    selectedDomainCardIds: string[];
    multiclassId?: string;
    multiclassDomain?: string;
    multiclassSubclassId?: string;
    multiclassFoundationCardId?: string;
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
  { id: 'increase_experience', name: 'Increase Experience', description: 'Choose 2 experiences and gain +1 to each', cost: 1 },
  { id: 'additional_domain_card', name: 'Additional Domain Card', description: 'Gain an additional domain card', cost: 1 },
  { id: 'increase_evasion', name: 'Increase Evasion', description: 'Gain +1 to your Evasion', cost: 1 },
  { id: 'subclass_card', name: 'Upgraded Subclass Card', description: 'Take your next subclass card (Specialization or Mastery)', cost: 1 },
  { id: 'increase_proficiency', name: 'Increase Proficiency', description: 'Gain +1 to Proficiency (+1 damage die)', cost: 2 },
  { id: 'multiclass', name: 'Multiclass', description: 'Gain access to a second class and domain (available at level 5+)', cost: 2, minLevel: 5 },
];

// Max times an advancement can be taken per Tier
const TIER_LIMITS: Record<string, number> = {
  increase_traits: 3,
  add_hp: 2,
  add_stress: 2,
  additional_domain_card: 1,
  increase_experience: 1,
  increase_evasion: 1,
  subclass_card: 1,
  increase_proficiency: 1,
  multiclass: 1,
  // level_domain_card: 3, // Allow taking domain cards once per level in a tier
};

export default function LevelUpModal({
  isOpen,
  onClose,
  character,
  domainCards = [],
  subclasses = [],
  classes = [],
  onComplete,
  isLoading = false,
}: LevelUpModalProps) {
  const currentLevel = character.level;
  const newLevel = currentLevel + 1;
  const [step, setStep] = useState(1);

  // Selection State
  const [selectedAdvancements, setSelectedAdvancements] = useState<string[]>([]);
  const [selectedAutomaticCard, setSelectedAutomaticCard] = useState<string>('');
  const [selectedAdditionalCard, setSelectedAdditionalCard] = useState<string>('');
  const [selectedMulticlass, setSelectedMulticlass] = useState<string>('');
  const [selectedMulticlassDomain, setSelectedMulticlassDomain] = useState<string>('');
  const [selectedMulticlassSubclass, setSelectedMulticlassSubclass] = useState<string>('');
  const [exchangeExistingCardId, setExchangeExistingCardId] = useState<string | null>(null);

  // Configuration State (Sub-steps)
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [selectedExperienceIndices, setSelectedExperienceIndices] = useState<number[]>([]);
  const [hpSlotsAdded, setHpSlotsAdded] = useState(1);
  const [stressSlotsAdded, setStressSlotsAdded] = useState(1);

  const [error, setError] = useState<string>('');

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedAdvancements([]);
      setSelectedAutomaticCard('');
      setSelectedAdditionalCard('');
      setSelectedMulticlass('');
      setSelectedMulticlassDomain('');
      setSelectedMulticlassSubclass('');
      setExchangeExistingCardId(null);
      setSelectedTraits([]);
      setSelectedExperienceIndices([]);
      setHpSlotsAdded(1);
      setStressSlotsAdded(1);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tierAchievements = calculateTierAchievements(newLevel);
  const newThresholds = calculateNewDamageThresholds(character.damage_thresholds);

  // Determine all available domains (primary + multiclass)
  const allDomains = [...(character.domains || [])];
  if (selectedAdvancements.includes('multiclass') && selectedMulticlassDomain) {
    allDomains.push(selectedMulticlassDomain);
  }

  // Filter available domain cards by character's domains (including multiclass if selected)
  // AND by level rules using the helper function
  const availableDomainCards = domainCards.filter((card: any) => {
    if (!card.domain) return false;

    // 1. Is card in an allowed domain?
    if (!allDomains.includes(card.domain)) return false;

    // 2. Exclude cards the character already has
    const alreadyOwned = character.character_cards?.some(
      (charCard) => charCard.card_id === card.id
    );
    if (alreadyOwned) return false;

    // 3. Max Level Rule - Use helper function to apply half-level rule for multiclass domains
    // Get primary domains from the character's primary class
    const primaryDomains = character.class_id ? getClassDomains(character.class_id) : character.domains || [];

    // Determine multiclass domain to apply half-level rule (SRD: multiclass cards limited to half character level)
    // This handles two scenarios:
    // A) Character is selecting multiclass advancement RIGHT NOW → use newly selected domain
    // B) Character previously multiclassed → detect existing multiclass domain from character.domains
    let multiclassDomain: string | undefined;
    if (selectedAdvancements.includes('multiclass') && selectedMulticlassDomain) {
      // Scenario A: Currently selecting multiclass advancement
      multiclassDomain = selectedMulticlassDomain;
    } else if (character.multiclass_id) {
      // Scenario B: Character already has a multiclass - find which domain doesn't match primary class domains
      // (character.domains contains BOTH primary and multiclass domains, we need to identify the multiclass one)
      const existingMulticlassDomain = character.domains?.find(
        d => !primaryDomains.map(p => p.toLowerCase()).includes(d.toLowerCase())
      );
      multiclassDomain = existingMulticlassDomain;
    }

    // Use the helper function to get max level for this domain
    const maxLevel = getMaxCardLevelForDomain(
      newLevel,
      card.domain,
      primaryDomains,
      multiclassDomain
    );

    return getCardLevel(card) <= maxLevel;
  });

  // Calculate total advancement slots used
  const totalSlots = selectedAdvancements.reduce((sum, id) => {
    const advancement = ADVANCEMENT_OPTIONS.find(a => a.id === id);
    return sum + (advancement?.cost || 0);
  }, 0);

  const hasAdditionalDomainCard = selectedAdvancements.includes('additional_domain_card');

  // Check for Tier-based restrictions (Subclass vs Multiclass)
  // And calculate usage counts for this tier
  let takenSubclassInTier = false;
  let takenMulticlassInTier = false;
  const selectionsInTier: Record<string, number> = {};

  if (character.advancement_history_jsonb) {
    for (const [lvlStr, record] of Object.entries(character.advancement_history_jsonb)) {
      const lvl = parseInt(lvlStr);
      // Check if this past level is in the SAME tier as the NEW level
      if (getTier(lvl) === getTier(newLevel)) {
        const rec = record as any;
        if (rec?.advancements) {
          if (rec.advancements.includes('subclass_card')) takenSubclassInTier = true;
          if (rec.advancements.includes('multiclass')) takenMulticlassInTier = true;

          // Count selections
          rec.advancements.forEach((adv: string) => {
            selectionsInTier[adv] = (selectionsInTier[adv] || 0) + 1;
          });
        }
      }
    }
  }

  // Determine if configuration step is needed
  const needsConfiguration = selectedAdvancements.some(id =>
    ['increase_traits', 'increase_experience', 'multiclass'].includes(id)
  );

  const canProceed = () => {
    // Step 1: Display only (tier achievements) - always allow next
    if (step === 1) return true;

    // Step 2: Advancement selection - require exactly 2 slots
    if (step === 2) {
      // Must use exactly 2 slots
      if (totalSlots !== 2) return false;

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
      if (selectedAdvancements.includes('multiclass')) {
        return selectedMulticlass !== '' && selectedMulticlassDomain !== '' && selectedMulticlassSubclass !== '';
      }
      return true;
    }

    // Step 4: Display only (new damage thresholds) - always allow next
    if (step === 4) return true;

    // Step 5: Automatic Domain Card
    if (step === 5) {
      const validCards = availableDomainCards.filter(
        card => isCardAvailableAtLevel(card, newLevel) // We rely on availableDomainCards already filtering max level? No, availableDomainCards logic above was just defining it.
        // We need to apply the specific check here.
      );
      
      // Re-filter with the helper inside the render/check
      // actually `availableDomainCards` is calculated at render time.
      // So checking `length` is fine if `availableDomainCards` is correct.
      
      // If no cards, block unless strictly no data
      if (availableDomainCards.length === 0) return false;

      return selectedAutomaticCard !== '';
    }

    // Step 6: Additional Domain Card (if applicable)
    if (step === 6) {
      // Filter out the card selected in step 5
      const validCards = availableDomainCards.filter(
        card => card.id !== selectedAutomaticCard
      );

      if (validCards.length === 0) return false;

      return selectedAdditionalCard !== '';
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
      if (selectedAdvancements.includes('multiclass')) {
        if (!selectedMulticlass) {
            setError('Please select a secondary class.');
            return;
        }
        if (!selectedMulticlassSubclass) {
            setError('Please select a subclass.');
            return;
        }
        if (!selectedMulticlassDomain) {
            setError('Please select a domain.');
            return;
        }
      }
    }

    // Step 5: Validate Automatic Domain Card
    if (step === 5) {
      if (availableDomainCards.length === 0) {
        setError('No domain cards available for this level. Cannot proceed.');
        return;
      }

      if (!selectedAutomaticCard) {
        setError('You must select a domain card.');
        return;
      }
    }

    // Step 6: Validate Additional Domain Card
    if (step === 6) {
      const validCards = availableDomainCards.filter(
        card => card.id !== selectedAutomaticCard
      );

      if (validCards.length === 0) {
        setError('No additional domain cards available.');
        return;
      }

      if (!selectedAdditionalCard) {
        setError('You must select an additional domain card.');
        return;
      }
    }

    // Proceed to next step
    // Skip configuration step if not needed
    if (step === 2 && !needsConfiguration) {
      setStep(4); // Skip to thresholds
    } else if (step === 5 && !hasAdditionalDomainCard) {
      // If no additional card needed, we are done (handled by button text, but conceptually next is finish)
      // Actually UI logic handles the "Complete" button rendering.
      // This function is called for "Next".
      // If we are at step 5 and NO additional card, we shouldn't be here (Complete button should be shown)
      // But for safety:
      return;
    } else {
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

        // Combine domain cards
        const finalDomainCards = [selectedAutomaticCard];
        if (selectedAdditionalCard) {
          finalDomainCards.push(selectedAdditionalCard);
        }
        
        // Find Foundation Card ID if Multiclass selected
        let foundationCardId: string | undefined;
        if (selectedAdvancements.includes('multiclass') && selectedMulticlassSubclass) {
           // We need to find the foundation card for this subclass.
           // Usually it is a card in library with type='feature' (or 'card' with 'feature' tag?)
           // AND linked to the subclass? 
           // In Daggerheart data, the Foundation Feature is often embedded in the Subclass JSON.
           // BUT, `levelUpCharacter` expects a `multiclassFoundationCardId` (string).
           // This implies there is a CARD for it.
           // Let's assume there is a card in the library for the foundation feature.
           // However, based on `subclasses.json`, the foundation feature is text in the subclass object.
           // The "Card" might not exist as a separate entity in `library` table yet?
           // Wait, `character_cards` table links to `library`.
           // If we want to add a card to the character, we need a library item ID.
           // The Subclass ITSELF is a library item.
           // Maybe we add the Subclass Item ID as the card? 
           // NO, usually we add "features".
           
           // If we look at `seed_library.sql`, we see the Subclass items have `foundation_features` in JSON.
           // It does NOT look like there are separate rows for features.
           // So, maybe we use the Subclass ID itself as the "card"?
           // And the `character_cards` entry will have `location: 'feature'`.
           // Let's assume `multiclassFoundationCardId` should be the `subclassId`.
           // The store's `levelUpCharacter` will insert it into `character_cards`.
           // If `character_cards` points to `library`, then yes, it must point to the Subclass ID.
           foundationCardId = selectedMulticlassSubclass; 
        }

        await onComplete({
          newLevel,
          selectedAdvancements,
          selectedDomainCardIds: finalDomainCards,
          multiclassId: selectedMulticlass || undefined,
          multiclassDomain: selectedMulticlassDomain || undefined,
          multiclassSubclassId: selectedMulticlassSubclass || undefined,
          multiclassFoundationCardId: foundationCardId,
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

  // Toggle functions for single selections
  const selectAutomaticCard = (cardId: string) => {
    if (selectedAutomaticCard === cardId) {
      setSelectedAutomaticCard('');
    } else {
      setSelectedAutomaticCard(cardId);
    }
  };

  const selectAdditionalCard = (cardId: string) => {
    if (selectedAdditionalCard === cardId) {
      setSelectedAdditionalCard('');
    } else {
      setSelectedAdditionalCard(cardId);
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
        if (advancementId === 'additional_domain_card') setSelectedAdditionalCard('');
        if (advancementId === 'multiclass') {
            setSelectedMulticlass('');
            setSelectedMulticlassDomain('');
            setSelectedMulticlassSubclass('');
        }
      }

      return newSelected;
    });
  };

  // Determine step label/count for UI
  let maxSteps = 5; // Default: 1, 2, (3 config), 4, 5
  if (!needsConfiguration) maxSteps = 4; // 1, 2, 4, 5
  // If additional domain card, add 1 step
  if (hasAdditionalDomainCard) maxSteps += 1;

  // UI Step Mapper
  // If config: 1, 2, 3, 4, 5, (6)
  // If no config: 1, 2, 4->3, 5->4, (6->5)
  const getUiStep = (internalStep: number) => {
    if (needsConfiguration) return internalStep;
    if (internalStep <= 2) return internalStep;
    return internalStep - 1;
  };

  const currentUiStep = getUiStep(step);
  const totalUiSteps = needsConfiguration
    ? (hasAdditionalDomainCard ? 6 : 5)
    : (hasAdditionalDomainCard ? 5 : 4);

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
              {Array.from({ length: totalUiSteps }, (_, i) => i + 1).map((s) => {
                const isActive = s === currentUiStep;
                const isPast = s < currentUiStep;

                return (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full transition-all ${isActive || isPast ? 'bg-dagger-gold w-4' : 'bg-gray-600'
                        }`}
                    />
                    {s < totalUiSteps && <div className={`w-6 h-0.5 ${isPast ? 'bg-dagger-gold' : 'bg-gray-600'}`} />}
                  </div>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {step === 1 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Level Advancement</h3>
                  <div className="space-y-3 text-gray-300">
                    <div className="flex items-start gap-3 p-3 bg-black/30 rounded-lg">
                      <div className="mt-0.5 bg-dagger-gold/10 p-1 rounded-full">
                        <Zap size={16} className="text-dagger-gold flex-shrink-0" />
                      </div>
                      <div>
                        <p className="font-bold text-white">New Domain Card</p>
                        <p className="text-sm">You gain a new domain card from your available domains.</p>
                      </div>
                    </div>

                    {(tierAchievements.newExperienceValue !== null || tierAchievements.proficiencyIncrease > 0) && (
                      <>
                        <h3 className="text-xl font-bold text-white mb-4">Tier Advancement</h3>
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
                      </>
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

                      // Check limits per tier
                      const limit = TIER_LIMITS[advancement.id] || 1;
                      const currentCount = selectionsInTier[advancement.id] || 0;
                      const isMaxed = currentCount >= limit;

                      const canSelect = !isSelected && totalSlots + advancement.cost <= 2 && meetsLevelRequirement && !isAlreadyTaken && !isBlockedByTier && !isMaxed;

                      return (
                        <button
                          key={advancement.id}
                          onClick={() => toggleAdvancement(advancement.id)}
                          disabled={!isSelected && !canSelect}
                          className={`text-left p-3 rounded-lg border transition-all ${isSelected
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
                                {isMaxed && !isAlreadyTaken && <span className="text-xs text-gray-500 ml-2">(Max for Tier)</span>}
                                {isBlockedByTier && !isAlreadyTaken && !isMaxed && <span className="text-xs text-gray-500 ml-2">(Locked this Tier)</span>}
                                {!meetsLevelRequirement && <span className="text-xs text-gray-500 ml-2">(Level {advancement.minLevel}+)</span>}
                              </p>
                              <p className="text-sm text-gray-400">{advancement.description}</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded ml-2 ${isSelected ? 'bg-dagger-gold text-black' : 'bg-gray-700 text-gray-300'
                              }`}>
                              {advancement.cost} slot{advancement.cost > 1 ? 's' : ''}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Multiclass Selection Substep Moved to Step 3 */}
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

                  {selectedAdvancements.includes('multiclass') && (
                    <MulticlassSelection
                        primaryClassId={character.class_id}
                        selectedClass={selectedMulticlass}
                        selectedDomain={selectedMulticlassDomain}
                        selectedSubclass={selectedMulticlassSubclass}
                        onSelectClass={setSelectedMulticlass}
                        onSelectDomain={setSelectedMulticlassDomain}
                        onSelectSubclass={setSelectedMulticlassSubclass}
                        subclasses={subclasses}
                        classes={classes}
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
                  <h3 className="text-xl font-bold text-white mb-2">Select New Domain Card</h3>
                  <p className="text-gray-400 mb-4">
                    Choose a new domain card. 
                    {selectedAdvancements.includes('multiclass') && selectedMulticlassDomain && (
                        <span className="block text-xs text-dagger-gold mt-1">
                            Multiclass Rule: Cards from your new domain ({selectedMulticlassDomain}) are limited to Level {Math.ceil(newLevel/2)}.
                        </span>
                    )}
                  </p>
                  {character.domains?.length === 0 ? (
                    <p className="text-gray-500 text-sm p-4 bg-black/20 rounded-lg">No domains available. Ensure your character has at least one domain.</p>
                  ) : availableDomainCards.length === 0 ? (
                    <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                      <p className="text-red-200 font-bold mb-1">No Domain Cards Found</p>
                      <p className="text-sm text-red-300">
                        There are no domain cards available for your domains (<strong>{allDomains.join(', ')}</strong>) at the appropriate level.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {availableDomainCards.map((card) => {
                        const isSelected = selectedAutomaticCard === card.id;
                        const cardLevel = getCardLevel(card);
                        const cardDescription = getCardDescription(card);
                        const cardType = getCardType(card);

                        return (
                          <button
                            key={card.id}
                            onClick={() => selectAutomaticCard(card.id)}
                            className={`text-left p-3 rounded-lg border transition-all ${isSelected
                              ? 'border-dagger-gold bg-dagger-gold/10'
                              : 'border-gray-600 bg-black/30 hover:border-dagger-gold/50'
                              }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="font-bold text-dagger-gold">{card.name}</p>
                                <p className="text-xs text-gray-400 mb-1">
                                  {cardType} • Level {cardLevel} • {card.domain}
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

                  {/* Domain Exchange - Show if card selected */}
                  {selectedAutomaticCard && (
                    <DomainExchange
                      selectedNewCard={domainCards.find(c => c.id === selectedAutomaticCard)!}
                      characterCards={character.character_cards || []}
                      onSelectExchangeCard={setExchangeExistingCardId}
                    />
                  )}
                </div>
              )}

              {step === 6 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Select An Additional Domain Card</h3>
                  <p className="text-gray-400 mb-4">
                    Choose your additional domain card (Advancement Bonus).
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {availableDomainCards.filter(
                      card => card.id !== selectedAutomaticCard
                    ).map((card) => {
                      const isSelected = selectedAdditionalCard === card.id;
                      const cardLevel = getCardLevel(card);
                      const cardDescription = getCardDescription(card);
                      const cardType = getCardType(card);

                      return (
                        <button
                          key={card.id}
                          onClick={() => selectAdditionalCard(card.id)}
                          className={`text-left p-3 rounded-lg border transition-all ${isSelected
                            ? 'border-dagger-gold bg-dagger-gold/10'
                            : 'border-gray-600 bg-black/30 hover:border-dagger-gold/50'
                            }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-bold text-dagger-gold">{card.name}</p>
                              <p className="text-xs text-gray-400 mb-1">
                                {cardType} • Level {cardLevel} • {card.domain}
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
                Step {currentUiStep} of {totalUiSteps}
              </span>
              {step < (hasAdditionalDomainCard ? 6 : 5) ? (
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