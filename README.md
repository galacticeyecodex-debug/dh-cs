<p align="center">
  <img src="images/logo_transparent.png" alt="Daggerheart Companion Logo" width="200"/>
</p>

# Why Does This App Exist?
First, let me say that this repository is 1) free, 2) open source, and 3) available for use by anyone who wants to use it, and 4) very much a work in progress.

I play Daggerheary once a week with my children, brother, and sister for our compaign set in the magical university of Stixhaven. We started out with D&D 5e, but I convinced them to try Daggerheart. I love the system! The family was very generous to let us use this system for our games, which was mostly because I fely that it would be more fun to run than D&D.

There was a problem though. We are all fairly inexperienced with TTRPGs and since we live in different states, we rely on digital tools to play the game. For D&D, we relied heavily on D&D Beyond to keep track of our characters and to help use understand the rules. At the time, there was no such tool for Daggerheart. So I decided to build one.

This app was built to roll digital dice -- we don't all own real dice -- and to keep track of the math behind the game.

To my knowledge, there is no other app that attempts to keep track of the modifiers and bonuses that come from your domain cards and other features.

That said, it's a work in progress. We're only level 3, so not everything is implemented yet. Not every domain works yet. That's fine. We're having fun. And every week, I get feedback about how to make our game and this app better. It's open source, so if you don't want to use and improve it, you can fork it and make it better!

# Daggerheart Dice & Character Creator

A mobile-first, digital character sheet for the [Daggerheart](https://darringtonpress.com/daggerheart/) Tabletop RPG. Built with Next.js 15, TypeScript, and Supabase.

## Support

If you find this project useful or fun to use, consider sending a "Thank you!"

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-yellow?style=for-the-badge&logo=buy-me-a-coffee)](https://buymeacoffee.com/galactic.eye.codex)

Thank you! ☕

## Demo

You can try out a demo of the app here: [**daggerheart-cs-dev.onrender.com**](https://daggerheart-cs-dev.onrender.com/)

<p align="center">
  <img src="images/character-page.png" alt="Character Sheet" width="45%" />
  <img src="images/combat-page.png" alt="Combat View" width="45%" />
</p>

## Features & Roadmap

### Core Features
- [x] **Mobile-First Design** - Optimized for portrait mobile usage with touch interactions
- [x] **Cloud Sync** - Character data stored securely in Supabase
- [x] **Google OAuth** - Easy authentication with your Google account
- [x] **3D Dice Rolling** - Interactive dice roller with physics simulation and customizable Hope and Fear dice
- [x] **Card-Based UI** - Manage abilities, equipment, and features as interactive cards
- [x] **Multiclassing Support** - Full support for multiclassing
- [x] **Homebrew Content** - Create and manage custom weapons, armor, consumables, and items

### Domain Card Integration (✅ Complete)
- [x] **Passive Modifiers** - Domain cards automatically apply stat bonuses when in loadout
- [x] **Conditional Modifiers** - Equipment-based and loadout composition conditions evaluated
- [x] **Combat Spells & Abilities** - Full "Spells & Abilities" section in Combat View
- [x] **Token Tracking** - Cards with token mechanics have interactive counters
- [x] **Frequency Tracking** - Once-per-rest/session abilities with usage checkboxes
- [x] **Enhanced Playmat UI** - Combat badges, passive indicators, search/filter, mobile optimized

### Extended Views (✅ Complete)
- [x] **Downtime View** - Rest type selection, downtime moves with dice rolling, project tracking
- [x] **Journal View** - NPC relationships with tier tracking, reputation system, text notes

### Social & Multiplayer Features (✅ Complete - Issue #67)
- [x] **Campaign Management** - Create/join campaigns and assign characters to campaigns
- [x] **GM Screen** - Real-time party monitoring with vitals, Fear tracker, announcements, and dice rolling
- [x] **Activity Feed** - Persistent log of dice rolls, vital changes, GM announcements (7-day retention)
- [x] **Roll Notifications** - Pop-up notifications when party members of GM roll dice (with Hope/Fear/Critical styling)
- [x] **GM Tools** - Adjust player vitals, manage Fear, send announcements, hidden GM rolls, view Adversary and Environment stat blocks
- [x] **Countdowns & Projects** - GM countdown trackers and player project management
- [x] **Friendships** - Friend codes, friend requests, and friend list management

### Level-Up System (✅ Complete)
- [x] **All Advancement Types** - Traits, HP, Stress, Experience, Domain Cards, Evasion, Subclass, Proficiency, Multiclass
- [x] **Tier System** - Proper Tier 1-4 progression with level mapping
- [x] **Advancement History** - Full tracking with de-leveling support

## Development Roadmap

### In Progress / Planned

| Feature | Status | Description |
|---------|--------|-------------|
| Homebrew Sharing | 📋 Planned | Share custom items with campaign members (Phase 6) |

### Class & Subclass Interactive Features

| Class | Subclass | Feature | Status | Description |
|-------|----------|---------|--------|-------------|
| Ranger | Beastbound | Companion Card | ✅ Done | Interactive companion sheet with image upload, training options, and companion level-up |
| Bard | All | Rally Die | ✅ Done | d6 die tracker (upgrades to d8 at level 5) to give to party members |
| Druid | All | Beastform | ✅ Done | Creature form selector with stats from Beastform creature list (Tiers 1-4) |
| Druid | Warden of the Elements | Elemental Incarnation | ✅ Done | Element selection (Fire, Earth, Water, Air) with active channeling state |
| Guardian | All | Unstoppable Die | ✅ Done | d4 escalating die tracker (upgrades to d6 at level 5) for damage bonus |
| Seraph | All | Prayer Dice | ✅ Done | d4 roller with prayer dice result tracker (dice equal to Spellcast trait) |
| Sorcerer | Elemental Origin | Element Selection | ✅ Done | Choose element (air, earth, fire, lightning, water) at character creation |
| Warrior | Call of the Slayer | Slayer Dice | ✅ Done | d6 dice pool tracker (up to Proficiency dice) for Slayer abilities |
| Wizard | All | Strange Patterns | ✅ Done | Number selector (1-12) for Strange Patterns class feature |

## UI Design Standards

This project follows consistent design patterns for a polished, cohesive interface:

### Icon Sizing
- **Utility Icons** (Info, Settings, Art, Delete): 12px - Used on card action buttons
- **Navigation Icons** (Activity, Grid, Book): 14px - Used in tab bars
- **Header Icons** (Sword, Layers): 16px - Used in section headers
- **Feature Icons**: 24-28px - Used in ViewHeaders and FAB buttons

### Card Components
All interactive cards share a common pattern:
- **Top-right action overlay**: Contains utility buttons (Info, Art, Settings) with consistent 12px icons
- **Panel styling**: `bg-dagger-panel border border-white/10 rounded-xl`
- **Hover states**: Subtle `hover:bg-white/10` transitions

For detailed component specifications, see `.claude/rules/UI_CARD_REFERENCE.md`.

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Backend:** [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) (via shadcn/ui)
- **3D Dice:** [@3d-dice/dice-box](https://github.com/3d-dice/dice-box)

## Getting Started

### Prerequisites

- Node.js 20+ installed
- A Supabase account and project
- Google OAuth credentials (for authentication)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/galacticeyecodex-debug/dh-cs.git
cd dh-cs
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

4. **Supabase Setup**:

   This project leverages Supabase for its backend, including the PostgreSQL database and authentication. Follow these detailed steps to set up your own Supabase instance:

   *   **Create a New Supabase Project**:
       1.  Go to [Supabase](https://supabase.com/) and sign up or log in.
       2.  Click "New project" to create a new project.
       3.  Remember your project's **Project URL** and **Anon Key**; these will be needed for your `.env.local` file (Step 3).

   *   **Initialize Database**:
       In your Supabase project dashboard, navigate to the **SQL Editor** and execute the following scripts **in this order**:

       1.  `supabase/schema.sql` - Creates core tables (`profiles`, `character_cards`, etc.) and RLS policies.
       2.  `supabase/seed_library.sql` - Creates `characters` and `library` tables and populates game data.
       3.  `supabase/storage.sql` - Sets up storage buckets for images.

       For each file:
       1.  Open the local file from your cloned repository.
       2.  Copy the entire content into the Supabase SQL Editor.
       3.  Click **Run**.

   *   **Regenerate Game Data (Optional)**:
       The `seed_library.sql` file comes pre-generated. If you need to update game data from the SRD JSON files:
       1.  Run the parser script:
           ```bash
           node scripts/parse_json_srd.js
           ```
       2.  This updates `supabase/seed_library.sql`.
       3.  Re-run `supabase/seed_library.sql` in the Supabase SQL Editor to apply changes.

   *   **Configure Google OAuth (Required for Authentication)**:

       This app uses Google OAuth for user authentication. You'll need to set up OAuth credentials in Google Cloud Console and configure them in Supabase.

       **Step A: Create Google OAuth Credentials**

       1.  Go to [Google Cloud Console](https://console.cloud.google.com/)
       2.  Create a new project or select an existing one
       3.  Navigate to **APIs & Services** → **Credentials**
       4.  Click **Create Credentials** → **OAuth client ID**
       5.  If prompted, configure the **OAuth consent screen**:
           *   User Type: External (unless you have a Google Workspace)
           *   App name: `Daggerheart Companion` (or your preferred name)
           *   User support email: Your email address
           *   Developer contact email: Your email address
           *   Scopes: Add `userinfo.email` and `userinfo.profile`
           *   Test users: Add your Google account email for testing
           *   Click **Save and Continue** through the remaining steps
       6.  Back in **Credentials**, click **Create Credentials** → **OAuth client ID** again
       7.  Application type: **Web application**
       8.  Name: `Daggerheart Web Client` (or your preferred name)
       9.  **Authorized redirect URIs**: You'll get this from Supabase in the next step. For now, leave it blank and click **Create**
       10. Copy the **Client ID** and **Client Secret** - you'll need these for Supabase

       **Step B: Configure Supabase with Google OAuth**

       1.  In your Supabase project dashboard, navigate to **Authentication** → **Providers**
       2.  Find **Google** in the provider list and enable it
       3.  Supabase will display a **Callback URL** (e.g., `https://your-project.supabase.co/auth/v1/callback`)
       4.  Copy this **Callback URL**
       5.  Paste your Google **Client ID** and **Client Secret** from Step A into Supabase
       6.  Click **Save**

       **Step C: Configure Supabase URL Settings**

       1.  In your Supabase project dashboard, navigate to **Authentication** → **URL Configuration**.
       2.  Set **Site URL** to your default site: `https://your-app-name.onrender.com`. If you don't know this yet, proceed to the section on Deploying to Render. If you don't plan to deploy to Render, you can use `http://localhost:3000`.
       3.  Under **Redirect URIs**, add `http://localhost:3000/**` if you also want to enable both the Render deployment and local hosting.
       4.  Click **Save**. If you have redirect issues after Google OAuth, then this is the likely culprit.

       **Step D: Add Callback URL to Google Cloud Console**

       1.  Return to [Google Cloud Console](https://console.cloud.google.com/)
       2.  Navigate to **APIs & Services** → **Credentials**
       3.  Click on your OAuth client ID from Step A
       4.  Under **Authorized redirect URIs**, click **Add URI**
       5.  Paste the **Callback URL** you copied from Supabase (Step B)
       6.  For local development, also add: `http://localhost:3000/auth/callback`
       7.  Click **Save**

       **Step E: Test Authentication**

       1.  Start your development server (`npm run dev`)
       2.  Navigate to your app and try signing in with Google
       3.  If you encounter errors, verify:
           *   The redirect URI in Google Cloud exactly matches the one from Supabase
           *   Your Google account is added as a test user (if app is in testing mode)
           *   Client ID and Secret are correctly entered in Supabase

5. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

### Project Structure

```
dh-cs/
├── app/                  # Next.js App Router pages
│   ├── (playground)/     # Authenticated app views
│   ├── auth/             # Authentication routes
│   └── create-character/ # Character creation wizard
├── components/           # Reusable UI components
│   ├── ui/               # Shadcn/ui primitives
│   ├── views/            # Feature-specific views
│   │   ├── character/    # Character sheet view
│   │   ├── combat/       # Combat view with weapons & spells
│   │   ├── downtime/     # Downtime activities & projects
│   │   ├── inventory/    # Equipment & homebrew management
│   │   ├── journal/      # Relationships & reputation
│   │   └── playmat/      # Domain card management
│   └── ...               # Various logic-heavy components
├── constants/            # Global constants and config
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
│   ├── supabase/         # Supabase client utilities
│   ├── card-parser.ts    # Domain card parsing & enhancement
│   └── ...               # Game logic helpers
├── public/               # Static assets
├── scripts/              # Node.js data processing scripts
├── srd/                  # Source of Truth for game data (JSON files)
├── store/                # Zustand state management
│   └── slices/           # Modular store slices (character, inventory, homebrew, etc.)
├── __tests__/            # Test suites (Vitest)
│   ├── components/       # Component tests
│   ├── content/          # NLU-based parser tests
│   └── lib/              # Utility function tests
└── types/                # TypeScript type definitions
```

## Development

**This project follows Test-Driven Development (TDD) for all feature development.**

### Required Reading
📖 **[Development Workflow Guide](docs/development-workflow.md)** - MUST READ before contributing

### TDD Cycle
1. 🔴 **RED** - Write failing tests first
2. 🟢 **GREEN** - Implement minimal code to pass tests
3. 🔵 **REFACTOR** - Improve code while keeping tests green

### Quick Start
```bash
# Start by writing tests
touch __tests__/store/my-feature.test.ts

# Write failing tests
npm test -- __tests__/store/my-feature.test.ts

# Implement feature
# ... code ...

# Tests should now pass
npm test
```

**Pull requests without tests WILL be rejected.** See [Development Workflow](docs/development-workflow.md) for detailed guidelines.

## Testing

This project uses [Vitest](https://vitest.dev/) for testing with comprehensive coverage of game logic and UI components.

```bash
npm run test:run      # Run all tests once
npm run test          # Watch mode
npm run test:ui       # Interactive dashboard
npm run test:coverage # Coverage report
```

### Test Structure
- **`__tests__/lib/`** - Game logic tests (dice, vitals, modifiers, armor calculations)
- **`__tests__/content/`** - NLU-based domain card parser tests (9 domains + ancestries, communities, classes)
- **`__tests__/components/`** - UI component tests
- **`__tests__/config/`** - Configuration tests (CSP headers for dice roller)

### E2E Testing (Playwright)
```bash
npm run e2e              # Run all E2E tests
npm run e2e:screenshot   # Visual verification tests
npm run e2e:headed       # Run with visible browser
```

## Deployment

This application can be easily deployed to [Render](https://render.com), a unified platform for cloud applications.

### Deploying to Render

1.  **Create a New Web Service**:
    *   Log in to your [Render Dashboard](https://dashboard.render.com/).
    *   Click "New +" -> "Web Service".

2.  **Connect to your Repository**:
    *   Select "Build and deploy from a Git repository".
    *   Connect your GitHub account if you haven't already.
    *   Search for and select the `galacticeyecodex-debug/dh-cs` repository.

3.  **Configure Service Details**:
    *   **Name**: Choose a unique name (e.g., `my-daggerheart-companion`).
    *   **Region**: Select a nearby region.
    *   **Branch**: `main`
    *   **Root Directory**: Leave blank (default).
    *   **Runtime**: `Node`
    *   **Build Command**: `npm run build`
    *   **Start Command**: `npm start`
    *   **Plan Type**: "Free" is enough for a few users.

4.  **Set Environment Variables**:
    Add the following environment variables under the "Environment" tab:

    | Variable | Value | Description |
    | :--- | :--- | :--- |
    | `NEXT_PUBLIC_SUPABASE_URL` | *Your Supabase URL* | From Supabase Settings |
    | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *Your Anon Key* | From Supabase Settings |

5.  **Deploy**:
    *   Click "Create Web Service".
    *   Render will start building your app. This process may take a few minutes.
    *   Once "Live", your app will be accessible at the URL provided (e.g., `https://your-app.onrender.com`).

6.  **Post-Deployment**:
    *   **Important**: Copy your new Render URL.
    *   Go back to **Supabase > Authentication > URL Configuration**.
    *   Update your **Site URL** to this new Render URL to ensure social login redirects work correctly in production.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Legal Notice

This product includes materials from the Daggerheart System Reference Document 1.0, © Critical Role, LLC, under the terms of the Darrington Press Community Gaming License. More information at [www.daggerheart.com](https://www.daggerheart.com).

Darrington Press™ and the Darrington Press authorized work logo are trademarks of Critical Role, LLC and used with permission.

## Disclaimer

This application is provided "as-is" without warranty of any kind. While we strive for accuracy, the app may contain bugs or inconsistencies with the official rules. Users are encouraged to verify critical rules with the official Daggerheart publications. Feedback, bug reports, and contributions to improve the app are welcome on GitHub.

## Acknowledgments

- Built with the amazing [Daggerheart SRD](https://darringtonpress.com/daggerheart/)
- SRD compilation by [seansbox](https://github.com/seansbox/daggerheart-srd/)
- Card layout and design inspiration from [daggerheartbrews.com](https://daggerheartbrews.com)
- Original authentication boilerplate from [shsfwork/supabase-auth-nextjs-google-boilerplate](https://github.com/shsfwork/supabase-auth-nextjs-google-boilerplate)
- LLMs were used to generate a lot of the code for this project, so if you have objections to that, you may not want to use this project.

# Release v1.0 - Implementation Status

This section tracks the implementation status of all domain cards and class features. Use this to understand what's fully working vs. what requires manual tracking.

**Legend:**
- ✅ **Fully Implemented** - All mechanics work automatically (modifiers apply, tokens track, costs deduct, rolls work)
- ⚠️ **Partial** - Core mechanics work but some features require manual tracking
- ❌ **Manual Only** - Card text displays but mechanics require manual interpretation

## Domain Cards by Domain

### Arcana (21 cards)

| Card | Tier | Status | Notes |
|------|------|--------|-------|
| Rune Ward | 1 | ✅ | Hope cost, damage reduction formula |
| Unleash Chaos | 1 | ✅ | Token tracking, Spellcast scaling, Stress replenish |
| Wall Walk | 1 | ✅ | Hope cost button |
| Cinder Grasp | 2 | ✅ | Attack roll, damage |
| Floating Eye | 2 | ✅ | Hope cost |
| Counterspell | 3 | ✅ | Spellcast roll |
| Flight | 3 | ✅ | Token tracking (Agility-based) |
| Blink Out | 4 | ✅ | Hope cost, roll DC |
| Preservation Blast | 4 | ✅ | Attack + damage |
| Chain Lightning | 5 | ✅ | Stress cost, attack + damage |
| Premonition | 5 | ✅ | Once per long rest tracking |
| Rift Walker | 6 | ✅ | Roll DC |
| Telekinesis | 6 | ✅ | Proficiency-scaled damage |
| Arcana-Touched | 7 | ✅ | +1 Spellcast (4+ Arcana cards condition) |
| Cloaking Blast | 7 | ✅ | Hope cost, roll |
| Arcane Reflection | 8 | ✅ | Hope cost |
| Confusing Aura | 8 | ✅ | Roll DC, once per long rest |
| Earthquake | 9 | ✅ | Damage roll, DC, once per rest |
| Sensory Projection | 9 | ✅ | Roll DC, once per rest |
| Adjust Reality | 10 | ✅ | 5 Hope cost |
| Falling Sky | 10 | ✅ | Attack + damage |

### Blade (21 cards) (playtested as of 2/1/2026)

| Card | Tier | Status | Notes |
|------|------|--------|-------|
| Get Back Up | 1 | ⚠️ | Stress cost implemented. User must reduce severity when they mark HP as normal |
| Not Good Enough | 1 | ⚠️ | Damage dice rerolling of 1s and 2s not implemented, but could be added later |
| Whirlwind | 1 | ✅ | Hope cost implemented |
| A Soldier's Bond | 2 | ⚠️ | Once per long rest implemented; Could use a gain 3 Hope button |
| Reckless | 2 | ✅ | Stress cost implemented; Use must choose to roll with advantage. Advantage rolls not specifically implemented, but can be configured in the dice roller |
| Scramble | 3 | ✅ | Once per rest implemented |
| Versatile Fighter | 3 | ✅ | Stress cost implemented, everything else must be handled by the user |
| Deadly Focus | 4 | ✅ | +1 Proficiency modifier with when_active condition |
| Fortified Armor | 4 | ✅ | +2 damage threshold modifier with when_armored condition |
| Champion's Edge | 5 | ⚠️ | 3 Hope cost missing; effects must be applied by user |
| Vitality | 5 | ✅ | 3 activation buttons for modifiers that are still active in the Loadout |
| Battle-Hardened | 6 | ✅ | Hope cost, once per long rest implemented; effects must be applied by user |
| Rage Up | 6 | ✅ | Stress cost, +2×Strength damage modifier (when_active) |
| Blade-Touched | 7 | ✅ | +2 attack, +4 severe threshold (loadout_domain_count: 4+ Blade cards) |
| Glancing Blow | 7 | ✅ | Stress cost implemented |
| Battle Cry | 8 | ✅ | Once per long rest implemented |
| Frenzy | 8 | ✅ | +10 damage, +8 severe threshold (when_active) |
| Gore and Glory | 9 | ✅ | All effects must be applied by user |
| Reaper's Strike | 9 | ✅ | Hope cost, once per long rest implemented |
| Battle Monster | 10 | ✅ | 4 Stress cost, HP modifier |
| Onslaught | 10 | ⚠️ | Stress cost implemented, but Spellcast roll button is incorrectly implemented |

### Bone (21 cards)

| Card | Tier | Status | Notes |
|------|------|--------|-------|
| Deft Maneuvers | 1 | ✅ | +1 attack modifier, Stress cost |
| I See It Coming | 1 | ✅ | Evasion bonus from d4 roll (roll_result formula) |
| Untouchable | 1 | ✅ | Evasion = half Agility formula |
| Ferocity | 2 | ✅ | 2 Hope cost |
| Strategic Approach | 2 | ✅ | Token tracking (Knowledge-based) |
| Brace | 3 | ✅ | Stress cost |
| Tactician | 3 | ✅ | Hope cost |
| Boost | 4 | ✅ | Stress cost, attack |
| Redirect | 4 | ✅ | Stress cost, attack |
| Know Thy Enemy | 5 | ✅ | Hope + Stress cost, roll |
| Signature Move | 5 | ✅ | Once per rest |
| Rapid Riposte | 6 | ✅ | Stress cost, attack |
| Recovery | 6 | ✅ | Hope cost |
| Bone-Touched | 7 | ✅ | +1 Agility (4+ Bone cards), 3 Hope cost |
| Cruel Precision | 7 | ✅ | Damage = Finesse OR Agility (dual when_active modifiers) |
| Breaking Blow | 8 | ✅ | Stress cost |
| Wrangle | 8 | ✅ | Hope cost, roll |
| On the Brink | 9 | ⚠️ | Utility - conditional Hope gain |
| Splintering Strike | 9 | ✅ | Hope cost, once per long rest |
| Deathrun | 10 | ✅ | +1 Proficiency, 3 Hope cost |
| Swift Step | 10 | ⚠️ | Utility - movement |

### Codex (21 cards)

| Card | Tier | Status | Notes |
|------|------|--------|-------|
| Book of Ava | 1 | ✅ | +1 Armor Score, Hope cost, attack |
| Book of Illiat | 1 | ✅ | Hope cost, token-scaled damage |
| Book of Tyfar | 1 | ✅ | Stress cost, attack + damage |
| Book of Sitil | 2 | ✅ | 2 Hope cost, roll DC |
| Book of Vagras | 2 | ✅ | Hope cost, roll DC, once per rest |
| Book of Korvax | 3 | ✅ | Hope + Stress cost, damage, roll DC |
| Book of Norai | 3 | ✅ | Stress cost, high damage |
| Book of Exota | 4 | ✅ | Hope cost, damage, once per rest |
| Book of Grynn | 4 | ✅ | Hope cost, damage, roll DC, once per long rest |
| Manifest Wall | 5 | ✅ | Hope cost, roll DC, once per rest |
| Teleport | 5 | ✅ | Roll DC, once per long rest |
| Banish | 6 | ✅ | Stress cost, roll, once per rest |
| Sigil of Retribution | 6 | ✅ | Token tracking |
| Book of Homet | 7 | ✅ | Roll DC, once per long rest |
| Codex-Touched | 7 | ✅ | Spellcast = Proficiency (4+ Codex cards) |
| Book of Vyola | 8 | ✅ | Hope cost, roll, once per long rest |
| Safe Haven | 8 | ✅ | 2 Hope cost |
| Book of Ronin | 9 | ✅ | Roll DC, once per long rest |
| Disintegration Wave | 9 | ✅ | Stress cost, roll DC, once per long rest |
| Book of Yarrow | 10 | ✅ | 5 Hope cost, roll DC |
| Transcendent Union | 10 | ✅ | 5 Hope cost, once per long rest |

### Grace (21 cards)

| Card | Tier | Status | Notes |
|------|------|--------|-------|
| Deft Deceiver | 1 | ✅ | Hope cost |
| Enrapture | 1 | ✅ | Stress cost, roll, once per rest |
| Inspirational Words | 1 | ✅ | Token tracking (Presence-based) |
| Tell No Lies | 2 | ✅ | Stress cost, roll |
| Troublemaker | 2 | ✅ | Roll, once per rest |
| Hypnotic Shimmer | 3 | ✅ | Stress cost, roll, once per rest |
| Invisibility | 3 | ✅ | Token tracking (Spellcast), Stress cost |
| Soothing Speech | 4 | ⚠️ | Utility - narrative |
| Through Your Eyes | 4 | ⚠️ | Utility - narrative |
| Thought Delver | 5 | ✅ | Hope cost, roll |
| Words of Discord | 5 | ✅ | Stress cost, roll DC |
| Never Upstaged | 6 | ✅ | Token tracking, +5 damage modifier |
| Share the Burden | 6 | ✅ | Once per rest |
| Endless Charisma | 7 | ✅ | Hope cost |
| Grace-Touched | 7 | ⚠️ | Utility - advantage mechanic |
| Astral Projection | 8 | ✅ | Stress cost, once per long rest |
| Mass Enrapture | 8 | ✅ | Stress cost, roll |
| Copycat | 9 | ⚠️ | Complex - copy another card |
| Master of the Craft | 9 | ⚠️ | Utility - narrative |
| Encore | 10 | ✅ | Roll |
| Notorious | 10 | ✅ | Stress cost |

### Midnight (21 cards)

| Card | Tier | Status | Notes |
|------|------|--------|-------|
| Pick and Pull | 1 | ⚠️ | Utility - narrative |
| Rain of Blades | 1 | ✅ | Hope cost, attack + damage |
| Uncanny Disguise | 1 | ✅ | Token tracking (Spellcast), Stress cost |
| Midnight Spirit | 2 | ✅ | Hope cost, Spellcast-scaled damage |
| Shadowbind | 2 | ✅ | Roll |
| Chokehold | 3 | ✅ | Stress cost |
| Veil of Night | 3 | ✅ | Roll DC |
| Glyph of Nightfall | 4 | ✅ | Hope cost, roll |
| Stealth Expertise | 4 | ✅ | Stress cost |
| Hush | 5 | ✅ | Hope cost, roll |
| Phantom Retreat | 5 | ✅ | Hope cost |
| Dark Whispers | 6 | ✅ | Stress cost, roll |
| Mass Disguise | 6 | ✅ | Stress cost |
| Midnight-Touched | 7 | ✅ | Fear Die damage bonus (fear_die formula), Stress cost |
| Vanishing Dodge | 7 | ✅ | Hope cost |
| Shadowhunter | 8 | ✅ | +1 Evasion modifier |
| Spellcharge | 8 | ✅ | Token tracking |
| Night Terror | 9 | ✅ | Roll DC, once per long rest |
| Twilight Toll | 9 | ✅ | Token tracking |
| Eclipse | 10 | ✅ | Stress cost, roll DC, once per long rest |
| Specter of the Dark | 10 | ✅ | Stress cost |

### Sage (21 cards)

| Card | Tier | Status | Notes |
|------|------|--------|-------|
| Gifted Tracker | 1 | ✅ | +1 Evasion modifier, Hope cost |
| Nature's Tongue | 1 | ✅ | Hope cost, roll DC |
| Vicious Entangle | 1 | ✅ | Hope cost, attack + damage |
| Conjure Swarm | 2 | ✅ | Hope + Stress cost, damage |
| Natural Familiar | 2 | ✅ | Hope + Stress cost, roll |
| Corrosive Projectile | 3 | ✅ | Attack + damage |
| Towering Stalk | 3 | ✅ | Stress cost, Proficiency-scaled damage |
| Death Grip | 4 | ✅ | 2 Stress cost, damage, roll DC |
| Healing Field | 4 | ✅ | 2 Hope cost, once per long rest |
| Thorn Skin | 5 | ✅ | Token tracking (Spellcast), Hope cost |
| Wild Fortress | 5 | ✅ | Token tracking, Hope cost, roll DC |
| Conjured Steeds | 6 | ✅ | +2 damage modifier, Hope cost |
| Forager | 6 | ✅ | Roll |
| Sage-Touched | 7 | ✅ | +2 Spellcast (4+ Sage cards, natural environment) |
| Wild Surge | 7 | ✅ | Token tracking, Stress cost, once per long rest |
| Forest Sprites | 8 | ✅ | +3 attack modifier, Hope cost |
| Rejuvenation Barrier | 8 | ✅ | Roll DC, once per rest |
| Fane of the Wilds | 9 | ✅ | Token tracking, roll |
| Plant Dominion | 9 | ✅ | Roll DC, once per long rest |
| Force of Nature | 10 | ✅ | +10 damage (when_active), Hope + Stress cost |
| Tempest | 10 | ✅ | High damage roll |

### Splendor (21 cards)

| Card | Tier | Status | Notes |
|------|------|--------|-------|
| Bolt Beacon | 1 | ✅ | Hope cost, Proficiency-scaled damage |
| Mending Touch | 1 | ✅ | 2 Hope cost, once per long rest |
| Reassurance | 1 | ✅ | Once per rest |
| Final Words | 2 | ✅ | Roll DC |
| Healing Hands | 2 | ✅ | Stress cost, roll DC |
| Second Wind | 3 | ✅ | Once per rest |
| Voice of Reason | 3 | ✅ | +1 Proficiency modifier |
| Divination | 4 | ✅ | 3 Hope cost, once per long rest |
| Life Ward | 4 | ✅ | 3 Hope cost |
| Shape Material | 5 | ✅ | Hope cost |
| Smite | 5 | ✅ | 3 Hope cost, once per rest |
| Restoration | 6 | ✅ | Token tracking (Spellcast) |
| Zone of Protection | 6 | ✅ | Token tracking, roll DC, once per long rest |
| Healing Strike | 7 | ✅ | 2 Hope cost |
| Splendor-Touched | 7 | ✅ | +3 severe threshold (loadout_domain_count: 4+ Splendor cards) |
| Shield Aura | 8 | ✅ | Stress cost |
| Stunning Sunlight | 8 | ✅ | Hope cost, high damage |
| Overwhelming Aura | 9 | ✅ | Presence = Spellcast modifier, 2 Hope + Stress cost |
| Salvation Beam | 9 | ✅ | Roll DC |
| Invigoration | 10 | ✅ | Hope cost, once per session |
| Resurrection | 10 | ✅ | Roll DC 20 |

### Valor (21 cards)

| Card | Tier | Status | Notes |
|------|------|--------|-------|
| Bare Bones | 1 | ✅ | Armor Score = 3 + Strength when unarmored, tier-based damage thresholds |
| Forceful Push | 1 | ✅ | Hope cost, attack, d6 Hope bonus |
| I Am Your Shield | 1 | ✅ | Stress cost, reaction |
| Body Basher | 2 | ✅ | Damage = Strength modifier |
| Bold Presence | 2 | ✅ | Hope cost, roll, once per rest |
| Critical Inspiration | 3 | ✅ | Once per rest |
| Lean on Me | 3 | ✅ | Once per long rest |
| Goad Them On | 4 | ✅ | Stress cost, roll |
| Support Tank | 4 | ✅ | 2 Hope cost |
| Armorer | 5 | ✅ | +1 Armor Score (when_armored condition) |
| Rousing Strike | 5 | ✅ | Once per rest |
| Inevitable | 6 | ⚠️ | Utility - auto-success mechanic |
| Rise Up | 6 | ⚠️ | Utility - narrative |
| Shrug It Off | 7 | ✅ | Stress cost |
| Valor-Touched | 7 | ✅ | +1 Armor Score (4+ Valor cards) |
| Full Surge | 8 | ✅ | 3 Stress cost, once per long rest |
| Ground Pound | 8 | ✅ | 2 Hope cost, high damage, roll DC |
| Hold the Line | 9 | ✅ | Hope cost |
| Lead by Example | 9 | ✅ | Stress cost |
| Unbreakable | 10 | ⚠️ | Utility - death-defying mechanic |
| Unyielding Armor | 10 | ⚠️ | Utility - armor restoration mechanic |

---

## Class Features Status

### Implemented Class Mechanics (✅ Complete)

| Class | Feature | Description |
|-------|---------|-------------|
| Bard | Rally Die | d6/d8 die tracker for party members |
| Druid | Beastform | 35+ creature forms with stats, Evasion, advantages |
| Druid (Warden of Elements) | Elemental Incarnation | Fire/Earth/Water/Air channel selection |
| Guardian | Unstoppable Die | d4/d6 escalating die tracker |
| Ranger (Beastbound) | Companion | Full companion sheet with stats, training, level-up |
| Seraph | Prayer Dice | d4 pool equal to Spellcast trait |
| Sorcerer (Elemental) | Element Selection | Air/Earth/Fire/Lightning/Water choice |
| Warrior (Slayer) | Slayer Dice | d6 pool up to Proficiency |
| Wizard | Strange Patterns | 1-12 number selector |

### Class Features Requiring Manual Tracking

| Class | Subclass | Feature | Why Manual |
|-------|----------|---------|------------|
| Bard | Troubadour | Song effects | Song-specific buffs (Relaxing/Epic/Heartbreaking) need manual application |
| Bard | Wordsmith | Heart of a Poet | d4 bonus to persuasion not auto-applied |
| Druid | Warden of Renewal | Regeneration | 3 Hope → clear 1d4 HP healing not automated |
| Guardian | Stalwart | Unwavering/Unrelenting/Undaunted | ✅ Implemented - +1/+2/+3 damage thresholds via enhancement.modifiers |
| Guardian | Vengeance | Revenge | Counter damage mechanic requires manual tracking |
| Ranger | All | Ranger's Focus | Focus target tracking not implemented |
| Ranger | Wayfinder | Ruthless Predator | +1 Proficiency on damage roll not automated |
| Rogue | All | Sneak Attack | Tier-scaled d6s not auto-calculated |
| Rogue | Nightwalker | Shadow Stepper | Stress-based teleport utility |
| Rogue | Syndicate | Contacts | Narrative-based contact generation |
| Seraph | Divine Wielder | Spirit Weapon | Thrown weapon mechanic |
| Seraph | Winged Sentinel | Wings of Light | Flight + Hope damage bonus |
| Sorcerer | Elemental | Natural Evasion | d6 + Evasion reactive defense |
| Sorcerer | Primal | Manipulate Magic | Post-roll spell modification |
| Warrior | Brave | Courage | Hope gain on Fear fail |
| Warrior | Brave | Battle Ritual | 2 Stress clear + 2 Hope gain |
| Wizard | Knowledge | Adept | Stress-for-Hope Experience doubling |
| Wizard | War | Face Your Fear | d10/d12/d13 Fear damage bonus |

---

## Summary

**Domain Cards:** 189 total
- ✅ Fully Implemented: ~176 cards (93%)
- ⚠️ Partial: ~11 cards (6%)
- ❌ Manual Only: 2 cards (1%)

**Newly Supported Formula Types:**
1. **Either/Or choices** - Cards like Cruel Precision (Finesse OR Agility) now parse as dual `when_active` modifiers
2. **Dice roll bonuses** - Cards like I See It Coming (`roll_result_d4` formula)
3. **Fear Die bonuses** - Cards like Midnight-Touched (`fear_die` formula)
4. **Multiplier formulas** - Cards like Rage Up (`2_times_strength` for "twice your Strength")

**Known Gaps:**
1. **Conditional environment** - Sage-Touched "natural environment" condition is not auto-detected
2. **Substitution mechanics** - Grace-Touched (HP → Stress swap) requires manual tracking

**Class Features:** 9 major mechanics fully implemented, ~20 subclass features require manual tracking
