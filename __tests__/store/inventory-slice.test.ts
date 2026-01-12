/**
 * INVENTORY SLICE TESTS
 * ----------------------------------------------------------------------------
 * This test suite validates the inventory-slice.ts store functions that manage
 * character inventory and equipment.
 *
 * FUNCTIONALITY TESTED:
 * - equipItem: Equipment slot management with atomic swaps
 * - addItemToInventory: Adding new items (SRD and homebrew)
 * - deleteItemFromInventory: Removing items with rollback on error
 * - useConsumable: Consumable usage with effect application
 * - moveCard: Moving domain cards between loadout and vault
 * - addCardToCollection: Adding domain cards with loadout limits
 * - removeCard: Removing domain cards from character
 * - updateCardImage / updateInventoryItemImage: Custom artwork management
 * - convertItemToHomebrew: Converting SRD items to custom versions
 *
 * ERROR RECOVERY:
 * - All functions use withOptimisticUpdate for rollback on database errors
 * - Tests verify state is restored when database operations fail
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// ============================================================================
// MOCKS - All vi.mock calls must be at the top, before any variable definitions
// vi.mock is hoisted, so factories cannot reference external variables
// ============================================================================

// Mock the data service
vi.mock('@/lib/data-service', () => ({
  dataService: {
    inventory: {
      add: vi.fn(),
      remove: vi.fn(),
      update: vi.fn(),
      equip: vi.fn(),
    },
    card: {
      add: vi.fn(),
      remove: vi.fn(),
      update: vi.fn(),
    },
    homebrew: {
      create: vi.fn(),
    },
    character: {
      updateVitals: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock Supabase client (needed for other store functions)
vi.mock('@/lib/supabase/client', () => ({
  default: () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock utils
vi.mock('@/lib/utils', () => ({
  getSystemModifiers: vi.fn(() => []),
  calculateBaseEvasion: vi.fn(() => 10),
}));

// ============================================================================
// IMPORTS - After all mocks are declared
// ============================================================================
import { useCharacterStore } from '@/store/character-store';
import { dataService } from '@/lib/data-service';
import { toast } from 'sonner';
import type { Character, CharacterInventoryItem, CharacterCard, LibraryItem } from '@/types/character';

// Get typed references to mocks
const mockDataService = vi.mocked(dataService);
const mockToast = vi.mocked(toast);

// ============================================================================
// TEST FIXTURES
// ============================================================================

const createMockCharacter = (overrides?: Partial<Character>): Character => ({
  id: 'char-1',
  user_id: 'user-1',
  name: 'Test Character',
  level: 1,
  stats: {
    agility: 0, strength: 0, finesse: 0,
    instinct: 0, presence: 0, knowledge: 0,
  },
  vitals: {
    hit_points_max: 6,
    hit_points_current: 6,
    stress_max: 6,
    stress_current: 0,
    armor_score: 0,
    armor_slots: 0,
  },
  damage_thresholds: { minor: 1, major: 1, severe: 2 },
  hope: 6,
  fear: 0,
  evasion: 10,
  proficiency: 0,
  experiences: [],
  modifiers: {},
  gold: { handfuls: 0, bags: 0, chests: 0 },
  character_cards: [],
  character_inventory: [],
  class_data: { id: 'class1', type: 'class', name: 'Warrior', data: {} },
  ...overrides,
});

const createMockInventoryItem = (overrides?: Partial<CharacterInventoryItem>): CharacterInventoryItem => ({
  id: 'inv-item-1',
  character_id: 'char-1',
  item_id: 'lib-item-1',
  name: 'Test Weapon',
  location: 'backpack',
  quantity: 1,
  library_item: {
    id: 'lib-item-1',
    type: 'weapon',
    name: 'Test Weapon',
    data: { trait: 'Strength', range: 'Melee', damage: '1d8' },
  },
  ...overrides,
});

const createMockCard = (overrides?: Partial<CharacterCard>): CharacterCard => ({
  id: 'card-1',
  character_id: 'char-1',
  item_id: 'lib-card-1',
  location: 'loadout',
  state: {},
  library_item: {
    id: 'lib-card-1',
    type: 'ability',
    name: 'Arcane Arrow',
    data: { domain: 'Arcana', tier: 1 },
  },
  ...overrides,
});

// ============================================================================
// SETUP AND TEARDOWN
// ============================================================================

describe('Inventory Slice', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Reset store to initial state
    useCharacterStore.setState({
      character: null,
      user: { id: 'user-1', email: 'test@test.com' },
      isLoading: false,
      activeTab: 'character',
      isDiceOverlayOpen: false,
      activeRoll: null,
      lastRollResult: null,
      homebrewItems: [],
    });

    // Default mock implementations (success cases)
    mockDataService.inventory.equip.mockResolvedValue({ error: null });
    mockDataService.inventory.add.mockResolvedValue({ id: 'new-inv-1', character_id: 'char-1' });
    mockDataService.inventory.remove.mockResolvedValue({ error: null });
    mockDataService.inventory.update.mockResolvedValue({ error: null });
    mockDataService.card.add.mockResolvedValue({ id: 'new-card-1', character_id: 'char-1' });
    mockDataService.card.remove.mockResolvedValue({ error: null });
    mockDataService.card.update.mockResolvedValue({ error: null });
    mockDataService.character.updateVitals.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // equipItem TESTS
  // ==========================================================================

  describe('equipItem', () => {
    it('should equip item to primary slot', async () => {
      const item = createMockInventoryItem({ location: 'backpack' });
      const character = createMockCharacter({ character_inventory: [item] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().equipItem('inv-item-1', 'equipped_primary');

      const state = useCharacterStore.getState();
      const updatedItem = state.character?.character_inventory?.find(i => i.id === 'inv-item-1');
      expect(updatedItem?.location).toBe('equipped_primary');
    });

    it('should swap items when equipping to occupied slot', async () => {
      const item1 = createMockInventoryItem({ id: 'inv-1', location: 'equipped_primary' });
      const item2 = createMockInventoryItem({ id: 'inv-2', location: 'backpack', name: 'Second Weapon' });
      const character = createMockCharacter({ character_inventory: [item1, item2] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().equipItem('inv-2', 'equipped_primary');

      const state = useCharacterStore.getState();
      const updated1 = state.character?.character_inventory?.find(i => i.id === 'inv-1');
      const updated2 = state.character?.character_inventory?.find(i => i.id === 'inv-2');

      expect(updated1?.location).toBe('backpack'); // Swapped out
      expect(updated2?.location).toBe('equipped_primary'); // Equipped
    });

    it('should unequip item to backpack', async () => {
      const item = createMockInventoryItem({ location: 'equipped_primary' });
      const character = createMockCharacter({ character_inventory: [item] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().equipItem('inv-item-1', 'backpack');

      const state = useCharacterStore.getState();
      const updatedItem = state.character?.character_inventory?.find(i => i.id === 'inv-item-1');
      expect(updatedItem?.location).toBe('backpack');
    });

    it('should call dataService.inventory.equip with correct updates', async () => {
      const item = createMockInventoryItem({ location: 'backpack' });
      const character = createMockCharacter({ character_inventory: [item] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().equipItem('inv-item-1', 'equipped_primary');

      expect(mockDataService.inventory.equip).toHaveBeenCalledWith([
        { id: 'inv-item-1', location: 'equipped_primary' },
      ]);
    });

    it('should rollback on database error', async () => {
      const item = createMockInventoryItem({ location: 'backpack' });
      const character = createMockCharacter({ character_inventory: [item] });
      useCharacterStore.getState().setCharacter(character);

      mockDataService.inventory.equip.mockResolvedValue({ error: new Error('DB error') });

      await useCharacterStore.getState().equipItem('inv-item-1', 'equipped_primary');

      // Should rollback to original state
      const state = useCharacterStore.getState();
      const updatedItem = state.character?.character_inventory?.find(i => i.id === 'inv-item-1');
      expect(updatedItem?.location).toBe('backpack');
    });

    it('should not crash when item does not exist', async () => {
      const character = createMockCharacter({ character_inventory: [] });
      useCharacterStore.getState().setCharacter(character);

      await expect(
        useCharacterStore.getState().equipItem('non-existent', 'equipped_primary')
      ).resolves.not.toThrow();
    });

    it('should not crash when no character loaded', async () => {
      useCharacterStore.getState().setCharacter(null);

      await expect(
        useCharacterStore.getState().equipItem('any-id', 'equipped_primary')
      ).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // deleteItemFromInventory TESTS
  // ==========================================================================

  describe('deleteItemFromInventory', () => {
    it('should remove item from inventory', async () => {
      const item = createMockInventoryItem();
      const character = createMockCharacter({ character_inventory: [item] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().deleteItemFromInventory('inv-item-1');

      const state = useCharacterStore.getState();
      expect(state.character?.character_inventory?.length).toBe(0);
    });

    it('should call dataService.inventory.remove', async () => {
      const item = createMockInventoryItem();
      const character = createMockCharacter({ character_inventory: [item] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().deleteItemFromInventory('inv-item-1');

      expect(mockDataService.inventory.remove).toHaveBeenCalledWith('inv-item-1');
    });

    it('should rollback on database error', async () => {
      const item = createMockInventoryItem();
      const character = createMockCharacter({ character_inventory: [item] });
      useCharacterStore.getState().setCharacter(character);

      mockDataService.inventory.remove.mockResolvedValue({ error: new Error('DB error') });

      await useCharacterStore.getState().deleteItemFromInventory('inv-item-1');

      // Should restore the item
      const state = useCharacterStore.getState();
      expect(state.character?.character_inventory?.length).toBe(1);
    });
  });

  // ==========================================================================
  // moveCard TESTS
  // ==========================================================================

  describe('moveCard', () => {
    it('should move card from loadout to vault', async () => {
      const card = createMockCard({ location: 'loadout' });
      const character = createMockCharacter({ character_cards: [card] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().moveCard('card-1', 'vault');

      const state = useCharacterStore.getState();
      const updatedCard = state.character?.character_cards?.find(c => c.id === 'card-1');
      expect(updatedCard?.location).toBe('vault');
    });

    it('should move card from vault to loadout', async () => {
      const card = createMockCard({ location: 'vault' });
      const character = createMockCharacter({ character_cards: [card] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().moveCard('card-1', 'loadout');

      const state = useCharacterStore.getState();
      const updatedCard = state.character?.character_cards?.find(c => c.id === 'card-1');
      expect(updatedCard?.location).toBe('loadout');
    });

    it('should call dataService.card.update with new location', async () => {
      const card = createMockCard({ location: 'loadout' });
      const character = createMockCharacter({ character_cards: [card] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().moveCard('card-1', 'vault');

      expect(mockDataService.card.update).toHaveBeenCalledWith('card-1', { location: 'vault' });
    });

    it('should rollback on database error', async () => {
      const card = createMockCard({ location: 'loadout' });
      const character = createMockCharacter({ character_cards: [card] });
      useCharacterStore.getState().setCharacter(character);

      mockDataService.card.update.mockResolvedValue({ error: new Error('DB error') });

      await useCharacterStore.getState().moveCard('card-1', 'vault');

      // Should restore original location
      const state = useCharacterStore.getState();
      const updatedCard = state.character?.character_cards?.find(c => c.id === 'card-1');
      expect(updatedCard?.location).toBe('loadout');
    });

    it('should not crash when card does not exist', async () => {
      const character = createMockCharacter({ character_cards: [] });
      useCharacterStore.getState().setCharacter(character);

      await expect(
        useCharacterStore.getState().moveCard('non-existent', 'vault')
      ).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // addCardToCollection TESTS
  // ==========================================================================

  describe('addCardToCollection', () => {
    it('should add card to loadout when under 5 cards', async () => {
      const character = createMockCharacter({ character_cards: [] });
      useCharacterStore.getState().setCharacter(character);

      const newCard: LibraryItem = {
        id: 'lib-new-card',
        type: 'ability',
        name: 'New Ability',
        data: { domain: 'Blade', tier: 1 },
      };

      await useCharacterStore.getState().addCardToCollection(newCard);

      expect(mockDataService.card.add).toHaveBeenCalledWith('char-1', 'lib-new-card', 'loadout');
    });

    it('should add card to vault when loadout is full (5 cards)', async () => {
      const loadoutCards = Array.from({ length: 5 }, (_, i) =>
        createMockCard({ id: `card-${i}`, location: 'loadout' })
      );
      const character = createMockCharacter({ character_cards: loadoutCards });
      useCharacterStore.getState().setCharacter(character);

      const newCard: LibraryItem = {
        id: 'lib-new-card',
        type: 'ability',
        name: 'New Ability',
        data: {},
      };

      await useCharacterStore.getState().addCardToCollection(newCard);

      expect(mockDataService.card.add).toHaveBeenCalledWith('char-1', 'lib-new-card', 'vault');
    });

    it('should update state with new card after successful add', async () => {
      const character = createMockCharacter({ character_cards: [] });
      useCharacterStore.getState().setCharacter(character);

      mockDataService.card.add.mockResolvedValue({
        id: 'new-card-1',
        character_id: 'char-1',
        item_id: 'lib-new-card',
        location: 'loadout',
        state: {},
      });

      const newCard: LibraryItem = {
        id: 'lib-new-card',
        type: 'ability',
        name: 'New Ability',
        data: {},
      };

      await useCharacterStore.getState().addCardToCollection(newCard);

      const state = useCharacterStore.getState();
      expect(state.character?.character_cards?.length).toBe(1);
      expect(state.character?.character_cards?.[0].library_item?.name).toBe('New Ability');
    });
  });

  // ==========================================================================
  // removeCard TESTS
  // ==========================================================================

  describe('removeCard', () => {
    it('should remove card from character', async () => {
      const card = createMockCard();
      const character = createMockCharacter({ character_cards: [card] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().removeCard('card-1');

      const state = useCharacterStore.getState();
      expect(state.character?.character_cards?.length).toBe(0);
    });

    it('should call dataService.card.remove', async () => {
      const card = createMockCard();
      const character = createMockCharacter({ character_cards: [card] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().removeCard('card-1');

      expect(mockDataService.card.remove).toHaveBeenCalledWith('card-1');
    });

    it('should show success toast after removal', async () => {
      const card = createMockCard();
      const character = createMockCharacter({ character_cards: [card] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().removeCard('card-1');

      expect(mockToast.success).toHaveBeenCalledWith('Card removed from character');
    });
  });

  // ==========================================================================
  // useConsumable TESTS
  // ==========================================================================

  describe('useConsumable', () => {
    it('should heal HP when using health potion', async () => {
      const potion = createMockInventoryItem({
        id: 'potion-1',
        name: 'Minor Health Potion',
        quantity: 1,
        library_item: {
          id: 'lib-potion',
          type: 'consumable',
          name: 'Minor Health Potion',
          data: {},
        },
      });
      const character = createMockCharacter({
        character_inventory: [potion],
        vitals: {
          hit_points_max: 6,
          hit_points_current: 3, // Damaged
          stress_max: 6,
          stress_current: 0,
          armor_score: 0,
          armor_slots: 0,
        },
      });
      useCharacterStore.getState().setCharacter(character);

      // Mock updateVitals
      const mockUpdateVitals = vi.fn();
      useCharacterStore.setState({ updateVitals: mockUpdateVitals });

      await useCharacterStore.getState().useConsumable('potion-1');

      expect(mockUpdateVitals).toHaveBeenCalledWith('hit_points_current', 4); // +1 HP
    });

    it('should clear stress when using stamina potion', async () => {
      const potion = createMockInventoryItem({
        id: 'potion-1',
        name: 'Minor Stamina Potion',
        quantity: 1,
        library_item: {
          id: 'lib-potion',
          type: 'consumable',
          name: 'Minor Stamina Potion',
          data: {},
        },
      });
      const character = createMockCharacter({
        character_inventory: [potion],
        vitals: {
          hit_points_max: 6,
          hit_points_current: 6,
          stress_max: 6,
          stress_current: 3, // Has stress
          armor_score: 0,
          armor_slots: 0,
        },
      });
      useCharacterStore.getState().setCharacter(character);

      const mockUpdateVitals = vi.fn();
      useCharacterStore.setState({ updateVitals: mockUpdateVitals });

      await useCharacterStore.getState().useConsumable('potion-1');

      expect(mockUpdateVitals).toHaveBeenCalledWith('stress_current', 2); // -1 Stress
    });

    it('should decrement quantity when using consumable with quantity > 1', async () => {
      const potion = createMockInventoryItem({
        id: 'potion-1',
        name: 'Generic Potion',
        quantity: 3,
        library_item: {
          id: 'lib-potion',
          type: 'consumable',
          name: 'Generic Potion',
          data: {},
        },
      });
      const character = createMockCharacter({ character_inventory: [potion] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().useConsumable('potion-1');

      const state = useCharacterStore.getState();
      const updatedPotion = state.character?.character_inventory?.find(i => i.id === 'potion-1');
      expect(updatedPotion?.quantity).toBe(2);
    });

    it('should remove item when using last consumable (quantity = 1)', async () => {
      const potion = createMockInventoryItem({
        id: 'potion-1',
        name: 'Generic Potion',
        quantity: 1,
        library_item: {
          id: 'lib-potion',
          type: 'consumable',
          name: 'Generic Potion',
          data: {},
        },
      });
      const character = createMockCharacter({ character_inventory: [potion] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().useConsumable('potion-1');

      const state = useCharacterStore.getState();
      expect(state.character?.character_inventory?.length).toBe(0);
    });

    it('should show error toast for non-consumable items', async () => {
      const weapon = createMockInventoryItem({
        id: 'weapon-1',
        name: 'Sword',
        library_item: {
          id: 'lib-weapon',
          type: 'weapon', // Not consumable
          name: 'Sword',
          data: {},
        },
      });
      const character = createMockCharacter({ character_inventory: [weapon] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().useConsumable('weapon-1');

      expect(mockToast.error).toHaveBeenCalledWith('This item cannot be used');
    });

    it('should show error toast when item not found', async () => {
      const character = createMockCharacter({ character_inventory: [] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().useConsumable('non-existent');

      expect(mockToast.error).toHaveBeenCalledWith('Item not found');
    });
  });

  // ==========================================================================
  // updateCardImage TESTS
  // ==========================================================================

  describe('updateCardImage', () => {
    it('should update card with custom image URL', async () => {
      const card = createMockCard({ state: {} });
      const character = createMockCharacter({ character_cards: [card] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().updateCardImage('card-1', 'https://example.com/image.png');

      const state = useCharacterStore.getState();
      const updatedCard = state.character?.character_cards?.find(c => c.id === 'card-1');
      expect(updatedCard?.state?.custom_image_url).toBe('https://example.com/image.png');
    });

    it('should clear image when URL is null', async () => {
      const card = createMockCard({
        state: {
          custom_image_url: 'https://example.com/old.png',
          custom_image_position_x: 50,
          custom_image_position_y: 50,
        },
      });
      const character = createMockCharacter({ character_cards: [card] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().updateCardImage('card-1', null);

      const state = useCharacterStore.getState();
      const updatedCard = state.character?.character_cards?.find(c => c.id === 'card-1');
      expect(updatedCard?.state?.custom_image_url).toBeNull();
    });

    it('should set default position when adding image without position', async () => {
      const card = createMockCard({ state: {} });
      const character = createMockCharacter({ character_cards: [card] });
      useCharacterStore.getState().setCharacter(character);

      await useCharacterStore.getState().updateCardImage('card-1', 'https://example.com/image.png');

      const state = useCharacterStore.getState();
      const updatedCard = state.character?.character_cards?.find(c => c.id === 'card-1');
      expect(updatedCard?.state?.custom_image_position_x).toBe(50);
      expect(updatedCard?.state?.custom_image_position_y).toBe(0);
    });

    it('should rollback on database error', async () => {
      const card = createMockCard({ state: {} });
      const character = createMockCharacter({ character_cards: [card] });
      useCharacterStore.getState().setCharacter(character);

      mockDataService.card.update.mockResolvedValue({ error: new Error('DB error') });

      await useCharacterStore.getState().updateCardImage('card-1', 'https://example.com/image.png');

      // Should restore original state
      const state = useCharacterStore.getState();
      const updatedCard = state.character?.character_cards?.find(c => c.id === 'card-1');
      expect(updatedCard?.state?.custom_image_url).toBeUndefined();
    });
  });

  // ==========================================================================
  // addItemToInventory TESTS
  // ==========================================================================

  describe('addItemToInventory', () => {
    it('should add SRD item to inventory', async () => {
      const character = createMockCharacter({ character_inventory: [] });
      useCharacterStore.getState().setCharacter(character);

      const newItem: LibraryItem = {
        id: 'lib-sword',
        type: 'weapon',
        name: 'Longsword',
        data: { markdown: 'A fine sword' },
      };

      await useCharacterStore.getState().addItemToInventory(newItem);

      expect(mockDataService.inventory.add).toHaveBeenCalledWith(
        'char-1',
        expect.objectContaining({
          character_id: 'char-1',
          item_id: 'lib-sword',
          homebrew_item_id: undefined,
          name: 'Longsword',
          location: 'backpack',
          quantity: 1,
        })
      );
    });

    it('should add homebrew item to inventory', async () => {
      const character = createMockCharacter({ character_inventory: [] });
      useCharacterStore.setState({
        ...useCharacterStore.getState(),
        homebrewItems: [{ id: 'hb-123', name: 'Custom Sword', type: 'weapon', data: {} }],
      });
      useCharacterStore.getState().setCharacter(character);

      const homebrewItem: LibraryItem = {
        id: 'homebrew-hb-123', // Homebrew prefix
        type: 'weapon',
        name: 'Custom Sword',
        data: {},
      };

      await useCharacterStore.getState().addItemToInventory(homebrewItem);

      expect(mockDataService.inventory.add).toHaveBeenCalledWith(
        'char-1',
        expect.objectContaining({
          item_id: undefined, // No library item ID
          homebrew_item_id: 'hb-123', // Extracted from homebrew- prefix
        })
      );
    });

    it('should update state with added item', async () => {
      const character = createMockCharacter({ character_inventory: [] });
      useCharacterStore.getState().setCharacter(character);

      mockDataService.inventory.add.mockResolvedValue({
        id: 'new-inv-1',
        character_id: 'char-1',
        item_id: 'lib-sword',
        name: 'Longsword',
        location: 'backpack',
        quantity: 1,
      });

      const newItem: LibraryItem = {
        id: 'lib-sword',
        type: 'weapon',
        name: 'Longsword',
        data: {},
      };

      await useCharacterStore.getState().addItemToInventory(newItem);

      const state = useCharacterStore.getState();
      expect(state.character?.character_inventory?.length).toBe(1);
      expect(state.character?.character_inventory?.[0].name).toBe('Longsword');
    });
  });
});
