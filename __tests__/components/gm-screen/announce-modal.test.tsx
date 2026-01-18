/**
 * Announce Modal Component Tests
 * ----------------------------------------------------------------------------
 * Tests for the AnnounceModal component used in the GM Screen.
 * Covers rendering, templates, message submission, and validation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnnounceModal } from '@/components/gm-screen/announce-modal';

// ============================================================================
// MOCKS
// ============================================================================

const mockLogActivity = vi.fn();
const mockOnClose = vi.fn();

vi.mock('@/store/character-store', () => ({
    useCharacterStore: () => ({
        user: { id: 'user-123', email: 'gm@test.com' },
        logActivity: mockLogActivity,
    }),
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Get mock toast after vi.mock
import { toast } from 'sonner';
const mockToast = vi.mocked(toast);

// ============================================================================
// TESTS
// ============================================================================

describe('AnnounceModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLogActivity.mockResolvedValue(undefined);
    });

    describe('Rendering', () => {
        it('should not render when isOpen is false', () => {
            render(
                <AnnounceModal
                    isOpen={false}
                    onClose={mockOnClose}
                    campaignId="campaign-1"
                />
            );

            expect(screen.queryByText('Announce to Party')).not.toBeInTheDocument();
        });

        it('should render modal when isOpen is true', () => {
            render(
                <AnnounceModal
                    isOpen={true}
                    onClose={mockOnClose}
                    campaignId="campaign-1"
                />
            );

            expect(screen.getByText('Announce to Party')).toBeInTheDocument();
        });

        it('should render quick templates', () => {
            render(
                <AnnounceModal
                    isOpen={true}
                    onClose={mockOnClose}
                    campaignId="campaign-1"
                />
            );

            expect(screen.getByText('Combat Start')).toBeInTheDocument();
            expect(screen.getByText('Short Rest')).toBeInTheDocument();
            expect(screen.getByText('Long Rest')).toBeInTheDocument();
            expect(screen.getByText('Level Up')).toBeInTheDocument();
        });

        it('should render message textarea', () => {
            render(
                <AnnounceModal
                    isOpen={true}
                    onClose={mockOnClose}
                    campaignId="campaign-1"
                />
            );

            expect(screen.getByPlaceholderText(/enter your message/i)).toBeInTheDocument();
        });

        it('should render Cancel and Send buttons', () => {
            render(
                <AnnounceModal
                    isOpen={true}
                    onClose={mockOnClose}
                    campaignId="campaign-1"
                />
            );

            expect(screen.getByText('Cancel')).toBeInTheDocument();
            expect(screen.getByText('Send')).toBeInTheDocument();
        });
    });

    describe('Template Selection', () => {
        it('should populate message field when template is clicked', () => {
            render(
                <AnnounceModal
                    isOpen={true}
                    onClose={mockOnClose}
                    campaignId="campaign-1"
                />
            );

            const combatStartButton = screen.getByText('Combat Start');
            fireEvent.click(combatStartButton);

            const textarea = screen.getByPlaceholderText(/enter your message/i);
            expect(textarea).toHaveValue('⚔️ Roll for initiative!');
        });

        it('should allow switching between templates', () => {
            render(
                <AnnounceModal
                    isOpen={true}
                    onClose={mockOnClose}
                    campaignId="campaign-1"
                />
            );

            fireEvent.click(screen.getByText('Combat Start'));
            let textarea = screen.getByPlaceholderText(/enter your message/i);
            expect(textarea).toHaveValue('⚔️ Roll for initiative!');

            fireEvent.click(screen.getByText('Long Rest'));
            textarea = screen.getByPlaceholderText(/enter your message/i);
            expect(textarea).toHaveValue('🌙 Long rest. Restore all HP, clear Stress, and repair Armor.');
        });
    });

    describe('Message Input', () => {
        it('should allow typing custom message', () => {
            render(
                <AnnounceModal
                    isOpen={true}
                    onClose={mockOnClose}
                    campaignId="campaign-1"
                />
            );

            const textarea = screen.getByPlaceholderText(/enter your message/i);
            fireEvent.change(textarea, { target: { value: 'Custom announcement!' } });

            expect(textarea).toHaveValue('Custom announcement!');
        });

        it('should disable Send button when message is empty', () => {
            render(
                <AnnounceModal
                    isOpen={true}
                    onClose={mockOnClose}
                    campaignId="campaign-1"
                />
            );

            const sendButton = screen.getByText('Send');
            expect(sendButton).toBeDisabled();
        });

        it('should disable Send button when message is only whitespace', () => {
            render(
                <AnnounceModal
                    isOpen={true}
                    onClose={mockOnClose}
                    campaignId="campaign-1"
                />
            );

            const textarea = screen.getByPlaceholderText(/enter your message/i);
            fireEvent.change(textarea, { target: { value: '   ' } });

            const sendButton = screen.getByText('Send');
            expect(sendButton).toBeDisabled();
        });

        it('should enable Send button when message has content', () => {
            render(
                <AnnounceModal
                    isOpen={true}
                    onClose={mockOnClose}
                    campaignId="campaign-1"
                />
            );

            const textarea = screen.getByPlaceholderText(/enter your message/i);
            fireEvent.change(textarea, { target: { value: 'Hello party!' } });

            const sendButton = screen.getByText('Send');
            expect(sendButton).not.toBeDisabled();
        });
    });

    describe('Submission', () => {
        it('should call logActivity when Send is clicked', async () => {
            render(
                <AnnounceModal
                    isOpen={true}
                    onClose={mockOnClose}
                    campaignId="campaign-1"
                />
            );

            const textarea = screen.getByPlaceholderText(/enter your message/i);
            fireEvent.change(textarea, { target: { value: 'Test announcement' } });

            const sendButton = screen.getByText('Send');
            fireEvent.click(sendButton);

            await waitFor(() => {
                expect(mockLogActivity).toHaveBeenCalledWith(
                    expect.objectContaining({
                        campaign_id: 'campaign-1',
                        user_id: 'user-123',
                        activity_type: 'gm_announcement',
                        data: expect.objectContaining({
                            message: 'Test announcement',
                        }),
                        is_private: false,
                    })
                );
            });
        });

        it('should call onClose after successful submission', async () => {
            render(
                <AnnounceModal
                    isOpen={true}
                    onClose={mockOnClose}
                    campaignId="campaign-1"
                />
            );

            const textarea = screen.getByPlaceholderText(/enter your message/i);
            fireEvent.change(textarea, { target: { value: 'Test' } });

            const sendButton = screen.getByText('Send');
            fireEvent.click(sendButton);

            await waitFor(() => {
                expect(mockOnClose).toHaveBeenCalled();
            });
        });

        it('should show success toast after submission', async () => {
            render(
                <AnnounceModal
                    isOpen={true}
                    onClose={mockOnClose}
                    campaignId="campaign-1"
                />
            );

            const textarea = screen.getByPlaceholderText(/enter your message/i);
            fireEvent.change(textarea, { target: { value: 'Test' } });

            const sendButton = screen.getByText('Send');
            fireEvent.click(sendButton);

            await waitFor(() => {
                expect(mockToast.success).toHaveBeenCalled();
            });
        });

        it('should show error toast on submission failure', async () => {
            mockLogActivity.mockRejectedValue(new Error('Failed'));

            render(
                <AnnounceModal
                    isOpen={true}
                    onClose={mockOnClose}
                    campaignId="campaign-1"
                />
            );

            const textarea = screen.getByPlaceholderText(/enter your message/i);
            fireEvent.change(textarea, { target: { value: 'Test' } });

            const sendButton = screen.getByText('Send');
            fireEvent.click(sendButton);

            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith('Failed to send announcement');
            });
        });
    });

    describe('Close Behavior', () => {
        it('should call onClose when Cancel is clicked', () => {
            render(
                <AnnounceModal
                    isOpen={true}
                    onClose={mockOnClose}
                    campaignId="campaign-1"
                />
            );

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('should call onClose when close (X) button is clicked', () => {
            render(
                <AnnounceModal
                    isOpen={true}
                    onClose={mockOnClose}
                    campaignId="campaign-1"
                />
            );

            const closeButton = screen.getByRole('button', { name: /close announcement/i });
            fireEvent.click(closeButton);

            expect(mockOnClose).toHaveBeenCalled();
        });
    });
});
