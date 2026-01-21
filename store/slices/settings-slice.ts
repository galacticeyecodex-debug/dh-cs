/**
 * SETTINGS SLICE
 * ----------------------------------------------------------------------------
 * This slice manages user-specific application preferences and settings.
 * It currently handles customization of vital track icons (HP, Stress, Hope, etc.).
 * Preferences are persisted to localStorage.
 */

import { StateCreator } from 'zustand';
import { CharacterStore } from '@/types/store';
import { VitalId } from '@/lib/icon-utils';

export interface SettingsSlice {
    vitalIcons: Record<VitalId, string>;
    setVitalIcon: (vital: VitalId, icon: string) => void;
}

const SETTINGS_STORAGE_KEY = 'dh:settings';

const DEFAULT_ICONS: Record<VitalId, string> = {
    hitPoints: 'Heart',
    stress: 'Zap',
    hope: 'Sparkles',
    armor: 'Shield',
    evasion: 'Eye',
    fear: 'Skull',
};

// Helper to load persisted settings
const loadSettings = () => {
    if (typeof window === 'undefined') return { vitalIcons: DEFAULT_ICONS };
    try {
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!stored) return { vitalIcons: DEFAULT_ICONS };
        const parsed = JSON.parse(stored);
        return {
            vitalIcons: { ...DEFAULT_ICONS, ...parsed.vitalIcons }
        };
    } catch (error) {
        console.warn('Failed to load settings from localStorage:', error);
        return { vitalIcons: DEFAULT_ICONS };
    }
};

export const createSettingsSlice: StateCreator<CharacterStore, [], [], SettingsSlice> = (set) => {
    const initialState = loadSettings();

    return {
        ...initialState,

        setVitalIcon: (vital, icon) => {
            set((state) => {
                const newIcons = { ...state.vitalIcons, [vital]: icon };
                // Persist to localStorage
                try {
                    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ vitalIcons: newIcons }));
                } catch (error) {
                    console.warn('Failed to persist settings to localStorage:', error);
                }
                return { vitalIcons: newIcons };
            });
        },
    };
};
