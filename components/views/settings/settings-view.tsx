'use client';

/**
 * SETTINGS VIEW
 * ----------------------------------------------------------------------------
 * A dedicated settings view accessible from the More menu. Contains:
 * - Content Access settings (SRD, Playtest, Homebrew campaigns)
 * - Future settings sections can be added here
 */

import React from 'react';
import { Settings } from 'lucide-react';
import ContentAccessSettings from '@/components/modals/content-access-settings';

export default function SettingsView() {
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

            {/* Future settings sections can be added here */}
        </div>
    );
}
