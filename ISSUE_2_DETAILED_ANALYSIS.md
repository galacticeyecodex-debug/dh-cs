# Issue #2 (Modifier System) - Detailed Analysis & Implementation Guide

**Date:** December 3, 2025
**Status:** Incomplete ❌
**Priority:** HIGH
**Total Effort:** 34-50 hours

---

## Executive Summary

Issue #2 aimed to implement a complete **Item Modifier System** that would:
1. Convert SRD `feat_text` strings into structured modifier data **during database seeding** (not at runtime)
2. Apply modifiers from equipped items automatically to character stats
3. Support homebrew items with custom modifiers
4. Handle conditional modifiers (e.g., "while unarmored")

**Current Reality:** Only Phases 1-4 are partially implemented. The **core goal was never achieved** — the system still relies on **fallback regex parsing at runtime**, which was explicitly what Issue #2 wanted to avoid.

### Quick Status
- ✅ **Phase 1:** Modifier types defined (95% complete - just need unit tests)
- ❌ **Phase 2:** Seed script missing - **CRITICAL BLOCKER** (0% done)
- ⚠️ **Phase 3:** Application logic scattered (30% complete - needs refactoring)
- ⚠️ **Phase 4:** UI exists but incomplete (70% complete - missing panels and previews)
- ❌ **Phase 5:** Homebrew items not implemented (0% done)
- ❌ **Phase 6:** Polish/testing not started (0% done)

---

## Why Is Phase 2 (Seed Script) Critical?

The entire issue hinges on **when** modifier parsing happens:

### Current Approach (Runtime Regex) ❌
```
User loads character → Store loads inventory → getSystemModifiers()
→ Extract feat_text from each item → RegEx parse → Apply mods → Update stats
```

**Problems:**
- Regex runs **every time** inventory changes (slow)
- Brittle: Any change to feat_text format breaks it
- Complex descriptions can't be parsed: "roll an additional damage die and discard lowest"
- No structured data to build conditional logic on

### Correct Approach (Database Seeding) ✅
```
Seeding (one-time): Parse SRD JSON → Convert feat_text to Modifier[] → Store in library.data
User loads character → Store loads inventory → Extract pre-parsed modifiers from library.data
→ Apply mods → Update stats
```

**Benefits:**
- Parsing happens **once during setup**, not every render
- Structured `Modifier[]` objects available for complex logic
- Can support conditional modifiers
- Fast lookups: modifiers already in database

---

## Phase 2: Understanding the Seed Script

### What Data Exists Now
```json
// srd/json/armor.json - Current format
{
  "name": "Gambeson Armor",
  "tier": "1",
  "base_thresholds": "5 / 11",
  "base_score": "3",
  "feat_name": "Flexible",
  "feat_text": "+1 to Evasion"
}
```

### What It Should Become
After seeding, the database `library.data` should be:
```json
{
  "name": "Gambeson Armor",
  "tier": "1",
  "base_thresholds": "5 / 11",
  "base_score": "3",
  "feat_name": "Flexible",
  "feat_text": "+1 to Evasion",
  "modifiers": [
    {
      "id": "mod-uuid-1",
      "type": "stat",
      "target": "evasion",
      "value": 1,
      "operator": "add",
      "description": "+1 to Evasion"
    }
  ]
}
```

### Examples of Parsing Logic Needed

| Original feat_text | Parsed Modifier | Complexity |
|---|---|---|
| `"+1 to Evasion"` | `{type: 'stat', target: 'evasion', value: 1, operator: 'add'}` | ✅ Easy - Simple regex |
| `"-2 to Evasion; -1 to Agility"` | Two modifiers (split on `;`) | ✅ Easy - Split + regex |
| `"+1 to attack rolls"` | `{type: 'roll', target: 'attack', value: 1}` | ⚠️ Medium - New target type |
| `"Roll additional damage die, discard lowest"` | `{type: 'special', description: ...}` | ❌ Hard - Can't structure |
| `"While unarmored, +1 Evasion"` | `{type: 'stat', target: 'evasion', value: 1, condition: 'while unarmored'}` | ⚠️ Medium - Conditional |

### Script Output Example

**Input:** 30 armor items from armor.json
**Output:**
```
✅ 24 items parsed successfully, 24 modifiers created
⚠️ 4 items have complex effects (flagged for manual review)
⚠️ 2 items have conditional modifiers (needs runtime handling)
```

### Files to Process

1. **armor.json** (30 items)
   - Most have simple feat_text like "+1 to Evasion"
   - Some have complex effects (Harrowbone: complex condition)

2. **weapons.json** (80+ items)
   - Many have "+1 to attack rolls" patterns
   - Some have complex effects ("roll additional die")

3. **items.json** (40+ items)
   - Consumables, miscellaneous items
   - May have various feat_text patterns

4. **domains.json** (optional)
   - Domain cards with abilities
   - Likely have complex feature text that can't be structured

---

## Phase 3: Understanding Modifier Service Requirements

Once Phase 2 creates structured modifiers in the database, Phase 3 needs a service to **use** them intelligently.

### Current Problem: Scattered Logic

```typescript
// store/character-store.ts - Lines 290-429
recalculateDerivedStats: async () => {
  // Inline calculation logic mixed with state management
  let newArmorScore = 0;
  const armorMods = getSystemModifiers(tempChar, 'armor');
  newArmorScore += armorMods.reduce((acc, mod) => acc + mod.value, 0);
  // ... more inline logic
}

// lib/utils.ts - Lines 36-87
getSystemModifiers(character, stat) {
  // Fallback regex parsing if structured modifiers missing
  if (Array.isArray(item.library_item.data.modifiers)) {
    // Use structured
  } else {
    // Fallback regex
  }
}
```

### What modifier-service.ts Should Do

**Core responsibility:** "Apply modifiers to character state correctly"

```typescript
// lib/modifier-service.ts - Pseudocode
export class ModifierService {
  // 1. Extract modifiers from equipped items
  getEquippedItemModifiers(character: Character): Modifier[] {
    const equipped = character.inventory
      .filter(item => ['equipped_primary', 'equipped_armor', ...].includes(item.location))
      .flatMap(item => item.library_item?.data?.modifiers || []);
    return equipped;
  }

  // 2. Evaluate if a conditional modifier should apply
  evaluateConditionalModifier(character: Character, mod: Modifier): boolean {
    if (!mod.condition) return true; // No condition = always applies

    if (mod.condition.includes('while unarmored')) {
      return character.armor_score === 0;
    }
    if (mod.condition.includes('on successful attack')) {
      return lastRollWasSuccess(); // Context-dependent
    }
    // ... more conditions
    return true; // Default: apply if we don't understand condition
  }

  // 3. Get all active modifiers for a stat
  getActiveModifiers(character: Character, stat: CharacterStat): Modifier[] {
    const system = this.getEquippedItemModifiers(character)
      .filter(mod => mod.target === stat)
      .filter(mod => this.evaluateConditionalModifier(character, mod));

    const user = character.modifiers[stat] || [];
    return [...system, ...user];
  }

  // 4. Apply modifiers to get final stat value
  applyModifierToStat(character: Character, stat: CharacterStat, mods: Modifier[]): number {
    const base = getBaseStat(character, stat);
    const bonus = mods.reduce((sum, mod) => {
      if (mod.operator === 'add') return sum + mod.value;
      if (mod.operator === 'subtract') return sum - mod.value;
      if (mod.operator === 'multiply') return sum * mod.value;
      // ... etc
    }, 0);
    return base + bonus;
  }

  // 5. Calculate all derived stats at once
  calculateDerivedStats(character: Character): DerivedStats {
    return {
      evasion: this.applyModifierToStat(character, 'evasion',
        this.getActiveModifiers(character, 'evasion')),
      armor_score: this.applyModifierToStat(character, 'armor',
        this.getActiveModifiers(character, 'armor')),
      // ... all other derived stats
      damage_thresholds: calculateThresholds(character)
    };
  }
}
```

### Integration Points After Service Created

```typescript
// OLD: store/character-store.ts line 290
recalculateDerivedStats: async () => {
  let newArmorScore = 0;
  const armorMods = getSystemModifiers(tempChar, 'armor');
  newArmorScore += armorMods.reduce((acc, mod) => acc + mod.value, 0);
  // ... etc inline
}

// NEW: store/character-store.ts line 290
recalculateDerivedStats: async () => {
  const derivedStats = modifierService.calculateDerivedStats(character);
  // Store it and done!
}
```

---

## Phase 4: What UI Gaps Remain

The modifier system is "visible" but incomplete:

### What Exists ✅
- `modifier-sheet.tsx` - Manual modifier ledger (add/remove user mods)
- Stats display shows modifier totals
- Equipment properly triggers recalculation

### What's Missing ❌

#### 1. **Active Modifiers Panel**
Should show: "All modifiers affecting this character, grouped by source"

```
ACTIVE MODIFIERS
━━━━━━━━━━━━━━━━━━━━━━
📊 EVASION (+2 total)
  • Gambeson Armor: +1
  • Ring of Dodging (Custom): +1

🗡️ ARMOR SCORE (+1 total)
  • Platemail: +1

❤️ HIT POINTS (no modifiers)
```

**Missing:** No component for this overview. Currently must check individual stat sheets.

#### 2. **Equipment Modifier Preview**
When about to equip/unequip an item, should preview modifier changes:

```
Equiping: Broadsword (+1 Attack Rolls)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current Evasion: 12
After equip: 12 (no change)

Current Attack Bonus: +0
After equip: +1 ✅
```

**Missing:** No preview modal. Users don't know modifier impact before equipping.

#### 3. **Inline Modifier Tags on Items**
In inventory list, items should show their modifiers:

```
💼 Inventory
━━━━━━━━━━━━━━━━━━━━━━
Gambeson Armor  [+1 EVASION] [Unequip]
Longsword       [+1 ATTACK]  [Equip]
Dagger          (no modifiers)
```

**Missing:** No modifier badges on items. Must open item detail to see modifiers.

---

## Phase 5: Homebrew Item Creation Requirements

### Use Case
User wants to create a custom item with modifiers:

> "I want to make a 'Ring of Cunning' that gives +2 to Finesse"

### UI Flow

```
User taps "Create Custom Item"
  ↓
Modal opens:
  Name: [Ring of Cunning ________]
  Description: [A mystical ring that enhances wit ________]
  Item Type: [Accessory ▼]

  Modifiers:
    [+ Modify 1 ▼]
      Type: [stat ▼]
      Target: [Finesse ▼]
      Operator: [add ▼]
      Value: [2 ________]
      Condition: (optional)
      Description: [+2 to Finesse ________]
      [Delete]

    [+ Add Another Modifier]

  [Save] [Cancel]
  ↓
Item created and added to inventory
  ↓
User can equip/unequip like SRD items
```

### Data Storage
```typescript
// In character_inventory table:
{
  id: uuid,
  character_id: uuid,
  name: "Ring of Cunning",
  item_id: null, // NULL for homebrew
  location: "backpack",
  description: "A mystical ring that enhances wit",
  custom_data: {
    is_homebrew: true,
    item_type: "accessory",
    modifiers: [
      {
        id: "mod-uuid-1",
        type: "stat",
        target: "finesse",
        value: 2,
        operator: "add",
        description": "+2 to Finesse"
      }
    ]
  }
}
```

### Validation Rules
- Name: Required, max 100 chars
- Description: Optional, max 500 chars
- Item Type: Required, one of [weapon, armor, consumable, accessory, other]
- Modifiers: At least 1, max 5 per item
- Each modifier: Valid structure, reasonable values (e.g., -5 to +5 for stats)

### Equal Treatment
Once created, homebrew items work exactly like SRD items:
- Can be equipped/unequipped
- Modifiers apply automatically
- Can be deleted
- Cannot be edited (delete and recreate)

---

## Implementation Priority Matrix

### Critical Path (Must Do First)
1. **Phase 2: Seed Script** (8-12 hrs) - Unblocks everything else
2. **Phase 3: Modifier Service** (6-8 hrs) - Required for other phases

### High Priority (Should Do Next)
3. **Phase 1: Unit Tests** (2 hrs) - Parallel work while others happening
4. **Phase 4: UI Enhancements** (4-6 hrs) - Improve user visibility

### Medium Priority (Nice to Have Soon)
5. **Phase 5: Homebrew Items** (10-12 hrs) - User customization
6. **Phase 6: Polish** (4-6 hrs) - Tests, docs, optimization

### Recommended Timeline
- **Week 1:** Seed script + modifier service (Phase 2 + 3)
- **Week 2:** UI enhancements + unit tests (Phase 1 + 4)
- **Week 3:** Homebrew items (Phase 5)
- **Week 4:** Polish + testing (Phase 6)

---

## Code Examples: How It Should Work

### Example 1: Equipping Armor with Modifiers

```typescript
// User equips "Gambeson Armor" (+1 Evasion)

// OLD (Current - Regex fallback):
const getSystemModifiers = (character, 'evasion') => {
  // Searches feat_text: "+1 to Evasion"
  // Regex matches and extracts "1"
  // Returns [{id: '...', value: 1, source: 'Gambeson Armor'}]
}

// NEW (After Phase 2 + 3):
const modifiers = modifierService.getEquippedItemModifiers(character);
// Returns pre-parsed from library.data:
// [{
//   id: 'mod-uuid-1',
//   type: 'stat',
//   target: 'evasion',
//   value: 1,
//   operator: 'add',
//   description: '+1 to Evasion'
// }]

const total = modifierService.applyModifierToStat(character, 'evasion', modifiers);
// Returns: 10 (base) + 1 (modifier) = 11
```

### Example 2: Conditional Modifier (Unarmored)

```typescript
// Drakona ancestry: "When unarmored, +1 Evasion"

// Modifier in database:
{
  type: 'stat',
  target: 'evasion',
  value: 1,
  operator: 'add',
  condition: 'while unarmored',
  description: 'When unarmored, +1 Evasion'
}

// In modifier-service:
const active = modifierService.getActiveModifiers(character, 'evasion');
// → Checks: character.armor_score === 0?
// → If yes, includes modifier; if no, excludes it

// Character unarmored (armor_score: 0):
modifiers = [racialMod]; // Returns unarmored bonus
evasion = 10 + 1 = 11;

// Character armored (armor_score: 3):
modifiers = []; // Returns no bonuses
evasion = 10; // Base only
```

### Example 3: Creating Custom Item

```typescript
// User creates homebrew item: "Ring of Cunning" (+2 Finesse)

// In create-custom-item-modal.tsx:
const handleSave = async (itemData) => {
  const customItem = {
    name: 'Ring of Cunning',
    description: 'A mystical ring',
    item_type: 'accessory',
    custom_data: {
      is_homebrew: true,
      modifiers: [
        {
          id: crypto.randomUUID(),
          type: 'stat',
          target: 'finesse',
          value: 2,
          operator: 'add',
          description: '+2 to Finesse'
        }
      ]
    }
  };

  // Store in character_inventory (item_id: null for custom)
  await characterStore.addItem({
    character_id,
    name: customItem.name,
    item_id: null, // No SRD reference
    location: 'backpack',
    description: customItem.description,
    custom_data: customItem.custom_data
  });

  // Now when equipped:
  const modifiers = modifierService.getEquippedItemModifiers(character);
  // → Finds custom_data.modifiers in character_inventory
  // → Returns [{type: 'stat', target: 'finesse', value: 2, ...}]

  // Finesse stat increases by 2
};
```

---

## Testing Strategy

### Unit Tests Needed

```typescript
// modifier-service.test.ts
describe('ModifierService', () => {
  describe('getEquippedItemModifiers', () => {
    it('should return modifiers from equipped items', () => {
      const char = makeCharacter({
        inventory: [{
          location: 'equipped_armor',
          library_item: { data: { modifiers: [gambesonMod] } }
        }]
      });
      const mods = service.getEquippedItemModifiers(char);
      expect(mods).toContain(gambesonMod);
    });
  });

  describe('evaluateConditionalModifier', () => {
    it('should apply "while unarmored" condition correctly', () => {
      const mod = { condition: 'while unarmored', value: 1 };

      expect(service.evaluateConditionalModifier(
        makeCharacter({ armor_score: 0 }), mod
      )).toBe(true);

      expect(service.evaluateConditionalModifier(
        makeCharacter({ armor_score: 3 }), mod
      )).toBe(false);
    });
  });

  describe('applyModifierToStat', () => {
    it('should sum additive modifiers', () => {
      const result = service.applyModifierToStat(
        makeCharacter({ base_evasion: 10 }),
        'evasion',
        [{ value: 1, operator: 'add' }, { value: 2, operator: 'add' }]
      );
      expect(result).toBe(13); // 10 + 1 + 2
    });
  });
});
```

### Integration Tests

```typescript
// modifier-system.integration.test.ts
describe('Modifier System End-to-End', () => {
  it('should apply equipment modifiers to character stats', async () => {
    const char = await createCharacter({ class: 'Guardian' }); // Base evasion: 9
    const gambeson = await getItemFromLibrary('armor-gambeson'); // +1 evasion

    await equipItem(char, gambeson);

    const stats = await getCharacterStats(char);
    expect(stats.evasion).toBe(10); // 9 + 1
  });

  it('should support homebrew items with modifiers', async () => {
    const char = await createCharacter({ class: 'Bard' }); // Base finesse
    const customItem = await createCustomItem({
      name: 'Ring of Cunning',
      modifiers: [{ target: 'finesse', value: 2, operator: 'add' }]
    });

    await equipItem(char, customItem);

    const mods = await getActiveModifiers(char, 'finesse');
    expect(mods).toContainEqual(jasmine.objectContaining({ value: 2 }));
  });
});
```

---

## Migration & Backwards Compatibility

### For Existing Characters
When database is seeded with structured modifiers:

1. **Option A: Automatic Migration**
   - Update all existing `character.modifiers` to add `source: 'system'` for item mods
   - Keep `source: 'user'` for manual modifiers
   - No data loss

2. **Option B: Fallback Support**
   - Keep regex parsing as fallback
   - If structured modifiers exist in library, use them
   - Otherwise, regex parse feat_text
   - Graceful degradation

**Recommended:** Option B initially, then Option A after Phase 6

---

## References

### Existing Code Locations
- Modifier types: `/types/modifiers.ts`
- Parser: `/lib/modifier-parser.ts`
- Store logic: `/store/character-store.ts` (lines 290-429)
- Fallback extraction: `/lib/utils.ts` (lines 36-87)
- SRD data: `/srd/json/` (armor.json, weapons.json, items.json)
- Database schema: `/supabase/schema.sql`
- Seed data: `/supabase/seed_library.sql`

### Files to Create
- `/scripts/seed-library.ts` (Phase 2)
- `/lib/modifier-service.ts` (Phase 3)
- `/components/create-custom-item-modal.tsx` (Phase 5)
- `/components/modifier-builder.tsx` (Phase 5)
- Tests for all above

---

## Questions to Answer Before Starting

1. **Should conditional modifiers be evaluated at parse-time or apply-time?**
   - Recommended: Apply-time (more flexible)

2. **What should happen if custom item has conflicting modifiers?**
   - e.g., Two "set" operators on same stat
   - Recommended: Warn user, apply both (last wins)

3. **Should homebrew items be shareable between characters?**
   - Current design: Per-character only
   - Could add export/import later

4. **How to handle complex feat_text that can't be parsed?**
   - Recommended: Create `type: 'special'` modifier with original text preserved

5. **What's the approval process for homebrew items in group play?**
   - Out of scope for Phase 5, but worth documenting

---

## Success Criteria

Phase 2 Complete When:
- ✅ seed-library.ts script exists and runs without errors
- ✅ All SRD armor/weapons have modifiers in database
- ✅ Parser handles simple cases ("+1 to Stat") correctly
- ✅ Complex cases flagged for manual review
- ✅ Unit tests for parser passing

Phase 3 Complete When:
- ✅ modifier-service.ts exists with all core functions
- ✅ Character store uses modifier-service, not inline logic
- ✅ Conditional modifier evaluation working
- ✅ All derived stats calculated correctly
- ✅ No regex parsing in apply-time code

Phase 5 Complete When:
- ✅ Custom items can be created with modal
- ✅ Custom item modifiers apply like SRD items
- ✅ Custom items persist across page reload
- ✅ Validation prevents invalid modifiers
- ✅ E2E test creating and equipping custom item passes

---

## Estimated Timeline

**Week 1-2:** Phase 2 + Phase 3 (14-20 hours)
- [ ] Create seed-library.ts and test parsing
- [ ] Create modifier-service.ts with all functions
- [ ] Integrate modifier-service into character-store
- [ ] Add unit tests for both

**Week 2-3:** Phase 1 + Phase 4 (6-12 hours)
- [ ] Add unit tests for modifier-parser
- [ ] Add Active Modifiers panel UI
- [ ] Add equipment modifier preview
- [ ] Add inline modifier tags

**Week 3-4:** Phase 5 (10-12 hours)
- [ ] Create custom item modal
- [ ] Create modifier builder component
- [ ] Add database support for custom items
- [ ] Add validation and tests

**Week 4:** Phase 6 (4-6 hours)
- [ ] Create comprehensive tests
- [ ] Performance optimization
- [ ] Documentation
- [ ] Error handling and edge cases

**Total:** 34-50 hours (4-6 weeks at 10 hrs/week)
