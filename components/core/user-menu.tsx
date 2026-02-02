'use client';

/**
 * USER MENU COMPONENT
 * ----------------------------------------------------------------------------
 * A dropdown menu component that provides access to user-level actions:
 * - Profile (account info, friends)
 * - Settings (content access, dev mode)
 * - Sign Out
 * 
 * This component is designed to be used in the header across all pages,
 * ensuring user-level actions are always accessible regardless of whether
 * a character is selected.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppIcons } from '@/lib/icon-utils';
import useUser from '@/hooks/useUser';
import HeaderMenuButton from './header-menu-button';
import clsx from 'clsx';

interface UserMenuProps {
    /** Optional: Navigate to a tab within the app (for use in MobileLayout) */
    onNavigateToTab?: (tab: 'profile' | 'settings') => void;
}

export default function UserMenu({ onNavigateToTab }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { user, signOut } = useUser();

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Close menu on escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen]);

    const handleSignOut = async () => {
        setIsOpen(false);
        await signOut();
        router.push('/auth/login');
        router.refresh();
    };

    const handleNavigate = (tab: 'profile' | 'settings') => {
        setIsOpen(false);
        if (onNavigateToTab) {
            // In-app navigation (within MobileLayout)
            onNavigateToTab(tab);
        } else {
            // Page navigation (from character selection or other pages)
            router.push(`/${tab}`);
        }
    };

    const handleNavigateTo = (path: string) => {
        setIsOpen(false);
        router.push(path);
    };

    if (!user) return null;

    const userInitial = user.email ? user.email[0].toUpperCase() : 'U';
    const fullName = user.user_metadata?.full_name || 'User';
    const avatarUrl = user.user_metadata?.avatar_url;

    return (
        <div className="relative shrink-0" ref={menuRef}>
            {/* Trigger Button */}
            <HeaderMenuButton
                isOpen={isOpen}
                onClick={() => setIsOpen(!isOpen)}
                avatarUrl={avatarUrl}
                avatarAlt={fullName}
                avatarFallback={userInitial}
                label=""
                ariaLabel="User menu"
                labelClassName="hidden"
            />

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-2 w-56 bg-dagger-panel border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                    role="menu"
                    aria-orientation="vertical"
                >
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-medium text-white truncate">{fullName}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>

                    {/* Content Navigation */}
                    <div className="py-1">
                        <button
                            onClick={() => handleNavigateTo('/client/characters')}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-3 transition-colors"
                            role="menuitem"
                        >
                            <AppIcons.combat.attack size={16} className="text-dagger-gold" />
                            Characters
                        </button>
                        <button
                            onClick={() => handleNavigateTo('/campaigns')}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-3 transition-colors"
                            role="menuitem"
                        >
                            <AppIcons.campaign.party size={16} className="text-dagger-gold" />
                            Campaigns
                        </button>
                    </div>

                    {/* Account */}
                    <div className="border-t border-white/10 py-1">
                        <button
                            onClick={() => handleNavigate('profile')}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-3 transition-colors"
                            role="menuitem"
                        >
                            <AppIcons.campaign.player size={16} className="text-dagger-gold" />
                            Profile
                        </button>
                        <button
                            onClick={() => handleNavigate('settings')}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-3 transition-colors"
                            role="menuitem"
                        >
                            <AppIcons.ui.settings size={16} className="text-dagger-gold" />
                            Settings
                        </button>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-white/10 py-1">
                        <button
                            onClick={handleSignOut}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 flex items-center gap-3 transition-colors"
                            role="menuitem"
                        >
                            <AppIcons.campaign.leave size={16} />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
