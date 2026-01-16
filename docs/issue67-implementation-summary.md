# GitHub Issue #67: Social Features - Implementation Summary

> **Status**: Planning Complete  
> **Created**: 2026-01-15  
> **Total Estimated Effort**: 8-13 weeks  
> **Feature Set**: Campaigns, Real-Time Play, GM Screen, Homebrew Sharing

---

## Executive Summary

This document provides an overview of the complete implementation plan for adding multiplayer/social features to the Daggerheart Character Sheet. The features are divided into 7 phases, with detailed implementation plans in separate documents.

### Feature Highlights

1. **Campaign Management** - Create/join campaigns with invite codes
2. **GM Screen** - Real-time party monitoring with Fear tracking and locked vitals
3. **Activity Feed** - Persistent log of dice rolls, vital changes, and actions
4. **Real-Time Updates** - See party activity as it happens
5. **Presence System** - Know who's online in your campaign
6. **Homebrew Sharing** - Share custom items with campaign members
7. **Friendships** (Optional) - Direct 1-to-1 connections

---

## Phase Overview

| Phase | Feature | Duration | Plan Document |
|-------|---------|----------|---------------|
| 1 | Campaign Foundation | 1-2 weeks | `phase1-campaign-foundation.md` |
| 2 | GM Screen MVP | 1-2 weeks | `phase2-gm-screen-mvp.md` |
| 3 | Activity Feed & Broadcasting | 2-3 weeks | `phase3-activity-feed.md` |
| 4 | Real-Time Subscriptions | 1-2 weeks | `phases4-7-realtime-and-social.md` |
| 5 | Presence System | 1 week | `phases4-7-realtime-and-social.md` |
| 6 | Homebrew Sharing | 1-2 weeks | `phases4-7-realtime-and-social.md` |
| 7 | Friendships (Future) | TBD | `phases4-7-realtime-and-social.md` |

**Total**: 8-13 weeks

---

## Key Architecture Decisions

### Database Design

**New Tables**: 6 core tables + 1 optional
- `campaigns` - Campaign metadata, Fear tracking
- `campaign_members` - Player membership and character assignments
- `campaign_activity` - Event log (7-day retention)
- `user_presence` - Online status tracking
- `shared_homebrew` - Item sharing with fork model
- `friendships` - Optional 1-to-1 connections

**Schema Location**: All changes in `supabase/schema.sql` (not separate migrations)

### Real-Time Strategy

**Supabase Realtime** for all live updates:
- Activity feed broadcasts via postgres_changes
- Fear updates via postgres_changes
- Presence via Supabase Presence channels
- Automatic reconnection handling
- Toast notifications for important events

### Security Model

**Row Level Security (RLS)** on all tables:
- Campaign members can view campaign data
- GMs have elevated permissions for their campaigns
- Private activity (hidden GM rolls) uses `is_private` flag
- GM can view/modify party characters' vitals
- Activity older than 7 days auto-deleted

---

## Technical Implementation Guide

### 1. Data Flow

```
User Action (dice roll, vital change)
    ↓
Store Action (optimistic update)
    ↓
Supabase Insert (campaign_activity)
    ↓
Realtime Broadcast (to all subscribers)
    ↓
Other Clients Update (via subscription)
    ↓
Toast Notification (for important events)
```

### 2. Store Architecture

**New Zustand Slices**:
- `campaign-slice.ts` - Campaigns, members, activity, GM actions
- `sharing-slice.ts` - Homebrew sharing (Phase 6)

**Integration Points**:
- Dice rolling hooks log to activity
- Vital update functions log to activity  
- GM screen subscribes to real-time channels
- Character view shows Fear bar when in campaign

### 3. Component Structure

```
components/
├── campaign/
│   ├── campaign-list.tsx
│   ├── campaign-card.tsx
│   ├── create-campaign-modal.tsx
│   ├── join-campaign-form.tsx
│   └── invite-code-display.tsx
├── gm-screen/
│   ├── gm-screen.tsx
│   ├── fear-tracker.tsx
│   ├── party-overview.tsx
│   ├── player-vitals-card.tsx (with lock/unlock)
│   ├── quick-actions-bar.tsx
│   └── gm-dice-roller-modal.tsx
├── activity/
│   ├── activity-feed.tsx
│   ├── activity-item.tsx
│   ├── dice-roll-activity.tsx
│   ├── vital-change-activity.tsx
│   └── fear-change-activity.tsx
├── presence/
│   ├── online-indicator.tsx
│   └── online-members-list.tsx
└── sharing/
    ├── share-homebrew-modal.tsx
    └── shared-items-list.tsx
```

---

## Implementation Strategy

### Phase 1: Foundation First
Start with campaign CRUD and membership management. This establishes the data model and permissions before adding complexity.

**Deliverable**: Users can create/join campaigns, assign characters, and view members.

### Phase 2: GM Tools
Build the GM screen with static data (no real-time yet). Focus on the locked vitals UX and Fear tracking.

**Deliverable**: GMs can monitor party and adjust vitals/Fear.

### Phase 3: Activity Logging
Instrument existing features to log activity. Build the feed UI. This works without real-time initially.

**Deliverable**: Activity feed shows all campaign events (refresh to update).

### Phase 4: Real-Time Magic
Wire up Supabase Realtime to make activity appear instantly. This transforms the experience from static to live.

**Deliverable**: Activity appears in real-time for all online members.

### Phase 5-7: Polish & Extend
Add presence, sharing, and optional friendships once core multiplayer is solid.

---

## Critical Path & Dependencies

### Must Complete in Order
1. Phase 1 → 2 → 3 (sequential dependencies)
2. Phase 4 requires Phase 3 (real-time needs activity to broadcast)
3. Phase 5 can be done in parallel with Phase 4
4. Phases 6-7 are independent and can be done anytime after Phase 1

### Recommended Order
```
Week 1-2:  Phase 1 (Foundation)
Week 3-4:  Phase 2 (GM Screen)
Week 5-7:  Phase 3 (Activity Feed)
Week 8-9:  Phase 4 (Real-Time)
Week 10:   Phase 5 (Presence)
Week 11-12: Phase 6 (Sharing)
Week 13+:  Phase 7 (Optional)
```

---

## Risk Mitigation

### Technical Risks

**Risk**: Supabase Realtime costs escalate  
**Mitigation**: Monitor usage, implement rate limiting, paginate activity feed

**Risk**: Real-time subscriptions don't reconnect properly  
**Mitigation**: Test reconnection logic, implement exponential backoff

**Risk**: Activity volume causes performance issues  
**Mitigation**: Use virtualized scrolling, enforce 7-day retention strictly

**Risk**: RLS policies have security holes  
**Mitigation**: Comprehensive testing, security review before production

### UX Risks

**Risk**: Toast notifications overwhelm users  
**Mitigation**: Smart grouping, importance levels, user settings for notifications

**Risk**: GM screen is too complex  
**Mitigation**: User testing, progressive disclosure, keyboard shortcuts

**Risk**: Activity feed is cluttered  
**Mitigation**: Filtering by type, collapsed view for less important events

---

## Testing Strategy

### Unit Tests
- [ ] Data service methods (campaign CRUD, activity logging)
- [ ] Store actions (optimistic updates, state management)
- [ ] Activity data payload validators

### Integration Tests
- [ ] Campaign creation → membership → activity flow
- [ ] GM vital adjustment → activity logging → broadcast
- [ ] Real-time subscription → reconnection

### E2E Tests
- [ ] Create campaign → share invite → join → assign character
- [ ] GM adjusts Fear → players see update in real-time
- [ ] Player rolls dice → appears in GM screen feed

### Security Tests
- [ ] Non-members cannot view campaign data
- [ ] Players cannot access GM-only features
- [ ] Private activity is not visible to other players
- [ ] GM cannot modify characters outside their campaigns

---

## Performance Considerations

### Database
- Indexes on all foreign keys
- Composite index on `campaign_activity(campaign_id, created_at DESC)`
- Scheduled cleanup function for old activity
- Connection pooling for high concurrency

### Real-Time
- Channel per campaign (not global)
- Unsubscribe on component unmount
- Debounce rapid updates (e.g., dice rolls)
- Presence heartbeat every 30s (not every second)

### Frontend
- Virtualized scrolling for long activity feeds
- Optimistic updates to hide network latency
- Lazy load campaign members
- Memoize expensive computations

---

## User Experience Guidelines

### GM Screen
- **Lock by default**: Prevent accidental vital changes
- **Visual warnings**: Alert GM to low HP/high stress
- **One-click actions**: Quick access to common tasks
- **Minimal clutter**: Only show what's needed

### Activity Feed
- **Newest first**: Most recent activity at top
- **Rich formatting**: Use icons, colors, and typography
- **Contextual info**: Show who, what, when, and why
- **Load more**: Don't fetch all history upfront

### Presence
- **Subtle indicators**: Don't distract from gameplay
- **Join/leave toasts**: Brief notifications
- **Last seen**: Show for offline members

### Fear Tracker
- **Always visible**: Players and GM see current Fear
- **Visual impact**: Use color and animation
- **Quick controls**: GM can adjust in one click

---

## Deployment Checklist

### Pre-Deployment (All Phases)
- [ ] Run all linters and tests
- [ ] Review all RLS policies
- [ ] Test with production-like data volume
- [ ] Load test real-time subscriptions
- [ ] Review Supabase Realtime pricing

### Phase-Specific
- [ ] **Phase 1**: Backup database before schema changes
- [ ] **Phase 2**: Verify GM permissions work correctly
- [ ] **Phase 3**: Set up activity cleanup cron job
- [ ] **Phase 4**: Enable Realtime in Supabase Dashboard
- [ ] **Phase 5**: Test presence cleanup on disconnect
- [ ] **Phase 6**: Test item snapshot preservation

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check Supabase Realtime metrics
- [ ] Collect user feedback
- [ ] Measure page load performance

---

## Success Metrics

### Adoption
- **30%** of users create or join a campaign (within 30 days)
- **Average 3-4** players per campaign
- **10+** campaigns created in first week

### Engagement
- **50+** activity events per campaign per session
- **70%** of GM screens viewed multiple times
- **Real-time latency** < 500ms for activity updates

### Technical
- **99.9%** uptime for Realtime subscriptions
- **< 100ms** P95 latency for activity logging
- **Zero** RLS policy violations in production

---

## Future Enhancements (Post-Launch)

### Quality of Life
- Keyboard shortcuts for GM screen
- Campaign templates (pre-built settings)
- Export campaign history
- Rich text formatting in announcements

### Advanced Features
- Voice/video integration (Discord)
- Initiative tracker for combat
- Shared maps/battlemaps
- Campaign wiki/notes

### Social
- Public campaign directory (opt-in)
- Campaign achievements/badges
- Leaderboards (most active GMs, etc.)

---

## Documentation Requirements

### User-Facing
- [ ] Campaign creation guide
- [ ] GM screen tutorial
- [ ] Activity feed overview
- [ ] Homebrew sharing guide
- [ ] Privacy & permissions page

### Developer
- [ ] API documentation for campaign methods
- [ ] Real-time architecture diagram
- [ ] Activity payload schema reference
- [ ] RLS policy documentation
- [ ] Testing guide

---

## Support & Maintenance

### Ongoing Tasks
- Monitor Supabase usage and costs
- Review and respond to user feedback
- Fix bugs reported in campaigns
- Optimize slow queries
- Update documentation

### Quarterly Reviews
- Analyze adoption and engagement metrics
- Review and optimize RLS policies
- Audit activity retention policy
- Plan new features based on feedback

---

## Conclusion

This implementation plan provides a roadmap for transforming the Daggerheart Character Sheet from a single-player tool into a collaborative TTRPG platform. The phased approach allows for:

1. **Incremental delivery** - Each phase provides value independently
2. **Risk mitigation** - Test and validate before adding complexity
3. **Flexibility** - Phases can be adjusted based on feedback
4. **Quality** - Comprehensive testing at each stage

The estimated 8-13 week timeline assumes one developer working full-time. With team collaboration or part-time effort, adjust accordingly.

**Next Steps**:
1. Review and approve this plan
2. Set up project tracking (GitHub Projects)
3. Create tickets for Phase 1 tasks
4. Begin implementation with database schema
5. Weekly check-ins to track progress

---

**See detailed implementation plans**:
- `docs/phase1-campaign-foundation.md`
- `docs/phase2-gm-screen-mvp.md`
- `docs/phase3-activity-feed.md`
- `docs/phases4-7-realtime-and-social.md`
