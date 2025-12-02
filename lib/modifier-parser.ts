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
