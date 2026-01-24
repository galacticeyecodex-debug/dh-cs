/**
 * UTILS TESTS
 * ----------------------------------------------------------------------------
 * This test suite validates the shared utility functions found in `lib/utils.ts`.
 * 
 * FUNCTIONALITY TESTED:
 * - Weapon Damage Scaling: Verifies the `calculateWeaponDamage` function, which mathematically 
 *   scales dice counts based on items/attributes (e.g., "d8" -> "2d8" at higher levels).
 * - Dice & Modifiers: Checks that multipliers apply correctly to the dice count while leaving 
 *   fixed modifiers (e.g., "+2") unchanged.
 * - Robustness: Ensures the utility handles mixed dice types (e.g., "d8+d6") and gracefully 
 *   manages invalid or empty input strings.
 */

import { describe, it, expect } from 'vitest';
import { calculateWeaponDamage } from '@/lib/utils';
import { calculateAttackBonus, calculateDamageBonus } from '@/lib/roll-utils';

describe('calculateWeaponDamage', () => {
  it('scales single die correctly', () => {
    expect(calculateWeaponDamage('d8', 2)).toBe('2d8');
    expect(calculateWeaponDamage('1d8', 2)).toBe('2d8');
    expect(calculateWeaponDamage('d8', 3)).toBe('3d8');
  });

  it('scales multiple dice correctly', () => {
    expect(calculateWeaponDamage('2d6', 2)).toBe('4d6');
    expect(calculateWeaponDamage('3d4', 3)).toBe('9d4');
  });

  it('preserves modifiers', () => {
    expect(calculateWeaponDamage('d8+2', 2)).toBe('2d8+2');
    expect(calculateWeaponDamage('1d10-1', 2)).toBe('2d10-1');
    expect(calculateWeaponDamage('2d6+3', 3)).toBe('6d6+3');
  });

  it('handles mixed dice types', () => {
    // This is a rare case in Daggerheart but good for robustness
    // "d8+d6" -> "2d8+2d6"
    expect(calculateWeaponDamage('d8+d6', 2)).toBe('2d8+2d6');
  });

  it('handles empty or invalid input', () => {
    expect(calculateWeaponDamage('', 2)).toBe('');
    // If no dice found, returns original string
    expect(calculateWeaponDamage('5', 2)).toBe('5');
  });
});

// ============================================================================
// ATTACK MODIFIER CALCULATION TESTS
// ============================================================================

describe('calculateAttackBonus', () => {
  it('should return 0 for null character', () => {
    expect(calculateAttackBonus(null)).toBe(0);
  });

  it('should return 0 for character with no modifiers', () => {
    const character = {
      character_inventory: [],
      modifiers: {},
    };
    expect(calculateAttackBonus(character)).toBe(0);
  });

  it('should calculate system modifiers from equipped weapon', () => {
    const character = {
      character_inventory: [
        {
          id: 'weapon1',
          name: 'Broadsword',
          location: 'equipped_primary',
          library_item: {
            data: {
              modifiers: [
                { id: 'mod1', type: 'combat', target: 'attack', value: 1, operator: 'add' }
              ],
            },
          },
        },
      ],
      modifiers: {},
    };
    expect(calculateAttackBonus(character)).toBe(1);
  });

  it('should sum multiple attack modifiers', () => {
    const character = {
      character_inventory: [
        {
          id: 'weapon1',
          name: 'Broadsword',
          location: 'equipped_primary',
          library_item: {
            data: {
              modifiers: [
                { id: 'mod1', type: 'combat', target: 'attack', value: 1, operator: 'add' }
              ],
            },
          },
        },
        {
          id: 'armor1',
          name: 'Magic Armor',
          location: 'equipped_armor',
          library_item: {
            data: {
              modifiers: [
                { id: 'mod2', type: 'combat', target: 'attack', value: 2, operator: 'add' }
              ],
            },
          },
        },
      ],
      modifiers: {},
    };
    expect(calculateAttackBonus(character)).toBe(3);
  });

  it('should include user-added modifiers', () => {
    const character = {
      character_inventory: [],
      modifiers: {
        attack: [
          { id: 'user1', name: 'Buff', value: 2, source: 'user' }
        ],
      },
    };
    expect(calculateAttackBonus(character)).toBe(2);
  });

  it('should combine system and user modifiers', () => {
    const character = {
      character_inventory: [
        {
          id: 'weapon1',
          name: 'Broadsword',
          location: 'equipped_primary',
          library_item: {
            data: {
              modifiers: [
                { id: 'mod1', type: 'combat', target: 'attack', value: 1, operator: 'add' }
              ],
            },
          },
        },
      ],
      modifiers: {
        attack: [
          { id: 'user1', name: 'Buff', value: 2, source: 'user' }
        ],
      },
    };
    expect(calculateAttackBonus(character)).toBe(3);
  });

  it('should handle negative modifiers', () => {
    const character = {
      character_inventory: [
        {
          id: 'weapon1',
          name: 'Cursed Sword',
          location: 'equipped_primary',
          library_item: {
            data: {
              modifiers: [
                { id: 'mod1', type: 'combat', target: 'attack', value: -1, operator: 'subtract' }
              ],
            },
          },
        },
      ],
      modifiers: {},
    };
    expect(calculateAttackBonus(character)).toBe(-1);
  });
});

// ============================================================================
// DAMAGE MODIFIER CALCULATION TESTS
// ============================================================================

describe('calculateDamageBonus', () => {
  it('should return 0 for null character', () => {
    expect(calculateDamageBonus(null)).toBe(0);
  });

  it('should return 0 for character with no modifiers', () => {
    const character = {
      character_inventory: [],
      modifiers: {},
    };
    expect(calculateDamageBonus(character)).toBe(0);
  });

  it('should calculate system modifiers from equipped weapon', () => {
    const character = {
      character_inventory: [
        {
          id: 'weapon1',
          name: 'Magic Sword',
          location: 'equipped_primary',
          library_item: {
            data: {
              modifiers: [
                { id: 'mod1', type: 'combat', target: 'damage', value: 2, operator: 'add' }
              ],
            },
          },
        },
      ],
      modifiers: {},
    };
    expect(calculateDamageBonus(character)).toBe(2);
  });

  it('should sum multiple damage modifiers', () => {
    const character = {
      character_inventory: [
        {
          id: 'weapon1',
          name: 'Magic Sword',
          location: 'equipped_primary',
          library_item: {
            data: {
              modifiers: [
                { id: 'mod1', type: 'combat', target: 'damage', value: 2, operator: 'add' }
              ],
            },
          },
        },
        {
          id: 'armor1',
          name: 'Spiked Armor',
          location: 'equipped_armor',
          library_item: {
            data: {
              modifiers: [
                { id: 'mod2', type: 'combat', target: 'damage', value: 1, operator: 'add' }
              ],
            },
          },
        },
      ],
      modifiers: {},
    };
    expect(calculateDamageBonus(character)).toBe(3);
  });

  it('should include user-added modifiers', () => {
    const character = {
      character_inventory: [],
      modifiers: {
        damage: [
          { id: 'user1', name: 'Rage', value: 3, source: 'user' }
        ],
      },
    };
    expect(calculateDamageBonus(character)).toBe(3);
  });

  it('should combine system and user modifiers', () => {
    const character = {
      character_inventory: [
        {
          id: 'weapon1',
          name: 'Magic Sword',
          location: 'equipped_primary',
          library_item: {
            data: {
              modifiers: [
                { id: 'mod1', type: 'combat', target: 'damage', value: 2, operator: 'add' }
              ],
            },
          },
        },
      ],
      modifiers: {
        damage: [
          { id: 'user1', name: 'Rage', value: 3, source: 'user' }
        ],
      },
    };
    expect(calculateDamageBonus(character)).toBe(5);
  });

  it('should handle negative modifiers', () => {
    const character = {
      character_inventory: [
        {
          id: 'weapon1',
          name: 'Weak Sword',
          location: 'equipped_primary',
          library_item: {
            data: {
              modifiers: [
                { id: 'mod1', type: 'combat', target: 'damage', value: -1, operator: 'subtract' }
              ],
            },
          },
        },
      ],
      modifiers: {},
    };
    expect(calculateDamageBonus(character)).toBe(-1);
  });
});
