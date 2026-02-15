/**
 * ADVERSARY TYPE
 * ----------------------------------------------------------------------------
 * Type definition for Daggerheart adversaries from the SRD.
 */

export interface AdversaryFeat {
    name: string;
    text: string;
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
    feats: AdversaryFeat[];
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
