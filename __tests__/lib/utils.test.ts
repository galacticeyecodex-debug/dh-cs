import { describe, it, expect } from 'vitest';
import { calculateWeaponDamage } from '@/lib/utils';

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
