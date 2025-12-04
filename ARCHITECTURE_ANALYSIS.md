# Daggerheart Character Sheet - Architectural Issues Analysis

## Executive Summary

This document presents a detailed analysis of four critical architectural issues discovered in the codebase. Total effort to resolve all issues: **128-177 hours** across approximately 4-6 months with dedicated team.

---

## Issue 1: Monolithic Character Store (826 lines)

**Severity: HIGH** | **Effort: 40-60 hours**

### Root Cause
The `useCharacterStore` (store/character-store.ts) violates Single Responsibility Principle by mixing:
1. User authentication & profile management
2. Character data fetching & hydration
3. UI state management (tabs, dice overlay)
4. Vital/stat modifications with optimistic updates
5. Inventory/equipment management
6. Game mechanics calculations (armor scoring, thresholds, derived stats)
7. Database persistence & error handling

### Impact
- **Maintainability**: CRITICAL - Hard to locate functionality, risky to modify
- **Testability**: CRITICAL - Cannot unit test concerns in isolation
- **Reusability**: HIGH - Game logic trapped in store, unusable for NPCs/builders
- **Performance**: MEDIUM - Entire store re-renders on any state change
- **Team Velocity**: HIGH - Complex reviews, frequent merge conflicts

### Recommended Solution: Domain-Driven Store Splitting

Split into 5 focused stores:

| Store | Domain | Key Functions |
|-------|--------|----------------|
| **authStore** | Authentication | `fetchUser()`, `setUser()` |
| **characterStore** | Character Data | `fetchCharacter()`, `switchCharacter()`, `setCharacter()` |
| **gameLogicStore** | Game Mechanics | `calculateArmorScore()`, `calculateThresholds()`, `recalculateDerivedStats()` |
| **vitalsStore** | Vital Updates | `updateVitals()`, `updateGold()`, `updateHope()`, error recovery |
| **uiStateStore** | UI Orchestration | `setActiveTab()`, dice overlay, roll management |
| **inventoryStore** | Equipment Management | `equipItem()`, `addItemToInventory()`, `moveCard()` |

### Migration Path
1. Extract pure functions to `/lib/gameLogic.ts` (8-10 hours)
2. Create new stores incrementally (12-16 hours)
3. Create backward-compatible wrapper hooks (4-6 hours)
4. Update components to use specific stores (12-16 hours)
5. Remove monolithic store (2-4 hours)
6. Add comprehensive testing (6-10 hours)

---

## Issue 2: Zero Test Coverage

**Severity: CRITICAL** | **Effort: 50-65 hours**

### Root Cause
- No test infrastructure (no jest.config, vitest.config, or __tests__ directories)
- Monolithic store prevents isolated unit testing
- Pure functions mixed with side effects (DB calls)
- Cannot validate changes without manual QA

### Impact
- **Regression Risk**: CRITICAL - No protection for game logic
- **Deployment Confidence**: CRITICAL - Cannot deploy safely
- **Critical Functions Unprotected**:
  - `recalculateDerivedStats()` - Armor caps, modifier stacking, thresholds
  - `getSystemModifiers()` - Regex parsing edge cases
  - `updateVitals()` - Vital clamping logic
  - `equipItem()` - Item swap atomicity
  - `fetchCharacter()` - Data hydration & migration

### Recommended Testing Strategy

**Recommended Framework**: Vitest (better ESM support, faster, native TypeScript)

**Three-Phase Approach**:

**Phase 1: Unit Tests for Pure Game Logic (20-25 hours)**
- Armor calculation (10-15 tests)
- Damage thresholds (6-8 tests)
- Modifier aggregation (8-12 tests)
- Data transformation (8-10 tests)

**Phase 2: Integration Tests for Store (15-20 hours)**
- Character loading flow (5 tests)
- Vital updates with validation (6 tests)
- Equipment changes & cascading effects (5 tests)
- Modifier triggers recalculation (4 tests)

**Phase 3: Component Integration Tests (15-20 hours)**
- VitalCard interactions (6 tests)
- Inventory equip/unequip flows (4 tests)
- Modifier sheet CRUD (4 tests)

**Critical Test Cases**:

```typescript
// Armor calculation
✓ Armor score with equipped armor vs unarmored
✓ Armor caps at 12 per SRD
✓ Armor slots capped at armor_score during recalc
✓ Damage thresholds include armor bonuses

// System modifiers
✓ Structured modifiers parsed correctly
✓ Regex fallback for legacy text-based modifiers
✓ Multiple modifiers from same item stack correctly
✓ Unequipped items ignored

// Vitals
✓ HP/Armor/Stress clamped to [0, max]
✓ DB error triggers rollback
✓ Concurrent updates handled correctly

// Equipment
✓ Item swap completes atomically
✓ DB error reverts both changes
✓ Armor change triggers recalc

// Data hydration
✓ Backward compatibility migration (hp_current -> hit_points_current)
✓ Experiences string[] -> Experience[] conversion
✓ Library items joined correctly
✓ Race conditions on concurrent loads prevented
```

### Setup Steps
1. Install: `npm install -D vitest @vitest/ui happy-dom`
2. Create `vitest.config.ts` with Next.js support
3. Add test scripts to package.json
4. Create `__tests__/unit` and `__tests__/integration` directories

---

## Issue 3: Race Condition in fetchCharacter (Line 794)

**Severity: HIGH** | **Effort: 8-12 hours**

### Root Cause
```typescript
// Line 791: Character state is set
set({ character: fullCharacter as Character, isLoading: false });

// Line 794: Recalculation deferred to next microtask
setTimeout(() => get().recalculateDerivedStats(), 0);
```

The `setTimeout(0)` creates a race condition. If user action (e.g., equipItem) occurs before recalc completes, derived stats may be calculated against stale inventory state.

### Impact
- **Data Corruption**: MEDIUM - Derived stats calculated with stale inventory
- **User Experience**: MEDIUM - Armor/HP/Stress maxes show incorrectly briefly
- **Likelihood**: MEDIUM - Requires <16ms timing window, but moderately likely in fast interactions

### Specific Race Condition Scenario
```
t=0ms:   fetchCharacter() sets character with equipped armor
t=0ms:   setTimeout schedules recalculateDerivedStats()
t=2ms:   User clicks equipItem() to swap armor
t=2ms:   equipItem() updates character_inventory and DB
t=10ms:  recalculateDerivedStats() executes with new armor from equipItem
         → Could overwrite armor_score if equipItem's recalc already completed
Result:  Inconsistent armor thresholds
```

### Recommended Fix: Atomic Wrapper Action

```typescript
// Replace fetchCharacter with:
fetchCharacterAndInitialize: async (userId, characterId?) => {
  set({ isLoading: true })

  // 1. Fetch character data
  const data = await fetchCharacterData(userId, characterId)
  const character = buildCharacter(data)

  // 2. Set state
  set({ character, isLoading: false })

  // 3. Calculate derived stats synchronously
  const calculated = calculateDerivedStats(character)

  // 4. Apply calculated values without setTimeout
  set(s => ({
    character: s.character ? { ...s.character, ...calculated } : null
  }))

  // 5. Persist to DB
  await persistDerivedStats(character.id, calculated)
}
```

### Additional Safeguards
- Add version/timestamp to derived stats to detect stale calculations
- Verify inventory hasn't changed between calculation and persistence
- Add assertion: `armor_score <= 12` in updateVitals
- Add regression test for rapid equipItem + fetchCharacter sequence

---

## Issue 4: Error Recovery Missing (8 functions)

**Severity: CRITICAL** | **Effort: 30-40 hours**

### Root Cause
The store uses **optimistic updates** (update UI → persist DB) with **zero error handling**. When DB fails, optimistic state persists, creating client-server inconsistency.

**Affected Functions** (lines 205-208, 457-460, 482-484, 507-510, 559-561, 605-608, 822-825):
- `moveCard()` - Card location out of sync
- `updateGold()` - User loses gold entry
- `updateHope()` - Hope value out of sync (affects rolls)
- `updateEvasion()` - Evasion out of sync (affects all rolls)
- `updateModifiers()` - Modifiers disappear
- `updateExperiences()` - Experience tracking lost
- `equipItem()` - TWO sequential DB calls without atomicity
- `updateVitals()` - HP/Armor/Stress out of sync (CRITICAL gameplay impact)

### Impact Examples

**Example 1: Silent Data Loss**
1. User marks armor down (visual feedback: shows as reduced)
2. DB update fails (network offline)
3. User refreshes page
4. Armor reverts to full value (optimistic update lost)
5. User confused: "Where did my click go?"

**Example 2: Equipment Swap Fails Partially**
1. User has Sword A equipped, Sword B in backpack
2. User clicks to swap
3. Sword A → backpack: DB succeeds
4. Sword B → equipped: DB fails
5. Client state: Sword B equipped, Sword A in backpack
6. Server state: Sword A in backpack, Sword B unequipped
7. On refresh: Inventory is inconsistent

**Example 3: Cascading Equipment Changes**
1. User reduces armor to 2 (optimistic), DB fails
2. User reduces armor to 1 (optimistic), DB fails
3. User increases armor to 3 (optimistic), DB succeeds
4. Client shows 3, server shows original value
5. Next recalc uses wrong armor_score

### Recommended Solution: Rollback Pattern with Error Handling

**Approach A: Optimistic with Rollback (Recommended - Better UX)**

```typescript
updateVitals: async (type, value) => {
  const state = get()
  if (!state.character) return

  // Store previous state for rollback
  const previousVitals = state.character.vitals

  // Calculate new value
  const newVitals = { ...previousVitals }
  const actualValue = clampVital(type, value, newVitals)
  const updatedVitals = { ...newVitals, [type]: actualValue }

  // 1. Optimistically update UI
  set(s => ({
    character: s.character ? { ...s.character, vitals: updatedVitals } : null
  }))

  // 2. Persist to DB
  const supabase = createClient()
  try {
    const { error } = await supabase
      .from('characters')
      .update({ vitals: updatedVitals })
      .eq('id', state.character.id)

    if (error) throw error
    // Success - UI already updated, nothing else needed
  } catch (error) {
    console.error('Failed to update vitals:', error)

    // 3. Rollback UI on failure
    set(s => ({
      character: s.character ? { ...s.character, vitals: previousVitals } : null
    }))

    // 4. Notify user
    showErrorToast(`Failed to save ${type}. Your change was reverted.`)
  }
}
```

**Approach B: Pessimistic Updates (Alternative - Safer)**
- Wait for DB to succeed before updating UI
- No rollback needed
- Trade-off: UI lag, less modern UX

### Implementation Priority

1. **ASAP**: `updateVitals()` (high usage, critical gameplay impact) - 4-6 hours
2. **Next**: `equipItem()` (complex, multiple DB calls) - 5-7 hours
3. **Then**: Other vital updates (gold, hope, evasion, modifiers) - 10-12 hours
4. **Finally**: Card operations - 3-5 hours

### Error Notification Strategy
- Install toast library (react-hot-toast or sonner)
- Show clear messages: "Failed to save armor. Please try again."
- Provide retry button for failed operations
- Track error count - suggest refresh if same operation fails 3x

---

## Combined Implementation Roadmap

### Quarter 1 (16-20 weeks)
- **Weeks 1-2**: Add Vitest + Phase 1 unit tests (20-25 hours)
- **Weeks 3-4**: Fix Issue #3 (race condition) (8-12 hours)
- **Weeks 5-7**: Implement error recovery for critical operations (Issue #4) (15-20 hours)
- **Weeks 8-9**: Add integration tests (Issue #2 Phase 2) (15-20 hours)
- **Weeks 10-13**: Refactor to split stores (Issue #1) (40-60 hours) - MAJOR EFFORT

### Testing Timeline
- **Phase 1** (Unit tests): Weeks 1-2 (20-25 hours)
- **Phase 2** (Integration tests): Weeks 8-9 (15-20 hours)
- **Phase 3** (Component tests): Weeks 14-16 (15-20 hours)

---

## Risk Assessment

| Issue | Impact | Likelihood | Effort | Risk Score |
|-------|--------|-----------|--------|-----------|
| Monolithic Store | CRITICAL | Always present | 40-60h | HIGH |
| Zero Tests | CRITICAL | Every refactor | 50-65h | CRITICAL |
| Race Condition | MEDIUM | Moderate | 8-12h | MEDIUM |
| Error Recovery | CRITICAL | Common (network) | 30-40h | CRITICAL |

---

## Recommendations for Immediate Action

### Priority 1: Add Testing Infrastructure (1-2 weeks)
- Install Vitest
- Extract `recalculateDerivedStats()` logic to pure function
- Write 20-30 unit tests for game mechanics
- **Benefit**: Ability to refactor safely going forward

### Priority 2: Fix Issue #3 Race Condition (1-2 weeks)
- Refactor `fetchCharacter()` to eliminate setTimeout
- Add version tracking to derived stats
- **Benefit**: Prevents data corruption on character load

### Priority 3: Add Error Recovery (2-3 weeks)
- Implement rollback pattern for `updateVitals()` first (highest impact)
- Add error notification UI
- **Benefit**: Prevents silent data loss, improves user trust

### Priority 4: Begin Store Refactoring (4-6 weeks)
- Extract game logic to `/lib/gameLogic.ts`
- Create `authStore` and `characterStore`
- Create wrapper hooks for backward compatibility
- **Benefit**: Smaller, testable, reusable components

---

## Effort Breakdown Summary

```
Issue #1 (Monolithic Store):     40-60 hours
Issue #2 (Zero Tests):           50-65 hours
Issue #3 (Race Condition):        8-12 hours
Issue #4 (Error Recovery):       30-40 hours
───────────────────────────────
TOTAL:                          128-177 hours
```

**Timeline**: 4-6 months with 1 dedicated developer, or 2-3 months with 2 developers

---

## Next Steps

1. **Review this analysis** with the team
2. **Prioritize** which issues to tackle first based on business impact
3. **Create Vitest setup** as prerequisite for safe refactoring
4. **Begin unit tests** for critical game logic functions
5. **Assign owners** to each store refactoring (if doing Issue #1)

---

## Appendix: JSON Analysis File

A detailed JSON file with pseudocode examples is available at: `/architecture_analysis.json`

This file contains:
- Root cause analysis for each issue
- Detailed impact assessment
- Step-by-step reproduction steps
- Complete pseudocode examples
- Test case specifications
- Effort breakdowns

---

**Analysis Date**: December 3, 2025
**Codebase**: Daggerheart Character Sheet (Next.js 15, Zustand, Supabase)
**Files Analyzed**: store/character-store.ts (826 lines), lib/utils.ts, components, package.json
