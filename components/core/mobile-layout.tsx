'use client';

/**
 * MOBILE LAYOUT COMPONENT
 * ----------------------------------------------------------------------------
 * This component serves as the primary layout wrapper for the mobile-first
 * character sheet interface. It structures the application into three key zones:
 * 1. A top header displaying the character's name and providing context switching.
 * 2. A central scrollable content area where specific views are rendered.
 * 3. A persistent bottom navigation bar with primary views + "More" menu access.
 * 
 * The header now includes a context menu that allows switching between:
 * - Characters: Shows character name, click to switch characters
 * - Campaigns: Shows campaign list access
 * 
 * Additionally, it integrates a Floating Action Button (FAB) for quick access to 
 * the Dice Roller overlay, ensuring dice mechanics are always accessible regardless of the current view.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { AppIcons } from '@/lib/icon-utils';
import DiceOverlay from '../dice/dice-overlay';
import MoreMenu from './more-menu';
import UserMenu from './user-menu';
import MiniVitalsBanner from '../vitals/mini-vitals-banner';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useTabPersistence } from '@/hooks/useTabPersistence';

// Fix for no-explicit-any on NavButton props
interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType; // Use React.ElementType for icon component
  label: string;
}

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const { activeTab, setActiveTab, openDiceOverlay, openMoreMenu, isMoreMenuOpen, character, campaigns, activeCampaign } = useCharacterStore();
  const router = useRouter();
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Restore user's last tab from localStorage after hydration (prevents hydration mismatch)
  useTabPersistence();

  // Handle navigation from UserMenu dropdown
  const handleUserMenuNavigate = (tab: 'profile' | 'settings') => {
    setActiveTab(tab);
  };

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

  // Check if current tab is in the "More" menu (for highlighting More button)
  const isMoreTabActive = ['inventory', 'downtime', 'journal', 'dev'].includes(activeTab);

  // Determine header display based on context
  const headerTitle = character?.name || 'Daggerheart';
  const headerIcon = character ? AppIcons.combat.weapon : AppIcons.combat.weapon;

  return (
    <div className="flex flex-col h-[100dvh] bg-dagger-dark text-white overflow-hidden">
      {/* Header with context switcher */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-dagger-panel">
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
            <AppIcons.combat.weapon size={20} aria-hidden="true" />
            <span>{headerTitle}</span>
            <AppIcons.ui.expand
              size={18}
              className={clsx(
                'text-gray-400 transition-transform duration-200',
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
                    <AppIcons.combat.weapon size={16} className="text-dagger-gold" />
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
                    <AppIcons.campaign.party size={16} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">Campaigns</p>
                    {activeCampaign ? (
                      <p className="text-xs text-gray-400 truncate">Currently: {activeCampaign.name}</p>
                    ) : campaigns && campaigns.length > 0 ? (
                      <p className="text-xs text-gray-500">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
                    ) : (<p className="text-xs text-gray-500">No campaigns yet</p>
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

        <UserMenu onNavigateToTab={handleUserMenuNavigate} />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto scrollbar-hide pb-24">
        {children}
      </main>

      {/* Floating Action Button (FAB) - Dice */}
      <button
        onClick={openDiceOverlay}
        aria-label="Roll Dice"
        className="fixed bottom-30 right-6 bg-dagger-gold/50 text-black p-4 rounded-full shadow-lg shadow-dagger-gold/20 hover:scale-105 transition-transform z-40"
      >
        <AppIcons.combat.roll size={28} />
      </button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-dagger-panel border-t border-white/10 pb-safe pt-2 px-6 z-40 backdrop-blur-lg">
        <div className="flex justify-between items-center h-16">
          <NavButton
            active={activeTab === 'character'}
            onClick={() => setActiveTab('character')}
            icon={AppIcons.campaign.player}
            label="Character"
          />
          <NavButton
            active={activeTab === 'combat'}
            onClick={() => setActiveTab('combat')}
            icon={AppIcons.combat.attack} // Swords
            label="Combat"
          />
          <NavButton
            active={activeTab === 'playmat'}
            onClick={() => setActiveTab('playmat')}
            icon={AppIcons.ui.playmat}
            label="Playmat"
          />
          <NavButton
            active={isMoreTabActive || isMoreMenuOpen}
            onClick={openMoreMenu}
            icon={AppIcons.ui.more}
            label="More"
          />
        </div>
      </nav>

      {/* Mini Vitals Banner */}
      <MiniVitalsBanner />

      {/* Dice Overlay Portal */}
      <DiceOverlay />

      {/* More Menu Drawer */}
      <MoreMenu />
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: NavButtonProps) { // Use defined props interface
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col items-center gap-1 transition-colors w-16",
        active ? "text-dagger-gold" : "text-gray-500 hover:text-gray-300"
      )}
    >
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}