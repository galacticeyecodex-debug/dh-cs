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

export function calculateBaseEvasion(character: any): number {
  if (!character) return 10; // Fallback

  // 1. Start with Class Base
  let base = 10; // Default
  if (character.class_data?.data?.starting_evasion) {
    base = parseInt(character.class_data.data.starting_evasion) || 10;
  }

  // 2. Apply Ancestry Modifiers (e.g. Simiah "Nimble: +1 to Evasion")
  // We need to check character.ancestry (string) against some data, OR check features.
  // Currently `character` doesn't have joined Ancestry data in the store interface explicitly as `ancestry_data`.
  // However, `calculateBaseEvasion` is best effort. If we can't find ancestry data, we skip it.
  // Assuming the store might eventually join it or we just rely on Items for now.
  
  // 3. Apply Item Modifiers (Armor, Weapons, Shields)
  const inventory = character.character_inventory || [];
  const equippedItems = inventory.filter((item: any) => 
    ['equipped_primary', 'equipped_secondary', 'equipped_armor'].includes(item.location)
  );

  equippedItems.forEach((item: any) => {
    if (!item.library_item?.data) return;
    
    // Check for structured modifiers (Preferred)
    if (Array.isArray(item.library_item.data.modifiers)) {
      const mods = item.library_item.data.modifiers;
      mods.forEach((mod: any) => {
        if (mod.target === 'evasion') {
          if (mod.operator === 'add') base += mod.value;
          else if (mod.operator === 'subtract') base -= mod.value;
          // Handle other operators if needed, but evasion is usually add/sub
        }
      });
      return; // Skip regex if structured data found
    }

    // Check Feature Text (Fallback)
    const featureText = item.library_item.data.feature?.text || '';
    // Check basic Feat Text (flat CSV style)
    const featText = item.library_item.data.feat_text || '';
    
    const combinedText = `${featureText} ${featText}`;
    
    // Regex for modifiers like "-1 to Evasion", "+1 to Evasion"
    // Global flag to catch multiple modifiers if present (unlikely in one item but possible)
    const matches = Array.from(combinedText.matchAll(/([+-]?\d+)\s+to\s+Evasion/gi));
    
    for (const match of matches) {
      const val = parseInt(match[1]);
      if (!isNaN(val)) {
        base += val;
      }
    }
  });

  return base;
}