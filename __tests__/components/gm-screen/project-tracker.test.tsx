/**
 * ProjectTracker Component Tests
 * Phase 9 GM Screen - Issue #67
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectTracker } from '@/components/gm-screen/project-tracker';
import { Project } from '@/types/campaign';

describe('ProjectTracker', () => {
    const mockOnAdvance = vi.fn().mockResolvedValue(undefined);
    const mockOnComplete = vi.fn().mockResolvedValue(undefined);
    const mockOnAbandon = vi.fn().mockResolvedValue(undefined);
    const mockOnCreateNew = vi.fn();

    const createProject = (overrides: Partial<Project> = {}): Project => ({
        id: 'proj-1',
        character_id: 'char-1',
        character_name: 'Test Character',
        name: 'Test Project',
        description: 'Test description',
        starting_value: 5,
        current_value: 3,
        advancement_type: 'auto',
        status: 'active',
        created_at: new Date().toISOString(),
        ...overrides,
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('renders empty state when no projects', () => {
            render(
                <ProjectTracker
                    projects={[]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('No active projects')).toBeInTheDocument();
            expect(screen.getByText('Create a project for a player')).toBeInTheDocument();
        });

        it('renders project cards with correct information', () => {
            const project = createProject({ name: 'Crafting a Sword' });

            render(
                <ProjectTracker
                    projects={[project]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('Crafting a Sword')).toBeInTheDocument();
            expect(screen.getByText('Test Character')).toBeInTheDocument();
            expect(screen.getByText('2/5')).toBeInTheDocument(); // Progress: 5-3=2 of 5
        });

        it('shows "Ready!" badge when project countdown reaches 0', () => {
            const readyProject = createProject({
                name: 'Ready Project',
                current_value: 0,
            });

            render(
                <ProjectTracker
                    projects={[readyProject]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('Ready!')).toBeInTheDocument();
        });

        it('shows ready projects alert when projects are ready for completion', () => {
            const readyProject = createProject({ current_value: 0 });

            render(
                <ProjectTracker
                    projects={[readyProject]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText(/1 project ready for completion!/)).toBeInTheDocument();
        });

        it('displays Auto advancement type indicator', () => {
            const autoProject = createProject({ advancement_type: 'auto' });

            render(
                <ProjectTracker
                    projects={[autoProject]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('Auto')).toBeInTheDocument();
        });

        it('displays Roll advancement type indicator', () => {
            const rollProject = createProject({ advancement_type: 'roll' });

            render(
                <ProjectTracker
                    projects={[rollProject]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('Roll')).toBeInTheDocument();
        });

        it('renders correct number of tick boxes based on starting value', () => {
            const project = createProject({
                starting_value: 6,
                current_value: 4,
            });

            render(
                <ProjectTracker
                    projects={[project]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            // Should show 2/6 progress (6-4=2 advances made)
            expect(screen.getByText('2/6')).toBeInTheDocument();
        });
    });

    describe('project statuses', () => {
        it('renders completed project with reduced opacity', () => {
            const completedProject = createProject({
                status: 'completed',
            });

            render(
                <ProjectTracker
                    projects={[completedProject]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('completed')).toBeInTheDocument();
        });

        it('renders abandoned project with reduced opacity', () => {
            const abandonedProject = createProject({
                status: 'abandoned',
            });

            render(
                <ProjectTracker
                    projects={[abandonedProject]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('abandoned')).toBeInTheDocument();
        });

        it('separates completed/abandoned projects from active', () => {
            const activeProject = createProject({
                id: 'active-1',
                name: 'Active Project',
                status: 'active',
            });
            const completedProject = createProject({
                id: 'completed-1',
                name: 'Completed Project',
                status: 'completed',
            });

            render(
                <ProjectTracker
                    projects={[activeProject, completedProject]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('Completed/Abandoned')).toBeInTheDocument();
        });
    });

    describe('interactions', () => {
        it('calls onAdvance when Advance button is clicked', async () => {
            const project = createProject();

            render(
                <ProjectTracker
                    projects={[project]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            const advanceButton = screen.getByText('Advance');
            fireEvent.click(advanceButton);

            await waitFor(() => {
                expect(mockOnAdvance).toHaveBeenCalledWith('proj-1');
            });
        });

        it('shows "Advance (Rolled)" for roll advancement type', () => {
            const rollProject = createProject({ advancement_type: 'roll' });

            render(
                <ProjectTracker
                    projects={[rollProject]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('Advance (Rolled)')).toBeInTheDocument();
        });

        it('calls onCreateNew when New button is clicked', () => {
            render(
                <ProjectTracker
                    projects={[]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            const newButton = screen.getByText('New');
            fireEvent.click(newButton);

            expect(mockOnCreateNew).toHaveBeenCalled();
        });

        it('shows Mark Complete button for ready projects', () => {
            const readyProject = createProject({ current_value: 0 });

            render(
                <ProjectTracker
                    projects={[readyProject]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('Mark Complete')).toBeInTheDocument();
        });

        it('calls onComplete when Mark Complete is clicked', async () => {
            const readyProject = createProject({
                id: 'ready-1',
                current_value: 0,
            });

            render(
                <ProjectTracker
                    projects={[readyProject]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            const completeButton = screen.getByText('Mark Complete');
            fireEvent.click(completeButton);

            await waitFor(() => {
                expect(mockOnComplete).toHaveBeenCalledWith('ready-1');
            });
        });

        it('expands project card when chevron is clicked', () => {
            const project = createProject({ description: 'Detailed description here' });

            render(
                <ProjectTracker
                    projects={[project]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
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

        it('shows Abandon Project button in expanded view', () => {
            const project = createProject();

            render(
                <ProjectTracker
                    projects={[project]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            // Expand the card
            const expandButton = screen.getByRole('button', { name: 'Expand' });
            fireEvent.click(expandButton);

            expect(screen.getByText('Abandon Project')).toBeInTheDocument();
        });

        it('calls onAbandon when Abandon Project is clicked', async () => {
            const project = createProject({ id: 'abandon-1' });

            render(
                <ProjectTracker
                    projects={[project]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            // Expand the card
            const expandButton = screen.getByRole('button', { name: 'Expand' });
            fireEvent.click(expandButton);

            // Click abandon
            const abandonButton = screen.getByText('Abandon Project');
            fireEvent.click(abandonButton);

            await waitFor(() => {
                expect(mockOnAbandon).toHaveBeenCalledWith('abandon-1');
            });
        });
    });

    describe('progress bar', () => {
        it('shows correct progress percentage', () => {
            const project = createProject({
                starting_value: 10,
                current_value: 4, // 6 advances made = 60% progress
            });

            render(
                <ProjectTracker
                    projects={[project]}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            // Progress bar should show 60% width
            const progressBar = document.querySelector('[style*="width: 60%"]');
            expect(progressBar).toBeInTheDocument();
        });
    });

    describe('header', () => {
        it('shows correct count of active projects', () => {
            const projects = [
                createProject({ id: '1', name: 'Project 1', status: 'active' }),
                createProject({ id: '2', name: 'Project 2', status: 'active' }),
                createProject({ id: '3', name: 'Project 3', status: 'completed' }),
            ];

            render(
                <ProjectTracker
                    projects={projects}
                    onAdvance={mockOnAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            expect(screen.getByText('2 active')).toBeInTheDocument();
        });
    });

    describe('loading states', () => {
        it('shows loading state when advancing', async () => {
            const slowAdvance = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
            const project = createProject();

            render(
                <ProjectTracker
                    projects={[project]}
                    onAdvance={slowAdvance}
                    onComplete={mockOnComplete}
                    onAbandon={mockOnAbandon}
                    onCreateNew={mockOnCreateNew}
                />
            );

            const advanceButton = screen.getByText('Advance');
            fireEvent.click(advanceButton);

            // Button should be disabled during loading
            expect(advanceButton).toBeDisabled();
        });
    });
});
