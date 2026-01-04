# Daggerheart Character Sheet - UI Card Reference

This document provides ASCII diagrams of all UI card components used throughout the application. These diagrams serve as a design reference for maintaining consistency and planning future updates.

---

## Table of Contents

1. [Global Patterns](#global-patterns)
2. [Character View Cards](#character-view-cards)
3. [Combat View Cards](#combat-view-cards)
4. [Inventory View Cards](#inventory-view-cards)
   - [Inventory Item Card with Art (Future Feature)](#inventory-item-card-with-art-future-feature)
   - [Item Art Modal](#item-art-modal-reuses-carddetailmodal-pattern)
5. [Playmat View Cards](#playmat-view-cards)
6. [Shared Components](#shared-components)

---

## Global Patterns

### Section Header Pattern

All sections use a consistent header with optional show/hide toggle:

```
┌─────────────────────────────────────────────────────────────────┐
│  [Icon] SECTION TITLE                          [👁 Hide/Show]  │
└─────────────────────────────────────────────────────────────────┘
        ↓                                              ↓
   text-xs font-bold                        text-xs text-gray-500
   uppercase text-gray-500                  hover:text-white
   tracking-wider
```

### Standard Panel Pattern

The base card container used throughout:

```
╔═══════════════════════════════════════════════════════════════╗
║  bg-dagger-panel                                              ║
║  border border-white/10                                       ║
║  rounded-xl                                                   ║
║  p-4                                                          ║
║                                                               ║
║  [Content goes here]                                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

### Feature Card Pattern (Nested)

Used for ancestry features, community features, class features:

```
┌───────────────────────────────────────────────────────────────┐
│  bg-white/5  border border-white/5  rounded  p-3             │
│                                                               │
│  ╭─────────────────────────────────────────────────────────╮  │
│  │  FEATURE NAME                                           │  │
│  │  text-xs font-bold text-dagger-gold uppercase           │  │
│  ╰─────────────────────────────────────────────────────────╯  │
│                                                               │
│  Feature description text goes here with **bold** sections    │
│  rendered as strong elements. text-sm text-gray-300           │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## Character View Cards

### Social Profile Header

The hero section at the top of Character View:

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  [Background Image / Blur of Avatar]                      ⚙️ [Manage Button]  ║
║  bg-gray-900  h-48 md:h-64                                                    ║
║  ┌──────────────────────────────────────────────────────────────────────────┐ ║
║  │  Gradient overlay: bg-gradient-to-t from-dagger-dark                    │ ║
║  └──────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  ┌─────────┐                                                                  ║
║  │         │   CHARACTER NAME                                                 ║
║  │ AVATAR  │   text-3xl md:text-5xl font-serif font-bold                     ║
║  │  📷     │                                                                  ║
║  │         │   ┌────────────────┐                                             ║
║  └─────────┘   │ LVL 5 │ BARD   │                                             ║
║    w-24 h-24   └────────────────┘                                             ║
║    rotate-3    Level + Class Badge                                            ║
║    border-4    bg-dagger-gold  text-black                                     ║
║    border-                                                                    ║
║    dagger-gold                                                                ║
║                                                                               ║
║                ┌─────────┐  ┌───────────────┐  ┌───────────────┐             ║
║                │ Faerie  │  │ Ridgeback     │  │ ✨ Werewolf  │             ║
║                └─────────┘  └───────────────┘  └───────────────┘             ║
║                Ancestry      Community          Transformation                ║
║                Badge         Badge              Badge (Playtest)              ║
║                bg-black/20   bg-black/20        bg-purple-500/20              ║
║                                                 border-purple-500/30          ║
║                (all inline with gap-2 md:gap-4)                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Segmented Tab Bar

Sticky navigation tabs:

```
╔═══════════════════════════════════════════════════════════════╗
║  bg-dagger-dark/95  backdrop-blur  border-b border-white/10   ║
║  sticky top-0 z-10                                            ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │  bg-white/5  rounded-lg  p-1                            │  ║
║  │                                                         │  ║
║  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                │  ║
║  │  │ 📊 STATS │ │ 🖼 GALLE │ │ 📖 LORE  │                │  ║
║  │  │ [active] │ │   RY     │ │          │                │  ║
║  │  └──────────┘ └──────────┘ └──────────┘                │  ║
║  │                                                         │  ║
║  │  Active: bg-dagger-gold text-black                     │  ║
║  │  Inactive: text-gray-400 hover:text-white              │  ║
║  └─────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════╝
```

### Vital Card (Square Variant - Evasion/Armor)

```
╔═══════════════════════════════════════════════════════════════╗
║  bg-dagger-panel  border border-white/10  rounded-xl          ║
║  (or border-dagger-gold/30 if modified)                       ║
║  (or border-red-500 if critical)                              ║
║                                                               ║
║              ┌─────────────────────────────────┐              ║
║              │  👁 EVASION                     │              ║
║              │  text-[10px] font-bold uppercase │              ║
║              │  text-cyan-400                   │              ║
║              └─────────────────────────────────┘              ║
║                                                               ║
║                          12                                   ║
║                   text-2xl font-serif                         ║
║                   font-bold                                   ║
║                   (text-dagger-gold if modified)              ║
║                                                               ║
║              ┌──────────┐  ┌──────────┐                       ║
║              │    -     │  │    +     │                       ║
║              │  h-7     │  │  h-7     │                       ║
║              │bg-white/5│  │bg-white/5│                       ║
║              └──────────┘  └──────────┘                       ║
╚═══════════════════════════════════════════════════════════════╝
```

### Vital Card (Rectangle Variant - HP/Stress/Hope)

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  bg-dagger-panel  border border-white/10  rounded-xl  w-full                  ║
║                                                                               ║
║              ┌─────────────────────────────────────────────┐                  ║
║              │  ❤ HIT POINTS                              │                  ║
║              │  text-[10px] font-bold uppercase            │                  ║
║              │  text-red-400 (color varies by type)        │                  ║
║              └─────────────────────────────────────────────┘                  ║
║                                                                               ║
║     ┌─────────────────────────────────────────────────────────────────┐       ║
║     │  Track Display (icon-based):                                    │       ║
║     │                                                                 │       ║
║     │    ❤  ❤  ❤  ❤  ❤  ❤  🤍  🤍  🤍  🤍                      │       ║
║     │    ↑ filled (current)    ↑ empty (remaining capacity)           │       ║
║     │                                                                 │       ║
║     │  - Filled: text-{color} scale-100 fill="currentColor"           │       ║
║     │  - Empty: text-white/10 scale-90 fill="none"                    │       ║
║     │  - Full Bad (all marked): text-red-500                          │       ║
║     └─────────────────────────────────────────────────────────────────┘       ║
║                                                                               ║
║     ┌──────────────────────┐  ┌──────────────────────┐                        ║
║     │       CLEAR          │  │        MARK          │    (trackType=mark-bad)║
║     │ text-[10px] uppercase│  │ text-[10px] uppercase│                        ║
║     │  h-7  bg-white/5     │  │  h-7  bg-white/5     │                        ║
║     └──────────────────────┘  └──────────────────────┘                        ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Armor Card with Damage Thresholds

```
╔═══════════════════════════════════════════════════════════════╗
║  bg-dagger-panel  border border-white/10  rounded-xl          ║
║                                                               ║
║              ┌─────────────────────────────────┐              ║
║              │  🛡 ARMOR                       │              ║
║              │  text-blue-400                  │              ║
║              └─────────────────────────────────┘              ║
║                                                               ║
║            🛡  🛡  🛡  🔵  🔵  🔵  🔵  🔵                   ║
║            ↑ marked (used)   ↑ available                      ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │  MIN: 3         MAJ: 7         SEV: 12                  │  ║
║  │  text-[9px] uppercase text-gray-500                     │  ║
║  └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║     ┌────────────────┐  ┌────────────────┐                    ║
║     │     CLEAR      │  │     MARK       │                    ║
║     └────────────────┘  └────────────────┘                    ║
╚═══════════════════════════════════════════════════════════════╝
```

### Stat Button (Trait Display)

Two-part interactive button for traits with icon action buttons:

```
╔═══════════════════════════════════════════════════════════════╗
║  bg-white/5  border border-white/5  rounded-lg                ║
║  hover:border-white/20                                        ║
║                                                               ║
║  ┌─────────────────────────────┬──────────────┐               ║
║  │                        🎲  │          ⚙️  │               ║
║  │  Agility                    │   +2         │               ║
║  │  capitalize font-medium     │  font-bold   │               ║
║  │  text-gray-300              │  text-xl     │               ║
║  │                             │              │               ║
║  │  [Click anywhere to Roll]   │  (Value      │               ║
║  │                             │   Display)   │               ║
║  │                             │              │               ║
║  │  hover:bg-white/5           │ text-dagger- │               ║
║  │                             │ gold (if     │               ║
║  │                             │ modified)    │               ║
║  └─────────────────────────────┴──────────────┘               ║
║                                                               ║
║  ● Marked trait indicator (top-left):                         ║
║    - Unmarked: bg-transparent border border-gray-500          ║
║    - Marked: bg-dagger-gold (filled gold circle)              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

**Interactive Elements:**
- **🎲 Dice icon (top-right of left section):** Click to trigger dice roll for this trait
- **Left section (trait name):** Click anywhere to trigger dice roll for this trait
- **⚙️ Gear icon (top-right of entire card):** Click to open modifier management sheet
  - Only visible when modifiers are available (`onUpdateModifiers` prop provided)
- **Right section (value):** Display only - shows current total value (base + modifiers)

**Visual Feedback:**
- Value turns gold (`text-dagger-gold`) when modified from base
- Both button areas have subtle hover effects
- Icons are gray (`text-gray-500`) and lighten on hover (`hover:text-gray-300`)

### Experience Row

```
╔═══════════════════════════════════════════════════════════════╗
║  bg-white/5  border border-white/5  rounded-lg                ║
║                                                               ║
║  ┌─────────────────────────────────────┬──────────────┐       ║
║  │                                     │              │       ║
║  │  Nimble Fingers                     │     +2       │       ║
║  │  capitalize font-medium             │  font-bold   │       ║
║  │  text-gray-300                      │  text-xl     │       ║
║  │  flex-1  p-3                        │  text-white  │       ║
║  │                                     │  border-l    │       ║
║  │                                     │  border-     │       ║
║  │                                     │  white/5     │       ║
║  │                                     │  min-w-[3rem]│       ║
║  │                                     │  p-3         │       ║
║  │                                     │              │       ║
║  └─────────────────────────────────────┴──────────────┘       ║
╚═══════════════════════════════════════════════════════════════╝
```

### Ancestry/Community Panel

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  bg-dagger-panel  border border-white/10  rounded-xl  p-4                     ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────┬────────┐     ║
║  │  FAERIE                                                     │  ℹ️    │     ║
║  │  font-serif font-bold text-white                            │ Toggle │     ║
║  └─────────────────────────────────────────────────────────────┴────────┘     ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  [Collapsible Lore - if showLore=true]                              │      ║
║  │  text-sm text-gray-300  bg-white/5  rounded-lg  p-3                 │      ║
║  │                                                                     │      ║
║  │  Faeries are magical creatures from the Wandering Woods...          │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  bg-white/5  rounded  p-3  border border-white/5                    │      ║
║  │                                                                     │      ║
║  │  ╭─────────────────────────────────────────────────────────────╮    │      ║
║  │  │  TINY SIZE                                                  │    │      ║
║  │  │  text-xs font-bold text-dagger-gold uppercase tracking-wider│    │      ║
║  │  ╰─────────────────────────────────────────────────────────────╯    │      ║
║  │                                                                     │      ║
║  │  You are **Tiny** in size. You can fit through small spaces...      │      ║
║  │  text-sm text-gray-300                                              │      ║
║  │  (**bold** renders as <strong className="text-white">)              │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  [Additional feature cards follow same pattern...]                            ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Subclass Feature Card (Unified)

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  bg-dagger-panel  border border-white/10  rounded-xl  p-4                     ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────┬────────┐     ║
║  │  LOREKEEPER                          ┌──────────────┐       │  ℹ️    │     ║
║  │  font-serif font-bold text-white     │ MULTICLASS   │       │ Toggle │     ║
║  │                                      │ (if applies) │       │        │     ║
║  │                                      │ bg-dagger-   │       │        │     ║
║  │                                      │ gold/20      │       │        │     ║
║  │                                      └──────────────┘       │        │     ║
║  └─────────────────────────────────────────────────────────────┴────────┘     ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  [Collapsible Lore]  bg-white/5  p-3  rounded-lg  border            │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  ┌───────────────────┐                                                        ║
║  │  FOUNDATION       │  <- Tier badge                                         ║
║  │  bg-dagger-gold/20│     (Foundation = gold, others = white/10)             ║
║  │  text-dagger-gold │                                                        ║
║  └───────────────────┘                                                        ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  bg-white/5  rounded  p-3  border border-white/5                    │      ║
║  │                                                                     │      ║
║  │  ARCANE LIBRARY                                                     │      ║
║  │  text-xs font-bold text-dagger-gold uppercase                       │      ║
║  │                                                                     │      ║
║  │  You have access to a vast collection of scrolls...                 │      ║
║  │  text-sm text-gray-300                                              │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  ┌───────────────────┐                                                        ║
║  │  SPECIALIZATION   │  <- Next tier badge                                    ║
║  │  bg-white/10      │                                                        ║
║  │  text-gray-400    │                                                        ║
║  └───────────────────┘                                                        ║
║                                                                               ║
║  [Feature cards for specialization...]                                        ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Companion Card (Ranger Beastbound)

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  bg-dagger-panel  border border-white/10  rounded-xl  overflow-hidden         ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  p-4  border-b border-white/10                                      │      ║
║  │                                                                     │      ║
║  │  ┌───────────┐                                  ┌───────────────┐   │      ║
║  │  │           │   SHADOW                         │  👁 EVASION   │   │      ║
║  │  │  PORTRAIT │   font-serif font-bold text-lg   │  text-cyan-400 │   │      ║
║  │  │   🐾 📷   │                                  │               │   │      ║
║  │  │  w-16 h-16│   Wolf                           │      9        │   │      ║
║  │  │  border-2 │   text-sm text-gray-400          │  text-xl      │   │      ║
║  │  │  border-  │   capitalize                     │  font-bold    │   │      ║
║  │  │  dagger-  │                                  │               │   │      ║
║  │  │  gold/50  │                                  └───────────────┘   │      ║
║  │  └───────────┘                                                      │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  p-3  border-t border-white/5                                       │      ║
║  │                                                                     │      ║
║  │  ⚡ STRESS                                                          │      ║
║  │  text-[10px] font-bold uppercase text-purple-400                    │      ║
║  │                                                                     │      ║
║  │    ⚡  ⚡  ⚡  ○  ○  ○                                              │      ║
║  │    (filled = stress accumulated, empty = capacity)                  │      ║
║  │    (all filled = text-red-500)                                      │      ║
║  │                                                                     │      ║
║  │    ┌────────┐  ┌────────┐                                           │      ║
║  │    │ CLEAR  │  │  MARK  │                                           │      ║
║  │    └────────┘  └────────┘                                           │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  p-3  border-t border-white/5                                       │      ║
║  │                                                                     │      ║
║  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐            │      ║
║  │  │  ATTACK   │ │  DAMAGE   │ │  RANGE    │ │  ARMOR    │            │      ║
║  │  │  Melee    │ │   1d6     │ │  Melee    │ │   ⚡      │            │      ║
║  │  │ bg-black/ │ │ text-     │ │           │ │ (toggle)  │            │      ║
║  │  │ 20        │ │ dagger-   │ │           │ │           │            │      ║
║  │  │           │ │ gold      │ │           │ │           │            │      ║
║  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘            │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  p-3  border-t border-white/5   [EXPERIENCES]                       │      ║
║  │                                                                     │      ║
║  │  ┌──────────────────────────────────────────────────────────────┐   │      ║
║  │  │  Tracking                                           +2       │   │      ║
║  │  │  bg-white/5 rounded-lg px-3 py-2                             │   │      ║
║  │  └──────────────────────────────────────────────────────────────┘   │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  p-3  border-t border-white/5   [TRAINING BADGES]                   │      ║
║  │                                                                     │      ║
║  │  ┌───────────────┐ ┌─────────────────┐ ┌─────────────┐              │      ║
║  │  │  Intelligent  │ │ Light in Dark   │ │  Vicious    │              │      ║
║  │  │  text-cyan-400│ │ text-dagger-gold│ │ text-red-400│              │      ║
║  │  │  bg-cyan-500/ │ │ bg-dagger-gold/ │ │ bg-red-500/ │              │      ║
║  │  │  10           │ │ 10              │ │ 10          │              │      ║
║  │  └───────────────┘ └─────────────────┘ └─────────────┘              │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Lore Tab Text Area Card

```
╔═══════════════════════════════════════════════════════════════╗
║  bg-white/5  p-4  rounded-xl  border border-white/10          ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │  APPEARANCE                              Saving...      │  ║
║  │  font-bold text-white                   text-xs         │  ║
║  │                                         text-gray-400   │  ║
║  │                                         animate-pulse   │  ║
║  │                                          -OR-           │  ║
║  │                                         Saved           │  ║
║  │                                         text-green-400  │  ║
║  └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │  <textarea>                                             │  ║
║  │                                                         │  ║
║  │  Describe your character's physical appearance...       │  ║
║  │                                                         │  ║
║  │  w-full bg-transparent text-sm text-gray-300            │  ║
║  │  resize-none                                            │  ║
║  │  focus:ring-1 focus:ring-dagger-gold                    │  ║
║  │                                                         │  ║
║  └─────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Combat View Cards

### Unified AttackCard (Weapons, Spells, Features)

All combat actions use the same base `AttackCard` component, which adapts its layout and features based on the source (Weapon, Spell, Heritage feature).

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  bg-dagger-panel  border rounded-xl  overflow-hidden  transition-colors       ║
║  (border color depends on variant - see Variants section below)               ║
║  (opacity-50 if isUsed=true)                                                  ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  p-4  flex justify-between items-start relative                     │      ║
║  │                                                            ℹ️ ⚙️    │      ║
║  │  [ICON] NAME                                            2d8+2       │      ║
║  │  font-serif font-bold text-white text-lg                text-xl     │      ║
║  │                                                         font-bold   │      ║
║  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    (gold if    │      ║
║  │  │   BADGE 1    │ │    TRAIT     │ │    RANGE     │    modified)   │      ║
║  │  │  uppercase   │ │  uppercase   │ │  uppercase   │                 │      ║
║  │  │  bg-white/10 │ │  bg-white/10 │ │  bg-white/10 │     1d8 × 2     │      ║
║  │  │  text-gray-  │ │  text-gray-  │ │  text-gray-  │     text-[10px] │      ║
║  │  │  400         │ │  400         │ │  400         │     text-gray-  │      ║
║  │  └──────────────┘ └──────────────┘ └──────────────┘     500         │      ║
║  │                                                         uppercase   │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  [Collapsible Description - only shown if info button clicked]      │      ║
║  │  mx-4 mb-2 p-3 bg-white/5 rounded-lg border border-white/5          │      ║
║  │                                                                     │      ║
║  │  When you succeed on an attack while Cloaked or while an ally is    │      ║
║  │  within Melee range of your target, add a number of d6s...          │      ║
║  │  text-sm text-gray-300                                              │      ║
║  │  (MarkdownText rendered)                                            │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  [Token Track - if tokenTrack prop provided]                        │      ║
║  │  px-4 pb-2                                                          │      ║
║  │         ● ● ● ○ ○        3/5 Tokens                                │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  bg-black/40  p-2  flex flex-wrap gap-2 items-center   [Action Bar] │      ║
║  │                                                                     │      ║
║  │  ┌──────────┐ ┌──────────┐ ┌─────────────────┐ ┌─────────────────┐  │      ║
║  │  │ 😰 +1    │ │ 💛 -2    │ │ ⚡ Attack      │ │  💀 Damage      │  │      ║
║  │  │ STRESS   │ │ HOPE     │ │    (+3)         │ │                 │  │      ║
║  │  │ [Smart]  │ │ [Smart]  │ │                 │ │                 │  │      ║
║  │  └──────────┘ └──────────┘ └─────────────────┘ └─────────────────┘  │      ║
║  │                                                                     │      ║
║  │                                      ┌──────────────────────────┐   │      ║
║  │                                      │  ☐ Once Per Rest        │   │      ║
║  │                                      │  FrequencyCheckbox      │   │      ║
║  │                                      └──────────────────────────┘   │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### AttackCard Variants

The `borderVariant` prop controls the theme of the card:

| Variant | Border Class | Background Class | Use Case |
|---------|--------------|------------------|----------|
| `default` | `border-white/10` | - | Standard Weapons |
| `companion` | `border-dagger-gold/30` | - | Ranger Companions |
| `ancestry` | `border-emerald-500/30`| - | Ancestry Features |
| `community` | `border-amber-500/30` | - | Community Features |
| `spell` | `border-purple-500/30` | `bg-purple-900/10` | Spells / Abilities |
| `reaction` | `border-orange-500/30` | `bg-orange-900/10` | Reaction Spells |

### AttackCard Modular Slots

1.  **ℹ️ Info Button:** Shown if `description` prop is provided. Toggles collapsible description section. Located just left of the gear button in the top-right corner.
    - **Inactive state**: `text-gray-500 hover:text-gray-300`
    - **Active state**: `text-dagger-gold` (when description is visible)
    - **Icon size**: 12px
2.  **⚙️ Gear Button:** Shown if `onManageModifiers` is provided. Opens the modifier management sheet.
3.  **Smart Cost Buttons:** Passed via `customActions`. These use `MarkStressButton` and `SpendHopeButton` which check affordability.
4.  **Token Track:** Passed via `tokenTrack`. Displays interactive resource trackers (e.g., Flight tokens).
5.  **Frequency:** Passed via `frequency`. Displays `FrequencyCheckbox` for once-per-rest/session abilities.
6.  **Roll Buttons:** `Attack` and `Damage` buttons are relative flex-1 and include a small `🎲` dice icon in the top-right corner.

---

### Proficiency Display Row

```
╔═══════════════════════════════════════════════════════════════╗
║  bg-white/5  rounded-lg  px-3 py-2  border border-white/5     ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │                                                         │  ║
║  │  Proficiency                              ┌──────────┐  │  ║
║  │  text-sm font-medium                      │  🎯 2    │  │  ║
║  │  text-gray-300                            │          │  │  ║
║  │                                           │ bg-white/│  │  ║
║  │                                           │ 10       │  │  ║
║  │                                           │ rounded- │  │  ║
║  │                                           │ full     │  │  │
║  │                                           │          │  │  ║
║  │                                           │ (bg-     │  │  ║
║  │                                           │ dagger-  │  │  ║
║  │                                           │ gold/10  │  │  ║
║  │                                           │ if mod)  │  │  ║
║  │                                           └──────────┘  │  ║
║  └─────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════╝
```

### Heritage Feature Card (Ancestry/Community Combat)

Combat-relevant features from ancestry and community displayed in Combat View:

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  bg-dagger-panel  rounded-xl  overflow-hidden  cursor-pointer                 ║
║  border border-emerald-500/30  (ancestry) OR border-amber-500/30 (community)  ║
║  hover:border-white/30                                                        ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  p-4  flex justify-between items-start                              │      ║
║  │                                                                     │      ║
║  │  LONG TONGUE                                                d12×2   │      ║
║  │  font-serif font-bold text-white text-lg                   text-xl  │      ║
║  │                                                            font-bold│      ║
║  │  ┌────────────────┐ ┌──────────────┐ ┌──────────────┐               │      ║
║  │  │    RIBBET      │ │   FINESSE    │ │    CLOSE     │      d12 × 2 │      ║
║  │  │ bg-emerald-500/│ │  bg-white/10 │ │  bg-white/10 │   text-[10px]│      ║
║  │  │ 20 text-       │ │              │ │              │   text-gray- │      ║
║  │  │ emerald-400    │ │              │ │              │   500        │      ║
║  │  │ (ancestry)     │ │              │ │              │   uppercase  │      ║
║  │  │                │ │              │ │              │               │      ║
║  │  │  -OR-          │ │              │ │              │               │      ║
║  │  │                │ │              │ │              │               │      ║
║  │  │ bg-amber-500/20│ │              │ │              │               │      ║
║  │  │ text-amber-400 │ │              │ │              │               │      ║
║  │  │ (community)    │ │              │ │              │               │      ║
║  │  └────────────────┘ └──────────────┘ └──────────────┘               │      ║
║  │                                                                     │      ║
║  │  ┌─────────────────────────────────────────────────────────────┐    │      ║
║  │  │  [Optional Action Type Badge - if not passive]              │    │      ║
║  │  │  ┌──────────────┐                                           │    │      ║
║  │  │  │   ATTACK     │  bg-purple-900/30 text-purple-400         │    │      ║
║  │  │  │   REACTION   │  bg-orange-900/30 text-orange-400         │    │      ║
║  │  │  └──────────────┘                                           │    │      ║
║  │  └─────────────────────────────────────────────────────────────┘    │      ║
║  │                                                                     │      ║
║  │  You can use your long tongue to grab onto things within Close      │      ║
║  │  range. **Mark a Stress** to use your tongue as a Finesse...        │      ║
║  │  text-xs text-gray-400 mt-2 line-clamp-2                            │      ║
║  │  (**bold** renders as <strong className="text-white">)              │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  bg-black/40  p-2  flex flex-wrap gap-2                             │      ║
║  │  [Action Bar - only shown if has attack or costs]                   │      ║
║  │                                                                     │      ║
║  │  ┌──────────────┐ ┌──────────────┐                                  │      ║
║  │  │ ⚡ +1 Stress │ │ ⚡ -2 Hope   │  [Cost Buttons - if applicable]  │      ║
║  │  │ bg-red-900/20│ │ bg-blue-900/ │                                  │      ║
║  │  │ text-red-300 │ │ 20 text-blue-│                                  │      ║
║  │  │ px-3 py-2    │ │ 300          │                                  │      ║
║  │  └──────────────┘ └──────────────┘                                  │      ║
║  │                                                                     │      ║
║  │  ┌─────────────────────────────┐ ┌─────────────────────────────┐    │      ║
║  │  │  ⚡ Roll (+2)               │ │  💀 Damage                  │    │      ║
║  │  │  flex-1 py-2                │ │  flex-1 py-2                │    │      ║
║  │  │  bg-white/10                │ │  bg-white/10                │    │      ║
║  │  │  hover:bg-white/20          │ │  hover:bg-white/20          │    │      ║
║  │  │  text-sm font-bold          │ │  text-sm font-bold          │    │      ║
║  │  │                             │ │                             │    │      ║
║  │  │  (text-dagger-gold if       │ │  (text-dagger-gold if       │    │      ║
║  │  │   has attack modifier)      │ │   has damage modifier)      │    │      ║
║  │  └─────────────────────────────┘ └─────────────────────────────┘    │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

**Source Type Colors:**
- **Ancestry**: `border-emerald-500/30`, badge `bg-emerald-500/20 text-emerald-400`
- **Community**: `border-amber-500/30`, badge `bg-amber-500/20 text-amber-400`

**Combat-Relevant Features Include:**
- Drakona - Elemental Breath (d8 magic, Instinct, Very Close)
- Faun - Kick (2d6 physical, on attack success)
- Firbolg - Charge (1d12 physical, AoE Melee)
- Katari - Retracting Claws (Agility, Melee, applies Vulnerable)
- Orc - Tusks (1d6 physical, Melee)
- Ribbet - Long Tongue (d12 physical, Finesse, Close)
- Seaborne - Know the Tide (token mechanics)

---

### Active Armor Panel

```
╔═══════════════════════════════════════════════════════════════╗
║  bg-dagger-panel  border border-white/10  rounded-xl  p-4     ║
║                                                               ║
║  CHAINMAIL                                                    ║
║  font-serif font-bold text-white                              ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │  text-xs text-gray-400                                  │  ║
║  │                                                         │  ║
║  │  Hardened: When you take Major or Severe damage...      │  ║
║  │  font-bold text-gray-300 (feature name)                 │  ║
║  │  italic (feature text)                                  │  ║
║  │  **bold** -> <strong text-white>                        │  ║
║  │                                                         │  ║
║  │  Score: 6, Thresholds: 2/3/5                           │  ║
║  │                                                         │  ║
║  └─────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Inventory View Cards

### Gold Tracker Panel

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  bg-dagger-panel  border border-white/10  rounded-xl  p-4                     ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  grid grid-cols-3 gap-4 text-center                                 │      ║
║  │                                                                     │      ║
║  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐        │      ║
║  │  │                 │ │                 │ │                 │        │      ║
║  │  │       3         │ │       1         │ │       0         │        │      ║
║  │  │  text-2xl       │ │  text-2xl       │ │  text-2xl       │        │      ║
║  │  │  font-bold      │ │  font-bold      │ │  font-bold      │        │      ║
║  │  │  text-white     │ │  text-white     │ │  text-white     │        │      ║
║  │  │                 │ │                 │ │                 │        │      ║
║  │  │   HANDFULS      │ │     BAGS        │ │    CHESTS       │        │      ║
║  │  │  text-[10px]    │ │  text-[10px]    │ │  text-[10px]    │        │      ║
║  │  │  uppercase      │ │  uppercase      │ │  uppercase      │        │      ║
║  │  │  text-gray-500  │ │  text-gray-500  │ │  text-gray-500  │        │      ║
║  │  │                 │ │                 │ │                 │        │      ║
║  │  │  ┌────┐ ┌────┐  │ │  ┌────┐ ┌────┐  │ │  ┌────┐ ┌────┐  │        │      ║
║  │  │  │ -  │ │ +  │  │ │  │ -  │ │ +  │  │ │  │ -  │ │ +  │  │        │      ║
║  │  │  │h-6 │ │h-6 │  │ │  │h-6 │ │h-6 │  │ │  │h-6 │ │h-6 │  │        │      ║
║  │  │  │bg- │ │bg- │  │ │  │bg- │ │bg- │  │ │  │bg- │ │bg- │  │        │      ║
║  │  │  │wht/│ │wht/│  │ │  │wht/│ │wht/│  │ │  │wht/│ │wht/│  │        │      ║
║  │  │  │5   │ │5   │  │ │  │5   │ │5   │  │ │  │5   │ │5   │  │        │      ║
║  │  │  └────┘ └────┘  │ │  └────┘ └────┘  │ │  └────┘ └────┘  │        │      ║
║  │  │                 │ │                 │ │                 │        │      ║
║  │  └─────────────────┘ └─────────────────┘ └─────────────────┘        │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Filter Pill Bar

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  flex gap-2 overflow-x-auto pb-2                                              ║
║                                                                               ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          ║
║  │ 📦 All       │ │ ⚔️ Weapons   │ │ 🛡️ Armor    │ │ ❤️ Consumab  │          ║
║  │ [ACTIVE]     │ │              │ │              │ │              │          ║
║  │              │ │              │ │              │ │              │          ║
║  │ bg-dagger-   │ │ bg-white/10  │ │ bg-white/10  │ │ bg-white/10  │          ║
║  │ gold         │ │ text-white/70│ │              │ │              │          ║
║  │ text-black   │ │ hover:bg-    │ │              │ │              │          ║
║  │              │ │ white/20     │ │              │ │              │          ║
║  │ px-3 py-1    │ │              │ │              │ │              │          ║
║  │ rounded-full │ │              │ │              │ │              │          ║
║  │ text-xs      │ │              │ │              │ │              │          ║
║  │ font-bold    │ │              │ │              │ │              │          ║
║  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘          ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Inventory Item Row

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  p-3  rounded-lg  border                                                      ║
║  Equipped: bg-dagger-gold/10  border-dagger-gold/30                           ║
║  Unequipped: bg-white/5  border-white/5                                       ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  flex justify-between items-start                                   │      ║
║  │                                                                     │      ║
║  │  LONGSWORD    ┌─────────┐ ┌────────┐              ┌────────────────┐│      ║
║  │  font-medium  │ PRIMARY │ │ Custom │              │  x2            ││      ║
║  │  text-white   │ text-   │ │ bg-    │              │  (quantity)    ││      ║
║  │               │ [10px]  │ │ purple-│              │  px-2 py-1     ││      ║
║  │               │ bg-     │ │ 500/20 │              │  bg-black/30   ││      ║
║  │               │ dagger- │ │ text-  │              │  text-xs       ││      ║
║  │               │ gold    │ │ purple-│              │  font-bold     ││      ║
║  │               │ text-   │ │ 300    │              └────────────────┘│      ║
║  │               │ black   │ │        │                               │      ║
║  │               └─────────┘ └────────┘              ┌────┐  ┌────┐   │      ║
║  │                                                   │ ✏️ │  │ 🗑️ │   │      ║
║  │  Strength • Melee • 1d8 Phy                      │Edit│  │Del │   │      ║
║  │  text-xs text-gray-400                           │p-  │  │p-  │   │      ║
║  │                                                   │1.5 │  │1.5 │   │      ║
║  │  Hardened: When you take damage...               │bg- │  │bg- │   │      ║
║  │  font-bold text-gray-300 (feature name)          │wht/│  │wht/│   │      ║
║  │  italic (feature text)                           │5   │  │5   │   │      ║
║  │                                                   │text│  │text│   │      ║
║  │                                                   │-gry│  │-gry│   │      ║
║  │                                                   │-400│  │-400│   │      ║
║  │                                                   └────┘  └────┘   │      ║
║  │                                                                     │      ║
║  │  [MODIFIER TAGS - if item has modifiers]                           │      ║
║  │  ┌──────────────────┐ ┌──────────────────┐                          │      ║
║  │  │  +1 EVASION      │ │  -1 AGILITY      │                          │      ║
║  │  │  bg-green-500/10 │ │  bg-red-500/10   │                          │      ║
║  │  │  text-green-400  │ │  text-red-400    │                          │      ║
║  │  │  border-green-   │ │  border-red-     │                          │      ║
║  │  │  500/30          │ │  500/30          │                          │      ║
║  │  │  text-[10px]     │ │  text-[10px]     │                          │      ║
║  │  │  uppercase       │ │  uppercase       │                          │      ║
║  │  │  font-bold       │ │  font-bold       │                          │      ║
║  │  └──────────────────┘ └──────────────────┘                          │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  flex gap-2 mt-1  [Equip Controls]                                  │      ║
║  │                                                                     │      ║
║  │  ┌───────────────┐ ┌───────────────┐            ┌───────────────┐   │      ║
║  │  │ ⚔️ Primary    │ │ ⚔️ Secondary  │            │ 🔄 Unequip    │   │      ║
║  │  │ text-[10px]   │ │               │            │ bg-red-500/20 │   │      ║
║  │  │ uppercase     │ │               │            │ text-red-200  │   │      ║
║  │  │ bg-white/10   │ │               │            │ ml-auto       │   │      ║
║  │  │ hover:bg-     │ │               │            │               │   │      ║
║  │  │ white/20      │ │               │            │               │   │      ║
║  │  └───────────────┘ └───────────────┘            └───────────────┘   │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Inventory Item Card with Art (Future Feature)

Enhanced version of ItemRow with custom artwork support. Reuses the same art upload/positioning system as Domain Cards.

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  p-3  rounded-lg  border                                                      ║
║  Equipped: bg-dagger-gold/10  border-dagger-gold/30                           ║
║  Unequipped: bg-white/5  border-white/5                                       ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  flex justify-between items-start                                   │      ║
║  │                                                                     │      ║
║  │  LONGSWORD    ┌─────────┐ ┌────────┐              ┌────────────────┐│      ║
║  │  font-medium  │ PRIMARY │ │ Custom │              │  x2            ││      ║
║  │  text-white   │ text-   │ │ bg-    │              │  (quantity)    ││      ║
║  │               │ [10px]  │ │ purple-│              │  px-2 py-1     ││      ║
║  │               │ bg-     │ │ 500/20 │              │  bg-black/30   ││      ║
║  │               │ dagger- │ │ text-  │              │  text-xs       ││      ║
║  │               │ gold    │ │ purple-│              │  font-bold     ││      ║
║  │               │ text-   │ │ 300    │              └────────────────┘│      ║
║  │               │ black   │ │        │                               │      ║
║  │               └─────────┘ └────────┘       ┌────┐  ┌────┐  ┌────┐  │      ║
║  │                                            │ 🖼️ │  │ ✏️ │  │ 🗑️ │  │      ║
║  │  Strength • Melee • 1d8 Phy               │Art │  │Edit│  │Del │  │      ║
║  │  text-xs text-gray-400                    │p-  │  │p-  │  │p-  │  │      ║
║  │                                            │1.5 │  │1.5 │  │1.5 │  │      ║
║  │  Hardened: When you take damage...        │bg- │  │bg- │  │bg- │  │      ║
║  │  font-bold text-gray-300 (feature name)   │wht/│  │wht/│  │wht/│  │      ║
║  │  italic (feature text)                    │5   │  │5   │  │5   │  │      ║
║  │                                            │hvr:│  │hvr:│  │hvr:│  │      ║
║  │                                            │gold│  │wht │  │red │  │      ║
║  │                                            └────┘  └────┘  └────┘  │      ║
║  │                                                                     │      ║
║  │  [MODIFIER TAGS - if item has modifiers]                           │      ║
║  │  ┌──────────────────┐ ┌──────────────────┐                          │      ║
║  │  │  +1 EVASION      │ │  -1 AGILITY      │                          │      ║
║  │  └──────────────────┘ └──────────────────┘                          │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  flex gap-2 mt-1  [Equip Controls]                                  │      ║
║  │  ┌───────────────┐ ┌───────────────┐            ┌───────────────┐   │      ║
║  │  │ ⚔️ Primary    │ │ ⚔️ Secondary  │            │ 🔄 Unequip    │   │      ║
║  │  └───────────────┘ └───────────────┘            └───────────────┘   │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  [ART THUMBNAIL - ONLY rendered if custom_image_url exists]         │      ║
║  │  mt-2  pt-2  border-t border-white/5                                │      ║
║  │                                                                     │      ║
║  │  ┌───────────────┐   Item Artwork                                   │      ║
║  │  │               │   text-xs text-gray-500                          │      ║
║  │  │  [ITEM ART]   │                                                  │      ║
║  │  │    64x64      │                                                  │      ║
║  │  │  rounded-lg   │                                                  │      ║
║  │  │  object-cover │                                                  │      ║
║  │  │  border-2     │                                                  │      ║
║  │  └───────────────┘                                                  │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

**Component File:** `components/views/inventory/inventory-item-card.tsx`

**Action Buttons (absolute top-right, inline):**
Three buttons are positioned together in the absolute top-right corner:

```
┌──────────────────────────────────────┐
│  ITEM NAME             ℹ️ 🖼️ ⚙️     │
└──────────────────────────────────────┘
```

- **ℹ️ Info Button** (leftmost, conditional):
  - Only shown if item has a description (`fullDescription`)
  - Toggles collapsible description section
  - Active state: `text-dagger-gold`, Inactive: `text-gray-500 hover:text-gray-300`
  - Icon: `Info` from lucide-react (size 14)

- **🖼️ Art Button** (middle):
  - Opens ItemArtModal for uploading/editing artwork
  - Style: `text-gray-500 hover:text-dagger-gold transition-colors p-1 rounded hover:bg-white/10`
  - Icon: `ImageIcon` from lucide-react (size 14)
  
- **⚙️ Manage Button** (rightmost):
  - Opens homebrew editing modal (delete option inside)
  - Style: `text-gray-500 hover:text-gray-300 transition-colors p-1 rounded hover:bg-white/10`
  - Icon: `Settings` from lucide-react (size 14)

**Collapsible Description Section:**
- Rendered when Info button is toggled on
- Style: `mt-2 p-3 bg-white/5 rounded-lg border border-white/5 text-sm text-gray-300`
- Supports **bold** text formatting (split on `**`)

**Art Thumbnail Section (conditional):**
- **Only rendered** when `item.state?.custom_image_url` exists
- Size: 64x64 pixels (square)
- Border: `border-white/10` (default), `border-dagger-gold/30` (if equipped)
- Positioned below equip controls, separated by subtle border

### Item Art Modal (Reuses CardDetailModal Pattern)

Modal for managing item artwork. Reuses the same image upload, gallery selection, and positioning system as Domain Card art.

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  fixed inset-0 bg-black/80 z-50                                               ║
║  flex items-center justify-center                                             ║
║  backdrop-blur-sm                                                             ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  bg-zinc-800 text-white rounded-xl shadow-2xl                       │      ║
║  │  w-full max-w-md max-h-[90vh] overflow-hidden                       │      ║
║  │  border-top: 4px solid var(--item-type-color)                       │      ║
║  │   - Weapon: dagger-gold                                             │      ║
║  │   - Armor: blue-500                                                 │      ║
║  │   - Consumable: red-400                                             │      ║
║  │   - Item: purple-400                                                │      ║
║  │                                                                     │      ║
║  │  ┌─────────────────────────────────────────────────────────────┐    │      ║
║  │  │  [HEADER]  flex justify-between items-center p-4            │    │      ║
║  │  │                                                             │    │      ║
║  │  │  🖼️ ITEM ARTWORK                                    [X]    │    │      ║
║  │  │  text-lg font-bold font-eveleth text-white                  │    │      ║
║  │  │                                                             │    │      ║
║  │  │  "Longsword"                                                │    │      ║
║  │  │  text-sm text-gray-400                                      │    │      ║
║  │  └─────────────────────────────────────────────────────────────┘    │      ║
║  │                                                                     │      ║
║  │  ┌─────────────────────────────────────────────────────────────┐    │      ║
║  │  │  [INTERACTIVE PREVIEW - if artwork exists]                   │    │      ║
║  │  │  Drag the image to adjust position                           │    │      ║
║  │  │                                                              │    │      ║
║  │  │  ┌─────────────────────────────────────────────────────┐     │    │      ║
║  │  │  │  aspect-square  rounded-lg  overflow-hidden         │     │    │      ║
║  │  │  │  border-2  border-{item-type-color}                 │     │    │      ║
║  │  │  │  cursor-move                                        │     │    │      ║
║  │  │  │                                                     │     │    │      ║
║  │  │  │           [Custom Image]                            │     │    │      ║
║  │  │  │           object-cover                               │     │    │      ║
║  │  │  │           objectPosition: x% y%                      │     │    │      ║
║  │  │  │                                                     │     │    │      ║
║  │  │  │           ┌─────────────────────────────┐           │     │    │      ║
║  │  │  │           │  🖼️ Drag to reposition     │  (hover)  │     │    │      ║
║  │  │  │           └─────────────────────────────┘           │     │    │      ║
║  │  │  └─────────────────────────────────────────────────────┘     │    │      ║
║  │  │                                                              │    │      ║
║  │  │  Image Position                     🗑️ Remove               │    │      ║
║  │  │  text-xs text-gray-400              text-red-400            │    │      ║
║  │  └─────────────────────────────────────────────────────────────┘    │      ║
║  │                                                                     │      ║
║  │  ┌─────────────────────────────────────────────────────────────┐    │      ║
║  │  │  [UPLOAD OPTIONS]  space-y-2                                 │    │      ║
║  │  │  Choose an image for this item:                              │    │      ║
║  │  │                                                              │    │      ║
║  │  │  ┌───────────────────────────────────────────────────────┐   │    │      ║
║  │  │  │  📤 Upload Image                                      │   │    │      ║
║  │  │  │  Upload from device                                   │   │    │      ║
║  │  │  │  bg-white/5 hover:bg-white/10                        │   │    │      ║
║  │  │  │  border border-white/20 rounded-lg p-3               │   │    │      ║
║  │  │  └───────────────────────────────────────────────────────┘   │    │      ║
║  │  │                                                              │    │      ║
║  │  │  ─────────────────────────────────────────────               │    │      ║
║  │  │                                                              │    │      ║
║  │  │  🖼️ CHOOSE FROM GALLERY                                     │    │      ║
║  │  │  text-xs font-bold uppercase tracking-wider text-gray-400   │    │      ║
║  │  │                                                              │    │      ║
║  │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │    │      ║
║  │  │  │      │ │      │ │      │ │      │ │      │ │      │      │    │      ║
║  │  │  │ img1 │ │ img2 │ │ img3 │ │ img4 │ │ img5 │ │ img6 │      │    │      ║
║  │  │  │      │ │      │ │      │ │      │ │      │ │      │      │    │      ║
║  │  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘      │    │      ║
║  │  │  grid grid-cols-3 gap-2 max-h-48 overflow-y-auto            │    │      ║
║  │  │                                                              │    │      ║
║  │  │  [If no gallery images:]                                     │    │      ║
║  │  │  ┌─────────────────────────────────────────────────────────┐ │    │      ║
║  │  │  │  No gallery images yet.                                 │ │    │      ║
║  │  │  │  Upload images in Character → Gallery to use them here. │ │    │      ║
║  │  │  │  bg-white/5 border-dashed border-white/10              │ │    │      ║
║  │  │  └─────────────────────────────────────────────────────────┘ │    │      ║
║  │  └─────────────────────────────────────────────────────────────┘    │      ║
║  │                                                                     │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

**Implementation Notes:**

1. **State Storage:** Item art uses the same pattern as domain cards:
   - `custom_image_url`: URL of the uploaded image
   - `custom_image_position_x`: X position (0-100%)
   - `custom_image_position_y`: Y position (0-100%)
   
   Stored in `character_inventory.state` JSON column (added to `CharacterInventoryItem` type).

2. **Store Methods** (in `inventory-slice.ts`):
   - `updateInventoryItemImage(itemId, imageUrl, position?)` - Upload/remove item artwork
   - `updateInventoryItemImagePosition(itemId, position)` - Adjust image position

3. **Components:**
   - `ItemArtModal` (`components/modals/item-art-modal.tsx`) - Dedicated modal for item art management
   - `ItemRow` - Updated with art thumbnail section and `onEditArt` callback

4. **Thumbnail Display Logic:**
   ```tsx
   if (item.state?.custom_image_url) {
     return <Image with position styling>
   } else {
     return <ImageIcon fallback>
   }
   ```

5. **Type Colors:**
   | Type | Border/Accent Color |
   |------|---------------------|
   | Weapon | `dagger-gold` (#D4A84B) |
   | Armor | `blue-500` (#3B82F6) |
   | Consumable | `red-400` (#F87171) |
   | Item | `purple-500` (#A855F7) |

6. **Aspect Ratios:**
   - Thumbnail in ItemRow: 64x64 (square)
   - Preview in Modal: square (1:1)
   - Unlike domain cards, items don't need the 2:3 card ratio

---

## Playmat View Cards

### View Toggle Header

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  flex flex-col sm:flex-row justify-between items-start sm:items-center        ║
║                                                                               ║
║  ┌───────────────────────────────────────┐   ┌────────────────────────────┐   ║
║  │  bg-white/5  rounded-lg  p-1          │   │  Search Bar + Add Button   │   ║
║  │  border border-white/10               │   │                            │   ║
║  │                                       │   │  ┌──────────────────────┐  │   ║
║  │  ┌─────────────┐ ┌─────────────┐      │   │  │  🔍 Search cards...  │  │   ║
║  │  │ 📜 LOADOUT  │ │ 📦 VAULT    │      │   │  │  bg-white/5          │  │   ║
║  │  │ [ACTIVE]    │ │             │      │   │  │  border-white/10     │  │   ║
║  │  │             │ │             │      │   │  │  rounded-full        │  │   ║
║  │  │ bg-dagger-  │ │ text-gray-  │      │   │  │  py-1.5 pl-9 pr-4    │  │   ║
║  │  │ gold        │ │ 400         │      │   │  │                      │  │   ║
║  │  │ text-black  │ │ hover:text- │      │   │  │  [X] clear button    │  │   ║
║  │  │             │ │ white       │      │   │  └──────────────────────┘  │   ║
║  │  │ px-4 py-1.5 │ │             │      │   │                            │   ║
║  │  │ rounded-md  │ │             │      │   │  ┌────────────────────┐    │   ║
║  │  │ text-sm     │ │             │      │   │  │  + Add Card        │    │   ║
║  │  │ font-bold   │ │             │      │   │  │  bg-white/10       │    │   ║
║  │  └─────────────┘ └─────────────┘      │   │  │  hover:bg-white/20 │    │   ║
║  │                                       │   │  │  rounded-full      │    │   ║
║  └───────────────────────────────────────┘   │  │  border-white/10   │    │   ║
║                                               │  └────────────────────┘    │   ║
║                                               └────────────────────────────┘   ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Active Modifiers Summary Panel

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  bg-dagger-panel  border border-white/10  rounded-xl  p-4                     ║
║                                                                               ║
║  ✨ ACTIVE MODIFIERS                                                          ║
║  text-xs font-bold uppercase text-purple-400 tracking-wider                   ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  grid grid-cols-2 sm:grid-cols-3 gap-3                              │      ║
║  │                                                                     │      ║
║  │  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐  │      ║
║  │  │  bg-white/5       │ │  bg-white/5       │ │  bg-white/5       │  │      ║
║  │  │  border border-   │ │  border border-   │ │  border border-   │  │      ║
║  │  │  purple-500/30    │ │  purple-500/30    │ │  purple-500/30    │  │      ║
║  │  │  rounded-lg p-3   │ │  rounded-lg p-3   │ │  rounded-lg p-3   │  │      ║
║  │  │                   │ │                   │ │                   │  │      ║
║  │  │  AGILITY          │ │  EVASION          │ │  SPELLCAST        │  │      ║
║  │  │  text-[10px]      │ │  text-[10px]      │ │  text-[10px]      │  │      ║
║  │  │  text-gray-400    │ │  text-gray-400    │ │  text-gray-400    │  │      ║
║  │  │  uppercase        │ │  uppercase        │ │  uppercase        │  │      ║
║  │  │                   │ │                   │ │                   │  │      ║
║  │  │      +2           │ │      +1           │ │      -1           │  │      ║
║  │  │  text-2xl         │ │  text-2xl         │ │  text-2xl         │  │      ║
║  │  │  font-bold        │ │  font-bold        │ │  font-bold        │  │      ║
║  │  │  text-green-400   │ │  text-green-400   │ │  text-red-400     │  │      ║
║  │  │  (+ = green)      │ │  (+ = green)      │ │  (- = red)        │  │      ║
║  │  │                   │ │                   │ │                   │  │      ║
║  │  │  2 modifiers      │ │  1 modifier       │ │  1 modifier       │  │      ║
║  │  │  text-[9px]       │ │  text-[9px]       │ │  text-[9px]       │  │      ║
║  │  │  text-gray-500    │ │  text-gray-500    │ │  text-gray-500    │  │      ║
║  │  └───────────────────┘ └───────────────────┘ └───────────────────┘  │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Domain Card (Thumbnail - 240px)

```
╔═════════════════════════════════════════════════════════════════╗
║  width: 240px  aspect-[2/3]  rounded-lg  shadow-lg              ║
║  bg-white  text-black  border border-dagger-gold                ║
║  cursor-pointer  hover:shadow-2xl                               ║
║                                                                 ║
║  ┌───────────────────────────────────────────────────────────┐  ║
║  │                                                           │  ║
║  │  [BANNER]                              [RECALL COST]      │  ║
║  │  ╔════╗                                    ⚡              │  ║
║  │  ║ 2  ║                                   (3)             │  ║
║  │  ║    ║  <- tier                                          │  ║
║  │  ╚════╝                                 ┌────┐            │  ║
║  │  domain-                                │ ✨ │ passive    │  ║
║  │  colored                                └────┘ indicator  │  ║
║  │  banner                                 ┌────┐            │  ║
║  │  polygon                                │ ⚔️ │ combat     │  ║
║  │  shape                                  └────┘ indicator  │  ║
║  │                                                           │  ║
║  │  ┌─────────────────────────────────────────────────────┐  │  ║
║  │  │                                                     │  │  ║
║  │  │           [Custom Artwork Area]                     │  │  ║
║  │  │           h-160px                                   │  │  ║
║  │  │           object-cover                              │  │  ║
║  │  │                                                     │  │  ║
║  │  └─────────────────────────────────────────────────────┘  │  ║
║  │                                                           │  ║
║  │  ════════════════════════════════════════════════════════ │  ║
║  │            [Domain-colored divider]                       │  ║
║  │                                                           │  ║
║  │                    ARCANE ARROW                           │  ║
║  │              font-eveleth font-bold                       │  ║
║  │              uppercase text-center                        │  ║
║  │                                                           │  ║
║  │  Make a Spellcast Roll against a target                   │  ║
║  │  within Close range. On a success...                      │  ║
║  │  text-sm leading-tight px-4                               │  ║
║  │  (ReactMarkdown rendered)                                 │  ║
║  │                                                           │  ║
║  └───────────────────────────────────────────────────────────┘  ║
╚═════════════════════════════════════════════════════════════════╝
```

### Playmat Card Wrapper (Interactive) - **DECOUPLED DESIGN**

Wraps the visual Domain Card with interactive gameplay mechanics in a panel wrapper. The outer wrapper provides a dagger-panel container with the domain card and mechanics tray inside.

**CRITICAL DESIGN PRINCIPLE: Costs are DECOUPLED from Activation**
- Cost buttons (Stress/Hope) ONLY pay resources - they do NOT activate modifiers
- Modifier activation is controlled separately via explicit toggle buttons
- This gives users full control over when to spend resources vs when to apply bonuses

```
╔═════════════════════════════════════════════════════════════════════════════════╗
║  relative flex flex-col items-center gap-2 p-2                                  ║
║  bg-dagger-panel border border-white/10 rounded-xl shadow-lg w-full            ║
║                                                                                 ║
║  ┌─────────────────────────────────────────────────────────────────────────┐    ║
║  │  [SETTINGS BUTTON - absolute top-right overlay on domain card]          │    ║
║  │  absolute top-2 right-2 z-40                                            │    ║
║  │  p-1.5 bg-black/50 hover:bg-black/80 rounded-full                       │    ║
║  │  border border-white/10 backdrop-blur-sm                                │    ║
║  │  ⚙️ (Settings icon)                                                     │    ║
║  └─────────────────────────────────────────────────────────────────────────┘    ║
║                                                                                 ║
║  ┌─────────────────────────────────────────────────────────────────────────┐    ║
║  │  [DOMAIN CARD COMPONENT]                                                │    ║
║  │  width: 240px, aspect-[2/3]                                             │    ║
║  │  (See Domain Card diagram above)                                        │    ║
║  │  - Custom artwork with position styling                                 │    ║
║  │  - Passive/Combat indicator badges                                      │    ║
║  │  - Domain-colored banner and divider                                    │    ║
║  └─────────────────────────────────────────────────────────────────────────┘    ║
║                                                                                 ║
║  ┌─────────────────────────────────────────────────────────────────────────┐    ║
║  │  [MECHANICS TRAY]                                                       │    ║
║  │  bg-black/40  border border-white/10  rounded-lg                        │    ║
║  │  p-2 space-y-2 w-full                                                   │    ║
║  │                                                                         │    ║
║  │  ┌───────────────────────────────────────────────────────────────────┐  │    ║
║  │  │  [Token Track - Optional, if card has_tokens]                     │  │    ║
║  │  │  ● ● ● ○ ○                                                        │  │    ║
║  │  │  flex justify-center text-xs text-gray-400                        │  │    ║
║  │  └───────────────────────────────────────────────────────────────────┘  │    ║
║  │                                                                         │    ║
║  │  ┌───────────────────────────────────────────────────────────────────┐  │    ║
║  │  │  [Frequency Checkbox - Optional, if frequency !== 'at_will']      │  │    ║
║  │  │  ☐ Once Per Short Rest                                            │  │    ║
║  │  │  text-xs text-white  bg-white/5  px-3 py-1.5 w-full justify-center│  │    ║
║  │  └───────────────────────────────────────────────────────────────────┘  │    ║
║  │                                                                         │    ║
║  │  ┌───────────────────────────────────────────────────────────────────┐  │    ║
║  │  │  [MODIFIERS - when_active conditions]                             │  │    ║
║  │  │  space-y-1.5                                                      │  │    ║
║  │  │                                                                   │  │    ║
║  │  │  MODIFIERS                                                        │  │    ║
║  │  │  text-[10px] font-bold uppercase text-purple-400 text-center     │  │    ║
║  │  │                                                                   │  │    ║
║  │  │  ┌─────────────────────────────────────────────────────────────┐  │  │    ║
║  │  │  │  MODIFIER ROW 1 (e.g., Damage bonus)                        │  │  │    ║
║  │  │  │  flex items-center justify-between px-3 py-2 rounded-lg     │  │  │    ║
║  │  │  │  bg-green-500/10 border-green-500/30 (if active)            │  │  │    ║
║  │  │  │  bg-white/5 border-white/10 (if inactive)                   │  │  │    ║
║  │  │  │                                                             │  │  │    ║
║  │  │  │  +10 Damage                             [Activate]          │  │  │    ║
║  │  │  │  text-lg font-bold text-green-400       text-xs button      │  │  │    ║
║  │  │  │                                                             │  │  │    ║
║  │  │  │  Activate to apply this bonus                               │  │  │    ║
║  │  │  │  text-xs text-gray-400                                      │  │  │    ║
║  │  │  └─────────────────────────────────────────────────────────────┘  │  │    ║
║  │  │                                                                   │  │    ║
║  │  │  ┌─────────────────────────────────────────────────────────────┐  │  │    ║
║  │  │  │  MODIFIER ROW 2 (e.g., Severe Threshold bonus)              │  │  │    ║
║  │  │  │  flex items-center justify-between px-3 py-2 rounded-lg     │  │  │    ║
║  │  │  │  bg-green-500/10 border-green-500/30 (if active)            │  │  │    ║
║  │  │  │  bg-white/5 border-white/10 (if inactive)                   │  │  │    ║
║  │  │  │                                                             │  │  │    ║
║  │  │  │  +8 Damage Threshold Severe             [Activate]          │  │  │    ║
║  │  │  │  text-lg font-bold text-green-400       text-xs button      │  │  │    ║
║  │  │  │                                                             │  │  │    ║
║  │  │  │  Activate to apply this bonus                               │  │  │    ║
║  │  │  │  text-xs text-gray-400                                      │  │  │    ║
║  │  │  └─────────────────────────────────────────────────────────────┘  │  │    ║
║  │  │                                                                   │  │    ║
║  │  │  NOTE: Multiple modifiers create separate rows. Each row has     │  │    ║
║  │  │  INDEPENDENT activation (cardStates[cardName].active_modifiers)   │  │    ║
║  │  │  Clicking an Activate button toggles ONLY that specific modifier  │  │    ║
║  │  │  This is important for modal spells or Grimoires with choices     │  │    ║
║  │  │                                                                   │  │    ║
║  │  │  When Active: That row shows [✓ Active] (bg-dagger-gold/20)      │  │    ║
║  │  └───────────────────────────────────────────────────────────────────┘  │    ║
║  │                                                                         │    ║
║  │  ┌───────────────────────────────────────────────────────────────────┐  │    ║
║  │  │  [ACTION COSTS - DECOUPLED FROM ACTIVATION]                      │  │    ║
║  │  │  flex flex-wrap gap-2 justify-center pt-1 border-t border-white/5│  │    ║
║  │  │                                                                   │  │    ║
║  │  │  ┌──────────────────────┐  ┌──────────────────────┐              │  │    ║
║  │  │  │ 😰 Mark Stress (2/6) │  │ 💛 Spend Hope (3/6)  │              │  │    ║
║  │  │  │ text-xs font-medium  │  │ text-xs font-medium  │              │  │    ║
║  │  │  │ text-purple-400      │  │ text-dagger-gold     │              │  │    ║
║  │  │  │ bg-white/5           │  │ bg-white/5           │              │  │    ║
║  │  │  │ hover:bg-white/10    │  │ hover:bg-white/10    │              │  │    ║
║  │  │  │                      │  │                      │              │  │    ║
║  │  │  │ ONLY PAYS COST       │  │ ONLY PAYS COST       │              │  │    ║
║  │  │  │ NO ACTIVATION        │  │ NO ACTIVATION        │              │  │    ║
║  │  │  └──────────────────────┘  └──────────────────────┘              │  │    ║
║  │  └───────────────────────────────────────────────────────────────────┘  │    ║
║  │                                                                         │    ║
║  │  ┌───────────────────────────────────────────────────────────────────┐  │    ║
║  │  │  [Embedded Attack Card - Optional, if card has attack/roll]       │  │    ║
║  │  │  (AttackCard component WITHOUT costs - costs shown above)         │  │    ║
║  │  │  Shows: Attack button (+bonus), Damage button                     │  │    ║
║  │  │  borderVariant: 'spell' or 'reaction'                             │  │    ║
║  │  └───────────────────────────────────────────────────────────────────┘  │    ║
║  │                                                                         │    ║
║  │  ┌───────────────────────────────────────────────────────────────────┐  │    ║
║  │  │  [Actions Row]                                                    │  │    ║
║  │  │  pt-1 border-t border-white/5 flex gap-2                          │  │    ║
║  │  │                                                                   │  │    ║
║  │  │  ┌───────────────────────┐   ┌───────────────────────┐            │  │    ║
║  │  │  │ 🖼️ Change Art         │   │ 📦 To Vault           │            │  │    ║
║  │  │  │ flex-1                │   │ flex-1                │            │  │    ║
║  │  │  │ py-1.5 rounded-md     │   │ py-1.5 rounded-md     │            │  │    ║
║  │  │  │ bg-white/5            │   │ bg-white/5            │            │  │    ║
║  │  │  │ hover:bg-white/10     │   │ hover:bg-white/10     │            │  │    ║
║  │  │  │ text-[10px] font-med  │   │ text-[10px] font-bold │            │  │    ║
║  │  │  │ text-gray-400         │   │ text-gray-400         │            │  │    ║
║  │  │  │ hover:text-white      │   │ hover:text-white      │            │  │    ║
║  │  │  │                       │   │                       │            │  │    ║
║  │  │  │  - OR (if in vault) - │   │  - OR (if in vault) - │            │  │    ║
║  │  │  │                       │   │ ↔️ To Loadout          │            │  │    ║
║  │  │  │                       │   │ bg-dagger-gold/10     │            │  │    ║
║  │  │  │                       │   │ border-dagger-gold/30 │            │  │    ║
║  │  │  │                       │   │ text-dagger-gold      │            │  │    ║
║  │  │  └───────────────────────┘   └───────────────────────┘            │  │    ║
║  │  └───────────────────────────────────────────────────────────────────┘  │    ║
║  └─────────────────────────────────────────────────────────────────────────┘    ║
╚═════════════════════════════════════════════════════════════════════════════════╝
```

**Actions Row Behavior:**
- **Change Art**: Opens the CardDetailModal in `art-only` mode for uploading/positioning custom artwork
- **To Vault / To Loadout**: Toggle button that moves the card between loadout and vault
  - In loadout: `bg-white/5 text-gray-400` - moves to vault
  - In vault: `bg-dagger-gold/10 text-dagger-gold border-dagger-gold/30` - moves to loadout

**Conditional Mechanics Tray Elements:**
1. Token Track - Only if `enhancedData?.has_tokens` is true
2. Frequency Checkbox - Only if `enhancedData?.frequency && frequency !== 'at_will'`
3. **Modifiers Section** - Only if card has `when_active` modifiers (see ModifierActivationRow)
4. **Action Costs** - Always shown if card has costs (even for attack cards)
5. Embedded AttackCard - Only if card has `attack` or `roll` data (costs NOT included in AttackCard)

**Key Design Decisions:**
- **Decoupling**: Cost buttons and modifier activation are completely independent
- **User Control**: Users decide when to pay costs and when to activate bonuses separately
- **Visibility**: Costs are always shown in the mechanics tray, NOT embedded in AttackCard
- **Clarity**: Each modifier gets its own explicit activation toggle with clear labeling

**Components:**
- `ModifierActivationRow` (`components/views/playmat/modifier-activation-row.tsx`) - Displays individual modifiers with activation controls
- `DomainCostsRow` (`components/views/playmat/domain-costs-row.tsx`) - Renders cost buttons (stress/hope) that only pay resources
- `DomainAbilityButton` (`components/views/playmat/domain-ability-button.tsx`) - Base button component (cost vs activation type determined by `costType` prop)

**Example Cards:**

**Frenzy** (Multiple modifiers, no costs):
- Shows 2 modifier rows: `+10 Damage` and `+8 Damage Threshold Severe`
- Each modifier has INDEPENDENT activation (user can toggle each separately)
- For this ability, user should activate BOTH to get the full Frenzy effect
- No cost buttons shown (no costs)
- Has frequency checkbox: "Once per long rest"

**Deft Maneuvers** (Single modifier with cost):
- Shows 1 modifier row: `+1 Attack`
- Shows cost button: "Mark Stress (2/6)"
- Has frequency checkbox: "Once per rest"
- Cost and activation are independent

**Ground Pound** (Attack with cost, no when_active modifiers):
- Shows cost button: "Spend 2 Hope (3/6)"
- Shows AttackCard with Attack/Damage buttons
- NO modifiers section (no when_active modifiers)



### Empty Loadout Slot

```
╔═══════════════════════════════════════════════════════════════╗
║  w-[240px]  aspect-[2.5/3.5]                                  ║
║  border-2 border-dashed border-white/5                        ║
║  rounded-lg                                                   ║
║  flex flex-col items-center justify-center                    ║
║  text-gray-600                                                ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │                                                         │  ║
║  │                        📚                               │  ║
║  │                   LibraryBig                            │  ║
║  │                     size-24                             │  ║
║  │                                                         │  ║
║  │              SLOT 3                                     │  ║
║  │          text-xs uppercase                              │  ║
║  │                                                         │  ║
║  │    - OR (if searching) -                                │  ║
║  │                                                         │  ║
║  │         No cards match                                  │  ║
║  │          your search.                                   │  ║
║  │                                                         │  ║
║  └─────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════╝
```

### Card Detail Modal

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  fixed inset-0 bg-black/80 z-50                                               ║
║  flex items-center justify-center                                             ║
║  backdrop-blur-sm                                                             ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  bg-zinc-800 text-white rounded-xl shadow-2xl                       │      ║
║  │  w-full max-w-md max-h-[90vh] overflow-hidden                       │      ║
║  │  border-top: 4px solid {domain.primary}                             │      ║
║  │                                                                     │      ║
║  │  ┌─────────────────────────────────────────────────────────────┐    │      ║
║  │  │  [HEADER - absolute positioned]                             │    │      ║
║  │  │                                                             │    │      ║
║  │  │  ╔════╗                                ⚡               [X]│    │      ║
║  │  │  ║ 3  ║   <- tier banner                (2)  <- recall      │    │      ║
║  │  │  ╚════╝                                                     │    │      ║
║  │  │  domain-colored                                             │    │      ║
║  │  │  polygon shape                                              │    │      ║
║  │  └─────────────────────────────────────────────────────────────┘    │      ║
║  │                                                                     │      ║
║  │  ┌─────────────────────────────────────────────────────────────┐    │      ║
║  │  │  [TYPE BANNER]  mt-16 pt-2 pb-1 text-center                 │    │      ║
║  │  │                                                             │    │      ║
║  │  │           ┌──────────────────────────┐                      │    │      ║
║  │  │           │  ARCANA - ABILITY        │                      │    │      ║
║  │  │           │  uppercase font-bold     │                      │    │      ║
║  │  │           │  text-xs px-3 py-1       │                      │    │      ║
║  │  │           │  rounded-full            │                      │    │      ║
║  │  │           │  bg-{domain.primary}cc   │                      │    │      ║
║  │  │           │  border-{domain.accent}  │                      │    │      ║
║  │  │           └──────────────────────────┘                      │    │      ║
║  │  └─────────────────────────────────────────────────────────────┘    │      ║
║  │                                                                     │      ║
║  │  ┌─────────────────────────────────────────────────────────────┐    │      ║
║  │  │  [CARD NAME]  text-center px-4 pt-2                         │    │      ║
║  │  │                                                             │    │      ║
║  │  │              ARCANE ARROW                                   │    │      ║
║  │  │         text-3xl font-bold font-eveleth                     │    │      ║
║  │  └─────────────────────────────────────────────────────────────┘    │      ║
║  │                                                                     │      ║
║  │  ┌─────────────────────────────────────────────────────────────┐    │      ║
║  │  │  [SCROLLABLE CONTENT]  flex-1 overflow-y-auto px-6 py-4     │    │      ║
║  │  │                                                             │    │      ║
║  │  │  prose prose-invert text-gray-300 text-center               │    │      ║
║  │  │  <ReactMarkdown>{description}</ReactMarkdown>               │    │      ║
║  │  │                                                             │    │      ║
║  │  │  ─────────────────────────────────────────────              │    │      ║
║  │  │                                                             │    │      ║
║  │  │  🖼️ CARD ARTWORK                        [Add/Change]        │    │      ║
║  │  │  text-xs font-bold uppercase text-{accent}                  │    │      ║
║  │  │                                                             │    │      ║
║  │  │  ┌─────────────────────────────────────────────────────┐    │    │      ║
║  │  │  │  [Image Preview - if custom image exists]           │    │    │      ║
║  │  │  │  aspect-[2/3] rounded-lg border-{domain.primary}    │    │    │      ║
║  │  │  │                                                     │    │    │      ║
║  │  │  │  Type: Artwork Only / Full Card                     │    │    │      ║
║  │  │  │                              🗑️ Remove              │     │    │      ║
║  │  │  └─────────────────────────────────────────────────────┘    │    │      ║
║  │  │                                                             │    │      ║
║  │  │  ┌─────────────────────────────────────────────────────┐    │    │      ║
║  │  │  │  [Upload Options - if showImageOptions]             │    │    │      ║
║  │  │  │                                                     │    │    │      ║
║  │  │  │  ┌───────────────────────────────────────────────┐  │    │    │      ║
║  │  │  │  │  📤 Artwork Only                              │  │    │    │      ║
║  │  │  │  │  Upload character art or scene...             │  │    │    │      ║
║  │  │  │  │  bg-white/5 hover:bg-white/10                 │  │    │    │      ║
║  │  │  │  │  border border-white/20 rounded-lg p-3        │  │    │    │      ║
║  │  │  │  └───────────────────────────────────────────────┘  │    │    │      ║
║  │  │  │                                                     │    │    │      ║
║  │  │  │  ┌───────────────────────────────────────────────┐  │    │    │      ║
║  │  │  │  │  📤 Full Custom Card                          │  │    │    │      ║
║  │  │  │  │  Upload complete card image...                │  │     │    │      ║
║  │  │  │  └───────────────────────────────────────────────┘  │     │    │      ║
║  │  │  └─────────────────────────────────────────────────────┘     │    │      ║
║  │  │                                                              │    │      ║
║  │  │  ─────────────────────────────────────────────               │    │      ║
║  │  │                                                              │    │      ║
║  │  │  ✨ PASSIVE MODIFIERS                                        │    │      ║
║  │  │  text-xs font-bold uppercase text-purple-400                 │    │      ║
║  │  │                                                              │    │      ║
║  │  │  ┌─────────────────────────────────────────────────────┐     │    │      ║
║  │  │  │  bg-white/5 border border-purple-500/30 rounded-lg  │     │    │      ║
║  │  │  │                                                     │     │    │      ║
║  │  │  │  EVASION                              ┌────────┐    │     │    │      ║
║  │  │  │  text-sm font-bold text-white         │   +2   │    │     │    │      ║
║  │  │  │                                       │ text-lg │    │     │    │      ║
║  │  │  │  🛡️ While wearing armor              │ text-   │    │     │    │      ║
║  │  │  │  text-[10px] text-gray-500 italic     │ green-  │    │     │    │      ║
║  │  │  │                                       │ 400     │    │     │    │      ║
║  │  │  │                                       └────────┘    │     │    │      ║
║  │  │  └─────────────────────────────────────────────────────┘     │    │      ║
║  │  │                                                              │    │      ║
║  │  │  ─────────────────────────────────────────────               │    │      ║
║  │  │                                                              │    │      ║
║  │  │  ⚔️ COMBAT ABILITY                                           │    │      ║
║  │  │  text-xs font-bold uppercase text-purple-400                 │    │      ║
║  │  │                                                              │    │      ║
║  │  │  ┌─────────────────────────────────────────────────────┐     │    │      ║
║  │  │  │  bg-white/5 border border-purple-500/30             │     │    │      ║
║  │  │  │                                                     │     │    │      ║
║  │  │  │  Roll Type:               Spellcast                 │     │    │      ║
║  │  │  │  Range:                   Close                     │     │    │      ║
║  │  │  │  Damage:                  1d8                       │     │    │      ║
║  │  │  │  Cost:   ┌─────────────┐  ┌─────────────┐           │     │    │      ║
║  │  │  │          │  2 Hope     │  │  1 Stress   │           │     │    │      ║
║  │  │  │          │ bg-blue-900 │  │ bg-red-900  │           │     │    │      ║
║  │  │  │          └─────────────┘  └─────────────┘           │     │    │      ║
║  │  │  │                                                     │     │    │      ║
║  │  │  │  Effects:                                           │     │    │      ║
║  │  │  │  ┌────────────┐ ┌────────────┐                      │     │    │      ║
║  │  │  │  │   Push     │ │  Knockdown │                      │     │    │      ║
║  │  │  │  │ bg-orange- │ │ bg-orange- │                      │     │    │      ║
║  │  │  │  │ 900/50     │ │ 900/50     │                      │     │    │      ║
║  │  │  │  └────────────┘ └────────────┘                      │     │    │      ║
║  │  │  └─────────────────────────────────────────────────────┘     │    │      ║
║  │  │                                                              │    │      ║
║  │  └─────────────────────────────────────────────────────────┘    │      ║
║  │                                                                     │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## Shared Components

### Modifier Sheet (Bottom Sheet)

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  [Sheet Component - slides up from bottom]                                    ║
║  bg-zinc-900 rounded-t-xl max-h-[80vh]                                        ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  [Handle]  mx-auto w-12 h-1.5 bg-gray-600 rounded-full              │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  [Header]                                                           │      ║
║  │                                                                     │      ║
║  │  AGILITY MODIFIERS                                      [X] Close  │      ║
║  │  text-lg font-bold                                                  │      ║
║  │                                                                     │      ║
║  │  Base: 2    Total: +4                                               │      ║
║  │  text-sm text-gray-400                                              │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  [Tabs - if multiple modifier categories]                           │      ║
║  │                                                                     │      ║
║  │  ┌────────────┐ ┌────────────┐ ┌────────────┐                       │      ║
║  │  │  Attack    │ │  Damage    │ │  Spellcast │                       │      ║
║  │  │  [active]  │ │            │ │            │                       │      ║
║  │  └────────────┘ └────────────┘ └────────────┘                       │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  [Modifiers List]  overflow-y-auto                                  │      ║
║  │                                                                     │      ║
║  │  SYSTEM MODIFIERS                                                   │      ║
║  │  text-xs uppercase text-gray-500                                    │      ║
║  │                                                                     │      ║
║  │  ┌───────────────────────────────────────────────────────────────┐  │      ║
║  │  │  🛡️ Chainmail Armor                              +1           │  │      ║
║  │  │  bg-white/5 rounded-lg p-3                                    │  │      ║
║  │  │  (system modifiers cannot be removed)                         │  │      ║
║  │  └───────────────────────────────────────────────────────────────┘  │      ║
║  │                                                                     │      ║
║  │  ┌───────────────────────────────────────────────────────────────┐  │      ║
║  │  │  ✨ Arcane Ward (Domain Card)                     +1      [🗑️] │  │      ║
║  │  │  bg-purple-500/10 border-purple-500/30                        │  │      ║
║  │  └───────────────────────────────────────────────────────────────┘  │      ║
║  │                                                                     │      ║
║  │  USER MODIFIERS                                                     │      ║
║  │  text-xs uppercase text-gray-500                                    │      ║
║  │                                                                     │      ║
║  │  ┌───────────────────────────────────────────────────────────────┐  │      ║
║  │  │  Bless                                            +2      [🗑️] │  │      ║
║  │  │  bg-white/5 rounded-lg p-3                                    │  │      ║
║  │  │  (user modifiers can be removed)                              │  │      ║
║  │  └───────────────────────────────────────────────────────────────┘  │      ║
║  │                                                                     │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  [Add Modifier Form]                                                │      ║
║  │                                                                     │      ║
║  │  ┌────────────────────────┐ ┌──────────┐ ┌────────────┐             │      ║
║  │  │  Modifier name...      │ │  Value   │ │ + Add      │             │      ║
║  │  │  input text-sm         │ │  +/-     │ │ bg-dagger- │             │      ║
║  │  │                        │ │  spinner │ │ gold       │             │      ║
║  │  └────────────────────────┘ └──────────┘ └────────────┘             │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Add Item/Card Modal

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  [Modal - centered overlay]                                                   ║
║  bg-black/80 backdrop-blur-sm                                                 ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐      ║
║  │  bg-zinc-800 rounded-xl max-w-lg w-full max-h-[80vh]                │      ║
║  │                                                                     │      ║
║  │  ┌─────────────────────────────────────────────────────────────┐    │      ║
║  │  │  [Header]                                                    │    │      ║
║  │  │                                                              │    │      ║
║  │  │  ADD ITEM                                         [X] Close │    │      ║
║  │  │  text-lg font-bold                                           │    │      ║
║  └─────────────────────────────────────────────────────────────┘    │      ║
║  │                                                                     │      ║
║  │  ┌─────────────────────────────────────────────────────────────┐    │      ║
║  │  │  [Search & Filter]                                           │    │      ║
║  │  │                                                              │    │      ║
║  │  │  ┌────────────────────────────────────────────────────────┐  │    │      ║
║  │  │  │  🔍 Search items...                                    │  │    │      ║
║  │  │  │  bg-white/5 rounded-lg                                 │  │    │      ║
║  │  │  └────────────────────────────────────────────────────────┘  │    │      ║
║  │  │                                                              │    │      ║
║  │  │  [Filter Pills - if filterType allows]                       │    │      ║
║  │  │  ┌────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐           │    │      ║
║  │  │  │  All   │ │ Weapons  │ │  Armor  │ │ Consumab │           │    │      ║
║  │  │  └────────┘ └──────────┘ └─────────┘ └──────────┘           │    │      ║
║  │  └─────────────────────────────────────────────────────────────┘    │      ║
║  │                                                                     │      ║
║  │  ┌─────────────────────────────────────────────────────────────┐    │      ║
║  │  │  [Item List]  overflow-y-auto flex-1                         │    │      ║
║  │  │                                                              │    │      ║
║  │  │  ┌─────────────────────────────────────────────────────────┐ │    │      ║
║  │  │  │  LONGSWORD                                 [+ Add]      │ │    │      ║
║  │  │  │  Weapon • Strength • 1d8                                │ │    │      ║
║  │  │  │  bg-white/5 hover:bg-white/10 p-3 rounded-lg            │ │    │      ║
║  │  │  └─────────────────────────────────────────────────────────┘ │    │      ║
║  │  │                                                              │    │      ║
║  │  │  ┌─────────────────────────────────────────────────────────┐ │    │      ║
║  │  │  │  CHAINMAIL                                  [+ Add]     │ │    │      ║
║  │  │  │  Armor • Score: 6 • Thresholds: 2/3/5                   │ │    │      ║
║  │  │  └─────────────────────────────────────────────────────────┘ │    │      ║
║  │  │                                                              │    │      ║
║  │  │  [Loading state or empty state if no results]                │    │      ║
║  │  │                                                              │    │      ║
║  │  └─────────────────────────────────────────────────────────────┘    │      ║
║  │                                                                     │      ║
║  │  ┌─────────────────────────────────────────────────────────────┐    │      ║
║  │  │  [Footer - Create Homebrew Button]                           │    │      ║
║  │  │                                                              │    │      ║
║  │  │  ┌────────────────────────────────────────────────────────┐  │    │      ║
║  │  │  │  + Create Custom Item                                  │  │    │      ║
║  │  │  │  bg-purple-500/20 text-purple-300 rounded-lg           │  │    │      ║
║  │  │  └────────────────────────────────────────────────────────┘  │    │      ║
║  │  └─────────────────────────────────────────────────────────────┘    │      ║
║  └─────────────────────────────────────────────────────────────────────┘      ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## Design Philosophy Summary

### Color System

| Context | Color | Usage |
|---------|-------|-------|
| Gold Accent | `text-dagger-gold` / `#C8AA6E` | Modified stats, active states, emphasis |
| Panel Background | `bg-dagger-panel` / `#1a1a1a` | Card backgrounds |
| App Background | `bg-dagger-dark` / `#0a0a0a` | Page backgrounds |
| Positive Modifier | `text-green-400` | Bonuses, positive changes |
| Negative Modifier | `text-red-400` | Penalties, negative changes |
| Evasion | `text-cyan-400` | Evasion stat |
| Armor | `text-blue-400` | Armor stat |
| HP | `text-red-400` | Hit points |
| Stress | `text-purple-400` | Stress track |
| Hope | `text-dagger-gold` | Hope track |

### Interactive States

| State | Visual Treatment |
|-------|-----------------|
| Default | `border-white/10` |
| Hover | `hover:border-white/30` or `hover:bg-white/10` |
| Modified | `border-dagger-gold/30`, gold text color, gold dot indicator |
| Critical | `border-red-500`, red text where appropriate |
| Active Tab | `bg-dagger-gold text-black` |
| Inactive Tab | `text-gray-400 hover:text-white` |

### Typography

| Element | Style |
|---------|-------|
| Card Names | `font-serif font-bold text-white` |
| Section Headers | `text-xs font-bold uppercase text-gray-500 tracking-wider` |
| Feature Names | `text-xs font-bold text-dagger-gold uppercase tracking-wider` |
| Body Text | `text-sm text-gray-300` |
| Badges | `text-[10px] uppercase font-bold` |

---

*This document should be updated whenever new card patterns are introduced or existing ones are modified.*