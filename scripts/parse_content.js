/**
 * CONTENT PARSER & SQL GENERATOR
 * ----------------------------------------------------------------------------
 * This script transforms raw JSON data from multiple content sources (SRD, Playtest, etc.)
 * into a SQL seed file for the Supabase database.
 *
 * FUNCTIONALITY:
 * - Reads JSON files from multiple content directories under `content/{source}/json`
 * - Supports different content sources: srd, playtest, homebrew
 * - Parses textual content, including extracting stat modifiers using Regex logic.
 * - Generates properly escaped SQL `INSERT` statements for the `library` table.
 * - Handles data normalization, slug generation for IDs, and relationship linking
 * - Outputs the final result to `supabase/seed_library.sql`.
 *
 * CONTENT SOURCES:
 * - srd: Official System Reference Document content
 * - playtest: "The Void" playtest material (Blood Hunter, Witch, Brawler, etc.)
 * - homebrew: (Future) Curated community content
 *
 * USAGE:
 * - Run via Node.js: `node scripts/parse_content.js`
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Content source configurations
const CONTENT_ROOT = path.join(__dirname, '../content');
const CONTENT_SOURCES = [
  { folder: 'srd', source: 'srd' },
  { folder: 'playtest', source: 'playtest' },
];

const OUTPUT_PATH = path.join(__dirname, '../supabase/seed_library.sql');

// --- Modifier Parsing Logic ---
const STAT_MODIFIER_REGEX = /([+-]?\d+)\s+(?:to|bonus\s+to)\s+(Agility|Strength|Finesse|Instinct|Presence|Knowledge|Evasion|Armor|Hit\s+Points|Stress|Hope|Proficiency)/i;
const ATTACK_MODIFIER_REGEX = /([+-]?\d+)\s+(?:to|bonus\s+to)\s+attack\s+rolls?/i;
const DAMAGE_MODIFIER_REGEX = /([+-]?\d+)\s+(?:to|bonus\s+to)\s+damage(?:\s+rolls?)?/i;

function parseModifiers(text) {
  const modifiers = [];
  if (!text) return modifiers;

  const segments = text.split(/[;\n]/);

  segments.forEach(segment => {
    const cleanSegment = segment.trim();
    if (!cleanSegment) return;

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
      return;
    }

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
      return;
    }

    const statMatch = cleanSegment.match(STAT_MODIFIER_REGEX);
    if (statMatch) {
      const value = parseInt(statMatch[1]);
      const rawStat = statMatch[2].toLowerCase().replace(/\s+/g, '_');

      let target = rawStat;
      if (rawStat === 'hit_points') target = 'hp';
      if (rawStat === 'armor_score') target = 'armor';

      modifiers.push({
        id: crypto.randomUUID(),
        type: 'stat',
        target: target,
        value: value,
        operator: value >= 0 ? 'add' : 'subtract',
        description: cleanSegment
      });
      return;
    }
  });

  return modifiers;
}

const escapeSql = (str) => {
  if (!str) return '';
  return str.replace(/'/g, "''");
};

const slugify = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
};

// Updated to include source field
const createInsert = (id, type, name, domain, tier, source, data) => {
  const json = JSON.stringify(data).replace(/'/g, "''");
  const domainVal = domain ? `'${escapeSql(domain)}'` : 'NULL';
  const tierVal = tier ? tier : 'NULL';
  const nameVal = escapeSql(name);
  const sourceVal = source || 'srd';

  return `INSERT INTO public.library (id, type, name, domain, tier, source, data) VALUES ('${id}', '${type}', '${nameVal}', ${domainVal}, ${tierVal}, '${sourceVal}', '${json}'::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, name = EXCLUDED.name, domain = EXCLUDED.domain, tier = EXCLUDED.tier, source = EXCLUDED.source;`;
};

let sqlOutput = [];

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function processClasses(jsonDir, source) {
  const filePath = path.join(jsonDir, 'classes.json');
  const items = readJsonFile(filePath);
  if (!items) return;

  items.forEach(item => {
    const id = `class-${slugify(item.name)}`;

    // Handle classes with more than 2 subclasses (e.g., Blood Hunter has 3)
    const subclassNames = [];
    if (item.subclass_1) subclassNames.push(item.subclass_1);
    if (item.subclass_2) subclassNames.push(item.subclass_2);
    if (item.subclass_3) subclassNames.push(item.subclass_3);

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
      class_features: item.class_feats || [],
      subclass_names: subclassNames,
      suggested: {
        traits: item.suggested_traits,
        primary_weapon: item.suggested_primary,
        secondary_weapon: item.suggested_secondary,
        armor: item.suggested_armor
      },
      background_questions: item.backgrounds || [],
      connection_questions: item.connections || [],
      // Playtest-specific fields
      extras: item.extras || null
    };

    sqlOutput.push(createInsert(id, 'class', item.name, null, null, source, data));
  });
}

function processSubclasses(jsonDir, source) {
  const filePath = path.join(jsonDir, 'subclasses.json');
  const items = readJsonFile(filePath);
  if (!items) return;

  items.forEach(item => {
    const id = `subclass-${slugify(item.name)}`;

    const data = {
      description: item.description,
      spellcast_trait: item.spellcast_trait,
      foundation_features: item.foundations || [],
      specialization_features: item.specializations || [],
      mastery_features: item.masteries || [],
      extras: item.extras
    };

    sqlOutput.push(createInsert(id, 'subclass', item.name, null, null, source, data));
  });
}

function processAncestries(jsonDir, source) {
  const filePath = path.join(jsonDir, 'ancestries.json');
  const items = readJsonFile(filePath);
  if (!items) return;

  items.forEach(item => {
    const id = `ancestry-${slugify(item.name)}`;
    const data = {
      description: item.description,
      features: item.feats || []
    };
    sqlOutput.push(createInsert(id, 'ancestry', item.name, null, null, source, data));
  });
}

function processCommunities(jsonDir, source) {
  const filePath = path.join(jsonDir, 'communities.json');
  const items = readJsonFile(filePath);
  if (!items) return;

  items.forEach(item => {
    const id = `community-${slugify(item.name)}`;
    const data = {
      description: item.description,
      note: item.note,
      features: item.feats || []
    };
    sqlOutput.push(createInsert(id, 'community', item.name, null, null, source, data));
  });
}

function processAbilities(jsonDir, source) {
  const filePath = path.join(jsonDir, 'abilities.json');
  const items = readJsonFile(filePath);
  if (!items) return;

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

    sqlOutput.push(createInsert(id, type, item.name, domain, tier, source, data));
  });
}

function processWeapons(jsonDir, source) {
  const filePath = path.join(jsonDir, 'weapons.json');
  const items = readJsonFile(filePath);
  if (!items) return;

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
      modifiers: parseModifiers(item.feat_text)
    };

    sqlOutput.push(createInsert(id, 'weapon', item.name, null, tier, source, data));
  });
}

function processArmor(jsonDir, source) {
  const filePath = path.join(jsonDir, 'armor.json');
  const items = readJsonFile(filePath);
  if (!items) return;

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
      modifiers: parseModifiers(item.feat_text)
    };

    sqlOutput.push(createInsert(id, 'armor', item.name, null, tier, source, data));
  });
}

function processConsumables(jsonDir, source) {
  const filePath = path.join(jsonDir, 'consumables.json');
  const items = readJsonFile(filePath);
  if (!items) return;

  items.forEach(item => {
    const id = `consumable-${slugify(item.name)}`;
    const data = {
      description: item.description
    };
    sqlOutput.push(createInsert(id, 'consumable', item.name, null, null, source, data));
  });
}

function processAdversaries(jsonDir, source) {
  const filePath = path.join(jsonDir, 'adversaries.json');
  const items = readJsonFile(filePath);
  if (!items) return;

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

    sqlOutput.push(createInsert(id, 'adversary', item.name, null, tier, source, data));
  });
}

function processDomains(jsonDir, source) {
  const filePath = path.join(jsonDir, 'domains.json');
  const items = readJsonFile(filePath);
  if (!items) return;

  items.forEach(item => {
    const id = `domain-${slugify(item.name)}`;
    const data = {
      description: item.description
    };
    sqlOutput.push(createInsert(id, 'domain', item.name, null, null, source, data));
  });
}

function processItems(jsonDir, source) {
  const filePath = path.join(jsonDir, 'items.json');
  const items = readJsonFile(filePath);
  if (!items) return;

  items.forEach(item => {
    const id = `item-${slugify(item.name)}`;
    const data = {
      description: item.description,
      feature: item.feat_text
    };
    sqlOutput.push(createInsert(id, 'item', item.name, null, null, source, data));
  });
}

function processEnvironments(jsonDir, source) {
  const filePath = path.join(jsonDir, 'environments.json');
  const items = readJsonFile(filePath);
  if (!items) return;

  items.forEach(item => {
    const id = `environment-${slugify(item.name)}`;
    const tier = parseInt(item.tier) || 1;

    const data = {
      description: item.description,
      impulse: item.impulse,
      features: item.feats || []
    };

    sqlOutput.push(createInsert(id, 'environment', item.name, null, tier, source, data));
  });
}

function processTransformations(jsonDir, source) {
  const filePath = path.join(jsonDir, 'transformations.json');
  const items = readJsonFile(filePath);
  if (!items) return;

  items.forEach(item => {
    const id = `transformation-${slugify(item.name)}`;
    const data = {
      description: item.description,
      features: item.features || [],
      questions: item.questions || []
    };
    sqlOutput.push(createInsert(id, 'transformation', item.name, null, null, source, data));
  });
}

// Link subclasses to their parent classes
function linkSubclassesToClasses(jsonDir) {
  const classFilePath = path.join(jsonDir, 'classes.json');
  const classes = readJsonFile(classFilePath);
  if (!classes) return;

  classes.forEach(cls => {
    const classId = `class-${slugify(cls.name)}`;
    const subclasses = [cls.subclass_1, cls.subclass_2, cls.subclass_3].filter(Boolean);

    subclasses.forEach(subName => {
      const subId = `subclass-${slugify(subName)}`;
      const updateSql = `UPDATE public.library SET data = jsonb_set(data, '{parent_class_id}', '${JSON.stringify(classId)}') WHERE id = '${subId}';`;
      sqlOutput.push(updateSql);
    });
  });
}

// Process all content for a single source
function processContentSource(sourceConfig) {
  const { folder, source } = sourceConfig;
  const jsonDir = path.join(CONTENT_ROOT, folder, 'json');

  if (!fs.existsSync(jsonDir)) {
    console.log(`Skipping ${source}: directory not found at ${jsonDir}`);
    return;
  }

  console.log(`Processing ${source} content from ${jsonDir}...`);

  processClasses(jsonDir, source);
  processSubclasses(jsonDir, source);
  processAncestries(jsonDir, source);
  processCommunities(jsonDir, source);
  processDomains(jsonDir, source);
  processAbilities(jsonDir, source);
  processWeapons(jsonDir, source);
  processArmor(jsonDir, source);
  processConsumables(jsonDir, source);
  processAdversaries(jsonDir, source);
  processItems(jsonDir, source);
  processEnvironments(jsonDir, source);
  processTransformations(jsonDir, source);

  // Link subclasses after processing
  linkSubclassesToClasses(jsonDir);
}

// Main execution
try {
  console.log('Starting content parse...');
  console.log(`Content root: ${CONTENT_ROOT}`);
  console.log(`Output path: ${OUTPUT_PATH}`);
  console.log('');

  // Process each content source
  CONTENT_SOURCES.forEach(sourceConfig => {
    processContentSource(sourceConfig);
  });

  const header = `-- Daggerheart Library Seed Data
-- Generated by scripts/parse_content.js
-- Run this AFTER schema.sql to populate the library table.
--
-- Content Sources:
-- - srd: Official System Reference Document
-- - playtest: "The Void" playtest material
--
-- Generated at: ${new Date().toISOString()}

`;

  fs.writeFileSync(OUTPUT_PATH, header + sqlOutput.join('\n'));

  console.log('');
  console.log(`Successfully generated SQL seed at: ${OUTPUT_PATH}`);
  console.log(`Total entries: ${sqlOutput.length}`);

  // Count by source
  const srdCount = sqlOutput.filter(s => s.includes("'srd'")).length;
  const playtestCount = sqlOutput.filter(s => s.includes("'playtest'")).length;
  console.log(`  - SRD entries: ${srdCount}`);
  console.log(`  - Playtest entries: ${playtestCount}`);

} catch (e) {
  console.error('Error parsing content:', e);
  process.exit(1);
}
