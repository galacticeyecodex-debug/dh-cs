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
    fear_max: number;
    settings: Record<string, unknown>;
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
    | 'character_switched';

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
