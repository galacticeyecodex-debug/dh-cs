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

-- Character Projects RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'character_projects' AND n.nspname = 'public') THEN

    ALTER TABLE public.character_projects ENABLE ROW LEVEL SECURITY;

    EXECUTE 'DROP POLICY IF EXISTS "Projects viewable by char owner" ON public.character_projects';
    CREATE POLICY "Projects viewable by char owner" ON public.character_projects FOR SELECT USING (
      character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Projects insertable by char owner" ON public.character_projects';
    CREATE POLICY "Projects insertable by char owner" ON public.character_projects FOR INSERT WITH CHECK (
      character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Projects updatable by char owner" ON public.character_projects';
    CREATE POLICY "Projects updatable by char owner" ON public.character_projects FOR UPDATE USING (
      character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Projects deletable by char owner" ON public.character_projects';
    CREATE POLICY "Projects deletable by char owner" ON public.character_projects FOR DELETE USING (
      character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
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
  fear_max INTEGER NOT NULL DEFAULT 10,
  settings JSONB DEFAULT '{}'::jsonb,
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
-- CAMPAIGNS RLS POLICIES
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'campaigns' AND n.nspname = 'public') THEN

    ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

    -- Members can view campaigns they're in (as GM or player)
    EXECUTE 'DROP POLICY IF EXISTS "Members can view their campaigns" ON public.campaigns';
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
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can create campaigns" ON public.campaigns';
    CREATE POLICY "Authenticated users can create campaigns"
      ON public.campaigns FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL AND gm_user_id = auth.uid());

    -- Only GM can update campaign
    EXECUTE 'DROP POLICY IF EXISTS "GM can update campaign" ON public.campaigns';
    CREATE POLICY "GM can update campaign"
      ON public.campaigns FOR UPDATE
      USING (gm_user_id = auth.uid());

    -- Only GM can delete campaign
    EXECUTE 'DROP POLICY IF EXISTS "GM can delete campaign" ON public.campaigns';
    CREATE POLICY "GM can delete campaign"
      ON public.campaigns FOR DELETE
      USING (gm_user_id = auth.uid());
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CAMPAIGN MEMBERS RLS POLICIES
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'campaign_members' AND n.nspname = 'public') THEN

    ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

    -- Members can view other members in their campaigns
    EXECUTE 'DROP POLICY IF EXISTS "Members can view campaign members" ON public.campaign_members';
    CREATE POLICY "Members can view campaign members"
      ON public.campaign_members FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.campaign_members cm
          WHERE cm.campaign_id = campaign_members.campaign_id
          AND cm.user_id = auth.uid()
        )
      );

    -- Users can join campaigns (insert themselves)
    EXECUTE 'DROP POLICY IF EXISTS "Users can join campaigns" ON public.campaign_members';
    CREATE POLICY "Users can join campaigns"
      ON public.campaign_members FOR INSERT
      WITH CHECK (user_id = auth.uid());

    -- Users can update their own membership (e.g., change character)
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own membership" ON public.campaign_members';
    CREATE POLICY "Users can update own membership"
      ON public.campaign_members FOR UPDATE
      USING (user_id = auth.uid());

    -- GM can update any membership (e.g., kick, change roles)
    EXECUTE 'DROP POLICY IF EXISTS "GM can update any membership" ON public.campaign_members';
    CREATE POLICY "GM can update any membership"
      ON public.campaign_members FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.campaigns c
          WHERE c.id = campaign_members.campaign_id
          AND c.gm_user_id = auth.uid()
        )
      );

    -- Users can leave campaigns (delete themselves)
    EXECUTE 'DROP POLICY IF EXISTS "Users can leave campaigns" ON public.campaign_members';
    CREATE POLICY "Users can leave campaigns"
      ON public.campaign_members FOR DELETE
      USING (user_id = auth.uid());

    -- GM can remove members
    EXECUTE 'DROP POLICY IF EXISTS "GM can remove members" ON public.campaign_members';
    CREATE POLICY "GM can remove members"
      ON public.campaign_members FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.campaigns c
          WHERE c.id = campaign_members.campaign_id
          AND c.gm_user_id = auth.uid()
        )
      );
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
-- 12. USER PRESENCE (Phase 5: Presence System - GH#67)
-- =============================================================================
-- Tracks who's online in each campaign using Supabase Presence

CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_presence_campaign 
  ON public.user_presence(campaign_id) WHERE campaign_id IS NOT NULL;

-- =============================================================================
-- USER PRESENCE RLS POLICIES
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'user_presence' AND n.nspname = 'public') THEN

    ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

    -- Members can view presence of users in their campaigns
    EXECUTE 'DROP POLICY IF EXISTS "Members can view presence" ON public.user_presence';
    CREATE POLICY "Members can view presence"
      ON public.user_presence FOR SELECT
      USING (
        campaign_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.campaign_members cm
          WHERE cm.campaign_id = user_presence.campaign_id
          AND cm.user_id = auth.uid()
        )
      );

    -- Users can insert their own presence
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own presence" ON public.user_presence';
    CREATE POLICY "Users can insert own presence"
      ON public.user_presence FOR INSERT
      WITH CHECK (user_id = auth.uid());

    -- Users can update their own presence
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own presence" ON public.user_presence';
    CREATE POLICY "Users can update own presence"
      ON public.user_presence FOR UPDATE
      USING (user_id = auth.uid());

    -- Users can delete their own presence
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own presence" ON public.user_presence';
    CREATE POLICY "Users can delete own presence"
      ON public.user_presence FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update or insert user presence
CREATE OR REPLACE FUNCTION upsert_user_presence(
  p_user_id UUID,
  p_campaign_id UUID,
  p_character_id UUID,
  p_status TEXT DEFAULT 'online'
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_presence (user_id, campaign_id, character_id, status, last_seen)
  VALUES (p_user_id, p_campaign_id, p_character_id, p_status, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    campaign_id = EXCLUDED.campaign_id,
    character_id = EXCLUDED.character_id,
    status = EXCLUDED.status,
    last_seen = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up stale presence entries (more than 5 minutes without heartbeat)
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.user_presence
  SET status = 'offline'
  WHERE status != 'offline'
  AND last_seen < NOW() - INTERVAL '5 minutes';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PHASE 6: HOMEBREW SHARING
-- ============================================================================

-- 18. SHARED HOMEBREW (Share custom items with campaigns or users)
-- Uses fork/snapshot model - shared items are copies at time of share
CREATE TABLE IF NOT EXISTS public.shared_homebrew (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  homebrew_item_id UUID NOT NULL REFERENCES public.homebrew_items(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  item_snapshot JSONB NOT NULL, -- Complete copy of item at share time
  message TEXT, -- Optional message from sharer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure exactly one target (user XOR campaign)
  CONSTRAINT shared_homebrew_target_check CHECK (
    (shared_with_user_id IS NOT NULL AND shared_with_campaign_id IS NULL) OR
    (shared_with_user_id IS NULL AND shared_with_campaign_id IS NOT NULL)
  )
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_shared_homebrew_recipient
  ON public.shared_homebrew(shared_with_user_id) WHERE shared_with_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shared_homebrew_campaign
  ON public.shared_homebrew(shared_with_campaign_id) WHERE shared_with_campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shared_homebrew_sharer
  ON public.shared_homebrew(shared_by);

-- RLS Policies for shared_homebrew
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_class c
             JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'shared_homebrew' AND n.nspname = 'public') THEN

    ALTER TABLE public.shared_homebrew ENABLE ROW LEVEL SECURITY;

    -- Policy: View items shared directly with me
    EXECUTE 'DROP POLICY IF EXISTS "View items shared with me" ON public.shared_homebrew';
    CREATE POLICY "View items shared with me"
      ON public.shared_homebrew FOR SELECT
      USING (shared_with_user_id = auth.uid());

    -- Policy: View items shared with campaigns I'm a member of
    EXECUTE 'DROP POLICY IF EXISTS "View items shared with my campaigns" ON public.shared_homebrew';
    CREATE POLICY "View items shared with my campaigns"
      ON public.shared_homebrew FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.campaign_members cm
          WHERE cm.campaign_id = shared_homebrew.shared_with_campaign_id
          AND cm.user_id = auth.uid()
        )
      );

    -- Policy: View items I shared (to manage my own shares)
    EXECUTE 'DROP POLICY IF EXISTS "View items I shared" ON public.shared_homebrew';
    CREATE POLICY "View items I shared"
      ON public.shared_homebrew FOR SELECT
      USING (shared_by = auth.uid());

    -- Policy: Share own homebrew items
    EXECUTE 'DROP POLICY IF EXISTS "Share own homebrew" ON public.shared_homebrew';
    CREATE POLICY "Share own homebrew"
      ON public.shared_homebrew FOR INSERT
      WITH CHECK (
        shared_by = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.homebrew_items hi
          WHERE hi.id = shared_homebrew.homebrew_item_id
          AND hi.user_id = auth.uid()
        )
      );

    -- Policy: Delete own shares
    EXECUTE 'DROP POLICY IF EXISTS "Delete own shares" ON public.shared_homebrew';
    CREATE POLICY "Delete own shares"
      ON public.shared_homebrew FOR DELETE
      USING (shared_by = auth.uid());

  END IF;
END;
$$ LANGUAGE plpgsql;
