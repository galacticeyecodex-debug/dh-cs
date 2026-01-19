/**
 * CountdownTracker Component Tests
 * Phase 9 GM Screen - Issue #67
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CountdownTracker } from '@/components/gm-screen/countdown-tracker';
import { Countdown } from '@/types/campaign';

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

describe('CountdownTracker', () => {
    const mockOnAdvance = vi.fn().mockResolvedValue(undefined);
    const mockOnDelete = vi.fn().mockResolvedValue(undefined);
    const mockOnReset = vi.fn().mockResolvedValue(undefined);
    const mockOnCreateNew = vi.fn();

    const createCountdown = (overrides: Partial<Countdown> = {}): Countdown => ({
        id: 'cd-1',
        name: 'Test Countdown',
        description: 'Test description',
        type: 'standard',
        starting_value: 5,
        current_value: 3,
        is_public: true,
        is_looping: false,
        created_at: new Date().toISOString(),
        ...overrides,
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('renders empty state when no countdowns', () => {
            render(
                <CountdownTracker
                    countdowns={[]}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('No active countdowns')).toBeInTheDocument();
            expect(screen.getByText('Create your first countdown')).toBeInTheDocument();
        });

        it('renders countdown cards with correct information', () => {
            const countdown = createCountdown({ name: 'Ritual Timer' });

            render(
                <CountdownTracker
                    countdowns={[countdown]}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('Ritual Timer')).toBeInTheDocument();
            expect(screen.getByText('3/5')).toBeInTheDocument();
            expect(screen.getByText('standard')).toBeInTheDocument();
        });

        it('shows "Triggered!" badge when countdown reaches 0', () => {
            const triggeredCountdown = createCountdown({
                name: 'Triggered Timer',
                current_value: 0,
            });

            render(
                <CountdownTracker
                    countdowns={[triggeredCountdown]}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('Triggered!')).toBeInTheDocument();
        });

        it('shows triggered warning banner when countdowns are triggered', () => {
            const triggeredCountdown = createCountdown({ current_value: 0 });

            render(
                <CountdownTracker
                    countdowns={[triggeredCountdown]}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText(/1 countdown triggered!/)).toBeInTheDocument();
        });

        it('displays loop indicator for looping countdowns', () => {
            const loopCountdown = createCountdown({
                type: 'loop',
                is_looping: true,
            });

            render(
                <CountdownTracker
                    countdowns={[loopCountdown]}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('Loop')).toBeInTheDocument();
        });

        it('displays hidden indicator for private countdowns', () => {
            const privateCountdown = createCountdown({ is_public: false });

            render(
                <CountdownTracker
                    countdowns={[privateCountdown]}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('Hidden')).toBeInTheDocument();
        });

        it('renders correct number of tick boxes based on starting value', () => {
            const countdown = createCountdown({
                starting_value: 6,
                current_value: 4,
            });

            render(
                <CountdownTracker
                    countdowns={[countdown]}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            // Should have 6 tick boxes total
            expect(screen.getByText('4/6')).toBeInTheDocument();
        });
    });

    describe('countdown types', () => {
        it('shows roll advance button for progress type', () => {
            const progressCountdown = createCountdown({ type: 'progress' });

            render(
                <CountdownTracker
                    countdowns={[progressCountdown]}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('Roll Advance')).toBeInTheDocument();
        });

        it('shows roll advance button for consequence type', () => {
            const consequenceCountdown = createCountdown({ type: 'consequence' });

            render(
                <CountdownTracker
                    countdowns={[consequenceCountdown]}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('Roll Advance')).toBeInTheDocument();
        });

        it('does not show roll advance button for standard type', () => {
            const standardCountdown = createCountdown({ type: 'standard' });

            render(
                <CountdownTracker
                    countdowns={[standardCountdown]}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.queryByText('Roll Advance')).not.toBeInTheDocument();
        });
    });

    describe('interactions', () => {
        it('calls onAdvance when Tick Down button is clicked', async () => {
            const countdown = createCountdown();

            render(
                <CountdownTracker
                    countdowns={[countdown]}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            const tickDownButton = screen.getByText('Tick Down');
            fireEvent.click(tickDownButton);

            await waitFor(() => {
                expect(mockOnAdvance).toHaveBeenCalledWith('cd-1', 1);
            });
        });

        it('calls onCreateNew when New button is clicked', () => {
            render(
                <CountdownTracker
                    countdowns={[]}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            const newButton = screen.getByText('New');
            fireEvent.click(newButton);

            expect(mockOnCreateNew).toHaveBeenCalled();
        });

        it('shows Reset Loop button for triggered looping countdown', () => {
            const triggeredLoop = createCountdown({
                type: 'loop',
                is_looping: true,
                current_value: 0,
            });

            render(
                <CountdownTracker
                    countdowns={[triggeredLoop]}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('Reset Loop')).toBeInTheDocument();
        });

        it('calls onReset when Reset Loop is clicked', async () => {
            const triggeredLoop = createCountdown({
                id: 'loop-1',
                type: 'loop',
                is_looping: true,
                current_value: 0,
            });

            render(
                <CountdownTracker
                    countdowns={[triggeredLoop]}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            const resetButton = screen.getByText('Reset Loop');
            fireEvent.click(resetButton);

            await waitFor(() => {
                expect(mockOnReset).toHaveBeenCalledWith('loop-1');
            });
        });

        it('shows Complete & Remove button for triggered non-looping countdown', () => {
            const triggeredCountdown = createCountdown({
                current_value: 0,
                is_looping: false,
            });

            render(
                <CountdownTracker
                    countdowns={[triggeredCountdown]}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('Complete & Remove')).toBeInTheDocument();
        });

        it('calls onDelete when Complete & Remove is clicked', async () => {
            const triggeredCountdown = createCountdown({
                id: 'trig-1',
                current_value: 0,
                is_looping: false,
            });

            render(
                <CountdownTracker
                    countdowns={[triggeredCountdown]}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            const completeButton = screen.getByText('Complete & Remove');
            fireEvent.click(completeButton);

            await waitFor(() => {
                expect(mockOnDelete).toHaveBeenCalledWith('trig-1');
            });
        });

        it('expands countdown card when chevron is clicked', () => {
            const countdown = createCountdown({ description: 'Detailed description here' });

            render(
                <CountdownTracker
                    countdowns={[countdown]}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            // Description should not be visible initially
            expect(screen.queryByText('Detailed description here')).not.toBeInTheDocument();

            // Click expand button
            const expandButton = screen.getByRole('button', { name: 'Expand' });
            fireEvent.click(expandButton);

            // Now description should be visible
            expect(screen.getByText('Detailed description here')).toBeInTheDocument();
        });
    });

    describe('ordering', () => {
        it('shows triggered countdowns before active countdowns', () => {
            const activeCountdown = createCountdown({
                id: 'active-1',
                name: 'Active Timer',
                current_value: 3,
            });
            const triggeredCountdown = createCountdown({
                id: 'triggered-1',
                name: 'Triggered Timer',
                current_value: 0,
            });

            render(
                <CountdownTracker
                    countdowns={[activeCountdown, triggeredCountdown]}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            const countdownNames = screen.getAllByText(/Timer/);
            // Triggered should come first
            expect(countdownNames[0].textContent).toBe('Triggered Timer');
            expect(countdownNames[1].textContent).toBe('Active Timer');
        });
    });

    describe('header', () => {
        it('shows correct count of active countdowns', () => {
            const countdowns = [
                createCountdown({ id: '1', name: 'Timer 1' }),
                createCountdown({ id: '2', name: 'Timer 2' }),
                createCountdown({ id: '3', name: 'Timer 3' }),
            ];

            render(
                <CountdownTracker
                    countdowns={countdowns}
                    onAdvance={mockOnAdvance}
                    onDelete={mockOnDelete}
                    onReset={mockOnReset}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('3 active')).toBeInTheDocument();
        });
    });
});
