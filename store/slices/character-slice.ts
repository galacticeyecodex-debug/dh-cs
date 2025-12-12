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
import createClient from '@/lib/supabase/client';
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
      async () => createClient().from('characters').update(fields).eq('id', characterId),
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
      async () => createClient().from('characters').update({ gallery_images: images }).eq('id', characterId),
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
      async () => createClient().from('characters').update({ image_url: url }).eq('id', characterId),
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
      async () => createClient().from('characters').update({ background_image_url: url }).eq('id', characterId),
      'Failed to update background image'
    );
  },

  fetchCharacter: async (userId: string, characterId?: string) => {
    // ... (existing code)
    set({ isLoading: true });
    const supabase = createClient();

    let charData;
    if (characterId) {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching specific character:', error.message);
        set({ isLoading: false, character: null });
        return;
      }
      charData = data;
    } else {
      // Fetch the first character for the user if no characterId is provided
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching default character:', error.message);
        set({ isLoading: false, character: null });
        return;
      }
      charData = data;
    }

    if (!charData) {
      set({ isLoading: false, character: null });
      return;
    }

    // 2. Manual Join Strategy
    // A. Fetch raw relation tables
    const { data: cardsData, error: cardsError } = await supabase
      .from('character_cards')
      .select('*') // Fetch all columns including card_id
      .eq('character_id', charData.id);

    if (cardsError) {
      console.error('Error fetching cards (raw):', {
        message: cardsError.message,
        code: cardsError.code,
        details: cardsError.details,
        hint: cardsError.hint
      });
    }

    const { data: inventoryData, error: inventoryError } = await supabase
      .from('character_inventory')
      .select('*') // Fetch all columns including item_id
      .eq('character_id', charData.id);

    if (inventoryError) {
      console.error('Error fetching inventory (raw):', {
        message: inventoryError.message,
        code: inventoryError.code,
        details: inventoryError.details,
        hint: inventoryError.hint
      });
    }

    // B. Collect IDs for Library Fetch
    const libraryIds = new Set<string>();
    const homebrewIds = new Set<string>();

    cardsData?.forEach((c: any) => libraryIds.add(c.card_id));
    inventoryData?.forEach((i: any) => {
      if (i.item_id) libraryIds.add(i.item_id);
      if (i.homebrew_item_id) homebrewIds.add(i.homebrew_item_id);
    });

    // Add class_id if it exists
    let classIdToFetch = null;
    if (charData.class_id) {
      const slug = charData.class_id.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      classIdToFetch = `class-${slug}`;
      libraryIds.add(classIdToFetch);
    }

    // Add subclass_id if it exists
    let subclassIdToFetch = null;
    if (charData.subclass_id) {
      // Try to match by name if it's a name (e.g. "Nightwalker" -> "subclass-nightwalker")
      // Or it might be an ID already? Usually stored as Name.
      const slug = charData.subclass_id.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      subclassIdToFetch = `subclass-${slug}`;
      libraryIds.add(subclassIdToFetch);
    }

    // C. Fetch Library Items
    let libraryMap = new Map<string, LibraryItem>();
    if (libraryIds.size > 0) {
      const { data: libData, error: libError } = await supabase
        .from('library')
        .select('*')
        .in('id', Array.from(libraryIds));

      if (libError) console.error('Error fetching library items:', libError.message);

      if (libData) {
        libData.forEach((item: LibraryItem) => libraryMap.set(item.id, item));
      }
    }

    // Fetch Homebrew Items
    let homebrewMap = new Map<string, HomebrewItem>();
    if (homebrewIds.size > 0) {
      const { data: hbData, error: hbError } = await supabase
        .from('homebrew_items')
        .select('*')
        .in('id', Array.from(homebrewIds));

      if (hbError) console.error('Error fetching homebrew items:', hbError.message);

      if (hbData) {
        hbData.forEach((item: HomebrewItem) => homebrewMap.set(item.id, item));
      }
    }

    // D. Stitch Data
    const enrichedCards = cardsData?.map((card: any) => ({
      ...card,
      library_item: libraryMap.get(card.card_id)
    })) || [];

    const enrichedInventory = inventoryData?.map((item: any) => {
      let libraryItem = item.item_id ? libraryMap.get(item.item_id) : undefined;
      const homebrewItem = item.homebrew_item_id ? homebrewMap.get(item.homebrew_item_id) : undefined;

      // If it's a homebrew item, create a LibraryItem-compatible object for the UI
      if (homebrewItem && !libraryItem) {
        libraryItem = {
          id: `homebrew-${homebrewItem.id}`,
          type: homebrewItem.type,
          name: homebrewItem.name,
          data: homebrewItem.data
        };
      }

      return {
        ...item,
        library_item: libraryItem,
        homebrew_item: homebrewItem
      };
    }) || [];

    const classData = classIdToFetch ? libraryMap.get(classIdToFetch) : undefined;
    const subclassData = subclassIdToFetch ? libraryMap.get(subclassIdToFetch) : undefined;

    // E. Parse and Migrate Vitals
    let rawVitals = typeof charData.vitals === 'string' ? JSON.parse(charData.vitals) : charData.vitals;

    // Backward compatibility migration
    const vitals = {
      hit_points_current: rawVitals.hit_points_current ?? rawVitals.hp_current ?? 0,
      hit_points_max: rawVitals.hit_points_max ?? rawVitals.hp_max ?? 6,
      stress_current: rawVitals.stress_current ?? 0,
      stress_max: rawVitals.stress_max ?? 6,
      armor_slots: rawVitals.armor_slots ?? rawVitals.armor_current ?? 0,
      armor_score: rawVitals.armor_score ?? rawVitals.armor_max ?? 0
    };

    // Parse Experiences (Migrate string[] to Experience[])
    let experiences: Experience[] = [];
    const rawExperiences = typeof charData.experiences === 'string' ? JSON.parse(charData.experiences) : charData.experiences;

    if (Array.isArray(rawExperiences)) {
      if (rawExperiences.length > 0 && typeof rawExperiences[0] === 'string') {
        // Legacy: Array of strings
        experiences = rawExperiences.map((name: string) => ({ name, value: 2 })); // Default to +2
      } else {
        // New: Array of Experience objects
        experiences = rawExperiences;
      }
    }

    // Calculate initial damage thresholds (default if not stored)
    // We could call recalculateDerivedStats after set, but calculating basic here is safer
    let damage_thresholds;

    if (charData.damage_thresholds) {
      damage_thresholds = typeof charData.damage_thresholds === 'string'
        ? JSON.parse(charData.damage_thresholds)
        : charData.damage_thresholds;
    } else {
      const minor = 1;
      const major = charData.level;
      const severe = charData.level * 2;

      // Note: Real recalculation happens via recalculateDerivedStats() action, 
      // but we need initial state. Use base unarmored values.
      damage_thresholds = {
        minor,
        major,
        severe
      };
    }

    const fullCharacter = {
      ...charData,
      character_cards: enrichedCards,
      character_inventory: enrichedInventory,
      class_data: classData,
      subclass_data: subclassData,
      stats: typeof charData.stats === 'string' ? JSON.parse(charData.stats) : charData.stats,
      vitals,
      damage_thresholds, // Injected property
      gold: typeof charData.gold === 'string' ? JSON.parse(charData.gold) : charData.gold,
      experiences, // Use parsed experiences
    };

    set({ character: fullCharacter as Character, isLoading: false });

    // Recalculate derived stats synchronously to ensure correct values based on inventory.
    // The DB update happens asynchronously after calculations complete.
    void get().recalculateDerivedStats();
  },

  recalculateDerivedStats: async () => {
    const state = get();
    const character = state.character;
    if (!character) return;

    const inventory = character.character_inventory || [];
    const equippedArmor = inventory.find(i => i.location === 'equipped_armor');
    
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
    const armorSystemMods = getSystemModifiers(tempChar, 'armor').map((m: any) => convertToModifier(m, 'armor'));
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
    const minorThreshold = 1;
    let majorThreshold = (baseMajor || 0) + character.level;
    let severeThreshold = (baseSevere || 0) + character.level;
    
    // If unarmored (and no base set), baseMajor was 0, so just level. Correct.
    // But wait, unarmored thresholds are: Minor 1, Major = Level, Severe = Level * 2?
    // SRD: "If you are not wearing armor... Minor is 1, Major is equal to your Level, Severe is double your Level."
    if (!equippedArmor) {
        severeThreshold = character.level * 2;
    }

    // Apply modifiers to thresholds
    const threshSystemMods = getSystemModifiers(tempChar, 'damage_thresholds').map((m: any) => convertToModifier(m, 'damage_thresholds'));
    // Note: user modifiers for 'damage_thresholds' not typically exposed in UI but possible
    const threshUserMods = (character.modifiers?.['damage_thresholds'] || []).map(m => convertToModifier(m, 'damage_thresholds'));
    
    // We apply modifiers to the calculated base thresholds
    // Since major/severe usually move together with +1 to thresholds, we can apply the delta
    // But ModifierService applies to a single number.
    // Hack: Calculate the total bonus and apply to both.
    const thresholdBonus = ModifierService.applyModifiers(0, [...threshSystemMods, ...threshUserMods], character, 'damage_thresholds');
    
    majorThreshold += thresholdBonus;
    severeThreshold += thresholdBonus;


    // --- HP MAX CALCULATION ---
    const classBaseHP = parseInt(character.class_data?.data?.starting_hp) || 6;
    
    const hpSystemMods = getSystemModifiers(tempChar, 'hit_points').map((m: any) => convertToModifier(m, 'hp'));
    const hpUserMods = (character.modifiers?.['hit_points'] || []).map(m => convertToModifier(m, 'hp'));
    
    const newHPMax = ModifierService.applyModifiers(classBaseHP, [...hpSystemMods, ...hpUserMods], character, 'hp');


    // --- STRESS MAX CALCULATION ---
    const baseStress = 6;
    const stressSystemMods = getSystemModifiers(tempChar, 'stress').map((m: any) => convertToModifier(m, 'stress'));
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
    const evSystemMods = getSystemModifiers(tempChar, 'evasion').map((m: any) => convertToModifier(m, 'evasion'));
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

    const supabase = createClient();
    await supabase
      .from('characters')
      .update({
        vitals: newVitals,
        damage_thresholds: newThresholds,
        evasion: newEvasion
      })
      .eq('id', character.id);
  },
});
