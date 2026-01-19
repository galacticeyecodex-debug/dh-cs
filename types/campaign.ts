/**
 * Campaign and multiplayer types for Daggerheart Character Sheet
 * Phase 1: Campaign Foundation
 */

export type CampaignRole = 'player' | 'gm';

// =============================================================================
// CAMPAIGNS
// =============================================================================

export interface Campaign {
    id: string;
    name: string;
    description?: string;
    gm_user_id: string;
    invite_code: string;
    fear_current: number;
    fear_max: number; // SRD: Always 12, but kept for backwards compatibility
    settings: Record<string, unknown>;
    // Phase 9: Countdowns and Projects
    countdowns?: Countdown[];
    projects?: Project[];
    created_at: string;
    updated_at: string;
}

export interface CampaignInsert {
    name: string;
    description?: string;
    gm_user_id: string;
    invite_code?: string;
    fear_current?: number;
    fear_max?: number;
    settings?: Record<string, unknown>;
}

export interface CampaignUpdate {
    name?: string;
    description?: string;
    fear_current?: number;
    fear_max?: number;
    settings?: Record<string, unknown>;
}

// =============================================================================
// CAMPAIGN MEMBERS
// =============================================================================

export interface CampaignMember {
    id: string;
    campaign_id: string;
    user_id: string;
    character_id?: string;
    role: CampaignRole;
    nickname?: string;
    joined_at: string;
}

export interface CampaignMemberInsert {
    campaign_id: string;
    user_id: string;
    character_id?: string;
    role?: CampaignRole;
    nickname?: string;
}

export interface CampaignMemberUpdate {
    character_id?: string;
    nickname?: string;
    role?: CampaignRole;
}

// =============================================================================
// ENRICHED TYPES (with joined data)
// =============================================================================

export interface EnrichedCampaignMember extends CampaignMember {
    profile?: {
        username: string;
        avatar_url?: string;
    };
    character?: {
        name: string;
        level: number;
        class_name?: string;
        ancestry_name?: string;
    };
}

export interface CampaignWithMembers extends Campaign {
    members: EnrichedCampaignMember[];
    member_count: number;
}

// =============================================================================
// ACTIVITY TYPES (Phase 3 - Placeholder for now)
// =============================================================================

export type ActivityType =
    | 'dice_roll'
    | 'vital_change'
    | 'card_used'
    | 'item_used'
    | 'fear_change'
    | 'gm_vital_adjust'
    | 'gm_announcement'
    | 'gm_roll'
    | 'player_joined'
    | 'player_left'
    | 'character_switched'
    // Phase 9: Countdowns and Projects
    | 'countdown_created'
    | 'countdown_advanced'
    | 'countdown_triggered'
    | 'countdown_deleted'
    | 'project_created'
    | 'project_advanced'
    | 'project_completed';

// Activity will be fully implemented in Phase 3
export interface CampaignActivity {
    id: string;
    campaign_id: string;
    user_id: string;
    character_id?: string;
    character_name?: string;
    activity_type: ActivityType;
    data: Record<string, unknown>; // Will be more specific in Phase 3
    is_private: boolean;
    created_at: string;
}

// =============================================================================
// COUNTDOWNS (Phase 9 - GM Screen Enhancements)
// =============================================================================

/**
 * Countdown types per SRD:
 * - standard: Advances by 1 every action roll
 * - progress: Dynamic countdown to positive effect (advances 0-3 based on roll)
 * - consequence: Dynamic countdown to negative effect (advances 0-3 based on roll)
 * - loop: Resets to starting value after triggering
 * - long_term: Advances on rests, not rolls
 */
export type CountdownType = 'standard' | 'progress' | 'consequence' | 'loop' | 'long_term';

export interface Countdown {
    id: string;
    name: string;
    description?: string;
    type: CountdownType;
    starting_value: number;
    current_value: number;
    is_public: boolean;
    is_looping: boolean;
    created_at: string;
}

export interface CountdownInsert {
    name: string;
    description?: string;
    type: CountdownType;
    starting_value: number;
    current_value?: number;
    is_public?: boolean;
    is_looping?: boolean;
}

/**
 * Dynamic Countdown Advancement Table (per SRD):
 * | Roll Result         | Progress | Consequence |
 * |---------------------|----------|-------------|
 * | Failure with Fear   | 0        | 3           |
 * | Failure with Hope   | 0        | 2           |
 * | Success with Fear   | 1        | 1           |
 * | Success with Hope   | 2        | 0           |
 * | Critical Success    | 3        | 0           |
 */
export type RollOutcome =
    | 'failure_fear'
    | 'failure_hope'
    | 'success_fear'
    | 'success_hope'
    | 'critical';

export const COUNTDOWN_ADVANCEMENT: Record<RollOutcome, { progress: number; consequence: number }> = {
    failure_fear: { progress: 0, consequence: 3 },
    failure_hope: { progress: 0, consequence: 2 },
    success_fear: { progress: 1, consequence: 1 },
    success_hope: { progress: 2, consequence: 0 },
    critical: { progress: 3, consequence: 0 },
};

// =============================================================================
// PROJECTS (Phase 9 - Downtime "Work on a Project")
// =============================================================================

/**
 * Projects are player-owned countdowns from the Downtime mechanic.
 * Per SRD: "With GM approval, a PC may pursue a long-term project..."
 */
export type ProjectStatus = 'pending' | 'active' | 'completed' | 'abandoned';
export type ProjectAdvancementType = 'auto' | 'roll';

export interface Project {
    id: string;
    character_id: string;
    character_name: string;
    name: string;
    description?: string;
    starting_value: number;
    current_value: number;
    advancement_type: ProjectAdvancementType;
    status: ProjectStatus;
    created_at: string;
    completed_at?: string;
}

export interface ProjectInsert {
    character_id: string;
    character_name: string;
    name: string;
    description?: string;
    starting_value: number;
    current_value?: number;
    advancement_type?: ProjectAdvancementType;
    status?: ProjectStatus;
}

// =============================================================================
// CAMPAIGN WITH COUNTDOWNS AND PROJECTS
// =============================================================================

export interface CampaignWithExtras extends Campaign {
    countdowns: Countdown[];
    projects: Project[];
}
