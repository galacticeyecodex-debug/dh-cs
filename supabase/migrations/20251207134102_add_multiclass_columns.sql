-- Add missing multiclass tracking columns to characters table
-- These columns were referenced in TypeScript code but missing from database schema

ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS multiclass_id TEXT,
  ADD COLUMN IF NOT EXISTS multiclass_subclass_id TEXT,
  ADD COLUMN IF NOT EXISTS multiclass_progression JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.characters.multiclass_id IS 'Secondary class selected at level 5+ via multiclass advancement';
COMMENT ON COLUMN public.characters.multiclass_subclass_id IS 'Subclass chosen for multiclass';
COMMENT ON COLUMN public.characters.multiclass_progression IS 'Tracks foundation/specialization/mastery for multiclass subclass - mirrors subclass_progression structure';

-- Create index for efficient queries on multiclass characters
CREATE INDEX IF NOT EXISTS idx_characters_multiclass
  ON public.characters (multiclass_id)
  WHERE multiclass_id IS NOT NULL;
