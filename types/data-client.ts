import { Character, CharacterInventoryItem, Experience } from './character';
import { Modifier } from './modifiers';

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
    get: (id: string) => Promise<any>;
    search: (query: string, type?: string) => Promise<any[]>;
    getByType: (type: string) => Promise<any[]>;
    getAll: () => Promise<any[]>;
  };
  homebrew: {
    list: (userId: string) => Promise<any[]>;
    create: (item: any) => Promise<any>;
    update: (id: string, item: any) => Promise<void>;
    delete: (id: string) => Promise<void>;
  };
  profile: {
    get: (userId: string) => Promise<any | null>;
    create: (userId: string, profile: any) => Promise<void>;
  };
}
