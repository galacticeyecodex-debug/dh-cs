# Phase 1: Campaign Foundation - Implementation Plan

> **GitHub Issue**: #67  
> **Phase**: 1 of 7  
> **Estimated Effort**: 1-2 weeks  
> **Dependencies**: None  
> **Deliverable**: Users can create campaigns, share invite codes, join campaigns, and assign characters

---

## Overview

This phase establishes the foundational infrastructure for multiplayer campaigns. It focuses on CRUD operations for campaigns and membership management, without any real-time features. By the end of this phase, users should be able to:

- Create a campaign and become its GM
- Get a unique invite code
- Share that code with friends
- Join a campaign via invite code
- Assign/switch characters within a campaign
- View campaign members
- Leave or delete campaigns

---

## Database Implementation

### 1.1 Create Tables

**File**: `supabase/schema.sql`

Add the following tables to the schema file:

```sql
-- =============================================================================
-- CAMPAIGNS
-- =============================================================================

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  gm_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  fear_current INTEGER NOT NULL DEFAULT 0,
  fear_max INTEGER NOT NULL DEFAULT 10,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Generate unique 8-character invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No I, O, 0, 1 for clarity
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate invite code on insert
CREATE OR REPLACE FUNCTION set_campaign_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    LOOP
      NEW.invite_code := generate_invite_code();
      BEGIN
        -- Try to use this code (will fail if duplicate)
        PERFORM 1 FROM campaigns WHERE invite_code = NEW.invite_code;
        IF NOT FOUND THEN
          EXIT; -- Code is unique, use it
        END IF;
      END;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaign_invite_code_trigger
  BEFORE INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION set_campaign_invite_code();

-- Index for invite code lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_invite_code ON campaigns(invite_code);

-- Index for GM lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_gm ON campaigns(gm_user_id);

-- =============================================================================
-- CAMPAIGN MEMBERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS campaign_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'gm')),
  nickname TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- Index for user's campaigns lookup
CREATE INDEX IF NOT EXISTS idx_campaign_members_user ON campaign_members(user_id);
-- Index for campaign's members lookup
CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign ON campaign_members(campaign_id);

-- =============================================================================
-- RLS POLICIES: CAMPAIGNS
-- =============================================================================

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Anyone can view campaigns they're a member of (or GM of)
CREATE POLICY "Members can view their campaigns"
  ON campaigns FOR SELECT
  USING (
    gm_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM campaign_members
      WHERE campaign_id = campaigns.id
      AND user_id = auth.uid()
    )
  );

-- Only authenticated users can create campaigns
CREATE POLICY "Authenticated users can create campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND gm_user_id = auth.uid());

-- Only GM can update campaign
CREATE POLICY "GM can update campaign"
  ON campaigns FOR UPDATE
  USING (gm_user_id = auth.uid());

-- Only GM can delete campaign
CREATE POLICY "GM can delete campaign"
  ON campaigns FOR DELETE
  USING (gm_user_id = auth.uid());

-- =============================================================================
-- RLS POLICIES: CAMPAIGN MEMBERS
-- =============================================================================

ALTER TABLE campaign_members ENABLE ROW LEVEL SECURITY;

-- Members can view other members in their campaigns
CREATE POLICY "Members can view campaign members"
  ON campaign_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaign_members cm
      WHERE cm.campaign_id = campaign_members.campaign_id
      AND cm.user_id = auth.uid()
    )
  );

-- Users can join campaigns (insert themselves)
CREATE POLICY "Users can join campaigns"
  ON campaign_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own membership (e.g., change character)
CREATE POLICY "Users can update own membership"
  ON campaign_members FOR UPDATE
  USING (user_id = auth.uid());

-- GM can update any membership (e.g., kick, change roles)
CREATE POLICY "GM can update any membership"
  ON campaign_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_members.campaign_id
      AND c.gm_user_id = auth.uid()
    )
  );

-- Users can leave campaigns (delete themselves)
CREATE POLICY "Users can leave campaigns"
  ON campaign_members FOR DELETE
  USING (user_id = auth.uid());

-- GM can remove members
CREATE POLICY "GM can remove members"
  ON campaign_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_members.campaign_id
      AND c.gm_user_id = auth.uid()
    )
  );
```

### 1.2 Apply Schema Changes

```bash
# Push schema changes to Supabase
npx supabase db push

# Or if using migrations, create a new migration
npx supabase migration new campaign_foundation
# Then copy the SQL above into the migration file
```

---

## TypeScript Types

### 2.1 Create Campaign Types

**File**: `types/campaign.ts` (new file)

```typescript
export type CampaignRole = 'player' | 'gm';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  gm_user_id: string;
  invite_code: string;
  fear_current: number;
  fear_max: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CampaignInsert {
  name: string;
  description?: string;
  gm_user_id: string;
  invite_code?: string;
  fear_current?: number;
  fear_max?: number;
  settings?: Record<string, unknown>;
}

export interface CampaignUpdate {
  name?: string;
  description?: string;
  fear_current?: number;
  fear_max?: number;
  settings?: Record<string, unknown>;
}

export interface CampaignMember {
  id: string;
  campaign_id: string;
  user_id: string;
  character_id?: string;
  role: CampaignRole;
  nickname?: string;
  joined_at: string;
}

export interface CampaignMemberInsert {
  campaign_id: string;
  user_id: string;
  character_id?: string;
  role?: CampaignRole;
  nickname?: string;
}

export interface CampaignMemberUpdate {
  character_id?: string;
  nickname?: string;
}

// Enriched types (with joined data)
export interface EnrichedCampaignMember extends CampaignMember {
  profile?: {
    username: string;
    avatar_url?: string;
  };
  character?: {
    name: string;
    level: number;
    class_name?: string;
    ancestry_name?: string;
  };
}

export interface CampaignWithMembers extends Campaign {
  members: EnrichedCampaignMember[];
  member_count: number;
}
```

---

## Data Service Layer

### 3.1 Extend DataClient Interface

**File**: `lib/data-client.ts`

```typescript
import type {
  Campaign,
  CampaignInsert,
  CampaignUpdate,
  CampaignMember,
  CampaignMemberInsert,
  CampaignMemberUpdate,
  EnrichedCampaignMember,
  CampaignWithMembers,
} from '@/types/campaign';

export interface DataClient {
  // ... existing methods ...

  // Campaign methods
  campaign: {
    create(data: CampaignInsert): Promise<Campaign>;
    get(id: string): Promise<Campaign | null>;
    getWithMembers(id: string): Promise<CampaignWithMembers | null>;
    list(userId: string): Promise<Campaign[]>;
    update(id: string, data: CampaignUpdate): Promise<Campaign>;
    delete(id: string): Promise<void>;
    
    // Member management
    getMembers(campaignId: string): Promise<EnrichedCampaignMember[]>;
    addMember(data: CampaignMemberInsert): Promise<CampaignMember>;
    updateMember(id: string, data: CampaignMemberUpdate): Promise<CampaignMember>;
    removeMember(id: string): Promise<void>;
    
    // Invite code operations
    findByInviteCode(inviteCode: string): Promise<Campaign | null>;
    joinByInviteCode(inviteCode: string, userId: string, characterId?: string): Promise<CampaignMember>;
    
    // Transfer GM
    transferGM(campaignId: string, newGmUserId: string): Promise<void>;
  };
}
```

### 3.2 Implement Campaign Methods

**File**: `lib/data-service.ts`

```typescript
export class SupabaseDataService implements DataClient {
  // ... existing code ...

  campaign = {
    create: async (data: CampaignInsert): Promise<Campaign> => {
      const { data: campaign, error } = await this.client
        .from('campaigns')
        .insert(data)
        .select()
        .single();

      if (error) throw new Error(`Failed to create campaign: ${error.message}`);
      
      // Also create a campaign_member entry for the GM
      const { error: memberError } = await this.client
        .from('campaign_members')
        .insert({
          campaign_id: campaign.id,
          user_id: data.gm_user_id,
          role: 'gm',
        });

      if (memberError) {
        // Rollback campaign creation
        await this.client.from('campaigns').delete().eq('id', campaign.id);
        throw new Error(`Failed to add GM as member: ${memberError.message}`);
      }

      return campaign;
    },

    get: async (id: string): Promise<Campaign | null> => {
      const { data, error } = await this.client
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

    getWithMembers: async (id: string): Promise<CampaignWithMembers | null> => {
      const { data, error } = await this.client
        .from('campaigns')
        .select(`
          *,
          members:campaign_members(
            *,
            profile:profiles!campaign_members_user_id_fkey(username, avatar_url),
            character:characters(name, level, class_name, ancestry_name)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Failed to fetch campaign with members: ${error.message}`);
      }

      return {
        ...data,
        member_count: data.members?.length || 0,
      };
    },

    list: async (userId: string): Promise<Campaign[]> => {
      const { data, error } = await this.client
        .from('campaigns')
        .select('*')
        .or(`gm_user_id.eq.${userId},campaign_members.user_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Failed to list campaigns: ${error.message}`);
      return data || [];
    },

    update: async (id: string, updates: CampaignUpdate): Promise<Campaign> => {
      const { data, error } = await this.client
        .from('campaigns')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update campaign: ${error.message}`);
      return data;
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await this.client
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Failed to delete campaign: ${error.message}`);
    },

    getMembers: async (campaignId: string): Promise<EnrichedCampaignMember[]> => {
      const { data, error } = await this.client
        .from('campaign_members')
        .select(`
          *,
          profile:profiles!campaign_members_user_id_fkey(username, avatar_url),
          character:characters(name, level, class_name, ancestry_name)
        `)
        .eq('campaign_id', campaignId)
        .order('joined_at', { ascending: true });

      if (error) throw new Error(`Failed to fetch campaign members: ${error.message}`);
      return data || [];
    },

    addMember: async (data: CampaignMemberInsert): Promise<CampaignMember> => {
      const { data: member, error } = await this.client
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

    updateMember: async (id: string, updates: CampaignMemberUpdate): Promise<CampaignMember> => {
      const { data, error } = await this.client
        .from('campaign_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update campaign member: ${error.message}`);
      return data;
    },

    removeMember: async (id: string): Promise<void> => {
      const { error } = await this.client
        .from('campaign_members')
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Failed to remove campaign member: ${error.message}`);
    },

    findByInviteCode: async (inviteCode: string): Promise<Campaign | null> => {
      const { data, error } = await this.client
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

    joinByInviteCode: async (
      inviteCode: string,
      userId: string,
      characterId?: string
    ): Promise<CampaignMember> => {
      // First, find the campaign
      const campaign = await this.campaign.findByInviteCode(inviteCode);
      if (!campaign) {
        throw new Error('Invalid invite code');
      }

      // Check if user is already a member
      const { data: existing } = await this.client
        .from('campaign_members')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('user_id', userId)
        .single();

      if (existing) {
        throw new Error('You are already a member of this campaign');
      }

      // Add member
      return this.campaign.addMember({
        campaign_id: campaign.id,
        user_id: userId,
        character_id: characterId,
        role: 'player',
      });
    },

    transferGM: async (campaignId: string, newGmUserId: string): Promise<void> => {
      // This should be atomic, so we'll use a transaction-like approach
      
      // 1. Get current GM
      const { data: campaign } = await this.client
        .from('campaigns')
        .select('gm_user_id')
        .eq('id', campaignId)
        .single();

      if (!campaign) throw new Error('Campaign not found');

      const oldGmUserId = campaign.gm_user_id;

      // 2. Update campaign GM
      const { error: campaignError } = await this.client
        .from('campaigns')
        .update({ gm_user_id: newGmUserId })
        .eq('id', campaignId);

      if (campaignError) throw new Error(`Failed to transfer GM: ${campaignError.message}`);

      // 3. Update old GM's role to player
      const { error: oldGmError } = await this.client
        .from('campaign_members')
        .update({ role: 'player' })
        .eq('campaign_id', campaignId)
        .eq('user_id', oldGmUserId);

      if (oldGmError) console.error('Failed to update old GM role:', oldGmError);

      // 4. Update new GM's role (or create entry if they're not a member yet)
      const { data: newGmMember } = await this.client
        .from('campaign_members')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('user_id', newGmUserId)
        .single();

      if (newGmMember) {
        await this.client
          .from('campaign_members')
          .update({ role: 'gm' })
          .eq('id', newGmMember.id);
      } else {
        await this.client
          .from('campaign_members')
          .insert({
            campaign_id: campaignId,
            user_id: newGmUserId,
            role: 'gm',
          });
      }
    },
  };
}
```

---

## Store Implementation

### 4.1 Create Campaign Slice

**File**: `store/slices/campaign-slice.ts` (new file)

```typescript
import { StateCreator } from 'zustand';
import type {
  Campaign,
  CampaignInsert,
  CampaignUpdate,
  EnrichedCampaignMember,
  CampaignWithMembers,
} from '@/types/campaign';
import { dataService } from '@/lib/data-service';

export interface CampaignSlice {
  // State
  campaigns: Campaign[];
  activeCampaign: CampaignWithMembers | null;
  campaignMembers: EnrichedCampaignMember[];
  isLoadingCampaigns: boolean;
  campaignError: string | null;

  // Campaign CRUD
  fetchUserCampaigns: () => Promise<void>;
  createCampaign: (name: string, description?: string) => Promise<Campaign>;
  selectCampaign: (campaignId: string) => Promise<void>;
  updateCampaign: (campaignId: string, updates: CampaignUpdate) => Promise<void>;
  deleteCampaign: (campaignId: string) => Promise<void>;
  clearActiveCampaign: () => void;

  // Joining
  joinCampaignByCode: (inviteCode: string, characterId?: string) => Promise<void>;
  leaveCampaign: (campaignId: string) => Promise<void>;

  // Member management
  assignCharacterToCampaign: (campaignId: string, characterId: string) => Promise<void>;
  kickMember: (memberId: string) => Promise<void>;
  transferGM: (campaignId: string, newGmUserId: string) => Promise<void>;

  // Error handling
  setCampaignError: (error: string | null) => void;
}

export const createCampaignSlice: StateCreator<CampaignSlice> = (set, get) => ({
  // Initial state
  campaigns: [],
  activeCampaign: null,
  campaignMembers: [],
  isLoadingCampaigns: false,
  campaignError: null,

  fetchUserCampaigns: async () => {
    set({ isLoadingCampaigns: true, campaignError: null });
    try {
      const userId = (await dataService.auth.getSession())?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const campaigns = await dataService.campaign.list(userId);
      set({ campaigns, isLoadingCampaigns: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch campaigns';
      set({ campaignError: message, isLoadingCampaigns: false });
      throw error;
    }
  },

  createCampaign: async (name: string, description?: string) => {
    set({ campaignError: null });
    try {
      const userId = (await dataService.auth.getSession())?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const campaign = await dataService.campaign.create({
        name,
        description,
        gm_user_id: userId,
      });

      // Add to local campaigns list
      set((state) => ({
        campaigns: [campaign, ...state.campaigns],
      }));

      return campaign;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create campaign';
      set({ campaignError: message });
      throw error;
    }
  },

  selectCampaign: async (campaignId: string) => {
    set({ isLoadingCampaigns: true, campaignError: null });
    try {
      const campaign = await dataService.campaign.getWithMembers(campaignId);
      if (!campaign) throw new Error('Campaign not found');

      set({ activeCampaign: campaign, isLoadingCampaigns: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load campaign';
      set({ campaignError: message, isLoadingCampaigns: false });
      throw error;
    }
  },

  updateCampaign: async (campaignId: string, updates: CampaignUpdate) => {
    set({ campaignError: null });
    try {
      const updated = await dataService.campaign.update(campaignId, updates);

      // Update in campaigns list
      set((state) => ({
        campaigns: state.campaigns.map((c) => (c.id === campaignId ? updated : c)),
        activeCampaign:
          state.activeCampaign?.id === campaignId
            ? { ...state.activeCampaign, ...updated }
            : state.activeCampaign,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update campaign';
      set({ campaignError: message });
      throw error;
    }
  },

  deleteCampaign: async (campaignId: string) => {
    set({ campaignError: null });
    try {
      await dataService.campaign.delete(campaignId);

      set((state) => ({
        campaigns: state.campaigns.filter((c) => c.id !== campaignId),
        activeCampaign: state.activeCampaign?.id === campaignId ? null : state.activeCampaign,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete campaign';
      set({ campaignError: message });
      throw error;
    }
  },

  clearActiveCampaign: () => {
    set({ activeCampaign: null });
  },

  joinCampaignByCode: async (inviteCode: string, characterId?: string) => {
    set({ campaignError: null });
    try {
      const userId = (await dataService.auth.getSession())?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      await dataService.campaign.joinByInviteCode(inviteCode, userId, characterId);

      // Refresh campaigns list
      await get().fetchUserCampaigns();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join campaign';
      set({ campaignError: message });
      throw error;
    }
  },

  leaveCampaign: async (campaignId: string) => {
    set({ campaignError: null });
    try {
      const userId = (await dataService.auth.getSession())?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      // Find member ID
      const members = await dataService.campaign.getMembers(campaignId);
      const member = members.find((m) => m.user_id === userId);
      if (!member) throw new Error('You are not a member of this campaign');

      await dataService.campaign.removeMember(member.id);

      // Remove from local state
      set((state) => ({
        campaigns: state.campaigns.filter((c) => c.id !== campaignId),
        activeCampaign: state.activeCampaign?.id === campaignId ? null : state.activeCampaign,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to leave campaign';
      set({ campaignError: message });
      throw error;
    }
  },

  assignCharacterToCampaign: async (campaignId: string, characterId: string) => {
    set({ campaignError: null });
    try {
      const userId = (await dataService.auth.getSession())?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      // Find member ID
      const members = await dataService.campaign.getMembers(campaignId);
      const member = members.find((m) => m.user_id === userId);
      if (!member) throw new Error('You are not a member of this campaign');

      await dataService.campaign.updateMember(member.id, { character_id: characterId });

      // Refresh active campaign if needed
      if (get().activeCampaign?.id === campaignId) {
        await get().selectCampaign(campaignId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to assign character';
      set({ campaignError: message });
      throw error;
    }
  },

  kickMember: async (memberId: string) => {
    set({ campaignError: null });
    try {
      await dataService.campaign.removeMember(memberId);

      // Refresh active campaign
      const { activeCampaign } = get();
      if (activeCampaign) {
        await get().selectCampaign(activeCampaign.id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to kick member';
      set({ campaignError: message });
      throw error;
    }
  },

  transferGM: async (campaignId: string, newGmUserId: string) => {
    set({ campaignError: null });
    try {
      await dataService.campaign.transferGM(campaignId, newGmUserId);

      // Refresh campaign data
      await get().selectCampaign(campaignId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to transfer GM';
      set({ campaignError: message });
      throw error;
    }
  },

  setCampaignError: (error: string | null) => {
    set({ campaignError: error });
  },
});
```

### 4.2 Add to Main Store

**File**: `store/index.ts`

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { CampaignSlice, createCampaignSlice } from './slices/campaign-slice';
// ... other imports

type StoreState = CharacterSlice &
  AuthSlice &
  CampaignSlice & // Add this
  // ... other slices
  {};

export const useCharacterStore = create<StoreState>()(
  devtools(
    persist(
      (...args) => ({
        ...createCharacterSlice(...args),
        ...createAuthSlice(...args),
        ...createCampaignSlice(...args), // Add this
        // ... other slices
      }),
      {
        name: 'dh-character-store',
        // Persist campaigns and activeCampaign
        partialize: (state) => ({
          // ... existing persisted state
          campaigns: state.campaigns,
          activeCampaign: state.activeCampaign,
        }),
      }
    )
  )
);
```

---

## UI Components

### 5.1 Campaign List Component

**File**: `components/campaign/campaign-list.tsx` (new file)

```typescript
'use client';

import { useEffect } from 'react';
import { useCharacterStore } from '@/store';
import { CampaignCard } from './campaign-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CampaignListProps {
  onCreateClick: () => void;
  onJoinClick: () => void;
}

export function CampaignList({ onCreateClick, onJoinClick }: CampaignListProps) {
  const { campaigns, isLoadingCampaigns, fetchUserCampaigns } = useCharacterStore();

  useEffect(() => {
    fetchUserCampaigns();
  }, [fetchUserCampaigns]);

  if (isLoadingCampaigns) {
    return <div className="text-center py-8">Loading campaigns...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Campaigns</h2>
        <div className="flex gap-2">
          <Button onClick={onJoinClick} variant="outline">
            Join Campaign
          </Button>
          <Button onClick={onCreateClick}>
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">You're not in any campaigns yet</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={onJoinClick} variant="outline">
              Join a Campaign
            </Button>
            <Button onClick={onCreateClick}>Create Your First Campaign</Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5.2 Campaign Card Component

**File**: `components/campaign/campaign-card.tsx` (new file)

```typescript
'use client';

import { Campaign } from '@/types/campaign';
import { Card } from '@/components/ui/card';
import { Users, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const router = useRouter();

  return (
    <Card
      className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => router.push(`/app/campaign/${campaign.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold">{campaign.name}</h3>
        <Crown className="w-5 h-5 text-amber-500" aria-label="Campaign" />
      </div>

      {campaign.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {campaign.description}
        </p>
      )}

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>Members</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full" />
          <span>Active</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Created {new Date(campaign.created_at).toLocaleDateString()}
        </p>
      </div>
    </Card>
  );
}
```

### 5.3 Create Campaign Modal

**File**: `components/campaign/create-campaign-modal.tsx` (new file)

```typescript
'use client';

import { useState } from 'react';
import { useCharacterStore } from '@/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface CreateCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCampaignModal({ open, onOpenChange }: CreateCampaignModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCampaign } = useCharacterStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const campaign = await createCampaign(name.trim(), description.trim() || undefined);
      toast.success('Campaign created successfully!');
      onOpenChange(false);
      router.push(`/app/campaign/${campaign.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="The Sunken Temple"
                maxLength={100}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A journey into the depths of an ancient temple..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {description.length}/500
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 5.4 Join Campaign Form

**File**: `components/campaign/join-campaign-form.tsx` (new file)

```typescript
'use client';

import { useState } from 'react';
import { useCharacterStore } from '@/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface JoinCampaignFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinCampaignForm({ open, onOpenChange }: JoinCampaignFormProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { joinCampaignByCode } = useCharacterStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    setIsSubmitting(true);
    try {
      await joinCampaignByCode(inviteCode.trim().toUpperCase());
      toast.success('Joined campaign successfully!');
      onOpenChange(false);
      setInviteCode('');
      // Optionally, show character selection modal here
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Join Campaign</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="ABCD1234"
              maxLength={8}
              className="font-mono text-lg"
              required
            />
            <p className="text-xs text-muted-foreground mt-2">
              Enter the 8-character code provided by your GM
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Joining...' : 'Join Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 5.5 Invite Code Display

**File**: `components/campaign/invite-code-display.tsx` (new file)

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface InviteCodeDisplayProps {
  inviteCode: string;
  campaignName: string;
}

export function InviteCodeDisplay({ inviteCode, campaignName }: InviteCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const inviteUrl = `${window.location.origin}/app/campaign/join?code=${inviteCode}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Invite link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy invite link');
    }
  };

  return (
    <div className="bg-muted p-6 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Campaign Invite Code</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy invite link'}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
      <div className="font-mono text-3xl font-bold tracking-wider">{inviteCode}</div>
      <p className="text-xs text-muted-foreground mt-2">
        Share this code with players to invite them to "{campaignName}"
      </p>
    </div>
  );
}
```

---

## Pages/Routes

### 6.1 Campaign List Page

**File**: `app/app/campaigns/page.tsx` (new file)

```typescript
'use client';

import { useState } from 'react';
import { CampaignList } from '@/components/campaign/campaign-list';
import { CreateCampaignModal } from '@/components/campaign/create-campaign-modal';
import { JoinCampaignForm } from '@/components/campaign/join-campaign-form';

export default function CampaignsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  return (
    <div className="container py-8">
      <CampaignList
        onCreateClick={() => setShowCreateModal(true)}
        onJoinClick={() => setShowJoinModal(true)}
      />

      <CreateCampaignModal open={showCreateModal} onOpenChange={setShowCreateModal} />
      <JoinCampaignForm open={showJoinModal} onOpenChange={setShowJoinModal} />
    </div>
  );
}
```

### 6.2 Campaign Detail Page

**File**: `app/app/campaign/[id]/page.tsx` (new file)

```typescript
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCharacterStore } from '@/store';
import { Button } from '@/components/ui/button';
import { InviteCodeDisplay } from '@/components/campaign/invite-code-display';
import { Users, Settings } from 'lucide-react';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { activeCampaign, selectCampaign, isLoadingCampaigns } = useCharacterStore();
  const campaignId = params.id as string;

  useEffect(() => {
    selectCampaign(campaignId);
  }, [campaignId, selectCampaign]);

  if (isLoadingCampaigns) {
    return <div className="container py-8">Loading campaign...</div>;
  }

  if (!activeCampaign) {
    return <div className="container py-8">Campaign not found</div>;
  }

  const isGM = activeCampaign.gm_user_id === 'TODO'; // Get current user ID

  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2">{activeCampaign.name}</h1>
          {activeCampaign.description && (
            <p className="text-muted-foreground">{activeCampaign.description}</p>
          )}
        </div>
        {isGM && (
          <Button
            variant="outline"
            onClick={() => router.push(`/app/campaign/${campaignId}/settings`)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        )}
      </div>

      {isGM && (
        <InviteCodeDisplay
          inviteCode={activeCampaign.invite_code}
          campaignName={activeCampaign.name}
        />
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Party Members ({activeCampaign.members?.length || 0})
        </h2>
        {/* Member list component will go here in next steps */}
      </div>

      {isGM && (
        <Button onClick={() => router.push(`/app/campaign/${campaignId}/gm`)}>
          Open GM Screen
        </Button>
      )}
    </div>
  );
}
```

---

## Testing Checklist

- [ ] Can create a campaign
- [ ] Invite code is generated and displayed
- [ ] Can copy invite code to clipboard
- [ ] Can join campaign with valid invite code
- [ ] Error shown for invalid invite code
- [ ] Error shown when already a member
- [ ] Can view campaign list
- [ ] Can view campaign details
- [ ] GM can access campaign settings
- [ ] Players cannot access campaign settings
- [ ] Can leave campaign
- [ ] GM can delete campaign
- [ ] Deleting campaign cascades to members
- [ ] RLS policies prevent unauthorized access

---

## Deployment Steps

1. **Database**: Apply schema changes to production Supabase
2. **Types**: Ensure all TypeScript types are exported correctly
3. **Data Service**: Test all campaign methods
4. **Store**: Verify optimistic updates work correctly
5. **UI**: Test responsive layouts
6. **Navigation**: Add campaign links to main navigation

---

## Success Criteria

✅ Users can create campaigns and see an invite code  
✅ Users can join campaigns with an invite code  
✅ Campaign membership is tracked correctly  
✅ GMs have special permissions  
✅ All RLS policies prevent unauthorized access  
✅ UI is polished and responsive  
✅ Error handling provides clear user feedback
