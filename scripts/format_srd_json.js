/**
 * BOLD SRD JSON TERMINOLOGY
 * ----------------------------------------------------------------------------
 * This script scans all JSON files in `content/srd/json` and `content/playtest/json`
 * and adds Markdown bolding (**text**) to specific game mechanics: Resources, 
 * Damage Rolls, and Action Rolls.
 * 
 * It uses negative lookahead and lookbehind to ensure it doesn't double-bold
 * patterns that are already bolded.
 * 
 * USAGE: node scripts/bold_srd_json.js
 */

const fs = require('fs');
const path = require('path');

const JSON_DIRS = [
  path.join(__dirname, '../content/srd/json'),
  path.join(__dirname, '../content/playtest/json')
];

/**
 * 1. RESOURCES REGEX
 * Targets: 
 * - "Mark [a/an/any/another/etc] Stress"
 * - "Spend [a/an/any/another/etc] Hope"
 * - "Spend [a/an/any/another/etc] Fear"
 */
const RESOURCE_REGEX = /(?<!\*\*)(Mark\s+[^.!?\n]{1,30}?Stress|Spend\s+[^.!?\n]{1,30}?(?:Hope|Fear))(?<!\*\*)/gi;

/**
 * 2. DAMAGE ROLLS REGEX
 * Targets: Standard dice notation (e.g., d6, 2d8, d10+3, d12s)
 */
const DAMAGE_ROLL_REGEX = /(?<!\*\*)(\b\d*d\d+(?:\s*[+-]\s*\d+)?s?\b)(?<!\*\*)/gi;

/**
 * 3. ACTION ROLLS REGEX
 * Targets: Trait-specific rolls and their difficulties (e.g., Presence Roll, Strength Roll (15), Spellcast Roll, Action Roll, Reaction Roll)
 */
const ACTION_ROLL_REGEX = /(?<!\*\*)(\b(?:Agility|Strength|Finesse|Instinct|Presence|Knowledge|Spellcast|Action|Reaction)\s+(?:Reaction\s+)?Rolls?(?:\s*\([\d dX]+\))?)(?!\*\*)/gi;

/**
 * Applies all bolding patterns to a string.
 */
function boldPatterns(text) {
  if (typeof text !== 'string') return text;
  
  let newText = text;
  
  // First, unbold existing action rolls to handle cases where they were partially bolded
  // (e.g., "**Spellcast Roll** (15)" -> "Spellcast Roll (15)")
  newText = newText.replace(/\*\*((?:Agility|Strength|Finesse|Instinct|Presence|Knowledge|Spellcast|Action|Reaction)\s+(?:Reaction\s+)?Rolls?)\*\*/gi, '$1');

  newText = newText.replace(RESOURCE_REGEX, '**$1**');
  newText = newText.replace(DAMAGE_ROLL_REGEX, '**$1**');
  newText = newText.replace(ACTION_ROLL_REGEX, '**$1**');
  
  return newText;
}

/**
 * Recursively traverses objects/arrays to find strings to modify.
 */
function processObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => processObject(item));
  } else if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = processObject(obj[key]);
    }
    return newObj;
  } else if (typeof obj === 'string') {
    return boldPatterns(obj);
  }
  return obj;
}

/**
 * Main execution loop.
 */
function main() {
  JSON_DIRS.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.error(`Directory not found: ${dir}`);
      return;
    }

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

    files.forEach(file => {
      const filePath = path.join(dir, file);
      console.log(`Processing ${filePath}...`);
      
      try {
        const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
        const data = JSON.parse(content);
        const updatedData = processObject(data);
        fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf8');
      } catch (e) {
        console.error(`Error processing ${filePath}:`, e);
      }
    });
  });

  console.log('\nFinished bolding terminology in all JSON files.');
}

main();
