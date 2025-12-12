/**
 * MODIFIER PARSER TESTS
 * ----------------------------------------------------------------------------
 * This test suite verifies the functionality of the `parseModifiers` utility.
 *
 * FUNCTIONALITY TESTED:
 * - Attack Modifiers: Parses "+1 to attack rolls" and similar patterns
 * - Damage Modifiers: Parses "+2 to damage" and similar patterns
 * - Stat Modifiers: Parses "+1 to Agility", "-2 to Evasion", etc.
 * - Multi-Modifiers: Handles semicolon-separated modifiers (e.g., "-1 to Evasion; +1 to Agility")
 * - Edge Cases: Validates handling of negative values, case-insensitivity, and malformed inputs.
 */

import { describe, it, expect } from 'vitest';
import { parseModifiers } from '@/lib/modifier-parser';

// ============================================================================
// ATTACK MODIFIER PARSING TESTS
// ============================================================================

describe('parseModifiers - Attack Modifiers', () => {
  it('should parse positive attack modifier', () => {
    const result = parseModifiers('+1 to attack rolls');

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('combat');
    expect(result[0].target).toBe('attack');
    expect(result[0].value).toBe(1);
    expect(result[0].operator).toBe('add');
    expect(result[0].description).toBe('+1 to attack rolls');
  });

  it('should parse negative attack modifier', () => {
    const result = parseModifiers('-1 to attack rolls');

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('combat');
    expect(result[0].target).toBe('attack');
    expect(result[0].value).toBe(-1);
    expect(result[0].operator).toBe('subtract');
  });

  it('should parse attack modifier with singular "roll"', () => {
    const result = parseModifiers('+2 to attack roll');

    expect(result).toHaveLength(1);
    expect(result[0].target).toBe('attack');
    expect(result[0].value).toBe(2);
  });

  it('should parse attack modifier with "bonus to"', () => {
    const result = parseModifiers('+1 bonus to attack rolls');

    expect(result).toHaveLength(1);
    expect(result[0].target).toBe('attack');
    expect(result[0].value).toBe(1);
  });
});

// ============================================================================
// DAMAGE MODIFIER PARSING TESTS
// ============================================================================

describe('parseModifiers - Damage Modifiers', () => {
  it('should parse positive damage modifier', () => {
    const result = parseModifiers('+2 to damage');

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('combat');
    expect(result[0].target).toBe('damage');
    expect(result[0].value).toBe(2);
    expect(result[0].operator).toBe('add');
    expect(result[0].description).toBe('+2 to damage');
  });

  it('should parse negative damage modifier', () => {
    const result = parseModifiers('-1 to damage');

    expect(result).toHaveLength(1);
    expect(result[0].target).toBe('damage');
    expect(result[0].value).toBe(-1);
    expect(result[0].operator).toBe('subtract');
  });

  it('should parse damage modifier with "rolls"', () => {
    const result = parseModifiers('+3 to damage rolls');

    expect(result).toHaveLength(1);
    expect(result[0].target).toBe('damage');
    expect(result[0].value).toBe(3);
  });

  it('should parse damage modifier with "bonus to"', () => {
    const result = parseModifiers('+2 bonus to damage');

    expect(result).toHaveLength(1);
    expect(result[0].target).toBe('damage');
    expect(result[0].value).toBe(2);
  });
});

// ============================================================================
// STAT MODIFIER PARSING TESTS
// ============================================================================

describe('parseModifiers - Stat Modifiers', () => {
  it('should parse evasion modifier', () => {
    const result = parseModifiers('+1 to Evasion');

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('stat');
    expect(result[0].target).toBe('evasion');
    expect(result[0].value).toBe(1);
  });

  it('should parse agility modifier', () => {
    const result = parseModifiers('-1 to Agility');

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('stat');
    expect(result[0].target).toBe('agility');
    expect(result[0].value).toBe(-1);
  });

  it('should parse strength modifier', () => {
    const result = parseModifiers('+2 to Strength');

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('stat');
    expect(result[0].target).toBe('strength');
    expect(result[0].value).toBe(2);
  });

  it('should normalize "Hit Points" to "hp"', () => {
    const result = parseModifiers('+3 to Hit Points');

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('stat');
    expect(result[0].target).toBe('hp');
    expect(result[0].value).toBe(3);
  });
});

// ============================================================================
// MULTI-MODIFIER PARSING TESTS
// ============================================================================

describe('parseModifiers - Multi-Modifiers', () => {
  it('should parse semicolon-separated modifiers', () => {
    const result = parseModifiers('-2 to Evasion; -1 to Agility');

    expect(result).toHaveLength(2);
    expect(result[0].target).toBe('evasion');
    expect(result[0].value).toBe(-2);
    expect(result[1].target).toBe('agility');
    expect(result[1].value).toBe(-1);
  });

  it('should parse newline-separated modifiers', () => {
    const result = parseModifiers('+1 to Strength\n+2 to attack rolls');

    expect(result).toHaveLength(2);
    expect(result[0].target).toBe('strength');
    expect(result[0].value).toBe(1);
    expect(result[1].target).toBe('attack');
    expect(result[1].value).toBe(2);
  });

  it('should handle mixed modifier types', () => {
    const result = parseModifiers('+1 to attack rolls; -1 to Evasion; +2 to damage');

    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('combat');
    expect(result[0].target).toBe('attack');
    expect(result[1].type).toBe('stat');
    expect(result[1].target).toBe('evasion');
    expect(result[2].type).toBe('combat');
    expect(result[2].target).toBe('damage');
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('parseModifiers - Edge Cases', () => {
  it('should return empty array for null input', () => {
    const result = parseModifiers(null as any);
    expect(result).toEqual([]);
  });

  it('should return empty array for undefined input', () => {
    const result = parseModifiers(undefined as any);
    expect(result).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    const result = parseModifiers('');
    expect(result).toEqual([]);
  });

  it('should ignore unparseable text', () => {
    const result = parseModifiers('This is random text without modifiers');
    expect(result).toEqual([]);
  });

  it('should skip empty segments after splitting', () => {
    const result = parseModifiers('+1 to Agility;;; +2 to Strength');
    expect(result).toHaveLength(2);
  });

  it('should handle whitespace variations', () => {
    const result = parseModifiers('  +1   to   attack   rolls  ');
    expect(result).toHaveLength(1);
    expect(result[0].target).toBe('attack');
  });

  it('should handle case-insensitive stat names', () => {
    const result = parseModifiers('+1 to EVASION');
    expect(result).toHaveLength(1);
    expect(result[0].target).toBe('evasion');
  });

  it('should parse partial matches and ignore extra text', () => {
    const result = parseModifiers('-1 to Evasion; on a successful attack, roll an additional damage die');

    // Should only parse the evasion modifier, not the complex conditional text
    expect(result).toHaveLength(1);
    expect(result[0].target).toBe('evasion');
    expect(result[0].value).toBe(-1);
  });
});

// ============================================================================
// REAL-WORLD SRD EXAMPLES
// ============================================================================

describe('parseModifiers - Real SRD Examples', () => {
  it('should parse Broadsword (Reliable) feature', () => {
    const result = parseModifiers('+1 to attack rolls');

    expect(result).toHaveLength(1);
    expect(result[0].target).toBe('attack');
    expect(result[0].value).toBe(1);
  });

  it('should parse Gambeson Armor (Flexible) feature', () => {
    const result = parseModifiers('+1 to Evasion');

    expect(result).toHaveLength(1);
    expect(result[0].target).toBe('evasion');
    expect(result[0].value).toBe(1);
  });

  it('should parse Chainmail Armor (Heavy) feature', () => {
    const result = parseModifiers('-1 to Evasion');

    expect(result).toHaveLength(1);
    expect(result[0].target).toBe('evasion');
    expect(result[0].value).toBe(-1);
  });

  it('should parse Full Plate Armor (Very Heavy) feature', () => {
    const result = parseModifiers('-2 to Evasion; -1 to Agility');

    expect(result).toHaveLength(2);
    expect(result[0].target).toBe('evasion');
    expect(result[0].value).toBe(-2);
    expect(result[1].target).toBe('agility');
    expect(result[1].value).toBe(-1);
  });

  it('should parse Greatsword (Massive) feature - partial', () => {
    const result = parseModifiers('-1 to Evasion; on a successful attack, roll an additional damage die and discard the lowest result.');

    // Should only parse the evasion modifier (expected limitation of Option B)
    expect(result).toHaveLength(1);
    expect(result[0].target).toBe('evasion');
    expect(result[0].value).toBe(-1);
  });
});
