-- One-time migration to add the missing 'state' column to character_inventory
-- This column is required for storing custom art URLs and image positions

-- Run this in your Supabase SQL Editor:

ALTER TABLE public.character_inventory 
ADD COLUMN IF NOT EXISTS state JSONB DEFAULT '{}'::jsonb;

-- Add a comment for documentation
COMMENT ON COLUMN public.character_inventory.state IS 'Stores custom_image_url, custom_image_position_x, custom_image_position_y for custom item artwork';
