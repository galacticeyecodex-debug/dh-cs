-- =============================================================================
-- Migration: Phase 9 - GM Screen Enhancements (GH#67)
-- Adds countdowns and projects JSONB columns to campaigns table
-- =============================================================================

-- Add countdowns column to campaigns
-- Stores an array of countdown objects for GM tracking
-- Structure:
-- {
--   id: string,
--   name: string,
--   description?: string,
--   type: 'standard' | 'progress' | 'consequence' | 'loop' | 'long_term',
--   starting_value: number,
--   current_value: number,
--   is_public: boolean,
--   is_looping: boolean,
--   created_at: timestamp
-- }
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS countdowns JSONB DEFAULT '[]'::jsonb;

-- Add projects column to campaigns
-- Stores an array of player project objects
-- Structure:
-- {
--   id: string,
--   character_id: string,
--   character_name: string,
--   name: string,
--   description?: string,
--   starting_value: number,
--   current_value: number,
--   advancement_type: 'auto' | 'roll',
--   status: 'pending' | 'active' | 'completed' | 'abandoned',
--   created_at: timestamp,
--   completed_at?: timestamp
-- }
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb;

-- Add activity types for countdown and project events
-- (Activity types are stored as text, so no schema change needed)
-- New types: 'countdown_created', 'countdown_advanced', 'countdown_triggered',
--            'project_created', 'project_advanced', 'project_completed'

-- Comment for documentation
COMMENT ON COLUMN public.campaigns.countdowns IS 'JSONB array of GM countdown trackers (standard, progress, consequence, loop, long_term types per SRD)';
COMMENT ON COLUMN public.campaigns.projects IS 'JSONB array of player projects from Downtime "Work on a Project" mechanic';
