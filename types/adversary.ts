/**
 * ADVERSARY TYPE
 * ----------------------------------------------------------------------------
 * Type definition for Daggerheart adversaries from the SRD.
 */

export interface AdversaryFeatureEnhancement {
    action_type?: string;
    timing?: string;
    frequency?: string;
    costs?: {
        stress?: number;
        hope?: number;
        fear?: number;
    };
    keywords?: string[];
    attack?: {
        trait?: string;
        range?: string;
        combat_category?: string;
        damage?: string;
        damage_type?: string;
        targets?: string;
        damage_scaling?: string;
    };
}

export interface AdversaryFeature {
    name: string;
    text: string;
    enhancement?: AdversaryFeatureEnhancement;
}

export interface Adversary {
    name: string;
    tier: string;
    type: string;
    description: string;
    motives_and_tactics: string;
    difficulty: string;
    thresholds: string;
    hp: string;
    stress: string;
    atk: string;
    attack: string;
    range: string;
    damage: string;
    experience?: string;
    feats: AdversaryFeature[];
}

export interface EnvironmentFeat {
    name: string;
    text: string;
}

export interface Environment {
    name: string;
    tier: string;
    type: string;
    description: string;
    impulses: string;
    difficulty: string;
    potential_adversaries: string;
    feats: EnvironmentFeat[];
}
