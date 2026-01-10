/**
 * Tests for MobileLayout Component
 * 
 * The MobileLayout component is the primary layout wrapper for the mobile-first
 * character sheet interface. These tests verify:
 * - Header rendering with character name
 * - Bottom navigation functionality
 * - Dice FAB button presence
 * - Sign out button behavior
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileLayout from '@/components/core/mobile-layout';

// Mock the next/navigation module
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        refresh: vi.fn(),
    }),
}));

// Mock the useUser hook
const mockSignOut = vi.fn();
vi.mock('@/hooks/useUser', () => ({
    default: () => ({
        signOut: mockSignOut,
        user: { id: 'test-user-id' },
    }),
}));

// Mock the character store
const mockSetActiveTab = vi.fn();
const mockOpenDiceOverlay = vi.fn();
const mockOpenMoreMenu = vi.fn();

vi.mock('@/store/character-store', () => ({
    useCharacterStore: () => ({
        character: {
            id: 'test-char-id',
            name: 'Test Hero',
            level: 3,
        },
        activeTab: 'character',
        setActiveTab: mockSetActiveTab,
        openDiceOverlay: mockOpenDiceOverlay,
        openMoreMenu: mockOpenMoreMenu,
        isMoreMenuOpen: false,
    }),
}));

// Mock child components that aren't under test
vi.mock('@/components/dice/dice-overlay', () => ({
    default: () => <div data-testid="dice-overlay" />,
}));

vi.mock('@/components/core/more-menu', () => ({
    default: () => <div data-testid="more-menu" />,
}));

vi.mock('@/components/vitals/mini-vitals-banner', () => ({
    default: () => <div data-testid="mini-vitals-banner" />,
}));

vi.mock('@/hooks/useTabPersistence', () => ({
    useTabPersistence: () => { },
}));

describe('MobileLayout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Header', () => {
        it('should display the character name in the header', () => {
            render(
                <MobileLayout>
                    <div>Test Content</div>
                </MobileLayout>
            );

            expect(screen.getByText('Test Hero')).toBeInTheDocument();
        });

        it('should have a button to navigate to character list', () => {
            render(
                <MobileLayout>
                    <div>Test Content</div>
                </MobileLayout>
            );

            const headerButton = screen.getByRole('button', { name: /Test Hero/i });
            fireEvent.click(headerButton);

            expect(mockPush).toHaveBeenCalledWith('/client/characters');
        });

        it('should have a sign out button', () => {
            render(
                <MobileLayout>
                    <div>Test Content</div>
                </MobileLayout>
            );

            const signOutButton = screen.getByTitle('Sign Out');
            expect(signOutButton).toBeInTheDocument();
        });

        it('should call signOut when sign out button is clicked', async () => {
            render(
                <MobileLayout>
                    <div>Test Content</div>
                </MobileLayout>
            );

            const signOutButton = screen.getByTitle('Sign Out');
            fireEvent.click(signOutButton);

            expect(mockSignOut).toHaveBeenCalled();
        });
    });

    describe('Bottom Navigation', () => {
        it('should render all navigation buttons', () => {
            render(
                <MobileLayout>
                    <div>Test Content</div>
                </MobileLayout>
            );

            expect(screen.getByText('Character')).toBeInTheDocument();
            expect(screen.getByText('Combat')).toBeInTheDocument();
            expect(screen.getByText('Playmat')).toBeInTheDocument();
            expect(screen.getByText('More')).toBeInTheDocument();
        });

        it('should call setActiveTab when Character nav is clicked', () => {
            render(
                <MobileLayout>
                    <div>Test Content</div>
                </MobileLayout>
            );

            const characterNav = screen.getByText('Character').closest('button');
            fireEvent.click(characterNav!);

            expect(mockSetActiveTab).toHaveBeenCalledWith('character');
        });

        it('should call setActiveTab when Combat nav is clicked', () => {
            render(
                <MobileLayout>
                    <div>Test Content</div>
                </MobileLayout>
            );

            const combatNav = screen.getByText('Combat').closest('button');
            fireEvent.click(combatNav!);

            expect(mockSetActiveTab).toHaveBeenCalledWith('combat');
        });

        it('should call setActiveTab when Playmat nav is clicked', () => {
            render(
                <MobileLayout>
                    <div>Test Content</div>
                </MobileLayout>
            );

            const playmatNav = screen.getByText('Playmat').closest('button');
            fireEvent.click(playmatNav!);

            expect(mockSetActiveTab).toHaveBeenCalledWith('playmat');
        });

        it('should call openMoreMenu when More nav is clicked', () => {
            render(
                <MobileLayout>
                    <div>Test Content</div>
                </MobileLayout>
            );

            const moreNav = screen.getByText('More').closest('button');
            fireEvent.click(moreNav!);

            expect(mockOpenMoreMenu).toHaveBeenCalled();
        });
    });

    describe('Dice FAB', () => {
        it('should render the dice floating action button', () => {
            render(
                <MobileLayout>
                    <div>Test Content</div>
                </MobileLayout>
            );

            // Find the FAB button (it contains the Dices icon and has specific styling)
            const fabButtons = screen.getAllByRole('button');
            const diceFab = fabButtons.find(btn =>
                btn.className.includes('fixed') && btn.className.includes('bottom-24')
            );

            expect(diceFab).toBeInTheDocument();
        });

        it('should call openDiceOverlay when FAB is clicked', () => {
            render(
                <MobileLayout>
                    <div>Test Content</div>
                </MobileLayout>
            );

            // Find the FAB button by its position styling
            const fabButtons = screen.getAllByRole('button');
            const diceFab = fabButtons.find(btn =>
                btn.className.includes('fixed') && btn.className.includes('bottom-24')
            );

            fireEvent.click(diceFab!);

            expect(mockOpenDiceOverlay).toHaveBeenCalled();
        });
    });

    describe('Child Components', () => {
        it('should render children content', () => {
            render(
                <MobileLayout>
                    <div data-testid="child-content">Test Content</div>
                </MobileLayout>
            );

            expect(screen.getByTestId('child-content')).toBeInTheDocument();
        });

        it('should render DiceOverlay component', () => {
            render(
                <MobileLayout>
                    <div>Test Content</div>
                </MobileLayout>
            );

            expect(screen.getByTestId('dice-overlay')).toBeInTheDocument();
        });

        it('should render MoreMenu component', () => {
            render(
                <MobileLayout>
                    <div>Test Content</div>
                </MobileLayout>
            );

            expect(screen.getByTestId('more-menu')).toBeInTheDocument();
        });

        it('should render MiniVitalsBanner component', () => {
            render(
                <MobileLayout>
                    <div>Test Content</div>
                </MobileLayout>
            );

            expect(screen.getByTestId('mini-vitals-banner')).toBeInTheDocument();
        });
    });
});
