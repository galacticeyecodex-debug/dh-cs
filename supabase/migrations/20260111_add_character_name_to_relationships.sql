-- ============================================================================
-- MIGRATION: Add character_name column to character_relationships
-- ============================================================================
-- Adds a denormalized character_name column for easier debugging/troubleshooting.
-- Run this BEFORE the seed_strixhaven_npcs migration.
-- ============================================================================

-- Add column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'character_relationships' 
        AND column_name = 'character_name'
    ) THEN
        ALTER TABLE public.character_relationships 
        ADD COLUMN character_name TEXT;
        
        RAISE NOTICE 'Added character_name column to character_relationships';
    ELSE
        RAISE NOTICE 'character_name column already exists';
    END IF;
END $$;

-- Backfill existing rows with character names
UPDATE public.character_relationships cr
SET character_name = c.name
FROM public.characters c
WHERE cr.character_id = c.id
AND cr.character_name IS NULL;

-- Report how many rows were updated
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Backfilled character_name for % existing relationships', updated_count;
END $$;
