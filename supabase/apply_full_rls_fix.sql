-- Reset policies for character_cards to ensure a clean slate
-- Use this script to fix "new row violates row-level security policy" errors

-- 1. Character Cards
ALTER TABLE public.character_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cards viewable by char owner" ON public.character_cards;
DROP POLICY IF EXISTS "Cards insertable by char owner" ON public.character_cards;
DROP POLICY IF EXISTS "Cards updatable by char owner" ON public.character_cards;
DROP POLICY IF EXISTS "Cards deletable by char owner" ON public.character_cards;

CREATE POLICY "Cards viewable by char owner" ON public.character_cards FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.characters 
    WHERE characters.id = character_cards.character_id 
    AND characters.user_id = auth.uid()
  )
);

CREATE POLICY "Cards insertable by char owner" ON public.character_cards FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.characters 
    WHERE characters.id = character_cards.character_id 
    AND characters.user_id = auth.uid()
  )
);

CREATE POLICY "Cards updatable by char owner" ON public.character_cards FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.characters 
    WHERE characters.id = character_cards.character_id 
    AND characters.user_id = auth.uid()
  )
);

CREATE POLICY "Cards deletable by char owner" ON public.character_cards FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.characters 
    WHERE characters.id = character_cards.character_id 
    AND characters.user_id = auth.uid()
  )
);

-- 2. Character Inventory
ALTER TABLE public.character_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inventory viewable by char owner" ON public.character_inventory;
DROP POLICY IF EXISTS "Inventory insertable by char owner" ON public.character_inventory;
DROP POLICY IF EXISTS "Inventory updatable by char owner" ON public.character_inventory;
DROP POLICY IF EXISTS "Inventory deletable by char owner" ON public.character_inventory;

CREATE POLICY "Inventory viewable by char owner" ON public.character_inventory FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.characters 
    WHERE characters.id = character_inventory.character_id 
    AND characters.user_id = auth.uid()
  )
);

CREATE POLICY "Inventory insertable by char owner" ON public.character_inventory FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.characters 
    WHERE characters.id = character_inventory.character_id 
    AND characters.user_id = auth.uid()
  )
);

CREATE POLICY "Inventory updatable by char owner" ON public.character_inventory FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.characters 
    WHERE characters.id = character_inventory.character_id 
    AND characters.user_id = auth.uid()
  )
);

CREATE POLICY "Inventory deletable by char owner" ON public.character_inventory FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.characters 
    WHERE characters.id = character_inventory.character_id 
    AND characters.user_id = auth.uid()
  )
);
