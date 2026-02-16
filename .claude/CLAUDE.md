# CLAUDE.md - Daggerheart Character Sheet Assistant Instructions

## Quick Start with Conductor

The project uses the **Conductor** methodology for project management.
- **Source of Truth:** All active work, specifications, and implementation plans are stored in the `.conductor/` directory.
- **Project Context:** Read `.conductor/index.md` for a high-level overview.
- **Tracks Registry:** View `.conductor/tracks.md` for a list of all major work tracks.
- **Active Plan:** Each track has a `plan.md` in its respective `.conductor/tracks/<track_id>/` folder.

Use `/conductor:implement` to begin working on the next task in the active plan.

## Quick Start with GitHub Issues

Use `/issue {ISSUE_NUMBER}` to start, update, or continue work on any GitHub issue. See `.agent/workflows/issue.md` for full documentation. All complex tasks should be tracked in GitHub Issues via the GitHub CLI (`gh`).

## Code Style & Conventions

**Naming:**
- TypeScript: **camelCase** (`isLoading`, `setActiveTab`)
- Database: **snake_case** (`user_id`, `hp_current`) - aligns with Supabase/PostgreSQL

**Daggerheart Terms (snake_case):**
- Armor: `armor_score` (max), `armor_slots` (current)
- Health: `hit_points`, `damage_thresholds: { minor, major, severe }`
- Classes: `class_name`, `foundation_feature`, `specialization_feature`
- Equipment: `primary_weapon`, `secondary_weapon`, `burden`

**UI/UX:** See `.agent/rules/style-guide.md` for component standards.

## Vital Track Semantics

**trackType="mark-bad"** (HP, Armor): `current` = capacity remaining
- Marking **reduces** current (lose resource)
- Start: `current = max`

**trackType="fill-up-bad"** (Stress): `current` = amount accumulated
- Marking **increases** current (accumulate bad)
- Start: `current = 0`

## Testing Requirements

**Tests mandatory for:** Pure functions (calculations, modifiers), state management, game rules.

**Before committing:**
```bash
npm run build > build.log 2>&1 && npm run test:run
```

**If tests fail:** Present details to user; ask whether to fix code or test.

**Test locations:**
- Game logic: `__tests__/lib/[function-name].test.ts`
- Store: `__tests__/store/character-store.test.ts`
- Modifiers: `__tests__/lib/modifiers.test.ts`

**Run tests:**
```bash
npm run test:run    # Full suite once
npm run test:ui     # Interactive dashboard
npm run test:coverage # Coverage report
```

## Visual Verification with Playwright

For UI changes: `npm run e2e:screenshot` to capture screenshots for verification.

**Key commands:**
```bash
npm run e2e            # Run all tests
npm run e2e:headed     # Run with visible browser window
```

**Config:** Mobile-first (390x844 iPhone 14), auto-starts dev server.

## Modifier System Architecture

**Single Source of Truth:** Use `getStatModifiers()` from `lib/modifier-aggregator.ts`.

**Sources:** equipment, domain_card, user, ancestry, community, class, subclass (auto-initialized in `app/layout-client.tsx`).

**When adding new sources:**
1. Add to `MODIFIER_SOURCES` const
2. Add type to `ModifierSourceType`
3. Implement `get{Source}Modifiers()` handler
4. Add case to exhaustive switch in `getStatModifiers()`
5. Add tests and verify no regressions

**Deprecated:** Don't use `getSystemModifiers()` - use `getStatModifiers()` instead.

## Error Recovery Pattern

**All Zustand store functions must use `withOptimisticUpdate`** from `lib/state-helpers.ts` to prevent silent data corruption.

**Pattern:** Capture state → Update optimistically → DB call → Rollback on error with toast notification.

**Key rules:**
- Capture state in closure (don't reference current state in rollback)
- Stop on first error in loops
- Only recalculate on success
- Test both success and error paths

See `docs/STATE_MANAGEMENT.md` for examples.

## SRD Reference

Before implementing mechanics, read `content/public/srd/markdown/contents/` for official rules. Follow terminology exactly and check edge cases.

**Comment block SRD references:** When a file or function implements game mechanics, its doc block MUST include an `SRD Reference:` line citing the relevant SRD markdown file path and quoting the rule that governs the behavior. This provides traceability from code to game rules.

Example:
```typescript
/**
 * Calculate attack roll bonus.
 *
 * SRD Reference: content/public/srd/markdown/contents/Attacking.md
 * "An attack roll is an action roll intended to inflict harm."
 */
```

## Dual-Codebase Architecture

This directory (`dh-cs`) is the web version. Native app is in `/dh-cs-native` with auto-sync via `sync-native.js`.

**Shared code:** components, hooks, lib (except supabase), store (except auth), app routes.

**Platform-specific:** lib/data-service.ts, lib/supabase/, auth routes (not synced).

**Key rule:** Shared code must work for BOTH online (Supabase) and offline (SQLite).

## Interactive Card Parser (Test-Driven)

Parse cards from SRD JSON using Natural Language Understanding (NLU):
1. Read SRD content
2. Interpret expected output from text
3. Write failing tests based on intent (not current output)
4. Improve parser (`lib/card-parser.ts`) to pass tests

**Key functions:** `enhanceAbilityCard()`, `parseActionType()`, `parseTiming()`, `parseCosts()`, `parseAttack()`, `parseStaticModifiers()`


## Project-Specific Rules

- Build & test: `npm run build && npm run test:run` before any commit
- Lint clean: `npm run lint` shows no warnings
- Git account: Use configured account, reference issue in commit body (`Ref #123`)
- File documentation: Every new/refactored file needs standardized doc block at top, including SRD references for game mechanics (see SRD Reference section)
- Gitignored files: Don't commit `docs/`, `GEMINI.md`, `CLAUDE.md`
- CSP tests: Run `npm run test:run -- __tests__/config/csp-headers.test.ts` when modifying `next.config.ts`

## Directory Structure

- `/app` - Pages
- `/components` - React components
- `/store` - Zustand state
- `/lib` - Utilities
- `/srd` - Game rules
- `/docs` - Documentation (gitignored)
- `/.conductor` - Conductor methodology files (Source of Truth)

## Code Quality Standards

**DRY:** Extract patterns appearing 3+ times into reusable components/hooks. Use barrel exports.

**TDD:** Write tests BEFORE implementing. Include UI component tests, not just game logic.

**Component size:** Target <400 LOC. Break down if using 5+ useState hooks or 3+ levels of nesting.

**Memoization:** Use React.memo for components with expensive props, heavy re-renders, or deep nesting.

**Type safety:** No `any` types (except JSONB). Use generics, discriminated unions, const assertions.

**Service layer:** Share UI never imports from `@/lib/supabase/*`. Use abstraction interfaces.

**Error recovery:** All async store operations use `withOptimisticUpdate` from `lib/state-helpers.ts`.

**Performance:** No console.log in production, use `lib/error-logging.ts`. Lazy load routes. Use Next.js `<Image>`. Batch queries.

**Accessibility:** Test at 390px viewport. Keyboard navigable. WCAG AA contrast. Semantic HTML.

**Pre-commit:** Tests pass, build succeeds, lint clean, <400 LOC per file, no `any` types, error handling on all async ops.

**Git:** Use configured account. Reference issues in commit body. Format: `<type>(<scope>): <subject>`

