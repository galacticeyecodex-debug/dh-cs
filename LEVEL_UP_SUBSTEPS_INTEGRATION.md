# Level-Up Substeps Integration Guide

## Overview
This document describes the level-up wizard substep components created to allow users to select traits, experiences, and vital slots during character advancement.

## Components Created

### 1. Trait Selection (`/components/level-up-substeps/trait-selection.tsx`)
**Purpose:** Allow users to select 2 unmarked traits to boost by +1

**Props:**
```typescript
interface TraitSelectionProps {
  character: Character;
  selectedTraits: string[];
  onSelectTraits: (traits: string[]) => void;
  markedTraits?: Record<string, any>;
}
```

**Features:**
- Displays all 6 traits (agility, strength, finesse, instinct, presence, knowledge)
- Shows current values and previews "+1 boost"
- Grays out/disables already marked traits
- Enforces selection of exactly 2 traits
- Visual feedback with checkmarks for selected traits

**Data Flow:**
- Input: Character stats, marked traits from `marked_traits_jsonb`
- Output: Array of selected trait names (e.g., `["agility", "strength"]`)
- Passed to `levelUpCharacter()` as `traitIncrements: [{trait: "agility", amount: 1}, ...]`

---

### 2. Experience Selection (`/components/level-up-substeps/experience-selection.tsx`)
**Purpose:** Allow users to select 2 experiences to boost by +1

**Props:**
```typescript
interface ExperienceSelectionProps {
  experiences: Experience[];
  selectedExperienceIndices: number[];
  onSelectExperiences: (indices: number[]) => void;
}
```

**Features:**
- Lists all character experiences with current values
- Shows "+1 boost" preview for selected experiences
- Enforces selection of exactly 2 experiences
- Edge case handling: displays warning if < 2 experiences exist
- Uses array indices to identify experiences

**Data Flow:**
- Input: Character experiences array
- Output: Array of selected indices (e.g., `[0, 2]`)
- Passed to `levelUpCharacter()` as `experienceIncrements: [{experienceIndex: 0, amount: 1}, ...]`

---

### 3. Vital Slot Selection (`/components/level-up-substeps/vital-slot-selection.tsx`)
**Purpose:** Allow users to specify how many HP/Stress slots to add (1-5)

**Props:**
```typescript
interface VitalSlotSelectionProps {
  selectedAdvancements: string[];
  currentHpMax?: number;
  currentStressMax?: number;
  hpSlotsAdded?: number;
  stressSlotsAdded?: number;
  onSetHpSlots: (count: number) => void;
  onSetStressSlots: (count: number) => void;
}
```

**Features:**
- Conditionally displays HP and/or Stress selectors based on selected advancements
- +/- buttons to adjust slot count (1-5 range)
- Shows current max and preview of new max
- Icon-based UI with Heart (HP) and Zap (Stress) icons

**Data Flow:**
- Input: Current HP/Stress max values
- Output: Number of slots to add (default: 1)
- Passed to `levelUpCharacter()` as `hpSlotsAdded`, `stressSlotsAdded`

---

## Integration into level-up-modal.tsx

### Required Changes

1. **Add imports:**
```typescript
import { Character } from '@/store/character-store';
import TraitSelection from './level-up-substeps/trait-selection';
import ExperienceSelection from './level-up-substeps/experience-selection';
import VitalSlotSelection from './level-up-substeps/vital-slot-selection';
```

2. **Update LevelUpModalProps interface:**
```typescript
interface LevelUpModalProps {
  // ... existing props
  character?: Character; // Add this
  onComplete?: (options: {
    newLevel: number;
    selectedAdvancements: string[];
    selectedDomainCardId: string;
    // ... existing options
    traitIncrements?: { trait: string; amount: number }[]; // Add these
    experienceIncrements?: { experienceIndex: number; amount: number }[];
    hpSlotsAdded?: number;
    stressSlotsAdded?: number;
  }) => Promise<void>;
}
```

3. **Add substep state:**
```typescript
const [substep, setSubstep] = useState<string | null>(null);
const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
const [selectedExperienceIndices, setSelectedExperienceIndices] = useState<number[]>([]);
const [hpSlotsAdded, setHpSlotsAdded] = useState<number>(1);
const [stressSlotsAdded, setStressSlotsAdded] = useState<number>(1);
```

4. **Conditional rendering in Step 2:**
```typescript
// After user selects advancements, enter substeps
if (step === 2 && substep === 'traits') {
  return <TraitSelection ... />;
}
if (step === 2 && substep === 'experiences') {
  return <ExperienceSelection ... />;
}
if (step === 2 && substep === 'vitals') {
  return <VitalSlotSelection ... />;
}
```

5. **Update handleNext() logic:**
- After Step 2 advancements selected, check which substeps are needed
- Navigate through substeps before proceeding to Step 3
- Validate each substep before allowing "Next"

6. **Update handleComplete():**
```typescript
const traitIncrements = selectedTraits.map(trait => ({ trait, amount: 1 }));
const experienceIncrements = selectedExperienceIndices.map(index => ({
  experienceIndex: index,
  amount: 1
}));

await onComplete({
  // ... existing options
  traitIncrements: traitIncrements.length > 0 ? traitIncrements : undefined,
  experienceIncrements: experienceIncrements.length > 0 ? experienceIncrements : undefined,
  hpSlotsAdded: selectedAdvancements.includes('add_hp') ? hpSlotsAdded : undefined,
  stressSlotsAdded: selectedAdvancements.includes('add_stress') ? stressSlotsAdded : undefined,
});
```

---

## Updated character-view.tsx

The character prop has been added to the LevelUpModal invocation:
```typescript
<LevelUpModal
  // ... existing props
  character={character}
  // ... rest of props
/>
```

---

## Step Flow with Substeps

```
Step 1: Tier Achievements (unchanged)
  ↓
Step 2: Select Advancements
  ↓
Step 2a: [If increase_traits selected] Trait Selection substep
  ↓
Step 2b: [If increase_experience selected] Experience Selection substep
  ↓
Step 2c: [If add_hp or add_stress selected] Vital Slot Selection substep
  ↓
Step 3: Damage Thresholds (unchanged)
  ↓
Step 4: Select Domain Card (unchanged)
```

---

## Styling

All components follow the existing character-view.tsx styling patterns:
- Tailwind CSS classes
- `dagger-gold` accent color
- `dagger-panel` background
- `bg-black/30` card backgrounds
- Consistent border radii and spacing

---

## Edge Cases Handled

1. **Trait Selection:**
   - All traits already marked → User sees warning, cannot proceed
   - Prevents selecting more than 2 traits

2. **Experience Selection:**
   - No experiences → Shows warning message
   - Less than 2 experiences → Shows warning, cannot proceed
   - Prevents selecting same experience twice

3. **Vital Slot Selection:**
   - Neither HP nor Stress selected → Shows "no advancements" message
   - Defaults to 1 slot if not specified
   - Clamps values to 1-5 range

---

## Next Steps

1. Complete integration of substep rendering logic in level-up-modal.tsx
2. Write comprehensive tests for each component
3. Update levelUpCharacter() in character-store.ts to handle new options
4. Test full workflow end-to-end

---

## Files Created

- `/components/level-up-substeps/trait-selection.tsx`
- `/components/level-up-substeps/experience-selection.tsx`
- `/components/level-up-substeps/vital-slot-selection.tsx`

## Files Modified

- `/components/views/character-view.tsx` (added `character` prop to LevelUpModal)
- `/components/level-up-modal.tsx` (integration pending - file actively being modified by linters)
