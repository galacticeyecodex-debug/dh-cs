/**
 * Character Slice
 * ----------------------------------------------------------------------------
 * This slice serves as the core of the character management system, handling the
 * primary character data structure, fetching logic, and derived stat calculations.
 * It integrates with the database to load character details, inventory, and cards,
 * and includes logic for synchronizing derived stats (like Armor Score and Evasion)
 * based on equipment and modifiers, acting as the central source of truth for the
 * active character.
 */

import { StateCreator } from 'zustand';
import { dataService } from '@/lib/data-service';
import { Character, CharacterCard, CharacterInventoryItem, LibraryItem, HomebrewItem, Experience } from '@/types/character';
import { getSystemModifiers, calculateBaseEvasion } from '@/lib/utils';
import { withOptimisticUpdate } from '@/lib/state-helpers';
import { CharacterStore } from '@/types/store';
import ModifierService from '@/lib/modifier-service';
import { Modifier } from '@/types/modifiers';

// Helper to convert legacy/simple modifiers to strict Modifier objects
const convertToModifier = (legacyMod: any, target: string): Modifier => ({
  id: legacyMod.id || crypto.randomUUID(),
  type: 'stat',
  target: target,
  value: legacyMod.value,
  operator: 'add', // Default to additive for legacy modifiers
  description: legacyMod.name || 'Modifier',
  condition: legacyMod.condition // Pass through if exists (rare in legacy)
});

export interface CharacterSlice {
  character: Character | null;
  isLoading: boolean;
  
  setCharacter: (char: Character | null) => void;
  fetchCharacter: (userId: string, characterId?: string) => Promise<void>;
  switchCharacter: (characterId: string) => Promise<void>;
  recalculateDerivedStats: () => Promise<void>;
  updateLore: (fields: Partial<Pick<Character, 'appearance' | 'background' | 'connections' | 'pronouns'>>) => Promise<void>;
  updateGallery: (images: string[]) => Promise<void>;
  updateImage: (url: string) => Promise<void>;
  updateBackgroundImage: (url: string) => Promise<void>;
}

export const createCharacterSlice: StateCreator<CharacterStore, [], [], CharacterSlice> = (set, get) => ({
  character: null,
  isLoading: true,

  setCharacter: (char) => set({ character: char, isLoading: false }),

  switchCharacter: async (characterId: string) => {
    // ... (existing code)
    const state = get() as any;
    if (!state.user) {
      console.error('Cannot switch character: no user logged in.');
      return;
    }
    set({ isLoading: true });
    await state.fetchCharacter(state.user.id, characterId);
    set({ isLoading: false });
  },

  updateLore: async (fields) => {
    // ... (existing code)
    const state = get() as any;
    if (!state.character) return;

    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const previousCharacter = { ...state.character! };
        set((s: any) => ({
          character: s.character ? { ...s.character, ...fields } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, ...previousCharacter } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, fields),
      'Failed to update lore'
    );
  },

  updateGallery: async (images) => {
    // ... (existing code)
    const state = get() as any;
    if (!state.character) return;

    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const previousImages = state.character!.gallery_images;
        set((s: any) => ({
          character: s.character ? { ...s.character, gallery_images: images } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, gallery_images: previousImages } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { gallery_images: images }),
      'Failed to update gallery'
    );
  },

  updateImage: async (url) => {
    // ... (existing code)
    const state = get() as any;
    if (!state.character) return;

    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const previousImage = state.character!.image_url;
        set((s: any) => ({
          character: s.character ? { ...s.character, image_url: url } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, image_url: previousImage } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { image_url: url }),
      'Failed to update profile image'
    );
  },

  updateBackgroundImage: async (url) => {
    // ... (existing code)
    const state = get() as any;
    if (!state.character) return;

    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const previousImage = state.character!.background_image_url;
        set((s: any) => ({
          character: s.character ? { ...s.character, background_image_url: url } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, background_image_url: previousImage } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { background_image_url: url }),
      'Failed to update background image'
    );
  },

  fetchCharacter: async (userId: string, characterId?: string) => {
    set({ isLoading: true });

    try {
      const fullCharacter = await dataService.character.get(userId, characterId);

      if (!fullCharacter) {
        set({ isLoading: false, character: null });
        return;
      }

      // Normalize companion data format (migrate from old number format to new boolean format)
      if (fullCharacter.ranger_companion) {
        const companion = fullCharacter.ranger_companion;
        // Convert light_in_the_dark from number to boolean if needed
        if (typeof companion.level_up_options.light_in_the_dark === 'number') {
          companion.level_up_options.light_in_the_dark = companion.level_up_options.light_in_the_dark > 0;
        }
      }

      set({ character: fullCharacter, isLoading: false });

      // Recalculate derived stats only if we have the necessary data
      const needsRecalc = fullCharacter.class_id && fullCharacter.vitals;

      if (needsRecalc) {
        try {
          await get().recalculateDerivedStats();
        } catch (recalcError) {
          console.error('[fetchCharacter] recalculateDerivedStats failed:', recalcError);
          // Don't fail the whole fetch if recalc fails
        }
      }
    } catch (error) {
      console.error('Error fetching character:', error);
      set({ isLoading: false, character: null });
    }
  },

  recalculateDerivedStats: async () => {
    const state = get() as CharacterStore;
    const character = state.character;
    const cardStates = state.cardStates || {};

    if (!character) {
      return;
    }

    // Defensive check - ensure we have minimum required data
    if (!character.vitals) {
      console.warn('[recalculateDerivedStats] Missing vitals, skipping');
      return;
    }

    const inventory = character.character_inventory || [];
    const equippedArmor = inventory.find((i: CharacterInventoryItem) => i.location === 'equipped_armor');
    
    // 1. Calculate Base Armor Score & Thresholds
    let baseArmorScore = 0;
    let baseMajor = 0; 
    let baseSevere = 0;
    
    // Determine base values from equipped armor
    if (equippedArmor?.library_item?.data) {
      const armorData = equippedArmor.library_item.data;
      
      if (armorData.base_score) {
        baseArmorScore = parseInt(armorData.base_score) || 0;
      }

      if (armorData.base_thresholds) {
        const parts = armorData.base_thresholds.split('/');
        if (parts.length === 2) {
          baseMajor = parseInt(parts[0].trim());
          baseSevere = parseInt(parts[1].trim());
        }
      }
    }
    // Note: If unarmored (score 0), baseMajor/Severe remain 0 here, handled below

    const tempChar = { ...character, character_inventory: inventory };

    // --- ARMOR SCORE CALCULATION ---
    const armorSystemMods = getSystemModifiers(tempChar, 'armor', cardStates).map((m: any) => convertToModifier(m, 'armor'));
    const armorUserMods = (character.modifiers?.['armor'] || []).map(m => convertToModifier(m, 'armor'));
    const allArmorMods = [...armorSystemMods, ...armorUserMods];

    // Note: Armor Score max is 12 (enforced by Service via ranges? No, constants had 50. We need to respect SRD rule here)
    // The service has a clampValue, but 'armor' max was set to 50 in my implementation.
    // I should probably update the service constant or cap it here. 
    // SRD says: "If your Armor Score is ever 13 or higher, reduce it to 12."
    // I will let the service do its math, and if I want to strictly enforce 12, I should have updated the service constant.
    // For now, I will use Math.min as before to be safe.
    
    let newArmorScore = ModifierService.applyModifiers(baseArmorScore, allArmorMods, character, 'armor');
    newArmorScore = Math.min(newArmorScore, 12); // Hard cap per SRD


    // --- DAMAGE THRESHOLDS CALCULATION ---
    let minorThreshold = 1;
    let majorThreshold = (baseMajor || 0) + character.level;
    let severeThreshold = (baseSevere || 0) + character.level;
    
    // If unarmored (and no base set), baseMajor was 0, so just level. Correct.
    // But wait, unarmored thresholds are: Minor 1, Major = Level, Severe = Level * 2?
    // SRD: "If you are not wearing armor... Minor is 1, Major is equal to your Level, Severe is double your Level."
    if (!equippedArmor) {
        severeThreshold = character.level * 2;
    }

    // Apply modifiers to thresholds
    
    // 1. Generic 'damage_thresholds' (applies to Major and Severe)
    const threshSystemMods = getSystemModifiers(tempChar, 'damage_thresholds', cardStates).map((m: any) => convertToModifier(m, 'damage_thresholds'));
    const threshUserMods = (character.modifiers?.['damage_thresholds'] || []).map(m => convertToModifier(m, 'damage_thresholds'));
    const genericBonus = ModifierService.applyModifiers(0, [...threshSystemMods, ...threshUserMods], character, 'damage_thresholds');
    
    // 2. Specific Modifiers
    const minorSystemMods = getSystemModifiers(tempChar, 'damage_threshold_minor', cardStates).map((m: any) => convertToModifier(m, 'damage_threshold_minor'));
    const minorUserMods = (character.modifiers?.['damage_threshold_minor'] || []).map(m => convertToModifier(m, 'damage_threshold_minor'));
    const minorBonus = ModifierService.applyModifiers(0, [...minorSystemMods, ...minorUserMods], character, 'damage_threshold_minor');

    const majorSystemMods = getSystemModifiers(tempChar, 'damage_threshold_major', cardStates).map((m: any) => convertToModifier(m, 'damage_threshold_major'));
    const majorUserMods = (character.modifiers?.['damage_threshold_major'] || []).map(m => convertToModifier(m, 'damage_threshold_major'));
    const majorBonus = ModifierService.applyModifiers(0, [...majorSystemMods, ...majorUserMods], character, 'damage_threshold_major');

    const severeSystemMods = getSystemModifiers(tempChar, 'damage_threshold_severe', cardStates).map((m: any) => convertToModifier(m, 'damage_threshold_severe'));
    const severeUserMods = (character.modifiers?.['damage_threshold_severe'] || []).map(m => convertToModifier(m, 'damage_threshold_severe'));
    const severeBonus = ModifierService.applyModifiers(0, [...severeSystemMods, ...severeUserMods], character, 'damage_threshold_severe');

    // Apply all
    minorThreshold += minorBonus;
    majorThreshold += genericBonus + majorBonus;
    severeThreshold += genericBonus + severeBonus;


    // --- HP MAX CALCULATION ---
    const classBaseHP = parseInt(character.class_data?.data?.starting_hp) || 6;
    
    const hpSystemMods = getSystemModifiers(tempChar, 'hit_points', cardStates).map((m: any) => convertToModifier(m, 'hp'));
    const hpUserMods = (character.modifiers?.['hit_points'] || []).map(m => convertToModifier(m, 'hp'));
    
    const newHPMax = ModifierService.applyModifiers(classBaseHP, [...hpSystemMods, ...hpUserMods], character, 'hp');


    // --- STRESS MAX CALCULATION ---
    const baseStress = 6;
    const stressSystemMods = getSystemModifiers(tempChar, 'stress', cardStates).map((m: any) => convertToModifier(m, 'stress'));
    const stressUserMods = (character.modifiers?.['stress'] || []).map(m => convertToModifier(m, 'stress'));
    
    const newStressMax = ModifierService.applyModifiers(baseStress, [...stressSystemMods, ...stressUserMods], character, 'stress');


    // --- EVASION CALCULATION ---
    // calculateBaseEvasion does: Class Base + System Modifiers.
    // We want to replace the manual part of it.
    // But ModifierService can handle all of it if we feed it right.
    // calculateBaseEvasion(tempChar) returns (Class Base + System Mods).
    // Let's use that as base for User Mods.
    // OR: Reconstruct fully with Service.
    
    const classBaseEvasion = parseInt(character.class_data?.data?.starting_evasion) || 10;
    const evSystemMods = getSystemModifiers(tempChar, 'evasion', cardStates).map((m: any) => convertToModifier(m, 'evasion'));
    const evUserMods = (character.modifiers?.['evasion'] || []).map(m => convertToModifier(m, 'evasion'));
    
    const newEvasion = ModifierService.applyModifiers(classBaseEvasion, [...evSystemMods, ...evUserMods], character, 'evasion');


    // Apply updates
    const currentVitals = character.vitals;

    const newVitals = {
      ...currentVitals,
      // Armor
      armor_score: newArmorScore,
      armor_slots: Math.min(currentVitals.armor_slots, newArmorScore),
      // HP
      hit_points_max: newHPMax,
      hit_points_current: Math.min(currentVitals.hit_points_current, newHPMax),
      // Stress
      stress_max: newStressMax,
      stress_current: Math.min(currentVitals.stress_current, newStressMax),
    };

    const newThresholds = {
      minor: minorThreshold,
      major: majorThreshold,
      severe: severeThreshold
    };

    set((s: any) => ({
      character: s.character ? {
        ...s.character,
        vitals: newVitals,
        damage_thresholds: newThresholds,
        evasion: newEvasion
      } : null
    }));

    await dataService.character.updateVitals(character.id, newVitals, newThresholds, newEvasion);
  },
});
