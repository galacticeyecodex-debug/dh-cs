-- Create homebrew_items table for user-created custom items
-- This table allows users to create custom weapons, armor, and items with custom modifiers

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

-- Enable Row Level Security
ALTER TABLE public.homebrew_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own homebrew items

-- SELECT: Users can view their own homebrew items
CREATE POLICY "Users can view own homebrew items"
  ON public.homebrew_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can create their own homebrew items
CREATE POLICY "Users can create own homebrew items"
  ON public.homebrew_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own homebrew items
CREATE POLICY "Users can update own homebrew items"
  ON public.homebrew_items
  FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: Users can delete their own homebrew items
CREATE POLICY "Users can delete own homebrew items"
  ON public.homebrew_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_homebrew_items_user_id
  ON public.homebrew_items(user_id);

CREATE INDEX IF NOT EXISTS idx_homebrew_items_type
  ON public.homebrew_items(type);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_homebrew_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER homebrew_items_updated_at
  BEFORE UPDATE ON public.homebrew_items
  FOR EACH ROW
  EXECUTE FUNCTION update_homebrew_items_updated_at();
