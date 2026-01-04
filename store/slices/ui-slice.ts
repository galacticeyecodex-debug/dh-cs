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
export type TabId = 'character' | 'combat' | 'playmat' | 'inventory' | 'downtime' | 'journal' | 'settings';

// Valid tab values for validation
const VALID_TABS: TabId[] = ['character', 'combat', 'playmat', 'inventory', 'downtime', 'journal', 'settings'];

// localStorage key for persisting active tab
const ACTIVE_TAB_STORAGE_KEY = 'dh:activeTab';

// Helper to get persisted tab or default
const getInitialActiveTab = (): TabId => {
  if (typeof window === 'undefined') return 'character';

  try {
    const stored = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    if (stored && VALID_TABS.includes(stored as TabId)) {
      return stored as TabId;
    }
  } catch (error) {
    console.warn('Failed to load active tab from localStorage:', error);
  }

  return 'character';
};

export interface UiSlice {
  activeTab: TabId;
  isDiceOverlayOpen: boolean;
  isMoreMenuOpen: boolean;
  activeRoll: { label: string; modifier: number; dice?: string } | null;
  lastRollResult: RollResult | null;

  setActiveTab: (tab: TabId) => void;
  openDiceOverlay: () => void;
  closeDiceOverlay: () => void;
  openMoreMenu: () => void;
  closeMoreMenu: () => void;
  prepareRoll: (label: string, modifier: number, dice?: string) => void;
  setLastRollResult: (result: RollResult | null) => void;
}

export const createUiSlice: StateCreator<CharacterStore, [], [], UiSlice> = (set) => ({
  activeTab: getInitialActiveTab(),
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
  prepareRoll: (label, modifier, dice) => set({ isDiceOverlayOpen: true, activeRoll: { label, modifier, dice } }),
  setLastRollResult: (result) => set({ lastRollResult: result }),
});
