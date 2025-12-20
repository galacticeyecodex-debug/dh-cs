/**
 * COMBAT SPELL PARSER
 * ----------------------------------------------------------------------------
 * Extracts combat mechanics from domain card descriptions for display in Combat View.
 *
 * FUNCTIONALITY:
 * - Identifies cards with offensive combat abilities (spells, attacks, etc.)
 * - Parses roll types (Spellcast, Attack, special)
 * - Extracts damage formulas and types
 * - Identifies range requirements
 * - Parses resource costs (Hope, Stress, Recall)
 * - Returns structured combat action data for UI integration
 */

import type { CharacterCard } from '@/types/character';

/**
 * Represents a combat action from a domain card
 */
export interface CombatAbility {
  cardId: string;
  name: string;
  rollType: 'spellcast' | 'attack' | 'none' | 'trait_check';
  trait?: string;          // For attack rolls or trait checks
  range?: string;          // Melee, Close, Far, Very Far
  damage?: string;         // Dice notation (e.g., "6d8+2", "12d20+3")
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
 * Parse a domain card to extract combat abilities
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
  const effects = extractEffects(description);

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
    effects,
    description,
    recallCost
  };
}

/**
 * Check if a card description contains combat mechanics
 */
function hasCombatMechanics(description: string): boolean {
  const combatIndicators = [
    /make (?:a|an) (?:spellcast|attack|melee|ranged)/i,
    /deal(?:s|ing)?\s+\d+d\d+/i,
    /damage/i,
    /target/i,
    /roll/i,
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
 * Extract range from description
 */
function extractRange(description: string): string | undefined {
  const rangePattern = /within (very far|far|close|melee|short|long) range/i;
  const match = description.match(rangePattern);

  if (match) {
    const range = match[1]!.toLowerCase();
    // Normalize range names
    if (range === 'short') return 'Close';
    if (range === 'long') return 'Far';
    return range.charAt(0).toUpperCase() + range.slice(1);
  }

  return undefined;
}

/**
 * Extract damage formula and type
 */
function extractDamage(description: string): {
  damage?: string;
  damageType?: 'magic' | 'physical' | 'special';
  usesProficiency?: boolean;
} {
  // Pattern: "6d8+2 magic damage" or "12d20+3 damage"
  const damagePattern = /(?:deal(?:s|ing)?|take(?:s)?)\s+(\d+d\d+(?:[+\-]\d+)?)\s+(magic|physical|true)?\s*damage/i;
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

  // Check if damage uses proficiency
  const usesProficiency = /using (?:your )?proficiency/i.test(description);

  return {
    damage,
    damageType,
    usesProficiency
  };
}

/**
 * Extract resource costs
 */
function extractCosts(description: string): CombatAbility['costs'] {
  const costs: CombatAbility['costs'] = {};

  // Hope cost: "spend 3 Hope" or "spend a Hope"
  const hopeMatch = description.match(/spend (?:a|(\d+)) hope/i);
  if (hopeMatch) {
    costs.hope = hopeMatch[1] ? parseInt(hopeMatch[1]) : 1;
  }

  // Stress cost: "mark 2 Stress"
  const stressMatch = description.match(/mark (\d+) stress/i);
  if (stressMatch) {
    costs.stress = parseInt(stressMatch[1]!);
  }

  return Object.keys(costs).length > 0 ? costs : undefined;
}

/**
 * Extract status effects and special mechanics
 */
function extractEffects(description: string): string[] | undefined {
  const effects: string[] = [];

  // Common status effects
  const statusPatterns = [
    { pattern: /on fire/i, effect: 'On Fire' },
    { pattern: /vulnerable/i, effect: 'Vulnerable' },
    { pattern: /restrained/i, effect: 'Restrained' },
    { pattern: /stunned/i, effect: 'Stunned' },
    { pattern: /blinded/i, effect: 'Blinded' },
    { pattern: /frightened/i, effect: 'Frightened' },
  ];

  for (const { pattern, effect } of statusPatterns) {
    if (pattern.test(description)) {
      effects.push(effect);
    }
  }

  // Check for special mechanics
  if (/double(?:s)? (?:the )?(?:result|damage)/i.test(description)) {
    effects.push('Doubles damage');
  }

  if (/once per rest/i.test(description)) {
    effects.push('Once per rest');
  }

  return effects.length > 0 ? effects : undefined;
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
