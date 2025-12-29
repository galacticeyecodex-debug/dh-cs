# Daggerheartbrews Card Layout Analysis

## Overview
This document details the professional card layout and rendering approach used by daggerheartbrews.com, which has been implemented in this project for domain cards.

## Card Structure (340px width, 2.5:3.5 aspect ratio)

### Layout Breakdown

```
┌─────────────────────────────┐
│ Banner (Level)      [Recall]│ ← Banner top-left, Recall badge top-right
│ [Domain Icon]               │   (text offset for lightning bolt)
│                             │
│   ┌─────────────────────┐   │
│   │                     │   │
│   │   Optional Image    │   │ ← Custom artwork area (250px height)
│   │      Area           │   │
│   │                     │   │
│   └─────────────────────┘   │
│                             │
├─────── Divider ─────────────┤ ← Domain divider with gradient (type only)
│                             │
│      Card Name              │ ← Centered, serif font
│                             │
│   Card Description Text     │ ← 12px, leading-tight
│   Lorem ipsum dolor sit     │
│   amet, consectetur...      │
│                             │
├─────────────────────────────┤
│  Interactive Elements Area  │ ← Reserved for tokens, etc. (36px)
└─────────────────────────────┘
```

## Component Analysis

### 1. **Banner Component** (`card-banner.tsx`)

**Positioning:**
- Top-left corner at `left: 24px, top: -4px`
- z-index: 40-50 for layering

**Structure:**
```tsx
<Banner decoration (z-40)>     // WebP image
<Foreground clip (z-30)>       // Domain primary color
<Background clip (z-20)>       // Domain secondary color
<Level number (z-50)>          // Centered at top: 16px
<Domain icon (z-50)>           // Centered at top: 54px (32x32px)
```

**Sizing:**
- Full: 63px width × 120px height
- Thumbnail: 44px width × 85px height

**Colors:**
- Primary color: Foreground clip-path
- Secondary color: Background clip-path
- Text: Auto-contrast (white/black based on brightness)

### 2. **Recall Cost Badge**

**Positioning:**
- Badge image: Top-right at `right: 24px, top: 24px`
- Text: Offset at `right: 40px, top: 29px` (accounts for lightning bolt)
- z-index: 40 (badge), 41 (text)

**Structure:**
```tsx
<Background image (recall-cost-bg.webp)>  // Badge image
<Offset text>                              // Cost number, offset left from center
```

**Sizing:**
- Full: 32px × 32px
- Thumbnail: 24px × 24px

**Text Offset:**
The recall cost text is positioned explicitly rather than centered because the badge has a lightning bolt graphic on the right side.

### 3. **Divider Component** (`card-divider.tsx`)

**Positioning:**
- Centered horizontally
- At top of content section

**Structure:**
```tsx
<Gradient background (clip-card-divider)>  // Primary to secondary gradient
<WebP decoration (divider-domain.webp)>    // Overlay image
<Domain label text>                        // Centered text
```

**Styling:**
- Gradient: `linear-gradient(to right, primary, secondary)`
- Text: Uppercase, bold, auto-contrast color
- Image offset: `top: -14px` for domain cards

### 4. **Content Section**

**Positioning:**
- Absolute positioned at `bottom: 36px` (full), `bottom: 25px` (thumbnail)
- White background (`bg-white`)
- z-index: 20

**Heights:**
- With image: 140px minimum (full), 100px (thumbnail)
- Without image: 185px minimum (full), 130px (thumbnail)

**Typography:**
- Name: Serif font, bold, 16px (full), ~11px (thumbnail)
- Description: 12px (full), ~8px (thumbnail)
- Leading: tight
- Padding: 24px horizontal

### 5. **Interactive Elements Area**

**Positioning:**
- Absolute bottom at `bottom: 0`
- Full width, white background

**Height:**
- Full: 36px
- Thumbnail: 25px

**Purpose:**
Reserved space at the bottom of the card for future interactive elements such as:
- Token counters
- Action buttons
- Status indicators
- Quick reference icons

## Data Model

### SRD Domain Card Data
```typescript
{
  name: string;          // "Unleash Chaos"
  level: string;         // "1" (tier)
  domain: string;        // "Arcana"
  type: string;          // "Spell", "Ability", "Grimoire"
  recall: string;        // "1" (recall cost 0-5)
  text: string;          // Full markdown description
}
```

### CardDetails (daggerheartbrews)
```typescript
{
  name: string;
  type: CardType;        // "domain", "class", "subclass", etc.
  image?: string;        // Custom artwork URL
  text?: string;         // HTML description
  level?: number;        // Card tier
  stress?: number;       // Recall cost for domain cards
  domainPrimary?: string;
  domainPrimaryColor?: string;
  domainSecondary?: string;
  domainSecondaryColor?: string;
}
```

## Color System

### Domain Colors
Each domain has:
- **Primary color**: Banner foreground, divider gradient start
- **Secondary color**: Banner background, divider gradient end
- **Accent color**: Badge borders, highlights

### Auto-Contrast Text
```typescript
getBrightness(hexColor) < 128 ? 'white' : 'black'
```

## Asset Files

### Downloaded from daggerheartbrews.com
1. `banner.webp` (39KB) - Octagonal banner decoration
2. `divider-domain.webp` (4.3KB) - Domain divider decoration
3. `level-bg.webp` (8.5KB) - Level badge background
4. `recall-cost-bg.webp` (30KB) - Recall cost badge background

### CSS Utilities
```css
.aspect-card {
  aspect-ratio: 2.5 / 3.5;
}

/* Banner clip paths - complex shapes matching exact banner decoration */
.clip-card-banner-fg {
  clip-path: polygon(
    0 0, 11% 1%, 11% 51%, 17% 55%, 18% 0, 82% 0,
    83% 56%, 88% 52%, 88% 0, 100% 1%, 100% 58%,
    83% 69%, 82% 90%, 72% 90%, 63% 88%, 57% 85%,
    49% 82%, 43% 85%, 34% 88%, 25% 90%, 18% 90%,
    17% 68%, 0 59%
  );
}

.clip-card-banner-bg {
  clip-path: polygon(
    91% 100%, 91% 0, 6% 0, 9% 100%, 29% 98%,
    39% 95%, 45% 91%, 47% 86%, 46% 83%, 46% 79%,
    53% 79%, 53% 84%, 53% 87%, 56% 91%, 60% 95%, 71% 98%
  );
}

.clip-card-divider {
  clip-path: polygon(67% 16%, 73% 49%, 66% 87%, 33% 81%, 27% 48%, 35% 16%);
}
```

## Implementation Notes

### Key Differences from Original
1. **Background**: White (matches daggerheartbrews) instead of dark theme
2. **Fixed Width**: 340px for full cards (responsive in grid)
3. **Image Handling**: Optional custom artwork in middle section
4. **Text Rendering**: ReactMarkdown instead of dangerouslySetInnerHTML

### Responsive Scaling
- **Thumbnail mode**: 0.7x scale factor for all dimensions
- **Full mode**: 1.0x scale (340px width)
- Font sizes scale proportionally
- Asset sizes scale proportionally

### Z-Index Layers
```
50: Banner decoration, level text
40: Banner, recall badge, mechanic badges
30: Banner foreground clip
20: Banner background clip, content section
10: Divider text
0: Base background, custom image
```

## Usage Example

```tsx
<DomainCard
  name="Unleash Chaos"
  domain="Arcana"
  tier={1}
  type="Spell"
  description="At the beginning of a session, place tokens..."
  recallCost={1}
  customImageUrl="/path/to/artwork.jpg"
  customImageType="artwork"
  hasPassiveModifiers={false}
  hasCombatAbility={true}
  onClick={() => openDetails()}
  size="thumbnail"
/>
```

## References

- **Original repo**: https://github.com/kelvin-mai/daggerheartbrews.com
- **Banner component**: `/src/components/card-creation/preview/template/core/banner.tsx`
- **Divider component**: `/src/components/card-creation/preview/template/core/divider.tsx`
- **Card preview**: `/src/components/card-creation/preview/index.tsx`
- **Types**: `/src/lib/types/card-creation.ts`
