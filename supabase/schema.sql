-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
-- Linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. LIBRARY (SRD Data)
-- Used for static game data (classes, cards, etc.)
CREATE TABLE IF NOT EXISTS public.library (
  id TEXT PRIMARY KEY, -- e.g. 'class-bard', 'card-beastbound'
  type TEXT NOT NULL, -- 'class', 'subclass', 'card', 'item'
  name TEXT NOT NULL,
  domain TEXT, -- Nullable (e.g. for classes)
  tier INT,    -- Nullable
  data JSONB NOT NULL, -- The raw JSON content
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
  community TEXT,
  
  -- Core Stats (Traits)
  stats JSONB DEFAULT '{"agility": 0, "strength": 0, "finesse": 0, "instinct": 0, "presence": 0, "knowledge": 0}'::jsonb,
  
  -- Vitals (HP, Stress, Armor)
  -- Updated to use new terminology: hit_points_current, armor_slots, armor_score
  vitals JSONB DEFAULT '{"hit_points_current": 6, "hit_points_max": 6, "stress_current": 0, "stress_max": 6, "armor_slots": 0, "armor_score": 0}'::jsonb,
  
  -- Metacurrency
  hope INT DEFAULT 2,
  fear INT DEFAULT 0, -- GM currency, but maybe tracked here for solo/co-op?
  
  -- Calculated/Base Stats
  evasion INT DEFAULT 10,
  proficiency INT DEFAULT 1,
  
  -- Lists
  experiences JSONB DEFAULT '[]'::jsonb,
  domains TEXT[] DEFAULT '{}',
  
  -- Inventory/Gold
  gold JSONB DEFAULT '{"handfuls": 0, "bags": 0, "chests": 0}'::jsonb,
  
  image_url TEXT,
  
  modifiers JSONB DEFAULT '{}'::jsonb, -- Store user modifiers here
  
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

-- 5. CHARACTER INVENTORY (Equipment)
CREATE TABLE IF NOT EXISTS public.character_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT REFERENCES public.library(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL DEFAULT 'backpack',
  quantity INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) --
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
    user_id, name, level, class_id, subclass_id, ancestry, community,
    stats, vitals, hope, fear, evasion, proficiency,
    experiences, domains, gold, image_url, modifiers
  ) VALUES (
    v_user_id,
    p_character->>'name',
    COALESCE((p_character->>'level')::int, 1),
    p_character->>'class_id',
    p_character->>'subclass_id',
    p_character->>'ancestry',
    p_character->>'community',
    COALESCE(p_character->'stats', '{}'::jsonb),
    COALESCE(p_character->'vitals', '{}'::jsonb),
    COALESCE((p_character->>'hope')::int, 2),
    COALESCE((p_character->>'fear')::int, 0),
    COALESCE((p_character->>'evasion')::int, 10),
    COALESCE((p_character->>'proficiency')::int, 1),
    COALESCE(p_character->'experiences', '[]'::jsonb),
    (SELECT array_agg(x) FROM jsonb_array_elements_text(p_character->'domains') t(x)),
    COALESCE(p_character->'gold', '{}'::jsonb),
    p_character->>'image_url',
    COALESCE(p_character->'modifiers', '{}'::jsonb)
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