/**
 * ENHANCE ABILITY JSON SCRIPT
 * ----------------------------------------------------------------------------
 * Processes abilities.json files to add enhanced metadata fields for
 * interactive UI components (costs, tokens, attacks, etc.)
 *
 * Usage: npx tsx scripts/enhance_ability_json.ts
 *
 * This script:
 * 1. Reads abilities.json from SRD and Playtest directories
 * 2. Uses the shared card-parser.ts to extract structured data
 * 3. Adds enhanced fields while preserving original text
 * 4. Writes enhanced JSON back to the same location
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

// ============================================================================
// MAIN SCRIPT
// ============================================================================

function processAbilitiesFile(filePath: string): EnhancedAbilityCard[] {
  console.log(`Processing: ${filePath}`);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const abilities: RawAbilityCard[] = JSON.parse(content);

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
    console.error(`  Error: ${(error as Error).message}`);
    return [];
  }
}

function main(): void {
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
