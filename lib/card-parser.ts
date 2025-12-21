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
