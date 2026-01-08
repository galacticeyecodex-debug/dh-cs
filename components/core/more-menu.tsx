'use client';

/**
 * MORE MENU COMPONENT
 * ----------------------------------------------------------------------------
 * A slide-up drawer component that provides access to secondary navigation
 * items. This allows the main bottom navigation to stay focused on primary
 * views (Character, Combat, Playmat) while providing easy access to:
 * - Inventory
 * - Downtime (rest & projects)
 * - Journal (relationships & reputation)
 * - Settings (preferences & content access)
 * - Dev Tools (only when developer mode is enabled)
 * 
 * The drawer uses a backdrop overlay and slides up from the bottom of the
 * screen, following mobile-first design patterns.
 */

import React, { useMemo } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { Backpack, Moon, BookOpen, Settings, X, Sliders } from 'lucide-react';
import clsx from 'clsx';
import type { TabId } from '@/store/slices/ui-slice';
import { useDevMode } from '@/components/views/settings/settings-view';

interface MoreMenuItem {
    id: TabId;
    label: string;
    icon: React.ElementType;
    description: string;
}

const baseMenuItems: MoreMenuItem[] = [
    {
        id: 'inventory',
        label: 'Inventory',
        icon: Backpack,
        description: 'Equipment and items',
    },
    {
        id: 'downtime',
        label: 'Downtime',
        icon: Moon,
        description: 'Rest and projects',
    },
    {
        id: 'journal',
        label: 'Journal',
        icon: BookOpen,
        description: 'Relationships & Reputation',
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        description: 'Preferences & Content Access',
    },
];

const devMenuItem: MoreMenuItem = {
    id: 'dev',
    label: 'Modifiers',
    icon: Sliders,
    description: 'View all active modifiers',
};

export default function MoreMenu() {
    const { isMoreMenuOpen, closeMoreMenu, setActiveTab } = useCharacterStore();
    const { devMode } = useDevMode();

    const menuItems = useMemo(() => {
        if (devMode) {
            return [...baseMenuItems, devMenuItem];
        }
        return baseMenuItems;
    }, [devMode]);

    const handleItemClick = (tabId: TabId) => {
        setActiveTab(tabId);
        // closeMoreMenu is called automatically by setActiveTab
    };

    if (!isMoreMenuOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
                onClick={closeMoreMenu}
                aria-hidden="true"
            />

            {/* Drawer */}
            <div
                className={clsx(
                    'fixed bottom-0 left-0 right-0 z-50',
                    'bg-dagger-panel border-t border-white/10',
                    'rounded-t-2xl shadow-2xl shadow-black/50',
                    'animate-slide-up'
                )}
                role="dialog"
                aria-modal="true"
                aria-label="More menu"
            >
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1 bg-white/20 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
                    <h2 className="text-lg font-serif font-bold text-dagger-gold">More</h2>
                    <button
                        onClick={closeMoreMenu}
                        className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Menu Items */}
                <nav className="px-4 py-4 space-y-2 pb-safe">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleItemClick(item.id)}
                            className={clsx(
                                'w-full flex items-center gap-4 p-4 rounded-xl',
                                'bg-white/5 hover:bg-white/10 transition-colors',
                                'text-left group'
                            )}
                        >
                            <div className="p-3 rounded-xl bg-dagger-gold/10 text-dagger-gold group-hover:bg-dagger-gold/20 transition-colors">
                                <item.icon size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-white">{item.label}</div>
                                <div className="text-sm text-gray-400">{item.description}</div>
                            </div>
                        </button>
                    ))}
                </nav>
            </div>
        </>
    );
}
