---
description: Guidelines for creating new pages with consistent layouts and navigation
---
# Page Layout Guidelines

This document describes the standard patterns for creating pages in the Daggerheart Companion app.

## Navigation Pattern

The app uses a **dual-menu** navigation pattern that provides consistent access throughout:

### Top-Right: `UserMenu` (Always Present)
The `UserMenu` dropdown appears on **every page** and provides:
- **Characters** → `/client/characters` (character selection)
- **Campaigns** → `/campaigns` (campaign list)
- **Profile** → Profile view
- **Settings** → Settings view
- **Sign Out** → Logout

This ensures users can **always** navigate to any major section and never get stuck.

### Top-Left: Contextual Navigation
- **On character sheet pages**: Shows current character name with dropdown to switch characters
- **On standalone pages**: Shows page title with back button to parent page

## Layout Components

### 1. `MobileLayout` (for character sheet views)
File: `components/core/mobile-layout.tsx`

Used by: `DaggerheartApp` for all character-related views (Character, Combat, Playmat, Inventory, Downtime, Journal, Settings, Profile).

Provides:
- Header with character name (clickable to switch characters)
- `UserMenu` dropdown (sign out, profile, settings, campaigns, characters)
- Bottom navigation bar with primary tabs
- Floating dice roller button
- Mini vitals banner

**When to use:** Only for views that require a selected character and are rendered within the `DaggerheartApp` component.

### 2. `PageLayout` (for standalone pages)
File: `components/core/page-layout.tsx`

Used by: Campaign pages, character selection, and any other pages outside the main character sheet flow.

Provides:
- Consistent header with title
- `UserMenu` dropdown (same as MobileLayout - provides consistent navigation)
- Back navigation button
- Optional header actions (buttons)

**When to use:** For any standalone page that needs user-level navigation (sign out, profile access) but doesn't require the full character sheet chrome.

## Creating a New Page

### All pages MUST:
1. **Include `UserMenu`** - Never create a page without it
2. **Provide back navigation** to a logical parent page
3. **Use consistent styling** from the design system

### Checklist for new pages:
- [ ] Does the page require a character to be loaded?
  - **Yes**: Render within `MobileLayout` (inside `DaggerheartApp`)
  - **No**: Wrap content with `PageLayout`
- [ ] Does the page have a clear "back" destination?
- [ ] Is `UserMenu` visible on this page?
- [ ] Does the header match the design of other pages?

## Example: Using PageLayout

```tsx
import PageLayout from '@/components/core/page-layout';

export default function MyNewPage() {
    const headerActions = (
        <button className="px-3 py-1.5 bg-dagger-gold ...">
            Action Button
        </button>
    );

    return (
        <PageLayout
            title="My Page Title"
            backHref="/parent-page"
            backLabel="Back"
            headerActions={headerActions}
        >
            {/* Page content */}
        </PageLayout>
    );
}
```

## Common Mistakes to Avoid

1. **Creating pages without `UserMenu`** - Users get stuck without navigation
2. **Implementing custom headers** instead of using shared layout components
3. **Forgetting back navigation** - Users can't return to where they came from
4. **Inconsistent styling** - Different colors, fonts, or spacing than other pages

## Architecture Overview

```
App Routes
├── /client → DaggerheartApp → MobileLayout → [Character Views]
│   ├── Character, Combat, Playmat, Inventory, Downtime, Journal
│   └── All views have UserMenu in top-right
│
├── /client/characters → Character Selection (uses its own layout)
│
├── /campaigns → PageLayout → CampaignList
├── /campaign/[id] → PageLayout → CampaignDetailPage
├── /campaign/[id]/gm → PageLayout → GmScreen
│   └── All campaign pages have UserMenu in top-right
│
└── /auth/* → No layout wrapper (login/logout flows)
```

## UserMenu Contents

The `UserMenu` component (`components/core/user-menu.tsx`) contains:

| Section | Items |
|---------|-------|
| **User Info** | Display name, email |
| **Content** | Characters, Campaigns |
| **Account** | Profile, Settings |
| **Actions** | Sign Out |

