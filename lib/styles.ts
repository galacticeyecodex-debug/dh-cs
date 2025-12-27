/**
 * STYLE CONSTANTS & UTILITIES
 * ============================================================================
 * Central source of truth for styling patterns across the app.
 * Import these instead of hardcoding class strings to ensure consistency.
 *
 * CORE RULES:
 * 1. VALUE COLORS: Values are WHITE unless modified, then GOLD
 * 2. MODIFIER COLORS: Positive = GREEN, Negative = RED
 * 3. PANELS: Use consistent border/background patterns
 * 4. MODIFIED STATE: Always show gold indicator dot + gold text
 */

import clsx from 'clsx';

// =============================================================================
// VALUE COLORS
// The fundamental rule: values are WHITE by default, GOLD when modified
// =============================================================================

export const VALUE_COLORS = {
  /** Default color for unmodified values */
  default: 'text-white',
  /** Color for values that have been modified from their base */
  modified: 'text-dagger-gold',
  /** Color for positive modifier amounts (+X) */
  positive: 'text-green-400',
  /** Color for negative modifier amounts (-X) */
  negative: 'text-red-400',
  /** Muted/disabled color */
  muted: 'text-gray-400',
} as const;

/**
 * Returns the correct text color class for a value based on modification state.
 *
 * @example
 * // In a component displaying damage
 * <div className={getValueColor(damageModifier !== 0)}>{damage}</div>
 */
export function getValueColor(isModified: boolean): string {
  return isModified ? VALUE_COLORS.modified : VALUE_COLORS.default;
}

/**
 * Returns the correct color class for a modifier value based on its sign.
 * Positive values get green, negative get red, zero gets default.
 *
 * @example
 * <span className={getModifierValueColor(modifier)}>{modifier}</span>
 */
export function getModifierValueColor(value: number): string {
  if (value > 0) return VALUE_COLORS.positive;
  if (value < 0) return VALUE_COLORS.negative;
  return VALUE_COLORS.default;
}

// =============================================================================
// VITAL/RESOURCE COLORS
// Semantic colors for character resources and stats
// =============================================================================

export const VITAL_COLORS = {
  hitPoints: 'text-red-400',
  stress: 'text-purple-400',
  hope: 'text-dagger-gold',
  armor: 'text-blue-400',
  evasion: 'text-cyan-400',
  /** Generic attack/action color */
  attack: 'text-yellow-400',
  /** Damage indicator color */
  damage: 'text-red-400',
  /** Spellcast/magic color */
  spellcast: 'text-purple-300',
} as const;

// =============================================================================
// MODIFIED STATE INDICATOR
// The gold dot shown on modified values
// =============================================================================

/**
 * Class for the small gold indicator dot shown on modified values.
 * Position this absolutely within a relative parent.
 */
export const MODIFIED_INDICATOR = 'absolute top-1 right-1 w-1.5 h-1.5 bg-dagger-gold rounded-full';

/**
 * Renders the modified indicator dot if the value is modified.
 * Use this as a convenience when you need the conditional logic.
 */
export function getModifiedIndicatorClass(isModified: boolean): string {
  return isModified ? MODIFIED_INDICATOR : '';
}

// =============================================================================
// PANEL/CARD STYLES
// Consistent patterns for panels, cards, and containers
// =============================================================================

export const PANEL = {
  /** Base panel styling - background, default border, rounded corners */
  base: 'bg-dagger-panel border rounded-xl',
  /** Full base with default border color */
  baseWithBorder: 'bg-dagger-panel border border-white/10 rounded-xl',
} as const;

export const PANEL_PADDING = {
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
  xl: 'p-6',
} as const;

export const PANEL_BORDERS = {
  /** Default subtle border */
  default: 'border-white/10',
  /** Slightly more visible on hover */
  hover: 'border-white/20',
  /** Strong hover state */
  hoverStrong: 'border-white/30',
  /** Gold accent border for important panels */
  accent: 'border-dagger-gold/30',
  /** Critical state - red with ring */
  critical: 'border-red-500 ring-2 ring-red-500',
  /** Modified state - dashed yellow */
  modified: 'border-yellow-500/50 border-dashed',
} as const;

/**
 * Returns the appropriate border class based on state priority.
 * Priority: critical > modified > default
 *
 * @example
 * <div className={clsx(PANEL.base, getPanelBorder({ isCritical, isModified }))}>
 */
export function getPanelBorder(opts: {
  isCritical?: boolean;
  isModified?: boolean;
  isAccent?: boolean;
}): string {
  if (opts.isCritical) return PANEL_BORDERS.critical;
  if (opts.isModified) return PANEL_BORDERS.modified;
  if (opts.isAccent) return PANEL_BORDERS.accent;
  return PANEL_BORDERS.default;
}

// =============================================================================
// INPUT STYLES
// Form inputs and interactive elements
// =============================================================================

export const INPUT = {
  /** Standard input field styling */
  base: 'bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white',
  /** Focus state additions */
  focus: 'focus:border-dagger-gold focus:outline-none transition-colors',
  /** Combined base + focus */
  full: 'bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-dagger-gold focus:outline-none transition-colors',
} as const;

// =============================================================================
// BUTTON STYLES
// Common button patterns (complements the CVA button component)
// =============================================================================

export const BUTTON = {
  /** Primary gold button */
  primary: 'bg-dagger-gold hover:bg-yellow-500 text-black font-bold',
  /** Secondary subtle button */
  secondary: 'bg-white/10 hover:bg-white/20 text-white font-bold',
  /** Ghost/minimal button */
  ghost: 'bg-transparent hover:bg-white/5 text-gray-400 hover:text-white',
  /** Destructive/danger button */
  danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30',
} as const;

// =============================================================================
// TAB STYLES
// Tab navigation patterns
// =============================================================================

export const TAB = {
  /** Active tab styling */
  active: 'bg-dagger-gold text-black shadow-sm',
  /** Inactive tab styling */
  inactive: 'text-gray-400 hover:text-white hover:bg-white/5',
} as const;

/**
 * Returns the appropriate tab class based on active state.
 */
export function getTabClass(isActive: boolean): string {
  return isActive ? TAB.active : TAB.inactive;
}

// =============================================================================
// FEATURE/TRAINING COLORS
// Colors for different feature types (e.g., companion training options)
// =============================================================================

export const FEATURE_COLORS = {
  intelligent: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  lightInTheDark: { bg: 'bg-dagger-gold/10', text: 'text-dagger-gold', border: 'border-dagger-gold/20' },
  creatureComfort: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  armored: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  vicious: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  resilient: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  bonded: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  aware: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
  // Fallback
  default: { bg: 'bg-dagger-gold/10', text: 'text-dagger-gold', border: 'border-dagger-gold/20' },
} as const;

export type FeatureColorKey = keyof typeof FEATURE_COLORS;

/**
 * Get feature color classes by key.
 */
export function getFeatureColors(key: string): { bg: string; text: string; border: string } {
  const colorKey = key.replace(/_/g, '') as FeatureColorKey;
  return FEATURE_COLORS[colorKey] || FEATURE_COLORS.default;
}

// =============================================================================
// SHADOW HIERARCHY
// Consistent elevation levels
// =============================================================================

export const SHADOWS = {
  /** Subtle elevation for cards */
  sm: 'shadow-sm',
  /** Medium elevation for dropdowns, popovers */
  md: 'shadow-md',
  /** High elevation for modals */
  lg: 'shadow-lg',
  /** Maximum elevation for full-screen overlays, bottom sheets */
  xl: 'shadow-2xl',
} as const;

// =============================================================================
// BADGE STYLES
// Tags, labels, and badges
// =============================================================================

export const BADGE = {
  /** Equipment modifier badge */
  equipment: 'bg-dagger-gold/20 text-dagger-gold px-1.5 rounded text-[10px] border border-dagger-gold/30',
  /** System/auto-calculated badge */
  system: 'bg-blue-900/50 text-blue-300 px-1.5 rounded text-[10px] border border-blue-500/30',
  /** Domain card badge */
  domainCard: 'bg-purple-900/50 text-purple-300 px-1.5 rounded text-[10px] border border-purple-500/30',
  /** Homebrew/custom badge */
  homebrew: 'bg-purple-500/20 text-purple-300 px-1.5 rounded text-[10px] border border-purple-500/30',
  /** Multiclass badge */
  multiclass: 'bg-dagger-gold/20 text-dagger-gold px-1.5 rounded text-[10px] border border-dagger-gold/30',
  /** Success/max badge */
  success: 'bg-green-500/20 text-green-400 px-1.5 rounded text-[10px] font-bold',
  /** Inactive/disabled badge */
  inactive: 'bg-red-900/50 text-red-400 px-1.5 rounded text-[10px] border border-red-500/30',
} as const;

// =============================================================================
// COST TAGS
// Resource cost display (Hope, Stress, etc.)
// =============================================================================

export const COST_TAG = {
  hope: 'bg-dagger-gold/20 text-dagger-gold border border-dagger-gold/30',
  stress: 'bg-red-900/30 text-red-400 border border-red-500/30',
  action: 'bg-orange-900/50 text-orange-300 border border-orange-500/30',
} as const;

// =============================================================================
// UTILITY: Combined class builder
// =============================================================================

/**
 * Builds a complete panel class string with all appropriate states.
 *
 * @example
 * <div className={buildPanelClass({ isModified: true, padding: 'lg' })}>
 */
export function buildPanelClass(opts: {
  isCritical?: boolean;
  isModified?: boolean;
  isAccent?: boolean;
  isClickable?: boolean;
  padding?: keyof typeof PANEL_PADDING;
}): string {
  return clsx(
    PANEL.base,
    getPanelBorder(opts),
    opts.padding ? PANEL_PADDING[opts.padding] : PANEL_PADDING.lg,
    opts.isClickable && 'cursor-pointer hover:border-white/30 transition-colors'
  );
}
