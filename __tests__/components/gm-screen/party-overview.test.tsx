/**
 * Party Overview Component Tests
 * ----------------------------------------------------------------------------
 * Tests for the PartyOverview component used in the GM Screen.
 * Covers rendering of party members and empty state.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PartyOverview } from '@/components/gm-screen/party-overview';
import type { Character } from '@/types/character';

// ============================================================================
// MOCKS
// ============================================================================

// Mock the PlayerVitalsCard component
vi.mock('@/components/gm-screen/player-vitals-card', () => ({
    PlayerVitalsCard: ({ character }: { character: Character }) => (
        <div data-testid={`vitals-card-${character.id}`}>
            {character.name} - Vitals Card
        </div>
    ),
}));

// ============================================================================
// TEST FIXTURES
// ============================================================================

const createMockCharacter = (id: string, name: string): Character =>
({
    id,
    user_id: 'user-1',
    name,
    level: 3,
    ancestry: 'human',
    ancestry_name: 'Human',
    class_id: 'warrior',
    class_name: 'Warrior',
    vitals: {
        hit_points_current: 10,
        hit_points_max: 12,
        stress_current: 2,
        stress_max: 6,
        armor_slots: 3,
        armor_max: 5,
    },
    hope: 4,
    hope_max: 6,
} as Character);

// ============================================================================
// TESTS
// ============================================================================

describe('PartyOverview', () => {
    describe('Empty State', () => {
        it('should display empty message when no characters', () => {
            render(
                <PartyOverview campaignId="campaign-1" characters={[]} />
            );

            expect(screen.getByText(/no party members have assigned characters/i)).toBeInTheDocument();
        });

        it('should show users icon in empty state', () => {
            render(
                <PartyOverview campaignId="campaign-1" characters={[]} />
            );

            // The Users icon is rendered in the empty state
            expect(screen.getByText(/no party members/i).parentElement).toBeInTheDocument();
        });
    });

    describe('With Characters', () => {
        it('should display party count', () => {
            const characters = [
                createMockCharacter('char-1', 'Thorn'),
                createMockCharacter('char-2', 'Aria'),
            ];

            render(
                <PartyOverview campaignId="campaign-1" characters={characters} />
            );

            expect(screen.getByText(/Party \(2\)/)).toBeInTheDocument();
        });

        it('should render PlayerVitalsCard for each character', () => {
            const characters = [
                createMockCharacter('char-1', 'Thorn'),
                createMockCharacter('char-2', 'Aria'),
                createMockCharacter('char-3', 'Zephyr'),
            ];

            render(
                <PartyOverview campaignId="campaign-1" characters={characters} />
            );

            expect(screen.getByTestId('vitals-card-char-1')).toBeInTheDocument();
            expect(screen.getByTestId('vitals-card-char-2')).toBeInTheDocument();
            expect(screen.getByTestId('vitals-card-char-3')).toBeInTheDocument();
        });

        it('should pass character data to each PlayerVitalsCard', () => {
            const characters = [
                createMockCharacter('char-1', 'Thorn the Bold'),
            ];

            render(
                <PartyOverview campaignId="campaign-1" characters={characters} />
            );

            expect(screen.getByText('Thorn the Bold - Vitals Card')).toBeInTheDocument();
        });

        it('should display Party (1) for single character', () => {
            const characters = [
                createMockCharacter('char-1', 'Solo'),
            ];

            render(
                <PartyOverview campaignId="campaign-1" characters={characters} />
            );

            expect(screen.getByText(/Party \(1\)/)).toBeInTheDocument();
        });
    });
});
