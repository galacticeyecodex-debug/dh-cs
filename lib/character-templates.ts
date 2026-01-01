import { CharacterFormData, LibraryData, LibraryLookupItem } from '@/components/character-creation/types';
import { RangerCompanion } from '@/types/character';

interface TemplateDefinition {
  subclassKeyword: string;
  ancestry: string;
  community: string;
  stats: {
    agility: number;
    strength: number;
    finesse: number;
    instinct: number;
    presence: number;
    knowledge: number;
  };
  experiences: [string, string];
  primaryWeapon: string;
  secondaryWeapon: string;
  armor: string;
  potion: 'health' | 'stamina';
  companion?: RangerCompanion;
}

const DEFAULT_COMPANION: RangerCompanion = {
  name: 'Fang',
  animal_type: 'Wolf',
  evasion: 10,
  stress_max: 3,
  stress_current: 0,
  armor_slot: false,
  armor_slot_used: false,
  hope_max: 3,
  hope_current: 3,
  attack_type: 'melee',
  attack_name: 'Bite',
  damage_die: 'd6',
  attack_range: 'melee',
  experiences: [
    { name: 'Keen Senses', value: 2 },
    { name: 'Pack Tactics', value: 2 }
  ],
  level_up_options: {
    intelligent: 0,
    light_in_the_dark: false,
    creature_comfort: false,
    armored: false,
    vicious: 0,
    resilient: 0,
    bonded: false,
    aware: false
  }
};

const TEMPLATES: Record<string, Record<string, TemplateDefinition>> = {
  'Bard': {
    'Troubadour': {
      subclassKeyword: 'Troubadour',
      ancestry: 'Elf',
      community: 'Highborne',
      stats: { agility: 0, strength: -1, finesse: 1, instinct: 0, presence: 2, knowledge: 1 },
      experiences: ['Charming Performer', 'Lorekeeper'],
      primaryWeapon: 'Rapier',
      secondaryWeapon: 'Dagger',
      armor: 'Leather',
      potion: 'stamina'
    },
    'Wordsmith': {
      subclassKeyword: 'Wordsmith',
      ancestry: 'Human',
      community: 'Loreborne',
      stats: { agility: 0, strength: -1, finesse: 0, instinct: 1, presence: 2, knowledge: 1 },
      experiences: ['Silver Tongue', 'Historian'],
      primaryWeapon: 'Rapier',
      secondaryWeapon: 'Dagger',
      armor: 'Leather',
      potion: 'stamina'
    }
  },
  'Druid': {
    'Warden of the Elements': {
      subclassKeyword: 'Elements',
      ancestry: 'Elf',
      community: 'Wildborne',
      stats: { agility: 0, strength: 0, finesse: 0, instinct: 2, presence: 0, knowledge: 1 },
      experiences: ['One with Nature', 'Elementalist'],
      primaryWeapon: 'Staff',
      secondaryWeapon: 'Dagger',
      armor: 'Leather',
      potion: 'stamina'
    },
    'Warden of Renewal': {
      subclassKeyword: 'Renewal',
      ancestry: 'Firbolg',
      community: 'Wildborne',
      stats: { agility: 0, strength: 1, finesse: 0, instinct: 2, presence: 0, knowledge: 0 },
      experiences: ['Healer', 'Guardian of Life'],
      primaryWeapon: 'Staff',
      secondaryWeapon: 'Dagger',
      armor: 'Leather',
      potion: 'stamina'
    }
  },
  'Guardian': {
    'Stalwart': {
      subclassKeyword: 'Stalwart',
      ancestry: 'Dwarf',
      community: 'Underborne',
      stats: { agility: -1, strength: 2, finesse: 0, instinct: 1, presence: 0, knowledge: 1 },
      experiences: ['Unbreakable', 'Tunnel Fighter'],
      primaryWeapon: 'Warhammer',
      secondaryWeapon: 'Shield',
      armor: 'Chainmail',
      potion: 'health'
    },
    'Vengeance': {
      subclassKeyword: 'Vengeance',
      ancestry: 'Orc',
      community: 'Ridgeborne',
      stats: { agility: 0, strength: 2, finesse: 0, instinct: 0, presence: 1, knowledge: 0 },
      experiences: ['Avenger', 'Intimidating'],
      primaryWeapon: 'Greatsword',
      secondaryWeapon: 'Handaxe',
      armor: 'Chainmail',
      potion: 'health'
    }
  },
  'Ranger': {
    'Wayfinder': {
      subclassKeyword: 'Wayfinder',
      ancestry: 'Elf',
      community: 'Wildborne',
      stats: { agility: 2, strength: 0, finesse: 1, instinct: 1, presence: -1, knowledge: 0 },
      experiences: ['Master Tracker', 'Survivalist'],
      primaryWeapon: 'Longbow',
      secondaryWeapon: 'Dagger',
      armor: 'Leather',
      potion: 'stamina'
    },
    'Beastbound': {
      subclassKeyword: 'Beastbound',
      ancestry: 'Human',
      community: 'Wildborne',
      stats: { agility: 2, strength: 0, finesse: 1, instinct: 1, presence: -1, knowledge: 0 },
      experiences: ['Beast Master', 'Forest Guide'],
      primaryWeapon: 'Longbow',
      secondaryWeapon: 'Dagger',
      armor: 'Leather',
      potion: 'stamina',
      companion: DEFAULT_COMPANION
    }
  },
  'Rogue': {
    'Syndicate': {
      subclassKeyword: 'Syndicate',
      ancestry: 'Halfling',
      community: 'Slyborne',
      stats: { agility: 2, strength: -1, finesse: 2, instinct: 0, presence: 1, knowledge: -1 },
      experiences: ['Street Smart', 'Stealth Expert'],
      primaryWeapon: 'Shortsword',
      secondaryWeapon: 'Dagger',
      armor: 'Leather',
      potion: 'health'
    },
    'Nightwalker': {
      subclassKeyword: 'Nightwalker',
      ancestry: 'Katari',
      community: 'Slyborne',
      stats: { agility: 2, strength: 0, finesse: 2, instinct: 0, presence: -1, knowledge: 0 },
      experiences: ['Shadow Assassin', 'Acrobat'],
      primaryWeapon: 'Dagger',
      secondaryWeapon: 'Dagger',
      armor: 'Leather',
      potion: 'health'
    }
  },
  'Seraph': {
    'Divine Wielder': {
      subclassKeyword: 'Divine',
      ancestry: 'Human',
      community: 'Orderborne',
      stats: { agility: 1, strength: 2, finesse: 0, instinct: 0, presence: 1, knowledge: -1 },
      experiences: ['Divine Messenger', 'Protector of the Weak'],
      primaryWeapon: 'Greatsword',
      secondaryWeapon: 'Dagger',
      armor: 'Breastplate',
      potion: 'health'
    },
    'Winged Sentinel': {
      subclassKeyword: 'Winged',
      ancestry: 'Faerie',
      community: 'Orderborne',
      stats: { agility: 2, strength: 1, finesse: 0, instinct: 0, presence: 1, knowledge: -1 },
      experiences: ['Aerial Combatant', 'Guardian Angel'],
      primaryWeapon: 'Longsword',
      secondaryWeapon: 'Shield',
      armor: 'Breastplate',
      potion: 'health'
    }
  },
  'Sorcerer': {
    'Elemental Origin': {
      subclassKeyword: 'Elemental',
      ancestry: 'Drakona',
      community: 'Wildborne',
      stats: { agility: 1, strength: 0, finesse: 0, instinct: 2, presence: 0, knowledge: 0 },
      experiences: ['Volatile Magic', 'Elementalist'],
      primaryWeapon: 'Staff',
      secondaryWeapon: 'Dagger',
      armor: 'Leather',
      potion: 'stamina'
    },
    'Primal Origin': {
      subclassKeyword: 'Primal',
      ancestry: 'Elf',
      community: 'Wildborne',
      stats: { agility: 0, strength: 0, finesse: 0, instinct: 2, presence: 1, knowledge: 0 },
      experiences: ['Wild Magic', 'Nature\'s Wrath'],
      primaryWeapon: 'Staff',
      secondaryWeapon: 'Dagger',
      armor: 'Leather',
      potion: 'stamina'
    }
  },
  'Warrior': {
    'Call of the Slayer': {
      subclassKeyword: 'Slayer',
      ancestry: 'Orc',
      community: 'Ridgeborne',
      stats: { agility: 1, strength: 2, finesse: 0, instinct: 0, presence: 0, knowledge: 0 },
      experiences: ['Battle Hardened', 'Mercenary Work'],
      primaryWeapon: 'Greatsword',
      secondaryWeapon: 'Handaxe',
      armor: 'Chainmail',
      potion: 'health'
    },
    'Call of the Brave': {
      subclassKeyword: 'Brave',
      ancestry: 'Human',
      community: 'Orderborne',
      stats: { agility: 0, strength: 2, finesse: 0, instinct: 0, presence: 1, knowledge: 0 },
      experiences: ['Leader of Men', 'Fearless'],
      primaryWeapon: 'Longsword',
      secondaryWeapon: 'Shield',
      armor: 'Chainmail',
      potion: 'health'
    }
  },
  'Wizard': {
    'School of Knowledge': {
      subclassKeyword: 'Knowledge',
      ancestry: 'Human',
      community: 'Loreborne',
      stats: { agility: 0, strength: -1, finesse: 0, instinct: 1, presence: 0, knowledge: 2 },
      experiences: ['Academic', 'Arcane Researcher'],
      primaryWeapon: 'Staff',
      secondaryWeapon: 'Wand',
      armor: 'Robes',
      potion: 'stamina'
    },
    'School of War': {
      subclassKeyword: 'War',
      ancestry: 'Human',
      community: 'Ridgeborne',
      stats: { agility: 1, strength: 0, finesse: 0, instinct: 1, presence: -1, knowledge: 2 },
      experiences: ['Battle Mage', 'Tactician'],
      primaryWeapon: 'Staff',
      secondaryWeapon: 'Wand',
      armor: 'Robes',
      potion: 'stamina'
    }
  }
};

const findItemByName = (items: LibraryLookupItem[], name: string): LibraryLookupItem | undefined => {
  return items.find(i => i.name.toLowerCase().includes(name.toLowerCase()));
};

export function getTemplateForClass(
  classId: string, 
  subclassId: string,
  libraryData: LibraryData
): Partial<CharacterFormData> | null {
  const selectedClass = libraryData.classes.find(c => c.id === classId);
  const selectedSubclass = libraryData.subclasses.find(s => s.id === subclassId);
  
  if (!selectedClass || !selectedSubclass) return null;

  const classTemplates = TEMPLATES[selectedClass.name];
  if (!classTemplates) return null;

  // Find the matching template for this subclass
  // We match based on the subclass name containing the keyword
  const templateKey = Object.keys(classTemplates).find(key => 
    selectedSubclass.name.includes(classTemplates[key].subclassKeyword)
  );

  if (!templateKey) {
    console.warn(`No template found for subclass ${selectedSubclass.name}`);
    return null;
  }

  const template = classTemplates[templateKey];

  // Find Ancestry
  const ancestry = findItemByName(libraryData.ancestries, template.ancestry);
  
  // Find Community
  const community = findItemByName(libraryData.communities, template.community);

  // Find Weapons & Armor
  const primaryWeapon = findItemByName(libraryData.weapons, template.primaryWeapon);
  const secondaryWeapon = findItemByName(libraryData.weapons, template.secondaryWeapon);
  const armor = findItemByName(libraryData.armor, template.armor);

  if (!ancestry || !community) {
    console.warn("Missing critical template data for", selectedClass.name, templateKey);
    return null;
  }

  return {
    class_id: classId,
    subclass_id: subclassId,
    ancestry_id: ancestry.id,
    community_id: community.id,
    stats: template.stats,
    experiences: template.experiences,
    selectedPrimaryWeaponId: primaryWeapon?.id || null,
    selectedSecondaryWeaponId: secondaryWeapon?.id || null,
    selectedArmorId: armor?.id || null,
    selectedPotionType: template.potion,
    domains: selectedClass.data.domains ? [selectedClass.data.domains[0], selectedClass.data.domains[1]] : ['', ''],
    selectedCards: [],
    ...(template.companion && { companion: template.companion })
  };
}