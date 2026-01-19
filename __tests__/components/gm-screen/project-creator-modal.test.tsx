/**
 * ProjectCreatorModal Component Tests
 * Phase 9 GM Screen - Issue #67
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectCreatorModal } from '@/components/gm-screen/project-creator-modal';
import { ProjectInsert } from '@/types/campaign';
import { Character } from '@/types/character';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
            <div {...props}>{children}</div>
        ),
    },
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('ProjectCreatorModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

    const createCharacter = (overrides: Partial<Character> = {}): Character => ({
        id: 'char-1',
        name: 'Test Character',
        level: 1,
        class_id: 'warrior',
        subclass_id: null,
        ancestry_id: 'human',
        community_id: 'wanderer',
        hit_points_current: 6,
        hit_points_max: 6,
        stress_current: 0,
        stress_max: 6,
        armor_score: 0,
        armor_slots: 0,
        hope_current: 2,
        hope_max: 5,
        evasion: 10,
        gold: { handfuls: 0, bags: 0, chests: 0 },
        experiences: [],
        traits: { agility: 0, strength: 1, finesse: 0, instinct: 0, presence: 0, knowledge: 0 },
        inventory: [],
        character_cards: [],
        damage_thresholds: { minor: 1, major: 2, severe: 3 },
        modifiers: {},
        user_id: 'user-1',
        campaign_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides,
    } as Character);

    const partyCharacters = [
        createCharacter({ id: 'char-1', name: 'Thorin', class_id: 'warrior' }),
        createCharacter({ id: 'char-2', name: 'Elara', class_id: 'ranger' }),
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('does not render when isOpen is false', () => {
            render(
                <ProjectCreatorModal
                    isOpen={false}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            expect(screen.queryByText('Create Project')).not.toBeInTheDocument();
        });

        it('renders modal when isOpen is true', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            expect(screen.getByRole('heading', { name: 'Create Project' })).toBeInTheDocument();
        });

        it('renders party character selection', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            expect(screen.getByText('Thorin')).toBeInTheDocument();
            expect(screen.getByText('Elara')).toBeInTheDocument();
        });

        it('shows empty state when no party members', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={[]}
                />
            );

            expect(screen.getByText('No party members available')).toBeInTheDocument();
        });

        it('renders preset value buttons', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            [3, 4, 5, 6, 8, 10].forEach(value => {
                expect(screen.getByRole('button', { name: String(value) })).toBeInTheDocument();
            });
        });

        it('renders advancement type options', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            expect(screen.getByText('Automatic')).toBeInTheDocument();
            expect(screen.getByText('Requires Roll')).toBeInTheDocument();
        });
    });

    describe('form inputs', () => {
        it('allows selecting a character', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            const thorinButton = screen.getByText('Thorin').closest('button');
            fireEvent.click(thorinButton!);

            // Thorin should now be selected
            expect(thorinButton).toHaveClass('bg-dagger-gold/20');
        });

        it('allows entering project name', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            const nameInput = screen.getByPlaceholderText(/Deciphering the Ancient Tome/);
            fireEvent.change(nameInput, { target: { value: 'Crafting a Magic Sword' } });

            expect(nameInput).toHaveValue('Crafting a Magic Sword');
        });

        it('allows entering description', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            const descInput = screen.getByPlaceholderText(/What is the character working on/);
            fireEvent.change(descInput, { target: { value: 'Test description' } });

            expect(descInput).toHaveValue('Test description');
        });

        it('allows selecting starting value from presets', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            const value6Button = screen.getByRole('button', { name: '6' });
            fireEvent.click(value6Button);

            // 6 should now be selected
            expect(value6Button).toHaveClass('bg-dagger-gold/20');
        });

        it('allows entering custom starting value', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            const customInput = screen.getByPlaceholderText('Custom');
            fireEvent.change(customInput, { target: { value: '12' } });

            expect(customInput).toHaveValue(12);
        });

        it('allows selecting advancement type', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            const rollButton = screen.getByText('Requires Roll').closest('button');
            fireEvent.click(rollButton!);

            // Roll option should have the indicator
            expect(rollButton).toHaveClass('bg-orange-500/10');
        });
    });

    describe('form submission', () => {
        it('disables submit button when name is empty', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            const submitButton = screen.getByRole('button', { name: /Create Project/ });
            expect(submitButton).toBeDisabled();
        });

        it('disables submit button when no character is selected', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            // Fill in name but don't select character
            const nameInput = screen.getByPlaceholderText(/Deciphering the Ancient Tome/);
            fireEvent.change(nameInput, { target: { value: 'Test Project' } });

            const submitButton = screen.getByRole('button', { name: /Create Project/ });
            expect(submitButton).toBeDisabled();
        });

        it('enables submit button when name and character are provided', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            // Select character
            const thorinButton = screen.getByText('Thorin').closest('button');
            fireEvent.click(thorinButton!);

            // Fill in name
            const nameInput = screen.getByPlaceholderText(/Deciphering the Ancient Tome/);
            fireEvent.change(nameInput, { target: { value: 'Test Project' } });

            const submitButton = screen.getByRole('button', { name: /Create Project/ });
            expect(submitButton).not.toBeDisabled();
        });

        it('calls onSubmit with correct data when form is submitted', async () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            // Select character
            const thorinButton = screen.getByText('Thorin').closest('button');
            fireEvent.click(thorinButton!);

            // Fill in form
            const nameInput = screen.getByPlaceholderText(/Deciphering the Ancient Tome/);
            fireEvent.change(nameInput, { target: { value: 'Test Project' } });

            const descInput = screen.getByPlaceholderText(/What is the character working on/);
            fireEvent.change(descInput, { target: { value: 'Test description' } });

            // Select value 6
            const value6Button = screen.getByRole('button', { name: '6' });
            fireEvent.click(value6Button);

            // Select roll advancement
            const rollButton = screen.getByText('Requires Roll').closest('button');
            fireEvent.click(rollButton!);

            // Submit
            const submitButton = screen.getByRole('button', { name: /Create Project/ });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith({
                    character_id: 'char-1',
                    character_name: 'Thorin',
                    name: 'Test Project',
                    description: 'Test description',
                    starting_value: 6,
                    advancement_type: 'roll',
                    status: 'active',
                } as ProjectInsert);
            });
        });

        it('calls onClose after successful submission', async () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            // Select character
            const thorinButton = screen.getByText('Thorin').closest('button');
            fireEvent.click(thorinButton!);

            // Fill in name
            const nameInput = screen.getByPlaceholderText(/Deciphering the Ancient Tome/);
            fireEvent.change(nameInput, { target: { value: 'Test Project' } });

            // Submit
            const submitButton = screen.getByRole('button', { name: /Create Project/ });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockOnClose).toHaveBeenCalled();
            });
        });

        it('shows loading state during submission', async () => {
            const slowSubmit = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={slowSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            // Select character
            const thorinButton = screen.getByText('Thorin').closest('button');
            fireEvent.click(thorinButton!);

            // Fill in name
            const nameInput = screen.getByPlaceholderText(/Deciphering the Ancient Tome/);
            fireEvent.change(nameInput, { target: { value: 'Test Project' } });

            // Submit
            const submitButton = screen.getByRole('button', { name: /Create Project/ });
            fireEvent.click(submitButton);

            expect(screen.getByText('Creating...')).toBeInTheDocument();
        });
    });

    describe('close behavior', () => {
        it('calls onClose when Cancel button is clicked', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            const cancelButton = screen.getByRole('button', { name: 'Cancel' });
            fireEvent.click(cancelButton);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('calls onClose when X button is clicked', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            const closeButton = screen.getByRole('button', { name: 'Close' });
            fireEvent.click(closeButton);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('calls onClose when backdrop is clicked', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            // Click on backdrop
            const backdrop = document.querySelector('.bg-black\\/80');
            fireEvent.click(backdrop!);

            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    describe('info box', () => {
        it('shows auto advancement info by default', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            expect(screen.getByText(/Work on a Project.*downtime move/)).toBeInTheDocument();
        });

        it('shows roll requirement info when roll type is selected', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            // Select roll advancement
            const rollButton = screen.getByText('Requires Roll').closest('button');
            fireEvent.click(rollButton!);

            expect(screen.getByText(/if the action roll succeeds/)).toBeInTheDocument();
        });
    });

    describe('character display', () => {
        it('shows character level and class', () => {
            render(
                <ProjectCreatorModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    partyCharacters={partyCharacters}
                />
            );

            expect(screen.getByText(/Lvl 1 warrior/)).toBeInTheDocument();
            expect(screen.getByText(/Lvl 1 ranger/)).toBeInTheDocument();
        });
    });
});
