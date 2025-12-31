import { RangerCompanion } from '@/types/character';

export interface CharacterFormData {
  name: string;
  image_url?: string;
  ancestry_id: string;
  is_mixed_ancestry?: boolean;
  ancestry_id_2?: string;
  community_id: string;
  class_id: string;
  subclass_id: string;
  domains: [string, string];
  selectedCards: string[];
  stats: {
    agility: number;
    strength: number;
    finesse: number;
    instinct: number;
    presence: number;
    knowledge: number;
  };
  experiences: [string, string];
  selectedPrimaryWeaponId: string | null;
  selectedSecondaryWeaponId: string | null;
  selectedArmorId: string | null;
  selectedPotionType: 'health' | 'stamina' | null;
  companion?: RangerCompanion;
}

export interface LibraryLookupItem {
  id: string;
  type: string;
  name: string;
  domain?: string;
  tier?: number;
  source?: 'srd' | 'playtest' | 'homebrew';
  data: Record<string, any>;
}

export interface LibraryData {
  ancestries: LibraryLookupItem[];
  communities: LibraryLookupItem[];
  classes: LibraryLookupItem[];
  subclasses: LibraryLookupItem[];
  domains: LibraryLookupItem[];
  weapons: LibraryLookupItem[];
  armor: LibraryLookupItem[];
  consumables: LibraryLookupItem[];
  abilities: LibraryLookupItem[];
  spells: LibraryLookupItem[];
  grimoires: LibraryLookupItem[];
}
