/**
 * Journal Type Definitions
 * ----------------------------------------------------------------------------
 * Types for the journal system including relationship tracking and
 * reputation management.
 */

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

export type RelationshipTier =
    | 'enemy'       // <= -4 points
    | 'rival'       // -3 to -2 points
    | 'acquaintance' // -1 to +1 points
    | 'friend'      // +2 to +3 points
    | 'beloved';    // >= +4 points

export interface Relationship {
    id: string;
    character_id: string;
    npc_name: string;
    npc_description?: string;
    npc_image_url?: string;
    points: number;
    bond_boon?: string;
    bond_bane?: string;
    notes?: string;
    campaign?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateRelationshipInput {
    npc_name: string;
    npc_description?: string;
    npc_image_url?: string;
    points?: number;
    bond_boon?: string;
    bond_bane?: string;
    notes?: string;
    campaign?: string;
}

/**
 * Calculate the relationship tier based on points
 */
export function getRelationshipTier(points: number): RelationshipTier {
    if (points <= -4) return 'enemy';
    if (points >= -3 && points <= -2) return 'rival';
    if (points >= -1 && points <= 1) return 'acquaintance';
    if (points >= 2 && points <= 3) return 'friend';
    return 'beloved'; // >= 4
}

/**
 * Get display info for a relationship tier
 */
export function getRelationshipTierInfo(tier: RelationshipTier): {
    label: string;
    color: string;
    emoji: string;
    description: string;
} {
    switch (tier) {
        case 'enemy':
            return {
                label: 'Enemy',
                color: 'text-red-500',
                emoji: '😠',
                description: 'Actively hostile',
            };
        case 'rival':
            return {
                label: 'Rival',
                color: 'text-orange-400',
                emoji: '😒',
                description: 'Bond Bane effect active',
            };
        case 'acquaintance':
            return {
                label: 'Acquaintance',
                color: 'text-gray-400',
                emoji: '😐',
                description: 'No special effect',
            };
        case 'friend':
            return {
                label: 'Friend',
                color: 'text-green-400',
                emoji: '😊',
                description: 'Bond Boon effect active',
            };
        case 'beloved':
            return {
                label: 'Beloved',
                color: 'text-pink-400',
                emoji: '❤️',
                description: 'Enhanced bond + vulnerability',
            };
    }
}

// ============================================================================
// REPUTATION TYPES
// ============================================================================

export type ReputationTier =
    | 'pariah'      // <= -4 points
    | 'troubled'    // -3 to -1 points
    | 'average'     // 0 to +2 points
    | 'respected'   // +3 to +5 points
    | 'legend';     // >= +6 points

export interface ReputationEvent {
    id: string;
    description: string;
    change: number;
    timestamp: string;
}

export interface ReputationState {
    points: number;
    history: ReputationEvent[];
}

/**
 * Calculate the reputation tier based on points
 */
export function getReputationTier(points: number): ReputationTier {
    if (points <= -4) return 'pariah';
    if (points >= -3 && points <= -1) return 'troubled';
    if (points >= 0 && points <= 2) return 'average';
    if (points >= 3 && points <= 5) return 'respected';
    return 'legend'; // >= 6
}

/**
 * Get display info for a reputation tier
 */
export function getReputationTierInfo(tier: ReputationTier): {
    label: string;
    color: string;
    effect: string;
} {
    switch (tier) {
        case 'pariah':
            return {
                label: 'Pariah',
                color: 'text-red-500',
                effect: '+2 Difficulty on social rolls',
            };
        case 'troubled':
            return {
                label: 'Troubled',
                color: 'text-orange-400',
                effect: '+1 Difficulty with authority figures',
            };
        case 'average':
            return {
                label: 'Average',
                color: 'text-gray-400',
                effect: 'No special effect',
            };
        case 'respected':
            return {
                label: 'Respected',
                color: 'text-green-400',
                effect: '1/session advantage on a social roll',
            };
        case 'legend':
            return {
                label: 'Legend',
                color: 'text-dagger-gold',
                effect: 'NPCs start with +1 relationship',
            };
    }
}
