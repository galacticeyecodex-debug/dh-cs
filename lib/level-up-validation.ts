/**
 * LEVEL-UP VALIDATION
 * ----------------------------------------------------------------------------
 * Validation logic for the character level-up wizard.
 * 
 * FUNCTIONALITY:
 * - Ensures user choices (e.g., trait selection, card swaps) comply with SRD rules.
 * - Prevents invalid states before finalizing level-up.
 * 
 * SHARED:
 * - Core business logic shared between Web (Supabase) and Native (SQLite) apps.
 * - Reference: srd/markdown/contents/Leveling Up.md
 */

import {
  getTier,
  hasTierAchievements,
  getAdvancementSlotCost,
  isAdvancementAvailable,
  getTier as getTierFunc,
} from './level-up-helpers';

export interface LevelUpValidationError {
  field: string;
  message: string;
}

/**
 * Validates the new level is valid.
 */
export function validateNewLevel(currentLevel: number, newLevel: number): LevelUpValidationError[] {
  const errors: LevelUpValidationError[] = [];

  if (newLevel <= currentLevel) {
    errors.push({
      field: 'newLevel',
      message: `New level (${newLevel}) must be higher than current level (${currentLevel})`,
    });
  }

  if (newLevel > 10) {
    errors.push({
      field: 'newLevel',
      message: 'Maximum level is 10',
    });
  }

  if (newLevel < 1) {
    errors.push({
      field: 'newLevel',
      message: 'Minimum level is 1',
    });
  }

  return errors;
}

/**
 * Tier limits for advancements (max times per tier).
 */
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
};

/**
 * Minimum level requirements for advancements.
 */
const MIN_LEVEL_REQUIREMENTS: Record<string, number> = {
  subclass_card: 5,
  increase_proficiency: 5,
  multiclass: 5,
};

/**
 * Validates advancement selections.
 *
 * Rules:
 * - Must select exactly 2 advancement slots (not options, slots)
 * - Some options (Proficiency, Multiclass) cost 2 slots and count as 2
 * - All selections must be available for the character's tier or below
 * - Tier limits must be respected (e.g., max 3 trait increases per tier)
 * - Minimum level requirements must be met (e.g., multiclass at level 5+)
 * - Multiclass and subclass upgrades cannot be taken in the same tier
 * - Multiclass can only be taken once per character (lifetime restriction)
 */
export function validateAdvancementSelections(
  selectedAdvancements: string[],
  characterLevel: number,
  isMulticlassedOrHasMastery: boolean,
  advancementHistory?: Record<string, any>,
  hasMulticlassId?: boolean
): LevelUpValidationError[] {
  const errors: LevelUpValidationError[] = [];
  const currentTier = getTier(characterLevel);

  if (!selectedAdvancements || selectedAdvancements.length === 0) {
    errors.push({
      field: 'advancements',
      message: 'Must select at least one advancement',
    });
    return errors;
  }

  // Calculate total slots used
  let totalSlots = 0;
  const slotBreakdown: Record<string, number> = {};

  for (const advId of selectedAdvancements) {
    const cost = getAdvancementSlotCost(advId);
    totalSlots += cost;
    slotBreakdown[advId] = (slotBreakdown[advId] || 0) + cost;
  }

  if (totalSlots !== 2) {
    errors.push({
      field: 'advancements',
      message: `Total advancement slots must equal 2, but selected ${totalSlots}`,
    });
  }

  // Calculate tier-based selections from advancement history (if provided)
  let takenSubclassInTier = false;
  let takenMulticlassInTier = false;
  const selectionsInTier: Record<string, number> = {};

  if (advancementHistory) {
    for (const [lvlStr, record] of Object.entries(advancementHistory)) {
      const lvl = parseInt(lvlStr);
      // Check if this past level is in the SAME tier as the NEW level
      if (getTier(lvl) === currentTier) {
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

  // Validate each advancement
  for (const advId of selectedAdvancements) {
    // Check minimum level requirements
    const minLevel = MIN_LEVEL_REQUIREMENTS[advId];
    if (minLevel && characterLevel < minLevel) {
      errors.push({
        field: 'advancements',
        message: `${advId} requires level ${minLevel} or higher (current: ${characterLevel})`,
      });
    }

    // Check tier limits (if advancement history provided)
    if (advancementHistory) {
      const limit = TIER_LIMITS[advId] || 1;
      const currentCount = selectionsInTier[advId] || 0;
      if (currentCount >= limit) {
        errors.push({
          field: 'advancements',
          message: `${advId} has reached maximum selections for this tier (${limit}/${limit})`,
        });
      }
    }

    // Check if subclass card can be taken
    if (advId === 'subclass_card') {
      // Tier-based restriction: cannot take if multiclass taken this tier
      if (takenMulticlassInTier || selectedAdvancements.includes('multiclass')) {
        errors.push({
          field: 'advancements',
          message: 'Cannot take upgraded subclass card in the same tier as multiclass',
        });
      }
      // Fallback to old logic if no history provided
      else if (!advancementHistory && isMulticlassedOrHasMastery) {
        errors.push({
          field: 'advancements',
          message: 'Cannot take upgraded subclass card - already have mastery or multiclassed',
        });
      }
    }

    // Check if multiclass can be taken
    if (advId === 'multiclass') {
      // Lifetime restriction: can only multiclass once
      const alreadyMulticlassed = hasMulticlassId !== undefined ? hasMulticlassId : isMulticlassedOrHasMastery;
      if (alreadyMulticlassed) {
        errors.push({
          field: 'advancements',
          message: 'Cannot take multiclass - already multiclassed',
        });
      }
      // Tier-based restriction: cannot take if subclass taken this tier
      else if (takenSubclassInTier || selectedAdvancements.includes('subclass_card')) {
        errors.push({
          field: 'advancements',
          message: 'Cannot take multiclass in the same tier as subclass upgrade',
        });
      }
    }
  }

  return errors;
}

/**
 * Validates domain card selection.
 *
 * Rules:
 * - Must select exactly 1 domain card
 * - Card must be at or below character's level
 * - If multiclassed, card can be from primary or multiclass domains
 */
export function validateDomainCardSelection(
  selectedCardLevel: number,
  characterLevel: number,
  isMulticlass: boolean
): LevelUpValidationError[] {
  const errors: LevelUpValidationError[] = [];

  if (selectedCardLevel > characterLevel) {
    errors.push({
      field: 'domainCard',
      message: `Domain card level (${selectedCardLevel}) must be at or below character level (${characterLevel})`,
    });
  }

  if (selectedCardLevel < 1) {
    errors.push({
      field: 'domainCard',
      message: 'Domain card level must be at least 1',
    });
  }

  return errors;
}

/**
 * Validates trait selection for the "Increase Traits" advancement.
 *
 * Rules:
 * - Must select exactly 2 unmarked traits
 * - Cannot select traits that are already marked (upgraded in this tier)
 * - Cannot select same trait twice
 */
export function validateTraitSelection(
  selectedTraitIds: string[],
  availableTraits: Array<{ id: string; marked: boolean }>,
  alreadyUpgradedTraitsThisTier: Set<string>
): LevelUpValidationError[] {
  const errors: LevelUpValidationError[] = [];

  if (selectedTraitIds.length !== 2) {
    errors.push({
      field: 'traitSelection',
      message: `Must select exactly 2 traits, selected ${selectedTraitIds.length}`,
    });
  }

  // Check for duplicates
  if (new Set(selectedTraitIds).size !== selectedTraitIds.length) {
    errors.push({
      field: 'traitSelection',
      message: 'Cannot select the same trait twice',
    });
  }

  // Check availability
  for (const traitId of selectedTraitIds) {
    const trait = availableTraits.find(t => t.id === traitId);

    if (!trait) {
      errors.push({
        field: 'traitSelection',
        message: `Trait ${traitId} not found`,
      });
      continue;
    }

    if (trait.marked) {
      errors.push({
        field: 'traitSelection',
        message: `Trait ${traitId} is already marked and cannot be upgraded`,
      });
    }

    if (alreadyUpgradedTraitsThisTier.has(traitId)) {
      errors.push({
        field: 'traitSelection',
        message: `Trait ${traitId} has already been upgraded this tier`,
      });
    }
  }

  return errors;
}

/**
 * Validates experience selection for the "Increase Experience" advancement.
 *
 * Rules:
 * - Must select exactly 2 existing experiences
 * - Cannot select same experience twice
 * - All selected experiences must exist on the character
 */
export function validateExperienceSelection(
  selectedExpIndices: number[],
  availableExperiences: Array<any>
): LevelUpValidationError[] {
  const errors: LevelUpValidationError[] = [];

  if (selectedExpIndices.length !== 2) {
    errors.push({
      field: 'experienceSelection',
      message: `Must select exactly 2 experiences, selected ${selectedExpIndices.length}`,
    });
  }

  // Check for duplicates
  if (new Set(selectedExpIndices).size !== selectedExpIndices.length) {
    errors.push({
      field: 'experienceSelection',
      message: 'Cannot select the same experience twice',
    });
  }

  // Check bounds
  for (const idx of selectedExpIndices) {
    if (idx < 0 || idx >= availableExperiences.length) {
      errors.push({
        field: 'experienceSelection',
        message: `Experience at index ${idx} not found`,
      });
    }
  }

  return errors;
}

/**
 * Validates exchange of existing domain card (optional).
 *
 * Rules:
 * - If exchanging, must select an existing domain card
 * - Cannot exchange for a card at a higher level than the one being replaced
 */
export function validateDomainCardExchange(
  exchangeExistingCard: boolean,
  existingCardIdToExchange: string | null,
  existingCardLevel: number | null,
  newCardLevel: number,
  availableDomainCards: Array<{ id: string; level: number }>
): LevelUpValidationError[] {
  const errors: LevelUpValidationError[] = [];

  if (!exchangeExistingCard) {
    return errors; // No validation needed if not exchanging
  }

  if (!existingCardIdToExchange) {
    errors.push({
      field: 'domainCardExchange',
      message: 'Must select a card to exchange',
    });
    return errors;
  }

  if (existingCardLevel === null) {
    errors.push({
      field: 'domainCardExchange',
      message: 'Could not determine level of card being exchanged',
    });
    return errors;
  }

  // New card must be at or below the old card's level
  if (newCardLevel > existingCardLevel) {
    errors.push({
      field: 'domainCardExchange',
      message: `New card (level ${newCardLevel}) must be at or below card being replaced (level ${existingCardLevel})`,
    });
  }

  return errors;
}

/**
 * Validates HP/Stress addition advancement.
 *
 * Rules:
 * - Character can add 1 or more HP or stress slots
 * - Must specify number of slots to add (1 or more)
 */
export function validateVitalSlotAddition(
  vitalType: 'hp' | 'stress',
  slotsToAdd: number
): LevelUpValidationError[] {
  const errors: LevelUpValidationError[] = [];

  if (slotsToAdd < 1) {
    errors.push({
      field: `${vitalType}_slots`,
      message: `Must add at least 1 ${vitalType} slot`,
    });
  }

  if (!Number.isInteger(slotsToAdd)) {
    errors.push({
      field: `${vitalType}_slots`,
      message: `${vitalType} slots must be an integer`,
    });
  }

  return errors;
}

/**
 * Validates the complete level-up wizard submission.
 *
 * Runs all validations and returns combined results.
 */
export function validateCompleteLevelUp(options: {
  currentLevel: number;
  newLevel: number;
  selectedAdvancements: string[];
  selectedDomainCardLevel: number;
  characterLevel: number;
  isMulticlass: boolean;
  isMulticlassedOrHasMastery: boolean;
  availableTraits?: Array<{ id: string; marked: boolean }>;
  alreadyUpgradedTraitsThisTier?: Set<string>;
}): LevelUpValidationError[] {
  const errors: LevelUpValidationError[] = [];

  // Validate level progression
  errors.push(...validateNewLevel(options.currentLevel, options.newLevel));

  // Validate advancements
  errors.push(
    ...validateAdvancementSelections(
      options.selectedAdvancements,
      options.newLevel,
      options.isMulticlassedOrHasMastery
    )
  );

  // Validate domain card
  errors.push(
    ...validateDomainCardSelection(
      options.selectedDomainCardLevel,
      options.newLevel,
      options.isMulticlass
    )
  );

  return errors;
}

/**
 * Checks if level-up is valid (no errors).
 */
export function isLevelUpValid(errors: LevelUpValidationError[]): boolean {
  return errors.length === 0;
}

/**
 * Groups validation errors by field for easier UI display.
 */
export function groupErrorsByField(
  errors: LevelUpValidationError[]
): Record<string, string[]> {
  return errors.reduce(
    (acc, error) => {
      if (!acc[error.field]) {
        acc[error.field] = [];
      }
      acc[error.field].push(error.message);
      return acc;
    },
    {} as Record<string, string[]>
  );
}
