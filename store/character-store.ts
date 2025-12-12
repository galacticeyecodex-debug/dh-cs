/**
 * CHARACTER STORE (Zustand)
 * ----------------------------------------------------------------------------
 * This is the central state management store for a single character session.
 * 
 * Refactored into slices for better maintainability (Issue #12).
 */

import { create } from 'zustand';
import { createAuthSlice, AuthSlice } from './slices/auth-slice';
import { createCharacterSlice, CharacterSlice } from './slices/character-slice';
import { createVitalsSlice, VitalsSlice } from './slices/vitals-slice';
import { createInventorySlice, InventorySlice } from './slices/inventory-slice';
import { createUiSlice, UiSlice } from './slices/ui-slice';
import { createHomebrewSlice, HomebrewSlice } from './slices/homebrew-slice';
import { createLevelingSlice, LevelingSlice } from './slices/leveling-slice';
import { CharacterStore } from '@/types/store';

// Re-export types for backward compatibility
export * from '@/types/character';

export const useCharacterStore = create<CharacterStore>()((...a) => ({
  ...createAuthSlice(...a),
  ...createCharacterSlice(...a),
  ...createVitalsSlice(...a),
  ...createInventorySlice(...a),
  ...createUiSlice(...a),
  ...createHomebrewSlice(...a),
  ...createLevelingSlice(...a),
}));
