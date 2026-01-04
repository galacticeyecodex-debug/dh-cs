/**
 * SHARED UTILITIES
 * ----------------------------------------------------------------------------
 * This file contains general-purpose helper functions used across the application.
 *
 * FUNCTIONALITY:
 * - Styling Helper (`cn`): Merges Tailwind classes conditionally using `clsx` and `tailwind-merge`.
 * - Damage Parsing: `parseDamageRoll` and `calculateWeaponDamage` handle the complex string manipulation
 *   needed to interpret Daggerheart damage dice and scale them by proficiency.
 * - Modifier Parsing (Legacy/Fallback): `getSystemModifiers` extracts bonuses from equipped items,
 *   supporting both structured JSON data and text-based regex parsing (similar to the SRD parser).
 * - Stat Calculation: Helpers like `getClassBaseStat` and `calculateBaseEvasion` encapsulate
 *   core rules for determining derived stats.
 * - Combat Modifiers: `calculateAttackModifier` and `calculateDamageModifier` aggregate bonuses
 *   from equipped items and user-added modifiers for combat calculations.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parseCardPassiveModifiers, getBareBonesBonuses, calculateDynamicValue } from './card-parser';
import { getModifiers, isModifierActive, getEnhancement, WithEnhancement } from './enhancement-utils';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseDamageRoll(input: string): { dice: string; modifier: number } {
  // Remove markdown bold syntax (**), text like "phy", "mag", "physical", "magic" (case insensitive) and whitespace
  const cleanInput = input.replace(/\*\*/g, '').replace(/(phy|mag|physical|magic)/gi, '').replace(/\s/g, '');

  // Normalize subtraction to addition of negative numbers for easier splitting
  const normalized = cleanInput.replace(/-/g, '+-');
  const parts = normalized.split('+').filter(p => p !== '');

  const diceParts: string[] = [];
  let modifier = 0;

  for (const part of parts) {
    // Check for dice notation (e.g., "d8", "1d8", "2d6")
    // Note: This regex allows for an optional negative sign at the start, 
    // though negative dice are rare.
    if (/d/i.test(part)) {
      diceParts.push(part);
    } else {
      // Check for static number
      const num = parseInt(part);
      if (!isNaN(num)) {
        modifier += num;
      }
    }
  }

  return {
    dice: diceParts.join('+'),
    modifier
  };
}

// Helper to extract System Modifiers from Equipment AND Domain Cards
// @param enhancedAbilities - Optional array of enhanced ability data for proper condition evaluation
export function getSystemModifiers(
  character: any,
  stat: string,
  cardStates: Record<string, any> = {},
  enhancedAbilities?: Array<WithEnhancement & { name: string }>
): any[] {
  if (!character) return [];

  const systemModifiers: any[] = [];

  // A. EQUIPPED ITEMS
  if (character.character_inventory) {
    const equippedItems = character.character_inventory.filter((item: any) =>
      ['equipped_primary', 'equipped_secondary', 'equipped_armor'].includes(item.location)
    );

    equippedItems.forEach((item: any) => {
      if (!item.library_item?.data) return;

      // A1. Structured Modifiers (Preferred)
      if (Array.isArray(item.library_item.data.modifiers)) {
        const mods = item.library_item.data.modifiers;
        mods.forEach((mod: any) => {
          if (mod.target === stat) {
            systemModifiers.push({
              id: `sys-${item.id}-${mod.id || Math.random()}`,
              name: item.name, // Use Item Name as source description
              value: mod.value, // Directly use the value from the structured modifier
              source: 'system',
              type: 'equipment'
            });
          }
        });
        return; // Skip regex if structured found
      }

      // A2. Fallback Regex (Legacy)
      const featureText = item.library_item.data.feature?.text || '';
      const featText = item.library_item.data.feat_text || '';
      const combinedText = `${featureText} ${featText}`;

      // Regex needs to match the specific stat
      // e.g. "Evasion" -> /... Evasion/
      const regex = new RegExp(`([+-]?\\d+)\\s+(?:to|bonus\\s+to)\\s+${stat.replace('_', '\\s+')}`, 'gi');
      const matches = Array.from(combinedText.matchAll(regex));

      for (const match of matches) {
        const val = parseInt(match[1]);
        if (!isNaN(val)) {
          systemModifiers.push({
            id: `sys-${item.id}-regex`,
            name: item.name,
            value: val,
            source: 'system',
            type: 'equipment'
          });
        }
      }
    });
  }

  // B. DOMAIN CARDS IN LOADOUT
  if (character.character_cards) {
    // CRITICAL FIX: For dynamic formulas like "half your Agility" to work correctly,
    // we need to use TOTAL stat values (base + modifiers), not just base values.
    // Calculate total trait values FIRST before processing domain cards.
    const traitsWithTotals: any = { ...character.stats };
    const traitNames = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'];

    // Only calculate if we're requesting evasion or a similar derived stat that might use formulas
    // (Otherwise we'd have circular dependency for trait modifiers themselves)
    const needsTotalStats = stat !== 'agility' && stat !== 'strength' && stat !== 'finesse' &&
      stat !== 'instinct' && stat !== 'presence' && stat !== 'knowledge';

    if (needsTotalStats) {
      for (const trait of traitNames) {
        const baseStat = character.stats?.[trait as keyof typeof character.stats] || 0;
        // Get user modifiers (these don't depend on domain cards)
        const userMods = (character.modifiers?.[trait] || []) as any[];
        const userTotal = userMods.reduce((sum: number, mod: any) => sum + (mod.value || 0), 0);
        traitsWithTotals[trait] = baseStat + userTotal;
      }
    }

    // Create temporary character with calculated total stats for dynamic formula evaluation
    const charForParsing = needsTotalStats ? { ...character, stats: traitsWithTotals } : character;

    const loadoutCards = character.character_cards.filter((card: any) =>
      card.location === 'loadout'
    );

    loadoutCards.forEach((card: any) => {
      const cardName = card.library_item?.name;
      if (!cardName || !card.library_item?.data) return;

      // Special case: Bare Bones (complex tier-based thresholds)
      if (cardName === 'Bare Bones') {
        const bareBonesModifiers = getBareBonesBonuses(charForParsing);
        bareBonesModifiers
          .filter((mod: any) => mod.stat === stat && mod.isActive)
          .forEach((mod: any, index: number) => {
            systemModifiers.push({
              id: `card-${card.id}-barebones-${mod.stat}-${index}`,
              name: mod.source,
              value: mod.value,
              source: 'domain_card',
              type: 'domain_card'
            });
          });
        return;
      }

      const isCardActive = cardStates[cardName]?.is_active ?? false;

      // B1. Check for enhanced JSON modifiers FIRST (from enhancement_override or enhancement)
      // These have proper condition types (when_active, loadout_domain_count, etc.)
      const enhancedData = enhancedAbilities?.find((a: WithEnhancement & { name: string }) => a.name === cardName);
      if (enhancedData) {
        const jsonModifiers = getModifiers(enhancedData);
        jsonModifiers
          .filter((mod) => mod.stat === stat)
          .forEach((mod, index) => {
            // For when_active conditions, check per-modifier activation state
            let isActive: boolean;
            if (mod.condition?.type === 'when_active' || mod.condition?.type === 'cost_activated') {
              // Per-modifier activation state: use modifierKey pattern matching the UI
              const modifierKey = `${mod.stat}-${index}`;
              isActive = cardStates[cardName]?.active_modifiers?.[modifierKey] ?? false;
            } else {
              // For other condition types, use the generic isModifierActive helper
              const isCardActive = cardStates[cardName]?.is_active ?? false;
              isActive = isModifierActive(mod, isCardActive, charForParsing);
            }

            if (isActive) {
              // Calculate the actual value - for dynamic formulas, evaluate them
              const calculatedValue = mod.formula
                ? calculateDynamicValue(mod.formula, charForParsing)
                : mod.value;

              systemModifiers.push({
                id: `card-${card.id}-enhanced-${mod.stat}-${index}`,
                name: mod.source || cardName,
                value: calculatedValue,
                source: 'domain_card',
                type: 'domain_card'
              });
            }
          });
        // If we found enhanced modifiers for this stat, skip text parsing
        if (jsonModifiers.some((mod) => mod.stat === stat)) {
          return;
        }
      }

      // B2. Fallback: General text parsing (for cards without enhanced JSON)
      const cardModifiers = parseCardPassiveModifiers(card, charForParsing, isCardActive);

      cardModifiers
        .filter((mod: any) => mod.stat === stat && mod.isActive)
        .forEach((mod: any, index: number) => {
          systemModifiers.push({
            id: `card-${card.id}-${mod.stat}-${index}`,
            name: mod.source,
            value: mod.value,
            source: 'domain_card',
            type: 'domain_card'
          });
        });
    });
  }

  return systemModifiers;
}

// Helper to get Class Base Stat
export function getClassBaseStat(character: any, stat: string): number {
  if (!character?.class_data?.data) return 0; // Default fallbacks handled below

  if (stat === 'evasion') {
    return parseInt(character.class_data.data.starting_evasion) || 10;
  }
  if (stat === 'hp' || stat === 'hit_points') {
    return parseInt(character.class_data.data.starting_hp) || 6;
  }
  if (stat === 'stress' || stat === 'hope') {
    return 6;
  }
  return 0;
}

export function calculateBaseEvasion(character: any, cardStates: Record<string, any> = {}): number {
  if (!character) return 10;

  // 1. Class Base
  const base = getClassBaseStat(character, 'evasion');

  // 2. Ancestry Modifiers (TODO: Fetch and parse ancestry features if needed)

  // 3. Item Modifiers
  const systemMods = getSystemModifiers(character, 'evasion', cardStates);
  const itemBonus = systemMods.reduce((acc, mod) => acc + mod.value, 0);

  return base + itemBonus;
}

// Helper to calculate total attack modifier from equipped items and domain cards
export function calculateAttackModifier(
  character: any,
  cardStates: Record<string, any> = {},
  enhancedAbilities?: Array<WithEnhancement & { name: string }>
): number {
  if (!character) return 0;

  const systemMods = getSystemModifiers(character, 'attack', cardStates, enhancedAbilities);
  const userMods = character.modifiers?.['attack'] || [];
  const allMods = [...systemMods, ...userMods];

  return allMods.reduce((acc, mod) => acc + mod.value, 0);
}

// Helper to calculate total damage modifier from equipped items and domain cards
export function calculateDamageModifier(
  character: any,
  cardStates: Record<string, any> = {},
  enhancedAbilities?: Array<WithEnhancement & { name: string }>
): number {
  if (!character) return 0;

  const systemMods = getSystemModifiers(character, 'damage', cardStates, enhancedAbilities);
  const userMods = character.modifiers?.['damage'] || [];
  const allMods = [...systemMods, ...userMods];

  return allMods.reduce((acc, mod) => acc + mod.value, 0);
}

export function calculateWeaponDamage(baseDamage: string, proficiency: number): string {
  if (!baseDamage) return '';

  // Parse using existing helper
  const { dice, modifier } = parseDamageRoll(baseDamage);

  if (!dice) return baseDamage;

  // Split dice string (e.g. "1d8+1d6")
  const diceGroups = dice.split('+');

  const scaledDice = diceGroups.map(group => {
    const match = group.match(/^(\d+)?d(\d+)$/i);
    if (match) {
      const count = parseInt(match[1] || '1');
      const sides = match[2];
      return `${count * proficiency}d${sides}`;
    }
    return group;
  });

  const newDiceString = scaledDice.join('+');

  if (modifier !== 0) {
    return `${newDiceString}${modifier >= 0 ? '+' : ''}${modifier}`;
  }

  return newDiceString;
}