import { AuthSlice } from '@/store/slices/auth-slice';
import { CharacterSlice } from '@/store/slices/character-slice';
import { VitalsSlice } from '@/store/slices/vitals-slice';
import { InventorySlice } from '@/store/slices/inventory-slice';
import { UiSlice } from '@/store/slices/ui-slice';
import { HomebrewSlice } from '@/store/slices/homebrew-slice';
import { LevelingSlice } from '@/store/slices/leveling-slice';

export type CharacterStore = AuthSlice & CharacterSlice & VitalsSlice & InventorySlice & UiSlice & HomebrewSlice & LevelingSlice;
