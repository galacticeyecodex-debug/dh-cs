/**
 * UNIFIED JSON ENHANCEMENT SCRIPT
 * ----------------------------------------------------------------------------
 * Processes all game content JSON files (abilities, ancestries, communities)
 * to add enhanced metadata fields for interactive UI components.
 *
 * Usage: npx tsx scripts/enhance_json.ts
 *
 * This script:
 * 1. Reads source JSON files from SRD and Playtest directories
 * 2. Uses the shared card-parser.ts to extract structured data
 * 3. Adds enhanced fields while preserving original text
 * 4. Writes enhanced JSON to separate *_enhanced.json files
 *
 * NOTE: All parsing logic is imported from lib/card-parser.ts to ensure
 * a single source of truth for parsing rules.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Import parsing functions from the shared parser
import { enhanceAbilityCard } from '../lib/card-parser';
import type { EnhancedAbilityCard } from '../types/cards';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// TYPES
// ============================================================================

interface RawAbilityCard {
  name: string;
  level: string;
  domain: string;
  type: string;
  recall: string;
  text: string;
}

interface Feat {
  name: string;
  text: string;
  [key: string]: unknown;
}

interface CharacterOption {
  name: string;
  feats?: Feat[];
  [key: string]: unknown;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Enhance a single feat using the shared card parser
 * Feats are treated like mini ability cards
 */
function enhanceFeat(feat: Feat): Feat {
  // Convert feat to ability card format for parsing
  const asCard = {
    name: feat.name,
    level: '1', // Feats don't have levels
    domain: 'Feature', // Placeholder domain
    type: 'Ability', // Treat as ability
    recall: '0',
    text: feat.text,
  };

  // Parse using shared logic
  const enhanced = enhanceAbilityCard(asCard);

  // Return feat with enhanced fields
  return {
    ...feat,
    action_type: enhanced.action_type,
    timing: enhanced.timing,
    frequency: enhanced.frequency,
    ...(enhanced.costs && { costs: enhanced.costs }),
    ...(enhanced.keywords && { keywords: enhanced.keywords }),
    ...(enhanced.has_tokens && { has_tokens: enhanced.has_tokens }),
    ...(enhanced.max_tokens !== undefined && { max_tokens: enhanced.max_tokens }),
    ...(enhanced.token_source && { token_source: enhanced.token_source }),
    ...(enhanced.attack && { attack: enhanced.attack }),
    ...(enhanced.roll && { roll: enhanced.roll }),
    ...(enhanced.modifiers && { modifiers: enhanced.modifiers }),
  };
}

/**
 * Enhance a character option entry (ancestry/community) by enhancing all its feats
 */
function enhanceCharacterOption(entry: CharacterOption): CharacterOption {
  if (!entry.feats || !Array.isArray(entry.feats)) {
    return entry;
  }

  return {
    ...entry,
    feats: entry.feats.map(feat => enhanceFeat(feat)),
  };
}

// ============================================================================
// FILE PROCESSING FUNCTIONS
// ============================================================================

function processAbilitiesFile(inputPath: string, outputPath: string): EnhancedAbilityCard[] {
  console.log(`Processing abilities: ${inputPath}`);
  console.log(`Output to: ${outputPath}`);

  try {
    const content = fs.readFileSync(inputPath, 'utf-8');
    const abilities: RawAbilityCard[] = JSON.parse(content);

    const enhanced = abilities.map(card => enhanceAbilityCard(card));

    // Write to output file with pretty formatting
    fs.writeFileSync(outputPath, JSON.stringify(enhanced, null, 2) + '\n');

    console.log(`  ✓ Enhanced ${enhanced.length} cards`);

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
    console.error(`  ✗ Error: ${(error as Error).message}`);
    return [];
  }
}

function processCharacterOptionsFile(
  inputPath: string,
  outputPath: string,
  fileType: string
): CharacterOption[] {
  console.log(`Processing ${fileType}: ${inputPath}`);
  console.log(`Output to: ${outputPath}`);

  try {
    const content = fs.readFileSync(inputPath, 'utf-8');
    const entries: CharacterOption[] = JSON.parse(content);

    const enhanced = entries.map(entry => enhanceCharacterOption(entry));

    // Write to output file with pretty formatting
    fs.writeFileSync(outputPath, JSON.stringify(enhanced, null, 2) + '\n');

    // Collect stats
    const allFeats = enhanced.flatMap(e => e.feats || []);
    const stats = {
      entries: enhanced.length,
      totalFeats: allFeats.length,
      attacks: allFeats.filter(f => f.action_type === 'attack').length,
      reactions: allFeats.filter(f => f.action_type === 'reaction').length,
      buffs: allFeats.filter(f => f.action_type === 'buff').length,
      utility: allFeats.filter(f => f.action_type === 'utility').length,
      passives: allFeats.filter(f => f.action_type === 'passive').length,
      downtime: allFeats.filter(f => f.action_type === 'downtime').length,
      withCosts: allFeats.filter(f => f.costs).length,
      withTokens: allFeats.filter(f => f.has_tokens).length,
      withAttacks: allFeats.filter(f => f.attack).length,
    };

    console.log(`  ✓ Enhanced ${stats.entries} ${fileType} with ${stats.totalFeats} feats`);
    console.log(`  Stats:`, stats);

    return enhanced;
  } catch (error) {
    console.error(`  ✗ Error: ${(error as Error).message}`);
    return [];
  }
}

// ============================================================================
// MAIN SCRIPT
// ============================================================================

function main(): void {
  const projectRoot = path.resolve(__dirname, '..');

  const files = [
    // Abilities
    {
      type: 'abilities',
      input: path.join(projectRoot, 'content/srd/json/abilities.json'),
      output: path.join(projectRoot, 'content/srd/json/abilities_enhanced.json'),
    },
    {
      type: 'abilities',
      input: path.join(projectRoot, 'content/playtest/json/abilities.json'),
      output: path.join(projectRoot, 'content/playtest/json/abilities_enhanced.json'),
    },

    // Ancestries
    {
      type: 'ancestries',
      input: path.join(projectRoot, 'content/srd/json/ancestries.json'),
      output: path.join(projectRoot, 'content/srd/json/ancestries_enhanced.json'),
    },
    {
      type: 'ancestries',
      input: path.join(projectRoot, 'content/playtest/json/ancestries.json'),
      output: path.join(projectRoot, 'content/playtest/json/ancestries_enhanced.json'),
    },

    // Communities
    {
      type: 'communities',
      input: path.join(projectRoot, 'content/srd/json/communities.json'),
      output: path.join(projectRoot, 'content/srd/json/communities_enhanced.json'),
    },
    {
      type: 'communities',
      input: path.join(projectRoot, 'content/playtest/json/communities.json'),
      output: path.join(projectRoot, 'content/playtest/json/communities_enhanced.json'),
    },
  ];

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  UNIFIED JSON ENHANCEMENT SCRIPT');
  console.log('═══════════════════════════════════════════════════════════\n');

  for (const file of files) {
    if (!fs.existsSync(file.input)) {
      console.log(`⊗ Skipped (not found): ${file.input}\n`);
      continue;
    }

    if (file.type === 'abilities') {
      processAbilitiesFile(file.input, file.output);
    } else {
      processCharacterOptionsFile(file.input, file.output, file.type);
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✓ COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
}

main();
