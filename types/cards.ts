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
export type ActionType = 'attack' | undefined;

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
 * Damage scaling modes for Daggerheart
 *
 * Per SRD "Attacking.md":
 * - 'proficiency': Dice count = Proficiency (weapons, "using your Proficiency" with variable notation)
 * - 'spellcast': Dice count = Spellcast trait ("equal to your Spellcast trait")
 * - 'resource': Dice count = resource spent (tokens, Hope, Stress)
 * - 'none': Fixed dice count (e.g., "2d8+4" never changes)
 */
export type DamageScaling = 'proficiency' | 'spellcast' | 'resource' | 'none';

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
 * Structured gains from using an ability (e.g., "gain 3 Hope", "clear a Hit Point")
 */
export interface CardGains {
  hope?: number;
  stress_clear?: number;    // Clear X Stress
  hit_points_clear?: number; // Clear X Hit Points (heal)
  armor_slots_clear?: number; // Clear X Armor Slots (restore armor)
}

/**
 * Attack mechanics for combat abilities
 */
export interface CardAttack {
  trait?: string;
  range: Range;
  targets?: TargetType;
  damage?: string;
  damage_type?: DamageType;
  damage_scaling?: DamageScaling; // How dice count scales (proficiency, spellcast, resource, or none)
  resource_type?: 'hope' | 'stress' | 'tokens'; // For 'resource' scaling, what resource determines dice count
  difficulty?: number; // Fixed DC if applicable
  secondary_effects?: string[];
  combat_category?: CombatCategory; // Determines which buttons to show
  additional_damage?: AdditionalDamage[];
  is_triggered_bonus?: boolean; // True if this is bonus damage on a triggered ability, not a standalone attack
}

export interface AdditionalDamage {
  damage: string;
  damage_type?: DamageType;
  condition?: string;
  label?: string; // Short label for the button, e.g. "Extra", "Hope"
}

/**
 * Roll requirements for abilities
 */
export interface CardRoll {
  type: string; // e.g., "Spellcast Roll", "Strength Roll"
  trait?: string; // The trait used for the roll
  difficulty?: number; // null for contested, number for fixed DC
  target_reaction?: boolean; // Does target get a reaction roll?
  requires_cost_for_roll?: boolean; // If true, costs must be paid before rolling (e.g., "Spend a Hope to make a roll")
}

/**
 * Stat modifier applied by a card
 */
export interface CardModifier {
  stat: string;           // Target stat: "agility", "evasion", "damage", etc.
  value: number;          // Calculated numeric value (or base value for tier_scaling)
  formula?: string;       // Dynamic formula if applicable: "half_agility", "3_plus_strength"
  condition?: ModifierCondition; // Activation condition
  source?: string;        // Card name (for debugging)
  tier_scaling?: TierScaling; // Tier-based value scaling (e.g., Bare Bones thresholds)
}

/**
 * Tier-based value scaling for modifiers
 * Maps character tier (1-4) to modifier values
 * Used by cards like Bare Bones that have different thresholds per tier
 */
export interface TierScaling {
  1: number;
  2: number;
  3: number;
  4: number;
}

/**
 * Condition types for modifier activation
 * ============================================================================
 * These conditions determine WHEN a modifier is active. The UI component
 * (DomainAbilityButton) handles the activation flow for most types.
 *
 * See lib/card-parser.ts for full documentation on each condition type.
 *
 * Quick Reference:
 * - 'always': Active when card is in loadout
 * - 'when_armored': Active when armor is equipped
 * - 'when_unarmored': Active when NO armor is equipped
 * - 'when_active': Requires user to click activation button (Mark Stress/Spend Hope/Activate)
 * - 'when_active_permanent': Like when_active, but applies even from vault (e.g., Vitality)
 * - 'cost_activated': DEPRECATED - use 'when_active' instead
 * - 'loadout_domain_count': Active when loadout has enough cards from a domain
 * - 'environment': Active based on environment (future feature)
 */
export type ModifierCondition =
  | { type: 'always' }
  | { type: 'when_armored' }
  | { type: 'when_unarmored' }
  | { type: 'when_active' }
  | { type: 'when_active_permanent' }  // Applies even from vault once activated (e.g., Vitality)
  | { type: 'cost_activated' }  // DEPRECATED: Use 'when_active' instead
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
  gains?: CardGains | null;
  keywords?: string[];
  tokens?: CardTokens;
  attack?: CardAttack | null;
  roll?: CardRoll | null;
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

  // Top-level stat bonuses (permanent character creation bonuses)
  stat_bonuses?: {
    evasion?: number;
    experience?: number;
    damage_thresholds?: string | number;
    hit_point_slots?: number;
    stress_slots?: number;
  };
}

/**
 * Character card state - tracks runtime state per card per character
 */
export interface CharacterCardState {
  card_name?: string;
  current_tokens: number;
  used_this_rest: boolean;
  used_this_long_rest: boolean;
  used_this_session: boolean;
  is_active: boolean; // For persistent effects
  last_roll_result?: number; // Last roll result for token generation
  active_modifiers?: Record<string, boolean>; // Per-modifier activation state
}

/**
 * CardStates map - keyed by card name
 * Used by modifier aggregator and other services
 */
export type CardStates = Record<string, CharacterCardState>;

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
