-- Migrate experiences column from TEXT[] to JSONB

-- 1. Add a temporary column
ALTER TABLE public.characters ADD COLUMN experiences_new JSONB DEFAULT '[]'::jsonb;

-- 2. Migrate data (convert string array to array of objects with default value +2)
UPDATE public.characters
SET experiences_new = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', elem,
      'value', 2
    )
  )
  FROM unnest(experiences) AS elem
)
WHERE experiences IS NOT NULL AND array_length(experiences, 1) > 0;

-- 3. Drop the old column
ALTER TABLE public.characters DROP COLUMN experiences;

-- 4. Rename the new column
ALTER TABLE public.characters RENAME COLUMN experiences_new TO experiences;
