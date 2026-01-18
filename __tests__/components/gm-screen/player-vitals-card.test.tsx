/**
 * Player Vitals Card Component Tests
 * ----------------------------------------------------------------------------
 * Tests for the PlayerVitalsCard component used in the GM Screen.
 * Covers rendering, lock/unlock, vital adjustments, and warning indicators.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlayerVitalsCard } from '@/components/gm-screen/player-vitals-card';
import type { Character } from '@/types/character';

// ============================================================================
// MOCKS
// ============================================================================

const mockToggleVitalsLock = vi.fn();
const mockGmAdjustVital = vi.fn();
let mockUnlockedCards = new Set<string>();

vi.mock('@/store/character-store', () => ({
    useCharacterStore: () => ({
        unlockedVitalsCards: mockUnlockedCards,
        toggleVitalsLock: mockToggleVitalsLock,
        gmAdjustVital: mockGmAdjustVital,
    }),
}));

// ============================================================================
// TEST FIXTURES
// ============================================================================

const createMockCharacter = (overrides?: Partial<Character>): Character =>
({
    id: 'char-1',
    user_id: 'user-1',
    name: 'Thorn Ironwood',
    level: 3,
    ancestry: 'human',
    ancestry_name: 'Human',
    class_id: 'warrior',
    class_name: 'Warrior',
    community: 'highborne',
    subclass_id: null,
    subclass_name: null,
    vitals: {
        hit_points_current: 8,
        hit_points_max: 12,
        stress_current: 2,
        stress_max: 6,
        armor_slots: 3,
        armor_max: 5,
    },
    hope: 4,
    evasion: 10,
    damage_thresholds: { minor: 3, major: 7, severe: 12 },
    inventory: [],
    cards: [],
    gold: 0,
    experience: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
} as Character);

// ============================================================================
// TESTS
// ============================================================================

describe('PlayerVitalsCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGmAdjustVital.mockResolvedValue(undefined);
        mockUnlockedCards = new Set<string>();
    });

    describe('Rendering', () => {
        it('should render character name and class info', () => {
            const character = createMockCharacter();
            render(<PlayerVitalsCard character={character} />);

            expect(screen.getByText('Thorn Ironwood')).toBeInTheDocument();
            // The actual component uses ancestry (not ancestry_name) and class_id
            expect(screen.getByText(/human warrior/i)).toBeInTheDocument();
            expect(screen.getByText(/Lvl 3/)).toBeInTheDocument();
        });

        it('should render all four vitals', () => {
            const character = createMockCharacter();
            render(<PlayerVitalsCard character={character} />);

            expect(screen.getByText('Hit Points')).toBeInTheDocument();
            expect(screen.getByText('Stress')).toBeInTheDocument();
            expect(screen.getByText('Armor Slots')).toBeInTheDocument();
            expect(screen.getByText('Hope')).toBeInTheDocument();
        });

        it('should display current/max values for each vital', () => {
            const character = createMockCharacter();
            render(<PlayerVitalsCard character={character} />);

            expect(screen.getByText('8/12')).toBeInTheDocument(); // HP
            expect(screen.getByText('2/6')).toBeInTheDocument(); // Stress
            expect(screen.getByText('3/3')).toBeInTheDocument(); // Armor slots (shows same value for both)
            expect(screen.getByText('4/5')).toBeInTheDocument(); // Hope (max is 5 by default)
        });

        it('should show locked icon by default', () => {
            const character = createMockCharacter();
            render(<PlayerVitalsCard character={character} />);

            expect(screen.getByRole('button', { name: /unlock vitals card/i })).toBeInTheDocument();
        });
    });

    describe('Lock/Unlock Behavior', () => {
        it('should call toggleVitalsLock when lock button is clicked', () => {
            const character = createMockCharacter();
            render(<PlayerVitalsCard character={character} />);

            const lockButton = screen.getByRole('button', { name: /unlock vitals card/i });
            fireEvent.click(lockButton);

            expect(mockToggleVitalsLock).toHaveBeenCalledWith('char-1');
        });

        it('should not show adjustment buttons when locked', () => {
            const character = createMockCharacter();
            render(<PlayerVitalsCard character={character} />);

            // Should not find any +/- buttons for vitals when locked
            const decreaseButtons = screen.queryAllByRole('button', { name: /decrease/i });
            const increaseButtons = screen.queryAllByRole('button', { name: /increase/i });

            expect(decreaseButtons).toHaveLength(0);
            expect(increaseButtons).toHaveLength(0);
        });
    });

    describe('Warning Indicators', () => {
        it('should show warning when HP is at or below 33%', () => {
            const character = createMockCharacter({
                vitals: {
                    hit_points_current: 3, // 25% of 12
                    hit_points_max: 12,
                    stress_current: 2,
                    stress_max: 6,
                    armor_slots: 3,
                    armor_max: 5,
                },
            });
            render(<PlayerVitalsCard character={character} />);

            // Check for warning indicator (⚠️ is used for low HP)
            const warningElements = screen.getAllByText('⚠️');
            expect(warningElements.length).toBeGreaterThan(0);
        });

        it('should show warning when Stress is at max - 1 or higher', () => {
            const character = createMockCharacter({
                vitals: {
                    hit_points_current: 12,
                    hit_points_max: 12,
                    stress_current: 5, // max is 6, so 5 triggers warning
                    stress_max: 6,
                    armor_slots: 3,
                    armor_max: 5,
                },
            });
            render(<PlayerVitalsCard character={character} />);

            const warningElements = screen.getAllByText('⚠️');
            expect(warningElements.length).toBeGreaterThan(0);
        });

        it('should show warning when Hope is 1 or less', () => {
            const character = createMockCharacter({
                hope: 1,
            });
            render(<PlayerVitalsCard character={character} />);

            const warningElements = screen.getAllByText('⚠️');
            expect(warningElements.length).toBeGreaterThan(0);
        });

        it('should not show warnings when all vitals are healthy', () => {
            const character = createMockCharacter({
                vitals: {
                    hit_points_current: 10, // Above 33%
                    hit_points_max: 12,
                    stress_current: 2, // Below max - 1
                    stress_max: 6,
                    armor_slots: 3,
                    armor_max: 5,
                },
                hope: 4, // Above 1
            });
            render(<PlayerVitalsCard character={character} />);

            expect(screen.queryByText('⚠️')).not.toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle character with null ancestry gracefully', () => {
            const character = createMockCharacter({
                ancestry: undefined,
                class_id: 'warrior',
            } as any);
            render(<PlayerVitalsCard character={character} />);

            expect(screen.getByText('Thorn Ironwood')).toBeInTheDocument();
        });

        it('should handle character with 0 vitals', () => {
            const character = createMockCharacter({
                vitals: {
                    hit_points_current: 0,
                    hit_points_max: 12,
                    stress_current: 0,
                    stress_max: 6,
                    armor_slots: 0,
                    armor_max: 5,
                },
                hope: 0,
            });
            render(<PlayerVitalsCard character={character} />);

            expect(screen.getByText('0/12')).toBeInTheDocument(); // HP
            expect(screen.getByText('0/6')).toBeInTheDocument(); // Stress
            expect(screen.getByText('0/0')).toBeInTheDocument(); // Armor
            expect(screen.getByText('0/5')).toBeInTheDocument(); // Hope
        });
    });
});

// Test with unlocked card
describe('PlayerVitalsCard (Unlocked)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGmAdjustVital.mockResolvedValue(undefined);
        mockUnlockedCards = new Set(['char-1']);
    });

    it('should show adjustment buttons when unlocked', () => {
        const character = createMockCharacter();
        render(<PlayerVitalsCard character={character} />);

        // When unlocked, should have decrease and increase buttons for each vital
        const decreaseButtons = screen.getAllByRole('button', { name: /decrease/i });
        const increaseButtons = screen.getAllByRole('button', { name: /increase/i });

        // Each vital has 2 decrease buttons (-5, -1) and 2 increase buttons (+1, +5)
        expect(decreaseButtons.length).toBeGreaterThan(0);
        expect(increaseButtons.length).toBeGreaterThan(0);
    });

    it('should call gmAdjustVital when adjustment button is clicked', async () => {
        const character = createMockCharacter();
        render(<PlayerVitalsCard character={character} />);

        // Find and click the "Increase Hit Points by 1" button
        const increaseHpButton = screen.getByRole('button', { name: /increase hit points by 1/i });
        fireEvent.click(increaseHpButton);

        await waitFor(() => {
            expect(mockGmAdjustVital).toHaveBeenCalledWith('char-1', 'hp', 9); // Current 8 + 1 = 9
        });
    });

    it('should disable decrease button when vital is at 0', () => {
        const character = createMockCharacter({
            vitals: {
                hit_points_current: 0,
                hit_points_max: 12,
                stress_current: 2,
                stress_max: 6,
                armor_slots: 3,
                armor_max: 5,
            },
        });
        render(<PlayerVitalsCard character={character} />);

        // The decrease by 1 button for HP should be disabled
        const decreaseHpButton = screen.getByRole('button', { name: /decrease hit points by 1/i });
        expect(decreaseHpButton).toBeDisabled();
    });

    it('should disable increase button when vital is at max', () => {
        const character = createMockCharacter({
            vitals: {
                hit_points_current: 12, // At max
                hit_points_max: 12,
                stress_current: 2,
                stress_max: 6,
                armor_slots: 3,
                armor_max: 5,
            },
        });
        render(<PlayerVitalsCard character={character} />);

        // The increase by 1 button for HP should be disabled
        const increaseHpButton = screen.getByRole('button', { name: /increase hit points by 1/i });
        expect(increaseHpButton).toBeDisabled();
    });
});
