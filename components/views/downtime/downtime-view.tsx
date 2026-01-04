'use client';

/**
 * DOWNTIME VIEW
 * ----------------------------------------------------------------------------
 * Main view for managing downtime activities including:
 * - Rest type selection (Short/Long rest)
 * - Downtime moves execution
 * - Project tracking with countdown clocks
 * - Study tokens (for enabled homebrew campaigns)
 */

import React, { useEffect } from 'react';
import { useCharacterStore } from '@/store/character-store';
import useContentAccess from '@/hooks/useContentAccess';
import { Moon, Clock, Plus, Check, Trash2, ChevronRight } from 'lucide-react';
import { getAvailableMoves, getMovesForRestType, DOWNTIME_MOVES } from '@/types/downtime';
import type { RestType, DowntimeMove, Project } from '@/types/downtime';
import clsx from 'clsx';

export default function DowntimeView() {
    const {
        currentRest,
        projects,
        projectsLoading,
        startRest,
        endRest,
        useMove,
        fetchProjects,
        advanceProject,
        deleteProject,
    } = useCharacterStore();

    const { enabledCampaigns } = useContentAccess();

    // Fetch projects on mount
    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-dagger-gold/10">
                    <Moon size={28} className="text-dagger-gold" />
                </div>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-white">Downtime</h1>
                    <p className="text-sm text-gray-400">Rest, recover, and work on projects</p>
                </div>
            </div>

            {/* Rest Type Selection or Active Rest */}
            {currentRest ? (
                <ActiveRestPanel
                    restType={currentRest.type}
                    movesRemaining={currentRest.movesRemaining}
                    movesTotal={currentRest.movesTotal}
                    enabledCampaigns={enabledCampaigns}
                    onEndRest={endRest}
                    onUseMove={useMove}
                />
            ) : (
                <RestTypeSelector onStartRest={startRest} />
            )}

            {/* Projects Panel */}
            <ProjectsPanel
                projects={projects}
                loading={projectsLoading}
                onAdvance={advanceProject}
                onDelete={deleteProject}
            />
        </div>
    );
}

// ============================================================================
// REST TYPE SELECTOR
// ============================================================================

function RestTypeSelector({ onStartRest }: { onStartRest: (type: RestType) => void }) {
    return (
        <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Start a Rest</h2>
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => onStartRest('short')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                    <Clock size={32} className="text-amber-400" />
                    <span className="font-medium text-white">Short Rest</span>
                    <span className="text-xs text-gray-400">{getMovesForRestType('short')} moves</span>
                </button>
                <button
                    onClick={() => onStartRest('long')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                    <Moon size={32} className="text-blue-400" />
                    <span className="font-medium text-white">Long Rest</span>
                    <span className="text-xs text-gray-400">{getMovesForRestType('long')} moves</span>
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// ACTIVE REST PANEL
// ============================================================================

interface ActiveRestPanelProps {
    restType: RestType;
    movesRemaining: number;
    movesTotal: number;
    enabledCampaigns: string[];
    onEndRest: () => void;
    onUseMove: () => void;
}

function ActiveRestPanel({
    restType,
    movesRemaining,
    movesTotal,
    enabledCampaigns,
    onEndRest,
    onUseMove,
}: ActiveRestPanelProps) {
    const availableMoves = getAvailableMoves(restType, enabledCampaigns);
    const isComplete = movesRemaining <= 0;

    return (
        <div className="bg-dagger-panel border border-white/10 rounded-xl overflow-hidden">
            {/* Rest Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    {restType === 'short' ? (
                        <Clock size={24} className="text-amber-400" />
                    ) : (
                        <Moon size={24} className="text-blue-400" />
                    )}
                    <div>
                        <h2 className="font-semibold text-white capitalize">{restType} Rest</h2>
                        <p className="text-sm text-gray-400">
                            {movesRemaining} of {movesTotal} moves remaining
                        </p>
                    </div>
                </div>
                <button
                    onClick={onEndRest}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                    {isComplete ? 'Finish Rest' : 'End Early'}
                </button>
            </div>

            {/* Moves Remaining Indicator */}
            <div className="p-4 border-b border-white/10">
                <div className="flex gap-2">
                    {Array.from({ length: movesTotal }).map((_, i) => (
                        <div
                            key={i}
                            className={clsx(
                                'flex-1 h-2 rounded-full transition-colors',
                                i < movesTotal - movesRemaining
                                    ? 'bg-dagger-gold'
                                    : 'bg-white/10'
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Available Moves */}
            <div className="p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Available Moves</h3>
                <div className="grid grid-cols-2 gap-2">
                    {availableMoves.map((move) => (
                        <MoveButton
                            key={move.id}
                            move={move}
                            disabled={isComplete}
                            onUse={onUseMove}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MOVE BUTTON
// ============================================================================

interface MoveButtonProps {
    move: DowntimeMove;
    disabled: boolean;
    onUse: () => void;
}

function MoveButton({ move, disabled, onUse }: MoveButtonProps) {
    const handleClick = () => {
        if (disabled) return;
        // For now, just decrement moves. Full implementation would show modal with roll
        onUse();
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={clsx(
                'flex flex-col items-start p-3 rounded-lg text-left transition-colors',
                disabled
                    ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                    : 'bg-white/5 hover:bg-white/10 text-white'
            )}
        >
            <span className="font-medium text-sm">{move.name}</span>
            <span className="text-xs text-gray-500 mt-1 line-clamp-2">
                {move.rollRequired ? `Roll ${move.rollDice}` : 'No roll required'}
            </span>
        </button>
    );
}

// ============================================================================
// PROJECTS PANEL
// ============================================================================

interface ProjectsPanelProps {
    projects: Project[];
    loading: boolean;
    onAdvance: (id: string) => void;
    onDelete: (id: string) => void;
}

function ProjectsPanel({ projects, loading, onAdvance, onDelete }: ProjectsPanelProps) {
    const activeProjects = projects.filter(p => !p.completed);
    const completedProjects = projects.filter(p => p.completed);

    return (
        <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Projects</h2>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-dagger-gold/10 text-dagger-gold hover:bg-dagger-gold/20 transition-colors">
                    <Plus size={16} />
                    New Project
                </button>
            </div>

            {loading ? (
                <p className="text-gray-400 text-sm py-4 text-center">Loading projects...</p>
            ) : activeProjects.length === 0 && completedProjects.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-400 text-sm mb-2">No projects yet</p>
                    <p className="text-gray-500 text-xs">
                        Use the &quot;Work on a Project&quot; move during a Long Rest to make progress
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Active Projects */}
                    {activeProjects.length > 0 && (
                        <div className="space-y-2">
                            {activeProjects.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onAdvance={onAdvance}
                                    onDelete={onDelete}
                                />
                            ))}
                        </div>
                    )}

                    {/* Completed Projects */}
                    {completedProjects.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <h3 className="text-sm font-medium text-gray-400 mb-2">Completed</h3>
                            <div className="space-y-2">
                                {completedProjects.slice(0, 3).map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onAdvance={onAdvance}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// PROJECT CARD
// ============================================================================

interface ProjectCardProps {
    project: Project;
    onAdvance: (id: string) => void;
    onDelete: (id: string) => void;
}

function ProjectCard({ project, onAdvance, onDelete }: ProjectCardProps) {
    const progress = project.countdown_current / project.countdown_total;

    return (
        <div
            className={clsx(
                'p-3 rounded-lg border transition-colors',
                project.completed
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-white/5 border-white/10'
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        {project.completed && (
                            <Check size={16} className="text-green-500 flex-shrink-0" />
                        )}
                        <span className="font-medium text-white truncate">{project.name}</span>
                    </div>
                    {project.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                            {project.description}
                        </p>
                    )}
                </div>

                {!project.completed && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onAdvance(project.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Advance project"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={() => onDelete(project.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete project"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Countdown Clock */}
            <div className="mt-3 flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                    {Array.from({ length: project.countdown_total }).map((_, i) => (
                        <div
                            key={i}
                            className={clsx(
                                'flex-1 h-2 rounded-full transition-colors',
                                i < project.countdown_current
                                    ? project.completed
                                        ? 'bg-green-500'
                                        : 'bg-dagger-gold'
                                    : 'bg-white/10'
                            )}
                        />
                    ))}
                </div>
                <span className="text-xs text-gray-500">
                    {project.countdown_current}/{project.countdown_total}
                </span>
            </div>
        </div>
    );
}
