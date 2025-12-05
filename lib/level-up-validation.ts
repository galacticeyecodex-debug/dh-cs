/**
 * Level-Up Validation Functions
 *
 * Validates user selections during the level-up wizard to ensure they follow Daggerheart rules.
 * Reference: srd/markdown/contents/Leveling Up.md
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
 * Validates advancement selections.
 *
 * Rules:
 * - Must select exactly 2 advancement slots (not options, slots)
 * - Some options (Proficiency, Multiclass) cost 2 slots and count as 2
 * - All selections must be available for the character's tier or below
 */
export function validateAdvancementSelections(
  selectedAdvancements: string[],
  characterLevel: number,
  isMulticlassedOrHasMastery: boolean
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

  // Validate each advancement
  for (const advId of selectedAdvancements) {
    // Check if subclass card can be taken
    if (advId === 'subclass_card') {
      if (isMulticlassedOrHasMastery) {
        errors.push({
          field: 'advancements',
          message: 'Cannot take upgraded subclass card - already have mastery or multiclassed',
        });
      }
    }

    // Check if multiclass can be taken
    if (advId === 'multiclass') {
      if (isMulticlassedOrHasMastery) {
        errors.push({
          field: 'advancements',
          message: 'Cannot take multiclass - already multiclassed',
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
