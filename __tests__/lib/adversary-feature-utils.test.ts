/**
 * Tests for adversary feature classification utilities.
 * Validates parsing of feature types, Fear costs, Stress costs, and sort order.
 */

import { describe, expect, it } from 'vitest';
import {
    parseFeatureType,
    parseFearCost,
    parseStressCost,
    classifyFeature,
    classifyAndSortFeatures,
} from '@/lib/card-parser';
import type { AdversaryFeature } from '@/types/adversary';

describe('parseFeatureType', () => {
    it('parses "- Action" suffix', () => {
        const feature: AdversaryFeature = { name: 'Earth Eruption - Action', text: 'Spend Fear...' };
        expect(parseFeatureType(feature)).toBe('action');
    });

    it('parses "- Reaction" suffix', () => {
        const feature: AdversaryFeature = { name: 'Retaliatory Strike - Reaction', text: 'When hit...' };
        expect(parseFeatureType(feature)).toBe('reaction');
    });

    it('parses "- Passive" suffix', () => {
        const feature: AdversaryFeature = { name: 'Thick Hide - Passive', text: 'Reduces damage...' };
        expect(parseFeatureType(feature)).toBe('passive');
    });

    it('parses "(Reaction)" parenthetical', () => {
        const feature: AdversaryFeature = { name: 'Counter (Reaction)', text: 'When attacked...' };
        expect(parseFeatureType(feature)).toBe('reaction');
    });

    it('parses "(Passive)" parenthetical', () => {
        const feature: AdversaryFeature = { name: 'Aura (Passive)', text: 'Always active...' };
        expect(parseFeatureType(feature)).toBe('passive');
    });

    it('defaults to action for unknown suffix', () => {
        const feature: AdversaryFeature = { name: 'Fire Breath', text: 'Deals 3d10 damage.' };
        expect(parseFeatureType(feature)).toBe('action');
    });

    it('detects passive from text starting with "Passive"', () => {
        const feature: AdversaryFeature = { name: 'Armor Plates', text: 'Passive. This creature always has +2 armor.' };
        expect(parseFeatureType(feature)).toBe('passive');
    });

    it('detects passive from "this creature always" in text', () => {
        const feature: AdversaryFeature = { name: 'Regeneration', text: 'This creature always heals 2 HP at the start of its turn.' };
        expect(parseFeatureType(feature)).toBe('passive');
    });
});

describe('parseFearCost', () => {
    it('parses "Spend Fear" as cost 1', () => {
        expect(parseFearCost('Spend Fear to summon a minion.')).toBe(1);
    });

    it('parses "Spend 2 Fear" as cost 2', () => {
        expect(parseFearCost('Spend 2 Fear to activate.')).toBe(2);
    });

    it('parses "Spend 3 Fear" as cost 3', () => {
        expect(parseFearCost('Spend 3 Fear to unleash devastation.')).toBe(3);
    });

    it('returns 0 when no Fear cost', () => {
        expect(parseFearCost('Mark a Stress to deal extra damage.')).toBe(0);
    });

    it('is case-insensitive', () => {
        expect(parseFearCost('spend fear to do something')).toBe(1);
        expect(parseFearCost('SPEND 2 FEAR')).toBe(2);
    });

    it('parses "Spend a Fear" (with article) as cost 1', () => {
        expect(parseFearCost('Spend a Fear to choose a target and spotlight all Giant Rats.')).toBe(1);
    });
});

describe('parseStressCost', () => {
    it('parses "Mark a Stress" as cost 1', () => {
        expect(parseStressCost('Mark a Stress to deal 2d6 extra damage.')).toBe(1);
    });

    it('parses "Mark 2 Stress" as cost 2', () => {
        expect(parseStressCost('Mark 2 Stress to recharge this ability.')).toBe(2);
    });

    it('parses "marks a Stress" (third person) as cost 1', () => {
        expect(parseStressCost('This creature marks a Stress and attacks twice.')).toBe(1);
    });

    it('returns 0 when no Stress cost', () => {
        expect(parseStressCost('Spend Fear to summon.')).toBe(0);
    });

    it('is case-insensitive', () => {
        expect(parseStressCost('MARK A STRESS to attack')).toBe(1);
    });
});

describe('classifyFeature', () => {
    it('classifies a fear-cost action', () => {
        const feature: AdversaryFeature = {
            name: 'Bone Storm - Action',
            text: 'Spend 2 Fear. All creatures in close range take 3d8 damage.',
        };
        const result = classifyFeature(feature);
        expect(result.type).toBe('action');
        expect(result.fearCost).toBe(2);
        expect(result.stressCost).toBe(0);
    });

    it('classifies a stress-cost reaction', () => {
        const feature: AdversaryFeature = {
            name: 'Absorb - Reaction',
            text: 'Mark a Stress to negate one attack.',
        };
        const result = classifyFeature(feature);
        expect(result.type).toBe('reaction');
        expect(result.fearCost).toBe(0);
        expect(result.stressCost).toBe(1);
    });

    it('classifies a free passive', () => {
        const feature: AdversaryFeature = {
            name: 'Thick Scales - Passive',
            text: 'Reduces all incoming damage by 2.',
        };
        const result = classifyFeature(feature);
        expect(result.type).toBe('passive');
        expect(result.fearCost).toBe(0);
        expect(result.stressCost).toBe(0);
    });
});

describe('classifyAndSortFeatures', () => {
    it('sorts fear features first, then stress, then free actions, then passives', () => {
        const features: AdversaryFeature[] = [
            { name: 'Basic Attack', text: 'Deals 1d8 damage.' },
            { name: 'Shield Wall - Passive', text: 'Always has +1 armor.' },
            { name: 'Power Strike', text: 'Mark a Stress to deal 2d10 damage.' },
            { name: 'Devastating Blow', text: 'Spend Fear to deal 4d10 damage.' },
            { name: 'Counter - Reaction', text: 'When attacked, respond with 1d6 damage.' },
        ];

        const sorted = classifyAndSortFeatures(features);
        expect(sorted[0].feat.name).toBe('Devastating Blow'); // fear cost
        expect(sorted[1].feat.name).toBe('Power Strike'); // stress cost
        expect(sorted[2].feat.name).toBe('Basic Attack'); // free action
        expect(sorted[3].feat.name).toBe('Counter - Reaction'); // reaction
        expect(sorted[4].feat.name).toBe('Shield Wall - Passive'); // passive
    });

    it('handles empty feats array', () => {
        expect(classifyAndSortFeatures([])).toEqual([]);
    });

    it('preserves feature reference in classified output', () => {
        const feature: AdversaryFeature = { name: 'Test', text: 'Spend Fear to test.' };
        const [classified] = classifyAndSortFeatures([feature]);
        expect(classified.feat).toBe(feature);
    });
});
