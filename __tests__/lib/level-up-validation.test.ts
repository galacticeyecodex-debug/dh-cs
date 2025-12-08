/**
 * LEVEL-UP VALIDATION TESTS
 * ----------------------------------------------------------------------------
 * This test suite validates the form-like validation rules for the Level-up process.
 * 
 * FUNCTIONALITY TESTED:
 * - Level Progression: Ensures users can only level up forward (e.g., 1 -> 2) and within bounds (1-10).
 * - Advancement Selections: Validates the user selects exactly 2 "slots" worth of upgrades (e.g., 1 Proficiency or 2 Stat bumps).
 * - Domain Card Rules: Checks that new cards are within valid level ranges and handles multiclass logic.
 * - Trait Selection Rules: Enforces Daggerheart specific rules:
 *   - Cannot check a trait that is already "Marked" (maxed for this tier).
 *   - Cannot upgrade the same trait twice in one level-up.
 * - Exchange Logic: Validates trading old cards for new ones adheres to level-swapping rules.
 */

import {
  validateNewLevel,
  validateAdvancementSelections,
  validateDomainCardSelection,
  validateTraitSelection,
  validateExperienceSelection,
  validateDomainCardExchange,
  validateVitalSlotAddition,
  validateCompleteLevelUp,
  isLevelUpValid,
  groupErrorsByField,
} from '@/lib/level-up-validation';

describe('validateNewLevel', () => {
  it('should accept valid level progression', () => {
    expect(validateNewLevel(1, 2)).toEqual([]);
    expect(validateNewLevel(5, 10)).toEqual([]);
  });

  it('should reject level regression', () => {
    const errors = validateNewLevel(5, 3);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('newLevel');
  });

  it('should reject same level', () => {
    const errors = validateNewLevel(5, 5);
    expect(errors).toHaveLength(1);
  });

  it('should reject level 0 or below', () => {
    const errors = validateNewLevel(5, 0);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject level above 10', () => {
    const errors = validateNewLevel(5, 11);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('validateAdvancementSelections', () => {
  it('should reject single 1-slot advancement (needs 2 slots)', () => {
    const errors = validateAdvancementSelections(['add_hp'], 2, false);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should accept valid 2-slot advancement', () => {
    const errors = validateAdvancementSelections(['increase_proficiency'], 2, false);
    expect(errors).toEqual([]);
  });

  it('should accept valid combination totaling 2 slots', () => {
    const errors = validateAdvancementSelections(['add_hp', 'add_stress'], 2, false);
    expect(errors).toEqual([]);
  });

  it('should reject empty selection', () => {
    const errors = validateAdvancementSelections([], 2, false);
    expect(errors).toHaveLength(1);
  });

  it('should reject slot count not equal to 2', () => {
    const errors1 = validateAdvancementSelections(['add_hp'], 2, false);
    const errors3 = validateAdvancementSelections(['add_hp', 'add_stress', 'increase_evasion'], 2, false);

    expect(errors1.length).toBeGreaterThan(0);
    expect(errors3.length).toBeGreaterThan(0);
  });

  it('should reject subclass card if already has mastery', () => {
    const errors = validateAdvancementSelections(['subclass_card'], 3, true);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject multiclass if already multiclassed', () => {
    const errors = validateAdvancementSelections(['multiclass'], 3, true);
    expect(errors.length).toBeGreaterThan(0);
  });

  describe('enhanced validation with advancement history', () => {
    it('should enforce tier limits for trait increases', () => {
      const history = {
        2: { advancements: ['increase_traits'] },
        3: { advancements: ['increase_traits'] },
        4: { advancements: ['increase_traits'] },
      };
      const errors = validateAdvancementSelections(
        ['increase_traits', 'add_hp'],
        4,
        false,
        history
      );
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('maximum selections for this tier');
    });

    it('should allow trait increase if under tier limit', () => {
      const history = {
        2: { advancements: ['increase_traits'] },
        3: { advancements: ['add_hp', 'add_stress'] },
      };
      const errors = validateAdvancementSelections(
        ['increase_traits', 'add_hp'],
        4,
        false,
        history
      );
      expect(errors).toEqual([]);
    });

    it('should enforce tier limits for HP additions', () => {
      const history = {
        2: { advancements: ['add_hp', 'add_stress'] },
        3: { advancements: ['add_hp', 'increase_evasion'] },
      };
      const errors = validateAdvancementSelections(
        ['add_hp', 'increase_traits'],
        4,
        false,
        history
      );
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('maximum selections for this tier');
    });

    it('should enforce minimum level for multiclass', () => {
      const errors = validateAdvancementSelections(['multiclass'], 3, false);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('requires level 5');
    });

    it('should allow multiclass at level 5+', () => {
      const errors = validateAdvancementSelections(['multiclass'], 5, false);
      expect(errors).toEqual([]);
    });

    it('should reject multiclass if subclass taken this tier', () => {
      const history = {
        5: { advancements: ['subclass_card', 'increase_evasion'] },
      };
      const errors = validateAdvancementSelections(
        ['multiclass'],
        6,
        false,
        history,
        false
      );
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('same tier');
    });

    it('should reject subclass if multiclass taken this tier', () => {
      const history = {
        5: { advancements: ['multiclass'] },
      };
      const errors = validateAdvancementSelections(
        ['subclass_card', 'add_hp'],
        6,
        false,
        history,
        true
      );
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('same tier');
    });

    it('should allow multiclass and subclass in different tiers', () => {
      const history = {
        3: { advancements: ['subclass_card', 'increase_evasion'] },
      };
      const errors = validateAdvancementSelections(
        ['multiclass'],
        5,
        false,
        history,
        false
      );
      expect(errors).toEqual([]);
    });

    it('should reject multiclass in same selection as subclass', () => {
      const errors = validateAdvancementSelections(
        ['multiclass', 'subclass_card'],
        5,
        false,
        {},
        false
      );
      // Multiclass costs 2 slots, so this would be 3 slots total
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should use hasMulticlassId for lifetime restriction', () => {
      const errors = validateAdvancementSelections(
        ['multiclass'],
        5,
        false,
        {},
        true // Already has multiclass
      );
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('already multiclassed');
    });

    it('should count selections across different levels in same tier', () => {
      const history = {
        2: { advancements: ['add_hp', 'add_stress'] },
        3: { advancements: ['add_hp', 'increase_evasion'] },
      };
      const errors = validateAdvancementSelections(
        ['add_hp', 'increase_traits'],
        4,
        false,
        history
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reset tier limit counts when entering new tier', () => {
      const history = {
        2: { advancements: ['add_hp', 'add_stress'] },
        3: { advancements: ['add_hp', 'increase_evasion'] },
        4: { advancements: ['increase_traits', 'add_stress'] },
      };
      // Level 5 is new tier (Tier 3), so HP limit resets
      const errors = validateAdvancementSelections(
        ['add_hp', 'add_stress'],
        5,
        false,
        history
      );
      expect(errors).toEqual([]);
    });
  });
});

describe('validateDomainCardSelection', () => {
  it('should accept card at character level', () => {
    const errors = validateDomainCardSelection(5, 5, false);
    expect(errors).toEqual([]);
  });

  it('should accept card below character level', () => {
    const errors = validateDomainCardSelection(3, 5, false);
    expect(errors).toEqual([]);
  });

  it('should reject card above character level', () => {
    const errors = validateDomainCardSelection(6, 5, false);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('domainCard');
  });

  it('should reject level 0', () => {
    const errors = validateDomainCardSelection(0, 5, false);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should allow multiclass parameter', () => {
    const errors1 = validateDomainCardSelection(2, 5, false);
    const errors2 = validateDomainCardSelection(2, 5, true);
    expect(errors1).toEqual(errors2);
  });
});

describe('validateTraitSelection', () => {
  const availableTraits = [
    { id: 'agility', marked: false },
    { id: 'strength', marked: false },
    { id: 'finesse', marked: true },
    { id: 'instinct', marked: false },
  ];

  it('should accept valid 2 trait selection', () => {
    const errors = validateTraitSelection(['agility', 'strength'], availableTraits, new Set());
    expect(errors).toEqual([]);
  });

  it('should reject wrong number of traits', () => {
    const errors1 = validateTraitSelection(['agility'], availableTraits, new Set());
    const errors3 = validateTraitSelection(['agility', 'strength', 'instinct'], availableTraits, new Set());

    expect(errors1.length).toBeGreaterThan(0);
    expect(errors3.length).toBeGreaterThan(0);
  });

  it('should reject duplicate traits', () => {
    const errors = validateTraitSelection(['agility', 'agility'], availableTraits, new Set());
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject marked traits', () => {
    const errors = validateTraitSelection(['agility', 'finesse'], availableTraits, new Set());
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject traits already upgraded this tier', () => {
    const upgraded = new Set(['strength']);
    const errors = validateTraitSelection(['agility', 'strength'], availableTraits, upgraded);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject non-existent traits', () => {
    const errors = validateTraitSelection(['agility', 'nonexistent'], availableTraits, new Set());
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('validateExperienceSelection', () => {
  const availableExperiences = [
    { name: 'Strength', value: 2 },
    { name: 'Wisdom', value: 1 },
    { name: 'Dexterity', value: 3 },
  ];

  it('should accept valid 2 experience selection', () => {
    const errors = validateExperienceSelection([0, 1], availableExperiences);
    expect(errors).toEqual([]);
  });

  it('should reject wrong number of experiences', () => {
    const errors1 = validateExperienceSelection([0], availableExperiences);
    const errors3 = validateExperienceSelection([0, 1, 2], availableExperiences);

    expect(errors1.length).toBeGreaterThan(0);
    expect(errors3.length).toBeGreaterThan(0);
  });

  it('should reject duplicate experiences', () => {
    const errors = validateExperienceSelection([0, 0], availableExperiences);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject out of bounds indices', () => {
    const errors = validateExperienceSelection([0, 5], availableExperiences);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('validateDomainCardExchange', () => {
  const availableCards = [
    { id: 'card1', level: 2 },
    { id: 'card2', level: 3 },
  ];

  it('should not validate if not exchanging', () => {
    const errors = validateDomainCardExchange(false, null, null, 3, availableCards);
    expect(errors).toEqual([]);
  });

  it('should reject exchange without selecting card', () => {
    const errors = validateDomainCardExchange(true, null, 2, 3, availableCards);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject new card higher level than old card', () => {
    const errors = validateDomainCardExchange(true, 'card1', 2, 3, availableCards);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should accept exchange at same level', () => {
    const errors = validateDomainCardExchange(true, 'card1', 2, 2, availableCards);
    expect(errors).toEqual([]);
  });

  it('should accept exchange at lower level', () => {
    const errors = validateDomainCardExchange(true, 'card2', 3, 2, availableCards);
    expect(errors).toEqual([]);
  });
});

describe('validateVitalSlotAddition', () => {
  it('should accept 1 or more HP slots', () => {
    expect(validateVitalSlotAddition('hp', 1)).toEqual([]);
    expect(validateVitalSlotAddition('hp', 5)).toEqual([]);
  });

  it('should accept 1 or more stress slots', () => {
    expect(validateVitalSlotAddition('stress', 1)).toEqual([]);
    expect(validateVitalSlotAddition('stress', 3)).toEqual([]);
  });

  it('should reject 0 slots', () => {
    const errors = validateVitalSlotAddition('hp', 0);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject negative slots', () => {
    const errors = validateVitalSlotAddition('hp', -1);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject non-integer slots', () => {
    const errors = validateVitalSlotAddition('hp', 1.5);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('validateCompleteLevelUp', () => {
  it('should accept valid complete level-up', () => {
    const errors = validateCompleteLevelUp({
      currentLevel: 1,
      newLevel: 2,
      selectedAdvancements: ['add_hp', 'add_stress'],
      selectedDomainCardLevel: 2,
      characterLevel: 2,
      isMulticlass: false,
      isMulticlassedOrHasMastery: false,
    });

    expect(errors).toEqual([]);
  });

  it('should catch level validation errors', () => {
    const errors = validateCompleteLevelUp({
      currentLevel: 5,
      newLevel: 5,
      selectedAdvancements: ['add_hp', 'add_stress'],
      selectedDomainCardLevel: 5,
      characterLevel: 5,
      isMulticlass: false,
      isMulticlassedOrHasMastery: false,
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should catch advancement errors', () => {
    const errors = validateCompleteLevelUp({
      currentLevel: 1,
      newLevel: 2,
      selectedAdvancements: ['add_hp'], // Only 1 slot
      selectedDomainCardLevel: 2,
      characterLevel: 2,
      isMulticlass: false,
      isMulticlassedOrHasMastery: false,
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should catch domain card errors', () => {
    const errors = validateCompleteLevelUp({
      currentLevel: 1,
      newLevel: 2,
      selectedAdvancements: ['add_hp', 'add_stress'],
      selectedDomainCardLevel: 5, // Above character level
      characterLevel: 2,
      isMulticlass: false,
      isMulticlassedOrHasMastery: false,
    });

    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('isLevelUpValid', () => {
  it('should return true for empty errors array', () => {
    expect(isLevelUpValid([])).toBe(true);
  });

  it('should return false for any errors', () => {
    const errors = [{ field: 'test', message: 'test error' }];
    expect(isLevelUpValid(errors)).toBe(false);
  });
});

describe('groupErrorsByField', () => {
  it('should group errors by field', () => {
    const errors = [
      { field: 'advancements', message: 'Error 1' },
      { field: 'advancements', message: 'Error 2' },
      { field: 'domainCard', message: 'Error 3' },
    ];

    const grouped = groupErrorsByField(errors);
    expect(grouped['advancements']).toHaveLength(2);
    expect(grouped['domainCard']).toHaveLength(1);
  });

  it('should handle empty errors array', () => {
    const grouped = groupErrorsByField([]);
    expect(Object.keys(grouped)).toHaveLength(0);
  });

  it('should handle single error', () => {
    const errors = [{ field: 'test', message: 'test error' }];
    const grouped = groupErrorsByField(errors);
    expect(grouped['test']).toEqual(['test error']);
  });
});
