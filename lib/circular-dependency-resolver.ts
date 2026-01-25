/**
 * CIRCULAR DEPENDENCY RESOLVER
 * ============================================================================
 * Solves the circular dependency between trait totals and domain card modifiers.
 *
 * THE PROBLEM:
 * Domain cards can use dynamic formulas that reference trait values.
 * Example: "Deal [2d8 + Strength] damage"
 *
 * But calculating trait totals requires knowing what domain card modifiers apply.
 * And domain card modifiers depend on evaluating those formulas.
 *
 * This creates: Trait Totals ← Domain Cards ← Trait Totals (circular!)
 *
 * THE SOLUTION:
 * Single-pass evaluation with pre-calculated trait totals:
 * 1. Calculate BASE trait totals (no domain card modifiers yet)
 * 2. Process domain cards using those trait values in formulas
 * 3. Return complete modifier list with domain card modifiers included
 *
 * Result: Trait Totals → Domain Cards → Modifier List (linear!)
 *
 * KEY INSIGHT:
 * Domain card modifiers are meant to STACK ON TOP OF base traits, not include them.
 * So using base trait values in formulas is correct game design.
 *
 * Example:
 *   Character base Strength: 4
 *   Domain card formula: [1d8 + Strength]
 *   Strength value in formula: 4 (base, not including domain modifiers)
 *   Domain card modifier to Strength: +2
 *   Final Strength total: 4 + 2 = 6 ✓
 */

import type { Character } from '@/types/character';

/**
 * Calculate base trait totals WITHOUT domain card modifiers.
 * Used by domain card formula evaluation to avoid circular dependency.
 *
 * IMPORTANT: This returns ONLY base trait values. Domain card modifiers
 * are NOT included here - they're added as separate modifiers after
 * the domain cards are processed.
 *
 * @param character - The character to calculate trait totals for
 * @returns Record of trait name -> total value (base only, no domain card mods)
 */
export function calculateBaseTraitTotals(character: Character): Record<string, number> {
  const traits = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'] as const;
  const totals: Record<string, number> = {};

  for (const trait of traits) {
    const baseStat = character.stats?.[trait] ?? 0;
    const userMods = (character.modifiers?.[trait] ?? []) as any[];
    const userTotal = userMods.reduce((sum: number, mod: any) => sum + (mod.value || 0), 0);

    totals[trait] = baseStat + userTotal;
  }

  return totals;
}

/**
 * Determine if a stat is a trait or a derived stat.
 * Traits: agility, strength, finesse, instinct, presence, knowledge
 * Derived: evasion, armor, damage, etc.
 *
 * This distinction is important for avoiding circular dependency:
 * - Querying traits directly: Skip full calculation (to avoid circle)
 * - Querying derived stats: Do full calculation (need trait totals)
 *
 * @param stat - The stat name to check
 * @returns True if stat is a trait
 */
export function isTrait(stat: string): boolean {
  const traits = new Set(['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge']);
  return traits.has(stat.toLowerCase());
}

/**
 * Get character with trait totals pre-calculated for formula evaluation.
 * Used when processing domain cards that reference trait values.
 *
 * This creates a temporary character object with calculated trait totals
 * that can be used in dynamic formula evaluation without circular dependency.
 *
 * @param character - The original character
 * @param statsToUse - Pre-calculated trait totals (base values only)
 * @returns Character object with calculated stats for formula evaluation
 */
export function createCharacterForFormulaEvaluation(
  character: Character,
  statsToUse: Record<string, number>
): Character & { stats: Record<string, number> } {
  return {
    ...character,
    stats: statsToUse,
  };
}

/**
 * Documentation of the circular dependency solution.
 *
 * FLOW DIAGRAM:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ getStatModifiers(character, stat)                               │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                                                                 │
 * │  1. Check if querying a trait or derived stat?                │
 * │     ├─ If TRAIT: Skip step 2, process directly                │
 * │     └─ If DERIVED: Continue to step 2                         │
 * │                                                                 │
 * │  2. Calculate base trait totals                               │
 * │     └─ baseTraits = calculateBaseTraitTotals(character)      │
 * │                                                                 │
 * │  3. Create temporary character with calculated traits        │
 * │     └─ charForFormulas = createCharacterForFormulaEvaluation │
 * │                          (character, baseTraits)               │
 * │                                                                 │
 * │  4. Process all modifier sources                             │
 * │     ├─ Equipment: Direct extraction                          │
 * │     ├─ Domain Cards: Use charForFormulas in formula eval    │
 * │     ├─ User: Direct extraction                               │
 * │     ├─ Ancestry: Direct extraction                           │
 * │     ├─ Community: Direct extraction                          │
 * │     ├─ Class: Direct extraction                              │
 * │     └─ Subclass: Direct extraction                           │
 * │                                                                 │
 * │  5. Return complete modifier list                            │
 * │     └─ [equipment mods, domain mods, user mods, ...]         │
 * │                                                                 │
 * │ RESULT: No circular dependency! Single-pass evaluation.      │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * WHY THIS WORKS:
 * - Domain card formulas evaluate BEFORE we apply their modifiers
 * - Formulas use BASE trait values (no domain card bonuses yet)
 * - Domain card modifiers are then added as separate entries
 * - Final trait total = base + user mods + domain card mods
 *
 * EXAMPLE:
 * Character: base Strength 4, user modifier +1
 * Domain card: "Deal [1d8 + Strength] damage" and "+1 Strength"
 *
 * Step 1: Calculate base Strength = 4 + 1 = 5
 * Step 2: Evaluate domain card formula with Strength = 5 (base + user only)
 * Step 3: Extract domain card modifier: +1 Strength
 * Final: Strength = 5 + 1 = 6 ✓
 *
 * The formula uses 5, not 6, preventing circular dependency.
 */

/**
 * Type for the evaluation context passed to formula evaluators.
 * Allows formulas to safely reference character traits and derived stats.
 */
export interface FormulaEvaluationContext {
  stats: Record<string, number>;
  baseStats: Record<string, number>;
  getStatValue: (stat: string) => number;
}

/**
 * Create a safe formula evaluation context.
 * Provides read-only access to character stats for formula evaluation.
 *
 * @param character - Character to create context for
 * @param baseStats - Pre-calculated base stat totals
 * @returns Safe evaluation context
 */
export function createFormulaContext(
  character: Character & { stats: Record<string, number> },
  baseStats: Record<string, number>
): FormulaEvaluationContext {
  return {
    stats: { ...character.stats },
    baseStats: { ...baseStats },
    getStatValue: (stat: string): number => {
      return character.stats[stat] ?? baseStats[stat] ?? 0;
    },
  };
}
