import createClient from '@/lib/supabase/client';
import { DataClient } from '@/types/data-client';
import { Character, LibraryItem, HomebrewItem, CharacterInventoryItem, Experience } from '@/types/character';

// Helper to construct the service
export const dataService: DataClient = {
  character: {
    get: async (userId: string, characterId?: string) => {
      const supabase = createClient();
      let charData;

      if (characterId) {
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('id', characterId)
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;
        charData = data;
      } else {
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        charData = data;
      }

      if (!charData) return null;

      // Manual Join Logic (replicated from original slice)
      const { data: cardsData } = await supabase
        .from('character_cards')
        .select('*')
        .eq('character_id', charData.id);

      const { data: inventoryData } = await supabase
        .from('character_inventory')
        .select('*')
        .eq('character_id', charData.id);

      const libraryIds = new Set<string>();
      const homebrewIds = new Set<string>();

      cardsData?.forEach((c: any) => libraryIds.add(c.card_id));
      inventoryData?.forEach((i: any) => {
        if (i.item_id) libraryIds.add(i.item_id);
        if (i.homebrew_item_id) homebrewIds.add(i.homebrew_item_id);
      });

      if (charData.class_id) {
        libraryIds.add(`class-${charData.class_id.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')}`);
      }
      if (charData.subclass_id) {
        libraryIds.add(`subclass-${charData.subclass_id.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')}`);
      }

      const libraryMap = new Map<string, LibraryItem>();
      if (libraryIds.size > 0) {
        const { data: libData } = await supabase
          .from('library')
          .select('*')
          .in('id', Array.from(libraryIds));

        libData?.forEach((item: LibraryItem) => libraryMap.set(item.id, item));
      }

      const homebrewMap = new Map<string, HomebrewItem>();
      if (homebrewIds.size > 0) {
        const { data: hbData } = await supabase
          .from('homebrew_items')
          .select('*')
          .in('id', Array.from(homebrewIds));

        hbData?.forEach((item: HomebrewItem) => homebrewMap.set(item.id, item));
      }

      const enrichedCards = cardsData?.map((card: any) => ({
        ...card,
        library_item: libraryMap.get(card.card_id)
      })) || [];

      const enrichedInventory = inventoryData?.map((item: any) => {
        let libraryItem = item.item_id ? libraryMap.get(item.item_id) : undefined;
        const homebrewItem = item.homebrew_item_id ? homebrewMap.get(item.homebrew_item_id) : undefined;

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

      // Parse JSON fields
      const rawVitals = typeof charData.vitals === 'string' ? JSON.parse(charData.vitals) : charData.vitals;
      const vitals = {
        hit_points_current: rawVitals.hit_points_current ?? rawVitals.hp_current ?? 0,
        hit_points_max: rawVitals.hit_points_max ?? rawVitals.hp_max ?? 6,
        stress_current: rawVitals.stress_current ?? 0,
        stress_max: rawVitals.stress_max ?? 6,
        armor_slots: rawVitals.armor_slots ?? rawVitals.armor_current ?? 0,
        armor_score: rawVitals.armor_score ?? rawVitals.armor_max ?? 0
      };

      let experiences: Experience[] = [];
      const rawExperiences = typeof charData.experiences === 'string' ? JSON.parse(charData.experiences) : charData.experiences;
      if (Array.isArray(rawExperiences)) {
        experiences = rawExperiences.length > 0 && typeof rawExperiences[0] === 'string'
          ? rawExperiences.map((name: string) => ({ name, value: 2 }))
          : rawExperiences;
      }

      let damage_thresholds;
      if (charData.damage_thresholds) {
        damage_thresholds = typeof charData.damage_thresholds === 'string'
          ? JSON.parse(charData.damage_thresholds)
          : charData.damage_thresholds;
      } else {
        damage_thresholds = { minor: 1, major: charData.level, severe: charData.level * 2 };
      }

      return {
        ...charData,
        character_cards: enrichedCards,
        character_inventory: enrichedInventory,
        class_data: charData.class_id ? libraryMap.get(`class-${charData.class_id.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')}`) : undefined,
        subclass_data: charData.subclass_id ? libraryMap.get(`subclass-${charData.subclass_id.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')}`) : undefined,
        stats: typeof charData.stats === 'string' ? JSON.parse(charData.stats) : charData.stats,
        vitals,
        damage_thresholds,
        gold: typeof charData.gold === 'string' ? JSON.parse(charData.gold) : charData.gold,
        experiences,
      } as Character;
    },

    update: async (characterId, data) => {
      const supabase = createClient();
      const { error } = await supabase.from('characters').update(data).eq('id', characterId);
      if (error) throw error;
    },

    updateVitals: async (characterId, vitals, damageThresholds, evasion) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('characters')
        .update({
          vitals,
          damage_thresholds: damageThresholds,
          evasion
        })
        .eq('id', characterId);
      if (error) throw error;
    },

    list: async (userId) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;

      // Parse JSON fields for each character
      return (data || []).map((charRaw: any) => ({
        ...charRaw,
        stats: typeof charRaw.stats === 'string' ? JSON.parse(charRaw.stats) : charRaw.stats,
        vitals: typeof charRaw.vitals === 'string' ? JSON.parse(charRaw.vitals) : charRaw.vitals,
        damage_thresholds: typeof charRaw.damage_thresholds === 'string' ? JSON.parse(charRaw.damage_thresholds) : charRaw.damage_thresholds,
        experiences: typeof charRaw.experiences === 'string' ? JSON.parse(charRaw.experiences) : charRaw.experiences,
        modifiers: typeof charRaw.modifiers === 'string' ? JSON.parse(charRaw.modifiers) : charRaw.modifiers,
        gold: typeof charRaw.gold === 'string' ? JSON.parse(charRaw.gold) : charRaw.gold,
        gallery_images: typeof charRaw.gallery_images === 'string' ? JSON.parse(charRaw.gallery_images) : charRaw.gallery_images,
        domains: typeof charRaw.domains === 'string' ? JSON.parse(charRaw.domains) : charRaw.domains,
        marked_traits_jsonb: typeof charRaw.marked_traits_jsonb === 'string' ? JSON.parse(charRaw.marked_traits_jsonb) : charRaw.marked_traits_jsonb,
        advancement_history_jsonb: typeof charRaw.advancement_history_jsonb === 'string' ? JSON.parse(charRaw.advancement_history_jsonb) : charRaw.advancement_history_jsonb,
        subclass_progression: typeof charRaw.subclass_progression === 'string' ? JSON.parse(charRaw.subclass_progression) : charRaw.subclass_progression,
        multiclass_progression: typeof charRaw.multiclass_progression === 'string' ? JSON.parse(charRaw.multiclass_progression) : charRaw.multiclass_progression,
      }));
    },

    create: async (payload) => {
      const supabase = createClient();
      const { character, cards, inventory } = payload;

      // Insert character
      const { data: charData, error: charError } = await supabase
        .from('characters')
        .insert(character)
        .select()
        .single();

      if (charError) throw charError;
      const characterId = charData.id;

      // Insert cards if any
      if (cards && cards.length > 0) {
        const cardsToInsert = cards.map((c: any) => ({
          ...c,
          character_id: characterId
        }));
        const { error: cardsError } = await supabase
          .from('character_cards')
          .insert(cardsToInsert);
        if (cardsError) throw cardsError;
      }

      // Insert inventory if any
      if (inventory && inventory.length > 0) {
        const inventoryToInsert = inventory.map((i: any) => ({
          ...i,
          character_id: characterId
        }));
        const { error: invError } = await supabase
          .from('character_inventory')
          .insert(inventoryToInsert);
        if (invError) throw invError;
      }

      return characterId;
    },

    delete: async (characterId) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', characterId);
      if (error) throw error;
    },

    count: async (userId) => {
      const supabase = createClient();
      const { count, error } = await supabase
        .from('characters')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (error) throw error;
      return count || 0;
    }
  },

  inventory: {
    add: async (characterId, item) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('character_inventory')
        .insert({ ...item, character_id: characterId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    remove: async (itemId) => {
      const supabase = createClient();
      const { error } = await supabase.from('character_inventory').delete().eq('id', itemId);
      if (error) throw error;
    },
    update: async (itemId, updates) => {
      const supabase = createClient();
      const { error } = await supabase.from('character_inventory').update(updates).eq('id', itemId);
      if (error) throw error;
    },
    batchUpdate: async (updates) => {
      const supabase = createClient();
      // Supabase doesn't have a great batch update for different rows with different values in one query
      // typically. We'll parallelize promises.
      await Promise.all(updates.map(u =>
        supabase.from('character_inventory').update(u.updates).eq('id', u.id)
      ));
    },
    equip: async (updates) => {
      const supabase = createClient();
      const { error } = await supabase.rpc('swap_equipment_items', {
        updates_json: updates
      });
      if (error) throw error;
    }
  },

  card: {
    add: async (characterId, cardId, location = 'vault') => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('character_cards')
        .insert([{ character_id: characterId, card_id: cardId, location, state: {}, sort_order: 0 }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    remove: async (cardId) => {
      const supabase = createClient();
      const { error } = await supabase.from('character_cards').delete().eq('id', cardId);
      if (error) throw error;
    },
    update: async (cardId, updates) => {
      const supabase = createClient();
      const { error } = await supabase.from('character_cards').update(updates).eq('id', cardId);
      if (error) throw error;
    }
  },

  library: {
    get: async (id) => {
      const supabase = createClient();
      const { data, error } = await supabase.from('library').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    search: async (query, type, options?: { includePlaytest?: boolean; enabledSources?: string[] }) => {
      const supabase = createClient();
      let q = supabase.from('library').select('*').ilike('name', `%${query}%`);
      if (type) q = q.eq('type', type);

      // Filter by source
      if (options?.enabledSources) {
        q = q.in('source', options.enabledSources);
      } else if (!options?.includePlaytest) {
        q = q.eq('source', 'srd');
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    getByType: async (type, options?: { includePlaytest?: boolean; enabledSources?: string[] }) => {
      const supabase = createClient();
      let q = supabase
        .from('library')
        .select('*')
        .eq('type', type);

      // Filter by source
      if (options?.enabledSources) {
        q = q.in('source', options.enabledSources);
      } else if (!options?.includePlaytest) {
        q = q.eq('source', 'srd');
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    getAll: async (options?: { includePlaytest?: boolean; enabledSources?: string[] }) => {
      const supabase = createClient();
      let q = supabase
        .from('library')
        .select('*');

      // Filter by source
      if (options?.enabledSources) {
        q = q.in('source', options.enabledSources);
      } else if (!options?.includePlaytest) {
        q = q.eq('source', 'srd');
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    // Get content filtered by user's content access settings
    getByTypeForUser: async (type: string, userId: string) => {
      const supabase = createClient();

      // Get user's content access settings
      const { data: profile } = await supabase
        .from('profiles')
        .select('content_access')
        .eq('id', userId)
        .single();

      const hasPlaytestAccess = profile?.content_access?.playtest ?? false;

      let q = supabase.from('library').select('*').eq('type', type);

      if (!hasPlaytestAccess) {
        q = q.eq('source', 'srd');
      }

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }
  },

  homebrew: {
    list: async (userId) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('homebrew_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    create: async (item) => {
      const supabase = createClient();
      const { data, error } = await supabase.from('homebrew_items').insert(item).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, item) => {
      const supabase = createClient();
      const { error } = await supabase.from('homebrew_items').update(item).eq('id', id);
      if (error) throw error;
    },
    delete: async (id) => {
      const supabase = createClient();
      const { error } = await supabase.from('homebrew_items').delete().eq('id', id);
      if (error) throw error;
    }
  },

  profile: {
    get: async (userId) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    create: async (userId, profile) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...profile
        });
      if (error) throw error;
    },
    update: async (userId, updates) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
      if (error) throw error;
    },
    updateContentAccess: async (userId: string, contentAccess: { srd?: boolean; playtest?: boolean; playtest_packs?: Record<string, boolean>; homebrew?: Record<string, boolean> }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ content_access: contentAccess })
        .eq('id', userId);
      if (error) throw error;
    }
  }
};
