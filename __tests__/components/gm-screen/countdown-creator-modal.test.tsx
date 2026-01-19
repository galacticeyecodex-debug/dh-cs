/**
 * CountdownCreatorModal Component Tests
 * Phase 9 GM Screen - Issue #67
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CountdownCreatorModal } from '@/components/gm-screen/countdown-creator-modal';
import { CountdownInsert } from '@/types/campaign';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
            <div {...props}>{children}</div>
        ),
    },
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('CountdownCreatorModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('does not render when isOpen is false', () => {
            render(
                <CountdownCreatorModal
                    isOpen={false}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            expect(screen.queryByText('Create Countdown')).not.toBeInTheDocument();
        });

        it('renders modal when isOpen is true', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            expect(screen.getByRole('heading', { name: 'Create Countdown' })).toBeInTheDocument();
        });

        it('renders all countdown type options', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            expect(screen.getByText('Standard')).toBeInTheDocument();
            expect(screen.getByText('Progress')).toBeInTheDocument();
            expect(screen.getByText('Consequence')).toBeInTheDocument();
            expect(screen.getByText('Loop')).toBeInTheDocument();
            expect(screen.getByText('Long-term')).toBeInTheDocument();
        });

        it('renders preset value buttons', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            [3, 4, 5, 6, 8, 10].forEach(value => {
                expect(screen.getByRole('button', { name: String(value) })).toBeInTheDocument();
            });
        });

        it('renders visibility toggle', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            expect(screen.getByText('Public')).toBeInTheDocument();
            expect(screen.getByText('Players can see this countdown')).toBeInTheDocument();
        });
    });

    describe('form inputs', () => {
        it('allows entering countdown name', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const nameInput = screen.getByPlaceholderText(/Ritual Completion/);
            fireEvent.change(nameInput, { target: { value: 'Test Countdown' } });

            expect(nameInput).toHaveValue('Test Countdown');
        });

        it('allows entering description', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const descInput = screen.getByPlaceholderText(/What happens when this countdown triggers/);
            fireEvent.change(descInput, { target: { value: 'Test description' } });

            expect(descInput).toHaveValue('Test description');
        });

        it('allows selecting countdown type', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const progressButton = screen.getByText('Progress').closest('button');
            fireEvent.click(progressButton!);

            // Progress type should now be selected (button should have different styling)
            expect(progressButton).toHaveClass('bg-green-500/20');
        });

        it('allows selecting starting value from presets', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const value6Button = screen.getByRole('button', { name: '6' });
            fireEvent.click(value6Button);

            // 6 should now be selected
            expect(value6Button).toHaveClass('bg-dagger-gold/20');
        });

        it('allows entering custom starting value', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const customInput = screen.getByPlaceholderText('Custom');
            fireEvent.change(customInput, { target: { value: '12' } });

            expect(customInput).toHaveValue(12);
        });

        it('toggles visibility between public and hidden', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const visibilityToggle = screen.getByText('Public').closest('button');
            fireEvent.click(visibilityToggle!);

            expect(screen.getByText('Hidden')).toBeInTheDocument();
            expect(screen.getByText('Only visible to GM')).toBeInTheDocument();
        });

        it('shows looping toggle for non-loop types', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            expect(screen.getByText('Looping')).toBeInTheDocument();
        });

        it('hides looping toggle when loop type is selected', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            // Select loop type
            const loopButton = screen.getByText('Loop').closest('button');
            fireEvent.click(loopButton!);

            // Looping toggle should not be visible since loop type is inherently looping
            expect(screen.queryByText(/Reset to starting value after triggering/)).not.toBeInTheDocument();
        });
    });

    describe('form submission', () => {
        it('disables submit button when name is empty', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const submitButton = screen.getByRole('button', { name: /Create Countdown/ });
            expect(submitButton).toBeDisabled();
        });

        it('enables submit button when name is provided', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const nameInput = screen.getByPlaceholderText(/Ritual Completion/);
            fireEvent.change(nameInput, { target: { value: 'Test Countdown' } });

            const submitButton = screen.getByRole('button', { name: /Create Countdown/ });
            expect(submitButton).not.toBeDisabled();
        });

        it('calls onSubmit with correct data when form is submitted', async () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            // Fill in form
            const nameInput = screen.getByPlaceholderText(/Ritual Completion/);
            fireEvent.change(nameInput, { target: { value: 'Test Countdown' } });

            const descInput = screen.getByPlaceholderText(/What happens when this countdown triggers/);
            fireEvent.change(descInput, { target: { value: 'Test description' } });

            // Select progress type
            const progressButton = screen.getByText('Progress').closest('button');
            fireEvent.click(progressButton!);

            // Select value 6
            const value6Button = screen.getByRole('button', { name: '6' });
            fireEvent.click(value6Button);

            // Submit
            const submitButton = screen.getByRole('button', { name: /Create Countdown/ });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith({
                    name: 'Test Countdown',
                    description: 'Test description',
                    type: 'progress',
                    starting_value: 6,
                    is_public: true,
                    is_looping: false,
                } as CountdownInsert);
            });
        });

        it('calls onClose after successful submission', async () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            // Fill in minimum required field
            const nameInput = screen.getByPlaceholderText(/Ritual Completion/);
            fireEvent.change(nameInput, { target: { value: 'Test Countdown' } });

            // Submit
            const submitButton = screen.getByRole('button', { name: /Create Countdown/ });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockOnClose).toHaveBeenCalled();
            });
        });

        it('shows loading state during submission', async () => {
            const slowSubmit = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={slowSubmit}
                />
            );

            const nameInput = screen.getByPlaceholderText(/Ritual Completion/);
            fireEvent.change(nameInput, { target: { value: 'Test Countdown' } });

            const submitButton = screen.getByRole('button', { name: /Create Countdown/ });
            fireEvent.click(submitButton);

            expect(screen.getByText('Creating...')).toBeInTheDocument();
        });
    });

    describe('close behavior', () => {
        it('calls onClose when Cancel button is clicked', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const cancelButton = screen.getByRole('button', { name: 'Cancel' });
            fireEvent.click(cancelButton);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('calls onClose when X button is clicked', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const closeButton = screen.getByRole('button', { name: 'Close' });
            fireEvent.click(closeButton);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('calls onClose when backdrop is clicked', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            // Click on backdrop (the semi-transparent background)
            const backdrop = document.querySelector('.bg-black\\/80');
            fireEvent.click(backdrop!);

            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    describe('info box', () => {
        it('shows standard countdown info by default', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            expect(screen.getByText(/Standard countdowns tick down by 1/)).toBeInTheDocument();
        });

        it('shows dynamic countdown info for progress type', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const progressButton = screen.getByText('Progress').closest('button');
            fireEvent.click(progressButton!);

            expect(screen.getByText(/Dynamic countdowns advance based on roll outcomes/)).toBeInTheDocument();
        });

        it('shows long-term countdown info for long_term type', () => {
            render(
                <CountdownCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                />
            );

            const longTermButton = screen.getByText('Long-term').closest('button');
            fireEvent.click(longTermButton!);

            expect(screen.getByText(/Long-term countdowns advance when the party takes a rest/)).toBeInTheDocument();
        });
    });
});
