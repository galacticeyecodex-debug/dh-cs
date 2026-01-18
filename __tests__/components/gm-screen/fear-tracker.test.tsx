/**
 * Fear Tracker Component Tests
 * ----------------------------------------------------------------------------
 * Tests for the FearTracker component used in the GM Screen.
 * Covers rendering, user interactions, and edge cases.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FearTracker } from '@/components/gm-screen/fear-tracker';

// ============================================================================
// MOCKS
// ============================================================================

const mockUpdateFear = vi.fn();
const mockLogActivity = vi.fn();

vi.mock('@/store/character-store', () => ({
    useCharacterStore: () => ({
        updateFear: mockUpdateFear,
        logActivity: mockLogActivity,
        user: { id: 'user-123', email: 'gm@test.com' },
    }),
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// ============================================================================
// TESTS
// ============================================================================

describe('FearTracker', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUpdateFear.mockResolvedValue(undefined);
        mockLogActivity.mockResolvedValue(undefined);
    });

    describe('Rendering', () => {
        it('should render the Fear tracker with current and max values', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={3} maxFear={10} />);

            expect(screen.getByText('Fear')).toBeInTheDocument();
            expect(screen.getByText('3/10')).toBeInTheDocument();
        });

        it('should display the progress bar at correct percentage', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={5} maxFear={10} />);

            expect(screen.getByText('50%')).toBeInTheDocument();
        });

        it('should not display percentage when Fear is 0', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={0} maxFear={10} />);

            expect(screen.queryByText('0%')).not.toBeInTheDocument();
        });

        it('should render quick action buttons', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={5} maxFear={10} />);

            expect(screen.getByText('-5')).toBeInTheDocument();
            expect(screen.getByText('-3')).toBeInTheDocument();
            expect(screen.getByText('+3')).toBeInTheDocument();
            expect(screen.getByText('+5')).toBeInTheDocument();
        });
    });

    describe('Interactions - Gain Fear', () => {
        it('should call updateFear with +1 when gain button is clicked', async () => {
            render(<FearTracker campaignId="campaign-1" currentFear={3} maxFear={10} />);

            const gainButton = screen.getByRole('button', { name: /gain 1 fear/i });
            fireEvent.click(gainButton);

            await waitFor(() => {
                expect(mockUpdateFear).toHaveBeenCalledWith('campaign-1', 1);
            });
        });

        it('should disable gain button when Fear is at max', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={10} maxFear={10} />);

            const gainButton = screen.getByRole('button', { name: /gain 1 fear/i });
            expect(gainButton).toBeDisabled();
        });

        it('should call updateFear with +3 when +3 quick action is clicked', async () => {
            render(<FearTracker campaignId="campaign-1" currentFear={3} maxFear={10} />);

            const plusThreeButton = screen.getByText('+3');
            fireEvent.click(plusThreeButton);

            await waitFor(() => {
                expect(mockUpdateFear).toHaveBeenCalledWith('campaign-1', 3);
            });
        });
    });

    describe('Interactions - Spend Fear', () => {
        it('should call updateFear with -1 when spend button is clicked', async () => {
            render(<FearTracker campaignId="campaign-1" currentFear={3} maxFear={10} />);

            const spendButton = screen.getByRole('button', { name: /spend 1 fear/i });
            fireEvent.click(spendButton);

            await waitFor(() => {
                expect(mockUpdateFear).toHaveBeenCalledWith('campaign-1', -1);
            });
        });

        it('should disable spend button when Fear is 0', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={0} maxFear={10} />);

            const spendButton = screen.getByRole('button', { name: /spend 1 fear/i });
            expect(spendButton).toBeDisabled();
        });

        it('should disable -3 button when Fear is less than 3', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={2} maxFear={10} />);

            const minusThreeButton = screen.getByText('-3');
            expect(minusThreeButton).toBeDisabled();
        });

        it('should disable -5 button when Fear is less than 5', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={4} maxFear={10} />);

            const minusFiveButton = screen.getByText('-5');
            expect(minusFiveButton).toBeDisabled();
        });
    });

    describe('Activity Logging', () => {
        it('should log activity when Fear is changed', async () => {
            render(<FearTracker campaignId="campaign-1" currentFear={3} maxFear={10} />);

            const gainButton = screen.getByRole('button', { name: /gain 1 fear/i });
            fireEvent.click(gainButton);

            await waitFor(() => {
                expect(mockLogActivity).toHaveBeenCalledWith(
                    expect.objectContaining({
                        campaign_id: 'campaign-1',
                        user_id: 'user-123',
                        activity_type: 'fear_change',
                        is_private: false,
                    })
                );
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle maxFear of 0 without division by zero', () => {
            // This shouldn't happen but let's be safe
            render(<FearTracker campaignId="campaign-1" currentFear={0} maxFear={0} />);

            expect(screen.getByText('0/0')).toBeInTheDocument();
        });

        it('should disable +5 button when near max', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={7} maxFear={10} />);

            const plusFiveButton = screen.getByText('+5');
            expect(plusFiveButton).toBeDisabled();
        });
    });
});
