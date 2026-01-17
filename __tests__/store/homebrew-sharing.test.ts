/**
 * Homebrew Sharing Tests (Phase 6)
 * ----------------------------------------------------------------------------
 * TDD tests for the homebrew sharing system. These tests define the expected
 * behavior for sharing homebrew items with campaigns, retrieving shared items,
 * and adding shared items to character inventory.
 *
 * Following TDD methodology: Write tests first (RED), then implement (GREEN).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================================
// MOCKS - All vi.mock calls must be at the top
// ============================================================================

// Mock data service
vi.mock('@/lib/data-service', () => ({
  dataService: {
    campaign: {
      list: vi.fn(),
      create: vi.fn(),
      get: vi.fn(),
      getWithMembers: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getMembers: vi.fn(),
      joinByInviteCode: vi.fn(),
      addMember: vi.fn(),
      updateMember: vi.fn(),
      removeMember: vi.fn(),
      transferGM: vi.fn(),
      getPartyCharacters: vi.fn(),
      gmAdjustVital: vi.fn(),
      updateFear: vi.fn(),
      logActivity: vi.fn(),
      getActivity: vi.fn(),
      getActivityCount: vi.fn(),
    },
    homebrew: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    sharing: {
      share: vi.fn(),
      unshare: vi.fn(),
      listSharedWithMe: vi.fn(),
      listSharedWithCampaign: vi.fn(),
      listSharedByMe: vi.fn(),
      addToInventory: vi.fn(),
    },
    inventory: {
      add: vi.fn(),
      remove: vi.fn(),
      update: vi.fn(),
      batchUpdate: vi.fn(),
      equip: vi.fn(),
    },
  },
}));

// Mock Supabase client
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
  }),
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// ============================================================================
// IMPORTS - After all mocks are declared
// ============================================================================

import { useCharacterStore } from '@/store/character-store';
import { dataService } from '@/lib/data-service';
import { toast } from 'sonner';
import type { SharedHomebrew, EnrichedSharedHomebrew } from '@/types/sharing';
import type { HomebrewItem } from '@/types/character';

// Get typed references to mocks
const mockDataService = vi.mocked(dataService);
const mockToast = vi.mocked(toast);

// ============================================================================
// TEST FIXTURES
// ============================================================================

const mockHomebrewItem: HomebrewItem = {
  id: 'homebrew-1',
  user_id: 'user-123',
  type: 'weapon',
  name: 'Dragon Slayer',
  description: 'A legendary sword imbued with dragon-slaying magic',
  data: {
    trait: 'Strength',
    range: 'Melee',
    damage: '2d8+3',
    burden: 'Two-Handed',
    type: 'Physical',
    modifiers: [{ target: 'damage', value: 3, type: 'equipment' }],
  },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockSharedHomebrew: SharedHomebrew = {
  id: 'shared-1',
  homebrew_item_id: 'homebrew-1',
  shared_by: 'user-123',
  shared_with_user_id: null,
  shared_with_campaign_id: 'campaign-123',
  item_snapshot: {
    type: 'weapon',
    name: 'Dragon Slayer',
    description: 'A legendary sword imbued with dragon-slaying magic',
    data: mockHomebrewItem.data,
  },
  message: 'Check out this cool weapon I made!',
  created_at: '2026-01-01T12:00:00Z',
};

const mockEnrichedSharedHomebrew: EnrichedSharedHomebrew = {
  ...mockSharedHomebrew,
  sharer_username: 'DragonMaster',
  sharer_avatar_url: 'https://example.com/avatar.jpg',
  campaign_name: 'Test Campaign',
};

const mockCampaign = {
  id: 'campaign-123',
  name: 'Test Campaign',
  gm_user_id: 'user-456',
  invite_code: 'ABC12345',
  fear_current: 3,
  fear_max: 10,
  settings: {},
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  members: [],
  member_count: 2,
};

// ============================================================================
// TESTS
// ============================================================================

describe('Phase 6: Homebrew Sharing', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset store to initial state with user and campaigns
    useCharacterStore.setState({
      user: { id: 'user-123', email: 'test@test.com', user_metadata: {} } as any,
      character: {
        id: 'char-1',
        user_id: 'user-123',
        name: 'Thorn',
      } as any,
      campaigns: [mockCampaign] as any,
      activeCampaign: null,
      homebrewItems: [mockHomebrewItem],
      sharedWithMe: [],
      sharedByMe: [],
      isLoadingSharing: false,
    });
  });

  // ==========================================================================
  // SHARE HOMEBREW ITEM
  // ==========================================================================

  describe('shareHomebrewItem', () => {
    it('should share a homebrew item with a campaign', async () => {
      mockDataService.sharing.share.mockResolvedValue(mockSharedHomebrew);

      await useCharacterStore.getState().shareHomebrewItem(
        'homebrew-1',
        { campaignId: 'campaign-123' },
        'Check out this cool weapon I made!'
      );

      expect(dataService.sharing.share).toHaveBeenCalledWith(
        'homebrew-1',
        { campaignId: 'campaign-123' },
        'Check out this cool weapon I made!'
      );
      expect(mockToast.success).toHaveBeenCalledWith('Item shared successfully!');
    });

    it('should add shared item to sharedByMe list on success', async () => {
      mockDataService.sharing.share.mockResolvedValue(mockSharedHomebrew);

      await useCharacterStore.getState().shareHomebrewItem(
        'homebrew-1',
        { campaignId: 'campaign-123' }
      );

      const { sharedByMe } = useCharacterStore.getState();
      expect(sharedByMe).toHaveLength(1);
      expect(sharedByMe[0].id).toBe('shared-1');
    });

    it('should handle share errors and show toast', async () => {
      mockDataService.sharing.share.mockRejectedValue(new Error('Share failed'));

      await useCharacterStore.getState().shareHomebrewItem(
        'homebrew-1',
        { campaignId: 'campaign-123' }
      );

      expect(mockToast.error).toHaveBeenCalledWith('Failed to share item');
      expect(useCharacterStore.getState().sharedByMe).toHaveLength(0);
    });

    it('should not share if item does not exist', async () => {
      await useCharacterStore.getState().shareHomebrewItem(
        'nonexistent-item',
        { campaignId: 'campaign-123' }
      );

      expect(dataService.sharing.share).not.toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalledWith('Item not found');
    });

    it('should not share if user is not authenticated', async () => {
      useCharacterStore.setState({ user: null });

      await useCharacterStore.getState().shareHomebrewItem(
        'homebrew-1',
        { campaignId: 'campaign-123' }
      );

      expect(dataService.sharing.share).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // UNSHARE HOMEBREW ITEM
  // ==========================================================================

  describe('unshareHomebrewItem', () => {
    beforeEach(() => {
      useCharacterStore.setState({
        sharedByMe: [mockSharedHomebrew],
      });
    });

    it('should unshare a shared item', async () => {
      mockDataService.sharing.unshare.mockResolvedValue(undefined);

      await useCharacterStore.getState().unshareHomebrewItem('shared-1');

      expect(dataService.sharing.unshare).toHaveBeenCalledWith('shared-1');
      expect(mockToast.success).toHaveBeenCalledWith('Item unshared');
    });

    it('should remove item from sharedByMe list on success', async () => {
      mockDataService.sharing.unshare.mockResolvedValue(undefined);

      await useCharacterStore.getState().unshareHomebrewItem('shared-1');

      expect(useCharacterStore.getState().sharedByMe).toHaveLength(0);
    });

    it('should rollback on unshare failure', async () => {
      mockDataService.sharing.unshare.mockRejectedValue(new Error('Unshare failed'));

      await useCharacterStore.getState().unshareHomebrewItem('shared-1');

      expect(mockToast.error).toHaveBeenCalledWith('Failed to unshare item');
      // Should still have the item after rollback
      expect(useCharacterStore.getState().sharedByMe).toHaveLength(1);
    });
  });

  // ==========================================================================
  // FETCH SHARED WITH ME
  // ==========================================================================

  describe('fetchSharedWithMe', () => {
    it('should fetch items shared with the current user', async () => {
      mockDataService.sharing.listSharedWithMe.mockResolvedValue([mockEnrichedSharedHomebrew]);

      await useCharacterStore.getState().fetchSharedWithMe();

      expect(dataService.sharing.listSharedWithMe).toHaveBeenCalled();
      expect(useCharacterStore.getState().sharedWithMe).toHaveLength(1);
    });

    it('should set loading state during fetch', async () => {
      mockDataService.sharing.listSharedWithMe.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
      );

      const fetchPromise = useCharacterStore.getState().fetchSharedWithMe();
      expect(useCharacterStore.getState().isLoadingSharing).toBe(true);

      await fetchPromise;
      expect(useCharacterStore.getState().isLoadingSharing).toBe(false);
    });

    it('should handle fetch errors gracefully', async () => {
      mockDataService.sharing.listSharedWithMe.mockRejectedValue(new Error('Fetch failed'));

      await useCharacterStore.getState().fetchSharedWithMe();

      expect(useCharacterStore.getState().isLoadingSharing).toBe(false);
      expect(useCharacterStore.getState().sharedWithMe).toEqual([]);
    });
  });

  // ==========================================================================
  // FETCH SHARED BY ME
  // ==========================================================================

  describe('fetchSharedByMe', () => {
    it('should fetch items shared by the current user', async () => {
      mockDataService.sharing.listSharedByMe.mockResolvedValue([mockSharedHomebrew]);

      await useCharacterStore.getState().fetchSharedByMe();

      expect(dataService.sharing.listSharedByMe).toHaveBeenCalled();
      expect(useCharacterStore.getState().sharedByMe).toHaveLength(1);
    });

    it('should handle empty results', async () => {
      mockDataService.sharing.listSharedByMe.mockResolvedValue([]);

      await useCharacterStore.getState().fetchSharedByMe();

      expect(useCharacterStore.getState().sharedByMe).toEqual([]);
    });
  });

  // ==========================================================================
  // FETCH SHARED WITH CAMPAIGN
  // ==========================================================================

  describe('fetchSharedWithCampaign', () => {
    it('should fetch items shared with a specific campaign', async () => {
      mockDataService.sharing.listSharedWithCampaign.mockResolvedValue([mockEnrichedSharedHomebrew]);

      await useCharacterStore.getState().fetchSharedWithCampaign('campaign-123');

      expect(dataService.sharing.listSharedWithCampaign).toHaveBeenCalledWith('campaign-123');
      expect(useCharacterStore.getState().sharedWithMe).toHaveLength(1);
    });
  });

  // ==========================================================================
  // ADD SHARED ITEM TO INVENTORY
  // ==========================================================================

  describe('addSharedToInventory', () => {
    beforeEach(() => {
      useCharacterStore.setState({
        sharedWithMe: [mockEnrichedSharedHomebrew],
      });
    });

    it('should add a shared item to character inventory', async () => {
      const newInventoryItem = {
        id: 'inv-new-1',
        character_id: 'char-1',
        name: 'Dragon Slayer',
        description: 'A legendary sword imbued with dragon-slaying magic',
        location: 'backpack',
        quantity: 1,
      };
      mockDataService.inventory.add.mockResolvedValue(newInventoryItem);

      await useCharacterStore.getState().addSharedToInventory('shared-1');

      expect(dataService.inventory.add).toHaveBeenCalledWith(
        'char-1',
        expect.objectContaining({
          name: 'Dragon Slayer',
          description: 'A legendary sword imbued with dragon-slaying magic',
          location: 'backpack',
        })
      );
      expect(mockToast.success).toHaveBeenCalledWith('Item added to inventory!');
    });

    it('should not add if shared item not found', async () => {
      await useCharacterStore.getState().addSharedToInventory('nonexistent');

      expect(dataService.inventory.add).not.toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalledWith('Shared item not found');
    });

    it('should not add if no character is loaded', async () => {
      useCharacterStore.setState({ character: null });

      await useCharacterStore.getState().addSharedToInventory('shared-1');

      expect(dataService.inventory.add).not.toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalledWith('No character loaded');
    });

    it('should handle add errors gracefully', async () => {
      mockDataService.inventory.add.mockRejectedValue(new Error('Add failed'));

      await useCharacterStore.getState().addSharedToInventory('shared-1');

      expect(mockToast.error).toHaveBeenCalledWith('Failed to add item to inventory');
    });
  });

  // ==========================================================================
  // CLEAR SHARING STATE
  // ==========================================================================

  describe('clearSharingState', () => {
    it('should clear all sharing-related state', () => {
      useCharacterStore.setState({
        sharedWithMe: [mockEnrichedSharedHomebrew],
        sharedByMe: [mockSharedHomebrew],
        isLoadingSharing: true,
      });

      useCharacterStore.getState().clearSharingState();

      const state = useCharacterStore.getState();
      expect(state.sharedWithMe).toEqual([]);
      expect(state.sharedByMe).toEqual([]);
      expect(state.isLoadingSharing).toBe(false);
    });
  });
});
