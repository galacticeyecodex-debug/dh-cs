/**
 * DICE UTILITIES
 * ----------------------------------------------------------------------------
 * Pure functions for dice rolling logic, decoupled from the 3D rendering.
 * These functions can be tested independently of the DiceBox library.
 *
 * FUNCTIONALITY:
 * - rollDice: Generate random dice roll values
 * - parseDiceNotation: Parse dice strings like "2d8+3" into structured config
 * - calculateDualityResult: Compute hope/fear roll outcomes
 * - calculateDamageResult: Compute damage roll totals
 */

export type DiceRole = 'hope' | 'fear' | 'plus' | 'minus' | 'damage';

export interface DieConfig {
  id: string;
  sides: number;
  role: DiceRole;
}

export interface DieResult {
  role: DiceRole;
  value: number;
  sides: number;
}

export interface DualityRollResult {
  hope: number;
  fear: number;
  total: number;
  plusTotal: number;
  minusTotal: number;
  modifier: number;
  type: 'Critical' | 'Hope' | 'Fear';
  dice: DieResult[];
}

export interface DamageRollResult {
  total: number;
  modifier: number;
  dice: DieResult[];
}

export interface ParsedDiceNotation {
  diceConfig: { sides: number; themeColor: string }[];
  stringModifier: number;
}

/**
 * Generate a random dice roll value
 * @param sides - Number of sides on the die (e.g., 6 for d6, 20 for d20)
 * @returns A random integer from 1 to sides (inclusive)
 */
export function rollDice(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Parse a dice notation string like "2d8+3" into structured configuration
 * @param diceString - The dice notation to parse (e.g., "2d8+3", "d6", "1d12+2d6+5")
 * @param themeColor - The color to use for the dice (defaults to red for damage)
 * @returns Parsed dice configuration and any static modifiers
 */
export function parseDiceNotation(diceString: string, themeColor: string = 'var(--dice-damage)'): ParsedDiceNotation {
  // Clean up the string - remove damage type annotations and whitespace
  const cleanDice = diceString.replace(/(phy|mag|physical|magic)/gi, '').replace(/\s/g, '');
  const diceParts = cleanDice.split('+');

  const diceConfig: { sides: number; themeColor: string }[] = [];
  let stringModifier = 0;

  for (const part of diceParts) {
    const diceMatch = part.match(/^(\d+)?d(\d+)$/i);
    if (diceMatch) {
      const count = diceMatch[1] ? parseInt(diceMatch[1]) : 1;
      const sides = parseInt(diceMatch[2]);
      for (let i = 0; i < count; i++) {
        diceConfig.push({ sides, themeColor });
      }
    } else {
      const num = parseInt(part);
      if (!isNaN(num)) stringModifier += num;
    }
  }

  return { diceConfig, stringModifier };
}

/**
 * Roll dice using the fallback random number generator
 * @param diceConfig - Array of dice configurations
 * @returns Array of die results
 */
export function rollDiceSet(diceConfig: { sides: number }[]): DieResult[] {
  return diceConfig.map((die) => ({
    role: 'damage' as DiceRole,
    value: rollDice(die.sides),
    sides: die.sides,
  }));
}

/**
 * Calculate the result of a damage roll
 * @param diceResults - Array of individual die results
 * @param modifier - Total modifier to add
 * @returns The complete damage roll result
 */
export function calculateDamageResult(diceResults: DieResult[], modifier: number): DamageRollResult {
  const total = diceResults.reduce((sum, die) => sum + die.value, 0) + modifier;
  return {
    total,
    modifier,
    dice: diceResults,
  };
}

/**
 * Calculate the result of a duality roll (hope/fear)
 * @param dicePool - Array of dice with their roles
 * @param rollValues - The rolled values for each die (must match dicePool order)
 * @param modifier - Total modifier to apply
 * @returns The complete duality roll result
 */
export function calculateDualityResult(
  dicePool: DieConfig[],
  rollValues: number[],
  modifier: number
): DualityRollResult {
  let hopeRoll = 0;
  let fearRoll = 0;
  let plusTotal = 0;
  let minusTotal = 0;
  const dice: DieResult[] = [];

  dicePool.forEach((die, idx) => {
    const val = rollValues[idx];
    dice.push({ role: die.role, value: val, sides: die.sides });

    if (die.role === 'hope' && hopeRoll === 0) hopeRoll = val;
    else if (die.role === 'fear' && fearRoll === 0) fearRoll = val;
    else if (die.role === 'plus') plusTotal += val;
    else if (die.role === 'minus') minusTotal += val;
  });

  const total = hopeRoll + fearRoll + modifier + plusTotal - minusTotal;

  let type: 'Critical' | 'Hope' | 'Fear' = 'Hope';
  if (hopeRoll === fearRoll && hopeRoll !== 0) type = 'Critical';
  else if (hopeRoll > fearRoll) type = 'Hope';
  else type = 'Fear';

  return {
    hope: hopeRoll,
    fear: fearRoll,
    total,
    plusTotal,
    minusTotal,
    modifier,
    type,
    dice,
  };
}

/**
 * Roll a complete duality roll using fallback mode
 * @param dicePool - Array of dice with their roles
 * @param modifier - Total modifier to apply
 * @returns The complete duality roll result
 */
export function rollDuality(dicePool: DieConfig[], modifier: number): DualityRollResult {
  const rollValues = dicePool.map((die) => rollDice(die.sides));
  return calculateDualityResult(dicePool, rollValues, modifier);
}

/**
 * Roll damage dice using fallback mode
 * @param diceNotation - Dice notation string (e.g., "2d8+3")
 * @param additionalModifier - Additional modifier to add
 * @returns The complete damage roll result
 */
export function rollDamage(diceNotation: string, additionalModifier: number = 0): DamageRollResult {
  const { diceConfig, stringModifier } = parseDiceNotation(diceNotation);
  const diceResults = rollDiceSet(diceConfig);
  return calculateDamageResult(diceResults, stringModifier + additionalModifier);
}
