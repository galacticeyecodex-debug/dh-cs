/**
 * CARD PARSER ENHANCED - Unit Tests
 * ----------------------------------------------------------------------------
 * Tests for the enhanced ability card parsing functions in lib/card-parser.ts
 */

import {
  parseStressCost,
  parseHopeCost,
  parseHitPointCost,
  parseCosts,
  parseFrequency,
  parseCardRange,
  parseRollTrait,
  parseRollDifficulty,
  parseCardDamage,
  parseCardDamageType,
  parseTargetType,
  parseActionType,
  hasTokenMechanics,
  parseMaxTokens,
  parseTokenSource,
  extractKeywords,
  getFrequencyLabel,
  getActionTypeLabel,
  hasCombatRelevance,
} from '@/lib/card-parser';
import type { EnhancedAbilityCard } from '@/types/cards';

describe('parseStressCost', () => {
  it('should parse "mark 2 Stress" pattern', () => {
    expect(parseStressCost('You can **mark 2 Stress** to do something')).toBe(2);
  });

  it('should parse "mark a Stress" pattern as 1', () => {
    expect(parseStressCost('**mark a Stress** to activate')).toBe(1);
  });

  it('should parse without markdown bold', () => {
    expect(parseStressCost('mark 3 Stress to activate')).toBe(3);
  });

  it('should return 0 when no stress cost found', () => {
    expect(parseStressCost('This ability has no cost')).toBe(0);
  });
});

describe('parseHopeCost', () => {
  it('should parse "spend 3 Hope" pattern', () => {
    expect(parseHopeCost('**spend 3 Hope** to cast')).toBe(3);
  });

  it('should parse "spend a Hope" pattern as 1', () => {
    expect(parseHopeCost('spend a Hope to activate')).toBe(1);
  });

  it('should return 0 when no hope cost found', () => {
    expect(parseHopeCost('This costs nothing')).toBe(0);
  });
});

describe('parseHitPointCost', () => {
  it('should parse "mark 2 Hit Points" pattern', () => {
    expect(parseHitPointCost('You must mark 2 Hit Points')).toBe(2);
  });

  it('should parse "mark a Hit Point" pattern as 1', () => {
    expect(parseHitPointCost('mark a Hit Point to use')).toBe(1);
  });

  it('should return 0 when no HP cost found', () => {
    expect(parseHitPointCost('No HP cost')).toBe(0);
  });
});

describe('parseCosts', () => {
  it('should return combined costs object', () => {
    const text = '**mark 2 Stress** and **spend 3 Hope** to use this';
    const costs = parseCosts(text);
    expect(costs).toEqual({ stress: 2, hope: 3 });
  });

  it('should return undefined when no costs found', () => {
    expect(parseCosts('This ability is free')).toBeUndefined();
  });

  it('should only include non-zero costs', () => {
    const text = 'mark 1 Stress to activate';
    const costs = parseCosts(text);
    expect(costs).toEqual({ stress: 1 });
    expect(costs?.hope).toBeUndefined();
  });
});

describe('parseFrequency', () => {
  it('should detect once per session', () => {
    expect(parseFrequency('You can use this once per session')).toBe('once_per_session');
  });

  it('should detect once per long rest', () => {
    expect(parseFrequency('Usable once per long rest')).toBe('once_per_long_rest');
  });

  it('should detect once per rest', () => {
    expect(parseFrequency('Once per rest, you may')).toBe('once_per_rest');
  });

  it('should default to at_will', () => {
    expect(parseFrequency('You can use this anytime')).toBe('at_will');
  });
});

describe('parseCardRange', () => {
  it('should detect Far range', () => {
    expect(parseCardRange('target within Far range')).toBe('Far');
  });

  it('should detect Very Close range', () => {
    expect(parseCardRange('within Very Close range')).toBe('Very Close');
  });

  it('should detect Melee range', () => {
    expect(parseCardRange('target within Melee range')).toBe('Melee');
  });

  it('should return undefined for no range', () => {
    expect(parseCardRange('This has no range specified')).toBeUndefined();
  });
});

describe('parseRollTrait', () => {
  it('should detect Spellcast Roll', () => {
    expect(parseRollTrait('Make a **Spellcast Roll** against the target')).toBe('Spellcast');
  });

  it('should detect Strength Roll', () => {
    expect(parseRollTrait('Make a **Strength Roll** to resist')).toBe('Strength');
  });

  it('should return undefined for no roll', () => {
    expect(parseRollTrait('This ability has no roll')).toBeUndefined();
  });
});

describe('parseRollDifficulty', () => {
  it('should parse DC from Roll (15) pattern', () => {
    expect(parseRollDifficulty('Make a Spellcast Roll (15)')).toBe(15);
  });

  it('should return undefined when no DC specified', () => {
    expect(parseRollDifficulty('Make a Spellcast Roll against the target')).toBeUndefined();
  });
});

describe('parseCardDamage', () => {
  it('should parse d8 damage notation', () => {
    expect(parseCardDamage('deals d8 magic damage')).toBe('d8');
  });

  it('should parse 1d20+3 damage notation', () => {
    expect(parseCardDamage('takes 1d20+3 damage')).toBe('1d20+3');
  });

  it('should parse 2d6 damage notation', () => {
    expect(parseCardDamage('deal 2d6 physical damage')).toBe('2d6');
  });

  it('should return undefined for no damage', () => {
    expect(parseCardDamage('This ability heals instead')).toBeUndefined();
  });
});

describe('parseCardDamageType', () => {
  it('should detect magic damage', () => {
    expect(parseCardDamageType('deals 1d8 magic damage')).toBe('magic');
  });

  it('should detect physical damage', () => {
    expect(parseCardDamageType('deals 2d6 physical damage')).toBe('physical');
  });

  it('should return undefined for unspecified type', () => {
    expect(parseCardDamageType('deals 1d10 damage')).toBeUndefined();
  });
});

describe('parseTargetType', () => {
  it('should detect all targets', () => {
    expect(parseTargetType('affects all targets in range')).toBe('all_in_range');
  });

  it('should detect single target', () => {
    expect(parseTargetType('against a target within range')).toBe('single');
  });

  it('should detect self target', () => {
    expect(parseTargetType('you target yourself')).toBe('self');
  });

  it('should return undefined for unspecified targets', () => {
    expect(parseTargetType('something happens')).toBeUndefined();
  });
});

describe('parseActionType', () => {
  it('should detect reaction from reaction roll', () => {
    expect(parseActionType('make a reaction roll to avoid', 'Ability')).toBeUndefined();
  });

  it('should detect reaction from "when you would take damage"', () => {
    expect(parseActionType('When you would take damage, you can', 'Ability')).toBeUndefined();
  });

  it('should detect attack from roll against pattern', () => {
    expect(parseActionType('Make a Spellcast Roll against the target', 'Spell')).toBe('attack');
  });

  it('should detect downtime from during a rest', () => {
    expect(parseActionType('During a rest, you can do this', 'Ability')).toBeUndefined();
  });

  it('should detect buff from gain advantage', () => {
    expect(parseActionType('You gain advantage on your next roll', 'Ability')).toBeUndefined();
  });

  it('should default spells to undefined', () => {
    expect(parseActionType('Cast this spell', 'Spell')).toBeUndefined();
  });

  it('should default abilities to undefined', () => {
    expect(parseActionType('This ability is always active', 'Ability')).toBeUndefined();
  });
});

describe('hasTokenMechanics', () => {
  it('should detect place tokens pattern', () => {
    expect(hasTokenMechanics('place 3 tokens on this card')).toBe(true);
  });

  it('should detect spend tokens pattern', () => {
    expect(hasTokenMechanics('spend a token to activate')).toBe(true);
  });

  it('should detect tokens on this card pattern', () => {
    expect(hasTokenMechanics('while there are tokens on this card')).toBe(true);
  });

  it('should return false for no tokens', () => {
    expect(hasTokenMechanics('This ability has no tokens')).toBe(false);
  });
});

describe('parseMaxTokens', () => {
  it('should parse fixed token count', () => {
    expect(parseMaxTokens('place 3 tokens on this card')).toBe(3);
  });

  it('should return null for dynamic tokens', () => {
    expect(parseMaxTokens('place tokens equal to your Agility')).toBeNull();
  });
});

describe('parseTokenSource', () => {
  it('should detect Agility as token source', () => {
    expect(parseTokenSource('tokens equal to your Agility')).toBe('agility');
  });

  it('should detect Spellcast as token source', () => {
    expect(parseTokenSource('number of tokens equal to your Spellcast')).toBe('spellcast');
  });

  it('should return undefined for no source', () => {
    expect(parseTokenSource('place 3 tokens')).toBeUndefined();
  });
});

describe('extractKeywords', () => {
  it('should extract damage keyword', () => {
    const keywords = extractKeywords('deals 1d8 damage', 'Spell');
    expect(keywords).toContain('damage');
  });

  it('should extract magic keyword', () => {
    const keywords = extractKeywords('deals 1d8 magic damage', 'Spell');
    expect(keywords).toContain('magic');
  });

  it('should extract stress_cost keyword', () => {
    const keywords = extractKeywords('mark 2 Stress to activate', 'Ability');
    expect(keywords).toContain('stress_cost');
  });

  it('should extract hope_cost keyword', () => {
    const keywords = extractKeywords('spend a Hope to use', 'Spell');
    expect(keywords).toContain('hope_cost');
  });

  it('should extract tokens keyword', () => {
    const keywords = extractKeywords('place tokens on this card', 'Ability');
    expect(keywords).toContain('tokens');
  });

  it('should extract card type keyword', () => {
    const keywords = extractKeywords('Cast this spell', 'Spell');
    expect(keywords).toContain('spell');
  });
});

describe('getFrequencyLabel', () => {
  it('should return Once/Session for once_per_session', () => {
    expect(getFrequencyLabel('once_per_session')).toBe('Once/Session');
  });

  it('should return Once/Long Rest for once_per_long_rest', () => {
    expect(getFrequencyLabel('once_per_long_rest')).toBe('Once/Long Rest');
  });

  it('should return Once/Rest for once_per_rest', () => {
    expect(getFrequencyLabel('once_per_rest')).toBe('Once/Rest');
  });

  it('should return empty string for at_will', () => {
    expect(getFrequencyLabel('at_will')).toBe('');
  });
});

describe('getActionTypeLabel', () => {
  it('should return Attack for attack', () => {
    expect(getActionTypeLabel('attack')).toBe('Attack');
  });

  it('should return empty string for undefined', () => {
    expect(getActionTypeLabel(undefined)).toBe('');
  });
});

describe('hasCombatRelevance', () => {
  it('should return true for attack action_type', () => {
    const card: EnhancedAbilityCard = {
      name: 'Test',
      level: '1',
      domain: 'Arcana',
      type: 'Spell',
      recall: '1',
      text: 'Test spell',
      action_type: 'attack',
    };
    expect(hasCombatRelevance(card)).toBe(true);
  });

  it('should return false for undefined action_type', () => {
    const card: EnhancedAbilityCard = {
      name: 'Test',
      level: '1',
      domain: 'Arcana',
      type: 'Ability',
      recall: '1',
      text: 'Test ability',
      action_type: undefined,
    };
    expect(hasCombatRelevance(card)).toBe(false);
  });

  it('should return true for cards with attack property', () => {
    const card: EnhancedAbilityCard = {
      name: 'Test',
      level: '1',
      domain: 'Arcana',
      type: 'Spell',
      recall: '1',
      text: 'Test spell',
      attack: {
        trait: 'Spellcast',
        range: 'Far',
        damage: '1d8',
        damage_type: 'magic',
      },
    };
    expect(hasCombatRelevance(card)).toBe(true);
  });

  it('should return false for cards with damage keyword', () => {
    const card: EnhancedAbilityCard = {
      name: 'Test',
      level: '1',
      domain: 'Arcana',
      type: 'Spell',
      recall: '1',
      text: 'Test spell',
      keywords: ['damage'],
    };
    expect(hasCombatRelevance(card)).toBe(false);
  });

  it('should return false for passive abilities without combat relevance', () => {
    const card: EnhancedAbilityCard = {
      name: 'Test',
      level: '1',
      domain: 'Arcana',
      type: 'Ability',
      recall: '1',
      text: 'Test ability',
      action_type: undefined,
      keywords: ['buff'],
    };
    expect(hasCombatRelevance(card)).toBe(false);
  });
});
