'use client';

/**
 * SETTINGS VIEW
 * ----------------------------------------------------------------------------
 * A dedicated settings view accessible from the More menu. Contains:
 * - Content Access settings (SRD, Playtest, Homebrew campaigns)
 * - Developer Mode toggle for accessing dev tools
 */

import React, { useEffect, useState } from 'react';
import { Settings, Code2 } from 'lucide-react';
import ContentAccessSettings from '@/components/modals/content-access-settings';
import { Switch } from '@/components/ui/switch';
import { useCharacterStore } from '@/store/character-store';
import { VITAL_ICON_OPTIONS, VitalId } from '@/lib/icon-utils';
import clsx from 'clsx';

const DEV_MODE_STORAGE_KEY = 'dh:devMode';
const DEV_MODE_CHANGE_EVENT = 'dh:devModeChange';

export function useDevMode() {
    const [devMode, setDevModeState] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        // Initial load from localStorage
        try {
            const stored = localStorage.getItem(DEV_MODE_STORAGE_KEY);
            setDevModeState(stored === 'true');
        } catch (error) {
            console.warn('Failed to load dev mode setting:', error);
        }
        setLoaded(true);

        // Listen for changes from other components (same tab)
        const handleDevModeChange = (e: Event) => {
            const customEvent = e as CustomEvent<boolean>;
            setDevModeState(customEvent.detail);
        };

        // Listen for changes from other tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === DEV_MODE_STORAGE_KEY) {
                setDevModeState(e.newValue === 'true');
            }
        };

        window.addEventListener(DEV_MODE_CHANGE_EVENT, handleDevModeChange);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener(DEV_MODE_CHANGE_EVENT, handleDevModeChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const setDevMode = (enabled: boolean) => {
        setDevModeState(enabled);
        try {
            localStorage.setItem(DEV_MODE_STORAGE_KEY, String(enabled));
            // Dispatch custom event so other components in the same tab can react
            window.dispatchEvent(new CustomEvent(DEV_MODE_CHANGE_EVENT, { detail: enabled }));
        } catch (error) {
            console.warn('Failed to save dev mode setting:', error);
        }
    };

    return { devMode, setDevMode, loaded };
}

export default function SettingsView() {
    const { devMode, setDevMode, loaded } = useDevMode();

    return (
        <div className="p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-dagger-gold/10">
                    <Settings size={28} className="text-dagger-gold" />
                </div>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-white">Settings</h1>
                    <p className="text-sm text-gray-400">Manage your preferences</p>
                </div>
            </div>

            {/* Content Access Settings */}
            <ContentAccessSettings />

            {/* Icon Preferences */}
            <div className="bg-dagger-panel border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings className="h-5 w-5 text-dagger-gold" />
                        <h2 className="text-lg font-semibold text-white">Icon Preferences</h2>
                    </div>
                    <p className="text-gray-400 text-sm">
                        Customize the icons used for your character vitals.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {Object.entries(VITAL_ICON_OPTIONS).map(([vitalId, options]) => {
                        const currentIconId = useCharacterStore(state => state.vitalIcons[vitalId as VitalId]);
                        const setVitalIcon = useCharacterStore(state => state.setVitalIcon);

                        return (
                            <div key={vitalId} className="space-y-3">
                                <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">
                                    {vitalId.replace(/([A-Z])/g, ' $1').trim()}
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {options.map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => setVitalIcon(vitalId as VitalId, option.id)}
                                            className={clsx(
                                                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                                                currentIconId === option.id
                                                    ? "bg-dagger-gold/20 border-dagger-gold text-white"
                                                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                            )}
                                        >
                                            <div className={clsx(
                                                "p-2 rounded-md",
                                                currentIconId === option.id ? "bg-dagger-gold text-black" : "bg-white/10 text-white"
                                            )}>
                                                <option.icon size={20} />
                                            </div>
                                            <span className="font-medium">{option.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Developer Settings */}
            <div className="bg-dagger-panel border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Code2 className="h-5 w-5 text-purple-400" />
                        <h2 className="text-lg font-semibold text-white">Developer</h2>
                    </div>
                    <p className="text-gray-400 text-sm">
                        Advanced settings for debugging and development.
                    </p>
                </div>

                <div className="p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                            <label htmlFor="dev-mode" className="font-medium text-white">
                                Developer Mode
                            </label>
                            <p className="text-gray-400 text-sm">
                                Enable Dev Tools in the More menu to inspect modifiers and debug character data.
                            </p>
                        </div>
                        <Switch
                            id="dev-mode"
                            checked={devMode}
                            onCheckedChange={setDevMode}
                            disabled={!loaded}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
