'use client';

/**
 * PROJECT TRACKER
 * ----------------------------------------------------------------------------
 * Displays and manages player projects on the GM Screen.
 *
 * FEATURES:
 * - Shows all active projects grouped by character
 * - Visual countdown track for each project
 * - Advance button (auto or roll-based)
 * - Complete/abandon options
 * - Activity logging
 */

import { useState } from 'react';
import {
    Hammer,
    Plus,
    Minus,
    Trash2,
    User,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    Clock,
    Dices,
    XCircle
} from 'lucide-react';
import { Project, ProjectStatus } from '@/types/campaign';
import clsx from 'clsx';

interface ProjectTrackerProps {
    projects: Project[];
    onAdvance: (projectId: string) => Promise<void>;
    onComplete: (projectId: string) => Promise<void>;
    onAbandon: (projectId: string) => Promise<void>;
    onCreateNew: () => void;
}

const STATUS_COLORS: Record<ProjectStatus, { bg: string; border: string; text: string }> = {
    pending: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    active: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
    completed: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
    abandoned: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400' },
};

function ProjectCard({
    project,
    onAdvance,
    onComplete,
    onAbandon,
}: {
    project: Project;
    onAdvance: () => Promise<void>;
    onComplete: () => Promise<void>;
    onAbandon: () => Promise<void>;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const colors = STATUS_COLORS[project.status];
    const isComplete = project.current_value <= 0;
    const progress = ((project.starting_value - project.current_value) / project.starting_value) * 100;

    const handleAdvance = async () => {
        setIsLoading(true);
        try {
            await onAdvance();
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);
        try {
            await onComplete();
        } finally {
            setIsLoading(false);
        }
    };

    const handleAbandon = async () => {
        setIsLoading(true);
        try {
            await onAbandon();
        } finally {
            setIsLoading(false);
        }
    };

    // Render tick boxes
    const renderTrack = () => {
        const boxes = [];
        const remaining = project.current_value;
        const total = project.starting_value;

        for (let i = 0; i < total; i++) {
            const isFilled = i >= remaining; // Filled boxes represent completed progress
            boxes.push(
                <div
                    key={i}
                    className={clsx(
                        "w-4 h-4 rounded border-2 transition-all",
                        isFilled
                            ? "bg-orange-400 border-orange-400"
                            : "border-orange-400/40"
                    )}
                />
            );
        }

        return (
            <div className="flex flex-wrap gap-1">
                {boxes}
            </div>
        );
    };

    if (project.status === 'completed' || project.status === 'abandoned') {
        return (
            <div className={clsx(
                "rounded-lg border p-3 opacity-60",
                colors.bg,
                colors.border
            )}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {project.status === 'completed' ? (
                            <CheckCircle size={14} className="text-green-400" />
                        ) : (
                            <XCircle size={14} className="text-gray-400" />
                        )}
                        <span className="font-medium text-white text-sm">{project.name}</span>
                    </div>
                    <span className={clsx("text-xs capitalize", colors.text)}>
                        {project.status}
                    </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    {project.character_name}
                </div>
            </div>
        );
    }

    return (
        <div className={clsx(
            "rounded-lg border transition-all",
            isComplete ? "ring-2 ring-green-500/50" : "",
            colors.bg,
            colors.border
        )}>
            {/* Header */}
            <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <Hammer size={14} className="text-orange-400" />
                            <span className="font-medium text-white truncate">{project.name}</span>
                            {isComplete && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-green-500 text-black rounded">
                                    Ready!
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                                <User size={10} />
                                {project.character_name}
                            </span>
                            <span className="flex items-center gap-1">
                                {project.advancement_type === 'auto' ? (
                                    <>
                                        <Clock size={10} />
                                        Auto
                                    </>
                                ) : (
                                    <>
                                        <Dices size={10} />
                                        Roll
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-lg font-bold tabular-nums text-orange-400">
                            {project.starting_value - project.current_value}/{project.starting_value}
                        </span>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>
                </div>

                {/* Progress Track */}
                <div className="mt-2">
                    {renderTrack()}
                </div>

                {/* Progress Bar */}
                <div className="mt-2 h-1.5 bg-black/30 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-orange-400 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 mt-3">
                    {isComplete ? (
                        <button
                            onClick={handleComplete}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs font-medium transition-colors disabled:opacity-50"
                        >
                            <CheckCircle size={12} />
                            {isLoading ? 'Completing...' : 'Mark Complete'}
                        </button>
                    ) : (
                        <button
                            onClick={handleAdvance}
                            disabled={isLoading || project.current_value <= 0}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs font-medium transition-colors disabled:opacity-50"
                        >
                            <Minus size={12} />
                            {project.advancement_type === 'roll' ? 'Advance (Rolled)' : 'Advance'}
                        </button>
                    )}
                </div>
            </div>

            {/* Expanded Section */}
            {isExpanded && (
                <div className="px-3 pb-3 border-t border-white/5 pt-3 space-y-3">
                    {project.description && (
                        <p className="text-xs text-gray-400">{project.description}</p>
                    )}

                    <div className="text-xs text-gray-500">
                        <div>Started: {new Date(project.created_at).toLocaleDateString()}</div>
                        <div>Progress: {project.starting_value - project.current_value} of {project.starting_value} advances</div>
                    </div>

                    {/* Abandon */}
                    <button
                        onClick={handleAbandon}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs font-medium transition-colors disabled:opacity-50"
                    >
                        <Trash2 size={12} />
                        {isLoading ? 'Abandoning...' : 'Abandon Project'}
                    </button>
                </div>
            )}
        </div>
    );
}

export function ProjectTracker({
    projects,
    onAdvance,
    onComplete,
    onAbandon,
    onCreateNew,
}: ProjectTrackerProps) {
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'pending');
    const completedProjects = projects.filter(p => p.status === 'completed' || p.status === 'abandoned');
    const readyProjects = activeProjects.filter(p => p.current_value <= 0);

    return (
        <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-orange-500/20">
                        <Hammer className="w-5 h-5 text-orange-400" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="text-base font-serif font-bold text-white">Projects</h2>
                        <p className="text-[10px] text-gray-500">
                            {activeProjects.length} active
                        </p>
                    </div>
                </div>
                <button
                    onClick={onCreateNew}
                    className="flex items-center gap-1 px-3 py-1.5 bg-dagger-gold/10 hover:bg-dagger-gold/20 text-dagger-gold rounded-lg text-xs font-medium transition-colors"
                >
                    <Plus size={14} />
                    New
                </button>
            </div>

            {/* Ready Projects Alert */}
            {readyProjects.length > 0 && (
                <div className="flex items-center gap-2 p-2 mb-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <CheckCircle size={14} className="text-green-400" />
                    <span className="text-xs text-green-400 font-medium">
                        {readyProjects.length} project{readyProjects.length > 1 ? 's' : ''} ready for completion!
                    </span>
                </div>
            )}

            {/* Projects List */}
            {projects.length === 0 ? (
                <div className="text-center py-6">
                    <Hammer size={24} className="mx-auto mb-2 text-gray-600" />
                    <p className="text-sm text-gray-500">No active projects</p>
                    <button
                        onClick={onCreateNew}
                        className="mt-2 text-xs text-dagger-gold hover:underline"
                    >
                        Create a project for a player
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Active projects first */}
                    {activeProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onAdvance={() => onAdvance(project.id)}
                            onComplete={() => onComplete(project.id)}
                            onAbandon={() => onAbandon(project.id)}
                        />
                    ))}

                    {/* Completed/abandoned projects */}
                    {completedProjects.length > 0 && (
                        <div className="pt-2 border-t border-white/5">
                            <div className="text-xs text-gray-500 mb-2">Completed/Abandoned</div>
                            {completedProjects.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onAdvance={() => Promise.resolve()}
                                    onComplete={() => Promise.resolve()}
                                    onAbandon={() => Promise.resolve()}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
