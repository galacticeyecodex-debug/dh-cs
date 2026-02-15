/**
 * Quick Actions Bar Component Tests
 * ----------------------------------------------------------------------------
 * Tests for the QuickActionsBar component used in the GM Screen.
 * Covers rendering of action buttons and modal triggers.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickActionsBar } from '@/components/gm-screen/quick-actions-bar';

// ============================================================================
// MOCKS
// ============================================================================

const mockFetchPartyCharacters = vi.fn();

vi.mock('@/store/character-store', () => ({
    useCharacterStore: () => ({
        fetchPartyCharacters: mockFetchPartyCharacters,
    }),
}));

// Mock the modal components to avoid complex rendering
vi.mock('@/components/gm-screen/gm-dice-roller-modal', () => ({
    GmDiceRollerModal: ({ isOpen, onClose, isPrivate }: any) =>
        isOpen ? (
            <div data-testid="dice-roller-modal">
                Dice Roller Modal (Private: {isPrivate ? 'yes' : 'no'})
                <button onClick={onClose}>Close Dice Modal</button>
            </div>
        ) : null,
}));

vi.mock('@/components/gm-screen/announce-modal', () => ({
    AnnounceModal: ({ isOpen, onClose }: any) =>
        isOpen ? (
            <div data-testid="announce-modal">
                Announce Modal
                <button onClick={onClose}>Close Announce Modal</button>
            </div>
        ) : null,
}));

// ============================================================================
// TESTS
// ============================================================================

describe('QuickActionsBar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetchPartyCharacters.mockResolvedValue(undefined);
    });

    describe('Rendering', () => {
        it('should render Quick Actions title', () => {
            render(<QuickActionsBar campaignId="campaign-1" />);

            expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        });

        it('should render Roll Dice button', () => {
            render(<QuickActionsBar campaignId="campaign-1" />);

            expect(screen.getByText('Roll Dice')).toBeInTheDocument();
        });

        it('should render Announce button', () => {
            render(<QuickActionsBar campaignId="campaign-1" />);

            expect(screen.getByText('Announce')).toBeInTheDocument();
        });

        it('should render Hidden Roll button', () => {
            render(<QuickActionsBar campaignId="campaign-1" />);

            expect(screen.getByText('Hidden Roll')).toBeInTheDocument();
        });

        it('should render Refresh button', () => {
            render(<QuickActionsBar campaignId="campaign-1" />);

            expect(screen.getByText('Refresh')).toBeInTheDocument();
        });

        it('should render Notes button (disabled)', () => {
            render(<QuickActionsBar campaignId="campaign-1" />);

            expect(screen.getByText('Notes')).toBeInTheDocument();
            expect(screen.getByText('Coming Soon')).toBeInTheDocument();
        });
    });

    describe('Roll Dice Modal', () => {
        it('should open dice roller modal when Roll Dice is clicked', async () => {
            render(<QuickActionsBar campaignId="campaign-1" />);

            expect(screen.queryByTestId('dice-roller-modal')).not.toBeInTheDocument();

            const rollDiceButton = screen.getByText('Roll Dice');
            fireEvent.click(rollDiceButton);

            await waitFor(() => {
                expect(screen.getByTestId('dice-roller-modal')).toBeInTheDocument();
            });
            expect(screen.getByText(/Private: no/)).toBeInTheDocument();
        });

        it('should close dice roller modal when closed', async () => {
            render(<QuickActionsBar campaignId="campaign-1" />);

            const rollDiceButton = screen.getByText('Roll Dice');
            fireEvent.click(rollDiceButton);

            await waitFor(() => {
                expect(screen.getByTestId('dice-roller-modal')).toBeInTheDocument();
            });

            const closeButton = screen.getByText('Close Dice Modal');
            fireEvent.click(closeButton);

            await waitFor(() => {
                expect(screen.queryByTestId('dice-roller-modal')).not.toBeInTheDocument();
            });
        });
    });

    describe('Hidden Roll Modal', () => {
        it('should open dice roller modal with isPrivate when Hidden Roll is clicked', async () => {
            render(<QuickActionsBar campaignId="campaign-1" />);

            const hiddenRollButton = screen.getByText('Hidden Roll');
            fireEvent.click(hiddenRollButton);

            await waitFor(() => {
                expect(screen.getByTestId('dice-roller-modal')).toBeInTheDocument();
            });
            expect(screen.getByText(/Private: yes/)).toBeInTheDocument();
        });
    });

    describe('Announce Modal', () => {
        it('should open announce modal when Announce is clicked', async () => {
            render(<QuickActionsBar campaignId="campaign-1" />);

            expect(screen.queryByTestId('announce-modal')).not.toBeInTheDocument();

            const announceButton = screen.getByText('Announce');
            fireEvent.click(announceButton);

            await waitFor(() => {
                expect(screen.getByTestId('announce-modal')).toBeInTheDocument();
            });
        });

        it('should close announce modal when closed', async () => {
            render(<QuickActionsBar campaignId="campaign-1" />);

            const announceButton = screen.getByText('Announce');
            fireEvent.click(announceButton);

            await waitFor(() => {
                expect(screen.getByTestId('announce-modal')).toBeInTheDocument();
            });

            const closeButton = screen.getByText('Close Announce Modal');
            fireEvent.click(closeButton);

            await waitFor(() => {
                expect(screen.queryByTestId('announce-modal')).not.toBeInTheDocument();
            });
        });
    });

    describe('Refresh', () => {
        it('should call fetchPartyCharacters when Refresh is clicked', async () => {
            render(<QuickActionsBar campaignId="campaign-1" />);

            const refreshButton = screen.getByText('Refresh');
            fireEvent.click(refreshButton);

            await waitFor(() => {
                expect(mockFetchPartyCharacters).toHaveBeenCalledWith('campaign-1');
            });
        });
    });

    describe('Notes (Disabled)', () => {
        it('should have Notes button disabled', () => {
            render(<QuickActionsBar campaignId="campaign-1" />);

            const notesButton = screen.getByText('Notes').closest('button');
            expect(notesButton).toBeDisabled();
        });
    });
});
