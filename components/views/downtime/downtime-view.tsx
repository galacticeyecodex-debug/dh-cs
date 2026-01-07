'use client';

/**
 * DOWNTIME VIEW
 * ----------------------------------------------------------------------------
 * Main view for managing downtime activities including:
 * - Rest type selection (Short/Long rest)
 * - Downtime moves execution with 3D dice rolling
 * - Project tracking with countdown clocks
 * - Study tokens (for enabled homebrew campaigns)
 * 
 * MECHANICS (from SRD):
 * - Short Rest: 2 moves, roll 1d4+Tier for healing/clearing
 * - Long Rest: 2 moves, full recovery options available
 * - Prepare: Solo = 1 Hope, With Party = 2 Hope each
 * - Tend to Wounds / Repair Armor: Can target self OR ally
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useCharacterStore } from '@/store/character-store';
import useContentAccess from '@/hooks/useContentAccess';
import { Moon, Clock, Plus, Check, Trash2, ChevronRight, Settings, Pencil, Dices, Users, User, Heart, Zap, Shield, Minus } from 'lucide-react';
import { getAvailableMoves, getMovesForRestType } from '@/types/downtime';
import type { RestType, DowntimeMove, Project, CreateProjectInput } from '@/types/downtime';
import { clsx } from 'clsx';
import { ProjectFormModal, WorkOnProjectModal } from './project-modals';
import { toast } from 'sonner';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DowntimeView() {
    const {
        currentRest,
        projects,
        projectsLoading,
        startRest,
        endRest,
        useMove: executeMove,
        fetchProjects,
        createProject,
        updateProject,
        advanceProject,
        setProjectProgress,
        deleteProject,
    } = useCharacterStore();

    const { enabledCampaigns } = useContentAccess();

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [isManageMode, setIsManageMode] = useState(false);

    // Fetch projects on mount
    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Handlers
    const handleWorkOnProjectMove = () => {
        setIsWorkModalOpen(true);
    };

    const handleSelectProjectToWork = async (projectId: string) => {
        await advanceProject(projectId);
        executeMove();
    };

    const handleCreateProject = async (data: CreateProjectInput) => {
        await createProject(data);
    };

    const handleUpdateProject = async (data: CreateProjectInput) => {
        if (!editingProject) return;
        await updateProject(editingProject.id, data);
        setEditingProject(null);
    };

    return (
        <div className="p-4 space-y-6 pb-20">
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
                    onUseMove={executeMove}
                    onWorkOnProject={handleWorkOnProjectMove}
                />
            ) : (
                <RestTypeSelector onStartRest={startRest} />
            )}

            {/* Projects Panel */}
            <ProjectsPanel
                projects={projects}
                loading={projectsLoading}
                isManageMode={isManageMode}
                onToggleManage={() => setIsManageMode(!isManageMode)}
                onCreateClick={() => setIsCreateModalOpen(true)}
                onEditClick={setEditingProject}
                onSetProgress={setProjectProgress}
                onDelete={deleteProject}
            />

            {/* Modals */}
            <ProjectFormModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateProject}
            />

            <ProjectFormModal
                isOpen={!!editingProject}
                onClose={() => setEditingProject(null)}
                onSubmit={handleUpdateProject}
                initialData={editingProject || undefined}
            />

            <WorkOnProjectModal
                isOpen={isWorkModalOpen}
                onClose={() => setIsWorkModalOpen(false)}
                projects={projects}
                onSelect={handleSelectProjectToWork}
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

type TargetType = 'self' | 'ally';

interface ActiveRestPanelProps {
    restType: RestType;
    movesRemaining: number;
    movesTotal: number;
    enabledCampaigns: string[];
    onEndRest: () => void;
    onUseMove: () => void;
    onWorkOnProject: () => void;
}

function ActiveRestPanel({
    restType,
    movesRemaining,
    movesTotal,
    enabledCampaigns,
    onEndRest,
    onUseMove,
    onWorkOnProject,
}: ActiveRestPanelProps) {
    const availableMoves = getAvailableMoves(restType, enabledCampaigns);
    const isComplete = movesRemaining <= 0;

    const { character, updateVitals, updateHope, prepareRoll, lastRollResult, setLastRollResult, isDiceOverlayOpen } = useCharacterStore();

    // State for tracking pending moves and target
    const [pendingMove, setPendingMove] = useState<DowntimeMove | null>(null);
    const [pendingTarget, setPendingTarget] = useState<TargetType>('self');
    const [isAwaitingRoll, setIsAwaitingRoll] = useState(false);
    const [capturedRollResult, setCapturedRollResult] = useState<number | null>(null);

    // State for modals
    const [showPrepareModal, setShowPrepareModal] = useState(false);
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [targetMoveType, setTargetMoveType] = useState<'tend_wounds' | 'repair_armor' | null>(null);

    // Calculate character tier (level / 2, rounded up, min 1)
    const characterTier = character ? Math.max(1, Math.ceil(character.level / 2)) : 1;

    // Current resource values for display
    const currentHp = character?.vitals.hit_points_current || 0;
    const maxHp = character?.vitals.hit_points_max || 0;
    const markedHp = maxHp - currentHp;

    const currentStress = character?.vitals.stress_current || 0;
    const maxStress = character?.vitals.stress_max || 6;

    const currentArmorSlots = character?.vitals.armor_slots || 0;
    const maxArmorSlots = character?.vitals.armor_score || 0;
    const markedArmorSlots = maxArmorSlots - currentArmorSlots;

    const currentHope = character?.hope || 0;

    // Watch for dice roll results from the 3D dice overlay
    useEffect(() => {
        if (!isAwaitingRoll || !lastRollResult || !pendingMove || !character) return;

        // Check if this is a damage/custom roll (our downtime rolls)
        if (lastRollResult.type !== 'Damage') return;

        const rollTotal = lastRollResult.total;

        // Capture the result and clear global state
        setCapturedRollResult(rollTotal);
        setIsAwaitingRoll(false);
        setLastRollResult(null);
    }, [lastRollResult, isAwaitingRoll, pendingMove, character, setLastRollResult]);

    // Apply the captured result when the dice overlay is closed
    useEffect(() => {
        // Only apply when we have a result AND the overlay is closed
        if (capturedRollResult === null || !pendingMove || !character || isDiceOverlayOpen) return;

        const applyResult = async () => {
            const rollTotal = capturedRollResult;
            const move = pendingMove;
            const target = pendingTarget;

            // Clear captured state
            setCapturedRollResult(null);
            setPendingMove(null);

            if (target === 'ally') {
                // For ally, just show the result - player applies manually
                if (move.id === 'tend_wounds') {
                    toast.success(`Roll result: ${rollTotal} HP to heal on ally`);
                } else if (move.id === 'repair_armor') {
                    toast.success(`Roll result: ${rollTotal} Armor Slots to repair on ally`);
                } else if (move.id === 'clear_stress') {
                    toast.success(`Roll result: ${rollTotal} Stress to clear`);
                }
            } else {
                // For self, apply automatically
                if (move.id === 'tend_wounds') {
                    const newHp = Math.min(maxHp, currentHp + rollTotal);
                    await updateVitals('hit_points_current', newHp);
                    toast.success(`Healed ${rollTotal} Hit Points`);
                } else if (move.id === 'clear_stress') {
                    const newStress = Math.max(0, currentStress - rollTotal);
                    await updateVitals('stress_current', newStress);
                    toast.success(`Cleared ${rollTotal} Stress`);
                } else if (move.id === 'repair_armor') {
                    const newSlots = Math.min(maxArmorSlots, currentArmorSlots + rollTotal);
                    await updateVitals('armor_slots', newSlots);
                    toast.success(`Repaired ${rollTotal} Armor Slots`);
                }
            }
            onUseMove();
        };

        applyResult();
    }, [capturedRollResult, pendingMove, pendingTarget, character, currentHp, maxHp, currentStress, currentArmorSlots, maxArmorSlots, onUseMove, updateVitals, isDiceOverlayOpen]);

    // Handle move click
    const handleMoveClick = (move: DowntimeMove) => {
        if (isComplete || !character) return;

        // Special handling for Prepare - show options modal
        if (move.id === 'prepare') {
            setShowPrepareModal(true);
            return;
        }

        // For moves that can target self or ally, show target selection
        if (move.id === 'tend_wounds' || move.id === 'repair_armor') {
            setTargetMoveType(move.id);
            setPendingMove(move);
            setShowTargetModal(true);
            return;
        }

        // For no-roll moves, execute immediately
        if (!move.rollRequired) {
            executeNoRollMove(move);
            return;
        }

        // For roll-required moves (like clear_stress which only affects self)
        startRollForMove(move, 'self');
    };

    // Start the dice roll process
    const startRollForMove = (move: DowntimeMove, target: TargetType) => {
        setPendingMove(move);
        setPendingTarget(target);
        setIsAwaitingRoll(true);
        setShowTargetModal(false);

        // Roll 1d4 + Tier modifier
        prepareRoll(move.name, characterTier, '1d4', '#d4af37'); // Gold dice for healing/utility
    };

    // Handle target selection
    const handleTargetSelect = (target: TargetType) => {
        if (!pendingMove) return;
        startRollForMove(pendingMove, target);
    };

    // Handle Prepare choice
    const handlePrepareChoice = async (withParty: boolean) => {
        if (!character) return;

        const hopeGain = withParty ? 2 : 1;
        await updateHope(currentHope + hopeGain);

        if (withParty) {
            toast.success("Gained 2 Hope (prepared with party)");
        } else {
            toast.success("Gained 1 Hope");
        }

        onUseMove();
        setShowPrepareModal(false);
    };

    // Execute moves that don't require rolling
    const executeNoRollMove = async (move: DowntimeMove) => {
        if (!character) return;

        if (move.id === 'work_on_project') {
            onWorkOnProject();
            return;
        }

        if (move.id === 'tend_all_wounds') {
            await updateVitals('hit_points_current', maxHp);
            toast.success("Fully recovered Hit Points");
            onUseMove();
        } else if (move.id === 'clear_all_stress') {
            await updateVitals('stress_current', 0);
            toast.success("Cleared all Stress");
            onUseMove();
        } else if (move.id === 'repair_all_armor') {
            await updateVitals('armor_slots', maxArmorSlots);
            toast.success("Repaired all Armor Slots");
            onUseMove();
        } else {
            // Generic no-roll move
            toast.success(`Performed ${move.name}`);
            onUseMove();
        }
    };

    // Get resource display for a move
    const getResourceDisplay = (move: DowntimeMove) => {
        switch (move.id) {
            case 'tend_wounds':
            case 'tend_all_wounds':
                return {
                    icon: Heart,
                    current: markedHp,
                    max: maxHp,
                    label: 'Marked HP',
                    color: 'text-red-400',
                    bgColor: 'bg-red-500/20'
                };
            case 'clear_stress':
            case 'clear_all_stress':
                return {
                    icon: Zap,
                    current: currentStress,
                    max: maxStress,
                    label: 'Stress',
                    color: 'text-purple-400',
                    bgColor: 'bg-purple-500/20'
                };
            case 'repair_armor':
            case 'repair_all_armor':
                return {
                    icon: Shield,
                    current: markedArmorSlots,
                    max: maxArmorSlots,
                    label: 'Marked Slots',
                    color: 'text-blue-400',
                    bgColor: 'bg-blue-500/20'
                };
            case 'prepare':
                return {
                    icon: Heart,
                    current: currentHope,
                    max: null,
                    label: 'Hope',
                    color: 'text-dagger-gold',
                    bgColor: 'bg-dagger-gold/20'
                };
            default:
                return null;
        }
    };

    return (
        <>
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
                    <div className="space-y-2">
                        {availableMoves.map((move) => {
                            const resourceInfo = getResourceDisplay(move);
                            const ResourceIcon = resourceInfo?.icon;

                            return (
                                <button
                                    key={move.id}
                                    onClick={() => handleMoveClick(move)}
                                    disabled={isComplete}
                                    className={clsx(
                                        'w-full flex items-center justify-between p-4 rounded-lg text-left transition-all duration-200 border',
                                        isComplete
                                            ? 'bg-white/5 border-transparent text-gray-600 cursor-not-allowed'
                                            : 'bg-white/5 border-transparent hover:bg-dagger-gold/10 hover:border-dagger-gold/30 text-white active:scale-[0.98]'
                                    )}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium">{move.name}</span>
                                            {move.rollRequired && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-dagger-gold/20 text-dagger-gold font-bold">
                                                    1d4+{characterTier}
                                                </span>
                                            )}
                                            {move.id === 'prepare' && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                                                    +1 or +2 Hope
                                                </span>
                                            )}
                                            {(move.id === 'tend_wounds' || move.id === 'repair_armor') && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold">
                                                    Self or Ally
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 mt-1 block">
                                            {move.description}
                                        </span>
                                    </div>

                                    {/* Resource Status Badge */}
                                    {resourceInfo && ResourceIcon && (
                                        <div className={clsx(
                                            "ml-3 flex items-center gap-2 px-3 py-2 rounded-lg flex-shrink-0",
                                            resourceInfo.bgColor
                                        )}>
                                            <ResourceIcon size={16} className={resourceInfo.color} />
                                            <div className="text-right">
                                                <div className={clsx("text-sm font-bold", resourceInfo.color)}>
                                                    {resourceInfo.max !== null
                                                        ? `${resourceInfo.current}/${resourceInfo.max}`
                                                        : resourceInfo.current
                                                    }
                                                </div>
                                                <div className="text-[10px] text-gray-400 uppercase">
                                                    {resourceInfo.label}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!resourceInfo && (
                                        <div className="ml-3 flex-shrink-0">
                                            {move.rollRequired ? (
                                                <div className="w-10 h-10 rounded-lg bg-dagger-gold/20 flex items-center justify-center">
                                                    <Dices size={20} className="text-dagger-gold" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                                    <ChevronRight size={20} className="text-gray-500" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Target Selection Modal - Self vs Ally */}
            {showTargetModal && pendingMove && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-dagger-panel border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-white mb-2">{pendingMove.name}</h3>
                        <p className="text-sm text-gray-400 mb-6">
                            Choose who to {targetMoveType === 'tend_wounds' ? 'heal' : 'repair armor for'}:
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleTargetSelect('self')}
                                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-dagger-gold/30 transition-all text-left"
                            >
                                <div className="w-12 h-12 rounded-xl bg-dagger-gold/20 flex items-center justify-center flex-shrink-0">
                                    <User size={24} className="text-dagger-gold" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-white">Yourself</div>
                                    <div className="text-sm text-gray-400">
                                        {targetMoveType === 'tend_wounds'
                                            ? `${markedHp} HP marked (${currentHp}/${maxHp})`
                                            : `${markedArmorSlots} slots marked (${currentArmorSlots}/${maxArmorSlots})`
                                        }
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleTargetSelect('ally')}
                                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 transition-all text-left"
                            >
                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <Users size={24} className="text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-white">An Ally</div>
                                    <div className="text-sm text-gray-400">
                                        Roll and apply the result to an ally
                                    </div>
                                </div>
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setShowTargetModal(false);
                                setPendingMove(null);
                            }}
                            className="w-full mt-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Prepare Modal - Solo vs With Party */}
            {showPrepareModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-dagger-panel border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-white mb-2">Prepare</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Describe how you prepare for the path ahead.
                        </p>
                        <div className="text-sm text-dagger-gold mb-6 flex items-center gap-2">
                            <Heart size={16} />
                            Current Hope: {currentHope}
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => handlePrepareChoice(false)}
                                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-dagger-gold/30 transition-all text-left"
                            >
                                <div className="w-12 h-12 rounded-xl bg-dagger-gold/20 flex items-center justify-center flex-shrink-0">
                                    <User size={24} className="text-dagger-gold" />
                                </div>
                                <div>
                                    <div className="font-medium text-white">Prepare Alone</div>
                                    <div className="text-sm text-gray-400">Gain 1 Hope → {currentHope + 1}</div>
                                </div>
                            </button>

                            <button
                                onClick={() => handlePrepareChoice(true)}
                                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 transition-all text-left"
                            >
                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <Users size={24} className="text-blue-400" />
                                </div>
                                <div>
                                    <div className="font-medium text-white">Prepare with Party</div>
                                    <div className="text-sm text-gray-400">Each party member gains 2 Hope → {currentHope + 2}</div>
                                </div>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowPrepareModal(false)}
                            className="w-full mt-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

// ============================================================================
// PROJECTS PANEL
// ============================================================================

interface ProjectsPanelProps {
    projects: Project[];
    loading: boolean;
    isManageMode: boolean;
    onToggleManage: () => void;
    onCreateClick: () => void;
    onEditClick: (project: Project) => void;
    onSetProgress: (id: string, progress: number) => void;
    onDelete: (id: string) => void;
}

function ProjectsPanel({
    projects,
    loading,
    isManageMode,
    onToggleManage,
    onCreateClick,
    onEditClick,
    onSetProgress,
    onDelete
}: ProjectsPanelProps) {
    const activeProjects = projects.filter(p => !p.completed);
    const completedProjects = projects.filter(p => p.completed);

    return (
        <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Projects</h2>
                <div className="flex gap-2">
                    <button
                        onClick={onToggleManage}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                            isManageMode
                                ? "bg-white/20 text-white"
                                : "bg-white/5 text-gray-400 hover:text-white"
                        )}
                        title="Manage Projects"
                    >
                        <Settings size={16} />
                        {isManageMode ? 'Done' : 'Manage'}
                    </button>
                    <button
                        onClick={onCreateClick}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-dagger-gold/10 text-dagger-gold hover:bg-dagger-gold/20 transition-colors"
                    >
                        <Plus size={16} />
                        New Project
                    </button>
                </div>
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
                                    isManageMode={isManageMode}
                                    onEdit={() => onEditClick(project)}
                                    onSetProgress={onSetProgress}
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
                                        isManageMode={isManageMode}
                                        onEdit={() => onEditClick(project)}
                                        onSetProgress={onSetProgress}
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
    isManageMode: boolean;
    onEdit: () => void;
    onSetProgress: (id: string, progress: number) => void;
    onDelete: (id: string) => void;
}

function ProjectCard({ project, isManageMode, onEdit, onSetProgress, onDelete }: ProjectCardProps) {
    const handleIncrement = () => {
        onSetProgress(project.id, project.countdown_current + 1);
    };

    const handleDecrement = () => {
        onSetProgress(project.id, project.countdown_current - 1);
    };

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

                {isManageMode && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onEdit}
                            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Edit project"
                        >
                            <Pencil size={12} />
                        </button>
                        <button
                            onClick={() => onDelete(project.id)}
                            className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete project"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                )}
            </div>

            {/* Countdown Clock with +/- controls in manage mode */}
            <div className="mt-3 flex items-center gap-2">
                {isManageMode && (
                    <button
                        onClick={handleDecrement}
                        disabled={project.countdown_current <= 0}
                        className={clsx(
                            "p-1 rounded-lg transition-colors",
                            project.countdown_current <= 0
                                ? "text-gray-600 cursor-not-allowed"
                                : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                        )}
                        title="Decrease progress"
                    >
                        <Minus size={14} />
                    </button>
                )}
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
                {isManageMode && (
                    <button
                        onClick={handleIncrement}
                        disabled={project.countdown_current >= project.countdown_total}
                        className={clsx(
                            "p-1 rounded-lg transition-colors",
                            project.countdown_current >= project.countdown_total
                                ? "text-gray-600 cursor-not-allowed"
                                : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                        )}
                        title="Increase progress"
                    >
                        <Plus size={14} />
                    </button>
                )}
                <span className="text-xs text-gray-500 min-w-[2.5rem] text-right">
                    {project.countdown_current}/{project.countdown_total}
                </span>
            </div>
        </div>
    );
}
