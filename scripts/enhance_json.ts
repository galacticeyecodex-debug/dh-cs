/**
 * UNIFIED JSON ENHANCEMENT SCRIPT
 * ----------------------------------------------------------------------------
 * This script serves as the build-step processor for all Daggerheart game content.
 * It reads raw JSON files (abilities, ancestries, classes, etc.) and injects
 * structured mechanics metadata used by the interactive application.
 *
 * USAGE:
 *   npx tsx scripts/enhance_json.ts
 *
 * DOCUMENTATION & REFERENCE:
 *   - Schema Definitions: dh-cs/types/cards.ts (EnhancedAbilityCard, EnhancementBlock)
 *   - Detailed Schema Guide: dh-cs/docs/ABILITIES_SCHEMA.md
 *   - Parsing Logic: dh-cs/lib/card-parser.ts
 *
 * HOW IT WORKS:
 * 1. Reads raw content files from `content/srd/json/` and `content/playtest/json/`.
 * 2. Parses the `text` of every card/feat using the shared `lib/card-parser.ts`.
 *    - This parser uses NLU (Natural Language Understanding) patterns to extract
 *      mechanics like attacks, costs, tokens, and modifiers.
 * 3. Generates an `enhancement` object for each item containing these mechanics.
 * 4. Preserves any existing `enhancement_override` blocks found in the *output* files.
 *    - This allows developers to manually correct parser errors by adding an
 *      override block directly to the output JSON, which persists across re-runs.
 * 5. Writes the result to `*_enhanced.json` files.
 *
 * OUTPUT SCHEMA:
 * The script produces items with the following structure (TypeScript: EnhancedAbilityCard):
 *
 * {
 *   // ... Original fields (name, text, etc.) ...
 *
 *   // Auto-generated mechanics (overwritten on every run)
 *   "enhancement": {
 *     "action_type": "attack" | undefined,
 *     "timing": "action" | "reaction" | "free" | "downtime",
 *     "frequency": "at_will" | "once_per_rest" | "once_per_long_rest" | "once_per_session",
 *     "duration": "scene" | "instant" | ...,
 *     
 *     // Resource Costs
 *     "costs": {
 *       "hope": number,
 *       "stress": number,
 *       "hit_points": number,
 *       "armor_slots": number
 *     },
 *
 *     // Token Tracking (e.g., for "Hide", "Flight")
 *     "tokens": {
 *       "has_tokens": boolean,
 *       "max_tokens": number | null, // null means dynamic (e.g., "equal to Agility")
 *       "token_source": string,      // Trait or source name
 *       "token_replenish": "rest" | ...
 *     },
 *
 *     // Combat Mechanics
 *     "attack": {
 *       "trait": string,             // e.g., "Strength", "Spellcast"
 *       "range": string,             // e.g., "Melee", "Far"
 *       "damage": string,            // e.g., "d8", "2d10"
 *       "damage_type": "physical" | "magic",
 *       "combat_category": "standalone_attack" | "damage_bonus" | ...
 *     },
 *
 *     // Non-Attack Rolls
 *     "roll": {
 *       "type": string,              // e.g., "Spellcast Roll"
 *       "difficulty": number         // Fixed DC if applicable
 *     },
 *
 *     // Passive Stat Modifiers
 *     "modifiers": [
 *       {
 *         "stat": "evasion" | "armor" | ...,
 *         "value": number,
 *         "condition": { ... }       // e.g., "while_unarmored"
 *       }
 *     ]
 *   },
 *
 *   // Manual Override (Optional - Takes Precedence)
 *   // Use this to fix parser mistakes. If present, the app uses this instead.
 *   "enhancement_override": { ... same structure as enhancement ... }
 * }
 *
 * CONSUMPTION IN APP:
 * Components should access mechanics via `enhancement_override` if it exists,
 * falling back to `enhancement`.
 * Example: `const mechanics = card.enhancement_override ?? card.enhancement;`
 *
 * SUPPORTED FILE TYPES:
 * - Abilities (Spells/Grimoires): Main cards.
 * - Ancestries/Communities: Enhances `feats` array inside.
 * - Classes: Enhances `class_feats` and `hope_feat`.
 * - Subclasses: Enhances `foundations`, `specializations`, and `masteries`.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Import parsing functions from the shared parser
import { enhanceAbilityCard } from '../lib/card-parser';
import type {
  EnhancedAbilityCard,
  EnhancementBlock
} from '../types/cards';

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

// Enhance types using shared EnhancementBlock

interface EnhancedCard extends EnhancedAbilityCard {
  [key: string]: unknown;
}

interface Feat {
  name: string;
  text: string;
  enhancement?: EnhancementBlock;
  enhancement_override?: EnhancementBlock;
  [key: string]: unknown;
}

interface CharacterOption {
  name: string;
  feats?: Feat[];
  [key: string]: unknown;
}

interface ClassEntry {
  name: string;
  class_feats?: Feat[];
  hope_feat_name?: string;
  hope_feat_text?: string;
  hope_feat_enhanced?: Feat;
  [key: string]: unknown;
}

interface SubclassEntry {
  name: string;
  foundations?: Feat[];
  specializations?: Feat[];
  masteries?: Feat[];
  [key: string]: unknown;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load existing enhanced file and extract enhancement_override blocks by name
 */
function loadExistingOverrides(outputPath: string): Map<string, EnhancementBlock> {
  const overrides = new Map<string, EnhancementBlock>();

  if (!fs.existsSync(outputPath)) {
    return overrides;
  }

  try {
    const content = fs.readFileSync(outputPath, 'utf-8');
    const data = JSON.parse(content);

    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.name && item.enhancement_override) {
          overrides.set(item.name, item.enhancement_override);
        }
        // Also check nested feats
        if (item.feats) extractFeatOverrides(item.feats, overrides);
        if (item.class_feats) extractFeatOverrides(item.class_feats, overrides);
        if (item.foundations) extractFeatOverrides(item.foundations, overrides);
        if (item.specializations) extractFeatOverrides(item.specializations, overrides);
        if (item.masteries) extractFeatOverrides(item.masteries, overrides);
        // Check hope_feat_enhanced
        if (item.hope_feat_enhanced?.enhancement_override) {
          // Use a composite key for hope feats to avoid collisions if they share names (though unlikely)
          // But looking at restore logic, we use feat.name.
          overrides.set(item.hope_feat_enhanced.name, item.hope_feat_enhanced.enhancement_override);
        }
      }
    }
  } catch (error) {
    console.log(`  ⚠ Could not load existing overrides: ${(error as Error).message}`);
  }

  return overrides;
}

function extractFeatOverrides(feats: Feat[] | undefined, overrides: Map<string, EnhancementBlock>): void {
  if (!feats) return;
  for (const feat of feats) {
    if (feat.name && feat.enhancement_override) {
      overrides.set(feat.name, feat.enhancement_override);
    }
  }
}

/**
 * Enhance a single feat using the shared card parser
 * Returns feat with enhancement block (and preserved override if any)
 */
function enhanceFeat(feat: Feat, overrides: Map<string, EnhancementBlock>): Feat {
  // Convert feat to ability card format for parsing as an Ability
  const asCard = {
    name: feat.name,
    level: '1',
    domain: 'Feature',
    type: 'Ability' as const,
    recall: '0',
    text: feat.text,
  };

  // Parse using shared logic
  // enhanceAbilityCard now returns EnhancedAbilityCard which has the .enhancement block
  const enhanced = enhanceAbilityCard(asCard);
  const enhancementBlock = enhanced.enhancement;

  // Look up any existing override
  const existingOverride = overrides.get(feat.name);
  if (existingOverride) {
    // We don't log here to avoid verbose output for every feat
  }

  // Return feat with enhancement block (and override if exists)
  return {
    name: feat.name,
    text: feat.text,
    enhancement: enhancementBlock,
    ...(existingOverride && { enhancement_override: existingOverride }),
  };
}

/**
 * Enhance a character option entry (ancestry/community) by enhancing all its feats
 */
function enhanceCharacterOption(
  entry: CharacterOption,
  overrides: Map<string, EnhancementBlock>
): CharacterOption {
  if (!entry.feats || !Array.isArray(entry.feats)) {
    return entry;
  }

  return {
    ...entry,
    feats: entry.feats.map(feat => enhanceFeat(feat, overrides)),
  };
}

/**
 * Enhance a class entry by enhancing class_feats and hope_feat
 */
function enhanceClass(
  entry: ClassEntry,
  overrides: Map<string, EnhancementBlock>
): ClassEntry {
  const result: ClassEntry = { ...entry };

  // Enhance class_feats array
  if (entry.class_feats && Array.isArray(entry.class_feats)) {
    result.class_feats = entry.class_feats.map(feat => enhanceFeat(feat, overrides));
  }

  // Enhance hope_feat (stored as separate name/text fields)
  if (entry.hope_feat_name && entry.hope_feat_text) {
    result.hope_feat_enhanced = enhanceFeat({
      name: entry.hope_feat_name,
      text: entry.hope_feat_text,
    }, overrides);
  }

  return result;
}

/**
 * Enhance a subclass entry by enhancing foundations, specializations, and masteries
 */
function enhanceSubclass(
  entry: SubclassEntry,
  overrides: Map<string, EnhancementBlock>
): SubclassEntry {
  const result: SubclassEntry = { ...entry };

  if (entry.foundations && Array.isArray(entry.foundations)) {
    result.foundations = entry.foundations.map(feat => enhanceFeat(feat, overrides));
  }

  if (entry.specializations && Array.isArray(entry.specializations)) {
    result.specializations = entry.specializations.map(feat => enhanceFeat(feat, overrides));
  }

  if (entry.masteries && Array.isArray(entry.masteries)) {
    result.masteries = entry.masteries.map(feat => enhanceFeat(feat, overrides));
  }

  return result;
}

// ============================================================================
// FILE PROCESSING FUNCTIONS
// ============================================================================

function processAbilitiesFile(inputPath: string, outputPath: string): EnhancedCard[] {
  console.log(`Processing abilities: ${path.basename(inputPath)}`);

  try {
    // Load existing overrides BEFORE processing
    const overrides = loadExistingOverrides(outputPath);
    if (overrides.size > 0) {
      console.log(`  📋 Preserving ${overrides.size} existing enhancement_override blocks`);
    }

    const content = fs.readFileSync(inputPath, 'utf-8');
    const abilities: RawAbilityCard[] = JSON.parse(content);

    const enhanced: EnhancedCard[] = abilities.map(card => {
      // Cast raw card to ensure it matches parser expectation
      const enhancedCard = enhanceAbilityCard({
        ...card,
        type: card.type as 'Spell' | 'Ability'
      });

      const enhancementBlock = enhancedCard.enhancement;
      const existingOverride = overrides.get(card.name);

      if (existingOverride) {
        console.log(`  Preserving override for: ${card.name}`);
      }

      return {
        name: card.name,
        level: card.level,
        domain: card.domain,
        type: card.type as 'Spell' | 'Ability',
        recall: card.recall,
        text: card.text,
        enhancement: enhancementBlock,
        ...(existingOverride && { enhancement_override: existingOverride }),
      };
    });

    // Write to output file with pretty formatting
    fs.writeFileSync(outputPath, JSON.stringify(enhanced, null, 2) + '\n');

    console.log(`  ✓ Enhanced ${enhanced.length} cards`);

    // Print stats based on effective enhancement (override or parsed)
    const effectiveTypes = enhanced.map(c =>
      (c.enhancement_override?.action_type || c.enhancement.action_type)
    );
    const stats = {
      total: enhanced.length,
      attacks: effectiveTypes.filter(t => t === 'attack').length,
      other: effectiveTypes.filter(t => t !== 'attack').length,
      withOverrides: enhanced.filter(c => c.enhancement_override).length,
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
  console.log(`Processing ${fileType}: ${path.basename(inputPath)}`);

  try {
    // Load existing overrides BEFORE processing
    const overrides = loadExistingOverrides(outputPath);
    if (overrides.size > 0) {
      console.log(`  📋 Preserving ${overrides.size} existing enhancement_override blocks`);
    }

    const content = fs.readFileSync(inputPath, 'utf-8');
    const entries: CharacterOption[] = JSON.parse(content);

    const enhanced = entries.map(entry => enhanceCharacterOption(entry, overrides));

    // Write to output file with pretty formatting
    fs.writeFileSync(outputPath, JSON.stringify(enhanced, null, 2) + '\n');

    // Collect stats
    const allFeats = enhanced.flatMap(e => e.feats || []);
    const effectiveTypes = allFeats.map(f =>
      f.enhancement_override?.action_type || f.enhancement?.action_type || 'unknown'
    );
    const stats = {
      entries: enhanced.length,
      totalFeats: allFeats.length,
      attacks: effectiveTypes.filter(t => t === 'attack').length,
      other: effectiveTypes.filter(t => t !== 'attack').length,
      withOverrides: allFeats.filter(f => f.enhancement_override).length,
    };

    console.log(`  ✓ Enhanced ${stats.entries} ${fileType} with ${stats.totalFeats} feats`);
    console.log(`  Stats:`, stats);

    return enhanced;
  } catch (error) {
    console.error(`  ✗ Error: ${(error as Error).message}`);
    return [];
  }
}

function processClassesFile(inputPath: string, outputPath: string): ClassEntry[] {
  console.log(`Processing classes: ${path.basename(inputPath)}`);

  try {
    // Load existing overrides BEFORE processing
    const overrides = loadExistingOverrides(outputPath);
    if (overrides.size > 0) {
      console.log(`  📋 Preserving ${overrides.size} existing enhancement_override blocks`);
    }

    const content = fs.readFileSync(inputPath, 'utf-8');
    const entries: ClassEntry[] = JSON.parse(content);

    const enhanced = entries.map(entry => enhanceClass(entry, overrides));

    // Write to output file with pretty formatting
    fs.writeFileSync(outputPath, JSON.stringify(enhanced, null, 2) + '\n');

    // Collect stats
    const allClassFeats = enhanced.flatMap(e => e.class_feats || []);
    const hopeFeats = enhanced.filter(e => e.hope_feat_enhanced).length;
    const effectiveTypes = allClassFeats.map(f =>
      f.enhancement_override?.action_type || f.enhancement?.action_type || 'unknown'
    );
    const stats = {
      entries: enhanced.length,
      totalClassFeats: allClassFeats.length,
      hopeFeats,
      attacks: effectiveTypes.filter(t => t === 'attack').length,
      other: effectiveTypes.filter(t => t !== 'attack').length,
      withOverrides: allClassFeats.filter(f => f.enhancement_override).length,
    };

    console.log(`  ✓ Enhanced ${stats.entries} classes`);
    console.log(`  Stats:`, stats);

    return enhanced;
  } catch (error) {
    console.error(`  ✗ Error: ${(error as Error).message}`);
    return [];
  }
}

function processSubclassesFile(inputPath: string, outputPath: string): SubclassEntry[] {
  console.log(`Processing subclasses: ${path.basename(inputPath)}`);

  try {
    // Load existing overrides BEFORE processing
    const overrides = loadExistingOverrides(outputPath);
    if (overrides.size > 0) {
      console.log(`  📋 Preserving ${overrides.size} existing enhancement_override blocks`);
    }

    const content = fs.readFileSync(inputPath, 'utf-8');
    const entries: SubclassEntry[] = JSON.parse(content);

    const enhanced = entries.map(entry => enhanceSubclass(entry, overrides));

    // Write to output file with pretty formatting
    fs.writeFileSync(outputPath, JSON.stringify(enhanced, null, 2) + '\n');

    // Collect stats
    const allFoundations = enhanced.flatMap(e => e.foundations || []);
    const allSpecializations = enhanced.flatMap(e => e.specializations || []);
    const allMasteries = enhanced.flatMap(e => e.masteries || []);
    const allFeats = [...allFoundations, ...allSpecializations, ...allMasteries];

    const effectiveTypes = allFeats.map(f =>
      f.enhancement_override?.action_type || f.enhancement?.action_type || 'unknown'
    );
    const stats = {
      entries: enhanced.length,
      foundations: allFoundations.length,
      specializations: allSpecializations.length,
      masteries: allMasteries.length,
      totalFeats: allFeats.length,
      attacks: effectiveTypes.filter(t => t === 'attack').length,
      other: effectiveTypes.filter(t => t !== 'attack').length,
      withOverrides: allFeats.filter(f => f.enhancement_override).length,
    };

    console.log(`  ✓ Enhanced ${stats.entries} subclasses`);
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

    // Classes
    {
      type: 'classes',
      input: path.join(projectRoot, 'content/srd/json/classes.json'),
      output: path.join(projectRoot, 'content/srd/json/classes_enhanced.json'),
    },
    {
      type: 'classes',
      input: path.join(projectRoot, 'content/playtest/json/classes.json'),
      output: path.join(projectRoot, 'content/playtest/json/classes_enhanced.json'),
    },

    // Subclasses
    {
      type: 'subclasses',
      input: path.join(projectRoot, 'content/srd/json/subclasses.json'),
      output: path.join(projectRoot, 'content/srd/json/subclasses_enhanced.json'),
    },
    {
      type: 'subclasses',
      input: path.join(projectRoot, 'content/playtest/json/subclasses.json'),
      output: path.join(projectRoot, 'content/playtest/json/subclasses_enhanced.json'),
    },
  ];

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  UNIFIED JSON ENHANCEMENT SCRIPT');
  console.log('  Output format: enhancement + enhancement_override blocks');
  console.log('═══════════════════════════════════════════════════════════\n');

  for (const file of files) {
    if (!fs.existsSync(file.input)) {
      console.log(`⊗ Skipped (not found): ${path.basename(file.input)}\n`);
      continue;
    }

    if (file.type === 'abilities') {
      processAbilitiesFile(file.input, file.output);
    } else if (file.type === 'classes') {
      processClassesFile(file.input, file.output);
    } else if (file.type === 'subclasses') {
      processSubclassesFile(file.input, file.output);
    } else {
      processCharacterOptionsFile(file.input, file.output, file.type);
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✓ COMPLETE');
  console.log('  Note: enhancement_override blocks are preserved.');
  console.log('  Use: card.enhancement_override ?? card.enhancement');
  console.log('═══════════════════════════════════════════════════════════');
}

main();
