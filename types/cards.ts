/**
 * ENHANCED CARD TYPES
 * ----------------------------------------------------------------------------
 * Extended TypeScript interfaces for domain cards (abilities/spells) with
 * structured metadata for interactive UI components.
 *
 * Key Features:
 * - Action type categorization (attack, reaction, passive, etc.)
 * - Structured cost tracking (stress, hope, HP, tokens)
 * - Token management for cards like Flight, Unleash Chaos
 * - Combat mechanics extraction (trait, range, damage)
 * - Frequency tracking (once per rest/session)
 */

// Action type categorization
export type ActionType = 'attack' | 'reaction' | 'passive' | 'downtime' | 'buff' | 'utility';

// Timing for when ability can be used
export type Timing = 'action' | 'reaction' | 'free' | 'downtime';

// Frequency limits
export type Frequency = 'at_will' | 'once_per_rest' | 'once_per_long_rest' | 'once_per_session';

// Target types for attacks
export type TargetType = 'single' | 'all_in_range' | 'adjacent' | 'self' | 'ally' | 'allies_in_range' | 'line';

// Damage types
export type DamageType = 'physical' | 'magic';

// Combat action categories - determines which buttons to show
export type CombatCategory =
  | 'standalone_attack'  // "Make a roll against..." - shows Attack + Damage buttons
  | 'damage_bonus'       // "When you succeed on attack, add damage" - shows Damage button only
  | 'roll_only'          // "Make a Roll (DC)" without damage - shows Roll button only
  | 'passive_triggered'; // Triggered effect, no roll required - no attack/roll buttons

// Range values from Daggerheart
export type Range = 'Melee' | 'Very Close' | 'Close' | 'Far' | 'Very Far';

// Token replenishment timing
export type TokenReplenish = 'rest' | 'long_rest' | 'session_start' | 'session_end' | 'manual';

/**
 * Structured costs for using an ability
 */
export interface CardCosts {
  stress?: number;
  hope?: number;
  armor_slots?: number;
  hit_points?: number;
  tokens?: number;
}

/**
 * Attack mechanics for combat abilities
 */
export interface CardAttack {
  trait: string;
  range: Range;
  targets?: TargetType;
  damage?: string;
  damage_type?: DamageType;
  difficulty?: number; // Fixed DC if applicable
  secondary_effects?: string[];
  combat_category?: CombatCategory; // Determines which buttons to show
}

/**
 * Roll requirements for abilities
 */
export interface CardRoll {
  type: string; // e.g., "Spellcast Roll", "Strength Roll"
  trait?: string; // The trait used for the roll
  difficulty?: number; // null for contested, number for fixed DC
  target_reaction?: boolean; // Does target get a reaction roll?
}

/**
 * Stat modifier applied by a card
 */
export interface CardModifier {
  stat: string;           // Target stat: "agility", "evasion", "damage", etc.
  value: number;          // Calculated numeric value
  formula?: string;       // Dynamic formula if applicable: "half_agility", "3_plus_strength"
  condition?: ModifierCondition; // Activation condition
  source?: string;        // Card name (for debugging)
}

/**
 * Condition types for modifier activation
 */
export type ModifierCondition =
  | { type: 'always' }
  | { type: 'when_armored' }
  | { type: 'when_unarmored' }
  | { type: 'loadout_domain_count'; domain: string; minCount: number }
  | { type: 'environment'; requirement: string };

/**
 * Threshold modifiers (for damage thresholds)
 */
export interface ThresholdModifiers {
  minor?: number;
  major?: number;
  severe?: number;
}

/**
 * Token tracking configuration
 */
/**
 * Token tracking configuration
 */
export interface CardTokens {
  has_tokens: boolean;
  max_tokens?: number | null; // null = dynamic based on trait
  token_source?: string; // Which trait determines token count (e.g., "Agility")
  token_replenish?: TokenReplenish;
  tokens_per_use?: number; // How many tokens spent per use
}

/**
 * Enhanced Ability/Spell Card interface
 * Extends the base JSON structure with interactive metadata
 */
/**
 * The enhancement block structure containing all parser-derived fields
 */
export interface EnhancementBlock {
  action_type: ActionType;
  timing: Timing;
  frequency: Frequency;
  costs?: CardCosts | null;
  keywords?: string[];
  tokens?: CardTokens;
  attack?: CardAttack | null;
  roll?: CardRoll | null;
  uses_proficiency?: boolean;
  effects?: string[];
  modifiers?: CardModifier[];
  threshold_modifiers?: ThresholdModifiers;
  duration?: string;
}

/**
 * Enhanced Ability/Spell Card interface
 * Extends the base JSON structure with interactive metadata
 */
export interface EnhancedAbilityCard {
  // Base fields (existing in JSON)
  name: string;
  level: string;
  domain: string;
  type: 'Spell' | 'Ability';
  recall: string;
  text: string;

  // Enhanced fields (nested blocks)
  enhancement: EnhancementBlock;
  enhancement_override?: EnhancementBlock;
}

/**
 * Character card state - tracks runtime state per card per character
 */
export interface CharacterCardState {
  card_name: string;
  current_tokens: number;
  used_this_rest: boolean;
  used_this_long_rest: boolean;
  used_this_session: boolean;
  is_active: boolean; // For persistent effects
  last_roll_result?: number; // Last roll result for token generation
}

/**
 * Card state slice for Zustand store
 */
export interface CardStateSlice {
  cardStates: Record<string, CharacterCardState>;

  // Token management
  setTokens: (cardName: string, tokens: number) => void;
  spendToken: (cardName: string, amount?: number) => void;
  gainToken: (cardName: string, amount?: number) => void;
  resetTokens: (cardName: string, maxTokens: number) => void;

  // Frequency tracking
  markUsed: (cardName: string, frequency: Frequency) => void;
  resetFrequency: (frequency: Frequency) => void; // Reset all cards of this frequency

  // State helpers
  getCardState: (cardName: string) => CharacterCardState | undefined;
  initializeCardState: (cardName: string) => void;
}

/**
 * Props for interactive card components
 */
export interface MarkStressButtonProps {
  cost: number;
  onMark?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export interface SpendHopeButtonProps {
  cost: number;
  onSpend?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export interface FrequencyCheckboxProps {
  cardName: string;
  frequency: Frequency;
  onToggle?: (used: boolean) => void;
  className?: string;
}

export interface ActiveEffectCheckboxProps {
  cardName: string;
  duration: string;
  onToggle?: (active: boolean) => void;
  className?: string;
}

export interface CardTokenTrackProps {
  cardName: string;
  maxTokens: number | null;
  tokenSource?: string;
  currentTokens?: number;
  onTokenChange?: (tokens: number) => void;
  className?: string;
}

export interface CombatSpellCardProps {
  card: EnhancedAbilityCard;
  onPrepareRoll: (name: string, modifier: number, dice?: string) => void;
  className?: string;
}

export interface CardEnhancementPanelProps {
  card: EnhancedAbilityCard;
  className?: string;
}

/**
 * Enhanced Feature interface for ancestry/community features
 * Shares structure with EnhancedAbilityCard for combat compatibility
 */
export interface EnhancedFeature {
  name: string;
  text: string;

  // Enhanced fields (parsed/added by enhance_character_options_json.js)
  action_type?: ActionType;
  timing?: Timing;
  frequency?: Frequency;
  costs?: CardCosts;

  // Token tracking
  tokens?: CardTokens;

  // Combat mechanics
  attack?: CardAttack;

  // Stat bonuses granted by the feature
  stat_bonuses?: {
    evasion?: number;
    experience?: number;
    damage_thresholds?: string | number;
    hit_point_slots?: number;
    stress_slots?: number;
  };

  // Metadata
  keywords?: string[];
}

/**
 * Enhanced Ancestry data with parsed combat features
 */
export interface EnhancedAncestry {
  name: string;
  description: string;
  feats: EnhancedFeature[];
}

/**
 * Enhanced Community data with parsed combat features
 */
export interface EnhancedCommunity {
  name: string;
  description: string;
  note?: string;
  feats: EnhancedFeature[];
}
