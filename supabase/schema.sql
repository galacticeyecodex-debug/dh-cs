/*
 * DATABASE SCHEMA (Daggerheart Character Sheet)
 * ----------------------------------------------------------------------------
 * This SQL file defines the complete database structure for the application. It is the sole source of truth for the database schema (no migrations needed).
 * 
 * FUNCTIONALITY:
 * 1. PROFILES: Manages user accounts linked to Supabase Auth.
 * 2. LIBRARY: Stores static game data (Classes, Ancestries, Cards, Items) modeled after the Daggerheart system.
 * 3. CHARACTERS: The core table storing all dynamic character state (Stats, Vitals, Experiences, Progression).
 *    - Includes JSONB fields for flexible data storage (stats, inventory, progression tracking).
 *    - Tracks leveling history and multiclassing details.
 * 4. CHARACTER_CARDS: Manages the collection of Domain and Ability cards a character owns, including their state (active/vault).
 * 5. CHARACTER_INVENTORY: Tracks equipment and items.
 * 
 * SECURITY:
 * - Implements Row Level Security (RLS) policies to ensure users can only access and modify their own data.
 * - Includes helper functions (RPCs) for atomic operations like creating a complete character.
 */

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
-- Linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  content_access JSONB DEFAULT '{"srd": true, "playtest": false, "homebrew": {}}'::jsonb, -- Controls access to content sources (SRD, playtest, homebrew campaigns)
  friend_code TEXT UNIQUE, -- 8-character code for friend requests (like Discord friend code)
  allow_friend_requests BOOLEAN DEFAULT true, -- Whether user accepts friend requests
  show_online_status BOOLEAN DEFAULT true, -- Whether user shows online status to friends
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. LIBRARY (Game Content)
-- Used for static game data (classes, cards, etc.) from various sources
CREATE TABLE IF NOT EXISTS public.library (
  id TEXT PRIMARY KEY, -- e.g. 'class-bard', 'card-beastbound'
  type TEXT NOT NULL, -- 'class', 'subclass', 'card', 'item'
  name TEXT NOT NULL,
  domain TEXT, -- Nullable (e.g. for classes)
  tier INT,    -- Nullable
  source TEXT DEFAULT 'srd' CHECK (source IN ('srd', 'playtest', 'homebrew')), -- Content source for access control
  data JSONB NOT NULL, -- The raw JSON content
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient content filtering by source
CREATE INDEX IF NOT EXISTS idx_library_source ON public.library(source);

-- DROP TABLES for Clean Reset (Development Mode)
-- This ensures that if the schema changes, we don't get "relation exists" errors with old structures.
DROP TABLE IF EXISTS public.character_inventory CASCADE;
DROP TABLE IF EXISTS public.character_cards CASCADE;
DROP TABLE IF EXISTS public.characters CASCADE;

-- 3. CHARACTERS
-- Stores the player characters
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  level INT DEFAULT 1,
  class_id TEXT, -- Could reference library(id) or just be text
  subclass_id TEXT,
  ancestry TEXT,
  ancestry_features JSONB, -- Stores selected features for mixed ancestry
  community TEXT,
  transformation TEXT, -- Optional transformation card (Vampire, Werewolf, etc.)

  -- Core Stats (Traits)
  stats JSONB DEFAULT '{"agility": 0, "strength": 0, "finesse": 0, "instinct": 0, "presence": 0, "knowledge": 0}'::jsonb,
  
  -- Vitals (HP, Stress, Armor)
  -- Updated to use new terminology: hit_points_current, armor_slots, armor_score
  vitals JSONB DEFAULT '{"hit_points_current": 6, "hit_points_max": 6, "stress_current": 0, "stress_max": 6, "armor_slots": 0, "armor_score": 0}'::jsonb,
  
  damage_thresholds JSONB DEFAULT '{"minor": 1, "major": 1, "severe": 2}'::jsonb,

  -- Metacurrency
  hope INT DEFAULT 2,
  fear INT DEFAULT 0, -- GM currency, but maybe tracked here for solo/co-op?
  
  -- Calculated/Base Stats
  evasion INT DEFAULT 10,
  proficiency INT DEFAULT 1,
  spellcast_trait TEXT, -- e.g. 'Instinct', 'Presence'
  
  -- Lists
  experiences JSONB DEFAULT '[]'::jsonb,
  domains TEXT[] DEFAULT '{}',
  
  -- Inventory/Gold
  gold JSONB DEFAULT '{"handfuls": 0, "bags": 0, "chests": 0}'::jsonb,
  
  image_url TEXT,
  background_image_url TEXT,

  modifiers JSONB DEFAULT '{}'::jsonb, -- Store user modifiers here

  -- Lore fields
  appearance TEXT,
  background TEXT,
  connections TEXT,
  pronouns TEXT,
  gallery_images TEXT[],

  -- Leveling tracking
  marked_traits_jsonb JSONB DEFAULT '{}'::jsonb, -- Traits marked in current tier
  advancement_history_jsonb JSONB DEFAULT '{}'::jsonb, -- Complete advancement records per level
  subclass_progression JSONB DEFAULT '{}'::jsonb, -- Tracks obtained subclass features

  -- Multiclass tracking
  multiclass_id TEXT, -- Secondary class selected at level 5+ via multiclass advancement
  multiclass_subclass_id TEXT, -- Subclass chosen for multiclass
  multiclass_progression JSONB DEFAULT '{}'::jsonb, -- Tracks foundation/specialization/mastery for multiclass subclass

  -- Beastbond Ranger Companion
  ranger_companion JSONB, -- Stores companion data for Beastbound Rangers

  -- Seraph Prayer Dice
  seraph_prayer_dice JSONB, -- Stores prayer dice data for Seraph class

  -- Class Features (New)
  bard_rally_dice JSONB,        -- Stores Rally Die state for Bard
  guardian_unstoppable JSONB,   -- Stores Unstoppable Die state for Guardian
  wizard_strange_patterns JSONB, -- Stores Strange Patterns state for Wizard
  druid_beastform JSONB,        -- Stores Beastform active state for Druid
  ranger_focus JSONB,           -- Stores Ranger's Focus state for Ranger
  warrior_slayer_dice JSONB,    -- Stores Slayer Dice pool for Warrior (Call of the Slayer)
  sorcerer_element TEXT,        -- Stores chosen element for Sorcerer (Elemental Origin)
  druid_elemental_incarnation JSONB, -- Stores Elemental Incarnation state for Druid (Warden of the Elements)

  -- Card State tracking (tokens, frequency usage for domain cards)
  card_states JSONB DEFAULT '{}'::jsonb, -- Keyed by card name, stores tokens/usage state

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CHARACTER CARDS (The Loadout)
CREATE TABLE IF NOT EXISTS public.character_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  card_id TEXT REFERENCES public.library(id) ON DELETE CASCADE NOT NULL,
  location TEXT NOT NULL DEFAULT 'vault',
  state JSONB DEFAULT '{"tokens": 0, "exhausted": false}'::jsonb,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. HOMEBREW ITEMS (User-Created Custom Items)
-- Created BEFORE character_inventory so foreign key can reference it
CREATE TABLE IF NOT EXISTS public.homebrew_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('weapon', 'armor', 'item', 'consumable')),
  name TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}'::jsonb, -- Contains modifiers, damage, armor_score, burden, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CHARACTER INVENTORY (Equipment)
CREATE TABLE IF NOT EXISTS public.character_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT REFERENCES public.library(id) ON DELETE SET NULL,
  homebrew_item_id UUID REFERENCES public.homebrew_items(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL DEFAULT 'backpack',
  quantity INT DEFAULT 1,
  state JSONB DEFAULT '{}'::jsonb, -- Stores custom_image_url, custom_image_position_x, custom_image_position_y
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CHARACTER PROJECTS (Long-term goals with countdown clocks)
CREATE TABLE IF NOT EXISTS public.character_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  
  -- Project metadata
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'generic', 'study_token', 'signature_spell', 'job', 'extracurricular'
  )),
  
  -- Progress tracking (countdown clock)
  countdown_total INT NOT NULL DEFAULT 4,
  countdown_current INT NOT NULL DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  
  -- Type-specific data (JSONB for flexibility)
  data JSONB DEFAULT '{}'::jsonb,
  -- For study_token: { lesson: "Astrology", exam_semester: "Fall 1" }
  -- For signature_spell: { spell_name: "...", spell_level: 3, effect: "..." }
  -- For job: { employer: "Firejolt Cafe", pay: "1 handful" }
  -- For extracurricular: { club: "Dead Languages Society" }
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 8. CHARACTER RELATIONSHIPS (NPC tracking with relationship tiers)
CREATE TABLE IF NOT EXISTS public.character_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  character_name TEXT, -- Denormalized for easier debugging/troubleshooting
  
  -- NPC data
  npc_name TEXT NOT NULL,
  npc_description TEXT,
  npc_image_url TEXT,
  
  -- Relationship state
  points INT NOT NULL DEFAULT 0,
  -- Computed tier based on points:
  -- <= -4: enemy, -3 to -2: rival, -1 to +1: acquaintance, +2 to +3: friend, >= +4: beloved
  
  -- Bond effects (from campaign content or custom)
  bond_boon TEXT,
  bond_bane TEXT,
  
  -- Notes and context
  notes TEXT,
  campaign TEXT, -- e.g., 'my-campaign', 'core', null for generic
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles RLS and policies (drop policy if exists first)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'profiles' AND n.nspname = 'public') THEN

    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if present, then create
    BEGIN
      EXECUTE 'DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles';
    EXCEPTION WHEN undefined_object THEN
      -- ignore
    END;

    CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

    BEGIN
      EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles';
    EXCEPTION WHEN undefined_object THEN
    END;
    CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

    BEGIN
      EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles';
    EXCEPTION WHEN undefined_object THEN
    END;
    CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Characters RLS and policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'characters' AND n.nspname = 'public') THEN

    ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

    EXECUTE 'DROP POLICY IF EXISTS "Characters viewable by owner" ON public.characters';
    CREATE POLICY "Characters viewable by owner" ON public.characters FOR SELECT USING (auth.uid() = user_id);

    EXECUTE 'DROP POLICY IF EXISTS "Characters insertable by owner" ON public.characters';
    CREATE POLICY "Characters insertable by owner" ON public.characters FOR INSERT WITH CHECK (auth.uid() = user_id);

    EXECUTE 'DROP POLICY IF EXISTS "Characters updatable by owner" ON public.characters';
    CREATE POLICY "Characters updatable by owner" ON public.characters FOR UPDATE USING (auth.uid() = user_id);

    EXECUTE 'DROP POLICY IF EXISTS "Characters deletable by owner" ON public.characters';
    CREATE POLICY "Characters deletable by owner" ON public.characters FOR DELETE USING (auth.uid() = user_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Character Cards RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'character_cards' AND n.nspname = 'public') THEN

    ALTER TABLE public.character_cards ENABLE ROW LEVEL SECURITY;

    EXECUTE 'DROP POLICY IF EXISTS "Cards viewable by char owner" ON public.character_cards';
    CREATE POLICY "Cards viewable by char owner" ON public.character_cards FOR SELECT USING (
      character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Cards insertable by char owner" ON public.character_cards';
    CREATE POLICY "Cards insertable by char owner" ON public.character_cards FOR INSERT WITH CHECK (
      character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Cards updatable by char owner" ON public.character_cards';
    CREATE POLICY "Cards updatable by char owner" ON public.character_cards FOR UPDATE USING (
      character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Cards deletable by char owner" ON public.character_cards';
    CREATE POLICY "Cards deletable by char owner" ON public.character_cards FOR DELETE USING (
      character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Character Inventory RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'character_inventory' AND n.nspname = 'public') THEN

    ALTER TABLE public.character_inventory ENABLE ROW LEVEL SECURITY;

    EXECUTE 'DROP POLICY IF EXISTS "Inventory viewable by char owner" ON public.character_inventory';
    CREATE POLICY "Inventory viewable by char owner" ON public.character_inventory FOR SELECT USING (
      character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Inventory insertable by char owner" ON public.character_inventory';
    CREATE POLICY "Inventory insertable by char owner" ON public.character_inventory FOR INSERT WITH CHECK (
      character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Inventory updatable by char owner" ON public.character_inventory';
    CREATE POLICY "Inventory updatable by char owner" ON public.character_inventory FOR UPDATE USING (
      character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Inventory deletable by char owner" ON public.character_inventory';
    CREATE POLICY "Inventory deletable by char owner" ON public.character_inventory FOR DELETE USING (
      character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Homebrew Items RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'homebrew_items' AND n.nspname = 'public') THEN

    ALTER TABLE public.homebrew_items ENABLE ROW LEVEL SECURITY;

    EXECUTE 'DROP POLICY IF EXISTS "Users can view own homebrew items" ON public.homebrew_items';
    CREATE POLICY "Users can view own homebrew items" ON public.homebrew_items FOR SELECT USING (auth.uid() = user_id);

    EXECUTE 'DROP POLICY IF EXISTS "Users can create own homebrew items" ON public.homebrew_items';
    CREATE POLICY "Users can create own homebrew items" ON public.homebrew_items FOR INSERT WITH CHECK (auth.uid() = user_id);

    EXECUTE 'DROP POLICY IF EXISTS "Users can update own homebrew items" ON public.homebrew_items';
    CREATE POLICY "Users can update own homebrew items" ON public.homebrew_items FOR UPDATE USING (auth.uid() = user_id);

    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own homebrew items" ON public.homebrew_items';
    CREATE POLICY "Users can delete own homebrew items" ON public.homebrew_items FOR DELETE USING (auth.uid() = user_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Check if user can manage a character's projects
-- SECURITY DEFINER bypasses RLS to prevent recursion issues
CREATE OR REPLACE FUNCTION can_manage_character_projects(p_character_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user owns the character
  IF EXISTS (
    SELECT 1 FROM public.characters
    WHERE id = p_character_id AND user_id = p_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check if user is GM of a campaign containing this character
  IF EXISTS (
    SELECT 1 FROM public.campaigns c
    INNER JOIN public.campaign_members cm ON c.id = cm.campaign_id
    WHERE cm.character_id = p_character_id
    AND c.gm_user_id = p_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Character Projects RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'character_projects' AND n.nspname = 'public') THEN

    ALTER TABLE public.character_projects ENABLE ROW LEVEL SECURITY;

    EXECUTE 'DROP POLICY IF EXISTS "Projects viewable by char owner" ON public.character_projects';
    CREATE POLICY "Projects viewable by char owner" ON public.character_projects FOR SELECT USING (
      can_manage_character_projects(character_id, auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Projects insertable by char owner" ON public.character_projects';
    CREATE POLICY "Projects insertable by char owner" ON public.character_projects FOR INSERT WITH CHECK (
      can_manage_character_projects(character_id, auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Projects updatable by char owner" ON public.character_projects';
    CREATE POLICY "Projects updatable by char owner" ON public.character_projects FOR UPDATE USING (
      can_manage_character_projects(character_id, auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Projects deletable by char owner" ON public.character_projects';
    CREATE POLICY "Projects deletable by char owner" ON public.character_projects FOR DELETE USING (
      can_manage_character_projects(character_id, auth.uid())
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Character Relationships RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'character_relationships' AND n.nspname = 'public') THEN

    ALTER TABLE public.character_relationships ENABLE ROW LEVEL SECURITY;

    EXECUTE 'DROP POLICY IF EXISTS "Relationships viewable by char owner" ON public.character_relationships';
    CREATE POLICY "Relationships viewable by char owner" ON public.character_relationships FOR SELECT USING (
      character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Relationships insertable by char owner" ON public.character_relationships';
    CREATE POLICY "Relationships insertable by char owner" ON public.character_relationships FOR INSERT WITH CHECK (
      character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Relationships updatable by char owner" ON public.character_relationships';
    CREATE POLICY "Relationships updatable by char owner" ON public.character_relationships FOR UPDATE USING (
      character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Relationships deletable by char owner" ON public.character_relationships';
    CREATE POLICY "Relationships deletable by char owner" ON public.character_relationships FOR DELETE USING (
      character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS --
-- Recreate trigger function (non-destructive)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Avoid duplicate insert if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'avatar_url'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure old trigger removed, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RPC FUNCTIONS --

-- Function to create a character with initial cards and inventory in one transaction
-- Bypasses RLS for dependent tables since it verifies ownership via auth.uid()
CREATE OR REPLACE FUNCTION create_complete_character(
  p_character jsonb,
  p_cards jsonb,
  p_inventory jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_character_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  -- 1. Insert Character
  INSERT INTO public.characters (
    user_id, name, level, class_id, subclass_id, ancestry, ancestry_features, community, transformation,
    stats, vitals, damage_thresholds, hope, fear, evasion, proficiency,
    experiences, domains, gold, image_url, modifiers,
    subclass_progression
  ) VALUES (
    v_user_id,
    p_character->>'name',
    COALESCE((p_character->>'level')::int, 1),
    p_character->>'class_id',
    p_character->>'subclass_id',
    p_character->>'ancestry',
    p_character->'ancestry_features',
    p_character->>'community',
    p_character->>'transformation',
    COALESCE(p_character->'stats', '{}'::jsonb),
    COALESCE(p_character->'vitals', '{}'::jsonb),
    COALESCE(p_character->'damage_thresholds', '{"minor": 1, "major": 1, "severe": 2}'::jsonb),
    COALESCE((p_character->>'hope')::int, 2),
    COALESCE((p_character->>'fear')::int, 0),
    COALESCE((p_character->>'evasion')::int, 10),
    COALESCE((p_character->>'proficiency')::int, 1),
    COALESCE(p_character->'experiences', '[]'::jsonb),
    (SELECT array_agg(x) FROM jsonb_array_elements_text(p_character->'domains') t(x)),
    COALESCE(p_character->'gold', '{}'::jsonb),
    p_character->>'image_url',
    COALESCE(p_character->'modifiers', '{}'::jsonb),
    COALESCE(p_character->'subclass_progression', '{}'::jsonb)
  ) RETURNING id INTO v_character_id;

  -- 2. Insert Cards
  IF jsonb_array_length(p_cards) > 0 THEN
    INSERT INTO public.character_cards (character_id, card_id, location, sort_order)
    SELECT 
      v_character_id,
      x->>'card_id',
      x->>'location',
      (x->>'sort_order')::int
    FROM jsonb_array_elements(p_cards) as x;
  END IF;

  -- 3. Insert Inventory
  IF jsonb_array_length(p_inventory) > 0 THEN
    INSERT INTO public.character_inventory (character_id, item_id, name, description, location, quantity)
    SELECT 
      v_character_id,
      x->>'item_id',
      x->>'name',
      x->>'description',
      x->>'location',
      (x->>'quantity')::int
    FROM jsonb_array_elements(p_inventory) as x;
  END IF;

  RETURN v_character_id;
END;
$$;

-- INDEXES for Performance
-- Index for efficient queries on advancement history
CREATE INDEX IF NOT EXISTS idx_characters_advancement_history
  ON public.characters USING GIN (advancement_history_jsonb);

-- Index for efficient queries on marked traits
CREATE INDEX IF NOT EXISTS idx_characters_marked_traits
  ON public.characters USING GIN (marked_traits_jsonb);

-- Indexes for homebrew items
CREATE INDEX IF NOT EXISTS idx_homebrew_items_user_id
  ON public.homebrew_items(user_id);

CREATE INDEX IF NOT EXISTS idx_homebrew_items_type
  ON public.homebrew_items(type);

-- Index for character_inventory homebrew_item_id foreign key
CREATE INDEX IF NOT EXISTS idx_character_inventory_homebrew_item_id
  ON public.character_inventory(homebrew_item_id);

-- Trigger to update updated_at timestamp for homebrew items
CREATE OR REPLACE FUNCTION update_homebrew_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS homebrew_items_updated_at ON public.homebrew_items;
CREATE TRIGGER homebrew_items_updated_at
  BEFORE UPDATE ON public.homebrew_items
  FOR EACH ROW
  EXECUTE FUNCTION update_homebrew_items_updated_at();

-- =============================================================================
-- 9. CAMPAIGNS (Phase 1: Social Features - GH#67)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  gm_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  fear_current INTEGER NOT NULL DEFAULT 0,
  fear_max INTEGER NOT NULL DEFAULT 12, -- SRD: Max Fear is always 12
  settings JSONB DEFAULT '{}'::jsonb,
  -- Phase 9: Countdowns and Projects (GH#67)
  countdowns JSONB DEFAULT '[]'::jsonb, -- GM countdown trackers
  projects JSONB DEFAULT '[]'::jsonb, -- Player projects from Downtime
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- =============================================================================
-- 10. CAMPAIGN MEMBERS
-- =============================================================================

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

-- =============================================================================
-- CAMPAIGNS/CAMPAIGN_MEMBERS RLS HELPER FUNCTIONS (SECURITY DEFINER)
-- =============================================================================
-- These SECURITY DEFINER functions bypass RLS, preventing infinite recursion
-- when campaigns and campaign_members RLS policies need to check each other.
-- Without these, policies that check "is user a member of campaign X" would
-- trigger the campaign_members SELECT policy, which would check "is user a
-- member of campaign X", causing infinite recursion.
-- =============================================================================

-- Helper function: Get user's campaign IDs (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_campaign_ids(p_user_id UUID)
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT campaign_id FROM public.campaign_members
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function: Check if user is in a campaign (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION is_campaign_member_check(p_campaign_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.campaign_members
    WHERE campaign_id = p_campaign_id
    AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- CAMPAIGNS RLS POLICIES (Uses helper functions to avoid recursion)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'campaigns' AND n.nspname = 'public') THEN

    ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

    -- Drop old policies first
    EXECUTE 'DROP POLICY IF EXISTS "Members can view their campaigns" ON public.campaigns';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their campaigns" ON public.campaigns';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can create campaigns" ON public.campaigns';
    EXECUTE 'DROP POLICY IF EXISTS "GM can update campaign" ON public.campaigns';
    EXECUTE 'DROP POLICY IF EXISTS "GM can delete campaign" ON public.campaigns';

    -- Members can view campaigns they're in (using helper function)
    CREATE POLICY "Users can view their campaigns"
      ON public.campaigns FOR SELECT
      USING (
        gm_user_id = auth.uid()
        OR id IN (SELECT get_user_campaign_ids(auth.uid()))
      );

    -- Only authenticated users can create campaigns as GM
    CREATE POLICY "Authenticated users can create campaigns"
      ON public.campaigns FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL AND gm_user_id = auth.uid());

    -- Only GM can update campaign
    CREATE POLICY "GM can update campaign"
      ON public.campaigns FOR UPDATE
      USING (gm_user_id = auth.uid());

    -- Only GM can delete campaign
    CREATE POLICY "GM can delete campaign"
      ON public.campaigns FOR DELETE
      USING (gm_user_id = auth.uid());
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CAMPAIGN MEMBERS RLS POLICIES (Uses helper function to avoid recursion)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'campaign_members' AND n.nspname = 'public') THEN

    ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

    -- Drop old policies first
    EXECUTE 'DROP POLICY IF EXISTS "Members can view campaign members" ON public.campaign_members';
    EXECUTE 'DROP POLICY IF EXISTS "Users can join campaigns" ON public.campaign_members';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own membership" ON public.campaign_members';
    EXECUTE 'DROP POLICY IF EXISTS "GM can update any membership" ON public.campaign_members';
    EXECUTE 'DROP POLICY IF EXISTS "Users can leave campaigns" ON public.campaign_members';
    EXECUTE 'DROP POLICY IF EXISTS "GM can remove members" ON public.campaign_members';

    -- Members can view other members in their campaigns (using helper function)
    CREATE POLICY "Members can view campaign members"
      ON public.campaign_members FOR SELECT
      USING (
        user_id = auth.uid()
        OR is_campaign_member_check(campaign_id, auth.uid())
      );

    -- Users can join campaigns (insert themselves)
    CREATE POLICY "Users can join campaigns"
      ON public.campaign_members FOR INSERT
      WITH CHECK (user_id = auth.uid());

    -- Users can update their own membership (e.g., change character)
    CREATE POLICY "Users can update own membership"
      ON public.campaign_members FOR UPDATE
      USING (user_id = auth.uid());

    -- Users can leave campaigns (delete themselves)
    CREATE POLICY "Users can leave campaigns"
      ON public.campaign_members FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- 10. GM SCREEN (Phase 2: GM Screen MVP - GH#67)
-- =============================================================================

-- GM can view characters of their campaign members
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

-- Campaign members can view basic info of party characters
-- This is needed for the member list and party overview to display character names
CREATE POLICY "Campaign members can view party characters"
  ON characters FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM campaign_members my_membership
      JOIN campaign_members other_membership ON my_membership.campaign_id = other_membership.campaign_id
      WHERE my_membership.user_id = auth.uid()
      AND other_membership.character_id = characters.id
    )
  );

-- GM can update member characters (for vitals adjustments)
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

-- Fear management function (atomic updates with GM verification)
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

  -- Update Fear value (clamped between 0 and fear_max)
  UPDATE campaigns
  SET fear_current = GREATEST(0, LEAST(fear_max, fear_current + change_amount)),
      updated_at = NOW()
  WHERE id = campaign_id_param
  RETURNING * INTO updated_campaign;

  RETURN updated_campaign;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 11. CAMPAIGN ACTIVITY (Phase 3: Activity Feed - GH#67)
-- =============================================================================

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

-- =============================================================================
-- CAMPAIGN ACTIVITY RLS POLICIES
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'campaign_activity' AND n.nspname = 'public') THEN

    ALTER TABLE public.campaign_activity ENABLE ROW LEVEL SECURITY;

    -- Members can view activity (except others' private activities)
    EXECUTE 'DROP POLICY IF EXISTS "Members can view campaign activity" ON public.campaign_activity';
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
    EXECUTE 'DROP POLICY IF EXISTS "Members can insert own activity" ON public.campaign_activity';
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
    EXECUTE 'DROP POLICY IF EXISTS "GM can insert activity" ON public.campaign_activity';
    CREATE POLICY "GM can insert activity"
      ON public.campaign_activity FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.campaigns c
          WHERE c.id = campaign_activity.campaign_id
          AND c.gm_user_id = auth.uid()
        )
      );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ACTIVITY CLEANUP FUNCTION
-- Delete activity older than 7 days to prevent unbounded growth
-- =============================================================================

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

-- =============================================================================
-- 12. FRIENDSHIPS (Phase 7: Social Features - GH#67)
-- =============================================================================

-- Generate unique 8-character friend codes (avoiding ambiguous characters)
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

-- Auto-generate friend code for new profiles
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

-- Friendships table
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

-- Indexes for efficient friendship lookups
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_recipient ON public.friendships(recipient_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- Trigger to update updated_at timestamp
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

-- =============================================================================
-- FRIENDSHIPS RLS POLICIES
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'friendships' AND n.nspname = 'public') THEN

    ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

    -- Users can view friendships they're part of
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships';
    CREATE POLICY "Users can view own friendships"
      ON public.friendships FOR SELECT
      USING (requester_id = auth.uid() OR recipient_id = auth.uid());

    -- Users can create friend requests (as requester)
    EXECUTE 'DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships';
    CREATE POLICY "Users can send friend requests"
      ON public.friendships FOR INSERT
      WITH CHECK (
        requester_id = auth.uid()
        -- Verify recipient allows friend requests
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = recipient_id
          AND p.allow_friend_requests = true
        )
      );

    -- Users can update friendships they're part of (accept/decline/block)
    -- Requester can cancel pending, Recipient can accept/decline, Either can block
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own friendships" ON public.friendships';
    CREATE POLICY "Users can update own friendships"
      ON public.friendships FOR UPDATE
      USING (requester_id = auth.uid() OR recipient_id = auth.uid());

    -- Users can delete friendships they're part of (unfriend)
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own friendships" ON public.friendships';
    CREATE POLICY "Users can delete own friendships"
      ON public.friendships FOR DELETE
      USING (requester_id = auth.uid() OR recipient_id = auth.uid());
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- HELPER FUNCTIONS FOR FRIENDSHIPS
-- =============================================================================

-- Function to find user by friend code
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

-- Function to check if friendship exists (either direction)
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
  
  -- If no rows returned, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT false as exists_val, NULL::UUID as friendship_id, NULL::TEXT as status;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- REALTIME CONFIGURATION
-- =============================================================================
-- Enable Supabase Realtime for tables that need live updates.
-- This is REQUIRED for the WebSocket subscription to receive INSERT/UPDATE events.
-- Without this, Realtime won't broadcast changes from these tables.
-- =============================================================================

-- First, ensure the supabase_realtime publication exists (it should by default)
-- Then add our tables to it

-- Add campaign_activity to realtime (for live roll notifications and activity feed)
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_activity;

-- Add campaigns to realtime (for Fear updates and other campaign changes)
ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;

-- Add characters to realtime (for vital updates on GM screen)
ALTER PUBLICATION supabase_realtime ADD TABLE characters;

-- 9. SHARED HOMEBREW (Social Features)
-- Allows sharing items/content between users or campaigns
CREATE TABLE IF NOT EXISTS public.shared_homebrew (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT CHECK (target_type IN ('campaign', 'friend', 'public')),
  target_id UUID, -- Can be campaign_id or user_id (optional for public)
  item_data JSONB NOT NULL, -- Snapshot of the item being shared
  original_item_id UUID, -- Reference to original item if from library
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shared Homebrew RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'shared_homebrew' AND n.nspname = 'public') THEN

    ALTER TABLE public.shared_homebrew ENABLE ROW LEVEL SECURITY;

    -- 1. Source user can manage their shared items
    CREATE POLICY "Users can manage their shared items" ON public.shared_homebrew
      USING (auth.uid() = source_user_id);

    -- 2. Users can view items shared with them specifically (Friend)
    CREATE POLICY "Users can view items shared with them" ON public.shared_homebrew
      FOR SELECT USING (
        target_type = 'friend' AND target_id = auth.uid()
      );

    -- 3. Campaign members can view items shared with the campaign
    CREATE POLICY "Campaign members can view shared items" ON public.shared_homebrew
      FOR SELECT USING (
        target_type = 'campaign' AND
        EXISTS (
            SELECT 1 FROM public.characters c
            WHERE c.campaign_id = shared_homebrew.target_id
            AND c.user_id = auth.uid()
        )
      );

    -- 4. Public items are visible to everyone
    CREATE POLICY "Everyone can view public items" ON public.shared_homebrew
      FOR SELECT USING (target_type = 'public');
  END IF;
END;
$$ LANGUAGE plpgsql;
