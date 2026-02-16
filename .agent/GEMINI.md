# GEMINI.md - Daggerheart Character Sheet Assistant Instructions

This file contains important instructions for Gemini AI assistants working on this Daggerheart Character Sheet application.

## REQUIRED READING AT SESSION START

**CRITICAL**: Before beginning any work on this project, you MUST read the following reference files:

1. **`.gemini/rules/style-guide.md`** (or `.claude/rules/style-guide.md`) - Complete UI/UX design standards, color system, Lucide icon conventions, component patterns, and interaction guidelines
2. **`.gemini/rules/ui-card-reference.md`** (or `.claude/rules/ui-card-reference.md`) - ASCII diagrams of all UI card components with detailed layout specifications
3. **`srd/markdown/contents/`** - Official Daggerheart game rules (read relevant sections before implementing game mechanics)

**Note:** The files in `.gemini/rules/` and `.agent/rules/` are symlinks to `.claude/rules/` - they all point to the same canonical source.

These files are essential for understanding the project's architecture, design patterns, and game rules. Do not make assumptions - always verify against these references.

---

## Code Style & Conventions

### Naming Conventions
- **TypeScript / Application Logic:** Use **camelCase**.
  - Examples: `isLoading`, `setActiveTab`, `recalculateDerivedStats`
- **Database / Data Models:** Use **snake_case**.
  - Examples: `user_id`, `hp_current`, `character_cards`
  - *Reasoning:* Aligns with Supabase/PostgreSQL schema.

### UI/UX Standards
- **Style Guide:** Consult the Style Guide (`.gemini/rules/style-guide.md`) for any new UI components or layouts. This file contains:
  - File documentation requirements
  - Layout and structure patterns
  - Section header standards
  - Panel and card designs
  - Typography rules
  - Data representation patterns (modifiable stats, vitals)
  - Component standards (StatButton, ModifierSheet, Inventory Items)
  - Icon usage
  - Interaction patterns (always-visible action buttons, selection states)
  - Complete color system and semantic colors

  **IMPORTANT**: Confirm with the user before making any major deviations from these standards.

- **UI Card Reference:** Use `.gemini/rules/ui-card-reference.md` for visual reference when building or modifying UI components. This file contains ASCII diagrams for:
  - Character View cards (Social Profile, Vitals, Stats, Ancestry/Community panels)
  - Combat View cards (Attack cards, Proficiency displays, Heritage features)
  - Inventory View cards (Gold tracker, Item rows, Filter pills)
  - Playmat View cards (Domain cards, Card wrappers, Modals)
  - Shared components (Modifier sheets, Add modals)

### Daggerheart Terminology
When defining variables or database columns for Daggerheart mechanics, prefer the official SRD terms formatted in **snake_case** to match the data model convention.

- **Armor:**
  - `armor_score` (instead of `armor_max`) - The maximum armor value.
  - `armor_slots` (instead of `armor_current`) - The resource used to reduce damage.
- **Health:**
  - `hit_points` (or `hp_current`/`hp_max` to match existing schema, but prefer explicit naming for new features).
  - `damage_thresholds` - Object containing `{ minor, major, severe }`.
- **Classes:**
  - `class_name` or `subclass_name` (if storing strings).
  - `foundation_feature`, `specialization_feature`, `mastery_feature` (for tracking specific cards).
- **Equipment:**
  - `primary_weapon`, `secondary_weapon` (or `equipped_primary` as established).
  - `burden` (for hand occupancy).

## Vital Track Semantics

**CRITICAL**: Understanding how vitals work is essential. The `current` value has different meanings depending on the track type:

### `trackType="mark-bad"` (HP, Armor)
The `current` value represents **CAPACITY YOU CURRENTLY HAVE**.

**Hit Points:**
- `hit_points_current` = HP capacity you currently have
- `hit_points_max` = maximum HP capacity
- **Visual UI**: Marking a heart **REDUCES** `hit_points_current` (you lose HP)
- **Full HP** (healthy) = `hit_points_current: hit_points_max` (all hearts unmarked)
- **No HP** (dying) = `hit_points_current: 0` (all hearts marked/lost)
- **New character**: `hit_points_current: hit_points_max` (start with full HP)

**Armor:**
- `armor_slots` = Armor capacity you currently have (available armor)
- `armor_score` = maximum armor capacity
- **Visual UI**: Marking a shield **REDUCES** `armor_slots` (you use armor to reduce damage)
- **Full armor** (all available) = `armor_slots: armor_score` (all shields unmarked)
- **No armor** (all used) = `armor_slots: 0` (all shields marked/spent)
- **New character**: `armor_slots: armor_score` (start with all armor available)

### `trackType="fill-up-bad"` (Stress, Hope depletion)
The `current` value represents **HOW MUCH YOU HAVE ACCUMULATED** (bad things) or **CONSUMED** (good things).

**Stress:**
- `stress_current` = Stress you have accumulated (bad)
- `stress_max` = maximum stress capacity
- **Visual UI**: Marking stress **INCREASES** `stress_current` (you accumulate stress)
- **No stress** (good) = `stress_current: 0` (no stress marks)
- **Max stress** (bad) = `stress_current: stress_max` (all stress marked)
- **New character**: `stress_current: 0` (start with no stress)

**Summary**:
- HP/Armor "current" = capacity remaining (high is good, marking reduces it)
- Stress "current" = stress accumulated (low is good, marking increases it)

## Testing Requirements

**CRITICAL**: Tests are mandatory for all new game logic functions. The project has comprehensive test infrastructure in place (Issue #13 ✅).

**ALWAYS RUN TESTS**: You must execute the test suite (npm run build > build.log 2>&1 && npm run test:run) before finishing any task or committing code.

**HANDLING FAILURES**: If tests fail, you **MUST** present the failure details to the user and ask for guidance on whether the **code** or the **test** should be updated to resolve the conflict. Do not autonomously decide which is correct.

### When to Write Tests
- ✅ **Always**: Pure functions (game calculations, modifiers, vitals logic)
- ✅ **Always**: State management functions (Zustand store actions)
- ✅ **Always**: Modifier extraction or parsing logic
- ✅ **Always**: Game rule implementations

### Test File Locations
- **Game Logic**: `__tests__/lib/[function-name].test.ts`
- **Store Actions**: `__tests__/store/character-store.test.ts`
- **Modifiers**: `__tests__/lib/modifiers.test.ts`
- **Vitals**: `__tests__/lib/vitals.test.ts`
- **Integration**: `__tests__/lib/integration.test.ts`
- **Content/Parser**: `__tests__/content/abilities-nlu-*.test.ts` (organized by domain)

### Test Structure Pattern
```typescript
describe('function name', () => {
  describe('basic cases', () => {
    it('should handle normal input', () => {
      const result = functionUnderTest(normalInput);
      expect(result).toBe(expectedValue);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined', () => {
      expect(() => functionUnderTest(null)).not.toThrow();
    });
  });

  describe('error conditions', () => {
    it('should clamp values to valid range', () => {
      const result = functionUnderTest(invalidValue);
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
    });
  });
});
```

### Running Tests
```bash
npm run test:run              # Run once and exit
npm run test                  # Watch mode (re-run on change)
npm run test:ui               # Interactive dashboard
npm run test:coverage         # Coverage report
```

## Visual Verification with Playwright

**CRITICAL**: For UI changes, use Playwright to visually verify your work before committing.

### Autonomous Development Workflow

1. **Make code changes** to the app
2. **Run visual verification tests** to capture screenshots
3. **View the screenshots** to verify UI looks correct
4. **Iterate** if visual issues are detected
5. **Run build/unit tests** before committing
6. **Commit** when verified

### Running Visual Tests
```bash
npm run e2e                   # Run all Playwright tests
npm run e2e:screenshot        # Run visual verification tests only
npm run e2e:headed            # Run with visible browser window
npm run e2e:ui                # Open Playwright interactive UI
```

### Test Files
- **E2E Tests**: `e2e/visual-check.spec.ts` - Visual verification tests
- **Screenshots**: `e2e/screenshots/` - Captured screenshots (gitignored)
- **Config**: `playwright.config.ts` - Playwright configuration

### Taking Screenshots
The visual tests automatically capture screenshots of key pages:
- Homepage (`/`)
- Login page (`/auth/login`)
- Create character flow (`/create-character`)

Screenshots are saved to `e2e/screenshots/` and can be viewed to verify UI changes.

### Configuration
- **Base URL**: `http://localhost:3000`
- **Default viewport**: Mobile-first (390x844 - iPhone 14)
- **Auto-starts dev server**: Playwright starts `npm run dev` automatically

### When to Use Visual Verification
- ✅ After making UI component changes
- ✅ After modifying styles or layouts
- ✅ After adding new pages or routes
- ✅ Before committing any visual changes
- ❌ Not needed for pure logic/backend changes

### Test Coverage Goals
- Unit tests for all pure functions
- Integration tests for complex workflows
- Edge cases for data validation
- Error scenarios for robustness

**Examples of well-tested functions**: `calculateArmorScore`, `calculateDamageThresholds`, `clampVitalValue`, `parseDiceNotation`

## Error Recovery Pattern

**CRITICAL**: All Zustand store functions that perform optimistic updates MUST implement error recovery.

### Problem
Without error recovery, if a database write fails, users see success in the UI but data is lost when the page refreshes (silent data corruption).

### Solution
Use the `withOptimisticUpdate` helper from `lib/state-helpers.ts` to automatically rollback state and notify users via toast.

### Pattern

```typescript
await withOptimisticUpdate(
  () => {
    // Capture previous state
    const previousValue = get().character!.value;

    // Optimistic update
    set(s => ({
      character: s.character ? { ...s.character, value: newValue } : null
    }));

    // Return rollback function
    return () => {
      set(s => ({
        character: s.character ? { ...s.character, value: previousValue } : null
      }));
    };
  },
  () => createClient().from('characters').update({ column: newValue }).eq('id', characterId),
  'Failed to update something'
);
```

### Key Rules
- **Always capture state in closure** - Don't reference current state in rollback
- **Stop on first error** - If looping through DB updates, return error immediately
- **Only recalc on success** - `recalculateDerivedStats()` only if `success === true`
- **Test both paths** - Test success (no toast) and error (toast shown + state rolled back)

### Examples
See `docs/STATE_MANAGEMENT.md` for comprehensive examples of:
- Simple field updates (hope, evasion)
- JSONB object updates (gold, modifiers)
- Complex multi-updates (equipment swap)

### Implemented Functions
All 8 Zustand store functions now use error recovery:
1. `updateVitals` - Combat stats
2. `equipItem` - Equipment changes
3. `updateHope` - Hope tracking
4. `updateGold` - Gold tracking
5. `updateEvasion` - Evasion calculation
6. `updateModifiers` - Stat modifiers
7. `moveCard` - Card management
8. `updateExperiences` - Experience tracking

## Project Architecture: Dual-Codebase Coordination

**CRITICAL**: This directory (`dh-cs`) is part of a dual-codebase architecture designed to maintain perfect harmony between online and offline versions of the Daggerheart Character Sheet.

### Service Abstraction Pattern

To prevent Supabase dependency errors in the native app, shared code uses an abstraction layer:

**Core Principle:**
Shared UI components must **NEVER** import directly from `@/lib/supabase/*`.

**The Pattern:**
1.  **Interface**: `types/services.ts` defines the contract.
2.  **Shared Code**: Imports from `@/lib/auth-service` or `@/lib/storage-service`.
3.  **Implementation**:
    *   **Web**: `dh-cs/lib/auth-service.ts` (Supabase impl)
    *   **Native**: `dh-cs-native/lib/auth-service.ts` (Zustand/Mock impl)
4.  **Syncing**: These implementation files are **EXCLUDED** in `sync-native.js`.

### Directory Structure
- **`/dh-cs`** (this directory) - Online version with Supabase authentication and cloud database
- **`/dh-cs-native`** (sibling) - Offline version with Capacitor/Android and local storage
- **`/sync-native.js`** (parent) - Automated sync script to maintain parity

### Synchronized vs. Platform-Specific Files

**Synchronized (Shared Code):**
The following are automatically synced from `dh-cs` to `dh-cs-native`:
- `components/` - All UI components
- `constants/` - Game constants
- `hooks/` - React hooks
- `srd/` - Game rules and reference data
- `types/` - TypeScript types
- `lib/` - Utility functions (EXCEPT data-service.ts and supabase/)
- `store/` - State management (EXCEPT auth-slice.ts)
- `app/(playground)/`, `app/create-character/` - Shared routes
- `app/globals.css`, `app/layout.tsx`, `app/error.tsx`, etc.

**Platform-Specific (NOT Synced):**
- `lib/data-service.ts` - Different implementations for online (Supabase) vs offline (SQLite)
- `lib/supabase/` - Only in online version
- `store/slices/auth-slice.ts` - Authentication only for online version
- `app/page.tsx` - Different landing pages
- `app/auth/` - Auth routes only for online version

### Development Workflow

1. **Make changes in `dh-cs`** - This is the source of truth for shared code
2. **Test locally** - Ensure changes work with Supabase backend
3. **Run sync script** - `node ../sync-native.js` to propagate changes to `dh-cs-native`
4. **Test native version** - Verify changes work with local storage backend
5. **Commit both repositories** - Keep Git history in sync

### When Planning Changes

**Before implementing features, ask:**
- Is this shared game logic or UI? → Will auto-sync
- Does this touch auth or database? → May need platform-specific implementations
- Does this affect data persistence? → Coordinate between `lib/data-service.ts` versions

**Golden Rule:** Any change to shared code must work for BOTH online (Supabase) and offline (SQLite) data layers.

## SRD Research Before Planning Changes

**IMPORTANT**: Before planning or implementing any changes to game mechanics, character features, or UI related to game rules, you **MUST** research the relevant documentation in the `srd/markdown/contents/` folder.

### SRD Folder Structure

The `srd/markdown/contents/` directory contains the official Daggerheart System Reference Document (SRD) with complete game rules and mechanics:

- **Character Creation.md** - Character creation steps and rules
- **Ancestries.md**, **Communities.md**, **Classes.md** - Character options and features
- **Weapons.md**, **Armor.md** - Equipment rules and mechanics
- **Armor Tables.md**, **Primary Weapon Tables.md**, **Secondary Weapon Tables.md** - Equipment data
- **Domains.md** - Domain card system
- **Combat.md**, **Actions and Moves.md** - Combat and action rules
- **Hope.md**, **Stress.md** - Resource mechanics
- **Damage.md** - Damage thresholds and types
- **Gold.md** - Currency system
- **Leveling Up.md** - Progression mechanics

### Required Research Process

When working on features related to game mechanics:

1. **Read the relevant SRD markdown files** before proposing changes
2. **Verify game rules** match the SRD documentation
3. **Check examples and edge cases** described in the SRD
4. **Follow the official terminology** from the SRD exactly
5. **Ask clarifying questions** if SRD rules are ambiguous or missing

### Examples

**Good Approach:**
- User asks to add armor functionality
- Read `Armor.md` and `Armor Tables.md` to understand:
  - How armor slots work (mark to reduce damage)
  - Damage thresholds (Minor, Major, Severe)
  - Unarmored rules (base score 0, thresholds = level)
- Implement according to SRD rules
- Verify implementation matches SRD mechanics

**Bad Approach:**
- User asks to add armor functionality
- Make assumptions about how armor "should" work
- Implement without checking SRD
- Create mechanics that don't match official rules

## Interactive Card Parser - Test-Driven Development

The parsing logic for **ancestry, community, domain card (abilities/spells), class, and subclass** interactive features follows a **Test-Driven Development (TDD)** philosophy using Natural Language Understanding (NLU).

### NLU-Based Test Development
1. **Natural Language Understanding (NLU)** is used to analyze the `type` and `text` fields of game content (from SRD JSON files)
2. **Human interpretation** of the text determines the expected parser output (costs, timing, action_type, modifiers, etc.)
3. **Tests are written first** based on NLU expectations, NOT on current parser output
4. This prevents the propagation of parser errors - tests validate *intended* behavior, not *current* behavior

### Test File Locations
- `__tests__/content/abilities-nlu-*.test.ts` - Domain ability/spell tests organized by domain (Arcana, Blade, Bone, Codex, Grace, Midnight, Sage, Splendor, Valor)
- Each test file contains expectations derived from reading the ability text

### Development Workflow
1. **Read the SRD content** (e.g., `content/srd/json/abilities.json`)
2. **Derive expected output** from the text using NLU (human interpretation)
3. **Write failing tests** that encode these expectations
4. **Improve the parser** (`lib/card-parser.ts`) to pass the tests
5. **Never** use current parser output to generate test expectations

### Key Parser Functions (`lib/card-parser.ts`)
- `enhanceAbilityCard()` - Main entry point for ability/spell parsing
- `parseActionType()` - Determines attack/buff/passive/utility/reaction/downtime
- `parseTiming()` - Determines action/reaction/free timing
- `parseCosts()` - Extracts Hope/Stress/HP costs
- `parseRoll()` - Extracts roll requirements and difficulty
- `parseAttack()` - Extracts attack mechanics (trait, range, damage, targets)
- `parseStaticModifiers()` - Extracts stat bonuses and conditions

## Project-Specific Rules

- **MUST build successfully before Git commit** - Run `npm run build` and verify it completes with no errors
- Lint and resolve all warnings and errors before Git commit
- Always fix lint warnings as well as errors
- Use Alex <galactic.eye.codex@gmail.com> for Git commits
- When referencing an issue in a commit message, include the issue number in the commit message body (e.g., `Ref #123` or `Fixes #123`).
- Do not use 🤖 Generated with [Claude Code] in commit messages
- **Ignored Files**: Files listed in `.gitignore` (e.g., `docs/`, `GEMINI.md`, `CLAUDE.md`) may be modified locally for reference or to follow instructions, but MUST NOT be staged or committed to the repository. This prevents unintended tracking of ignored files or conflicts with repository policies.

## Code Documentation Standards

**MANDATORY**: Every new or significantly refactored file MUST include a standardized documentation comment block at the very top.

### Format
```typescript
/**
 * [COMPONENT/FILE NAME IN ALL CAPS]
 * ----------------------------------------------------------------------------
 * [Brief 1-2 sentence description of the file's primary purpose]
 *
 * [Key Responsibilities/Features/Functionality]:
 * - Feature 1: Description
 * - Feature 2: Description
 *
 * [Additional Notes, such as Sync status or platform-specific info]
 */
```

### Purpose
This ensures that the project's architecture remains discoverable and that the intent of each file is clear to both human developers and AI assistants.

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Key Directories

- `/app` - Next.js app router pages
- `/components` - React components
- `/store` - Zustand state stores
- `/lib` - Utility functions and helpers
- `/srd` - System Reference Document (game rules)
- `/supabase` - Database schema and migrations
- `/__tests__` - Test files (organized by lib/store/content)
- `/.claude/rules/` - Design and UI reference documentation

---

## Summary Checklist for AI Assistants

Before beginning work, ensure you have:
- ✅ Read `.claude/rules/STYLE_GUIDE.md` for UI/UX standards
- ✅ Read `.claude/rules/UI_CARD_REFERENCE.md` for component layouts
- ✅ Read relevant `srd/markdown/contents/` files for game mechanics
- ✅ Understood vital track semantics (mark-bad vs fill-up-bad)
- ✅ Reviewed error recovery pattern for Zustand stores
- ✅ Understood dual-codebase architecture and sync requirements
- ✅ Reviewed testing requirements and TDD workflow
- ✅ Know how to use Playwright for visual verification (`npm run e2e:screenshot`)

## Security Configuration Tests

**CRITICAL**: The 3D dice roller (`@3d-dice/dice-box`) requires specific CSP headers to function. If you modify security headers in `next.config.ts`, you MUST run the CSP tests.

### Why CSP Tests Exist
This test was added after commit `f97b3f74` broke the dice roller by adding Content-Security-Policy headers without the `worker-src` directive. The dice roller uses Web Workers with OffscreenCanvas, which requires:
- `worker-src 'self' blob:` - Allows Web Worker creation
- `connect-src` must include `blob:` - Allows worker script loading

### Running CSP Tests
```bash
npm run test:run -- __tests__/config/csp-headers.test.ts
```

### What the Tests Verify
| Test | Purpose |
|------|---------|
| `should include worker-src directive for DiceBox Web Workers` | Ensures Web Workers can be created |
| `should include blob: in connect-src for worker scripts` | Ensures worker scripts can load |
| `should have all required CSP directives` | General CSP completeness check |
| `should allow Supabase connections` | Database connectivity |
| `should allow Google Fonts` | Font loading works |

### When to Run CSP Tests
- ✅ **ALWAYS** when modifying `next.config.ts`
- ✅ **ALWAYS** when adding/modifying security headers
- ✅ Before committing any changes to security configuration

