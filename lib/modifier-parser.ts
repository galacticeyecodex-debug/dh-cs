/**
 * MODIFIER PARSER UTILITY
 * ----------------------------------------------------------------------------
 * This utility function is responsible for analyzing natural language text (e.g., item descriptions,
 * feature text) and extracting structured game modifiers.
 * 
 * FUNCTIONALITY:
 * - Uses Regex patterns to identify standard Daggerheart syntax (e.g., "+1 to Agility").
 * - Converts recognized text into `Modifier` objects that the game engine can apply.
 * - Handles data normalization (e.g., converting "Hit Points" string to "hp" key).
 * - Essential for automating the application of bonuses from the library content without manual tagging.
 * 
 * DUPLICATE LOGIC WARNING:
 * - This file contains logic for parsing modifiers (RegEx) that is IDENTICAL to 
 *   `scripts/parse_json_srd.js`.
 * - `scripts/parse_json_srd.js` is used for SEEDING static data (database init).
 * - This file (`lib/modifier-parser.ts`) is intended for RUNTIME parsing (e.g., user-created content).
 * - If you update the parsing logic here, you MUST update it in the script as well!
 * 
 * USAGE NOTE:
 * - As of Dec 2025, this file is currently UNUSED in the active codebase. 
 * - It is preserved as a utility for future "Homebrew" or "Custom Item" features where
 *   the app will need to parse user-inputted text on the fly.
 */

import { Modifier, ModifierOperator, CharacterStat } from '../types/modifiers';

// Regex patterns for common modifiers
const STAT_MODIFIER_REGEX = /([+-]?\d+)\s+(?:to|bonus\s+to)\s+(Agility|Strength|Finesse|Instinct|Presence|Knowledge|Evasion|Armor|Hit\s+Points|Stress|Hope|Proficiency)/i;
// e.g. "+1 to Evasion", "-1 to Agility", "+2 bonus to Strength"

export function parseModifiers(text: string): Modifier[] {
  const modifiers: Modifier[] = [];
  if (!text) return modifiers;

  // Split text by semicolons or newlines to handle multiple modifiers
  const segments = text.split(/[;\n]/);

  segments.forEach(segment => {
    const cleanSegment = segment.trim();
    if (!cleanSegment) return;

    // 1. Simple Stat Modifiers
    const statMatch = cleanSegment.match(STAT_MODIFIER_REGEX);
    if (statMatch) {
      const value = parseInt(statMatch[1]);
      const rawStat = statMatch[2].toLowerCase().replace(/\s+/g, '_'); // 'hit points' -> 'hit_points' -> 'hp' logic below

      let target: CharacterStat | string = rawStat;

      // Normalize stat names
      if (rawStat === 'hit_points') target = 'hp';
      if (rawStat === 'armor_score') target = 'armor'; // Handle "Armor Score" if regex caught just "Armor" context

      modifiers.push({
        id: crypto.randomUUID(), // Note: crypto might not be available in basic node scripts without polyfill, but standard in modern environments
        type: 'stat',
        target: target,
        value: value,
        operator: value >= 0 ? 'add' : 'subtract',
        description: cleanSegment
      });
    }

    // Future: Add Roll Modifiers and Conditional Logic parsing here
  });

  return modifiers;
}
