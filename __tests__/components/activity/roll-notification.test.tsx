/**
 * Roll Notification Component Tests
 * ----------------------------------------------------------------------------
 * Tests for the enhanced roll notification pop-up component.
 * Phase 9: Roll Announcements & Pop-up Notifications (Issue #67)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RollNotification } from '@/components/activity/roll-notification';
import { CampaignActivity } from '@/types/activity';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('RollNotification', () => {
    const mockDismiss = vi.fn();

    const baseActivity: CampaignActivity = {
        id: 'test-1',
        campaign_id: 'campaign-1',
        user_id: 'user-1',
        character_id: 'char-1',
        character_name: 'Theron',
        activity_type: 'dice_roll',
        data: {
            roll_type: 'trait',
            trait: 'Strength',
            dice: [8, 5],
            modifier: 2,
            total: 15,
            hope_fear: 'hope',
            description: 'Strength Check',
        },
        is_private: false,
        created_at: new Date().toISOString(),
    };

    beforeEach(() => {
        mockDismiss.mockClear();
    });

    it('renders nothing when activity is null', () => {
        render(<RollNotification activity={null} onDismiss={mockDismiss} />);
        expect(screen.queryByTestId('roll-notification')).not.toBeInTheDocument();
    });

    it('renders roll notification with character name', () => {
        render(<RollNotification activity={baseActivity} onDismiss={mockDismiss} />);
        expect(screen.getByText('Theron')).toBeInTheDocument();
    });

    it('displays the roll total', () => {
        render(<RollNotification activity={baseActivity} onDismiss={mockDismiss} />);
        expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('shows dice breakdown', () => {
        render(<RollNotification activity={baseActivity} onDismiss={mockDismiss} />);
        expect(screen.getByText('[8, 5]')).toBeInTheDocument();
    });

    it('shows With Hope badge for hope rolls', () => {
        render(<RollNotification activity={baseActivity} onDismiss={mockDismiss} />);
        expect(screen.getByText('With Hope')).toBeInTheDocument();
    });

    it('shows With Fear badge for fear rolls', () => {
        const fearActivity = {
            ...baseActivity,
            data: {
                ...baseActivity.data,
                hope_fear: 'fear',
            },
        };
        render(<RollNotification activity={fearActivity as CampaignActivity} onDismiss={mockDismiss} />);
        expect(screen.getByText('With Fear')).toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button is clicked', () => {
        render(<RollNotification activity={baseActivity} onDismiss={mockDismiss} />);
        const dismissButton = screen.getByLabelText('Dismiss notification');
        fireEvent.click(dismissButton);
        expect(mockDismiss).toHaveBeenCalledTimes(1);
    });

    it('auto-dismisses after specified duration', async () => {
        vi.useFakeTimers();
        render(
            <RollNotification
                activity={baseActivity}
                onDismiss={mockDismiss}
                autoDismissMs={5000}
            />
        );

        expect(mockDismiss).not.toHaveBeenCalled();

        // Advance time
        vi.advanceTimersByTime(5000);

        expect(mockDismiss).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });

    it('does not auto-dismiss when autoDismissMs is 0', async () => {
        vi.useFakeTimers();
        render(
            <RollNotification
                activity={baseActivity}
                onDismiss={mockDismiss}
                autoDismissMs={0}
            />
        );

        vi.advanceTimersByTime(10000);

        expect(mockDismiss).not.toHaveBeenCalled();
        vi.useRealTimers();
    });

    it('shows Critical Success for matching dice', () => {
        const criticalActivity: CampaignActivity = {
            ...baseActivity,
            data: {
                ...baseActivity.data,
                dice: [7, 7],
                hope_fear: 'hope',
            },
        } as CampaignActivity;

        render(<RollNotification activity={criticalActivity} onDismiss={mockDismiss} />);
        expect(screen.getByText('Critical Success!')).toBeInTheDocument();
    });

    it('renders damage roll with correct styling', () => {
        const damageActivity: CampaignActivity = {
            ...baseActivity,
            data: {
                roll_type: 'damage',
                dice: [6, 4],
                modifier: 3,
                total: 13,
                description: 'Sword Attack',
            },
        } as CampaignActivity;

        render(<RollNotification activity={damageActivity} onDismiss={mockDismiss} />);
        expect(screen.getByText('Damage')).toBeInTheDocument();
        expect(screen.getByText('13')).toBeInTheDocument();
    });
});
