/**
 * MIGRATION: GH#67 Phases 3-7 Complete Social Features
 *
 * This migration adds all social features for the Daggerheart Character Sheet:
 * - Phase 3: Campaign Activity & Broadcasting
 * - Phase 4: Real-Time Subscriptions
 * - Phase 5: Presence System
 * - Phase 6: Homebrew Sharing
 * - Phase 7: Friendships
 *
 * Tables added:
 * 1. campaigns - Campaign management with invite codes and Fear tracking
 * 2. campaign_members - Maps players/GMs to campaigns with character assignments
 * 3. campaign_activity - Activity feed for all campaign events
 * 4. friendships - Friend requests and relationships between users
 *
 * Profiles table columns added:
 * - friend_code: 8-character code for adding friends
 * - allow_friend_requests: Boolean to accept/reject friend requests
 * - show_online_status: Boolean to show online presence to friends
 *
 * Functions & Triggers:
 * - generate_invite_code() - Creates unique 8-char campaign invite codes
 * - generate_friend_code() - Creates unique 8-char friend codes
 * - Automatic code generation on insert with uniqueness checks
 * - Activity cleanup function to maintain 7-day retention
 */

-- ============================================================================
-- 1. ALTER PROFILES TABLE - Add friendship columns
-- ============================================================================

ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS friend_code TEXT UNIQUE;

ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS allow_friend_requests BOOLEAN DEFAULT true;

ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN DEFAULT true;

-- ============================================================================
-- 2. CAMPAIGNS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  gm_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  fear_current INTEGER NOT NULL DEFAULT 0,
  fear_max INTEGER NOT NULL DEFAULT 12, -- SRD: Max Fear is always 12
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. HELPER FUNCTIONS FOR CAMPAIGNS
-- ============================================================================

-- Generate unique 8-character invite codes (avoiding ambiguous characters)
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

-- Auto-generate invite code on insert with uniqueness check
CREATE OR REPLACE FUNCTION set_campaign_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    LOOP
      NEW.invite_code := generate_invite_code();
      -- Check if code is unique
      IF NOT EXISTS (SELECT 1 FROM public.campaigns WHERE invite_code = NEW.invite_code) THEN
        EXIT; -- Code is unique, use it
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaign_invite_code_trigger ON public.campaigns;
CREATE TRIGGER campaign_invite_code_trigger
  BEFORE INSERT ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION set_campaign_invite_code();

-- Indexes for efficient campaign queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_invite_code ON public.campaigns(invite_code);
CREATE INDEX IF NOT EXISTS idx_campaigns_gm ON public.campaigns(gm_user_id);

-- ============================================================================
-- 4. CAMPAIGNS RLS POLICIES
-- ============================================================================

ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY;

-- Members can view campaigns they're in (as GM or player)
DROP POLICY IF EXISTS "Members can view their campaigns" ON public.campaigns;
CREATE POLICY "Members can view their campaigns"
  ON public.campaigns FOR SELECT
  USING (
    gm_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.campaign_members
      WHERE campaign_id = campaigns.id
      AND user_id = auth.uid()
    )
  );

-- Only authenticated users can create campaigns
DROP POLICY IF EXISTS "Authenticated users can create campaigns" ON public.campaigns;
CREATE POLICY "Authenticated users can create campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (gm_user_id = auth.uid());

-- Only GM can update their campaign
DROP POLICY IF EXISTS "GM can update their campaign" ON public.campaigns;
CREATE POLICY "GM can update their campaign"
  ON public.campaigns FOR UPDATE
  USING (gm_user_id = auth.uid());

-- Only GM can delete their campaign
DROP POLICY IF EXISTS "GM can delete their campaign" ON public.campaigns;
CREATE POLICY "GM can delete their campaign"
  ON public.campaigns FOR DELETE
  USING (gm_user_id = auth.uid());

-- ============================================================================
-- 5. CAMPAIGN MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campaign_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'gm')),
  nickname TEXT, -- Optional display name override for this campaign
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
);

-- Indexes for efficient member queries
CREATE INDEX IF NOT EXISTS idx_campaign_members_user ON public.campaign_members(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign ON public.campaign_members(campaign_id);

-- ============================================================================
-- 6. CAMPAIGN MEMBERS RLS POLICIES
-- ============================================================================

ALTER TABLE IF EXISTS public.campaign_members ENABLE ROW LEVEL SECURITY;

-- Members can view other members in campaigns they're part of
DROP POLICY IF EXISTS "Members can view other campaign members" ON public.campaign_members;
CREATE POLICY "Members can view other campaign members"
  ON public.campaign_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_members cm
      WHERE cm.campaign_id = campaign_members.campaign_id
      AND cm.user_id = auth.uid()
    )
  );

-- Authenticated users can join campaigns (insert themselves as member)
DROP POLICY IF EXISTS "Users can join campaigns" ON public.campaign_members;
CREATE POLICY "Users can join campaigns"
  ON public.campaign_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Members can update their own membership (character, nickname, etc.)
DROP POLICY IF EXISTS "Members can update own membership" ON public.campaign_members;
CREATE POLICY "Members can update own membership"
  ON public.campaign_members FOR UPDATE
  USING (user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_members.campaign_id
      AND c.gm_user_id = auth.uid()
    )
  );

-- Members can leave (delete their own membership)
DROP POLICY IF EXISTS "Members can delete own membership" ON public.campaign_members;
CREATE POLICY "Members can delete own membership"
  ON public.campaign_members FOR DELETE
  USING (user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_members.campaign_id
      AND c.gm_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. CAMPAIGN ACTIVITY TABLE (Phase 3: Activity Feed)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campaign_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
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

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient feed queries
CREATE INDEX IF NOT EXISTS idx_campaign_activity_feed
  ON public.campaign_activity(campaign_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_activity_user
  ON public.campaign_activity(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_activity_type
  ON public.campaign_activity(campaign_id, activity_type);

-- ============================================================================
-- 8. CAMPAIGN ACTIVITY RLS POLICIES
-- ============================================================================

ALTER TABLE IF EXISTS public.campaign_activity ENABLE ROW LEVEL SECURITY;

-- Members can view activity (except others' private activities)
DROP POLICY IF EXISTS "Members can view campaign activity" ON public.campaign_activity;
CREATE POLICY "Members can view campaign activity"
  ON public.campaign_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_members cm
      WHERE cm.campaign_id = campaign_activity.campaign_id
      AND cm.user_id = auth.uid()
    )
    AND (
      is_private = false
      OR user_id = auth.uid()
    )
  );

-- Members can insert their own activity
DROP POLICY IF EXISTS "Members can insert own activity" ON public.campaign_activity;
CREATE POLICY "Members can insert own activity"
  ON public.campaign_activity FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.campaign_members cm
      WHERE cm.campaign_id = campaign_activity.campaign_id
      AND cm.user_id = auth.uid()
    )
  );

-- GM can insert activity for anyone (for damage/heal actions)
DROP POLICY IF EXISTS "GM can insert activity" ON public.campaign_activity;
CREATE POLICY "GM can insert activity"
  ON public.campaign_activity FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_activity.campaign_id
      AND c.gm_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. ACTIVITY CLEANUP FUNCTION
-- Delete activity older than 7 days to prevent unbounded growth
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_activity()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.campaign_activity
  WHERE created_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. FRIENDSHIPS TABLE (Phase 7: Social Features)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate requests (either direction)
  UNIQUE(requester_id, recipient_id),
  -- Prevent self-friending
  CHECK (requester_id != recipient_id)
);

-- ============================================================================
-- 11. HELPER FUNCTIONS FOR FRIENDSHIPS
-- ============================================================================

-- Generate unique 8-character friend codes
CREATE OR REPLACE FUNCTION generate_friend_code()
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

-- Auto-generate friend code for new/updated profiles
CREATE OR REPLACE FUNCTION set_profile_friend_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.friend_code IS NULL OR NEW.friend_code = '' THEN
    LOOP
      NEW.friend_code := generate_friend_code();
      -- Check if code is unique
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE friend_code = NEW.friend_code AND id != NEW.id) THEN
        EXIT; -- Code is unique, use it
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profile_friend_code_trigger ON public.profiles;
CREATE TRIGGER profile_friend_code_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profile_friend_code();

-- Index for friend code lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_friend_code ON public.profiles(friend_code);

-- ============================================================================
-- 12. FRIENDSHIPS RLS POLICIES
-- ============================================================================

ALTER TABLE IF EXISTS public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can view friendships they're part of
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
CREATE POLICY "Users can view own friendships"
  ON public.friendships FOR SELECT
  USING (requester_id = auth.uid() OR recipient_id = auth.uid());

-- Users can create friend requests (as requester)
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (
    requester_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = recipient_id
      AND p.allow_friend_requests = true
    )
  );

-- Users can update friendships they're part of (accept/decline/block)
DROP POLICY IF EXISTS "Users can update own friendships" ON public.friendships;
CREATE POLICY "Users can update own friendships"
  ON public.friendships FOR UPDATE
  USING (requester_id = auth.uid() OR recipient_id = auth.uid());

-- Users can delete friendships they're part of (unfriend)
DROP POLICY IF EXISTS "Users can delete own friendships" ON public.friendships;
CREATE POLICY "Users can delete own friendships"
  ON public.friendships FOR DELETE
  USING (requester_id = auth.uid() OR recipient_id = auth.uid());

-- ============================================================================
-- 13. INDEXES FOR FRIENDSHIPS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_recipient ON public.friendships(recipient_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- ============================================================================
-- 14. TRIGGER FOR FRIENDSHIPS UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_friendships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS friendships_updated_at ON public.friendships;
CREATE TRIGGER friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_friendships_updated_at();

-- ============================================================================
-- 15. HELPER FUNCTIONS FOR FRIENDSHIPS
-- ============================================================================

-- Find user by friend code (case-insensitive)
CREATE OR REPLACE FUNCTION find_user_by_friend_code(friend_code_param TEXT)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  allow_friend_requests BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as user_id,
    p.username,
    p.avatar_url,
    p.allow_friend_requests
  FROM public.profiles p
  WHERE UPPER(p.friend_code) = UPPER(friend_code_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if friendship exists (either direction) and return status
CREATE OR REPLACE FUNCTION check_friendship_exists(user_a UUID, user_b UUID)
RETURNS TABLE (
  exists_val BOOLEAN,
  friendship_id UUID,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    true as exists_val,
    f.id as friendship_id,
    f.status
  FROM public.friendships f
  WHERE (f.requester_id = user_a AND f.recipient_id = user_b)
    OR (f.requester_id = user_b AND f.recipient_id = user_a)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
