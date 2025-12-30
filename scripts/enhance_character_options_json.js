/**
 * ENHANCE CHARACTER OPTIONS JSON SCRIPT
 * ----------------------------------------------------------------------------
 * Processes ancestries.json and communities.json files to add enhanced metadata
 * fields for interactive UI components (costs, attacks, tokens, etc.)
 *
 * Usage: node scripts/enhance_character_options_json.js
 *
 * This script:
 * 1. Reads ancestries.json and communities.json from SRD and Playtest directories
 * 2. Parses feat text to extract structured data for combat abilities
 * 3. Adds enhanced fields while preserving original text
 * 4. Writes enhanced JSON back to the same location
 *
 * Unlike abilities.json which has a flat structure, these files have nested
 * feats arrays that need individual enhancement.
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// PARSING FUNCTIONS (shared with lib/card-parser.ts patterns)
// ============================================================================

/**
 * Parse stress cost from feat text
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
 * Parse hope cost from feat text
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
 * Parse all costs from feat text
 */
function parseCosts(text) {
  const stress = parseStressCost(text);
  const hope = parseHopeCost(text);

  if (stress === 0 && hope === 0) {
    return undefined;
  }

  const costs = {};
  if (stress > 0) costs.stress = stress;
  if (hope > 0) costs.hope = hope;

  return costs;
}

/**
 * Parse frequency from feat text
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
  if (lowerText.includes('at the start of each session')) {
    return 'once_per_session';
  }

  return 'at_will';
}

/**
 * Parse range from feat text
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
    { pattern: /Close weapon/i, range: 'Close' },
    { pattern: /Melee weapon/i, range: 'Melee' },
  ];

  for (const { pattern, range } of rangePatterns) {
    if (pattern.test(text)) {
      return range;
    }
  }

  return undefined;
}

/**
 * Parse the trait used for rolls from feat text
 */
function parseRollTrait(text) {
  const traitPattern = /\*\*(Spellcast|Strength|Agility|Finesse|Presence|Knowledge|Instinct) Roll\*\*/i;
  const match = text.match(traitPattern);
  if (match) return match[1];

  // Also check for "as a [Trait] weapon" or "[Trait] weapon"
  const weaponTraitPattern = /(?:as (?:a|an) )?(Instinct|Finesse|Strength|Agility) (?:Close |Melee )?weapon/i;
  const weaponMatch = text.match(weaponTraitPattern);
  if (weaponMatch) return weaponMatch[1];

  return undefined;
}

/**
 * Parse roll difficulty (DC) from feat text
 */
function parseRollDifficulty(text) {
  const dcPattern = /Roll\s*\((\d+)\)/i;
  const match = text.match(dcPattern);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Parse damage dice from feat text
 */
function parseDamage(text) {
  // Match patterns like "d8", "1d6", "2d6", "1d12", "d12"
  const damagePattern = /(\d*d\d+(?:\+\d+)?)/i;
  const match = text.match(damagePattern);
  return match ? match[1] : undefined;
}

/**
 * Parse damage type from feat text
 */
function parseDamageType(text) {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('magic damage')) {
    return 'magic';
  }
  if (lowerText.includes('physical damage')) {
    return 'physical';
  }
  // Default to physical if damage is mentioned but type isn't specified
  if (lowerText.includes('damage') && !lowerText.includes('take') && !lowerText.includes('would')) {
    return 'physical';
  }

  return undefined;
}

/**
 * Determine action type from feat text
 */
function parseActionType(text) {
  const lowerText = text.toLowerCase();

  // Check for reaction patterns
  if (
    lowerText.includes('reaction roll') ||
    lowerText.includes('when you would take damage') ||
    lowerText.includes('when an attack') ||
    lowerText.includes('when you are targeted') ||
    lowerText.includes('when you roll with fear') ||
    lowerText.includes('after you or a willing ally') ||
    lowerText.includes('when you succeed on an attack') ||
    lowerText.includes('when you take')
  ) {
    return 'reaction';
  }

  // Check for attack patterns - explicit attacks
  if (
    lowerText.includes('make a') && lowerText.includes('roll') &&
    (lowerText.includes('against') || lowerText.includes('to scratch') || lowerText.includes('to deal'))
  ) {
    return 'attack';
  }

  // Check for weapon usage
  if (lowerText.includes('weapon that deals') || lowerText.includes('as a') && lowerText.includes('weapon')) {
    return 'attack';
  }

  // Check for movement abilities
  if (lowerText.includes('you can fly') || lowerText.includes('you can leap') || lowerText.includes('you can breathe')) {
    return 'buff';
  }

  // Check for downtime patterns
  if (lowerText.includes('during a rest') || lowerText.includes('downtime')) {
    return 'downtime';
  }

  // Check for buff/utility patterns
  if (
    lowerText.includes('gain a bonus') ||
    lowerText.includes('gain advantage') ||
    lowerText.includes('have advantage') ||
    lowerText.includes('ignore disadvantage') ||
    lowerText.includes('gain a permanent') ||
    lowerText.includes('gain an additional') ||
    lowerText.includes('reroll')
  ) {
    return 'buff';
  }

  return 'passive';
}

/**
 * Determine timing from action type
 */
function parseTiming(actionType, text) {
  if (actionType === 'reaction') {
    return 'reaction';
  }
  if (actionType === 'downtime') {
    return 'downtime';
  }
  if (actionType === 'passive' || actionType === 'buff') {
    // Check if it requires activation
    const lowerText = text.toLowerCase();
    if (
      lowerText.includes('mark a stress') ||
      lowerText.includes('mark 2 stress') ||
      lowerText.includes('spend') && lowerText.includes('hope')
    ) {
      return 'action';
    }
    return 'free';
  }
  return 'action';
}

/**
 * Check if feat has token mechanics
 */
function hasTokenMechanics(text) {
  const lowerText = text.toLowerCase();
  return (
    (lowerText.includes('place') && lowerText.includes('token')) ||
    (lowerText.includes('spend') && lowerText.includes('token')) ||
    lowerText.includes('tokens on') ||
    lowerText.includes('number of tokens')
  );
}

/**
 * Parse max tokens from feat text
 */
function parseMaxTokens(text) {
  const fixedPattern = /hold a number of tokens equal to your (\w+)/i;
  const fixedMatch = text.match(fixedPattern);
  if (fixedMatch) {
    return null; // Dynamic based on trait
  }

  const numberPattern = /place (\d+) tokens?/i;
  const numberMatch = text.match(numberPattern);
  if (numberMatch) {
    return parseInt(numberMatch[1], 10);
  }

  return null;
}

/**
 * Parse token source trait from feat text
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
 * Extract keywords from feat text
 */
function extractKeywords(text) {
  const keywords = [];
  const lowerText = text.toLowerCase();

  if (lowerText.includes('damage') && !lowerText.includes('take damage') && !lowerText.includes('would take')) {
    keywords.push('damage');
  }
  if (lowerText.includes('magic damage')) keywords.push('magic');
  if (lowerText.includes('physical damage')) keywords.push('physical');
  if (lowerText.includes('all targets') || lowerText.includes('all adversaries') || lowerText.includes('within melee range')) {
    // Check if it's AoE damage
    if (lowerText.includes('damage') && lowerText.includes('all')) {
      keywords.push('aoe');
    }
  }
  if (lowerText.includes('vulnerable')) keywords.push('debuff');
  if (lowerText.includes('advantage')) keywords.push('buff');
  if (lowerText.includes('disadvantage')) keywords.push('debuff');
  if (lowerText.includes('fly') || lowerText.includes('leap') || lowerText.includes('move') || lowerText.includes('knocking back')) {
    keywords.push('movement');
  }
  if (lowerText.includes('reroll')) keywords.push('reroll');
  if (lowerText.includes('armor') || lowerText.includes('protection') || lowerText.includes('resistance')) {
    keywords.push('defense');
  }
  if (lowerText.includes('stress') && lowerText.includes('mark')) keywords.push('stress_cost');
  if (lowerText.includes('hope') && lowerText.includes('spend')) keywords.push('hope_cost');
  if (lowerText.includes('hope') && lowerText.includes('gain')) keywords.push('hope_gain');
  if (hasTokenMechanics(text)) keywords.push('tokens');
  if (lowerText.includes('rest')) keywords.push('rest');
  if (lowerText.includes('evasion')) keywords.push('evasion');
  if (lowerText.includes('hit point')) keywords.push('hit_points');
  if (lowerText.includes('breathe') && lowerText.includes('underwater')) keywords.push('aquatic');

  return keywords;
}

/**
 * Parse attack information from feat text
 */
function parseAttack(text) {
  const trait = parseRollTrait(text);
  const range = parseRange(text);
  const damage = parseDamage(text);
  const damageType = parseDamageType(text);

  // Only create attack info if we have meaningful combat data
  if (!trait && !range && !damage) return undefined;

  const attack = {};

  if (trait) attack.trait = trait;
  if (range) attack.range = range;
  if (damage) attack.damage = damage;
  if (damageType) attack.damage_type = damageType;

  // Check for special effects
  const lowerText = text.toLowerCase();
  if (lowerText.includes('vulnerable')) {
    attack.effect = 'vulnerable';
  }
  if (lowerText.includes('knocking back')) {
    attack.effect = 'knockback';
  }

  return Object.keys(attack).length > 0 ? attack : undefined;
}

/**
 * Parse any stat bonuses granted by the feat
 */
function parseStatBonuses(text) {
  const bonuses = {};
  const lowerText = text.toLowerCase();

  // Check for permanent bonuses
  const evasionMatch = text.match(/\+(\d+) bonus to your Evasion/i);
  if (evasionMatch) {
    bonuses.evasion = parseInt(evasionMatch[1], 10);
  }

  const experienceMatch = text.match(/\+(\d+) bonus to it/i);
  if (experienceMatch && lowerText.includes('experience')) {
    bonuses.experience = parseInt(experienceMatch[1], 10);
  }

  // Check for damage threshold bonuses
  if (lowerText.includes('damage thresholds equal to your proficiency')) {
    bonuses.damage_thresholds = 'proficiency';
  }

  // Check for additional slots
  if (lowerText.includes('additional hit point slot')) {
    bonuses.hit_point_slots = 1;
  }
  if (lowerText.includes('additional stress slot')) {
    bonuses.stress_slots = 1;
  }

  return Object.keys(bonuses).length > 0 ? bonuses : undefined;
}

/**
 * Enhance a single feat with parsed metadata
 */
function enhanceFeat(feat) {
  const text = feat.text;

  const actionType = parseActionType(text);
  const timing = parseTiming(actionType, text);
  const frequency = parseFrequency(text);
  const costs = parseCosts(text);
  const hasTokens = hasTokenMechanics(text);
  const keywords = extractKeywords(text);
  const attack = parseAttack(text);
  const statBonuses = parseStatBonuses(text);

  const enhanced = {
    ...feat,
    action_type: actionType,
    timing,
    frequency,
  };

  // Only add optional fields if present
  if (costs) {
    enhanced.costs = costs;
  }

  if (keywords.length > 0) {
    enhanced.keywords = keywords;
  }

  if (hasTokens) {
    enhanced.has_tokens = true;
    const maxTokens = parseMaxTokens(text);
    if (maxTokens !== null) {
      enhanced.max_tokens = maxTokens;
    }
    const tokenSource = parseTokenSource(text);
    if (tokenSource) {
      enhanced.token_source = tokenSource;
    }
  }

  if (attack) {
    enhanced.attack = attack;
  }

  if (statBonuses) {
    enhanced.stat_bonuses = statBonuses;
  }

  return enhanced;
}

/**
 * Enhance an ancestry or community entry by enhancing all its feats
 */
function enhanceEntry(entry) {
  if (!entry.feats || !Array.isArray(entry.feats)) {
    return entry;
  }

  return {
    ...entry,
    feats: entry.feats.map(feat => enhanceFeat(feat)),
  };
}

// ============================================================================
// MAIN SCRIPT
// ============================================================================

function processFile(filePath, fileType) {
  console.log(`Processing ${fileType}: ${filePath}`);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const entries = JSON.parse(content);

    const enhanced = entries.map(entry => enhanceEntry(entry));

    // Write back with pretty formatting
    fs.writeFileSync(filePath, JSON.stringify(enhanced, null, 2) + '\n');

    // Collect stats
    const allFeats = enhanced.flatMap(e => e.feats || []);
    const stats = {
      entries: enhanced.length,
      totalFeats: allFeats.length,
      attacks: allFeats.filter(f => f.action_type === 'attack').length,
      reactions: allFeats.filter(f => f.action_type === 'reaction').length,
      buffs: allFeats.filter(f => f.action_type === 'buff').length,
      passives: allFeats.filter(f => f.action_type === 'passive').length,
      downtime: allFeats.filter(f => f.action_type === 'downtime').length,
      withCosts: allFeats.filter(f => f.costs).length,
      withTokens: allFeats.filter(f => f.has_tokens).length,
      withAttacks: allFeats.filter(f => f.attack).length,
      withStatBonuses: allFeats.filter(f => f.stat_bonuses).length,
    };

    console.log(`  Enhanced ${stats.entries} ${fileType} with ${stats.totalFeats} feats`);
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
    { path: path.join(projectRoot, 'content/srd/json/ancestries.json'), type: 'ancestries' },
    { path: path.join(projectRoot, 'content/srd/json/communities.json'), type: 'communities' },
    { path: path.join(projectRoot, 'content/playtest/json/ancestries.json'), type: 'ancestries' },
    { path: path.join(projectRoot, 'content/playtest/json/communities.json'), type: 'communities' },
  ];

  console.log('Enhancing character options JSON files...\n');

  for (const file of files) {
    if (fs.existsSync(file.path)) {
      processFile(file.path, file.type);
      console.log('');
    } else {
      console.log(`Skipped (not found): ${file.path}\n`);
    }
  }

  console.log('Done!');
}

main();
