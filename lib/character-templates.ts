import { CharacterFormData, LibraryData, LibraryLookupItem } from '@/components/character-creation/types';
import { RangerCompanion } from '@/types/character';
import classesData from '@/content/srd/json/classes.json';

interface TemplateDefinition {
  subclassKeyword: string;
  ancestry: string;
  community: string;
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

/**
 * Parse suggested traits string from SRD (e.g., "+1, -1, +2, 0, +1, 0")
 * into stats object
 */
function parseSuggestedTraits(traitsString: string) {
  const values = traitsString.split(',').map(s => parseInt(s.trim()));
  if (values.length !== 6) {
    console.warn('Invalid suggested_traits format:', traitsString);
    return { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 };
  }

  return {
    agility: values[0],
    strength: values[1],
    finesse: values[2],
    instinct: values[3],
    presence: values[4],
    knowledge: values[5]
  };
}

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
  const templateKey = Object.keys(classTemplates).find(key =>
    selectedSubclass.name.includes(classTemplates[key].subclassKeyword)
  );

  if (!templateKey) {
    console.warn(`No template found for subclass ${selectedSubclass.name}`);
    return null;
  }

  const template = classTemplates[templateKey];

  // Get suggested traits from SRD JSON
  const classDataFromSRD = classesData.find((c: any) => c.name === selectedClass.name);
  const stats = classDataFromSRD?.suggested_traits
    ? parseSuggestedTraits(classDataFromSRD.suggested_traits)
    : { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 };

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
    stats: stats,
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
