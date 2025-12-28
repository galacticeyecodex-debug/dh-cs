# Daggerheartbrews Card Layout Analysis

## Overview
This document details the professional card layout and rendering approach used by daggerheartbrews.com, which has been implemented in this project for domain cards.

## Card Structure (340px width, 2.5:3.5 aspect ratio)

### Layout Breakdown

```
┌─────────────────────────────┐
│ Banner (Level)      [Recall]│ ← Banner top-left, Recall badge top-right
│ (Top Section)               │
│                             │
│   ┌─────────────────────┐   │
│   │                     │   │
│   │   Optional Image    │   │ ← Custom artwork area (250px height)
│   │      Area           │   │
│   │                     │   │
│   └─────────────────────┘   │
│                             │
├─────── Divider ─────────────┤ ← Domain divider with gradient
│                             │
│      Card Name              │ ← Centered, serif font
│                             │
│   Card Description Text     │ ← 12px, leading-tight
│   Lorem ipsum dolor sit     │
│   amet, consectetur...      │
│                             │
└─────────────────────────────┘
```

## Component Analysis

### 1. **Banner Component** (`card-banner.tsx`)

**Positioning:**
- Top-left corner at `left: 24px, top: -4px`
- z-index: 40-50 for layering

**Structure:**
```tsx
<Banner decoration (z-50)>     // WebP image
<Foreground clip (z-30)>       // Domain primary color
<Background clip (z-20)>       // Domain secondary color
<Level number (z-50)>          // Centered text
```

**Sizing:**
- Full: 120px width × 63px height
- Thumbnail: 80px width × 42px height

**Colors:**
- Primary color: Foreground clip-path
- Secondary color: Background clip-path
- Text: Auto-contrast (white/black based on brightness)

### 2. **Recall Cost Badge**

**Positioning:**
- Top-right at `right: 24px, top: 24px`
- z-index: 40

**Structure:**
```tsx
<Background image (stress-cost-bg.webp)>
<Centered text>                // Recall cost number
```

**Sizing:**
- Full: 32px × 32px
- Thumbnail: 24px × 24px

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
- Absolute bottom positioning
- White background (`bg-white`)
- z-index: 20

**Heights:**
- With image: 170px minimum (full), 120px (thumbnail)
- Without image: 230px minimum (full), 160px (thumbnail)

**Typography:**
- Name: Serif font, bold, 16px (full), ~11px (thumbnail)
- Description: 12px (full), ~8px (thumbnail)
- Leading: tight
- Padding: 24px horizontal

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

.clip-card-banner-fg {
  clip-path: polygon(0% 16%, 12% 0%, 88% 0%, 100% 16%, 100% 84%, 88% 100%, 12% 100%, 0% 84%);
}

.clip-card-banner-bg {
  clip-path: polygon(0% 18%, 10% 2%, 90% 2%, 100% 18%, 100% 82%, 90% 98%, 10% 98%, 0% 82%);
}

.clip-card-divider {
  clip-path: polygon(2% 0%, 98% 0%, 100% 50%, 98% 100%, 2% 100%, 0% 50%);
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
