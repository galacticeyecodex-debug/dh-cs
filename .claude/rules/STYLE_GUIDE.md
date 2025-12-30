# Daggerheart Character Sheet - UI/UX Style Guide

This document establishes the design standards and coding conventions for the Daggerheart Character Sheet application. All new features and refactors must adhere to these guidelines to ensure a consistent, polished, and intuitive user experience.


## 1. File Documentation

All new files must begin with a comprehensive, paragraph-length documentation comment explaining the file's intended functionality. 

- **Purpose:** To provide immediate context for developers and AI assistants regarding the file's role in the architecture.
- **Content:** Explain *what* the component/script does, *why* it exists, and its key features or interactions.
- **Permanence:** This comment must **never be removed**.
- **Editing:** This comment can only be edited with **explicit permission**.

**Example:**
```tsx
/**
 * CHARACTER VIEW
 * ----------------------------------------------------------------------------
 * This is the main dashboard for viewing a character's core information.
 * 
 * FUNCTIONALITY:
 * - Displays critical character data: Vitals (HP, Stress), Stats (Traits), and Experiences.
 * - Manages sub-panels for "Stats", "Gallery" (character images), and "Lore" (backstory details).
 * - Integrates leveling up and character management interactions via modals.
 */
```

## 2. Layout & Structure


### 2.1 Page Containers
All main views (Character, Combat, Inventory, Playmat) must be wrapped in a container that provides consistent spacing and bottom padding for the navigation bar.

- **Standard Container:** `div.space-y-6.pb-24`
- **Section Spacing:** Use `space-y-2` or `space-y-3` for grouping related elements within a section.

### 2.2 Section Headers
Every major section must have a header that clearly identifies the content. Headers often include a toggle button for visibility.

- **Typography:** `text-xs font-bold uppercase text-gray-500 tracking-wider`
- **Iconography:** Use `lucide-react` icons (size 14) placed before the text.
- **Toggle Button (Standard):**
  - **Container:** `flex items-center justify-between`
  - **Button Style:** `flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded`
  - **Icons:** `Eye` (when hidden/to show) and `EyeOff` (when visible/to hide).
  - **Text:** "Show" or "Hide" displayed next to the icon.

**Example:**
```tsx
<div className="flex items-center justify-between">
  <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
    <Swords size={14} /> Active Weapons
  </h3>
  <button
    onClick={() => setShowWeapons(!showWeapons)}
    className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
  >
    {showWeapons ? <EyeOff size={14} /> : <Eye size={14} />}
    {showWeapons ? 'Hide' : 'Show'}
  </button>
</div>
```

### 2.3 Panels & Cards
Content is grouped into cards using specific Tailwind utility classes for a unified "glassmorphism" aesthetic.

- **Background:** `bg-dagger-panel` (custom theme color) or `bg-white/5`.
- **Border:** `border border-white/10`.
- **Radius:** `rounded-xl` for primary containers, `rounded-lg` for items within lists.
- **Interaction:** Interactive cards should use `hover:border-white/30` or `hover:bg-white/10`.

## 3. Typography

- **Font Family:**
  - **Headers/Names:** `font-serif` (e.g., Weapon names, Character name).
  - **UI Elements:** `font-sans` (default).
- **Colors:**
  - **Primary Text:** `text-white` or `text-gray-200`.
  - **Secondary/Meta:** `text-gray-400` or `text-gray-500`.
  - **Accent/Gold:** `text-dagger-gold` (used for modified stats, active states, and emphasis).
- **Numbers:** Important values (damage, stats) should use `font-bold`.

## 4. Data Representation

### 4.1 Modifiable Stats
Any derived statistic that can be modified by the user or system (e.g., Traits, Proficiency, Evasion) **MUST** follow the modification indicator patterns defined in `lib/styles.ts`.

- **Visual Indicators:**
  - **Text Color:** `text-dagger-gold` (via `getValueColor(true)`) when modified, `text-white` otherwise.
  - **Panel Border:** `border-yellow-500/50 border-dashed` (via `getPanelBorder({ isModified: true })`) for modified panels.
  - **Gold Dot (optional):** Some components use a small indicator dot: `absolute top-1 right-1 w-1.5 h-1.5 bg-dagger-gold rounded-full`
- **Interaction:** Clicking the stat **MUST** open the `ModifierSheet` component to allow tracking the source of the modification.

**Example (`StatButton`):**
```tsx
import { getValueColor } from '@/lib/styles';

const isModified = baseValue !== undefined && value !== baseValue;

<button
  className={clsx(
    "p-3 min-w-[3rem] flex items-center justify-center font-bold text-xl",
    getValueColor(isModified) // Returns 'text-dagger-gold' or 'text-white'
  )}
>
  {value >= 0 ? `+${value}` : value}
</button>
```

**Note:** Always use the utilities from `lib/styles.ts` for consistent styling:
- `getValueColor(isModified)` - Returns text color class
- `getModifierValueColor(value)` - Returns green/red/white based on modifier sign
- `getPanelBorder({ isModified, isCritical })` - Returns appropriate border class

### 4.2 Vitals (HP, Stress, Armor)
Use the `VitalCard` component for consistency.

- **Rectangle Variant:** For countable resources (HP, Stress, Hope).
- **Square Variant:** For single-value stats (Evasion, Armor Score).
- **Critical State:** Use `border-red-500` or `text-red-500` to indicate danger (e.g., 0 HP, Max Stress).

## 5. Component Standards

### 5.1 StatButton
Used for the 6 core traits (Agility, Strength, etc.).
- **Left Side:** Label (Click to Roll).
- **Right Side:** Value (Click to Modify).

### 5.2 ModifierSheet
The standard bottom-sheet component for managing temporary bonuses/penalties.
- **Required Props:** `statLabel`, `baseValue`, `currentModifiers`, `onUpdateModifiers`.
- **Behavior:** Lists all active modifiers (User & System) and calculates the total.

### 5.3 Inventory Items
- **Layout:** Flex row with `justify-between`.
- **Equipped State:**
  - Background: `bg-dagger-gold/10`.
  - Border: `border-dagger-gold/30`.
  - Label: "PRIMARY", "SECONDARY", or "ARMOR" badge.
- **Unequipped State:**
  - Background: `bg-white/5`.
  - Border: `border-white/5`.

## 6. Icons
- Use **Lucide React** icons.
- Standard size for headers/labels: `size={14}` or `size={16}`.
- Icons should generally be paired with text and consistent across views (e.g., `Shield` for Armor, `Zap` for Stress/Hope).

## 7. Interaction Patterns

### 7.1 Always-Visible Action Buttons
**CRITICAL:** Action buttons (Edit, Delete, Remove, etc.) **MUST ALWAYS BE VISIBLE**. Never use hover-only patterns.

**❌ FORBIDDEN Pattern:**
```tsx
// DO NOT USE - Hidden until hover
<div className="opacity-0 group-hover:opacity-100">
  <button><Trash2 /></button>
</div>
```

**✅ REQUIRED Pattern:**
```tsx
// Always visible with color-coded feedback
<div className="flex items-center gap-2">
  <button
    className="p-1.5 text-blue-400 hover:bg-white/10 rounded transition-colors"
    title="Edit"
  >
    <Edit2 size={16} />
  </button>
  <button
    className="p-1.5 text-red-400 hover:bg-white/10 rounded transition-colors"
    title="Delete"
  >
    <Trash2 size={16} />
  </button>
</div>
```

**Rationale:**
1. **Mobile Support:** Touch devices don't have hover states - buttons are completely invisible.
2. **Discoverability:** Users shouldn't have to "hunt" for interactive elements.
3. **Accessibility:** Screen readers and keyboard navigation struggle with hover-dependent UI.
4. **Consistency:** Clear, predictable interactions across the entire application.

**Color Coding:**
- **Edit/Modify:** `text-blue-400` (blue indicates non-destructive action)
- **Delete/Remove:** `text-red-400` (red indicates destructive action)
- **Add/Create:** `text-green-400` or `text-dagger-gold` (positive action)

## 8. Colors

### 8.1 Theme Colors (app/globals.css)
- **`dagger-gold`**: `#C8AA6E` (Primary accent)
- **`dagger-dark`**: `#0a0a0a` (Backgrounds)
- **`dagger-panel`**: `#1a1a1a` (Card backgrounds)

### 8.2 Semantic Colors (lib/styles.ts)
Import from `@/lib/styles` for consistency:

**Value Colors:**
- `VALUE_COLORS.default` = `text-white` (unmodified values)
- `VALUE_COLORS.modified` = `text-dagger-gold` (modified values)
- `VALUE_COLORS.positive` = `text-green-400` (positive modifiers)
- `VALUE_COLORS.negative` = `text-red-400` (negative modifiers)

**Vital Colors:**
- `VITAL_COLORS.hitPoints` = `text-red-400`
- `VITAL_COLORS.stress` = `text-purple-400`
- `VITAL_COLORS.hope` = `text-dagger-gold`
- `VITAL_COLORS.armor` = `text-blue-400`
- `VITAL_COLORS.evasion` = `text-cyan-400`

**Badge Styles:**
- `BADGE.equipment` - Gold styling for equipped items
- `BADGE.system` - Blue styling for auto-calculated values
- `BADGE.domainCard` - Purple styling for domain card modifiers
- `BADGE.homebrew` - Purple styling for custom items

---
*This guide is a living document. Update it when introducing new standard UI patterns.*
