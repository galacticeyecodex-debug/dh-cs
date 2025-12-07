/**
 * LEVEL-UP HELPER TESTS
 * ----------------------------------------------------------------------------
 * This test suite verifies the complex logic surrounding character advancement in Daggerheart.
 * 
 * FUNCTIONALITY TESTED:
 * - Tier Calculations: Checks correct Tier (1-3) derivation from Character Level.
 * - Achievement Milestones: Validates special rewards (Stat increases, Mastery access) at Levels 2, 5, 8.
 * - Advancement Validation: Ensuring users pick valid level-up options (e.g., max 2 picks, valid slot costs).
 * - Threshold Scaling: Verifies HP and Damage Threshold increases per level.
 * - Domain Access: Tests that characters can only pick cards from their specific domains, and enforces
 *   level caps (Full Level for Primary Domains, Half Level for Multiclass Domains).
 */

import {
  getTier,
  hasTierAchievements,
  calculateTierAchievements,
  createNewExperience,
  addExperienceAtLevelUp,
  calculateNewDamageThresholds,
  calculateDamageThresholdsForLevel,
  getAdvancementsForTier,
  isAdvancementAvailable,
  getAdvancementSlotCost,
  validateAdvancementSlots,
  getMaxDomainCardLevel,
  validateDamageThresholds,
  calculateProficiencyIncrease,
  getLevelUpConfig,
  getSubclassesForClass,
  getMaxCardLevelForDomain,
} from '@/lib/level-up-helpers';

describe('getTier', () => {
  it('should return tier 1 for level 1', () => {
    expect(getTier(1)).toBe(1);
  });

  it('should return tier 2 for levels 2-4', () => {
    expect(getTier(2)).toBe(2);
    expect(getTier(3)).toBe(2);
    expect(getTier(4)).toBe(2);
  });

  it('should return tier 3 for levels 5-7', () => {
    expect(getTier(5)).toBe(3);
    expect(getTier(6)).toBe(3);
    expect(getTier(7)).toBe(3);
  });

  it('should return tier 4 for levels 8-10', () => {
    expect(getTier(8)).toBe(4);
    expect(getTier(9)).toBe(4);
    expect(getTier(10)).toBe(4);
  });

  it('should throw error for invalid levels', () => {
    expect(() => getTier(0)).toThrow();
    expect(() => getTier(11)).toThrow();
    expect(() => getTier(-1)).toThrow();
  });
});

describe('hasTierAchievements', () => {
  it('should return true for levels 2, 5, 8', () => {
    expect(hasTierAchievements(2)).toBe(true);
    expect(hasTierAchievements(5)).toBe(true);
    expect(hasTierAchievements(8)).toBe(true);
  });

  it('should return false for other levels', () => {
    expect(hasTierAchievements(1)).toBe(false);
    expect(hasTierAchievements(3)).toBe(false);
    expect(hasTierAchievements(4)).toBe(false);
    expect(hasTierAchievements(6)).toBe(false);
    expect(hasTierAchievements(7)).toBe(false);
    expect(hasTierAchievements(9)).toBe(false);
    expect(hasTierAchievements(10)).toBe(false);
  });
});

describe('calculateTierAchievements', () => {
  describe('level 2', () => {
    it('should provide new experience at +2 and proficiency +1', () => {
      const result = calculateTierAchievements(2);
      expect(result.newExperienceValue).toBe(2);
      expect(result.proficiencyIncrease).toBe(1);
      expect(result.shouldClearMarkedTraits).toBe(false);
    });
  });

  describe('level 5', () => {
    it('should provide new experience, proficiency +1, and clear marked traits', () => {
      const result = calculateTierAchievements(5);
      expect(result.newExperienceValue).toBe(2);
      expect(result.proficiencyIncrease).toBe(1);
      expect(result.shouldClearMarkedTraits).toBe(true);
    });
  });

  describe('level 8', () => {
    it('should provide new experience, proficiency +1, and clear marked traits', () => {
      const result = calculateTierAchievements(8);
      expect(result.newExperienceValue).toBe(2);
      expect(result.proficiencyIncrease).toBe(1);
      expect(result.shouldClearMarkedTraits).toBe(true);
    });
  });

  describe('non-achievement levels', () => {
    it('should return no changes', () => {
      const result = calculateTierAchievements(3);
      expect(result.newExperienceValue).toBeNull();
      expect(result.proficiencyIncrease).toBe(0);
      expect(result.shouldClearMarkedTraits).toBe(false);
    });
  });
});

describe('createNewExperience', () => {
  it('should create a new experience with +2 value', () => {
    const exp = createNewExperience(2, 2);
    expect(exp.value).toBe(2);
    expect(exp.name).toContain('Level 2');
  });

  it('should support custom value', () => {
    const exp = createNewExperience(5, 3);
    expect(exp.value).toBe(3);
  });

  it('should create with correct name format', () => {
    const exp = createNewExperience(8, 2);
    expect(exp.name).toBe('Experience (Level 8)');
  });
});

describe('addExperienceAtLevelUp', () => {
  it('should add new experience to array', () => {
    const existing = [{ name: 'Strength', value: 2 }];
    const result = addExperienceAtLevelUp(existing, 2, 2);
    expect(result).toHaveLength(2);
    expect(result[1].name).toContain('Level 2');
  });

  it('should preserve existing experiences', () => {
    const existing = [
      { name: 'Strength', value: 2 },
      { name: 'Wisdom', value: 1 },
    ];
    const result = addExperienceAtLevelUp(existing, 5, 2);
    expect(result[0].name).toBe('Strength');
    expect(result[1].name).toBe('Wisdom');
    expect(result).toHaveLength(3);
  });
});

describe('calculateNewDamageThresholds', () => {
  it('should increase all thresholds by +1', () => {
    const current = { minor: 1, major: 2, severe: 3 };
    const result = calculateNewDamageThresholds(current);
    expect(result.minor).toBe(2);
    expect(result.major).toBe(3);
    expect(result.severe).toBe(4);
  });

  it('should handle starting thresholds', () => {
    const current = { minor: 1, major: 1, severe: 2 };
    const result = calculateNewDamageThresholds(current);
    expect(result.minor).toBe(2);
    expect(result.major).toBe(2);
    expect(result.severe).toBe(3);
  });
});

describe('calculateDamageThresholdsForLevel', () => {
  describe('unarmored characters', () => {
    it('should use SRD unarmored rules at level 1', () => {
      const result = calculateDamageThresholdsForLevel(1, null);
      expect(result.minor).toBe(1);
      expect(result.major).toBe(1);
      expect(result.severe).toBe(2);
    });

    it('should use SRD unarmored rules at level 5', () => {
      const result = calculateDamageThresholdsForLevel(5, null);
      expect(result.minor).toBe(1);
      expect(result.major).toBe(5);
      expect(result.severe).toBe(10);
    });

    it('should use SRD unarmored rules at level 10', () => {
      const result = calculateDamageThresholdsForLevel(10, null);
      expect(result.minor).toBe(1);
      expect(result.major).toBe(10);
      expect(result.severe).toBe(20);
    });

    it('should handle undefined armor', () => {
      const result = calculateDamageThresholdsForLevel(3, undefined);
      expect(result.minor).toBe(1);
      expect(result.major).toBe(3);
      expect(result.severe).toBe(6);
    });
  });

  describe('armored characters', () => {
    it('should add base thresholds to level (light armor 3/5)', () => {
      const equippedArmor = {
        library_item: {
          data: {
            base_thresholds: '3/5',
          },
        },
      };
      const result = calculateDamageThresholdsForLevel(2, equippedArmor);
      expect(result.minor).toBe(1);
      expect(result.major).toBe(5); // 3 + 2
      expect(result.severe).toBe(7); // 5 + 2
    });

    it('should add base thresholds to level (heavy armor 5/8)', () => {
      const equippedArmor = {
        library_item: {
          data: {
            base_thresholds: '5/8',
          },
        },
      };
      const result = calculateDamageThresholdsForLevel(6, equippedArmor);
      expect(result.minor).toBe(1);
      expect(result.major).toBe(11); // 5 + 6
      expect(result.severe).toBe(14); // 8 + 6
    });

    it('should handle armor with whitespace in thresholds', () => {
      const equippedArmor = {
        library_item: {
          data: {
            base_thresholds: ' 4 / 7 ',
          },
        },
      };
      const result = calculateDamageThresholdsForLevel(3, equippedArmor);
      expect(result.minor).toBe(1);
      expect(result.major).toBe(7); // 4 + 3
      expect(result.severe).toBe(10); // 7 + 3
    });
  });

  describe('edge cases', () => {
    it('should fall back to unarmored if armor data is missing', () => {
      const equippedArmor = {
        library_item: {
          data: {},
        },
      };
      const result = calculateDamageThresholdsForLevel(4, equippedArmor);
      expect(result.minor).toBe(1);
      expect(result.major).toBe(4);
      expect(result.severe).toBe(8);
    });

    it('should fall back to unarmored if thresholds are malformed', () => {
      const equippedArmor = {
        library_item: {
          data: {
            base_thresholds: 'invalid',
          },
        },
      };
      const result = calculateDamageThresholdsForLevel(5, equippedArmor);
      expect(result.minor).toBe(1);
      expect(result.major).toBe(5);
      expect(result.severe).toBe(10);
    });

    it('should fall back to unarmored if thresholds are not numbers', () => {
      const equippedArmor = {
        library_item: {
          data: {
            base_thresholds: 'abc/def',
          },
        },
      };
      const result = calculateDamageThresholdsForLevel(7, equippedArmor);
      expect(result.minor).toBe(1);
      expect(result.major).toBe(7);
      expect(result.severe).toBe(14);
    });

    it('should handle armor without library_item data', () => {
      const equippedArmor = {
        library_item: undefined,
      };
      const result = calculateDamageThresholdsForLevel(2, equippedArmor);
      expect(result.minor).toBe(1);
      expect(result.major).toBe(2);
      expect(result.severe).toBe(4);
    });
  });
});

describe('getAdvancementsForTier', () => {
  it('should return advancements for tier 1', () => {
    const advancements = getAdvancementsForTier(1);
    expect(advancements).toContain('increase_traits');
    expect(advancements).toContain('add_hp');
    expect(advancements).not.toContain('multiclass');
  });

  it('should include multiclass in tier 2 and above', () => {
    const tier2 = getAdvancementsForTier(2);
    const tier3 = getAdvancementsForTier(3);
    const tier4 = getAdvancementsForTier(4);

    expect(tier2).toContain('multiclass');
    expect(tier3).toContain('multiclass');
    expect(tier4).toContain('multiclass');
  });
});

describe('isAdvancementAvailable', () => {
  it('should allow advancement at character tier', () => {
    expect(isAdvancementAvailable(2, 2)).toBe(true);
  });

  it('should allow advancement below character tier', () => {
    expect(isAdvancementAvailable(3, 2)).toBe(true);
    expect(isAdvancementAvailable(4, 1)).toBe(true);
  });

  it('should not allow advancement above character tier', () => {
    expect(isAdvancementAvailable(2, 3)).toBe(false);
    expect(isAdvancementAvailable(1, 4)).toBe(false);
  });
});

describe('getAdvancementSlotCost', () => {
  it('should cost 1 slot for most advancements', () => {
    expect(getAdvancementSlotCost('increase_traits')).toBe(1);
    expect(getAdvancementSlotCost('add_hp')).toBe(1);
    expect(getAdvancementSlotCost('domain_card')).toBe(1);
  });

  it('should cost 2 slots for proficiency and multiclass', () => {
    expect(getAdvancementSlotCost('increase_proficiency')).toBe(2);
    expect(getAdvancementSlotCost('multiclass')).toBe(2);
  });
});

describe('validateAdvancementSlots', () => {
  it('should validate exactly 2 slots', () => {
    const result = validateAdvancementSlots(['add_hp', 'add_stress']);
    expect(result.valid).toBe(true);
    expect(result.totalSlots).toBe(2);
  });

  it('should accept 2-slot advancement alone', () => {
    const result = validateAdvancementSlots(['increase_proficiency']);
    expect(result.valid).toBe(true);
    expect(result.totalSlots).toBe(2);
  });

  it('should reject less than 2 slots', () => {
    const result = validateAdvancementSlots(['add_hp']);
    expect(result.valid).toBe(false);
    expect(result.totalSlots).toBe(1);
  });

  it('should reject more than 2 slots', () => {
    const result = validateAdvancementSlots(['add_hp', 'add_stress', 'increase_evasion']);
    expect(result.valid).toBe(false);
    expect(result.totalSlots).toBe(3);
  });

  it('should reject 1-slot + 2-slot combination (3 total)', () => {
    const result = validateAdvancementSlots(['add_hp', 'increase_proficiency']);
    expect(result.valid).toBe(false);
    expect(result.totalSlots).toBe(3);
  });
});

describe('getMaxDomainCardLevel', () => {
  it('should return character level', () => {
    expect(getMaxDomainCardLevel(5)).toBe(5);
    expect(getMaxDomainCardLevel(10)).toBe(10);
    expect(getMaxDomainCardLevel(1)).toBe(1);
  });
});

describe('validateDamageThresholds', () => {
  it('should accept valid thresholds', () => {
    expect(validateDamageThresholds({ minor: 2, major: 3, severe: 4 })).toBe(true);
    expect(validateDamageThresholds({ minor: 1, major: 2, severe: 3 })).toBe(true);
  });

  it('should reject non-positive minor threshold', () => {
    expect(validateDamageThresholds({ minor: 0, major: 2, severe: 3 })).toBe(false);
  });

  it('should reject improper progression', () => {
    expect(validateDamageThresholds({ minor: 3, major: 2, severe: 4 })).toBe(false);
    expect(validateDamageThresholds({ minor: 1, major: 2, severe: 2 })).toBe(false);
  });
});

describe('calculateProficiencyIncrease', () => {
  it('should give +1 at tier achievement levels', () => {
    expect(calculateProficiencyIncrease(2, [])).toBe(1);
    expect(calculateProficiencyIncrease(5, [])).toBe(1);
    expect(calculateProficiencyIncrease(8, [])).toBe(1);
  });

  it('should give +1 for proficiency advancement', () => {
    expect(calculateProficiencyIncrease(3, ['increase_proficiency'])).toBe(1);
  });

  it('should stack tier achievement + advancement', () => {
    expect(calculateProficiencyIncrease(2, ['increase_proficiency'])).toBe(2);
  });

  it('should give 0 for non-achievement levels without advancement', () => {
    expect(calculateProficiencyIncrease(3, [])).toBe(0);
    expect(calculateProficiencyIncrease(4, [])).toBe(0);
  });
});

describe('getLevelUpConfig', () => {
  it('should provide complete config for level 2', () => {
    const config = getLevelUpConfig(2);
    expect(config.tier).toBe(2);
    expect(config.tierAchievements.newExperienceValue).toBe(2);
    expect(config.maxDomainCardLevel).toBe(2);
  });

  it('should provide complete config for level 5', () => {
    const config = getLevelUpConfig(5);
    expect(config.tier).toBe(3);
    expect(config.tierAchievements.shouldClearMarkedTraits).toBe(true);
    expect(config.maxDomainCardLevel).toBe(5);
  });

  it('should handle non-achievement levels', () => {
    const config = getLevelUpConfig(3);
    expect(config.tier).toBe(2);
    expect(config.tierAchievements.newExperienceValue).toBeNull();
    expect(config.maxDomainCardLevel).toBe(3);
  });
});

describe('getSubclassesForClass', () => {
  it('should return empty array (placeholder implementation)', () => {
    expect(getSubclassesForClass('Warrior')).toEqual([]);
    expect(getSubclassesForClass('Bard')).toEqual([]);
  });

  it('should accept all class names without error', () => {
    const classes = ['Bard', 'Druid', 'Guardian', 'Ranger', 'Rogue', 'Seraph', 'Sorcerer', 'Warrior', 'Wizard'];
    classes.forEach(className => {
      expect(() => getSubclassesForClass(className)).not.toThrow();
    });
  });
});

describe('getMaxCardLevelForDomain', () => {
  describe('primary domains', () => {
    it('should return character level for primary domains', () => {
      expect(getMaxCardLevelForDomain(5, 'Blade', ['Blade', 'Valor'])).toBe(5);
      expect(getMaxCardLevelForDomain(7, 'Valor', ['Blade', 'Valor'])).toBe(7);
    });

    it('should return character level for any primary domain', () => {
      expect(getMaxCardLevelForDomain(3, 'Arcana', ['Arcana', 'Midnight'])).toBe(3);
      expect(getMaxCardLevelForDomain(10, 'Codex', ['Codex', 'Grace'])).toBe(10);
    });
  });

  describe('multiclass domain', () => {
    it('should return half level (rounded up) for multiclass domain', () => {
      expect(getMaxCardLevelForDomain(5, 'Arcana', ['Blade', 'Valor'], 'Arcana')).toBe(3);
      expect(getMaxCardLevelForDomain(6, 'Arcana', ['Blade', 'Valor'], 'Arcana')).toBe(3);
      expect(getMaxCardLevelForDomain(7, 'Arcana', ['Blade', 'Valor'], 'Arcana')).toBe(4);
    });

    it('should round up half level correctly', () => {
      expect(getMaxCardLevelForDomain(5, 'Sage', ['Blade'], 'Sage')).toBe(3);  // ceil(5/2) = 3
      expect(getMaxCardLevelForDomain(9, 'Sage', ['Blade'], 'Sage')).toBe(5);  // ceil(9/2) = 5
      expect(getMaxCardLevelForDomain(10, 'Sage', ['Blade'], 'Sage')).toBe(5); // ceil(10/2) = 5
    });
  });

  describe('case-insensitive matching', () => {
    it('should handle lowercase domain names', () => {
      expect(getMaxCardLevelForDomain(5, 'blade', ['Blade', 'Valor'])).toBe(5);
      expect(getMaxCardLevelForDomain(5, 'ARCANA', ['Blade'], 'arcana')).toBe(3);
    });

    it('should handle mixed case and whitespace', () => {
      expect(getMaxCardLevelForDomain(6, ' BlAdE ', ['Blade', 'Valor'])).toBe(6);
      expect(getMaxCardLevelForDomain(7, ' Valor  ', ['Blade', 'Valor'])).toBe(7);
    });
  });

  describe('unknown domains (error cases)', () => {
    it('should throw error for unknown domains', () => {
      expect(() => getMaxCardLevelForDomain(5, 'Unknown', ['Blade', 'Valor']))
        .toThrow('getMaxCardLevelForDomain called with unknown domain');
    });

    it('should throw error with helpful message', () => {
      expect(() => getMaxCardLevelForDomain(5, 'Sage', ['Blade', 'Valor']))
        .toThrow('Character has access to: Blade, Valor');
    });

    it('should include multiclass domain in error message', () => {
      expect(() => getMaxCardLevelForDomain(5, 'Codex', ['Blade', 'Valor'], 'Arcana'))
        .toThrow('Character has access to: Blade, Valor, Arcana');
    });

    it('should throw for domain not in primary or multiclass list', () => {
      expect(() => getMaxCardLevelForDomain(7, 'Splendor', ['Blade', 'Bone'], 'Arcana'))
        .toThrow('unknown domain "Splendor"');
    });
  });

  describe('edge cases', () => {
    it('should handle level 1 character', () => {
      expect(getMaxCardLevelForDomain(1, 'Blade', ['Blade', 'Valor'])).toBe(1);
    });

    it('should handle level 10 character', () => {
      expect(getMaxCardLevelForDomain(10, 'Blade', ['Blade', 'Valor'])).toBe(10);
    });

    it('should handle multiclass at level 5 (minimum multiclass level)', () => {
      expect(getMaxCardLevelForDomain(5, 'Arcana', ['Blade'], 'Arcana')).toBe(3);
    });

    it('should prioritize primary domain over multiclass if both match', () => {
      // If a domain appears in both primary and multiclass (shouldn't happen, but test it)
      expect(getMaxCardLevelForDomain(6, 'Blade', ['Blade', 'Valor'], 'Blade')).toBe(6);
    });
  });
});
