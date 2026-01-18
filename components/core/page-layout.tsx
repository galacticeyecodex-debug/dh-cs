'use client';

/**
 * PAGE LAYOUT COMPONENT
 * ----------------------------------------------------------------------------
 * A shared layout wrapper for standalone pages (campaigns, settings, etc.)
 * that are outside the main character sheet flow.
 * 
 * Provides:
 * - Consistent header with context switcher (Characters/Campaigns)
 * - Optional breadcrumb navigation
 * - Standardized styling matching the app's design system
 * 
 * The header now includes a context menu that allows switching between:
 * - Characters: Navigate to character list
 * - Campaigns: Navigate to campaign list or show current campaign
 */

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronRight, ChevronDown, Sword, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCharacterStore } from '@/store/character-store';
import UserMenu from './user-menu';
import clsx from 'clsx';

interface Breadcrumb {
    label: string;
    href?: string;
}

interface PageLayoutProps {
    /** Page title displayed in the header */
    title: string;
    /** Optional breadcrumb trail for navigation context */
    breadcrumbs?: Breadcrumb[];
    /** Optional back button destination (shows back arrow if provided) */
    backHref?: string;
    /** Optional back button label */
    backLabel?: string;
    /** Optional header actions (buttons, etc.) to show on the right */
    headerActions?: React.ReactNode;
    /** Main page content */
    children: React.ReactNode;
    /** Optional class name for the main content area */
    className?: string;
    /** Whether to show the context switcher menu (default: true) */
    showContextSwitcher?: boolean;
}

export default function PageLayout({
    title,
    breadcrumbs,
    backHref,
    backLabel = 'Back',
    headerActions,
    children,
    className = '',
    showContextSwitcher = true,
}: PageLayoutProps) {
    const router = useRouter();
    const { character, campaigns, activeCampaign } = useCharacterStore();
    const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
                setIsContextMenuOpen(false);
            }
        };

        if (isContextMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isContextMenuOpen]);

    // Close menu on escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsContextMenuOpen(false);
            }
        };

        if (isContextMenuOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isContextMenuOpen]);

    const handleNavigateTo = (path: string) => {
        setIsContextMenuOpen(false);
        router.push(path);
    };

    return (
        <div className="flex flex-col min-h-screen bg-dagger-dark text-white">
            {/* Header */}
            <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-dagger-panel backdrop-blur-lg">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Back button */}
                    {backHref && (
                        <button
                            onClick={() => router.push(backHref)}
                            className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors shrink-0"
                            aria-label={backLabel}
                        >
                            <ArrowLeft size={20} />
                            <span className="text-sm font-medium hidden sm:inline">{backLabel}</span>
                        </button>
                    )}

                    {/* Breadcrumbs */}
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <nav className="hidden md:flex items-center gap-1 text-sm text-gray-400">
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={index}>
                                    {index > 0 && <ChevronRight size={14} className="text-gray-600" />}
                                    {crumb.href ? (
                                        <button
                                            onClick={() => router.push(crumb.href!)}
                                            className="hover:text-white transition-colors"
                                        >
                                            {crumb.label}
                                        </button>
                                    ) : (
                                        <span className="text-gray-500">{crumb.label}</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </nav>
                    )}

                    {/* Title with optional context switcher */}
                    {showContextSwitcher ? (
                        <div className="relative" ref={contextMenuRef}>
                            <button
                                onClick={() => setIsContextMenuOpen(!isContextMenuOpen)}
                                className={clsx(
                                    'flex items-center gap-2 text-lg font-serif font-bold transition-colors',
                                    isContextMenuOpen ? 'text-white' : 'text-dagger-gold hover:text-white'
                                )}
                                aria-label="Context menu"
                                aria-expanded={isContextMenuOpen}
                                aria-haspopup="true"
                            >
                                <span className="truncate">{title}</span>
                                <ChevronDown
                                    size={18}
                                    className={clsx(
                                        'text-gray-400 transition-transform duration-200 flex-shrink-0',
                                        isContextMenuOpen && 'rotate-180'
                                    )}
                                />
                            </button>

                            {/* Context Dropdown Menu */}
                            {isContextMenuOpen && (
                                <div
                                    className="absolute left-0 top-full mt-2 w-64 bg-dagger-panel border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                                    role="menu"
                                    aria-orientation="vertical"
                                >
                                    {/* Characters Section */}
                                    <div className="py-1">
                                        <button
                                            onClick={() => handleNavigateTo('/client/characters')}
                                            className="w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-3 transition-colors"
                                            role="menuitem"
                                        >
                                            <div className="p-1.5 rounded-lg bg-dagger-gold/20">
                                                <Sword size={16} className="text-dagger-gold" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white">Characters</p>
                                                {character ? (
                                                    <p className="text-xs text-gray-400 truncate">Currently: {character.name}</p>
                                                ) : (
                                                    <p className="text-xs text-gray-500">Select a character</p>
                                                )}
                                            </div>
                                        </button>
                                    </div>

                                    <div className="border-t border-white/10" />

                                    {/* Campaigns Section */}
                                    <div className="py-1">
                                        <button
                                            onClick={() => handleNavigateTo('/campaigns')}
                                            className="w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-3 transition-colors"
                                            role="menuitem"
                                        >
                                            <div className="p-1.5 rounded-lg bg-blue-500/20">
                                                <Users size={16} className="text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white">Campaigns</p>
                                                {activeCampaign ? (
                                                    <p className="text-xs text-gray-400 truncate">Currently: {activeCampaign.name}</p>
                                                ) : campaigns && campaigns.length > 0 ? (
                                                    <p className="text-xs text-gray-500">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
                                                ) : (
                                                    <p className="text-xs text-gray-500">No campaigns yet</p>
                                                )}
                                            </div>
                                        </button>

                                        {/* Quick campaign list (if campaigns exist) */}
                                        {campaigns && campaigns.length > 0 && (
                                            <div className="px-2 pb-2">
                                                <div className="border-t border-white/5 pt-2 mt-1">
                                                    {campaigns.slice(0, 3).map((campaign: { id: string; name: string }) => (
                                                        <button
                                                            key={campaign.id}
                                                            onClick={() => handleNavigateTo(`/campaign/${campaign.id}`)}
                                                            className={clsx(
                                                                'w-full px-3 py-2 text-left text-xs rounded-lg flex items-center gap-2 transition-colors',
                                                                activeCampaign?.id === campaign.id
                                                                    ? 'bg-blue-500/20 text-blue-300'
                                                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                            )}
                                                        >
                                                            <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                                                            <span className="truncate">{campaign.name}</span>
                                                        </button>
                                                    ))}
                                                    {campaigns.length > 3 && (
                                                        <p className="text-[10px] text-gray-600 text-center mt-1">
                                                            +{campaigns.length - 3} more
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <h1 className="text-lg font-serif font-bold text-dagger-gold truncate">
                            {title}
                        </h1>
                    )}
                </div>

                {/* Right side: actions + user menu */}
                <div className="flex items-center gap-2 shrink-0">
                    {headerActions}
                    <UserMenu />
                </div>
            </header>

            {/* Main Content */}
            <main className={`flex-1 overflow-y-auto ${className}`}>
                {children}
            </main>
        </div>
    );
}
