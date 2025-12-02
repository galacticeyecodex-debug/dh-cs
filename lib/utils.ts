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
