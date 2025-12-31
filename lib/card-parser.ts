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
  CardAttack,
  CardCosts,
  CardRoll,
  DamageType,
  EnhancedAbilityCard,
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
 */
export function parseStressCost(text: string): number {
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
  const traitPattern = /\*\*(Spellcast|Strength|Agility|Finesse|Presence|Knowledge|Instinct) Roll\*\*/i;
  const match = text.match(traitPattern);
  return match ? match[1] : undefined;
}

/**
 * Parse roll difficulty (DC) from card text
 */
export function parseRollDifficulty(text: string): number | undefined {
  // Match patterns like "Spellcast Roll (15)" or "Roll (12)"
  const dcPattern = /Roll\s*\((\d+)\)/i;
  const match = text.match(dcPattern);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Parse damage from card text
 * Returns the first damage notation found
 */
export function parseCardDamage(text: string): string | undefined {
  // Match patterns like "d8", "1d8", "2d8+4", "d10+3"
  const damagePattern = /(\d*d\d+(?:\+\d+)?)/i;
  const match = text.match(damagePattern);
  return match ? match[1] : undefined;
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

  // If we already parsed an attack, it's an attack
  if (attack) return 'attack';

  // Check for reaction patterns
  if (
    cleanText.includes('reaction roll') ||
    cleanText.includes('when you would take damage') ||
    cleanText.includes('when an attack') ||
    cleanText.includes('when you are targeted')
  ) {
    return 'reaction';
  }

  // If it's a roll against something but didn't qualify as 'attack' (no damage/range)
  // it might still be an attack action
  if (cleanText.includes('make a') && (cleanText.includes('roll against') || cleanText.includes('attack'))) {
    return 'attack';
  }

  // Check for downtime patterns
  if (cleanText.includes('during a rest') || cleanText.includes('downtime')) {
    return 'downtime';
  }

  // Check for buff patterns
  if (
    cleanText.includes('gain a bonus') ||
    cleanText.includes('gain advantage') ||
    cleanText.includes('clear a stress') ||
    cleanText.includes('clear a hit point')
  ) {
    return 'buff';
  }

  // Default based on card type
  if (cardType === 'Spell') {
    return 'utility'; // Non-combat spells are utility
  }

  return 'passive';
}

/**
 * Determine timing from action type and text
 */
export function parseTiming(text: string, actionType: ActionType): Timing {
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
    (lowerText.includes('place') && lowerText.includes('token')) ||
    (lowerText.includes('spend') && lowerText.includes('token')) ||
    lowerText.includes('tokens on this card')
  );
}

/**
 * Parse max tokens from card text
 * Returns null if tokens are dynamic (based on trait)
 */
export function parseMaxTokens(text: string): number | null {
  // Check for fixed token count
  const fixedPattern = /place (\d+) tokens?/i;
  const fixedMatch = text.match(fixedPattern);
  if (fixedMatch) {
    return parseInt(fixedMatch[1], 10);
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
  const traitPattern = /tokens? equal to (?:your )?(\w+)/i;
  const match = text.match(traitPattern);
  if (match) {
    const trait = match[1].toLowerCase();
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
    return traitMap[trait] || trait;
  }
  return undefined;
}

/**
 * Extract keywords from card text for filtering
 */
export function extractKeywords(text: string, cardType: string): string[] {
  const keywords: string[] = [];
  const lowerText = text.toLowerCase();

  // Damage-related
  if (lowerText.includes('damage')) keywords.push('damage');
  if (lowerText.includes('magic damage')) keywords.push('magic');
  if (lowerText.includes('physical damage')) keywords.push('physical');

  // AoE
  if (lowerText.includes('all targets') || lowerText.includes('all adversaries')) {
    keywords.push('aoe');
  }

  // Healing/Support
  if (lowerText.includes('clear') && lowerText.includes('hit point')) {
    keywords.push('healing');
  }
  if (lowerText.includes('clear') && lowerText.includes('stress')) {
    keywords.push('stress_relief');
  }
  if (lowerText.includes('gain') && lowerText.includes('hope')) {
    keywords.push('hope_gain');
  }

  // Costs
  if (lowerText.includes('mark') && lowerText.includes('stress')) {
    keywords.push('stress_cost');
  }
  if (lowerText.includes('spend') && lowerText.includes('hope')) {
    keywords.push('hope_cost');
  }

  // Control
  if (lowerText.includes('vulnerable')) keywords.push('debuff');
  if (lowerText.includes('restrained')) keywords.push('control');
  if (lowerText.includes('advantage')) keywords.push('buff');
  if (lowerText.includes('disadvantage')) keywords.push('debuff');

  // Movement
  if (lowerText.includes('teleport') || lowerText.includes('move')) {
    keywords.push('movement');
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
  if (!trait) return undefined;

  const difficulty = parseRollDifficulty(text);
  const hasTargetReaction = text.toLowerCase().includes('reaction roll');

  return {
    type: `${trait} Roll`,
    trait,
    difficulty,
    target_reaction: hasTargetReaction,
  };
}

/**
 * Parse attack information from card text
 */
export function parseAttack(text: string): CardAttack | undefined {
  const cleanText = stripMarkdown(text);
  const trait = parseRollTrait(text);
  const range = parseCardRange(text);
  const damage = parseCardDamage(text);
  const hasAgainst = cleanText.toLowerCase().includes('against');

  // Stricter check: An attack needs damage OR a trait roll against a target
  if (!damage && !(trait && hasAgainst)) return undefined;

  const attack: CardAttack = {
    trait: trait || 'Spellcast',
    range: range || 'Close',
  };

  if (damage) attack.damage = damage;
  const damageType = parseCardDamageType(text);
  if (damageType) attack.damage_type = damageType;

  const targets = parseTargetType(text);
  if (targets) attack.targets = targets;

  const difficulty = parseRollDifficulty(text);
  if (difficulty) attack.difficulty = difficulty;

  return attack;
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
}): EnhancedAbilityCard {
  const text = card.text;
  const cardType = card.type as 'Spell' | 'Ability';

  // 1. Parse structured data first
  const attack = parseAttack(text);
  const roll = parseRoll(text);
  const costs = parseCosts(text);
  const frequency = parseFrequency(text);
  const hasTokens = hasTokenMechanics(text);
  const keywords = extractKeywords(text, cardType);

  // 2. Determine action type based on parsed data
  const actionType = parseActionType(text, cardType, attack, roll);
  const timing = parseTiming(text, actionType);

  const enhanced: EnhancedAbilityCard = {
    name: card.name,
    level: card.level,
    domain: card.domain,
    type: cardType,
    recall: card.recall,
    text: card.text,
    action_type: actionType,
    timing,
    frequency,
    costs,
    keywords,
  };

  // Add token info if applicable
  if (hasTokens) {
    enhanced.has_tokens = true;
    enhanced.max_tokens = parseMaxTokens(text);
    enhanced.token_source = parseTokenSource(text);
  }

  // Add attack info if applicable
  if (attack) {
    enhanced.attack = attack;
  }

  // Add roll info
  if (roll) {
    enhanced.roll = roll;
  }

  return enhanced;
}

/**
 * Check if a card or feature has combat relevance (should appear in combat view)
 * Works with both EnhancedAbilityCard and EnhancedFeature types
 */
export function hasCombatRelevance(card: {
  action_type?: ActionType;
  attack?: CardAttack;
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
