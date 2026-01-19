# Phases 4-7: Real-Time, Presence, Sharing & Friendships - Implementation Plans

> **GitHub Issue**: #67  
> **Phases**: 4-7 of 7  
> **Combined Document**: Implementation plans for the final four phases

---

## Phase 4: Real-Time Subscriptions ✅ COMPLETE (2026-01-17)

### Overview
Transform the activity feed from manual-refresh to live updates using Supabase Realtime. Players see party actions instantly.

###Database Configuration

**File**: `supabase/config.toml`

```toml
[realtime]
enabled = true
```

Enable Realtime for tables in Supabase Dashboard:
- `campaign_activity`
- `campaigns`
- `campaign_members`
- `characters` (for vital updates)

### Real-Time Utilities

**File**: `lib/realtime.ts` (new file)

```typescript
import { RealtimeChannel } from '@supabase/supabase-js';
import { dataService } from './data-service';
import { useCharacterStore } from '@/store';

export class CampaignRealtimeManager {
  private activityChannel: RealtimeChannel | null = null;
  private campaignChannel: RealtimeChannel | null = null;

  async subscribeToCampaign(campaignId: string) {
    // Subscribe to activity feed
    this.activityChannel = dataService.client
      .channel(`campaign-activity:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_activity',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          const activity = payload.new;
          const currentUserId = useCharacterStore.getState().user?.id;

          // Don't show own activity (already optimistically added)
          if (activity.user_id === currentUserId) return;

          // Don't show private activity from others
          if (activity.is_private && activity.user_id !== currentUserId) return;

          // Add to feed
          useCharacterStore.getState().addActivityToFeed(activity);

          // Show toast notification
          this.showActivityNotification(activity);
        }
      )
      .subscribe();

    // Subscribe to campaign updates (Fear changes, settings)
    this.campaignChannel = dataService.client
      .channel(`campaign-updates:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaigns',
          filter: `id=eq.${campaignId}`,
        },
        (payload) => {
          useCharacterStore.getState().updateActiveCampaign(payload.new);
        }
      )
      .subscribe();
  }

  unsubscribe() {
    this.activityChannel?.unsubscribe();
    this.campaignChannel?.unsubscribe();
    this.activityChannel = null;
    this.campaignChannel = null;
  }

  private showActivityNotification(activity: any) {
    // Toast notification logic
    const characterName = activity.character_name || 'Someone';
    let message = '';

    switch (activity.activity_type) {
      case 'dice_roll':
        message = `${characterName} rolled ${activity.data.total}`;
        break;
      case 'vital_change':
        message = `${characterName} ${activity.data.vital} changed`;
        break;
      // ... other types
    }

    if (message) {
      toast.info(message, { duration: 3000 });
    }
  }
}

export const realtimeManager = new CampaignRealtimeManager();
```

### Store Integration

**File**: `store/slices/campaign-slice.ts`

```typescript
export interface CampaignSlice {
  // ... existing ...

  // Realtime
  realtimeSubscribed: boolean;
  subscribeToCampaign: (campaignId: string) => void;
  unsubscribeFromCampaign: () => void;
  addActivityToFeed: (activity: CampaignActivity) => void;
  updateActiveCampaign: (updates: Partial<Campaign>) => void;
}

// Implementation
subscribeToCampaign: (campaignId: string) => {
  if (get().realtimeSubscribed) {
    realtimeManager.unsubscribe();
  }

  realtimeManager.subscribeToCampaign(campaignId);
  set({ realtimeSubscribed: true });
},

unsubscribeFromCampaign: () => {
  realtimeManager.unsubscribe();
  set({ realtimeSubscribed: false });
},

addActivityToFeed: (activity: CampaignActivity) => {
  set((state) => ({
    activityFeed: [activity, ...state.activityFeed],
    activityTotalCount: state.activityTotalCount + 1,
  }));
},

updateActiveCampaign: (updates: Partial<Campaign>) => {
  set((state) => ({
    activeCampaign: state.activeCampaign
      ? { ...state.activeCampaign, ...updates }
      : null,
  }));
},
```

### Auto-Subscribe in Views

**File**: `components/gm-screen/gm-screen.tsx` and campaign views

```typescript
useEffect(() => {
  if (activeCampaign) {
    subscribeToCampaign(activeCampaign.id);
  }

  return () => {
    unsubscribeFromCampaign();
  };
}, [activeCampaign?.id]);
```

### Success Criteria
✅ Activity appears instantly for all online members  
✅ Fear updates in real-time  
✅ Toast notifications for important events  
✅ Subscriptions clean up on unmount

---

## Phase 5: Presence System (1 week)

### Overview
Track who's online in each campaign using Supabase Presence.

### Database Table

**File**: `supabase/schema.sql`

```sql
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  last_seen TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_presence_campaign ON user_presence(campaign_id) WHERE campaign_id IS NOT NULL;

-- RLS
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view presence"
  ON user_presence FOR SELECT
  USING (
    campaign_id IS NULL
    OR EXISTS (
      SELECT 1 FROM campaign_members cm
      WHERE cm.campaign_id = user_presence.campaign_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users manage own presence"
  ON user_presence FOR ALL
  USING (user_id = auth.uid());
```

### Presence Manager

**File**: `lib/presence.ts` (new file)

```typescript
import { RealtimeChannel } from '@supabase/supabase-js';
import { dataService } from './data-service';

export interface PresenceState {
  user_id: string;
  character_id?: string;
  username: string;
  character_name?: string;
  status: 'online' | 'away';
  online_at: string;
}

export class PresenceManager {
  private channel: RealtimeChannel | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  async track(campaignId: string, userId: string, characterId?: string) {
    this.channel = dataService.client.channel(`campaign-presence:${campaignId}`, {
      config: { presence: { key: userId } },
    });

    const profile = await dataService.profiles.get(userId);
    const character = characterId ? await dataService.character.get(characterId) : null;

    this.channel
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel!.presenceState();
        const presences = Object.values(state).flat() as PresenceState[];
        useCharacterStore.getState().setOnlineMembers(presences);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((p: PresenceState) => {
          toast.info(`${p.username} joined`, { duration: 2000 });
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((p: PresenceState) => {
          toast.info(`${p.username} left`, { duration: 2000 });
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.channel!.track({
            user_id: userId,
            character_id: characterId,
            username: profile?.username || 'Unknown',
            character_name: character?.name,
            status: 'online',
            online_at: new Date().toISOString(),
          });

          // Heartbeat every 30 seconds
          this.heartbeatInterval = setInterval(() => {
            this.channel?.track({
              user_id: userId,
              status: 'online',
              online_at: new Date().toISOString(),
            });
          }, 30000);
        }
      });
  }

  untrack() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.channel?.untrack();
    this.channel?.unsubscribe();
    this.channel = null;
  }
}

export const presenceManager = new PresenceManager();
```

### Online Indicator Component

**File**: `components/presence/online-indicator.tsx` (new file)

```typescript
interface OnlineIndicatorProps {
  status: 'online' | 'away' | 'offline';
  size?: 'sm' | 'md' | 'lg';
}

export function OnlineIndicator({ status, size = 'md' }: OnlineIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const colorClasses = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-400',
  };

  return (
    <div
      className={`rounded-full ${sizeClasses[size]} ${colorClasses[status]}`}
      aria-label={`${status} status`}
    />
  );
}
```

### Success Criteria
✅ See who's online in real-time  
✅ Join/leave notifications  
✅ Heartbeat keeps presence updated  
✅ Presence cleans up on disconnect

---

## Phase 6: Homebrew Sharing (1-2 weeks)

### Overview
Share custom items with campaign members using a fork/snapshot model.

### Database Table

**File**: `supabase/schema.sql`

```sql
CREATE TABLE IF NOT EXISTS shared_homebrew (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homebrew_item_id UUID NOT NULL REFERENCES homebrew_items(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  item_snapshot JSONB NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT shared_homebrew_target_check CHECK (
    (shared_with_user_id IS NOT NULL AND shared_with_campaign_id IS NULL) OR
    (shared_with_user_id IS NULL AND shared_with_campaign_id IS NOT NULL)
  )
);

CREATE INDEX idx_shared_homebrew_recipient ON shared_homebrew(shared_with_user_id);
CREATE INDEX idx_shared_homebrew_campaign ON shared_homebrew(shared_with_campaign_id);

-- RLS
ALTER TABLE shared_homebrew ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View items shared with me"
  ON shared_homebrew FOR SELECT
  USING (shared_with_user_id = auth.uid());

CREATE POLICY "View items shared with my campaigns"
  ON shared_homebrew FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaign_members cm
      WHERE cm.campaign_id = shared_homebrew.shared_with_campaign_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "View items I shared"
  ON shared_homebrew FOR SELECT
  USING (shared_by = auth.uid());

CREATE POLICY "Share own homebrew"
  ON shared_homebrew FOR INSERT
  WITH CHECK (
    shared_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM homebrew_items hi
      WHERE hi.id = shared_homebrew.homebrew_item_id
      AND hi.user_id = auth.uid()
    )
  );

CREATE POLICY "Delete own shares"
  ON shared_homebrew FOR DELETE
  USING (shared_by = auth.uid());
```

### Data Service

**File**: `lib/data-client.ts`

```typescript
sharing: {
  share(homebrewItemId: string, target: { userId?: string; campaignId?: string }, message?: string): Promise<SharedHomebrew>;
  unshare(sharedId: string): Promise<void>;
  listSharedWithMe(): Promise<SharedHomebrew[]>;
  listSharedByMe(): Promise<SharedHomebrew[]>;
  addToInventory(sharedId: string, characterId: string): Promise<void>;
}
```

### Share Modal Component

**File**: `components/sharing/share-homebrew-modal.tsx`

```typescript
export function ShareHomebrewModal({ itemId, open, onOpenChange }: Props) {
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [message, setMessage] = useState('');
  const { campaigns, shareHomebrew } = useCharacterStore();

  const handleShare = async () => {
    await shareHomebrew(itemId, { campaignId: selectedCampaign }, message);
    toast.success('Item shared with campaign!');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Homebrew Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Share with Campaign</Label>
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger>
                <SelectValue placeholder="Select campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Message (Optional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Check out this cool item I made!"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={!selectedCampaign}>
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Success Criteria
✅ Can share homebrew with campaigns  
✅ Shared items appear in "Add Item" modal  
✅ Can add shared items to inventory  
✅ Snapshot preserves item at share time  
✅ Can unshare items

---

## Phase 7: Friendships ✅ COMPLETE (2026-01-17)

### Overview
1-to-1 friend connections for direct sharing outside campaigns using unique friend codes.

### Database Schema

**File**: `supabase/schema.sql`

Added columns to `profiles` table:
- `friend_code TEXT UNIQUE` - 8-character unique code for friend requests
- `allow_friend_requests BOOLEAN DEFAULT true` - Privacy setting
- `show_online_status BOOLEAN DEFAULT true` - Privacy setting

Created `friendships` table with:
- `id`, `requester_id`, `recipient_id` - Core relationship
- `status` - 'pending', 'accepted', 'declined', 'blocked'
- RLS policies for secure friend management
- Trigger for auto-generating friend codes

### Implementation

**Types**: `types/friendship.ts`
- `Friendship`, `FriendshipStatus`
- `Friend`, `FriendRequest`, `OutgoingRequest`
- `EnrichedFriendship`

**Data Service**: `lib/data-service.ts` - `friendship` section
- `findByCode(friendCode)` - Lookup user by friend code
- `sendRequest(recipientId)` - Send friend request
- `cancelRequest(friendshipId)` - Cancel outgoing request
- `acceptRequest(friendshipId)` - Accept incoming request
- `declineRequest(friendshipId)` - Decline incoming request
- `getFriends(userId)` - List accepted friends
- `getPendingRequests(userId)` - List incoming requests
- `getOutgoingRequests(userId)` - List sent requests
- `unfriend(friendshipId)` - Remove friendship
- `block(friendshipId)` - Block user
- `checkFriendship(userId, otherUserId)` - Check status

**Store**: `store/slices/friendship-slice.ts`
- State: `friends`, `pendingRequests`, `outgoingRequests`, `myFriendCode`
- Actions for all friend management operations
- Optimistic updates with rollback on failure
- Toast notifications for user feedback

**UI Components**: `components/friends/`
- `FriendsPanel` - Main tabbed view
- `FriendCard` - Display friend with actions
- `FriendRequestCard` - Accept/decline incoming
- `OutgoingRequestCard` - Cancel sent requests
- `AddFriendForm` - Send request by code
- `MyFriendCode` - Display user's code with copy

### Success Criteria
✅ Friend code generation (8-char unique codes)
✅ Send friend requests via friend code
✅ Accept/decline incoming requests  
✅ Cancel outgoing requests
✅ View friend list with actions
✅ Remove friends (unfriend)
✅ Block users
✅ Privacy controls (allow_friend_requests, show_online_status)
✅ Optimistic updates with rollback
✅ Unit tests (18 tests passing)

---

## Cross-Phase Testing

### Performance Testing
- [ ] Test with 100+ activity items in feed
- [ ] Test with 10+ concurrent users
- [ ] Measure Realtime bandwidth usage
- [ ] Test presence with frequent joins/leaves

### Security Testing
- [x] Verify RLS on all new tables (friendships)
- [ ] Test GM-only actions as player
- [ ] Test cross-campaign access
- [ ] Test private activity visibility

### UX Testing
- [ ] Toast notifications aren't overwhelming
- [ ] Activity feed scrolls smoothly
- [ ] Presence updates feel instant
- [ ] Sharing flow is intuitive
- [x] Friends panel is intuitive

---

## Deployment Checklist

### Phase 4
- [x] Enable Realtime in Supabase
- [ ] Test reconnection logic
- [ ] Monitor Realtime costs

### Phase 5
- [ ] Test heartbeat reliability
- [ ] Verify presence cleanup on disconnect

### Phase 6
- [ ] Test item snapshot preservation
- [ ] Verify sharing RLS policies

### Phase 7
- [x] Design friend code system (8-char codes like Discord)
- [x] Implement friend discovery (via friend code)
- [x] Add privacy controls

---

## Final Success Criteria

✅ **Multiplayer Experience**: Campaigns feel alive with real-time activity  
✅ **GM Tools**: GMs have full control of Fear and party vitals  
✅ **Social Features**: Players can share and connect  
✅ **Friendships**: Users can add friends and share directly
✅ **Performance**: System scales to 10+ concurrent users per campaign  
✅ **Security**: All RLS policies enforced correctly  
✅ **Polish**: UI is responsive and notifications are helpful

