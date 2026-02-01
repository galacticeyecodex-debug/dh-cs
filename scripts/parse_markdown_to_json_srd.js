/**
 * JSON SRD PARSER & SQL GENERATOR
 * ----------------------------------------------------------------------------
 * This script transforms raw JSON data (the Daggerheart System Reference Document)
 * into a SQL seed file for the Supabase database.
 *
 * FUNCTIONALITY:
 * - Reads multiple JSON files (classes, ancestries, weapons, etc.) from the `srd/json` directory.
 * - Parses textual content, including extracting stat modifiers using Regex logic.
 * - Generates properly escaped SQL `INSERT` statements for the `library` table.
 * - Handles data normalization, slug generation for IDs, and relationship linking
 *   (e.g., connecting Subclasses to their parent Classes).
 * - Outputs the final result to `supabase/seed_library.sql`.
 *
 * SUPPORTED PATTERNS (Option B Implementation):
 * ✅ Attack modifiers: "+1 to attack rolls", "-1 to attack roll"
 * ✅ Damage modifiers: "+2 to damage", "+1 to damage rolls"
 * ✅ Stat modifiers: "+1 to Agility", "-2 to Evasion", "+3 to Hit Points"
 * ✅ Multi-modifiers: "-1 to Evasion; +1 to Strength" (semicolon or newline separated)
 * ❌ Conditional modifiers: "on a successful attack, ..." (cannot parse)
 * ❌ Dice modifications: "roll an additional damage die" (cannot parse)
 * ❌ Complex abilities: "Mark a Stress to gain advantage" (cannot parse)
 *
 * DUPLICATE LOGIC WARNING:
 * - This script contains logic for parsing modifiers (RegEx) that is IDENTICAL to
 *   `lib/modifier-parser.ts`.
 * - This script is used for SEEDING static data (database initialization).
 * - `lib/modifier-parser.ts` is intended for RUNTIME parsing (e.g., user-created homebrew).
 * - If you update the parsing logic here, you MUST update it in `lib/modifier-parser.ts` as well
 *   to ensure consistency between official content and dynamically parsed content.
 *
 * USAGE:
 * - Run via Node.js (e.g., `node scripts/parse_json_srd.js`) whenever the source JSON
 *   data is updated to refresh the database seed file.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // Native in Node 19+, check version or use fallback

const JSON_DIR = path.join(__dirname, '../content/public/srd/json');
const OUTPUT_PATH = path.join(__dirname, '../supabase/seed_library.sql');

// --- Modifier Parsing Logic ---
const STAT_MODIFIER_REGEX = /([+-]?\d+)\s+(?:to|bonus\s+to)\s+(Agility|Strength|Finesse|Instinct|Presence|Knowledge|Evasion|Armor|Hit\s+Points|Stress|Hope|Proficiency)/i;
// e.g. "+1 to Evasion", "-1 to Agility", "+2 bonus to Strength"

const ATTACK_MODIFIER_REGEX = /([+-]?\d+)\s+(?:to|bonus\s+to)\s+attack\s+rolls?/i;
// e.g. "+1 to attack rolls", "-1 to attack roll"

const DAMAGE_MODIFIER_REGEX = /([+-]?\d+)\s+(?:to|bonus\s+to)\s+damage(?:\s+rolls?)?/i;
// e.g. "+2 to damage", "+1 to damage rolls"

function parseModifiers(text) {
  const modifiers = [];
  if (!text) return modifiers;

  // Split text by semicolons or newlines
  const segments = text.split(/[;\n]/);

  segments.forEach(segment => {
    const cleanSegment = segment.trim();
    if (!cleanSegment) return;

    // 1. Attack Roll Modifiers
    const attackMatch = cleanSegment.match(ATTACK_MODIFIER_REGEX);
    if (attackMatch) {
      const value = parseInt(attackMatch[1]);
      modifiers.push({
        id: crypto.randomUUID(),
        type: 'combat',
        target: 'attack',
        value: value,
        operator: value >= 0 ? 'add' : 'subtract',
        description: cleanSegment
      });
      return; // Skip to next segment
    }

    // 2. Damage Modifiers
    const damageMatch = cleanSegment.match(DAMAGE_MODIFIER_REGEX);
    if (damageMatch) {
      const value = parseInt(damageMatch[1]);
      modifiers.push({
        id: crypto.randomUUID(),
        type: 'combat',
        target: 'damage',
        value: value,
        operator: value >= 0 ? 'add' : 'subtract',
        description: cleanSegment
      });
      return; // Skip to next segment
    }

    // 3. Simple Stat Modifiers
    const statMatch = cleanSegment.match(STAT_MODIFIER_REGEX);
    if (statMatch) {
      const value = parseInt(statMatch[1]);
      const rawStat = statMatch[2].toLowerCase().replace(/\s+/g, '_'); // 'hit points' -> 'hit_points'

      let target = rawStat;
      if (rawStat === 'hit_points') target = 'hp';
      if (rawStat === 'armor_score') target = 'armor'; // normalize if regex matched armor score

      modifiers.push({
        id: crypto.randomUUID(),
        type: 'stat',
        target: target,
        value: value,
        operator: value >= 0 ? 'add' : 'subtract',
        description: cleanSegment
      });
      return; // Skip to next segment
    }

    // Future: Add Conditional Logic parsing here
  });

  return modifiers;
}
// ------------------------------

const escapeSql = (str) => {
  if (!str) return '';
  // Replace single quotes with two single quotes for SQL escaping
  return str.replace(/'/g, "''");
};

const slugify = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
};

const createInsert = (id, type, name, domain, tier, data) => {
  const json = JSON.stringify(data).replace(/'/g, "''");
  const domainVal = domain ? `'${escapeSql(domain)}'` : 'NULL';
  const tierVal = tier ? tier : 'NULL';
  const nameVal = escapeSql(name);

  return `INSERT INTO public.library (id, type, name, domain, tier, data) VALUES ('${id}', '${type}', '${nameVal}', ${domainVal}, ${tierVal}, '${json}'::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, name = EXCLUDED.name, domain = EXCLUDED.domain, tier = EXCLUDED.tier;`;
};

let sqlOutput = [];

function processClasses() {
  const filePath = path.join(JSON_DIR, 'classes.json');
  if (!fs.existsSync(filePath)) return;

  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));

  items.forEach(item => {
    const id = `class-${slugify(item.name)}`;
    const data = {
      description: item.description,
      starting_evasion: parseInt(item.evasion) || 0,
      starting_hp: parseInt(item.hp) || 0,
      items_text: item.items,
      domains: [item.domain_1, item.domain_2].filter(Boolean),
      hope_feature: {
        name: item.hope_feat_name,
        description: item.hope_feat_text
      },
      class_features: item.class_feats || [], // Directly use the array from JSON
      subclass_names: [item.subclass_1, item.subclass_2].filter(Boolean),
      suggested: {
        traits: item.suggested_traits,
        primary_weapon: item.suggested_primary,
        secondary_weapon: item.suggested_secondary,
        armor: item.suggested_armor
      },
      background_questions: item.backgrounds || [],
      connection_questions: item.connections || []
    };

    sqlOutput.push(createInsert(id, 'class', item.name, null, null, data));
  });
}

function processSubclasses() {
  const filePath = path.join(JSON_DIR, 'subclasses.json');
  if (!fs.existsSync(filePath)) return;

  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));

  items.forEach(item => {
    const id = `subclass-${slugify(item.name)}`;

    // Attempt to map parent class by checking class descriptions or subclass lists in class objects?
    // For now, we rely on the matching Logic in the app or manual map if needed. 
    // But actually, the class objects listed subclass names!
    // Ideally we'd link them here, but the subclass JSON doesn't have "parent_class".
    // We can infer it later or just store the data.

    const data = {
      description: item.description,
      spellcast_trait: item.spellcast_trait,
      foundation_features: item.foundations || [],
      specialization_features: item.specializations || [],
      mastery_features: item.masteries || [],
      extras: item.extras
    };

    sqlOutput.push(createInsert(id, 'subclass', item.name, null, null, data));
  });
}

function processAncestries() {
  const filePath = path.join(JSON_DIR, 'ancestries.json');
  if (!fs.existsSync(filePath)) return;

  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));

  items.forEach(item => {
    const id = `ancestry-${slugify(item.name)}`;
    const data = {
      description: item.description,
      features: item.feats || []
    };
    sqlOutput.push(createInsert(id, 'ancestry', item.name, null, null, data));
  });
}

function processCommunities() {
  const filePath = path.join(JSON_DIR, 'communities.json');
  if (!fs.existsSync(filePath)) return;

  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));

  items.forEach(item => {
    const id = `community-${slugify(item.name)}`;
    const data = {
      description: item.description,
      note: item.note,
      features: item.feats || []
    };
    sqlOutput.push(createInsert(id, 'community', item.name, null, null, data));
  });
}

function processAbilities() {
  const filePath = path.join(JSON_DIR, 'abilities.json');
  if (!fs.existsSync(filePath)) return;

  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));

  items.forEach(item => {
    const type = item.type ? item.type.toLowerCase() : 'ability';
    const domain = item.domain;
    const id = `${type}-${slugify(domain)}-${slugify(item.name)}`;
    const tier = parseInt(item.level) || 1;

    const data = {
      description: item.text,
      recall_cost: parseInt(item.recall) || 0,
      level: tier
    };

    sqlOutput.push(createInsert(id, type, item.name, domain, tier, data));
  });
}

function processWeapons() {
  const filePath = path.join(JSON_DIR, 'weapons.json');
  if (!fs.existsSync(filePath)) return;

  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));

  items.forEach(item => {
    const id = `weapon-${slugify(item.name)}`;
    const tier = parseInt(item.tier) || 1;

    const data = {
      type: item.physical_or_magical,
      hand: item.primary_or_secondary,
      trait: item.trait,
      range: item.range,
      damage: item.damage ? item.damage.replace(/\s*(?:phy|mag|physical|magic)\s*/gi, '').trim() : '',
      burden: item.burden,
      feature: {
        name: item.feat_name,
        text: item.feat_text
      },
      modifiers: parseModifiers(item.feat_text) // Add parsed modifiers
    };

    // Debug log to verify replacement
    if (item.damage && item.damage !== data.damage) {
      // console.log(`Cleaned damage for ${item.name}: "${item.damage}" -> "${data.damage}"`);
    }

    sqlOutput.push(createInsert(id, 'weapon', item.name, null, tier, data));
  });
}

function processArmor() {
  const filePath = path.join(JSON_DIR, 'armor.json');
  if (!fs.existsSync(filePath)) return;

  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));

  items.forEach(item => {
    const id = `armor-${slugify(item.name)}`;
    const tier = parseInt(item.tier) || 1;

    const data = {
      base_score: parseInt(item.base_score) || 0,
      base_thresholds: item.base_thresholds,
      feature: {
        name: item.feat_name,
        text: item.feat_text
      },
      modifiers: parseModifiers(item.feat_text) // Add parsed modifiers
    };

    sqlOutput.push(createInsert(id, 'armor', item.name, null, tier, data));
  });
}

function processConsumables() {
  const filePath = path.join(JSON_DIR, 'consumables.json');
  if (!fs.existsSync(filePath)) return;

  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));

  items.forEach(item => {
    const id = `consumable-${slugify(item.name)}`;
    const data = {
      description: item.description
    };
    sqlOutput.push(createInsert(id, 'consumable', item.name, null, null, data));
  });
}

function processAdversaries() {
  const filePath = path.join(JSON_DIR, 'adversaries.json');
  if (!fs.existsSync(filePath)) return;

  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));

  items.forEach(item => {
    const id = `adversary-${slugify(item.name)}`;
    const tier = parseInt(item.tier) || 1;

    const data = {
      description: item.description,
      motives: item.motives_and_tactics,
      difficulty: item.difficulty,
      thresholds: item.thresholds,
      hp: item.hp,
      stress: item.stress,
      attack: {
        modifier: item.atk,
        name: item.attack,
        range: item.range,
        damage: item.damage
      },
      features: item.feats || []
    };

    sqlOutput.push(createInsert(id, 'adversary', item.name, null, tier, data));
  });
}

function processDomains() {
  const filePath = path.join(JSON_DIR, 'domains.json');
  if (!fs.existsSync(filePath)) return;

  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));

  items.forEach(item => {
    const id = `domain-${slugify(item.name)}`;
    const data = {
      description: item.description
    };
    sqlOutput.push(createInsert(id, 'domain', item.name, null, null, data));
  });
}

/**
 * Extracts a section by its title from markdown (supports H2 and H3).
 * Returns { title, content } or null if not found.
 */
function extractSectionByTitle(markdown, targetTitle) {
  if (!markdown || !targetTitle) return null;

  // Normalize line endings
  markdown = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Build regex to find the target section (supports #, ## or ### headers, case-insensitive)
  const escapedTitle = targetTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sectionRegex = new RegExp(`^(#{1,3})\\s+${escapedTitle}\\s*$`, 'im');
  const match = markdown.match(sectionRegex);

  if (!match) return null;

  const headerLevel = match[1].length; // 1 for #, 2 for ##, 3 for ###
  const sectionStart = match.index + match[0].length;
  const restOfDoc = markdown.substring(sectionStart);

  // Find next header at same or higher level (fewer or equal #)
  // For H1, stop at next H1
  // For H2, stop at next H1 or H2
  // For H3, stop at next H1, H2, or H3
  const nextHeaderRegex = headerLevel === 1
    ? /^#{1}\s+/m      // Stop at H1
    : headerLevel === 2
      ? /^#{1,2}\s+/m  // Stop at H1 or H2
      : /^#{1,3}\s+/m; // Stop at H1, H2, or H3

  const nextHeaderMatch = restOfDoc.match(nextHeaderRegex);
  const contentEnd = nextHeaderMatch ? restOfDoc.indexOf(nextHeaderMatch[0]) : restOfDoc.length;

  const content = restOfDoc.substring(0, contentEnd).trim();

  if (content) {
    return { title: targetTitle, content };
  }

  return null;
}

/**
 * Extracts a bullet point definition by keyword.
 * Looks for lines like "- **Keyword** description..."
 */
function extractBulletByKeyword(markdown, keyword) {
  if (!markdown || !keyword) return null;

  // Normalize line endings
  markdown = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Find lines that start with "- **Keyword" (with optional text after keyword)
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const bulletRegex = new RegExp(`^-\\s+\\*\\*${escapedKeyword}[^*]*\\*\\*(.+)$`, 'im');
  const match = markdown.match(bulletRegex);

  if (!match) return null;

  // The content is everything after **Keyword**
  const content = match[0].replace(/^-\s+/, '').trim();

  if (content) {
    return { title: keyword, content };
  }

  return null;
}

/**
 * Extracts all content after H1 title.
 * @param {string} markdown - The markdown content
 * @param {boolean} includeSubsections - If true, includes all content including H2+ sections
 */
function extractH1Content(markdown, includeSubsections = false) {
  if (!markdown) return null;

  // Normalize line endings
  markdown = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const h1Match = markdown.match(/^#\s+(.+?)$/m);
  if (!h1Match) return null;

  const h1Title = h1Match[1].trim();
  const contentStart = h1Match.index + h1Match[0].length;

  const restOfDoc = markdown.substring(contentStart);

  let content;
  if (includeSubsections) {
    // Include everything after H1 (all subsections)
    content = restOfDoc.trim();
  } else {
    // Find next header (H1 or H2) and stop there
    const nextHeaderMatch = restOfDoc.match(/^##+\s+/m);
    const contentEnd = nextHeaderMatch ? restOfDoc.indexOf(nextHeaderMatch[0]) : restOfDoc.length;
    content = restOfDoc.substring(0, contentEnd).trim();
  }

  if (content) {
    return { title: h1Title, content };
  }

  return null;
}

/**
 * Generates SRD rules JSON from markdown files in the SRD directory.
 * Creates content/public/srd/json/srd_rules.json from markdown sources.
 * Uses title-based matching for reliability.
 */
function generateSRDRulesFromMarkdown() {
  const srdMarkdownDir = path.join(__dirname, '../content/public/srd/markdown/contents');
  const outputPath = path.join(JSON_DIR, 'srd_rules.json');

  if (!fs.existsSync(srdMarkdownDir)) {
    console.log('SRD markdown directory not found, skipping SRD rules generation');
    return;
  }

  const rules = [];

  // Define rules with title-based matching for accuracy
  // Format: { file, key, sectionTitle?, useH1Content?, extractBullet? }
  const ruleDefinitions = [
    // === TRAITS ===
    { file: 'Character Creation.md', key: 'traits.general', sectionTitle: 'STEP 3: ASSIGN CHARACTER TRAITS' },

    // === VITALS ===
    // HP and Evasion are brief bullet points in STEP 4, so we extract specific bullets
    { file: 'Character Creation.md', key: 'vitals.hitPoints', extractBullet: 'Hit Points' },
    { file: 'Stress.md', key: 'vitals.stress', useH1Content: true },
    { file: 'Making Moves and Taking Action.md', key: 'vitals.hope', sectionTitle: 'HOPE' },
    { file: 'Character Creation.md', key: 'vitals.evasion', extractBullet: 'Evasion' },

    // === COMBAT ===
    { file: 'Attacking.md', key: 'combat.attacking', useFullFile: true },
    { file: 'Attacking.md', key: 'combat.attackRolls', useFullFile: 'ATTACK ROLLS' },
    { file: 'Attacking.md', key: 'combat.damageRolls', sectionTitle: 'DAMAGE ROLLS' },
    { file: 'Attacking.md', key: 'combat.criticalDamage', sectionTitle: 'CRITICAL DAMAGE' },

    // === EQUIPMENT ===
    { file: 'Equipment.md', key: 'equipment.weapons', useH1Content: true },
    { file: 'Equipment.md', key: 'equipment.armor', useH1Content: true },
    { file: 'Equipment.md', key: 'equipment.general', useH1Content: true },

    // === DOMAINS ===
    { file: 'Classes.md', key: 'domains.loadoutVault', sectionTitle: 'LOADOUT & VAULT' },
    { file: 'Classes.md', key: 'domains.recallCost', sectionTitle: 'DOMAIN CARD ANATOMY' },

    // === CHARACTER ===
    { file: 'Character Creation.md', key: 'character.experiences', sectionTitle: 'STEP 7: CREATE YOUR EXPERIENCES' },
    { file: 'Communities.md', key: 'character.community', useFullFile: true },
    { file: 'Ancestries.md', key: 'character.ancestry', useFullFile: true },
    { file: 'Classes.md', key: 'character.class', sectionTitle: 'CLASSES' },
    { file: 'Classes.md', key: 'character.subclass', sectionTitle: 'SUBCLASSES' },
  ];

  ruleDefinitions.forEach(def => {
    const filePath = path.join(srdMarkdownDir, def.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Skipping: File not found: ${def.file} (for rule ${def.key})`);
      return;
    }

    const markdown = fs.readFileSync(filePath, 'utf8');
    let section = null;

    if (def.extractBullet) {
      // Extract a specific bullet point definition
      section = extractBulletByKeyword(markdown, def.extractBullet);
    } else if (def.useFullFile) {
      // Extract ALL content after H1 including all subsections
      section = extractH1Content(markdown, true);
    } else if (def.useH1Content) {
      // Extract content under H1 (only content before first H2)
      section = extractH1Content(markdown, false);
    } else if (def.sectionTitle) {
      // Extract by section title
      section = extractSectionByTitle(markdown, def.sectionTitle);
    }

    if (!section || !section.content) {
      console.warn(`⚠️  Skipping: No content found for ${def.key} in ${def.file} (looking for: ${def.sectionTitle || def.extractBullet || 'H1 content'})`);
      return;
    }

    rules.push({
      key: def.key,
      title: section.title,
      source_file: def.file,
      source_section: section.title,
      content: section.content
    });

    console.log(`✓ Extracted ${def.key} from ${def.file} [${section.title}]`);
  });

  // Write the generated rules to srd_rules.json
  fs.writeFileSync(outputPath, JSON.stringify(rules, null, 2));
  console.log(`✓ Generated ${rules.length} SRD rules from markdown files`);
}

function processSRDRules() {
  const filePath = path.join(JSON_DIR, 'srd_rules.json');
  if (!fs.existsSync(filePath)) return;

  const items = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));

  items.forEach(item => {
    const id = `srd-rule-${slugify(item.key)}`;
    const data = {
      key: item.key,
      title: item.title,
      content: item.content,
      source_file: item.source_file,
      source_section: item.source_section
    };
    sqlOutput.push(createInsert(id, 'srd_rule', item.title, null, null, data));
  });
}

// Post-processing to link subclasses to classes based on name matching
function linkSubclassesToClasses() {
  // This function would ideally read the class items, find the subclass IDs, and update the subclass entries
  // For simplicity in this SQL generation script, we rely on the app logic or a more complex join.
  // However, we can create a map here if we process classes first.

  // Since we push to sqlOutput immediately, we can't easily update previous entries without finding them in the array.
  // But we CAN use the class data to emit updates for subclasses!

  const classFilePath = path.join(JSON_DIR, 'classes.json');
  if (!fs.existsSync(classFilePath)) return;
  const classes = JSON.parse(fs.readFileSync(classFilePath, 'utf8').replace(/^\uFEFF/, ''));

  classes.forEach(cls => {
    const classId = `class-${slugify(cls.name)}`;
    const subclasses = [cls.subclass_1, cls.subclass_2].filter(Boolean);

    subclasses.forEach(subName => {
      const subId = `subclass-${slugify(subName)}`;
      // Update the subclass entry's JSON to include parent_class_id
      // We use a SQL update for this.
      const updateSql = `UPDATE public.library SET data = jsonb_set(data, '{parent_class_id}', '${JSON.stringify(classId)}') WHERE id = '${subId}';`;
      sqlOutput.push(updateSql);
    });
  });
}


try {
  console.log('Starting SRD generation...');
  // STEP 1: Generate srd_rules.json from markdown files
  generateSRDRulesFromMarkdown();

  console.log('Starting JSON parse...');
  // STEP 2: Parse all JSON files and generate SQL
  processClasses();
  processSubclasses();
  processAncestries();
  processCommunities();
  processDomains();
  processAbilities();
  processWeapons();
  processArmor();
  processConsumables();
  processAdversaries();
  processSRDRules();

  linkSubclassesToClasses(); // Add the linking SQL at the end

  const header = `-- Daggerheart Library Seed Data
-- Generated by scripts/parse_json_srd.js
-- Run this AFTER schema.sql to populate the library table.

`;
  fs.writeFileSync(OUTPUT_PATH, header + sqlOutput.join('\n'));
  console.log(`Successfully generated SQL seed at: ${OUTPUT_PATH}`);
  console.log(`Total entries: ${sqlOutput.length}`);
} catch (e) {
  console.error('Error parsing:', e);
  process.exit(1);
}