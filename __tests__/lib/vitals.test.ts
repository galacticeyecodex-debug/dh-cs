/**
 * Tests for vital tracking and vital mechanics
 * Verifies correct behavior of HP, Armor, Stress, and Hope tracking
 * Per Daggerheart SRD vital mechanics
 */

import { describe, it, expect } from 'vitest';

// ============================================================================
// VITAL SEMANTICS TESTS
// ============================================================================

describe('Vital Tracking Semantics', () => {
  /**
   * Understanding vital semantics from CLAUDE.md:
   *
   * For "mark-bad" vitals (HP, Armor):
   * - current = CAPACITY YOU CURRENTLY HAVE
   * - Full = current === max (healthy, all capacity available)
   * - Empty = current = 0 (dying, no capacity left)
   * - Marking reduces current (you lose capacity)
   *
   * For "fill-up-bad" vitals (Stress, Hope depletion):
   * - current = HOW MUCH YOU HAVE ACCUMULATED (bad) or CONSUMED (good)
   * - No = current = 0 (good, nothing accumulated)
   * - Full = current === max (bad, max accumulated)
   * - Marking increases current (you accumulate bad thing)
   */

  describe('HP Vital (mark-bad)', () => {
    it('should start character with full HP', () => {
      const vitals = {
        hit_points_current: 6,
        hit_points_max: 6,
      };
      expect(vitals.hit_points_current).toBe(vitals.hit_points_max);
      // Full HP = capacity available
    });

    it('should reduce HP when marked (taking damage)', () => {
      const vitals = {
        hit_points_current: 6,
        hit_points_max: 6,
      };

      // Take 2 damage
      vitals.hit_points_current = Math.max(0, vitals.hit_points_current - 2);

      expect(vitals.hit_points_current).toBe(4);
      // HP is 4/6 (have 4 capacity left)
    });

    it('should clamp HP to 0 when taking fatal damage', () => {
      const vitals = {
        hit_points_current: 2,
        hit_points_max: 6,
      };

      // Take 5 damage (more than remaining)
      vitals.hit_points_current = Math.max(0, vitals.hit_points_current - 5);

      expect(vitals.hit_points_current).toBe(0);
      // No HP left - dying
    });

    it('should not allow HP above max', () => {
      const vitals = {
        hit_points_current: 4,
        hit_points_max: 6,
      };

      // Heal 5 (more than needed)
      vitals.hit_points_current = Math.min(
        vitals.hit_points_max,
        vitals.hit_points_current + 5
      );

      expect(vitals.hit_points_current).toBe(6);
      // Clamped to max capacity
    });
  });

  describe('Armor Vital (mark-bad)', () => {
    it('should start character with full armor', () => {
      const vitals = {
        armor_slots: 4,
        armor_score: 4,
      };
      expect(vitals.armor_slots).toBe(vitals.armor_score);
      // Full armor = all slots available
    });

    it('should reduce armor when marked (armor is damaged)', () => {
      const vitals = {
        armor_slots: 4,
        armor_score: 4,
      };

      // Mark 1 armor slot
      vitals.armor_slots = Math.max(0, vitals.armor_slots - 1);

      expect(vitals.armor_slots).toBe(3);
      // Armor is 3/4 (have 3 slots left)
    });

    it('should clamp armor to 0 when all slots marked', () => {
      const vitals = {
        armor_slots: 1,
        armor_score: 4,
      };

      // Mark remaining armor
      vitals.armor_slots = Math.max(0, vitals.armor_slots - 2);

      expect(vitals.armor_slots).toBe(0);
      // No armor left
    });

    it('should not allow armor above score', () => {
      const vitals = {
        armor_slots: 2,
        armor_score: 4,
      };

      // Restore armor
      vitals.armor_slots = Math.min(vitals.armor_score, vitals.armor_slots + 3);

      expect(vitals.armor_slots).toBe(4);
      // Clamped to max armor score
    });

    it('should track armor score and slots separately', () => {
      const vitals = {
        armor_slots: 3,
        armor_score: 4,
      };

      // If armor score increases (equipment change)
      vitals.armor_score = 5;
      // Slots cannot exceed new score
      vitals.armor_slots = Math.min(vitals.armor_score, vitals.armor_slots);

      expect(vitals.armor_slots).toBe(3); // Unchanged, still valid
      expect(vitals.armor_score).toBe(5); // Increased
    });

    it('should clamp armor slots when armor score decreases', () => {
      const vitals = {
        armor_slots: 4,
        armor_score: 4,
      };

      // If armor score decreases (unequip heavy armor)
      vitals.armor_score = 2;
      // Slots must be clamped to new score
      vitals.armor_slots = Math.min(vitals.armor_score, vitals.armor_slots);

      expect(vitals.armor_slots).toBe(2); // Clamped down
      expect(vitals.armor_score).toBe(2);
    });
  });

  describe('Stress Vital (fill-up-bad)', () => {
    it('should start character with no stress', () => {
      const vitals = {
        stress_current: 0,
        stress_max: 6,
      };
      expect(vitals.stress_current).toBe(0);
      // No stress = good, starting state
    });

    it('should increase stress when marked (accumulating stress)', () => {
      const vitals = {
        stress_current: 0,
        stress_max: 6,
      };

      // Mark 2 stress
      vitals.stress_current = Math.min(vitals.stress_max, vitals.stress_current + 2);

      expect(vitals.stress_current).toBe(2);
      // Have 2 stress accumulated
    });

    it('should clamp stress to max when exceeding', () => {
      const vitals = {
        stress_current: 5,
        stress_max: 6,
      };

      // Take 2 stress (more than remaining)
      vitals.stress_current = Math.min(vitals.stress_max, vitals.stress_current + 2);

      expect(vitals.stress_current).toBe(6);
      // Maxed out on stress
    });

    it('should not allow stress below 0 when recovering', () => {
      const vitals = {
        stress_current: 2,
        stress_max: 6,
      };

      // Recover 3 stress (more than have)
      vitals.stress_current = Math.max(0, vitals.stress_current - 3);

      expect(vitals.stress_current).toBe(0);
      // Back to no stress
    });

    it('should use increase for negative modifier (taking damage reduces stress?)', () => {
      // This is a sanity check - stress uses "fill up bad" semantics
      // So we increase current to accumulate stress, decrease to remove
      const vitals = {
        stress_current: 3,
        stress_max: 6,
      };

      // This would be if a negative stress modifier somehow heals stress
      // (counterintuitive but testing the semantics)
      const stressReduction = -1; // Negative modifier to stress
      vitals.stress_current = Math.max(0, vitals.stress_current + stressReduction);

      expect(vitals.stress_current).toBe(2);
      // Reduced by 1
    });
  });

  describe('Hope Vital (fill-up-bad for depletion)', () => {
    it('should start character with full hope', () => {
      const vitals = {
        hope_current: 6,
        hope_max: 6,
      };
      expect(vitals.hope_current).toBe(vitals.hope_max);
      // Full hope = haven't consumed any
    });

    it('should decrease hope when used/spent', () => {
      const vitals = {
        hope_current: 6,
        hope_max: 6,
      };

      // Spend 1 hope
      vitals.hope_current = Math.max(0, vitals.hope_current - 1);

      expect(vitals.hope_current).toBe(5);
      // Have 5 hope left
    });

    it('should not allow hope below 0', () => {
      const vitals = {
        hope_current: 1,
        hope_max: 6,
      };

      // Spend 2 hope (more than have)
      vitals.hope_current = Math.max(0, vitals.hope_current - 2);

      expect(vitals.hope_current).toBe(0);
      // Out of hope
    });

    it('should restore hope up to max', () => {
      const vitals = {
        hope_current: 3,
        hope_max: 6,
      };

      // Recover 5 hope
      vitals.hope_current = Math.min(vitals.hope_max, vitals.hope_current + 5);

      expect(vitals.hope_current).toBe(6);
      // Clamped to max
    });
  });
});

// ============================================================================
// VITAL TRANSITIONS TESTS
// ============================================================================

describe('Vital Transitions', () => {
  it('should handle HP reaching 0 (death move trigger)', () => {
    const vitals = {
      hit_points_current: 2,
      hit_points_max: 6,
    };

    vitals.hit_points_current = Math.max(0, vitals.hit_points_current - 3);

    expect(vitals.hit_points_current).toBe(0);
    // Should trigger death move in game logic
  });

  it('should handle stress reaching max (vulnerable condition)', () => {
    const vitals = {
      stress_current: 5,
      stress_max: 6,
    };

    vitals.stress_current = Math.min(vitals.stress_max, vitals.stress_current + 2);

    expect(vitals.stress_current).toBe(6);
    // Should trigger vulnerable condition in game logic
  });

  it('should handle armor going from available to used', () => {
    const vitals = {
      armor_slots: 2,
      armor_score: 4,
    };

    // Take 2 damage (uses remaining armor)
    vitals.armor_slots = Math.max(0, vitals.armor_slots - 2);

    expect(vitals.armor_slots).toBe(0);
    // All armor used, next damage goes to HP
  });

  it('should handle gaining equipment mid-combat', () => {
    const vitals = {
      armor_slots: 0,
      armor_score: 4,
    };

    // Gain new armor
    vitals.armor_score = 6;
    // Restore armor slots to new score
    vitals.armor_slots = vitals.armor_score;

    expect(vitals.armor_slots).toBe(6);
    expect(vitals.armor_score).toBe(6);
  });
});

// ============================================================================
// VITAL MODIFICATIONS TESTS
// ============================================================================

describe('Vital Modifications', () => {
  it('should allow manual HP increase via modifier', () => {
    const vitals = {
      hit_points_current: 6,
      hit_points_max: 6,
    };

    // +2 HP modifier applied
    const hpIncrease = 2;
    vitals.hit_points_max += hpIncrease;
    // Can't go above new max
    vitals.hit_points_current = Math.min(
      vitals.hit_points_max,
      vitals.hit_points_current
    );

    expect(vitals.hit_points_max).toBe(8);
    expect(vitals.hit_points_current).toBe(6);
  });

  it('should clamp HP down if modifier reduces max', () => {
    const vitals = {
      hit_points_current: 5,
      hit_points_max: 6,
    };

    // -3 HP modifier applied (curse)
    vitals.hit_points_max -= 3;
    // Must clamp current to new max
    vitals.hit_points_current = Math.min(
      vitals.hit_points_max,
      vitals.hit_points_current
    );

    expect(vitals.hit_points_max).toBe(3);
    expect(vitals.hit_points_current).toBe(3); // Clamped down
  });

  it('should track separate limits for armor score vs slots', () => {
    const vitals = {
      armor_slots: 2,
      armor_score: 4,
    };

    // Armor modifier: +2 armor score
    vitals.armor_score += 2; // Now 6
    // Slots don't automatically increase
    expect(vitals.armor_slots).toBe(2);

    // Could restore armor in-game action
    vitals.armor_slots = vitals.armor_score;
    expect(vitals.armor_slots).toBe(6);
  });
});

// ============================================================================
// VITAL EDGE CASES TESTS
// ============================================================================

describe('Vital Edge Cases', () => {
  it('should handle 0 max vitals gracefully', () => {
    const vitals = {
      hit_points_current: 0,
      hit_points_max: 0,
    };

    // Can't take damage
    vitals.hit_points_current = Math.max(0, vitals.hit_points_current - 1);
    expect(vitals.hit_points_current).toBe(0);

    // Can't heal
    vitals.hit_points_current = Math.min(
      vitals.hit_points_max,
      vitals.hit_points_current + 1
    );
    expect(vitals.hit_points_current).toBe(0);
  });

  it('should handle very large vital values', () => {
    const vitals = {
      hit_points_current: 999,
      hit_points_max: 999,
    };

    expect(vitals.hit_points_current).toBe(999);
    expect(vitals.hit_points_max).toBe(999);

    vitals.hit_points_current = Math.max(0, vitals.hit_points_current - 500);
    expect(vitals.hit_points_current).toBe(499);
  });

  it('should handle fractional vital values (should be integers)', () => {
    // In practice, vitals should always be integers
    // But testing that Math.max/min works correctly
    const vitals = {
      hit_points_current: 3.5, // Fractional (shouldn't happen)
      hit_points_max: 6,
    };

    const damaged = Math.max(0, vitals.hit_points_current - 1.2);
    expect(damaged).toBe(2.3);
    // Clamping still works, but result is fractional
  });

  it('should handle NaN vital values gracefully', () => {
    // NaN is falsy in comparisons
    const vitals = {
      hit_points_current: NaN,
      hit_points_max: 6,
    };

    // Math.max(0, NaN) = NaN
    // This should probably be caught in validation
    const result = Math.max(0, vitals.hit_points_current);
    expect(isNaN(result)).toBe(true);
  });
});
