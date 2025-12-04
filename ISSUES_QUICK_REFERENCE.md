# Architecture Issues - Quick Reference

## Summary Table

| Issue | Severity | Effort | Priority | Impact |
|-------|----------|--------|----------|--------|
| 1. Monolithic Store (826 lines) | HIGH | 40-60h | 4/5 | Maintainability |
| 2. Zero Test Coverage | CRITICAL | 50-65h | 1/5 | Regression risk |
| 3. Race Condition (line 794) | HIGH | 8-12h | 2/5 | Data corruption |
| 4. Error Recovery Missing | CRITICAL | 30-40h | 3/5 | Silent data loss |

**Total Effort: 128-177 hours (4-6 months)**

---

## Issue 1: Monolithic Character Store

**File**: `/store/character-store.ts` (826 lines)

### Problem
Single store mixing 7 concerns: auth, character data, UI state, vitals, inventory, game logic, DB persistence.

### Example
Armor logic appears in 3 places:
- `recalculateDerivedStats()` line 290-429
- `common-vitals-display.tsx` line 33-48
- `lib/utils.ts` getSystemModifiers()

### Solution
Split into 5 focused stores (authStore, characterStore, gameLogicStore, vitalsStore, uiStateStore, inventoryStore)

### Quick Start
1. Extract `recalculateDerivedStats()` to `/lib/gameLogic.ts`
2. Create `createGameLogicStore()` in new file
3. Update imports in components
4. Repeat for other concerns incrementally

---

## Issue 2: Zero Test Coverage

**Root Cause**: No jest.config, vitest.config, or test files

### Critical Unprotected Functions
1. `recalculateDerivedStats()` - Armor caps, modifier stacking
2. `getSystemModifiers()` - Regex edge cases
3. `updateVitals()` - Vital clamping
4. `equipItem()` - Item swap atomicity
5. `fetchCharacter()` - Data hydration & migration

### Solution (3 Phases)

**Phase 1 (20-25h): Unit Tests for Game Logic**
```bash
npm install -D vitest @vitest/ui happy-dom
# Create __tests__/unit/gameLogic.test.ts
# Add 45-55 tests for armor, thresholds, modifiers
```

**Phase 2 (15-20h): Integration Tests for Store**
- Character loading flow
- Vital updates with validation
- Equipment changes & cascading effects

**Phase 3 (15-20h): Component Tests**
- VitalCard interactions
- Inventory equip/unequip
- Modifier sheet CRUD

### Quick Start
```typescript
// __tests__/unit/armor.test.ts
describe('Armor Calculations', () => {
  it('should cap armor at 12 per SRD', () => {
    const result = calculateArmorScore({
      base_score: 5,
      system_mods: [{ value: 5 }, { value: 5 }], // 5+5+5=15, should cap at 12
      user_mods: []
    })
    expect(result).toBe(12)
  })
})
```

---

## Issue 3: Race Condition in fetchCharacter

**File**: `/store/character-store.ts` line 794

### Problem
```typescript
set({ character: fullCharacter, isLoading: false });
setTimeout(() => get().recalculateDerivedStats(), 0); // RACE CONDITION
```

If user equips item (equipItem) before setTimeout fires, derived stats calculated with stale inventory.

### Race Condition Timeline
```
t=0ms:   fetchCharacter() sets character
t=0ms:   setTimeout schedules recalc
t=2ms:   User clicks equipItem()
t=10ms:  recalc() overwrites armor_score calculated by equipItem
```

### Solution
Replace setTimeout with atomic wrapper:
```typescript
// Remove setTimeout
// Instead:
const calculated = await recalculateDerivedStatsForCharacter(fullCharacter)
set(s => ({
  character: s.character ? { ...s.character, ...calculated } : null
}))
await persistDerivedStats(character.id, calculated)
```

### Quick Start
1. Extract calculation logic to pure function
2. Call it immediately after set()
3. Persist result
4. Add test: rapid equipItem + fetchCharacter sequence

---

## Issue 4: Error Recovery Missing

**Files**: 8 functions with optimistic updates and no rollback

### Affected Functions
```
moveCard() line 205-208        - Card location inconsistency
updateGold() line 457-460      - Gold entry lost
updateHope() line 482-484      - Hope sync issue (HIGH)
updateEvasion() line 507-510   - Evasion sync issue (HIGH)
updateModifiers() line 533-536 - Modifiers disappear
updateExperiences() line 559   - Experience lost
equipItem() line 605-608       - Item in 2 slots (CRITICAL)
updateVitals() line 822-825    - HP/Armor/Stress out of sync (CRITICAL)
```

### Problem Example
User decreases armor (optimistic update shows 3). DB fails. User refreshes. Armor goes back to 5. User's action lost silently.

### Solution: Rollback Pattern

```typescript
// 1. Store previous state
const previousVitals = state.character.vitals

// 2. Optimistically update UI
set(s => ({ character: s.character ? { ...s.character, vitals: newVitals } : null }))

// 3. Persist to DB
try {
  const { error } = await supabase.from('characters').update({ vitals: newVitals }).eq('id', id)
  if (error) throw error
} catch (error) {
  // 4. Rollback on failure
  set(s => ({ character: s.character ? { ...s.character, vitals: previousVitals } : null }))
  showErrorToast('Failed to save. Your change was reverted.')
}
```

### Implementation Priority
1. **updateVitals()** (4-6h) - Most critical, used constantly
2. **equipItem()** (5-7h) - Complex, multiple DB calls
3. Other functions (10-15h) - Lower priority

### Quick Start
1. Install toast library: `npm install sonner`
2. Implement rollback pattern for updateVitals()
3. Add error toast UI
4. Test with network offline
5. Extend pattern to other functions

---

## Recommended Action Plan

### Week 1-2: Add Test Infrastructure
- [x] Install Vitest
- [ ] Create __tests__/unit directory
- [ ] Write game logic unit tests (20-25h)
- [ ] Result: Safety net for refactoring

### Week 3-4: Fix Race Condition
- [ ] Refactor fetchCharacter() (4-6h)
- [ ] Add safeguards (2-3h)
- [ ] Write regression tests (2-3h)
- [ ] Result: Prevents data corruption on load

### Week 5-7: Add Error Recovery
- [ ] Install toast library (1h)
- [ ] updateVitals() rollback pattern (4-6h)
- [ ] equipItem() rollback pattern (5-7h)
- [ ] Other functions (6-8h)
- [ ] Result: Prevents silent data loss

### Week 8-9: Integration Tests
- [ ] Store loading tests (5h)
- [ ] Vital update tests (6h)
- [ ] Equipment cascade tests (5h)
- [ ] Modifier interaction tests (4h)

### Week 10-20: Store Refactoring
- [ ] Extract game logic (8-10h)
- [ ] Create new stores (12-16h)
- [ ] Update components (12-16h)
- [ ] Final testing (6-10h)

---

## Files to Reference

1. **Detailed Analysis**: `ARCHITECTURE_ANALYSIS.md`
2. **JSON Analysis**: `ARCHITECTURE_ANALYSIS_DETAILED.json`
3. **Original Analysis**: `architecture_analysis.json`
4. **Store**: `store/character-store.ts`
5. **Utils**: `lib/utils.ts`
6. **Components**: `components/common-vitals-display.tsx`, `components/views/inventory-view.tsx`

---

## Key Code Locations

### Issue 1 - Store Monolith
- Lines 1-826: Entire store is monolithic
- Lines 290-429: Game logic (recalculateDerivedStats)
- Lines 431-511: Vital updates without error recovery
- Lines 564-613: Equipment management
- Lines 626-795: Character fetching

### Issue 2 - Missing Tests
- No __tests__ directories
- No jest.config or vitest.config
- No test scripts in package.json

### Issue 3 - Race Condition
- Line 791: `set({ character: fullCharacter, isLoading: false })`
- Line 794: `setTimeout(() => get().recalculateDerivedStats(), 0)` ← PROBLEM

### Issue 4 - Error Recovery
- Line 205: moveCard - no error handling
- Line 457: updateGold - no error handling
- Line 482: updateHope - no error handling
- Line 507: updateEvasion - no error handling
- Line 533: updateModifiers - no error handling
- Line 559: updateExperiences - no error handling
- Line 605: equipItem - multiple DB calls, no atomicity
- Line 822: updateVitals - no rollback on DB failure

---

## Testing Checklist

### Must Test (Phase 1)
- [ ] Armor calculation with base_score + system mods + user mods
- [ ] Armor caps at 12
- [ ] Unarmored (armor_score = 0)
- [ ] Damage thresholds include armor bonuses
- [ ] HP max = class_base + mods
- [ ] Stress max = 6 + mods
- [ ] getSystemModifiers handles structured modifiers
- [ ] getSystemModifiers fallback to regex
- [ ] Vitals clamped to [0, max]
- [ ] equipItem swaps items correctly
- [ ] fetchCharacter loads all relations
- [ ] fetchCharacter migrates legacy vitals

### Must Test (Phase 2)
- [ ] Character loading triggers recalc
- [ ] Vital update triggers recalc if needed
- [ ] Equipment change triggers recalc
- [ ] Modifier update triggers recalc
- [ ] DB error rollbacks optimistic update
- [ ] Concurrent updates handled safely

### Must Test (Phase 3)
- [ ] VitalCard increment/decrement
- [ ] Armor full/empty states
- [ ] Equipment equip/unequip
- [ ] Modifier sheet add/remove
- [ ] Error toast displays on failure
- [ ] Retry button works

---

## Team Guidance

### For Quick Wins (1-2 weeks)
- Add unit tests for game logic
- Fix race condition in fetchCharacter

### For Stability Improvements (3-4 weeks)
- Add error recovery to updateVitals()
- Add error recovery to equipItem()

### For Long-term (8-12 weeks)
- Split monolithic store
- Full test coverage
- Refactor for reusability

---

## Questions to Answer Before Starting

1. How many users are affected by current bugs?
2. Is data consistency critical (rollback needed) or can users retry?
3. Should error recovery be pessimistic (wait) or optimistic (rollback)?
4. Can we afford 2-3 days downtime for store refactoring?
5. What's the release timeline?

---

**Last Updated**: December 3, 2025
**Codebase**: Daggerheart Character Sheet (Next.js 15, Zustand, Supabase)
