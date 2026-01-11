/**
 * STRIXHAVEN NPCS
 * ----------------------------------------------------------------------------
 * NPC data for the Strixhaven: Curriculum of Chaos campaign adaptation.
 * These NPCs are automatically added to a character's relationship tracker
 * when the Strixhaven campaign content is enabled.
 * 
 * Source: D&D 5e Strixhaven: A Curriculum of Chaos
 */

import type { CreateRelationshipInput } from '@/types/journal';

/**
 * The 18 student NPCs from Strixhaven that players can form relationships with.
 * Each NPC has a Bond Boon (reward for friendship) and Bond Bane (consequence of rivalry).
 */
export const STRIXHAVEN_NPCS: Omit<CreateRelationshipInput, 'points'>[] = [
    {
        npc_name: 'Aurora Luna Wynterstarr',
        npc_description: 'Neutral Dhampir First Year (Witherbloom). Accomplished musician and songwriter who performs dirges on the hurdy-gurdy. Works as a groundskeeper at Strixhaven Stadium.',
        bond_boon: 'Out of respect for Aurora, fellow campus musicians will cover your expenses for one night per week at places where live music is common.',
        bond_bane: "When there's live music on campus, the lyrics always include rude sentiments directed toward you.",
        campaign: 'strixhaven',
    },
    {
        npc_name: 'Bhedum "Rampart" Sooviij',
        npc_description: 'Lawful Neutral Loxodon First Year (Lorehold). Ancient battle tactics scholar who wears centuries-old plate armor to class. Member of Dragonsguard Historical Society and Dragonchess Club.',
        bond_boon: "Rampart's commanding presence rubs off, and when you're trying to avoid campus security, your fellow students always help you lie low.",
        bond_bane: "Library books you need inexplicably go missing at key times, especially those about history. As a result, you can't pull all-nighters.",
        campaign: 'strixhaven',
    },
    {
        npc_name: 'Cadoras Damellawar',
        npc_description: 'Chaotic Good Elf First Year (Quandrix). Jolly member of Live-Action Roleplaying Guild and Distinguished Society of Fine Artists. Self-taught sculptor of fractal patterns.',
        bond_boon: 'The esteem for Cadoras in live-action roleplaying circles extends to you. Guild members will share any information you wish to know about Aberrations, Monstrosities, and Oozes.',
        bond_bane: 'You are a pariah in the campus roleplaying scene. The worst monsters are named after you.',
        campaign: 'strixhaven',
    },
    {
        npc_name: 'Drazhomir Yarnask',
        npc_description: 'Neutral Good Minotaur Second Year (Quandrix). Soft-spoken book clerk at the Biblioplex who loves poetry. Member of Dead Languages Society.',
        bond_boon: "Drazhomir writes you poetry, and the smile it puts on your face makes you likable to everyone on campus except the most stone-hearted.",
        bond_bane: 'Other students who work in the Biblioplex refuse to help you find any of the tomes you seek. Even the reference librarians are more cryptic.',
        campaign: 'strixhaven',
    },
    {
        npc_name: 'Grayson Wildemere',
        npc_description: 'Neutral Human First Year (Silverquill). Writer for Strixhaven Star gossip column. Member of Future Entrepreneurs of Strixhaven. From an old, moneyed family.',
        bond_boon: "Whenever you want to buy something on campus, a few words from Grayson get you deals. There's a 25 percent chance your purchase costs half as much.",
        bond_bane: 'Gossip columns proclaim exaggerated versions of your worst traits.',
        campaign: 'strixhaven',
    },
    {
        npc_name: 'Greta Gorunn',
        npc_description: 'Chaotic Good Dwarf First Year (Lorehold). Golden-hearted troublemaker and record-breaking powerlifter. Member of Strixhaven Iron-Lifters Society. Works at Strixhaven Stadium.',
        bond_boon: 'Whenever you need anything heavy moved, members of the Iron-Lifters Society show up to help you.',
        bond_bane: 'Heavy things show up in inconvenient places, such as in front of your dorm door.',
        campaign: 'strixhaven',
    },
    {
        npc_name: 'Javenesh Stoutclaw',
        npc_description: "Neutral Good Owlin Second Year (Lorehold). Imposing but friendly assistant manager at Bow's End Tavern. Member of Intramural Silkball Club.",
        bond_boon: "Javenesh's reputation as a tough guy follows you. If peers would be aggressive toward you, they quickly back down.",
        bond_bane: "The servers at Bow's End Tavern know you are no friend to Javenesh. At the slightest sign of trouble, they blame you and ask you to leave.",
        campaign: 'strixhaven',
    },
    {
        npc_name: 'Larine Arneza',
        npc_description: 'Neutral Good Human First Year (Quandrix). Underwater ballet dancer with natural affinity for aquatic animals. Member of Intramural Water-Dancing Club. Works as ticket taker.',
        bond_boon: 'Larine is an expert at creating stylized distractions. If you want to slip away unnoticed from anywhere on campus, Larine or her club members help you escape.',
        bond_bane: 'You are offered the worst tickets to performances, if any at all.',
        campaign: 'strixhaven',
    },
    {
        npc_name: 'Melwythorne',
        npc_description: 'Neutral Good Dryad First Year (Witherbloom). Towering dryad with branch-antlers. Member of Intramural Silkball Club and Student-Mages of Faith. Believes in vast consciousness across planes.',
        bond_boon: "Melwythorne's spirituality centers you. You can calm even the most frazzled of your peers and, if necessary, extract information as needed.",
        bond_bane: 'Members of the silkball club and the Student-Mages of Faith refuse to acknowledge your presence.',
        campaign: 'strixhaven',
    },
    {
        npc_name: 'Mina Lee',
        npc_description: 'Lawful Good Human Second Year (Silverquill). Investigative journalist for Strixhaven Star fascinated by language and spellcraft. Works as server at Firejolt Café.',
        bond_boon: "Mina loves sharing her vast repository of knowledge with you. If you seek obscure information that's not secret, Mina researches it and reports her findings within a week.",
        bond_bane: "Firejolt Café never has the ingredients in stock for the beverages you initially order, even if it's a common drink.",
        campaign: 'strixhaven',
    },
    {
        npc_name: 'Nora Ann Wu',
        npc_description: 'Neutral Good Human Second Year (Prismari). Kind resident assistant in dormitories. Member of Distinguished Society of Fine Artists. Makes terrible pottery as gifts.',
        bond_boon: "The faculty's respect for Nora extends to you. You can expect straightforward answers when you ask a faculty member for basic information.",
        bond_bane: 'Few faculty care to help you with basic requests.',
        campaign: 'strixhaven',
    },
    {
        npc_name: 'Quentillius Antiphiun Melentor III',
        npc_description: 'Neutral Human First Year (Prismari). Serious actor in Playactors Drama Guild. Member of Dead Languages Society. Performs roles in original ancient languages.',
        bond_boon: "You have adopted Quentillius's authoritative voice, and in dire situations, your peers obey you when you issue commands.",
        bond_bane: 'Whenever you perform as part of a production, a small crowd shows up and boos you specifically.',
        campaign: 'strixhaven',
    },
    {
        npc_name: 'Rosimyffenbip "Rosie" Wuzfeddlims',
        npc_description: 'Chaotic Good Gnome First Year (Lorehold). Excitable silkball referee and Live-Action Roleplaying Guild member. Moves impossibly fast.',
        bond_boon: "Rosie's energy is contagious. Whenever you travel any significant distance, you can reach your destination in half the normal time.",
        bond_bane: 'Whenever you participate in sports on campus (except for big events, such as the Battle of Strixhaven), fouls are constantly called on you.',
        campaign: 'strixhaven',
    },
    {
        npc_name: 'Rubina Larkingdale',
        npc_description: 'Lawful Neutral Human First Year (Silverquill). Measured performer with gravitas. Member of Playactors Drama Guild and conductor for Strixhaven Show Band Association.',
        bond_boon: "Rubina's gravitas has rubbed off, and you can easily command an entire room's attention. They hear your words favorably if you wish.",
        bond_bane: 'Whenever any band performs in public, its members stop and shake their heads in disapproval when they see you.',
        campaign: 'strixhaven',
    },
    {
        npc_name: 'Shuvadri Glintmantle',
        npc_description: 'Lawful Good Owlin First Year (Silverquill). Serene member of Student-Mages of Faith devoted to service and community. Works as graffiti eraser on campus grounds.',
        bond_boon: 'If you quickly need the help of your peers, they drop everything to assist you as a favor to Shuvadri.',
        bond_bane: 'Graffiti making rude allusions to you keeps appearing on campus, and it takes days to get cleaned.',
        campaign: 'strixhaven',
    },
    {
        npc_name: 'Tilana Kapule',
        npc_description: 'Neutral Good Human First Year (Quandrix). Excellent judge of character. Member of Dragonchess Club and Intramural Silkball Club. Reads opponents instead of the board.',
        bond_boon: "Tilana loves helping analyze problems. When you go to her for advice, she suggests a helpful solution that you hadn't considered.",
        bond_bane: "The faculty don't trust you or help you much, for rumor has it that Tilana has found you wanting.",
        campaign: 'strixhaven',
    },
    {
        npc_name: 'Urzmaktok Grojsh',
        npc_description: 'Neutral Orc Second Year (Witherbloom). Meticulous student earning multiple degrees. Member of Fantastical Horticulture Club. Works as specimen preparer in Campus Magic Labs.',
        bond_boon: "No matter the subject, you can always find a partner to study with, whether it's Urzmaktok or a classmate doing him a favor.",
        bond_bane: "No one on campus who isn't another player character will study with you. If you ask, most shrug decline, saying you'll probably fail.",
        campaign: 'strixhaven',
    },
    {
        npc_name: 'Zanther Bowen',
        npc_description: 'Chaotic Good Fire Genasi First Year (Prismari). Popular primary flyer for Mage Tower Cheer Squad. Member of Intramural Gymnastics Club. Genuinely encouraging.',
        bond_boon: 'You enjoy a high social rank as a result of your association with Zanther. Most of your peers fall all over themselves to do you favors.',
        bond_bane: 'No one on campus invites you to parties or events, although your friends receive invitations.',
        campaign: 'strixhaven',
    },
];

/**
 * Get all Strixhaven NPCs as CreateRelationshipInput objects
 * with points initialized to 0 (Acquaintance tier)
 */
export function getStrixhavenNPCsForSeeding(): CreateRelationshipInput[] {
    return STRIXHAVEN_NPCS.map(npc => ({
        ...npc,
        points: 0, // All relationships start at Acquaintance tier
    }));
}
