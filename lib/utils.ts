import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseDamageRoll(input: string): { dice: string; modifier: number } {
  // Remove text like "phy", "mag", "physical", "magic" (case insensitive) and whitespace
  const cleanInput = input.replace(/(phy|mag|physical|magic)/gi, '').replace(/\s/g, '');
  
  const parts = cleanInput.split('+');
  const diceParts: string[] = [];
  let modifier = 0;

  for (const part of parts) {
    // Check for dice notation (e.g., "d8", "1d8", "2d6")
    if (/^(\d+)?d(\d+)$/i.test(part)) {
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

// Helper to extract System Modifiers from Equipment
export function getSystemModifiers(character: any, stat: string): any[] {
  if (!character || !character.character_inventory) return [];

  const systemModifiers: any[] = [];
  const equippedItems = character.character_inventory.filter((item: any) => 
    ['equipped_primary', 'equipped_secondary', 'equipped_armor'].includes(item.location)
  );

  equippedItems.forEach((item: any) => {
    if (!item.library_item?.data) return;

    // A. Structured Modifiers (Preferred)
    if (Array.isArray(item.library_item.data.modifiers)) {
      const mods = item.library_item.data.modifiers;
      mods.forEach((mod: any) => {
        if (mod.target === stat) {
          systemModifiers.push({
            id: `sys-${item.id}-${mod.id || Math.random()}`,
            name: item.name, // Use Item Name as source description
            value: mod.value, // Directly use the value from the structured modifier
            source: 'system'
          });
        }
      });
      return; // Skip regex if structured found
    }

    // B. Fallback Regex (Legacy)
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
          source: 'system'
        });
      }
    }
  });

  return systemModifiers;
}

// Helper to get Class Base Stat
export function getClassBaseStat(character: any, stat: string): number {
  if (!character?.class_data?.data) return 0; // Default fallbacks handled below

  if (stat === 'evasion') {
    return parseInt(character.class_data.data.starting_evasion) || 10;
  }
  if (stat === 'hp') {
    return parseInt(character.class_data.data.starting_hp) || 6;
  }
  // Traits base is usually 0 (assigned by user), but could have racial bonuses?
  // Ancestry modifiers: We could parse those here if we had ancestry data.
  
  return 0;
}

export function calculateBaseEvasion(character: any): number {
  if (!character) return 10;

  // 1. Class Base
  let base = getClassBaseStat(character, 'evasion');

  // 2. Ancestry Modifiers (TODO: Fetch and parse ancestry features if needed)
  
  // 3. Item Modifiers
  const systemMods = getSystemModifiers(character, 'evasion');
  const itemBonus = systemMods.reduce((acc, mod) => acc + mod.value, 0);

  return base + itemBonus;
}