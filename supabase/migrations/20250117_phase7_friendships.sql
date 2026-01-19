/**
 * MIGRATION: Phase 7 Friendships (GH#67)
 *
 * This migration adds the friendship system to the Daggerheart Character Sheet.
 *
 * Changes:
 * 1. Add friend_code, allow_friend_requests, and show_online_status columns to profiles table
 * 2. Create friendships table for managing friend requests and relationships
 * 3. Create RLS policies for friend access control
 * 4. Create helper functions for friend lookups
 */

-- ============================================================================
-- 1. ALTER PROFILES TABLE - Add friendship columns
-- ============================================================================

-- Add friend_code column (unique 8-character code for adding friends)
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS friend_code TEXT UNIQUE;

-- Add friend request settings
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS allow_friend_requests BOOLEAN DEFAULT true;

-- Add online status visibility setting
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN DEFAULT true;

-- ============================================================================
-- 2. CREATE FRIENDSHIPS TABLE
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
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_recipient ON public.friendships(recipient_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- ============================================================================
-- 4. CREATE TRIGGER FOR UPDATED_AT TIMESTAMP
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
-- 5. ENABLE ROW LEVEL SECURITY & CREATE RLS POLICIES
-- ============================================================================

ALTER TABLE IF EXISTS public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can view friendships they're part of (either requester or recipient)
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
CREATE POLICY "Users can view own friendships"
  ON public.friendships FOR SELECT
  USING (requester_id = auth.uid() OR recipient_id = auth.uid());

-- Users can create friend requests (as requester)
-- Verifies recipient allows friend requests
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
-- 6. CREATE HELPER FUNCTIONS
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
