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
  source?: 'srd' | 'playtest' | 'homebrew'; // Content source for access control
  data: HomebrewItemData | any; // JSONB column content - typed for homebrew, flexible for library
  _isHomebrew?: boolean; // UI marker for homebrew items
  _homebrewId?: string; // Original homebrew ID for UI
}

export interface ContentAccess {
  srd: boolean;
  playtest: boolean;
  playtest_packs?: {
    [packId: string]: boolean;
  };
  homebrew?: {
    [campaignName: string]: boolean;
  };
}

export interface Profile {
  id: string;
  username?: string;
  avatar_url?: string;
  content_access: ContentAccess;
  updated_at?: string;
  created_at?: string;
}

export interface CharacterCard {
  id: string;
  character_id: string;
  card_id: string;
  location: 'loadout' | 'vault' | 'feature';
  state: {
    tokens?: number;
    exhausted?: boolean;
    custom_image_url?: string;
    custom_image_type?: 'artwork' | 'full-card'; // How to display the custom image
    custom_image_position_x?: number; // 0-100 percentage for horizontal position
    custom_image_position_y?: number; // 0-100 percentage for vertical position
  };
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
  state?: {
    custom_image_url?: string;
    custom_image_position_x?: number; // 0-100 percentage for horizontal position
    custom_image_position_y?: number; // 0-100 percentage for vertical position
  };
  library_item?: LibraryItem; // Joined data for the item itself
  homebrew_item?: HomebrewItem; // Joined data for homebrew items
}

export interface Character {
  id: string;
  user_id: string;
  name: string;
  level: number;
  ancestry?: string;
  ancestry_features?: any[];
  community?: string;
  transformation?: string; // Optional transformation card (Vampire, Werewolf, etc.)
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
  spellcast?: number; // Deprecated: Spellcast modifier for magical abilities
  spellcast_trait?: string; // e.g. "Instinct"
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

  // Beastbond Ranger Companion
  ranger_companion?: RangerCompanion;

  // Seraph Prayer Dice
  seraph_prayer_dice?: SeraphPrayerDice;

  // Bard Rally Dice
  bard_rally_dice?: BardRallyDice;

  // Guardian Unstoppable
  guardian_unstoppable?: GuardianUnstoppable;

  // Wizard Strange Patterns
  wizard_strange_patterns?: WizardStrangePatterns;

  // Druid Beastform
  druid_beastform?: DruidBeastform;

  // Ranger Focus
  ranger_focus?: RangerFocus;

  // Warrior Slayer Dice (Call of the Slayer subclass)
  warrior_slayer_dice?: WarriorSlayerDice;

  // Sorcerer Element (Elemental Origin subclass)
  sorcerer_element?: SorcererElement;

  // Druid Elemental Incarnation (Warden of the Elements subclass)
  druid_elemental_incarnation?: DruidElementalIncarnation;

  // Card State tracking (tokens, frequency usage)
  card_states?: Record<string, {
    current_tokens: number;
    used_this_rest: boolean;
    used_this_long_rest: boolean;
    used_this_session: boolean;
    is_active: boolean;
  }>;
}

export interface AdvancementRecord {
  advancements: string[];
  traitIncrements?: { trait: string; amount: number }[];
  experienceIncrements?: { experienceId: string; amount: number }[];
  hpAdded?: number;
  stressAdded?: number;
  domainCardsSelected?: string[];
}

// Ranger Companion Types
export interface CompanionExperience {
  name: string;
  value: number;
}

export interface RangerCompanion {
  name: string;
  animal_type: string;
  image_url?: string; // Companion portrait
  evasion: number;
  stress_max: number;
  stress_current: number;
  armor_slot: boolean;
  armor_slot_used: boolean;
  hope_max: number;
  hope_current: number;
  attack_type: 'melee' | 'ranged';
  attack_name: string; // e.g., "Claw Swipe", "Bite", "Pounce"
  damage_die: string; // e.g., "d6", "d8", "d10", "d12"
  attack_range?: 'melee' | 'very_close' | 'close' | 'far';
  experiences: CompanionExperience[];
  level_up_options: {
    intelligent: number; // Max 3 times - gives +1 to companion experience rolls
    light_in_the_dark: boolean; // Only once - gives PLAYER +1 hope slot (via modifier)
    creature_comfort: boolean;
    creature_comfort_used?: boolean; // Reset on rest
    armored: boolean;
    armored_used?: boolean; // Reset on short rest
    vicious: number; // Max 3 times - increases damage die or range
    resilient: number; // Max 3 times - adds companion stress slot
    bonded: boolean;
    aware: boolean;
  };
}

// Bard Rally Dice Types
export interface RallyDie {
  id: string;
  value: number; // 1-6 or 1-8
  used: boolean;
}

export interface BardRallyDice {
  dice: RallyDie[];
  die_size: 'd6' | 'd8'; // Increases at level 5
  lastRolled?: string; // ISO timestamp
}

// Guardian Unstoppable Types
export interface GuardianUnstoppable {
  is_active: boolean; // "While Unstoppable"
  current_value: number; // Current face of the die (or cumulative bonus?) "Add the current value... to your damage roll"
  die_size: 'd4' | 'd6'; // Increases at level 5
  start_value: 1; // Always starts at 1
}

// Wizard Strange Patterns Types
export interface WizardStrangePatterns {
  target_number: number; // 1-12
}

// Druid Beastform
export interface DruidBeastform {
  is_active: boolean;
  active_form: string; // Name of the beastform
}

// Ranger Focus
export interface RangerFocus {
  is_active: boolean;
  target_name?: string;
}

// Warrior Slayer Dice Types (Call of the Slayer subclass)
export interface SlayerDie {
  id: string;
  value: number; // 1-6 (d6 result)
  used: boolean;
}

export interface WarriorSlayerDice {
  dice: SlayerDie[];
  lastRolled?: string; // ISO timestamp
}

// Sorcerer Element Type (Elemental Origin subclass)
export type SorcererElement = 'air' | 'earth' | 'fire' | 'lightning' | 'water';

// Druid Elemental Incarnation Types (Warden of the Elements subclass)
export type DruidElement = 'fire' | 'earth' | 'water' | 'air';

export interface DruidElementalIncarnation {
  is_active: boolean;
  selected_element?: DruidElement;
}

// Seraph Prayer Dice Types
export interface PrayerDie {
  id: string;
  value: number; // 1-4 (d4 result)
  used: boolean;
}

export interface SeraphPrayerDice {
  dice: PrayerDie[];
  lastRolled?: string; // ISO timestamp
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
