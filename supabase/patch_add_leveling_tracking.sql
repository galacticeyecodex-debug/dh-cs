-- Patch to add leveling tracking columns
-- Purpose: Support the Level-Up Wizard (Issue #19)
-- Adds tracking for marked traits and advancement history

-- Add marked_traits column to track which traits have been upgraded in current tier
-- Structure: { "trait_id": { "tier": 2, "marked_at_level": 2 } }
-- When tier advances, this is cleared based on tier achievements
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS marked_traits_jsonb JSONB DEFAULT '{}'::jsonb;

-- Add advancement_history column to track all advancement selections
-- Structure: {
--   "2": ["increase_traits", "add_hp"],  // Level 2 advancements
--   "5": ["domain_card", "multiclass"],  // Level 5 advancements
--   "trait_selections": { "2": ["agility", "strength"] },  // Tracks which traits were upgraded
--   "experience_selections": { "5": ["exp_1", "exp_3"] }   // Tracks which experiences were upgraded
-- }
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS advancement_history_jsonb JSONB DEFAULT '{}'::jsonb;

-- Add comment to clarify usage
COMMENT ON COLUMN public.characters.marked_traits_jsonb IS 'Tracks traits marked as upgraded in current tier. Cleared at level 5 and 8.';
COMMENT ON COLUMN public.characters.advancement_history_jsonb IS 'History of all advancement selections per level. Used for validation and undo.';

-- Create an index on the new columns for faster queries (if needed in future)
CREATE INDEX IF NOT EXISTS idx_characters_marked_traits ON public.characters USING gin(marked_traits_jsonb);
CREATE INDEX IF NOT EXISTS idx_characters_advancement_history ON public.characters USING gin(advancement_history_jsonb);
