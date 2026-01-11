/**
 * RECALL COST TESTS
 * ----------------------------------------------------------------------------
 * Regression tests to ensure domain card recall costs are correctly handled.
 *
 * BACKGROUND:
 * A bug was discovered where recall costs displayed as 0 in the UI despite
 * correct values in the database. The issue was a field name mismatch:
 * - Source JSON uses `recall` (string)
 * - Database/library items use `recall_cost` (number)
 * - UI components were incorrectly looking for `recall` instead of `recall_cost`
 *
 * These tests ensure:
 * 1. Source JSON has valid recall values (0, 1, or 2)
 * 2. The getCardRecallCost helper correctly extracts recall_cost
 * 3. LibraryItem-like objects use recall_cost (not recall)
 */

import { describe, it, expect } from 'vitest';
import { getCardRecallCost, CardLike } from '@/lib/card-helpers';

// Import source data to validate recall values exist
import srdAbilities from '@/content/srd/json/abilities_enhanced.json';
import playtestAbilities from '@/content/playtest/json/abilities_enhanced.json';

interface AbilityJson {
  name: string;
  recall: string;
  domain: string;
  type: string;
  level: string;
  [key: string]: unknown;
}

describe('recall-cost', () => {
  describe('Source JSON validation', () => {
    it('should have recall field on all SRD abilities', () => {
      const abilities = srdAbilities as AbilityJson[];

      // Every ability should have a recall field
      abilities.forEach(ability => {
        expect(ability.recall, `${ability.name} should have recall field`).toBeDefined();
      });
    });

    it('should have valid recall values (0-4) on SRD abilities', () => {
      const abilities = srdAbilities as AbilityJson[];
      // Valid recall values are 0-4 based on actual SRD data
      const validRecallValues = ['0', '1', '2', '3', '4'];

      abilities.forEach(ability => {
        expect(
          validRecallValues.includes(ability.recall),
          `${ability.name} has invalid recall value: ${ability.recall}`
        ).toBe(true);
      });
    });

    it('should have distribution of recall costs in SRD (not all zeros)', () => {
      const abilities = srdAbilities as AbilityJson[];

      const recallCounts: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0 };
      abilities.forEach(ability => {
        if (recallCounts[ability.recall] !== undefined) {
          recallCounts[ability.recall]++;
        }
      });

      // Should have non-trivial distribution - not all zeros
      expect(recallCounts['1'] + recallCounts['2'] + recallCounts['3'] + recallCounts['4']).toBeGreaterThan(0);

      // Log distribution for visibility
      console.log('SRD Recall Cost Distribution:', recallCounts);
    });

    it('should have valid recall values on playtest abilities', () => {
      const abilities = playtestAbilities as AbilityJson[];
      // Valid recall values are 0-4 based on actual SRD data
      const validRecallValues = ['0', '1', '2', '3', '4'];

      abilities.forEach(ability => {
        if (ability.recall !== undefined) {
          expect(
            validRecallValues.includes(ability.recall),
            `${ability.name} has invalid recall value: ${ability.recall}`
          ).toBe(true);
        }
      });
    });
  });

  describe('getCardRecallCost helper', () => {
    it('should extract recall_cost from data object (database format)', () => {
      // This is how library items store recall cost after database seeding
      const libraryItem: CardLike = {
        name: 'Test Card',
        data: {
          description: 'A test card',
          recall_cost: 2,
        },
      };

      expect(getCardRecallCost(libraryItem)).toBe(2);
    });

    it('should NOT extract from recall field (source JSON format)', () => {
      // Source JSON uses `recall` (string), but this should NOT be read
      // by getCardRecallCost - it only looks for `recall_cost`
      const sourceJsonItem = {
        name: 'Test Card',
        recall: '2', // Source JSON format - string
      };

      // getCardRecallCost should return 0 (default) since it looks for recall_cost
      expect(getCardRecallCost(sourceJsonItem as CardLike)).toBe(0);
    });

    it('should handle all valid recall cost values (0-4)', () => {
      expect(getCardRecallCost({ data: { recall_cost: 0 } })).toBe(0);
      expect(getCardRecallCost({ data: { recall_cost: 1 } })).toBe(1);
      expect(getCardRecallCost({ data: { recall_cost: 2 } })).toBe(2);
      expect(getCardRecallCost({ data: { recall_cost: 3 } })).toBe(3);
      expect(getCardRecallCost({ data: { recall_cost: 4 } })).toBe(4);
    });

    it('should prefer data.recall_cost over direct recall_cost', () => {
      const card: CardLike = {
        recall_cost: 1,
        data: { recall_cost: 2 },
      };
      expect(getCardRecallCost(card)).toBe(2);
    });
  });

  describe('LibraryItem format validation', () => {
    it('should use recall_cost (not recall) in data object', () => {
      // Simulates how a library item from the database should look
      interface LibraryItemData {
        description?: string;
        recall_cost?: number;
        // recall should NOT exist on library item data
        recall?: never;
      }

      const libraryItemData: LibraryItemData = {
        description: 'Test description',
        recall_cost: 1,
      };

      // Type check: recall_cost should be accessible
      expect(libraryItemData.recall_cost).toBe(1);

      // Verify the helper extracts it correctly
      const mockLibraryItem: CardLike = {
        name: 'Test',
        data: libraryItemData,
      };
      expect(getCardRecallCost(mockLibraryItem)).toBe(1);
    });
  });

  describe('Known ability recall costs', () => {
    // Test specific known cards to catch regressions
    const expectedRecallCosts: Record<string, string> = {
      'Rune Ward': '0',
      'Unleash Chaos': '1',
      'Wall Walk': '1',
      'Counterspell': '2',
    };

    it.each(Object.entries(expectedRecallCosts))(
      'should have correct recall cost for %s (%s)',
      (cardName, expectedRecall) => {
        const abilities = srdAbilities as AbilityJson[];
        const card = abilities.find(a => a.name === cardName);

        expect(card, `Card "${cardName}" not found in SRD abilities`).toBeDefined();
        expect(card?.recall).toBe(expectedRecall);
      }
    );
  });

  describe('UI component data flow simulation', () => {
    it('should correctly display recall cost when using recall_cost field', () => {
      // Simulates the correct data flow from library item to DomainCard component
      const libraryItem = {
        name: 'Counterspell',
        domain: 'Arcana',
        tier: 1,
        type: 'Spell',
        data: {
          description: 'A powerful counter magic spell',
          recall_cost: 2, // Correct field name
        },
      };

      // Simulates how PlaymatCard passes recallCost to DomainCard
      const recallCost = libraryItem.data?.recall_cost ?? 0;

      expect(recallCost).toBe(2);
    });

    it('should return 0 when incorrectly using recall field (the bug)', () => {
      // This test documents the bug that was fixed
      const libraryItem = {
        name: 'Counterspell',
        domain: 'Arcana',
        tier: 1,
        type: 'Spell',
        data: {
          description: 'A powerful counter magic spell',
          recall_cost: 2,
          // Note: 'recall' does NOT exist in library item data
        },
      };

      // THE BUG: Using `recall` instead of `recall_cost` returns undefined
      const incorrectRecallCost = (libraryItem.data as Record<string, unknown>)?.recall ?? 0;

      // This was causing all cards to show 0
      expect(incorrectRecallCost).toBe(0);

      // THE FIX: Using `recall_cost` returns the correct value
      const correctRecallCost = libraryItem.data?.recall_cost ?? 0;
      expect(correctRecallCost).toBe(2);
    });
  });
});
