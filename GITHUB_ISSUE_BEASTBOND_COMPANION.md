# Feature: Interactive Beastbond Ranger Companion Support

## Summary

Implement interactive UI support for the Beastbond Ranger subclass companion feature. This includes a companion card displayed on the Character page and a "Manage" button (similar to the Experiences feature) to manage the companion and level it up.

## Background

The Beastbond Ranger subclass companion system is fully documented in the SRD (`srd/json/subclasses.json`) but currently has no corresponding UI components or database schema. The companion system is a core feature of this subclass and includes:

- Companion naming and customization
- Companion Experiences (skill tracking)
- Companion vitals (Evasion, Stress, Attack/Damage)
- 8 level-up advancement options

## Feature Requirements

### 1. Companion Card in Character View

Add a new section in `components/views/character-view.tsx` (Stats tab) for Beastbond Rangers that displays:

- **Companion Header**: Name, animal type
- **Vitals Display**:
  - Evasion score (starts at 10)
  - Stress slots (checkboxes, similar to character stress)
  - Armor slot (if "Armored" upgrade taken)
- **Combat Stats**:
  - Attack type (Melee/Ranged)
  - Damage die
- **Companion Experiences**: Similar display to character experiences with +/- values
- **Hope Slot(s)**: Checkable boxes (additional slots from "Light in the Dark" upgrade)
- **"Manage" Button**: Opens the companion management sheet

**Reference Pattern**: Follow the Experiences section pattern at `character-view.tsx:422-465`

### 2. Companion Management Sheet

Create a new `components/companion-sheet.tsx` component following the `experience-sheet.tsx` pattern:

#### Initial Setup Section (if no companion exists)
- Companion name input
- Animal type selection/input
- Initial experience creation (2 experiences)
- Attack type selection (Melee/Ranged)
- Initial damage die selection

#### Ongoing Management Features
- **Edit Companion Info**: Name, animal type
- **Manage Companion Experiences**: Add/edit/delete experiences with +/- value controls
- **Track Companion Stress**: Clear/mark stress slots
- **Manage Hope Slots**: Use/restore hope

#### Level-Up Section
Display and track the 8 level-up options from the SRD:

| Option | Effect |
|--------|--------|
| **Intelligent** | +1 bonus to Companion Experience (can take multiple times) |
| **Light in the Dark** | Additional Hope slot |
| **Creature Comfort** | Once per rest: Clear 1 Stress OR Give 1 Hope |
| **Armored** | Mark Armor Slot instead of Companion Stress (once per short rest) |
| **Vicious** | Increase damage die by one step OR increase range to Very Close |
| **Resilient** | Additional Stress slot |
| **Bonded** | Emergency assistance when character reaches 0 HP |
| **Aware** | +2 bonus to Evasion |

- Track which options have been taken
- Some options can be taken multiple times (Intelligent, Vicious, Resilient)
- Visual indicators for obtained upgrades

### 3. Database Schema Updates

Add companion data to the Character model in `types/character.ts`:

```typescript
export interface CompanionExperience {
  name: string;
  value: number;
}

export interface RangerCompanion {
  name: string;
  animal_type: string;
  evasion: number;
  stress_max: number;
  stress_current: number;
  armor_slot: boolean;
  armor_slot_used: boolean;
  hope_max: number;
  hope_current: number;
  attack_type: 'melee' | 'ranged';
  damage_die: string; // e.g., "d6", "d8", "d10", "d12"
  attack_range?: 'melee' | 'very_close' | 'close' | 'far';
  experiences: CompanionExperience[];
  level_up_options: {
    intelligent: number; // Can be taken multiple times
    light_in_the_dark: number;
    creature_comfort: boolean;
    creature_comfort_used?: boolean; // Reset on rest
    armored: boolean;
    armored_used?: boolean; // Reset on short rest
    vicious: number;
    resilient: number;
    bonded: boolean;
    aware: boolean;
  };
}

// Add to Character interface
export interface Character {
  // ... existing fields
  ranger_companion?: RangerCompanion;
}
```

### 4. State Management

Add companion management functions to the store following the pattern in `store/slices/vitals-slice.ts`:

- `updateCompanion(companion: Partial<RangerCompanion>)`
- `updateCompanionStress(value: number)`
- `updateCompanionHope(value: number)`
- `updateCompanionExperiences(experiences: CompanionExperience[])`
- `addCompanionLevelUpOption(option: string)`
- `resetCompanionRestAbilities(restType: 'short' | 'long')`

### 5. Conditional Display Logic

The companion card should only display when:
1. Character's class is "Ranger"
2. Character's subclass is "Beastbound"
3. Character has obtained the Foundation feature (subclass_progression.foundation_obtained === true)

## UI/UX Considerations

- Match the existing visual style in `character-view.tsx`
- Use the same button styling as the Experiences "Manage" button
- Follow the bottom-sheet modal pattern from `experience-sheet.tsx` using framer-motion
- Include show/hide toggle for the companion section (like other sections)
- Mobile-friendly with responsive design
- Optimistic updates with rollback pattern for state changes

## Technical Implementation Notes

### Files to Create
- `components/companion-sheet.tsx` - Management modal
- `components/companion-card.tsx` - Display card component (optional, could be inline)

### Files to Modify
- `types/character.ts` - Add RangerCompanion interface
- `components/views/character-view.tsx` - Add companion section
- `store/slices/vitals-slice.ts` or new `companion-slice.ts` - State management
- Database migration for ranger_companion column (JSONB)

### Reference Files
- `components/experience-sheet.tsx` - Modal pattern reference
- `components/subclass-feature-card.tsx` - Feature card pattern
- `srd/json/subclasses.json` - Beastbound data source (lines 6-70)

## Acceptance Criteria

- [ ] Companion card displays for Beastbound Rangers with Foundation feature
- [ ] All companion vitals (Evasion, Stress, Hope, Armor) are trackable
- [ ] Companion experiences can be created, edited, and deleted
- [ ] Combat stats (attack type, damage die, range) are editable
- [ ] All 8 level-up options can be tracked with proper constraints
- [ ] State persists to database
- [ ] Rest abilities reset appropriately (Creature Comfort on long rest, Armored on short rest)
- [ ] Mobile-responsive design
- [ ] Follows existing code patterns and styling

## Related SRD Content

The complete companion rules are in the Beastbound subclass "extras" field in `srd/json/subclasses.json`, including:
- Step-by-step companion creation
- Using Spellcast rolls with companion
- Taking damage as stress
- Complete level-up options descriptions
