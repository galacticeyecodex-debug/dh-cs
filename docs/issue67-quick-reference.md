# GitHub Issue #67: Quick Reference Guide

> **Purpose**: Quick lookup for common tasks during implementation  
> **Use**: Keep this open while coding for fast reference

---

## File Locations Reference

### New Files to Create

**Database**
- `supabase/schema.sql` - Add all new tables (append to existing)
- `supabase/functions/cleanup-activity/index.ts` - Activity cleanup Edge Function

**Types**
- `types/campaign.ts` - All campaign and activity types

**Data Services**
- `lib/data-service.ts` - Extend with campaign methods (existing file)
- `lib/realtime.ts` - Real-time subscription manager (new)
- `lib/presence.ts` - Presence tracking manager (new)

**Store**
- `store/slices/campaign-slice.ts` - Campaign state management (new)
- `store/slices/sharing-slice.ts` - Homebrew sharing state (new)
- `store/index.ts` - Add campaign slice (modify existing)

**Components - Campaign**
- `components/campaign/campaign-list.tsx`
- `components/campaign/campaign-card.tsx`
- `components/campaign/create-campaign-modal.tsx`
- `components/campaign/join-campaign-form.tsx`
- `components/campaign/invite-code-display.tsx`

**Components - GM Screen**
- `components/gm-screen/gm-screen.tsx`
- `components/gm-screen/fear-tracker.tsx`
- `components/gm-screen/party-overview.tsx`
- `components/gm-screen/player-vitals-card.tsx`
- `components/gm-screen/quick-actions-bar.tsx`

**Components - Activity**
- `components/activity/activity-feed.tsx`
- `components/activity/activity-item.tsx`
- `components/activity/dice-roll-activity.tsx`
- `components/activity/vital-change-activity.tsx`
- `components/activity/fear-change-activity.tsx`
- `components/activity/gm-announcement-activity.tsx`
- (+ more activity types)

**Components - Other**
- `components/presence/online-indicator.tsx`
- `components/sharing/share-homebrew-modal.tsx`

**Pages**
- `app/app/campaigns/page.tsx` - Campaign list
- `app/app/campaign/[id]/page.tsx` - Campaign detail
- `app/app/campaign/[id]/gm/page.tsx` - GM screen
- `app/app/campaign/[id]/settings/page.tsx` - Campaign settings

---

## Common Code Patterns

### Log Activity (Generic)

```typescript
const { activeCampaign, logActivity } = useCharacterStore();
const session = await dataService.auth.getSession();

if (activeCampaign && session?.user && character) {
  await logActivity({
    campaign_id: activeCampaign.id,
    user_id: session.user.id,
    character_id: character.id,
    character_name: character.name,
    activity_type: 'TYPE_HERE',
    data: {
      // Type-specific data
    },
    is_private: false,
  });
}
```

### Optimistic Update Pattern

```typescript
// 1. Update local state immediately
set((state) => ({
  items: state.items.map((item) =>
    item.id === itemId ? { ...item, ...updates } : item
  ),
}));

// 2. Make API call
try {
  await dataService.method(itemId, updates);
} catch (error) {
  // 3. Revert on error
  set((state) => ({
    items: state.items.map((item) =>
      item.id === itemId ? originalItem : item
    ),
  }));
  toast.error('Failed to update');
}
```

### Subscribe to Real-Time

```typescript
useEffect(() => {
  if (activeCampaign) {
    subscribeToCampaign(activeCampaign.id);
  }

  return () => {
    unsubscribeFromCampaign();
  };
}, [activeCampaign?.id, subscribeToCampaign, unsubscribeFromCampaign]);
```

### RLS Policy Template

```sql
-- SELECT: Who can view records
CREATE POLICY "policy_name"
  ON table_name FOR SELECT
  USING (
    -- Condition that must be true to view
    user_id = auth.uid()
  );

-- INSERT: Who can create records
CREATE POLICY "policy_name"
  ON table_name FOR INSERT
  WITH CHECK (
    -- Condition that must be true to insert
    user_id = auth.uid()
  );

-- UPDATE: Who can modify records
CREATE POLICY "policy_name"
  ON table_name FOR UPDATE
  USING (
    -- Condition to determine IF you can update
  );

-- DELETE: Who can delete records
CREATE POLICY "policy_name"
  ON table_name FOR DELETE
  USING (
    -- Condition that must be true to delete
  );
```

---

## DataService Method Template

```typescript
// In lib/data-client.ts
export interface DataClient {
  campaign: {
    methodName: (params: Type) => Promise<ReturnType>;
  };
}

// In lib/data-service.ts
export class SupabaseDataService implements DataClient {
  campaign = {
    methodName: async (params: Type): Promise<ReturnType> => {
      const { data, error } = await this.client
        .from('table_name')
        .select('*') // or .insert(), .update(), .delete()
        .eq('column', value)
        .single(); // or .maybeSingle() or nothing for arrays

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new Error(`Failed to ...: ${error.message}`);
      }

      return data;
    },
  };
}
```

---

## Store Slice Template

```typescript
// In store/slices/slice-name.ts
import { StateCreator } from 'zustand';

export interface SliceInterface {
  // State
  items: Item[];
  isLoading: boolean;
  
  // Actions
  fetchItems: () => Promise<void>;
  createItem: (data: ItemInsert) => Promise<Item>;
  updateItem: (id: string, data: ItemUpdate) => Promise<void>;
}

export const createSlice: StateCreator<SliceInterface> = (set, get) => ({
  items: [],
  isLoading: false,

  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const items = await dataService.method();
      set({ items, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      toast.error('Failed to fetch items');
    }
  },

  createItem: async (data: ItemInsert) => {
    try {
      const item = await dataService.create(data);
      set((state) => ({ items: [...state.items, item] }));
      return item;
    } catch (error) {
      toast.error('Failed to create item');
      throw error;
    }
  },

  updateItem: async (id: string, updates: ItemUpdate) => {
    try {
      await dataService.update(id, updates);
      set((state) => ({
        items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      }));
    } catch (error) {
      toast.error('Failed to update item');
      throw error;
    }
  },
});
```

---

## Testing Checklist (Copy for Each Phase)

### Unit Tests
- [ ] All data service methods
- [ ] All store actions
- [ ] Type guards and validators

### Integration Tests
- [ ] Full user flows (e.g., create → join → assign)
- [ ] Real-time subscriptions
- [ ] Error handling

### Manual Testing
- [ ] Happy path works
- [ ] Error states show correct messages
- [ ] Loading states display
- [ ] Permissions enforced (try as different users)
- [ ] Mobile responsive
- [ ] Accessibility (keyboard nav, screen reader)

### Security Testing
- [ ] RLS policies prevent unauthorized access
- [ ] Cannot access other campaigns' data
- [ ] Cannot modify data without permission
- [ ] Private data stays private

---

## SQL Helpers

### Check if RLS is enabled

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('campaigns', 'campaign_members', 'campaign_activity');
```

### View all policies on a table

```sql
SELECT * FROM pg_policies WHERE tablename = 'campaigns';
```

### Test a query as a specific user

```sql
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims.sub = 'user-id-here';
SELECT * FROM campaigns;
RESET role;
```

### Count activity by type

```sql
SELECT activity_type, COUNT(*) 
FROM campaign_activity 
WHERE campaign_id = 'campaign-id-here'
GROUP BY activity_type
ORDER BY COUNT(*) DESC;
```

---

## Common Issues & Solutions

### Issue: Real-time not working
**Check**:
- Is Realtime enabled in Supabase Dashboard?
- Is the table enabled for Realtime?
- Are you calling `subscribe()` on the channel?
- Is the subscription cleaned up on unmount?

### Issue: RLS blocking legitimate queries
**Check**:
- Is `auth.uid()` returning the expected user ID?
- Does the policy condition match your intent?
- Are you using the correct policy (SELECT vs INSERT vs UPDATE)?
- Test with RLS disabled temporarily to confirm

### Issue: Activity not appearing in feed
**Check**:
- Is `campaign_id` set correctly?
- Is user a member of the campaign?
- Is activity marked as private when it shouldn't be?
- Check the `created_at` timestamp

### Issue: Performance slow with many activities
**Solutions**:
- Limit initial fetch to 50 items
- Use cursor-based pagination
- Add indexes on frequently queried columns
- Enable query plan in Supabase

---

## Git Workflow Recommendation

### Branch Strategy
```bash
git checkout -b feature/gh67-phase1-foundation
# Work on phase 1
git add .
git commit -m "feat(campaigns): implement Phase 1 - campaign foundation"
git push origin feature/gh67-phase1-foundation
# Create PR, get review, merge
# Repeat for each phase
```

### Commit Message Format
```
type(scope): description

Examples:
feat(campaigns): add campaign creation and invite codes
fix(gm-screen): prevent accidental vital adjustments
refactor(activity): extract activity item components
test(campaigns): add RLS policy tests
docs(readme): update with campaign features
```

---

## Environment Setup

### Required Supabase Configuration

1. **Enable Realtime** (Phases 4-5)
   - Dashboard → Database → Replication
   - Enable for: `campaign_activity`, `campaigns`, `characters`

2. **Add Edge Function** (Phase 3)
   - Deploy `cleanup-activity` function
   - Set up cron job in Database → Cron Jobs

3. **Add Environment Variables** (if needed)
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```

---

## Debugging Tools

### Check Campaign Data

```typescript
// In browser console
const state = useCharacterStore.getState();
console.log('Active Campaign:', state.activeCampaign);
console.log('Activity Feed:', state.activityFeed);
console.log('Online Members:', state.onlineMembers);
```

### Monitor Real-Time Events

```typescript
channel.on('*', (payload) => {
  console.log('Realtime event:', payload);
});
```

### Check User Session

```typescript
const { data } = await dataService.auth.getSession();
console.log('User ID:', data?.user?.id);
```

---

## Before Marking Phase Complete

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Runs on dev server without errors
- [ ] Build succeeds (`npm run build`)
- [ ] Manual testing completed
- [ ] Code reviewed (if team)
- [ ] Documentation updated
- [ ] Git commits pushed
- [ ] Update GitHub issue with progress

---

## Quick Links

- **Full Plans**: `/docs/phase{1-3}` and `/docs/phases4-7`
- **Summary**: `/docs/issue67-implementation-summary.md`
- **Original Spec**: `/docs/SOCIAL_FEATURES_PLAN.md`
- **GitHub Issue**: https://github.com/YOUR_REPO/issues/67
- **Supabase Dashboard**: https://app.supabase.com/project/YOUR_PROJECT

---

## Need Help?

1. Check the detailed phase plan document
2. Review existing code for similar patterns
3. Test in Supabase SQL Editor
4. Check Supabase logs for errors
5. Search Discord/Stack Overflow
6. Ask Claude/AI for specific code examples

**Remember**: Each phase builds on the previous. Don't skip ahead!
