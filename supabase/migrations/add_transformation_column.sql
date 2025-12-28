-- Migration: Add transformation column to characters table
-- This adds support for transformation cards (Vampire, Werewolf, etc.)

-- Add transformation column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'characters'
        AND column_name = 'transformation'
    ) THEN
        ALTER TABLE public.characters ADD COLUMN transformation TEXT;
        RAISE NOTICE 'Added transformation column to characters table';
    ELSE
        RAISE NOTICE 'transformation column already exists';
    END IF;
END $$;
