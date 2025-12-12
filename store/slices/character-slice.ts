import { StateCreator } from 'zustand';
import createClient from '@/lib/supabase/client';
import { Character, CharacterCard, CharacterInventoryItem, LibraryItem, HomebrewItem, Experience } from '@/types/character';
import { getSystemModifiers, calculateBaseEvasion } from '@/lib/utils';
import { withOptimisticUpdate } from '@/lib/state-helpers';
import { CharacterStore } from '@/types/store';

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
    const equippedPrimary = inventory.find(i => i.location === 'equipped_primary');
    const equippedSecondary = inventory.find(i => i.location === 'equipped_secondary');

    let newArmorScore = 0;
    let minorThreshold = 1;
    let majorThreshold = character.level;
    let severeThreshold = character.level * 2;

    // 1. Base Score from Armor & Thresholds
    if (equippedArmor?.library_item?.data) {
      const armorData = equippedArmor.library_item.data;

      // Base Score
      if (armorData.base_score) {
        newArmorScore += parseInt(armorData.base_score) || 0;
      }

      // Thresholds
      if (armorData.base_thresholds) {
        const parts = armorData.base_thresholds.split('/');
        if (parts.length === 2) {
          const baseMajor = parseInt(parts[0].trim());
          const baseSevere = parseInt(parts[1].trim());
          if (!isNaN(baseMajor) && !isNaN(baseSevere)) {
            majorThreshold = baseMajor + character.level;
            severeThreshold = baseSevere + character.level;
          }
        }
      }
    } else {
      // Unarmored rules: Score 0, Major = Level, Severe = Level * 2
      // (Defaults already set)
    }

    // 2. System Modifiers (Items)
    const tempChar = { ...character, character_inventory: inventory };

    // Armor Score Bonuses
    const armorMods = getSystemModifiers(tempChar, 'armor');
    newArmorScore += armorMods.reduce((acc: number, mod: any) => acc + mod.value, 0);

    // Threshold Bonuses
    const thresholdMods = getSystemModifiers(tempChar, 'damage_thresholds');
    const thresholdBonus = thresholdMods.reduce((acc: number, mod: any) => acc + mod.value, 0);

    majorThreshold += thresholdBonus;
    severeThreshold += thresholdBonus;

    // 3. Apply Manual Modifiers (from Ledger)
    if (character.modifiers?.['armor']) {
      character.modifiers['armor'].forEach(mod => {
        newArmorScore += mod.value;
      });
    }

    // 4. Cap Armor Score at 12 per SRD rules
    newArmorScore = Math.min(newArmorScore, 12);

    // === HP MAX CALCULATION ===
    const classBaseHP = parseInt(character.class_data?.data?.starting_hp) || 6;
    let newHPMax = classBaseHP;

    // System modifiers from items
    const hpMods = getSystemModifiers(tempChar, 'hit_points');
    newHPMax += hpMods.reduce((acc: number, mod: any) => acc + mod.value, 0);

    // Manual modifiers from ledger
    if (character.modifiers?.['hit_points']) {
      character.modifiers['hit_points'].forEach(mod => {
        newHPMax += mod.value;
      });
    }

    // === STRESS MAX CALCULATION ===
    let newStressMax = 6; // Base stress is always 6

    // System modifiers from items
    const stressMods = getSystemModifiers(tempChar, 'stress');
    newStressMax += stressMods.reduce((acc: number, mod: any) => acc + mod.value, 0);

    // Manual modifiers from ledger
    if (character.modifiers?.['stress']) {
      character.modifiers['stress'].forEach(mod => {
        newStressMax += mod.value;
      });
    }

    // === EVASION CALCULATION ===
    let newEvasion = calculateBaseEvasion(tempChar);

    // Apply Manual Modifiers (from Ledger or Level Up)
    if (character.modifiers?.['evasion']) {
      character.modifiers['evasion'].forEach(mod => {
        newEvasion += mod.value;
      });
    }

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
