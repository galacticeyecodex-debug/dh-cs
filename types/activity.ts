/**
 * Campaign Activity Types
 * ----------------------------------------------------------------------------
 * Types for the campaign activity feed system. Activities track all significant
 * game events like dice rolls, vital changes, card usage, and GM actions.
 */

// Activity Types
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
    // Phase 9: Countdown & Project activity types
    | 'countdown_created'
    | 'countdown_advanced'
    | 'countdown_triggered'
    | 'countdown_deleted'
    | 'countdown_reset'
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
    | 'npc_shared';

// Base activity interface
export interface CampaignActivity {
    id: string;
    campaign_id: string;
    user_id: string;
    character_id?: string;
    character_name?: string;
    activity_type: ActivityType;
    data: ActivityData;
    is_private: boolean;
    created_at: string;
}

// Union type for all activity data
export type ActivityData =
    | DiceRollActivityData
    | VitalChangeActivityData
    | CardUsedActivityData
    | ItemUsedActivityData
    | FearChangeActivityData
    | GmVitalAdjustActivityData
    | GmAnnouncementActivityData
    | GmRollActivityData
    | PlayerJoinedActivityData
    | PlayerLeftActivityData
    | CharacterSwitchedActivityData
    | CountdownActivityData
    | ProjectActivityData
    | EncounterActivityData
    | AdversaryActivityData
    | NPCSharedActivityData;

// Specific activity payloads
export interface DiceRollActivityData {
    roll_type: 'attack' | 'damage' | 'trait' | 'spellcast' | 'custom' | 'gm_roll';
    trait?: string;
    dice: number[]; // Individual die results
    modifier: number;
    modifier_breakdown?: string[];
    total: number;
    target?: number;
    success?: boolean;
    description?: string;
    hope_fear?: 'hope' | 'fear';
    is_gm_roll?: boolean;
}

export interface VitalChangeActivityData {
    vital: 'hp' | 'stress' | 'armor' | 'hope';
    change: number; // Positive = gained/healed, Negative = lost/marked
    previous_value: number;
    new_value: number;
    max_value: number;
    cause?: string;
}

export interface CardUsedActivityData {
    card_id: string;
    card_name: string;
    card_type: 'ability' | 'spell' | 'domain';
    domain?: string;
    cost_paid?: { hope?: number; stress?: number; hit_points?: number };
    gains?: { hope?: number; stress?: number; hp?: number; armor?: number };
    hope_gained?: number; // Legacy, kept for compatibility
}

export interface ItemUsedActivityData {
    item_id: string;
    item_name: string;
    item_type: string;
    effect?: string;
}

export interface FearChangeActivityData {
    change: number; // Positive = gained, Negative = spent
    previous_value: number;
    new_value: number;
    max_value: number;
    message?: string;
    trigger?: 'manual' | 'fear_roll';
}

export interface GmVitalAdjustActivityData {
    target_character_id: string;
    target_character_name: string;
    vital: 'hp' | 'stress' | 'armor' | 'hope';
    change: number;
    previous_value: number;
    new_value: number;
    reason?: string;
}

export interface GmAnnouncementActivityData {
    message: string;
    importance?: 'normal' | 'important' | 'critical';
}

export interface GmRollActivityData extends DiceRollActivityData {
    revealed: boolean; // If false, players only see "GM rolled dice"
}

export interface PlayerJoinedActivityData {
    player_name: string;
    character_name?: string;
}

export interface PlayerLeftActivityData {
    player_name: string;
}

export interface CharacterSwitchedActivityData {
    previous_character_name?: string;
    new_character_name: string;
}

// Phase 9: Countdown activity data
export interface CountdownActivityData {
    countdown_name: string;
    countdown_type?: string;
    previous_value?: number;
    new_value?: number;
    starting_value?: number;
    amount_advanced?: number;
}

// Phase 9: Project activity data
export interface ProjectActivityData {
    project_name: string;
    character_name?: string;
    previous_value?: number;
    new_value?: number;
    starting_value?: number;
}

// Phase 10: Encounter activity data
export interface EncounterActivityData {
    encounter_name: string;
    encounter_id?: string;
    adversary_count?: number;
}

// Phase 10: Adversary activity data
export interface AdversaryActivityData {
    adversary_name: string;
    adversary_label?: string;
    encounter_name?: string;
    damage?: number;
    hp_remaining?: number;
    hp_max?: number;
}

// Phase 10: NPC shared activity data
export interface NPCSharedActivityData {
    npc_name: string;
    recipient_count: number;
}

// Insert type (without id and created_at)
export interface CampaignActivityInsert {
    campaign_id: string;
    user_id: string;
    character_id?: string;
    character_name?: string;
    activity_type: ActivityType;
    data: ActivityData;
    is_private?: boolean;
}
