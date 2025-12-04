# Issue #2 - Quick Reference Guide

## TL;DR - What's Missing?

| Phase | Status | Blocker | Hours | Files |
|-------|--------|---------|-------|-------|
| 1: Foundation | ✅ 95% | No | 2 | Needs tests only |
| 2: Seed Script | ❌ 0% | **YES** | 8-12 | `scripts/seed-library.ts` (MISSING) |
| 3: Service Layer | ⚠️ 30% | After #2 | 6-8 | `lib/modifier-service.ts` (MISSING) |
| 4: UI Integration | ⚠️ 70% | After #3 | 4-6 | Components exist, need enhancements |
| 5: Homebrew Items | ❌ 0% | After #3 | 10-12 | `components/create-custom-item-modal.tsx` (MISSING) |
| 6: Polish/Tests | ❌ 0% | After all | 4-6 | Tests, docs, optimization |

**Total Effort:** 34-50 hours

---

## The Core Problem

**Current System (Bad):**
```
Each render → Load equipment → RegEx parse feat_text → Apply mods → Display stats
```

**Intended System (Good):**
```
One-time seeding → Parse SRD → Store modifiers in DB
Load equipment → Use pre-parsed modifiers from DB → Apply mods → Display stats
```

**Why it matters:** Current approach is slow, brittle, and can't handle conditional modifiers.

---

## What Each Missing Phase Needs

### Phase 2: Seed Script (CRITICAL BLOCKER) 🔴

**File:** `scripts/seed-library.ts` (DOES NOT EXIST)

**Job:** Convert SRD feat_text to structured Modifier objects during database seeding

**Input:** SRD JSON files (armor.json, weapons.json, items.json)
```json
{ "name": "Gambeson Armor", "feat_text": "+1 to Evasion" }
```

**Output:** Database library.data with modifiers array
```json
{
  "name": "Gambeson Armor",
  "feat_text": "+1 to Evasion",
  "modifiers": [{
    "id": "uuid",
    "type": "stat",
    "target": "evasion",
    "value": 1,
    "operator": "add"
  }]
}
```

**Parsing Examples:**
- `"+1 to Evasion"` → `{target: 'evasion', value: 1}`
- `"-2 to Evasion; -1 to Agility"` → Two modifiers
- `"Roll additional die, discard lowest"` → `{type: 'special', description: ...}`
- `"While unarmored, +1 Evasion"` → `{condition: 'while unarmored', ...}`

**Why blocking everything:** Without structured modifiers in DB, can't do Phase 3 refactor.

---

### Phase 3: Modifier Service (UNBLOCKS OTHERS) 🟡

**File:** `lib/modifier-service.ts` (DOES NOT EXIST)

**Key Functions:**
```typescript
// Extract modifiers from equipped items
getEquippedItemModifiers(character): Modifier[]

// Check if conditional modifier applies
evaluateConditionalModifier(character, modifier): boolean

// Get all active modifiers for a stat
getActiveModifiers(character, stat): Modifier[]

// Apply modifiers to a stat value
applyModifierToStat(character, stat, modifiers): number

// Calculate all derived stats
calculateDerivedStats(character): DerivedStats
```

**Why needed:** Centralizes modifier logic, eliminates regex parsing at runtime.

**Current state:** Logic scattered across:
- `store/character-store.ts` (lines 290-429)
- `lib/utils.ts` (lines 36-87)
- `lib/modifier-parser.ts`

---

### Phase 4: UI Enhancements (PARTIAL) 🟡

**Existing:** ✅
- `components/modifier-sheet.tsx` - Manual modifier ledger
- Stats display shows modifier totals

**Missing:** ❌
- Active Modifiers panel (show all modifiers grouped by source)
- Equipment preview (show modifier changes before equipping)
- Inline modifier badges on items

---

### Phase 5: Homebrew Items (NOT STARTED) 🔴

**Files:**
- `components/create-custom-item-modal.tsx` (MISSING)
- `components/modifier-builder.tsx` (MISSING)

**Allows users to:**
```
Create custom item with custom modifiers
  ↓
Stored in character_inventory with custom_data JSONB
  ↓
Works exactly like SRD items (equip/unequip/modifiers apply)
```

**Example:**
```
"Ring of Cunning" (+2 Finesse)
  → Stored as custom item
  → When equipped, +2 Finesse applies
  → When unequipped, bonus goes away
```

---

### Phase 6: Polish (NOT STARTED) 🔴

- End-to-end tests
- Performance optimization
- Comprehensive documentation
- Error handling

---

## Architecture After Completion

### Current (Broken)
```
Character → Equipment → RegEx Parse feat_text → Modifiers
                    (Runtime)
```

### Ideal (After completion)
```
SRD JSON → [Seed Script] → Database library.data with modifiers
                                  ↓
                    Character → Equipment → [Modifier Service] → Modifiers
                                                                    ↓
                                                            Character Stats Updated
```

---

## File Map: What Exists vs What's Missing

### ✅ Existing (Phase 1)
- `/types/modifiers.ts` - Type definitions (Modifier, ModifierType, etc.)
- `/lib/modifier-parser.ts` - Basic regex parser (43 lines)
- `/supabase/schema.sql` - Database schema with modifiers field

### ❌ Missing (Phases 2-5)
- `/scripts/seed-library.ts` - **CRITICAL**
- `/lib/modifier-service.ts` - **CRITICAL**
- `/components/create-custom-item-modal.tsx` - Phase 5
- `/components/modifier-builder.tsx` - Phase 5

### ⚠️ Needs Work (Phase 4)
- `/components/modifier-sheet.tsx` - Exists but incomplete
- `/store/character-store.ts` - Has modifier logic but needs refactoring
- `/lib/utils.ts` - Has fallback regex parsing that should be removed

---

## Recommended Start Point

### Do This First (Week 1)
1. Create `/scripts/seed-library.ts`
   - Parse armor.json, weapons.json, items.json
   - Convert feat_text to Modifier objects
   - Test with sample items
   - Seed database

2. Create `/lib/modifier-service.ts`
   - Implement core functions (getEquipped, applyMods, calculateStats)
   - Unit tests
   - Integration tests

### Then (Week 2-3)
3. Refactor store to use modifier-service
4. Add Phase 4 UI enhancements
5. Add unit tests for parser

### Finally (Week 3-4)
6. Implement homebrew items (Phase 5)
7. Polish and full test coverage (Phase 6)

---

## How to Check Progress

### Phase 2 Complete When
```bash
# Check if script exists and runs
ls scripts/seed-library.ts  # Should exist
npm run seed:library        # Should complete without errors

# Check database
SELECT COUNT(*), COUNT(*->'modifiers') FROM library WHERE type='armor';
# Should return: count = 30, count(modifiers) ≈ 28 (complex ones might be empty)
```

### Phase 3 Complete When
```bash
# Check if service exists
ls lib/modifier-service.ts  # Should exist

# Check store refactored
grep -n "getSystemModifiers\|regex\|STAT_MODIFIER" store/character-store.ts
# Should return 0 matches (regex removed)

# Run tests
npm test -- modifier-service  # All tests pass
```

### Phase 5 Complete When
```bash
# Check UI components exist
ls components/create-custom-item-modal.tsx
ls components/modifier-builder.tsx

# Check E2E test passes
npm run test:e2e -- homebrew-items
```

---

## Risk Assessment

**High Risk:**
- Complex feat_text that can't be parsed (e.g., Greatsword's "roll extra die")
  - Mitigation: Flag for manual review instead of trying to parse

**Medium Risk:**
- Conditional modifier evaluation (e.g., "while unarmored")
  - Mitigation: Store condition as string, handle at apply-time

**Low Risk:**
- Database migration
  - Mitigation: Keep fallback regex parsing as backup during transition

---

## Questions Before Starting

1. **Should "Roll additional die and discard lowest" be structured?**
   - Answer: No, flag as `type: 'special'` with original description

2. **Can homebrew items be shared between characters?**
   - Answer: No (not in Phase 5), only per-character

3. **What happens if custom item has invalid modifiers?**
   - Answer: Validation prevents save until fixed

4. **Support for conditional modifiers in Phase 5?**
   - Answer: Yes, modifier-service handles evaluation

---

## Success Metrics

- [ ] Phase 2: Script runs, 95%+ of feat_text successfully parsed
- [ ] Phase 3: No regex parsing in apply-time code, all tests passing
- [ ] Phase 4: UI shows modifier sources and previews changes
- [ ] Phase 5: Custom items work end-to-end with tests
- [ ] Phase 6: 80%+ test coverage, documentation complete

---

## Effort Summary

| Phase | Effort | Person | Timeline |
|-------|--------|--------|----------|
| 2 | 8-12 hrs | Backend dev | Week 1 |
| 3 | 6-8 hrs | Backend dev | Week 1-2 |
| 1 + 4 | 6-12 hrs | QA + Frontend | Week 2 |
| 5 | 10-12 hrs | Full-stack | Week 3 |
| 6 | 4-6 hrs | QA | Week 4 |

**Total: 34-50 hours (4-6 weeks)**

---

## One-Sentence Summary

> Create a database seed script to convert SRD feat_text into structured modifiers (Phase 2 - BLOCKING ALL OTHERS), then refactor the application to use those pre-parsed modifiers instead of runtime regex parsing (Phase 3), and finally add UI for homebrew items (Phase 5).
