/**
 * DATA SERVICE TESTS
 * ----------------------------------------------------------------------------
 * This test suite validates the data-service.ts abstraction layer that wraps
 * Supabase operations for all database interactions.
 *
 * FUNCTIONALITY TESTED:
 * - character: get, list, create, update, updateVitals, delete, count
 * - inventory: add, remove, update, batchUpdate, equip
 * - card: add, remove, update
 * - library: get, search, getByType, getAll, getByTypeForUser
 * - homebrew: list, create, update, delete
 * - profile: get, create, update, updateContentAccess
 *
 * APPROACH:
 * We mock the Supabase client at the module level using a chainable mock that
 * properly supports all Supabase query builder patterns.
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { dataService } from '@/lib/data-service';

// Create a flexible mock that returns itself for chaining
function createChainableMock(resolveTo?: any) {
    const mock: any = vi.fn(() => mock);

    const methods = [
        'select', 'insert', 'update', 'delete',
        'eq', 'in', 'ilike', 'order', 'limit',
        'maybeSingle', 'single'
    ];

    methods.forEach(method => {
        mock[method] = vi.fn(() => mock);
    });

    // Default resolve for terminal methods
    mock.then = (resolve: any) => resolve(resolveTo || { data: null, error: null });

    return mock;
}

// Create a mock Supabase client
let mockChain: ReturnType<typeof createChainableMock>;
const mockRpc = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
    default: () => ({
        from: (table: string) => mockChain,
        rpc: mockRpc,
    }),
}));

describe('Data Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockChain = createChainableMock();
    });

    // ========================================================================
    // CHARACTER OPERATIONS
    // ========================================================================
    describe('character', () => {
        describe('get', () => {
            it('should return null when character not found', async () => {
                mockChain.then = (r: any) => r({ data: null, error: null });

                const result = await dataService.character.get('user-1', 'nonexistent');

                expect(result).toBeNull();
            });

            it('should throw error on database failure', async () => {
                mockChain.then = (r: any) => r({
                    data: null,
                    error: { message: 'Connection failed', code: 'PGRST000' }
                });

                await expect(dataService.character.get('user-1', 'char-1'))
                    .rejects.toMatchObject({ message: 'Connection failed' });
            });

            it('should call correct query methods for specific character', async () => {
                const mockCharacter = {
                    id: 'char-1',
                    user_id: 'user-1',
                    name: 'Test Hero',
                    level: 3,
                    stats: {},
                    vitals: {},
                    experiences: [],
                };

                // Setup query to return character, then empty arrays for cards/inventory
                let callCount = 0;
                mockChain.then = (r: any) => {
                    callCount++;
                    if (callCount === 1) return r({ data: mockCharacter, error: null });
                    return r({ data: [], error: null });
                };

                const result = await dataService.character.get('user-1', 'char-1');

                expect(mockChain.select).toHaveBeenCalled();
                expect(mockChain.eq).toHaveBeenCalled();
                expect(result?.name).toBe('Test Hero');
            });

            it('should use limit(1) when no characterId provided', async () => {
                const mockCharacter = {
                    id: 'char-1',
                    user_id: 'user-1',
                    name: 'First Char',
                    level: 1,
                    stats: {},
                    vitals: {},
                    experiences: [],
                };

                let callCount = 0;
                mockChain.then = (r: any) => {
                    callCount++;
                    if (callCount === 1) return r({ data: mockCharacter, error: null });
                    return r({ data: [], error: null });
                };

                await dataService.character.get('user-1');

                expect(mockChain.limit).toHaveBeenCalledWith(1);
            });
        });

        describe('update', () => {
            it('should call update with correct parameters', async () => {
                mockChain.then = (r: any) => r({ error: null });

                await dataService.character.update('char-1', { name: 'Updated Name' });

                expect(mockChain.update).toHaveBeenCalledWith({ name: 'Updated Name' });
                expect(mockChain.eq).toHaveBeenCalledWith('id', 'char-1');
            });

            it('should throw on error', async () => {
                mockChain.then = (r: any) => r({ error: { message: 'Update failed' } });

                await expect(dataService.character.update('char-1', { name: 'Test' }))
                    .rejects.toMatchObject({ message: 'Update failed' });
            });
        });

        describe('updateVitals', () => {
            it('should update vitals, damage thresholds, and evasion', async () => {
                mockChain.then = (r: any) => r({ error: null });

                const vitals = { hit_points_current: 5, hit_points_max: 12 };
                const thresholds = { minor: 2, major: 4, severe: 8 };

                await dataService.character.updateVitals('char-1', vitals, thresholds, 14);

                expect(mockChain.update).toHaveBeenCalledWith({
                    vitals,
                    damage_thresholds: thresholds,
                    evasion: 14
                });
                expect(mockChain.eq).toHaveBeenCalledWith('id', 'char-1');
            });
        });

        describe('list', () => {
            it('should return characters ordered by updated_at descending', async () => {
                const mockCharacters = [
                    { id: 'char-1', name: 'Newest', stats: '{}', vitals: '{}' },
                    { id: 'char-2', name: 'Oldest', stats: '{}', vitals: '{}' },
                ];

                mockChain.then = (r: any) => r({ data: mockCharacters, error: null });

                const result = await dataService.character.list('user-1');

                expect(mockChain.select).toHaveBeenCalledWith('*');
                expect(mockChain.order).toHaveBeenCalledWith('updated_at', { ascending: false });
                expect(result).toHaveLength(2);
            });

            it('should return empty array when no characters', async () => {
                mockChain.then = (r: any) => r({ data: null, error: null });

                const result = await dataService.character.list('user-1');

                expect(result).toEqual([]);
            });

            it('should parse JSON string fields', async () => {
                const mockCharacters = [
                    {
                        id: 'char-1',
                        name: 'Test',
                        stats: '{"strength":2}',
                        vitals: '{"hit_points_current":10}',
                        damage_thresholds: '{"minor":1}',
                        experiences: '["Combat"]',
                        modifiers: '[]',
                        gold: '{"handfuls":5}',
                    },
                ];

                mockChain.then = (r: any) => r({ data: mockCharacters, error: null });

                const result = await dataService.character.list('user-1');

                expect(result[0].stats).toEqual({ strength: 2 });
                expect(result[0].vitals).toEqual({ hit_points_current: 10 });
            });
        });

        describe('create', () => {
            it('should insert character and return id', async () => {
                let insertCalls = 0;
                mockChain.then = (r: any) => {
                    insertCalls++;
                    if (insertCalls === 1) return r({ data: { id: 'new-char-1' }, error: null });
                    return r({ error: null });
                };

                const payload = {
                    character: { name: 'New Hero', level: 1, user_id: 'user-1' },
                    cards: [],
                    inventory: [],
                };

                const result = await dataService.character.create(payload);

                expect(result).toBe('new-char-1');
                expect(mockChain.insert).toHaveBeenCalledWith(payload.character);
            });

            it('should insert cards when provided', async () => {
                let callCount = 0;
                mockChain.then = (r: any) => {
                    callCount++;
                    if (callCount === 1) return r({ data: { id: 'new-char-1' }, error: null });
                    return r({ error: null });
                };

                const payload = {
                    character: { name: 'New Hero', level: 1, user_id: 'user-1' },
                    cards: [{ card_id: 'ability-slash' }],
                    inventory: [],
                };

                await dataService.character.create(payload);

                // Second insert call should be for cards
                expect(mockChain.insert).toHaveBeenNthCalledWith(2, [
                    { card_id: 'ability-slash', character_id: 'new-char-1' }
                ]);
            });

            it('should insert inventory when provided', async () => {
                let callCount = 0;
                mockChain.then = (r: any) => {
                    callCount++;
                    if (callCount === 1) return r({ data: { id: 'new-char-1' }, error: null });
                    return r({ error: null });
                };

                const payload = {
                    character: { name: 'New Hero', level: 1, user_id: 'user-1' },
                    cards: [],
                    inventory: [{ item_id: 'item-sword' }],
                };

                await dataService.character.create(payload);

                expect(mockChain.insert).toHaveBeenNthCalledWith(2, [
                    { item_id: 'item-sword', character_id: 'new-char-1' }
                ]);
            });
        });

        describe('delete', () => {
            it('should delete character by id', async () => {
                mockChain.then = (r: any) => r({ error: null });

                await dataService.character.delete('char-1');

                expect(mockChain.delete).toHaveBeenCalled();
                expect(mockChain.eq).toHaveBeenCalledWith('id', 'char-1');
            });

            it('should throw on error', async () => {
                mockChain.then = (r: any) => r({ error: { message: 'Delete failed' } });

                await expect(dataService.character.delete('char-1'))
                    .rejects.toMatchObject({ message: 'Delete failed' });
            });
        });

        describe('count', () => {
            it('should return character count', async () => {
                mockChain.then = (r: any) => r({ count: 5, error: null });

                const result = await dataService.character.count('user-1');

                expect(result).toBe(5);
                expect(mockChain.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
                expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-1');
            });

            it('should return 0 when count is null', async () => {
                mockChain.then = (r: any) => r({ count: null, error: null });

                const result = await dataService.character.count('user-1');

                expect(result).toBe(0);
            });
        });
    });

    // ========================================================================
    // INVENTORY OPERATIONS
    // ========================================================================
    describe('inventory', () => {
        describe('add', () => {
            it('should add item to character inventory', async () => {
                const newItem = { item_id: 'item-potion', quantity: 3 };
                const inserted = { id: 'inv-1', ...newItem, character_id: 'char-1' };

                mockChain.then = (r: any) => r({ data: inserted, error: null });

                const result = await dataService.inventory.add('char-1', newItem);

                expect(result).toEqual(inserted);
                expect(mockChain.insert).toHaveBeenCalledWith({
                    ...newItem,
                    character_id: 'char-1'
                });
            });
        });

        describe('remove', () => {
            it('should remove item from inventory', async () => {
                mockChain.then = (r: any) => r({ error: null });

                await dataService.inventory.remove('inv-1');

                expect(mockChain.delete).toHaveBeenCalled();
                expect(mockChain.eq).toHaveBeenCalledWith('id', 'inv-1');
            });
        });

        describe('update', () => {
            it('should update inventory item', async () => {
                mockChain.then = (r: any) => r({ error: null });

                await dataService.inventory.update('inv-1', { quantity: 5 });

                expect(mockChain.update).toHaveBeenCalledWith({ quantity: 5 });
                expect(mockChain.eq).toHaveBeenCalledWith('id', 'inv-1');
            });
        });

        describe('batchUpdate', () => {
            it('should update multiple items', async () => {
                mockChain.then = (r: any) => r({ error: null });

                const updates = [
                    { id: 'inv-1', updates: { quantity: 1 } },
                    { id: 'inv-2', updates: { quantity: 2 } },
                ];

                await dataService.inventory.batchUpdate(updates);

                expect(mockChain.update).toHaveBeenCalledTimes(2);
            });
        });

        describe('equip', () => {
            it('should call swap_equipment_items RPC', async () => {
                mockRpc.mockResolvedValueOnce({ error: null });

                const updates = [
                    { id: 'inv-1', location: 'equipped' },
                    { id: 'inv-2', location: 'inventory' },
                ];

                await dataService.inventory.equip(updates);

                expect(mockRpc).toHaveBeenCalledWith('swap_equipment_items', {
                    updates_json: updates
                });
            });

            it('should throw on RPC error', async () => {
                mockRpc.mockResolvedValueOnce({ error: { message: 'RPC failed' } });

                await expect(dataService.inventory.equip([]))
                    .rejects.toMatchObject({ message: 'RPC failed' });
            });
        });
    });

    // ========================================================================
    // CARD OPERATIONS
    // ========================================================================
    describe('card', () => {
        describe('add', () => {
            it('should add card to vault by default', async () => {
                const inserted = {
                    id: 'cc-1',
                    character_id: 'char-1',
                    card_id: 'ability-test',
                    location: 'vault',
                    state: {},
                    sort_order: 0
                };

                mockChain.then = (r: any) => r({ data: inserted, error: null });

                const result = await dataService.card.add('char-1', 'ability-test');

                expect(result).toEqual(inserted);
                expect(mockChain.insert).toHaveBeenCalledWith([{
                    character_id: 'char-1',
                    card_id: 'ability-test',
                    location: 'vault',
                    state: {},
                    sort_order: 0
                }]);
            });

            it('should add card to specified location', async () => {
                mockChain.then = (r: any) => r({ data: { id: 'cc-1' }, error: null });

                await dataService.card.add('char-1', 'ability-test', 'loadout');

                expect(mockChain.insert).toHaveBeenCalledWith([
                    expect.objectContaining({ location: 'loadout' })
                ]);
            });
        });

        describe('remove', () => {
            it('should remove card by id', async () => {
                mockChain.then = (r: any) => r({ error: null });

                await dataService.card.remove('cc-1');

                expect(mockChain.delete).toHaveBeenCalled();
                expect(mockChain.eq).toHaveBeenCalledWith('id', 'cc-1');
            });
        });

        describe('update', () => {
            it('should update card fields', async () => {
                mockChain.then = (r: any) => r({ error: null });

                await dataService.card.update('cc-1', { location: 'loadout', sort_order: 5 });

                expect(mockChain.update).toHaveBeenCalledWith({ location: 'loadout', sort_order: 5 });
                expect(mockChain.eq).toHaveBeenCalledWith('id', 'cc-1');
            });
        });
    });

    // ========================================================================
    // LIBRARY OPERATIONS
    // ========================================================================
    describe('library', () => {
        describe('get', () => {
            it('should fetch library item by id', async () => {
                const item = { id: 'ability-fireball', name: 'Fireball', type: 'ability' };
                mockChain.then = (r: any) => r({ data: item, error: null });

                const result = await dataService.library.get('ability-fireball');

                expect(result).toEqual(item);
                expect(mockChain.eq).toHaveBeenCalledWith('id', 'ability-fireball');
            });

            it('should throw on error', async () => {
                mockChain.then = (r: any) => r({ data: null, error: { message: 'Not found' } });

                await expect(dataService.library.get('nonexistent'))
                    .rejects.toMatchObject({ message: 'Not found' });
            });
        });

        describe('search', () => {
            it('should search by name with ilike', async () => {
                const items = [
                    { id: 'ability-fire-bolt', name: 'Fire Bolt' },
                    { id: 'ability-fireball', name: 'Fireball' },
                ];

                mockChain.then = (r: any) => r({ data: items, error: null });

                const result = await dataService.library.search('fire', 'ability');

                expect(result).toHaveLength(2);
                expect(mockChain.ilike).toHaveBeenCalledWith('name', '%fire%');
                expect(mockChain.eq).toHaveBeenCalledWith('type', 'ability');
            });

            it('should filter to SRD-only by default', async () => {
                mockChain.then = (r: any) => r({ data: [], error: null });

                await dataService.library.search('test');

                expect(mockChain.eq).toHaveBeenCalledWith('source', 'srd');
            });

            it('should not filter source when includePlaytest is true', async () => {
                mockChain.then = (r: any) => r({ data: [], error: null });
                // Reset mock to track calls cleanly
                mockChain.eq = vi.fn(() => mockChain);

                await dataService.library.search('test', undefined, { includePlaytest: true });

                // Only called for type (which is undefined, so not called)
                // Should NOT be called for source
                const sourceCalls = (mockChain.eq as Mock).mock.calls.filter((c: any) => c[0] === 'source');
                expect(sourceCalls).toHaveLength(0);
            });
        });

        describe('getByType', () => {
            it('should get all items of a type', async () => {
                const items = [
                    { id: 'class-warrior', name: 'Warrior', type: 'class' },
                    { id: 'class-mage', name: 'Mage', type: 'class' },
                ];

                mockChain.then = (r: any) => r({ data: items, error: null });

                const result = await dataService.library.getByType('class');

                expect(result).toHaveLength(2);
                expect(mockChain.eq).toHaveBeenCalledWith('type', 'class');
            });

            it('should filter to SRD-only by default', async () => {
                mockChain.then = (r: any) => r({ data: [], error: null });

                await dataService.library.getByType('ability');

                expect(mockChain.eq).toHaveBeenCalledWith('source', 'srd');
            });
        });

        describe('getAll', () => {
            it('should get all library items', async () => {
                const items = [{ id: 'item-1' }, { id: 'item-2' }];
                mockChain.then = (r: any) => r({ data: items, error: null });

                const result = await dataService.library.getAll();

                expect(result).toHaveLength(2);
                expect(mockChain.select).toHaveBeenCalledWith('*');
            });

            it('should return empty array on null data', async () => {
                mockChain.then = (r: any) => r({ data: null, error: null });

                const result = await dataService.library.getAll();

                expect(result).toEqual([]);
            });
        });

        describe('getByTypeForUser', () => {
            it('should filter based on user content access', async () => {
                let callCount = 0;
                mockChain.then = (r: any) => {
                    callCount++;
                    if (callCount === 1) {
                        return r({ data: { content_access: { playtest: false } }, error: null });
                    }
                    return r({ data: [], error: null });
                };

                await dataService.library.getByTypeForUser('ability', 'user-1');

                // Should filter to SRD only since user doesn't have playtest access
                expect(mockChain.eq).toHaveBeenCalledWith('source', 'srd');
            });

            it('should not filter source if user has playtest access', async () => {
                let callCount = 0;
                mockChain.eq = vi.fn(() => mockChain);
                mockChain.then = (r: any) => {
                    callCount++;
                    if (callCount === 1) {
                        return r({ data: { content_access: { playtest: true } }, error: null });
                    }
                    return r({ data: [], error: null });
                };

                await dataService.library.getByTypeForUser('ability', 'user-1');

                // Should NOT filter by source
                const sourceCalls = (mockChain.eq as Mock).mock.calls.filter((c: any) => c[0] === 'source');
                expect(sourceCalls).toHaveLength(0);
            });
        });
    });

    // ========================================================================
    // HOMEBREW OPERATIONS
    // ========================================================================
    describe('homebrew', () => {
        describe('list', () => {
            it('should list homebrew items for user ordered by created_at', async () => {
                const items = [
                    { id: 'hb-1', name: 'Custom Sword', user_id: 'user-1' },
                    { id: 'hb-2', name: 'Custom Shield', user_id: 'user-1' },
                ];

                mockChain.then = (r: any) => r({ data: items, error: null });

                const result = await dataService.homebrew.list('user-1');

                expect(result).toHaveLength(2);
                expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
            });

            it('should return empty array on null data', async () => {
                mockChain.then = (r: any) => r({ data: null, error: null });

                const result = await dataService.homebrew.list('user-1');

                expect(result).toEqual([]);
            });
        });

        describe('create', () => {
            it('should create homebrew item', async () => {
                const item = { name: 'Custom Item', type: 'weapon', user_id: 'user-1', data: {} };
                const created = { id: 'hb-new', ...item };

                mockChain.then = (r: any) => r({ data: created, error: null });

                const result = await dataService.homebrew.create(item);

                expect(result).toEqual(created);
                expect(mockChain.insert).toHaveBeenCalledWith(item);
            });
        });

        describe('update', () => {
            it('should update homebrew item', async () => {
                mockChain.then = (r: any) => r({ error: null });

                await dataService.homebrew.update('hb-1', { name: 'Updated Name' });

                expect(mockChain.update).toHaveBeenCalledWith({ name: 'Updated Name' });
                expect(mockChain.eq).toHaveBeenCalledWith('id', 'hb-1');
            });
        });

        describe('delete', () => {
            it('should delete homebrew item', async () => {
                mockChain.then = (r: any) => r({ error: null });

                await dataService.homebrew.delete('hb-1');

                expect(mockChain.delete).toHaveBeenCalled();
                expect(mockChain.eq).toHaveBeenCalledWith('id', 'hb-1');
            });
        });
    });

    // ========================================================================
    // PROFILE OPERATIONS
    // ========================================================================
    describe('profile', () => {
        describe('get', () => {
            it('should get profile by userId', async () => {
                const profile = {
                    id: 'user-1',
                    display_name: 'Test User',
                    content_access: { srd: true, playtest: false }
                };

                mockChain.then = (r: any) => r({ data: profile, error: null });

                const result = await dataService.profile.get('user-1');

                expect(result).toEqual(profile);
                expect(mockChain.eq).toHaveBeenCalledWith('id', 'user-1');
            });

            it('should return null if profile not found', async () => {
                mockChain.then = (r: any) => r({ data: null, error: null });

                const result = await dataService.profile.get('nonexistent');

                expect(result).toBeNull();
            });
        });

        describe('create', () => {
            it('should create profile with userId', async () => {
                mockChain.then = (r: any) => r({ error: null });

                await dataService.profile.create('user-1', { display_name: 'New User' });

                expect(mockChain.insert).toHaveBeenCalledWith({
                    id: 'user-1',
                    display_name: 'New User'
                });
            });
        });

        describe('update', () => {
            it('should update profile fields', async () => {
                mockChain.then = (r: any) => r({ error: null });

                await dataService.profile.update('user-1', { display_name: 'Updated Name' });

                expect(mockChain.update).toHaveBeenCalledWith({ display_name: 'Updated Name' });
                expect(mockChain.eq).toHaveBeenCalledWith('id', 'user-1');
            });
        });

        describe('updateContentAccess', () => {
            it('should update content access settings', async () => {
                mockChain.then = (r: any) => r({ error: null });

                await dataService.profile.updateContentAccess('user-1', {
                    srd: true,
                    playtest: true
                });

                expect(mockChain.update).toHaveBeenCalledWith({
                    content_access: { srd: true, playtest: true }
                });
                expect(mockChain.eq).toHaveBeenCalledWith('id', 'user-1');
            });
        });
    });
});
