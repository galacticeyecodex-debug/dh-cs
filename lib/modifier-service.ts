import { Modifier, ModifierOperator, CharacterStat } from '@/types/modifiers';
import { Character } from '@/types/character';

// Constants for Stat Ranges
export const STAT_RANGES: Partial<Record<CharacterStat | string, { min: number; max: number }>> = {
  agility: { min: -10, max: 10 },
  strength: { min: -10, max: 10 },
  finesse: { min: -10, max: 10 },
  instinct: { min: -10, max: 10 },
  presence: { min: -10, max: 10 },
  knowledge: { min: -10, max: 10 },
  evasion: { min: 0, max: 50 }, // Practical max
  armor: { min: 0, max: 50 },
  hp: { min: 0, max: 100 },
  stress: { min: 0, max: 20 },
  hope: { min: 0, max: 10 },
  proficiency: { min: 1, max: 10 },
};

/**
 * Validation Result Interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Interface for Stacked Modifier
 */
export interface StackedModifier extends Modifier {
  count: number;
  sources: string[];
}

/**
 * Game Context for conditional resolution
 */
export interface GameContext {
  [key: string]: any;
}

const ModifierService = {
  /**
   * Applies a list of modifiers to a base stat value.
   * Handles filtering, conditional resolution, stacking, and operator application.
   */
  applyModifiers(
    baseStat: number,
    modifiers: Modifier[],
    character: Character,
    targetStat: CharacterStat | string
  ): number {
    // 1. Filter modifiers for the specific target stat
    const relevantModifiers = this.getModifiersForStat(modifiers, targetStat);

    // 2. Resolve conditional modifiers
    const activeModifiers = relevantModifiers
      .map((mod) => this.resolveConditionalModifier(mod, character))
      .filter((mod): mod is Modifier => mod !== null);

    // 3. Apply operators in order
    // Order of operations: SET -> MULTIPLY/DIVIDE -> ADD/SUBTRACT
    // (This is a common RPG convention, though Daggerheart might be simpler. 
    // Usually + and - happen after multiplication in math, but in RPGs base * mult + flat is common.
    // However, if we have "Set to X", that overrides everything usually, or becomes the new base.
    // Let's assume standard math order for now, but prioritize SET)
    
    let currentValue = baseStat;
    
    // First, check for any 'set' operators. If multiple, the last one wins (or highest/lowest? Defaulting to last).
    const setModifiers = activeModifiers.filter(m => m.operator === 'set');
    if (setModifiers.length > 0) {
      currentValue = setModifiers[setModifiers.length - 1].value;
    }

    // Then apply multiplications and divisions
    const multModifiers = activeModifiers.filter(m => m.operator === 'multiply');
    const divModifiers = activeModifiers.filter(m => m.operator === 'divide');
    
    // Then apply additions and subtractions
    const addModifiers = activeModifiers.filter(m => m.operator === 'add');
    const subModifiers = activeModifiers.filter(m => m.operator === 'subtract');

    // Apply * and /
    multModifiers.forEach(m => { currentValue = this.applyOperator(currentValue, m); });
    divModifiers.forEach(m => { currentValue = this.applyOperator(currentValue, m); });

    // Apply + and -
    addModifiers.forEach(m => { currentValue = this.applyOperator(currentValue, m); });
    subModifiers.forEach(m => { currentValue = this.applyOperator(currentValue, m); });

    // 4. Clamp value if range exists
    return this.clampValue(currentValue, targetStat);
  },

  /**
   * Filters a list of modifiers to find those targeting a specific stat.
   */
  getModifiersForStat(
    modifiers: Modifier[],
    stat: CharacterStat | string
  ): Modifier[] {
    return modifiers.filter((m) => m.target.toLowerCase() === stat.toLowerCase());
  },

  /**
   * Validates a single modifier.
   */
  validateModifier(modifier: Modifier): ValidationResult {
    const errors: string[] = [];

    if (!modifier.id) errors.push('Modifier ID is missing');
    if (!modifier.target) errors.push('Target stat is missing');
    if (modifier.value === undefined || modifier.value === null) errors.push('Value is missing');
    
    // Check if operator is valid
    const validOperators: ModifierOperator[] = ['add', 'subtract', 'multiply', 'divide', 'set'];
    if (!validOperators.includes(modifier.operator)) {
      errors.push(`Invalid operator: ${modifier.operator}`);
    }

    // Check reasonable value range (soft check)
    if (modifier.value < -100 || modifier.value > 100) {
      // Not necessarily an error, but worth noting. For validation, we'll keep it loose unless strict ranges needed.
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Stacks identical modifiers (same source and target).
   * Note: This might depend on game rules. Usually bonuses from same source don't stack.
   * But here we just group them if needed. 
   * The issue description says: "Combine identical modifiers (from same source)... Sum values".
   */
  stackModifiers(modifiers: Modifier[]): StackedModifier[] {
    const stackedMap = new Map<string, StackedModifier>();

    modifiers.forEach((mod) => {
      // Create a unique key for grouping. 
      // Assuming 'description' or 'id' might indicate source if not explicitly defined.
      // Since Modifier type doesn't have 'source', we'll rely on target + type + operator + description.
      const key = `${mod.target}-${mod.type}-${mod.operator}-${mod.description}`;

      if (stackedMap.has(key)) {
        const existing = stackedMap.get(key)!;
        existing.value += mod.value;
        existing.count += 1;
        existing.sources.push(mod.id); // capturing ID as source identifier
      } else {
        stackedMap.set(key, {
          ...mod,
          count: 1,
          sources: [mod.id],
        });
      }
    });

    return Array.from(stackedMap.values());
  },

  /**
   * Resolves a conditional modifier against the character state.
   * Returns the modifier if condition is met, or null if not.
   */
  resolveConditionalModifier(
    modifier: Modifier,
    character: Character,
    context: GameContext = {}
  ): Modifier | null {
    if (!modifier.condition) {
      return modifier; // No condition, always applies
    }

    if (this.isConditionalMet(modifier.condition, character, context)) {
      return modifier;
    }

    return null;
  },

  /**
   * Applies a single operator to a base value.
   */
  applyOperator(baseStat: number, modifier: Modifier): number {
    switch (modifier.operator) {
      case 'add':
        return baseStat + modifier.value;
      case 'subtract':
        return baseStat - modifier.value;
      case 'multiply':
        return baseStat * modifier.value;
      case 'divide':
        return modifier.value !== 0 ? baseStat / modifier.value : baseStat; // Avoid divide by zero
      case 'set':
        return modifier.value;
      default:
        return baseStat;
    }
  },

  // Private Helpers

  /**
   * Checks if a condition string is met by the character state.
   */
  isConditionalMet(condition: string, character: Character, context: GameContext): boolean {
    const cond = condition.toLowerCase();

    // Example conditions - expandable based on rules
    if (cond.includes('unarmored')) {
      return character.vitals.armor_score === 0;
    }
    
    if (cond.includes('stress')) {
       // Check if context indicates stress marked? 
       // Or if character has max stress? 
       // Context-dependent.
       if (context.trigger === 'mark_stress') return true;
    }

    if (cond.includes('bloodied') || cond.includes('below half health')) {
      return character.vitals.hit_points_current < (character.vitals.hit_points_max / 2);
    }

    // Default to false for unknown conditions to be safe
    return false;
  },

  /**
   * Clamps a value within the defined range for the stat.
   */
  clampValue(value: number, stat: CharacterStat | string): number {
    const range = STAT_RANGES[stat] || STAT_RANGES[stat.toLowerCase()];
    if (!range) return value; // No range defined, return raw

    return Math.max(range.min, Math.min(value, range.max));
  }
};

export default ModifierService;
