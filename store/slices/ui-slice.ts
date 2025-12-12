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
  activeTab: 'character',
  isDiceOverlayOpen: false,
  activeRoll: null,
  lastRollResult: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  openDiceOverlay: () => set({ isDiceOverlayOpen: true }),
  closeDiceOverlay: () => set({ isDiceOverlayOpen: false, activeRoll: null }),
  prepareRoll: (label, modifier, dice) => set({ isDiceOverlayOpen: true, activeRoll: { label, modifier, dice } }),
  setLastRollResult: (result) => set({ lastRollResult: result }),
});
