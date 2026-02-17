'use client';

/**
 * PLAYER VITALS CARD
 * ----------------------------------------------------------------------------
 * Displays a single player character's vitals on the GM Screen with icon tracks.
 *
 * FUNCTIONALITY:
 * - Shows character name, class, level, and ancestry
 * - Displays HP, Stress, Armor, and Hope with visual icon tracks (like character sheet)
 * - Locked by default - GM must unlock to make adjustments
 * - Warning indicators for low HP, high stress, or low hope
 * - Clear/Mark buttons for adjusting vitals when unlocked
 *
 * TRACK SEMANTICS (matches VitalCard):
 * - HP (mark-bad): current = remaining capacity, marking decreases it
 * - Armor (mark-bad): current = available slots, marking uses them
 * - Stress (fill-up-bad): current = accumulated stress, marking increases it
 * - Hope (fill-up-good): current = available hope, spending decreases it
 */

import { Character } from '@/types/character';
import { useCharacterStore } from '@/store/character-store';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '@/types/downtime';
import { ProjectFormModal } from '@/components/views/downtime/project-modals';
import { getIconByName, VitalId, AppIcons } from '@/lib/icon-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PlayerVitalsCardProps {
    character: Character;
}

type TrackType = 'mark-bad' | 'fill-up-bad' | 'fill-up-good';

interface VitalConfig {
    id: 'hp' | 'stress' | 'armor' | 'hope';
    vitalId: VitalId; // Mapping to SettingsSlice vitalId
    label: string;
    icon: React.ElementType;
    current: number;
    max: number;
    color: string;
    strokeColor?: string;
    trackType: TrackType;
}

export function PlayerVitalsCard({ character }: PlayerVitalsCardProps) {
    const {
        unlockedVitalsCards,
        toggleVitalsLock,
        gmAdjustVital,
        unlockedProjectSections,
        toggleProjectsLock,
        characterProjects,
        fetchProjectsForCharacter,
        setProjectProgress: gmSetProjectProgress,
        deleteProject: gmDeleteProject,
        createProject: gmCreateProject,
        vitalIcons,
        startImpersonation,
        activeCampaign,
    } = useCharacterStore();
    const router = useRouter();
    const isUnlocked = unlockedVitalsCards.has(character.id);
    const isProjectsUnlocked = unlockedProjectSections.has(character.id);

    // Projects section state
    const [isProjectsSectionExpanded, setIsProjectsSectionExpanded] = useState(false);
    const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | undefined>();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);

    // Load projects when section is expanded
    useEffect(() => {
        if (isProjectsSectionExpanded && !characterProjects[character.id]) {
            setIsLoadingProjects(true);
            const loadProjects = async () => {
                try {
                    await fetchProjectsForCharacter(character.id);
                } catch (error) {
                    console.error('Failed to load projects:', error);
                } finally {
                    setIsLoadingProjects(false);
                }
            };
            loadProjects();
        }
    }, [isProjectsSectionExpanded, character.id, fetchProjectsForCharacter, characterProjects]);

    // Update local projects when store updates
    useEffect(() => {
        const charProjects = characterProjects[character.id] || [];
        setProjects(charProjects);
    }, [characterProjects, character.id]);

    // Get vitals from character
    const hitPointsCurrent = character.vitals?.hit_points_current ?? 0;
    const hitPointsMax = character.vitals?.hit_points_max ?? 0;
    const stressCurrent = character.vitals?.stress_current ?? 0;
    const stressMax = character.vitals?.stress_max ?? 6;
    const armorSlots = character.vitals?.armor_slots ?? 0;
    const armorMax = character.vitals?.armor_score ?? 0; // armor_score is the max, armor_slots is current
    const hopeCurrent = character.hope ?? 0;
    const hopeMax = 5;

    const vitalsList: VitalConfig[] = [
        {
            id: 'hp',
            vitalId: 'hitPoints',
            label: 'HP',
            icon: getIconByName(vitalIcons.hitPoints, AppIcons.vitals.hitPoints),
            current: hitPointsCurrent,
            max: hitPointsMax,
            color: 'text-vital-hp',
            strokeColor: 'stroke-vital-hp-stroke',
            trackType: 'mark-bad',
        },
        {
            id: 'stress',
            vitalId: 'stress',
            label: 'Stress',
            icon: getIconByName(vitalIcons.stress, AppIcons.vitals.stress),
            current: stressCurrent,
            max: stressMax,
            color: 'text-vital-stress',
            strokeColor: 'stroke-vital-stress-stroke',
            trackType: 'fill-up-bad',
        },
        {
            id: 'armor',
            vitalId: 'armor',
            label: 'Armor',
            icon: getIconByName(vitalIcons.armor, AppIcons.vitals.armor),
            current: armorSlots,
            max: armorMax,
            color: 'text-vital-armor',
            strokeColor: 'stroke-vital-armor-stroke',
            trackType: 'mark-bad',
        },
        {
            id: 'hope',
            vitalId: 'hope',
            label: 'Hope',
            icon: getIconByName(vitalIcons.hope, AppIcons.vitals.hope),
            current: hopeCurrent,
            max: hopeMax,
            color: 'text-vital-hope',
            strokeColor: 'stroke-vital-hope-stroke',
            trackType: 'fill-up-good',
        },
    ];

    // Handle vital changes based on track type semantics
    const handleVitalChange = async (
        vital: VitalConfig,
        action: 'clear' | 'mark' | 'spend' | 'gain'
    ) => {
        let newValue: number;

        switch (vital.trackType) {
            case 'mark-bad':
                // HP/Armor: current = capacity remaining
                // Clear = restore 1, Mark = lose 1
                if (action === 'clear') {
                    newValue = Math.min(vital.max, vital.current + 1);
                } else {
                    newValue = Math.max(0, vital.current - 1);
                }
                break;
            case 'fill-up-bad':
                // Stress: current = accumulated
                // Clear = remove 1, Mark = add 1
                if (action === 'clear') {
                    newValue = Math.max(0, vital.current - 1);
                } else {
                    newValue = Math.min(vital.max, vital.current + 1);
                }
                break;
            case 'fill-up-good':
                // Hope: current = available
                // Spend = use 1, Gain = add 1
                if (action === 'spend') {
                    newValue = Math.max(0, vital.current - 1);
                } else {
                    newValue = Math.min(vital.max, vital.current + 1);
                }
                break;
            default:
                return;
        }

        await gmAdjustVital(character.id, vital.id, newValue);
    };

    // Render icon track for a vital
    const renderTrack = (vital: VitalConfig) => {
        if (vital.max <= 0) return null;

        const Icon = vital.icon;
        const icons = [];

        // Determine how many are "filled" based on track type
        let filledCount: number;
        if (vital.trackType === 'fill-up-good' || vital.trackType === 'fill-up-bad') {
            // Fill-up: current represents filled icons
            filledCount = vital.current;
        } else {
            // Mark-bad: current is capacity remaining, so filled = max - current (marked/lost)
            filledCount = Math.max(0, vital.max - vital.current);
        }

        // Determine if track is in a "bad" state
        const isFullBad = vital.trackType === 'fill-up-bad' && filledCount >= vital.max;
        const isEmptyBad = vital.trackType === 'mark-bad' && vital.current === 0;
        const isCritical = isFullBad || isEmptyBad;

        for (let i = 0; i < vital.max; i++) {
            const isFilled = i < filledCount;
            const iconColor = isCritical ? 'text-red-500' : vital.color;

            icons.push(
                <Icon
                    key={i}
                    size={14}
                    className={clsx(
                        'transition-all duration-200',
                        isFilled
                            ? clsx(iconColor, 'scale-100', vital.strokeColor)
                            : 'text-white/10 scale-90'
                    )}
                    fill={isFilled ? 'currentColor' : 'none'}
                />
            );
        }

        return (
            <div className="flex flex-wrap gap-0.5">
                {icons}
            </div>
        );
    };

    // Get button labels based on track type
    const getButtonLabels = (trackType: TrackType): { decrease: string; increase: string } => {
        switch (trackType) {
            case 'mark-bad':
                return { decrease: 'Mark', increase: 'Clear' };
            case 'fill-up-bad':
                return { decrease: 'Clear', increase: 'Mark' };
            case 'fill-up-good':
                return { decrease: 'Spend', increase: 'Gain' };
        }
    };

    // Check if buttons should be disabled
    const isDecreaseDisabled = (vital: VitalConfig): boolean => {
        switch (vital.trackType) {
            case 'mark-bad':
                return vital.current === 0; // Can't mark if already at 0
            case 'fill-up-bad':
                return vital.current === 0; // Can't clear if no stress
            case 'fill-up-good':
                return vital.current === 0; // Can't spend if no hope
        }
    };

    const isIncreaseDisabled = (vital: VitalConfig): boolean => {
        switch (vital.trackType) {
            case 'mark-bad':
                return vital.current >= vital.max; // Can't clear if already full
            case 'fill-up-bad':
                return vital.current >= vital.max; // Can't mark if stress is maxed
            case 'fill-up-good':
                return vital.current >= vital.max; // Can't gain if hope is maxed
        }
    };

    // Warning thresholds
    const isHpLow = hitPointsMax > 0 && hitPointsCurrent <= Math.ceil(hitPointsMax * 0.33);
    const isStressHigh = stressMax > 0 && stressCurrent >= stressMax - 1;
    const isHopeLow = hopeCurrent <= 1;
    const hasWarning = isHpLow || isStressHigh || isHopeLow;

    // Display names
    const ancestryDisplay = character.ancestry || 'Unknown';
    const classDisplay = character.class_id || 'Unknown';

    // Handle project creation/editing
    const handleProjectSubmit = async (data: any) => {
        if (editingProject) {
            // Edit existing project
            await gmCreateProject({ ...data, character_id: character.id, id: editingProject.id } as any);
        } else {
            // Create new project
            await gmCreateProject({ ...data, character_id: character.id });
        }
        setEditingProject(undefined);
        // Refresh projects list
        const charProjects = characterProjects[character.id] || [];
        setProjects(charProjects);
    };

    const handleDeleteProject = async (projectId: string) => {
        if (confirm('Delete this project?')) {
            await gmDeleteProject(projectId);
            setProjects(projects.filter(p => p.id !== projectId));
        }
    };

    const handleProjectProgressChange = async (projectId: string, newProgress: number) => {
        await gmSetProjectProgress(projectId, newProgress);
        const charProjects = characterProjects[character.id] || [];
        setProjects(charProjects);
    };

    return (
        <div
            className={clsx(
                'bg-dagger-panel border rounded-xl p-4 transition-all duration-200 min-w-0 w-full',
                hasWarning ? 'border-orange-500/50 shadow-lg shadow-orange-500/10' : 'border-white/10',
                isUnlocked && 'ring-2 ring-green-500/50'
            )}
        >
            {/* Header */}
            <div className="flex items-start gap-2 mb-3">
                <Avatar className="h-10 w-10 border border-white/10 flex-shrink-0">
                    <AvatarImage src={character.image_url || '/images/portrait-placeholder.jpg'} alt={character.name} className="object-cover" />
                    <AvatarFallback className="bg-dagger-panel-hover text-dagger-gold text-[10px]">
                        {character.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-serif font-bold text-white truncate leading-tight">{character.name}</h3>
                        {hasWarning && (
                            <AppIcons.system.warning
                                className="w-4 h-4 text-orange-500 flex-shrink-0"
                                aria-label="Character needs attention"
                            />
                        )}
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">
                        {ancestryDisplay} {classDisplay} (Lvl {character.level})
                    </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={() => {
                            const member = activeCampaign?.members?.find(
                                (m) => m.character_id === character.id
                            );
                            const playerName = member?.nickname || member?.profile?.username || 'Player';
                            startImpersonation(character, playerName);
                            router.push('/client');
                        }}
                        className="p-2 rounded-lg transition-colors bg-white/5 text-gray-500 hover:bg-amber-500/20 hover:text-amber-400"
                        aria-label="View as player"
                        title="View full character sheet"
                    >
                        <AppIcons.campaign.impersonate className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => toggleVitalsLock(character.id)}
                        className={clsx(
                            'p-2 rounded-lg transition-colors',
                            isUnlocked
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : 'bg-white/5 text-gray-500 hover:bg-white/10'
                        )}
                        aria-label={isUnlocked ? 'Lock vitals card' : 'Unlock vitals card'}
                    >
                        {isUnlocked ? (
                            <AppIcons.ui.unlock className="w-4 h-4" />
                        ) : (
                            <AppIcons.ui.lock className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Vitals Grid - 2x2 layout */}
            <div className="grid grid-cols-2 gap-3">
                {vitalsList.map((vital) => {
                    const Icon = vital.icon;
                    const buttonLabels = getButtonLabels(vital.trackType);
                    const isLow =
                        (vital.id === 'hp' && isHpLow) ||
                        (vital.id === 'stress' && isStressHigh) ||
                        (vital.id === 'hope' && isHopeLow);

                    return (
                        <div
                            key={vital.id}
                            className={clsx(
                                'bg-black/20 rounded-lg p-2',
                                isLow && 'ring-1 ring-orange-500/50'
                            )}
                        >
                            {/* Vital Header */}
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1">
                                    <Icon size={12} className={vital.color} />
                                    <span className={clsx('text-[10px] font-bold uppercase tracking-wide', vital.color)}>
                                        {vital.label}
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-500 tabular-nums">
                                    {vital.current}/{vital.max}
                                </span>
                            </div>

                            {/* Icon Track */}
                            <div className="min-h-[18px] mb-1.5">
                                {vital.max > 0 ? renderTrack(vital) : (
                                    <span className="text-[10px] text-gray-600 italic">None</span>
                                )}
                            </div>

                            {/* Action Buttons (only when unlocked) */}
                            {isUnlocked && vital.max > 0 && (
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleVitalChange(
                                            vital,
                                            vital.trackType === 'fill-up-good' ? 'spend' : 'mark'
                                        )}
                                        disabled={isDecreaseDisabled(vital)}
                                        className="flex-1 h-5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded text-[9px] font-bold uppercase tracking-wider text-gray-400 transition-colors"
                                        aria-label={`${buttonLabels.decrease} ${vital.label}`}
                                    >
                                        {buttonLabels.decrease}
                                    </button>
                                    <button
                                        onClick={() => handleVitalChange(
                                            vital,
                                            vital.trackType === 'fill-up-good' ? 'gain' : 'clear'
                                        )}
                                        disabled={isIncreaseDisabled(vital)}
                                        className="flex-1 h-5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded text-[9px] font-bold uppercase tracking-wider text-gray-400 transition-colors"
                                        aria-label={`${buttonLabels.increase} ${vital.label}`}
                                    >
                                        {buttonLabels.increase}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Projects Section */}
            <div className="mt-4 pt-4 border-t border-white/10">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-3">
                    <button
                        onClick={() => setIsProjectsSectionExpanded(!isProjectsSectionExpanded)}
                        className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 tracking-wider hover:text-gray-400 transition-colors"
                    >
                        {isProjectsSectionExpanded ? (
                            <AppIcons.ui.collapse size={14} />
                        ) : (
                            <AppIcons.ui.expand size={14} />
                        )}
                        Projects {projects.length > 0 && `(${projects.length})`}
                    </button>
                    <button
                        onClick={() => toggleProjectsLock(character.id)}
                        className={clsx(
                            'p-1 rounded transition-colors',
                            isProjectsUnlocked
                                ? 'text-green-400 hover:bg-green-500/20'
                                : 'text-gray-500 hover:bg-white/5'
                        )}
                        aria-label={isProjectsUnlocked ? 'Lock projects' : 'Unlock projects'}
                        title={isProjectsUnlocked ? 'Projects unlocked' : 'Projects locked'}
                    >
                        {isProjectsUnlocked ? (
                            <AppIcons.ui.unlock className="w-3 h-3" />
                        ) : (
                            <AppIcons.ui.lock className="w-3 h-3" />
                        )}
                    </button>
                </div>

                {/* Projects Content */}
                {isProjectsSectionExpanded && (
                    <div className="space-y-2">
                        {isLoadingProjects ? (
                            <div className="text-center py-3 text-xs text-gray-500">Loading...</div>
                        ) : projects.length === 0 ? (
                            <div className="text-center py-3 text-xs text-gray-600">No projects</div>
                        ) : (
                            <div className="space-y-2">
                                {projects.filter(p => !p.completed).map((project) => (
                                    <div
                                        key={project.id}
                                        className="bg-black/40 rounded-lg p-2 border border-white/5"
                                    >
                                        {/* Project Name & Controls */}
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-white truncate">
                                                    {project.name}
                                                </p>
                                            </div>
                                            {isProjectsUnlocked && (
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <button
                                                        onClick={() => setEditingProject(project)}
                                                        className="p-1 text-blue-400 hover:bg-white/10 rounded transition-colors"
                                                        aria-label="Edit project"
                                                        title="Edit"
                                                    >
                                                        <AppIcons.ui.edit size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProject(project.id)}
                                                        className="p-1 text-red-400 hover:bg-white/10 rounded transition-colors"
                                                        aria-label="Delete project"
                                                        title="Delete"
                                                    >
                                                        <AppIcons.ui.delete size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Progress Bar & Count */}
                                        <div className="mb-1.5">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-dagger-gold transition-all"
                                                        style={{
                                                            width: `${(project.countdown_current / project.countdown_total) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="ml-2 text-[9px] text-gray-500 tabular-nums whitespace-nowrap">
                                                    {project.countdown_current}/{project.countdown_total}
                                                </span>
                                            </div>
                                        </div>

                                        {/* +/- Buttons (only when unlocked) */}
                                        {isProjectsUnlocked && (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() =>
                                                        handleProjectProgressChange(
                                                            project.id,
                                                            Math.max(0, project.countdown_current - 1)
                                                        )
                                                    }
                                                    disabled={project.countdown_current === 0}
                                                    className="flex-1 h-5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded text-[9px] font-bold uppercase tracking-wider text-gray-400 transition-colors"
                                                    aria-label="Decrease progress"
                                                >
                                                    -
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleProjectProgressChange(
                                                            project.id,
                                                            Math.min(
                                                                project.countdown_total,
                                                                project.countdown_current + 1
                                                            )
                                                        )
                                                    }
                                                    disabled={project.countdown_current >= project.countdown_total}
                                                    className="flex-1 h-5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded text-[9px] font-bold uppercase tracking-wider text-gray-400 transition-colors"
                                                    aria-label="Increase progress"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Create Project Button */}
                        {isProjectsUnlocked && (
                            <button
                                onClick={() => {
                                    setEditingProject(undefined);
                                    setIsProjectFormOpen(true);
                                }}
                                className="w-full h-8 flex items-center justify-center gap-1 text-xs font-bold uppercase tracking-wider text-dagger-gold hover:text-white hover:bg-dagger-gold/10 border border-dagger-gold/30 hover:border-dagger-gold/50 rounded transition-colors"
                            >
                                <AppIcons.ui.add size={12} />
                                Create Project
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Project Form Modal */}
            <ProjectFormModal
                isOpen={isProjectFormOpen || editingProject !== undefined}
                onClose={() => {
                    setIsProjectFormOpen(false);
                    setEditingProject(undefined);
                }}
                onSubmit={handleProjectSubmit}
                initialData={editingProject}
            />
        </div>
    );
}
