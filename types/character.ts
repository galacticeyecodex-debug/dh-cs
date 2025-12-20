/**
 * Character Type Definitions
 * ----------------------------------------------------------------------------
 * This file defines the core TypeScript interfaces and types used throughout the
 * application to model the Daggerheart character system. It includes definitions
 * for the Character entity, Inventory items, Cards, Homebrew content, and
 * auxiliary structures like RollResults and AdvancementRecords, serving as the
 * shared contract for data shape across the store and components.
 */

import { Experience } from './modifiers';

export type { Experience };

export interface HomebrewItemData {
  modifiers?: Array<{
    id?: string;
    target: string;
    value: number;
    type?: string;
  }>;
  // Weapon-specific fields
  type?: string; // "Physical" or "Magic" (damage type)
  hand?: string; // "Primary" or "Secondary"
  trait?: string; // Attack trait (Agility, Strength, etc.)
  range?: string; // Melee, Close, Far, Very Far
  damage?: string; // Dice notation (e.g., "1d8", "2d6+3")
  burden?: string; // "One-Handed", "Two-Handed", "Worn"
  feature?: Record<string, any>; // SRD feature object
  // Armor-specific fields
  base_score?: number;
  base_thresholds?: string; // e.g., "2/4" or "1/3/5"
  // Consumable-specific fields
  uses?: number;
  // Other fields
  markdown?: string;
  [key: string]: any; // Allow additional custom fields
}

export interface LibraryItem {
  id: string;
  type: string;
  name: string;
  domain?: string;
  tier?: number;
  data: HomebrewItemData | any; // JSONB column content - typed for homebrew, flexible for library
  _isHomebrew?: boolean; // UI marker for homebrew items
  _homebrewId?: string; // Original homebrew ID for UI
}

export interface CharacterCard {
  id: string;
  character_id: string;
  card_id: string;
  location: 'loadout' | 'vault' | 'feature';
  state: { tokens?: number; exhausted?: boolean; custom_image_url?: string };
  sort_order?: number;
  library_item?: LibraryItem; // Joined data for the card itself
}

export interface HomebrewItem {
  id: string;
  user_id: string;
  type: 'weapon' | 'armor' | 'item' | 'consumable';
  name: string;
  description?: string;
  data: HomebrewItemData;
  created_at?: string;
  updated_at?: string;
}

export interface CharacterInventoryItem {
  id: string;
  character_id: string;
  item_id?: string | null; // Foreign key to library, nullable for custom items
  homebrew_item_id?: string | null; // Foreign key to homebrew_items
  name: string;
  description?: string;
  location: 'equipped_primary' | 'equipped_secondary' | 'armor' | 'equipped_armor' | 'backpack';
  quantity: number;
  library_item?: LibraryItem; // Joined data for the item itself
  homebrew_item?: HomebrewItem; // Joined data for homebrew items
}

export interface Character {
  id: string;
  user_id: string;
  name: string;
  level: number;
  ancestry?: string;
  community?: string;
  class_id?: string;
  subclass_id?: string;
  multiclass_id?: string;
  domains?: string[];
  stats: {
    agility: number;
    strength: number;
    finesse: number;
    instinct: number;
    presence: number;
    knowledge: number;
  };
  vitals: {
    hit_points_max: number;
    hit_points_current: number;
    stress_max: number;
    stress_current: number;
    armor_score: number;
    armor_slots: number;
  };
  damage_thresholds: {
    minor: number;
    major: number;
    severe: number;
  };
  hope: number;
  fear: number;
  evasion: number;
  proficiency: number;
  spellcast?: number; // Spellcast modifier for magical abilities
  experiences: Experience[];
  modifiers?: Record<string, { id: string; name: string; value: number; source: 'user' | 'system' }[]>;
  gold: {
    handfuls: number;
    bags: number;
    chests: number;
  };
  image_url?: string;
  background_image_url?: string;

  // Lore
  appearance?: string;
  background?: string;
  connections?: string;
  pronouns?: string;
  gallery_images?: string[];

  // Leveling tracking
  marked_traits_jsonb?: Record<string, any>;
  advancement_history_jsonb?: Record<string, any>;
  subclass_progression?: {
    foundation_obtained?: boolean;
    specialization_obtained?: boolean;
    mastery_obtained?: boolean;
  };

  // Multiclass tracking
  multiclass_subclass_id?: string;
  multiclass_progression?: {
    foundation_obtained?: boolean;
    specialization_obtained?: boolean;
    mastery_obtained?: boolean;
  };

  // Relations
  character_cards?: CharacterCard[];
  character_inventory?: CharacterInventoryItem[];
  class_data?: LibraryItem; // Joined class data
  subclass_data?: LibraryItem; // Joined subclass data
}

export interface AdvancementRecord {
  advancements: string[];
  traitIncrements?: { trait: string; amount: number }[];
  experienceIncrements?: { experienceId: string; amount: number }[];
  hpAdded?: number;
  stressAdded?: number;
  domainCardsSelected?: string[];
}

export interface RollResult {
  hope: number;
  fear: number;
  extras?: number;
  plusTotal?: number;
  minusTotal?: number;
  dice?: { role: string, value: number, sides: number }[];
  total: number;
  modifier: number;
  type: 'Critical' | 'Hope' | 'Fear' | 'Damage';
}
