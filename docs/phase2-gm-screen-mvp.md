# Phase 2: GM Screen MVP - Implementation Plan

> **GitHub Issue**: #67  
> **Phase**: 2 of 7  
> **Status**: ✅ COMPLETE (2026-01-16)  
> **Estimated Effort**: 1-2 weeks  
> **Dependencies**: Phase 1 (Campaign Foundation)  
> **Deliverable**: GMs can view party status, adjust vitals (with lock/unlock), manage Fear, make announcements, and roll dice

---

## Overview

This phase creates the Game Master's command center. The GM Screen provides a real-time overview of the party's status, with the ability to:

- View all party members' vitals (HP, Stress, Armor, Hope)
- Lock/unlock vitals cards to prevent accidental changes
- Manually adjust player vitals when needed
- Track and manage campaign Fear
- Make announcements to the party
- Roll dice (public or hidden)
- View and manage campaign settings

This phase does NOT include real-time updates yet (that's Phase 4). All changes will require manual refresh for now.

---

## Database Extensions

### 1.1 GM Character Access Policy

**File**: `supabase/schema.sql`

Add policies to allow GMs to view and modify player characters in their campaigns:

```sql
-- =============================================================================
-- GM SPECIAL ACCESS: View/Modify Player Characters
-- =============================================================================

-- GM can view characters of campaign members
CREATE POLICY "GM can view member characters"
  ON characters FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM campaign_members cm
      JOIN campaigns c ON c.id = cm.campaign_id
      WHERE cm.character_id = characters.id
      AND c.gm_user_id = auth.uid()
    )
  );

-- GM can update vitals of member characters
-- This allows damage/healing but should be logged
CREATE POLICY "GM can update member characters"
  ON characters FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM campaign_members cm
      JOIN campaigns c ON c.id = cm.campaign_id
      WHERE cm.character_id = characters.id
      AND c.gm_user_id = auth.uid()
    )
  );
```

### 1.2 Fear Management

Fear is already in the `campaigns` table from Phase 1, but we'll add a helper function for atomic Fear updates:

```sql
-- =============================================================================
-- FEAR MANAGEMENT FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION update_campaign_fear(
  campaign_id_param UUID,
  change_amount INTEGER,
  gm_user_id_param UUID
)
RETURNS campaigns AS $$
DECLARE
  updated_campaign campaigns;
BEGIN
  -- Verify GM permission
  IF NOT EXISTS (
    SELECT 1 FROM campaigns
    WHERE id = campaign_id_param
    AND gm_user_id = gm_user_id_param
  ) THEN
    RAISE EXCEPTION 'Only the GM can modify Fear';
  END IF;

  -- Update Fear value
  UPDATE campaigns
  SET fear_current = GREATEST(0, LEAST(fear_max, fear_current + change_amount)),
      updated_at = now()
  WHERE id = campaign_id_param
  RETURNING * INTO updated_campaign;

  RETURN updated_campaign;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Data Service Extensions

### 2.1 Extend Campaign Data Client

**File**: `lib/data-client.ts`

```typescript
export interface DataClient {
  // ... existing methods ...

  campaign: {
    // ... existing methods from Phase 1 ...

    // GM-specific methods
    gmAdjustVital: (
      characterId: string,
      vital: 'hp' | 'stress' | 'armor' | 'hope',
      newValue: number
    ) => Promise<void>;

    updateFear: (
      campaignId: string,
      change: number
    ) => Promise<Campaign>;

    getPartyCharacters: (campaignId: string) => Promise<Character[]>;
  };
}
```

### 2.2 Implement GM Methods

**File**: `lib/data-service.ts`

```typescript
export class SupabaseDataService implements DataClient {
  campaign = {
    // ... existing methods from Phase 1 ...

    gmAdjustVital: async (
      characterId: string,
      vital: 'hp' | 'stress' | 'armor' | 'hope',
      newValue: number
    ): Promise<void> => {
      // Build the update object based on vital type
      const vitalMap = {
        hp: 'hit_points_current',
        stress: 'stress_current',
        armor: 'armor_remaining',
        hope: 'hope_current',
      };

      const update = {
        [vitalMap[vital]]: newValue,
      };

      const { error } = await this.client
        .from('characters')
        .update(update)
        .eq('id', characterId);

      if (error) {
        throw new Error(`Failed to adjust ${vital}: ${error.message}`);
      }
    },

    updateFear: async (campaignId: string, change: number): Promise<Campaign> => {
      const { data: session } = await this.client.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { data, error } = await this.client.rpc('update_campaign_fear', {
        campaign_id_param: campaignId,
        change_amount: change,
        gm_user_id_param: session.user.id,
      });

      if (error) {
        throw new Error(`Failed to update Fear: ${error.message}`);
      }

      return data;
    },

    getPartyCharacters: async (campaignId: string): Promise<Character[]> => {
      const { data, error } = await this.client
        .from('campaign_members')
        .select(`
          character_id,
          character:characters(*)
        `)
        .eq('campaign_id', campaignId)
        .not('character_id', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch party characters: ${error.message}`);
      }

      return data?.map((m) => m.character).filter(Boolean) || [];
    },
  };
}
```

---

## Store Extensions

### 3.1 Extend Campaign Slice

**File**: `store/slices/campaign-slice.ts`

```typescript
export interface CampaignSlice {
  // ... existing from Phase 1 ...

  // GM Screen state
  partyCharacters: Character[];
  unlockedVitalsCards: Set<string>; // Character IDs with unlocked vitals

  // GM actions
  fetchPartyCharacters: (campaignId: string) => Promise<void>;
  gmAdjustVital: (
    characterId: string,
    vital: 'hp' | 'stress' | 'armor' | 'hope',
    newValue: number
  ) => Promise<void>;
  updateFear: (campaignId: string, change: number) => Promise<void>;
  toggleVitalsLock: (characterId: string) => void;
  
  // GM dice rolls (will log to activity in Phase 3)
  gmRollDice: (diceFormula: string, isPrivate: boolean) => Promise<void>;
}

export const createCampaignSlice: StateCreator<CampaignSlice> = (set, get) => ({
  // ... existing state from Phase 1 ...
  
  partyCharacters: [],
  unlockedVitalsCards: new Set(),

  fetchPartyCharacters: async (campaignId: string) => {
    try {
      const characters = await dataService.campaign.getPartyCharacters(campaignId);
      set({ partyCharacters: characters });
    } catch (error) {
      console.error('Failed to fetch party characters:', error);
      throw error;
    }
  },

  gmAdjustVital: async (
    characterId: string,
    vital: 'hp' | 'stress' | 'armor' | 'hope',
    newValue: number
  ) => {
    try {
      await dataService.campaign.gmAdjustVital(characterId, vital, newValue);

      // Optimistically update local state
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

      // TODO Phase 3: Log activity here
    } catch (error) {
      toast.error('Failed to adjust vital');
      throw error;
    }
  },

  updateFear: async (campaignId: string, change: number) => {
    try {
      const updated = await dataService.campaign.updateFear(campaignId, change);

      // Update active campaign
      set((state) => ({
        activeCampaign: state.activeCampaign
          ? { ...state.activeCampaign, ...updated }
          : null,
      }));

      // TODO Phase 3: Log activity here
    } catch (error) {
      toast.error('Failed to update Fear');
      throw error;
    }
  },

  toggleVitalsLock: (characterId: string) => {
    set((state) => {
      const newLocked = new Set(state.unlockedVitalsCards);
      if (newLocked.has(characterId)) {
        newLocked.delete(characterId);
      } else {
        newLocked.add(characterId);
      }
      return { unlockedVitalsCards: newLocked };
    });
  },

  gmRollDice: async (diceFormula: string, isPrivate: boolean) => {
    // For MVP, just show a toast
    // TODO Phase 3: Actually roll dice and log activity
    toast.info(`GM rolled: ${diceFormula} (${isPrivate ? 'hidden' : 'public'})`);
  },
});
```

---

## UI Components

### 4.1 GM Screen Layout

**File**: `components/gm-screen/gm-screen.tsx` (new file)

```typescript
'use client';

import { useEffect } from 'react';
import { useCharacterStore } from '@/store';
import { FearTracker } from './fear-tracker';
import { PartyOverview } from './party-overview';
import { QuickActionsBar } from './quick-actions-bar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GmScreenProps {
  campaignId: string;
}

export function GmScreen({ campaignId }: GmScreenProps) {
  const router = useRouter();
  const { activeCampaign, selectCampaign, fetchPartyCharacters, partyCharacters } =
    useCharacterStore();

  useEffect(() => {
    if (!activeCampaign || activeCampaign.id !== campaignId) {
      selectCampaign(campaignId);
    }
    fetchPartyCharacters(campaignId);
  }, [campaignId, selectCampaign, fetchPartyCharacters, activeCampaign]);

  if (!activeCampaign) {
    return <div className="container py-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/app/campaign/${campaignId}`)}
                aria-label="Back to campaign"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">{activeCampaign.name}</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/app/campaign/${campaignId}/settings`)}
                aria-label="Campaign settings"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6 space-y-6">
        {/* Fear Tracker */}
        <FearTracker
          campaignId={campaignId}
          currentFear={activeCampaign.fear_current}
          maxFear={activeCampaign.fear_max}
        />

        {/* Party Overview */}
        <PartyOverview campaignId={campaignId} characters={partyCharacters} />

        {/* Quick Actions */}
        <QuickActionsBar campaignId={campaignId} />
      </div>
    </div>
  );
}
```

### 4.2 Fear Tracker Component

**File**: `components/gm-screen/fear-tracker.tsx` (new file)

```typescript
'use client';

import { useCharacterStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Minus, Plus, Skull } from 'lucide-react';
import { toast } from 'sonner';

interface FearTrackerProps {
  campaignId: string;
  currentFear: number;
  maxFear: number;
}

export function FearTracker({ campaignId, currentFear, maxFear }: FearTrackerProps) {
  const { updateFear } = useCharacterStore();

  const handleFearChange = async (change: number) => {
    try {
      await updateFear(campaignId, change);
      const action = change > 0 ? 'gained' : 'spent';
      toast.success(`Fear ${action}: ${Math.abs(change)}`);
    } catch (error) {
      // Error toast already shown in store
    }
  };

  const percentage = (currentFear / maxFear) * 100;

  return (
    <Card className="p-6 bg-gradient-to-r from-red-950/20 to-purple-950/20 border-red-900/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skull className="w-8 h-8 text-red-500" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-bold">Fear</h2>
            <p className="text-sm text-muted-foreground">
              GM-controlled resource, visible to all players
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFearChange(-1)}
            disabled={currentFear === 0}
            aria-label="Spend 1 Fear"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-2xl font-bold min-w-[80px] text-center">
            {currentFear}/{maxFear}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFearChange(1)}
            disabled={currentFear >= maxFear}
            aria-label="Gain 1 Fear"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-6 bg-background rounded-full overflow-hidden border border-border">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-purple-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
          {currentFear > 0 && `${Math.round(percentage)}%`}
        </div>
      </div>
    </Card>
  );
}
```

### 4.3 Party Overview Component

**File**: `components/gm-screen/party-overview.tsx` (new file)

```typescript
'use client';

import { Character } from '@/types/character';
import { PlayerVitalsCard } from './player-vitals-card';
import { Users } from 'lucide-react';

interface PartyOverviewProps {
  campaignId: string;
  characters: Character[];
}

export function PartyOverview({ campaignId, characters }: PartyOverviewProps) {
  if (characters.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No party members have assigned characters yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Users className="w-6 h-6" />
        Party ({characters.length})
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {characters.map((character) => (
          <PlayerVitalsCard key={character.id} character={character} />
        ))}
      </div>
    </div>
  );
}
```

### 4.4 Player Vitals Card Component

**File**: `components/gm-screen/player-vitals-card.tsx` (new file)

```typescript
'use client';

import { Character } from '@/types/character';
import { useCharacterStore } from '@/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Unlock, Heart, Brain, Shield, Sparkles, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerVitalsCardProps {
  character: Character;
}

export function PlayerVitalsCard({ character }: PlayerVitalsCardProps) {
  const { unlockedVitalsCards, toggleVitalsLock, gmAdjustVital } = useCharacterStore();
  const isUnlocked = unlockedVitalsCards.has(character.id);

  const vitals = [
    {
      id: 'hp',
      label: 'Hit Points',
      icon: Heart,
      current: character.hit_points_current,
      max: character.hit_points_max,
      color: 'text-red-500',
      bgColor: 'bg-red-500',
    },
    {
      id: 'stress',
      label: 'Stress',
      icon: Brain,
      current: character.stress_current,
      max: character.stress_max,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
    },
    {
      id: 'armor',
      label: 'Armor',
      icon: Shield,
      current: character.armor_remaining,
      max: character.armor_total,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500',
    },
    {
      id: 'hope',
      label: 'Hope',
      icon: Sparkles,
      current: character.hope_current,
      max: character.hope_max,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500',
    },
  ];

  const handleVitalChange = async (
    vital: 'hp' | 'stress' | 'armor' | 'hope',
    delta: number
  ) => {
    const vitalData = vitals.find((v) => v.id === vital);
    if (!vitalData) return;

    const newValue = Math.max(0, Math.min(vitalData.max, vitalData.current + delta));
    await gmAdjustVital(character.id, vital, newValue);
  };

  // Warning thresholds
  const isHpLow = character.hit_points_current <= Math.ceil(character.hit_points_max * 0.33);
  const isStressHigh = character.stress_current >= character.stress_max - 1;
  const isHopeLow = character.hope_current <= 1;
  const hasWarning = isHpLow || isStressHigh || isHopeLow;

  return (
    <Card className={cn('p-4', hasWarning && 'border-orange-500/50 shadow-orange-500/20')}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold">{character.name}</h3>
          <p className="text-sm text-muted-foreground">
            {character.ancestry_name} {character.class_name} (Lvl {character.level})
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleVitalsLock(character.id)}
          aria-label={isUnlocked ? 'Lock vitals card' : 'Unlock vitals card'}
        >
          {isUnlocked ? (
            <Unlock className="w-4 h-4 text-green-500" />
          ) : (
            <Lock className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Vitals */}
      <div className="space-y-3">
        {vitals.map((vital) => {
          const percentage = (vital.current / vital.max) * 100;
          const Icon = vital.icon;
          const isLow =
            vital.id === 'hp' && isHpLow ||
            vital.id === 'stress' && isStressHigh ||
            vital.id === 'hope' && isHopeLow;

          return (
            <div key={vital.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Icon className={cn('w-4 h-4', vital.color)} aria-hidden="true" />
                  <span className="font-medium">{vital.label}</span>
                  {isLow && <span className="text-orange-500 ml-1">⚠️</span>}
                </div>
                <span className="text-muted-foreground">
                  {vital.current}/{vital.max}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full transition-all', vital.bgColor)}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Adjustment buttons */}
              {isUnlocked && (
                <div className="flex justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVitalChange(vital.id as any, -1)}
                    disabled={vital.current === 0}
                    aria-label={`Decrease ${vital.label}`}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVitalChange(vital.id as any, 1)}
                    disabled={vital.current >= vital.max}
                    aria-label={`Increase ${vital.label}`}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
```

### 4.5 Quick Actions Bar

**File**: `components/gm-screen/quick-actions-bar.tsx` (new file)

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dices, Megaphone, EyeOff, StickyNote } from 'lucide-react';
import { GmDiceRollerModal } from './gm-dice-roller-modal';
import { AnnounceModal } from './announce-modal';

interface QuickActionsBarProps {
  campaignId: string;
}

export function QuickActionsBar({ campaignId }: QuickActionsBarProps) {
  const [showDiceRoller, setShowDiceRoller] = useState(false);
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [isPrivateRoll, setIsPrivateRoll] = useState(false);

  return (
    <>
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => {
              setIsPrivateRoll(false);
              setShowDiceRoller(true);
            }}
          >
            <Dices className="w-6 h-6" />
            <span>Roll Dice</span>
          </Button>

          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => setShowAnnounce(true)}
          >
            <Megaphone className="w-6 h-6" />
            <span>Announce</span>
          </Button>

          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => {
              setIsPrivateRoll(true);
              setShowDiceRoller(true);
            }}
          >
            <EyeOff className="w-6 h-6" />
            <span>Hidden Roll</span>
          </Button>

          <Button variant="outline" className="h-24 flex-col gap-2" disabled>
            <StickyNote className="w-6 h-6" />
            <span>Session Notes</span>
            <span className="text-xs text-muted-foreground">(Coming soon)</span>
          </Button>
        </div>
      </Card>

      <GmDiceRollerModal
        open={showDiceRoller}
        onOpenChange={setShowDiceRoller}
        isPrivate={isPrivateRoll}
        campaignId={campaignId}
      />

      <AnnounceModal
        open={showAnnounce}
        onOpenChange={setShowAnnounce}
        campaignId={campaignId}
      />
    </>
  );
}
```

### 4.6 GM Dice Roller Modal

**File**: `components/gm-screen/gm-dice-roller-modal.tsx` (new file)

```typescript
'use client';

import { useState } from 'react';
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
import { useCharacterStore } from '@/store';

interface GmDiceRollerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPrivate: boolean;
  campaignId: string;
}

export function GmDiceRollerModal({
  open,
  onOpenChange,
  isPrivate,
  campaignId,
}: GmDiceRollerModalProps) {
  const [formula, setFormula] = useState('2d6');
  const { gmRollDice } = useCharacterStore();

  const handleRoll = async () => {
    await gmRollDice(formula, isPrivate);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isPrivate ? 'Hidden Roll' : 'Public Dice Roll'}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="formula">Dice Formula</Label>
          <Input
            id="formula"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="2d6+3"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {isPrivate
              ? 'Only you will see the result'
              : 'All players will see this roll in the activity feed'}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRoll}>Roll</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.7 Announce Modal

**File**: `components/gm-screen/announce-modal.tsx` (new file)

```typescript
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface AnnounceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
}

export function AnnounceModal({ open, onOpenChange, campaignId }: AnnounceModalProps) {
  const [message, setMessage] = useState('');

  const handleAnnounce = async () => {
    // TODO Phase 3: Log as activity
    toast.success('Announcement sent to party!');
    onOpenChange(false);
    setMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Announce to Party</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message..."
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-2">
            This will appear in all players' activity feeds
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAnnounce} disabled={!message.trim()}>
            Send Announcement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Pages/Routes

### 5.1 GM Screen Page

**File**: `app/app/campaign/[id]/gm/page.tsx` (new file)

```typescript
'use client';

import { useParams } from 'next/navigation';
import { GmScreen } from '@/components/gm-screen/gm-screen';
import { useCharacterStore } from '@/store';
import { useEffect } from 'react';

export default function GmScreenPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const { activeCampaign, selectCampaign } = useCharacterStore();

  useEffect(() => {
    if (!activeCampaign || activeCampaign.id !== campaignId) {
      selectCampaign(campaignId);
    }
  }, [campaignId, activeCampaign, selectCampaign]);

  // TODO: Check if current user is GM
  // If not, redirect or show error

  return <GmScreen campaignId={campaignId} />;
}
```

---

## Testing Checklist

- [ ] GM can view all party members' vitals
- [ ] Vitals cards are locked by default
- [ ] GM can unlock a vitals card
- [ ] GM can adjust vitals when unlocked
- [ ] Adjustments are persisted to database
- [ ] Other players' sheets are read-only (verify RLS)
- [ ] GM can gain Fear
- [ ] GM can spend Fear
- [ ] Fear cannot go below 0 or above max
- [ ] Fear updates are persisted
- [ ] GM can open dice roller
- [ ] GM can make announcements
- [ ] Warning indicators show for low HP/high stress
- [ ] Non-GMs cannot access GM screen
- [ ] UI is responsive on different screen sizes

---

## Follow-Up Tasks (Phase 3)

The following features are stubbed but will be completed in Phase 3:

- [ ] Log vital adjustments to activity feed
- [ ] Log Fear changes to activity feed
- [ ] Actually roll dice (integrate with existing dice system)
- [ ] Log dice rolls to activity feed
- [ ] Log announcements to activity feed

---

## Success Criteria

✅ GM can view party at a glance  
✅ Vitals can be adjusted with lock/unlock safety  
✅ Fear is tracked and adjustable  
✅ Quick actions provide common GM tools  
✅ UI is polished and intuitive  
✅ RLS policies prevent player access to GM features
