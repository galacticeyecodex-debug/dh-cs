/**
 * Tests for modifier extraction and application
 * Verifies that modifiers from equipment are correctly identified and applied
 */

import { describe, it, expect } from 'vitest';
import { getSystemModifiers } from '@/lib/utils';

// ============================================================================
// SYSTEM MODIFIERS EXTRACTION TESTS
// ============================================================================

describe('getSystemModifiers', () => {
  it('should return empty array for null character', () => {
    const mods = getSystemModifiers(null, 'armor');
    expect(mods).toEqual([]);
  });

  it('should return empty array for character with no inventory', () => {
    const character = { character_inventory: undefined };
    const mods = getSystemModifiers(character, 'armor');
    expect(mods).toEqual([]);
  });

  it('should return empty array for character with empty inventory', () => {
    const character = { character_inventory: [] };
    const mods = getSystemModifiers(character, 'armor');
    expect(mods).toEqual([]);
  });

  it('should ignore items not in equipped slots', () => {
    const character = {
      character_inventory: [
        {
          id: '1',
          name: 'Sword',
          location: 'backpack',
          library_item: {
            data: {
              modifiers: [{ target: 'armor', value: 2, id: 'mod1' }],
            },
          },
        },
      ],
    };
    const mods = getSystemModifiers(character, 'armor');
    expect(mods).toEqual([]);
  });

  describe('Structured Modifiers (Preferred)', () => {
    it('should extract structured modifiers from equipped primary weapon', () => {
      const character = {
        character_inventory: [
          {
            id: 'primary1',
            name: 'Magic Sword',
            location: 'equipped_primary',
            library_item: {
              data: {
                modifiers: [
                  { id: 'mod1', target: 'strength', value: 2 },
                  { id: 'mod2', target: 'evasion', value: 1 },
                ],
              },
            },
          },
        ],
      };

      const strengthMods = getSystemModifiers(character, 'strength');
      expect(strengthMods).toHaveLength(1);
      expect(strengthMods[0].value).toBe(2);
      expect(strengthMods[0].name).toBe('Magic Sword');
      expect(strengthMods[0].source).toBe('system');
    });

    it('should extract modifiers from equipped secondary weapon', () => {
      const character = {
        character_inventory: [
          {
            id: 'secondary1',
            name: 'Shield +1',
            location: 'equipped_secondary',
            library_item: {
              data: {
                modifiers: [
                  { id: 'mod1', target: 'armor', value: 1 },
                ],
              },
            },
          },
        ],
      };

      const armorMods = getSystemModifiers(character, 'armor');
      expect(armorMods).toHaveLength(1);
      expect(armorMods[0].value).toBe(1);
    });

    it('should extract modifiers from equipped armor', () => {
      const character = {
        character_inventory: [
          {
            id: 'armor1',
            name: 'Dragonscale Armor',
            location: 'equipped_armor',
            library_item: {
              data: {
                modifiers: [
                  { id: 'mod1', target: 'armor', value: 3 },
                  { id: 'mod2', target: 'evasion', value: -1 },
                ],
              },
            },
          },
        ],
      };

      const armorMods = getSystemModifiers(character, 'armor');
      expect(armorMods).toHaveLength(1);
      expect(armorMods[0].value).toBe(3);
    });

    it('should extract modifiers from multiple equipped items', () => {
      const character = {
        character_inventory: [
          {
            id: 'primary1',
            name: 'Sword +2',
            location: 'equipped_primary',
            library_item: {
              data: {
                modifiers: [
                  { id: 'mod1', target: 'strength', value: 2 },
                ],
              },
            },
          },
          {
            id: 'secondary1',
            name: 'Shield +1',
            location: 'equipped_secondary',
            library_item: {
              data: {
                modifiers: [
                  { id: 'mod2', target: 'strength', value: 1 },
                ],
              },
            },
          },
        ],
      };

      const strengthMods = getSystemModifiers(character, 'strength');
      expect(strengthMods).toHaveLength(2);
      expect(strengthMods[0].value).toBe(2);
      expect(strengthMods[1].value).toBe(1);
    });

    it('should not include modifiers for different stats', () => {
      const character = {
        character_inventory: [
          {
            id: 'item1',
            name: 'Item',
            location: 'equipped_primary',
            library_item: {
              data: {
                modifiers: [
                  { id: 'mod1', target: 'strength', value: 2 },
                  { id: 'mod2', target: 'agility', value: 1 },
                ],
              },
            },
          },
        ],
      };

      const strengthMods = getSystemModifiers(character, 'strength');
      expect(strengthMods).toHaveLength(1);
      expect(strengthMods[0].target).toBeUndefined(); // The object doesn't have target field in response
    });

    it('should handle empty modifiers array', () => {
      const character = {
        character_inventory: [
          {
            id: 'item1',
            name: 'Item',
            location: 'equipped_primary',
            library_item: {
              data: {
                modifiers: [],
              },
            },
          },
        ],
      };

      const mods = getSystemModifiers(character, 'armor');
      expect(mods).toEqual([]);
    });

    it('should create unique IDs for multiple modifiers from same item', () => {
      const character = {
        character_inventory: [
          {
            id: 'item1',
            name: 'Multi-Modifier Item',
            location: 'equipped_primary',
            library_item: {
              data: {
                modifiers: [
                  { id: 'mod1', target: 'strength', value: 1 },
                  { id: 'mod2', target: 'strength', value: 2 },
                ],
              },
            },
          },
        ],
      };

      const mods = getSystemModifiers(character, 'strength');
      expect(mods).toHaveLength(2);
      expect(mods[0].id).not.toBe(mods[1].id);
    });
  });

  describe('Fallback Regex Parsing (Legacy)', () => {
    it('should parse feat_text with plus modifier', () => {
      const character = {
        character_inventory: [
          {
            id: 'item1',
            name: 'Blessed Sword',
            location: 'equipped_primary',
            library_item: {
              data: {
                feat_text: '+2 to Strength',
              },
            },
          },
        ],
      };

      const mods = getSystemModifiers(character, 'strength');
      expect(mods).toHaveLength(1);
      expect(mods[0].value).toBe(2);
      expect(mods[0].name).toBe('Blessed Sword');
    });

    it('should parse feat_text with minus modifier', () => {
      const character = {
        character_inventory: [
          {
            id: 'item1',
            name: 'Heavy Armor',
            location: 'equipped_armor',
            library_item: {
              data: {
                feat_text: '-1 to Evasion',
              },
            },
          },
        ],
      };

      const mods = getSystemModifiers(character, 'evasion');
      expect(mods).toHaveLength(1);
      expect(mods[0].value).toBe(-1);
    });

    it('should parse bonus keyword in feat_text', () => {
      const character = {
        character_inventory: [
          {
            id: 'item1',
            name: 'Training Gloves',
            location: 'equipped_primary',
            library_item: {
              data: {
                feat_text: '+1 bonus to Agility',
              },
            },
          },
        ],
      };

      const mods = getSystemModifiers(character, 'agility');
      expect(mods).toHaveLength(1);
      expect(mods[0].value).toBe(1);
    });

    it('should parse underscored stat names', () => {
      const character = {
        character_inventory: [
          {
            id: 'item1',
            name: 'Item',
            location: 'equipped_primary',
            library_item: {
              data: {
                feat_text: '+2 to hit points',
              },
            },
          },
        ],
      };

      const mods = getSystemModifiers(character, 'hit_points');
      expect(mods).toHaveLength(1);
      expect(mods[0].value).toBe(2);
    });

    it('should be case insensitive', () => {
      const character = {
        character_inventory: [
          {
            id: 'item1',
            name: 'Item',
            location: 'equipped_primary',
            library_item: {
              data: {
                feat_text: '+3 TO STRENGTH',
              },
            },
          },
        ],
      };

      const mods = getSystemModifiers(character, 'strength');
      expect(mods).toHaveLength(1);
      expect(mods[0].value).toBe(3);
    });

    it('should skip to regex if no structured modifiers', () => {
      const character = {
        character_inventory: [
          {
            id: 'item1',
            name: 'Item',
            location: 'equipped_primary',
            library_item: {
              data: {
                feat_text: '+1 to armor',
                modifiers: null, // No structured modifiers
              },
            },
          },
        ],
      };

      const mods = getSystemModifiers(character, 'armor');
      expect(mods).toHaveLength(1);
      expect(mods[0].value).toBe(1);
    });

    it('should use feature.text as fallback for feat_text', () => {
      const character = {
        character_inventory: [
          {
            id: 'item1',
            name: 'Item',
            location: 'equipped_primary',
            library_item: {
              data: {
                feature: {
                  text: '+2 to Evasion',
                },
              },
            },
          },
        ],
      };

      const mods = getSystemModifiers(character, 'evasion');
      expect(mods).toHaveLength(1);
      expect(mods[0].value).toBe(2);
    });

    it('should combine feature.text and feat_text', () => {
      const character = {
        character_inventory: [
          {
            id: 'item1',
            name: 'Multi-feature Item',
            location: 'equipped_primary',
            library_item: {
              data: {
                feature: {
                  text: '+1 to Strength',
                },
                feat_text: '+1 to Agility',
              },
            },
          },
        ],
      };

      const strengthMods = getSystemModifiers(character, 'strength');
      expect(strengthMods).toHaveLength(1);
      expect(strengthMods[0].value).toBe(1);

      const agilityMods = getSystemModifiers(character, 'agility');
      expect(agilityMods).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle item with no library_item data', () => {
      const character = {
        character_inventory: [
          {
            id: 'item1',
            name: 'Invalid Item',
            location: 'equipped_primary',
            library_item: null,
          },
        ],
      };

      const mods = getSystemModifiers(character, 'armor');
      expect(mods).toEqual([]);
    });

    it('should handle undefined library_item', () => {
      const character = {
        character_inventory: [
          {
            id: 'item1',
            name: 'Invalid Item',
            location: 'equipped_primary',
          },
        ],
      };

      const mods = getSystemModifiers(character, 'armor');
      expect(mods).toEqual([]);
    });

    it('should handle very large modifier values', () => {
      const character = {
        character_inventory: [
          {
            id: 'item1',
            name: 'Legendary Item',
            location: 'equipped_primary',
            library_item: {
              data: {
                modifiers: [
                  { id: 'mod1', target: 'strength', value: 999 },
                ],
              },
            },
          },
        ],
      };

      const mods = getSystemModifiers(character, 'strength');
      expect(mods[0].value).toBe(999);
    });

    it('should handle negative modifier values in structured modifiers', () => {
      const character = {
        character_inventory: [
          {
            id: 'item1',
            name: 'Cursed Item',
            location: 'equipped_primary',
            library_item: {
              data: {
                modifiers: [
                  { id: 'mod1', target: 'strength', value: -3 },
                ],
              },
            },
          },
        ],
      };

      const mods = getSystemModifiers(character, 'strength');
      expect(mods[0].value).toBe(-3);
    });

    it('should handle non-numeric modifier values gracefully', () => {
      const character = {
        character_inventory: [
          {
            id: 'item1',
            name: 'Item',
            location: 'equipped_primary',
            library_item: {
              data: {
                modifiers: [
                  { id: 'mod1', target: 'strength', value: 'invalid' }, // Non-numeric
                ],
              },
            },
          },
        ],
      };

      const mods = getSystemModifiers(character, 'strength');
      // The function directly uses the value, so it will be 'invalid'
      expect(mods[0].value).toBe('invalid');
    });

    it('should not extract modifiers from equipped items when looking for unrelated stat', () => {
      const character = {
        character_inventory: [
          {
            id: 'item1',
            name: 'Strength Item',
            location: 'equipped_primary',
            library_item: {
              data: {
                modifiers: [
                  { id: 'mod1', target: 'strength', value: 5 },
                ],
              },
            },
          },
        ],
      };

      const evasionMods = getSystemModifiers(character, 'evasion');
      expect(evasionMods).toEqual([]);
    });
  });
});
