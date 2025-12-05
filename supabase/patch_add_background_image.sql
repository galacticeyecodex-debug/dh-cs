-- Run this in the Supabase SQL Editor to add the missing column

-- 1. Add the column safely
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS background_image_url TEXT;

-- 2. Refresh the schema cache so the API knows about the new column immediately
NOTIFY pgrst, 'reload config';
