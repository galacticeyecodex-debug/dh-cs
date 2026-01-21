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
const mockToggleProjectsLock = vi.fn();
const mockGmAdjustVital = vi.fn();
const mockFetchProjectsForCharacter = vi.fn().mockResolvedValue(undefined);
const mockSetProjectProgress = vi.fn().mockResolvedValue(undefined);
const mockDeleteProject = vi.fn().mockResolvedValue(undefined);
const mockCreateProject = vi.fn().mockResolvedValue(undefined);

let mockUnlockedCards = new Set<string>();
let mockUnlockedProjectSections = new Set<string>();
let mockCharacterProjects: Record<string, any[]> = {};

vi.mock('@/store/character-store', () => ({
    useCharacterStore: () => ({
        unlockedVitalsCards: mockUnlockedCards,
        toggleVitalsLock: mockToggleVitalsLock,
        unlockedProjectSections: mockUnlockedProjectSections,
        toggleProjectsLock: mockToggleProjectsLock,
        characterProjects: mockCharacterProjects,
        fetchProjectsForCharacter: mockFetchProjectsForCharacter,
        setProjectProgress: mockSetProjectProgress,
        createProject: mockCreateProject,
        gmAdjustVital: mockGmAdjustVital,
        vitalIcons: {},
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
        armor_score: 5,
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
        mockFetchProjectsForCharacter.mockResolvedValue(undefined);
        mockSetProjectProgress.mockResolvedValue(undefined);
        mockDeleteProject.mockResolvedValue(undefined);
        mockCreateProject.mockResolvedValue(undefined);
        mockUnlockedCards = new Set<string>();
        mockUnlockedProjectSections = new Set<string>();
        mockCharacterProjects = {};
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

            expect(screen.getByText('HP')).toBeInTheDocument();
            expect(screen.getByText('Stress')).toBeInTheDocument();
            expect(screen.getByText('Armor')).toBeInTheDocument();
            expect(screen.getByText('Hope')).toBeInTheDocument();
        });

        it('should display current/max values for each vital', () => {
            const character = createMockCharacter();
            render(<PlayerVitalsCard character={character} />);

            expect(screen.getByText('8/12')).toBeInTheDocument(); // HP
            expect(screen.getByText('2/6')).toBeInTheDocument(); // Stress
            expect(screen.getByText('3/5')).toBeInTheDocument(); // Armor (3 slots out of 5 armor_score)
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
                    armor_score: 5,
                },
            });
            render(<PlayerVitalsCard character={character} />);

            // Check for warning indicator (AlertTriangle icon with aria-label)
            expect(screen.getByLabelText('Character needs attention')).toBeInTheDocument();
        });

        it('should show warning when Stress is at max - 1 or higher', () => {
            const character = createMockCharacter({
                vitals: {
                    hit_points_current: 12,
                    hit_points_max: 12,
                    stress_current: 5, // max is 6, so 5 triggers warning
                    stress_max: 6,
                    armor_slots: 3,
                    armor_score: 5,
                },
            });
            render(<PlayerVitalsCard character={character} />);

            expect(screen.getByLabelText('Character needs attention')).toBeInTheDocument();
        });

        it('should show warning when Hope is 1 or less', () => {
            const character = createMockCharacter({
                hope: 1,
            });
            render(<PlayerVitalsCard character={character} />);

            expect(screen.getByLabelText('Character needs attention')).toBeInTheDocument();
        });

        it('should not show warnings when all vitals are healthy', () => {
            const character = createMockCharacter({
                vitals: {
                    hit_points_current: 10, // Above 33%
                    hit_points_max: 12,
                    stress_current: 2, // Below max - 1
                    stress_max: 6,
                    armor_slots: 3,
                    armor_score: 5,
                },
                hope: 4, // Above 1
            });
            render(<PlayerVitalsCard character={character} />);

            expect(screen.queryByLabelText('Character needs attention')).not.toBeInTheDocument();
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
                    armor_score: 4, // Different from hope to distinguish in test
                },
                hope: 0,
            });
            render(<PlayerVitalsCard character={character} />);

            expect(screen.getByText('0/12')).toBeInTheDocument(); // HP
            expect(screen.getByText('0/6')).toBeInTheDocument(); // Stress
            expect(screen.getByText('0/4')).toBeInTheDocument(); // Armor (0 slots out of 4 armor_score)
            expect(screen.getByText('0/5')).toBeInTheDocument(); // Hope (max is always 5)
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

        // When unlocked, should have Mark/Clear buttons for HP/Armor/Stress and Spend/Gain for Hope
        const markButtons = screen.getAllByRole('button', { name: /mark/i });
        const clearButtons = screen.getAllByRole('button', { name: /clear/i });
        const spendButtons = screen.getAllByRole('button', { name: /spend/i });
        const gainButtons = screen.getAllByRole('button', { name: /gain/i });

        // HP, Stress, Armor have Mark/Clear buttons (3 each)
        // Hope has Spend/Gain buttons (1 each)
        expect(markButtons.length).toBe(3); // HP, Stress, Armor
        expect(clearButtons.length).toBe(3); // HP, Stress, Armor
        expect(spendButtons.length).toBe(1); // Hope
        expect(gainButtons.length).toBe(1); // Hope
    });

    it('should call gmAdjustVital when Clear HP button is clicked', async () => {
        const character = createMockCharacter();
        render(<PlayerVitalsCard character={character} />);

        // Find and click the "Clear HP" button (restores 1 HP)
        const clearHpButton = screen.getByRole('button', { name: /clear hp/i });
        fireEvent.click(clearHpButton);

        await waitFor(() => {
            expect(mockGmAdjustVital).toHaveBeenCalledWith('char-1', 'hp', 9); // Current 8 + 1 = 9
        });
    });

    it('should disable Mark HP button when HP is at 0', () => {
        const character = createMockCharacter({
            vitals: {
                hit_points_current: 0,
                hit_points_max: 12,
                stress_current: 2,
                stress_max: 6,
                armor_slots: 3,
                armor_score: 5,
            },
        });
        render(<PlayerVitalsCard character={character} />);

        // The Mark HP button should be disabled when HP is 0
        const markHpButton = screen.getByRole('button', { name: /mark hp/i });
        expect(markHpButton).toBeDisabled();
    });

    it('should disable Clear HP button when HP is at max', () => {
        const character = createMockCharacter({
            vitals: {
                hit_points_current: 12, // At max
                hit_points_max: 12,
                stress_current: 2,
                stress_max: 6,
                armor_slots: 3,
                armor_score: 5,
            },
        });
        render(<PlayerVitalsCard character={character} />);

        // The Clear HP button should be disabled when HP is at max
        const clearHpButton = screen.getByRole('button', { name: /clear hp/i });
        expect(clearHpButton).toBeDisabled();
    });
});
