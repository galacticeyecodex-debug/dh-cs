import { create } from 'zustand';
import createClient from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { getSystemModifiers } from '@/lib/utils';

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
  experiences: string[];
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

    // Update local state
    const updatedCard = { ...cards[cardIndex], location: destination };
    cards[cardIndex] = updatedCard;

    set((s) => ({
      character: s.character ? { ...s.character, character_cards: cards } : null,
    }));

    // Persist to DB
    const supabase = createClient();
    const { error } = await supabase
      .from('character_cards')
      .update({ location: destination })
      .eq('id', cardId);

    if (error) {
      console.error('Error moving card:', error);
      // Ideally revert here
    }
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

    // Apply updates
    const currentVitals = character.vitals;
    
    const newVitals = {
      ...currentVitals,
      armor_score: newArmorScore,
      // Clamp current armor if it exceeds max
      armor_slots: Math.min(currentVitals.armor_slots, newArmorScore)
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
        damage_thresholds: newThresholds
      } : null
    }));

    const supabase = createClient();
    await supabase
      .from('characters')
      .update({ 
        vitals: newVitals,
        // We need to store thresholds too if we want them persistent, 
        // or we assume they are always recalculated. 
        // But for now, let's update vitals.
        // If damage_thresholds isn't a column, we might need to store it in vitals or another jsonb.
        // Given we can't easily add columns, let's assume we just calculate them client side 
        // BUT the interface requires them. Let's store them in `stats` or just keep in state?
        // Ideally we save them. Let's try to save them in a 'derived_stats' or similar if it existed.
        // For now, we just update vitals in DB. Thresholds are derived, so recalculating on load is fine.
      })
      .eq('id', character.id);
  },

  updateGold: async (denomination, value) => {
    const state = get();
    if (!state.character) return;

    const newValue = Math.max(0, value); // Ensure no negative gold
    const newGold = { ...state.character.gold, [denomination]: newValue };

    // Optimistically update UI
    set((s) => ({
      character: s.character ? { ...s.character, gold: newGold } : null,
    }));

    // Persist to DB
    const supabase = createClient();
    // Gold is stored as JSONB, so we need to update the whole object
    // But supabase .update() merges top-level keys.
    // However, 'gold' is a single column.
    // We need to stringify it if it's stored as JSONB in our interface but text in logic?
    // Looking at fetchCharacter, gold is parsed: `typeof charData.gold === 'string' ? JSON.parse(charData.gold) : charData.gold`
    // So we should send it as an object, supabase client handles JSONB serialization.

    const { error } = await supabase
      .from('characters')
      .update({ gold: newGold })
      .eq('id', state.character.id);

    if (error) {
      console.error('Error updating gold:', error);
      // Ideally revert here
    }
  },

  updateHope: async (value) => {
    const state = get();
    if (!state.character) return;

    const newHope = Math.min(6, Math.max(0, value)); // Clamp between 0 and 6

    // Optimistically update UI
    set((s) => ({
      character: s.character ? { ...s.character, hope: newHope } : null,
    }));

    // Persist to DB
    const supabase = createClient();
    const { error } = await supabase
      .from('characters')
      .update({ hope: newHope })
      .eq('id', state.character.id);

    if (error) {
      console.error('Error updating hope:', error);
      // Ideally revert here
    }
  },

  updateEvasion: async (value) => {
    const state = get();
    if (!state.character) return;

    // Evasion can theoretically be negative (though unlikely), but let's clamp to 0 for sanity?
    // Daggerheart doesn't explicitly forbid negative, but 0 is a safe floor.
    const newEvasion = Math.max(0, value);

    // Optimistically update UI
    set((s) => ({
      character: s.character ? { ...s.character, evasion: newEvasion } : null,
    }));

    // Persist to DB
    const supabase = createClient();
    const { error } = await supabase
      .from('characters')
      .update({ evasion: newEvasion })
      .eq('id', state.character.id);

    if (error) {
      console.error('Error updating evasion:', error);
      // Ideally revert here
    }
  },

  updateModifiers: async (stat, modifiers) => {
    const state = get();
    if (!state.character) return;

    // Clone existing modifiers object or create new
    const currentModifiers = { ...state.character.modifiers } || {};
    currentModifiers[stat] = modifiers;

    // Optimistically update UI
    set((s) => ({
      character: s.character ? { ...s.character, modifiers: currentModifiers } : null,
    }));

    // Persist to DB
    const supabase = createClient();
    const { error } = await supabase
      .from('characters')
      .update({ modifiers: currentModifiers })
      .eq('id', state.character.id);

    if (error) {
      console.error('Error updating modifiers:', error);
      return; // Don't recalculate if DB update failed
    }

    // Trigger recalculation after modifier change
    await get().recalculateDerivedStats();
  },

  equipItem: async (itemId, slot) => {
    const state = get();
    if (!state.character) return;

    const inventory = [...(state.character.character_inventory || [])];
    const itemIndex = inventory.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const itemToEquip = { ...inventory[itemIndex] };
    const updates: { id: string; location: string }[] = [];

    // If we are equipping to a slot (not unequipped to backpack)
    if (slot !== 'backpack') {
      // Check if something is already in that slot
      const existingItemIndex = inventory.findIndex(i => i.location === slot);
      if (existingItemIndex !== -1) {
        // Move existing item to backpack
        const existingItem = { ...inventory[existingItemIndex], location: 'backpack' as const };
        inventory[existingItemIndex] = existingItem;
        updates.push({ id: existingItem.id, location: 'backpack' });
      }
    }

    // Update the target item location
    itemToEquip.location = slot;
    inventory[itemIndex] = itemToEquip;
    updates.push({ id: itemToEquip.id, location: slot });

    // Optimistically update UI
    set((s) => ({
      character: s.character ? { ...s.character, character_inventory: inventory } : null,
    }));

    // Persist to DB
    const supabase = createClient();
    for (const update of updates) {
      const { error } = await supabase
        .from('character_inventory')
        .update({ location: update.location })
        .eq('id', update.id);
      
      if (error) {
        console.error('Error updating inventory location:', error);
        // Ideally revert here
      }
    }

    // Trigger stat recalculation after equipment change
    await get().recalculateDerivedStats();
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

    // Calculate initial damage thresholds (default if not stored)
    // We could call recalculateDerivedStats after set, but calculating basic here is safer
    const minor = 1;
    const major = charData.level;
    const severe = charData.level * 2;
    
    // Note: Real recalculation happens via recalculateDerivedStats() action, 
    // but we need initial state. Use base unarmored values.
    const damage_thresholds = {
      minor,
      major,
      severe
    };

    const fullCharacter = {
      ...charData,
      character_cards: enrichedCards,
      character_inventory: enrichedInventory,
      class_data: classData,
      stats: typeof charData.stats === 'string' ? JSON.parse(charData.stats) : charData.stats,
      vitals,
      damage_thresholds, // Injected property
      gold: typeof charData.gold === 'string' ? JSON.parse(charData.gold) : charData.gold,
    };

    set({ character: fullCharacter as Character, isLoading: false });
    
    // Trigger a recalculation to ensure thresholds and armor bonuses are correct based on inventory
    setTimeout(() => get().recalculateDerivedStats(), 0);
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

    // Optimistically update UI
    set((s) => ({
      character: s.character ? { ...s.character, vitals: updatedVitals } : null,
    }));

    // Persist to DB
    const supabase = createClient();
    const { error } = await supabase
      .from('characters')
      .update({ vitals: updatedVitals })
      .eq('id', state.character.id);

    if (error) {
      console.error('Error updating vitals:', error);
      // TODO: Revert optimistic update if DB update fails
    }
  },
}));