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

const DEV_MODE_STORAGE_KEY = 'dh:devMode';

export function useDevMode() {
    const [devMode, setDevModeState] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(DEV_MODE_STORAGE_KEY);
            setDevModeState(stored === 'true');
        } catch (error) {
            console.warn('Failed to load dev mode setting:', error);
        }
        setLoaded(true);
    }, []);

    const setDevMode = (enabled: boolean) => {
        setDevModeState(enabled);
        try {
            localStorage.setItem(DEV_MODE_STORAGE_KEY, String(enabled));
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
