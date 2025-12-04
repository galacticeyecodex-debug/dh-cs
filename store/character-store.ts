import { create } from 'zustand';
import createClient from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { getSystemModifiers, getClassBaseStat, calculateBaseEvasion } from '@/lib/utils';
import { Experience } from '@/types/modifiers';
import { withOptimisticUpdate } from '@/lib/state-helpers';

// Define interfaces for related data
export interface LibraryItem {
  id: string;
  type: string;
  name: string;
  domain?: string;
  tier?: number;
  data: any; // JSONB column content
}

export interface CharacterCard {
  id: string;
  character_id: string;
  card_id: string;
  location: 'loadout' | 'vault' | 'feature';
  state: { tokens?: number; exhausted?: boolean; custom_image_url?: string };
  sort_order?: number;
  library_item?: LibraryItem; // Joined data for the card itself
}

export interface CharacterInventoryItem {
  id: string;
  character_id: string;
  item_id?: string; // Foreign key to library, nullable for custom items
  name: string;
  description?: string;
  location: 'equipped_primary' | 'equipped_secondary' | 'armor' | 'equipped_armor' | 'backpack';
  quantity: number;
  library_item?: LibraryItem; // Joined data for the item itself
}

export interface Character {
  id: string;
  user_id: string;
  name: string;
  level: number;
  ancestry?: string;
  community?: string;
  class_id?: string;
  subclass_id?: string;
  domains?: string[];
  stats: {
    agility: number;
    strength: number;
    finesse: number;
    instinct: number;
    presence: number;
    knowledge: number;
  };
  vitals: {
    hit_points_max: number;
    hit_points_current: number;
    stress_max: number;
    stress_current: number;
    armor_score: number;
    armor_slots: number;
  };
  damage_thresholds: {
    minor: number;
    major: number;
    severe: number;
  };
  hope: number;
  fear: number;
  evasion: number;
  proficiency: number;
  experiences: Experience[];
  modifiers?: Record<string, { id: string; name: string; value: number; source: 'user' | 'system' }[]>;
  gold: {
    handfuls: number;
    bags: number;
    chests: number;
  };
  image_url?: string;

  // Relations
  character_cards?: CharacterCard[];
  character_inventory?: CharacterInventoryItem[];
  class_data?: LibraryItem; // Joined class data
}

export interface RollResult {
  hope: number;
  fear: number;
  extras?: number;
  dice?: { role: string, value: number, sides: number }[];
  total: number;
  modifier: number;
  type: 'Critical' | 'Hope' | 'Fear' | 'Damage';
}

interface CharacterState {
  character: Character | null;
  isLoading: boolean;
  user: User | null;

  activeTab: 'character' | 'playmat' | 'inventory' | 'combat';
  isDiceOverlayOpen: boolean;
  activeRoll: { label: string; modifier: number; dice?: string } | null;
  lastRollResult: RollResult | null;

  setCharacter: (char: Character | null) => void;
  setUser: (user: User | null) => void;
  setActiveTab: (tab: 'character' | 'playmat' | 'inventory' | 'combat') => void;
  openDiceOverlay: () => void;
  closeDiceOverlay: () => void;
  prepareRoll: (label: string, modifier: number, dice?: string) => void;
  setLastRollResult: (result: RollResult) => void;
  fetchCharacter: (userId: string, characterId?: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  switchCharacter: (characterId: string) => Promise<void>;

  updateVitals: (type: 'hit_points_current' | 'stress_current' | 'armor_slots', value: number) => Promise<void>;
  equipItem: (itemId: string, slot: 'equipped_primary' | 'equipped_secondary' | 'equipped_armor' | 'backpack') => Promise<void>;
  addItemToInventory: (item: LibraryItem) => Promise<void>;
  recalculateDerivedStats: () => Promise<void>;
  updateGold: (denomination: 'handfuls' | 'bags' | 'chests', value: number) => Promise<void>;
  updateHope: (value: number) => Promise<void>;
  updateEvasion: (value: number) => Promise<void>;
  updateModifiers: (stat: string, modifiers: { id: string; name: string; value: number; source: 'user' | 'system' }[]) => Promise<void>;
  updateExperiences: (experiences: Experience[]) => Promise<void>;
  moveCard: (cardId: string, destination: 'loadout' | 'vault') => Promise<void>;
  addCardToCollection: (item: LibraryItem) => Promise<void>;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  character: null,
  isLoading: true,
  user: null,

  activeTab: 'character',
  isDiceOverlayOpen: false,
  activeRoll: null,
  lastRollResult: null,

  setCharacter: (char) => set({ character: char, isLoading: false }),
  setUser: (user) => set({ user }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  openDiceOverlay: () => set({ isDiceOverlayOpen: true }),
  closeDiceOverlay: () => set({ isDiceOverlayOpen: false, activeRoll: null }), // Clear active roll on close
  prepareRoll: (label, modifier, dice) => set({ isDiceOverlayOpen: true, activeRoll: { label, modifier, dice } }),
  setLastRollResult: (result) => set({ lastRollResult: result }),

  fetchUser: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      set({ user });

      // Ensure profile exists
      const { data: profile, error: profileError } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();

      if (!profile) {
        console.log("Profile missing, creating for user:", user.id);
        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          username: user.user_metadata.full_name || user.email?.split('@')[0] || 'Traveler',
          avatar_url: user.user_metadata.avatar_url
        });

        if (insertError) {
          console.error("Error creating profile:", insertError);
        } else {
          console.log("Profile created successfully.");
        }
      }

      // Then fetch character
      get().fetchCharacter(user.id);
    } else {
      set({ user: null, character: null, isLoading: false });
    }
  },

  moveCard: async (cardId, destination) => {
    const state = get();
    if (!state.character) return;

    const cards = [...(state.character.character_cards || [])];
    const cardIndex = cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    const previousLocation = cards[cardIndex].location;
    const updatedCard = { ...cards[cardIndex], location: destination };
    cards[cardIndex] = updatedCard;

    await withOptimisticUpdate(
      () => {
        set((s) => ({
          character: s.character ? { ...s.character, character_cards: cards } : null,
        }));

        return () => {
          const rollbackCards = [...(get().character?.character_cards || [])];
          const idx = rollbackCards.findIndex(c => c.id === cardId);
          if (idx !== -1) {
            rollbackCards[idx] = { ...rollbackCards[idx], location: previousLocation };
          }
          set((s) => ({
            character: s.character ? { ...s.character, character_cards: rollbackCards } : null,
          }));
        };
      },
      () => createClient().from('character_cards').update({ location: destination }).eq('id', cardId),
      'Failed to move card'
    );
  },

  addCardToCollection: async (item) => {
    const state = get();
    if (!state.character) return;

    const supabase = createClient();
    const newCard: Omit<CharacterCard, 'id' | 'library_item'> = {
      character_id: state.character.id,
      card_id: item.id,
      location: 'vault', // Default to vault
      state: {},
      sort_order: 0
    };

    const { data, error } = await supabase
      .from('character_cards')
      .insert([newCard])
      .select()
      .single();

    if (error) {
      console.error('Error adding card:', error);
      return;
    }

    // Manually add the library_item data
    const addedCard: CharacterCard = {
      ...data,
      library_item: item,
    };

    set((s) => ({
      character: s.character ? {
        ...s.character,
        character_cards: [...(s.character.character_cards || []), addedCard],
      } : null,
    }));
  },

  addItemToInventory: async (item: LibraryItem) => {
    const state = get();
    if (!state.character) return;

    const supabase = createClient();
    const newInventoryItem: Omit<CharacterInventoryItem, 'id'> = {
      character_id: state.character.id,
      item_id: item.id,
      name: item.name,
      description: item.data?.markdown || item.data?.description || '',
      location: 'backpack',
      quantity: 1,
      // library_item will be joined on fetch, so not directly set here
    };

    const { data, error } = await supabase
      .from('character_inventory')
      .insert([newInventoryItem])
      .select()
      .single();

    if (error) {
      console.error('Error adding item to inventory:', error);
      return;
    }

    // Manually add the library_item data since it's not joined on insert
    const addedItem: CharacterInventoryItem = {
      ...data,
      library_item: item,
    };

    // Optimistically update the UI
    set((s) => ({
      character: s.character ? {
        ...s.character,
        character_inventory: [...(s.character.character_inventory || []), addedItem],
      } : null,
    }));
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
    const newEvasion = calculateBaseEvasion(tempChar);

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

    set((s) => ({
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

  updateGold: async (denomination, value) => {
    const state = get();
    if (!state.character) return;

    const newValue = Math.max(0, value); // Ensure no negative gold
    const newGold = { ...state.character.gold, [denomination]: newValue };
    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const previousGold = { ...get().character!.gold };
        set((s) => ({
          character: s.character ? { ...s.character, gold: newGold } : null,
        }));
        return () => {
          set((s) => ({
            character: s.character ? { ...s.character, gold: previousGold } : null,
          }));
        };
      },
      () => createClient().from('characters').update({ gold: newGold }).eq('id', characterId),
      'Failed to update gold'
    );
  },

  updateHope: async (value) => {
    const state = get();
    if (!state.character) return;

    const newHope = Math.min(6, Math.max(0, value)); // Clamp between 0 and 6
    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const previousHope = get().character!.hope;
        set((s) => ({
          character: s.character ? { ...s.character, hope: newHope } : null,
        }));
        return () => {
          set((s) => ({
            character: s.character ? { ...s.character, hope: previousHope } : null,
          }));
        };
      },
      () => createClient().from('characters').update({ hope: newHope }).eq('id', characterId),
      'Failed to update hope'
    );
  },

  updateEvasion: async (value) => {
    const state = get();
    if (!state.character) return;

    // Evasion can theoretically be negative (though unlikely), but let's clamp to 0 for sanity?
    // Daggerheart doesn't explicitly forbid negative, but 0 is a safe floor.
    const newEvasion = Math.max(0, value);
    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const previousEvasion = get().character!.evasion;
        set((s) => ({
          character: s.character ? { ...s.character, evasion: newEvasion } : null,
        }));
        return () => {
          set((s) => ({
            character: s.character ? { ...s.character, evasion: previousEvasion } : null,
          }));
        };
      },
      () => createClient().from('characters').update({ evasion: newEvasion }).eq('id', characterId),
      'Failed to update evasion'
    );
  },

  updateModifiers: async (stat, modifiers) => {
    const state = get();
    if (!state.character) return;

    // Clone existing modifiers object or create new
    const currentModifiers = { ...state.character.modifiers } || {};
    currentModifiers[stat] = modifiers;
    const characterId = state.character.id;

    const { success } = await withOptimisticUpdate(
      () => {
        const previousModifiers = { ...get().character!.modifiers };
        set((s) => ({
          character: s.character ? { ...s.character, modifiers: currentModifiers } : null,
        }));
        return () => {
          set((s) => ({
            character: s.character ? { ...s.character, modifiers: previousModifiers } : null,
          }));
        };
      },
      () => createClient().from('characters').update({ modifiers: currentModifiers }).eq('id', characterId),
      'Failed to update modifiers'
    );

    // Trigger recalculation after modifier change (only if DB update succeeded)
    if (success) {
      await get().recalculateDerivedStats();
    }
  },

  updateExperiences: async (experiences) => {
    const state = get();
    if (!state.character) return;

    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const previousExperiences = get().character!.experiences;
        set((s) => ({
          character: s.character ? { ...s.character, experiences } : null,
        }));
        return () => {
          set((s) => ({
            character: s.character ? { ...s.character, experiences: previousExperiences } : null,
          }));
        };
      },
      () => createClient().from('characters').update({ experiences }).eq('id', characterId),
      'Failed to update experiences'
    );
  },

  equipItem: async (itemId, slot) => {
    const state = get();
    if (!state.character) return;

    const inventory = [...(state.character.character_inventory || [])];
    const itemIndex = inventory.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    // Build updates array with previous locations for rollback
    const updates: Array<{ id: string; location: string; previousLocation: string }> = [];

    const itemToEquip = { ...inventory[itemIndex] };
    const itemPreviousLocation = itemToEquip.location;

    // If we are equipping to a slot (not unequipped to backpack)
    if (slot !== 'backpack') {
      // Check if something is already in that slot
      const existingItemIndex = inventory.findIndex(i => i.location === slot);
      if (existingItemIndex !== -1) {
        // Move existing item to backpack
        const existingItem = { ...inventory[existingItemIndex] };
        const existingItemPreviousLocation = existingItem.location;
        inventory[existingItemIndex] = { ...existingItem, location: 'backpack' as const };
        updates.push({ id: existingItem.id, location: 'backpack', previousLocation: existingItemPreviousLocation });
      }
    }

    // Update the target item location
    itemToEquip.location = slot;
    inventory[itemIndex] = itemToEquip;
    updates.push({ id: itemToEquip.id, location: slot, previousLocation: itemPreviousLocation });

    const { success } = await withOptimisticUpdate(
      () => {
        set((s) => ({
          character: s.character ? { ...s.character, character_inventory: inventory } : null,
        }));

        return () => {
          const rollbackInventory = [...(get().character?.character_inventory || [])];
          updates.forEach(({ id, previousLocation }) => {
            const idx = rollbackInventory.findIndex(i => i.id === id);
            if (idx !== -1) {
              rollbackInventory[idx] = { ...rollbackInventory[idx], location: previousLocation };
            }
          });
          set((s) => ({
            character: s.character ? { ...s.character, character_inventory: rollbackInventory } : null,
          }));
        };
      },
      async () => {
        const supabase = createClient();
        for (const update of updates) {
          const { error } = await supabase
            .from('character_inventory')
            .update({ location: update.location })
            .eq('id', update.id);

          if (error) return { error };
        }
        return { error: null };
      },
      'Failed to equip item'
    );

    // Only recalculate if DB update succeeded
    if (success) {
      await get().recalculateDerivedStats();
    }
  },

  switchCharacter: async (characterId: string) => {
    const state = get();
    if (!state.user) {
      console.error('Cannot switch character: no user logged in.');
      return;
    }
    set({ isLoading: true });
    await state.fetchCharacter(state.user.id, characterId);
    set({ isLoading: false });
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
    cardsData?.forEach((c: any) => libraryIds.add(c.card_id));
    inventoryData?.forEach((i: any) => { if (i.item_id) libraryIds.add(i.item_id); });

    // Add class_id if it exists
    let classIdToFetch = null;
    if (charData.class_id) {
      const slug = charData.class_id.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      classIdToFetch = `class-${slug}`;
      libraryIds.add(classIdToFetch);
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

    // D. Stitch Data
    const enrichedCards = cardsData?.map((card: any) => ({
      ...card,
      library_item: libraryMap.get(card.card_id)
    })) || [];

    const enrichedInventory = inventoryData?.map((item: any) => ({
      ...item,
      library_item: item.item_id ? libraryMap.get(item.item_id) : undefined
    })) || [];

    const classData = classIdToFetch ? libraryMap.get(classIdToFetch) : undefined;

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

  updateVitals: async (type, value) => {
    const state = get();
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
        const previousVitals = get().character!.vitals;
        set((s) => ({
          character: s.character ? { ...s.character, vitals: updatedVitals } : null,
        }));
        return () => {
          set((s) => ({
            character: s.character ? { ...s.character, vitals: previousVitals } : null,
          }));
        };
      },
      () => createClient().from('characters').update({ vitals: updatedVitals }).eq('id', characterId),
      `Failed to update ${type.replace('_', ' ')}`
    );
  },
}));