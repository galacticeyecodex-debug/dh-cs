-- Fix RLS policy for character_cards insert
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'character_cards' AND n.nspname = 'public') THEN

    EXECUTE 'DROP POLICY IF EXISTS "Cards insertable by char owner" ON public.character_cards';
    CREATE POLICY "Cards insertable by char owner" ON public.character_cards FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND user_id = auth.uid())
    );
    
  END IF;
END;
$$ LANGUAGE plpgsql;
