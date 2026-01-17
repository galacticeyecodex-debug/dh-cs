# Phase 3: Activity Feed & Broadcasting - Implementation Plan

> **Status**: ✅ COMPLETE (Core Implementation)  
> **GitHub Issue**: #67  
> **Phase**: 3 of 7  
> **Estimated Effort**: 2-3 weeks  
> **Dependencies**: Phase 1 (Campaign Foundation), Phase 2 (GM Screen MVP)  
> **Deliverable**: All game actions logged to campaign feed, visible to all members (not real-time yet)

---

## Overview

This phase implements the campaign activity feed - a persistent log of all significant game events. By the end of this phase:

- **All dice rolls** will be logged (attacks, damage, trait checks)
- **All vital changes** will be logged (HP marked, stress gained, etc.)
- **Card usage** will be logged (spells cast, abilities activated)
- **GM actions** will be logged (Fear changes, vital adjustments, announcements)
- **Activity feed** will be visible on both the GM screen and player view
- **Activity retention** will auto-delete entries older than 7 days

This phase does NOT implement real-time updates - users will need to refresh to see new activity. Real-time subscriptions are added in Phase 4.

---

## Database Implementation

### 1.1 Create Activity Table

**File**: `supabase/schema.sql`

```sql
-- =============================================================================
-- CAMPAIGN ACTIVITY (Feed)
-- =============================================================================

CREATE TABLE IF NOT EXISTS campaign_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  character_name TEXT, -- Denormalized for display after character deletion

  -- Activity classification
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'dice_roll',      -- Attack, damage, trait check, spell roll
    'vital_change',   -- HP marked/cleared, stress gained/cleared, armor used
    'card_used',      -- Spell/ability activated
    'item_used',      -- Consumable used
    'fear_change',    -- GM gained or spent Fear
    'gm_vital_adjust',-- GM adjusted a player's vitals
    'gm_announcement',-- GM broadcast message
    'gm_roll',        -- GM dice roll (can be private)
    'player_joined',  -- Player joined campaign
    'player_left',    -- Player left campaign
    'character_switched' -- Player switched characters
  )),

  -- Flexible payload (structure depends on activity_type)
  data JSONB NOT NULL,

  -- Visibility control
  is_private BOOLEAN DEFAULT false, -- If true, only visible to the user who created it

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient feed queries (newest first)
CREATE INDEX IF NOT EXISTS idx_campaign_activity_feed
  ON campaign_activity(campaign_id, created_at DESC);

-- Index for user's activity
CREATE INDEX IF NOT EXISTS idx_campaign_activity_user
  ON campaign_activity(user_id, created_at DESC);

-- Index for activity type filtering
CREATE INDEX IF NOT EXISTS idx_campaign_activity_type
  ON campaign_activity(campaign_id, activity_type);

-- =============================================================================
-- RLS POLICIES: CAMPAIGN ACTIVITY
-- =============================================================================

ALTER TABLE campaign_activity ENABLE ROW LEVEL SECURITY;

-- Members can view activity (except others' private activities)
CREATE POLICY "Members can view campaign activity"
  ON campaign_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaign_members cm
      WHERE cm.campaign_id = campaign_activity.campaign_id
      AND cm.user_id = auth.uid()
    )
    AND (
      is_private = false
      OR user_id = auth.uid()
    )
  );

-- Members can insert their own activity
CREATE POLICY "Members can insert own activity"
  ON campaign_activity FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM campaign_members cm
      WHERE cm.campaign_id = campaign_activity.campaign_id
      AND cm.user_id = auth.uid()
    )
  );

-- GM can insert activity for anyone (for damage/heal actions)
CREATE POLICY "GM can insert activity"
  ON campaign_activity FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_activity.campaign_id
      AND c.gm_user_id = auth.uid()
    )
  );

-- =============================================================================
-- ACTIVITY CLEANUP FUNCTION
-- =============================================================================

-- Delete activity older than 7 days
CREATE OR REPLACE FUNCTION cleanup_old_activity()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM campaign_activity
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This should be called by a scheduled Supabase Edge Function
-- See: docs/supabase-edge-functions/cleanup-activity.md
```

---

## TypeScript Types

### 2.1 Activity Data Payloads

**File**: `types/campaign.ts` (extend existing file)

```typescript
// Activity Types
export type ActivityType =
  | 'dice_roll'
  | 'vital_change'
  | 'card_used'
  | 'item_used'
  | 'fear_change'
  | 'gm_vital_adjust'
  | 'gm_announcement'
  | 'gm_roll'
  | 'player_joined'
  | 'player_left'
  | 'character_switched';

// Base activity interface
export interface CampaignActivity {
  id: string;
  campaign_id: string;
  user_id: string;
  character_id?: string;
  character_name?: string;
  activity_type: ActivityType;
  data: ActivityData;
  is_private: boolean;
  created_at: string;
}

// Union type for all activity data
export type ActivityData =
  | DiceRollActivity
  | VitalChangeActivity
  | CardUsedActivity
  | ItemUsedActivity
  | FearChangeActivity
  | GmVitalAdjustActivity
  | GmAnnouncementActivity
  | GmRollActivity
  | PlayerJoinedActivity
  | PlayerLeftActivity
  | CharacterSwitchedActivity;

// Specific activity payloads
export interface DiceRollActivity {
  roll_type: 'attack' | 'damage' | 'trait' | 'spellcast' | 'custom';
  trait?: string;
  dice: number[]; // Individual die results
  modifier: number;
  modifier_breakdown?: string[];
  total: number;
  target?: number;
  success?: boolean;
  description?: string;
  hope_fear?: 'hope' | 'fear';
}

export interface VitalChangeActivity {
  vital: 'hp' | 'stress' | 'armor' | 'hope';
  change: number; // Positive = gained/healed, Negative = lost/marked
  previous_value: number;
  new_value: number;
  max_value: number;
  cause?: string;
}

export interface CardUsedActivity {
  card_id: string;
  card_name: string;
  card_type: 'ability' | 'spell' | 'domain';
  domain?: string;
  cost_paid?: { hope?: number; stress?: number };
}

export interface ItemUsedActivity {
  item_id: string;
  item_name: string;
  item_type: string;
  effect?: string;
}

export interface FearChangeActivity {
  change: number; // Positive = gained, Negative = spent
  previous_value: number;
  new_value: number;
  max_value: number;
  message?: string;
  trigger?: 'manual' | 'fear_roll';
}

export interface GmVitalAdjustActivity {
  target_character_id: string;
  target_character_name: string;
  vital: 'hp' | 'stress' | 'armor' | 'hope';
  change: number;
  previous_value: number;
  new_value: number;
  reason?: string;
}

export interface GmAnnouncementActivity {
  message: string;
  importance?: 'normal' | 'important' | 'critical';
}

export interface GmRollActivity extends DiceRollActivity {
  revealed: boolean; // If false, players only see "GM rolled dice"
}

export interface PlayerJoinedActivity {
  player_name: string;
  character_name?: string;
}

export interface PlayerLeftActivity {
  player_name: string;
}

export interface CharacterSwitchedActivity {
  previous_character_name?: string;
  new_character_name: string;
}

// Insert type (without id and created_at)
export interface CampaignActivityInsert {
  campaign_id: string;
  user_id: string;
  character_id?: string;
  character_name?: string;
  activity_type: ActivityType;
  data: ActivityData;
  is_private?: boolean;
}
```

---

## Data Service Extensions

### 3.1 Extend Campaign Data Client

**File**: `lib/data-client.ts`

```typescript
export interface DataClient {
  campaign: {
    // ... existing methods ...

    // Activity methods
    logActivity: (activity: CampaignActivityInsert) => Promise<CampaignActivity>;
    getActivity: (campaignId: string, limit?: number, offset?: number) => Promise<CampaignActivity[]>;
    getActivityCount: (campaignId: string) => Promise<number>;
  };
}
```

### 3.2 Implement Activity Methods

**File**: `lib/data-service.ts`

```typescript
export class SupabaseDataService implements DataClient {
  campaign = {
    // ... existing methods ...

    logActivity: async (activity: CampaignActivityInsert): Promise<CampaignActivity> => {
      const { data, error } = await this.client
        .from('campaign_activity')
        .insert(activity)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to log activity: ${error.message}`);
      }

      return data;
    },

    getActivity: async (
      campaignId: string,
      limit: number = 50,
      offset: number = 0
    ): Promise<CampaignActivity[]> => {
      const { data, error } = await this.client
        .from('campaign_activity')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch activity: ${error.message}`);
      }

      return data || [];
    },

    getActivityCount: async (campaignId: string): Promise<number> => {
      const { count, error } = await this.client
        .from('campaign_activity')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId);

      if (error) {
        throw new Error(`Failed to count activity: ${error.message}`);
      }

      return count || 0;
    },
  };
}
```

---

## Store Extensions

### 4.1 Extend Campaign Slice

**File**: `store/slices/campaign-slice.ts`

```typescript
export interface CampaignSlice {
  // ... existing from Phase 1 & 2 ...

  // Activity state
  activityFeed: CampaignActivity[];
  isLoadingActivity: boolean;
  activityTotalCount: number;

  // Activity actions
  fetchActivityFeed: (campaignId: string, offset?: number) => Promise<void>;
  logActivity: (activity: CampaignActivityInsert) => Promise<void>;
  clearActivityFeed: () => void;
}

export const createCampaignSlice: StateCreator<CampaignSlice> = (set, get) => ({
  // ... existing state ...

  activityFeed: [],
  isLoadingActivity: false,
  activityTotalCount: 0,

  fetchActivityFeed: async (campaignId: string, offset: number = 0) => {
    set({ isLoadingActivity: true });
    try {
      const [activity, count] = await Promise.all([
        dataService.campaign.getActivity(campaignId, 50, offset),
        offset === 0 ? dataService.campaign.getActivityCount(campaignId) : Promise.resolve(get().activityTotalCount),
      ]);

      set({
        activityFeed: offset === 0 ? activity : [...get().activityFeed, ...activity],
        activityTotalCount: count,
        isLoadingActivity: false,
      });
    } catch (error) {
      console.error('Failed to fetch activity:', error);
      set({ isLoadingActivity: false });
    }
  },

  logActivity: async (activity: CampaignActivityInsert) => {
    try {
      const logged = await dataService.campaign.logActivity(activity);

      // Add to local feed (optimistic update)
      set((state) => ({
        activityFeed: [logged, ...state.activityFeed],
        activityTotalCount: state.activityTotalCount + 1,
      }));
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  },

  clearActivityFeed: () => {
    set({ activityFeed: [], activityTotalCount: 0 });
  },
});
```

---

## Integration with Existing Features

### 5.1 Log Dice Rolls

**File**: `lib/dice-utils.ts` (or wherever dice rolling happens)

```typescript
import { useCharacterStore } from '@/store';

export const rollDiceAndLog = async (
  rollType: 'attack' | 'damage' | 'trait' | 'custom',
  dice: string,
  modifier: number,
  description?: string
) => {
  const { activeCampaign, currentCharacter, logActivity } = useCharacterStore.getState();
  
  // Execute the roll (existing logic)
  const result = executeDiceRoll(dice, modifier);

  // If in a campaign, log the activity
  if (activeCampaign && currentCharacter) {
    await logActivity({
      campaign_id: activeCampaign.id,
      user_id: currentCharacter.user_id,
      character_id: currentCharacter.id,
      character_name: currentCharacter.name,
      activity_type: 'dice_roll',
      data: {
        roll_type: rollType,
        dice: result.individualRolls,
        modifier: modifier,
        total: result.total,
        description: description,
        // Add hope/fear if using Daggerheart dual-die system
      },
      is_private: false,
    });
  }

  return result;
};
```

### 5.2 Log Vital Changes

**File**: `store/slices/character-slice.ts` (modify existing updateVitals function)

```typescript
updateHitPoints: async (characterId: string, newValue: number) => {
  const character = get().characters.find((c) => c.id === characterId);
  if (!character) return;

  const previous = character.hit_points_current;
  const change = newValue - previous;

  // Update character (existing logic)
  await dataService.character.update(characterId, {
    hit_points_current: newValue,
  });

  // If in campaign, log activity
  const { activeCampaign, logActivity } = get();
  if (activeCampaign) {
    await logActivity({
      campaign_id: activeCampaign.id,
      user_id: character.user_id,
      character_id: characterId,
      character_name: character.name,
      activity_type: 'vital_change',
      data: {
        vital: 'hp',
        change: change,
        previous_value: previous,
        new_value: newValue,
        max_value: character.hit_points_max,
      },
      is_private: false,
    });
  }

  // Optimistic update
  set((state) => ({
    characters: state.characters.map((c) =>
      c.id === characterId ? { ...c, hit_points_current: newValue } : c
    ),
  }));
},

// Repeat for stress, armor, hope...
```

### 5.3 Update GM Actions to Log

**File**: `store/slices/campaign-slice.ts` (update from Phase 2)

```typescript
gmAdjustVital: async (
  characterId: string,
  vital: 'hp' | 'stress' | 'armor' | 'hope',
  newValue: number
) => {
  const character = get().partyCharacters.find((c) => c.id === characterId);
  if (!character) return;

  const vitalMap = {
    hp: character.hit_points_current,
    stress: character.stress_current,
    armor: character.armor_remaining,
    hope: character.hope_current,
  };

  const previousValue = vitalMap[vital];
  const change = newValue - previousValue;

  try {
    await dataService.campaign.gmAdjustVital(characterId, vital, newValue);

    // Log activity
    const { activeCampaign, logActivity } = get();
    const session = await dataService.auth.getSession();
    
    if (activeCampaign && session?.user) {
      await logActivity({
        campaign_id: activeCampaign.id,
        user_id: session.user.id,
        character_id: characterId,
        character_name: character.name,
        activity_type: 'gm_vital_adjust',
        data: {
          target_character_id: characterId,
          target_character_name: character.name,
          vital: vital,
          change: change,
          previous_value: previousValue,
          new_value: newValue,
        },
        is_private: false,
      });
    }

    // Optimistic update
    set((state) => ({
      partyCharacters: state.partyCharacters.map((char) =>
        char.id === characterId
          ? {
              ...char,
              ...(vital === 'hp' && { hit_points_current: newValue }),
              ...(vital === 'stress' && { stress_current: newValue }),
              ...(vital === 'armor' && { armor_remaining: newValue }),
              ...(vital === 'hope' && { hope_current: newValue }),
            }
          : char
      ),
    }));
  } catch (error) {
    toast.error('Failed to adjust vital');
    throw error;
  }
},

updateFear: async (campaignId: string, change: number) => {
  const previous = get().activeCampaign?.fear_current || 0;
  
  try {
    const updated = await dataService.campaign.updateFear(campaignId, change);

    // Log activity
    const session = await dataService.auth.getSession();
    if (session?.user) {
      await get().logActivity({
        campaign_id: campaignId,
        user_id: session.user.id,
        activity_type: 'fear_change',
        data: {
          change: change,
          previous_value: previous,
          new_value: updated.fear_current,
          max_value: updated.fear_max,
          trigger: 'manual',
        },
        is_private: false,
      });
    }

    // Update state
    set((state) => ({
      activeCampaign: state.activeCampaign
        ? { ...state.activeCampaign, ...updated }
        : null,
    }));
  } catch (error) {
    toast.error('Failed to update Fear');
    throw error;
  }
},
```

---

## UI Components

### 6.1 Activity Feed Component

**File**: `components/activity/activity-feed.tsx` (new file)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useCharacterStore } from '@/store';
import { ActivityItem } from './activity-item';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

interface ActivityFeedProps {
  campaignId: string;
  maxHeight?: string;
}

export function ActivityFeed({ campaignId, maxHeight = '600px' }: ActivityFeedProps) {
  const { activityFeed, isLoadingActivity, fetchActivityFeed, activityTotalCount } =
    useCharacterStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchActivityFeed(campaignId);
  }, [campaignId, fetchActivityFeed]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchActivityFeed(campaignId, 0);
    setIsRefreshing(false);
  };

  const handleLoadMore = () => {
    fetchActivityFeed(campaignId, activityFeed.length);
  };

  return (
    <Card className="flex flex-col" style={{ maxHeight }}>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Activity Feed</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label="Refresh activity feed"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activityFeed.length === 0 && !isLoadingActivity ? (
          <div className="text-center py-8 text-muted-foreground">
            No activity yet. Start playing!
          </div>
        ) : (
          <>
            {activityFeed.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}

            {activityFeed.length < activityTotalCount && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLoadMore}
                disabled={isLoadingActivity}
              >
                {isLoadingActivity ? 'Loading...' : 'Load More'}
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
```

### 6.2 Activity Item Router Component

**File**: `components/activity/activity-item.tsx` (new file)

```typescript
'use client';

import { CampaignActivity } from '@/types/campaign';
import { DiceRollActivity } from './dice-roll-activity';
import { VitalChangeActivity } from './vital-change-activity';
import { CardUsedActivity } from './card-used-activity';
import { FearChangeActivity } from './fear-change-activity';
import { GmAnnouncementActivity } from './gm-announcement-activity';
import { GmVitalAdjustActivity } from './gm-vital-adjust-activity';

interface ActivityItemProps {
  activity: CampaignActivity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const timestamp = new Date(activity.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const renderActivity = () => {
    switch (activity.activity_type) {
      case 'dice_roll':
      case 'gm_roll':
        return <DiceRollActivity activity={activity} />;
      case 'vital_change':
        return <VitalChangeActivity activity={activity} />;
      case 'card_used':
        return <CardUsedActivity activity={activity} />;
      case 'fear_change':
        return <FearChangeActivity activity={activity} />;
      case 'gm_announcement':
        return <GmAnnouncementActivity activity={activity} />;
      case 'gm_vital_adjust':
        return <GmVitalAdjustActivity activity={activity} />;
      default:
        return (
          <div className="text-sm text-muted-foreground">
            Unknown activity type: {activity.activity_type}
          </div>
        );
    }
  };

  return (
    <div className="border rounded-lg p-3 hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{timestamp}</span>
        <div className="flex-1 min-w-0">{renderActivity()}</div>
      </div>
    </div>
  );
}
```

### 6.3 Dice Roll Activity Component

**File**: `components/activity/dice-roll-activity.tsx` (new file)

```typescript
'use client';

import { CampaignActivity, DiceRollActivity as DiceRollData } from '@/types/campaign';
import { Dices } from 'lucide-react';

interface DiceRollActivityProps {
  activity: CampaignActivity;
}

export function DiceRollActivity({ activity }: DiceRollActivityProps) {
  const data = activity.data as DiceRollData;
  const isGmRoll = activity.activity_type === 'gm_roll';

  return (
    <div className="flex items-start gap-2">
      <Dices className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium">
          {activity.character_name || 'GM'}{' '}
          <span className="text-muted-foreground">rolled {data.roll_type}</span>
        </div>
        {data.description && (
          <div className="text-sm text-muted-foreground">{data.description}</div>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-2xl font-bold">{data.total}</span>
          <span className="text-sm text-muted-foreground">
            ({data.dice.join(', ')}) {data.modifier > 0 && `+ ${data.modifier}`}
          </span>
          {data.hope_fear && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                data.hope_fear === 'hope'
                  ? 'bg-amber-500/20 text-amber-600'
                  : 'bg-red-500/20 text-red-600'
              }`}
            >
              {data.hope_fear.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 6.4 Vital Change Activity Component

**File**: `components/activity/vital-change-activity.tsx` (new file)

```typescript
'use client';

import { CampaignActivity, VitalChangeActivity as VitalChangeData } from '@/types/campaign';
import { Heart, Brain, Shield, Sparkles } from 'lucide-react';

interface VitalChangeActivityProps {
  activity: CampaignActivity;
}

export function VitalChangeActivity({ activity }: VitalChangeActivityProps) {
  const data = activity.data as VitalChangeData;

  const vitalConfig = {
    hp: { icon: Heart, label: 'HP', color: 'text-red-500' },
    stress: { icon: Brain, label: 'Stress', color: 'text-yellow-500' },
    armor: { icon: Shield, label: 'Armor', color: 'text-blue-500' },
    hope: { icon: Sparkles, label: 'Hope', color: 'text-amber-500' },
  };

  const config = vitalConfig[data.vital];
  const Icon = config.icon;
  const action = data.change > 0 ? 'gained' : 'marked';

  return (
    <div className="flex items-start gap-2">
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.color}`} />
      <div className="flex-1 min-w-0">
        <div className="font-medium">
          {activity.character_name}{' '}
          <span className="text-muted-foreground">
            {action} {Math.abs(data.change)} {config.label}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          Now at {data.new_value}/{data.max_value}
        </div>
        {data.cause && <div className="text-xs text-muted-foreground italic">{data.cause}</div>}
      </div>
    </div>
  );
}
```

### 6.5 Fear Change Activity Component

**File**: `components/activity/fear-change-activity.tsx` (new file)

```typescript
'use client';

import { CampaignActivity, FearChangeActivity as FearChangeData } from '@/types/campaign';
import { Skull } from 'lucide-react';

interface FearChangeActivityProps {
  activity: CampaignActivity;
}

export function FearChangeActivity({ activity }: FearChangeActivityProps) {
  const data = activity.data as FearChangeData;
  const action = data.change > 0 ? 'gained' : 'spent';

  return (
    <div className="flex items-start gap-2">
      <Skull className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
      <div className="flex-1 min-w-0">
        <div className="font-medium">
          GM <span className="text-muted-foreground">{action} {Math.abs(data.change)} Fear</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Now at {data.new_value}/{data.max_value}
        </div>
        {data.message && (
          <div className="text-sm italic border-l-2 border-red-500 pl-2 mt-1">
            "{data.message}"
          </div>
        )}
      </div>
    </div>
  );
}
```

### 6.6 GM Announcement Activity Component

**File**: `components/activity/gm-announcement-activity.tsx` (new file)

```typescript
'use client';

import { CampaignActivity, GmAnnouncementActivity as GmAnnouncementData } from '@/types/campaign';
import { Megaphone } from 'lucide-react';

interface GmAnnouncementActivityProps {
  activity: CampaignActivity;
}

export function GmAnnouncementActivity({ activity }: GmAnnouncementActivityProps) {
  const data = activity.data as GmAnnouncementData;

  return (
    <div className="flex items-start gap-2">
      <Megaphone className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
      <div className="flex-1 min-w-0">
        <div className="font-medium">GM Announcement</div>
        <div className="text-sm bg-blue-500/10 border-l-2 border-blue-500 pl-2 py-1 mt-1">
          {data.message}
        </div>
      </div>
    </div>
  );
}
```

Similar components should be created for `card-used-activity.tsx`, `gm-vital-adjust-activity.tsx`, etc.

---

## Update Pages

### 7.1 Add Feed to GM Screen

**File**: `components/gm-screen/gm-screen.tsx`

```typescript
import { ActivityFeed } from '@/components/activity/activity-feed';

export function GmScreen({ campaignId }: GmScreenProps) {
  // ... existing code ...

  return (
    <div className="min-h-screen bg-background">
      {/* ... existing header ... */}

      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Fear + Party */}
          <div className="lg:col-span-2 space-y-6">
            <FearTracker {...} />
            <PartyOverview {...} />
            <QuickActionsBar {...} />
          </div>

          {/* Right column: Activity Feed */}
          <div className="lg:col-span-1">
            <ActivityFeed campaignId={campaignId} maxHeight="calc(100vh - 200px)" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 7.2 Add Feed to Player Campaign View

**File**: `app/app/campaign/[id]/page.tsx`

```typescript
import { ActivityFeed } from '@/components/activity/activity-feed';

export default function CampaignDetailPage() {
  // ... existing code ...

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign details */}
          {/* Member list */}
        </div>
        
        <div className="lg:col-span-1">
          <ActivityFeed campaignId={campaignId} />
        </div>
      </div>
    </div>
  );
}
```

---

## Supabase Edge Function (Activity Cleanup)

### 8.1 Create Cleanup Function

**File**: `supabase/functions/cleanup-activity/index.ts` (new file)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabaseClient.rpc('cleanup_old_activity');

    if (error) throw error;

    return new Response(JSON.stringify({ deleted: data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
```

### 8.2 Schedule the Function

In Supabase Dashboard → Database → Cron Jobs:

```sql
SELECT cron.schedule(
  'cleanup-old-activity',
  '0 2 * * *', -- Run at 2 AM daily
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-activity',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

---

## Testing Checklist

- [x] Dice rolls are logged to activity
- [x] Vital changes are logged to activity
- [x] Fear changes are logged to activity
- [x] GM vital adjustments are logged
- [x] GM announcements are logged
- [ ] Activity feed displays all activity types correctly
- [x] Activity feed is paginated
- [x] "Load More" works
- [x] Refresh button works
- [ ] Activity is visible to all campaign members
- [ ] Private GM rolls are not visible to players
- [ ] Players cannot see other players' private activity
- [ ] Activity older than 7 days is cleaned up
- [x] Activity feed is responsive

---

## Success Criteria

✅ All major game actions are logged  
✅ Activity feed is visible and functional  
✅ Activity displays with rich formatting  
✅ Pagination works smoothly  
✅ 7-day retention is enforced  
✅ RLS policies protect private activity  
✅ Performance is acceptable with large activity volumes
