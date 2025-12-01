import { create } from 'zustand';
import createClient from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

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
    hp_max: number;
    hp_current: number;
    stress_max: number;
    stress_current: number;
    armor_max: number;
    armor_current: number;
  };
  hope: number;
  fear: number;
  evasion: number;
  proficiency: number;
  experiences: string[];
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
  type: 'Critical' | 'Hope' | 'Fear';
}

interface CharacterState {
  character: Character | null;
  isLoading: boolean;
  user: User | null;

  activeTab: 'character' | 'playmat' | 'inventory' | 'combat';
  isDiceOverlayOpen: boolean;
  activeRoll: { label: string; modifier: number } | null;
  lastRollResult: RollResult | null;

  setCharacter: (char: Character | null) => void;
  setUser: (user: User | null) => void;
  setActiveTab: (tab: 'character' | 'playmat' | 'inventory' | 'combat') => void;
  openDiceOverlay: () => void;
  closeDiceOverlay: () => void;
  prepareRoll: (label: string, modifier: number) => void;
  setLastRollResult: (result: RollResult) => void;
  fetchCharacter: (userId: string, characterId?: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  switchCharacter: (characterId: string) => Promise<void>;

  updateVitals: (type: 'hp_current' | 'stress_current' | 'armor_current', value: number) => Promise<void>;
  equipItem: (itemId: string, slot: 'equipped_primary' | 'equipped_secondary' | 'equipped_armor' | 'backpack') => Promise<void>;
  addItemToInventory: (item: LibraryItem) => Promise<void>;
  recalculateDerivedStats: () => Promise<void>;
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
  prepareRoll: (label, modifier) => set({ isDiceOverlayOpen: true, activeRoll: { label, modifier } }),
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

    // 1. Base Score from Armor
    if (equippedArmor?.library_item?.data?.base_score) {
      newArmorScore += parseInt(equippedArmor.library_item.data.base_score) || 0;
    }
    // Add Level Bonus to Armor Score if wearing armor (assuming standard rule)
    // SRD says "Base Score" + permanent bonuses.
    // Usually Armor Score = Base Score + Level (if armor equipped) is NOT a standard rule, but usually specific armor stats scale or character levels grant bonuses.
    // Wait, SRD armor tables show base score scaling with Tier.
    // Let's stick to Item Stats.
    // HOWEVER, some classes/subclasses/abilities might give bonuses. We are only checking Items for now.

    // 2. Scan equipped items for bonuses
    const checkItemForBonus = (item: CharacterInventoryItem | undefined) => {
      if (!item?.library_item?.data) return;
      const featureText = item.library_item.data.feature?.text || '';
      const featText = item.library_item.data.feat_text || ''; // Some might store it here
      const combinedText = `${featureText} ${featText}`;

      // Regex for "+X to Armor Score"
      const armorBonusMatch = combinedText.match(/([+-]?\d+)\s+to\s+Armor\s+Score/i);
      if (armorBonusMatch) {
        newArmorScore += parseInt(armorBonusMatch[1]);
      }
    };

    checkItemForBonus(equippedArmor); // Armor itself might have a bonus feature? Unlikely but possible.
    checkItemForBonus(equippedPrimary);
    checkItemForBonus(equippedSecondary);

    // Apply updates
    const currentVitals = character.vitals;
    if (currentVitals.armor_max !== newArmorScore) {
      const newVitals = {
        ...currentVitals,
        armor_max: newArmorScore,
        // Clamp current armor if it exceeds max
        armor_current: Math.min(currentVitals.armor_current, newArmorScore)
      };

      set((s) => ({
        character: s.character ? { ...s.character, vitals: newVitals } : null
      }));

      const supabase = createClient();
      await supabase
        .from('characters')
        .update({ vitals: newVitals })
        .eq('id', character.id);
    }
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
      // Assuming class_id stored in charData is actually the name (e.g., 'Bard') or partial ID
      // Our library IDs are 'class-bard'. If charData.class_id is 'Bard', we might need to slugify.
      // However, creating character saves the library NAME ('Bard').
      // We need to find the library item where type='class' and name=charData.class_id
      // OR we update create-character to save the ID.
      // Given current state, let's try to find by ID 'class-[slug]' first.
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


    const fullCharacter = {
      ...charData,
      character_cards: enrichedCards,
      character_inventory: enrichedInventory,
      class_data: classData,
      stats: typeof charData.stats === 'string' ? JSON.parse(charData.stats) : charData.stats,
      vitals: typeof charData.vitals === 'string' ? JSON.parse(charData.vitals) : charData.vitals,
      gold: typeof charData.gold === 'string' ? JSON.parse(charData.gold) : charData.gold,
    };

    set({ character: fullCharacter as Character, isLoading: false });
  },

  updateVitals: async (type, value) => {
    const state = get();
    if (!state.character) return;

    const newVitals = { ...state.character.vitals };
    let actualValue = value;

    if (type === 'hp_current') actualValue = Math.min(newVitals.hp_max, Math.max(0, value));
    if (type === 'stress_current') actualValue = Math.min(newVitals.stress_max, Math.max(0, value));
    if (type === 'armor_current') actualValue = Math.min(newVitals.armor_max, Math.max(0, value));

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