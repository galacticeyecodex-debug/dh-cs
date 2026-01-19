/**
 * SETTINGS PAGE
 * ----------------------------------------------------------------------------
 * Standalone settings page accessible without selecting a character.
 * Provides content access and developer settings.
 *
 * DESIGN:
 * - Uses the same header pattern as the character selection page
 * - Provides access to Profile/Settings/Sign Out via UserMenu
 * - Includes content access settings and developer mode toggle
 */

'use client';

import { useRouter } from 'next/navigation';
import { Settings, Code2, ArrowLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import ContentAccessSettings from '@/components/modals/content-access-settings';
import UserMenu from '@/components/core/user-menu';
import { useDevMode } from '@/components/views/settings/settings-view';
import useUser from '@/hooks/useUser';

export default function SettingsPage() {
    const { user } = useUser();
    const router = useRouter();
    const { devMode, setDevMode, loaded } = useDevMode();

    if (!user) return null;

    return (
        <div className="flex flex-col h-[100dvh] bg-dagger-dark text-white overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-dagger-panel">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-lg font-serif font-bold text-dagger-gold hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Back</span>
                </button>
                <UserMenu />
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto p-4 space-y-6">
                    {/* Page Header */}
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
            </main>
        </div>
    );
}
