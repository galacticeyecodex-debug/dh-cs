/**
 * MOCK CHARACTER DATA
 * ----------------------------------------------------------------------------
 * Provides realistic mock character data for Playwright E2E tests.
 * This character represents a Level 3 Human Bard (Wordsmith) with
 * standard equipment and domain cards.
 */

// User ID must match MOCK_USER.id from auth.ts
const MOCK_USER_ID = 'test-user-e2e-12345';

export const MOCK_CHARACTER = {
  id: 'mock-char-e2e-12345',
  user_id: MOCK_USER_ID,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-15T00:00:00.000Z',

  // Basic Info
  name: 'Lyra Songweaver',
  level: 3,
  avatar_url: null,
  background_url: null,

  // Heritage
  ancestry: 'Human',
  community: 'Highborne',
  mixed_ancestry: null,

  // Class
  class: 'Bard',
  subclass: 'Wordsmith',

  // Traits (standard array: 2, 1, 1, 0, 0, -1)
  agility: 1,
  strength: -1,
  finesse: 1,
  instinct: 0,
  presence: 2,
  knowledge: 0,

  // Marked traits (for leveling)
  marked_traits: ['presence'],

  // Experiences
  experiences: [
    { name: 'Performer', modifier: 2 },
    { name: 'Diplomat', modifier: 2 },
  ],

  // Vitals
  hit_points_current: 6,
  hit_points_max: 6,
  stress_current: 1,
  stress_max: 6,
  hope_current: 4,
  hope_max: 6,

  // Armor
  armor_score: 2,
  armor_slots: 2,
  damage_thresholds: { minor: 3, major: 6, severe: 9 },

  // Evasion
  evasion: 10,

  // Gold
  gold: { handfuls: 5, bags: 1, chests: 0 },

  // Equipment slots
  equipped_primary: 'mock-item-rapier',
  equipped_secondary: 'mock-item-lute',
  equipped_armor: 'mock-item-leather',

  // Modifiers (user-applied temporary bonuses)
  modifiers: {},

  // Domains (Bard: Codex + Grace)
  primary_domain: 'Codex',
  secondary_domain: 'Grace',

  // Lore
  appearance: 'A charismatic performer with silver hair and bright blue eyes.',
  backstory: null,
  notes: null,

  // Companion (null for non-Ranger)
  companion: null,

  // Transformation (null if none)
  transformation: null,

  // Class-specific data
  class_specific_data: {
    rally_dice: 3,
    rally_dice_max: 3,
  },
};

export const MOCK_CHARACTER_CARDS = [
  {
    id: 'mock-card-1',
    character_id: MOCK_CHARACTER.id,
    card_name: 'Arcane Arrow',
    card_type: 'ability',
    domain: 'Codex',
    tier: 1,
    location: 'loadout',
    slot_index: 0,
    state: {
      custom_image_url: null,
      active_modifiers: [],
      tokens_current: 0,
      is_used: false,
    },
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'mock-card-2',
    character_id: MOCK_CHARACTER.id,
    card_name: 'Eloquence',
    card_type: 'ability',
    domain: 'Codex',
    tier: 1,
    location: 'loadout',
    slot_index: 1,
    state: {
      custom_image_url: null,
      active_modifiers: [],
      tokens_current: 0,
      is_used: false,
    },
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'mock-card-3',
    character_id: MOCK_CHARACTER.id,
    card_name: 'Inspiring Words',
    card_type: 'ability',
    domain: 'Grace',
    tier: 1,
    location: 'loadout',
    slot_index: 2,
    state: {
      custom_image_url: null,
      active_modifiers: [],
      tokens_current: 0,
      is_used: false,
    },
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'mock-card-4',
    character_id: MOCK_CHARACTER.id,
    card_name: 'Quick Reflexes',
    card_type: 'ability',
    domain: 'Grace',
    tier: 1,
    location: 'vault',
    slot_index: null,
    state: {
      custom_image_url: null,
      active_modifiers: [],
      tokens_current: 0,
      is_used: false,
    },
    created_at: '2024-01-01T00:00:00.000Z',
  },
];

export const MOCK_CHARACTER_INVENTORY = [
  {
    id: 'mock-item-rapier',
    character_id: MOCK_CHARACTER.id,
    item_name: 'Rapier',
    item_type: 'weapon',
    quantity: 1,
    is_homebrew: false,
    homebrew_data: null,
    state: {
      custom_image_url: null,
    },
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'mock-item-lute',
    character_id: MOCK_CHARACTER.id,
    item_name: 'Lute',
    item_type: 'weapon',
    quantity: 1,
    is_homebrew: false,
    homebrew_data: null,
    state: {
      custom_image_url: null,
    },
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'mock-item-leather',
    character_id: MOCK_CHARACTER.id,
    item_name: 'Leather Armor',
    item_type: 'armor',
    quantity: 1,
    is_homebrew: false,
    homebrew_data: null,
    state: {
      custom_image_url: null,
    },
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'mock-item-potion',
    character_id: MOCK_CHARACTER.id,
    item_name: 'Minor Healing Potion',
    item_type: 'consumable',
    quantity: 2,
    is_homebrew: false,
    homebrew_data: null,
    state: {
      custom_image_url: null,
    },
    created_at: '2024-01-01T00:00:00.000Z',
  },
];

/**
 * Create a Ranger character with companion for testing Beastbound features
 */
export const MOCK_RANGER_CHARACTER = {
  ...MOCK_CHARACTER,
  id: 'mock-ranger-e2e-12345',
  name: 'Theron Wildwalker',
  class: 'Ranger',
  subclass: 'Beastbound',
  primary_domain: 'Bone',
  secondary_domain: 'Sage',
  agility: 2,
  strength: 1,
  finesse: 0,
  instinct: 1,
  presence: -1,
  knowledge: 0,
  companion: {
    name: 'Shadow',
    type: 'Wolf',
    evasion: 9,
    stress_current: 0,
    stress_max: 4,
    attack_type: 'Melee',
    damage: '1d6',
    range: 'Melee',
    has_armor: false,
    experiences: [{ name: 'Tracking', modifier: 2 }],
    training: ['Intelligent', 'Vicious'],
    portrait_url: null,
  },
  class_specific_data: {
    focus_tokens: 2,
    focus_tokens_max: 3,
  },
};

/**
 * Create a character with transformation for testing transformation UI
 */
export const MOCK_TRANSFORMED_CHARACTER = {
  ...MOCK_CHARACTER,
  id: 'mock-transformed-e2e-12345',
  name: 'Fenris Moonshadow',
  transformation: 'Werewolf',
};

/**
 * Empty character list for testing "no characters" state
 */
export const EMPTY_CHARACTER_LIST: unknown[] = [];

/**
 * Multiple characters for testing character selection
 */
export const MOCK_CHARACTER_LIST = [
  {
    id: MOCK_CHARACTER.id,
    name: MOCK_CHARACTER.name,
    level: MOCK_CHARACTER.level,
    class: MOCK_CHARACTER.class,
    subclass: MOCK_CHARACTER.subclass,
    ancestry: MOCK_CHARACTER.ancestry,
    community: MOCK_CHARACTER.community,
    avatar_url: MOCK_CHARACTER.avatar_url,
  },
  {
    id: MOCK_RANGER_CHARACTER.id,
    name: MOCK_RANGER_CHARACTER.name,
    level: MOCK_RANGER_CHARACTER.level,
    class: MOCK_RANGER_CHARACTER.class,
    subclass: MOCK_RANGER_CHARACTER.subclass,
    ancestry: MOCK_RANGER_CHARACTER.ancestry,
    community: MOCK_RANGER_CHARACTER.community,
    avatar_url: MOCK_RANGER_CHARACTER.avatar_url,
  },
];
