'use client';

/**
 * MOBILE LAYOUT COMPONENT
 * ----------------------------------------------------------------------------
 * This component serves as the primary layout wrapper for the mobile-first
 * character sheet interface. It structures the application into three key zones:
 * 1. A top header displaying the character's name and providing authentication controls (Sign Out).
 * 2. A central scrollable content area where specific views are rendered.
 * 3. A persistent bottom navigation bar with primary views + "More" menu access.
 * 
 * The "More" menu provides access to secondary views (Inventory, Downtime, Journal)
 * without overcrowding the bottom navigation.
 * 
 * Additionally, it integrates a Floating Action Button (FAB) for quick access to 
 * the Dice Roller overlay, ensuring dice mechanics are always accessible regardless of the current view.
 */

import React from 'react';
import { useCharacterStore } from '@/store/character-store';
import { User, Layers, Dices, Swords, LogOut, ChevronDown, MoreHorizontal } from 'lucide-react';
import DiceOverlay from '../dice/dice-overlay';
import MoreMenu from './more-menu';
import MiniVitalsBanner from '../vitals/mini-vitals-banner';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import useUser from '@/hooks/useUser';
import { useTabPersistence } from '@/hooks/useTabPersistence';

// Fix for no-explicit-any on NavButton props
interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType; // Use React.ElementType for icon component
  label: string;
}

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const { activeTab, setActiveTab, openDiceOverlay, openMoreMenu, isMoreMenuOpen, character } = useCharacterStore();
  const router = useRouter();
  const { signOut } = useUser();

  // Restore user's last tab from localStorage after hydration (prevents hydration mismatch)
  useTabPersistence();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
    router.refresh();
  };

  // Check if current tab is in the "More" menu (for highlighting More button)
  const isMoreTabActive = ['inventory', 'downtime', 'journal', 'settings'].includes(activeTab);

  return (
    <div className="flex flex-col h-[100dvh] bg-dagger-dark text-white overflow-hidden">
      {/* Header with character name and sign out */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-dagger-panel">
        <button
          onClick={() => router.push('/client/characters')}
          className="flex items-center gap-2 text-lg font-serif font-bold text-dagger-gold hover:text-white transition-colors"
        >
          <h1>{character?.name || 'Daggerheart'}</h1>
          <ChevronDown size={20} />
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          title="Sign Out"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto scrollbar-hide pb-24">
        {children}
      </main>

      {/* Floating Action Button (FAB) - Dice */}
      <button
        onClick={openDiceOverlay}
        className="fixed bottom-24 right-6 bg-dagger-gold/50 text-black p-4 rounded-full shadow-lg shadow-dagger-gold/20 hover:scale-105 transition-transform z-40"
      >
        <Dices size={28} />
      </button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-dagger-panel border-t border-white/10 pb-safe pt-2 px-6 z-40 backdrop-blur-lg">
        <div className="flex justify-between items-center h-16">
          <NavButton
            active={activeTab === 'character'}
            onClick={() => setActiveTab('character')}
            icon={User}
            label="Character"
          />
          <NavButton
            active={activeTab === 'combat'}
            onClick={() => setActiveTab('combat')}
            icon={Swords}
            label="Combat"
          />
          <NavButton
            active={activeTab === 'playmat'}
            onClick={() => setActiveTab('playmat')}
            icon={Layers}
            label="Playmat"
          />
          <NavButton
            active={isMoreTabActive || isMoreMenuOpen}
            onClick={openMoreMenu}
            icon={MoreHorizontal}
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