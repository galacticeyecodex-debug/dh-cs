/**
 * Campaign and multiplayer types for Daggerheart Character Sheet
 * Phase 1: Campaign Foundation
 */

import type { AdversaryFeature } from '@/types/adversary';

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
    | 'project_completed'
    | 'project_abandoned'
    // Phase 10: Encounter & NPC activity types
    | 'encounter_started'
    | 'encounter_ended'
    | 'adversary_pinned'
    | 'adversary_defeated'
    | 'adversary_damaged'
    | 'npc_shared'
    // GM Action Center activity types
    | 'adversary_spotlighted'
    | 'adversary_feature_used'
    | 'gm_fear_move';

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
// ENCOUNTERS (Phase 10 - GM Encounter Management)
// =============================================================================

/**
 * A pinned adversary instance in an active encounter.
 * Each pinned adversary gets its own HP/stress tracking independent of the SRD template.
 */
export interface PinnedAdversary {
    id: string;
    /** The SRD adversary name (used to look up template data) */
    adversary_name: string;
    /** Display label for this instance (e.g., "Goblin #2") */
    label: string;
    /** Current HP remaining (parsed from SRD hp string on pin) */
    hp_current: number;
    /** Max HP (parsed from SRD hp string on pin) */
    hp_max: number;
    /** Current stress remaining */
    stress_current: number;
    /** Max stress */
    stress_max: number;
    /** Whether this adversary has been defeated (HP <= 0) */
    is_defeated: boolean;
    /** Tier from SRD */
    tier: string;
    /** Type from SRD */
    type: string;
    /** Difficulty from SRD */
    difficulty: string;
    /** Thresholds from SRD */
    thresholds: string;
    /** Attack info from SRD */
    attack: string;
    /** Attack modifier from SRD */
    atk: string;
    /** Range from SRD */
    range: string;
    /** Damage from SRD */
    damage: string;
    /** Motives and tactics from SRD */
    motives_and_tactics: string;
    /** Optional notes the GM added */
    notes?: string;
    /** Order for display sorting */
    sort_order: number;
    /** When this adversary was pinned */
    pinned_at: string;
    /** Adversary feats/abilities from SRD (optional for backward compat) */
    feats?: AdversaryFeature[];
    /** Whether this adversary is spotlighted this GM turn */
    is_spotlighted?: boolean;
}

export type EncounterStatus = 'preparing' | 'active' | 'completed';

/**
 * An encounter managed on the GM screen.
 * Encounters are stored in campaign.settings.encounters as JSON.
 */
export interface Encounter {
    id: string;
    name: string;
    description?: string;
    status: EncounterStatus;
    adversaries: PinnedAdversary[];
    /** Whether players can see this encounter on their campaign page */
    is_visible_to_players: boolean;
    created_at: string;
    updated_at: string;
}

// =============================================================================
// SESSION NOTES (Phase 10 - GM Session Notes)
// =============================================================================

export interface SessionNote {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
}

// =============================================================================
// CAMPAIGN NPC DIRECTORY (Phase 10 - Shared NPCs)
// =============================================================================

/**
 * A campaign-wide NPC that the GM can push to all players' journals.
 */
export interface CampaignNPC {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    bond_boon?: string;
    bond_bane?: string;
    starting_points: number;
    /** Which player character IDs have received this NPC */
    pushed_to: string[];
    created_at: string;
}

// =============================================================================
// CAMPAIGN WITH COUNTDOWNS AND PROJECTS
// =============================================================================

export interface CampaignWithExtras extends Campaign {
    countdowns: Countdown[];
    projects: Project[];
}
