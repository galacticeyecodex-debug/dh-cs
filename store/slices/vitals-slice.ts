/**
 * Vitals Slice
 * ----------------------------------------------------------------------------
 * This slice is responsible for managing the fluctuating state of a character,
 * specifically their Vitals (HP, Stress, Armor Slots) and resources like Gold, Hope,
 * and Evasion. It implements optimistic updates to ensure instant UI feedback during
 * gameplay or combat, handling the synchronization with the database in the background
 * to maintain a smooth and responsive user experience.
 */

import { StateCreator } from 'zustand';
import { dataService } from '@/lib/data-service';
import { withOptimisticUpdate } from '@/lib/state-helpers';
import { guardImpersonation } from '@/lib/impersonation-guard';
import { Experience, RangerCompanion, SeraphPrayerDice, BardRallyDice, GuardianUnstoppable, WizardStrangePatterns, DruidBeastform, RangerFocus, WarriorSlayerDice, SorcererElement, DruidElementalIncarnation } from '@/types/character';
import { CharacterStore } from '@/types/store';

// Modifier source types align with ModifierSourceType from modifier-aggregator
type ModifierSourceType = 'equipment' | 'domain_card' | 'user' | 'ancestry' | 'community' | 'class' | 'subclass' | 'system';

export interface VitalsSlice {
  updateVitals: (type: 'hit_points_current' | 'stress_current' | 'armor_slots', value: number) => Promise<void>;
  updateGold: (denomination: 'handfuls' | 'bags' | 'chests', value: number) => Promise<void>;
  updateHope: (value: number) => Promise<void>;
  updateEvasion: (value: number) => Promise<void>;
  updateModifiers: (stat: string, modifiers: { id: string; name: string; value: number; source: ModifierSourceType; type?: string }[]) => Promise<void>;
  updateExperiences: (experiences: Experience[]) => Promise<void>;
  updateCompanion: (companion: RangerCompanion) => Promise<void>;
  updatePrayerDice: (prayerDice: SeraphPrayerDice) => Promise<void>;
  updateBardRallyDice: (rallyDice: BardRallyDice) => Promise<void>;
  updateGuardianUnstoppable: (unstoppable: GuardianUnstoppable) => Promise<void>;
  updateWizardStrangePatterns: (patterns: WizardStrangePatterns) => Promise<void>;
  updateDruidBeastform: (data: DruidBeastform) => Promise<void>;
  updateRangerFocus: (data: RangerFocus) => Promise<void>;
  updateWarriorSlayerDice: (slayerDice: WarriorSlayerDice) => Promise<void>;
  updateSorcererElement: (element: SorcererElement) => Promise<void>;
  updateDruidElementalIncarnation: (data: DruidElementalIncarnation) => Promise<void>;
}

export const createVitalsSlice: StateCreator<CharacterStore, [], [], VitalsSlice> = (set, get) => ({
  updateVitals: async (type, value) => {
    const state = get() as any;
    if (!state.character) return;

    // Route through GM pathway when impersonating
    if (state.impersonation) {
      const vitalTypeMap: Record<string, 'hp' | 'stress' | 'armor'> = {
        hit_points_current: 'hp',
        stress_current: 'stress',
        armor_slots: 'armor',
      };
      const vitalType = vitalTypeMap[type];
      if (vitalType) {
        await state.gmAdjustVital(state.character.id, vitalType, value);
        // Sync local character state
        const updatedVitals = { ...state.character.vitals, [type]: value };
        set((s: any) => ({
          character: s.character ? { ...s.character, vitals: updatedVitals } : null,
        }));
      }
      return;
    }

    const newVitals = { ...state.character.vitals };
    const previousValue = newVitals[type]; // Capture previous value before change
    let actualValue = value;

    if (type === 'hit_points_current') actualValue = Math.min(newVitals.hit_points_max, Math.max(0, value));
    if (type === 'stress_current') actualValue = Math.min(newVitals.stress_max, Math.max(0, value));
    if (type === 'armor_slots') actualValue = Math.min(newVitals.armor_score, Math.max(0, value));

    const updatedVitals = { ...newVitals, [type]: actualValue };
    const characterId = state.character.id;
    const characterName = state.character.name;

    // Map vitals type to activity vital type
    const vitalTypeMap: Record<string, 'hp' | 'stress' | 'armor'> = {
      hit_points_current: 'hp',
      stress_current: 'stress',
      armor_slots: 'armor',
    };
    const vitalType = vitalTypeMap[type];
    const maxValueMap: Record<string, number> = {
      hit_points_current: newVitals.hit_points_max,
      stress_current: newVitals.stress_max,
      armor_slots: newVitals.armor_score,
    };

    const { success } = await withOptimisticUpdate(
      () => {
        const prevVitals = (get() as any).character!.vitals;
        set((s: any) => ({
          character: s.character ? { ...s.character, vitals: updatedVitals } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, vitals: prevVitals } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { vitals: updatedVitals }),
      `Failed to update ${type.replace('_', ' ')}`
    );

    // Log to activity feed if in a campaign and update was successful
    if (success && state.activeCampaign && state.user && state.logActivity) {
      const change = actualValue - previousValue;
      // Only log if there was an actual change
      if (change !== 0) {
        state.logActivity({
          campaign_id: state.activeCampaign.id,
          user_id: state.user.id,
          character_id: characterId,
          character_name: characterName,
          activity_type: 'vital_change',
          data: {
            vital: vitalType,
            change,
            previous_value: previousValue,
            new_value: actualValue,
            max_value: maxValueMap[type],
          },
          is_private: false,
        });
      }
    }
  },

  updateGold: async (denomination, value) => {
    const state = get() as any;
    if (!state.character) return;
    if (guardImpersonation(state)) return;

    const newValue = Math.max(0, value); // Ensure no negative gold
    const newGold = { ...state.character.gold, [denomination]: newValue };
    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const previousGold = { ...(get() as any).character!.gold };
        set((s: any) => ({
          character: s.character ? { ...s.character, gold: newGold } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, gold: previousGold } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { gold: newGold }),
      'Failed to update gold'
    );
  },

  updateHope: async (value) => {
    const state = get() as any;
    if (!state.character) return;

    // Route through GM pathway when impersonating
    if (state.impersonation) {
      await state.gmAdjustVital(state.character.id, 'hope', value);
      set((s: any) => ({
        character: s.character ? { ...s.character, hope: value } : null,
      }));
      return;
    }

    const newHope = Math.min(6, Math.max(0, value)); // Clamp between 0 and 6
    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const previousHope = (get() as any).character!.hope;
        set((s: any) => ({
          character: s.character ? { ...s.character, hope: newHope } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, hope: previousHope } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { hope: newHope }),
      'Failed to update hope'
    );
  },

  updateEvasion: async (value) => {
    const state = get() as any;
    if (!state.character) return;
    if (guardImpersonation(state)) return;

    // Evasion can theoretically be negative (though unlikely), but let's clamp to 0 for sanity?
    // Daggerheart doesn't explicitly forbid negative, but 0 is a safe floor.
    const newEvasion = Math.max(0, value);
    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const previousEvasion = (get() as any).character!.evasion;
        set((s: any) => ({
          character: s.character ? { ...s.character, evasion: newEvasion } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, evasion: previousEvasion } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { evasion: newEvasion }),
      'Failed to update evasion'
    );
  },

  updateModifiers: async (stat, modifiers) => {
    const state = get() as any;
    if (!state.character) return;
    if (guardImpersonation(state)) return;

    // Clone existing modifiers object or create new
    const currentModifiers = { ...(state.character.modifiers || {}) };
    currentModifiers[stat] = modifiers;
    const characterId = state.character.id;

    const { success } = await withOptimisticUpdate(
      () => {
        const previousModifiers = { ...(get() as any).character!.modifiers };
        set((s: any) => ({
          character: s.character ? { ...s.character, modifiers: currentModifiers } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, modifiers: previousModifiers } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { modifiers: currentModifiers }),
      'Failed to update modifiers'
    );

    // Trigger recalculation after modifier change (only if DB update succeeded)
    if (success && state.recalculateDerivedStats) {
      await state.recalculateDerivedStats();
    }
  },

  updateExperiences: async (experiences) => {
    const state = get() as any;
    if (!state.character) return;
    if (guardImpersonation(state)) return;

    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const previousExperiences = (get() as any).character!.experiences;
        set((s: any) => ({
          character: s.character ? { ...s.character, experiences } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, experiences: previousExperiences } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { experiences }),
      'Failed to update experiences'
    );
  },

  updateCompanion: async (companion) => {
    const state = get() as any;
    if (!state.character) return;
    if (guardImpersonation(state)) return;

    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const previousCompanion = (get() as any).character!.ranger_companion;
        set((s: any) => ({
          character: s.character ? { ...s.character, ranger_companion: companion } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, ranger_companion: previousCompanion } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { ranger_companion: companion }),
      'Failed to update companion'
    );
  },

  updatePrayerDice: async (prayerDice) => {
    const state = get() as any;
    if (!state.character) return;
    if (guardImpersonation(state)) return;

    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const previousPrayerDice = (get() as any).character!.seraph_prayer_dice;
        set((s: any) => ({
          character: s.character ? { ...s.character, seraph_prayer_dice: prayerDice } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, seraph_prayer_dice: previousPrayerDice } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { seraph_prayer_dice: prayerDice }),
      'Failed to update prayer dice'
    );
  },

  updateBardRallyDice: async (rallyDice: BardRallyDice) => {
    const state = get() as any;
    if (!state.character) return;
    if (guardImpersonation(state)) return;

    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const prev = (get() as any).character!.bard_rally_dice;
        set((s: any) => ({
          character: s.character ? { ...s.character, bard_rally_dice: rallyDice } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, bard_rally_dice: prev } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { bard_rally_dice: rallyDice }),
      'Failed to update rally dice'
    );
  },

  updateGuardianUnstoppable: async (unstoppable: GuardianUnstoppable) => {
    const state = get() as any;
    if (!state.character) return;
    if (guardImpersonation(state)) return;

    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const prev = (get() as any).character!.guardian_unstoppable;
        set((s: any) => ({
          character: s.character ? { ...s.character, guardian_unstoppable: unstoppable } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, guardian_unstoppable: prev } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { guardian_unstoppable: unstoppable }),
      'Failed to update unstoppable state'
    );
  },

  updateWizardStrangePatterns: async (patterns: WizardStrangePatterns) => {
    const state = get() as any;
    if (!state.character) return;
    if (guardImpersonation(state)) return;

    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const prev = (get() as any).character!.wizard_strange_patterns;
        set((s: any) => ({
          character: s.character ? { ...s.character, wizard_strange_patterns: patterns } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, wizard_strange_patterns: prev } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { wizard_strange_patterns: patterns }),
      'Failed to update strange patterns'
    );
  },

  updateDruidBeastform: async (data: DruidBeastform) => {
    const state = get() as any;
    if (!state.character) return;
    if (guardImpersonation(state)) return;

    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const prev = (get() as any).character!.druid_beastform;
        set((s: any) => ({
          character: s.character ? { ...s.character, druid_beastform: data } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, druid_beastform: prev } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { druid_beastform: data }),
      'Failed to update beastform'
    );
  },

  updateRangerFocus: async (data: RangerFocus) => {
    const state = get() as any;
    if (!state.character) return;
    if (guardImpersonation(state)) return;

    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const prev = (get() as any).character!.ranger_focus;
        set((s: any) => ({
          character: s.character ? { ...s.character, ranger_focus: data } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, ranger_focus: prev } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { ranger_focus: data }),
      'Failed to update ranger focus'
    );
  },

  updateWarriorSlayerDice: async (slayerDice: WarriorSlayerDice) => {
    const state = get() as any;
    if (!state.character) return;
    if (guardImpersonation(state)) return;

    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const prev = (get() as any).character!.warrior_slayer_dice;
        set((s: any) => ({
          character: s.character ? { ...s.character, warrior_slayer_dice: slayerDice } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, warrior_slayer_dice: prev } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { warrior_slayer_dice: slayerDice }),
      'Failed to update slayer dice'
    );
  },

  updateSorcererElement: async (element: SorcererElement) => {
    const state = get() as any;
    if (!state.character) return;
    if (guardImpersonation(state)) return;

    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const prev = (get() as any).character!.sorcerer_element;
        set((s: any) => ({
          character: s.character ? { ...s.character, sorcerer_element: element } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, sorcerer_element: prev } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { sorcerer_element: element }),
      'Failed to update sorcerer element'
    );
  },

  updateDruidElementalIncarnation: async (data: DruidElementalIncarnation) => {
    const state = get() as any;
    if (!state.character) return;
    if (guardImpersonation(state)) return;

    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const prev = (get() as any).character!.druid_elemental_incarnation;
        set((s: any) => ({
          character: s.character ? { ...s.character, druid_elemental_incarnation: data } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, druid_elemental_incarnation: prev } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { druid_elemental_incarnation: data }),
      'Failed to update elemental incarnation'
    );
  },
});
