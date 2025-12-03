-- Add modifiers column if it doesn't exist
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS modifiers JSONB DEFAULT '{}'::jsonb;

-- Force a schema cache reload to ensure the API sees the new column immediately
NOTIFY pgrst, 'reload config';