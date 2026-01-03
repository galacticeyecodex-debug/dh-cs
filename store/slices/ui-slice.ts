/**
 * UI Slice
 * ----------------------------------------------------------------------------
 * This slice manages the transient user interface state for the application.
 * It controls global UI elements such as the dice roller overlay, the active
 * navigation tab (Character, Playmat, Inventory, Combat), and displays results
 * from dice rolls. This isolates purely presentational state from the persistent
 * game data, keeping the store organization clean.
 */

import { StateCreator } from 'zustand';
import { RollResult } from '@/types/character';
import { CharacterStore } from '@/types/store';

// localStorage key for persisting active tab
const ACTIVE_TAB_STORAGE_KEY = 'dh:activeTab';

// Helper to get persisted tab or default
const getInitialActiveTab = (): 'character' | 'playmat' | 'inventory' | 'combat' => {
  if (typeof window === 'undefined') return 'character';

  try {
    const stored = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    if (stored && ['character', 'playmat', 'inventory', 'combat'].includes(stored)) {
      return stored as 'character' | 'playmat' | 'inventory' | 'combat';
    }
  } catch (error) {
    console.warn('Failed to load active tab from localStorage:', error);
  }

  return 'character';
};

export interface UiSlice {
  activeTab: 'character' | 'playmat' | 'inventory' | 'combat';
  isDiceOverlayOpen: boolean;
  activeRoll: { label: string; modifier: number; dice?: string } | null;
  lastRollResult: RollResult | null;

  setActiveTab: (tab: 'character' | 'playmat' | 'inventory' | 'combat') => void;
  openDiceOverlay: () => void;
  closeDiceOverlay: () => void;
  prepareRoll: (label: string, modifier: number, dice?: string) => void;
  setLastRollResult: (result: RollResult | null) => void;
}

export const createUiSlice: StateCreator<CharacterStore, [], [], UiSlice> = (set) => ({
  activeTab: getInitialActiveTab(),
  isDiceOverlayOpen: false,
  activeRoll: null,
  lastRollResult: null,

  setActiveTab: (tab) => {
    set({ activeTab: tab });
    // Persist to localStorage
    try {
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
    } catch (error) {
      console.warn('Failed to persist active tab to localStorage:', error);
    }
  },
  openDiceOverlay: () => set({ isDiceOverlayOpen: true }),
  closeDiceOverlay: () => set({ isDiceOverlayOpen: false, activeRoll: null }),
  prepareRoll: (label, modifier, dice) => set({ isDiceOverlayOpen: true, activeRoll: { label, modifier, dice } }),
  setLastRollResult: (result) => set({ lastRollResult: result }),
});
