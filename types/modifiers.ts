export type ModifierType = 'stat' | 'roll' | 'conditional';

export type ModifierOperator = 'add' | 'subtract' | 'multiply' | 'divide' | 'set';

export type CharacterStat = 
  | 'agility' | 'strength' | 'finesse' | 'instinct' | 'presence' | 'knowledge' 
  | 'evasion' | 'armor' | 'hp' | 'stress' | 'hope' | 'proficiency';

export interface Modifier {
  id: string;
  type: ModifierType;
  target: CharacterStat | string; // 'agility', 'spellcast_roll', etc.
  value: number;
  operator: ModifierOperator;
  condition?: string; // "while unarmored", "when you mark stress"
  description: string; // Original text or generated description
}

export interface ItemModifiers {
  modifiers: Modifier[];
}
