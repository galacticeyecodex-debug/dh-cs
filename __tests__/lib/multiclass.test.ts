/**
 * Tests for Multiclass Helper Functions
 *
 * Tests both deprecated (hard-coded) and new dynamic functions.
 */

import { describe, it, expect } from 'vitest';
import {
  getClassDomains,
  getAllClassNames,
  getClassDomainsFromData,
  getClassNamesFromData,
  getSubclassesFromData
} from '@/lib/level-up-helpers';

// ============================================================================
// Tests for NEW DYNAMIC functions (preferred - work with any class)
// ============================================================================

describe('getClassDomainsFromData (dynamic)', () => {
  it('should return domains from class data', () => {
    const classData = { data: { domains: ['Blade', 'Valor'] } };
    expect(getClassDomainsFromData(classData)).toEqual(['Blade', 'Valor']);
  });

  it('should return empty array when data is null', () => {
    expect(getClassDomainsFromData(null)).toEqual([]);
  });

  it('should return empty array when data is undefined', () => {
    expect(getClassDomainsFromData(undefined)).toEqual([]);
  });

  it('should return empty array when domains are missing', () => {
    const classData = { data: {} };
    expect(getClassDomainsFromData(classData)).toEqual([]);
  });

  it('should work with playtest class data', () => {
    const playtestClass = { data: { domains: ['Void', 'Midnight'] } };
    expect(getClassDomainsFromData(playtestClass)).toEqual(['Void', 'Midnight']);
  });
});

describe('getClassNamesFromData (dynamic)', () => {
  it('should return names from class array', () => {
    const classes = [
      { name: 'Warrior' },
      { name: 'Bard' },
      { name: 'VoidWalker' } // Playtest class
    ];
    expect(getClassNamesFromData(classes)).toEqual(['Warrior', 'Bard', 'VoidWalker']);
  });

  it('should return empty array for empty input', () => {
    expect(getClassNamesFromData([])).toEqual([]);
  });
});

describe('getSubclassesFromData (dynamic)', () => {
  const allSubclasses = [
    { id: 'subclass-stalwart', name: 'Stalwart', data: { parent_class_id: 'class-guardian' } },
    { id: 'subclass-vengeance', name: 'Vengeance', data: { parent_class_id: 'class-guardian' } },
    { id: 'subclass-troubadour', name: 'Troubadour', data: { parent_class_id: 'class-bard' } },
    { id: 'subclass-voidbender', name: 'Voidbender', data: { parent_class_id: 'class-voidwalker' } },
  ];

  it('should return subclasses matching parent_class_id', () => {
    const guardianClass = { id: 'class-guardian', name: 'Guardian', data: {} };
    const result = getSubclassesFromData(guardianClass, allSubclasses);
    expect(result).toHaveLength(2);
    expect(result.map(s => s.name)).toEqual(['Stalwart', 'Vengeance']);
  });

  it('should return subclasses matching subclass_names', () => {
    const bardClass = { id: 'class-bard', name: 'Bard', data: { subclass_names: ['Troubadour', 'Wordsmith'] } };
    const result = getSubclassesFromData(bardClass, allSubclasses);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Troubadour');
  });

  it('should return empty array when classData is null', () => {
    expect(getSubclassesFromData(null, allSubclasses)).toEqual([]);
  });

  it('should work with playtest classes', () => {
    const playtestClass = { id: 'class-voidwalker', name: 'VoidWalker', data: {} };
    const result = getSubclassesFromData(playtestClass, allSubclasses);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Voidbender');
  });

  it('should preserve full subclass type in return value', () => {
    const extendedSubclasses = [
      {
        id: 'subclass-stalwart',
        name: 'Stalwart',
        data: {
          parent_class_id: 'class-guardian',
          description: 'A defensive warrior',
          foundation_features: [{ name: 'Shield Wall' }]
        }
      },
    ];
    const guardianClass = { id: 'class-guardian', name: 'Guardian', data: {} };
    const result = getSubclassesFromData(guardianClass, extendedSubclasses);
    expect(result[0].data?.description).toBe('A defensive warrior');
    expect(result[0].data?.foundation_features).toBeDefined();
  });
});

// ============================================================================
// Tests for DEPRECATED functions (SRD-only, kept for backward compatibility)
// ============================================================================

describe('getClassDomains (deprecated - SRD only)', () => {
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

describe('getAllClassNames (deprecated - SRD only)', () => {
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
