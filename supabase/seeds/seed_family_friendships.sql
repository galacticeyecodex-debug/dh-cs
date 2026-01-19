-- ===========================================================================
-- SEED FRIENDSHIPS: Make all family members friends with each other
-- ===========================================================================
-- 
-- Users:
-- 1. adam plocik    - 5edf3f12-a0d1-4a8b-b589-181f2e1a23ce
-- 2. Ann Wallace    - 9c903c0c-4f45-46e1-b4c7-fb964ce8ec65
-- 3. Alex Plocik    - c60c73bb-72c7-4a27-a7fe-ff2808d0004c
-- 4. Zain Plocik    - e27bf551-73f5-4900-98aa-72fe05ab119b
-- 5. Ashar Plocik   - f3b13544-1b27-4ea1-b5c6-c7ce1069bfe9
--
-- Total pairs: C(5,2) = 10 friendships
-- ===========================================================================

-- Delete any existing friendships between these users first (to avoid conflicts)
DELETE FROM public.friendships 
WHERE requester_id IN (
  '5edf3f12-a0d1-4a8b-b589-181f2e1a23ce',
  '9c903c0c-4f45-46e1-b4c7-fb964ce8ec65',
  'c60c73bb-72c7-4a27-a7fe-ff2808d0004c',
  'e27bf551-73f5-4900-98aa-72fe05ab119b',
  'f3b13544-1b27-4ea1-b5c6-c7ce1069bfe9'
)
AND recipient_id IN (
  '5edf3f12-a0d1-4a8b-b589-181f2e1a23ce',
  '9c903c0c-4f45-46e1-b4c7-fb964ce8ec65',
  'c60c73bb-72c7-4a27-a7fe-ff2808d0004c',
  'e27bf551-73f5-4900-98aa-72fe05ab119b',
  'f3b13544-1b27-4ea1-b5c6-c7ce1069bfe9'
);

-- Insert all friendship pairs with 'accepted' status
INSERT INTO public.friendships (requester_id, recipient_id, status, created_at, updated_at)
VALUES
  -- adam <-> Ann
  ('5edf3f12-a0d1-4a8b-b589-181f2e1a23ce', '9c903c0c-4f45-46e1-b4c7-fb964ce8ec65', 'accepted', NOW(), NOW()),
  -- adam <-> Alex
  ('5edf3f12-a0d1-4a8b-b589-181f2e1a23ce', 'c60c73bb-72c7-4a27-a7fe-ff2808d0004c', 'accepted', NOW(), NOW()),
  -- adam <-> Zain
  ('5edf3f12-a0d1-4a8b-b589-181f2e1a23ce', 'e27bf551-73f5-4900-98aa-72fe05ab119b', 'accepted', NOW(), NOW()),
  -- adam <-> Ashar
  ('5edf3f12-a0d1-4a8b-b589-181f2e1a23ce', 'f3b13544-1b27-4ea1-b5c6-c7ce1069bfe9', 'accepted', NOW(), NOW()),
  
  -- Ann <-> Alex
  ('9c903c0c-4f45-46e1-b4c7-fb964ce8ec65', 'c60c73bb-72c7-4a27-a7fe-ff2808d0004c', 'accepted', NOW(), NOW()),
  -- Ann <-> Zain
  ('9c903c0c-4f45-46e1-b4c7-fb964ce8ec65', 'e27bf551-73f5-4900-98aa-72fe05ab119b', 'accepted', NOW(), NOW()),
  -- Ann <-> Ashar
  ('9c903c0c-4f45-46e1-b4c7-fb964ce8ec65', 'f3b13544-1b27-4ea1-b5c6-c7ce1069bfe9', 'accepted', NOW(), NOW()),
  
  -- Alex <-> Zain
  ('c60c73bb-72c7-4a27-a7fe-ff2808d0004c', 'e27bf551-73f5-4900-98aa-72fe05ab119b', 'accepted', NOW(), NOW()),
  -- Alex <-> Ashar
  ('c60c73bb-72c7-4a27-a7fe-ff2808d0004c', 'f3b13544-1b27-4ea1-b5c6-c7ce1069bfe9', 'accepted', NOW(), NOW()),
  
  -- Zain <-> Ashar
  ('e27bf551-73f5-4900-98aa-72fe05ab119b', 'f3b13544-1b27-4ea1-b5c6-c7ce1069bfe9', 'accepted', NOW(), NOW());

-- Verify: Count inserted friendships (should be 10)
SELECT 
  COUNT(*) as total_friendships,
  'All family members are now friends!' as message
FROM public.friendships
WHERE requester_id IN (
  '5edf3f12-a0d1-4a8b-b589-181f2e1a23ce',
  '9c903c0c-4f45-46e1-b4c7-fb964ce8ec65',
  'c60c73bb-72c7-4a27-a7fe-ff2808d0004c',
  'e27bf551-73f5-4900-98aa-72fe05ab119b',
  'f3b13544-1b27-4ea1-b5c6-c7ce1069bfe9'
)
AND status = 'accepted';
