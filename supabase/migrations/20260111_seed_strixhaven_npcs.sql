-- ============================================================================
-- MIGRATION: Seed Strixhaven NPCs for Existing Characters
-- ============================================================================
-- This migration adds Strixhaven student NPCs to all characters whose owners
-- have Strixhaven campaign content enabled in their profile settings.
--
-- Run this once to backfill existing characters. New characters will be
-- automatically seeded via the useCampaignNPCs hook.
--
-- To run: Execute this script in Supabase SQL Editor or via psql
-- ============================================================================

-- First, let's create a temporary table with all the Strixhaven NPCs
CREATE TEMP TABLE strixhaven_npcs (
    npc_name TEXT NOT NULL,
    npc_description TEXT,
    bond_boon TEXT,
    bond_bane TEXT
);

INSERT INTO strixhaven_npcs (npc_name, npc_description, bond_boon, bond_bane) VALUES
('Aurora Luna Wynterstarr', 'Neutral Dhampir First Year (Witherbloom). Accomplished musician and songwriter who performs dirges on the hurdy-gurdy. Works as a groundskeeper at Strixhaven Stadium.', 'Out of respect for Aurora, fellow campus musicians will cover your expenses for one night per week at places where live music is common.', 'When there''s live music on campus, the lyrics always include rude sentiments directed toward you.'),
('Bhedum "Rampart" Sooviij', 'Lawful Neutral Loxodon First Year (Lorehold). Ancient battle tactics scholar who wears centuries-old plate armor to class. Member of Dragonsguard Historical Society and Dragonchess Club.', 'Rampart''s commanding presence rubs off, and when you''re trying to avoid campus security, your fellow students always help you lie low.', 'Library books you need inexplicably go missing at key times, especially those about history. As a result, you can''t pull all-nighters.'),
('Cadoras Damellawar', 'Chaotic Good Elf First Year (Quandrix). Jolly member of Live-Action Roleplaying Guild and Distinguished Society of Fine Artists. Self-taught sculptor of fractal patterns.', 'The esteem for Cadoras in live-action roleplaying circles extends to you. Guild members will share any information you wish to know about Aberrations, Monstrosities, and Oozes.', 'You are a pariah in the campus roleplaying scene. The worst monsters are named after you.'),
('Drazhomir Yarnask', 'Neutral Good Minotaur Second Year (Quandrix). Soft-spoken book clerk at the Biblioplex who loves poetry. Member of Dead Languages Society.', 'Drazhomir writes you poetry, and the smile it puts on your face makes you likable to everyone on campus except the most stone-hearted.', 'Other students who work in the Biblioplex refuse to help you find any of the tomes you seek. Even the reference librarians are more cryptic.'),
('Grayson Wildemere', 'Neutral Human First Year (Silverquill). Writer for Strixhaven Star gossip column. Member of Future Entrepreneurs of Strixhaven. From an old, moneyed family.', 'Whenever you want to buy something on campus, a few words from Grayson get you deals. There''s a 25 percent chance your purchase costs half as much.', 'Gossip columns proclaim exaggerated versions of your worst traits.'),
('Greta Gorunn', 'Chaotic Good Dwarf First Year (Lorehold). Golden-hearted troublemaker and record-breaking powerlifter. Member of Strixhaven Iron-Lifters Society. Works at Strixhaven Stadium.', 'Whenever you need anything heavy moved, members of the Iron-Lifters Society show up to help you.', 'Heavy things show up in inconvenient places, such as in front of your dorm door.'),
('Javenesh Stoutclaw', 'Neutral Good Owlin Second Year (Lorehold). Imposing but friendly assistant manager at Bow''s End Tavern. Member of Intramural Silkball Club.', 'Javenesh''s reputation as a tough guy follows you. If peers would be aggressive toward you, they quickly back down.', 'The servers at Bow''s End Tavern know you are no friend to Javenesh. At the slightest sign of trouble, they blame you and ask you to leave.'),
('Larine Arneza', 'Neutral Good Human First Year (Quandrix). Underwater ballet dancer with natural affinity for aquatic animals. Member of Intramural Water-Dancing Club. Works as ticket taker.', 'Larine is an expert at creating stylized distractions. If you want to slip away unnoticed from anywhere on campus, Larine or her club members help you escape.', 'You are offered the worst tickets to performances, if any at all.'),
('Melwythorne', 'Neutral Good Dryad First Year (Witherbloom). Towering dryad with branch-antlers. Member of Intramural Silkball Club and Student-Mages of Faith. Believes in vast consciousness across planes.', 'Melwythorne''s spirituality centers you. You can calm even the most frazzled of your peers and, if necessary, extract information as needed.', 'Members of the silkball club and the Student-Mages of Faith refuse to acknowledge your presence.'),
('Mina Lee', 'Lawful Good Human Second Year (Silverquill). Investigative journalist for Strixhaven Star fascinated by language and spellcraft. Works as server at Firejolt Café.', 'Mina loves sharing her vast repository of knowledge with you. If you seek obscure information that''s not secret, Mina researches it and reports her findings within a week.', 'Firejolt Café never has the ingredients in stock for the beverages you initially order, even if it''s a common drink.'),
('Nora Ann Wu', 'Neutral Good Human Second Year (Prismari). Kind resident assistant in dormitories. Member of Distinguished Society of Fine Artists. Makes terrible pottery as gifts.', 'The faculty''s respect for Nora extends to you. You can expect straightforward answers when you ask a faculty member for basic information.', 'Few faculty care to help you with basic requests.'),
('Quentillius Antiphiun Melentor III', 'Neutral Human First Year (Prismari). Serious actor in Playactors Drama Guild. Member of Dead Languages Society. Performs roles in original ancient languages.', 'You have adopted Quentillius''s authoritative voice, and in dire situations, your peers obey you when you issue commands.', 'Whenever you perform as part of a production, a small crowd shows up and boos you specifically.'),
('Rosimyffenbip "Rosie" Wuzfeddlims', 'Chaotic Good Gnome First Year (Lorehold). Excitable silkball referee and Live-Action Roleplaying Guild member. Moves impossibly fast.', 'Rosie''s energy is contagious. Whenever you travel any significant distance, you can reach your destination in half the normal time.', 'Whenever you participate in sports on campus (except for big events, such as the Battle of Strixhaven), fouls are constantly called on you.'),
('Rubina Larkingdale', 'Lawful Neutral Human First Year (Silverquill). Measured performer with gravitas. Member of Playactors Drama Guild and conductor for Strixhaven Show Band Association.', 'Rubina''s gravitas has rubbed off, and you can easily command an entire room''s attention. They hear your words favorably if you wish.', 'Whenever any band performs in public, its members stop and shake their heads in disapproval when they see you.'),
('Shuvadri Glintmantle', 'Lawful Good Owlin First Year (Silverquill). Serene member of Student-Mages of Faith devoted to service and community. Works as graffiti eraser on campus grounds.', 'If you quickly need the help of your peers, they drop everything to assist you as a favor to Shuvadri.', 'Graffiti making rude allusions to you keeps appearing on campus, and it takes days to get cleaned.'),
('Tilana Kapule', 'Neutral Good Human First Year (Quandrix). Excellent judge of character. Member of Dragonchess Club and Intramural Silkball Club. Reads opponents instead of the board.', 'Tilana loves helping analyze problems. When you go to her for advice, she suggests a helpful solution that you hadn''t considered.', 'The faculty don''t trust you or help you much, for rumor has it that Tilana has found you wanting.'),
('Urzmaktok Grojsh', 'Neutral Orc Second Year (Witherbloom). Meticulous student earning multiple degrees. Member of Fantastical Horticulture Club. Works as specimen preparer in Campus Magic Labs.', 'No matter the subject, you can always find a partner to study with, whether it''s Urzmaktok or a classmate doing him a favor.', 'No one on campus who isn''t another player character will study with you. If you ask, most shrug decline, saying you''ll probably fail.'),
('Zanther Bowen', 'Chaotic Good Fire Genasi First Year (Prismari). Popular primary flyer for Mage Tower Cheer Squad. Member of Intramural Gymnastics Club. Genuinely encouraging.', 'You enjoy a high social rank as a result of your association with Zanther. Most of your peers fall all over themselves to do you favors.', 'No one on campus invites you to parties or events, although your friends receive invitations.');

-- Now insert NPCs for all characters whose owners have Strixhaven enabled
-- We use a CTE to find eligible characters and cross join with NPCs
WITH eligible_characters AS (
    -- Find all characters owned by users who have Strixhaven enabled
    SELECT c.id AS character_id, c.name AS character_name
    FROM public.characters c
    JOIN public.profiles p ON c.user_id = p.id
    WHERE p.content_access->'homebrew'->>'strixhaven' = 'true'
),
existing_relationships AS (
    -- Find which character/NPC combinations already exist
    SELECT character_id, npc_name
    FROM public.character_relationships
    WHERE campaign = 'strixhaven'
)
INSERT INTO public.character_relationships (
    id,
    character_id,
    character_name,
    npc_name,
    npc_description,
    npc_image_url,
    points,
    bond_boon,
    bond_bane,
    notes,
    campaign,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    ec.character_id,
    ec.character_name,  -- Include character name for debugging
    sn.npc_name,
    sn.npc_description,
    NULL,  -- npc_image_url
    0,     -- points (start as Acquaintance)
    sn.bond_boon,
    sn.bond_bane,
    NULL,  -- notes
    'strixhaven',
    NOW(),
    NOW()
FROM eligible_characters ec
CROSS JOIN strixhaven_npcs sn
-- Only insert if this character doesn't already have this NPC
WHERE NOT EXISTS (
    SELECT 1 FROM existing_relationships er
    WHERE er.character_id = ec.character_id
    AND er.npc_name = sn.npc_name
);

-- Report how many NPCs were seeded
DO $$
DECLARE
    inserted_count INTEGER;
    character_count INTEGER;
BEGIN
    -- Count inserted rows (approximate - uses recent inserts)
    SELECT COUNT(*) INTO inserted_count
    FROM public.character_relationships
    WHERE campaign = 'strixhaven'
    AND created_at > NOW() - INTERVAL '1 minute';
    
    -- Count unique characters affected
    SELECT COUNT(DISTINCT character_id) INTO character_count
    FROM public.character_relationships
    WHERE campaign = 'strixhaven'
    AND created_at > NOW() - INTERVAL '1 minute';
    
    RAISE NOTICE 'Migration complete: Seeded % Strixhaven NPCs across % characters', 
        inserted_count, character_count;
END $$;

-- Clean up temp table
DROP TABLE strixhaven_npcs;
