import createClient from '@/lib/supabase/client';
import { DataClient } from '@/types/data-client';
import { Character, LibraryItem, HomebrewItem, CharacterInventoryItem, Experience } from '@/types/character';
import type { Campaign, CampaignWithMembers } from '@/types/campaign';
import type { CampaignActivity, CampaignActivityInsert } from '@/types/activity';
import { hydrateCharacter } from '@/lib/data-helpers';

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

      const hydratedChar = hydrateCharacter(charData);

      return {
        ...hydratedChar,
        character_cards: enrichedCards,
        character_inventory: enrichedInventory,
        class_data: charData.class_id ? libraryMap.get(`class-${charData.class_id.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')}`) : undefined,
        subclass_data: charData.subclass_id ? libraryMap.get(`subclass-${charData.subclass_id.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')}`) : undefined,
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
      return (data || []).map((charRaw: any) => hydrateCharacter(charRaw));
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
  },

  campaign: {
    create: async (data) => {
      const supabase = createClient();
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert(data)
        .select()
        .single();

      if (error) throw new Error(`Failed to create campaign: ${error.message}`);

      // Also create a campaign_member entry for the GM
      const { error: memberError } = await supabase
        .from('campaign_members')
        .insert({
          campaign_id: campaign.id,
          user_id: data.gm_user_id,
          role: 'gm',
        });

      if (memberError) {
        // Rollback campaign creation
        await supabase.from('campaigns').delete().eq('id', campaign.id);
        throw new Error(`Failed to add GM as member: ${memberError.message}`);
      }

      return campaign;
    },

    get: async (id) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new Error(`Failed to fetch campaign: ${error.message}`);
      }

      return data;
    },

    getWithMembers: async (id) => {
      const supabase = createClient();

      // Step 1: Get campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (campaignError) {
        if (campaignError.code === 'PGRST116') return null;
        throw new Error(`Failed to fetch campaign with members: ${campaignError.message}`);
      }

      if (!campaign) return null;

      // Step 2: Get members with characters
      const { data: members, error: membersError } = await supabase
        .from('campaign_members')
        .select(`
          *,
          character:characters(name, level, class_id, ancestry)
        `)
        .eq('campaign_id', id)
        .order('joined_at', { ascending: true });

      if (membersError) {
        throw new Error(`Failed to fetch campaign members: ${membersError.message}`);
      }

      // Step 3: Get profiles for members
      const userIds = (members || []).map((m: any) => m.user_id);
      let profileMap = new Map();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      }

      // Step 4: Combine members with profiles
      const enrichedMembers = (members || []).map((m: any) => ({
        ...m,
        profile: profileMap.get(m.user_id) || null,
      }));

      return {
        ...campaign,
        members: enrichedMembers,
        member_count: enrichedMembers.length,
      } as CampaignWithMembers;
    },

    list: async (userId) => {
      const supabase = createClient();

      // Get campaigns where user is GM or a member
      const { data: memberData, error: memberError } = await supabase
        .from('campaign_members')
        .select('campaign_id')
        .eq('user_id', userId);

      if (memberError) throw new Error(`Failed to fetch user campaigns: ${memberError.message}`);

      const campaignIds = memberData?.map(m => m.campaign_id) || [];

      if (campaignIds.length === 0) {
        // Check if user is GM of any campaigns
        const { data: gmData, error: gmError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('gm_user_id', userId)
          .order('created_at', { ascending: false });

        if (gmError) throw new Error(`Failed to list campaigns: ${gmError.message}`);
        return gmData || [];
      }

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .in('id', campaignIds)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Failed to list campaigns: ${error.message}`);
      return data || [];
    },

    update: async (id, updates) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('campaigns')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update campaign: ${error.message}`);
      return data;
    },

    delete: async (id) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Failed to delete campaign: ${error.message}`);
    },

    getMembers: async (campaignId) => {
      const supabase = createClient();

      // Step 1: Get members with characters
      const { data: members, error } = await supabase
        .from('campaign_members')
        .select(`
          *,
          character:characters(name, level, class_id, ancestry)
        `)
        .eq('campaign_id', campaignId)
        .order('joined_at', { ascending: true });

      if (error) throw new Error(`Failed to fetch campaign members: ${error.message}`);

      if (!members || members.length === 0) return [];

      // Step 2: Get profiles for members
      const userIds = members.map((m: any) => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      // Step 3: Combine members with profiles
      return members.map((m: any) => ({
        ...m,
        profile: profileMap.get(m.user_id) || null,
      }));
    },

    addMember: async (data) => {
      const supabase = createClient();
      const { data: member, error } = await supabase
        .from('campaign_members')
        .insert(data)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('User is already a member of this campaign');
        }
        throw new Error(`Failed to add campaign member: ${error.message}`);
      }

      return member;
    },

    updateMember: async (id, updates) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('campaign_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update campaign member: ${error.message}`);
      return data;
    },

    removeMember: async (id) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('campaign_members')
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Failed to remove campaign member: ${error.message}`);
    },

    findByInviteCode: async (inviteCode) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Failed to find campaign by invite code: ${error.message}`);
      }

      return data;
    },

    joinByInviteCode: async (inviteCode, userId, characterId) => {
      const supabase = createClient();

      // First, find the campaign
      const campaign = await dataService.campaign.findByInviteCode(inviteCode);
      if (!campaign) {
        throw new Error('Invalid invite code');
      }

      // Check if user is already a member
      const { data: existing } = await supabase
        .from('campaign_members')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('user_id', userId)
        .single();

      if (existing) {
        throw new Error('You are already a member of this campaign');
      }

      // Add member
      return dataService.campaign.addMember({
        campaign_id: campaign.id,
        user_id: userId,
        character_id: characterId,
        role: 'player',
      });
    },

    transferGM: async (campaignId, newGmUserId) => {
      const supabase = createClient();

      // 1. Get current GM
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('gm_user_id')
        .eq('id', campaignId)
        .single();

      if (!campaign) throw new Error('Campaign not found');

      const oldGmUserId = campaign.gm_user_id;

      // 2. Update campaign GM
      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({ gm_user_id: newGmUserId })
        .eq('id', campaignId);

      if (campaignError) throw new Error(`Failed to transfer GM: ${campaignError.message}`);

      // 3. Update old GM's role to player
      const { error: oldGmError } = await supabase
        .from('campaign_members')
        .update({ role: 'player' })
        .eq('campaign_id', campaignId)
        .eq('user_id', oldGmUserId);

      if (oldGmError) console.error('Failed to update old GM role:', oldGmError);

      // 4. Update new GM's role (or create entry if they're not a member yet)
      const { data: newGmMember } = await supabase
        .from('campaign_members')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('user_id', newGmUserId)
        .single();

      if (newGmMember) {
        await supabase
          .from('campaign_members')
          .update({ role: 'gm' })
          .eq('id', newGmMember.id);
      } else {
        await supabase
          .from('campaign_members')
          .insert({
            campaign_id: campaignId,
            user_id: newGmUserId,
            role: 'gm',
          });
      }
    },

    // =========================================================================
    // PHASE 2: GM SCREEN METHODS
    // =========================================================================

    getPartyCharacters: async (campaignId: string): Promise<Character[]> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('campaign_members')
        .select(`
          character_id,
          characters!campaign_members_character_id_fkey(*)
        `)
        .eq('campaign_id', campaignId)
        .not('character_id', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch party characters: ${error.message}`);
      }

      // Extract and filter out null characters
      return (data?.map((m: any) => m.characters).filter(Boolean) || []) as Character[];
    },

    gmAdjustVital: async (
      characterId: string,
      vital: 'hp' | 'stress' | 'armor' | 'hope',
      newValue: number
    ): Promise<void> => {
      const supabase = createClient();

      // Map vital names to database columns
      const vitalMap = {
        hp: 'vitals.hit_points_current',
        stress: 'vitals.stress_current',
        armor: 'vitals.armor_remaining',
        hope: 'hope',
      };

      // For nested vitals, we need to update the entire vitals object
      if (vital === 'hp' || vital === 'stress' || vital === 'armor') {
        // First get current vitals
        const { data: char, error: fetchError } = await supabase
          .from('characters')
          .select('vitals')
          .eq('id', characterId)
          .single();

        if (fetchError) throw new Error(`Failed to fetch character: ${fetchError.message}`);

        // Update the specific vital
        const updatedVitals = { ...char.vitals };
        if (vital === 'hp') updatedVitals.hit_points_current = newValue;
        if (vital === 'stress') updatedVitals.stress_current = newValue;
        if (vital === 'armor') updatedVitals.armor_remaining = newValue;

        const { error } = await supabase
          .from('characters')
          .update({ vitals: updatedVitals })
          .eq('id', characterId);

        if (error) throw new Error(`Failed to adjust ${vital}: ${error.message}`);
      } else {
        // Hope is a direct column
        const { error } = await supabase
          .from('characters')
          .update({ hope: newValue })
          .eq('id', characterId);

        if (error) throw new Error(`Failed to adjust ${vital}: ${error.message}`);
      }
    },

    updateFear: async (campaignId: string, change: number): Promise<Campaign> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('update_campaign_fear', {
        campaign_id_param: campaignId,
        change_amount: change,
        gm_user_id_param: user.id,
      });

      if (error) {
        throw new Error(`Failed to update Fear: ${error.message}`);
      }

      return data as Campaign;
    },

    // =========================================================================
    // PHASE 3: ACTIVITY FEED METHODS
    // =========================================================================

    logActivity: async (activity: CampaignActivityInsert): Promise<CampaignActivity> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('campaign_activity')
        .insert(activity)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to log activity: ${error.message}`);
      }

      return data as CampaignActivity;
    },

    getActivity: async (
      campaignId: string,
      limit: number = 50,
      offset: number = 0
    ): Promise<CampaignActivity[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('campaign_activity')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch activity: ${error.message}`);
      }

      return (data || []) as CampaignActivity[];
    },

    getActivityCount: async (campaignId: string): Promise<number> => {
      const supabase = createClient();
      const { count, error } = await supabase
        .from('campaign_activity')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId);

      if (error) {
        throw new Error(`Failed to count activity: ${error.message}`);
      }

      return count || 0;
    },

    getCampaignForCharacter: async (characterId: string): Promise<Campaign | null> => {
      const supabase = createClient();

      // Find the campaign_members entry where this character is assigned
      const { data: membership, error: memberError } = await supabase
        .from('campaign_members')
        .select('campaign_id')
        .eq('character_id', characterId)
        .maybeSingle();

      if (memberError) {
        throw new Error(`Failed to find campaign for character: ${memberError.message}`);
      }

      if (!membership) return null;

      // Fetch the campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', membership.campaign_id)
        .single();

      if (campaignError) {
        if (campaignError.code === 'PGRST116') return null;
        throw new Error(`Failed to fetch campaign: ${campaignError.message}`);
      }

      return campaign;
    },

    // =========================================================================
    // PHASE 9: COUNTDOWNS & PROJECTS
    // =========================================================================

    updateCountdowns: async (campaignId: string, countdowns: any[]): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from('campaigns')
        .update({ countdowns })
        .eq('id', campaignId);

      if (error) {
        throw new Error(`Failed to update countdowns: ${error.message}`);
      }
    },

    updateProjects: async (campaignId: string, projects: any[]): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from('campaigns')
        .update({ projects })
        .eq('id', campaignId);

      if (error) {
        throw new Error(`Failed to update projects: ${error.message}`);
      }
    },
  },

  // =========================================================================
  // PHASE 7: FRIENDSHIPS
  // =========================================================================

  friendship: {
    findByCode: async (friendCode: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .rpc('find_user_by_friend_code', { friend_code_param: friendCode.toUpperCase() });

      if (error) {
        throw new Error(`Failed to find user by friend code: ${error.message}`);
      }

      if (!data || data.length === 0) return null;
      return data[0];
    },

    sendRequest: async (recipientId: string) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(requester_id.eq.${user.id},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${user.id})`)
        .single();

      if (existing) {
        if (existing.status === 'accepted') {
          throw new Error('You are already friends with this user');
        } else if (existing.status === 'pending') {
          throw new Error('A friend request already exists');
        } else if (existing.status === 'blocked') {
          throw new Error('Cannot send friend request');
        }
      }

      const { data, error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          recipient_id: recipientId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('allow_friend_requests')) {
          throw new Error('This user is not accepting friend requests');
        }
        throw new Error(`Failed to send friend request: ${error.message}`);
      }

      return data;
    },

    cancelRequest: async (friendshipId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)
        .eq('status', 'pending');

      if (error) {
        throw new Error(`Failed to cancel friend request: ${error.message}`);
      }
    },

    acceptRequest: async (friendshipId: string) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)
        .eq('recipient_id', user.id) // Only recipient can accept
        .eq('status', 'pending')
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to accept friend request: ${error.message}`);
      }

      return data;
    },

    declineRequest: async (friendshipId: string) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('friendships')
        .update({ status: 'declined' })
        .eq('id', friendshipId)
        .eq('recipient_id', user.id)
        .eq('status', 'pending');

      if (error) {
        throw new Error(`Failed to decline friend request: ${error.message}`);
      }
    },

    getFriends: async (userId: string) => {
      const supabase = createClient();

      // Step 1: Get accepted friendships where user is either requester or recipient
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('id, requester_id, recipient_id, created_at')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

      if (error) {
        throw new Error(`Failed to get friends: ${error.message}`);
      }

      if (!friendships || friendships.length === 0) {
        return [];
      }

      // Step 2: Get all unique user IDs (friends)
      const friendUserIds = new Set<string>();
      for (const f of friendships) {
        if (f.requester_id !== userId) friendUserIds.add(f.requester_id);
        if (f.recipient_id !== userId) friendUserIds.add(f.recipient_id);
      }

      // Step 3: Get profile data for all friends
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, friend_code')
        .in('id', Array.from(friendUserIds));

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      // Step 4: Transform to Friend[] format
      return friendships.map((f) => {
        const isRequester = f.requester_id === userId;
        const friendUserId = isRequester ? f.recipient_id : f.requester_id;
        const friendProfile = profileMap.get(friendUserId);

        return {
          user_id: friendUserId,
          username: friendProfile?.username || null,
          avatar_url: friendProfile?.avatar_url || null,
          friend_code: friendProfile?.friend_code || null,
          friendship_id: f.id,
          is_requester: isRequester,
          since: f.created_at,
        };
      });
    },

    getPendingRequests: async (userId: string) => {
      const supabase = createClient();

      // Step 1: Get pending friendships
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('id, requester_id, created_at')
        .eq('recipient_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get pending requests: ${error.message}`);
      }

      if (!friendships || friendships.length === 0) {
        return [];
      }

      // Step 2: Get profile data for requesters
      const requesterIds = friendships.map((f) => f.requester_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', requesterIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      // Step 3: Combine data
      return friendships.map((f) => {
        const profile = profileMap.get(f.requester_id);
        return {
          id: f.id,
          from: {
            user_id: f.requester_id,
            username: profile?.username || null,
            avatar_url: profile?.avatar_url || null,
          },
          created_at: f.created_at,
        };
      });
    },

    getOutgoingRequests: async (userId: string) => {
      const supabase = createClient();

      // Step 1: Get outgoing friendships
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('id, recipient_id, created_at')
        .eq('requester_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get outgoing requests: ${error.message}`);
      }

      if (!friendships || friendships.length === 0) {
        return [];
      }

      // Step 2: Get profile data for recipients
      const recipientIds = friendships.map((f) => f.recipient_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', recipientIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      // Step 3: Combine data
      return friendships.map((f) => {
        const profile = profileMap.get(f.recipient_id);
        return {
          id: f.id,
          to: {
            user_id: f.recipient_id,
            username: profile?.username || null,
            avatar_url: profile?.avatar_url || null,
          },
          created_at: f.created_at,
        };
      });
    },

    unfriend: async (friendshipId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) {
        throw new Error(`Failed to unfriend: ${error.message}`);
      }
    },

    block: async (friendshipId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('friendships')
        .update({ status: 'blocked' })
        .eq('id', friendshipId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to block user: ${error.message}`);
      }

      return data;
    },

    checkFriendship: async (userId: string, otherUserId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .rpc('check_friendship_exists', { user_a: userId, user_b: otherUserId });

      if (error) {
        throw new Error(`Failed to check friendship: ${error.message}`);
      }

      if (!data || data.length === 0 || !data[0].exists_val) {
        return { exists: false };
      }

      return {
        exists: true,
        friendshipId: data[0].friendship_id,
        status: data[0].status,
      };
    },
  },
};
