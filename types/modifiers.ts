export type ModifierType = 'stat' | 'combat' | 'roll' | 'conditional';

export type ModifierOperator = 'add' | 'subtract' | 'multiply' | 'divide' | 'set';

export type CharacterStat =
  | 'agility' | 'strength' | 'finesse' | 'instinct' | 'presence' | 'knowledge'
  | 'evasion' | 'armor' | 'hp' | 'stress' | 'hope' | 'proficiency';

export type CombatTarget = 'attack' | 'damage';

export interface Modifier {
  id: string;
  type: ModifierType;
  target: CharacterStat | CombatTarget | string; // 'agility', 'attack', 'damage', 'spellcast_roll', etc.
  value: number;
  operator: ModifierOperator;
  condition?: string; // "while unarmored", "when you mark stress"
  description: string; // Original text or generated description
}

export interface ItemModifiers {
  modifiers: Modifier[];
}

export interface Experience {
  name: string;
  value: number;
}