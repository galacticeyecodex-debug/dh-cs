/**
 * Tests for Multiclass Helper Functions
 *
 * Tests the getClassDomains and getAllClassNames functions.
 */

import { describe, it, expect } from 'vitest';
import { getClassDomains, getAllClassNames } from '@/lib/level-up-helpers';

describe('getClassDomains', () => {
  describe('returns correct domains for each class', () => {
    it('should return Codex and Grace for Bard', () => {
      const domains = getClassDomains('Bard');
      expect(domains).toEqual(['Codex', 'Grace']);
    });

    it('should return Arcana and Sage for Druid', () => {
      const domains = getClassDomains('Druid');
      expect(domains).toEqual(['Arcana', 'Sage']);
    });

    it('should return Blade and Valor for Guardian', () => {
      const domains = getClassDomains('Guardian');
      expect(domains).toEqual(['Blade', 'Valor']);
    });

    it('should return Bone and Sage for Ranger', () => {
      const domains = getClassDomains('Ranger');
      expect(domains).toEqual(['Bone', 'Sage']);
    });

    it('should return Grace and Midnight for Rogue', () => {
      const domains = getClassDomains('Rogue');
      expect(domains).toEqual(['Grace', 'Midnight']);
    });

    it('should return Splendor and Valor for Seraph', () => {
      const domains = getClassDomains('Seraph');
      expect(domains).toEqual(['Splendor', 'Valor']);
    });

    it('should return Arcana and Midnight for Sorcerer', () => {
      const domains = getClassDomains('Sorcerer');
      expect(domains).toEqual(['Arcana', 'Midnight']);
    });

    it('should return Blade and Bone for Warrior', () => {
      const domains = getClassDomains('Warrior');
      expect(domains).toEqual(['Blade', 'Bone']);
    });

    it('should return Codex and Splendor for Wizard', () => {
      const domains = getClassDomains('Wizard');
      expect(domains).toEqual(['Codex', 'Splendor']);
    });
  });

  describe('edge cases', () => {
    it('should return empty array for unknown class', () => {
      const domains = getClassDomains('UnknownClass');
      expect(domains).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      const domains = getClassDomains('');
      expect(domains).toEqual([]);
    });

    it('should be case-sensitive', () => {
      const domains = getClassDomains('warrior'); // lowercase
      expect(domains).toEqual([]); // Should not match 'Warrior'
    });
  });

  describe('domain uniqueness', () => {
    it('should have 2 domains for each class', () => {
      const allClasses = getAllClassNames();
      allClasses.forEach(className => {
        const domains = getClassDomains(className);
        expect(domains).toHaveLength(2);
      });
    });

    it('should have unique domains within a class', () => {
      const allClasses = getAllClassNames();
      allClasses.forEach(className => {
        const domains = getClassDomains(className);
        const uniqueDomains = new Set(domains);
        expect(uniqueDomains.size).toBe(domains.length);
      });
    });
  });
});

describe('getAllClassNames', () => {
  it('should return all 9 class names', () => {
    const classNames = getAllClassNames();
    expect(classNames).toHaveLength(9);
  });

  it('should return all expected class names', () => {
    const classNames = getAllClassNames();
    expect(classNames).toEqual(
      expect.arrayContaining([
        'Bard',
        'Druid',
        'Guardian',
        'Ranger',
        'Rogue',
        'Seraph',
        'Sorcerer',
        'Warrior',
        'Wizard',
      ])
    );
  });

  it('should return unique class names', () => {
    const classNames = getAllClassNames();
    const uniqueNames = new Set(classNames);
    expect(uniqueNames.size).toBe(classNames.length);
  });

  it('should return classes in consistent order', () => {
    const classNames1 = getAllClassNames();
    const classNames2 = getAllClassNames();
    expect(classNames1).toEqual(classNames2);
  });
});
