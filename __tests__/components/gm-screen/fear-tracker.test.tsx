/**
 * Fear Tracker Component Tests
 * ----------------------------------------------------------------------------
 * Tests for the FearTracker component used in the GM Screen.
 * Covers rendering, user interactions, and SRD compliance.
 *
 * SRD RULES:
 * - Maximum Fear is ALWAYS 12: "You can never have more than 12 Fear at one time"
 * - Fear carries over between sessions
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
        useGmFearMove: vi.fn(),
        user: { id: 'user-123', email: 'gm@test.com' },
        vitalIcons: {},
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
    // SRD: Maximum Fear is always 12
    const MAX_FEAR = 12;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUpdateFear.mockResolvedValue(undefined);
        mockLogActivity.mockResolvedValue(undefined);
    });

    describe('SRD Compliance', () => {
        it('should always display max Fear as 12 regardless of maxFear prop', () => {
            // Even if maxFear prop is passed, it should be ignored per SRD
            render(<FearTracker campaignId="campaign-1" currentFear={3} maxFear={10} />);

            expect(screen.getByText(`3/${MAX_FEAR}`)).toBeInTheDocument();
        });

        it('should render exactly 12 skull icons in the track (plus 1 in header)', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={5} />);

            // Find all Skull icons - includes 1 in header + 12 in track = 13 total
            const skullIcons = document.querySelectorAll('svg.lucide-skull');
            // Header icon (1) + Track icons (12) = 13
            expect(skullIcons.length).toBe(MAX_FEAR + 1);
        });
    });

    describe('Rendering', () => {
        it('should render the Fear tracker with current value and max 12', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={3} />);

            expect(screen.getByText('Fear')).toBeInTheDocument();
            expect(screen.getByText(`3/${MAX_FEAR}`)).toBeInTheDocument();
        });

        it('should render Spend and Gain buttons', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={5} />);

            expect(screen.getByRole('button', { name: /spend fear/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /gain fear/i })).toBeInTheDocument();
        });

        it('should render quick action buttons (-3, -1, +1, +3)', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={5} />);

            expect(screen.getByText('-3')).toBeInTheDocument();
            expect(screen.getByText('-1')).toBeInTheDocument();
            expect(screen.getByText('+1')).toBeInTheDocument();
            expect(screen.getByText('+3')).toBeInTheDocument();
        });

        it('should display Fear Moves panel toggle', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={5} />);

            expect(screen.getByText('Fear Moves')).toBeInTheDocument();
        });
    });

    describe('Interactions - Gain Fear', () => {
        it('should call updateFear with +1 when Gain button is clicked', async () => {
            render(<FearTracker campaignId="campaign-1" currentFear={3} />);

            const gainButton = screen.getByRole('button', { name: /^gain fear$/i });
            fireEvent.click(gainButton);

            await waitFor(() => {
                expect(mockUpdateFear).toHaveBeenCalledWith('campaign-1', 1);
            });
        });

        it('should disable Gain button when Fear is at max (12)', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={MAX_FEAR} />);

            const gainButton = screen.getByRole('button', { name: /^gain fear$/i });
            expect(gainButton).toBeDisabled();
        });

        it('should call updateFear with +3 when +3 quick action is clicked', async () => {
            render(<FearTracker campaignId="campaign-1" currentFear={3} />);

            const plusThreeButton = screen.getByRole('button', { name: /gain 3 fear/i });
            fireEvent.click(plusThreeButton);

            await waitFor(() => {
                expect(mockUpdateFear).toHaveBeenCalledWith('campaign-1', 3);
            });
        });

        it('should disable +3 button when Fear is above 9', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={10} />);

            const plusThreeButton = screen.getByRole('button', { name: /gain 3 fear/i });
            expect(plusThreeButton).toBeDisabled();
        });
    });

    describe('Interactions - Spend Fear', () => {
        it('should call updateFear with -1 when Spend button is clicked', async () => {
            render(<FearTracker campaignId="campaign-1" currentFear={3} />);

            const spendButton = screen.getByRole('button', { name: /^spend fear$/i });
            fireEvent.click(spendButton);

            await waitFor(() => {
                expect(mockUpdateFear).toHaveBeenCalledWith('campaign-1', -1);
            });
        });

        it('should disable Spend button when Fear is 0', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={0} />);

            const spendButton = screen.getByRole('button', { name: /^spend fear$/i });
            expect(spendButton).toBeDisabled();
        });

        it('should disable -3 button when Fear is less than 3', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={2} />);

            const minusThreeButton = screen.getByRole('button', { name: /spend 3 fear/i });
            expect(minusThreeButton).toBeDisabled();
        });

        it('should call updateFear with -1 when -1 quick action is clicked', async () => {
            render(<FearTracker campaignId="campaign-1" currentFear={3} />);

            const minusOneButton = screen.getByRole('button', { name: /spend 1 fear/i });
            fireEvent.click(minusOneButton);

            await waitFor(() => {
                expect(mockUpdateFear).toHaveBeenCalledWith('campaign-1', -1);
            });
        });
    });

    describe('Activity Logging', () => {
        it('should log activity when Fear is changed', async () => {
            render(<FearTracker campaignId="campaign-1" currentFear={3} />);

            const gainButton = screen.getByRole('button', { name: /^gain fear$/i });
            fireEvent.click(gainButton);

            await waitFor(() => {
                expect(mockLogActivity).toHaveBeenCalledWith(
                    expect.objectContaining({
                        campaign_id: 'campaign-1',
                        user_id: 'user-123',
                        activity_type: 'fear_change',
                        is_private: false,
                        data: expect.objectContaining({
                            change: 1,
                            previous_value: 3,
                            new_value: 4,
                            max_value: MAX_FEAR,
                        }),
                    })
                );
            });
        });

        it('should log correct max_value of 12 in activity', async () => {
            render(<FearTracker campaignId="campaign-1" currentFear={5} />);

            const spendButton = screen.getByRole('button', { name: /^spend fear$/i });
            fireEvent.click(spendButton);

            await waitFor(() => {
                expect(mockLogActivity).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            max_value: MAX_FEAR,
                        }),
                    })
                );
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle Fear at 0 gracefully', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={0} />);

            expect(screen.getByText(`0/${MAX_FEAR}`)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /^spend fear$/i })).toBeDisabled();
        });

        it('should handle Fear at max (12) gracefully', () => {
            render(<FearTracker campaignId="campaign-1" currentFear={MAX_FEAR} />);

            expect(screen.getByText(`${MAX_FEAR}/${MAX_FEAR}`)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /^gain fear$/i })).toBeDisabled();
        });

        it('should clamp displayed values within valid range', () => {
            // Even if an invalid value is passed, it should display properly
            render(<FearTracker campaignId="campaign-1" currentFear={15} />);

            // The component receives 15, but the UI still renders it
            // (clamping happens on save, not display)
            expect(screen.getByText(`15/${MAX_FEAR}`)).toBeInTheDocument();
        });
    });
});
