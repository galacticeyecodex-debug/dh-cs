import { describe, it, expect } from 'vitest';
import {
  getCardLevel,
  getCardDescription,
  getCardType,
  getCardDomain,
  getCardRecallCost,
  getCardName,
  isCardInDomain,
  isCardAvailableAtLevel,
  filterCardsByDomainAndLevel,
  CardLike,
} from '@/lib/card-helpers';

describe('card-helpers', () => {
  describe('getCardLevel', () => {
    it('should return level from data.level', () => {
      const card: CardLike = { data: { level: 3 } };
      expect(getCardLevel(card)).toBe(3);
    });

    it('should return level from direct property', () => {
      const card: CardLike = { level: 5 };
      expect(getCardLevel(card)).toBe(5);
    });

    it('should prefer data.level over direct property', () => {
      const card: CardLike = { level: 2, data: { level: 4 } };
      expect(getCardLevel(card)).toBe(4);
    });

    it('should return default 1 for null card', () => {
      expect(getCardLevel(null)).toBe(1);
    });

    it('should return default 1 for undefined card', () => {
      expect(getCardLevel(undefined)).toBe(1);
    });

    it('should return default 1 for card with no level', () => {
      const card: CardLike = { name: 'Test' };
      expect(getCardLevel(card)).toBe(1);
    });
  });

  describe('getCardDescription', () => {
    it('should return description from data.description', () => {
      const card: CardLike = { data: { description: 'Test description' } };
      expect(getCardDescription(card)).toBe('Test description');
    });

    it('should return description from data.markdown as fallback', () => {
      const card: CardLike = { data: { markdown: 'Markdown text' } };
      expect(getCardDescription(card)).toBe('Markdown text');
    });

    it('should return description from direct property', () => {
      const card: CardLike = { description: 'Direct description' };
      expect(getCardDescription(card)).toBe('Direct description');
    });

    it('should prefer data.description over data.markdown', () => {
      const card: CardLike = {
        data: { description: 'Primary', markdown: 'Secondary' },
      };
      expect(getCardDescription(card)).toBe('Primary');
    });

    it('should return empty string for null card', () => {
      expect(getCardDescription(null)).toBe('');
    });

    it('should return empty string for card with no description', () => {
      const card: CardLike = { name: 'Test' };
      expect(getCardDescription(card)).toBe('');
    });
  });

  describe('getCardType', () => {
    it('should return type from data.type', () => {
      const card: CardLike = { data: { type: 'Ability' } };
      expect(getCardType(card)).toBe('Ability');
    });

    it('should return type from direct property', () => {
      const card: CardLike = { type: 'Spell' };
      expect(getCardType(card)).toBe('Spell');
    });

    it('should return empty string for null card', () => {
      expect(getCardType(null)).toBe('');
    });

    it('should return empty string for card with no type', () => {
      const card: CardLike = { name: 'Test' };
      expect(getCardType(card)).toBe('');
    });
  });

  describe('getCardDomain', () => {
    it('should return domain from data.domain', () => {
      const card: CardLike = { data: { domain: 'Arcana' } };
      expect(getCardDomain(card)).toBe('Arcana');
    });

    it('should return domain from direct property', () => {
      const card: CardLike = { domain: 'Blade' };
      expect(getCardDomain(card)).toBe('Blade');
    });

    it('should return empty string for null card', () => {
      expect(getCardDomain(null)).toBe('');
    });

    it('should return empty string for card with no domain', () => {
      const card: CardLike = { name: 'Test' };
      expect(getCardDomain(card)).toBe('');
    });
  });

  describe('getCardRecallCost', () => {
    it('should return recall cost from data.recall_cost', () => {
      const card: CardLike = { data: { recall_cost: 2 } };
      expect(getCardRecallCost(card)).toBe(2);
    });

    it('should return recall cost from direct property', () => {
      const card: CardLike = { recall_cost: 3 };
      expect(getCardRecallCost(card)).toBe(3);
    });

    it('should return 0 for null card', () => {
      expect(getCardRecallCost(null)).toBe(0);
    });

    it('should return 0 for card with no recall cost', () => {
      const card: CardLike = { name: 'Test' };
      expect(getCardRecallCost(card)).toBe(0);
    });
  });

  describe('getCardName', () => {
    it('should return name from data.name', () => {
      const card: CardLike = { data: { name: 'Fireball' } };
      expect(getCardName(card)).toBe('Fireball');
    });

    it('should return name from direct property', () => {
      const card: CardLike = { name: 'Shield Bash' };
      expect(getCardName(card)).toBe('Shield Bash');
    });

    it('should return default for null card', () => {
      expect(getCardName(null)).toBe('Unknown Card');
    });

    it('should return default for card with no name', () => {
      const card: CardLike = { level: 1 };
      expect(getCardName(card)).toBe('Unknown Card');
    });
  });

  describe('isCardInDomain', () => {
    it('should return true for matching domain', () => {
      const card: CardLike = { domain: 'Arcana' };
      expect(isCardInDomain(card, 'Arcana')).toBe(true);
    });

    it('should be case-insensitive', () => {
      const card: CardLike = { domain: 'Arcana' };
      expect(isCardInDomain(card, 'arcana')).toBe(true);
    });

    it('should trim whitespace', () => {
      const card: CardLike = { domain: ' Arcana ' };
      expect(isCardInDomain(card, '  arcana  ')).toBe(true);
    });

    it('should return false for non-matching domain', () => {
      const card: CardLike = { domain: 'Blade' };
      expect(isCardInDomain(card, 'Arcana')).toBe(false);
    });

    it('should return false for null card', () => {
      expect(isCardInDomain(null, 'Arcana')).toBe(false);
    });

    it('should return false for empty domain', () => {
      const card: CardLike = { domain: 'Arcana' };
      expect(isCardInDomain(card, '')).toBe(false);
    });
  });

  describe('isCardAvailableAtLevel', () => {
    it('should return true for card at character level', () => {
      const card: CardLike = { level: 3 };
      expect(isCardAvailableAtLevel(card, 3)).toBe(true);
    });

    it('should return true for card below character level', () => {
      const card: CardLike = { level: 2 };
      expect(isCardAvailableAtLevel(card, 5)).toBe(true);
    });

    it('should return false for card above character level', () => {
      const card: CardLike = { level: 7 };
      expect(isCardAvailableAtLevel(card, 3)).toBe(false);
    });

    it('should return false for null card', () => {
      expect(isCardAvailableAtLevel(null, 5)).toBe(false);
    });

    it('should handle default level 1', () => {
      const card: CardLike = { name: 'Test' };
      expect(isCardAvailableAtLevel(card, 1)).toBe(true);
      expect(isCardAvailableAtLevel(card, 5)).toBe(true);
    });
  });

  describe('filterCardsByDomainAndLevel', () => {
    const cards: CardLike[] = [
      { id: '1', name: 'Fireball', domain: 'Arcana', level: 1 },
      { id: '2', name: 'Lightning Bolt', domain: 'Arcana', level: 3 },
      { id: '3', name: 'Slash', domain: 'Blade', level: 1 },
      { id: '4', name: 'Cleave', domain: 'Blade', level: 5 },
      { id: '5', name: 'Heal', domain: 'Grace', level: 2 },
    ];

    it('should filter by single domain and level', () => {
      const result = filterCardsByDomainAndLevel(cards, ['Arcana'], 3);
      expect(result).toHaveLength(2);
      expect(result.map(c => c.id)).toEqual(['1', '2']);
    });

    it('should filter by multiple domains', () => {
      const result = filterCardsByDomainAndLevel(cards, ['Arcana', 'Blade'], 1);
      expect(result).toHaveLength(2);
      expect(result.map(c => c.id)).toEqual(['1', '3']);
    });

    it('should exclude cards above level threshold', () => {
      const result = filterCardsByDomainAndLevel(cards, ['Blade'], 3);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });

    it('should return empty array for non-matching domain', () => {
      const result = filterCardsByDomainAndLevel(cards, ['NonExistent'], 10);
      expect(result).toHaveLength(0);
    });

    it('should return empty array for level 0', () => {
      const result = filterCardsByDomainAndLevel(cards, ['Arcana'], 0);
      expect(result).toHaveLength(0);
    });

    it('should handle empty cards array', () => {
      const result = filterCardsByDomainAndLevel([], ['Arcana'], 5);
      expect(result).toHaveLength(0);
    });

    it('should handle empty domains array', () => {
      const result = filterCardsByDomainAndLevel(cards, [], 5);
      expect(result).toHaveLength(0);
    });

    it('should handle case-insensitive domain matching', () => {
      const result = filterCardsByDomainAndLevel(cards, ['arcana'], 3);
      expect(result).toHaveLength(2);
    });
  });
});
