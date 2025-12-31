/**
 * ENHANCE ABILITY JSON SCRIPT
 * ----------------------------------------------------------------------------
 * Processes abilities.json files to add enhanced metadata fields for
 * interactive UI components (costs, tokens, attacks, etc.)
 *
 * Usage: node scripts/enhance_ability_json.js
 *
 * This script:
 * 1. Reads abilities.json from SRD and Playtest directories
 * 2. Parses card text to extract structured data
 * 3. Adds enhanced fields while preserving original text
 * 4. Writes enhanced JSON back to the same location
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// PARSING FUNCTIONS (mirrors lib/card-parser.ts)
// ============================================================================

/**
 * Strip markdown formatting for cleaner text matching
 */
function stripMarkdown(text) {
  if (!text) return '';
  return text.replace(/\*\*|\*/g, '');
}

/**
 * Parse stress cost from card text
 */
function parseStressCost(text) {
  const patterns = [
    /\*\*mark (\d+) Stress\*\*/i,
    /mark (\d+) Stress/i,
    /\*\*mark a Stress\*\*/i,
    /mark a Stress/i,
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
 * Parse hope cost from card text
 */
function parseHopeCost(text) {
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
 */
function parseHitPointCost(text) {
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
function parseCosts(text) {
  const stress = parseStressCost(text);
  const hope = parseHopeCost(text);
  const hitPoints = parseHitPointCost(text);

  if (stress === 0 && hope === 0 && hitPoints === 0) {
    return undefined;
  }

  const costs = {};
  if (stress > 0) costs.stress = stress;
  if (hope > 0) costs.hope = hope;
  if (hitPoints > 0) costs.hit_points = hitPoints;

  return costs;
}

/**
 * Parse frequency from card text
 */
function parseFrequency(text) {
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
function parseRange(text) {
  const rangePatterns = [
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
function parseRollTrait(text) {
  const traitPattern = /\*\*(Spellcast|Strength|Agility|Finesse|Presence|Knowledge|Instinct) Roll\*\*/i;
  const match = text.match(traitPattern);
  return match ? match[1] : undefined;
}

/**
 * Parse roll difficulty (DC) from card text
 */
function parseRollDifficulty(text) {
  const dcPattern = /Roll\s*\((\d+)\)/i;
  const match = text.match(dcPattern);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Parse damage from card text
 */
function parseDamage(text) {
  const damagePattern = /(\d*d\d+(?:\+\d+)?)/i;
  const match = text.match(damagePattern);
  return match ? match[1] : undefined;
}

/**
 * Parse damage type from card text
 */
function parseDamageType(text) {
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
function parseTargetType(text) {
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
function parseActionType(text, cardType, attack, roll) {
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
    return 'utility';
  }

  return 'passive';
}

/**
 * Determine timing from action type
 */
function parseTiming(actionType) {
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
function hasTokenMechanics(text) {
  const lowerText = text.toLowerCase();
  return (
    (lowerText.includes('place') && lowerText.includes('token')) ||
    (lowerText.includes('spend') && lowerText.includes('token')) ||
    lowerText.includes('tokens on this card')
  );
}

/**
 * Parse max tokens from card text
 */
function parseMaxTokens(text) {
  const fixedPattern = /place (\d+) tokens?/i;
  const fixedMatch = text.match(fixedPattern);
  if (fixedMatch) {
    return parseInt(fixedMatch[1], 10);
  }

  if (/tokens? equal to/i.test(text)) {
    return null;
  }

  if (/number of tokens equal to/i.test(text)) {
    return null;
  }

  return null;
}

/**
 * Parse token source trait from card text
 */
function parseTokenSource(text) {
  const traitPattern = /tokens? equal to (?:your )?(\w+)/i;
  const match = text.match(traitPattern);
  if (match) {
    const trait = match[1].toLowerCase();
    const traitMap = {
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
 * Extract keywords from card text
 */
function extractKeywords(text, cardType) {
  const keywords = [];
  const lowerText = text.toLowerCase();

  if (lowerText.includes('damage')) keywords.push('damage');
  if (lowerText.includes('magic damage')) keywords.push('magic');
  if (lowerText.includes('physical damage')) keywords.push('physical');
  if (lowerText.includes('all targets') || lowerText.includes('all adversaries')) {
    keywords.push('aoe');
  }
  if (lowerText.includes('clear') && lowerText.includes('hit point')) {
    keywords.push('healing');
  }
  if (lowerText.includes('clear') && lowerText.includes('stress')) {
    keywords.push('stress_relief');
  }
  if (lowerText.includes('gain') && lowerText.includes('hope')) {
    keywords.push('hope_gain');
  }
  if (lowerText.includes('mark') && lowerText.includes('stress')) {
    keywords.push('stress_cost');
  }
  if (lowerText.includes('spend') && lowerText.includes('hope')) {
    keywords.push('hope_cost');
  }
  if (lowerText.includes('vulnerable')) keywords.push('debuff');
  if (lowerText.includes('restrained')) keywords.push('control');
  if (lowerText.includes('advantage')) keywords.push('buff');
  if (lowerText.includes('disadvantage')) keywords.push('debuff');
  if (lowerText.includes('teleport') || lowerText.includes('move')) {
    keywords.push('movement');
  }
  if (hasTokenMechanics(text)) keywords.push('tokens');
  if (cardType === 'Spell') keywords.push('spell');
  if (cardType === 'Ability') keywords.push('ability');

  return keywords;
}

/**
 * Parse roll information from card text
 */
function parseRoll(text) {
  const trait = parseRollTrait(text);
  if (!trait) return undefined;

  const difficulty = parseRollDifficulty(text);
  const hasTargetReaction = text.toLowerCase().includes('reaction roll');

  return {
    type: `${trait} Roll`,
    trait,
    difficulty: difficulty || undefined,
    target_reaction: hasTargetReaction || undefined,
  };
}

/**
 * Parse attack information from card text
 */
function parseAttack(text) {
  const cleanText = stripMarkdown(text);
  const trait = parseRollTrait(text);
  const range = parseRange(text);
  const damage = parseDamage(text);
  const hasAgainst = cleanText.toLowerCase().includes('against');

  // Stricter check: An attack needs damage OR a trait roll against a target
  if (!damage && !(trait && hasAgainst)) return undefined;

  const attack = {
    trait: trait || 'Spellcast',
    range: range || 'Close',
  };

  if (damage) attack.damage = damage;
  const damageType = parseDamageType(text);
  if (damageType) attack.damage_type = damageType;

  const targets = parseTargetType(text);
  if (targets) attack.targets = targets;

  const difficulty = parseRollDifficulty(text);
  if (difficulty) attack.difficulty = difficulty;

  return attack;
}

/**
 * Enhance a single ability card with parsed metadata
 */
function enhanceAbilityCard(card) {
  const text = card.text;
  const cardType = card.type;

  // 1. Parse structured data first
  const attack = parseAttack(text);
  const roll = parseRoll(text);
  const costs = parseCosts(text);
  const frequency = parseFrequency(text);
  const hasTokens = hasTokenMechanics(text);
  const keywords = extractKeywords(text, cardType);

  // 2. Determine action type based on parsed data
  const actionType = parseActionType(text, cardType, attack, roll);
  const timing = parseTiming(actionType);

  const enhanced = {
    ...card,
    action_type: actionType,
    timing,
    frequency,
  };

  // Only add costs if present
  if (costs) {
    enhanced.costs = costs;
  }

  // Only add keywords if present
  if (keywords.length > 0) {
    enhanced.keywords = keywords;
  }

  // Add token info if applicable
  if (hasTokens) {
    enhanced.has_tokens = true;
    const maxTokens = parseMaxTokens(text);
    if (maxTokens !== undefined) {
      enhanced.max_tokens = maxTokens;
    }
    const tokenSource = parseTokenSource(text);
    if (tokenSource) {
      enhanced.token_source = tokenSource;
    }
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

// ============================================================================
// MAIN SCRIPT
// ============================================================================

function processAbilitiesFile(filePath) {
  console.log(`Processing: ${filePath}`);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const abilities = JSON.parse(content);

    const enhanced = abilities.map(card => enhanceAbilityCard(card));

    // Write back with pretty formatting
    fs.writeFileSync(filePath, JSON.stringify(enhanced, null, 2) + '\n');

    console.log(`  Enhanced ${enhanced.length} cards`);

    // Print some stats
    const stats = {
      total: enhanced.length,
      attacks: enhanced.filter(c => c.action_type === 'attack').length,
      reactions: enhanced.filter(c => c.action_type === 'reaction').length,
      buffs: enhanced.filter(c => c.action_type === 'buff').length,
      utility: enhanced.filter(c => c.action_type === 'utility').length,
      passives: enhanced.filter(c => c.action_type === 'passive').length,
      downtime: enhanced.filter(c => c.action_type === 'downtime').length,
      withCosts: enhanced.filter(c => c.costs).length,
      withTokens: enhanced.filter(c => c.has_tokens).length,
    };
    console.log(`  Stats:`, stats);

    return enhanced;
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return [];
  }
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');

  const files = [
    path.join(projectRoot, 'content/srd/json/abilities.json'),
    path.join(projectRoot, 'content/playtest/json/abilities.json'),
  ];

  console.log('Enhancing ability JSON files...\n');

  for (const file of files) {
    if (fs.existsSync(file)) {
      processAbilitiesFile(file);
      console.log('');
    } else {
      console.log(`Skipped (not found): ${file}\n`);
    }
  }

  console.log('Done!');
}

main();
