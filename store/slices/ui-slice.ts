/**
 * UI Slice
 * ----------------------------------------------------------------------------
 * This slice manages the transient user interface state for the application.
 * It controls global UI elements such as the dice roller overlay, the active
 * navigation tab (Character, Playmat, Inventory, Combat, Downtime, Journal, Settings),
 * the "More" menu drawer, and displays results from dice rolls. This isolates
 * purely presentational state from the persistent game data, keeping the store
 * organization clean.
 */

import { StateCreator } from 'zustand';
import { RollResult } from '@/types/character';
import { CharacterStore } from '@/types/store';

// Tab type definition - extended with new views
export type TabId = 'character' | 'combat' | 'playmat' | 'inventory' | 'downtime' | 'journal' | 'settings' | 'profile' | 'dev';

// Valid tab values for validation
const VALID_TABS: TabId[] = ['character', 'combat', 'playmat', 'inventory', 'downtime', 'journal', 'settings', 'profile', 'dev'];

// localStorage key for persisting active tab
const ACTIVE_TAB_STORAGE_KEY = 'dh:activeTab';

// Note: We always use 'character' as the initial tab to avoid hydration mismatch.
// The useTabPersistence hook handles restoring the user's last tab from localStorage
// after hydration is complete.
const DEFAULT_TAB: TabId = 'character';

// Helper to get valid tabs for use in hooks
export const getValidTabs = () => VALID_TABS;
export const getActiveTabStorageKey = () => ACTIVE_TAB_STORAGE_KEY;

export interface UiSlice {
  activeTab: TabId;
  isDiceOverlayOpen: boolean;
  isMoreMenuOpen: boolean;
  activeRoll: { label: string; modifier: number; dice?: string; diceColor?: string } | null;
  lastRollResult: RollResult | null;

  setActiveTab: (tab: TabId) => void;
  openDiceOverlay: () => void;
  closeDiceOverlay: () => void;
  openMoreMenu: () => void;
  closeMoreMenu: () => void;
  prepareRoll: (label: string, modifier: number, dice?: string, diceColor?: string) => void;
  setLastRollResult: (result: RollResult | null) => void;
}

export const createUiSlice: StateCreator<CharacterStore, [], [], UiSlice> = (set) => ({
  activeTab: DEFAULT_TAB,
  isDiceOverlayOpen: false,
  isMoreMenuOpen: false,
  activeRoll: null,
  lastRollResult: null,

  setActiveTab: (tab) => {
    set({ activeTab: tab, isMoreMenuOpen: false });
    // Persist to localStorage
    try {
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
    } catch (error) {
      console.warn('Failed to persist active tab to localStorage:', error);
    }
  },
  openDiceOverlay: () => set({ isDiceOverlayOpen: true }),
  closeDiceOverlay: () => set({ isDiceOverlayOpen: false, activeRoll: null }),
  openMoreMenu: () => set({ isMoreMenuOpen: true }),
  closeMoreMenu: () => set({ isMoreMenuOpen: false }),
  prepareRoll: (label, modifier, dice, diceColor) => set({ isDiceOverlayOpen: true, activeRoll: { label, modifier, dice, diceColor } }),
  setLastRollResult: (result) => set({ lastRollResult: result }),
});
