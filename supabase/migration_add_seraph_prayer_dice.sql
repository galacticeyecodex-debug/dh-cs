-- Migration: Add seraph_prayer_dice column to characters table
-- Description: Adds JSONB column to store Seraph class Prayer Dice state
-- Date: 2024
--
-- This migration adds support for the Seraph class Prayer Dice feature.
-- Prayer Dice are rolled at the start of each session and can be spent
-- to aid the character or allies within Far range.

-- Add the seraph_prayer_dice column to the characters table
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS seraph_prayer_dice JSONB;

-- Add a comment to document the column
COMMENT ON COLUMN public.characters.seraph_prayer_dice IS 'Stores prayer dice data for Seraph class characters. Contains an array of dice with id, value (1-4), and used status.';

-- No default value is needed as NULL represents "no prayer dice rolled yet"
-- The JSONB structure will be: {"dice": [{"id": "uuid", "value": 1-4, "used": boolean}], "lastRolled": "ISO timestamp"}
