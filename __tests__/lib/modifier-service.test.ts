import { describe, it, expect } from 'vitest';
import ModifierService, { ValidationResult } from '@/lib/modifier-service';
import { Modifier, ModifierType } from '@/types/modifiers';
import { Character } from '@/types/character';

describe('ModifierService', () => {
  
  // Mock Character
  const mockCharacter: Character = {
    id: 'char1',
    user_id: 'user1',
    name: 'Test Char',
    level: 1,
    stats: {
      agility: 1,
      strength: 2,
      finesse: 0,
      instinct: 0,
      presence: 0,
      knowledge: 0,
    },
    vitals: {
      hit_points_max: 10,
      hit_points_current: 10,
      stress_max: 5,
      stress_current: 0,
      armor_score: 0, // Unarmored
      armor_slots: 2,
    },
    damage_thresholds: { minor: 1, major: 2, severe: 3 },
    hope: 2,
    fear: 0,
    evasion: 10,
    proficiency: 1,
    experiences: [],
    gold: { handfuls: 0, bags: 0, chests: 0 },
  };

  describe('applyModifiers', () => {
    it('should correctly apply additive modifiers', () => {
      const baseEvasion = 10;
      const modifiers: Modifier[] = [
        { id: '1', type: 'stat', target: 'evasion', value: 2, operator: 'add', description: '+2 Evasion' },
        { id: '2', type: 'stat', target: 'evasion', value: 1, operator: 'add', description: '+1 Evasion' },
      ];

      const result = ModifierService.applyModifiers(baseEvasion, modifiers, mockCharacter, 'evasion');
      expect(result).toBe(13); // 10 + 2 + 1
    });

    it('should correctly apply subtractive modifiers', () => {
      const baseEvasion = 10;
      const modifiers: Modifier[] = [
        { id: '1', type: 'stat', target: 'evasion', value: 2, operator: 'subtract', description: '-2 Evasion' },
      ];

      const result = ModifierService.applyModifiers(baseEvasion, modifiers, mockCharacter, 'evasion');
      expect(result).toBe(8); // 10 - 2
    });

    it('should correctly apply multiplicative modifiers', () => {
      // Logic assumes multiply happens before add/sub based on standard math, but let's check implementation
      // Implementation: Mult/Div first, then Add/Sub.
      // Base: 10. Mult * 2 = 20. Add + 1 = 21.
      const baseEvasion = 10;
      const modifiers: Modifier[] = [
        { id: '1', type: 'stat', target: 'evasion', value: 2, operator: 'multiply', description: 'Double Evasion' },
        { id: '2', type: 'stat', target: 'evasion', value: 1, operator: 'add', description: '+1 Evasion' },
      ];

      const result = ModifierService.applyModifiers(baseEvasion, modifiers, mockCharacter, 'evasion');
      expect(result).toBe(21); 
    });

    it('should handle set operator overriding previous values', () => {
      // Implementation: Set happens first? No, look at code:
      // "currentValue = setModifiers[...].value" -> Starts with SET value if present.
      // Then applies others on top.
      const baseHp = 10;
      const modifiers: Modifier[] = [
        { id: '1', type: 'stat', target: 'hp', value: 20, operator: 'set', description: 'Set HP to 20' },
        { id: '2', type: 'stat', target: 'hp', value: 5, operator: 'add', description: '+5 HP' },
      ];

      const result = ModifierService.applyModifiers(baseHp, modifiers, mockCharacter, 'hp');
      expect(result).toBe(25); // Set to 20, then add 5.
    });

    it('should ignore modifiers for other targets', () => {
      const baseEvasion = 10;
      const modifiers: Modifier[] = [
        { id: '1', type: 'stat', target: 'strength', value: 5, operator: 'add', description: '+5 Strength' },
      ];

      const result = ModifierService.applyModifiers(baseEvasion, modifiers, mockCharacter, 'evasion');
      expect(result).toBe(10); // No change
    });
  });

  describe('resolveConditionalModifier', () => {
    it('should apply modifier when condition is met (unarmored)', () => {
      const modifier: Modifier = { 
        id: '1', type: 'conditional', target: 'evasion', value: 2, operator: 'add', condition: 'while unarmored', description: 'Unarmored Defense' 
      };
      // Mock char is unarmored (armor_score: 0)
      const result = ModifierService.resolveConditionalModifier(modifier, mockCharacter);
      expect(result).not.toBeNull();
      expect(result?.value).toBe(2);
    });

    it('should NOT apply modifier when condition is NOT met', () => {
      const armoredChar = { ...mockCharacter, vitals: { ...mockCharacter.vitals, armor_score: 5 } };
      const modifier: Modifier = { 
        id: '1', type: 'conditional', target: 'evasion', value: 2, operator: 'add', condition: 'while unarmored', description: 'Unarmored Defense' 
      };
      
      const result = ModifierService.resolveConditionalModifier(modifier, armoredChar);
      expect(result).toBeNull();
    });

    it('should always return modifier if no condition is present', () => {
      const modifier: Modifier = { 
        id: '1', type: 'stat', target: 'evasion', value: 2, operator: 'add', description: 'Always active' 
      };
      const result = ModifierService.resolveConditionalModifier(modifier, mockCharacter);
      expect(result).toEqual(modifier);
    });
  });

  describe('clampValue', () => {
    it('should clamp values exceeding max', () => {
      // Evasion max is 50 in constants
      const result = ModifierService.clampValue(100, 'evasion');
      expect(result).toBe(50);
    });

    it('should clamp values below min', () => {
      // Evasion min is 0
      const result = ModifierService.clampValue(-5, 'evasion');
      expect(result).toBe(0);
    });

    it('should return value if within range', () => {
      const result = ModifierService.clampValue(15, 'evasion');
      expect(result).toBe(15);
    });
  });

  describe('validateModifier', () => {
    it('should return valid for correct modifier', () => {
      const modifier: Modifier = { 
        id: '1', type: 'stat', target: 'evasion', value: 2, operator: 'add', description: 'Valid' 
      };
      const result = ModifierService.validateModifier(modifier);
      expect(result.isValid).toBe(true);
    });

    it('should return invalid if target is missing', () => {
      const modifier = { 
        id: '1', type: 'stat', value: 2, operator: 'add', description: 'Invalid' 
      } as Modifier; // casting to force error
      // @ts-ignore
      modifier.target = '';
      
      const result = ModifierService.validateModifier(modifier);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Target stat is missing');
    });

    it('should return invalid for unknown operator', () => {
      const modifier = { 
        id: '1', type: 'stat', target: 'evasion', value: 2, operator: 'wrong', description: 'Invalid' 
      } as unknown as Modifier;

      const result = ModifierService.validateModifier(modifier);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid operator: wrong');
    });
  });

  describe('stackModifiers', () => {
    it('should stack identical modifiers', () => {
      const modifiers: Modifier[] = [
        { id: '1', type: 'stat', target: 'evasion', value: 1, operator: 'add', description: 'Skill' },
        { id: '2', type: 'stat', target: 'evasion', value: 1, operator: 'add', description: 'Skill' }, // Same description/target
      ];

      const result = ModifierService.stackModifiers(modifiers);
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(2);
      expect(result[0].count).toBe(2);
      expect(result[0].sources).toContain('1');
      expect(result[0].sources).toContain('2');
    });

    it('should NOT stack different modifiers', () => {
      const modifiers: Modifier[] = [
        { id: '1', type: 'stat', target: 'evasion', value: 1, operator: 'add', description: 'Skill A' },
        { id: '2', type: 'stat', target: 'evasion', value: 1, operator: 'add', description: 'Skill B' },
      ];

      const result = ModifierService.stackModifiers(modifiers);
      expect(result).toHaveLength(2);
    });
  });
});
