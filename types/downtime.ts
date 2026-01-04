/**
 * Downtime Type Definitions
 * ----------------------------------------------------------------------------
 * Types for the downtime and projects system including rest management,
 * downtime moves, project tracking, and campaign-specific features.
 */

// ============================================================================
// REST TYPES
// ============================================================================

export type RestType = 'short' | 'long';

export interface RestState {
    type: RestType;
    movesRemaining: number;
    movesTotal: number;
    startedAt: string; // ISO timestamp
}

// ============================================================================
// DOWNTIME MOVES
// ============================================================================

export type DowntimeMoveId =
    // Core moves (available on any rest)
    | 'tend_wounds'
    | 'clear_stress'
    | 'repair_armor'
    | 'prepare'
    // Long rest only
    | 'tend_all_wounds'
    | 'clear_all_stress'
    | 'repair_all_armor'
    | 'work_on_project'
    // Campaign-specific (Strixhaven)
    | 'study'
    | 'go_to_club'
    | 'go_to_work';

export interface DowntimeMove {
    id: DowntimeMoveId;
    name: string;
    description: string;
    restTypes: RestType[]; // Which rest types this move is available on
    requiresCampaign?: string; // e.g., 'strixhaven'
    rollRequired: boolean;
    rollDice?: string; // e.g., '1d4'
    rollModifier?: 'tier' | 'proficiency' | 'none';
    effect: {
        type: 'heal_hp' | 'clear_stress' | 'repair_armor' | 'gain_hope' |
        'heal_all_hp' | 'clear_all_stress' | 'repair_all_armor' |
        'advance_project' | 'earn_study_token' | 'custom';
        value?: number; // For fixed values
    };
}

// ============================================================================
// PROJECTS
// ============================================================================

export type ProjectType =
    | 'generic'           // Core rules crafting/research
    | 'study_token'       // Strixhaven: Academic study
    | 'signature_spell'   // Strixhaven: Custom spell development
    | 'job'               // Strixhaven: Campus employment
    | 'extracurricular';  // Strixhaven: Club activities

export interface Project {
    id: string;
    character_id: string;
    name: string;
    description?: string;
    type: ProjectType;
    countdown_total: number; // Total segments in the clock
    countdown_current: number; // Filled segments
    completed: boolean;
    data: ProjectData;
    created_at: string;
    updated_at: string;
    completed_at?: string;
}

// Type-specific data for different project types
export interface ProjectData {
    // For study_token
    lesson?: string;
    exam_semester?: string;

    // For signature_spell
    spell_name?: string;
    spell_level?: number;
    effect?: string;

    // For job
    employer?: string;
    pay?: string;

    // For extracurricular
    club?: string;

    // Generic fields
    notes?: string;
    [key: string]: unknown;
}

export interface CreateProjectInput {
    name: string;
    description?: string;
    type: ProjectType;
    countdown_total?: number;
    data?: Partial<ProjectData>;
}

// ============================================================================
// STUDY TOKENS (Strixhaven-specific)
// ============================================================================

export interface StudyToken {
    id: string;
    lesson: string; // e.g., "Astrology", "Elemental Theory"
    semester?: string;
    earnedAt: string; // ISO date
    spentOn?: string; // What it was used for
    spentAt?: string; // ISO date when spent
}

export interface CharacterStudyState {
    tokens: StudyToken[];
    totalEarned: number;
    totalSpent: number;
}

// ============================================================================
// DOWNTIME MOVES DEFINITIONS
// ============================================================================

export const DOWNTIME_MOVES: DowntimeMove[] = [
    // Short Rest Moves
    {
        id: 'tend_wounds',
        name: 'Tend to Wounds',
        description: 'Recover Hit Points by tending to your injuries.',
        restTypes: ['short', 'long'],
        rollRequired: true,
        rollDice: '1d4',
        rollModifier: 'tier',
        effect: { type: 'heal_hp' },
    },
    {
        id: 'clear_stress',
        name: 'Clear Stress',
        description: 'Relax and recover from the strain of your adventures.',
        restTypes: ['short', 'long'],
        rollRequired: true,
        rollDice: '1d4',
        rollModifier: 'tier',
        effect: { type: 'clear_stress' },
    },
    {
        id: 'repair_armor',
        name: 'Repair Armor',
        description: 'Mend and restore your damaged armor.',
        restTypes: ['short', 'long'],
        rollRequired: true,
        rollDice: '1d4',
        rollModifier: 'tier',
        effect: { type: 'repair_armor' },
    },
    {
        id: 'prepare',
        name: 'Prepare',
        description: 'Get ready for the challenges ahead and gain Hope.',
        restTypes: ['short', 'long'],
        rollRequired: false,
        effect: { type: 'gain_hope', value: 1 },
    },

    // Long Rest Only Moves
    {
        id: 'tend_all_wounds',
        name: 'Tend to All Wounds',
        description: 'Fully recover all Hit Points through extended rest.',
        restTypes: ['long'],
        rollRequired: false,
        effect: { type: 'heal_all_hp' },
    },
    {
        id: 'clear_all_stress',
        name: 'Clear All Stress',
        description: 'Completely clear all Stress through extended rest.',
        restTypes: ['long'],
        rollRequired: false,
        effect: { type: 'clear_all_stress' },
    },
    {
        id: 'repair_all_armor',
        name: 'Repair All Armor',
        description: 'Fully restore all Armor Slots through extended rest.',
        restTypes: ['long'],
        rollRequired: false,
        effect: { type: 'repair_all_armor' },
    },
    {
        id: 'work_on_project',
        name: 'Work on a Project',
        description: 'Make progress on a long-term project.',
        restTypes: ['long'],
        rollRequired: false,
        effect: { type: 'advance_project', value: 1 },
    },

    // Strixhaven Campaign Moves
    {
        id: 'study',
        name: 'Study',
        description: 'Study for your classes and earn a Study Token.',
        restTypes: ['long'],
        requiresCampaign: 'strixhaven',
        rollRequired: false,
        effect: { type: 'earn_study_token' },
    },
    {
        id: 'go_to_club',
        name: 'Go to Club',
        description: 'Attend your extracurricular activities.',
        restTypes: ['long'],
        requiresCampaign: 'strixhaven',
        rollRequired: false,
        effect: { type: 'custom' },
    },
    {
        id: 'go_to_work',
        name: 'Go to Work',
        description: 'Work your campus job and earn gold.',
        restTypes: ['long'],
        requiresCampaign: 'strixhaven',
        rollRequired: false,
        effect: { type: 'custom' },
    },
];

/**
 * Get available moves for a given rest type and campaign access
 */
export function getAvailableMoves(
    restType: RestType,
    enabledCampaigns: string[] = []
): DowntimeMove[] {
    return DOWNTIME_MOVES.filter(move => {
        // Check if move is available for this rest type
        if (!move.restTypes.includes(restType)) return false;

        // Check campaign requirement
        if (move.requiresCampaign && !enabledCampaigns.includes(move.requiresCampaign)) {
            return false;
        }

        return true;
    });
}

/**
 * Get the number of moves available for a rest type
 */
export function getMovesForRestType(restType: RestType): number {
    return restType === 'short' ? 2 : 4;
}
