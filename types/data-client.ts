import { Character, CharacterInventoryItem, Experience, LibraryItem, Profile, ContentAccess } from './character';
import { Modifier } from './modifiers';
import type {
  Campaign,
  CampaignInsert,
  CampaignUpdate,
  CampaignMember,
  CampaignMemberInsert,
  CampaignMemberUpdate,
  EnrichedCampaignMember,
  CampaignWithMembers,
} from './campaign';

export interface LibraryFilterOptions {
  includePlaytest?: boolean;
}

export interface DataClient {
  character: {
    get: (userId: string, characterId?: string) => Promise<Character | null>;
    list: (userId: string) => Promise<Character[]>;
    create: (character: any) => Promise<string>;
    delete: (characterId: string) => Promise<void>;
    count: (userId: string) => Promise<number>;
    update: (characterId: string, data: Partial<Character>) => Promise<void>;
    updateVitals: (characterId: string, vitals: any, damageThresholds: any, evasion: number) => Promise<void>;
  };
  inventory: {
    add: (characterId: string, item: any) => Promise<CharacterInventoryItem>;
    remove: (itemId: string) => Promise<void>;
    update: (itemId: string, updates: Partial<CharacterInventoryItem>) => Promise<void>;
    batchUpdate: (updates: { id: string; updates: Partial<CharacterInventoryItem> }[]) => Promise<void>;
    equip: (updates: { id: string; location: string }[]) => Promise<void>;
  };
  card: {
    add: (characterId: string, cardId: string, location?: string) => Promise<any>;
    remove: (cardId: string) => Promise<void>;
    update: (cardId: string, updates: any) => Promise<void>;
  };
  library: {
    get: (id: string) => Promise<LibraryItem>;
    search: (query: string, type?: string, options?: LibraryFilterOptions) => Promise<LibraryItem[]>;
    getByType: (type: string, options?: LibraryFilterOptions) => Promise<LibraryItem[]>;
    getAll: (options?: LibraryFilterOptions) => Promise<LibraryItem[]>;
    getByTypeForUser: (type: string, userId: string) => Promise<LibraryItem[]>;
  };
  homebrew: {
    list: (userId: string) => Promise<any[]>;
    create: (item: any) => Promise<any>;
    update: (id: string, item: any) => Promise<void>;
    delete: (id: string) => Promise<void>;
  };
  profile: {
    get: (userId: string) => Promise<Profile | null>;
    create: (userId: string, profile: any) => Promise<void>;
    update: (userId: string, updates: Partial<Profile>) => Promise<void>;
    updateContentAccess: (userId: string, contentAccess: ContentAccess) => Promise<void>;
  };
  campaign: {
    // Campaign CRUD
    create: (data: CampaignInsert) => Promise<Campaign>;
    get: (id: string) => Promise<Campaign | null>;
    getWithMembers: (id: string) => Promise<CampaignWithMembers | null>;
    list: (userId: string) => Promise<Campaign[]>;
    update: (id: string, data: CampaignUpdate) => Promise<Campaign>;
    delete: (id: string) => Promise<void>;

    // Member management
    getMembers: (campaignId: string) => Promise<EnrichedCampaignMember[]>;
    addMember: (data: CampaignMemberInsert) => Promise<CampaignMember>;
    updateMember: (id: string, data: CampaignMemberUpdate) => Promise<CampaignMember>;
    removeMember: (id: string) => Promise<void>;

    // Invite code operations
    findByInviteCode: (inviteCode: string) => Promise<Campaign | null>;
    joinByInviteCode: (inviteCode: string, userId: string, characterId?: string) => Promise<CampaignMember>;

    // Transfer GM
    transferGM: (campaignId: string, newGmUserId: string) => Promise<void>;

    // Phase 2: GM Screen methods
    getPartyCharacters: (campaignId: string) => Promise<Character[]>;
    gmAdjustVital: (characterId: string, vital: 'hp' | 'stress' | 'armor' | 'hope', newValue: number) => Promise<void>;
    updateFear: (campaignId: string, change: number) => Promise<Campaign>;
  };
}
