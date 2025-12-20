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
import { Experience } from '@/types/character';
import { CharacterStore } from '@/types/store';

export interface VitalsSlice {
  updateVitals: (type: 'hit_points_current' | 'stress_current' | 'armor_slots', value: number) => Promise<void>;
  updateGold: (denomination: 'handfuls' | 'bags' | 'chests', value: number) => Promise<void>;
  updateHope: (value: number) => Promise<void>;
  updateEvasion: (value: number) => Promise<void>;
  updateModifiers: (stat: string, modifiers: { id: string; name: string; value: number; source: 'user' | 'system' | 'domain_card'; type?: 'equipment' | 'domain_card' }[]) => Promise<void>;
  updateExperiences: (experiences: Experience[]) => Promise<void>;
}

export const createVitalsSlice: StateCreator<CharacterStore, [], [], VitalsSlice> = (set, get) => ({
  updateVitals: async (type, value) => {
    const state = get() as any;
    if (!state.character) return;

    const newVitals = { ...state.character.vitals };
    let actualValue = value;

    if (type === 'hit_points_current') actualValue = Math.min(newVitals.hit_points_max, Math.max(0, value));
    if (type === 'stress_current') actualValue = Math.min(newVitals.stress_max, Math.max(0, value));
    if (type === 'armor_slots') actualValue = Math.min(newVitals.armor_score, Math.max(0, value));

    const updatedVitals = { ...newVitals, [type]: actualValue };
    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const previousVitals = (get() as any).character!.vitals;
        set((s: any) => ({
          character: s.character ? { ...s.character, vitals: updatedVitals } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, vitals: previousVitals } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { vitals: updatedVitals }),
      `Failed to update ${type.replace('_', ' ')}`
    );
  },

  updateGold: async (denomination, value) => {
    const state = get() as any;
    if (!state.character) return;

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
});
