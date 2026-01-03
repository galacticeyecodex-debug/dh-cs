/**
 * DOMAIN CARD PARSER
 * ----------------------------------------------------------------------------
 * Extracts passive modifiers and combat mechanics from domain card descriptions.
 *
 * FUNCTIONALITY:
 * - Parses card text for stat bonuses (+1 to Agility, +half Agility to Evasion, etc.)
 * - Evaluates conditions (equipment state, loadout composition)
 * - Calculates dynamic modifier values
 * - Returns structured modifier data for integration with character stats
 *
 * This parser follows similar patterns to ModifierBuilder for consistency.
 */

import type { Character, CharacterCard } from '@/types/character';
import type {
  ActionType,
  AdditionalDamage,
  CardAttack,
  CardCosts,
  CardModifier,
  CardRoll,
  CombatCategory,
  DamageType,
  EnhancedAbilityCard,
  EnhancedFeature,
  Frequency,
  Range,
  TargetType,
  Timing,
} from '@/types/cards';

/**
 * Represents a passive stat modifier from a domain card
 */
export interface PassiveModifier {
  stat: string;           // Target stat: "agility", "evasion", "armor_score", "proficiency", etc.
  value: number;          // Calculated numeric value
  formula?: string;       // Dynamic formula if applicable: "half_agility", "3_plus_strength"
  condition?: ModifierCondition;
  isActive: boolean;      // Whether condition is currently met
  source: string;         // Card name for display
}

/**
 * Condition types for modifier activation
 */
export type ModifierCondition =
  | { type: 'always' }
  | { type: 'when_armored' }
  | { type: 'when_unarmored' }
  | { type: 'loadout_domain_count'; domain: string; minCount: number }
  | { type: 'environment'; requirement: string };

/**
 * Stat name mappings for text parsing
 */
const STAT_PATTERNS: Record<string, RegExp> = {
  agility: /agility/i,
  strength: /strength/i,
  finesse: /finesse/i,
  instinct: /instinct/i,
  presence: /presence/i,
  knowledge: /knowledge/i,
  evasion: /evasion/i,
  armor_score: /armor\s+score/i,
  proficiency: /proficiency/i,
  spellcast: /spellcast/i,

  // Specific threshold patterns first to prevent partial matching with "damage"
  damage_threshold_severe: /severe\s+damage\s+thresholds?/i,
  damage_threshold_major: /major\s+damage\s+thresholds?/i,
  damage_threshold_minor: /minor\s+damage\s+thresholds?/i,
  damage_threshold: /damage\s+thresholds?/i,

  // Resource patterns
  hit_points: /hit\s+points?|hp/i,
  stress: /stress/i,
  hope: /hope(?!\s+die)/i, // Matches "hope" but NOT "hope die"

  attack: /attack(?:\s+rolls?)?/i, // Matches "attack" or "attack roll"
  // Use negative lookahead to ensure we don't match "damage threshold" as "damage"
  damage: /damage(?:\s+rolls?)?(?!\s+threshold)/i,
};

/**
 * Strip markdown formatting for cleaner text matching
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  return text.replace(/\*\*|\*/g, '');
}

/**
 * Main parsing function - extracts all passive modifiers from a card
 */
export function parseCardPassiveModifiers(
  card: CharacterCard,
  character: Character
): PassiveModifier[] {
  const description = card.library_item?.data?.description || '';
  const cardName = card.library_item?.name || 'Unknown Card';
  const modifiers: PassiveModifier[] = [];

  // Parse condition context first
  const condition = extractCondition(description);

  // Pattern 1: Static bonus/penalty - "+1 bonus to your Agility" or "-2 penalty to your Spellcast Rolls"
  const staticMatches = Array.from(description.matchAll(/([+\-]\d+)\s+(?:(?:bonus|penalty)\s+)?to\s+(?:your\s+)?([a-z\s]+?)(?:\s+rolls?)?(?:\.|,|\n|$|\s+(?:but|and|or|while|when))/gi));

  for (const matchResult of staticMatches) {
    const match = matchResult as RegExpMatchArray;
    const valueStr = match[1];
    const statText = match[2];
    if (!valueStr || !statText) continue;

    const value = parseInt(valueStr); // Handles both +1 and -1
    const stat = matchStatName(statText.trim());

    if (stat) {
      const isActive = evaluateModifierCondition(condition, character);
      modifiers.push({
        stat,
        value,
        condition,
        isActive,
        source: cardName
      });
    }
  }

  // Pattern 2: Dynamic bonus - "equal to half your Agility"
  const dynamicMatches = Array.from(description.matchAll(/equal to\s+(?:(half)\s+)?(?:your\s+)?([a-z]+)/gi));

  for (const matchResult of dynamicMatches) {
    const match = matchResult as RegExpMatchArray;
    const isHalf = !!match[1];
    const sourceStat = match[2]!.toLowerCase();

    // Find what stat this bonus applies to (look backwards in the text)
    const beforeText = description.substring(0, match.index);
    const targetStatMatch = beforeText.match(/to\s+(?:your\s+)?([a-z\s]+?)$/i);

    if (targetStatMatch) {
      const targetStat = matchStatName(targetStatMatch[1]!.trim());
      if (targetStat) {
        const formula = isHalf ? `half_${sourceStat}` : sourceStat;
        const value = calculateDynamicValue(formula, character);
        const isActive = evaluateModifierCondition(condition, character);

        modifiers.push({
          stat: targetStat,
          value,
          formula,
          condition,
          isActive,
          source: cardName
        });
      }
    }
  }

  // Pattern 3: Complex formula - "3 + your Strength" (for Bare Bones)
  const complexMatches = Array.from(description.matchAll(/(\d+)\s*\+\s*(?:your\s+)?([a-z]+)/gi));

  for (const matchResult of complexMatches) {
    const match = matchResult as RegExpMatchArray;
    const baseValue = parseInt(match[1]!);
    const sourceStat = match[2]!.toLowerCase();

    // Find target stat
    const beforeText = description.substring(0, match.index);
    const targetStatMatch = beforeText.match(/to\s+(?:your\s+)?([a-z\s]+?)(?:\s+equal)?$/i);

    if (targetStatMatch) {
      const targetStat = matchStatName(targetStatMatch[1]!.trim());
      if (targetStat) {
        const formula = `${baseValue}_plus_${sourceStat}`;
        const value = calculateDynamicValue(formula, character);
        const isActive = evaluateModifierCondition(condition, character);

        modifiers.push({
          stat: targetStat,
          value,
          formula,
          condition,
          isActive,
          source: cardName
        });
      }
    }
  }

  return modifiers;
}

/**
 * Parse modifiers from card text without character context
 * Used for pre-parsing modifiers into the enhanced JSON
 */
export function parseStaticModifiers(text: string, cardName: string): CardModifier[] {
  const modifiers: CardModifier[] = [];

  // Strip markdown formatting first
  const cleanText = stripMarkdown(text);

  // Parse condition context first
  const condition = extractCondition(cleanText);

  // Pattern 1: Static bonus/penalty - "+1 bonus to your Agility" or "-2 penalty to your Spellcast Rolls"
  const staticMatches = Array.from(cleanText.matchAll(/([+\-]\d+)\s+(?:(?:bonus|penalty)\s+)?to\s+(?:your\s+)?([a-z\s]+?)(?:\s+rolls?)?(?:\.|,|\n|$|\s+(?:but|and|or|while|when))/gi));

  for (const matchResult of staticMatches) {
    const match = matchResult as RegExpMatchArray;
    const valueStr = match[1];
    const statText = match[2];
    if (!valueStr || !statText) continue;

    const value = parseInt(valueStr); // Handles both +1 and -1
    const stat = matchStatName(statText.trim());

    if (stat) {
      modifiers.push({
        stat,
        value,
        condition,
        source: cardName
      });
    }
  }

  // Pattern 2: Dynamic bonus - "equal to half your Agility"
  const dynamicMatches = Array.from(cleanText.matchAll(/equal to\s+(?:(half)\s+)?(?:your\s+)?([a-z]+)/gi));

  for (const matchResult of dynamicMatches) {
    const match = matchResult as RegExpMatchArray;
    const isHalf = !!match[1];
    const sourceStat = match[2]!.toLowerCase();

    // Find what stat this bonus applies to (look backwards in the text)
    const beforeText = cleanText.substring(0, match.index);
    const targetStatMatch = beforeText.match(/to\s+(?:your\s+)?([a-z\s]+?)$/i);

    if (targetStatMatch) {
      const targetStat = matchStatName(targetStatMatch[1]!.trim());
      if (targetStat) {
        const formula = isHalf ? `half_${sourceStat}` : sourceStat;

        modifiers.push({
          stat: targetStat,
          value: 0, // Will be calculated at runtime
          formula,
          condition,
          source: cardName
        });
      }
    }
  }

  // Pattern 3: Complex formula - "3 + your Strength" (for Bare Bones)
  const complexMatches = Array.from(cleanText.matchAll(/(\d+)\s*\+\s*(?:your\s+)?([a-z]+)/gi));

  for (const matchResult of complexMatches) {
    const match = matchResult as RegExpMatchArray;
    const baseValue = parseInt(match[1]!);
    const sourceStat = match[2]!.toLowerCase();

    // Find target stat
    const beforeText = cleanText.substring(0, match.index);
    const targetStatMatch = beforeText.match(/to\s+(?:your\s+)?([a-z\s]+?)(?:\s+equal)?$/i);

    if (targetStatMatch) {
      const targetStat = matchStatName(targetStatMatch[1]!.trim());
      if (targetStat) {
        const formula = `${baseValue}_plus_${sourceStat}`;

        modifiers.push({
          stat: targetStat,
          value: 0, // Will be calculated at runtime
          formula,
          condition,
          source: cardName
        });
      }
    }
  }

  // Pattern 4: Damage reduction - "reduce incoming damage by 1d8"
  const reductionMatches = Array.from(cleanText.matchAll(/reduce(?:\s+(?:incoming|the))?\s+damage\s+by\s+(\d*d\d+(?:\+\d+)?)/gi));

  for (const matchResult of reductionMatches) {
    const match = matchResult as RegExpMatchArray;
    const diceNotation = match[1];

    modifiers.push({
      stat: 'damage_reduction',
      value: 0, // Will be rolled at runtime
      formula: diceNotation,
      condition,
      source: cardName
    });
  }

  return modifiers;
}


/**
 * Extract condition from card description
 */
function extractCondition(description: string): ModifierCondition {
  // Check for armor conditions
  if (/(?:while|when)\s+(?:you(?:'re)?\s+)?(?:wearing\s+)?armor/i.test(description)) {
    return { type: 'when_armored' };
  }
  if (/(?:while|when)\s+(?:you(?:'re)?\s+)?(?:not\s+wearing\s+armor|unarmored|choose\s+not\s+to\s+equip\s+armor)/i.test(description)) {
    return { type: 'when_unarmored' };
  }

  // Check for loadout composition
  const loadoutMatch = description.match(/when\s+(\d+)\s+or\s+more\s+(?:of\s+the\s+)?domain\s+cards.*?are\s+from\s+the\s+(\w+)\s+domain/i);
  if (loadoutMatch) {
    return {
      type: 'loadout_domain_count',
      domain: loadoutMatch[2].toLowerCase(), // Normalize to lowercase
      minCount: parseInt(loadoutMatch[1])
    };
  }

  // Default: always active
  return { type: 'always' };
}

/**
 * Evaluate whether a condition is currently met
 */
export function evaluateModifierCondition(
  condition: ModifierCondition,
  character: Character
): boolean {
  switch (condition.type) {
    case 'always':
      return true;

    case 'when_armored':
      return !!character.character_inventory?.find(i =>
        i.location === 'equipped_armor'
      );

    case 'when_unarmored':
      return !character.character_inventory?.find(i =>
        i.location === 'equipped_armor'
      );

    case 'loadout_domain_count': {
      const loadoutCards = character.character_cards?.filter(c =>
        c.location === 'loadout'
      ) || [];
      const domainCount = loadoutCards.filter(c => {
        const domain = c.library_item?.domain || c.library_item?.data?.domain;
        return domain?.toLowerCase() === condition.domain;
      }).length;
      return domainCount >= condition.minCount;
    }

    case 'environment':
      // Environment tracking not yet implemented
      return false;

    default:
      return false;
  }
}

/**
 * Calculate dynamic modifier value from formula
 */
function calculateDynamicValue(formula: string, character: Character): number {
  // Handle "half_[stat]" pattern
  if (formula.startsWith('half_')) {
    const stat = formula.replace('half_', '');
    const statValue = character.stats?.[stat as keyof typeof character.stats] || 0;
    return Math.floor(statValue / 2);
  }

  // Handle "[number]_plus_[stat]" pattern (e.g., "3_plus_strength")
  const plusMatch = formula.match(/^(\d+)_plus_([a-z]+)$/);
  if (plusMatch) {
    const baseValue = parseInt(plusMatch[1]);
    const stat = plusMatch[2];
    const statValue = character.stats?.[stat as keyof typeof character.stats] || 0;
    return baseValue + statValue;
  }

  // Handle direct stat reference
  const statValue = character.stats?.[formula as keyof typeof character.stats];
  if (typeof statValue === 'number') {
    return statValue;
  }

  return 0;
}

/**
 * Match stat name from text to internal stat key
 */
function matchStatName(text: string): string | null {
  const cleanText = text.toLowerCase().trim();

  for (const [stat, pattern] of Object.entries(STAT_PATTERNS)) {
    if (pattern.test(cleanText)) {
      return stat;
    }
  }

  return null;
}

/**
 * Calculate character tier from level (used for Bare Bones damage thresholds)
 */
export function calculateTier(level: number): number {
  if (level === 1) return 1;
  if (level >= 2 && level <= 4) return 2;
  if (level >= 5 && level <= 7) return 3;
  return 4; // level 8-10
}

/**
 * Special case handler for Bare Bones card
 * Returns damage threshold modifiers based on tier
 */
export function getBareBonesBonuses(character: Character): PassiveModifier[] {
  const isUnarmored = !character.character_inventory?.find(i =>
    i.location === 'equipped_armor'
  );

  if (!isUnarmored) {
    return [];
  }

  const strength = character.stats?.strength || 0;
  const tier = calculateTier(character.level || 1);
  const condition: ModifierCondition = { type: 'when_unarmored' };

  return [
    {
      stat: 'armor_score',
      value: 3 + strength,
      formula: '3_plus_strength',
      condition,
      isActive: true,
      source: 'Bare Bones'
    },
    {
      stat: 'damage_threshold_minor',
      value: tier,
      condition,
      isActive: true,
      source: 'Bare Bones'
    },
    {
      stat: 'damage_threshold_major',
      value: tier * 2,
      condition,
      isActive: true,
      source: 'Bare Bones'
    },
    {
      stat: 'damage_threshold_severe',
      value: tier * 3,
      condition,
      isActive: true,
      source: 'Bare Bones'
    }
  ];
}

// ============================================================================
// ENHANCED ABILITY CARD PARSING
// ============================================================================
// The following functions parse ability/spell card text to extract structured
// metadata for interactive UI components (costs, tokens, attacks, etc.)

/**
 * Parse stress cost from card text
 * Matches patterns like "mark a Stress", "mark 2 Stress", "**mark a Stress**"
 * Excludes stress costs that are for replenishment (e.g., "mark a Stress to replenish")
 */
export function parseStressCost(text: string): number {
  // Strip markdown for pattern matching
  const cleanText = stripMarkdown(text);

  // Check if stress is for replenishment, not activation
  if (/mark\s+(?:a\s+)?\d*\s*Stress\s+to\s+replenish/i.test(cleanText)) {
    return 0; // This is a replenishment cost, not an activation cost
  }

  // Match "mark X Stress" or "mark a Stress"
  const patterns = [
    /\*\*mark (\d+) Stress\*\*/i,
    /mark (\d+) Stress/i,
    /\*\*mark a Stress\*\*/i,
    /mark a Stress/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // If we captured a number, use it; otherwise it's "a" = 1
      return match[1] ? parseInt(match[1], 10) : 1;
    }
  }

  return 0;
}

/**
 * Parse hope cost from card text
 * Matches patterns like "spend a Hope", "spend 3 Hope", "**spend 2 Hope**"
 */
export function parseHopeCost(text: string): number {
  const patterns = [
    /\*\*spend (\d+) Hope\*\*/i,
    /spend (\d+) Hope/i,
    /\*\*spend a Hope\*\*/i,
    /spend a Hope/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] ? parseInt(match[1], 10) : 1;
    }
  }

  return 0;
}

/**
 * Parse hit point cost from card text
 * Matches patterns like "mark a Hit Point", "mark 2 Hit Points"
 */
export function parseHitPointCost(text: string): number {
  const patterns = [
    /mark (\d+) Hit Points?/i,
    /mark a Hit Point/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] ? parseInt(match[1], 10) : 1;
    }
  }

  return 0;
}

/**
 * Parse all costs from card text
 */
export function parseCosts(text: string): CardCosts | undefined {
  const stress = parseStressCost(text);
  const hope = parseHopeCost(text);
  const hitPoints = parseHitPointCost(text);

  if (stress === 0 && hope === 0 && hitPoints === 0) {
    return undefined;
  }

  const costs: CardCosts = {};
  if (stress > 0) costs.stress = stress;
  if (hope > 0) costs.hope = hope;
  if (hitPoints > 0) costs.hit_points = hitPoints;

  return costs;
}

/**
 * Parse frequency from card text
 */
export function parseFrequency(text: string): Frequency {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('once per session')) {
    return 'once_per_session';
  }
  if (lowerText.includes('once per long rest')) {
    return 'once_per_long_rest';
  }
  if (lowerText.includes('once per rest')) {
    return 'once_per_rest';
  }

  return 'at_will';
}

/**
 * Parse duration from card text
 */
export function parseDuration(text: string): 'scene' | 'rest' | 'until_triggered' | null {
  const cleanText = stripMarkdown(text).toLowerCase();

  if (cleanText.includes('until the end of the scene')) {
    return 'scene';
  }
  if (cleanText.includes('until your next rest')) {
    return 'rest';
  }
  if (cleanText.includes('until triggered')) {
    return 'until_triggered';
  }

  return null;
}

/**
 * Parse range from card text
 */
export function parseCardRange(text: string): Range | undefined {
  const rangePatterns: { pattern: RegExp; range: Range }[] = [
    { pattern: /Very Far range/i, range: 'Very Far' },
    { pattern: /Very Close range/i, range: 'Very Close' },
    { pattern: /Far range/i, range: 'Far' },
    { pattern: /Close range/i, range: 'Close' },
    { pattern: /Melee range/i, range: 'Melee' },
    { pattern: /within Melee/i, range: 'Melee' },
    { pattern: /within Very Close/i, range: 'Very Close' },
    { pattern: /within Close/i, range: 'Close' },
    { pattern: /within Far/i, range: 'Far' },
    { pattern: /within Very Far/i, range: 'Very Far' },
  ];

  for (const { pattern, range } of rangePatterns) {
    if (pattern.test(text)) {
      return range;
    }
  }

  return undefined;
}

/**
 * Parse the trait used for rolls from card text
 */
export function parseRollTrait(text: string): string | undefined {
  // Match patterns like "**Spellcast Roll**" or "**Spellcast Roll (13)**"
  const traitPattern = /\*\*(Spellcast|Strength|Agility|Finesse|Presence|Knowledge|Instinct) Roll(?:\s*\(\d+\))?\*\*/i;
  const match = text.match(traitPattern);
  if (match) return match[1];

  // Also try without markdown for plain text
  const plainPattern = /(?:make a|make an)\s+(Spellcast|Strength|Agility|Finesse|Presence|Knowledge|Instinct)\s+Roll/i;
  const plainMatch = text.match(plainPattern);
  if (plainMatch) return plainMatch[1];

  // Pattern for "reaction roll using your [Trait] trait"
  // Need to strip markdown first to handle "**reaction roll** using your Spellcast trait"
  const cleanText = stripMarkdown(text);
  const usingTraitPattern = /(?:reaction\s+)?roll\s+using\s+(?:your\s+)?(Spellcast|Strength|Agility|Finesse|Presence|Knowledge|Instinct)(?:\s+trait)?/i;
  const usingMatch = cleanText.match(usingTraitPattern);
  if (usingMatch) return usingMatch[1];

  // Pattern for weapon-based traits: "Instinct weapon", "Finesse Close weapon"
  const weaponTraitPattern = /(?:as\s+(?:a|an)\s+)?(Spellcast|Strength|Agility|Finesse|Presence|Knowledge|Instinct)\s+(?:\w+\s+)?weapon/i;
  const weaponMatch = cleanText.match(weaponTraitPattern);
  if (weaponMatch) return weaponMatch[1];

  // Pattern for "treating it as an X weapon"
  const treatAsPattern = /treating\s+it\s+as\s+(?:a|an)\s+(Spellcast|Strength|Agility|Finesse|Presence|Knowledge|Instinct)\s+weapon/i;
  const treatMatch = cleanText.match(treatAsPattern);
  if (treatMatch) return treatMatch[1];

  return undefined;
}

/**
 * Parse roll difficulty (DC) from card text
 */
export function parseRollDifficulty(text: string): number | undefined {
  // Strip markdown first to handle patterns like "**Spellcast Roll (15)**"
  const cleanText = stripMarkdown(text);

  // Match patterns like "Spellcast Roll (15)" or "Roll (12)"
  // Also matches "Reaction Roll (15)"
  const dcPattern = /(?:Spellcast|Strength|Agility|Finesse|Presence|Knowledge|Instinct|Reaction)\s+Roll\s*\((\d+)\)/i;
  const match = cleanText.match(dcPattern);
  if (match) {
    return parseInt(match[1], 10);
  }

  // Fallback: simpler pattern for "Roll (X)" without trait
  const simplePattern = /Roll\s*\((\d+)\)/i;
  const simpleMatch = cleanText.match(simplePattern);
  return simpleMatch ? parseInt(simpleMatch[1], 10) : undefined;
}

/**
 * Parse damage from card text
 * Returns the first damage notation found that is associated with DEALING damage
 * (not reducing damage, which is a defensive mechanic)
 */
export function parseCardDamage(text: string): string | undefined {
  // Strip markdown for cleaner matching
  const cleanText = stripMarkdown(text);

  // Only match die rolls that are associated with dealing damage
  // This prevents defensive abilities like "reduce damage by 1d8" from being classified as attacks
  const damagePatterns = [
    // "1d8 damage", "1d8 magic damage", "2d6+4 physical damage"
    /(\d*d\d+(?:\+\d+)?)\s+(?:magic\s+|physical\s+)?damage/i,
    // "deal 1d8", "deal 2d6+3"
    /deal\s+(\d*d\d+(?:\+\d+)?)/i,
    // "dealing 1d8 damage"
    /dealing\s+(\d*d\d+(?:\+\d+)?)/i,
    // "deals d8 damage" or "that deals d12 physical damage"
    /deals\s+(\d*d\d+(?:\+\d+)?)\s+(?:magic\s+|physical\s+)?damage/i,
    // "an extra 2d6 damage" or "extra 1d6 damage"
    /extra\s+(\d*d\d+(?:\+\d+)?)\s+(?:magic\s+|physical\s+)?damage/i,
    // "take 1d8 damage" (enemies taking damage)
    /take\s+(\d*d\d+(?:\+\d+)?)\s+(?:magic\s+|physical\s+)?damage/i,
    // "takes 1d8 damage"
    /takes\s+(\d*d\d+(?:\+\d+)?)\s+(?:magic\s+|physical\s+)?damage/i,
    // "roll a number of d10s" (variable damage based on tokens/conditions)
    /roll\s+(?:a\s+)?(?:number\s+of\s+)?(\*\*)?(d\d+)s?\1?/i,
  ];

  for (const pattern of damagePatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      // For the variable damage pattern, extract the die type
      if (pattern.source.includes('number')) {
        return `${match[2]}`; // e.g., "d10" for variable number of d10s
      }
      return match[1];
    }
  }

  return undefined;
}

/**
 * Parse damage type from card text
 */
export function parseCardDamageType(text: string): DamageType | undefined {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('magic damage')) {
    return 'magic';
  }
  if (lowerText.includes('physical damage')) {
    return 'physical';
  }

  return undefined;
}

/**
 * Parse target type from card text
 */
export function parseTargetType(text: string): TargetType | undefined {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('all targets') || lowerText.includes('all adversaries')) {
    return 'all_in_range';
  }
  if (lowerText.includes('all allies')) {
    return 'allies_in_range';
  }
  if (lowerText.includes('a target') || lowerText.includes('one target')) {
    return 'single';
  }
  if (lowerText.includes('yourself')) {
    return 'self';
  }

  return undefined;
}

/**
 * Determine action type from card text and metadata
 */
export function parseActionType(text: string, cardType: string, attack?: CardAttack, roll?: CardRoll): ActionType {
  const cleanText = stripMarkdown(text).toLowerCase();

  // 1. Check for reaction patterns first (highest priority - defensive abilities)
  // Note: "reaction roll" is complex - only treat as reaction if YOU are making it
  const reactionPatterns = [
    /\byou (?:can |must )?(?:make|making) a reaction roll\b/i,  // You make a reaction roll
    /\bby making a reaction roll\b/i,  // "interrupt... by making a reaction roll"
    /\bwhen you would take damage\b/i,
    /\bwhen you would take (?:minor|major|severe) damage\b/i,  // Threshold-specific damage
    /\bwhen you take (?:minor|major|severe) damage\b/i,  // "when you take Minor damage"
    /\bwhen an attack made against you\b/i,
    /\bwhen you are targeted\b/i,
    /\bwhen you mark your last\b/i,
    /\binstead of making a death move\b/i,
    /\bwhen you would mark an armor slot\b/i,
    /\bwhen a creature within\b/i,
    // Ally protection reactions
    /\bwhen an ally (?:within|would|takes|marks)\b/i,
    /\bwhen an ally.*?takes damage\b/i,
    /\bwhen an ally.*?marks.*?hit point\b/i,
    // Adversary attack reactions  
    /\bafter an adversary makes an attack against you\b/i,
    /\bwhen an adversary.*?attack(?:s)? (?:you|against)\b/i,
    /\bwhen an adversary within.*?succeeds\b/i,
    // Damage halving/reduction as reaction
    /\bto halve incoming\b/i,
    /\bhalve incoming (?:physical|magic|magical)? ?damage\b/i,
    // Roll result reactions (fear/hope)
    /\bwhen you roll with fear\b/i,
    // Targeting reactions
    /\bwhen.*?target(?:s|ed) you\b/i,
    // Force adversary to reroll (reaction during their action)
    /\bforce\s+(?:an?\s+)?adversary\s+to\s+reroll\b/i,
    /\bforce\s+(?:the\s+)?attacker\s+to\b/i,
    // Attack of opportunity style reactions
    /\bif\s+(?:an?\s+)?adversary\s+(?:within|attempts)\b/i,
    /\battempts?\s+to\s+leave\s+(?:that\s+)?(?:range|melee)\b/i,
    // Physical damage trigger
    /\bwhen you take physical damage\b/i,
    // Damage-would-mark patterns
    /\bwhen.*?damage\s+(?:from\s+)?(?:an?\s+)?attack\s+would\s+mark\b/i,
    /\bwould\s+mark\s+(?:your\s+)?last\s+(?:hit\s+point|stress)\b/i,
    // Armor slot reaction
    /\bmark\s+(?:an\s+)?additional\s+armor\s+slot\s+to\s+reduce\b/i,
    // Attack roll succeeds against you
    /\bwhen\s+(?:an?\s+)?attack\s+roll\s+against\s+you\s+succeeds\b/i,
    // GM gains Fear trigger
    /\bwhen\s+(?:the\s+)?gm\s+gains\s+(?:a\s+)?fear\b/i,
    // Ally roll failure trigger
    /\bwhen\s+(?:you\s+or\s+)?(?:an?\s+)?ally.*?(?:rolls?|fails)\s+(?:a\s+)?failure\b/i,
    /\brolls\s+a\s+failure\s+on\s+(?:an?\s+)?\*?\*?action\s+roll\b/i,
    // Creature causes marking Hit Points (Hex-style)  
    /\bwhen\s+(?:a\s+)?creature\s+causes\s+(?:you|an\s+ally).*?to\s+mark\b/i,
    // When you mark Hit Points from attack
    /\bwhen\s+you\s+mark\s+(?:one\s+or\s+)?more\s+(?:than\s+one\s+)?hit\s+points?\s+from\b/i,
    /\bwhen\s+you\s+mark\s+more\s+than\s+one\s+(?:hit\s+point|hp)\s+from\b/i,
    // Generic "when you mark" triggers (Wolf Form, etc.)
    /\bwhen\s+you\s+mark\s+(?:one\s+or\s+more\s+)?hit\s+points?\b/i,
    /\bwhen\s+you\s+\*?\*?mark\s+your\s+last\s+stress\b/i,
    // "if you mark" HP from attack (Juggernaut style)
    /\bif\s+you\s+mark\s+(?:more\s+than\s+)?(?:one\s+)?hit\s+points?\s+from\b/i,
  ];
  if (reactionPatterns.some(pattern => pattern.test(cleanText))) {
    return 'reaction';
  }


  // 2. Check for downtime patterns
  if (
    cleanText.includes('during a rest') ||
    cleanText.includes('during a long rest') ||
    cleanText.includes('when you finish a rest') ||
    cleanText.includes('spend a downtime move') ||
    cleanText.includes('downtime move') ||
    cleanText.includes('as an additional downtime') ||
    cleanText.includes('as a downtime move')
  ) {
    return 'downtime';
  }

  // 3. Check for BUFF patterns (healing, support, granting bonuses to self/allies)
  // IMPORTANT: This must come BEFORE attacks and passive to catch active enhancement abilities
  const buffPatterns = [
    // Healing/clearing resources
    /\bclear(?:s)?\s+(?:a|an|\d+)\s+(?:hit\s+point|stress|armor\s+slot)/i,
    /\blay\s+your\s+hands\s+upon\b/i,
    /\bhealing\s+magic\b/i,
    /\bclose\s+their\s+wounds\b/i,
    /\bclears?\s+(?:1d4|1d6|1d8)\s+hit\s+points?\b/i,
    /\bthat\s+creature\s+clears\b/i,

    // Rally and dice granting (CRITICAL for Bard abilities)
    /\bgive\s+(?:yourself|each|all|them|an?\s+ally)\b.*?\b(?:rally\s+)?die\b/i,
    /\brally\s+die\b/i,
    /\bgrant(?:s|ing)?\s+.*?\b(?:rally\s+)?die\b/i,

    // Gaining bonuses (active, not passive)
    /\bgain\s+(?:a\s+)?\+?\d+\s+bonus\s+to\b/i,
    /\bgain\s+advantage\b/i,
    /\bgain\s+a\s+hope\b/i,
    /\beach\s+(?:ally|creature)\s+(?:clears?|gains?)\b/i,

    // Self-enhancement buffs
    /\bbecome\s+unstoppable\b/i,
    /\bbecome\s+invisible\b/i,
    /\broll\s+a\s+d20\s+as\s+your\s+hope\s+die\b/i,

    // Reroll abilities (active enhancement) - but NOT triggered rerolls
    /\breroll\s+(?:any\s+)?(?:number\s+of\s+)?(?:your\s+)?damage\s+dice\b/i,

    // Weapon/attack enchantment
    /\benchant\s+(?:one\s+of\s+)?(?:your\s+)?(?:active\s+)?weapons?\b/i,
    /\bextra\s+\*?\*?\d*d\d+\*?\*?\s+damage\s+when\s+you\s+hit\b/i,

    // Advantage granting
    /\bhave\s+advantage\s+on\s+all\s+\*?\*?action\s+rolls?\*?\*?\b/i,
    /\bgain\s+advantage\s+on\b/i,

    // Hope gain for party
    /\ball\s+allies.*?gain.*?hope\b/i,
    /\beach.*?gains?\s+(?:a\s+)?hope\b/i,
  ];

  
  // Exclude abilities that have passive triggers (when/while/if/after)
  // This includes patterns like "Once per rest, when..." or "After you make..."
  const hasPassiveTrigger = 
    /^(?:when|while|if|after|whenever)\s+you\b/i.test(cleanText) ||
    /^(?:once|twice)\s+per\s+(?:rest|long\s+rest|scene|turn|round),?\s+(?:when|while|if|after)\s+you\b/i.test(cleanText) ||
    /\bafter\s+you\s+(?:make|succeed|fail|cast|roll)\b/i.test(cleanText) ||
    /\bwhen\s+you\s+(?:make|succeed|fail|cast|roll)\b/i.test(cleanText);
  
  if (!hasPassiveTrigger && buffPatterns.some(pattern => pattern.test(cleanText))) {
    return 'buff';
  }

  // 4. Check if this is an ATTACK (player initiates combat action)
  // An attack needs: "make a Roll against" OR parsed attack data
  const hasRollAgainst = /make (?:a |an )?\*?\*?(?:\w+\s+)?roll\*?\*? against/i.test(text);
  const hasAttackWith = /make (?:a |an )?attack with/i.test(cleanText);
  const hasExplicitAttack = /(?:spend|mark).*?to make (?:a |an )?attack/i.test(cleanText);

  // But exclude "when you make a successful attack" (that's a trigger, not initiation)
  const isAttackTrigger = /when you (?:make a success|succeed|critically succeed|fail)/i.test(cleanText);

  if ((attack || hasRollAgainst || hasAttackWith || hasExplicitAttack) && !isAttackTrigger) {
    return 'attack';
  }

  // 5. Check for utility abilities (transformations, cantrips, illusions, communication, resource conversion)
  const utilityPatterns = [
    /\btransform\s+into\b/i,
    /\bmagically\s+transform\b/i,
    /\bcreate\s+(?:a\s+)?(?:minor\s+)?(?:visual\s+)?illusion\b/i,
    /\bperform\s+harmless\b/i,
    /\bsubtl[e]?\s+(?:magical\s+)?effects?\b/i,
    /\bspeak\s+with\b/i,
    /\bcommunicate\s+(?:across|with)\b/i,
    /\bretract\s+into\s+your\s+shell\b/i,
    /\bextract\s+(?:one\s+)?memory\b/i,
    /\bplace\s+(?:a\s+)?domain\s+card\b/i,
    // Teleportation / disappearing
    /\bdisappear\s+from\s+where\s+you\s+are\b/i,
    /\bdisappear\s+and\s+(?:then\s+)?reappear\b/i,
    /\breappear\s+(?:inside|in|at|next\s+to)\b/i,
    /\bslip\s+into\s+the\s+realm\b/i,
    // Becoming cloaked/hidden
    /\bbecome\s+cloaked\b/i,
    /\bto\s+become\s+cloaked\b/i,
    // Creating zones/effects
    /\bcreate\s+(?:a\s+)?(?:temporary|dark)\b/i,
    /\bcall\s+on\s+a\s+shady\s+contact\b/i,
    // Item acquisition
    /\breach\s+into\s+(?:this|your)\s+pack\b/i,
    /\bpull\s+out\s+(?:a|an)\s+(?:mundane\s+)?item\b/i,
    // Channel/incarnation
    /\bchannel\s+one\s+of\b/i,
    /\bprioritize\s+a[n]?\s+adversary\b/i,
    // Glamour/disguise
    /\bglamour\s+yourself\b/i,
    /\bmagical\s+facade\b/i,
    /\bdisguise\s+yourself\b/i,
    // Spectral/spirit form transitions
    /\bbody\s+becomes\s+spectral\b/i,
    /\bshift\s+between\s+corporeal\s+and\s+incorporeal\b/i,
    /\btransition\s+into\s+(?:and\s+out\s+of\s+)?(?:your\s+)?spirit\s+form\b/i,
    // Commune with spirits
    /\bcommune\s+with\s+(?:an?\s+)?(?:ancestor|deity|spirit|being)\b/i,
    /\bconverse\s+with\s+(?:any\s+)?(?:nearby\s+)?spirits\b/i,
    /\bstep\s+beyond\s+the\s+veil\b/i,
    // Unbelievable feats (movement utility)
    /\bperform\s+an\s+unbelievable\s+feat\b/i,
    /\brunning\s+across\s+water\b/i,
    /\bleaping\s+between\s+distant\b/i,
  ];
  if (utilityPatterns.some(pattern => pattern.test(cleanText))) {
    return 'utility';
  }

  // 6. Check for passive abilities (triggered by conditions, not actively used)
  // This is a VERY important section - passive abilities are the most common type
  // IMPORTANT: This comes LAST (before default) to catch remaining triggered abilities
  const passiveTriggers = [
    // Basic "when you" triggers at start of text
    /^when you (?:roll|deal|succeed|critically|fail)/i,
    /^when you make a successful/i,
    /^while you(?:'re| are)/i,
    /^you have advantage/i,
    /^you have a base/i,
    /^gain a \+?\d+ bonus to/i,
    /^when an ally/i,

    // Post-action triggers (after making an attack/roll)
    /\bwhen you (?:make a successful|succeed on|successfully cast|successfully make)\b/i,
    /\bafter you (?:make|cast|successfully)\b/i,
    /\bafter (?:making|casting) (?:a|an)\b/i,
    /\bwhen you successfully cast\b/i,
    /\bafter you successfully\b/i,

    // Conditional bonuses (while/if conditions)
    /\bwhile (?:you(?:'re| are)|wearing|wielding|in)\b/i,
    /\bif you (?:are|have)\b/i,
    /\bwhen (?:\d+|four|4) or more (?:of the )?(?:domain )?cards\b/i,
    /\bwhen (?:\d+|four|4)\+ (?:of the )?(?:domain )?cards\b/i,

    // Damage roll triggers
    /\bwhen you (?:roll|deal) (?:your )?damage\b/i,
    /\bwhen you roll (?:your )?damage dice\b/i,
    /\bwhen rolling damage\b/i,

    // Attack triggers (not initiating, but triggered by)
    /\bwhen you (?:make an attack|attack)\b/i,
    /\bwhen making an attack\b/i,
    /\bwhen you critically succeed on an attack\b/i,
    /\bwhen you fail an attack\b/i,

    // Defeat/kill triggers
    /\bwhen you (?:defeat|kill) (?:a|an|the)\b/i,
    /\bwhen you deal enough damage to defeat\b/i,

    // Marking/taking damage triggers
    /\bwhen you cause (?:a|an|the) (?:adversary|target|creature) to mark\b/i,
    /\bwhen (?:a|an|the) (?:adversary|target|creature) (?:you|marks)\b/i,

    // Experience/token usage triggers
    /\bwhen you use (?:a|an|one of your) experience\b/i,
    /\bwhen using (?:a|an|one of your) experience\b/i,
    /\btriggered by using experience\b/i,

    // Passive stat bonuses
    /\bgain (?:a )?\+?\d+ bonus to (?:your )?\w+\b/i,
    /\byou (?:have|gain) (?:a )?(?:permanent )?\+?\d+\b/i,

    // Reroll abilities (passive triggers) - but only when triggered by condition
    /\bwhen you roll.*?you can reroll\b/i,
    /\breroll any (?:1s|2s|number)\b/i,

    // First time per turn/scene triggers
    /\bthe first time (?:you|each)\b/i,
    /\bonce per (?:turn|round)\b/i,

    // Loadout composition bonuses
    /\bwhen (?:\d+|four|4) or more of the domain cards in your loadout\b/i,
  ];

  if (passiveTriggers.some(pattern => pattern.test(cleanText))) {
    return 'passive';
  }

  // 7. Default based on card type
  if (cardType === 'Spell') {
    return 'utility';
  }

  return 'passive';
}

/**
 * Determine timing from action type and text
 */
export function parseTiming(text: string, actionType: ActionType): Timing {
  const cleanText = stripMarkdown(text).toLowerCase();

  // Check for reactive/defensive patterns in text (overrides action_type)
  // These indicate the ability is used in response to something, not proactively on your turn
  const reactionPatterns = [
    /\bwhen you would take\b/,
    /\bwhen you would mark\b/,
    /\breduce incoming damage\b/,
    /\bwhen an attack\b/,
    /\bwhen you(?:'re| are) targeted\b/,
    /\bwhen (?:a|an) (?:creature|adversary|enemy) (?:attacks|targets|damages)\b/,
    /\binterrupt\b/,
    // Ally protection patterns
    /\bwhen an ally(?:\s+within\b|\s+would\b)/,
    // Death move / last HP patterns
    /\bwhen you mark your last\b/,
    /\binstead of making a death move\b/,
    // Armor slot marking patterns
    /\bwhen you(?:\s+would)?\s+mark an armor slot\b/,
    // When ally deals damage (follow-up attack)
    /\bwhen an ally(?:\s+within\b)?.*?deals damage\b/,
  ];

  for (const pattern of reactionPatterns) {
    if (pattern.test(cleanText)) {
      return 'reaction';
    }
  }

  // Default based on action_type
  if (actionType === 'reaction') {
    return 'reaction';
  }
  if (actionType === 'downtime') {
    return 'downtime';
  }
  if (actionType === 'passive') {
    return 'free';
  }
  return 'action';
}

/**
 * Check if card has token mechanics
 */
export function hasTokenMechanics(text: string): boolean {
  const lowerText = text.toLowerCase();
  return (
    // Placing tokens
    (lowerText.includes('place') && lowerText.includes('token')) ||
    lowerText.includes('place a number of tokens') ||
    lowerText.includes('place tokens') ||
    // Spending tokens
    (lowerText.includes('spend') && lowerText.includes('token')) ||
    lowerText.includes('spend a token') ||
    lowerText.includes('spend one token') ||
    // Tokens on card
    lowerText.includes('tokens on this card') ||
    lowerText.includes('token on this card') ||
    // Clearing/removing tokens
    lowerText.includes('clear all unspent tokens') ||
    lowerText.includes('clear all tokens') ||
    lowerText.includes('remove a token') ||
    lowerText.includes('remove tokens') ||
    // Holding tokens
    lowerText.includes('hold up to') && lowerText.includes('token') ||
    lowerText.includes('hold tokens') ||
    // Token equal to trait
    lowerText.includes('tokens equal to') ||
    lowerText.includes('token equal to') ||
    // Number of tokens
    lowerText.includes('number of tokens')
  );
}

/**
 * Parse max tokens from card text
 * Returns null if tokens are dynamic (based on trait)
 */
export function parseMaxTokens(text: string): number | null {
  // Check for fixed token count - "place 8 tokens"
  const fixedPattern = /place (\d+) tokens?/i;
  const fixedMatch = text.match(fixedPattern);
  if (fixedMatch) {
    return parseInt(fixedMatch[1], 10);
  }

  // Check for "hold up to X tokens" or "up to X tokens at a time"
  const holdPattern = /(?:hold\s+)?up\s+to\s+\*?\*?(\d+)\s+tokens?\*?\*?(?:\s+at\s+a\s+time)?/i;
  const holdMatch = text.match(holdPattern);
  if (holdMatch) {
    return parseInt(holdMatch[1], 10);
  }

  // Check for "tokens equal to" pattern (dynamic)
  if (/tokens? equal to/i.test(text)) {
    return null; // Dynamic based on trait
  }

  // Check for "number of tokens equal to" pattern
  if (/number of tokens equal to/i.test(text)) {
    return null;
  }

  return null;
}

/**
 * Parse token source trait from card text
 */
export function parseTokenSource(text: string): string | undefined {
  const cleanText = stripMarkdown(text).toLowerCase();

  // Pattern 1: "tokens equal to your [trait]" or "tokens equal to [trait]"
  const pattern1 = /tokens?(?:\s+on\s+this\s+card)?\s+equal\s+to\s+(?:your\s+)?(\w+)/i;
  const match1 = cleanText.match(pattern1);
  if (match1) {
    return normalizeTokenSourceTrait(match1[1]);
  }

  // Pattern 2: "a number of tokens equal to your [trait]"
  const pattern2 = /(?:a\s+)?number\s+of\s+tokens?\s+equal\s+to\s+(?:your\s+)?(\w+)/i;
  const match2 = cleanText.match(pattern2);
  if (match2) {
    return normalizeTokenSourceTrait(match2[1]);
  }

  // Pattern 3: "place tokens equal to..." or "place a number of tokens equal to..."
  const pattern3 = /place\s+(?:a\s+number\s+of\s+)?tokens?\s+equal\s+to\s+(?:your\s+)?(\w+)/i;
  const match3 = cleanText.match(pattern3);
  if (match3) {
    return normalizeTokenSourceTrait(match3[1]);
  }

  return undefined;
}

/**
 * Normalize token source trait names
 */
function normalizeTokenSourceTrait(trait: string): string {
  const normalized = trait.toLowerCase();
  // Map common variations
  const traitMap: Record<string, string> = {
    'agility': 'agility',
    'strength': 'strength',
    'finesse': 'finesse',
    'presence': 'presence',
    'knowledge': 'knowledge',
    'instinct': 'instinct',
    'spellcast': 'spellcast',
    'proficiency': 'proficiency',
    'level': 'level',
    'tier': 'tier',
  };
  return traitMap[normalized] || normalized;
}

/**
 * Extract keywords from card text for filtering
 */
export function extractKeywords(text: string, cardType: string): string[] {
  const keywords: string[] = [];
  const lowerText = text.toLowerCase();

  // Damage reduction (defensive)
  if (/reduce(?:\s+(?:incoming|the))?\s+damage/.test(lowerText)) {
    keywords.push('damage_reduction');
  }
  // Also catch "reduce the number of Hit Points they mark"
  if (/reduce\s+(?:the\s+)?(?:number\s+of\s+)?hit\s+points\s+(?:they|you)\s+mark/.test(lowerText)) {
    if (!keywords.includes('damage_reduction')) keywords.push('damage_reduction');
  }

  // Damage-related (offensive) - only for dealing damage, not reducing
  if (/\bdamage\b/.test(lowerText)) {
    // Exclude damage reduction patterns
    if (!/reduce(?:\s+(?:incoming|the))?\s+damage/.test(lowerText)) {
      keywords.push('damage');
    }
  }
  if (/\bmagic\s+damage\b/.test(lowerText)) keywords.push('magic');
  if (/\bphysical\s+damage\b/.test(lowerText)) keywords.push('physical');

  // AoE - expanded patterns
  if (
    /\ball\s+targets\b/.test(lowerText) ||
    /\ball\s+adversaries\b/.test(lowerText) ||
    /\ball\s+creatures\s+within\b/.test(lowerText) ||
    /\beach\s+adversary\b/.test(lowerText) ||
    /\beach\s+creature\s+within\b/.test(lowerText) ||
    /\beach\s+target\s+within\b/.test(lowerText) ||
    /\bto\s+all\s+creatures\b/.test(lowerText)
  ) {
    keywords.push('aoe');
  }

  // Healing/Support - multiple patterns to catch various phrasing
  if (/\bclear\b.*?\bhit\s+points?\b|\bhit\s+points?\b.*?\bclear\b/.test(lowerText)) {
    keywords.push('healing');
  }
  // Also catch "clears X Hit Point" or "clear a Hit Point"
  if (/\bclears?\s+(?:\d+\s+)?(?:a\s+)?hit\s+point/i.test(lowerText)) {
    keywords.push('healing');
  }
  if (/\bclear\b.*?\bstress\b|\bstress\b.*?\bclear\b/.test(lowerText)) {
    keywords.push('stress_relief');
  }
  // Also catch "clears X Stress" or "clear a Stress"
  if (/\bclears?\s+(?:\d+\s+)?(?:a\s+)?stress/i.test(lowerText)) {
    keywords.push('stress_relief');
  }
  // Fix: "gain" must be a complete word (not part of "again")
  if (/\bgain\b/.test(lowerText) && /\bhope\b/.test(lowerText)) {
    keywords.push('hope_gain');
  }
  // Catch "gains a Hope" for abilities that give party Hope
  if (/\bgains?\s+(?:a\s+)?hope\b/i.test(lowerText)) {
    if (!keywords.includes('hope_gain')) keywords.push('hope_gain');
  }

  // Costs
  if (/\bmark\b/.test(lowerText) && /\bstress\b/.test(lowerText)) {
    keywords.push('stress_cost');
  }
  if (/\bspend\b/.test(lowerText) && /\bhope\b/.test(lowerText)) {
    keywords.push('hope_cost');
  }

  // Control
  if (/\bvulnerable\b/.test(lowerText)) keywords.push('debuff');
  if (/\brestrained\b/.test(lowerText)) keywords.push('control');
  if (/\badvantage\b/.test(lowerText)) keywords.push('buff');
  if (/\bdisadvantage\b/.test(lowerText)) keywords.push('debuff');

  // Movement - expanded patterns
  if (/\bteleport\b/.test(lowerText) || /\bmove\b/.test(lowerText)) {
    keywords.push('movement');
  }
  // Additional movement patterns: leap, fly, jump, reappear, hover
  if (/\bleap\b|\bfly\b|\bjump\b|\breappear\b|\bhover\b/.test(lowerText)) {
    if (!keywords.includes('movement')) keywords.push('movement');
  }
  // Forced movement: throw, pull, push
  if (/\bthrow\s+(?:them|target|an?\s+adversary)\b/.test(lowerText) ||
    /\bpull\s+(?:yourself|the\s+target|them)\b/.test(lowerText) ||
    /\bpush\s+(?:them|target|an?\s+adversary)\b/.test(lowerText)) {
    if (!keywords.includes('movement')) keywords.push('movement');
  }

  // Tokens
  if (hasTokenMechanics(text)) keywords.push('tokens');

  // Card type
  if (cardType === 'Spell') keywords.push('spell');
  if (cardType === 'Ability') keywords.push('ability');

  return keywords;
}

/**
 * Parse roll information from card text
 */
export function parseRoll(text: string): CardRoll | undefined {
  const trait = parseRollTrait(text);
  const difficulty = parseRollDifficulty(text);

  // Need at least a trait or difficulty to have a roll
  if (!trait && !difficulty) return undefined;

  // Check for negation patterns - if the text says "without making" or "don't make" a roll, don't extract it
  const cleanText = stripMarkdown(text).toLowerCase();
  const negationPatterns = [
    /without\s+making\s+(?:a|an)\s+\w+\s+roll/i,
    /don't\s+(?:make|need)\s+(?:a|an)\s+\w+\s+roll/i,
    /doesn't\s+(?:make|need|require)\s+(?:a|an)\s+\w+\s+roll/i,
    /no\s+\w+\s+roll/i,
  ];

  if (negationPatterns.some(pattern => pattern.test(cleanText))) {
    return undefined;
  }

  // Target makes a reaction roll (forced save)
  const hasTargetReaction =
    cleanText.includes('reaction roll') ||
    /must\s+(?:make|succeed)\s+(?:a|on)\s+.*?reaction/i.test(cleanText) ||
    /(?:targets?|creatures?)\s+(?:who|that|must)\s+.*?reaction/i.test(cleanText);

  // Check if costs are required BEFORE making the roll
  // Patterns like "Spend a Hope to make a roll" or "Mark Stress to make a roll"
  // Also catches "Mark 2 Stress to make" or "Spend 5 Hope to make"
  const requiresCostForRoll =
    /\*\*spend\s+(?:a\s+|\d+\s+)?hope\*\*\s+to\s+(?:make|allow)/i.test(text) ||
    /\*\*mark\s+(?:a\s+|\d+\s+)?stress\*\*\s+to\s+(?:make|allow)/i.test(text) ||
    /spend\s+(?:a\s+|\d+\s+)?hope\s+to\s+(?:make|allow)/i.test(cleanText) ||
    /mark\s+(?:a\s+|\d+\s+)?stress\s+to\s+(?:make|allow)/i.test(cleanText);

  return {
    type: `${trait || 'Spellcast'} Roll`,
    trait: trait || 'Spellcast',
    difficulty,
    target_reaction: hasTargetReaction,
    requires_cost_for_roll: requiresCostForRoll || undefined, // Only include if true
  };
}

/**
 * Determine the combat category based on text patterns
 * This controls which buttons appear on combat cards
 */
export function parseCombatCategory(text: string): CombatCategory {
  const cleanText = stripMarkdown(text).toLowerCase();

  // Pattern 1: Damage bonus - triggered by succeeding on an existing attack
  // Examples: "when you succeed on an attack... add d6 to damage"
  //           "add to your damage roll"
  //           "deal an additional 1d4 damage"
  const hasTriggerPattern = (
    cleanText.includes('when you succeed on an attack') ||
    cleanText.includes('on a success') ||
    cleanText.includes('if you succeed')
  );

  const hasDamageAddition = (
    // "add X to your damage roll" or "add X to the damage"
    (cleanText.includes('add') && (cleanText.includes('to your damage') || cleanText.includes('damage roll') || cleanText.includes('to the damage'))) ||
    // "deal an additional X damage" or "dealing an additional X damage"
    (cleanText.includes('deal') && cleanText.includes('additional') && cleanText.includes('damage'))
  );

  const isDamageBonus = hasTriggerPattern && hasDamageAddition;

  if (isDamageBonus) {
    return 'damage_bonus';
  }

  // Pattern 2: Standalone attack - player initiates an attack roll
  // Examples: "make a Strength Roll against", "make an attack against"
  // Exclude conditional attacks like "if you make an attack, gain +1 bonus"
  const hasAttackInitiation = (
    cleanText.includes('make a') &&
    (cleanText.includes('roll against') || cleanText.includes('attack against'))
  );

  // Check if it's actually granting a bonus to an attack rather than initiating one
  // Pattern: "make an attack against them, gain a +X bonus" or similar
  const isAttackBonus = (
    hasAttackInitiation &&
    (cleanText.includes('gain a +') || cleanText.includes('gain +')) &&
    (cleanText.includes('bonus') || cleanText.includes('to the attack'))
  );

  const isStandaloneAttack = hasAttackInitiation && !isAttackBonus;

  if (isStandaloneAttack) {
    return 'standalone_attack';
  }

  // Pattern 3: Roll only - requires a roll but not damage
  // Examples: "make a Spellcast Roll (10)" without damage output
  const hasRollPattern = /make a \*?\*?(?:spellcast|strength|agility|finesse|presence|knowledge|instinct) roll\*?\*?/i.test(text);
  const hasDamage = /\d*d\d+/.test(text);

  if (hasRollPattern && !hasDamage) {
    return 'roll_only';
  }

  // Pattern 4: Passive/Triggered - no explicit roll required from player
  // Examples: "Spend Hope to gain...", "When you take damage..."
  return 'passive_triggered';
}

/**
 * Parse attack information from card text
 */
export function parseAttack(text: string): CardAttack | undefined {
  const cleanText = stripMarkdown(text);
  const lowerText = cleanText.toLowerCase();
  const trait = parseRollTrait(text);
  const range = parseCardRange(text);
  const damage = parseCardDamage(text);
  const hasAgainst = lowerText.includes('against');

  // Check for weapon-style descriptions
  const isWeaponAbility = /(?:as\s+(?:a|an)\s+)?\w+\s+weapon\s+that\s+deals/i.test(cleanText) ||
    /treating\s+it\s+as\s+(?:a|an)\s+\w+\s+weapon/i.test(cleanText) ||
    /use\s+(?:it|your\s+\w+)\s+as\s+(?:a|an)\s+\w+\s+\w*\s*weapon/i.test(cleanText);

  // Check for attack actions
  const hasMakeRollTo = /make\s+(?:a|an)\s+\*?\*?\w+\s+roll\*?\*?\s+to/i.test(text);
  const hasAttackTarget = /attack\s+(?:a\s+)?target/i.test(lowerText) ||
    /scratch\s+a\s+target/i.test(lowerText) ||
    /use\s+this\s+breath\s+against/i.test(lowerText);

  // Parse additional/secondary damage
  const additionalDamage = extractAdditionalDamage(text);

  // Heuristic: Check if "Make an attack" is purely conditional (e.g. "When you make an attack")
  // vs Imperative ("Make an attack"). used to filter false positives for buffs.
  const allActionMentions = cleanText.match(/make\s+(?:an?\s+)?(?:attack|.*?\s+roll)/gi) || [];
  const conditionalActionMentions = cleanText.match(/(?:if|when|whenever|after|before|until|and|first\s+time)\s+(?:[^.!?]*?\s+)?make\s+(?:an?\s+)?(?:attack|.*?\s+roll)/gi) || [];
  const hasUnconditionalAction = allActionMentions.length > conditionalActionMentions.length;

  // Requirements for parsing as an attack:
  // 1. Has damage, OR
  // 2. Has trait roll against target, OR
  // 3. Is a weapon ability, OR
  // 4. Make a roll to affect target
  // 5. Has additional damage (AND has explicit action initiation)
  if (!damage && !(trait && hasAgainst) && !isWeaponAbility && !hasMakeRollTo && !hasAttackTarget) {
    if (additionalDamage.length === 0) return undefined;
    // If relying solely on additional damage, ensure we have an unconditional action trigger
    if (!hasUnconditionalAction) return undefined;
  }

  const attack: CardAttack = {
    trait: trait || 'Spellcast',
    range: range || 'Close',
    combat_category: parseCombatCategory(text),
    additional_damage: additionalDamage.length > 0 ? additionalDamage : undefined,
  };

  if (damage) attack.damage = damage;
  const damageType = parseCardDamageType(text);
  if (damageType) attack.damage_type = damageType;

  const targets = parseTargetType(text);
  if (targets) attack.targets = targets;

  const difficulty = parseRollDifficulty(text);
  if (difficulty) attack.difficulty = difficulty;

  // Extract effect from ability text (e.g., "become vulnerable")
  if (/\bvulnerable\b/i.test(lowerText)) {
    attack.secondary_effects = attack.secondary_effects || [];
    attack.secondary_effects.push('vulnerable');
  }

  return attack;
}

/**
 * Extract additional/secondary damage instances from text
 */
function extractAdditionalDamage(text: string): AdditionalDamage[] {
  const cleanText = stripMarkdown(text);
  const results: AdditionalDamage[] = [];

  // 1. "on a success (with Hope), add [dice] to your damage roll"
  const addMatches = cleanText.matchAll(/([^\.]*?)\badd\s+(?:an?\s+)?(\d*d\d+)(?:\s+(?:magic|physical)\s+damage)?(?:\s+to\s+(?:your\s+)?damage\s+roll)/gi);
  for (const match of addMatches) {
    let condition = match[1].trim();
    const damage = match[2];

    // Clean up condition
    if (condition.toLowerCase().startsWith('add')) condition = '';
    condition = condition.replace(/^(?:and\s+|,\s*)/i, '');
    if (condition.toLowerCase().includes('on a success')) condition = condition.replace(/on a success/i, '').trim();
    if (condition.startsWith('with ')) condition = condition.replace('with ', '');
    condition = condition.replace(/[,\s]+$/i, ''); // Strip trailing commas
    condition = condition.trim() || 'On hit';

    // Infer label
    let label = 'Extra';
    if (condition.toLowerCase().includes('hope')) label = 'Hope';
    if (condition.toLowerCase().includes('crit')) label = 'Crit';

    results.push({
      damage,
      condition,
      label
    });
  }

  // 2. "take(s) an extra/additional [dice] [type] damage (if/when...)"
  const extraMatches = cleanText.matchAll(/([^\.]*?)\b(?:extra|additional)\s+(\d*d\d+(?:\+\d+)?)\s+(?:(magic|physical|true)\s+)?damage(.*?)(?:\.|$)/gi);
  for (const match of extraMatches) {
    const preContext = match[1].trim();
    const damage = match[2];
    const type = match[3] as DamageType | undefined;
    const postContext = match[4].trim();

    // Construct condition from context
    let condition = '';

    // Check if Pre-context has a strong trigger (When/If)
    const PreLower = preContext.toLowerCase();
    if (PreLower.includes('when ') || PreLower.includes('if ')) {
      condition = preContext;
    }
    // Otherwise check post-context
    else if (postContext.toLowerCase().startsWith(' if') || postContext.toLowerCase().startsWith(' when')) {
      condition = postContext.trim();
    }
    // Fallback to pre-context
    else if (preContext) {
      condition = preContext;
    }

    // Clean condition
    condition = condition.replace(/^(?:and\s+|,\s*)/i, '');

    // Only strip "target takes" stuff if we didn't find a nice "When/If" clause
    if (!condition.toLowerCase().startsWith('when') && !condition.toLowerCase().startsWith('if')) {
      if (condition.toLowerCase().includes('must take')) condition = condition.replace(/.*?must take/i, 'target takes').trim();
    }

    // Final cleanup
    condition = condition.replace(/,\s*they\s+must\s+take\s+an?$/i, '');
    condition = condition.replace(/,\s*target\s+takes\s+an?$/i, '');

    // Infer label
    let label = 'Extra';
    if (condition.toLowerCase().includes('on fire')) label = 'Fire';
    if (condition.toLowerCase().includes('vulnerable')) label = 'Vuln';

    results.push({
      damage,
      damage_type: type,
      condition: condition || 'Secondary',
      label
    });
  }

  return results;
}

/**
 * Enhance a basic ability card with parsed metadata
 */
export function enhanceAbilityCard(card: {
  name: string;
  level: string;
  domain: string;
  type: string;
  recall: string;
  text: string;
  // Optional overrides
  action_type_override?: ActionType;
  timing_override?: Timing;
  frequency_override?: Frequency;
  keywords_override?: string[];
  costs_override?: CardCosts;
}): EnhancedAbilityCard {
  const text = card.text;
  const cardType = card.type as 'Spell' | 'Ability';

  // 1. Parse structured data first
  const attack = parseAttack(text);
  const roll = parseRoll(text);
  const costs = card.costs_override || parseCosts(text); // Override takes precedence
  const frequency = card.frequency_override || parseFrequency(text);
  const hasTokens = hasTokenMechanics(text);
  const keywords = card.keywords_override || extractKeywords(text, cardType);

  // 2. Determine action type (with override)
  const actionType = card.action_type_override || parseActionType(text, cardType, attack, roll);
  const timing = card.timing_override || parseTiming(text, actionType);

  // Log overrides for visibility
  if (card.action_type_override || card.timing_override || card.frequency_override || card.keywords_override || card.costs_override) {
    const overrides = [];
    if (card.action_type_override) overrides.push(`action_type=${card.action_type_override}`);
    if (card.timing_override) overrides.push(`timing=${card.timing_override}`);
    if (card.frequency_override) overrides.push(`frequency=${card.frequency_override}`);
    if (card.keywords_override) overrides.push(`keywords`);
    if (card.costs_override) overrides.push(`costs`);
    console.log(`  ⚠️  ${card.name}: Using overrides [${overrides.join(', ')}]`);
  }

  const enhanced: EnhancedAbilityCard = {
    name: card.name,
    level: card.level,
    domain: card.domain,
    type: cardType,
    recall: card.recall,
    text: card.text,
    enhancement: {
      action_type: actionType,
      timing,
      frequency,
      costs,
      keywords,
    }
  };

  // Parse and add passive modifiers
  const modifiers = parseStaticModifiers(text, card.name);
  if (modifiers.length > 0) {
    enhanced.enhancement.modifiers = modifiers;
  }

  // Add token info if applicable
  if (hasTokens) {
    enhanced.enhancement.tokens = {
      has_tokens: true,
      max_tokens: parseMaxTokens(text),
      token_source: parseTokenSource(text)
    };
  }

  // Add attack/roll info
  if (attack) {
    enhanced.enhancement.attack = attack;
  }

  if (roll) {
    enhanced.enhancement.roll = roll;
  }

  const durationPatterns = [
    { type: 'until_triggered', pattern: /until triggered/i },
    { type: 'rest', pattern: /until (?:you )?(?:finish )?(?:a |your )?(?:next )?rest/i },
    { type: 'long_rest', pattern: /until (?:you )?(?:finish a )?long rest/i },
    { type: 'scene', pattern: /for the (?:rest of the )?scene/i },
    { type: 'session', pattern: /for the (?:rest of the )?session/i },
  ];

  for (const { type, pattern } of durationPatterns) {
    if (pattern.test(text)) {
      enhanced.enhancement.duration = type;
      break;
    }
  }

  // Add attack info if applicable
  if (attack) {
    enhanced.enhancement.attack = attack;
  } else {
    // Even without a full attack, extract range for effect range / ally range
    const effectRange = parseCardRange(text);
    if (effectRange) {
      enhanced.enhancement.attack = {
        trait: 'None',
        range: effectRange,
      };
    }
  }

  // Add roll info
  if (roll) {
    enhanced.enhancement.roll = roll;
  }

  // Add duration (if not already found by previous patterns)
  if (!enhanced.enhancement.duration) {
    const duration = parseDuration(text);
    if (duration) {
      enhanced.enhancement.duration = duration;
    }
  }

  return enhanced;
}

/**
 * Enhance a generic feature (Ancestry, Community, Class, Subclass) with parsed metadata
 */
export function enhanceFeature(feature: {
  name: string;
  text: string;
}): EnhancedFeature {
  const text = feature.text;

  // 1. Parse structured data
  let attack = parseAttack(text);
  const costs = parseCosts(text);
  const frequency = parseFrequency(text);
  const hasTokens = hasTokenMechanics(text);
  const keywords = extractKeywords(text, 'Feature');

  // Special handling for damage bonuses (e.g., Sneak Attack, Combat Training)
  // If no attack detected but text mentions adding damage dice
  if (!attack && (
    (text.includes('add') || text.includes('deal')) &&
    (text.includes('damage') || text.includes('damage roll'))
  )) {
    const damage = parseCardDamage(text);
    if (damage) {
      // Determine if this is truly a damage bonus (triggered by another attack)
      // or if it's a standalone attack that was missed
      const combatCategory = parseCombatCategory(text);

      attack = {
        trait: 'Bonus',
        range: 'Melee',
        damage: damage,
        damage_type: parseCardDamageType(text),
        combat_category: combatCategory,
      };
    }
  }

  // 2. Determine action type
  let actionType = parseActionType(text, 'Ability', attack);

  // If we forced an attack object for damage bonus, force action_type to attack
  if (attack && actionType !== 'attack') {
    actionType = 'attack';
  }

  const timing = parseTiming(text, actionType);

  const enhanced: EnhancedFeature = {
    name: feature.name,
    text: feature.text,
    action_type: actionType,
    timing,
    frequency,
    costs,
    keywords,
  };

  // Add token info if applicable
  if (hasTokens) {
    enhanced.tokens = {
      has_tokens: true,
      max_tokens: parseMaxTokens(text),
      token_source: parseTokenSource(text)
    };
  }

  // Add attack info if applicable
  if (attack) {
    enhanced.attack = attack;
  }

  return enhanced;
}

/**
 * Check if a card or feature has combat relevance (should appear in combat view)
 * Works with both EnhancedAbilityCard and EnhancedFeature types
 */
export function hasCombatRelevance(card: {
  action_type?: ActionType;
  attack?: CardAttack | null;
  keywords?: string[];
}): boolean {
  if (card.action_type === 'attack') return true;
  if (card.attack) return true;

  return false;
}

/**
 * Get display label for frequency
 */
export function getFrequencyLabel(frequency: Frequency): string {
  switch (frequency) {
    case 'once_per_session':
      return 'Once/Session';
    case 'once_per_long_rest':
      return 'Once/Long Rest';
    case 'once_per_rest':
      return 'Once/Rest';
    case 'at_will':
    default:
      return '';
  }
}

/**
 * Get display label for action type
 */
export function getActionTypeLabel(actionType: ActionType): string {
  switch (actionType) {
    case 'attack':
      return 'Attack';
    case 'reaction':
      return 'Reaction';
    case 'passive':
      return 'Passive';
    case 'downtime':
      return 'Downtime';
    case 'buff':
      return 'Buff';
    case 'utility':
      return 'Utility';
    default:
      return '';
  }
}

// ============================================================================
// COMBAT ABILITY PARSING (Unified from combat-spell-parser.ts)
// ============================================================================
// The following functions provide combat ability extraction for domain cards,
// consolidating functionality previously split across two parsers.

/**
 * Represents a combat action from a domain card
 * (Unified from combat-spell-parser.ts for backwards compatibility)
 */
export interface CombatAbility {
  cardId: string;
  name: string;
  rollType: 'spellcast' | 'attack' | 'none' | 'trait_check';
  trait?: string;          // For attack rolls or trait checks
  range?: string;          // Melee, Close, Far, Very Far
  damage?: string;         // Dice notation (e.g., "d8+2", "1d20+3")
  damageType?: 'magic' | 'physical' | 'special';
  usesProficiency?: boolean; // Whether damage scales with proficiency
  costs?: {
    hope?: number;
    stress?: number;
    recall?: number;
  };
  effects?: string[];      // Additional effects (On Fire, Vulnerable, etc.)
  description: string;     // Full card description
  recallCost: number;      // Cost to recall from vault
}

/**
 * Check if damage uses proficiency scaling
 */
export function parseUsesProficiency(text: string): boolean {
  return /using (?:your )?proficiency(?: die)?/i.test(text);
}

/**
 * Extract status effects from card text
 */
export function parseStatusEffects(text: string): string[] {
  const effects: string[] = [];
  const statusPatterns = [
    { pattern: /on fire/i, effect: 'On Fire' },
    { pattern: /vulnerable/i, effect: 'Vulnerable' },
    { pattern: /restrained/i, effect: 'Restrained' },
    { pattern: /stunned/i, effect: 'Stunned' },
    { pattern: /blinded/i, effect: 'Blinded' },
    { pattern: /frightened/i, effect: 'Frightened' },
  ];

  for (const { pattern, effect } of statusPatterns) {
    if (pattern.test(text)) {
      effects.push(effect);
    }
  }

  // Check for special mechanics
  if (/double(?:s)? (?:the )?(?:result|damage)/i.test(text)) {
    effects.push('Doubles damage');
  }

  if (/once per rest/i.test(text)) {
    effects.push('Once per rest');
  }

  return effects;
}

/**
 * Check if a card description contains combat mechanics
 * Uses specific patterns to avoid false positives from defensive/utility cards
 */
export function hasCombatMechanics(description: string): boolean {
  const combatIndicators = [
    // Specific offensive roll patterns
    /make\s+(?:a|an)\s+(?:spellcast|attack|melee|ranged)\s+(?:roll|attack)/i,

    // Specific damage dealing patterns (with dice notation)
    /deal(?:s|ing)?\s+\d*d\d+(?:[+\-]\d+)?\s+(?:magic|physical|true)?\s*damage/i,

    // Targeted offensive actions
    /make.*(?:attack|spellcast).*against/i,

    // Attack success patterns (adjective or adverb form)
    /success(?:ful|fully)\s+(?:attack|spellcast)/i,

    // Weapon attack modifiers (damage roll context)
    /(?:attack|weapon).*damage\s+roll/i,
  ];

  return combatIndicators.some(pattern => pattern.test(description));
}

/**
 * Extract roll type from description
 */
function extractRollType(description: string): CombatAbility['rollType'] {
  if (/make (?:a|an) spellcast roll/i.test(description)) {
    return 'spellcast';
  }
  if (/make (?:a|an) (?:melee|attack|weapon) (?:attack|roll)/i.test(description)) {
    return 'attack';
  }
  if (/make (?:a|an) (agility|strength|finesse|instinct|presence|knowledge) roll/i.test(description)) {
    return 'trait_check';
  }
  return 'none';
}

/**
 * Extract trait for attack or trait check rolls
 */
function extractTrait(description: string, rollType: CombatAbility['rollType']): string | undefined {
  if (rollType === 'spellcast') {
    return 'Spellcast';
  }

  // Check for specific trait mentions
  const traitMatch = description.match(/(agility|strength|finesse|instinct|presence|knowledge) (?:roll|check)/i);
  if (traitMatch) {
    return traitMatch[1]!.charAt(0).toUpperCase() + traitMatch[1]!.slice(1).toLowerCase();
  }

  // For weapon attacks, check for trait in attack description
  const weaponTraitMatch = description.match(/using (?:your )?(agility|strength|finesse|instinct|presence|knowledge)/i);
  if (weaponTraitMatch) {
    return weaponTraitMatch[1]!.charAt(0).toUpperCase() + weaponTraitMatch[1]!.slice(1).toLowerCase();
  }

  return undefined;
}

/**
 * Extract range from description (for CombatAbility)
 */
function extractRange(description: string): string | undefined {
  const rangePattern = /within (very close|very far|far|close|melee|short|long) range/i;
  const match = description.match(rangePattern);

  if (match) {
    const range = match[1]!.toLowerCase();
    // Normalize range names
    if (range === 'short') return 'Close';
    if (range === 'long') return 'Far';
    if (range === 'very close') return 'Very Close';
    if (range === 'very far') return 'Very Far';
    return range.charAt(0).toUpperCase() + range.slice(1);
  }

  return undefined;
}

/**
 * Extract damage formula and type (for CombatAbility)
 */
function extractDamage(description: string): {
  damage?: string;
  damageType?: 'magic' | 'physical' | 'special';
  usesProficiency?: boolean;
} {
  // Pattern: "d8+2 magic damage", "1d20+3 damage", or "d8 damage" (no multiplier)
  const damagePattern = /(?:deal(?:s|ing)?|take(?:s)?)\s+(\d*d\d+(?:[+\-]\d+)?)\s+(magic|physical|true)?\s*damage/i;
  const match = description.match(damagePattern);

  if (!match) {
    return {};
  }

  const damage = match[1];
  const typeMatch = match[2];

  let damageType: 'magic' | 'physical' | 'special' | undefined;
  if (typeMatch) {
    const normalized = typeMatch.toLowerCase();
    if (normalized === 'magic') damageType = 'magic';
    else if (normalized === 'physical') damageType = 'physical';
    else damageType = 'special';
  }

  // Check if damage uses proficiency (handles both "Proficiency" and "Proficiency Die")
  const usesProficiency = parseUsesProficiency(description);

  return {
    damage,
    damageType,
    usesProficiency
  };
}

/**
 * Extract resource costs (for CombatAbility)
 */
function extractCosts(description: string): CombatAbility['costs'] {
  const costs: CombatAbility['costs'] = {};

  // Hope cost: "spend 3 Hope" or "spend a Hope"
  const hopeMatch = description.match(/spend (?:a|(\d+)) hope/i);
  if (hopeMatch) {
    costs.hope = hopeMatch[1] ? parseInt(hopeMatch[1]) : 1;
  }

  // Stress cost: "mark 2 Stress" or "mark a Stress"
  const stressMatch = description.match(/mark (?:a|(\d+)) stress/i);
  if (stressMatch) {
    costs.stress = stressMatch[1] ? parseInt(stressMatch[1]) : 1;
  }

  return Object.keys(costs).length > 0 ? costs : undefined;
}

/**
 * Parse a domain card to extract combat abilities
 * (Unified replacement for combat-spell-parser.ts parseCombatAbility)
 */
export function parseCombatAbility(card: CharacterCard): CombatAbility | null {
  const description = card.library_item?.data?.description || '';
  const cardName = card.library_item?.name || 'Unknown';
  const recallCost = parseInt(card.library_item?.data?.recall || '0');

  // Check if this card has combat mechanics
  if (!hasCombatMechanics(description)) {
    return null;
  }

  // Determine roll type
  const rollType = extractRollType(description);

  // Extract trait for attack rolls or trait checks
  const trait = extractTrait(description, rollType);

  // Extract range
  const range = extractRange(description);

  // Extract damage
  const { damage, damageType, usesProficiency } = extractDamage(description);

  // Extract costs
  const costs = extractCosts(description);

  // Extract effects
  const effects = parseStatusEffects(description);

  return {
    cardId: card.id,
    name: cardName,
    rollType,
    trait,
    range,
    damage,
    damageType,
    usesProficiency,
    costs,
    effects: effects.length > 0 ? effects : undefined,
    description,
    recallCost
  };
}

/**
 * Get all combat abilities from character's loadout
 */
export function getLoadoutCombatAbilities(cards: CharacterCard[]): CombatAbility[] {
  const loadoutCards = cards.filter(card => card.location === 'loadout');

  return loadoutCards
    .map(parseCombatAbility)
    .filter((ability): ability is CombatAbility => ability !== null);
}
