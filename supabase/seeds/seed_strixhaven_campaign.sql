-- ===========================================================================
-- SEED STRIXHAVEN CAMPAIGN: Create campaign and add all family members
-- ===========================================================================
-- 
-- Campaign: Strixhaven
-- GM: Alex Plocik (c60c73bb-72c7-4a27-a7fe-ff2808d0004c)
-- Players:
--   - adam plocik    - 5edf3f12-a0d1-4a8b-b589-181f2e1a23ce
--   - Ann Wallace    - 9c903c0c-4f45-46e1-b4c7-fb964ce8ec65
--   - Zain Plocik    - e27bf551-73f5-4900-98aa-72fe05ab119b
--   - Ashar Plocik   - f3b13544-1b27-4ea1-b5c6-c7ce1069bfe9
-- ===========================================================================

-- First, check if a Strixhaven campaign already exists
DO $$
DECLARE
  v_campaign_id UUID;
  v_gm_id UUID := 'c60c73bb-72c7-4a27-a7fe-ff2808d0004c';
BEGIN
  -- Check for existing Strixhaven campaign
  SELECT id INTO v_campaign_id 
  FROM public.campaigns 
  WHERE name = 'Strixhaven' 
  LIMIT 1;

  -- If not exists, create it
  IF v_campaign_id IS NULL THEN
    INSERT INTO public.campaigns (
      name, 
      description, 
      gm_user_id, 
      invite_code,
      fear_current, 
      fear_max, 
      settings
    ) VALUES (
      'Strixhaven',
      'A magical university campaign set in the world of Strixhaven, where arcane knowledge and academic rivalries collide with adventure.',
      v_gm_id,
      'STRIX2026',  -- Easy to remember invite code
      0,
      10,
      jsonb_build_object(
        'theme', 'magic_university',
        'setting', 'Strixhaven',
        'allowPlaytest', true
      )
    ) RETURNING id INTO v_campaign_id;
    
    RAISE NOTICE 'Created Strixhaven campaign with ID: %', v_campaign_id;
  ELSE
    RAISE NOTICE 'Strixhaven campaign already exists with ID: %', v_campaign_id;
  END IF;

  -- Remove existing members (to reset)
  DELETE FROM public.campaign_members WHERE campaign_id = v_campaign_id;

  -- Add GM (Alex)
  INSERT INTO public.campaign_members (campaign_id, user_id, role, nickname)
  VALUES (v_campaign_id, v_gm_id, 'gm', 'GM Alex');

  -- Add Players
  -- adam plocik
  INSERT INTO public.campaign_members (campaign_id, user_id, role, nickname)
  VALUES (v_campaign_id, '5edf3f12-a0d1-4a8b-b589-181f2e1a23ce', 'player', 'adam');

  -- Ann Wallace
  INSERT INTO public.campaign_members (campaign_id, user_id, role, nickname)
  VALUES (v_campaign_id, '9c903c0c-4f45-46e1-b4c7-fb964ce8ec65', 'player', 'Ann');

  -- Zain Plocik
  INSERT INTO public.campaign_members (campaign_id, user_id, role, nickname)
  VALUES (v_campaign_id, 'e27bf551-73f5-4900-98aa-72fe05ab119b', 'player', 'Zain');

  -- Ashar Plocik
  INSERT INTO public.campaign_members (campaign_id, user_id, role, nickname)
  VALUES (v_campaign_id, 'f3b13544-1b27-4ea1-b5c6-c7ce1069bfe9', 'player', 'Ashar');

  RAISE NOTICE 'Added 5 members to Strixhaven campaign';
END;
$$ LANGUAGE plpgsql;

-- Verify: Show campaign and members
SELECT 
  c.name as campaign_name,
  c.invite_code,
  c.description,
  cm.nickname,
  cm.role,
  p.username
FROM public.campaigns c
JOIN public.campaign_members cm ON cm.campaign_id = c.id
JOIN public.profiles p ON p.id = cm.user_id
WHERE c.name = 'Strixhaven'
ORDER BY cm.role DESC, cm.nickname;
