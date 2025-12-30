/**
 * Store Type Definition
 * ----------------------------------------------------------------------------
 * This file aggregates the various Zustand store slices into a single, unified
 * `CharacterStore` type. By intersecting the interfaces of all individual slices
 * (Auth, Character, Vitals, Inventory, UI, Homebrew, Leveling), it provides a
 * complete type signature for the global application state, resolving circular
 * dependencies that would arise from direct imports in the slice files.
 */

import { AuthSlice } from '@/store/slices/auth-slice';
import { CharacterSlice } from '@/store/slices/character-slice';
import { VitalsSlice } from '@/store/slices/vitals-slice';
import { InventorySlice } from '@/store/slices/inventory-slice';
import { UiSlice } from '@/store/slices/ui-slice';
import { HomebrewSlice } from '@/store/slices/homebrew-slice';
import { LevelingSlice } from '@/store/slices/leveling-slice';
import { CardStateSlice } from '@/store/slices/card-state-slice';

export type CharacterStore = AuthSlice & CharacterSlice & VitalsSlice & InventorySlice & UiSlice & HomebrewSlice & LevelingSlice & CardStateSlice;
