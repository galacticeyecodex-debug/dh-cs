# Daggerheart Character Sheet - UI Card Reference

ASCII diagrams of critical UI card components. For implementation guidance, see STYLE_GUIDE.md and component source code.

---

## Global Patterns

### Standard Panel & Icon Sizing

**Panel Base:**
```
╔═══════════════════════════════════════╗
║  bg-dagger-panel border border-white/10
║  rounded-xl p-4                        ║
║  [Content here]                        ║
╚═══════════════════════════════════════╝
```

**Icon Sizes (CRITICAL):**
- **Utility Icons** (Info, Settings, Art, Delete): `size={12}` - Top-right card buttons
- **Toggle Icons** (Eye, EyeOff): `size={12}` - Section toggles
- **Tab Icons**: `size={14}` - Navigation bar
- **Header Icons**: `size={16}` - Section headers
- **Feature Icons**: `size={24-28}` - ViewHeader, FAB buttons

---

## Character View Cards

### Social Profile Header
```
[Avatar 96px] | CHARACTER NAME (serif, bold)
              | Level + Class badges
              | Ancestry | Community | Transformation badges
```

### Vital Card - Square (Evasion/Armor)
```
╔════════════════════════╗
│ 👁 EVASION             │
│ text-cyan-400          │
│                        │
│        12              │
│   text-2xl bold        │
│  (gold if modified)    │
│                        │
│  [-] [+] buttons       │
╚════════════════════════╝
```

### Vital Card - Rectangle (HP/Stress/Hope)
```
╔═════════════════════════════╗
│ ❤ HIT POINTS               │
│ text-red-400               │
│                            │
│ ❤ ❤ ❤ 🤍 🤍 🤍          │
│ (filled/empty icons)       │
│                            │
│ [CLEAR] [MARK]             │
╚═════════════════════════════╝
```

### Stat Button (Trait - Agility/Strength/etc)
```
┌─────────────────────────────────┐
│ [○] Agility      | 🎲 | [⚙️]    │
│ (unmarked)       |    | (gear)  │
│ Left: name/roll  | text-xl      │
│ Right: +2 value  | font-bold    │
│ (gold if modified)               │
└─────────────────────────────────┘
```

### Ancestry/Community Panel
```
╔══════════════════════════╗
│ FAERIE          [ℹ️ Toggle]│
│ font-serif bold           │
│                           │
│ [Collapsible lore...]     │
│                           │
│ [Feature cards]           │
│ - bg-white/5              │
│ - Feature name (gold)     │
│ - Feature text            │
╚══════════════════════════╝
```

### Subclass Feature Card
```
╔══════════════════════════════════╗
│ LOREKEEPER  [MULTICLASS] [ℹ️]    │
│ font-serif bold                  │
│                                  │
│ [Collapsible lore]               │
│                                  │
│ [FOUNDATION/SPECIALIZATION tier] │
│ [Feature cards with text]        │
╚══════════════════════════════════╝
```

### Companion Card (Ranger Beastbound)
```
╔═════════════════════════════════╗
│ [PORTRAIT]  SHADOW              │
│ w-16 h-16   Wolf                │
│ border-2    [👁 EVASION: 9]     │
│ dagger-gold                      │
│                                 │
│ ⚡ STRESS: ⚡ ⚡ ⚡ ○ ○ ○        │
│ [CLEAR] [MARK]                  │
│                                 │
│ [ATTACK] [DAMAGE] [RANGE] [ARMOR]
│                                 │
│ [Experiences: Tracking +2]      │
│ [Training Badges]               │
╚═════════════════════════════════╝
```

### Lore Text Area
```
┌─────────────────────────┐
│ APPEARANCE    [Saving...] │
│ [textarea for lore]     │
│ bg-white/5 rounded-xl   │
│ focus:ring-dagger-gold  │
└─────────────────────────┘
```

---

## Combat View Cards

### AttackCard (Unified - Weapons/Spells/Features)
```
╔════════════════════════════════════╗
│ [ICON] NAME              [ℹ️ ⚙️]  │
│ font-serif bold          2d8+2      │
│                          bold       │
│ [BADGE] [TRAIT] [RANGE]             │
│                                    │
│ [Collapsible description]          │
│ [Token track (if present)]         │
│                                    │
│ bg-black/40  Action Bar:           │
│ [😰 +Stress] [💛 -Hope]           │
│ [⚡ Attack] [💀 Damage]            │
│ [☐ Frequency]                      │
╚════════════════════════════════════╝
```

**Variants:** default, companion, ancestry, community, spell, reaction

### Proficiency Display
```
┌──────────────────────────────┐
│ Proficiency              🎯 2 │
│ text-sm font-medium          │
│ (gold badge if modified)     │
└──────────────────────────────┘
```

### Heritage Feature Card (Ancestry/Community Combat)
```
╔═════════════════════════════════╗
│ LONG TONGUE              [ℹ️]   │
│ font-serif bold          d12×2  │
│                          bold   │
│ [RIBBET] [FINESSE] [CLOSE]      │
│ (ancestry/community colored)    │
│                                 │
│ Description text                │
│                                 │
│ [😰 +Stress] [💛 -Hope]        │
│ [⚡ Roll +2] [💀 Damage]        │
╚═════════════════════════════════╝
```

### Active Armor Panel
```
╔═════════════════════════════╗
│ CHAINMAIL                   │
│ font-serif bold             │
│                             │
│ [Feature description]       │
│ Score: 6, Thresholds: 2/3/5 │
╚═════════════════════════════╝
```

---

## Inventory View Cards

### Gold Tracker
```
┌─────────────────────────────────┐
│ 3 HANDFULS | 1 BAGS | 0 CHESTS  │
│ text-2xl bold | [-] [+] | [-] [+]
└─────────────────────────────────┘
```

### Filter Pills
```
[📦 All] [⚔️ Weapons] [🛡️ Armor] [❤️ Consumable]
Active: bg-dagger-gold text-black
```

### Inventory Item Row
```
╔═════════════════════════════════════╗
│ LONGSWORD  [PRIMARY] [Custom]  x2   │
│ font-medium text-white              │
│                                     │
│ Strength • Melee • 1d8 Phy          │
│ Hardened: When you take damage...   │
│                                     │
│ [+1 EVASION] [-1 AGILITY]          │
│ (modifier tags)                     │
│                                     │
│ [⚔️ Primary] [⚔️ Secondary]        │
│ [🔄 Unequip]                        │
│                                     │
│ [Art thumbnail - if exists]         │
│ 64x64 rounded-lg                    │
╚═════════════════════════════════════╝
```

**Top-right buttons (always visible):**
- **ℹ️ Info** (conditional): Shows full description
- **🖼️ Art**: Opens ItemArtModal
- **⚙️ Manage**: Opens edit/delete modal

---

## Playmat View Cards

### View Toggle Header
```
[📜 LOADOUT] [📦 VAULT]  | 🔍 Search... | [+ Add Card]
Active: bg-dagger-gold text-black
```

### Active Modifiers Summary
```
╔════════════════════════════════╗
│ ✨ ACTIVE MODIFIERS            │
│                                │
│ [AGILITY +2] [EVASION +1]     │
│ [SPELLCAST -1]                │
│ (grid layout with values)      │
╚════════════════════════════════╝
```

### Domain Card Thumbnail
```
240px × 3:2 aspect | rounded-lg border-dagger-gold
┌────────────────────────┐
│ ╔═══╗ (tier polygon)    │
│ [Custom art area]      │
│ ═════════════════      │
│ ARCANE ARROW           │
│ (domain-colored divider)
│ [Card description...]  │
└────────────────────────┘
```

### Playmat Card Wrapper (Interactive)
```
╔═══════════════════════════════════════════════════╗
│ [Top-right: ↔️ Move] [ℹ️] [🖼️] [⚙️]             │
│                                                  │
│ [Domain Card Thumbnail - 240px × 3:2]           │
│                                                  │
│ Mechanics Tray (bg-black/40):                    │
│ ┌──────────────────────────────────────────────┐ │
│ │ [Token track - if present]                   │ │
│ │ ☐ Once Per Rest                              │ │
│ │                                              │ │
│ │ MODIFIERS (if when_active present):          │ │
│ │ [+10 Damage] [Activate]                      │ │
│ │ [+8 Damage Threshold] [Activate]             │ │
│ │                                              │ │
│ │ [😰 Mark Stress] [💛 Spend Hope]            │ │
│ │ (costs only - no activation)                 │ │
│ │                                              │ │
│ │ [⚡ Roll (+2)] [💀 Damage]                    │ │
│ │ (if has attack/roll)                         │ │
│ │                                              │ │
│ │ [🖼️ Change Art] [📦 To Vault/Loadout]       │ │
│ └──────────────────────────────────────────────┘ │
╚═══════════════════════════════════════════════════╝
```

**CRITICAL DESIGN:** Costs and activation are DECOUPLED
- Cost buttons (Stress/Hope) ONLY pay resources
- Modifiers activated via separate [Activate] buttons
- Users control when to spend vs when to apply bonuses

### Empty Loadout Slot
```
240px × 3:2 | border-dashed border-white/5
📚 SLOT 3
(or "No cards match your search")
```

---

## Shared Components

### Modifier Sheet (Bottom Sheet)
```
Handle: w-12 h-1.5 bg-gray-600 rounded-full

AGILITY MODIFIERS              [X] Close
Base: 2    Total: +4

[Attack] [Damage] [Spellcast] (tabs)

SYSTEM MODIFIERS:
🛡️ Chainmail Armor              +1
(cannot be removed)

DOMAIN MODIFIERS:
✨ Arcane Ward                   +1  [🗑️]

USER MODIFIERS:
Bless                            +2  [🗑️]

[+ Add Modifier] form
```

### Modal Patterns

**Item Art Modal / Card Detail Modal:**
```
bg-zinc-800 rounded-xl max-w-md
border-top: 4px solid {domain/item-color}

[Header with tier polygon & close button]
[Scrollable content area]
[Image preview with upload/gallery options]
[Modifier displays (passive/combat)]
[Footer with metadata]
```

---

## Color System

| Purpose | Color | Tailwind |
|---------|-------|----------|
| Primary Accent | Gold | `text-dagger-gold` |
| Positive Modifier | Green | `text-green-400` |
| Negative Modifier | Red | `text-red-400` |
| Evasion | Cyan | `text-cyan-400` |
| Armor | Blue | `text-blue-400` |
| HP | Red | `text-red-400` |
| Stress | Purple | `text-purple-400` |
| Hope | Gold | `text-dagger-gold` |
| Panel Background | Dark | `bg-dagger-panel` |
| App Background | Darker | `bg-dagger-dark` |

---

## Key Principles

1. **Always-Visible Buttons**: Action buttons (Edit, Delete, Info) MUST be visible on all views, including mobile
2. **Consistent Icon Sizing**: Utility icons use 12px (size={12}) for consistency across all cards
3. **Modified State**: Gold text + gold border when value differs from base
4. **Decoupled Costs**: In Playmat, cost buttons and modifier activation are independent controls
5. **Type-Based Colors**: Domain cards, ancestry features, and community features use domain/ancestry-specific accent colors
6. **Frequency Checkboxes**: Only shown when frequency !== 'at_will'
7. **Token Tracks**: Only shown when card has tokens
8. **Responsive Design**: Cards adapt to mobile-first (390px base) and scale up for desktop

---

**For detailed component implementation, see:**
- `STYLE_GUIDE.md` - UI/UX standards and patterns
- `components/` - React component source code
- `lib/styles.ts` - Color and styling utilities
